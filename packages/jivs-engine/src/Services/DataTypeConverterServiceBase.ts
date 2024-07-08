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
    public resolveLookupKey(v: any, key: string | null, part: string): string {
        if (v != null) // null/undefined
        {
            if (!key)
                key = this.services.dataTypeIdentifierService.identify(v);
            if (!key)
                throw new CodingError(`${part} operand value has an unknown datatype. Supply the appropriate DataTypeLookupKey and/or register an IDataTypeIdentifier`);
        }
        return key!;
    }
}