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
 * See {@link jivs-engine/ModelReaderWriter/Types!IModelReader} for details.
 * 
 * ModelReader has a rule on each FieldValueHostConfig to determine how to read the data and 
 * convert it to the correct type. Mostly it is used to detect values in the source that represent
 * "unassigned", and to convert them to undefined in the FieldValueHost. 
 * 
 * The rule is assigned to FieldValueHostConfig.modelWriterRule. It is an object with two required string properties: when and then.
 * 
 * Rules are defined in the DataCleanupService. 
 * 
 * # ModelWriter (IModelWriter interface)
 * FieldValueHost native value -> Native value on model
 * See {@link jivs-engine/ModelReaderWriter/Types!IModelWriter} for details.
 * 
 * ModelWriter has a rule on each FieldValueHostConfig to determine how to write the data and 
 * convert it to the correct type. Mostly it is used to detect values in the FieldValueHost that are undefined
 * and give them the correct representation in the model. However, it can create other values
 * and be used when there are non-undefined values. For example, when 'null' then 'zero' would 
 * convert a null value to 0 in the model.
 * 
 * Rules are defined in the DataCleanupService.
 * 
 * See {@link jivs-engine/Services/Types/DataCleanupService} for details.
 * 
 * @module jivs-engine/ModelReaderWriter/Types
 */

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
    readFromModel(): void;
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
 *      + The DataCleanupService is used to register the functions behind the when/then names. See below for details.
 *          - The factory registers two types of functions: When and Then. Each function is registered with a name. The name is used in the when/then properties of the rule.
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
     * Invalid values are handled by the DataCleanupService and the error message is logged.
     * They do not throw errors, but log them and continue writing the rest of the fields.
     */
    writeToModel(): void;
}
