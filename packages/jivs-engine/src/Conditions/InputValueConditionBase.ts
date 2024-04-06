/**
 * Base implementation for developing Conditions that use the value from ValueHost.getInputValue().
 * Most classes use ValueHost.getValue() (the native value).
 * @module Conditions/AbstractClasses/InputValueConditionBase
 */

import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError } from '../Utilities/ErrorHandling';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { OneValueConditionDescriptor, OneValueConditionBase } from './OneValueConditionBase';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { toIInputValueHost } from '../ValueHosts/InputValueHost';


/**
 * Abstract class for developing Conditions that use the value from ValueHost.getInputValue().
 * Most classes use ValueHost.getValue() (the native value).
 */
export abstract class InputValueConditionBase<TDescriptor extends OneValueConditionDescriptor>
    extends OneValueConditionBase<TDescriptor>
{
    /**
     * Evaluate a value using its business rule and configuration in the Descriptor.
     * @param valueHost - contains both the value from input field/element and the native value resolved by data type.
     * This function checks both in valueHost to determine a string source.
     * @param valueHostResolver 
     */
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        if (!toIInputValueHost(valueHost)) {
            valueHostResolver.services.loggerService.log('Invalid ValueHost used. Must be an InputValueHost',
                LoggingLevel.Error, LoggingCategory.Configuration, 'InputValueConditionBase.Evaluate');
            throw new CodingError('Invalid ValueHost used. Must be an InputValueHost');
        }
        let iValueHost = valueHost as unknown as IInputValueHost;
        let value = iValueHost.getInputValue();
        if (value === undefined)
            return ConditionEvaluateResult.Undetermined;

        return this.evaluateInputValue(value, iValueHost, valueHostResolver);
    }
    protected abstract evaluateInputValue(value: any, valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): ConditionEvaluateResult;
}
