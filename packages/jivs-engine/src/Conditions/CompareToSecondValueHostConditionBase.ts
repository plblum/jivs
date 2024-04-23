/**
 * Base for Conditions that compare the ValueHost's value 
 * against a second ValueHost, from CompareToSecondValueHostConditionBaseConfig.secondValueHostName.
 * @module Conditions/AbstractClasses/CompareToSecondValueHostConditionBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { LoggingLevel, LoggingCategory } from '../Interfaces/LoggerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter } from './../Interfaces/Conditions';
import { TwoValueConditionBaseConfig, TwoValueConditionBase } from './TwoValueConditionBase';

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
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.getValue();
        if (value == null)  // null/undefined
            return ConditionEvaluateResult.Undetermined;
        let secondValue: any = undefined;
        let secondValueLookupKey: string | null = null;
        if (this.config.secondValueHostName) {
            let vh2 = this.getValueHost(this.config.secondValueHostName, valueHostResolver);
            if (!vh2) {
                const msg = 'secondValueHostName is unknown';
                this.logInvalidPropertyData('secondValueHostName', msg, valueHostResolver);
                return ConditionEvaluateResult.Undetermined;
            }
            secondValue = vh2.getValue();
            secondValueLookupKey = this.config.secondConversionLookupKey ?? vh2.getDataType();
        }
        if (secondValue == null)  // null/undefined
        {
            const msg = 'secondValue lacks value to evaluate';
            this.logInvalidPropertyData('secondValue', msg, valueHostResolver);
            return ConditionEvaluateResult.Undetermined;
        }

        let comparison = valueHostResolver.services.dataTypeComparerService.compare(
            value, secondValue,
            this.config.conversionLookupKey ?? valueHost.getDataType(), secondValueLookupKey);
        if (comparison === ComparersResult.Undetermined) {
            valueHostResolver.services.loggerService.log('Type mismatch. Value cannot be compared to secondValue',
                LoggingLevel.Warn, LoggingCategory.TypeMismatch, `${this.constructor.name} for ${valueHost.getName()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        return this.compareTwoValues(comparison);
    }
    protected abstract compareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        super.gatherValueHostNames(collection, valueHostResolver);
        if (this.config.secondValueHostName)
            collection.add(this.config.secondValueHostName);
    }

    public override getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostResolver));
        let secondValue: any = undefined;
        if (this.config.secondValueHostName) {
            let vh = this.getValueHost(this.config.secondValueHostName, valueHostResolver);
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
