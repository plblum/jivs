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
 * ModelReader notes:
 * - ModelReader only reads fields defined as FieldValueHosts in ValueHostsManager.
 * - Field values are assigned native values. The destination FieldValueHost has two representations: native and textual.
 * By calling FieldValueHost.setValue(), it can set both using a DataTypeFormatter class whose key is supplied in FieldValueHostConfig.formatterLookupKey.
 * Otherwise, it does not try to set the textual representation. It is up to the caller to set the textual representation if needed.
 * - By design, ValueHostsManager's onValueChanged() and onTextValueChanged() callbacks are called during setValue(). Yet when reading from a model,
 * we are providing initial population of the ValueHostsManager. The UI that wires up onTextValueChanged prior to running the reader will
 * get their callback invoked. If wired up to update the input element, it will replace the current value. That may be what we want.
 * So its up to the user to decide if the callback is used. Using setValue(value, { skipValueChangedCallback: true }) will suppress the callback. The default is false.
 * - If a field is undefined in the model, the associated ValueHost gets setValueToUndefined().
 * - If a field cannot be converted, this is considered an error for validation to report. setValue() still sets up the native value but not the formatted value.
 * This should be caught by setting the 
 * 
 * @module jivs-engine/Interfaces/ModelReader
 */
