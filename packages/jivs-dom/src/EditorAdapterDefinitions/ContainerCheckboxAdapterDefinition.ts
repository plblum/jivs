/**
 * Provides an editor adapter definition for HTML input type='checkbox' elements within a container tag.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/ContainerCheckboxAdapterDefinition
 */

import { defaultContainerCheckboxPresentationName } from '../FieldPresentations/ContainerCheckboxPresentation';
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
    /**
     * Creates an editor adapter definition for HTML input type='checkbox' elements within a container tag.
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
            'checkbox',
            adapterKey,
            priority,
            containerSelector,
            recommendedFieldPresentationName
        );
    }

    override defaultFieldPresentationName(): string | null
    {
        return defaultContainerCheckboxPresentationName;
    }    

    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new CheckboxAdapterDefinition();
    }

}
