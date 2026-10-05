/**
 * Provides an editor adapter definition for HTML select elements within a container tag.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/ContainerSelectAdapterDefinition
 */
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { ContainerEditorAdapterDefinitionBase } from './ContainerEditorAdapterDefinitionBase';
import { SelectAdapterDefinition } from './SelectAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML select elements within a container tag.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="container">      <!-- this is the anchor -->
 *     <!-- there can be multiple containing elements around the input -->
 *     <select class="editor">  <!-- the editor element -->
 *     </select>    
 * </div>
 * ``` 
 * Subclass to introduce the containerSelector value to ensure the container is optimally identified.
 */
export class ContainerSelectAdapterDefinition extends ContainerEditorAdapterDefinitionBase
{
    /**
     * Creates an editor adapter definition for HTML select elements within a container tag.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param containerSelector CSS selector used to identify the container element.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    public constructor(adapterKey?: string, priority: number = 80,
        containerSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {

        super(
            adapterKey ?? defaultContainerSelectAdapterKey,
            priority,
            containerSelector,
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
        //!!!PENDING
        throw new Error('Method not implemented.');
    }

}

export const defaultContainerSelectAdapterKey = 'container:select';