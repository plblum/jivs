/**
 * Base for Conditions that compare the ValueHost's value 
 * against a second ValueHost, from CompareToSecondValueHostConditionBaseConfig.secondValueHostName.
 * @module Conditions/AbstractClasses/CompareToSecondValueHostConditionBase
 */

import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValueHost } from '../Interfaces/ValueHost';
import { ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter } from './../Interfaces/Conditions';
import { TwoValueConditionBaseConfig, TwoValueConditionBase } from './TwoValueConditionBase';
import type { IValidationManager } from '../Interfaces/ValidationManager';

/**
 * ConditionConfig for CompareToSecondValueHostConditionBase.
 */
export interface CompareToSecondValueHostConditionBaseConfig extends TwoValueConditionBaseConfig, SupportsDataTypeConverter {
    /**
     * Associated with secondValueHostName only.
     * Assign to a LookupKey that is associated with a DataTypeConverter.
     * Use it to convert the value prior to comparing, to handle special cases like
     * case insensitive matching ("CaseInsensitive"), rounding a number to an integer ("Round"),
     * just the Day or Month or any other number in a Date object ("Day", "Month").
     */
    secondConversionLookupKey?: string | null;
}

/**
 * Compare the ValueHost's value against a second ValueHost, from 
 * CompareToSecondValueHostConditionBaseConfig.secondValueHostName.
 * 
 * Subclasses implement the actual comparison operator (equals, greater than, etc)
 * 
 * Supports tokens: {CompareTo}, the value from the second value host.
 */
export abstract class CompareToSecondValueHostConditionBase<TConfig extends CompareToSecondValueHostConditionBaseConfig> extends TwoValueConditionBase<TConfig>
{
    public evaluate(valueHost: IValueHost | null, validationManager: IValidationManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, validationManager);
        const value = valueHost.getValue();
        if (value == null)  // null/undefined
        {
            this.logNothingToEvaluate('value', validationManager.services);
            return ConditionEvaluateResult.Undetermined;
        }
        const valueDetails = this.tryConversion(value, valueHost.getDataType(), this.config.conversionLookupKey, validationManager.services); 
        if (valueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        let secondValue: any = undefined;
        let secondValueLookupKey: string | null = null;
        if (this.config.secondValueHostName) {
            const vh2 = this.getValueHost(this.config.secondValueHostName, validationManager);
            if (!vh2) {
                const msg = 'is unknown';
                this.throwInvalidPropertyData('secondValueHostName', msg, validationManager.services);
            }
            secondValue = vh2!.getValue();
            secondValueLookupKey = vh2!.getDataType();
        }
        if (secondValue == null)  // null/undefined
        {
            this.logNothingToEvaluate('secondValue', validationManager.services);
            return ConditionEvaluateResult.Undetermined;
        }
        const secondValueDetails = this.tryConversion(secondValue, secondValueLookupKey, this.config.secondConversionLookupKey, validationManager.services);
        if (secondValueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        const comparison = validationManager.services.dataTypeComparerService.compare(
            valueDetails.value, secondValueDetails.value,
            valueDetails.lookupKey ?? null, secondValueDetails.lookupKey ?? null);
        if (comparison === ComparersResult.Undetermined) {
            this.logTypeMismatch(validationManager.services, 'value', 'secondValue', value, secondValue);

            return ConditionEvaluateResult.Undetermined;
        }
        return this.compareTwoValues(comparison);
    }
    protected abstract compareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;

    public override getValuesForTokens(valueHost: IValidatorsValueHostBase, validationManager: IValidationManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, validationManager));
        let secondValue: any = undefined;
        if (this.config.secondValueHostName) {
            const vh = this.getValueHost(this.config.secondValueHostName, validationManager);
            if (vh)
                secondValue = vh.getValue();
        }
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
