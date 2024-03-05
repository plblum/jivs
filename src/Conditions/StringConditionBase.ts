import { ConditionEvaluateResult } from "../Interfaces/Conditions";
import { IValueHost } from "../Interfaces/ValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { IOneValueConditionDescriptor, OneValueConditionBase } from "./OneValueConditionBase";

/**
 * Abstract implementation of a Condition that evaluates a string as the native value.
 * Supported by IStringConditionDescriptor.
 */
export abstract class StringConditionBase<TConditionDescriptor extends IStringConditionDescriptor>
    extends OneValueConditionBase<TConditionDescriptor>
{
    /**
     * Evaluate a value using its business rule and configuration in the Descriptor.
     * @param valueHost - contains both the value from widget and the native value resolved by data type.
     * This function checks both in valueHost to determine a string source.
     * @param valueHostResolver 
     */
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        valueHost = this.EnsurePrimaryValueHost(valueHost, valueHostResolver);
        let value = this.ResolveValue(valueHost);
        if (value === undefined)
            return ConditionEvaluateResult.Undetermined;

        let text = value as string;
        if (this.Descriptor.Trim ?? true)
            text = text.trim();
        return this.EvaluateString(text, valueHost, valueHostResolver);
    }
    /**
     * Applies the business rule against the string value (already trimmed if 
     * Descriptor.Trim is true).
     * @param text
     * @param valueHostResolver 
     */
    protected abstract EvaluateString(text: string, valueHost: IValueHost, valueHostResolver: IValueHostResolver):
        ConditionEvaluateResult;

    /**
     * Supplies the value found in ValueHost from GetValue.
     * It wants a string and will only return a string or undefined.
     * @param valueHost 
     * @returns 
     */
    protected ResolveValue(valueHost: IValueHost): string | undefined {
        let value = valueHost.GetValue();
        if (typeof value !== 'string')
            return undefined;
        return value;
    }
}

export interface IStringConditionDescriptor extends IOneValueConditionDescriptor {
    /**
     * Indicates that validation is applied only after trimming a string value
     * that is returned by a widget whose native datatype is string.
     */
    Trim?: boolean;
}
