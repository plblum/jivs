/**
 * RelativeDate class consumed in a CalcValueHost
 * 
 * Let's suppose that you have a class which can be represented by a date,
 * and you want that class to be treated like that date within the Conditions
 * that compare two values.
 * In this example, the class calculates a date relative today with properties of Days, Months, and Years.
 * You want to setup the the EqualToCondition like this:
 * <EqualToConditionConfig>{
 *   conditionType: "EqualTo",
 *   valueHostId: "TextBox1", // your code supplies the textbox value to its ValueHost as a RelativeDate
 *   secondValue: new Date(2000, 0, 1) // Compare to this date
 * }
 * 
 * Our RelativeDate class allows adding or subtracting days, months, and years relative to today.
 * - new RelativeDate(1, 0, 0) represents +1 day relative to today.
 * - new RelativeDate(0, 1, 0) represents +1 month relative to today.
 * - new RelativeDate(0, 0, 1) represents +1 year relative to today.
 * - new RelativeDate(-1, 0, 0) represents -1 day relative to today.
 * - new RelativeDate(0, -1, 0) represents -1 month relative to today.
 * - new RelativeDate(0, 0, -1) represents -1 year relative to today.
 * 
 * To use it, we just call its `resolvedDate` property to get the actual Date object.
 * 
 * The RelativeDate class is a calculation tool. So we use the CalcValueHost to
 * deliver its value:
 * 
 * ```ts
 * builder.calc('NextMonth', LookupKey.Date, 
 *  (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager)=>{
 *      // Always one month ahead relative to today
 *      let calc = new RelativeDate(0, 1, 0);
 *      return calc.resolvedDate; // Get the actual Date object
 *  });
 * ```
 * 
 * We provide a helper function `calcRelativeDate` to easily create calculation handlers for relative dates.
 * Example usage:
 * ```ts
 * builder.calc('Tomorrow', LookupKey.Date, calcRelativeDate(1));
 * ```
 * Another helper function `calcOffsetByDays` allows calculating a relative date where 
 * the offset in days comes from a value host.
 * Example usage:
 * ```ts
 * builder.static('OffsetByDays', LookupKey.Number, { initialValue: 5}); // Example: set initial offset to 5 days
 * builder.calc('TodayPlusDays', LookupKey.Date, calcOffsetByDays('OffsetByDays'));
 * ```
 */

import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ICalcValueHost, CalculationHandler } from '@plblum/jivs-engine/build/Interfaces/CalcValueHost';

/**
 * Represents a date relative to today, allowing addition or subtraction of days, months, and years.
 * Example usage:
 * let relativeDate = new RelativeDate(1, 0, 0); // +1 day relative to today
 * let actualDate = relativeDate.resolvedDate; // Get the actual Date object
 */
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
    private readonly _days: number;
    public get months(): number // where 0 is January
    {
        return this._months;
    }
    private readonly _months: number;
    public get years(): number
    {
        return this._years;
    }
    private readonly _years: number;

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

/**
 * Use this to return the function that calculates a date relative to today based on the specified days, months, and years.
 * ```ts
 * builder.calc('Tomorrow', LookupKey.Date, calcRelativeDate(1));
 * ```
 * @param days 
 * @param months 
 * @param years 
 * @returns 
 */
export function calcRelativeDate(days: number, months?: number, years?: number): 
    CalculationHandler
{
    return (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => {
        let calc = new RelativeDate(days, months, years);
        return calc.resolvedDate;
    };
}

/**
 * Another way to calculate a date relative to today where the source
 * of the offset in days comes from a value host identified by the specified name.
 * @param sourceOfDaysValueHostName 
 * @returns 
 */
export function calcOffsetByDays(sourceOfDaysValueHostName: string): CalculationHandler
{
    return (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) =>
    {
        let sourceVH = findValueHosts.getValueHost(sourceOfDaysValueHostName);
        if (!sourceVH)
            throw new Error(`Value host for '${sourceOfDaysValueHostName}' not found.`);
        let days = sourceVH.getValue() as number;
        return calcRelativeDate(days)(callingValueHost, findValueHosts);
    };
}
