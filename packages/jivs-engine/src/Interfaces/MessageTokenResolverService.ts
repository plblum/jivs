/**
 * @module Services/Types/IMessageTokenResolverService
 */

import { IMessageTokenSource } from "./MessageTokenSource";
import { IValidatorsValueHostBase } from "./ValidatorsValueHostBase";
import { IValueHostResolver } from "./ValueHostResolver";

/**
 * Replaces all tokens in a message with a user friendly value.
 * Tokens are single words within curley braces like {Label}. They are 
 * case insensitive.
 * Tokens can have an optional second part to identify a formatterKey.
 * The syntax is {token:formatterkey}.
 * Legal characters in token and formatterkey are letters, digits, and underscore.
 * These are matched case insensitively.
 * Some values are found in the Validator's ConditionConfig, 
 * such as the {Minimum} and {Maximum} of a RangeCondition. 
 * They need to be formatted according to the data type,
 * such as "number" will convert 1000 into "1,000" and "date" will convert 
 * a javascript Date into "May 20, 2001". This function uses the 
 * {@link Services/ConcreteClasses/ValidationServices!ValidationServices | ValidationServices} to handle conversion and localization.
 * The "formatterkey" in {token:formatterkey} is actually the same
 * as a {@link DataTypes/Types/LookupKey | LookupKey } used to identify a data type.
 * Tokens are supplied by implementers of IMessageTokenSource.
 */
export interface IMessageTokenResolverService {
    /**
     * Replaces tokens in the message with user friendly values
     * @param message 
     * @param valueHost - makes stateful info available to IMessageTokenSources.
     * @param valueHostResolver
     * @param hosts 
     * @returns the message with formatting resolved
     */
    resolveTokens(message: string, valueHost: IValidatorsValueHostBase,
        valueHostResolver: IValueHostResolver, ...hosts: Array<IMessageTokenSource>): string;
}