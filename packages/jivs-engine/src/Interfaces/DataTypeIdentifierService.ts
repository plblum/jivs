/**
 * {@inheritDoc Services/Types/IDataTypeIdentifierService!IDataTypeIdentifierService:interface }
 * @module Services/Types/IDataTypeIdentifierService
 */
import { IDataTypeIdentifier } from "./DataTypeIdentifier";
import { IDataTypeService } from "./DataTypes";

/**
 * A service for identifing the Data Type Lookup Key associated with a data type
 * using {@link DataTypes/Types/IDataTypeIdentifier!IDataTypeIdentifier | IDataTypeIdentifier} instances.
 */
export interface IDataTypeIdentifierService extends IDataTypeService<IDataTypeIdentifier> {

    /**
     * When a value is supplied without a DataType Lookup Key, this resolves the
     * DataType Lookup Key. By default, it supports values of type number, boolean,
     * string and Date object.
     * 
     * You can add your own data types by implementing IDataTypeIdentifier
     * and registered you class with the {@link Services/ConcreteClasses/ValidationServices!ValidationServices#dataTypeIdentifierService | ValidationServices#dataTypeIdentifierService}.
     * @param value 
     * @returns the Data Type Lookup Key if found or null if no match.
     */
    identify(value: any): string | null;

    /**
     * Finds the matching DataType LookupKey for the given value or 
     * null if not supported.
     * @param value 
     * @returns 
     */
    find(value: any): IDataTypeIdentifier | null;

    /**
     * Determines if the lookup key has an associated DataTypeIdentifier.
     * @param lookupKey 
     * @param caseInsensitive When true, uses a case insensitive comparison.
     */
    findByLookupKey(lookupKey: string, caseInsensitive?: boolean): IDataTypeIdentifier | null;
}