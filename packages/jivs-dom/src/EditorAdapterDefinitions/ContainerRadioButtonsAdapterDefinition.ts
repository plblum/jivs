/**
 * Provides an editor adapter definition for HTML input type='radio' elements within a container tag.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/ContainerRadioButtonsAdapterDefinition
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { ContainerInputAdapterDefinition } from './ContainerInputAdapterDefinition';
import { RadioButtonsAdapterDefinition } from './RadioButtonsAdapterDefinition';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { defaultContainerRadioButtonsPresentationName } from '../FieldPresentations/ContainerRadioButtonsPresentation';

/**
 * Provides an editor adapter definition for HTML input type='radio' elements
 * within a container tag.
 * 
 * Subclass to introduce the containerSelector value to ensure the container is optimally identified.
 * 
 * This container handles things differently from most others in that it has to deal
 * with a list of input type='radio' elements to describe a single value.
 * 
 * The anchor is still the container element.
 * The editor is the first radio button from the group.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="container">      <!-- this is the anchor -- >
 *     <!-- there can be multiple containing elements around the input -->
 *     <input type="radio" name="group1" value="1" />     <!-- the editor element -->
 *     <input type="radio" name="group1" value="2" /> 
 *     <input type="radio" name="group1" value="3" /> 
 * </div>
 * ```
 */
export class ContainerRadioButtonsAdapterDefinition extends ContainerInputAdapterDefinition
{
    /**
     * Creates an editor adapter definition for HTML input type='radio' elements within a container tag.
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
            'radio',
            adapterKey,
            priority,
            containerSelector,
            recommendedFieldPresentationName
        );
    }

    override defaultFieldPresentationName(): string | null
    {
        return defaultContainerRadioButtonsPresentationName;
    }

    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new RadioButtonsAdapterDefinition();
    }

    /**
     * The editor is the first radio button within the container.
     * This corresponds to expectations from RadioButtonsAdapterDefinition which 
     * is the child adapter that manages the group of radio buttons as an array of siblings.
     * @param valueHost - the host object that contains the value for the editor.
     * @param anchor The Anchor element from which we can resolve the editor element.
     * @returns the HTMLElement corresponding to the first radio button in the container.
     */
    public override identifyEditor(valueHost: IFieldValueHost, anchor: IJivsDomElement): HTMLElement
    {
        let editor = anchor.querySelector('input[type="radio"]');
        assertNotNull(editor, "No radio button found in the container.");
        return editor as HTMLElement;
    }
}