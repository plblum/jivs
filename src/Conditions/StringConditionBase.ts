/**
 * Base implementation of a Condition that evaluates a string as the native value.
 * @module Conditions/AbstractClasses/StringConditionBase
 */

import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { OneValueConditionDescriptor, OneValueConditionBase } from './OneValueConditionBase';

/**
 * Base implementation of a Condition that evaluates a string as the native value.
 * Supported by StringConditionDescriptor which introduces the Trim property.
 */
export abstract class StringConditionBase<TConditionDescriptor extends StringConditionDescriptor>
    extends OneValueConditionBase<TConditionDescriptor>
{
    /**
     * Evaluate a value using its business rule and configuration in the Descriptor.
     * @param valueHost - contains both the value from input field/element and the native value resolved by data type.
     * This function checks both in valueHost to determine a string source.
     * @param valueHostResolver 
     */
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = this.resolveValue(valueHost);
        if (value === undefined)
            return ConditionEvaluateResult.Undetermined;

        let text = value as string;
        if (this.descriptor.trim ?? true)
            text = text.trim();
        return this.evaluateString(text, valueHost, valueHostResolver);
    }
    /**
     * Applies the business rule against the string value (already trimmed if 
     * Descriptor.Trim is true).
     * @param text
     * @param valueHostResolver 
     */
    protected abstract evaluateString(text: string, valueHost: IValueHost, valueHostResolver: IValueHostResolver):
        ConditionEvaluateResult;

    /**
     * Supplies the value found in ValueHost from GetValue.
     * It wants a string and will only return a string or undefined.
     * @param valueHost 
     * @returns 
     */
    protected resolveValue(valueHost: IValueHost): string | undefined {
        let value = valueHost.getValue();
        if (typeof value !== 'string')
            return undefined;
        return value;
    }
}

export interface StringConditionDescriptor extends OneValueConditionDescriptor {
    /**
     * Indicates that validation is applied only after trimming a string value
     * that is returned by a input field/element whose native datatype is string.
     */
    trim?: boolean;
}
