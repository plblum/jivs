import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { DataTypeConverterBase } from "@plblum/jivs-engine/build/DataTypes/DataTypeConverters";

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
export class UTCMonthYearConverter extends DataTypeConverterBase
{
    public convert(value: any, sourceLookupKey: string | null, resultLookupKey: string) {
        if (isNaN(value.getTime()))
            return undefined;
        let dateOnly = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
        return dateOnly.getTime();
    }
    protected validValue(value: any): boolean {
        return value instanceof Date;
    }
    public supportedResultLookupKeys(): string[] {
        return [LookupKey.Number];
    }
    public supportedSourceLookupKeys(): (string | null)[] {
        return [MonthYearLookupKey];
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
