/**
 * Base for Conditions that compare the ValueHost's against a second value, supplied in 
 * CompareToValueConditionBaseConfig.secondValue.
 * The Config introduces valueHostName.
 * @module Conditions/AbstractClasses/CompareToValueConditionBase
 */

import { IValueHostsManager } from './../Interfaces/ValueHostsManager';
import { ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter } from './../Interfaces/Conditions';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { LoggingLevel, LoggingCategory, LogOptions, LogDetails } from '../Interfaces/LoggerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValueHost } from '../Interfaces/ValueHost';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';

/**
 * ConditionConfig for CompareToValueConditionBase.
 */
export interface CompareToValueConditionBaseConfig extends OneValueConditionBaseConfig, SupportsDataTypeConverter {
    /**
     * Native data type representing the minimum of the range.
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
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
        let value = valueHost.getValue();
        if (value == null)  // null/undefined
        {
            this.logNothingToEvaluate('value', valueHostsManager.services);
            return ConditionEvaluateResult.Undetermined;
        }
        
        if (this.config.secondValue == null)    // null/undefined
        {
            this.logNothingToEvaluate('secondValue', valueHostsManager.services);
            return ConditionEvaluateResult.Undetermined;
        }

        let valueDetails = this.tryConversion(value, valueHost.getDataType(),
            this.config.conversionLookupKey, valueHostsManager.services);
        if (valueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        // !!! The secondValue initially is expected to be a native data type.
        // !!! However, this isn't ideal. We should offer config.secondValueLookupKey        
        
        let secondValueDetails = this.tryConversion(this.config.secondValue, null,   
            this.config.secondConversionLookupKey, valueHostsManager.services);
        if (secondValueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        let comparison = valueHostsManager.services.dataTypeComparerService.compare(
            valueDetails.value, secondValueDetails.value, valueDetails.lookupKey ?? null, secondValueDetails.lookupKey ?? null);
        if (comparison === ComparersResult.Undetermined) {
            this.logTypeMismatch(valueHostsManager.services, 'value', 'secondValue', valueDetails.value, secondValueDetails.value);

            return ConditionEvaluateResult.Undetermined;
        }
        return this.compareTwoValues(comparison);
    }
    protected abstract compareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;

    public override getValuesForTokens(valueHost: IValidatorsValueHostBase, valueHostsManager: IValueHostsManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostsManager));
        let secondValue = this.config.secondValue;
        
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
