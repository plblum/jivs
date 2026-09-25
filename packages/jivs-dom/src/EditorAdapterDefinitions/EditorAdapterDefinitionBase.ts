/**
 * @inheritdoc jivs-dom/Types/EditorAdapterDefinitions
 * @module jivs-dom/EditorAdapterDefinitions/AbstractClasses/EditorAdapterDefinitionBase
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { IAriaStaticElementUpdater, IAriaValidationStateElementUpdater } from '../Interfaces/AriaUpdaters';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Base class for editor adapter definitions.
 * Always assign its domServices property after creation.
 * 
 * @inheritdoc jivs-dom/Types/EditorAdapterDefinitions!IEditorAdapterDefinition
 */
export abstract class EditorAdapterDefinitionBase
    implements IEditorAdapterDefinition
{

    protected constructor(adapterKey: string, priority: number,
        defaultFieldPresentationName?:string | null)
    {
        assertNotNull(adapterKey, 'adapterKey');
        this._adapterKey = adapterKey;
        this._priority = priority;
        this._defaultFieldPresentationName = defaultFieldPresentationName ?? null;
    }

    /**
     * Always set this after creating the instance of the adapter definition.
     * Expect the IEditorAdapterDefinitionFactory to assign it during registration.
     */
    public get domServices(): IJivsDomServices
    {
        return this._domServices;
    }
    public set domServices(value: IJivsDomServices)
    {
        this._domServices = value;
    }
    private _domServices!: IJivsDomServices;

    /**
     * Uniquely identifies a registered definition within the 
     * Editor Adapter Definition Factory allowing the same implementation
     * of IEditorAdapterDefinition to be used against many Adapter Keys.
     * For example, InputEditorAdapterDefinition supports many input tags,
     * and each will have a unique adapter key: 'input:text', 'input:password', etc.
     * 
     * Consumers can directly reference by this value from the factory,
     * but also can let the factory search based on other criteria.
     */
    public get adapterKey(): string
    {
        return this._adapterKey;
    }
    private _adapterKey: string;

    /**
     * Indicates ordering within the factory, with an expected (but not required)
     * range of 0 to 100, where 0 is the highest priority.
     */
    public get priority(): number
    {
        return this._priority;
    }
    private _priority: number;

    /**
     * Provides the Presentation Name used by default for this Editor Adapter Definition.
     * Allows each editor to supply a companion presentation.
     */
    public get defaultFieldPresentationName(): string | null | undefined
    {
        return this._defaultFieldPresentationName;
    }
    private _defaultFieldPresentationName?: string | null;

    /**
     * Log wrapper around the Jivs logging service to prepare log details in addition
     * to the message itself. The message supports tokens of `{element}` and `{valuehost}` 
     * which will be replaced with the source element's identifier 
     * and the target FieldValueHost's name, respectively.
     * @param loggingLevel 
     * @param message 
     * @param anchor 
     * @param valueHost 
     */
    protected log(loggingLevel: LoggingLevel,
        message: string,
        anchor: HTMLElement | null, valueHost: IFieldValueHost | null): void
    {
        this._domServices.loggingFacade.log(
            loggingLevel,
            (facade) =>
            {
                return facade.prepareLogDetails(
                    message,
                    anchor as HTMLElement,
                    valueHost,
                    this,
                    this.adapterKey
                );
            });
    }

    /**
     * Used by the factory to find a matching editor adapter definition 
     * for the given value host and element.
     * 
     * @param valueHost - often useful for its data type (valueHost.getDataType())
     * @param element - often useful for the element type or attributes when determining a match.
     * @returns true if this editor adapter definition matches the given value host and element; 
     * otherwise, false.
     */
    public abstract matches(valueHost: IFieldValueHost, element: HTMLElement): boolean;

    /**
     * Resolves the installation anchor element for this editor widget.
     * An Installation Anchor Element becomes attached to the IJivsDomElement
     * interface.
     * Many editors are a single element, meaning their installation anchor is 
     * already the element itself.
     * A radiobutton group is a good example of having multiple elements
     * to describe the editor.
     * 
     * By default, it returns the provided element.
     * 
     * @param valueHost - the value host associated with the editor.
     * Its data type (valueHost.getDataType()) is often used to determine the appropriate installation anchor.
     * @param element - the initial element considered for installation.
     * @returns the resolved installation anchor element.
     */
    public resolveInstallationAnchor(valueHost: IFieldValueHost, element: IJivsDomElement): IJivsDomElement
    {
        return element;
    }

    /**
     * Attaches the editor's send values functionality to send its value
     * to the associated value host.
     * For example input tags are attached through their onchange event.
     * 
     * @param valueHost - the value host associated with the editor.
     * @param anchor - the installation anchor element for the editor.
     * @param options - additional options for editor installation.
     */
    public attachToSendValues(valueHost: IFieldValueHost, anchor: IJivsDomElement,
        options?: EditorInstallOptions): void
    {
        if (!options)
            options = {};
        this.attachToSendValuesCore(valueHost, anchor, options);

        this.log(LoggingLevel.Debug,
            `Attaching editor to send values for element '{element}' and value host '{valuehost}'.`,
            anchor as HTMLElement, valueHost);
    }

    /**
     * Override to supply editor specific attachment logic for sending values to the value host.
     * 
     * @param valueHost - the value host associated with the editor.
     * @param anchor - the installation anchor element for the editor.
     * @param options - additional options for editor installation.
     */
    protected abstract attachToSendValuesCore(valueHost: IFieldValueHost,
        anchor: IJivsDomElement, options: EditorInstallOptions): void;

    /**
     * Provides a new instance of the TextValueAdapter to assign to 
     * IJivsDomElement.jivsTextValueAdapter.
     * Leave null if the editor does not support it.
     * @param valueHost - the value host associated with the editor.
     * @param anchor - the installation anchor element for the editor.
     * @returns a new instance of the TextValueAdapter or null if not supported.
     */
    public abstract createTextValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): ITextValueAdapter | null;       
    /**
     * Provides a new instance of the ValueAdapter to assign to 
     * IJivsDomElement.jivsValueAdapter.
     * Leave null if the editor does not support it.
     * @param valueHost - the value host associated with the editor.
     * @param anchor - the installation anchor element for the editor.
     * @returns a new instance of the ValueAdapter or null if not supported.
     */
    public abstract createValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IValueAdapter | null;

    /**
     * The Aria system uses a default Static Element Updater that may not
     * correctly locate the right element to assign its attributes. 
     * In that case, develop a custom Static Element Updater and return it from this method.
     * @returns a new instance of the Static Element Updater 
     * or null if the default one is sufficient.
     */
    public getStaticAriaElementUpdater?(): IAriaStaticElementUpdater | null
    {
        return null;
    }
    /**
     * The Aria system uses a default Validation State Element Updater that may not
     * correctly locate the right element to assign its attributes. 
     * In that case, develop a custom Validation State Element Updater and 
     * return it from this method.
     * @returns a new instance of the Validation State Element Updater 
     * or null if the default one is sufficient.
     */
    public getValidationStateAriaElementUpdater?(): IAriaValidationStateElementUpdater | null
    {
        return null;
    }    

    //#region utilities
    /**
     * A utility for subclasses to simplify their development of attachToSendValuesCore.
     * It does most of the work, only requiring you to attach a trigger, such as 
     * the editors onchanged event handler.
     * 
     * Internally, it fetches the current text value from the editor and 
     * sends it to the value host, ensuring validation is called.
     * 
     * ```ts
     * let self = this;
     * element.addEventListener('change', () => {
     *     self.sendTextValue(valueHost, anchor, domServices, false);
     * });
     * ```
     * 
     * @param valueHost - The value host to which the text value will be sent.
     * @param anchor - The DOM element associated with the editor.
     * @param duringEdit - An optional boolean indicating if the value is being sent during an edit operation.
     */
    protected sendTextValue(valueHost: IFieldValueHost, anchor: IJivsDomElement,
        duringEdit?: boolean): void
    {
        if (!anchor.jivsTextValueAdapter)
        {
            this.log(LoggingLevel.Warn,
                `No text value adapter found on the element '{element}' associated with ValueHost '{valuehost}'.`,
                anchor as HTMLElement,
                valueHost);
            return;
        }

        const textValue = anchor.jivsTextValueAdapter.readTextValue();
        valueHost.setTextValue(textValue, {
            validate: true,
            duringEdit: duringEdit
        });
    }

    /**
     * A utility for subclasses to simplify their development of attachToSendValuesCore.
     * It does most of the work, only requiring you to attach a trigger, such as 
     * the editors onchanged event handler.
     * Only use this for editors that operate on native values, not text values.
     * If the user is able to edit text, use sendTextValue instead because
     * Jivs needs to validate the user input.
     * 
     * Internally, it fetches the current native value from the editor and 
     * sends it to the value host, ensuring validation is called.
     * 
     * ```ts
     * let self = this;
     * element.addEventListener('change', () => {
     *     self.sendNativeValue(valueHost, anchor, domServices);
     * });
     * ```
     * @param valueHost - The value host to which the native value will be sent.
     * @param anchor - The DOM element associated with the editor.
     * @returns void
     */
    protected sendNativeValue(valueHost: IFieldValueHost, anchor: IJivsDomElement): void
    {
        if (!anchor.jivsValueAdapter)
        {
            this.log(LoggingLevel.Warn,
                `No native value adapter found on the element '{element}' associated with ValueHost '{valuehost}'.`,
                anchor as HTMLElement,
                valueHost);

            return;
        }

        const nativeValue = anchor.jivsValueAdapter.readValue();
        valueHost.setValue(nativeValue, {
            validate: true
        });
    }
    //#endregion utilities
}