/**
 * Base for Conditions that evaluate a number value. All other values are treated as ConditionEvaluateResult.Undetermined.
 * The value can be from an object that has a DataTypeConverter to make it into a number.
 * @module jivs-engine/Conditions/AbstractClasses/NumberConditionBaseConfig
 */

import { LookupKey } from '../DataTypes/LookupKeys';
import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValidationManager } from '../Interfaces/ValidationManager';
import { OneValueConditionBase, OneValueConditionBaseConfig } from './OneValueConditionBase';

/**
 * ConditionConfig for {@link NumberConditionBase}
 */
export interface NumberConditionBaseConfig extends OneValueConditionBaseConfig
{

}
/**
 * Base for Conditions that evaluate a number value. All other values are treated as ConditionEvaluateResult.Undetermined.
 * The value can be from an object that has a DataTypeConverter to make it into a number.
 */
export abstract class NumberConditionBase<TConditionConfig extends NumberConditionBaseConfig> extends OneValueConditionBase<TConditionConfig>
{
    constructor(config: TConditionConfig) {
        super(config);
    }
    public evaluate(valueHost: IValueHost | null, validationManager: IValidationManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, validationManager);
        let value = valueHost.getValue();
        if (typeof value !== 'number') {
            const result = validationManager.services.dataTypeConverterService.convertUntilResult(value, null, LookupKey.Number);
            if (result.value === undefined || typeof result.value !== 'number')
                return ConditionEvaluateResult.Undetermined;
            value = result.value;
        }

        return this.evaluateNumber(value, valueHost, validationManager);
    }

    /**
     * Evaluate the value as its already determined to be a number.
     * @param value 
     * @param valueHost 
     * @param validationManager 
     */
    protected abstract evaluateNumber(value: number, valueHost: IValueHost, validationManager: IValidationManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
}