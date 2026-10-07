/**
 * Presentation for a select element within a wrapper.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/WrappedSelectPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { WrappedIsValidFieldPresentationBase } from './WrappedIsValidFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML select element contained within a specific wrapper.
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
 * .jivs-required.jivs-wrapped-editor-select::after {
 *     content: '*';
 *     color: red;
 * }
 * ```
 * 
 * Its default css classes are:
 * - invalidClass: jivs-invalid
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - variantClass: null
 * - persistent classes: 'jivs-wrapped-editor-select' + inherited
 * 
 * We supply these CSS classes to activate the validated, corrected and required visual cues:
 * - validatedClass: jivs-validated-indicator
 * - correctedClass: jivs-corrected-indicator
 * - requiredClass: jivs-required-indicator
 * 
 * Registered with FieldPresentationFactory as presentation name 'wrappedSelectEditor'.
 * WrappedSelectAdapterDefinition should use this presentation name: 'wrappedSelectEditor'.
 */
export class WrappedSelectPresentation extends WrappedIsValidFieldPresentationBase
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
        list.push('jivs-wrapped-editor-select');
    }    
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for WrappedSelectAdapterDefinition.
 */
export const defaultWrappedSelectPresentationName = 'wrappedSelectEditor';