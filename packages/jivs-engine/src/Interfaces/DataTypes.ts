/**
 * @module DataTypes/Types
 */

/**
 * Base interface for Data Type services.
 */
export interface IDataTypeServiceBase
{

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