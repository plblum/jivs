/**
 * @inheritdoc jivs-dom/Types/EditorAdapterDefinitions
 * @module jivs-dom/EditorAdapterDefinitions/AbstractClasses/EditorAdapterDefinitionBase
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../Interfaces/AriaUpdaters';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { EditorAriaStaticUpdater } from '../Aria/EditorAriaStaticUpdater';
import { EditorAriaValidationStateUpdater } from '../Aria/EditorAriaValidationStateUpdater';

/**
 * Base class for editor adapter definitions.
 * Always assign its domServices property after creation.
 * 
 * @inheritdoc jivs-dom/Types/EditorAdapterDefinitions!IEditorAdapterDefinition
 */
export abstract class EditorAdapterDefinitionBase
    implements IEditorAdapterDefinition
{

    /**
     * Creates a wrapped-editor adapter definition.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    protected constructor(adapterKey: string, priority: number,
        recommendedFieldPresentationName?:string | null)
    {
        assertNotNull(adapterKey, 'adapterKey');
        this._adapterKey = adapterKey;
        this._priority = priority;
        this._recommendedFieldPresentationName =
            recommendedFieldPresentationName !== undefined ?
                recommendedFieldPresentationName :
                this.defaultFieldPresentationName();
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
     * The default is supplied by the `defaultFieldPresentationName` method but can be overriden
     * by a parameter in the constructor.
     */
    public get recommendedFieldPresentationName(): string | null | undefined
    {
        return this._recommendedFieldPresentationName;
    }
    private _recommendedFieldPresentationName?: string | null;

    /**
     * Returns the default field presentation name for this editor adapter definition.
     */
    protected abstract defaultFieldPresentationName(): string | null;

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
     * Used when searching the registry for a matching adapter definition.
     * Uses characteristics found on its parameters to match.
     * @param valueHost - Supplies the field name from getElementIdentifier() and its data type
     * from its getDataType().
     * @param candidateElement The DOM element to check against. Often used to match the tag, classes, and attributes.
     * For example, an InputHtmlElement can be matched by its tag name and type attribute.
     * @returns true if this editor adapter definition matches the given value host and element; 
     * otherwise, false.
     */
    public abstract matches(valueHost: IFieldValueHost, candidateElement: HTMLElement): boolean;
    
    /**
     * Resolves the element known as the "Anchor" which hosts the IJivsDomElement structure.
     * 
     * The element passed into these functions may not be the right one to hold IJivsDomElement, the "Anchor".
     * This function allows the adapter definition to determine the most appropriate element to hold the IJivsDomElement structure.
     * Most of the time, the supplied element is the correct anchor, but this may not always be the case.
     * 
     * The use case to override is a radio button group. The caller will supply one radio button element,
     * but the AdapterDefinition will fix it to a specific radio button element representing the group,
     * such as the first.
     * 
     * @param valueHost The field value host associated with the editor.
     * @param element The DOM element representing the editor supplied to this adapter definition.
     * @returns The DOM element that serves as the anchor for this adapter definition.
     */
    public identifyAnchor(valueHost: IFieldValueHost, element: HTMLElement): IJivsDomElement
    {
        return element;
    }

    /**
     * Resolves the element known as the "Editor", which is the actual editor element to be used for interactions.
     * 
     * The element passed into these functions may not be the actual editor element itself; 
     * it could be a container or another related element.
     * 
     * This method should return the actual editor element that will be used for interactions, 
     * even if the supplied element is a container or related element.
     * 
     * This class returns the element passed to it as the editor, assuming it is the actual editor element.
     * 
     * @param valueHost The field value host associated with the editor.
     * @param anchor The Anchor element from which we can resolve the editor element.
     */
    public identifyEditor(valueHost: IFieldValueHost, anchor: IJivsDomElement): HTMLElement
    {
        return anchor;
    }

    /**
     * The EditorInstaller uses this method to attach the editor to the send values mechanism
     * such as an onchange event handler.
     * EditorInstaller must ensure it can only be run once during the lifecycle of the editor
     * to avoid multiple attachments of the same editor to the send values mechanism.
     * @param valueHost The field value host associated with the editor.
     * @param editor The DOM element representing the editor hosting the actual value.
     * @param anchor The DOM element that contains the IJivsDomElement structure.
     * It is often the same as the editor element.
     * @param options The options for installing the editor.
     */
    public attachToSendValues(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement,
        options?: EditorInstallOptions): void
    {
        if (!options)
            options = {};
        this.attachToSendValuesCore(valueHost, editor, anchor, options);

        this.log(LoggingLevel.Debug,
            `Attaching editor to send values for element '{element}' and value host '{valuehost}'.`,
            editor, valueHost);
    }

    /**
     * Override to supply editor specific attachment logic for sending values to the value host.
     * 
     * @param valueHost - the value host associated with the editor.
     * @param editor - the DOM element representing the editor hosting the actual value.
     * @param anchor - the DOM element that contains the IJivsDomElement structure.
     * It is often the same as the editor element.
     * @param options - additional options for editor installation.
     */
    protected abstract attachToSendValuesCore(valueHost: IFieldValueHost,
        editor: HTMLElement, anchor: IJivsDomElement, options: EditorInstallOptions): void;

    /**
     * Provides a new instance of the TextValueAdapter to assign to 
     * IJivsDomElement.jivsTextValueAdapter.
     * Leave null if the editor does not support it.
     * @param valueHost - the value host associated with the editor.
     * @param editor - the DOM element representing the editor hosting the actual value.
     * @param anchor - the DOM element that contains the IJivsDomElement structure.
     * It can be null if its the same value as element.
     * @returns a new instance of the TextValueAdapter or null if not supported.
     */
    public abstract createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement | null): ITextValueAdapter | null;       
    /**
     * Provides a new instance of the ValueAdapter to assign to 
     * IJivsDomElement.jivsValueAdapter.
     * Leave null if the editor does not support it.
     * @param valueHost - the value host associated with the editor.
     * @param editor - the DOM element representing the editor hosting the actual value.
     * @param anchor - the DOM element that contains the IJivsDomElement structure.
     * It can be null if its the same value as element.
     * @returns a new instance of the ValueAdapter or null if not supported.
     */
    public abstract createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement | null): IValueAdapter | null;

    /**
     * The Aria system uses a default Static Element Updater that may not
     * correctly locate the right element to assign its attributes. 
     * In that case, develop a custom Static Element Updater and return it from this method.
     * @returns a new instance of the Static Element Updater 
     * or null if the default one is sufficient.
     */
    public getStaticAriaElementUpdater(): IAriaStaticUpdater | null
    {
        return new EditorAriaStaticUpdater();
    }
    /**
     * The Aria system uses a default Validation State Element Updater that may not
     * correctly locate the right element to assign its attributes. 
     * In that case, develop a custom Validation State Element Updater and 
     * return it from this method.
     * @returns a new instance of the Validation State Element Updater 
     * or null if the default one is sufficient.
     */
    public getValidationStateAriaElementUpdater(): IAriaValidationStateUpdater | null
    {
        return new EditorAriaValidationStateUpdater();
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
     * @param editor - The DOM element representing the editor hosting the actual value.
     * @param anchor - The DOM element that contains the IJivsDomElement structure.
     * It is often the same as the editor element.
     * @param duringEdit - An optional boolean indicating if the value is being sent during an edit operation.
     */
    protected sendTextValue(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement,
        duringEdit?: boolean): void
    {
        if (!anchor.jivsTextValueAdapter)
        {
            this.log(LoggingLevel.Warn,
                `No text value adapter found on the element '{element}' associated with ValueHost '{valuehost}'.`,
                editor,
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
     *     self.sendNativeValue(valueHost, editor, anchor, domServices);
     * });
     * ```
     * @param valueHost - The value host to which the native value will be sent.
     * @param editor - The DOM element representing the editor hosting the actual value.
     * @param anchor - The DOM element that contains the IJivsDomElement structure.
     * It is often the same as the editor element.
     */
    protected sendNativeValue(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement): void
    {
        if (!anchor.jivsValueAdapter)
        {
            this.log(LoggingLevel.Warn,
                `No native value adapter found on the element '{element}' associated with ValueHost '{valuehost}'.`,
                editor,
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