/**
 * @module Services/ConcreteClasses/TextLocalizerService
 */
import { CultureToText, ITextLocalizerService } from '../Interfaces/TextLocalizerService';
import { cultureLanguageCode } from '../Services/CultureService';
import { ServiceBase } from './ServiceBase';
import { assertValidFallbacks } from '../Interfaces/Services';
import { toIDisposable } from '../Interfaces/General_Purpose';

/**
 * A service to offer text alternatives to the default text
 * based on cultureId.
 * 
 * It supports having fallbacks, so the app can have a standard implementation
 * and another that introduces special cases.
 * 
 * To set that up:
 * ```ts
 * let vs = createValidationServices(); // provides the standard case in vs.textLocalizerService
 * let special = new TextLocalizerService();
 * special.fallbackService = vs.textLocalizerService;
 * vs.textLocalizerService = special;
 * ```
 * 
 * This implementation is independent of third party libraries
 * that you may be using. 
 * Thus, you may prefer to implement ITextLocalizerService yourself.
 * 
 * There are two text values associated with localization:
 * - A lookup key. A short code that maps to the actual string for each culture.
 * - Fallback text. The text supplied when the lookup key does not have
 *   anything to offer for the given culture.
 */
export class TextLocalizerService extends ServiceBase implements ITextLocalizerService
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        super.dispose();
        toIDisposable(this._fallbackService)?.dispose();
        (this._fallbackService as any) = undefined;
        (this._l10nKeyMap as any) = undefined;
    }        
    /**
     * Reference to a fallback of the same service or null if no fallback.
     * When assigned, a call to any function (except registration) will
     * first try itself, and if not found, try the fallback.
     */    
    public get fallbackService(): ITextLocalizerService | null
    {
        return this._fallbackService;
    }
    public set fallbackService(service: ITextLocalizerService | null)
    {
        assertValidFallbacks(service, this);
        this._fallbackService = service;
    }
    private _fallbackService: ITextLocalizerService | null = null;

    /**
     * Sets up a function to lazy load the configuration when any of the other
     * functions are called.
     */
    public set lazyLoad(fn: (service: TextLocalizerService) => void)
    {
        this._lazyLoader = fn;
    }

    private _lazyLoader: null | ((service: TextLocalizerService) => void) = null;

    protected ensureLazyLoaded(): void
    {
        if (this._lazyLoader) {
            // prevent recursion by disabling the feature right away
            let fn = this._lazyLoader;
            this._lazyLoader = null;
            fn(this);
        }
    }

    /**
     * Returns the localized version of the text for the given culture.
     * Will try the language from the culture ('en' from 'en-US')
     * and a code called '*' to be used as a general fallback. You will have to 
     * register the '*' code along with your language code translations if you want
     * support of '*'.
     * service.Register('TRUE', {
     *     '*': 'true',
     *     'en': 'true',
     *     'es': 'verdadero'
     * });
     * If nothing is matched, it returns the fallback text.
     * @param cultureIdToMatch - It will only use the language code part, like 'en' in 'en-US'.
     * It will always attempt to match to '*' if the language code doesn't match.
     * @param l10nKey - Localization key, which is the text that identifies which word,
     * phrase, or other block of text is requested. If '' or null, no localization is requested.
     * @param fallback - Used when there was no match for the culture or '*'.
     * Only supply '' if you are sure that registered data will always supply a value.
     * @returns The localized text or the fallback text.
     */
    public localize(cultureIdToMatch: string, l10nKey: string | null, fallback: string | null): string | null
    {
        this.ensureLazyLoaded();

        if (!l10nKey)   // including '', null and undefined
            return fallback;

        let mapped = this._l10nKeyMap.get(l10nKey);
        if (mapped)
        {
            let text = mapped[cultureLanguageCode(cultureIdToMatch)];
            if (text !== undefined)
                return text;
            text = mapped['*'];
            if (text !== undefined)
                return text;
        }
        if (this.fallbackService !== null)
            return this.fallbackService.localize(cultureIdToMatch, l10nKey, fallback);
        return fallback;
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
        let text = this.localize(cultureIdToMatch, this.getErrorMessagel10nText(errorCode, dataTypeLookupKey), null);
        if (text === null && dataTypeLookupKey)
            text = this.localize(cultureIdToMatch, this.getErrorMessagel10nText(errorCode, null), null);
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
    protected getErrorMessagel10nText(errorCode: string, dataTypeLookupKey: string | null): string
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
        let text = this.localize(cultureIdToMatch, this.getSummaryMessagel10nText(errorCode, dataTypeLookupKey), null);
        if (text === null && dataTypeLookupKey)
            text = this.localize(cultureIdToMatch, this.getSummaryMessagel10nText(errorCode, null), null);
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
    protected getSummaryMessagel10nText(errorCode: string, dataTypeLookupKey: string | null): string
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
        let text = this.localize(cultureIdToMatch, this.getDataTypeNamel10nText(dataTypeLookupKey), null);
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
        this.ensureLazyLoaded();
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
        this.register(this.getErrorMessagel10nText(errorCode, dataTypeLookupKey), cultureToText);
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
        this.register(this.getSummaryMessagel10nText(errorCode, dataTypeLookupKey), cultureToText);
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
}
