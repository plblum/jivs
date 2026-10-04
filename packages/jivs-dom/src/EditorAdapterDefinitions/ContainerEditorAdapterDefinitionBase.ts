/**
 * Provides an abstract base class for editor adapter definitions whose
 * build around a container element, while the actual editor resides within that container.
 *
 * @module jivs-dom/EditorAdapterDefinitions/AbstractClasses/ContainerEditorAdapterDefinitionBase
 */

import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';

/**
 * Base class for editor adapter definitions that use a container around the actual editor element.
 * 
 * It defines the anchor and editor elements separately:
 * - Anchor: The container element gets the IJivsDomElement structure.
 * - Editor: The actual editor element.
 * 
 * The matches() function defaults to using containerElement.querySelector(editorSelector) 
 * to locate the descendant editor. That is not very performant for large DOM trees
 * especially when matches is run against a list of Adapter definitions.
 * To improve performance, consider using a containerSelector to quickly filter 
 * out non-matching containers before performing a descendant search.
 * 
 * Example:
 * ```html
 * <div class="container">
 *     <input type="text" class="editor" />
 * </div>
 * ```
 * In this example, the container has the class "container" and the descendant editor has the class "editor".
 * The containerSelector could be "div.container" and the editorSelector could be "input[type="text"].editor".
 *
 * The adapters remain assigned to the container's
 * IJivsDomElement properties even though they read from and write to the
 * descendant editor.
 * 
 * This design uses the Editor Adapter Definition explicitly designed for the editor itself,
 * leaving the container adapter to manage the container while redirecting to the editor adapter for editor-specific operations.
 * Override createChildEditorDefinitionAdapter() to provide the editor-specific adapter definition.
 */
export abstract class ContainerEditorAdapterDefinitionBase<TEditor extends HTMLElement = HTMLElement>
    extends EditorAdapterDefinitionBase
{
    /**
     * Creates a contained-editor adapter definition.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory.
     * @param containerSelector Optional CSS selector that the container must match.
     * Pass null to allow any container with child elements.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    protected constructor(adapterKey: string, priority: number,
        containerSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {
        super(adapterKey, priority, recommendedFieldPresentationName);

        this._containerSelector = containerSelector !== undefined
            ? containerSelector
            : this.defaultContainerSelector();
    }

    /**
     * Optional CSS selector that the container must match before its descendants
     * are searched by the matches() function.
     *
     * A null value permits any element with child elements. The selector may
     * identify a tag, class, attribute, or any supported selector combination.
     *
     * An invalid selector is a configuration error. The exception raised by
     * HTMLElement.matches() is intentionally not suppressed.
     */
    public get containerSelector(): string | null
    {
        return this._containerSelector;
    }
    private readonly _containerSelector: string | null;

    /**
     * Returns the default container selector.
     *
     * Override this method when every instance of a concrete definition should
     * expect a particular container structure. The default is null.
     */
    protected defaultContainerSelector(): string | null
    {
        return null;
    }

    /**
     * CSS selector used to locate the supported editor within the container.
     *
     * Concrete definitions should make this selector specific enough to
     * identify the exact tag and input type they support.
     * 
     * Example:
     * ```ts
     *  return 'input[type=\"text\"].editor';
     * ```
     */
    protected abstract get editorSelector(): string;

    protected get childEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        if (!this._childEditorDefinitionAdapter)
        {
            this._childEditorDefinitionAdapter = this.createChildEditorDefinitionAdapter();
            this._childEditorDefinitionAdapter.domServices = this.domServices;
        }

        return this._childEditorDefinitionAdapter;
    }
    private _childEditorDefinitionAdapter?: IEditorAdapterDefinition;

    /**
     * Creates and returns the child editor definition adapter associated with this container editor.
     * This adapter is responsible for handling the actual editor element.
     * Our container adapter redirects several options to it:
     * - Value retrieval and setting
     * - Event handling
     * - HTML element structure validation
     * - Any other editor-specific behavior
     */
    protected abstract createChildEditorDefinitionAdapter(): IEditorAdapterDefinition;

    /**
     * Determines whether the element is a supported editor container.
     * Used by the EditorAdapterDefinitionFactory when requesting an adapter without a 
     * specific adapter key.
     *
     * The containerSelector is checked before any descendant search. Containers
     * without child elements are rejected without executing editorSelector.
     *
     * @param valueHost The field value host associated with the candidate editor.
     * @param candidateElement The candidate container element.
     * @returns True when the container satisfies its configured restriction and
     * contains a supported descendant editor.
     */
    public override matches(valueHost: IFieldValueHost, candidateElement: HTMLElement): boolean
    {
        if (this.containerSelector !== null && !candidateElement.matches(this.containerSelector))
            return false;

        if (candidateElement.childElementCount === 0)
            return false;

        let editor = this.findEditorElement(candidateElement);
        return editor !== null && this.childEditorDefinitionAdapter.matches(valueHost, editor);
    }

    /**
     * Resolves the editor as an element within the container using findEditorElement().
     * Throws if the editor element cannot be found within the container.
     * @param valueHost The host object that provides the field value.
     * @param anchor The anchor element associated with the editor.
     * @returns The editor element within the container.
     */
    public override identifyEditor(valueHost: IFieldValueHost, anchor: IJivsDomElement): HTMLElement
    {
        let editor = this.findEditorElement(anchor);
        if (!editor)
        {
            let msg = `Editor element not found within the container.`;
            this.log(LoggingLevel.Error, msg, anchor, valueHost);
            throw new Error(msg);
        }
        return editor;
    }

    /**
     * Finds the supported editor within the container.
     *
     * The default implementation performs a deep descendant search using
     * editorSelector. Override this method when a widget requires different
     * element-resolution behavior.
     *
     * @param container The container whose descendants will be searched.
     * @returns The matching editor element, or null when none is found.
     */
    protected findEditorElement(container: HTMLElement): TEditor | null
    {
        return container.querySelector<TEditor>(this.editorSelector);
    }

    /**
     * Redirects the creation of a text value adapter to the child editor definition adapter.
     * @param valueHost The host object that provides the field value.
     * @param editor The editor element within the container.
     * @param anchor The anchor element associated with the editor.
     * @returns The text value adapter for the editor element, or null if none is created.
     */
    public override createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement): ITextValueAdapter | null
    {
        // Create and return a text value adapter for the editor element here.
        return this.childEditorDefinitionAdapter.createTextValueAdapter(valueHost, editor, anchor);
    }

    /**
     * Redirects the creation of a value adapter to the child editor definition adapter.
     * @param valueHost The host object that provides the field value.
     * @param editor The editor element within the container.
     * @param anchor The anchor element associated with the editor.
     * @returns The value adapter for the editor element, or null if none is created.
     */
    public override createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement | null): IValueAdapter | null
    {
        return this.childEditorDefinitionAdapter.createValueAdapter(valueHost, editor, anchor);
    }

    /**
     * Redirects the attachment of send values to the child editor definition adapter.
     * @param valueHost The host object that provides the field value.
     * @param editor The editor element within the container.
     * @param anchor The anchor element associated with the editor.
     * @param options Optional installation options for the editor.
     */
    public override attachToSendValues(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement, options?: EditorInstallOptions): void
    {
        // Attach event listeners or perform other setup for the editor element here.
        this.childEditorDefinitionAdapter.attachToSendValues(valueHost, editor, anchor, options ?? {});
    }
    protected override attachToSendValuesCore(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement, options: EditorInstallOptions): void
    {
        // Not used
    }
}