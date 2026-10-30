/**
 * @inheritdoc jivs-engine/ReaderWriter/Types
 * @module jivs-engine/ReaderWriter/ConcreteClasses
 */

import { FieldValueHostSetValueOptions, IFieldValueHost } from '../Interfaces/FieldValueHost';
import { ReaderOptions } from '../Interfaces/ReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ValueRulesReaderBase } from './ReaderBase';

/**
 * Concrete implementation of ReaderBase for reading from a model object.
 * 
 * @template TExternalData - The type of the model object. Can be a class instance or a plain object.
 */
export class ModelReader<TExternalData extends object = object, TOptions extends ReaderOptions = ReaderOptions>
    extends ValueRulesReaderBase<TExternalData, TOptions>
{
    constructor(valueHostsManager: IValueHostsManager, model: TExternalData, options?: TOptions)
    {
        super(valueHostsManager, model, options);
    }

}

/**
 * Concrete implementation of ReaderBase for reading from a dictionary object.
 * 
 * @template TExternalData - The type of the dictionary object. Must be an object with string keys and any values.
 */
export class DictionaryReader<TExternalData extends { [key: string]: any; } = { [key: string]: any; },
    TOptions extends ReaderOptions = ReaderOptions>
    extends ValueRulesReaderBase<TExternalData, TOptions>
{
    constructor(valueHostsManager: IValueHostsManager, dictionary: TExternalData, options?: TOptions)
    {
        super(valueHostsManager, dictionary, options);
    }
}

export interface FormReaderOptions extends ReaderOptions
{
    /**
     * When true, enables the reformatTextValues feature that can be used to reformat the text values in the form. 
     * When false, the text values are not reformatted. ValueHosts must be setup for both
     * parsing and formatting features to work. The reformatTextValues feature is useful for forms that
     * are used to edit existing data. It will reformat the text values in the form to match the
     * formatting rules of the ValueHosts.
     * Even if enabled, individual FieldValueHostConfig.reformatTextValue can block this when false.
     */
    reformatTextValue?: boolean;
}
/**
 * Targets HTML forms. Supports dictionaries of string values that need to be converted to native values.
 * Writes the text values using FieldValueHost.setTextValue() instead of FieldValueHost.setValue().
 * That will allow the FieldValueHost to convert the text value to a native value using its DataTypeParser.
 * Each ValueHost must be setup for parsing features to work. 
 * 
 * The structure passed in is expected to be a plain object with string keys and string values. 
 * The keys are the names of the form fields, and the values are the text values to be set into the form fields.
 * Use this in node.js together with the express library to get the form data from the request body and 
 * set it into the form fields.
 * ```ts
 * const express = require("express");
 * const app = express();
 * app.use(express.urlencoded({ extended: true }));
 *
 * app.post("/submit", (req, res) => {
 *      const formData = req.body;
 *      const formReader = new FormReader(valueHostsManager, formData);
 *      formReader.read();
 * });
 * ```
 * The options parameter of the constructor has meaningful options:
 * - skipValueChangedCallback - If you setup ValueHostsManager.onTextValueChanged, this option
 * determines if that callback occurs. Usually the callback sets the element in the UI,
 * and your decision is based on if you are using this Reader to programmatically set the form values.
 * - disableFormatter - It will always be treated as false, regardless of the value passed in the options.
 */
export class FormReader<TOptions extends FormReaderOptions = FormReaderOptions>
    extends ValueRulesReaderBase<{ [key: string]: string; }, TOptions>
{
    /**
     * 
     * @param valueHostsManager 
     * @param httpFormData - Use the Express library to supply this model.
     * ```ts
     * app.post("/submit", (req, res) => {
     *      const formData = req.body;
     *      const formReader = new FormReader(valueHostsManager, formData);
     *      formReader.read();
     * });
     * ```
     */
    constructor(valueHostsManager: IValueHostsManager, httpFormData: { [key: string]: string; }, options?: TOptions)
    {
        super(valueHostsManager, httpFormData, options);
        this.options.disableFormatter = false;
    }

    public override read(): void
    {
        let saved = this.valueHostsManager.behaviors.reformatTextValue;
        this.valueHostsManager.behaviors.reformatTextValue = this.options.reformatTextValue;
        try
        {
            super.read();
        }
        finally
        {
            this.valueHostsManager.behaviors.reformatTextValue = saved;
        }
    }

    protected override getSetValueOptions(): FieldValueHostSetValueOptions
    {
        let options: FieldValueHostSetValueOptions = super.getSetValueOptions();
        options.disableParser = false; // ensure parser is enabled for text values
        return options;
    }
    protected override setValueIntoValueHost(valueHost: IFieldValueHost, value: any, options?: FieldValueHostSetValueOptions): void
    {
        valueHost.setTextValue(value, options);
    }
}