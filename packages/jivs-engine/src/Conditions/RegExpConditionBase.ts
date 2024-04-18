/**
 * Base implementation for Conditions that evaluate a string against a regular expression.
 * Very versatile tool for strings, as so many data types are strings with specific patterns
 * that the regular expression can identify. In fact, many of these implementations fit into the
 * Condition category of "DataTypeCheck".
 * This base class is often used to develop specific Conditions that have a built-in regular expression,
 * such as USPhoneNumberCondition and EmailAddressCondition. Both are good examples of "DataTypeCheck" conditions.
 * @module Conditions/AbstractClasses/RegExpConditionBase
 */

import { ConditionEvaluateResult, ConditionCategory } from '../Interfaces/Conditions';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { IValueHost } from '../Interfaces/ValueHost';
import { StringConditionConfig, StringConditionBase } from './StringConditionBase';

/**
 * For any regular expression condition
 */
export interface RegExpConditionBaseConfig extends StringConditionConfig {

}

/**
 * Evaluates the native value, which must be a string, against a regular expression.
 * Very versatile tool for strings, as so many data types are strings with specific patterns
 * that the regular expression can identify.
 * This base class is often used to develop specific Conditions that have a built-in regular expression,
 * such as USPhoneNumberCondition and EmailAddressCondition.
 * The user can also use RegExpCondition as a way to assign a RegExp on demand.
 */
export abstract class RegExpConditionBase<TConfig extends RegExpConditionBaseConfig>
    extends StringConditionBase<TConfig>
{
    protected evaluateString(text: string, valueHost: IValueHost, services: IValidationServices): ConditionEvaluateResult {

        return this.getRegExp(services).test(text) ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }
    /**
     * Return a RegExp for EvaluateString to use.
     * @param services 
     */
    protected abstract getRegExp(services: IValidationServices): RegExp;

    /**
     * Most of time, this represents a pattern that defines a data type, like USPhoneNumber and EmailAddress.
     * Sometimes, the user develops a regular expression with another purpose, like checking an area code
     * of a USPhoneNumber. They should set ConditionConfig.category to Contents
     */
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}
