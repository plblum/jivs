/**
 * A common problem in working between external data sources and ValueHostsManager is transferring
 * data between the two. This problem requires a knowledge of each field and how to convert it to the correct type. 
 * 
 * DataCleanupService is a service that provides a set of functions to clean up data 
 * during a transfer between two systems: an external data source and the ValueHostsManager.
 * It is designed to be used in conjunction with the ModelReader and ModelWriter classes, 
 * which handle the reading and writing of data between the two systems.
 * However, it works stand-alone too.
 * 
 * DataCleanupService is added to JivsServices and can be accessed via jivsServices.dataCleanupService.
 * 
 * # The DataCleanupService rules: DataCleanupRule
 * The rules are defined in the DataCleanupRule interface, which contains a 'when' and 'then' property.
 * - The 'when' property is a string that identifies a function registered in the DataCleanupService.
 * - The 'then' property is a string that identifies a function registered in the DataCleanupService.
 * 
 * Here's a typical call to the DataCleanupService:
 * ```ts
 * const result = jivsServices.dataCleanupService.resolve(
 *  'propertyName', value, 
 *  {
 *    when: 'undefined',
 *    then: 'null'
 *  }, 
 *  valueHost);
 * ```
 * In this case, if the value=undefined, the result will be { skip: false, value: null }, meaning
 * the caller has a new value to use.
 * If the value is not undefined, the result will be { skip: false, value: value }, meaning
 * the caller will get back the original value.
 * 
 * ## Service registration of When and Then functions
 * The DataCleanupService has a set of pre-registered When and Then functions, 
 * but additional functions can be registered by the user.
 * 
 * ## When functions
 * Used by the DataCleanupRule.when property to determine if the value is invalid and needs to be replaced.
 * 
 * Each registered function signature: (value: any) => boolean
 * Returns true when the value is considered invalid and replacement is needed.
 * 
 * Pre-registered functions and their names to use in the when property of the DataCleanupRule:
 *   + whenUndefined: 'undefined': true when value === undefined.
 *   + whenNull: 'null': true when value === null.
 *   + whenNullOrUndefined: 'nullorundefined': true when value === null or value === undefined.
 *   + whenZero: '0' or 'zero': true when value === 0.
 *   + whenZeroOrNull: '0ornull' or 'zeroornull': true when value === null or value === 0.
 *   + whenZeroNullOrUndefined: '0nullorundefined' or 'zeronullorundefined': true when value === null or value === 0 or value === undefined.
 *   + whenEmptyString: '' or 'emptystring': true when value === ''.
 *   + whenEmptyStringOrNull: 'emptystringornull': true when value === null or value === ''.
 *   + whenEmptyStringNullOrUndefined: 'emptystringnullorundefined': true when value === null or value === '' or value === undefined.
 * 
 * ### Example to add your own function:
 * ```ts
 * function isNegative(value: any): boolean {
 *     return typeof value === 'number' && value < 0;
 * }
 * ```
 * Register in the service:
 * ```ts
 * jivsServices.dataCleanupService.registerWhenFunction('isNegative', isNegative);
 * ```
 * ## Then functions
 * Used by the DataCleanupRule.then property to determine what to do with the value identified by When functions.
 * 
 * Each registered function signature: (value: any) => { skip: boolean; value?: any }
 * Because it is passed the original value, it can return a modified value, or an entirely new value. 
 * It can also return a flag to skip the property from being written.
 * When skip is true, the property is not written. When false, the returned value is written.
 * 
 * Pre-registered functions and their names to use in the then property of the DataCleanupRule:
 *   + thenSkip: 'omit', 'skip': { skip: true } — skips the property.
 *   + thenKeep: 'keep', 'nochange': writes the original value unchanged.
 *   + thenUndefined: 'undefined': writes undefined.
 *   + thenNull: 'null': writes null.
 *   + thenZero: '0': writes 0.
 *   + thenEmptyString: '' or 'emptystring': writes ''.
 *   + thenFalse: 'false': writes false.
 *   + thenTrue: 'true': writes true.
 *   + thenEmptyArray: '[]' or 'emptyarray': writes [].
 *   + thenEmptyObject: '{}' or 'emptyobject' : writes {}.
 * 
 * ### Example to add your own function:
 * ```ts
 * function negativeOne(value: any): DataCleanupResolution {
 *     return { value: -1 };
 * }
 * ```
 * Register in the service:
 * ```ts
 * jivsServices.modelWriterRuleService.registerThenFunction('negativeOne', negativeOne);
 * ```
 * @module jivs-engine/Services/Types/DataCleanupService
 */

import { IServiceWithAccessor } from './Services';


/**
 * Contains the pair of settings that define a rule for the DataCleanupService.
 * The When function is used to determine if the value is invalid and needs to be replaced. 
 * The Then function is used to determine what to do with the value identified by When functions.
 * FieldValueHostConfig.modelReaderRule and FieldValueHostConfig.modelWriterRule are of this type.
 */
export interface DataCleanupRule
{
    /**
     * The name of the function registered in ModelReader/WriterRuleService to determine 
     * if the value is invalid and needs to be replaced.
     * Predefined values are:
     * - 'undefined':       true when value === undefined.
     * - 'nullorundefined': true when value === null or value === undefined.
     * - '0' or 'zero':     true when value === 0.
     * - '0ornull' or 'zeroornull': 
     *                      true when value === null or value === 0.
     * - '0nullorundefined' or 'zeronullorundefined': 
     *                      true when value === null or value === 0 or value === undefined.
     * - '' or 'emptystring':   
     *                      true when value === ''.
     * - 'emptystringornull': 
     *                      true when value === null or value === ''.
     * - 'emptystringnullorundefined': 
     *                      true when value === null or value === '' or value === undefined.
     */
    when: string;
    /**
     * The name of the function registered in ModelReader/WriterRuleService to determine 
     * what to do with the value identified by the When function.
     * 
     * Predefined values are:
     * - 'omit', 'skip':    does not attempt to write to the destination.
     * - 'keep', 'nochange': 
     *                      writes the original value unchanged.
     * - 'undefined':       writes undefined.
     * - 'null':            writes null.
     * - '0':               writes 0.
     * - '' or 'emptystring':  
     *                      writes ''.
     * - 'false':           writes false.
     * - 'true':            writes true.
     * - '[]' or 'emptyarray': 
     *                      writes [].
     * - '{}' or 'emptyobject' : 
     *                      writes {}.
     */
    then: string;
}

/**
 * Pattern for the When function used in DataCleanupService. 
 * Returns true when the value is considered invalid and needs to be replaced through the Then function.
 * Returns false when the value is valid and the Then function should not be run.
 */
export type DataCleanupWhenFunction = (value: any) => boolean;
/**
 * Pattern for the Then function used in DataCleanupService.
 * It is called when the When function returns true and provides the replacement value or
 * indicates if the value should be omitted.
 * It returns an object with either skip: true, or value: any.
 * Expect that when skip is false, value can be undefined as a valid value to write.
 */
export type DataCleanupThenFunction = (value: any) => DataCleanupResolution;

/**
 * Result from DataCleanupThenFunction and DataCleanupService.resolve(). It indicates if the value should be skipped or replaced.
 * If skip is true, the value will be ignored.
 * If skip is false, the value will be used. It can be undefined as a valid value to write.
 */
export type DataCleanupResolution = { skip?: boolean, value?: any; };

/**
 * The DataCleanupService resolves the rules in DataCleanupRules and retains 
 * the When and Then functions, allowing them to be registered and retrieved by name. 
 * - resolve() takes a DataCleanupRule and a value and returns either the original value, 
 *      the adjusted value, or a skip flag indicating the value should not be assigned to the ValueHost.
 * - when() and then() retrieve and execute the When and Then functions by name.
 * - registerWhenFunction() and registerThenFunction() register the When and Then functions by name.
 * 
 * There are two implementations: DataCleanupService and ModelWriterRuleService.
 * Each has its own set of pre-registered functions.
 * They are registered in JivsServices and can be accessed via 
 * jivsServices.modelReaderRuleService and jivsServices.modelWriterRuleService.
 * It supports case-insensitive name lookup.
 */
export interface IDataCleanupService extends IServiceWithAccessor
{
    /**
     * Evaluate the original value and using When and Then rules, return the DataCleanupResolution
     * where you use its value or take no action if skip is true.
     * The Then function only executes if the When function returns true, indicating the value is invalid 
     * and needs to be replaced.
     * The result value is often the original, only adjusted based on the Then function.
     * @param originalValue 
     * @param rule 
     * @returns An object with either skip: true, or value: any. 
     * If skip is true, the value will be ignored.
     * If skip is false, the value will be used. It can be undefined as a valid value to write.
     */
    resolve(originalValue: any, rule: DataCleanupRule): DataCleanupResolution;
    /**
     * Retrieves the When function by its name.
     * @param name The name of the When function to retrieve.
     * @returns The When function if found, otherwise undefined.
     */
    getWhen(name: string): DataCleanupWhenFunction | undefined;
    /**
     * Executes the When function by its name with the provided value.
     * @param name The name of the When function to execute.
     * @param value The value to pass to the When function.
     * @returns True when the value is considered invalid and needs to be replaced, false when the value is valid.
     * Undefined if the function is not found in a case-insensitive lookup.
     */
    when(name: string, value: any): boolean | undefined;
    /**
     * Retrieves the Then function by its name.
     * @param name The name of the Then function to retrieve.
     * @returns The Then function if found, otherwise undefined.
     */
    getThen(name: string): DataCleanupThenFunction | undefined;
    /**
     * Executes the Then function by its name with the provided value.
     * @param name The name of the Then function to execute.
     * @param value The value to pass to the Then function.
     * @returns The result of the Then function if found, otherwise undefined.
     */
    then(name: string, value: any): DataCleanupResolution | undefined;

    /**
     * Registers a When function with the given name.
     * @param name The name of the When function to register.
     * @param func The When function to register.
     */
    registerWhenFunction(name: string, func: DataCleanupWhenFunction): void;
    /**
     * Registers a Then function with the given name.
     * @param name The name of the Then function to register.
     * @param func The Then function to register.
     */
    registerThenFunction(name: string, func: DataCleanupThenFunction): void;
}
