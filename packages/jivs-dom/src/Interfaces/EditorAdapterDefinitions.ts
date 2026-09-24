/**
 * Provides interfaces for Editor Adapter Definitions.
 * 
 * An Editor Adapter Definition coordinates the creation and management of 
 * editor adapters, presenters, and aria updaters for a specific widget model.
 * 
 * @module jivs-dom/Types/EditorAdapterDefinitions
 */

import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IDomAriaStaticElementUpdater, IDomAriaValidationStateElementUpdater } from './AriaUpdaters';
import { EditorInstallOptions } from './EditorInstaller';
import { IJivsDomElement } from "./IJivsDomElement";
import { IDomTextValueAdapter, IDomValueAdapter } from './Adapters';
import { IJivsDomServices } from './JivsDomServices';


/**
 * An Editor Adapter Definition keeps the behaviors for one widget model together.
 * Without this coordinating type, widget recognition, installation-anchor selection, 
 * Jivs-to-DOM value transfer, and DOM-to-Jivs event handling could be implemented 
 * independently and disagree about how the editor represents its value.
 * 
 * A definition is responsible for:
 *  - recognizing fields and elements that use its widget model;
 *  - resolving the element that serves as the installation anchor;
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
 * is selected and retained with the IJivsDomElement.jivsEditorAdapterDefinition property,
 * and its members create the adapters, presentations, and aria updaters for the widget.
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
    readonly defaultFieldPresentationName?: string | null;

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
     * @param element The DOM element to check against. Often used to match the tag, classes, and attributes.
     * For example, an InputHtmlElement can be matched by its tag name and type attribute.
     * @returns True if the adapter definition matches the given value host and element; otherwise, false.
     */
    matches(valueHost: IFieldValueHost, element: HTMLElement): boolean;

    /**
     * The element supplied to IEditorInstaller.install() identifies the editor encountered by the caller. 
     * The selected definition determines which element stores the completed installation and 
     * its installed capabilities.
     *
     * resolveInstallationAnchor() returns that element.
     * 
     * For ordinary editors, the supplied element is also the installation anchor.
     *
     * A composite editor may use several DOM elements for one logical value. 
     * Its definition can override resolveInstallationAnchor() so calls involving those elements converge on one anchor. 
     * A group of radio buttons, input type='radio' name='groupname', would have multiple input elements 
     * but a single installation anchor representing the group.
     * 
     * @param valueHost The field value host associated with the installation.
     * @param element The DOM element representing the editor encountered by the caller.
     * @returns The DOM element that serves as the installation anchor for this adapter definition.
     */
    resolveInstallationAnchor(valueHost: IFieldValueHost, element: IJivsDomElement): IJivsDomElement;

    /**
     * Creates a suitable IDomTextValueAdapter for the given value host and installation anchor.
     * @param valueHost The field value host associated with the installation.
     * @param anchor The DOM element serving as the installation anchor.
     * @returns A suitable IDomTextValueAdapter instance, or null if none can be created.
     * This method may return null if no suitable adapter can be created for the given value host and anchor.
     */
    createTextValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IDomTextValueAdapter | null;

    /**
     * Creates a suitable IDomValueAdapter for the given value host and installation anchor.
     * @param valueHost The field value host associated with the installation.
     * @param anchor The DOM element serving as the installation anchor.
     * @returns A suitable IDomValueAdapter instance, or null if none can be created.
     */
    createValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IDomValueAdapter | null;

    /**
     * Gets the static ARIA element updater associated with this adapter definition, if any.
     * The static ARIA element updater is responsible for managing ARIA attributes on the associated DOM element
     * without regard to validation state. Its run once, during installation of the editor.
     * This instance is considered immutable.
     * @returns An IDomAriaStaticElementUpdater instance, or null if none is available.
     */
    getStaticAriaElementUpdater?(): IDomAriaStaticElementUpdater | null;

    /**
     * Gets the validation state ARIA element updater associated with this adapter definition, if any.
     * The validation state ARIA element updater is responsible for managing ARIA attributes 
     * on the associated DOM element
     * based on the validation state of the editor.
     * This instance is considered immutable.
     * @returns An IDomAriaValidationStateElementUpdater instance, or null if none is available.
     */
    getValidationStateAriaElementUpdater?(): IDomAriaValidationStateElementUpdater | null;

    /**
     * The EditorInstaller uses this method to attach the editor to the send values mechanism
     * such as an onchange event handler.
     * EditorInstaller must ensure it can only be run once during the lifecycle of the editor
     * to avoid multiple attachments of the same editor to the send values mechanism.
     * @param valueHost The field value host associated with the installation.
     * @param anchor The DOM element serving as the installation anchor.
     * @param options The options for installing the editor.
     */
    attachToSendValues(valueHost: IFieldValueHost, anchor: IJivsDomElement,
        options: EditorInstallOptions): void;
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
