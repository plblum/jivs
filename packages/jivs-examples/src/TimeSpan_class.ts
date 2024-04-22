
/**
 * Let's suppose that you have a class which can be represented by a number,
 * and you want that class to be treated like that number within the Conditions
 * that compare two values.
 * In this example, the class is a TimeSpan with properties of Hours, Minutes, and Seconds.
 * You want its number representation to be in hours (a decimal value so 1hr 30m is 1.5).
 * You want to setup the the EqualToCondition like this:
 * <IEqualToConditionConfig>{
 *   conditionType: "EqualTo",
 *   valueHostName: "TextBox1", // your code supplies the textbox value to its ValueHost as a TimeSpan
 *   secondValue: 1.5 // Compare to this number of hours
 * }
 * 
 * We need to teach this library about your TimeSpan.
 * You will create and register 2 classes with the dataTypeConverterService and dataTypeIdentifierService properties 
 * (found on the ValidationServices object).
 * 1. IDataTypeIdentifier - Class to recognize the TimeSpan object and give it a Lookup Key.
 *    See TimeSpanIdentifier class below.
 * 2. IDataTypeConverter - Class that knows how to get the number from the value coming
 *    from the ValueHost (converts TimeSpan to total hours)
 *    See TimeSpanToHoursConverter class below.
 * Registration is shown at the bottom of the file.
 * 
 */

import { IDataTypeConverter } from "@plblum/jivs-engine/src/Interfaces/DataTypeConverters";
import { IDataTypeIdentifier } from "@plblum/jivs-engine/src/Interfaces/DataTypeIdentifier";
import { IValidationServices } from "@plblum/jivs-engine/src/Interfaces/ValidationServices"
import { DataTypeConverterService } from "@plblum/jivs-engine/src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from "@plblum/jivs-engine/src/Services/DataTypeIdentifierService";

export class TimeSpan
{
    constructor(hours: number, minutes?: number, seconds?: number)
    {
        this._hours = hours;
        this._minutes = minutes ?? 0;
        this._seconds = seconds ?? 0;
    }
    public get hours(): number
    {
        return this._hours;
    }
    private _hours: number;
    public get minutes(): number
    {
        return this._minutes;
    }
    private _minutes: number;
    public get seconds(): number
    {
        return this._seconds;
    }
    private _seconds: number;

    public get totalSeconds(): number
    {
        return this._hours * 3600 + this._minutes * 60 + this._seconds;
    }

    public get totalHours(): number
    {
        let totalSeconds = this.totalSeconds;
        return totalSeconds / 3600;
    }
}

export const TimeSpanLookupKey = "TimeSpan";
export const TimeSpanAsSecondsLookupKey = "TimeSpanAsSeconds";

export class TimeSpanIdentifier implements IDataTypeIdentifier
{
    public get dataTypeLookupKey(): string { return TimeSpanLookupKey}
    public supportsValue(value: any): boolean {
        return value instanceof TimeSpan;
    }
}
// handles the value without any lookup key or for the specific key "TimeSpan"
export class TimeSpanToHoursConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof TimeSpan &&
            (!dataTypeLookupKey || dataTypeLookupKey === TimeSpanLookupKey);
    }
    public convert(value: TimeSpan, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.totalHours;
    }
}
// handles the value only with the specific key "TimeSpanAsSeconds"
export class TimeSpanToSecondsConverter implements IDataTypeConverter
{
    public supportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof TimeSpan &&
            (dataTypeLookupKey === TimeSpanAsSecondsLookupKey);
    }
    public convert(value: TimeSpan, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.totalSeconds;
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerTimeSpan(validationServices: IValidationServices): void
{
    let dtis = validationServices.dataTypeIdentifierService as DataTypeIdentifierService;
    // or move just this line into registerDataTypeIdentifiers() function         
    dtis.register(new TimeSpanIdentifier());
    let dtcs = validationServices.dataTypeConverterService as DataTypeConverterService;
    // or move just this line into registerDataTypeConverters() function         
    dtcs.register(new TimeSpanToHoursConverter()); 
    dtcs.register(new TimeSpanToSecondsConverter()); 

    // now whenever a Condition's value is TimeSpan, it gets identified as LookupKey="TimeSpan"
    // When its time to compare, the TimeSpanToHoursConverters are asked if they support the value.
    // When they do, the comparision immediately calls convert and now has a number value.
}
