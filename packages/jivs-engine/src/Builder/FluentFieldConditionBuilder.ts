/**
 * When a Validator needs a child condition (like for when, not, all, any, etc.), 
 * there are two fluent steps:
 * 1. Use FluentFieldConditionBuilders to define the source field for the value
 * assigned to valueHostName of the condition.
 * 2. Use FluentConditionBuilder to create the ConditionConfig specific to that condition.
 * 
 * The parent creates a FluentFieldConditionBuilder to supply the valuehostName used
 * within the condition itself as its valueHostName property.
 * 
 * The design is very lightweight, simply here to ensure that how you read code is
 * "source valuehostname" -> child condition rules applied to it.
 * 
 * ```ts
 * when((whenBuilder) => {
 *     whenBuilder.fieldValue('Field1').requireText();
 * },
 * (thenBuilder) => {
 *     thenBuilder.parentValue().regExp(/^abc/);
 * });
 * ```
 * 
 * - FluentFieldConditionBuilderBase: abstract base class that supplies the value host name functions.
 * - FluentSingleFieldConditionBuilder: inherits FluentFieldConditionBuilderBase to return the next fluent node
 * as a FluentOneConditionBuilder, which is the next fluent node in the chain.
 * - FluentMultiFieldConditionBuilder: inherits FluentFieldConditionBuilderBase to return the next fluent node
 * as a FluentMultiConditionBuilder, which is the next fluent node in the chain.
 * 
 * Any Condition that needs a child condition (like when, not, all, any, countMatches, etc.) 
 * always supplies a FluentFieldConditionBuilder. However, there are several condition types
 * that are themselves hosts of children, and they don't need to identify a valuehostname for themselves.
 * As a result, WhenCondition, NotCondition, AllCondition, AnyCondition, and CountMatchesCondition 
 * all appear within FluentFieldConditionBuilderBase to skip the step of calling fieldValue() or parentValue() 
 * for the child condition, as it is assumed that the child conditions will determine their own valueHostName.
 * 
 * ```ts
 * when((whenBuilder) => {
 *     whenBuilder.fieldValue('Field1').requireText();
 * },
 * (thenBuilder) => { // skips fieldValue and parentValue on thenBuilder.
 *     thenBuilder.when((whenBuilder) => {
 *         whenBuilder.fieldValue('Field2').requireText();
 *     });
 * });
 * ```
 * ```ts
 * // using all
 * all((childrenBuilder) => {
 *     childrenBuilder.fieldValue('Field1').requireText();
 *     childrenBuilder.any((childrenBuilder2) => { // skips fieldValue and parentValue on childrenBuilder.
 *         childrenBuilder2.fieldValue('Field2').requireText();
 *         childrenBuilder2.fieldValue('Field3').requireText();
 *     });
 * });
 * ```
 * 
 * @module ValueHosts/Types/FieldConditionBuilder
 */

import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig } from '../Interfaces/Conditions';
import { assertNotNull } from '../Utilities/ErrorHandling';
import {
    FluentOneConditionBuilder, FluentConditionBuilder,
    finishFluentConditionBuilder, FluentMultiFieldConditionBuilderHandler,
    FluentSingleFieldConditionBuilderHandler
} from './../Builder/Fluent';
import {
    _genDCAll, _genDCAny, _genDCCountMatches,
    _genDCWhen, _genDCNot,
    enableFluentConditions
 } from './../Builder/FluentConditionBuilderExtensions';

/**
 * Abstract base class for builders that create child conditions for a parent condition.
 * It provides methods to specify the value host name for the child condition.
 * The concrete subclasses will determine the type of builder returned for the next fluent node.
 */
export abstract class FluentFieldConditionBuilderBase {
    /**
     * 
     * @param parentConfig When a parent needs children attached to it, it implements
     * ConditionWithChildrenBaseConfig with its conditionConfigs property where
     * the child conditions will be attached by the conditions added to the builder returned by this class.
     * Leave it null if not using that feature.
     */
    public constructor(parentConfig?: ConditionConfig | null) {
        this._parentConfig = parentConfig;
        enableFluentConditions();
    }
    protected get parentConfig(): ConditionConfig | null | undefined {
        return this._parentConfig;
    }

    private _parentConfig?: ConditionConfig | null;
    public getConfig(): ConditionConfig | null {
        return this.parentConfig ? { ...this.parentConfig } : null;
    }

    /**
     * Fluent node to specify that the valueHostName is defined by the parent validator
     * or condition. It sets up the child conditionConfig with valueHostName as null,
     * which means it will inherit from the parent as the condition evaluates.
     * @returns 
     */
    public parentValue(): FluentConditionBuilder | FluentOneConditionBuilder {
        return this.createBuilder(null);
    }

    /**
     * Fluent node to specify that the valueHostName is defined by a specific field or value host.
     * It sets up the child conditionConfig with the provided valueHostName.
     * @param valueHostName - The name of the value host (field) to use for the child condition.
     * Note that there is no error handling. If not valid, that is caught at runtime or by 
     * jivs-configAnalysis.
     * @returns 
     */
    public fieldValue(valueHostName: ValueHostName): FluentConditionBuilder | FluentOneConditionBuilder {
        return this.createBuilder(valueHostName);
    }

    /**
     * Creates the next fluent node builder based on the provided valueHostName.
      * @param valueHostName - The name of the value host (field) to use for the child condition, 
      * or null to inherit from the parent.
     * @returns A FluentConditionBuilder or FluentOneConditionBuilder for further fluent chaining.
     */
    protected abstract createBuilder(valueHostName: ValueHostName | null): FluentConditionBuilder | FluentOneConditionBuilder;

    /**
     * A way to drop in a completed conditionConfig into the builder chain. 
     * In the context of FluentFieldConditionBuilderBase, the conditionConfig is 
     * expected to have all required properties, including conditionType and valueHostName.
     * 
     * So instead of:
     * ```ts
     * when((whenBuilder) => {
     *     whenBuilder.fieldValue('Field1').requireText();
     * },
     * (thenBuilder) => {
     *     thenBuilder.parentValue().regExp(/^abc/);
     * });
     * ```
     * You could do:
     * ```ts
     * const whenConfig = { conditionType: ConditionType.RequireText, valueHostName: 'Field1' };
     * const thenConfig = { conditionType: ConditionType.RegExp, valueHostName: null, regExp: /^abc/ };
     * when(
     *  (whenBuilder) => whenBuilder.conditionConfig(whenConfig),
     *  (thenBuilder) => thenBuilder.conditionConfig(thenConfig));
     * @param conditionConfig 
     * @returns 
     */
    public conditionConfig(conditionConfig: ConditionConfig): FluentConditionBuilder {
        assertNotNull(conditionConfig, 'conditionConfig');
        assertNotNull(conditionConfig.conditionType, 'conditionConfig.conditionType');

        let parentConfig: ConditionWithChildrenBaseConfig | null = null;
        if (this.parentConfig) {
            parentConfig = { ...this.parentConfig } as unknown as ConditionWithChildrenBaseConfig;
        }
        let condBuilder = new FluentConditionBuilder(parentConfig);
        return finishFluentConditionBuilder(condBuilder, conditionConfig.conditionType, conditionConfig);
    }    

    /**
     * Creates a child condition that requires all of the child conditions to be true.
     * Same as on FluentConditionBuilder, but does not require a valueHostName through
     * the fieldValue or parentValue functions, as it is assumed that the child conditions 
     * will determine their own valueHostName.
     * None-the-less, it is valid to use fieldValue or parentValue on the children, if desired.
     * ```ts
     * parentConditionBuilder.all((allBuilder) => []);
     * // vs the unnecessary fieldValue:
     * parentConditionBuilder.fieldValue('Field1').all((allBuilder) => []);
     * ```
     * @param conditionsBuilder 
     * @returns 
     */
    public all(conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder {
        return new FluentConditionBuilder(_genDCAll(conditionsBuilder));
    }

    /**
     * Creates a child condition that requires any of the child conditions to be true.
     * Same as on FluentConditionBuilder, but does not require a valueHostName through
     * the fieldValue or parentValue functions, as it is assumed that the child conditions 
     * will determine their own valueHostName.
     * None-the-less, it is valid to use fieldValue or parentValue on the children, if desired.
     * ```ts
     * parentConditionBuilder.any((anyBuilder) => []);
     * // vs the unnecessary fieldValue:
     * parentConditionBuilder.fieldValue('Field1').any((anyBuilder) => []);
     * ```
     * @param conditionsBuilder 
     * @returns 
     */
    public any(conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder {
        return new FluentConditionBuilder(_genDCAny(conditionsBuilder)); 
    }

    /**
     * Creates a child condition that requires a count of the child conditions to be true, 
     * within the specified minimum and maximum range.
     * Same as on FluentConditionBuilder, but does not require a valueHostName through
     * the fieldValue or parentValue functions, as it is assumed that the child conditions 
     * will determine their own valueHostName.
     * None-the-less, it is valid to use fieldValue or parentValue on the children, if desired.
     * ```ts
     * parentConditionBuilder.countMatches(1, 3, (countBuilder) => []);
     * // vs the unnecessary fieldValue:
     * parentConditionBuilder.fieldValue('Field1').countMatches(1, 3, (countBuilder) => []);
     * ```
     * @param conditionsBuilder 
     * @returns 
     */
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder {
        return new FluentConditionBuilder(_genDCCountMatches(minimum, maximum, conditionsBuilder)); 
    }    

    /**
     * Determine if the child condition is used based on the evaluation of the whenToEnable condition.
     * Same as on FluentConditionBuilder, but does not require a valueHostName through
     * the fieldValue or parentValue functions, as it is assumed that the child conditions.
     * 
     * None-the-less, it is valid to use fieldValue or parentValue on the whenToEnable condition, if desired.
     * 
     * Example:
     * ```ts
     * parentConditionBuilder.when(
     *    (whenBuilder) => whenBuilder.fieldValue('Field1').requireText(),
     *   (thenBuilder) => thenBuilder.fieldValue('Field2').regExp(/^abc/));
     * // vs the unnecessary fieldValue:
     * parentConditionBuilder.fieldValue('Field1').when(
     *    (whenBuilder) => whenBuilder.fieldValue('Field1').requireText(),
     *   (thenBuilder) => thenBuilder.fieldValue('Field2').regExp(/^abc/));
     * ```
     * 
     * @param whenBuilder - The builder for the whenToEnable condition, which determines if the child condition is evaluated.
     * @param thenBuilder - The builder for the child condition that is evaluated if the whenToEnable condition matches.
     */
    public when(
        whenBuilder: FluentSingleFieldConditionBuilderHandler,
        thenBuilder: FluentSingleFieldConditionBuilderHandler): void {
        this._parentConfig = _genDCWhen(whenBuilder, thenBuilder);
    }

    /**
     * Creates a child condition that negates the evaluation of the child condition.
     * Same as on FluentConditionBuilder, but does not require a valueHostName through
     * the fieldValue or parentValue functions, as it is assumed that the child conditions
     * will determine their own valueHostName.
     * None-the-less, it is valid to use fieldValue or parentValue on the child, if desired.
     * ```ts
     * parentConditionBuilder.not((notBuilder) => []);
     * // vs the unnecessary fieldValue:
     * parentConditionBuilder.fieldValue('Field1').not((notBuilder) => []);
     * ```
     * @param childBuilder 
     */
    public not(
        childBuilder: FluentSingleFieldConditionBuilderHandler): void {
        this._parentConfig = _genDCNot(childBuilder);
    }

}    

/**
 * Creates the next fluent node builder for a single child condition, based on the provided valueHostName.
 * 
 * Use this on a parent Validator or any condition that must have only one child condition.
 * Examples: when.enabler, when.childCondition, not.childCondition.
 */
export class FluentSingleFieldConditionBuilder extends FluentFieldConditionBuilderBase {
    protected createBuilder(valueHostName: ValueHostName | null): FluentOneConditionBuilder {
        const config = this.parentConfig ? { ...this.parentConfig } : null; // clone
        return new FluentOneConditionBuilder(config as ConditionWithChildrenBaseConfig, valueHostName);
    }
}

/**
 * Creates the next fluent node builder for multiple child conditions, based on the provided valueHostName.
 * Use this on a parent Validator or any condition that can have multiple child conditions.
 * Examples: when.all, when.any, when.countMatches
 */
export class FluentMultiFieldConditionBuilder extends FluentFieldConditionBuilderBase {
    protected createBuilder(valueHostName: ValueHostName | null): FluentConditionBuilder {
        const config = this.parentConfig ? { ...this.parentConfig } : null; // clone
        return new FluentConditionBuilder(config as ConditionWithChildrenBaseConfig, valueHostName);
    }
}