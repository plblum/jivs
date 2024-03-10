import type { IDataTypeResolution } from "../Interfaces/DataTypes";
import { IMessageTokenResolver, IMessageTokenSource, ITokenLabelAndValue } from "../Interfaces/InputValidator";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { LoggingLevel, ConfigurationCategory, TypeMismatchCategory, FormattingCategory } from "../Interfaces/Logger";
import { AssertNotNull, CodingError } from "../Utilities/ErrorHandling";
import { type IValueHostResolver } from "../Interfaces/ValueHostResolver";


/**
 * Replaces all tokens in a message with a user friendly value.
 * Tokens are single words within curley braces like {Label}. They are 
 * case insensitive.
 * Tokens can have an optional second part to identify a formatterKey.
 * The syntax is {token:formatterkey}.
 * Legal characters in token and formatterkey are letters, digits, and underscore.
 * These are matched case insensitively.
 * Some values are found in the Validator's ConditionDescriptor, 
 * such as the {Minimum} and {Maximum} of a RangeCondition. 
 * They need to be formatted according to the data type,
 * such as "number" will convert 1000 into "1,000" and "date" will convert 
 * a javascript Date into "May 20, 2001". This function uses the 
 * Services.DataTypeResolver to handle conversion and localization.
 * The "formatterkey" in {token:formatterkey} is actually the same
 * as a LookupKey in the DataTypeResolver and its DataTypeLocalizations.
 * Tokens are supplied by implementers of IMessageTokenSource.
 */
export class MessageTokenResolver implements IMessageTokenResolver
{
    /**
     * Used to extract full tokens.
     */
    private readonly tokensInMessageRegEx = /\{[a-z]\w*(\:[a-z]\w*)?\}/ig;
    /**
     * Replaces tokens in the message with user friendly values
     * @param message 
     * @param hosts 
     * @returns the message with formatting resolved
     */
    public ResolveTokens(message: string, valueHost: IInputValueHost, valueHostResolver: IValueHostResolver, ...hosts: Array<IMessageTokenSource>): string
    {
        AssertNotNull(message, 'message');
        AssertNotNull(valueHostResolver, 'valueHostResolver');
        if (!hosts || !hosts.length || hosts[0] == null)    // null/undefined
            throw new CodingError(`hosts required`);
        const fnName = 'MessageTokenResolver.ResolveTokens';
        // capture all token patterns and build a list of CapturedTokens
        // If none found, return the message
        let foundTokens = message.match(this.tokensInMessageRegEx);
        if (!foundTokens)
            return message;

        let captures: Array<CapturedToken> = [];
        foundTokens.forEach((full) => {
            captures.push(new CapturedToken(full)); 
        });

        let revised = message;
        let allTavs: Array<ITokenLabelAndValue> = [];
        hosts.forEach((tokenSource, index) => {
            let tavs = tokenSource.GetValuesForTokens(valueHost, valueHostResolver);
            if (tavs)
                allTavs = allTavs.concat(tavs);
        });
        // apply each capturedToken. If the token was not declared in allTavs
        // it is left unchanged.
        captures.forEach((capturedToken) => {
            let resolved = false;
            for (let i = 0; !resolved && (i < allTavs.length); i++)
            {
                let tav = allTavs[i];
                if (capturedToken.IsMatch(tav))
                {
                    try {
                        let replacement = capturedToken.Replacement(tav.AssociatedValue, valueHostResolver);
                        if (replacement.Value !== undefined)
                        {
                            let finalized = this.FinalizeReplacement(replacement.Value, tav);
                            revised = revised.replace(capturedToken.full, finalized);
                            resolved = true;
                        }
                        else
                            if (replacement.ErrorMessage)
                            {
                                valueHostResolver.Services.LoggerService.Log(`${capturedToken.full}: ${replacement.ErrorMessage}`,
                                    LoggingLevel.Error, ConfigurationCategory, fnName);   
                            }
                    }
                    catch (e)
                    {
                        valueHostResolver.Services.LoggerService.Log(`${capturedToken.full}: ${(e as Error).message}`,
                            LoggingLevel.Error, TypeMismatchCategory, fnName); 
                    }
                }
            }
            if (!resolved)
            {
                //Log token was not replaced
                valueHostResolver.Services.LoggerService.Log(`{${capturedToken.full}}: Token not replaced.`,
                    LoggingLevel.Warn, FormattingCategory, fnName); 
            }
        });
        return revised;
    }

/**
 * Allows for any additional changes to the replacement for the token.
 * Override to apply custom formatting based on tav.Purpose,
 * such as an HTML span tag with a particular class 
 * enclosing the formatted value.
 * @param tav 
 */    
    protected FinalizeReplacement(replacement: string, tav: ITokenLabelAndValue): string
    {
        return replacement;
    }
}
/**
 * Internally used by MessageTokenResolver to reflect
 * a single token found in the message.
 * All tokens are in this pattern:
 * "{token}" for example {Value}
 * "{token:formatterKey}" For example {Value:AbbrevDate}
 */
class CapturedToken
{
    constructor(full: string)
    {
        this.full = full;
        this.token = '';    // to avoid compiler complaining about uninited field
        this.formatterKey = null;   // ditto
        this.extractParts(full);
    }

/**
 * The complete token including curly braces.
 * This string will be replaced in the message.
 */    
    full: string;
/**
 * The token found in full, always lowercase.
 */    
    token: string;
/**
 * The formatterkey found in full (lowercase) or null if none.
 */    
    formatterKey: string | null;
    
    private extractParts(full: string): void
    {
        full = full.substring(1, full.length - 1).toLowerCase();    // strips {}
        let splitPos = full.indexOf(':');
        if (splitPos >= 0)
        {
            this.token = full.substring(0, splitPos);  // text prior to colon
            this.formatterKey = full.substring(splitPos + 1);  // text after the colon
        }
        else
        {
            this.token = full;
            this.formatterKey = null;
        }
    }

/**
 * Is the TAV a match to this capture?
 * @param tav 
 * @returns 
 */    
    public IsMatch(tav: ITokenLabelAndValue): boolean
    {
        return tav.TokenLabel.toLowerCase() === this.token;
    }
/**
 * Generates the replacement string for the full token, using the replacementValue
 * @param replacementValue
 * @param validationManager 
 * @returns 
 */    
    public Replacement(replacementValue: any, valueHostResolver: IValueHostResolver): IDataTypeResolution<string>
    {
        return valueHostResolver.Services.DataTypeResolverService.Format(replacementValue, this.formatterKey ?? undefined);
    }
}
