import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { DataTypeConverterBase } from "@plblum/jivs-engine/build/DataTypes/DataTypeConverters";
import { IValidationServices } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';



// Example: Supporting a Date object in a different way than it was intended by
// implementing IDataTypeConverter. This uses just the Day and Month.


export const AnniversaryLookupKey = 'Anniversary';  // when using a Date object for same day and month each year. Assumes UTC

/**
 * An implementation of IDataTypeConverter or JavaScript Date objects that represent just the month and day,
 * which is a birthday or anniversary.
 * Effectively, the Date.getUTCFullYear() is treated as 2004 here (a leap year) 
 * even if that's not what was supplied.
 * DataType LookupKey: "Anniversary".
 */
export class UTCAnniversaryConverter extends DataTypeConverterBase
{
    convert(value: any, sourceLookupKey: string | null, resultLookupKey: string) {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(2004, value.getUTCMonth(), value.getUTCDate()));
        return dateOnly.getTime();
    }
    protected validValue(value: any): boolean {
        return value instanceof Date;
    }
    supportedResultLookupKeys(): string[] {
        return [LookupKey.Number, LookupKey.Milliseconds]
    }
    supportedSourceLookupKeys(): (string | null)[] {
        return [AnniversaryLookupKey];
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerAnniversary(validationServices: IValidationServices): void
{
    let dtcs = validationServices.dataTypeConverterService as DataTypeConverterService;
    // or move just this line into registerDataTypeConverters() function         
    dtcs.register(new UTCAnniversaryConverter()); 

    // This gets used ONLY when the ValueHostConfig.dataType with "Anniversary".
    // When its time to compare, the UTCAnniversaryConverter is asked if it supports the value.
    // If so, the comparision immediately calls convert and now has a Date value.
    // The dataTypeConverterService knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)
}

