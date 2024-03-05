import { ConditionEvaluateResult, ConditionCategory } from "../Interfaces/Conditions";
import { IValueHost } from "../Interfaces/ValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { IStringConditionDescriptor, StringConditionBase } from "./StringConditionBase";

/**
 * For any regular expression condition
 */
export interface IRegExpConditionBaseDescriptor extends IStringConditionDescriptor {

}

/**
 * Evaluates the native value, which must be a string, against a regular expression.
 * Very versatile tool for strings, as so many data types are strings with specific patterns
 * that the regular expression can identify.
 * This base class is often used to develop specific Conditions that have a built-in regular expression,
 * such as USPhoneNumberCondition and EmailAddressCondition.
 * The user can also use RegExpCondition as a way to assign a RegExp on demand.
 */
export abstract class RegExpConditionBase<TDescriptor extends IRegExpConditionBaseDescriptor>
    extends StringConditionBase<TDescriptor>
{
    protected EvaluateString(text: string, valueHost: IValueHost, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {

        return this.GetRegExp(valueHostResolver).test(text) ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }
    /**
     * Return a RegExp for EvaluateString to use.
     * @param valueHostResolver 
     */
    protected abstract GetRegExp(valueHostResolver: IValueHostResolver): RegExp;

    /**
     * Most of time, this represents a pattern that defines a data type, like USPhoneNumber and EmailAddress.
     * Sometimes, the user develops a regular expression with another purpose, like checking an area code
     * of a USPhoneNumber. They should set ConditionDescriptor.Category to Contents
     */
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}
