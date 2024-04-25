/**
 * Base for Conditions that compare the ValueHost's against a second value, supplied in 
 * CompareToValueConditionBaseConfig.secondValue.
 * The Config introduces valueHostName.
 * @module Conditions/AbstractClasses/CompareToValueConditionBase
 */

import { IValueHostResolver } from './../Interfaces/ValueHostResolver';
import { ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter } from './../Interfaces/Conditions';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { LoggingLevel, LoggingCategory } from '../Interfaces/LoggerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValueHost } from '../Interfaces/ValueHost';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';

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
     * Assign to a LookupKey that is associated with a DataTypeConverter.
     * Use it to convert the value prior to comparing, to handle special cases like
     * case insensitive matching ("CaseInsensitive"), rounding a number to an integer ("Round"),
     * just the Day or Month or any other number in a Date object ("Day", "Month").
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
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.getValue();
        if (value == null)  // null/undefined
            return ConditionEvaluateResult.Undetermined;
        let secondValue: any = undefined;

        if (this.config.secondValue == null)    // null/undefined
        {
            const msg = 'secondValue lacks value to evaluate';
            this.logInvalidPropertyData('secondValue', msg, valueHostResolver);
            return ConditionEvaluateResult.Undetermined;
        }
        secondValue = this.config.secondValue;

        let comparison = valueHostResolver.services.dataTypeComparerService.compare(
            value, secondValue,
            this.config.conversionLookupKey ?? valueHost.getDataType(), this.config.secondConversionLookupKey ?? null);
        if (comparison === ComparersResult.Undetermined) {
            valueHostResolver.services.loggerService.log('Type mismatch. Value cannot be compared to secondValue',
                LoggingLevel.Warn, LoggingCategory.TypeMismatch, `${this.constructor.name} for ${valueHost.getName()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        return this.compareTwoValues(comparison);
    }
    protected abstract compareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;

    public override getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostResolver));
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
