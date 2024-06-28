/**
 * Base classes for developing Services around data types.
 * @module Services/AbstractClasses/DataTypeConverterServiceBase
 */

import { LoggingLevel } from "../Interfaces/LoggerService";
import { CodingError } from "../Utilities/ErrorHandling";
import { isSupportedAsValue, valueForLog } from "../Utilities/Utilities";
import { DataTypeServiceBase } from "./DataTypeServiceBase";

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
            this.logQuick(LoggingLevel.Debug, () => `Using ${valueForLog(dtc)}`);
            value = dtc.convert(value, lookupKey!);

            switch (typeof value) {
                case 'number':
                case 'string':
                case 'boolean':
                case 'bigint':
                case 'undefined':
                    break;
                // @ts-ignore so we don't worry about the fall-thru
                case 'object':  // try again. For example, we got a date. Need it to be a number
                    if (value === null)
                        return value;
                    // make sure the object is a class that inherits from Object
                    if (isSupportedAsValue(value)) {
                        value = this.cleanupConvertableValue(value, null);
                        break;
                    }
                    // intentional fall-thru to use the exception below
                default:/* istanbul ignore next */
                    throw new CodingError('Type converted to unsupported value.');
            }
        }
        return value;
    }
}