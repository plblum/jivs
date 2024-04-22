/**
 * @module Services/Types
 */

import { IServiceWithFallback } from "./ValidationServices";

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
 */
export interface ITextLocalizerService extends IServiceWithFallback<ITextLocalizerService>
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
    localize(cultureIdToMatch: string, l10nKey: string | null, fallback: string | null): string | null;

    /**
     * Attempts to get the localized error message for the ErrorCode and optional DataTypeLookupKey
     * If dataTypeLookupKey is supplied and no match is found, it tries with just the ErrorCode.
     * @param errorCode - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @param dataTypeLookupKey 
     * @returns The error message or null if not available.
     */
    getErrorMessage(cultureIdToMatch: string, errorCode: string, dataTypeLookupKey: string | null): string | null;

    /**
     * Attempts to get the localized Summary error message for the ErrorCode and optional DataTypeLookupKey
     * If dataTypeLookupKey is supplied and no match is found, it tries with just the ErrorCode.
     * @param errorCode - same as ConditionType unless you set the ValidatorConfig.errorCode property 
     * @param dataTypeLookupKey 
     * @returns The Summary error message or null if not available.
     */
    getSummaryMessage(cultureIdToMatch: string, errorCode: string, dataTypeLookupKey: string | null): string | null;
}


/**
 * Example:
 * {
 *   "*": "hello",  // optional and provides a universal default
 *   "en": "hello",
 *   "sp": "hola"
 * }
 */
export type CultureToText =
{
    [cultureId: string]: string;
}