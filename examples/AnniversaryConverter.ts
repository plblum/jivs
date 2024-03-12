import { DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { IDataTypeConverter } from "../src/Interfaces/DataTypes";
import { IValidationServices } from "../src/Interfaces/ValidationServices";
import { valGlobals } from "../src/Services/ValidationGlobals";

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
export class UTCAnniversaryConverter implements IDataTypeConverter
{
    public SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === AnniversaryLookupKey) &&
            value instanceof Date;
    }
    public Convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(2004, value.getUTCMonth(), value.getUTCDate()));
        return dateOnly.getTime();
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function RegisterRelativeDate(validationServices: IValidationServices): void
{
    let dataTypeServices = validationServices.DataTypeServices as DataTypeServices;
    dataTypeServices.RegisterDataTypeConverter(new UTCAnniversaryConverter()); 

    // This gets used ONLY when the IValueHostDescriptor.DataType with "Anniversary".
    // When its time to compare, the UTCAnniversaryConverter is asked if it supports the value.
    // If so, the comparision immediately calls Convert and now has a Date value.
    // The DataTypeServices knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)
}

// Register BEFORE you have a ValidationService: set up a global default
export function RegisterRelativeDateInDefaultDataTypeServices(): void
{
    let dataTypeServices = valGlobals.GetDefaultDataTypeServices() as DataTypeServices;
    dataTypeServices.RegisterDataTypeConverter(new UTCAnniversaryConverter()); 
}