/**
 * Base classes for developing Services around data types.
 * @module Services/AbstractClasses/DataTypeServiceBase
 */

import { LoggingLevel } from "../Interfaces/LoggerService";
import { IDataTypeService } from "../Interfaces/DataTypes";
import { IValidationServices, toIServicesAccessor } from "../Interfaces/ValidationServices";
import { assertNotNull, CodingError } from "../Utilities/ErrorHandling";
import { ServiceWithAccessorBase } from "./ServiceBase";
import { valueForLog } from "../Utilities/Utilities";


/**
 * Abstract base class for Services that maintain a registered list of classes
 * that all implement T.
 */
export abstract class DataTypeServiceBase<T> extends ServiceWithAccessorBase implements IDataTypeService
{

    /**
     * Changes the services on all implementations of IServicesAccessor
     * @param services 
     */
    protected updateServices(services: IValidationServices): void
    {
        this.getAll().forEach((registered) => {
            let sa = toIServicesAccessor(registered);
            if (sa)
                sa.services = services;
        });
    }
    /**
      * Registers an instance of the interface supported by this service.
      * It may replace an existing one, as determined by the subclass.
      * Replace supported on: IDataTypeIdentifier
      * @param item
      */
    public register(item: T): void {
        assertNotNull(item, 'item');
        let existingPos = this.indexOfExisting(item);
        if (existingPos < 0)
            this._registeredClasses.push(item);
        else
            this._registeredClasses[existingPos] = item;    // replace

        if (this.hasServices()) {
            let sa = toIServicesAccessor(item);
            if (sa)
                sa.services = this.services;
        }        
    }

    /**
     * Utility for register() to identify an already registered item
     * that can be replaced by the supplied item.
     * @param item 
     * @returns an index into the getAll collection of a match or -1 if no match.
     */
    protected abstract indexOfExisting(item: T): number;

    /**
     * Supports implementations of unregister().
     * @param index 
     * @returns 
     */
    protected unregisterByIndex(index: number): boolean
    {
        if (index >= 0) {
            this._registeredClasses!.splice(index, 1);
            return true;
        }
        return false;        
    }

    /**
     * Returns the full collection.
     */
    protected getAll() : Array<T>
    {
        return this._registeredClasses;
    }

    /**
     * All registered T.
     */
    private readonly _registeredClasses: Array<T> = [];
}

/**
 * Provides tooling that support both ConverterServices and ComparerServices
 * as both implement some Converter code.
 */
export abstract class DataTypeConverterServiceBase<T> extends DataTypeServiceBase<T> {
    public resolveLookupKey(v: any, key: string | null, part: string): string | null {
        if (v != null) // null/undefined
        {
            if (!key)
                key = this.services.dataTypeIdentifierService.identify(v);
            if (!key)
                throw new CodingError(`${part} operand value has an unknown datatype. Supply the appropriate DataTypeLookupKey and/or register an IDataTypeIdentifier`);
        }
        return key;
    }
    /**
     * Applies a converter specific to the value. If the result is an object (like Date or custom),
     * it repeats with the new value, hopefully resulting in a primitive value for use by the 
     * DefaultComparer.
     * Date -> number using UTCDateConverter
     * RelativeDate class with getDate(): Date property -> Date -> number using RelativeDateConverter and UTCDateConverter.
     * @param value 
     * @param lookupKey 
     * @returns 
     */
    public cleanupConvertableValue(value: any, lookupKey: string | null): any {
        // NOTE: Did not use dataTypeConverterService.convert() directly
        // because we want to return the original value if no converter was found.
        // dataTypeConverterService.convert will return undefined in that case,
        // but also may return undefined from the DataTypeConverter.convert() function itself.
        let dtc = this.services.dataTypeConverterService.find(value, lookupKey);
        if (dtc) {
            this.log(() => `Using ${valueForLog(dtc)}`, LoggingLevel.Debug);
            value = dtc.convert(value, lookupKey!);

            switch (typeof value) {
                case 'number':
                case 'string':
                case 'boolean':
                case 'bigint':
                case 'undefined':
                    break;
                case 'object':  // try again. For example, we got a date. Need it to be a number
                    if (value === null)
                        return value;
                    value = this.cleanupConvertableValue(value, null);
                    break;
                default:/* istanbul ignore next */
                    throw new CodingError('Type converted to unsupported value.');
            }
        }
        return value;
    }
}