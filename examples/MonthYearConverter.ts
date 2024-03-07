import { DataTypeResolver } from '../src/DataTypes/DataTypeResolver';
import { IValidationServices } from '../src/Interfaces/ValidationServices';
import { valGlobals } from '../src/Services/ValidationGlobals';
import { IDataTypeConverter } from './../src/Interfaces/DataTypes';
import { RelativeDateIdentifier, RelativeDateConverter } from './ComparingCustomDataTypeAsDate';

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
    public SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return (dataTypeLookupKey === MonthYearLookupKey) &&
            value instanceof Date;
    }
    public Convert(value: Date, dataTypeLookupKey: string): string | number | Date | null | undefined {
        if (isNaN(value.getTime()))
            return undefined;        
        let dateOnly = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
        return dateOnly.getTime();
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function RegisterRelativeDate(validationServices: IValidationServices): void
{
    let dataTypeResolver = validationServices.DataTypeResolverService as DataTypeResolver;
    dataTypeResolver.RegisterDataTypeConverter(new UTCMonthYearConverter()); 

    // This gets used ONLY when the IValueHostDescriptor.DataType with "MonthYear".
    // When its time to compare, the UTCMonthYearConverter is asked if it supports the value.
    // If so, the comparision immediately calls Convert and now has a Date value.
    // The DataTypeResolver knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)
}

// Register BEFORE you have a ValidationService: set up a global default
export function RegisterRelativeDateInDefaultDataTypeResolver(): void
{
    let dataTypeResolver = valGlobals.GetDefaultDataTypeResolver() as DataTypeResolver;
    dataTypeResolver.RegisterDataTypeConverter(new UTCMonthYearConverter()); 
}