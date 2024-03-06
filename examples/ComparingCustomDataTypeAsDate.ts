
/**
 * Let's suppose that you have a class which can be represented by a date,
 * and you want that class to be treated like that date within the Conditions
 * that compare two values.
 * In this example, the class calculates a date relative today with properties of Days, Months, and Years.
 * You want to setup the the ValuesEqualCondition like this:
 * <IValuesEqualConditionDescriptor>{
 *   Type: "ValuesEqual",
 *   ValueHost1: "TextBox1", // your code supplies the textbox value to its ValueHost as a RelativeDate
 *   SecondValue: new Date(2000, 0, 1) // Compare to this date
 * }
 * 
 * We need to teach this library about your RelativeDate class.
 * You will create and register 2 classes and a function with the DataTypeResolver 
 * (found on the ValidationServices object).
 * 1. IDataTypeIdentifier - Class to recognize the RelativeDate object and give it a Lookup Key.
 *    See RelativeDateIdentifier class.
 * 2. IDataTypeConverter - Class that knows how to get the Date from the value coming 
 *    from the ValueHost (uses RelativeDate.ResolveDate property )
 *    See RelativeDateConverter class.
 * 3. Comparer function - When it comes to dates, we need to assist comparing by providing a function.
 *    Fortunately we have a bunch of comparer functions built in, including DateOnlyComparer, DateTimeComparer,
 *    DateAsMonthYearComparer, and DateAsAnniversaryComparer.
 * Registration is shown at the bottom of the file.
 */

import { DateOnlyComparer } from "../src/DataTypes/Comparers";
import { DataTypeResolver } from "../src/DataTypes/DataTypeResolver";
import { IDataTypeConverter, IDataTypeIdentifier } from "../src/Interfaces/DataTypes";
import { IValidationServices } from "../src/Interfaces/ValidationServices"

export class RelativeDate
{
    constructor(days: number, months?: number, years?: number)
    {
        this._days = days;
        this._months = months ?? 0;
        this._years = years ?? 0;
    }
    public get Days(): number
    {
        return this._days;
    }
    private _days: number;
    public get Months(): number // where 0 is January
    {
        return this._months;
    }
    private _months: number;
    public get Years(): number
    {
        return this._years;
    }
    private _years: number;

    public get ResolvedDate(): Date
    {// WARNING: this is prototype code. Not tested!
        let todayAsNumber = Date.now();
        let totalDays = this._days + this._months * 30 + this._years * 365;
        return new Date(totalDays * 84600 + todayAsNumber); // supply milliseconds
    }
}

export class RelativeDateIdentifier implements IDataTypeIdentifier
{
    public get DataTypeLookupKey(): string { return "RelativeDate" }
    public IsMatch(value: any): boolean {
        return value instanceof RelativeDate;
    }
}
// handles the value without any lookup key
export class RelativeDateConverter implements IDataTypeConverter
{
    SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof RelativeDate;
    }
    Convert(value: RelativeDate, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.ResolvedDate;
    }
}

export function RegisterRelativeDate(validationServices: IValidationServices): void
{
    let dataTypeResolver = validationServices.DataTypeResolverService as DataTypeResolver;
    dataTypeResolver.RegisterDataTypeIdentifier(new RelativeDateIdentifier());
    dataTypeResolver.RegisterDataTypeConverter(new RelativeDateConverter()); 
    dataTypeResolver.RegisterComparerHandler("RelativeDate", DateOnlyComparer);

    // now whenever a Condition's value is RelativeDate, it gets identified as LookupKey="RelativeDate"
    // When its time to compare, the RelativeDateConverter is asked if it supports the value.
    // When they do, the comparision immediately calls Convert and now has a Date value.
    // Finally, the Condition uses the Comparer registered for "RelativeDate".
}