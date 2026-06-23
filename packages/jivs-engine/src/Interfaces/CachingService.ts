/**
 * Internal caching through the ICachingService interface.
 * @module Services/Types/CachingService
 */

/**
 * General in memory caching service.
 * Found on IValidationServices.cachingService.
 */
export interface ICachingService {
  get<TValue>(key: string): TValue | null | undefined;

  set<TValue>(
    key: string,
    value: TValue,
  ): void;

  remove(key: string): boolean;

  clear(): void;
}