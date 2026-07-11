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
 *   It has all Jivs-supplied conditions declared as its methods, each doing its own thing to create
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
 * * StartConditionWithChildrenBuilder: Extends StartConditionBuilder and is used by AllCondition, AnyCondition, 
 *    and other conditions that can have child conditions. It fully creates the condition config.
 *    It gathers all child condition configs and attaches them to the parent condition config
 *    through its setConfig method.
 */

import { ConditionType } from "../Conditions/ConditionTypes";
import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { NotConditionConfig } from "../Conditions/NotCondition";
import { OneValueConditionBaseConfig } from "../Conditions/OneValueConditionBase";
import { WhenConditionConfig } from "../Conditions/WhenCondition";
import { ConditionConfig } from "../Interfaces/Conditions";
import { assertFunction, assertNotNull } from "../Utilities/ErrorHandling";
import { IBuilderConfigHost, CompleteConfigBuilderHandler } from "./Fluent";
import { CountMatchesConditionConfig, DataTypeCheckConditionConfig, EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, IntegerConditionConfig, LessThanConditionConfig, LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig, MaxDecimalsConditionConfig, NotEqualToConditionConfig, NotEqualToValueConditionConfig, NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig, RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig } from "../Conditions/ConcreteConditions";
import { ValueHostName } from "../DataTypes/BasicTypes";

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
    constructor(parentBuilder: IBuilderConfigHost<object> | null, // intentionally not <ConditionConfig> because the parent might not be creating a condition config
        completed?: CompleteConfigBuilderHandler<TConfig>) {
        this._parentBuilder = parentBuilder;
        this._completed = completed;
    }

    protected get parentBuilder(): IBuilderConfigHost<object> | null {
        return this._parentBuilder;
    }
    private _parentBuilder: IBuilderConfigHost<object> | null;

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
        assertFunction(childrenCallback);
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

export class StartConditionBuilder extends ConditionBuilderBase<ConditionConfig> {
    constructor(parentBuilder: IBuilderConfigHost<object> | null,
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

/**
 * This class is intended to be used by all functions that create a condition config object.
 * It has all Jivs-supplied conditions declared as its methods, each doing its own thing to create
 * its condition object and attach it to the parent builder.
 * 
 * When creating conditions without a validator, there are two fluent steps.
 * 1. Use StartConditionBuilder to define the source field for the value
 *      assigned to valueHostName of the condition. It provides parentValue()
 *      and fieldValue(valuehostname), along with several conditions that don't use valueHostNames:
 *      any, all, countMatches, not, and when.
 * 2. Use ConditionBuilder to create the ConditionConfig specific to that condition.
 *      Its job is to let condition specific methods create the ConditionConfig
 *      and pass it back to the parent builder through attachChildConfig().
 * 
 * Together they look like this:
 * ```ts
 * let builder = new StartConditionBuilder(parentBuilder);
 * builder.fieldValue('fieldName').requireText();
 * builder.parentValue().regExp('pattern');
 * ```
 * 
 * This class is also used with FluentValidatorBuilder to create condition-specific configurations.
 */
export class ConditionBuilder<TConfig extends ConditionConfig = ConditionConfig,
    TOptions extends SetConfigOptions = SetConfigOptions>
    extends ConditionBuilderBase<TConfig, TOptions> {
    
    /**
     * 
     * @param parentBuilder - The Builder requesting this one.
     * It will consume the config generated either through the completed
     * callback or by calling getConfig().
     * @param completed - Optional callback that occurs when 
     * this builder has finished creating the config. It notifies
     * the builder with the config so it can consume it.
     * This is usually consumed by calling parentBuilder to use the child
     * builder's config.
     */
    constructor(parentBuilder: IBuilderConfigHost<object>, 
        completed?: CompleteConfigBuilderHandler<TConfig>
    ) {
        super(parentBuilder, completed);
    }

    /**
     * Creates a configuration for DataTypeCheckCondition.
     */
    public dataTypeCheck(): void
    {
        let config: Partial<DataTypeCheckConditionConfig> =
        {
            conditionType: ConditionType.DataTypeCheck
        };
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the RequireTextCondition.
     * @param conditionConfig - Optional configuration parameters for the RequireText condition.
     */
    public requireText(conditionConfig?: OptionalRequireTextConditionParams): void
    {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as RequireTextConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.RequireText;

        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the NotNullCondition.
     */
    public notNull(): void
    {
        let config: Partial<NotNullConditionConfig> =
        {
            conditionType: ConditionType.NotNull
        };
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the RegExpCondition.
     * @param expression - The regular expression to match against.
     * @param ignoreCase - Whether to ignore case when matching the regular expression.
     * @param conditionConfig - Optional configuration parameters for the RegExp condition.
     */
    public regExp(
        expression: RegExp | string, ignoreCase?: boolean | null,
        conditionConfig?: OptionalRegExpConditionParams): void {
        let config: RegExpConditionConfig = (conditionConfig ? { ...conditionConfig } : {}) as RegExpConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.RegExp;
        if (expression != null)
            if (expression instanceof RegExp)
                config.expression = expression;
            else
                config.expressionAsString = expression;
        if (ignoreCase != null)
            config.ignoreCase = ignoreCase;

        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the RangeCondition.
     * @param minimum - The minimum value for the range.
     * @param maximum - The maximum value for the range.
     */
    public range(minimum: any, maximum: any): void
    {
        let config = { conditionType: ConditionType.Range } as RangeConditionConfig;
        if (minimum != null)
            config.minimum = minimum;
        if (maximum != null)
            config.maximum = maximum;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the EqualToValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualToValue condition.
     */
    public equalToValue(
        secondValue: any,
        conditionConfig?: OptionalEqualToValueConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as EqualToValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.EqualToValue;
        if (secondValue != null)
            config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the EqualToValueCondition using an alias to equalToValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualToValue condition.
     */
    public eqValue(secondValue: any, conditionConfig?: OptionalEqualToValueConditionParams): void {
        this.equalToValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the EqualToCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
     */
    public equalTo(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalEqualToConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as EqualToConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.EqualTo;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the EqualToCondition using an alias to equalTo()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the EqualTo condition.
     */
    public eq(secondValueHostName: ValueHostName, conditionConfig?: OptionalEqualToConditionParams): void {
        this.equalTo(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the NotEqualToValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualToValue condition.
     */
    public notEqualToValue(
        secondValue: any,
        conditionConfig?: OptionalNotEqualToValueConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.NotEqualToValue;
        if (secondValue != null)
            config.secondValue = secondValue;
        this.setConfig(config as any);
    }    

    /**
     * Creates a configuration for the NotEqualToValueCondition using an alias to notEqualToValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualToValue condition.
     */
    public neqValue(secondValue: any, conditionConfig?: OptionalNotEqualToValueConditionParams): void {
        this.notEqualToValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the NotEqualToCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
     */
    public notEqualTo(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalNotEqualToConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.NotEqualTo;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the NotEqualToCondition using an alias to notEqualTo()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the NotEqualTo condition.
     */
    public neq(secondValueHostName: ValueHostName, conditionConfig?: OptionalNotEqualToConditionParams): void {
        this.notEqualTo(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanValue condition.
     */
    public lessThanValue(
        secondValue: any,
        conditionConfig?: OptionalLessThanValueConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThanValue;
        if (secondValue != null)
            config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanValueCondition using an alias to lessThanValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanValue condition.
     */
    public ltValue(secondValue: any, conditionConfig?: OptionalLessThanValueConditionParams): void {
        this.lessThanValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThan condition.
     */
    public lessThan(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalLessThanConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThan;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanCondition using an alias to lessThan()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThan condition.
     */
    public lt(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanConditionParams): void {
        this.lessThan(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanOrEqualValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqualValue condition.
     */
    public lessThanOrEqualValue(
        secondValue: any,
        conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThanOrEqualValue;
        if (secondValue != null)
            config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanOrEqualValueCondition using an alias to lessThanOrEqualValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqualValue condition.
     */
    public lteValue(secondValue: any, conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void {
        this.lessThanOrEqualValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the LessThanOrEqualCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
     */
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalLessThanOrEqualConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.LessThanOrEqual;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the LessThanOrEqualCondition using an alias to lessThanOrEqual()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the LessThanOrEqual condition.
     */
    public lte(secondValueHostName: ValueHostName, conditionConfig?: OptionalLessThanOrEqualConditionParams): void {
        this.lessThanOrEqual(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the GreaterThanValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanValue condition.
     */
    public greaterThanValue(
        secondValue: any,
        conditionConfig?: OptionalGreaterThanValueConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThanValue;
        if (secondValue != null)
            config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanValueCondition using an alias to greaterThanValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanValue condition.
     */
    public gtValue(secondValue: any, conditionConfig?: OptionalGreaterThanValueConditionParams): void {
        this.greaterThanValue(secondValue, conditionConfig);
    }

    /**
     * Creates a configuration for the GreaterThanCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
     */
    public greaterThan(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalGreaterThanConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThan;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanCondition using an alias to greaterThan()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThan condition.
     */
    public gt(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanConditionParams): void {
        this.greaterThan(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the GreaterThanOrEqualValueCondition.
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqualValue condition.
     */
    public greaterThanOrEqualValue(
        secondValue: any,
        conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualValueConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThanOrEqualValue;
        if (secondValue != null)
            config.secondValue = secondValue;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanOrEqualValueCondition using an alias to greaterThanOrEqualValue()
     * @param secondValue - The value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqualValue condition.
     */
    public gteValue(secondValue: any, conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void {
        this.greaterThanOrEqualValue(secondValue, conditionConfig);
    }
    
    /**
     * Creates configuration for the GreaterThanOrEqualCondition.
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
     */
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.GreaterThanOrEqual;
        if (secondValueHostName != null)
            config.secondValueHostName = secondValueHostName;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the GreaterThanOrEqualCondition using an alias to greaterThanOrEqual()
     * @param secondValueHostName - The host name of the second value to compare against.
     * @param conditionConfig - Optional configuration parameters for the GreaterThanOrEqual condition.
     */
    public gte(secondValueHostName: ValueHostName, conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void {
        this.greaterThanOrEqual(secondValueHostName, conditionConfig);
    }

    /**
     * Creates a configuration for the StringLengthCondition.
     * @param maximum - The maximum length of the string.
     * @param conditionConfig - Optional configuration parameters for the StringLength condition.
     */
    public stringLength(
        maximum: number | null,
        conditionConfig?: OptionalStringLengthConditionParams): void {
        let config = (conditionConfig ? { ...conditionConfig } : {}) as StringLengthConditionConfig;
        if (!config.conditionType)
            config.conditionType = ConditionType.StringLength;
        if (maximum != null)
            config.maximum = maximum;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the StringLengthCondition using an alias to stringLength()
     * @param maximum - The maximum length of the string.
     * @param conditionConfig - Optional configuration parameters for the StringLength condition.
     */
    public len(maximum: number | null, conditionConfig?: OptionalStringLengthConditionParams): void {
        this.stringLength(maximum, conditionConfig);
    }

    /**
     * Creates a configuration for the PositiveCondition.
     * This condition checks if a value is positive.
     */
    public positive(): void {
        let config =  { conditionType: ConditionType.Positive } as PositiveConditionConfig;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the IntegerCondition.
     * This condition checks if a value is an integer.
     */
    public integer(): void {
        let config = { conditionType: ConditionType.Integer } as IntegerConditionConfig;
        this.setConfig(config as any);
    }

    /**
     * Creates a configuration for the MaxDecimalsCondition.
     * This condition checks if a value has no more than the specified number of decimal places.
     * @param maxDecimals - The maximum number of decimal places allowed.
     */
    public maxDecimals(maxDecimals: number): void {
        let config = {
            conditionType: ConditionType.MaxDecimals,
            maxDecimals: maxDecimals
        } as MaxDecimalsConditionConfig;
        this.setConfig(config as any);
    }
}

export type OptionalRequireTextConditionParams = Partial<Omit<RequireTextConditionConfig,
    'conditionType' | 'valueHostName' | 'category'>>;
export type OptionalRegExpConditionParams = Partial<Omit<RegExpConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'expressionAsString' | 'expression' | 'ignoreCase'>>;
export type OptionalEqualToValueConditionParams = Partial<Omit<EqualToValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalEqualToConditionParams = Partial<Omit<EqualToConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValueHostName'>>;
export type OptionalNotEqualToValueConditionParams = Partial<Omit<NotEqualToValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalNotEqualToConditionParams = Partial<Omit<NotEqualToConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValueHostName'>>;
export type OptionalLessThanValueConditionParams = Partial<Omit<LessThanValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalLessThanConditionParams = Partial<Omit<LessThanConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValueHostName'>>;
export type OptionalLessThanOrEqualValueConditionParams = Partial<Omit<LessThanValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalLessThanOrEqualConditionParams = Partial<Omit<LessThanConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValueHostName'>>;
export type OptionalGreaterThanValueConditionParams = Partial<Omit<GreaterThanValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalGreaterThanConditionParams = Partial<Omit<GreaterThanConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValueHostName'>>;
export type OptionalGreaterThanOrEqualValueConditionParams = Partial<Omit<GreaterThanOrEqualValueConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValue'>>;
export type OptionalGreaterThanOrEqualConditionParams = Partial<Omit<GreaterThanOrEqualConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'secondValueHostName'>>;
export type OptionalStringLengthConditionParams = Partial<Omit<StringLengthConditionConfig,
    'conditionType' | 'valueHostName' | 'category' | 'maximum'>>;
