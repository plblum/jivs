/**
 * @module Services/ConcreteClasses/TextLocalizerService
 */
import { CultureToText, ITextLocalizerService } from '../Interfaces/TextLocalizerService';
import { cultureLanguageCode } from '../Utilities/Utilities';

/**
 * A service to offer text alternatives to the default text
 * based on cultureId.
 * This implementation is independent of third party libraries
 * that you may be using. 
 * Thus, you may prefer to implement ITextLocalizerService yourself.
 * 
 * There are two text values associated with localization:
 * - A lookup key. A short code that maps to the actual string for each culture.
 * - Fallback text. The text supplied when the lookup key does not have
 *   anything to offer for the given culture.
 */
export class TextLocalizerService implements ITextLocalizerService
{
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
        return fallback;
    }

    /**
     * Attempts to get the localized error message for the ConditionType and optional DataTypeLookupKey.
     * If dataTypeLookupKey is supplied and no match is found, it tries with just the ConditionType.
     * @param conditionType 
     * @param dataTypeLookupKey 
     * @returns The error message or null if not available.
     */
    public getErrorMessage(cultureIdToMatch: string, conditionType: string, dataTypeLookupKey: string | null): string | null
    {
        let text = this.localize(cultureIdToMatch, this.getErrorMessagel10nText(conditionType, dataTypeLookupKey), null);
        if (text === null && dataTypeLookupKey)
            text = this.localize(cultureIdToMatch, this.getErrorMessagel10nText(conditionType, null), null);
        return text;
    }
    /**
     * Constructs the l10nText for the Error Message.
     * @param conditionType 
     * @param dataTypeLookupKey 
     * @returns 
     */
    protected getErrorMessagel10nText(conditionType: string, dataTypeLookupKey: string | null): string
    {
        let l10nText = 'EM-' + conditionType;
        if (dataTypeLookupKey)
            l10nText += '-' + dataTypeLookupKey;
        return l10nText;
    }

    /**
     * Attempts to get the localized Summary error message for the ConditionType and optional DataTypeLookupKey
     * If dataTypeLookupKey is supplied and no match is found, it tries with just the ConditionType.
     * @param conditionType 
     * @param dataTypeLookupKey 
     * @returns The Summary error message or null if not available.
     */
    public getSummaryMessage(cultureIdToMatch: string, conditionType: string, dataTypeLookupKey: string | null): string | null
    {
        let text = this.localize(cultureIdToMatch, this.getSummaryMessagel10nText(conditionType, dataTypeLookupKey), null);
        if (text === null && dataTypeLookupKey)
            text = this.localize(cultureIdToMatch, this.getSummaryMessagel10nText(conditionType, null), null);
        return text;
    }
    /**
     * Constructs the l10nText for the Summary error message.
     * @param conditionType 
     * @param dataTypeLookupKey 
     * @returns 
     */
    protected getSummaryMessagel10nText(conditionType: string, dataTypeLookupKey: string | null): string
    {
        let l10nText = 'SEM-' + conditionType;
        if (dataTypeLookupKey)
            l10nText += '-' + dataTypeLookupKey;
        return l10nText;
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
     * 'EM-' + ConditionType + '-' + DataTypeLookupKey
     * 'EM-' + ConditionType   // this is a fallback
     * @param conditionType
     * @param dataTypeLookupKey - optional. 
     * @param cultureToText 
     */
    public registerErrorMessage(conditionType: string, dataTypeLookupKey: string | null, cultureToText : CultureToText) : void
    {
        this.register(this.getErrorMessagel10nText(conditionType, dataTypeLookupKey), cultureToText);
    }
    /**
     * Utility to add a summary error message for a validator
     * The localization key (l10ntext) will use this pattern:
     * 'SEM-' + ConditionType + '-' + DataTypeLookupKey
     * 'SEM-' + ConditionType   // this is a fallback
     * @param conditionType
     * @param dataTypeLookupKey - optional. 
     * @param cultureToText 
     */
    public registerSummaryMessage(conditionType: string, dataTypeLookupKey: string | null, cultureToText : CultureToText) : void
    {
        this.register(this.getSummaryMessagel10nText(conditionType, dataTypeLookupKey), cultureToText);
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
