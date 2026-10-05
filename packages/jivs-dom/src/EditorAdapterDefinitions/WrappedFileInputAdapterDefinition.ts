/**
 * Provides an editor adapter definition for HTML input type='file' elements within the wrapper.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/WrappedFileInputAdapterDefinition
 */

import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { WrappedInputAdapterDefinition } from './WrappedInputAdapterDefinition';
import { FileInputAdapterDefinition } from './FileInputAdapterDefinition';
import { defaultWrappedFileInputPresentationName } from '../FieldPresentations/WrappedFileInputPresentation';

/**
 * Provides an editor adapter definition for HTML input type='file' elements
 * within the wrapper.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="wrapped">      <!-- this is the anchor -->
 *     <!-- there can be multiple containing elements around the input -->
 *     <input type="file" class="editor" />     <!-- the editor element -->
 * </div>
 * ```
 * Subclass to introduce the wrapperSelector value to ensure the wrapper is optimally identified.
 */
export class WrappedFileInputAdapterDefinition extends WrappedInputAdapterDefinition
{

    public constructor(adapterKey?: string, priority: number = 0,
        wrapperSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {
        super(
            'file',
            adapterKey,
            priority,
            wrapperSelector,
            recommendedFieldPresentationName
        );
    }

    override defaultFieldPresentationName(): string | null
    {
        return defaultWrappedFileInputPresentationName;
    }    

    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new FileInputAdapterDefinition();
    }

}
