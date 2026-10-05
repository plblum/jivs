/**
 * Provides an editor adapter definition for HTML textarea elements within the wrapper.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/WrappedTextAreaAdapterDefinition
 */

import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { WrappedEditorAdapterDefinitionBase } from './WrappedEditorAdapterDefinitionBase';
import { TextAreaAdapterDefinition } from './TextAreaAdapterDefinition';
import { defaultWrappedTextAreaPresentationName } from '../FieldPresentations/WrappedTextAreaPresentation';

/**
 * Provides an editor adapter definition for HTML textarea elements within the wrapper.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="wrapped">      <!-- this is the anchor -->
 *     <!-- there can be multiple containing elements around the input -->
 *     <textarea class="editor"></textarea>     <!-- the editor element -->
 * </div>
 * ``` 
 * Subclass to introduce the wrapperSelector value to ensure the wrapper is optimally identified.
 */
export class WrappedTextAreaAdapterDefinition extends WrappedEditorAdapterDefinitionBase
{
    /**
     * Creates an editor adapter definition for HTML textarea elements within the wrapper.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param wrapperSelector CSS selector used to identify the wrapper.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    public constructor(adapterKey?: string, priority: number = 80,
        wrapperSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {

        super(
            adapterKey ?? defaultWrappedTextAreaAdapterKey,
            priority,
            wrapperSelector,
            recommendedFieldPresentationName
        );
    }
    protected override get editorSelector(): string
    {
        return 'textarea';
    }
    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new TextAreaAdapterDefinition();
    }
    protected override defaultFieldPresentationName(): string | null
    {
        return defaultWrappedTextAreaPresentationName;
    }

}

export const defaultWrappedTextAreaAdapterKey = 'wrapped:textarea';