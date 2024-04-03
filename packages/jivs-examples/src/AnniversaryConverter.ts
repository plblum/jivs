


// Example: Supporting a Date object in a different way than it was intended by
// implementing IDataTypeConverter. This uses just the Day and Month.

import { DataTypeConverterService } from "../../jivs-engine/build/Services/DataTypeConverterService";
import { IDataTypeConverter } from "../../jivs-engine/src/Interfaces/DataTypeConverters";
import { IValidationServices } from "../../jivs-engine/src/Interfaces/ValidationServices";

export const AnniversaryLookupKey = 'Anniversary';  // when using a Date object for same day and month each year. Assumes UTC

/**
 * An implementation of IDataTypeConverter or JavaScript Date objects that represent just the month and day,
 * which is a birthday or anniversary.
 * Effectively, the Date.getUTCFullYear() is treated as 2004 here (a leap year) 
 * even if that's not what was supplied.
 * DataType LookupKey: "Anniversary".
 */
export class UTCAnniversaryConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === AnniversaryLookupKey) &&
            value instanceof Date;
    }
    public convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(2004, value.getUTCMonth(), value.getUTCDate()));
        return dateOnly.getTime();
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerAnniversary(validationServices: IValidationServices): void
{
    let dtcs = validationServices.dataTypeConverterService as DataTypeConverterService;
    // or move just this line into registerDataTypeConverters() function         
    dtcs.register(new UTCAnniversaryConverter()); 

    // This gets used ONLY when the ValueHostDescriptor.DataType with "Anniversary".
    // When its time to compare, the UTCAnniversaryConverter is asked if it supports the value.
    // If so, the comparision immediately calls convert and now has a Date value.
    // The dataTypeConverterService knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)
}

