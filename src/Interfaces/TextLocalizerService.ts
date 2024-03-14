/**
 * @module Services/Interfaces
 */
/**
 * A service to offer text alternatives to the default text
 * based on cultureId.
 */
export interface ITextLocalizerService
{
    /**
     * Returns the localized version of the text for the given culture.
     * Will try the language-countrycode format
     * and fallback to language only.
     * If nothing is matched, it returns the default text, which is in the source text.
     * @param cultureIdToMatch - 
     * @param sourceText - String contains the default text and if appropriate, a
     * textKey to select the correct localized text.
     * Implementations can define the format of this string.
     * If the sourcetext isn't setup to be localized, it will be returned verbatim.
     * @returns The localized text or the original text.
     */
    Localize(cultureIdToMatch: string, sourceText: string): string;

    /**
     * Converts the source text into the two parts it may have:
     * textKey and default text.
     * @param sourceText - String contains the default text and if appropriate, a
     * textKey to select the correct localized text.
     * Implementations can define the format of this string.
     * If the sourcetext isn't setup to be localized, the result will be 
     * LookupKey: null and DefaultText = sourceText.
     * If the sourceText is entirely the textKey, the result will be 
     * TextKey=textKey
     * DefaultText = ''
     */
    IdentifyParts(sourceText: string): TextParts;
}
export interface TextParts
{
    /**
     * Used to perform the lookup
     */
    TextKey: string | null,
    /**
     * Used when a lookup fails.
     */
    FallbackText: string
}