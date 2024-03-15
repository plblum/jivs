/**
 * @module Services/TextLocalizerServices
 */
import { ITextLocalizerService } from "../Interfaces/TextLocalizerService";
import { CultureLanguageCode } from "../Utilities/Utilities";

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
    public Localize(cultureIdToMatch: string, l10nKey: string | null, fallback: string): string
    {
        if (!l10nKey)   // including '', null and undefined
            return fallback;

        let mapped = this._textKeyMap.get(l10nKey);
        if (mapped)
        {
            let text = mapped[CultureLanguageCode(cultureIdToMatch)];
            if (text !== undefined)
                return text;
            text = mapped['*'];
            if (text !== undefined)
                return text;
        }
        return fallback;
    }

    /**
     * Registers a textKey with the culture specific text.
     * Replaces an already registered entry with the same TextKey.
     * @param textKey
     * @param cultureToText - keys are language codes from cultureId, like 'en'.
     * values are the actual text to output.
     */
    public Register(textKey: string, cultureToText: CultureToText): void
    {
        this._textKeyMap.set(textKey, cultureToText);
    }
    /**
     * Data is stored here, where the key is the TextKey and the value
     * is the object that maps cultureId to its text.
     * {
     *   'HELLO' :  // textKey
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
    private _textKeyMap: Map<string, CultureToText> = new Map<string, CultureToText>();
}

/**
 * Example:
 * {
 *   "*": "hello",  // optional and provides a universal default
 *   "en": "hello",
 *   "sp": "hola"
 * }
 */
type CultureToText =
{
    [cultureId: string]: string;
}