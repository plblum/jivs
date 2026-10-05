/**
 * Provides an abstract base class for editor adapter definitions
 * built around a wrapper, while the actual editor resides within that wrapper.
 *
 * @module jivs-dom/EditorAdapterDefinitions/AbstractClasses/WrappedEditorAdapterDefinitionBase
 */

import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';

/**
 * Base class for editor adapter definitions that use a wrapper around the actual editor element.
 * 
 * "Wrapper" refers to the container element that surrounds the actual editor element.
 * It is treated as part of the editor itself, even though it is a separate DOM element.
 * 
 * 
 * It defines the anchor and editor elements separately:
 * - Anchor: The wrapper gets the IJivsDomElement structure.
 * - Editor: The actual editor element.
 * 
 * The matches() function defaults to using wrappedElement.querySelector(editorSelector) 
 * to locate the descendant editor. That is not very performant for large DOM trees
 * especially when matches is run against a list of Adapter definitions.
 * To improve performance, consider using a wrapperSelector to quickly filter 
 * out non-matching wrappers before performing a descendant search.
 * 
 * Example:
 * ```html
 * <div class="wrapped">
 *     <input type="text" class="editor" />
 * </div>
 * ```
 * In this example, the wrapper has the class "wrapped" and the descendant editor has the class "editor".
 * The wrapperSelector could be "div.wrapped" and the editorSelector could be "input[type="text"].editor".
 *
 * The adapters remain assigned to the wrapper's
 * IJivsDomElement properties even though they read from and write to the
 * descendant editor.
 * 
 * This design uses the Editor Adapter Definition explicitly designed for the editor itself,
 * leaving the wrapper adapter to manage the wrapper while redirecting to the editor adapter for editor-specific operations.
 * Override createChildEditorDefinitionAdapter() to provide the editor-specific adapter definition.
 */
export abstract class WrappedEditorAdapterDefinitionBase<TEditor extends HTMLElement = HTMLElement>
    extends EditorAdapterDefinitionBase
{
    /**
     * Creates a wrapped-editor adapter definition.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param wrapperSelector Optional CSS selector that the wrapper must match.
     * Pass null to allow any wrapped with child elements.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    protected constructor(adapterKey: string, priority: number,
        wrapperSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {
        super(adapterKey, priority, recommendedFieldPresentationName);

        this._wrapperSelector = wrapperSelector !== undefined
            ? wrapperSelector
            : this.defaultWrapperSelector();
    }

    /**
     * Optional CSS selector that the wrapper must match before its descendants
     * are searched by the matches() function.
     *
     * A null value permits any element with child elements. The selector may
     * identify a tag, class, attribute, or any supported selector combination.
     *
     * An invalid selector is a configuration error. The exception raised by
     * HTMLElement.matches() is intentionally not suppressed.
     */
    public get wrapperSelector(): string | null
    {
        return this._wrapperSelector;
    }
    private readonly _wrapperSelector: string | null;

    /**
     * Returns the default wrapped selector.
     *
     * Override this method when every instance of a concrete definition should
     * expect a particular wrapped structure. The default is null.
     */
    protected defaultWrapperSelector(): string | null
    {
        return null;
    }

    /**
     * CSS selector used to locate the supported editor within the wrapper.
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
     * Creates and returns the child editor definition adapter associated with this wrapped editor.
     * This adapter is responsible for handling the actual editor element.
     * Our wrapped adapter redirects several options to it:
     * - Value retrieval and setting
     * - Event handling
     * - HTML element structure validation
     * - Any other editor-specific behavior
     */
    protected abstract createChildEditorDefinitionAdapter(): IEditorAdapterDefinition;

    /**
     * Determines whether the element is a supported editor.
     * Used by the EditorAdapterDefinitionFactory when requesting an adapter without a 
     * specific adapter key.
     *
     * The wrapperSelector is checked before any descendant search. Wrappers
     * without child elements are rejected without executing editorSelector.
     *
     * @param valueHost The field value host associated with the candidate editor.
     * @param candidateElement The candidate wrapper.
     * @returns True when the wrapper satisfies its configured restriction and
     * contains a supported descendant editor.
     */
    public override matches(valueHost: IFieldValueHost, candidateElement: HTMLElement): boolean
    {
        if (this.wrapperSelector !== null && !candidateElement.matches(this.wrapperSelector))
            return false;

        if (candidateElement.childElementCount === 0)
            return false;

        let editor = this.findEditorElement(candidateElement);
        return editor !== null && this.childEditorDefinitionAdapter.matches(valueHost, editor);
    }

    /**
     * Resolves the editor as an element within the wrapper using findEditorElement().
     * Throws if the editor element cannot be found within the wrapped.
     * @param valueHost The host object that provides the field value.
     * @param anchor The anchor element associated with the editor.
     * @returns The editor element within the wrapper.
     */
    public override identifyEditor(valueHost: IFieldValueHost, anchor: IJivsDomElement): HTMLElement
    {
        let editor = this.findEditorElement(anchor);
        if (!editor)
        {
            let msg = `Editor element not found within the wrapped.`;
            this.log(LoggingLevel.Error, msg, anchor, valueHost);
            throw new Error(msg);
        }
        return editor;
    }

    /**
     * Finds the supported editor within the wrapper.
     *
     * The default implementation performs a deep descendant search using
     * editorSelector. Override this method when a widget requires different
     * element-resolution behavior.
     *
     * @param wrapper the wrapper whose descendants will be searched.
     * @returns The matching editor element, or null when none is found.
     */
    protected findEditorElement(wrapper: HTMLElement): TEditor | null
    {
        return wrapper.querySelector<TEditor>(this.editorSelector);
    }

    /**
     * Redirects the creation of a text value adapter to the child editor definition adapter.
     * @param valueHost The host object that provides the field value.
     * @param editor The editor element within the wrapper.
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
     * @param editor The editor element within the wrapper.
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
     * @param editor The editor element within the wrapper.
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