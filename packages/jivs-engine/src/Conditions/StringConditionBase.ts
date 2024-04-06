/**
 * Base implementation of a Condition that evaluates a string as the native value.
 * @module Conditions/AbstractClasses/StringConditionBase
 */

import { IInputValueHost } from '../Interfaces/InputValueHost';
import { ConditionEvaluateResult, IEvaluateConditionDuringEdits } from '../Interfaces/Conditions';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { OneValueConditionDescriptor, OneValueConditionBase } from './OneValueConditionBase';

/**
 * Base implementation of a Condition that evaluates a string as the native value.
 */
export abstract class StringConditionBase<TConditionDescriptor extends StringConditionDescriptor>
    extends OneValueConditionBase<TConditionDescriptor> implements IEvaluateConditionDuringEdits
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
        // trimming is not appropriate since we are evaluating an already cleaned up native value
        // if (this.descriptor.trim ?? true)
        //     text = text.trim();
        return this.evaluateString(text, valueHost, valueHostResolver.services);
    }
    /**
     * Applies the business rule against the string value (already trimmed if 
     * Descriptor.Trim is true).
     * @param text
     * @param valueHost
     * @param services 
     */
    protected abstract evaluateString(text: string, valueHost: IValueHost, services: IValidationServices):
        ConditionEvaluateResult;
    /**
     * Runs when Descriptor.supportsDuringEdit is true and validateOptions.DuringEdit is true
     * Supports the Descriptor.trim option.
     * @param text 
     * @param valueHost 
     * @param services 
     * @returns When supportsDuringEdit is false, returns undetermined. Otherwise it follows
     * the rules from the Descriptor.
     */
    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult{
        if (this.descriptor.supportsDuringEdit !== false)
        {
            if (this.descriptor.trim ?? true)
                text = text.trim();
            return this.evaluateString(text, valueHost, services);
        }
        return ConditionEvaluateResult.Undetermined;
    }
    /**
     * Supplies the value found in ValueHost from getValue().
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
     * When true or undefined, this evaluates when ValidateOption.DuringEdit is true.
     * Usually that means as the user is typing. Its not appropriate when
     * the regular expression will not match until the input is finished,
     * such as parsing a date. Its best for checking for valid or invalid (when Not=true)
     * characters as the user types.
     */
    supportsDuringEdit?: boolean;
    
    /**
     * Removes leading and trailing whitespace before evaluating the string.
     * Only used with ValidateOption.DuringEdit = true as the string
     * comes from the Input value, which is actively being edited.
     * Your parser that moves data from Input to Native values is expected
     * to do its own trimming, leaving the DuringEdit = false no need to trim.
     */
    trim?: boolean;    

}
