import { FluentOneConditionBuilder, FluentConditionBuilder, finishFluentConditionBuilder } from './../Builder/Fluent';

/**
 * When a Validator needs a child condition (like for when, not, all, any, etc.), 
 * these builders are the first fluent node that is used to create the child condition. 
 * The parent creates one of these builders to determine the valuehostName used
 * within the condition itself as its valueHostName property.
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
 * @module ValueHosts/Types/FieldConditionBuilder
 */

import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig } from '../Interfaces/Conditions';
import { assertNotNull } from '../Utilities/ErrorHandling';

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
    public constructor(
        protected readonly parentConfig?: ConditionWithChildrenBaseConfig | null) {
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
        return finishFluentConditionBuilder(new FluentConditionBuilder(null), conditionConfig.conditionType, conditionConfig);
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
        return new FluentOneConditionBuilder(config, valueHostName);
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
        return new FluentConditionBuilder(config, valueHostName);
    }
}