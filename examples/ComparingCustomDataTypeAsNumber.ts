
/**
 * Let's suppose that you have a class which can be represented by a number,
 * and you want that class to be treated like that number within the Conditions
 * that compare two values.
 * In this example, the class is a TimeSpan with properties of Hours, Minutes, and Seconds.
 * You want its number representation to be in hours (a decimal value so 1hr 30m is 1.5).
 * You want to setup the the ValuesEqualCondition like this:
 * <IValuesEqualConditionDescriptor>{
 *   Type: "ValuesEqual",
 *   ValueHost1: "TextBox1", // your code supplies the textbox value to its ValueHost as a TimeSpan
 *   SecondValue: 1.5 // Compare to this number of hours
 * }
 * 
 * We need to teach this library about your TimeSpan.
 * You will create and register 2 classes with the DataTypeServices 
 * (found on the ValidationServices object).
 * 1. IDataTypeIdentifier - Class to recognize the TimeSpan object and give it a Lookup Key.
 *    See TimeSpanIdentifier class below.
 * 2. IDataTypeConverter - Class that knows how to get the number from the value coming
 *    from the ValueHost (converts TimeSpan to total hours)
 *    See TimeSpanToHoursConverter class below.
 * Registration is shown at the bottom of the file.
 * 
 */

import { DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { IDataTypeConverter, IDataTypeIdentifier } from "../src/Interfaces/DataTypes";
import { IValidationServices } from "../src/Interfaces/ValidationServices"

export class TimeSpan
{
    constructor(hours: number, minutes?: number, seconds?: number)
    {
        this._hours = hours;
        this._minutes = minutes ?? 0;
        this._seconds = seconds ?? 0;
    }
    public get Hours(): number
    {
        return this._hours;
    }
    private _hours: number;
    public get Minutes(): number
    {
        return this._minutes;
    }
    private _minutes: number;
    public get Seconds(): number
    {
        return this._seconds;
    }
    private _seconds: number;

    public get TotalSeconds(): number
    {
        return this._hours * 3600 + this._minutes * 60 + this._seconds;
    }

    public get TotalHours(): number
    {
        let totalSeconds = this.TotalSeconds;
        return totalSeconds / 3600;
    }
}

export const TimeSpanLookupKey = "TimeSpan";
export const TimeSpanAsSecondsLookupKey = "TimeSpanAsSeconds";

export class TimeSpanIdentifier implements IDataTypeIdentifier
{
    public get DataTypeLookupKey(): string { return TimeSpanLookupKey}
    public SupportsValue(value: any): boolean {
        return value instanceof TimeSpan;
    }
}
// handles the value without any lookup key or for the specific key "TimeSpan"
export class TimeSpanToHoursConverter implements IDataTypeConverter
{
    SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof TimeSpan &&
            (!dataTypeLookupKey || dataTypeLookupKey === TimeSpanLookupKey);
    }
    Convert(value: TimeSpan, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.TotalHours;
    }
}
// handles the value only with the specific key "TimeSpanAsSeconds"
export class TimeSpanToSecondsConverter implements IDataTypeConverter
{
    SupportsValue(value: any, dataTypeLookupKey: string | null): boolean {
        return value instanceof TimeSpan &&
            (dataTypeLookupKey === TimeSpanAsSecondsLookupKey);
    }
    Convert(value: TimeSpan, dataTypeLookupKey: string): string | number | Date | null | undefined {
        return value.TotalSeconds;
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function RegisterTimeSpan(validationServices: IValidationServices): void
{
    let dataTypeServices = validationServices.DataTypeServices as DataTypeServices;
    dataTypeServices.RegisterDataTypeIdentifier(new TimeSpanIdentifier());
    dataTypeServices.RegisterDataTypeConverter(new TimeSpanToHoursConverter());   
    dataTypeServices.RegisterDataTypeConverter(new TimeSpanToSecondsConverter());
    // now whenever a Condition's value is TimeSpan, it gets identified as LookupKey="TimeSpan"
    // When its time to compare, the TimeSpanToHoursConverters are asked if they support the value.
    // When they do, the comparision immediately calls Convert and now has a number value.
}
