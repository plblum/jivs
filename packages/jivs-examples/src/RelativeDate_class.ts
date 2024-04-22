
/**
 * class RelativeDate example
 * 
 * Let's suppose that you have a class which can be represented by a date,
 * and you want that class to be treated like that date within the Conditions
 * that compare two values.
 * In this example, the class calculates a date relative today with properties of Days, Months, and Years.
 * You want to setup the the EqualToCondition like this:
 * <IEqualToConditionConfig>{
 *   conditionType: "EqualTo",
 *   valueHostId: "TextBox1", // your code supplies the textbox value to its ValueHost as a RelativeDate
 *   secondValue: new Date(2000, 0, 1) // Compare to this date
 * }
 * 
 * We need to teach this library about your RelativeDate class.
 * You will create and register 2 classes with the dataTypeConverterService and dataTypeIdentifierService properties
 * (found on the ValidationServices object).
 * 1. IDataTypeIdentifier - Class to recognize the RelativeDate object and give it a Lookup Key.
 *    See RelativeDateIdentifier class.
 * 2. IDataTypeConverter - Class that knows how to get the Date from the value coming 
 *    from the ValueHost (uses RelativeDate.ResolveDate property )
 *    See RelativeDateConverter class.
 * Registration is shown at the bottom of the file.
 */

import { IDataTypeConverter } from "@plblum/jivs-engine/src/Interfaces/DataTypeConverters";
import { IDataTypeIdentifier } from "@plblum/jivs-engine/src/Interfaces/DataTypeIdentifier";
import { IValidationServices } from "@plblum/jivs-engine/src/Interfaces/ValidationServices";
import { DataTypeConverterService } from "@plblum/jivs-engine/src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from "@plblum/jivs-engine/src/Services/DataTypeIdentifierService";


export class RelativeDate
{
    constructor(days: number, months?: number, years?: number)
    {
        this._days = days;
        this._months = months ?? 0;
        this._years = years ?? 0;
        this._utcToday = null;
    }
    public get days(): number
    {
        return this._days;
    }
    private _days: number;
    public get months(): number // where 0 is January
    {
        return this._months;
    }
    private _months: number;
    public get years(): number
    {
        return this._years;
    }
    private _years: number;

    public get utcToday(): Date
    {
        if (!this._utcToday)
        {
            let now = new Date(Date.now()); // start with local time
            this._utcToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())); // switch to UTC for default comparison against other UTC dates            
        }
        return this._utcToday;
    }
    public set utcToday(today: Date)
    {
        this._utcToday = today;
    }
    private _utcToday: Date | null;

    public get resolvedDate(): Date
    {// WARNING: this is prototype code. It should probably be implemented differently
         let todayAsNumber = this.utcToday.getTime();
        let totalDays = this._days + this._months * 30 + this._years * 365;
        return new Date(totalDays * 86400000 + todayAsNumber); // supply milliseconds
    }
}

export const RelativeDataLookupKey = "RelativeDate";

export class RelativeDateIdentifier implements IDataTypeIdentifier
{
    public get dataTypeLookupKey(): string { return RelativeDataLookupKey }
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
        return value.resolvedDate;
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerRelativeDate(validationServices: IValidationServices): void
{
    let dtis = validationServices.dataTypeIdentifierService as DataTypeIdentifierService;
    // or move just this line into registerDataTypeIdentifiers() function         
    dtis.register(new RelativeDateIdentifier());
    let dtcs = validationServices.dataTypeConverterService as DataTypeConverterService;
    // or move just this line into registerDataTypeConverters() function         
    dtcs.register(new RelativeDateConverter()); 

    // now whenever a Condition's value is RelativeDate, it gets identified as LookupKey="RelativeDate"
    // even without any LookupKey supplied.
    // When its time to compare, the RelativeDateConverter is asked if it supports the value.
    // When they do, the comparision immediately calls convert and now has a Date value.
    // The dataTypeConverterService knows to convert Date to a number, so it can be used by the 
    // default converter (DefaultConverter function supports comparing numbers)
}

