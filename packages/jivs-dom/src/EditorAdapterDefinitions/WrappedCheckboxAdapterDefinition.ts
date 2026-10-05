/**
 * Provides an editor adapter definition for HTML input type='checkbox' elements within the wrapper.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/WrappedCheckboxAdapterDefinition
 */

import { defaultWrappedCheckboxPresentationName } from '../FieldPresentations/WrappedCheckboxPresentation';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { CheckboxAdapterDefinition } from './CheckboxAdapterDefinition';
import { WrappedInputAdapterDefinition } from './WrappedInputAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML input type='checkbox' elements
 * within the wrapper.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="wrapped">      <!-- this is the anchor -->
 *     <!-- there can be multiple containing elements around the input -->
 *     <input type="checkbox" class="editor" />     <!-- the editor element -->
 * </div>
 * ```
 * Subclass to introduce the wrapperSelector value to ensure the wrapper is optimally identified.
 * 
 * Uses the CheckboxAdapterDefinition as the child editor definition adapter, which supplies
 * - TextValueAdapter
 * - attachToSendValues()
 * This makes it leave the work of handling the editor to the Adapter Definition built for it.
 */
export class WrappedCheckboxAdapterDefinition extends WrappedInputAdapterDefinition
{
    /**
     * Creates an editor adapter definition for HTML input type='checkbox' elements within the wrapper.
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
            'checkbox',
            adapterKey,
            priority,
            wrapperSelector,
            recommendedFieldPresentationName
        );
    }

    override defaultFieldPresentationName(): string | null
    {
        return defaultWrappedCheckboxPresentationName;
    }    

    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new CheckboxAdapterDefinition();
    }

}
