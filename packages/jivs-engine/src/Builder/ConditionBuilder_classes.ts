/**
 * As a refresher: A "builder" is a class that provides a user-friendly way 
 * to construct a configuration object. Child Condition Builders are used
 * to construct ConditionConfig objects, which are used to configure Condition objects.
 * Most of the work is offloaded to functions supplied by each condition.
 * 
 * There are two ways that conditions are used within Jivs:
 * 1. As a single companion to a Validator object, configured in ValidatorConfig.conditionConfig.
 *    This is handled by FluentValidatorBuilder and the FluentValidatorBuilderExtensions,
 *    where each condition is wired into validator builder.
 * 2. As a stand-alone Condition object, with these use cases:
 *   a. ValueHost's enabler, which is a condition to determine whether the ValueHost is enabled or disabled.
 *      ```ts
 *      config: FieldValueHostConfig {
 *          name: 'Field1',
 *          dataType: LookupKey.String,
 *          enablerConfig: // here
 *          { 
 *              conditionType: ConditionType.EqualTo,
 *              secondValueHostName: 'Field2'
 *          }
 *      }
 *      ```
 *   b. An array of Condition config objects to satisify the AllCondition, AnyCondition, and CountMatchesCondition.
 *      ```ts
 *      config: AllConditionConfig {
 *         conditionType: ConditionType.All,
 *         conditionConfigs: [
 *          { ... child Config 1 ...}
 *       ]
 *      ```
 *   c. A condition config object to satisfy the NotCondition.
 *      ```ts
 *      config: NotConditionConfig {
 *          conditionType: ConditionType.Not,
 *          childConditionConfig: { ... child Config 1 ...}
 *      }
 *      ```
 *   d. Two condition configs to satisfy the whenToEnableConfig and thenConfig properties
 *      of WhenCondition.
 *      ```ts
 *      config: WhenConditionConfig {
 *          conditionType: ConditionType.When,
 *          whenToEnableConfig: { ... child Config 1 ...},
 *          thenConfig: { ... child Config 2 ...}
 *      }
 *      ```
 * 
 * The cases for b, c, and d are used within the Fluent validator syntax.
 * ```ts
 * const valBuilder = new FluentValidatorBuilder();
 * valBuilder.field("Field1")
 *       .requireText()
 *       .any((childBuilder)=>[  // here's the child builder
 *           childBuilder.equalTo("Value1"),
 *           childBuilder.equalTo("Value2")
 *       ]
 *       ) ... more validator conditions are allowed here ...
 * ```
 * They are also used a child to b, c, and d.
 * ```ts
 * const condBuilder = new ConditionBuilder();
 * condBuilder.all((childBuilder)=>[  // here's the child builder
 *      childBuilder.parentValue().equalTo("Value1"),
 *      childBuilder.parentValue().equalTo("Value2")
 *  ]
 *  ); ... NO child conditions are allowed here - just one child to condBuilder ...
 * ```
 * As you can see, the syntax between validator's usage and child conditions usage
 * differs in these ways:
 * 1. Any condition that has a valueHostName property needs to know its value, whether its a 
 *    a value host name string, or null/undefined which means the parent value host is used.
 *    These conditions require the source is expressed before the condition.
 *      ```ts
 *     condBuilder.parentValue().equalTo("Value1") // parentValue() is the source for equalTo
 *     \\ or
 *     condBuilder.fieldValue("Field1").equalTo("Value1") // fieldValue() is the source for equalTo
 * 2. The remaining conditions - AllCondition, AnyCondition, CountMatchesCondition, NotCondition, and WhenCondition -
 *    don't require parentValue() or fieldValue().
 *      ```ts
 *      condBuilder.all((childBuilder)=>[ ... ]);   // omits the parentValue() or fieldValue() source
 *      ```
 * 3. The condition builder does not permit fluent chained syntax after a single condition is expressed.
 *      This is invalid:
 *      ```ts
 *      condBuilder.parentValue().equalTo("Value1").notEqualTo("Value2"); // invalid - notEqualTo is not allowed here
 *      ```
 * 
 * # Types defined here
 * - IConditionBuilder: The interface for the condition builder. Expresses these key methods:
 *      + getConfig(): ConditionConfig - returns the condition config object that was built.
 *      + attachChildConfig(): void - Used by the child builder to supply its condition config to the parent builder.
 * - ConditionBuilderBase: The base implementation of IConditionBuilder interface. 
 *   Its attachChildConfig and getConfig methods are abstract. It's constructor takes a parent builder that implements
 *   IConditionBuilder which is used by attachChildConfig and getConfig.
 * - ConditionBuilder: The concrete implementation of IConditionBuilder interface. 
 *   It is used by almost every condition, where WhenCondition and NotCondition are the exceptions. 
 *   It implements the attachChildConfig and getConfig methods, treating the value of attachChildConfig
 *   as the whole condition config object for the parent builder.
 * - NotConditionChildBuilder: Supports the childConditionConfig property on NotCondition, 
 *   by setting up attachChildConfig to assign the supplied condition to 
 *   NotConditionConfig.childConditionConfig property.
 * - WhenToEnableBuilder: Supports the whenToEnableConfig property on WhenCondition, 
 *   by setting up attachChildConfig to assign the supplied condition to 
 * WhenConditionConfig.whenToEnableConfig property.
 * - ThenBuilder: Supports the thenConfig property on WhenCondition,
 *   by setting up attachChildConfig to assign the supplied condition to 
 *   WhenConditionConfig.thenConfig property.
 * - StartConditionBuilder: The first part of the fluent syntax. Its parent could be either a FluentValidatorBuilder 
 *   or a ConditionBuilder. In either case, it calls upon the parent Builder's attachChildConfig method
 *   to supply the condition config object that is the second part of the fluent syntax. 
 * 
 *   It supplies these methods to start:
 *      + parentValue(): Identifies the source value host name as the parent by omitting 
 *          config.valueHostName property from the condition config object.
 *          Its up to the condition at runtime to resolve the parent value host name.
 *      + fieldValue(valueHostName: string): Identifies the source value host name as the supplied valueHostName
 *          by setting config.valueHostName property to the supplied valueHostName.
 *      + all, any, countMatches: Configures AllCondition, AnyCondition, and CountMatchesCondition respectively, 
 *          without requiring the unnecessary value host name.
 *      + not: Configures NotCondition, without requiring the unnecessary value host name.
 *      + when: Configures WhenCondition, without requiring the unnecessary value host name.
 *      + conditionConfig: Takes a fully formed condition config object, and passes it to the parent builder's attachChildConfig method.
 *        Allows the user to bypass the fluent syntax and supply a fully formed condition config object.
 */

import { NotConditionConfig } from "../Conditions/NotCondition";
import { OneValueConditionBaseConfig } from "../Conditions/OneValueConditionBase";
import { WhenConditionConfig } from "../Conditions/WhenCondition";
import { ConditionConfig } from "../Interfaces/Conditions";
import { IBuilderUsingConditions } from "./Fluent";

/**
 * Interface for condition builders.
 * Extends IBuilderUsingConditions to allow attaching child condition configs to parent builders.
 */
export interface IConditionBuilder extends IBuilderUsingConditions {
    /**
     * A builder that expects a condition to be attached to it is passed to the 
     * child builder that creates the child's config.
     * When the child builder is done, it calls this function to attach the child config to the parent.
     * @param childConfig 
     */
    attachChildConfig(childConfig: ConditionConfig): void;

    /**
     * Exposes the parent config that is being built. 
     * Assigned to builders.
     */
    getConfig(): ConditionConfig | undefined;   
}

/**
 * Base class for condition builders.
 * Implements the IConditionBuilder interface and provides common functionality for attaching child configs.
 */
export abstract class ConditionBuilderBase implements IConditionBuilder {
    constructor (parentBuilder: IBuilderUsingConditions) {
        this._parentBuilder = parentBuilder;
    }

    protected get parentBuilder(): IBuilderUsingConditions {
        return this._parentBuilder;
    }
    private _parentBuilder: IBuilderUsingConditions;

    public abstract attachChildConfig(childConfig: ConditionConfig): void;

    public abstract getConfig(): ConditionConfig | undefined;
}

/**
 * Concrete implementation of the IConditionBuilder interface.
 * Used by most conditions to manage child condition configs.
 * Its condition config is fully supplied by attaching a child config,
 * stored in the childConfig field, and returned by getConfig method.
 */
export class ConditionBuilder extends ConditionBuilderBase {
    constructor (parentBuilder: IBuilderUsingConditions) {
        super(parentBuilder);
    }
    protected childConfig?: ConditionConfig;

    public attachChildConfig(childConfig: ConditionConfig): void {
        this.childConfig = childConfig;
        this.parentBuilder.attachChildConfig(childConfig);
    }

    public getConfig(): ConditionConfig | undefined {
        return this.childConfig;
    }
}

/**
 * While the NotCondition itself will use the ConditionBuilder, its condition building function,
 * _genDCNot creates this to get the child condition config to assign to its
 * NotConditionConfig.childConditionConfig property. 
 * 
 * This class handles retrieing the config and assigning it to parentBuilder.getConfig().childConditionConfig
 * ```ts
 * const config: NotConditionConfig = {
 *    conditionType: ConditionType.Not,
 *    childConditionConfig: { ... child Config 1 ...}   << here
 * };
 * ```
 */
export class NotConditionChildBuilder extends ConditionBuilderBase {
    constructor (parentBuilder: IBuilderUsingConditions) {
        super(parentBuilder);
    }
    protected childConfig?: ConditionConfig;

    public attachChildConfig(childConfig: ConditionConfig): void {
        this.childConfig = childConfig;
        let notConfig = this.parentBuilder.getConfig() as NotConditionConfig | undefined;
        if (notConfig) {
            notConfig.childConditionConfig = childConfig;
        }
    }

    public getConfig(): ConditionConfig | undefined {
        return this.childConfig;
    }
}

/**
 * While the WhenCondition itself will use the ConditionBuilder, its condition building function,
 * _genDCWhen creates this to get the child condition config to assign to its
 * WhenConditionConfig.whenToEnableConfig property.
 * 
 * This class handles retrieing the config and assigning it to parentBuilder.getConfig().whenToEnableConfig
 * ```ts
 * const config: WhenConditionConfig = {
 *      conditionType: ConditionType.When,
 *      whenToEnableConfig: { ... child Config 1 ...}, << here
 *      thenConfig: { ... child Config 2 ...}
 * }
 * ```
 */
export class WhenToEnableBuilder extends ConditionBuilderBase {
    constructor(parentBuilder: IBuilderUsingConditions) {
        super(parentBuilder);
    }
    protected childConfig?: ConditionConfig;

    public attachChildConfig(childConfig: ConditionConfig): void {
        this.childConfig = childConfig;
        let whenConfig = this.parentBuilder.getConfig() as WhenConditionConfig | undefined;
        if (whenConfig) {
            whenConfig.whenToEnableConfig = childConfig;
        }
    }
    public getConfig(): ConditionConfig | undefined {
        return this.childConfig;
    }
}

/**
 * While the WhenCondition itself will use the ConditionBuilder, its condition building function,
 * _genDCWhen creates this to get the child condition config to assign to its
 * WhenConditionConfig.thenConfig property.
 * 
 * This class handles retrieing the config and assigning it to parentBuilder.getConfig().thenConfig
 * ```ts
 * const config: WhenConditionConfig = {
 *      conditionType: ConditionType.When,
 *      whenToEnableConfig: { ... child Config 1 ...},
 *      thenConfig: { ... child Config 2 ...} << here
 * }
 * ```
 */
export class ThenBuilder extends ConditionBuilderBase {
    constructor(parentBuilder: IBuilderUsingConditions) {
        super(parentBuilder);
    }
    protected childConfig?: ConditionConfig;

    public attachChildConfig(childConfig: ConditionConfig): void {
        this.childConfig = childConfig;
        let whenConfig = this.parentBuilder.getConfig() as WhenConditionConfig | undefined;
        if (whenConfig) {
            whenConfig.thenConfig = childConfig;
        }
    }
    public getConfig(): ConditionConfig | undefined {
        return this.childConfig;
    }
}

export class StartConditionBuilder extends ConditionBuilderBase {
    constructor(parentBuilder: IBuilderUsingConditions) {
        super(parentBuilder);
    }
    protected childConfig?: ConditionConfig;

    /**
     * When assigned, it is copied to the child condition config's valueHostName property, 
     * which is used by conditions that require a value host name.
     */
    protected valueHostName?: string;

    /**
     * Will assign the childConfig.valueHostName property to the valueHostName property of this builder, if it is defined.
     * Will pass up the childConfig to the parent builder's attachChildConfig method.
     * @param childConfig 
     */
    public attachChildConfig(childConfig: ConditionConfig): void {
        this.childConfig = childConfig;
        if (this.valueHostName) {
            // there is no real way to check because this object is generic.
            // So we assign the valueHostName property to all configs.
            let oneValueConfig = childConfig as OneValueConditionBaseConfig;
            oneValueConfig.valueHostName = this.valueHostName;
        }
        this.parentBuilder.attachChildConfig(childConfig);
    }
    public getConfig(): ConditionConfig | undefined {
        return this.childConfig;
    }

    public parentValue(): ConditionBuilder {
        this.valueHostName = undefined;
        return new ConditionBuilder(this);
    }

    public fieldValue(valueHostName: string): ConditionBuilder {
        this.valueHostName = valueHostName;
        return new ConditionBuilder(this);
    }

    // pending: conditionConfig, all, any, countMatches, not, when
}   

export type ConditionBuilderHandler = (conditionsBuilder: ConditionBuilder) => void;

export type NotConditionChildBuilderHandler = (notConditionBuilder: NotConditionChildBuilder) => void;

export type WhenToEnableBuilderHandler = (whenToEnableBuilder: WhenToEnableBuilder) => void;

export type ThenBuilderHandler = (thenBuilder: ThenBuilder) => void;