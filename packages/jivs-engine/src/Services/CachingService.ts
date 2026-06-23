/**
 * Internal caching through the ICachingService interface.
 * @module Services/ConcreteClasses/CachingService
 */

import { ICachingService } from "../Interfaces/CachingService";

/**
 * General in memory caching service.
 * NOTE: Supports a value of null. Uses undefined to indicate that a value is not set.
 * Found on IValidationServices.cachingService.
 */
export class CachingService implements ICachingService {
    private _cache: Map<string, any> = new Map<string, any>();
    public get<TValue>(key: string): TValue | undefined | null {
        if (this._cache.has(key))
            return this._cache.get(key) as TValue;

        return undefined;
    }
    public set<TValue>(key: string, value: TValue): void {
        if (value === undefined) {
            this._cache.delete(key);
            return;
        }
        this._cache.set(key, value);
    }
    public remove(key: string): boolean {
        return this._cache.delete(key);
    }
    public clear(): void {
        this._cache.clear();
    }
}