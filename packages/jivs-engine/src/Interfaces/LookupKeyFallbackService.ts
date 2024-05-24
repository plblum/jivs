/**
 * {@inheritDoc Services/Types/ILookupKeyFallbackService!ILookupKeyFallbackService:interface } 
 * @module Services/Types/ILookupKeyFallbackService
 */

import { IService } from "./ValidationServices";

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
 */
export interface ILookupKeyFallbackService extends IService {

  /**
   * Add a lookup key and its fallback.
   * If the lookup key already exists, it is replaced.
   * Register each NEW lookupkey you create if it has a natural base data type.
   * Jivs has already registered its own lookup keys.
   * @param lookupKey
   * @param fallbackLookupKey 
   */
  register(lookupKey: string, fallbackLookupKey: string): void;

  /**
   * Returns the fallback LookupKey for the value passed in, or null if not found.
   * @param lookupKey 
   */
  find(lookupKey: string): string | null;

}

