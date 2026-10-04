/**
 * Provides an editor adapter definition for HTML textarea elements within a container tag.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/ContainerTextAreaAdapterDefinition
 */

import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { ContainerEditorAdapterDefinitionBase } from './ContainerEditorAdapterDefinitionBase';
import { TextAreaAdapterDefinition } from './TextAreaAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML textarea elements within a container tag.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="container">      <!-- this is the anchor -- >
 *     <!-- there can be multiple containing elements around the input -->
 *     <textarea class="editor"></textarea>     <!-- the editor element -->
 * </div>
 * ``` 
 * Subclass to introduce the containerSelector value to ensure the container is optimally identified.
 */
export class ContainerTextAreaAdapterDefinition extends ContainerEditorAdapterDefinitionBase
{
    public constructor(adapterKey?: string, priority: number = 0,
        containerSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {

        super(
            adapterKey ?? containerTextAreaAdapterKey,
            priority,
            containerSelector,
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
        //!!!PENDING
        throw new Error('Method not implemented.');
    }

}

export const containerTextAreaAdapterKey = 'container:textarea';