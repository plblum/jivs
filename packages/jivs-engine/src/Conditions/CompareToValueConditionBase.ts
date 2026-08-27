/**
 * Base for Conditions that compare the ValueHost's against a second value, supplied in 
 * CompareToValueConditionBaseConfig.secondValue.
 * 
 * The second value can come from a ValueHost by supplying
 * the ResolveValueHost class to specify the second ValueHost.
 * All other values are treated as the actual value.
 * 
 * ResolveValueHost has a supporting function, valueHost(valueHostName),
 * that creates it so that its easy to write this syntax in the builder:
 * ```ts
 * builder.field('field1', LookupKey.String).equalTo(valueHost('myValueHostName'))
 * instead of
 * builder.field('field1', LookupKey.String).equalTo(new ResolveValueHost('myValueHostName'))
 * ```
 * This makes the builder syntax cleaner and easier to read.
 * @module jivs-engine/Conditions/AbstractClasses/CompareToValueConditionBase
 */

import { ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter } from './../Interfaces/Conditions';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValueHost } from '../Interfaces/ValueHost';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';

/**
 * ConditionConfig for CompareToValueConditionBase.
 */
export interface CompareToValueConditionBaseConfig extends OneValueConditionBaseConfig, SupportsDataTypeConverter {
    /**
     * Native data type representing the right operand of the comparison.
     * Can be a direct value or a reference to another ValueHost using ResolveValueHost.
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
        const value = valueHost.getValue();
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

        const valueDetails = this.tryConversion(value, valueHost.getDataType(),
            this.config.conversionLookupKey, valueHostsManager.services);
        if (valueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        // !!! The secondValue initially is expected to be a native data type.
        // !!! However, this isn't ideal. We should offer config.secondValueLookupKey   
        let secondValue: any = undefined;
        try {
            secondValue = this.getSecondValue(valueHostsManager);
        } catch (error)
        {            
            // will already be logged by getSecondValue
            return ConditionEvaluateResult.Undetermined;
        }
        
        const secondValueDetails = this.tryConversion(secondValue, null,   
            this.config.secondConversionLookupKey, valueHostsManager.services);
        if (secondValueDetails.failed)
            return ConditionEvaluateResult.Undetermined;

        const comparison = valueHostsManager.services.dataTypeComparerService.compare(
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
        let secondValue: any = '';
        try {
            secondValue = this.getSecondValue(valueHostsManager);
        } catch (error) {
            // will already be logged by getSecondValue
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

    /**
     * If ResolveValueHost is used but does not have a known ValueHost,
     * it logs and throws.
     * @param valueHostsManager 
     * @returns 
     */
    protected getSecondValue(valueHostsManager: IValueHostsManager): any {
        const secondValue = this.config.secondValue;
        if (secondValue instanceof ResolveValueHost)
        {
            try
            {
                return secondValue.getValue(valueHostsManager); // may throw exception
            }
            catch (error)
            {
                this.logUnknownValueHost(valueHostsManager.services, secondValue.valueHostName);
                throw error;    // rethrow
            }
        }
        return secondValue;
    }
}

/**
 * Special value passed into CompareToValueConditionBase subclasses
 * as the secondValue in the condition configuration.
 * CompareToValueConditionBase recognizes it as a reference to another ValueHost and retrieves its value accordingly.
 * 
 * When working with the Builder, you can use the helper function `valueHost(valueHostName)` to create an instance of ResolveValueHost, making it easier to reference other ValueHosts in the condition configuration.
 * ```ts
 * builder.field('field1', LookupKey.String).equalTo(valueHost('myValueHostName'))
 * // instead of
 * builder.field('field1', LookupKey.String).equalTo(new ResolveValueHost('myValueHostName'))
 * ```
 */
export class ResolveValueHost
{
    constructor(public valueHostName: string) {}
    public getValue(valueHostsManager: IValueHostsManager): any
    {
        let vh = valueHostsManager.getValueHost(this.valueHostName);
        if (!vh)
            throw new Error(`ValueHost with name ${this.valueHostName} not found`);
        return vh.getValue();
    }
}
/**
 * Helper function to create an instance of ResolveValueHost for referencing another 
 * ValueHost in condition configurations.
 * 
 * @param valueHostName The name of the ValueHost to reference.
 * @returns An instance of ResolveValueHost pointing to the specified ValueHost.
 */
export function valueHost(valueHostName: string): ResolveValueHost {
    return new ResolveValueHost(valueHostName);
}