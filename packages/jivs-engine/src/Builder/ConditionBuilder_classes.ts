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
 * * IConditionBuilder: The interface for the condition builder. It implements IBuilderConfigHost, 
 *      which allows the builder to attach child condition configs to parent builders.
 * 
 * * ConditionBuilderBase: The base implementation of IConditionBuilder interface. 
 *   Its setConfig() and getConfig() methods are abstract. It's constructor takes a parent builder that implements
 *   IConditionBuilder which is used by setConfig.
 *   This class has the following methods built in: 
 *   conditionConfig(), all(), any(), countMatches(), not(), when().
 * 
 * * ConditionBuilder: Extends ConditionBuilderBase and is intended to be used by 
 *   all functions that create a condition config object.
 *   It has all conditions declared as its methods, each doing its own thing to create
 *   its condition object and attach it to the parent builder.
 *   This class is intended for expansion through prototypes, allowing the user to create
 *   new conditions and add them to the ConditionBuilder class. 
 *   See the ConditionBuilderExtensions.ts file for examples.
 * 
 * * StartConditionBuilder: The first part of the fluent syntax, used to identify the 
 *   source value host name for conditions that require it.
 *   Its parent could be either a FluentValidatorBuilder or a ConditionBuilder. 
 *   It inherits from ConditionBuilderBase, and has the following methods:
 * 
 *   It supplies these methods to start:
 *      + parentValue(): Identifies the source value host name as the parent by omitting 
 *          config.valueHostName property from the condition config object.
 *          Its up to the condition at runtime to resolve the parent value host name.
 *      + fieldValue(valueHostName: string): Identifies the source value host name as the supplied valueHostName
 *          by setting config.valueHostName property to the supplied valueHostName.
 *      + all, any, countMatches, when, not, conditionConfig: These methods are inherited from ConditionBuilderBase, 
 *          and are used to create the child condition config.
 */

import { ConditionType } from "../Conditions/ConditionTypes";
import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { NotConditionConfig } from "../Conditions/NotCondition";
import { OneValueConditionBaseConfig } from "../Conditions/OneValueConditionBase";
import { WhenConditionConfig } from "../Conditions/WhenCondition";
import { ConditionConfig } from "../Interfaces/Conditions";
import { assertNotNull } from "../Utilities/ErrorHandling";
import { IBuilderConfigHost } from "./Fluent";
import { CountMatchesConditionConfig } from "../Conditions/ConcreteConditions";

/**
 * Interface for condition builders.
 */
export interface IConditionBuilder extends IBuilderConfigHost {
    /**
     * Called by a condition's Builder function after assembling its config, to deposit
     * the result into this builder so the parent function can retrieve it.
     * @param config - The completed config object.
     */
    setConfig(config: ConditionConfig): void;

    /**
     * Called by the parent function after the child callback has run, to retrieve
     * the deposited config and wire it into the appropriate property of the parent's config.
     */
    getConfig(): ConditionConfig | undefined;   
}

/**
 * Base class for condition builders.
 * Provides abstract definitions for IConditionBuilder methods, and a constructor that takes a parent builder.
 * It also provides the following methods to create child condition configs:
 * conditionConfig(), all(), any(), countMatches(), not(), when().
 */
export abstract class ConditionBuilderBase implements IConditionBuilder {
    constructor (parentBuilder: IBuilderConfigHost) {
        this._parentBuilder = parentBuilder;
    }

    protected get parentBuilder(): IBuilderConfigHost {
        return this._parentBuilder;
    }
    private _parentBuilder: IBuilderConfigHost;

    public abstract setConfig(config: ConditionConfig): void;

    public abstract getConfig(): ConditionConfig | undefined;

    /**
     * Inverts the match result of the child condition config.
     * When child matches, the parent will not match, and vice versa.
     * When the child is undetermined, the parent will be undetermined.
     * @param callback 
     */
    public not(callback: ConditionBuilderHandler): void {
        assertNotNull(callback, 'callback');
        let childBuilder = new StartConditionBuilder(this);
        let childConfig = callback(childBuilder);
        assertNotNull(childConfig, 'childConfig');
        let notConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: childConfig!
        };
        this.setConfig(notConfig);
    }

    /**
     * Executes a condition only when another condition is satisfied.
     * When the "when" condition is satisfied, the "then" condition is evaluated.
     * When the "when" condition is not satisfied, the "then" condition is not evaluated,
     * @param whenToEnable -
     * @param thenCallback 
     */
    public when(whenToEnableCallback: ConditionBuilderHandler, thenCallback: ConditionBuilderHandler): void {
        assertNotNull(whenToEnableCallback, 'whenToEnableCallback');
        assertNotNull(thenCallback, 'thenCallback');
        let whenBuilder = new StartConditionBuilder(this);
        let whenConfig = whenToEnableCallback(whenBuilder);
        assertNotNull(whenConfig, 'whenToEnableConfig');
        let thenBuilder = new StartConditionBuilder(this);
        let thenConfig = thenCallback(thenBuilder);
        assertNotNull(thenConfig, 'thenConfig');
        let whenConditionConfig: WhenConditionConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: whenConfig!,
            thenConfig: thenConfig!
        };
        this.setConfig(whenConditionConfig);
    }

    /**
     * Main worker for conditions that have children: AllCondition, AnyCondition, CountMatchesCondition.
     * @param conditionType 
     * @param childrenCallback 
     * @returns 
     */
    protected arrayOfChildren(conditionType: ConditionType,
        childrenCallback: ConditionWithChildrenBuilderHandler): ConditionWithChildrenBaseConfig {
        assertNotNull(childrenCallback, 'childrenCallback');
        // We'll actually use another builder to build the child configs
        // and deposit them into the parent builder's config.

        let childBuilder = new StartConditionWithChildrenBuilder(this, conditionType);
        childrenCallback(childBuilder);
        // while callback returns an array, it we want the results assigned to 
        // ConditionWithChildrenBuilder's childConfig array.
        let config = childBuilder.getConfig() as ConditionWithChildrenBaseConfig;
        if (this.parentBuilder instanceof StartConditionBuilder) {
            // if this is a StartConditionBuilder, we need to set the config to the parent builder
            this.parentBuilder.setConfig(config);
        }
        else
            this.setConfig(config);
        return config;  // to allow caller to establish additional properties, such as minimum and maximum for CountMatchesCondition
    }

    /**
     * Considers a match to be when all child conditions match. If any child does not match, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param callback 
     */
    public all(callback: ConditionWithChildrenBuilderHandler): void {
        this.arrayOfChildren(ConditionType.All, callback);
    }

    /**
     * Considers a match to be when any child condition matches. 
     * If all child conditions do not match, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param callback 
     */
    public any(callback: ConditionWithChildrenBuilderHandler): void {
        this.arrayOfChildren(ConditionType.Any, callback);
    }

    /**
     * Considers a match to be when a specified number of child conditions match.
     * If the number of matching child conditions is less than the minimum, the parent does not match.
     * If the number of matching child conditions is more than the maximum, the parent does not match.
     * If any child is undetermined, the parent ignores it.
     * If no child conditions are supplied or all child conditions are undetermined, the parent is undetermined.
     * @param minimum 
     * @param maximum 
     * @param callback 
     */
    public countMatches(minimum: number | null, maximum: number | null,
        callback: ConditionWithChildrenBuilderHandler): void {
        let conditionWithChildren =
            this.arrayOfChildren(ConditionType.CountMatches, callback) as CountMatchesConditionConfig;
        if (minimum !== null) {
            conditionWithChildren.minimum = minimum;
        }
        if (maximum !== null) {
            conditionWithChildren.maximum = maximum;
        }
        this.setConfig(conditionWithChildren);
    }
    //!!!PENDING: Support for conditionConfig, all, any, countMatches, not, when
}

/**
 * This class is intended to be used by all functions that create a condition config object.
 * It has all conditions declared as its methods, each doing its own thing to create
 * its condition object and attach it to the parent builder.
 * 
 * This class is intended for expansion through prototypes, allowing the user to create
 * new conditions and add them to the ConditionBuilder class. 
 * See the ConditionBuilderExtensions.ts file for examples.
 * 
 * ```ts
 * ConditionBuilder.prototype.myNewCondition = function constructor;
 * ```
 */
export class ConditionBuilder extends ConditionBuilderBase {
    constructor (parentBuilder: IBuilderConfigHost) {
        super(parentBuilder);
    }
    private _config?: ConditionConfig;

    public setConfig(config: ConditionConfig): void {
        assertNotNull(config, "config");
        assertNotNull(config.conditionType, "config.conditionType");
        this._config = config;
        if (this.parentBuilder instanceof StartConditionBuilder) {
            // if this is a StartConditionBuilder, we need to set the config to the parent builder
            this.parentBuilder.setConfig(config);
        }
    }

    public getConfig(): ConditionConfig | undefined {
        return this._config;
    }
}

export class StartConditionBuilder extends ConditionBuilderBase {
    constructor(parentBuilder: IBuilderConfigHost) {
        super(parentBuilder);
    }

    protected config?: ConditionConfig;

    /**
     * When assigned, it is copied to the child condition config's valueHostName property, 
     * which is used by conditions that require a value host name.
     */
    protected valueHostName?: string;

    /**
     * Will assign the config.valueHostName property to the valueHostName property of this builder, 
     * if it is defined, unless it was already assigned by the child.
     * Will pass up the config to the parent builder's setConfig method.
     * @param config 
     */
    public setConfig(config: ConditionConfig): void {
        this.config = config;
        if (this.valueHostName) {
            // there is no real way to check because this object is generic.
            // So we assign the valueHostName property to all configs.
            let oneValueConfig = config as OneValueConditionBaseConfig;
            if (oneValueConfig.valueHostName == null) // null/undefined
                oneValueConfig.valueHostName = this.valueHostName;
        }
        this.parentBuilder.setConfig(config);
    }
    public getConfig(): ConditionConfig | undefined {
        return this.config;
    }

    /**
     * Starts building a condition that uses the parent value host as its source.
     * 
     * Hands off the next part to a new ConditionBuilder, 
     * where the user can select the actual condition to build.
     * setConfig() will not assign a valueHostName property to the child condition config, 
     * which means the parent value host is used.
     * @returns 
     */
    public parentValue(): ConditionBuilder {
        this.valueHostName = undefined;
        return new ConditionBuilder(this);
    }

    /**
     * Starts building a condition that uses the supplied valueHostName as its source.
     * 
     * Hands off the next part to a new ConditionBuilder, 
     * where the user can select the actual condition to build.
     * setConfig() will later bind the valueHostName to the child condition config's valueHostName property.
     * @param valueHostName 
     * @returns 
     */
    public fieldValue(valueHostName: string): ConditionBuilder {
        this.valueHostName = valueHostName;
        return new ConditionBuilder(this);
    }
}   

/**
 * Starter these conditions: AllCondition, AnyCondition, CountMatchesCondition.
 * These conditions have an array of child condition configs that are supplied through an array.
 * Each child in created by its own ConditionBuilder and passed up to this one.
 * 
 * It works a bit differently than the usual, by taking on the task of creating
 * the actual ConditionWithChildrenBaseConfig object, and through setConfig(),
 * adding each child config to the array, which is the conditionConfigs property of the ConditionWithChildrenBaseConfig.
 * 
 * Each call to setConfig() will add a child config to the array.
 * It fully creates the ConditionWithChildrenBaseConfig object, which is returned by getConfig()
 */
export class StartConditionWithChildrenBuilder extends StartConditionBuilder {

    constructor(parentBuilder: IBuilderConfigHost, conditionType: ConditionType) {
        super(parentBuilder);
        super.setConfig({
            conditionType: conditionType,
            conditionConfigs: []
        } as ConditionWithChildrenBaseConfig);          
    }

    public setConfig(config: ConditionConfig): void {
        assertNotNull(config, "config");
        assertNotNull(config.conditionType, "config.conditionType");
        (<ConditionWithChildrenBaseConfig>this.getConfig())?.conditionConfigs.push(config);
        this.parentBuilder.setConfig(this.getConfig()!);
    }
}

export type ConditionBuilderHandler = (conditionsBuilder: StartConditionBuilder) => ConditionConfig;
export type ConditionWithChildrenBuilderHandler =
    (conditionsBuilder: StartConditionWithChildrenBuilder) => void;