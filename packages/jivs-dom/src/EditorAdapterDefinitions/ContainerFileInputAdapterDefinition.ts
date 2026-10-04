/**
 * Provides an editor adapter definition for HTML input type='file' elements within a container tag.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/ContainerFileInputAdapterDefinition
 */

import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { ContainerInputAdapterDefinition } from './ContainerInputAdapterDefinition';
import { FileInputAdapterDefinition } from './FileInputAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML input type='file' elements
 * within a container tag.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="container">      <!-- this is the anchor -- >
 *     <!-- there can be multiple containing elements around the input -->
 *     <input type="file" class="editor" />     <!-- the editor element -->
 * </div>
 * ```
 * Subclass to introduce the containerSelector value to ensure the container is optimally identified.
 */
export class ContainerFileInputAdapterDefinition extends ContainerInputAdapterDefinition
{

    public constructor(adapterKey?: string, priority: number = 0,
        containerSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {
        super(
            'file',
            adapterKey,
            priority,
            containerSelector,
            recommendedFieldPresentationName
        );
    }

    override defaultFieldPresentationName(): string | null
    {
        //!!!TODO: Switch to defaultContainerTextFileInputPresentationName
        // This is here just to allow compilation
        throw new Error("not implemented yet.");
    }    

    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new FileInputAdapterDefinition();
    }

}
