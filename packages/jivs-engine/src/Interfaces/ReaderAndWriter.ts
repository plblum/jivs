/**
 * A common problem in working between external data sources and ValueHostsManager is transferring
 * data between the two. This problem requires a knowledge of each field and how to convert it to the correct type. 
 * 
 * Jivs provides a way to encapsulate this knowledge into classes, one to read from external source
 * and the other two write to it.
 * 
 * IReader: from external source to ValueHostsManager
 * IWriter: from ValueHostsManager to external source
 * 
 * Core classes provide tooling for going through the fields of a model or other data holder and converting them to the correct type. 
 * This is done by using a Reader and Writer to read and write the data.
 * The base Reader and Writer classes handle the common functionality, while the subclasses handle the shape of the external data.
 * - ModelReader/Writer - handle the reading and writing of model data to and from ValueHostsManager.
 * - DictionaryReader/Writer - handle the reading and writing of dictionary data to and from ValueHostsManager.
 * - FormReader - handle the reading HTML form data passed into the server side validation phase from an HTTP post request.
 * Jivs-Dom adds:
 * - EditorReader/Writer - transfer values with the editors in HTML
 * 
 * # ReaderBase (IReader interface)
 * Native value from external source -> FieldValueHost native value -> (optionally) FieldValueHost text value
 * See {@link jivs-engine/ReaderWriter/Types!IReader} for details.
 * 
 * # ValueRulesReaderBase (extends ReaderBase)
 * Connects the ValueAdapterService to readers to follow value transition rules 
 * found on FieldValueHostConfig.readerRule.
 * 
 * # WriterBase (IWriter interface)
 * FieldValueHost native value -> Native value on external source
 * See {@link jivs-engine/ReaderWriter/Types!IWriter} for details.
 * 
 * # ValueRulesWriterBase (extends WriterBase)
 * Connects the ValueAdapterService to writers to follow value transition rules 
 * found on FieldValueHostConfig.writerRule.
 * 
 * See {@link jivs-engine/Services/Types/ValueAdapterService} for details.
 * 
 * @module jivs-engine/ReaderWriter/Types
 */

import { IFieldValueHost } from './FieldValueHost';

/**
 * The Reader is responsible for reading data from an external source and populating the ValueHostsManager with the data. 
 * It uses the FieldValueHostConfig to determine how to read the data and convert it to the correct type.
 * In particular, dataType to ensure the value is converted to the correct type.
 * 
 * Actual class is expected to take in services so it has access to the logService,
 * and an instance of the external source to read from.
 * 
 * constructor(valueHostsManager: IValueHostsManager, externalSource: TSource, options: ReaderOptions)
 * 
 * Implementation:
 * - ReaderBase only reads fields defined as FieldValueHosts in ValueHostsManager. 
 * 
 * - It uses the FieldValueHost.getPropertyName() function to resolve the name of the field in the external object. If the field is not found, it is ignored.
 *   getPropertyName uses the FieldValueHostConfig.propertyName if defined, otherwise it uses the FieldValueHost.name.
 * 
 * - Field values are assigned native values. The destination FieldValueHost has two representations: native and text values.
 *   By calling FieldValueHost.setValue(), it can set both based on rules found in setValue().
 *      + The FieldValueHostConfig must be setup to identify a lookup key for a DataTypeFormatter. It gets the lookup key from formatterLookupKey and dataType as a fallback.
 *      + DataTypeFormatterService must support that lookup key.
 *      + There are several switches to opt out: behaviors.disableFormattingOnValueChange, formatterLookupKey = null, and the setValueOption.disableFormatter.
 *        Since ReaderBase calls setValue internally, it hides the setValueOption.disableFormatter from the caller.
 *        Instead, ReaderBase has a property disableFormattingOnValueChange that can be set to true to disable formatting on value change.
 * 
 * - Values of the external object may be converted to the correct type using the DataTypeConversionService.
 * 
 * - By design, ValueHostsManager's onValueChanged() and onTextValueChanged() callbacks are called during setValue(). Yet when reading from a model,
 *   we are providing initial population of the ValueHostsManager. The UI that wires up onTextValueChanged prior to running the reader will
 *   get their callback invoked. If wired up to update the input element, it will replace the current value. That may be what we want.
 *   So its up to the user to decide if the callback is used. Using setValue(value, { skipValueChangedCallback: true }) will suppress the callback. However, 
 *   setValueOptions are not exposed to the ReaderBase. Instead, ReaderBase has a property skipValueChangedCallback that can be set to true to suppress the callback.
 * 
 * - If a model property value = undefined, the associated ValueHost gets setValueToUndefined(). No callbacks will happen.
 * 
 * - If a field cannot be converted, this is considered an error for validation to report. setValue() still sets up the native value but not the formatted text value.
 *   Instead, the error message from the formatter is injected using the InjectedError feature of setValueOptions. That lets it appear as an error on the field.
 * 
 * - Logging from LogService is used to track the writing of each field. Most logging is debug level, but errors are logged as errors.
 */
export interface IReader
{
    /**
     * Reads the data from the external source and populates the ValueHostsManager with the data.
     * It uses the FieldValueHostConfig to determine how to read the data and convert it to the correct type.
     * In particular, dataType to ensure the value is converted to the correct type.
     * It writes to the log for each field read, and logs errors if any occur.
     * Invalid values are handled by the DataTypeFormatterService and the error message is injected into the ValueHost using InjectedError.
     * They do not throw errors, but log them and continue reading the rest of the fields.
     * @param options The options controlling how the Reader interacts with the ValueHostsManager.
     */
    read(): void;
}

/**
 * Configures options for the ReaderBase, controlling how it interacts with ValueHostsManager during the reading process.
 */
export interface ReaderOptions
{
    /**
     * Once finished, invoke validation on all fields using the preliminary option.
     * This will ensure that all fields are validated, except:
     *  - Required validators because the user doesn't need to notifications about fields they haven't edited
     *  - Fields that already show signs of validation. This will let you replace (reinitialize) 
     *    a few values and run validation without getting other fields involved.
     * Defaults to true if not specified.
     */
    preliminaryValidation?: boolean;
    /**
     * Controls behavior of setValue to turn off its ability to
     * convert the value to text through an associated DataTypeFormatter.
     * When true, do not convert the value to text. Just set the native value.
     * When false, other options remain to do the same thing:
     *   - valueHostsManager.behaviors.disableFormatterOnValueChange
     *   - FieldValueHostConfig.formatterLookupKey = null
     * This effectively sets the setValue(value, { disableFormatter: value }) option.
     */
    disableFormatter?: boolean;

    /**
     * Controls behavior of setValue to skip the ValueHost's onValueChanged and onTextValueChanged callbacks.
     * When true, skip the callback. When false, call it if setup.
     * This effectively sets the setValues(value, { skipValueChangedCallback: value }) option.
     */
    skipValueChangedCallback?: boolean;

    /**
     * When true, each ValueHost.enabled state is based on whether the corresponding model property is defined 
     * and not disabled by other means.
     */
    alignEnabled?: boolean;

    /**
     * A filter function that determines which ValueHosts should be included in the reading process.
     * Used on read() but not readField().
     */
    filter?: ReaderWriterFilterHandler;
}

/**
 * For ReaderOptions.filter and WriterOptions.filter, a function that determines whether a given ValueHost should be included in the reading/writing process.
 * It receives an IFieldValueHost as an argument and returns a boolean indicating inclusion (true) or exclusion (false).
 */
export type ReaderWriterFilterHandler = (valueHost: IFieldValueHost) => boolean;

/**
 * The WriterBase is responsible for writing data from the ValueHostsManager to an external source.
 * It uses the FieldValueHostConfig.writerRule to determine how to write the data and convert it to the correct type.
 * If that property is not defined, it uses the default rule: { when: 'undefined', then: 'omit' }.
 * 
 * Actual class is expected to take in services so it has access to the logService,
 * and an instance of the external object to write to.
 * The instance can be prepopulated with data, and the WriterBase will update the fields that are defined as FieldValueHosts in the ValueHostsManager.
 * 
 * constructor(valueHostsManager: IValueHostsManager, externalDestination: TDestination, options: WriterOptions)
 * 
 * Implementation:
 * - Writing does not use the text value in any way. It only uses the native value. The text value is only used for display purposes.
 * 
 * - WriterBase only writes fields defined as FieldValueHosts in ValueHostsManager.
 * 
 * - It uses the FieldValueHost.getPropertyName() function to resolve the name of the field in the external object. If the field is not found, it is ignored.
 *   getPropertyName uses the FieldValueHostConfig.propertyName if defined, otherwise it uses the FieldValueHost.name.
 * 
 * - It uses FieldValueHost.getValue() to get the native value.
 * 
 * - That value may not be compatible with requirements on the external destination. By default, WriterBase will omit the a value of undefined and keep the rest.
 *   To override that, we provide a rule system. Each rule takes the original value and returns the final value, which could be unchanged or a flag to omit it.
 *   There are several parts here:
 *      + Each rule is assigned to FieldValueHostConfig.writerRule. It is an object with two required string properties: when and then.
 *          ```ts
 *          {
 *              valueHostName: 'myField',
 *              dataType: LookupKey.Number,
 *              writerRule: { when: 'undefined', then: 'null' }
 *          }
 *          ```
 *          Examples:
 *          ```ts
 *          { when: 'undefined', then: 'omit' }        // skip the property when the value is undefined - this is used when writerRule is absent from FieldValueHostConfig
 *          { when: 'undefined', then: 'null' }          // write null when the value is undefined
 *          { when: 'nullorundefined', then: 'zero' }    // write 0 when the value is null or undefined
 *          { when: 'undefined', then: 'keep' }          // write undefined as-is
 *          ```
 *      + The ValueAdapterService is used to register the functions behind the when/then names. See below for details.
 *          - The factory registers two types of functions: When and Then. Each function is registered with a name. The name is used in the when/then properties of the rule.
 *          - Predefined rules are shown below and registered in the factory.
 *          - Expect the user to create very data specific rules like returning an object with a specific shape or a specific value. Date object is a good example.
 * 
 *      + When writerRule is absent from FieldValueHostConfig, the default applies: { when: 'undefined', then: 'omit' }.
 * 
 * - No callbacks, DataTypeParsers, nor DataTypeFormatters are used in WriterBase.
 * 
 * - Logging from LogService is used to track the writing of each field. Most logging is debug level, but errors are logged as errors.
 * 
 */
export interface IWriter
{
    /**
     * Writes the data from the ValueHostsManager to the external destination.
     * It uses the FieldValueHostConfig to determine how to write the data and convert it to the correct type.
     * In particular, dataType to ensure the value is converted to the correct type.
     * It writes to the log for each field written, and logs errors if any occur.
     * Invalid values are handled by the ValueAdapterService and the error message is logged.
     * They do not throw errors, but log them and continue writing the rest of the fields.
     */
    write(): void;
}

/**
 * Configures options for the WriterBase, controlling how it interacts with ValueHostsManager during the writing process.
 */
export interface WriterOptions
{
    /**
     * A filter function that determines which ValueHosts should be included in the writing process.
     * Used on write() but not writeField().
     */
    filter?: ReaderWriterFilterHandler;
}
