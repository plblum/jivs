/**
 * Provides an editor adapter definition for HTML select elements within the wrapper.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/WrappedSelectAdapterDefinition
 */
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { WrappedEditorAdapterDefinitionBase } from './WrappedEditorAdapterDefinitionBase';
import { SelectAdapterDefinition } from './SelectAdapterDefinition';
import { defaultWrappedSelectPresentationName } from '../FieldPresentations/WrappedSelectPresentation';

/**
 * Provides an editor adapter definition for HTML select elements within the wrapper.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="wrapped">      <!-- this is the anchor -->
 *     <!-- there can be multiple containing elements around the input -->
 *     <select class="editor">  <!-- the editor element -->
 *     </select>    
 * </div>
 * ``` 
 * Subclass to introduce the wrapperSelector value to ensure the wrapper is optimally identified.
 */
export class WrappedSelectAdapterDefinition extends WrappedEditorAdapterDefinitionBase
{
    /**
     * Creates an editor adapter definition for HTML select elements within the wrapper.
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
            adapterKey ?? defaultWrappedSelectAdapterKey,
            priority,
            wrapperSelector,
            recommendedFieldPresentationName
        );
    }
    protected override get editorSelector(): string
    {
        return 'select';
    }
    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new SelectAdapterDefinition();
    }
    protected override defaultFieldPresentationName(): string | null
    {
        return defaultWrappedSelectPresentationName;
    }

}

export const defaultWrappedSelectAdapterKey = 'wrapped:select';