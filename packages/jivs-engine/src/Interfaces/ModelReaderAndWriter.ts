/**
 * A common problem in working between external data sources and ValueHostsManager is transferring
 * data between the two. This problem requires a knowledge of each field and how to convert it to the correct type. 
 * 
 * Jivs provides a way to encapsulate this knowledge into classes, one to read from external source
 * and the other two write to it.
 * 
 * IModelReader: from external source to ValueHostsManager
 * IModelWriter: from ValueHostsManager to external source
 * 
 * Core classes provide tooling for going through the fields of a model and converting them to the correct type. This is done by using a ModelReader and ModelWriter to read and write the data.
 * Special cases are handled by subclassing the ModelReader and ModelWriter and overriding the methods for the special cases.
 * 
 * A premise: external data does not have a predefined shape at the base class level. Subclasses implement types for object (model)
 * and dictionary (map) types. The base class implements the common functionality for reading and writing data.
 * To work, the transfer methods do not take or return the external object. Instead, the constructor of the ModelReader and ModelWriter takes the external object and stores it in a private field. The transfer methods then read and write to this private field.
 * 
 * # ModelReader (IModelReader interface)
 * Native value on model -> FieldValueHost native value -> (optionally) FieldValueHost text value
 * See {@link jivs-engine/Interfaces/ModelReaderAndWriter!IModelReader} for details.
 * 
 * ModelReader has a rule on each FieldValueHostConfig to determine how to read the data and 
 * convert it to the correct type. Mostly it is used to detect values in the source that represent
 * "unassigned", and to convert them to undefined in the FieldValueHost. 
 * 
 * The rule is assigned to FieldValueHostConfig.modelWriterRule. It is an object with two required string properties: when and then.
 * 
 * Rules are defined in the ModelWriterRuleService. 
 * 
 * # ModelWriter (IModelWriter interface)
 * FieldValueHost native value -> Native value on model
 * See {@link jivs-engine/Interfaces/ModelReaderAndWriter!IModelWriter} for details.
 * 
 * ModelWriter has a rule on each FieldValueHostConfig to determine how to write the data and 
 * convert it to the correct type. Mostly it is used to detect values in the FieldValueHost that are undefined
 * and give them the correct representation in the model. However, it can create other values
 * and be used when there are non-undefined values. For example, when 'null' then 'zero' would 
 * convert a null value to 0 in the model.
 * 
 * Rules are defined in the ModelWriterRuleService.
 * 
 *  * # ModelReaderRuleService
 * ModelReaderRuleService is added to JivsServices and resolves the rules used by ModelReader and found on FieldValueHostConfig.modelReaderRule.
 * It has numerous pre-registered functions, but users may register their own functions as well. The service supports case-insensitive name lookup.
 * See {@link jivs-engine/Interfaces/ModelReaderAndWriter!ModelReaderWriterRuleService} for details.
 * 
 * JivsServices exposes it as jivsServices.modelReaderRuleService.
 * 
 * # ModelWriterRuleService
 * ModelWriterRuleService is added to JivsServices and resolves the rules used by ModelWriter and found on FieldValueHostConfig.modelWriterRule.
 * It has numerous pre-registered functions, but users may register their own functions as well. The service supports case-insensitive name lookup.
 * See {@link jivs-engine/Interfaces/ModelReaderAndWriter!ModelReaderWriterRuleService} for details.
 * 
 * JivsServices exposes it as jivsServices.modelWriterRuleService.
 * 
 * ## When functions
 * Used by the modelReader/WriterRule.when property to determine if the value is invalid and needs to be replaced.
 * 
 * Each registered function signature: (value: any) => boolean
 * Returns true when the value is considered invalid and replacement is needed.
 * 
 * Pre-registered on both reader and writer:
 *   + whenUndefined: 'undefined': true when value === undefined.
 *   + whenNullOrUndefined: 'nullorundefined': true when value === null or value === undefined.
 *   + whenZero: '0' or 'zero': true when value === 0.
 *   + whenZeroOrNull: '0ornull' or 'zeroornull': true when value === null or value === 0.
 *   + whenZeroNullOrUndefined: '0nullorundefined' or 'zeronullorundefined': true when value === null or value === 0 or value === undefined.
 *   + whenEmptyString: '' or 'emptystring': true when value === ''.
 *   + whenEmptyStringOrNull: 'emptystringornull': true when value === null or value === ''.
 *   + whenEmptyStringNullOrUndefined: 'emptystringnullorundefined': true when value === null or value === '' or value === undefined.
 * 
 * Example function:
 * ```ts
 * function isNegative(value: any): boolean {
 *     return typeof value === 'number' && value < 0;
 * }
 * ```
 * Registered in the factory:
 * ```ts
 * jivsServices.modelWriterRuleService.registerWhenFunction('isNegative', isNegative);
 * ```
 * ## Then functions
 * Used by the modelWriterRule.then property to determine what to do with the value identified by When functions.
 * 
 * Each registered function signature: (value: any) => { omit: boolean; value?: any }
 * Because it is passed the original value, it can return a modified value, or an entirely new value. It can also return a flag to omit the property from being written.
 * When omit is true, the property is not written. When false, the returned value is written.
 * 
 * Pre-registered on reader:
 *   + thenUndefined: 'unassigned' or 'undefined': writes undefined.
 *   + thenNull: 'null': writes null.
 *   + thenKeep: 'keep': writes the original value unchanged.
 * 
 * Pre-registered on writer:
 *   + thenOmit: 'omit': { omit: true } — skips the property.
 *   + thenKeep: 'keep': writes the original value unchanged.
 *   + thenUndefined: 'undefined': writes undefined.
 *   + thenNull: 'null': writes null.
 *   + thenZero: '0': writes 0.
 *   + thenEmptyString: '' or 'emptystring': writes ''.
 *   + thenFalse: 'false': writes false.
 *   + thenTrue: 'true': writes true.
 *   + thenEmptyArray: '[]' or 'emptyarray': writes [].
 *   + thenEmptyObject: '{}' or 'emptyobject' : writes {}.
 * 
 * Example function:
 * ```ts
 * function replaceWithNegativeOne(value: any): { omit: boolean; value?: any } {
 *     return { omit: false, value: -1 };
 * }
 * ```
 * Registered in the factory:
 * ```ts
 * jivsServices.modelWriterRuleService.registerThenFunction('replaceWithNegativeOne', replaceWithNegativeOne);
 * ```
 * @module jivs-engine/Interfaces/ModelReaderAndWriter
 */

import { IFieldValueHost } from './FieldValueHost';
import { IService } from './Services';

/**
 * The ModelReader is responsible for reading data from an external source and populating the ValueHostsManager with the data. 
 * It uses the FieldValueHostConfig to determine how to read the data and convert it to the correct type.
 * In particular, dataType to ensure the value is converted to the correct type.
 * 
 * Actual class is expected to take in services so it has access to the logService,
 * and an instance of the external object to read from.
 * 
 * constructor(services: JivsServices, externalObject: any)
 * 
 * Expected implementations are ObjectModelReader and DictionaryModelReader.
 * 
 * Implementation:
 * - ModelReader only reads fields defined as FieldValueHosts in ValueHostsManager. 
 * 
 * - It uses the FieldValueHost.getPropertyName() function to resolve the name of the field in the external object. If the field is not found, it is ignored.
 *   getPropertyName uses the FieldValueHostConfig.propertyName if defined, otherwise it uses the FieldValueHost.name.
 * 
 * - Field values are assigned native values. The destination FieldValueHost has two representations: native and text values.
 *   By calling FieldValueHost.setValue(), it can set both based on rules found in setValue().
 *      + The FieldValueHostConfig must be setup to identify a lookup key for a DataTypeFormatter. It gets the lookup key from formatterLookupKey and dataType as a fallback.
 *      + DataTypeFormatterService must support that lookup key.
 *      + There are several switches to opt out: behaviors.disableFormattingOnValueChange, formatterLookupKey = null, and the setValueOption.disableFormatter.
 *        Since ModelReader calls setValue internally, it hides the setValueOption.disableFormatter from the caller.
 *        Instead, ModelReader has a property disableFormattingOnValueChange that can be set to true to disable formatting on value change.
 * 
 * - Values of the external object may be converted to the correct type using the DataTypeConversionService.
 * 
 * - By design, ValueHostsManager's onValueChanged() and onTextValueChanged() callbacks are called during setValue(). Yet when reading from a model,
 *   we are providing initial population of the ValueHostsManager. The UI that wires up onTextValueChanged prior to running the reader will
 *   get their callback invoked. If wired up to update the input element, it will replace the current value. That may be what we want.
 *   So its up to the user to decide if the callback is used. Using setValue(value, { skipValueChangedCallback: true }) will suppress the callback. However, 
 *   setValueOptions are not exposed to the ModelReader. Instead, ModelReader has a property skipValueChangedCallback that can be set to true to suppress the callback.
 * 
 * - If a model property value = undefined, the associated ValueHost gets setValueToUndefined(). No callbacks will happen.
 * 
 * - If a field cannot be converted, this is considered an error for validation to report. setValue() still sets up the native value but not the formatted text value.
 *   Instead, the error message from the formatter is injected using the InjectedError feature of setValueOptions. That lets it appear as an error on the field.
 * 
 * - Logging from LogService is used to track the writing of each field. Most logging is debug level, but errors are logged as errors.
 */
export interface IModelReader
{
    /**
     * Reads the data from the external source and populates the ValueHostsManager with the data.
     * It uses the FieldValueHostConfig to determine how to read the data and convert it to the correct type.
     * In particular, dataType to ensure the value is converted to the correct type.
     * It writes to the log for each field read, and logs errors if any occur.
     * Invalid values are handled by the DataTypeFormatterService and the error message is injected into the ValueHost using InjectedError.
     * They do not throw errors, but log them and continue reading the rest of the fields.
     */
    read(): void;
}

/**
 * The ModelWriter is responsible for writing data from the ValueHostsManager to an external source.
 * It uses the FieldValueHostConfig.modelWriterRule to determine how to write the data and convert it to the correct type.
 * If that property is not defined, it uses the default rule: { when: 'undefined', then: 'omit' }.
 * 
 * Actual class is expected to take in services so it has access to the logService,
 * and an instance of the external object to write to.
 * The instance can be prepopulated with data, and the ModelWriter will update the fields that are defined as FieldValueHosts in the ValueHostsManager.
 * 
 * constructor(services: JivsServices, externalObject: any)
 * 
 * Expected implementations are ObjectModelWriter and DictionaryModelWriter.
 * 
 * Implementation:
 * - Writing does not use the text value in any way. It only uses the native value. The text value is only used for display purposes.
 * 
 * - ModelWriter only writes fields defined as FieldValueHosts in ValueHostsManager.
 * 
 * - It uses the FieldValueHost.getPropertyName() function to resolve the name of the field in the external object. If the field is not found, it is ignored.
 *   getPropertyName uses the FieldValueHostConfig.propertyName if defined, otherwise it uses the FieldValueHost.name.
 * 
 * - It uses FieldValueHost.getValue() to get the native value.
 * 
 * - That value may not be compatible with the model property. By default, ModelWriter will omit the a value of undefined and keep the rest.
 *   To override that, we provide a rule system. Each rule takes the original value and returns the final value, which could be unchanged or a flag to omit it.
 *   There are several parts here:
 *      + Each rule is assigned to FieldValueHostConfig.modelWriterRule. It is an object with two required string properties: when and then.
 *          ```ts
 *          {
 *              valueHostName: 'myField',
 *              dataType: LookupKey.Number,
 *              modelWriterRule: { when: 'undefined', then: 'null' }
 *          }
 *          ```
 *          Examples:
 *          ```ts
 *          { when: 'undefined', then: 'omit' }        // skip the property when the value is undefined - this is used when modelWriterRule is absent from FieldValueHostConfig
 *          { when: 'undefined', then: 'null' }          // write null when the value is undefined
 *          { when: 'nullorundefined', then: 'zero' }    // write 0 when the value is null or undefined
 *          { when: 'undefined', then: 'keep' }          // write undefined as-is
 *          ```
 *      + The ModelWriterRuleService is used to register the functions behind the when/then names. See below for details.
 *          - The factory registers two types of functions: DetectInvalidValue and ReplaceWith. Each function is registered with a name. The name is used in the when/then properties of the rule.
 *          - Predefined rules are shown below and registered in the factory.
 *          - Expect the user to create very data specific rules like returning an object with a specific shape or a specific value. Date object is a good example.
 * 
 *      + When modelWriterRule is absent from FieldValueHostConfig, the default applies: { when: 'undefined', then: 'omit' }.
 * 
 * - No callbacks, DataTypeParsers, nor DataTypeFormatters are used in ModelWriter.
 * 
 * - Logging from LogService is used to track the writing of each field. Most logging is debug level, but errors are logged as errors.
 * 
 */
export interface IModelWriter
{
    /**
     * Writes the data from the ValueHostsManager to the external source.
     * It uses the FieldValueHostConfig to determine how to write the data and convert it to the correct type.
     * In particular, dataType to ensure the value is converted to the correct type.
     * It writes to the log for each field written, and logs errors if any occur.
     * Invalid values are handled by the ModelWriterRuleService and the error message is logged.
     * They do not throw errors, but log them and continue writing the rest of the fields.
     */
    write(): void;
}

/**
 * Contains the pair of settings that define a rule for the ModelReader and ModelWriter.
 * Both properties are names to locate the functions in the ModelReader/WriterRuleService. 
 * The When function is used to determine if the value is invalid and needs to be replaced. 
 * The Then function is used to determine what to do with the value identified by When functions.
 * FieldValueHostConfig.modelReaderRule and FieldValueHostConfig.modelWriterRule are of this type.
 */
export interface ModelReaderWriterRule
{
    /**
     * The name of the function registered in ModelReader/WriterRuleService to determine 
     * if the value is invalid and needs to be replaced.
     */
    when: string;
    /**
     * The name of the function registered in ModelReader/WriterRuleService to determine 
     * what to do with the value identified by the When function.
     */
    then: string;
}

/**
 * Pattern for the When function used in ModelReader/WriterRuleService. 
 * Returns true when the value is considered invalid and needs to be replaced, false when the value is valid.
 */
export type ModelReaderWriterWhenFunction = (value: any) => boolean;
/**
 * Pattern for the Then function used in ModelReader/WriterRuleService.
 * It is called when the When function returns true and provides the replacement value or
 * indicates if the value should be omitted.
 */
export type ModelReaderWriterThenFunction = (value: any) => { omit?: boolean; value?: any };

/**
 * The ModelReaderWriterRuleService resolves the rules used by either 
 * ModelReader or ModelWriter and is responsible for registering and retrieving the When and Then functions.
 * - resolve() takes a rule (ModelReaderWriterRule) and a value and returns either the original value, the adjusted value, or a skip flag indicating the value should not be assigned to the ValueHost.
 * - when() and then() retrieve and execute the When and Then functions by name.
 * - registerWhenFunction() and registerThenFunction() register the When and Then functions by name.
 * 
 * There are two implementations: ModelReaderWriterRuleService and ModelWriterRuleService.
 * Each has its own set of pre-registered functions.
 * They are registered in JivsServices and can be accessed via 
 * jivsServices.modelReaderRuleService and jivsServices.modelWriterRuleService.
 * It supports case-insensitive name lookup.
 */
export interface IModelReaderWriterRuleService extends IService
{
    /**
     * With a known model property name, value and rule, evaluate and return
     * either the original value, the adjusted value, or a skip flag indicating the value 
     * should not be assigned to the ValueHost.
     * @param modelPropertyName 
     * @param modelPropertyValue 
     * @param rule 
     * @param valueHost 
     * @param readerWriter 'Reader' or 'Writer' to indicate which service is calling this function. 
     * This is used for logging.
     * @returns An object with either skip: true, or adjustedValue: any. 
     * If skip is true, the value will be ignored.
     */
    resolve(modelPropertyName: string, modelPropertyValue: any,
        rule: ModelReaderWriterRule, valueHost: IFieldValueHost,
        readerWriter: 'Reader' | 'Writer'): { skip?: boolean, adjustedValue?: any; }
    /**
     * Retrieves the When function by its name.
     * @param name The name of the When function to retrieve.
     * @returns The When function if found, otherwise undefined.
     */
    getWhen(name: string): ModelReaderWriterWhenFunction | undefined;
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
    getThen(name: string): ModelReaderWriterThenFunction | undefined;
    /**
     * Executes the Then function by its name with the provided value.
     * @param name The name of the Then function to execute.
     * @param value The value to pass to the Then function.
     * @returns The result of the Then function if found, otherwise undefined.
     */
    then(name: string, value: any): { omit?: boolean; value?: any } | undefined;

    /**
     * Registers a When function with the given name.
     * @param name The name of the When function to register.
     * @param func The When function to register.
     */
    registerWhenFunction(name: string, func: ModelReaderWriterWhenFunction): void;
    /**
     * Registers a Then function with the given name.
     * @param name The name of the Then function to register.
     * @param func The Then function to register.
     */
    registerThenFunction(name: string, func: ModelReaderWriterThenFunction): void;
}

/**
 * ObjectFinder lets us supply a textual syntax to locating the object that hosts the desired property.
 * It expects a complete path down to the final property, and will basically strip off 
 * the last property name and return the object that hosts it.
 * 
 * This interface does not specify any syntax.
 * 
 * Note: While its an interface here which allows for dependency injection, we have not offered
 * it in our JivsServices. So currently create the desired instance directly.
 */
export interface IObjectFinder
{
    /**
     * Finds the object that hosts the property specified by the path.
     * @param model The root model object or array to search within.
     * @param path The textual path to the desired property.
     * @returns An object containing the found object and the property name, or undefined if not found.
     */
    find(model: object | Array<any>, path: string): { object: object | Array<any> | undefined, propertyName: string | undefined };
}