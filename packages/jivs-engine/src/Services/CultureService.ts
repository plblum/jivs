/**
 * {@inheritDoc Services/ConcreteClasses/CultureService!CultureService:class}
 * @module Services/ConcreteClasses/CultureService
 */


import { CultureIdFallback, ICultureService } from "../Interfaces/CultureService";
import { assertNotNull } from "../Utilities/ErrorHandling";
import { ServiceBase } from "./ServiceBase";

/**
 * Service for identifying cultures that you will use in the app,
 * by their CultureID  ('en', 'en-US', 'en-GB', etc), and provides
 * fallbacks for when a requested CultureID is not found.
 * 
 * This class is available on {@link Services/ConcreteClasses/ValidationServices!ValidationServices.cultureService | ValidationServices.cultureService}.
 */
export class CultureService extends ServiceBase implements ICultureService {

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        super.dispose();
        this._cultureConfig = undefined!;
    }    
    /**
     * The culture shown to the user in the app. Its the ISO language-region format.
     * This value is the starting point to search through localizations.
     * If not supplied, it defaults to the value from the first culture added.
     * If none were added, it uses 'en'.
     */
    public get activeCultureId(): string {
        return this._activeCultureId ?? 'en';
    }
    public set activeCultureId(cultureID: string) {
        this._activeCultureId = cultureID;
        if (this.cultureIdFallback.length === 0)
            this.cultureIdFallback.push({ cultureId: cultureID });
    }
    private _activeCultureId: string | null = null;

    /**
     * Add a culture and its fallback.
     * If the culture already exists, it is replaced.
     * @param culture 
     */
    public register(culture: CultureIdFallback): void
    {
        assertNotNull(culture, 'culture');
        if (this._activeCultureId === null)
            this._activeCultureId = culture.cultureId;
        let index = this.cultureIdFallback.findIndex((existing) => existing.cultureId === culture.cultureId);
        if (index < 0)
            this.cultureIdFallback.push(culture);
        else
            this.cultureIdFallback[index] = culture;
    }

    protected get cultureIdFallback(): Array<CultureIdFallback> {
        return this._cultureConfig;
    }
    private _cultureConfig: Array<CultureIdFallback> = [];

    /**
     * Utility to check for the presence of a Culture.
     * Will fallback to language only check if language-country
     * cultureID doesn't find a match. In other words, if 'en-US' isn't found,
     * it tries 'en'.
     * @returns the found cultureID, so you know if it exactly matched or just 
     * got the language. If no match, returns null.
     */
    public getClosestCultureId(cultureId: string): string | null {
        let cc = this.getClosestCultureIdFallback(cultureId);
        if (cc)
            return cc.cultureId;
        return null;
    }

    protected getClosestCultureIdFallback(cultureId: string): CultureIdFallback | null {
        let cc = this.find(cultureId);
        if (!cc) {
            let lang = cultureLanguageCode(cultureId);
            if (lang !== cultureId) {
                cc = this.find(lang);
            }
        }
        return cc ?? null;
    }

    /**
     * Returns the CultureIdFallback that matches its cultureId to the value passed in.
     * @param cultureId 
     */    
    public find(cultureId: string): CultureIdFallback | null {
        let result = this.cultureIdFallback.find((cc) => cc.cultureId === cultureId) ?? null;
        if (!result && this._activeCultureId === cultureId)
            result = { cultureId: this._activeCultureId };
        return result;
    }


  /**
   * Returns the list of all the culture IDs that have been registered.
   */
    public availableCultures(): Array<string>    
    {
        let list: Array<string> = [];
        this.cultureIdFallback.forEach((cc) => {
            if (!list.includes(cc.cultureId))
                list.push(cc.cultureId);
        });
        return list;
    }
  /**
   * Returns a list of all language codes that have been registered.
   * 'en', 'fr', etc.
   */
    public availableLanguages(): Array<string>
    {
        let list: Array<string> = [];
        this.cultureIdFallback.forEach((cc) => {
            let code = cultureLanguageCode(cc.cultureId);
            if (!list.includes(code))
                list.push(code);
        });
        return list;
    }
}

/**
 * Returns the language code part of the cultureId.
 * If cultureId is only that already, it gets returned.
 * @param cultureId 
 * @returns 
 */
export function cultureLanguageCode(cultureId: string): string
{
    let pos = cultureId.indexOf('-');
    if (pos > 0)
        return cultureId.substring(0, pos);
    return cultureId;
}
