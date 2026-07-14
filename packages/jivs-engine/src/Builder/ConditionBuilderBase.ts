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
 * const valBuilder = new FluentValidatorBuilder(services, parentConfig);
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
 * const condBuilder = new ConditionBuilder(services, parentBuilder);
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
 * @module Builder/ConditionBuilders
 */

import { ConditionType } from "../Conditions/ConditionTypes";
import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { NotConditionConfig } from "../Conditions/NotCondition";
import { WhenConditionConfig } from "../Conditions/WhenCondition";
import { ConditionConfig } from "../Interfaces/Conditions";
import { assertFunction, assertNotNull } from "../Utilities/ErrorHandling";
import {
    IBuilderConfigHost, CompleteConfigBuilderHandler, SetConfigOptions,
    IConditionBuilderBase, ConditionBuilderHandler, ConditionWithChildrenBuilderHandler,
    IStartConditionBuilder
} from "../Interfaces/ChildBuilders";
import { CountMatchesConditionConfig } from "../Conditions/ConcreteConditions";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { BuilderConfigHostBase } from "./BuilderConfigHostBase";

/**
 * Base class for condition builders.
 * Provides abstract definitions for IConditionBuilder methods, and a constructor that takes a parent builder.
 * It also provides the following methods to create child condition configs:
 * conditionConfig(), all(), any(), countMatches(), not(), when().
 */
export abstract class ConditionBuilderBase<TConfig extends ConditionConfig = ConditionConfig,
    TOptions extends SetConfigOptions = SetConfigOptions>
    extends BuilderConfigHostBase<TConfig, TOptions>
    implements IConditionBuilderBase<TConfig, TOptions> {
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
    constructor(services: IValidationServices,
        parentBuilder: IBuilderConfigHost<object> | null, // intentionally not <ConditionConfig> because the parent might not be creating a condition config
        completed?: CompleteConfigBuilderHandler<TConfig>) {
        super(services, parentBuilder, completed);
    }

    override setConfig(config: TConfig, options?: TOptions): void {
        if (config) {
            assertNotNull(config.conditionType, 'config.conditionType');
        }
        super.setConfig(config, options);
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
        let childBuilder = this.services.fluentFactory.createStartConditionWithOneChildBuilder(
            this as IBuilderConfigHost<object>,
            (childConfig: ConditionConfig, source: unknown /* IConditionBuilderBase<TConfig> */) => {
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
        let whenBuilder = this.services.fluentFactory.createStartConditionWithOneChildBuilder(
            this as IBuilderConfigHost<object>,
            (childConfig: ConditionConfig, source: unknown /*IConditionBuilderBase<TConfig> */) => {
                whenConditionConfig.whenToEnableConfig = childConfig;
            }
        );
        whenToEnableCallback(whenBuilder);
        assertNotNull(whenConditionConfig.whenToEnableConfig, 'whenToEnableConfig');

        let thenBuilder = this.services.fluentFactory.createStartConditionWithOneChildBuilder(
            this as IBuilderConfigHost<object>,
            (childConfig: ConditionConfig, source: unknown /*IConditionBuilderBase<TConfig> */) => {
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

        let childBuilder = this.services.fluentFactory.createStartConditionWithChildrenBuilder(
            this as IBuilderConfigHost<object>,
            conditionType);
        // pass down inherited valueHostName from parent builder if available
        if ((<IStartConditionBuilder>this.parentBuilder).valueHostName) {
            childBuilder.fieldValue((<IStartConditionBuilder>this.parentBuilder).valueHostName!);
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


