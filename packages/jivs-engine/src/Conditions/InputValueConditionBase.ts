/**
 * Base for Conditions that use the value from ValueHost.getInputValue().
 * Most classes use ValueHost.getValue() (the native value).
 * @module Conditions/AbstractClasses/InputValueConditionBase
 */

import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError } from '../Utilities/ErrorHandling';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { toIInputValueHost } from '../ValueHosts/InputValueHost';

/**
 * ConditionConfig to use with InputValueConditionBase
 */
export interface InputValueConditionBaseConfig extends OneValueConditionBaseConfig {

}


/**
 * Abstract class for developing Conditions that use the value from ValueHost.getInputValue().
 * Most classes use ValueHost.getValue() (the native value).
 */
export abstract class InputValueConditionBase<TConfig extends InputValueConditionBaseConfig>
    extends OneValueConditionBase<TConfig>
{
    /**
     * Evaluate a value using its business rule and configuration in the Config.
     * @param valueHost - contains both the value from input field/element and the native value resolved by data type.
     * This function checks both in valueHost to determine a string source.
     * @param valueHostsManager 
     */
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
        if (!toIInputValueHost(valueHost)) {
            let error = new CodingError('Invalid ValueHost used. Must be an InputValueHost');
            this.logError(valueHostsManager.services, error);
            throw error;
        }
        let iValueHost = valueHost as unknown as IInputValueHost;
        let value = iValueHost.getInputValue();
        if (value === undefined)
            return ConditionEvaluateResult.Undetermined;

        return this.evaluateInputValue(value, iValueHost, valueHostsManager);
    }
    protected abstract evaluateInputValue(value: any, valueHost: IInputValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult;
}
