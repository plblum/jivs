/**
 * Base for Conditions that use the value from ValueHost.getTextValue().
 * Most classes use ValueHost.getValue() (the native value).
 * @module Conditions/AbstractClasses/TextValueConditionBase
 */

import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { CodingError } from '../Utilities/ErrorHandling';
import { IValidationManager } from '../Interfaces/ValidationManager';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { toIFieldValueHost } from '../ValueHosts/FieldValueHost';

/**
 * ConditionConfig to use with TextValueConditionBase
 */
export interface TextValueConditionBaseConfig extends OneValueConditionBaseConfig {

}


/**
 * Abstract class for developing Conditions that use the value from ValueHost.getTextValue().
 * Most classes use ValueHost.getValue() (the native value).
 */
export abstract class TextValueConditionBase<TConfig extends TextValueConditionBaseConfig>
    extends OneValueConditionBase<TConfig>
{
    /**
     * Evaluate a value using its business rule and configuration in the Config.
     * @param valueHost - contains both the value from input field/element and the native value resolved by data type.
     * This function checks both in valueHost to determine a string source.
     * @param validationManager 
     */
    public evaluate(valueHost: IValueHost | null, validationManager: IValidationManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, validationManager);
        if (!toIFieldValueHost(valueHost)) {
            let error = new CodingError('Invalid ValueHost used. Must be an FieldValueHost');
            this.logger(validationManager.services).error(error);
        }
        let iValueHost = valueHost as unknown as IFieldValueHost;
        let textValue = iValueHost.getTextValue();
        if (textValue === undefined)
            return ConditionEvaluateResult.Undetermined;

        return this.evaluateTextValue(textValue, iValueHost, validationManager);
    }
    protected abstract evaluateTextValue(textValue: string | undefined, valueHost: IFieldValueHost, validationManager: IValidationManager): ConditionEvaluateResult;
}
