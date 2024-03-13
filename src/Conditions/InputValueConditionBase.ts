/**
 * Base implementation for developing Conditions that use the value from ValueHost.GetInputValue.
 * Most classes use ValueHost.GetValue (the native value).
 * @module Conditions/InputValueConditionBase
 */

import { ConditionEvaluateResult } from "../Interfaces/Conditions";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { IValueHost } from "../Interfaces/ValueHost";
import { LoggingLevel, ConfigurationCategory } from "../Interfaces/Logger";
import { CodingError } from "../Utilities/ErrorHandling";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { IOneValueConditionDescriptor, OneValueConditionBase } from "./OneValueConditionBase";
import { ToIInputValueHost } from "../ValueHosts/InputValueHost";

/**
 * Abstract class for developing Conditions that use the value from ValueHost.GetInputValue.
 * Most classes use ValueHost.GetValue (the native value).
 */
export abstract class InputValueConditionBase<TDescriptor extends IOneValueConditionDescriptor>
    extends OneValueConditionBase<TDescriptor>
{
    /**
     * Evaluate a value using its business rule and configuration in the Descriptor.
     * @param valueHost - contains both the value from input field/element and the native value resolved by data type.
     * This function checks both in valueHost to determine a string source.
     * @param valueHostResolver 
     */
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        valueHost = this.EnsurePrimaryValueHost(valueHost, valueHostResolver);
        if (!ToIInputValueHost(valueHost)) {
            valueHostResolver.Services.LoggerService.Log('Invalid ValueHost used. Must be an InputValueHost',
                LoggingLevel.Error, ConfigurationCategory, 'InputValueConditionBase.Evaluate');
            throw new CodingError('Invalid ValueHost used. Must be an InputValueHost');
        }
        let iValueHost = valueHost as unknown as IInputValueHost;
        let value = iValueHost.GetInputValue();
        if (value === undefined)
            return ConditionEvaluateResult.Undetermined;

        return this.EvaluateInputValue(value, iValueHost, valueHostResolver);
    }
    protected abstract EvaluateInputValue(value: any, valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): ConditionEvaluateResult;
}
