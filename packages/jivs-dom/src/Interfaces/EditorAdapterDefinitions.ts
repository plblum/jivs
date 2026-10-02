/**
 * Provides interfaces for Editor Adapter Definitions.
 * 
 * An Editor Adapter Definition coordinates the creation and management of 
 * editor adapters, presenters, and aria updaters for a specific widget model.
 * 
 * @module jivs-dom/Types/EditorAdapterDefinitions
 */

import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IAriaStaticUpdater, IAriaValidationStateUpdater } from './AriaUpdaters';
import { EditorInstallOptions } from './EditorInstaller';
import { IJivsDomElement } from "./IJivsDomElement";
import { ITextValueAdapter, IValueAdapter } from './Adapters';
import { IJivsDomServices } from './JivsDomServices';


/**
 * An Editor Adapter Definition keeps the behaviors for one widget model together.
 * 
 * It takes in one HTMLElement representing the editor encountered by the caller.
 * It establishes an HTMLElement that will retain the IJivsDomElement structure.
 * We call that the "Anchor". We call the original element the editor element or "Element".
 * 
 * A definition is responsible for:
 *  - recognizing fields and elements that use its widget model;
 *  - resolving the element that serves as the anchor;
 *  - directly constructing the anchor’s Text Value and Native Value adapters;
 *  - attaching DOM event handlers that send edited values to the IFieldValueHost;
 *  - identifying the default field presentation associated with the widget, when applicable;
 *  - optionally supplying specialized static and validation-state ARIA updaters for the widget.
 * 
 * Instances are considered immutable. Once created, their properties should not be modified.
 * The EditorAdapterDefinitionFactory shares its instances among multiple consumers to ensure consistency and avoid redundant definitions.
 * 
 * Every implementation gets assigned a unique adapterKey and a priority when registered
 * with the IJivsDomService's factory to determine its order of consideration among multiple adapter definitions.
 * 
 * During installation by EditorInstaller, the matching instance registered with the IJivsDomService's factory
 * is selected, its anchor identified, and the EditorAdapterDefinition gets retained
 * with the IJivsDomElement.jivsEditorAdapterDefinition property.
 */
export interface IEditorAdapterDefinition
{
    /**
     * The unique key that identifies this adapter definition.
     */
    readonly adapterKey: string;
    /**
     * The priority of this adapter definition, used to determine its order of consideration 
     * among multiple adapter definitions.
     * Lower numbers indicate higher priority. Recommended range: 0 to 100, where 0 is the highest priority.
     */
    readonly priority: number;

    /**
     * The presentation name recommended for this widget's default field presentation.
     * It must have an associated IFieldPresentation registered with the IJivsDomService's factory.
     */
    readonly recommendedFieldPresentationName?: string | null;

    /**
     * Get/set access to the IJivsDomServices instance associated with this adapter definition.
     * The same object should own the factory that produces this adapter definition.
     */
    domServices: IJivsDomServices;

    /**
     * Used when searching the registry for a matching adapter definition.
     * Uses characteristics found on its parameters to match.
     * @param valueHost - Supplies the field name from getElementIdentifier() and its data type
     * from its getDataType().
     * @param candidateElement The DOM element to check against. Often used to match the tag, classes, and attributes.
     * For example, an InputHtmlElement can be matched by its tag name and type attribute.
     * @returns True if the adapter definition matches the given value host and element; otherwise, false.
     */
    matches(valueHost: IFieldValueHost, candidateElement: HTMLElement): boolean;

    /**
     * Resolves the element known as the "Editor", which is the actual editor element to be used for interactions.
     * 
     * The element passed into these functions may not be the actual editor element itself; 
     * it could be a container or another related element.
     * 
     * This method should return the actual editor element that will be used for interactions, 
     * even if the supplied element is a container or related element.
     * 
     * @param valueHost The field value host associated with the editor.
     * @param element The DOM element known to the caller. It may be the actual editor or another element. It needs to be recognized by an Editor Adapter Definition.
     */
    identifyEditor(valueHost: IFieldValueHost, element: HTMLElement): HTMLElement;

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
     * @param valueHost The field value host associated with the installation.
     * @param element The DOM element representing the editor supplied to this adapter definition.
     * @returns The DOM element that serves as the anchor for this adapter definition.
     */
    identifyAnchor(valueHost: IFieldValueHost, element: HTMLElement): IJivsDomElement;

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
    attachToSendValues(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement,
        options: EditorInstallOptions): void;    

    /**
     * Creates a suitable ITextValueAdapter for the given value host together with both its Editor and Anchor elements.
     * @param valueHost The FieldValueHost that will get and set values with the editor.
     * @param editor The DOM element representing the editor hosting the actual value.
     * @param anchor The DOM element that contains the IJivsDomElement structure.
     * It can be null if its the same value as element.
     * @returns A suitable ITextValueAdapter instance, or null if none can be created.
     * This method may return null if no suitable adapter can be created for the given value host and anchor.
     */
    createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement | null): ITextValueAdapter | null;

    /**
     * Creates a suitable IValueAdapter for the given value host together with both its Editor and Anchor elements.
     * @param valueHost The FieldValueHost that will get and set values with the editor.
     * @param editor The DOM element representing the editor hosting the actual value.
     * @param anchor The DOM element that contains the IJivsDomElement structure.
     * It can be null if its the same value as element.
     * @returns A suitable IValueAdapter instance, or null if none can be created.
     */
    createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement | null): IValueAdapter | null;

    /**
     * Gets the static ARIA element updater associated with this adapter definition, if any.
     * The static ARIA element updater is responsible for managing ARIA attributes on the associated DOM element
     * without regard to validation state. Its run once, during installation of the editor.
     * This instance is considered immutable.
     * @returns An IAriaStaticUpdater instance, or null if none is available.
     */
    getStaticAriaElementUpdater(): IAriaStaticUpdater | null;

    /**
     * Gets the validation state ARIA element updater associated with this adapter definition, if any.
     * The validation state ARIA element updater is responsible for managing ARIA attributes 
     * on the associated DOM element
     * based on the validation state of the editor.
     * This instance is considered immutable.
     * @returns An IAriaValidationStateUpdater instance, or null if none is available.
     */
    getValidationStateAriaElementUpdater(): IAriaValidationStateUpdater | null;


}

/**
 * Registers and selects editor adapter definitions as part of running 
 * the IEditorInstaller.
 * IJivsDomService.editorAdapterFactory retains the sole instance.
 * 
 * Registered instances of IEditorAdapterDefinition must be treated as immutable.
 */
export interface IEditorAdapterDefinitionFactory
{
    /**
     * Registers the given editor adapter definition with the factory.
     * The definition must be treated as immutable once registered.
     * Each instance has a unique Adapter Key. Typically implementations allow
     * passing the adapter key and priority into their constructors.
     * ```ts
     * const definition = new TextAreaAdapterDefinition('textarea', 10);
     * factory.register(definition);
     * ```
     * @param definition The editor adapter definition to register with the factory.
     */
    register(definition: IEditorAdapterDefinition): void;

    /**
     * A way to lazily register editor adapter definitions with the factory.
     * It is called automatically if nothing has been registered with the factory yet,
     * but only when the factory is first accessed.
     * ```ts
     * factory.lazyRegistration((factory) => {
     *     factory.register(new TextAreaAdapterDefinition('textarea', 10));
     * });
     * ```
     * @param registrationFunction The function that will be called to lazily register editor adapter definitions with the factory.
     */
    lazyRegistration(registrationFunction: (factory: IEditorAdapterDefinitionFactory)=>void): void;

    /**
     * Retrieves the editor adapter definition associated with the given adapter key, if any.
     * @param adapterKey The unique adapter key of the editor adapter definition to retrieve.
     * @returns The editor adapter definition associated with the given adapter key, or null if none is found.
     */
    getDefinition(adapterKey: string): IEditorAdapterDefinition | null;

    /**
     * Finds an editor adapter definition that matches the given value host and element characteristics.
     * Effectively each IEditorAdapterDefinition.matches() function is called in priority order until a match is found.
     * 
     * @param valueHost The field value host to match against.
     * @param element The DOM element to match against.
     * @returns The matching editor adapter definition, or null if none is found.
     */
    findDefinition(valueHost: IFieldValueHost, element: HTMLElement): IEditorAdapterDefinition | null;
}
