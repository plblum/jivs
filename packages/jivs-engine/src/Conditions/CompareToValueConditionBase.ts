/**
 * Base for Conditions that compare the ValueHost's against a second value, supplied in 
 * CompareToValueConditionBaseConfig.secondValue.
 * The Config introduces valueHostName.
 * @module Conditions/AbstractClasses/CompareToValueConditionBase
 */

import { ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter } from './../Interfaces/Conditions';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValueHost } from '../Interfaces/ValueHost';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { IValidationManager } from '../Interfaces/ValidationManager';

/**
 * ConditionConfig for CompareToValueConditionBase.
 */
export interface CompareToValueConditionBaseConfig extends OneValueConditionBaseConfig, SupportsDataTypeConverter {
    /**
     * Native data type representing the right operand of the comparison
     */
    secondValue?: any;

    /**
     * Associated with secondValue only.
     * Assign to a LookupKey of the data type you want the second value
     * to be converted to before comparing. Also consider the same for the first value
     * by using the conversionLookupKey property.
     * Examples:
     *  - case insensitive matching, use LookupKey.CaseInsensitive, 
     *  - rounding a number to an integer, use LookupKey.Integer,
     *  - just the Day or Month or any other number in a Date object,
     *    use LookupKey.Day, LookupKey.Month, LookupKey.Year, etc.
     *  - a calculated value derived from the value, like the total days
     *    represented by a Date object, use LookupKey.TotalDays.
     */
    secondConversionLookupKey?: string | null;
}

/**
 * Compare the ValueHost's value against a second value, supplied in 
 * CompareToValueConditionBaseConfig.secondValue.
 * 
 * Subclasses implement the actual comparison operator (equals, greater than, etc)
 * 
 * Supports tokens: {CompareTo}, the value from the second value.
 */
export abstract class CompareToValueConditionBase<TConfig extends CompareToValueConditionBaseConfig> extends OneValueConditionBase<TConfig>
{
    public evaluate(valueHost: IValueHost | null, validationManager: IValidationManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, validationManager);
        const value = valueHost.getValue();
        if (value == null)  // null/undefined
        {
            this.logNothingToEvaluate('value', validationManager.services);
            return ConditionEvaluateResult.Undetermined;
        }
        
        if (this.config.secondValue == null)    // null/undefined
        {
            this.logNothingToEvaluate('secondValue', validationManager.services);
            return ConditionEvaluateResult.Undetermined;
        }

        const valueDetails = this.tryConversion(value, valueHost.getDataType(),
            this.config.conversionLookupKey, validationManager.services);
        if (valueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        // !!! The secondValue initially is expected to be a native data type.
        // !!! However, this isn't ideal. We should offer config.secondValueLookupKey        
        
        const secondValueDetails = this.tryConversion(this.config.secondValue, null,   
            this.config.secondConversionLookupKey, validationManager.services);
        if (secondValueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        const comparison = validationManager.services.dataTypeComparerService.compare(
            valueDetails.value, secondValueDetails.value, valueDetails.lookupKey ?? null, secondValueDetails.lookupKey ?? null);
        if (comparison === ComparersResult.Undetermined) {
            this.logTypeMismatch(validationManager.services, 'value', 'secondValue', valueDetails.value, secondValueDetails.value);

            return ConditionEvaluateResult.Undetermined;
        }
        return this.compareTwoValues(comparison);
    }
    protected abstract compareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;

    public override getValuesForTokens(valueHost: IValidatorsValueHostBase, validationManager: IValidationManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, validationManager));
        const secondValue = this.config.secondValue;
        
        list.push({
            tokenLabel: 'CompareTo',
            associatedValue: secondValue ?? null,
            purpose: 'value'
        });
        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}
