import { ConditionEvaluateResult } from "../Interfaces/Conditions";
import { IInputValueHost, ToIInputValueHost } from "../Interfaces/InputValueHost";
import { IValueHost } from "../Interfaces/ValueHost";
import { LoggingLevel, ConfigurationCategory } from "../Interfaces/Logger";
import { CodingError } from "../Utilities/ErrorHandling";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { IOneValueConditionDescriptor, OneValueConditionBase } from "./OneValueConditionBase";

/**
 * Abstract class for developing Conditions that use the value from ValueHost.GetWidgetValue.
 * Most classes use ValueHost.GetValue (the native value).
 */
export abstract class WidgetConditionBase<TDescriptor extends IOneValueConditionDescriptor>
    extends OneValueConditionBase<TDescriptor>
{
    /**
     * Evaluate a value using its business rule and configuration in the Descriptor.
     * @param valueHost - contains both the value from widget and the native value resolved by data type.
     * This function checks both in valueHost to determine a string source.
     * @param valueHostResolver 
     */
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        valueHost = this.EnsurePrimaryValueHost(valueHost, valueHostResolver);
        if (!valueHost || !ToIInputValueHost(valueHost)) {
            valueHostResolver.Services.LoggerService.Log('Invalid ValueHost used. Must be an InputValueHost',
                LoggingLevel.Error, ConfigurationCategory, 'WidgetConditionBase.Evaluate');
            throw new CodingError('Invalid ValueHost used. Must be an InputValueHost');
        }
        let iValueHost = valueHost as unknown as IInputValueHost;
        let value = iValueHost.GetWidgetValue();
        if (value === undefined)
            return ConditionEvaluateResult.Undetermined;

        return this.EvaluateWidgetValue(value, iValueHost, valueHostResolver);
    }
    protected abstract EvaluateWidgetValue(value: any, valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): ConditionEvaluateResult;
}
