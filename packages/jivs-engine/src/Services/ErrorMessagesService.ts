/**
 * @module jivs-engine/Services/ConcreteClasses/ErrorMessagesService
 */
import { CultureToText, IErrorMessagesService, LocalizedDetailsResult } from '../Interfaces/ErrorMessagesService';
import { cultureLanguageCode } from './CultureService';
import { ServiceBase } from './ServiceBase';
import { assertValidFallbacks } from '../Interfaces/Services';
import { toIDisposable } from '../Interfaces/General_Purpose';

/**
 * Supports the `errorMessage` and `summaryMessage` properties of `Validators` in two ways:
 *    - It provides a reusable library of default strings, avoiding the need to configure 
 *        the same messages on every `Validator`.
 *    - It provides localized versions of those strings and of text used to replace tokens within them.
 * 
 * It supports having fallbacks, so the app can have a standard implementation
 * and another that introduces special cases.
 * 
 * To set that up:
 * ```ts
 * let vs = createJivsServices(); // provides the standard case in vs.errorMessagesService
 * let special = new ErrorMessagesService();
 * special.fallbackService = vs.errorMessagesService;
 * vs.errorMessagesService = special;
 * ```
 * 
 * There are two text values associated with localization:
 * - A lookup key. A short code that maps to the actual string for each culture.
 * - Fallback text. The text supplied when the lookup key does not have
 *   anything to offer for the given culture.
 */
export class ErrorMessagesService extends ServiceBase implements IErrorMessagesService
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public override dispose(): void
    {
        super.dispose();
        toIDisposable(this._fallbackService)?.dispose();
        this._fallbackService = undefined!;
        (this._l10nKeyMap as any) = undefined;
    }        
    /**
     * Reference to a fallback of the same service or null if no fallback.
     * When assigned, a call to any function (except registration) will
     * first try itself, and if not found, try the fallback.
     */    
    public get fallbackService(): IErrorMessagesService | null
    {
        return this._fallbackService;
    }
    public set fallbackService(service: IErrorMessagesService | null)
    {
        assertValidFallbacks(service, this);
        this._fallbackService = service;
    }
    private _fallbackService: IErrorMessagesService | null = null;

    /**
     * Returns the localized version of the text for the given culture.
     * Will try language+region first, if supplied. Fall back to the language alone.
     * Then fall back to a code called '*'.
     * You will have to register the '*' code along with your language code translations if you want
     * support of '*'.
     * service.Register('TRUE', {
     *     '*': 'true',
     *     'en': 'true',
     *     'en-US': 'true',
     *     'en-LA': 'PRO', // entirely fake culture (English is Los Angeles) that uses "PRO" and "CON" for this example :)
     *     'es': 'verdadero'
     * });
     * If nothing is matched, it returns the fallback text.
     * @param cultureIdToMatch - Tries to match the full culture ID first (like 'en-US'), 
     * then the language code (like 'en').
     * It will always attempt to match to '*' if the language code doesn't match.
     * @param l10nKey - Localization key, which is the text that identifies which word,
     * phrase, or other block of text is requested. If '' or null, no localization is requested.
     * @param fallback - Used when there was no match for the culture or '*'.
     * Only supply '' if you are sure that registered data will always supply a value.
     * @returns The localized text or the fallback text.
     */
    public localize(cultureIdToMatch: string, l10nKey: string | null, fallback: string | null): string | null
    {
        // right now this function and localizeWithDetails are
        // parallel implementations. If you change one, change the other.
        // This is to keep this version as fast as possible.
        if (!l10nKey)   // including '', null and undefined
            return fallback;

        const mapped = this._l10nKeyMap.get(l10nKey);
        if (mapped)
        {
            if (cultureIdToMatch.includes('-')) {
                let text = mapped[cultureIdToMatch];
                if (text !== undefined)
                    return text;
            }
            let text = mapped[cultureLanguageCode(cultureIdToMatch)];
            if (text !== undefined)
                return text;
            text = mapped['*'];
            if (text !== undefined)
                return text;
        }
        else if (this.ensureLazyLoaded())
        {
            // try again now that we've lazy loaded
            return this.localize(cultureIdToMatch, l10nKey, fallback);  //! recursion
        }
        if (this.fallbackService !== null)
            return this.fallbackService.localize(cultureIdToMatch, l10nKey, fallback);
        return fallback;
    }

    /**
     * Localizes the given text with additional details.
     * See localize() for more information.
     * This targets the ConfigAnalysis.
     * @param cultureIdToMatch - The culture ID to match for localization.
     * @param l10nKey - The localization key.
     * @param fallback - The fallback text to use if localization fails.
     * @returns An object containing the localized text, localization result, requested culture ID, and actual culture ID.
     */
    public localizeWithDetails(cultureIdToMatch: string, l10nKey: string | null, fallback: string | null):
        LocalizedDetailsResult
    {
        // right now this function and localize() are
        // parallel implementations. If you change one, change the other.
        // This is to keep the localize() version as fast as possible.
        
        const r: LocalizedDetailsResult = {
            result: (fallback != null) ? 'fallback' : 'notFound',
            requestedCultureId: cultureIdToMatch,
            text: fallback != null ? fallback : undefined
        };
        if (!l10nKey)   // including '', null and undefined
            return r;

        const mapped = this._l10nKeyMap.get(l10nKey);
        if (mapped)
        {
            if (cultureIdToMatch.includes('-')) {
                let text = mapped[cultureIdToMatch];
                if (text !== undefined) {
                    r.text = text;
                    r.actualCultureId = cultureIdToMatch;
                    r.result = 'localized';
                    return r;
                }
            }
            const languageCode = cultureLanguageCode(cultureIdToMatch);
            let text = mapped[languageCode];
            if (text !== undefined) {
                r.text = text;
                r.actualCultureId = languageCode;
                r.result = 'localized';
                return r;
            }
            text = mapped['*'];
            if (text !== undefined) {
                r.text = text;
                r.actualCultureId = '*';
                r.result = 'localized';
                return r;
            }
        }
        else if (this.ensureLazyLoaded())
        {
            // try again now that we've lazy loaded
            return this.localizeWithDetails(cultureIdToMatch, l10nKey, fallback);  //! recursion
        }
        if (this.fallbackService !== null)
            return this.fallbackService.localizeWithDetails(cultureIdToMatch, l10nKey, fallback);
        return r;
    }

    /**
     * Attempts to get the localized error message for the ErrorCode and optional DataTypeLookupKey.
     * If dataTypeLookupKey is supplied and no match is found, it tries with just the ErrorCode.
     * @param errorCode  - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @param dataTypeLookupKey 
     * @returns The error message or null if not available.
     */
    public getErrorMessage(cultureIdToMatch: string, errorCode: string, dataTypeLookupKey: string | null): string | null
    {
        let text = this.localize(cultureIdToMatch, ErrorMessagesService.getErrorMessagel10nText(errorCode, dataTypeLookupKey), null);
        if (text === null && dataTypeLookupKey)
            text = this.localize(cultureIdToMatch, ErrorMessagesService.getErrorMessagel10nText(errorCode, null), null);
        if (text === null && this.fallbackService !== null)
            return this.fallbackService.getErrorMessage(cultureIdToMatch, errorCode, dataTypeLookupKey);        
        return text;
    }
    /**
     * Constructs the l10nText for the Error Message.
     * @param errorCode  - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @param dataTypeLookupKey 
     * @returns 
     */
    public static getErrorMessagel10nText(errorCode: string, dataTypeLookupKey: string | null): string
    {
        let l10nText = 'EM-' + errorCode;
        if (dataTypeLookupKey)
            l10nText += '-' + dataTypeLookupKey;
        return l10nText;
    }

    /**
     * Attempts to get the localized Summary error message for the ErrorCode and optional DataTypeLookupKey
     * If dataTypeLookupKey is supplied and no match is found, it tries with just the ErrorCode.
     * @param errorCode  - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @param dataTypeLookupKey 
     * @returns The Summary error message or null if not available.
     */
    public getSummaryMessage(cultureIdToMatch: string, errorCode: string, dataTypeLookupKey: string | null): string | null
    {
        let text = this.localize(cultureIdToMatch, ErrorMessagesService.getSummaryMessagel10nText(errorCode, dataTypeLookupKey), null);
        if (text === null && dataTypeLookupKey)
            text = this.localize(cultureIdToMatch, ErrorMessagesService.getSummaryMessagel10nText(errorCode, null), null);
        if (text === null && this.fallbackService !== null)
            return this.fallbackService.getSummaryMessage(cultureIdToMatch, errorCode, dataTypeLookupKey);                
        return text;
    }
    /**
     * Constructs the l10nText for the Summary error message.
     * @param errorCode  - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @param dataTypeLookupKey 
     * @returns 
     */
    public static getSummaryMessagel10nText(errorCode: string, dataTypeLookupKey: string | null): string
    {
        let l10nText = 'SEM-' + errorCode;
        if (dataTypeLookupKey)
            l10nText += '-' + dataTypeLookupKey;
        return l10nText;
    }

    /**
     * Attempts to get the localized name for a data type lookup key to be used in {DataType} token of error messages.
     * @param dataTypeLookupKey 
     * @returns The name or null if not available.
     */
    public getDataTypeLabel(cultureIdToMatch: string, dataTypeLookupKey: string): string | null
    {
        const text = this.localize(cultureIdToMatch, this.getDataTypeNamel10nText(dataTypeLookupKey), null);
        if (text === null && this.fallbackService !== null)
            return this.fallbackService.getDataTypeLabel(cultureIdToMatch, dataTypeLookupKey);  
        if (text === null && dataTypeLookupKey)
            return dataTypeLookupKey;
        return text;
    }    

    protected getDataTypeNamel10nText(dataTypeLookupKey: string): string
    {
        return 'DTLK-' + dataTypeLookupKey;
    }    

    /**
     * Registers a lookup key with the culture specific text.
     * Replaces an already registered entry with the same l10nKey.
     * @param l10nKey - Localization key, which is the text that identifies which word,
     * phrase, or other block of text is requested.
     * @param cultureToText - keys are language codes from cultureId, like 'en'.
     * values are the actual text to output.
     */
    public register(l10nKey: string, cultureToText: CultureToText): void
    {
        this._l10nKeyMap.set(l10nKey, cultureToText);
    }

    /**
     * Utility to add an error message for a validator.
     * The localization key (l10ntext) will use this pattern:
     * 'EM-' + ErrorCode + '-' + DataTypeLookupKey
     * 'EM-' + ErrorCode   // this is a fallback
     * @param errorCode - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @param dataTypeLookupKey - optional. 
     * @param cultureToText 
     */
    public registerErrorMessage(errorCode: string, dataTypeLookupKey: string | null, cultureToText : CultureToText) : void
    {
        this.register(ErrorMessagesService.getErrorMessagel10nText(errorCode, dataTypeLookupKey), cultureToText);
    }
    /**
     * Utility to add a summary error message for a validator
     * The localization key (l10ntext) will use this pattern:
     * 'SEM-' + ErrorCode + '-' + DataTypeLookupKey
     * 'SEM-' + ErrorCode   // this is a fallback
     * @param errorCode - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @param dataTypeLookupKey - optional. 
     * @param cultureToText 
     */
    public registerSummaryMessage(errorCode: string, dataTypeLookupKey: string | null, cultureToText : CultureToText) : void
    {
        this.register(ErrorMessagesService.getSummaryMessagel10nText(errorCode, dataTypeLookupKey), cultureToText);
    }    

    /**
     * Utility to add text representation of a data type associating it with its 
     * dataTypeLookupKey. The text is used with the {DataType} token in error messages.
     * The localization key (l10ntext) will use this pattern:
     * 'DTLK-' + DataTypeLookupKey
     * @param dataTypeLookupKey
     * @param cultureToText 
     */
    public registerDataTypeLabel(dataTypeLookupKey: string, cultureToText: CultureToText): void
    {
        this.register(this.getDataTypeNamel10nText(dataTypeLookupKey), cultureToText);
    }


    /**
     * Data is stored here, where the key is the l10nKey and the value
     * is the object that maps cultureId to its text.
     * {
     *   'HELLO' :  // l10nKey
     *   {
     *      '*': 'hello',
     *      'en': 'hello',
     *      'sp': 'hola'
     *   },
     *   'YES':
     *   {
     *      '*': 'yes',
     *      'en': 'yes',
     *      'sp': 'sí'
     *   },
     * }
     */
    private readonly _l10nKeyMap: Map<string, CultureToText> = new Map<string, CultureToText>();


    /**
     * Sets up a function to lazy load the configuration when the localize() function 
     * tries and fails to match a request.
     */
    public set lazyLoad(fn: (service: ErrorMessagesService) => void)
    {
        this._lazyLoader = fn;
    }

    private _lazyLoader: null | ((service: ErrorMessagesService) => void) = null;

    /**
     * Runs the lazyload function if setup and returns true if run.
     * @returns 
     */
    protected ensureLazyLoaded(): boolean
    {
        if (this._lazyLoader) {
            // prevent recursion by disabling the feature right away
            const fn = this._lazyLoader;
            this._lazyLoader = null;
            fn(this);
            return true;
        }
        return false;
    }

}
