
/**
 * class RelativeDate example
 * 
 * Let's suppose that you have a class which can be represented by a date,
 * and you want that class to be treated like that date within the Conditions
 * that compare two values.
 * In this example, the class calculates a date relative today with properties of Days, Months, and Years.
 * You want to setup the the EqualToCondition like this:
 * <IEqualToConditionDescriptor>{
 *   Type: "EqualTo",
 *   ValueHost1: "TextBox1", // your code supplies the textbox value to its ValueHost as a RelativeDate
 *   SecondValue: new Date(2000, 0, 1) // Compare to this date
 * }
 * 
 * We need to teach this library about your RelativeDate class.
 * You will create and register 2 classes with the DataTypeServices 
 * (found on the ValidationServices object).
 * 1. IDataTypeIdentifier - Class to recognize the RelativeDate object and give it a Lookup Key.
 *    See RelativeDateIdentifier class.
 * 2. IDataTypeConverter - Class that knows how to get the Date from the value coming 
 *    from the ValueHost (uses RelativeDate.ResolveDate property )
 *    See RelativeDateConverter class.
 * Registration is shown at the bottom of the file.
 */

import { DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { IDataTypeConverter, IDataTypeIdentifier } from "../src/Interfaces/DataTypes";
import { IValidationServices } from "../src/Interfaces/ValidationServices"

export class RelativeDate
{
    constructor(days: number, months?: number, years?: number)
    {
        this._days = days;
        this._months = months ?? 0;
        this._years = years ?? 0;
        this._utcToday = null;
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

    public get UTCToday(): Date
    {
        if (!this._utcToday)
        {
            let now = new Date(Date.now()); // start with local time
            this._utcToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())); // switch to UTC for default comparison against other UTC dates            
        }
        return this._utcToday;
    }
    public set UTCToday(today: Date)
    {
        this._utcToday = today;
    }
    private _utcToday: Date | null;

    public get ResolvedDate(): Date
    {// WARNING: this is prototype code. It should probably be implemented differently
         let todayAsNumber = this.UTCToday.getTime();
        let totalDays = this._days + this._months * 30 + this._years * 365;
        return new Date(totalDays * 86400000 + todayAsNumber); // supply milliseconds
    }
}

export const RelativeDataLookupKey = "RelativeDate";

export class RelativeDateIdentifier implements IDataTypeIdentifier
{
    public get DataTypeLookupKey(): string { return RelativeDataLookupKey }
    public supportsValue(value: any): boolean {
        return value instanceof RelativeDate;
    }
}

export class RelativeDateConverter implements IDataTypeConverter
{
    // handles the value without any lookup key or with "RelativeDate"
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof RelativeDate &&
            (!dataTypeLookupKey || (dataTypeLookupKey === RelativeDataLookupKey));
    }
    public convert(value: RelativeDate, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.ResolvedDate;
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerRelativeDate(validationServices: IValidationServices): void
{
    let dataTypeServices = validationServices.DataTypeServices as DataTypeServices;
    dataTypeServices.registerDataTypeIdentifier(new RelativeDateIdentifier());
    dataTypeServices.registerDataTypeConverter(new RelativeDateConverter()); 

    // now whenever a Condition's value is RelativeDate, it gets identified as LookupKey="RelativeDate"
    // even without any LookupKey supplied.
    // When its time to compare, the RelativeDateConverter is asked if it supports the value.
    // When they do, the comparision immediately calls Convert and now has a Date value.
    // The DataTypeServices knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)
}

