/**
 * {@inheritDoc Services/Types/ILookupKeyFallbackService!ILookupKeyFallbackService:interface } 
 * @module Services/Types/ILookupKeyFallbackService
 */

import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
import { LookupKey } from '../DataTypes/LookupKeys';
import { ILookupKeyFallbackService } from '../Interfaces/LookupKeyFallbackService';
import { ServiceBase } from './ServiceBase';

/**
 * Service for creating a relationship between a lookup key and another
 * that is the base data type it is built around.
 * For example, LookupKey.Integer uses a number as the base data type.
 * So it has a relationship with LookupKey.Number.
 * This service keeps these relationships. The DataTypeFormatterService and DataTypeParserService
 * consume this as they try to find the best fitting Formatter or Parser.
 * 
 * Suppose that your InputValueHost has its datatype="PositiveInteger".
 * Initially DataTypeFormatterService and DataTypeParserService look for a Formatter
 * or Parser whose LookupKey is "PositiveInteger". If not found, we don't want to 
 * force the user to either create a new class or register a map with "PositiveInteger"
 * and a suitable class: NumberFormatter or NumberParser.
 * 
 * As a result, the user should register each NEW lookupkey they create if it has a
 * natural base data type.
 * 
 * Jivs will automatically register its own built-in LookupKeys (see LookupKeys.ts)
 * 
 * Base data types are LookupKey.Number, LookupKey.String, LookupKey.Boolean,
 * LookupKey.Date, LookupKey.DateTime, LookupKey.LocalDate, LookupKey.TimeOfDay.
 * However, if you create a new type that you consider "base data type",
 * you can use it too.
 * 
 * It is valid to do this: "PositiveInteger" fallback to LookupKey.Integer fallback to LookupKey.Number.
 * That way, the formatter or parser can first try for an IntegerFormatter or IntegerParser 
 * (Note: IntegerParser does not exist.)
 * 
 */
export class LookupKeyFallbackService extends ServiceBase implements ILookupKeyFallbackService {
    constructor()
    {
        super();
    }
    private _registered: Map<string, string> | null = null;
    protected ensureBuiltIn(): void
    {
        if (!this._registered)
        {
            this._registered = new Map<string, string>();
            this.register(LookupKey.Integer, LookupKey.Number);
            this.register(LookupKey.Currency, LookupKey.Number);
            this.register(LookupKey.Percentage, LookupKey.Number);
            this.register(LookupKey.Percentage100, LookupKey.Number);
            this.register(LookupKey.YesNoBoolean, LookupKey.Boolean);
            this.register(LookupKey.ShortDate, LookupKey.Date);
            this.register(LookupKey.AbbrevDate, LookupKey.Date);
            this.register(LookupKey.LongDate, LookupKey.Date);
            this.register(LookupKey.AbbrevDOWDate, LookupKey.AbbrevDate);
            this.register(LookupKey.LongDOWDate, LookupKey.LongDate);
            this.register(LookupKey.TimeOfDayHMS, LookupKey.TimeOfDay);
            this.register(LookupKey.Capitalize, LookupKey.String);
            this.register(LookupKey.Uppercase, LookupKey.String);
            this.register(LookupKey.Lowercase, LookupKey.String);
            this.register(LookupKey.CaseInsensitive, LookupKey.String);

            // LookupKey.TotalDays does not apply
        }
    }

    /**
     * Add a lookup key and its fallback.
     * If the lookup key already exists, it is replaced.
     * Register each NEW lookupkey you create if it has a natural base data type.
     * Jivs has already registered its own lookup keys.
     * @param lookupKey - case sensitive match
     * @param fallbackLookupKey 
     */
    public register(lookupKey: string, fallbackLookupKey: string): void
    {
        assertNotNull(lookupKey, 'lookupKey');
        assertNotNull(fallbackLookupKey, 'fallbackLookupKey');
        if (lookupKey === fallbackLookupKey)
            throw new CodingError('Cannot use the same value for both parameters');

        this.ensureBuiltIn();
        this._registered!.set(lookupKey, fallbackLookupKey);    // will add or replace
    }
  
    /**
     * Returns the fallback LookupKey for the value passed in, or null if not found.
     * True base data types (Number, Boolean, Date, String, etc) will always return null.
     * @param lookupKey 
     */
    public find(lookupKey: string): string | null
    {
        this.ensureBuiltIn();

        return this._registered!.get(lookupKey) ?? null;
    }
  /**
   * If lookupKey is registered, this follows the chain of fallbacks until
   * it finds the deepest match. If not found, returns null.
   * @param lookupKey 
   * @returns the deepest match or null if not found.
   */
    public fallbackToDeepestMatch(lookupKey: string): string | null
    {
        this.ensureBuiltIn();
        let fallback = this.find(lookupKey);
        if (!fallback)
            return null;

        let alreadyCheckedLookupKeys = new Set<string>();
        let currentLK: string | null = fallback;
        alreadyCheckedLookupKeys.add(currentLK);
        while (currentLK)
        {
            fallback = this.find(currentLK);
            if (fallback)
            {
                currentLK = fallback;
                LookupKeyFallbackService.ensureRecursionSafe(currentLK, alreadyCheckedLookupKeys);
            }
            else
                return currentLK;
        }
        return null
    }
  /**
   * Determine if the initialLookupKey can fallback to the targetLookupKey.
   * @param initialLookupKey 
   * @param targetLookupKey 
   * @returns true when fallback is possible, false otherwise.
   */
    public canFallbackTo(initialLookupKey: string, targetLookupKey: string): boolean
    {
        assertNotNull(initialLookupKey, 'initialLookupKey');
        assertNotNull(targetLookupKey, 'targetLookupKey');
        this.ensureBuiltIn();
        let alreadyCheckedLookupKeys = new Set<string>();

        let lookupKey: string | null = initialLookupKey;
        alreadyCheckedLookupKeys.add(lookupKey);        
        while (lookupKey)
        {
            if (lookupKey === targetLookupKey)
                return true;

            lookupKey = this.find(lookupKey);
            if (lookupKey)
                LookupKeyFallbackService.ensureRecursionSafe(lookupKey, alreadyCheckedLookupKeys);
        }
        return false;
    }

    /**
     * Defense for recursion looking through fallbacks to avoid loops.
     * Throws when lookupKey has already been seen.
     * @param lookupKey 
     * @param alreadyCheckedLookupKeys 
     */
    public static ensureRecursionSafe(lookupKey: string, alreadyCheckedLookupKeys: Set<string>): void
    {
        if (alreadyCheckedLookupKeys.has(lookupKey))
            throw new CodingError(`LookupKeyFallbackService has a loop involving ${lookupKey}`);
        alreadyCheckedLookupKeys.add(lookupKey);
    }
  
  }
  