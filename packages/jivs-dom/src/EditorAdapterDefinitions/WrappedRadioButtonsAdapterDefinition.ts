/**
 * Provides an editor adapter definition for HTML input type='radio' elements within the wrapper.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/WrappedRadioButtonsAdapterDefinition
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { WrappedInputAdapterDefinition } from './WrappedInputAdapterDefinition';
import { RadioButtonsAdapterDefinition } from './RadioButtonsAdapterDefinition';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { defaultWrappedRadioButtonsPresentationName } from '../FieldPresentations/WrappedRadioButtonsPresentation';
import { AriaStaticUpdaterBase } from '../Aria/AriaStaticUpdaterBase';
import { WrappedRadioButtonsAriaStaticUpdater } from '../Aria/WrappedRadioButtonsAriaStaticUpdater';
import { IAriaStaticUpdater } from '../Interfaces/AriaUpdaters';

/**
 * Provides an editor adapter definition for HTML input type='radio' elements
 * within the wrapper.
 * 
 * Subclass to introduce the wrapperSelector value to ensure the wrapper is optimally identified.
 * 
 * This wrapped handles things differently from most others in that it has to deal
 * with a list of input type='radio' elements to describe a single value.
 * 
 * The wrapper maintains the IJivsElement structure
 * The editor is the first radio button from the group.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="wrapped">      <!-- maintains JivsElement -->
 *     <!-- there can be multiple containing elements around the input -->
 *     <input type="radio" name="group1" value="1" />     <!-- the editor element -->
 *     <input type="radio" name="group1" value="2" /> 
 *     <input type="radio" name="group1" value="3" /> 
 * </div>
 * ```
 */
export class WrappedRadioButtonsAdapterDefinition extends WrappedInputAdapterDefinition
{
    /**
     * Creates an editor adapter definition for HTML input type='radio' elements within the wrapper.
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
            'radio',
            adapterKey,
            priority,
            wrapperSelector,
            recommendedFieldPresentationName
        );
    }

    override defaultFieldPresentationName(): string | null
    {
        return defaultWrappedRadioButtonsPresentationName;
    }

    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new RadioButtonsAdapterDefinition();
    }

    /**
     * The editor is the first radio button within the wrapper's children.
     * This corresponds to expectations from RadioButtonsAdapterDefinition which 
     * is the child adapter that manages the group of radio buttons as an array of siblings.
     * @param valueHost - the host object that contains the value for the editor.
     * @param jivsElement The JivsElement from which we can resolve the editor element.
     * @returns the HTMLElement corresponding to the first radio button in the wrapper's children.
     */
    public override identifyEditor(valueHost: IFieldValueHost, jivsElement: IJivsElement): HTMLElement
    {
        let editor = jivsElement.querySelector('input[type="radio"]');
        assertNotNull(editor, 'No radio button found in the wrapper.');
        return editor as HTMLElement;
    }

    override getStaticAriaUpdater(): IAriaStaticUpdater | null
    {
        return new WrappedRadioButtonsAriaStaticUpdater();
    }
}