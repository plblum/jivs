/**
 * {@inheritDoc Services/Types/IMessageTokenResolverService!IMessageTokenResolverService}
 * @module Services/ConcreteClasses/MessageTokenResolverService
 */
import type { DataTypeResolution } from '../Interfaces/DataTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { assertNotNull, CodingError, SevereErrorBase } from '../Utilities/ErrorHandling';
import type { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IMessageTokenResolverService } from '../Interfaces/MessageTokenResolverService';
import { IMessageTokenSource, TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { ServiceWithAccessorBase } from './ServiceWithAccessorBase';
import { IValidationManager } from '../Interfaces/ValidationManager';


/**
 * {@inheritDoc Services/Types/IMessageTokenResolverService!IMessageTokenResolverService}
 */
export class MessageTokenResolverService extends ServiceWithAccessorBase implements IMessageTokenResolverService
{
    /**
     * Used to extract full tokens.
     */
    private readonly _tokensInMessageRegEx = /\{[a-z]\w*(:[a-z]\w*)?\}/ig;
    /**
     * Replaces tokens in the message with user friendly values
     * @param message 
     * @param hosts 
     * @returns the message with formatting resolved
     */
    public resolveTokens(message: string, valueHost: IValidatorsValueHostBase, validationManager: IValidationManager, ...hosts: Array<IMessageTokenSource>): string
    {
        assertNotNull(message, 'message');
        assertNotNull(validationManager, 'valueHostResolver');
        if (!hosts || !hosts.length || hosts[0] == null)    // null/undefined
            throw new CodingError('hosts required');

        // capture all token patterns and build a list of CapturedTokens
        // If none found, return the message
        let foundTokens = message.match(this._tokensInMessageRegEx);
        if (!foundTokens)
            return message;

        let captures: Array<CapturedToken> = [];
        foundTokens.forEach((full) => {
            captures.push(new CapturedToken(full)); 
        });

        let revised = message;
        let allTavs: Array<TokenLabelAndValue> = [];
        hosts.forEach((tokenSource, index) => {
            let tavs = tokenSource.getValuesForTokens(valueHost, validationManager);
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
                if (capturedToken.isMatch(tav))
                {
                    try {
                        let replacement = capturedToken.replacement(tav.associatedValue, validationManager);
                        if (replacement.value !== undefined)
                        {
                            let finalized = this.finalizeReplacement(replacement.value, tav);
                            revised = revised.replace(capturedToken.full, finalized);
                            resolved = true;
                        }
                        else
                            if (replacement.errorMessage)
                            {
                                this.log(()=> `${capturedToken.full}: ${replacement.errorMessage}`,
                                    LoggingLevel.Error, LoggingCategory.Configuration);   
                            }
                    }
                    catch (e)
                    {
                        this.log(()=>`${capturedToken.full}: ${(e as Error).message}`,
                            LoggingLevel.Error, LoggingCategory.TypeMismatch); 
                        if (e instanceof SevereErrorBase)
                            throw e;
                                    
                    }
                }
            }
            if (!resolved)
            {
                //Log token was not replaced
                this.log(()=>`{${capturedToken.full}}: Token not replaced.`,
                    LoggingLevel.Warn); 
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
    protected finalizeReplacement(replacement: string, tav: TokenLabelAndValue): string
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
    public full: string;
/**
 * The token found in full, always lowercase.
 */    
    public token: string;
/**
 * The formatterkey found in full (lowercase) or null if none.
 */    
    public formatterKey: string | null;
    
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
    public isMatch(tav: TokenLabelAndValue): boolean
    {
        return tav.tokenLabel.toLowerCase() === this.token;
    }
/**
 * Generates the replacement string for the full token, using the replacementValue
 * @param replacementValue
 * @param validationManager 
 * @returns 
 */    
    public replacement(replacementValue: any, validationManager: IValidationManager): DataTypeResolution<string>
    {
        return validationManager.services.dataTypeFormatterService.format(replacementValue, this.formatterKey ?? undefined);
    }
}
