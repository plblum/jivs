/**
 * Dispatcher service for managing various types of dispatchers in the Jivs DOM framework.
 * 
 * @module jivs-dom/Dispatchers/ConcreteClasses/DispatcherService
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IValidatableValueHost, ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { DispatcherCreator, IDispatcherService, IFieldValidationDispatcher, IFormValidationDispatcher, ITextValueDispatcher, IValueDispatcher } from '../Interfaces/Dispatchers';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { DomServiceBase } from '../Services/DomServiceBase';
import { FieldValidationDispatcher } from './FieldValidationDispatcher';
import { FormValidationDispatcher } from './FormValidationDispatcher';
import { TextValueDispatcher } from './TextValueDispatcher';
import { ValueDispatcher } from './ValueDispatcher';

/**
 * @inheritdoc jivs-dom/Types/Dispatchers!IDispatcherService
 */
export class DispatcherService extends DomServiceBase
    implements IDispatcherService
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }

    protected get textValueDispatcherRegistry(): DispatcherCreator<ITextValueDispatcher> {
        if (!this._textValueDispatcherRegistry) {
            this._textValueDispatcherRegistry = ()=> this.createTextValueDispatcher();
        }
        return this._textValueDispatcherRegistry;
    }
    protected createTextValueDispatcher(): ITextValueDispatcher
    {
        return new TextValueDispatcher(this.domServices);
    }
    protected get valueDispatcherRegistry(): DispatcherCreator<IValueDispatcher> {
        if (!this._valueDispatcherRegistry) {
            this._valueDispatcherRegistry = ()=> this.createValueDispatcher();
        }
        return this._valueDispatcherRegistry;
    }
    protected createValueDispatcher(): IValueDispatcher
    {
        return new ValueDispatcher(this.domServices);
    }

    protected get fieldValidationDispatcherRegistry(): DispatcherCreator<IFieldValidationDispatcher> {
        if (!this._fieldValidationDispatcherRegistry) {
            this._fieldValidationDispatcherRegistry = ()=> this.createFieldValidationDispatcher();
        }
        return this._fieldValidationDispatcherRegistry;
    }
    protected createFieldValidationDispatcher(): IFieldValidationDispatcher
    {
        return new FieldValidationDispatcher(this.domServices);
    }

    protected get formValidationDispatcherRegistry(): DispatcherCreator<IFormValidationDispatcher> {
        if (!this._formValidationDispatcherRegistry) {
            this._formValidationDispatcherRegistry = ()=> this.createFormValidationDispatcher();
        }
        return this._formValidationDispatcherRegistry;
    }
    protected createFormValidationDispatcher(): IFormValidationDispatcher
    {
        return new FormValidationDispatcher(this.domServices);
    }
    private _textValueDispatcherRegistry?: DispatcherCreator<ITextValueDispatcher>;
    private _valueDispatcherRegistry?: DispatcherCreator<IValueDispatcher>;
    private _fieldValidationDispatcherRegistry?: DispatcherCreator<IFieldValidationDispatcher>;
    private _formValidationDispatcherRegistry?: DispatcherCreator<IFormValidationDispatcher>;

    /**
     * Registers a factory function for creating text value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    public registerTextValueChangedDispatcher(
        creator: DispatcherCreator<ITextValueDispatcher>): void
    {
        this._textValueDispatcherRegistry = creator;
    }

    /**
     * Registers a factory function for creating value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    public registerValueChangedDispatcher(
        creator: DispatcherCreator<IValueDispatcher>): void
    {
        this._valueDispatcherRegistry = creator;
    }

    /**
     * Registers a factory function for creating value host validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    public registerValueHostValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFieldValidationDispatcher>): void
    {
        this._fieldValidationDispatcherRegistry = creator;
    }

    /**
     * Registers a factory function for creating form validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    public registerValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFormValidationDispatcher>): void
    {
        this._formValidationDispatcherRegistry = creator;
    }

    /**
     * Composite of using individual attach functions so you can have a one-call
     * solution to attachment. It always attaches onValidationState and onValueHostValidationState
     * because those are fundamental to the operation of the value hosts manager.
     * The decision of using onTextValueChanged and onValueChanged attachments is left to the caller.
     */
    public attach(valueHostsManager: IValueHostsManager, useTextValue?: boolean, useNativeValue?: boolean): void
    {
        this.attachValueHostValidationStateChanged(valueHostsManager);
        this.attachValidationStateChanged(valueHostsManager);
        if (useTextValue)
        {
            this.attachTextValueChanged(valueHostsManager);
        }
        if (useNativeValue)
        {
            this.attachValueChanged(valueHostsManager);
        }
    }

    /**
     * Attaches a ITextValueDispatcher to IValueHostsManager.onTextValueChanged callback.
     * This allows the dispatcher to respond to text value changes in the value hosts managed by the value hosts manager.
     * If onTextValueChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached ITextValueDispatcher instance, or null if none could be attached.
     */
    public attachTextValueChanged(valueHostsManager: IValueHostsManager): ITextValueDispatcher | null
    {
        let savedOnTextValueChanged = valueHostsManager.onTextValueChanged;
        let dispatcher = this.textValueDispatcherRegistry();
        valueHostsManager.onTextValueChanged = (valueHost: IValidatableValueHost, oldValue?: string | null) =>
        {
            savedOnTextValueChanged?.apply(this, [valueHost, oldValue]);
            dispatcher.dispatch(valueHost as IFieldValueHost, oldValue ?? undefined);
        };
        return dispatcher;

    }

    /**
     * Attaches a IValueDispatcher to IValueHostsManager.onValueChanged callback.
     * This allows the dispatcher to respond to value changes in the value hosts managed by the value hosts manager.
     * If onValueChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached IValueDispatcher instance, or null if none could be attached.
     */
    public attachValueChanged(valueHostsManager: IValueHostsManager): IValueDispatcher | null
    {
        let savedOnValueChanged = valueHostsManager.onValueChanged;
        let dispatcher = this.valueDispatcherRegistry();
        valueHostsManager.onValueChanged = (valueHost: IValueHost, oldValue?: any) =>
        {
            savedOnValueChanged?.apply(this, [valueHost, oldValue]);
            dispatcher.dispatch(valueHost as IFieldValueHost, oldValue ?? undefined);
        };
        return dispatcher;
    }
    

    /**
     * Attaches a IFieldValidationDispatcher to IValueHostsManager.onValueHostValidationStateChanged callback.
     * This allows the dispatcher to respond to value host validation state changes in the value hosts managed by the value hosts manager.
     * If onValueHostValidationStateChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached IFieldValidationDispatcher instance, or null if none could be attached.
     */
    public attachValueHostValidationStateChanged(valueHostsManager: IValueHostsManager): IFieldValidationDispatcher | null
    {
        let savedOnValueHostValidationStateChanged = valueHostsManager.onValueHostValidationStateChanged;
        let dispatcher = this.fieldValidationDispatcherRegistry();
        valueHostsManager.onValueHostValidationStateChanged = (valueHost: IValidatableValueHost, state: ValueHostValidationState) =>
        {
            savedOnValueHostValidationStateChanged?.apply(this, [valueHost, state]);
            dispatcher.dispatch(valueHost as IFieldValueHost, state);
        };
        return dispatcher;
    }

    /**
     * Attaches a IFormValidationDispatcher to IValueHostsManager.onValidationStateChanged callback.
     * This allows the dispatcher to respond to form validation state changes in the value hosts managed by the value hosts manager.
     * If onValidationStateChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached IFormValidationDispatcher instance, or null if none could be attached.
     */
    public attachValidationStateChanged(valueHostsManager: IValueHostsManager): IFormValidationDispatcher | null
    {
        let savedOnValidationStateChanged = valueHostsManager.onValidationStateChanged;
        let dispatcher = this.formValidationDispatcherRegistry();
        valueHostsManager.onValidationStateChanged = (valueHostsManager: IValueHostsManager, state: ValidationState) =>
        {
            savedOnValidationStateChanged?.apply(this, [valueHostsManager, state]);
            dispatcher.dispatch(valueHostsManager, state);
        };
        return dispatcher;
    }

}