import { IDataTypeConverter } from '@plblum/jivs-engine/src/Interfaces/DataTypeConverters';
import { IValidationServices } from '@plblum/jivs-engine/src/Interfaces/ValidationServices';
import { DataTypeConverterService } from '@plblum/jivs-engine/src/Services/DataTypeConverterService';

// Example: Supporting a Date object in a different way than it was intended by
// implementing IDataTypeConverter. This uses the month and year.


export const MonthYearLookupKey = 'MonthYear'; // "expiry" when using a Date object and only need month and year. Assumes UTC

/**
 * An implementation of IDataTypeConverter for JavaScript Date objects that only use the month and year values.
 * That is sometimes done for credit card expiry dates.
 * Effectively, the Date.getUTCDate() is treated as 1 here even if
 * that's not what was supplied.
 * DataType LookupKey: "MonthYear".
 */
export class UTCMonthYearConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === MonthYearLookupKey) &&
            value instanceof Date;
    }
    public convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
        return dateOnly.getTime();
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerMonthYear(validationServices: IValidationServices): void
{
    let dtcs = validationServices.dataTypeConverterService as DataTypeConverterService;
    // or move just this line into registerDataTypeConverters() function         
    dtcs.register(new UTCMonthYearConverter()); 

    // This gets used ONLY when the ValueHostConfig.dataType with "MonthYear".
    // When its time to compare, the UTCMonthYearConverter is asked if it supports the value.
    // If so, the comparision immediately calls convert and now has a Date value.
    // The dataTypeConverterService knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)
}
