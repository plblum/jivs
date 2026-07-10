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
 *       .any((childBuilder)=>{  // here's the child builder
 *           childBuilder.fieldValue('Field2').equalTo("Value1");
 *           childBuilder.fieldValue('Field3').equalTo("Value2");
 *       }
 *       ) ... more validator conditions are allowed here ...
 * ```
 * They are also used a child to b, c, and d.
 * ```ts
 * const condBuilder = new ConditionBuilder();
 * condBuilder.all((childBuilder)=>{ // here's the child builder
 *      childBuilder.parentValue().equalTo("Value1");
 *      childBuilder.parentValue().equalTo("Value2");
 *  }
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
 *      condBuilder.all((childBuilder)=>{ ... });   // omits the parentValue() or fieldValue() source
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
import { assertFunction, assertNotNull } from "../Utilities/ErrorHandling";
import { IBuilderConfigHost, CompleteConfigBuilderHandler } from "./Fluent";
import { CountMatchesConditionConfig } from "../Conditions/ConcreteConditions";

/**
 * Interface for condition builders.
 */
export interface IConditionBuilder<TConfig extends ConditionConfig = ConditionConfig,
    TOptions extends SetConfigOptions = SetConfigOptions>
    extends IBuilderConfigHost<TConfig, TOptions> {
}

export interface SetConfigOptions {
    /**
     * When true or undefined, the parent's completed callback will be invoked.
     * When false, the parent's completed callback will not be invoked.
     */
    bubbleUp?: boolean;
    /**
     * When true or undefined, the value host name will be applied to the condition config
     * if not already assigned.
     */
    applyValueHostName?: boolean;
}


/**
 * Base class for condition builders.
 * Provides abstract definitions for IConditionBuilder methods, and a constructor that takes a parent builder.
 * It also provides the following methods to create child condition configs:
 * conditionConfig(), all(), any(), countMatches(), not(), when().
 */
export abstract class ConditionBuilderBase<TConfig extends ConditionConfig = ConditionConfig,
    TOptions extends SetConfigOptions = SetConfigOptions>
    implements IConditionBuilder<TConfig, TOptions> {
    /**
     * Constructor for the condition builder base class.
     * @param parentBuilder
     * @param completed - a callback from the creator of the child config
     * to notify its parent with the completed config. The parent often
     * uses this to hook up the child config to a property of a config its creating.
     * For example, NotCondition needs its childConditionConfig property set.
     * ```ts
     * let notConfig: NotConditionConfig = {
     *     conditionType: ConditionType.Not,
     *     childConditionConfig: null! // pending the notBuilder results
     * };
     * let startBuilder = new StartConditionBuilder(this,
     *    (childConfig: ConditionConfig, source: IConditionBuilder) => 
     *        notConfig.childConditionConfig = childConfig;
     *    }
     * );
     * ```
     */
    constructor(parentBuilder: IBuilderConfigHost<object>, // intentionally not <ConditionConfig> because the parent might not be creating a condition config
        completed?: CompleteConfigBuilderHandler<TConfig>) {
        this._parentBuilder = parentBuilder;
        this._completed = completed;
    }

    protected get parentBuilder(): IBuilderConfigHost<object> {
        return this._parentBuilder;
    }
    private _parentBuilder: IBuilderConfigHost<object>;

    /**
     * Supporting functions finish up by calling the setConfig method.
     * If this callback is assigned to the parent builder, setConfig will be called 
     * automatically when the child is completed
     * allowing it to hook up the child into its own config.
     * 
     * ```ts
     * public not(notBuilder: StartConditionBuilderHandler): void { ... }
     * {
     *      let notConfig: NotConditionConfig = {
     *          conditionType: ConditionType.Not,
     *          childConditionConfig: null! // pending the notBuilder results
     *      };
     *      let startBuilder = new StartConditionBuilder(this,
     *         (childConfig: ConditionConfig, source: IConditionBuilder) => 
     *             notConfig.childConditionConfig = childConfig;
     *         }
     *      );
     *      this.setConfig(notConfig);
     * }
     * public setConfig(config: ConditionConfig, options?: SetConfigOptions): void
     * {
     *      this._config = config;
     * // bubble up
     *      let bubbleUp = !options || options.bubbleUp != false;
     *      if (bubbleUp && this.parentBuilder?.completed) {
     *          this.parentBuilder.completed(config, this);
     *      }
     * }
     * ```
     */
    public get completed(): CompleteConfigBuilderHandler<TConfig> | undefined {
        return this._completed;
    }
    private _completed?: CompleteConfigBuilderHandler<TConfig>;

    private _config?: TConfig;

    public setConfig(config: TConfig, options?: TOptions): void {
        assertNotNull(config, "config");
        assertNotNull(config.conditionType, "config.conditionType");

        this._config = config;
        let bubbleUp = !options || options.bubbleUp != false;
        if (bubbleUp && this.parentBuilder?.completed) {
            this.parentBuilder.completed?.(config, this as IBuilderConfigHost<object>);
        }

    }


    public getConfig(): TConfig | undefined {
        return this._config;
    }    

    /**
     * Inverts the match result of the child condition config.
     * When child matches, the parent will not match, and vice versa.
     * When the child is undetermined, the parent will be undetermined.
     * @param notCallback 
     */
    public not(notCallback: ConditionBuilderHandler): void {
        assertNotNull(notCallback, 'notCallback');
        assertFunction(notCallback);
        let notConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: null! // updated in the callback of the child builder
        };
        let childBuilder = new StartConditionWithOneChildBuilder(this as IBuilderConfigHost<object>,
            (childConfig: ConditionConfig, source: IConditionBuilder) => {
                notConfig.childConditionConfig = childConfig;
            }
        );
        notCallback(childBuilder);
        assertNotNull(notConfig.childConditionConfig, 'childConditionConfig');
        this.setConfig(notConfig as unknown as TConfig, // fix ts2345: covarient issue preventing notConfig as TConfig.
            { bubbleUp: true, applyValueHostName: false } as TOptions);   
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
        assertFunction(whenToEnableCallback);
        assertNotNull(thenCallback, 'thenCallback');
        assertFunction(thenCallback);

        let whenConditionConfig: WhenConditionConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: null!,  // pending completion of whenBuilder
            thenConfig: null!   // pending completion of thenBuilder
        };        
        let whenBuilder = new StartConditionWithOneChildBuilder(this as IBuilderConfigHost<object>,
            (childConfig: ConditionConfig, source: IConditionBuilder) => {
                whenConditionConfig.whenToEnableConfig = childConfig;
            }
        );
        whenToEnableCallback(whenBuilder);
        assertNotNull(whenConditionConfig.whenToEnableConfig, 'whenToEnableConfig');

        let thenBuilder = new StartConditionWithOneChildBuilder(this as IBuilderConfigHost<object>,
            (childConfig: ConditionConfig, source: IConditionBuilder) => {
                whenConditionConfig.thenConfig = childConfig;
            }
        );
        thenCallback(thenBuilder);
        assertNotNull(whenConditionConfig.thenConfig, 'thenConfig');

        this.setConfig(whenConditionConfig as unknown as TConfig);    // fix ts2345: covarient issue preventing whenConditionConfig as TConfig.
    }

    /**
     * Main worker for conditions that have children: AllCondition, AnyCondition, CountMatchesCondition.
     * @param conditionType 
     * @param childrenCallback - user supplies the children
     * @param finishing Optional callback to modify the completed config before it is set on the parent builder.
     */
    protected arrayOfChildren(conditionType: ConditionType,
        childrenCallback: ConditionWithChildrenBuilderHandler,
        finishing?: (configToModify: object) => void
    ): void {
        assertNotNull(childrenCallback, 'childrenCallback');
        // We'll actually use another builder to build the child configs
        // and deposit them into the parent builder's config.

        let childBuilder = new StartConditionWithChildrenBuilder(
            this as IBuilderConfigHost<object>, conditionType);
        // pass down inherited valueHostName from parent builder if available
        if (this.parentBuilder instanceof StartConditionBuilder && 
            this.parentBuilder.valueHostName) {
            childBuilder.fieldValue(this.parentBuilder.valueHostName);
        }
        // StartConditionWithChildrenBuilder is building the full config for the conditiontype.
        // it is gathering all child conditions into its own config via internal completed callbacks.
        // It does not fire any completed callbacks to the parent builder
        // leaving us to get the completed config directly from the child builder.
        childrenCallback(childBuilder);
        let config = childBuilder.getConfig() as ConditionWithChildrenBaseConfig;
        finishing?.(config);
        
        this.setConfig(config as unknown as TConfig,
            { bubbleUp: true, applyValueHostName: false } as TOptions);    // fix ts2345: covarient issue preventing config as TConfig.
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

        this.arrayOfChildren(ConditionType.CountMatches, callback,
            (configToModify: object) => {
                if (minimum !== null) {
                    (configToModify as CountMatchesConditionConfig).minimum = minimum;
                }
                if (maximum !== null) {
                    (configToModify as CountMatchesConditionConfig).maximum = maximum;
                }
            }
        );
    }

    /**
     * Provides a way to supply a complete condition config object directly to the builder.
     * The supplied object must have its conditionType and all required properties for that condition type.
     * 
     * ```ts
     * builder.conditionConfig(<RangeConditionConfig>{
     *     conditionType: ConditionType.Range,
     *     minimum: 1,
     *     maximum: 5
     * });
     * ```
     * @param config 
     */
    public conditionConfig(config: ConditionConfig): void {
        this.setConfig(config as unknown as TConfig);    // ts2345 
    }

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
export class ConditionBuilder<TConfig extends ConditionConfig = ConditionConfig>
    extends ConditionBuilderBase<TConfig> {
    constructor(parentBuilder: IBuilderConfigHost<object>, 
        completed?: CompleteConfigBuilderHandler<TConfig>
    ) {
        super(parentBuilder, completed);
    }
}

export class StartConditionBuilder extends ConditionBuilderBase<ConditionConfig> {
    constructor(parentBuilder: IBuilderConfigHost<object>,
        completed?: CompleteConfigBuilderHandler<ConditionConfig>
    ) {
        super(parentBuilder,
            (config: ConditionConfig, source: IBuilderConfigHost<ConditionConfig>) => {
                this.setConfig(config, { bubbleUp: true }); 
            }
        );
        this.childCompleted = completed;
    }

    protected config?: ConditionConfig;
    protected childCompleted?: CompleteConfigBuilderHandler<ConditionConfig>;

    /**
     * When assigned, it is copied to the child condition config's valueHostName property, 
     * which is used by conditions that require a value host name.
     */
    public get valueHostName(): string | undefined {
        return this._valueHostName;
    }
    protected set valueHostName(value: string | undefined) {
        this._valueHostName = value;
    }
    private _valueHostName?: string;

    /**
     * Will assign the config.valueHostName property to the valueHostName property of this builder, 
     * if it is defined, unless it was already assigned by the child.
     * Will pass up the config to the parent builder's setConfig method.
     * @param config 
     */
    public setConfig(config: ConditionConfig, options?: SetConfigOptions): void {
        let revise = !options || options.applyValueHostName != false;
        if (revise)
            this.reviseValueHostName(config);
        super.setConfig(config, options);
        if (this.childCompleted)
            this.childCompleted(config, this);
    }

    protected reviseValueHostName(config: ConditionConfig): void {
        if (this._valueHostName) {
            let oneValueConfig = config as OneValueConditionBaseConfig;
            if (oneValueConfig.valueHostName == null) // null/undefined
                oneValueConfig.valueHostName = this._valueHostName;
        }
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
        this._valueHostName = undefined;
        return new ConditionBuilder(this as IBuilderConfigHost<object>,
            (childCondition: ConditionConfig, source: IBuilderConfigHost<ConditionConfig>) =>
                this.setConfig(childCondition, { bubbleUp: true, applyValueHostName: false })
        );
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
        this._valueHostName = valueHostName;
        return new ConditionBuilder(this as IBuilderConfigHost<object>,
            (childCondition: ConditionConfig, source: IBuilderConfigHost<ConditionConfig>) =>
                this.setConfig(childCondition, 
                    { bubbleUp: true, applyValueHostName: true }
                ) // sets childConfig.valueHostName and calls parent.completed
        );
    }
}   

/**
 * Starter these conditions: AllCondition, AnyCondition, CountMatchesCondition.
 * These conditions have an array of child condition configs that are supplied through an array.
 * Each child in created by its own ConditionBuilder and passed up to this one.
 * 
 * It works a bit differently than the usual, by taking on the task of creating
 * the actual ConditionWithChildrenBaseConfig object, and through setConfig(),
 * adding each child config to the array, 
 * which is the conditionConfigs property of the ConditionWithChildrenBaseConfig.
 * 
 * Each call to setConfig() will add a child config to the array.
 * It fully creates the ConditionWithChildrenBaseConfig object, which is returned by getConfig().
 * 
 * It does not offer a completed callback to the parent builder because each
 * call to its setConfig() handles the addition of a child config,
 * and the parent builder will only receive the fully constructed configuration when appropriate.
 */
export class StartConditionWithChildrenBuilder extends StartConditionBuilder {

    constructor(parentBuilder: IBuilderConfigHost<object>,
        conditionType: ConditionType
        /*completed?: CompleteConfigBuilderHandler<ConditionConfig>*/) {
        super(parentBuilder /*, completed */);
        super.setConfig({
            conditionType: conditionType,
            conditionConfigs: []
        } as ConditionWithChildrenBaseConfig,
        { bubbleUp: false, applyValueHostName: false});          
    }

    public setConfig(config: ConditionConfig, options?: SetConfigOptions): void {
        assertNotNull(config, "config");
        assertNotNull(config.conditionType, "config.conditionType");

        // child node may get handled a valuehostname
        let revise = !options || options.applyValueHostName != false;
        if (revise)
            this.reviseValueHostName(config);
        let configWithChildren = this.getConfig() as ConditionWithChildrenBaseConfig;
        configWithChildren?.conditionConfigs.push(config);
        // do not bubble up the changes to parent's completed handler because
        // we are still capturing. Its up to the parent builder to handle the completed configuration.

/*        
        // we are modifying the same object already in setConfig, so the
        // call here appears to have no effect on the actual object reference, 
        // but it ensures that any parent builder is notified of the update.
        
        // don't apply current valuehostname to the parent config itself, only to the child configs

        super.setConfig(configWithChildren, { bubbleUp: false, applyValueHostName: false });

*/        
    }
}

/**
 * Builder that allows only one child condition.
 * Used by Not and WhenConditions.
 */
export class StartConditionWithOneChildBuilder extends StartConditionBuilder {
    /**
     * Throws when the configuration already exists. Only allows the first attempt.
     * @param config 
     * @param options 
     */
    public setConfig(config: ConditionConfig, options?: SetConfigOptions): void {
        if (this.getConfig() != null)
            throw new Error('Only one child configuration permitted.');
        super.setConfig(config, options);
    }
}   

/**
 * Allows a child to create its own condition, through the supplied StartConditionBuilder.
 * The caller gets the result when the child code calls its builder's setConfig().
 */
export type ConditionBuilderHandler = (conditionsBuilder: StartConditionBuilder) => void;
export type ConditionWithChildrenBuilderHandler =
    (conditionsBuilder: StartConditionWithChildrenBuilder) => void;