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
     * If nothing is matched, it returns the fallback text.
     * @param cultureIdToMatch - The cultureID.
     * @param l10nKey - Localization key, which is the text that identifies which word,
     * phrase, or other block of text is requested. If null or '', no localization is requested.
     * @param fallback - Used when there was no match for the culture.
     * Only supply '' if you are sure that registered data will always supply a value.
     * @returns The localized text or the fallback text.
     */
    Localize(cultureIdToMatch: string, l10nKey: string | null, fallback: string): string;
}
