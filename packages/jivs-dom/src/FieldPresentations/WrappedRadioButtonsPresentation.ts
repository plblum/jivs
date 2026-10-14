/**
 * Presentation for an input type="radio" element within a wrapper.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/WrappedRadioButtonsPresentation
 */

import type { IJivsElement } from '../Interfaces/IJivsElement';
import { WrappedEditorFieldPresentationBase, WrappedEditorFieldPresentationBaseOptions } from './WrappedEditorFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input type="radio" element contained within a specific wrapper.
 * 
 * ## CSS Classes
 * CSS classes are applied to the wrapper (the jivsElement).
 * - persistent classes: `jivs-wrapped-editor-radiobuttons`, `jivs-wrapped-editor`, `jivs-isvalidpresentation`
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'wrappedRadioButtonsEditor'.
 * WrappedRadioButtonsAdapterDefinition should use this presentation name: 'wrappedRadioButtonsEditor'.
 */
export class WrappedRadioButtonsPresentation extends WrappedEditorFieldPresentationBase<WrappedEditorFieldPresentationBaseOptions>
{
    constructor(element: HTMLElement,
        options?: WrappedEditorFieldPresentationBaseOptions,
        jivsElement?: IJivsElement | null
    )
    {
        super(element, options, jivsElement);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-wrapped-editor-radiobuttons');
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for WrappedRadioButtonsAdapterDefinition.
 */
export const defaultWrappedRadioButtonsPresentationName = 'wrappedRadioButtonsEditor';