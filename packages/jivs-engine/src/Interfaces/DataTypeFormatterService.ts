/**
 * {@inheritDoc Services/Types/IDataTypeFormatterService!IDataTypeFormatterService:interface } 
 * @module Services/Types/IDataTypeFormatterService
 */

import { IDataTypeFormatter } from "./DataTypeFormatters";
import { DataTypeResolution, IDataTypeService } from "./DataTypes";
import { IServicesAccessor } from "./Services";

/**
 * Service for formatting data types used within tokens of error messages
 * using {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter} instances.
 */
export interface IDataTypeFormatterService extends IDataTypeService<IDataTypeFormatter>, IServicesAccessor {

    /**
     * Converts the native value to a string that can be shown to the user.
     * Result includes the successfully converted value
     * or validation error information.
     * 
     * Formatting uses localization. It uses IDataTypeFormatter classes,
     * which may handle multiple cultures. When searching for a formatter,
     * it tries the ValidationServices.activeCultureID first and if no formatter
     * is supplied for that culture, it has a chain of fallback cultures that you supply
     * in the constructor.
     * @param value
     * @param lookupKey - If not supplied, a lookup key is created based on the native value type.
     * If you need alternative formatting or are supporting a user defined type,
     * always pass in the associated lookup key. They can be found in the LookupKeys module.
     * @returns successfully converted value or validation error information.
     */
    format(value: any, lookupKey?: string | null): DataTypeResolution<string>;


    /**
     * Finds the {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter}
     * associated with the lookup key and this class's own CultureID.
     * @param lookupKey
     * @returns A matching IDataTypeFormatter or null if none match.
     */
    find(lookupKey: string, cultureId: string): IDataTypeFormatter | null;

}
