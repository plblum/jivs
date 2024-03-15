/**
 * @module Services/TextLocalizerServices
 */
import { ITextLocalizerService, TextParts } from "../Interfaces/TextLocalizerService";
import { CultureLanguageCode } from "../Utilities/Utilities";

/**
 * A service to offer text alternatives to the default text
 * based on cultureId.
 * This implementation is independent of third party libraries
 * that you may be using. Thus, you may prefer to implement
 * ITextLocalizerService yourself.
 * 
 * The "sourceText" passed into these functions has a specific syntax:
 * !TextKey|default text
 * For example:
 * TrueLabel="!YES|yes"
 * ErrorMessage="!RequiresText|This field requires text".
 * 
 * The TextKey is limited to letters, digits, and underscore.
 * This value is CASE SENSITIVE.
 * 
 * Use that syntax when you setup an error message or values output
 * by IDataTypeLocalizedFormatters. For example, 
 * YesNoBooleanLocalizedFormatter supports "yes" and "no",
 * using TrueLabel="!yes|yes" and FalseLabel="!no|no".
 * 
 * The syntax can be omitted, leaving the entire string for the text 
 * that will be output.
 * TrueLabel="yes"
 * ErrorMessage="This field requires text".
 */
export class TextLocalizerService implements ITextLocalizerService
{
    /**
     * Returns the localized version of the text for the given culture.
     * Will try the language-countrycode format
     * and fallback to language only.
     * If nothing is matched, it returns the default text, which is in the source text.
     * @param cultureIdToMatch - It will only use the language code part, like 'en' in 'en-US'
     * @param sourceText - It must start with ! in order to be localized.
     * Anything that doesn't get localized will be returned verbatim.
     * So this has a TextID: "!hello|hola", "!hello"
     * This does not: "hola", "hello|hola"
     * @returns The localized text or the original text.
     */
    public Localize(cultureIdToMatch: string, sourceText: string): string
    {
        // some quick tests before getting a regular expression involved...
        if (!sourceText || sourceText.length < 2)
            return sourceText;
        if (sourceText[0] !== '!')  // doesn't have a textKey
            return sourceText;
        let parts = this.IdentifyParts(sourceText);
        if (parts.TextKey)
        {
            let mapped = this._textKeyMap.get(parts.TextKey);
            if (mapped)
            {
                let text = mapped[CultureLanguageCode(cultureIdToMatch)];
                if (text !== undefined)
                    return text;
                text = mapped['*'];
                if (text !== undefined)
                    return text;
            }
        }
        return parts.FallbackText;
    }

    /**
     * Converts the source text into the two parts it may have:
     * textKey and default text.
     * @param sourceText - String contains the default text and if appropriate, a
     * textKey to select the correct localized text.
     * Implementations can define the format of this string.
     * If the sourcetext isn't setup to be localized, the result will be 
     * TextKey: null and DefaultText = sourceText.
     * If the sourceText is entirely the textKey, the result will be 
     * TextKey=textKey
     * DefaultText = ''
     */
    public IdentifyParts(sourceText: string): TextParts
    {
        if (!this._partsRegExp)
            this._partsRegExp = this.CreatePartsRegExp();
        let m = this._partsRegExp!.exec(sourceText);
        if (m)
        {
            let textKey = null;
            let fallbackText = '';
            if (m.groups && m.groups['textKey'] !== undefined)
                textKey = m.groups['textKey'] ?? null;
            if (m.groups && m.groups['text'] !== undefined)
                fallbackText = m.groups['text'] ?? '';
            return {
                TextKey: textKey,
                FallbackText: fallbackText
            }
        }
        return {
            TextKey: null,
            FallbackText: sourceText
        }
    }
    protected CreatePartsRegExp(): RegExp
    {
        return /^\!(?<textKey>[\w]+)(\|(?<text>[\w\W]*))?$/i;
    }
    private _partsRegExp: RegExp | null = null;

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