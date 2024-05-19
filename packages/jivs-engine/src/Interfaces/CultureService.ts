/**
 * {@inheritDoc Services/Types/ICultureService!ICultureService:interface } 
 * @module Services/Types/ICultureService
 */

/**
 * Service for identifying cultures that you will use in the app,
 * by their CultureID  ('en', 'en-US', 'en-GB', etc), and provides
 * fallbacks for when a requested CultureID is not found.
 */
export interface ICultureService  {
/**
 * The culture shown to the user in the app. Its the ISO language-region format.
   This value is the starting point to search through localizations.
 */    
    activeCultureId: string;

    /**
     * Add a culture and its fallback.
     * If the culture already exists, it is replaced.
     * @param culture 
     */
    register(culture: CultureIdFallback): void;

    /**
     * Check for the presence of a Culture.
     * Will fallback to language only check if language-country
     * cultureID doesn't find a match. In other words, if 'en-US' isn't found,
     * it tries 'en'.
     * @returns the found cultureID, so you know if it exactly matched or just 
     * got the language. If no match, returns null.
     */
    getClosestCultureId(cultureId: string): string | null;

    /**
     * Returns the CultureIdFallback that matches its cultureId to the value passed in.
     * @param cultureId 
     */
    find(cultureId: string): CultureIdFallback | null;
    
}

/**
 * Identifies a CultureID ('en', 'en-US', 'en-GB', etc) that you are supporting.
 * Supplies a fallback CultureID if the culture requested did not have any support.
 * Used by {@link Services/ConcreteClasses/CultureService!CultureService | CultureService}. 
 * Pass an array of these into the CultureService constructor.
 */
export interface CultureIdFallback {
    /**
     * The ISO culture name pattern in use:
     * languagecode
     * languagecode-countrycode or regioncode
     * "en", "en-GB", "en-US"
     * If this needs to change, it is OK if you set it and the Adaptor reconfigure,
     * or to create a new instance and use it.
     */
    cultureId: string;

    /**
     * Identifies another culture to check if a lookup key cannot be resolved.
     */
    fallbackCultureId?: string | null;
}
