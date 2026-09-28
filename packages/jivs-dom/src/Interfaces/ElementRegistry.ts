/**
 * @inheritdoc IElementRegistry
 * @module jivs-dom/Types/ElementRegistry
 */

import { EditorInstallOptions } from './EditorInstaller';
import { FieldPresentationInstallOptions } from './FieldPresentations';
import { FormPresentationInstallOptions } from './FormPresentations';
import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost'

/**
 * ElementRegistry stores the DOM elements collected for one ValueHostsManager. 
 * It owns normalized records, Element Identifier resolution, a case-insensitive identifier index, 
 * delayed editor-anchor assignment, purpose-specific queries, insertion-order enumeration, 
 * and reference release.
 * 
 * It does not query the DOM, interpret markup, select participating elements, 
 * install capabilities, attach dispatchers, or log unmatched identifiers.
 * 
 * One Registry belongs to one manager. It is stored in manager metadata and is disposed 
 * when the manager is disposed.
 * 
 * # Consumers
 * - ElementCollector populates it
 * - FormInstaller requests ElementCollector to do that population and enumerates
 *   through the collected elements to run the EditorInstaller, FieldPresentationInstaller, 
 *   FormPresentationInstaller.
 * - The Dispatchers consume values through queries defined for their use cases.
 * - AriaService consumes it to manage ARIA attributes and accessibility-related interactions.
 */
export interface IElementRegistry extends Iterable<ElementRegistryRecord>
{
    /**
     * Adds an editor element to the registry.
     * @param element 
     * @param elementIdentifier 
     * @param options 
     */
    addEditor(element: IJivsDomElement, elementIdentifier: string,
        options?: EditorInstallOptions): void;

    /**
     * Adds a field element to the registry. Use it for any field-related role
     * except editor.
     * @param element 
     * @param elementIdentifier 
     * @param role 
     * @param options 
     */
    addField(element: IJivsDomElement, elementIdentifier: string, role: ElementRole | string,
        options?: FieldPresentationInstallOptions): void;

    /**
     * Adds a form element to the registry. Use it for any form-related role.
     * @param element 
     * @param role 
     * @param options 
     */
    addForm(element: IJivsDomElement, role: ElementRole | string,
        options?: FormPresentationInstallOptions): void;
    
    /**
     * The consumer (FormInstaller) determines the value of 
     * IEditorElementRegistryRecord.anchorElement. 
     * This is used to assign that property.
     * @param record 
     * @param anchorElement 
     */
    setEditorAnchorElement(record: IEditorElementRegistryRecord, anchorElement: IJivsDomElement): void;  
    
    /**
     * Query designed for ITextValueDispatcher. 
     * Query uses role='editor' and elementIdentifier to locate the relevant editor elements.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the text value adapters 
     * for the specified element identifier. It may return an empty list.
     */
    getTextValueAdapterElements(elementIdentifier: string): IJivsDomElement[];

    /**
     * Query designed for IValueDispatcher.
     * Query uses role='editor' and elementIdentifier to locate the relevant elements.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the value adapters 
     * for the specified element identifier. It may return an empty list.
     */
    getValueAdapterElements(elementIdentifier: string): IJivsDomElement[];

    /**
     * Query designed for IFieldValidationDispatcher.
     * Query uses kind='field' and elementIdentifier to locate the relevant elements.
     * Omits role='aria-error' which is a member of kind='field'.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the elements 
     * for the specified element identifier. It may return an empty list.
     */
    getFieldPresentationElements(elementIdentifier: string): IJivsDomElement[];

    /**
     * Query designed for IFormValidationDispatcher.
     * Query uses kind='form' to locate the relevant elements.
     * @returns An array of DOM elements corresponding to the elements.
     * It may return an empty list.
     */
    getFormPresentationElements(): IJivsDomElement[];

    /**
     * Query designed to retrieve these specific roles for a field element
     * given a matching Element Identifier.
     * - editor
     * - either 'aria-error' or 'error'. If both exists, it always uses 'aria-error'. 
     * Both may not exist, and it will return null for the element property in that case.
     * @param elementIdentifier 
     */
    getFieldAriaElementAnchors(elementIdentifier: string): IFieldAriaElementAnchors;   
    
    /**
     * Returns each unique FieldValueHost associated with the registered elements.
     */
    getResolvedFieldValueHosts(): IFieldValueHost[];

    /**
     * Clears all registered elements from the registry.
     * It is aggressive in that it nulls references from the records 
     * to promote rapid garbage collection and memory cleanup.
     */
    clear(): void;

    /**
     * Disposes of the element registry, releasing any resources and references it holds.
     * It is as aggressive as clear() in nulling references to 
     * promote rapid garbage collection and memory cleanup.
     */
    dispose(): void;
}

//#region Element Registry Records
export interface IEditorElementRegistryRecord
{
    readonly kind: 'field';
    readonly role: 'editor';
    /**
     * The DOM element representing this editor.
     * It is the value supplied by the EditorCollector.
     */
    readonly element: IJivsDomElement;    
    /**
     * Key used to align the editor with the FieldValueHost through 
     * the Element Identifier found on the FieldValueHost.
     * Typically this is a field name.
     */
    readonly elementIdentifier: string;
    /**
     * The FieldValueHost associated with this editor, or null if none is assigned.
     */
    readonly fieldValueHost: IFieldValueHost | null;

    /**
     * The DOM element serving as the anchor for this editor, or null if none is assigned.
     * It is often the same as anchorElement.
     * It is determined by and assigned using IEditorAdapterDefinition.resolveInstallationAnchor().
     * Its value is never supplied by ElementCollector.
     */
    readonly anchorElement: IJivsDomElement | null;
    readonly editorOptions: EditorInstallOptions | null;
}

export interface IFieldElementRegistryRecord
{
    readonly kind: 'field';
    readonly role: ElementRole | string;
    /**
     * The DOM element representing this editor.
     * It is the value supplied by the EditorCollector.
     */
    readonly element: IJivsDomElement;    
    /**
     * Key used to align the editor with the FieldValueHost through 
     * the Element Identifier found on the FieldValueHost.
     * Typically this is a field name.
     */
    readonly elementIdentifier: string;
    /**
     * The FieldValueHost associated with this editor, or null if none is assigned.
     */
    readonly fieldValueHost: IFieldValueHost | null;

    readonly presentationOptions: FieldPresentationInstallOptions | null;
}

export interface IFormElementRegistryRecord
{
    readonly kind: 'form';
    readonly role: ElementRole | string;
    /**
     * The DOM element representing this editor.
     * It is the value supplied by the EditorCollector.
     */
    readonly element: IJivsDomElement;    
    /**
     * Key used to align the editor with the FieldValueHost through 
     * the Element Identifier found on the FieldValueHost.
     * Typically this is a field name.
     */
    readonly elementIdentifier: null;
    /**
     * The FieldValueHost is never assigned on form elements.
     */
    readonly fieldValueHost: IFieldValueHost | null;
    readonly presentationOptions: FormPresentationInstallOptions | null;
}

export type ElementRegistryRecord =
    | IEditorElementRegistryRecord
    | IFieldElementRegistryRecord
    | IFormElementRegistryRecord;

//#endregion Element Registry Records

/**
 * Results from IElementRegistry.getFieldAriaElementAnchors()
 */
export interface IFieldAriaElementAnchors
{
    editorAnchor: IJivsDomElement | null;
    errorMessageElement: IJivsDomElement | null;
    errorMessageRole: ElementRole.error | ElementRole.ariaError | null;
}