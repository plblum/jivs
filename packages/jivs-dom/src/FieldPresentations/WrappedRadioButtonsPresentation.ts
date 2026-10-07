/**
 * Presentation for an input type="radio" element within a wrapper.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/WrappedRadioButtonsPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { WrappedIsValidFieldPresentationBase } from './WrappedIsValidFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input type="radio" element contained within a specific wrapper.
 * 
 * Style classes are applied to the wrapper (the anchor).
 * By default, they make the editor element look like our non-wrapped editor.
 * 
 * Wrappers around editors allow for additional styling and layout control separate 
 * from the input element itself. Its immediate benefit is to offer an 
 * Indicator for the validity state or required status of the input element
 * by adding visual cues to the wrapper rather than the input element itself.
 * 
 * ```css
 * .jivs-required.jivs-wrapped-editor-radiobuttons::after {
 *     content: '*';
 *     color: red;
 * }
 * ```
 * 
 * Its default css classes are:
 * - invalidClass: jivs-invalid (inherited)
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - variantClass: null
 * - persistent classes: 'jivs-wrapped-editor-radiobuttons' + inherited
 * 
 * We supply these CSS classes to activate the validated, corrected and required visual cues:
 * - validatedClass: jivs-validated-indicator
 * - correctedClass: jivs-corrected-indicator
 * - requiredClass: jivs-required-indicator
 * 
 * Registered with FieldPresentationFactory as presentation name 'wrappedRadioButtonsEditor'.
 * WrappedRadioButtonsAdapterDefinition should use this presentation name: 'wrappedRadioButtonsEditor'.
 */
export class WrappedRadioButtonsPresentation extends WrappedIsValidFieldPresentationBase
{
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        anchor?: IJivsDomElement | null
    )
    {
        super(element, options, anchor);
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