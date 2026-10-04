/**
 * Provides an editor adapter definition for HTML input type='checkbox' elements within a container tag.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/ContainerCheckboxAdapterDefinition
 */

import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { CheckboxAdapterDefinition } from './CheckboxAdapterDefinition';
import { ContainerInputAdapterDefinition } from './ContainerInputAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML input type='checkbox' elements
 * within a container tag.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="container">      <!-- this is the anchor -- >
 *     <!-- there can be multiple containing elements around the input -->
 *     <input type="checkbox" class="editor" />     <!-- the editor element -->
 * </div>
 * ```
 * Subclass to introduce the containerSelector value to ensure the container is optimally identified.
 * 
 * Uses the CheckboxAdapterDefinition as the child editor definition adapter, which supplies
 * - TextValueAdapter
 * - attachToSendValues()
 * This makes it leave the work of handling the editor to the Adapter Definition built for it.
 */
export class ContainerCheckboxAdapterDefinition extends ContainerInputAdapterDefinition
{

    public constructor(adapterKey?: string, priority: number = 0,
        containerSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {
        super(
            'checkbox',
            adapterKey,
            priority,
            containerSelector,
            recommendedFieldPresentationName
        );
    }

    override defaultFieldPresentationName(): string | null
    {
        //!!!TODO: Switch to defaultContainerTextCheckboxPresentationName
        // This is here just to allow compilation
        throw new Error("not implemented yet.");
    }    

    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new CheckboxAdapterDefinition();
    }

}
