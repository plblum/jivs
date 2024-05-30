/**
 * @module DataTypes/Types
 */

import { IServiceWithAccessor } from './Services';

/**
 * Base interface for Data Type services.
 */
export interface IDataTypeService extends IServiceWithAccessor
{
    /**
      * Registers an instance of the interface supported by this service.
      * It may replace an existing one, as determined by the subclass.
      * Replace supported on: IDataTypeIdentifier
      * @param item
      */
    register(item: any): void;    
}

/**
 * Result from a method that can deliver either a value or an error in
 * attempting to generate that value.
 */
export interface DataTypeResolution<T>
{
    /**
     * If assigned, it is the resolved value.
     * If undefined, the value failed to resolve and the errorMessage is setup.
     */
    value?: T;
    /**
     * If assigned, the value failed to resolve and this is a description of what happened.
     */
    errorMessage?: string;
}