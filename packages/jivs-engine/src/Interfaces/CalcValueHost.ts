/**
 * CalcValueHost is a specialized ValueHost whose value is calculated
 * when its getValue method is called. You supply a function callback
 * in its CalcValueHostConfig to set it up.
 * 
 * Calculations allow you to expand what is available to Conditions
 * without having to create new rules. This class was inspired by this use case:
 * 
 * The user wants to compare two dates to determine if the number of days
 * between them is greater to (or equal or less than) another value.
 * With CalcValueHost, the user can use the GreaterThanCondition to compare
 * two integers, one being the value returned by a CalcValueHost and the 
 * other is the number of days to compare.
 * 
 * CalcValueHost has nifty conversion functions built in, that 
 * can be used to prepare the values it needs, the same way the comparison conditions do.
 * let totalDays = vh.convert(value, 'TotalDays'); // 'TotalDays' is a lookup key
 * Internally CalcValueHost uses Jivs' DataTypeConverters and DataTypeIdentifiers
 * to convert the original value into the value demanded by its own dataType property.
 * 
 * Here is pseudo code for configuring the CalcValueHost used in this example.
 * ```ts
 * function differenceBetweenDates(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager)
 * : SimpleValueType
 * {
 *      let totalDays1 = callingValueHost.convert(findValueHosts.getValueHost('StartDate')?.getValue(), LookupKey.TotalDays);
 *      let totalDays2 = callingValueHost.convert(findValueHosts.getValueHost('EndDate')?.getValue(), LookupKey.TotalDays);
 *      if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
 *          return undefined;   // can log with findValueHosts.services.logger.log();
 *      return Math.abs(totalDays2 - totalDays1);
 * }
 * 
 * // create the CalcValueHostConfig to supply to the ValidationManager
 * let builder = build(services);
 * builder.calc('DiffDays', LookupKey.Integer, differenceBetweenDates);
 * 
 * // create the 'StartDate' input with a LessThanCondition
 * builder.input('StartDate', 'Date', { label: 'Start date' })
 *  .lessThan(10, { valueHostName: 'DiffDays' });
 * ```
 * Your function can also save stateful information with the valueHost.saveIntoInstanceState.
* @module ValueHosts/Types/CalcValueHost
 */

import { LookupKey } from "../DataTypes/LookupKeys";
import { SimpleValueType } from "./DataTypeConverterService";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "./ValueHost";
import { IValueHostsManager } from "./ValueHostsManager";

/**
 * Function definition for calculation functions used by CalcValueHost
 */
export type CalculationHandler = (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => SimpleValueType;

/**
 * Structure of CalcValueHost
 */
export interface ICalcValueHost extends IValueHost
{
    /**
     * Provides conversion support against the original value using the DataTypeConverters
     * and DataTypeIdentifiers through services.dataTypeConverterService.convert()
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be.
     * @returns The converted value. If the value is not convertable, return undefined.
     */
    convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType;
    
    /**
     * Provides conversion support against the original value using the DataTypeConverters
     * and DataTypeIdentifiers through services.dataTypeConverterService.convert().
     * Attempts to convert it all the way down to a number, string or boolean.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be
     * @returns The converted value. If the value is not convertable, return undefined.
     */
    convertToPrimitive(value: any, sourceLookupKey: string | null, resultLookupKey: LookupKey.Number | LookupKey.String | LookupKey.Boolean): SimpleValueType;        
}
/**
 * How the user configures the CalcValueHost. They are expected to supply
 * valueHostType - 'Calc'
 * dataType = assigned to the output value's data type lookup key
 * calcFn = the function matching the calculationHandler
 */
export interface CalcValueHostConfig extends ValueHostConfig
{
    /**
     * The function that will be called by getValue. It must return
     * either a value compatible with the valueHost.dataType or undefined
     * if it could not calculate.
     */
    calcFn: CalculationHandler;
}

/**
 * InstanceState for CalcValueHost
 */
export interface CalcValueHostInstanceState extends ValueHostInstanceState
{
    
}