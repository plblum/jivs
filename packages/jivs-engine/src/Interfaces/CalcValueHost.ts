/**
 * CalcValueHost is a specialized ValueHost whose value is calculated
 * when its getValue method is called. You supply a function handle
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
 * : number | Date | string | null | undefined
 * {
 *      let totalDays1 = callingValueHost.convert(findValueHosts.getValueHost('StartDate')?.getValue(), LookupKey.TotalDays);
 *      let totalDays2 = callingValueHost.convert(findValueHosts.getValueHost('EndDate')?.getValue(), LookupKey.TotalDays);
 *      if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
 *          return undefined;   // can log with findValueHosts.services.logger.log();
 *      return Math.abs(totalDays2 - totalDays1);
 * }
 * 
 * // create the CalcValueHostConfig to supply to the ValidationManager
 * let diffDaysConfig: CalcValueHostConfig = {
 *   valueHostType: 'Calc',
 *   name: 'DiffDays',
 *   dataType: LookupKey.Integer,
 *   calcFn: differenceBetweenDates
 * };
 * // fluent: 
 * //   fluent().calc('DiffDays', LookupKey.Integer, differenceBetweenDates);
 * 
 * // create the 'StartDate' input with a LessThanCondition
 * let startDateConfig: InputValueHostConfig = {
 *   valueHostType: 'Input',
 *   name: 'StartDate',
 *   dataType: 'Date',
 *   label: 'Start date',
 *   validatorConfigs: [
 *      {
 *          conditionConfig: {
 *              conditionType: ConditionType.LessThan,
 *              valueHostName: 'DiffDays',  // source is our CalcValueHost
 *              secondValue: 10,    // must be less than 10 days
 *          },
 *          errorMessage: 'The two dates must be less than {CompareTo} days.'
 *      }
 *   ]
 * };
 * // fluent: 
 * // fluent().input('StartDate', 'Date', { label: 'Start date' })
 * //                .lessThan(10, { valueHostName: 'DiffDays' });
 * ```
 * Your function can also save stateful information with the valueHost.saveIntoInstanceState.
* @module ValueHosts/Types/CalcValueHost
 */

import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "./ValueHost";
import { IValueHostsManager } from "./ValueHostResolver";

/**
 * Function definition for calculation functions used by CalcValueHost
 */
export type CalculationHandler = (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => CalculationHandlerResult;
export type CalculationHandlerResult = number | Date | string | null | undefined;
/**
 * Structure of CalcValueHost
 */
export interface ICalcValueHost extends IValueHost
{
    /**
     * Provides conversion support against the original value using the DataTypeConverters
     * and DataTypeIdentifiers through services.dataTypeConverterService.convert()
     * @param value 
     * @param dataTypeLookupKey 
     */
    convert(value: any, dataTypeLookupKey: string | null): CalculationHandlerResult;
    
    /**
     * Provides conversion support against the original value using the DataTypeConverters
     * and DataTypeIdentifiers through services.dataTypeConverterService.convert().
     * Attempts to convert it all the way down to a number, string or boolean.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * @param value 
     * @param dataTypeLookupKey - if not supplied, it will attempt to resolve it with
     * the DataTypeIdentifiers.
     */
    convertToPrimitive(value: any, dataTypeLookupKey: string | null): number | Date | string | null | undefined;        
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