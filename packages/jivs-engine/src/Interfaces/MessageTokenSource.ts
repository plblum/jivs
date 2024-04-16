/**
 * @module InputValidator/Types/MessageTokenSource
 */

import { IInputValueHost } from "./InputValueHost";
import { IValueHostResolver } from "./ValueHostResolver";

export interface IMessageTokenSource {
    /**
     * Returns an array of 0 or more tokens supported by this MessageTokenSource.
     * Each returned has the token supported (omitting {} so {Label} is "Label")
     * and the value in its native data type (such as Date, number, or string).
     * Caller will search the message for each token supplied. If found,
     * it converts the value to a string using localization rules and replaces the token.
     * The TokenLabel doesn't provide {} because we may support additional
     * attributes within the token, like {Value:AbbrevDateFormat}
     */
    getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver):
        Array<TokenLabelAndValue>;
}

/**
 * Determines if the source implements IMessageTokenSource, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIMessageTokenSource(source: any): IMessageTokenSource | null {
    if (source && typeof source === 'object') {
        let test = source as IMessageTokenSource;       
        if (test.getValuesForTokens !== undefined)
            return test;
    }
    return null;
}

/**
 * Result from IMessageTokenSource.getValuesForTokens
 */
export interface TokenLabelAndValue {
    /**
     * The text within the {} of the token. Used to match tokens.
     */
    tokenLabel: string;
    /**
     * The value to be used as a replacement. When the value isn't a string,
     * it is converted to a string through 
     * {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter} classes.
     */
    associatedValue: any;
    /**
     * Provides additional guidance about the token's purpose so the
     * IMessageTokenResolver can apply additional formatting to the token,
     * such as in HTML, a span tag with a specific classname.
     * When null, no additional guidance is offered.
     * Values are:
     * 'label' - the target of the message, such as the ValueHost's label. {Label} is an example
     * 'parameter' - configuration data, such as a ConditionConfig's rules. {Minimum} is an example
     * 'value' - some live data, such as the ValueHost's current value. {Value} is an example
     * 'message' - text just augments the error message, like {ConversionError} of DataTypeCheckCondition
     */
    purpose?: 'label' | 'parameter' | 'value' | 'message';
}


