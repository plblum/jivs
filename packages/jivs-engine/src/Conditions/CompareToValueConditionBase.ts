/**
 * Base for Conditions that compare the ValueHost's against a second value, supplied in 
 * CompareToValueConditionBaseConfig.secondValue.
 * 
 * It is used by these concrete conditions:
 * - equalTo
 * - notEqualTo
 * - greaterThan
 * - lessThan
 * - greaterThanOrEqual
 * - lessThanOrEqual
 * 
 * There are two sources for the value within CompareToValueConditionConfig:
 * - secondValue: The actual value to compare against.
 * - secondValueHostName: The name of the ValueHost that provides the second value.
 * At least one must not be undefined.
 * 
 * ## When using the builder
 * The first parameter of each comparison condition takes either the secondValue or the secondValueHostName,
 * however wrap the second value in the valueHost() function first.
 * ```ts
 * builder.field('field1', LookupKey.String).equalTo(10);
 * builder.field('field1', LookupKey.String).equalTo(valueHost('field2'))
 * ```
 * 
 * @module jivs-engine/Conditions/AbstractClasses/CompareToValueConditionBase
 */

import { ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter } from './../Interfaces/Conditions';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValueHost } from '../Interfaces/ValueHost';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';
import { IValidatorsValueHost } from '../Interfaces/ValidatorsValueHostBase';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ValueHostName } from '../DataTypes/BasicTypes';

/**
 * ConditionConfig for CompareToValueConditionBase.
 */
export interface CompareToValueConditionBaseConfig extends OneValueConditionBaseConfig, SupportsDataTypeConverter {
    /**
     * Native data type representing the right operand of the comparison.
     * Either this or secondValueHostName must have an assignment.
     */
    secondValue?: any;

    /**
     * The name of the ValueHost that provides the second value for comparison.
     * Either this or secondValue must have an assignment.
     */
    secondValueHostName?: string;

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
        const value = valueHost.getValue();
        if (value == null)  // null/undefined
        {
            this.logNothingToEvaluate('value', valueHostsManager.services);
            return ConditionEvaluateResult.Undetermined;
        }

        let secondValueSource = this.config.secondValueHostName !== undefined ? 'secondValueHostName' : 'secondValue';
        let secondValue: any = undefined;
        let secondValueLookupKey: string | null = null;
        try
        {
            let result = this.getSecondValue(valueHostsManager);
            secondValue = result.value;
            secondValueLookupKey = result.valueHost?.getDataType() ?? null;
        } catch (error)
        {
            // will already be logged by getSecondValue
            return ConditionEvaluateResult.Undetermined;
        }
        if (secondValue == null)    // null/undefined
        {
            this.logNothingToEvaluate(secondValueSource, valueHostsManager.services);
            return ConditionEvaluateResult.Undetermined;
        }

        const valueDetails = this.tryConversion(value, valueHost.getDataType(),
            this.config.conversionLookupKey, valueHostsManager.services);
        if (valueDetails.failed)
            return ConditionEvaluateResult.Undetermined;
        
        const secondValueDetails = this.tryConversion(secondValue, secondValueLookupKey,   
            this.config.secondConversionLookupKey, valueHostsManager.services);
        if (secondValueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        const comparison = valueHostsManager.services.dataTypeComparerService.compare(
            valueDetails.value, secondValueDetails.value,
            valueDetails.lookupKey ?? null, secondValueDetails.lookupKey ?? null);
        if (comparison === ComparersResult.Undetermined) {
            this.logTypeMismatch(valueHostsManager.services, 'value', secondValueSource,
                valueDetails.value, secondValueDetails.value);

            return ConditionEvaluateResult.Undetermined;
        }
        return this.compareTwoValues(comparison);
    }
    protected abstract compareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;
    
    public override gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void {
        super.gatherValueHostNames(collection, valueHostsManager);
        if (this.config.secondValueHostName)
            collection.add(this.config.secondValueHostName);
    }
    /**
     * Supports:
     * {CompareTo} - value retrieved
     * {SecondLabel} - label for secondValueHostName
     * @param valueHost 
     * @param valueHostsManager 
     * @returns 
     */
    public override getValuesForTokens(valueHost: IValidatorsValueHost, valueHostsManager: IValueHostsManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostsManager));
        let secondValue: any = null;
        try {
            let result = this.getSecondValue(valueHostsManager);
            secondValue = result.value;
        } catch (error) {
            // will already be logged by getSecondValue
        }
        
        list.push({
            tokenLabel: 'CompareTo',
            associatedValue: secondValue ?? null,
            purpose: 'value'
        });

        let secondLabel: string | null = null;
        if (this.config.secondValueHostName)
        {
            const vh = this.getValueHost(this.config.secondValueHostName, valueHostsManager);
            if (vh)
                secondLabel = vh.getLabel();
        }
        list.push({
            tokenLabel: 'SecondLabel',
            associatedValue: secondLabel ?? '',
            purpose: 'label'
        });

        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }

    /**
     * If ResolveValueHost is used but does not have a known ValueHost,
     * it logs and throws.
     * @param valueHostsManager 
     * @returns 
     */
    protected getSecondValue(valueHostsManager: IValueHostsManager): { valueHost?: IValueHost, value: any; }
    {
        let result = { valueHost: undefined as IValueHost | undefined, value: undefined };
        result.value = this.config.secondValue;
        if (result.value === undefined)
        {
            if (this.config.secondValueHostName != null)    // null or undefined
            {
                let secondValueHost = this.getValueHost(this.config.secondValueHostName, valueHostsManager);
                if (secondValueHost)
                {
                    result.value = secondValueHost.getValue();
                    result.valueHost = secondValueHost;
                }
                else
                {
                    this.logUnknownValueHost(valueHostsManager.services,
                        'secondValueHostName', this.config.secondValueHostName);
                }
            }
            else
                this.throwInvalidPropertyData('secondValue', 'is not assigned', valueHostsManager.services);
        }

        return result;
    }
}
