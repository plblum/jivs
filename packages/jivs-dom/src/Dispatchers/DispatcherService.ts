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

/**
 * @inheritdoc jivs-dom/Types/Dispatchers!IDispatcherService
 * 
 * This class is setup like a factory for each of the 4 dispatcher types.
 * It has a default, which uses selector = undefined in its attach functions.
 */
export class DispatcherService extends DomServiceBase
    implements IDispatcherService
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }

    protected get textValueDispatcherRegistry(): Map<string, DispatcherCreator<ITextValueDispatcher>> {
        if (!this._textValueDispatcherRegistry) {
            this._textValueDispatcherRegistry = new Map<string, DispatcherCreator<ITextValueDispatcher>>();
        }
        return this._textValueDispatcherRegistry;
    }
    private _textValueDispatcherRegistry?: Map<string, DispatcherCreator<ITextValueDispatcher>>;
    protected get valueDispatcherRegistry(): Map<string, DispatcherCreator<IValueDispatcher>> {
        if (!this._valueDispatcherRegistry) {
            this._valueDispatcherRegistry = new Map<string, DispatcherCreator<IValueDispatcher>>();
        }
        return this._valueDispatcherRegistry;
    }

    protected get fieldValidationDispatcherRegistry(): Map<string, DispatcherCreator<IFieldValidationDispatcher>> {
        if (!this._fieldValidationDispatcherRegistry) {
            this._fieldValidationDispatcherRegistry = new Map<string, DispatcherCreator<IFieldValidationDispatcher>>();
        }
        return this._fieldValidationDispatcherRegistry;
    }

    protected get formValidationDispatcherRegistry(): Map<string, DispatcherCreator<IFormValidationDispatcher>> {
        if (!this._formValidationDispatcherRegistry) {
            this._formValidationDispatcherRegistry = new Map<string, DispatcherCreator<IFormValidationDispatcher>>();
        }
        return this._formValidationDispatcherRegistry;
    }
    private _valueDispatcherRegistry?: Map<string, DispatcherCreator<IValueDispatcher>>;
    private _fieldValidationDispatcherRegistry?: Map<string, DispatcherCreator<IFieldValidationDispatcher>>;
    private _formValidationDispatcherRegistry?: Map<string, DispatcherCreator<IFormValidationDispatcher>>;

    /**
     * Registers a factory function for creating text value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     * @param selector An optional selector to support a traditional factory pattern.
     */
    public registerTextValueChangedDispatcher(
        creator: DispatcherCreator<ITextValueDispatcher>, selector?: string): void
    {
        this.textValueDispatcherRegistry.set(selector ?? '', creator);
    }

    /**
     * Registers a factory function for creating value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     * @param selector An optional selector to support a traditional factory pattern.
     */
    public registerValueChangedDispatcher(
        creator: DispatcherCreator<IValueDispatcher>, selector?: string): void
    {
        this.valueDispatcherRegistry.set(selector ?? '', creator);
    }

    /**
     * Registers a factory function for creating value host validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     * @param selector An optional selector to support a traditional factory pattern.
     */
    public registerValueHostValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFieldValidationDispatcher>, selector?: string): void
    {
        this.fieldValidationDispatcherRegistry.set(selector ?? '', creator);
    }

    /**
     * Registers a factory function for creating form validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     * @param selector An optional selector to support a traditional factory pattern.
     */
    public registerValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFormValidationDispatcher>, selector?: string): void
    {
        this.formValidationDispatcherRegistry.set(selector ?? '', creator);
    }

    /**
     * Composite of using individual attach functions so you can have a one-call
     * solution to attachment. It always attaches onValidationState and onValueHostValidationState
     * because those are fundamental to the operation of the value hosts manager.
     * The decision of using onTextValueChanged and onValueChanged attachments is left to the caller.
     * Unlike the other attach functions, this does not offer an selector parameter that is passed
     * through to the dispatcher. It always assumes selector = undefined.
     * If selector is needed, use the dispatcher-specific attach functions instead.
     */
    public attach(valueHostsManager: IValueHostsManager, addTextValueChanged?: boolean, addValueChanged?: boolean): void
    {
        this.attachValueHostValidationStateChanged(valueHostsManager);
        this.attachValidationStateChanged(valueHostsManager);
        if (addTextValueChanged)
        {
            this.attachTextValueChanged(valueHostsManager);
        }
        if (addValueChanged)
        {
            this.attachValueChanged(valueHostsManager);
        }
    }

    /**
     * Attaches a ITextValueDispatcher to IValueHostsManager.onTextValueChanged callback.
     * This allows the dispatcher to respond to text value changes in the value hosts managed by the value hosts manager.
     * If onTextValueChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @param selector Optional selector to distinguish between different dispatcher instances.
     * @returns The attached ITextValueDispatcher instance, or null if none could be attached.
     */
    public attachTextValueChanged(valueHostsManager: IValueHostsManager, selector?: string): ITextValueDispatcher | null
    {
        let dispatcherCreator = this.textValueDispatcherRegistry.get(selector ?? '');
        if (!dispatcherCreator)
        {
            this.logger().message(LoggingLevel.Warn, ()=> `No ITextValueDispatcher registered for selector: '${selector ?? ''}'`);
            return null;
        }
        let savedOnTextValueChanged = valueHostsManager.onTextValueChanged;
        let dispatcher = dispatcherCreator();
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
     * @param selector Optional selector to distinguish between different dispatcher instances.
     * @returns The attached IValueDispatcher instance, or null if none could be attached.
     */
    public attachValueChanged(valueHostsManager: IValueHostsManager, selector?: string): IValueDispatcher | null
    {
        let dispatcherCreator = this.valueDispatcherRegistry.get(selector ?? '');
        if (!dispatcherCreator)
        {
            this.logger().message(LoggingLevel.Warn, ()=> `No IValueDispatcher registered for selector: '${selector ?? ''}'`);
            return null;
        }
        let savedOnValueChanged = valueHostsManager.onValueChanged;
        let dispatcher = dispatcherCreator();
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
     * @param selector Optional selector to distinguish between different dispatcher instances.
     * @returns The attached IFieldValidationDispatcher instance, or null if none could be attached.
     */
    public attachValueHostValidationStateChanged(valueHostsManager: IValueHostsManager, selector?: string): IFieldValidationDispatcher | null
    {
        let dispatcherCreator = this.fieldValidationDispatcherRegistry.get(selector ?? '');
        if (!dispatcherCreator)
        {
            this.logger().message(LoggingLevel.Warn, ()=> `No IFieldValidationDispatcher registered for selector: '${selector ?? ''}'`);
            return null;
        }
        let savedOnValueHostValidationStateChanged = valueHostsManager.onValueHostValidationStateChanged;
        let dispatcher = dispatcherCreator();
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
     * @param selector Optional selector to distinguish between different dispatcher instances.
     * @returns The attached IFormValidationDispatcher instance, or null if none could be attached.
     */
    public attachValidationStateChanged(valueHostsManager: IValueHostsManager, selector?: string): IFormValidationDispatcher | null
    {
        let dispatcherCreator = this.formValidationDispatcherRegistry.get(selector ?? '');
        if (!dispatcherCreator)
        {
            this.logger().message(LoggingLevel.Warn, ()=> `No IFormValidationDispatcher registered for selector: '${selector ?? ''}'`);
            return null;
        }
        let savedOnValidationStateChanged = valueHostsManager.onValidationStateChanged;
        let dispatcher = dispatcherCreator();
        valueHostsManager.onValidationStateChanged = (valueHostsManager: IValueHostsManager, state: ValidationState) =>
        {
            savedOnValidationStateChanged?.apply(this, [valueHostsManager, state]);
            dispatcher.dispatch(valueHostsManager, state);
        };
        return dispatcher;
    }

}