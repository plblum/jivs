/**
 * Presentation for a textarea element within a wrapper.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/WrappedTextAreaPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { WrappedIsValidFieldPresentationBase } from './WrappedIsValidFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML textarea element contained within a specific wrapper.
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
 * .jivs-required.jivs-wrapped-editor-textarea::after {
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
 * - presentationClass: jivs-wrapped-editor-textarea
 * 
 * We supply these CSS classes to activate the validated, corrected and required visual cues:
 * - validatedClass: jivs-validated-indicator
 * - correctedClass: jivs-corrected-indicator
 * - requiredClass: jivs-required-indicator
 * 
 * Registered with FieldPresentationFactory as presentation name 'wrappedTextAreaEditor'.
 * WrappedTextAreaAdapterDefinition should use this presentation name: 'wrappedTextAreaEditor'.
 */
export class WrappedTextAreaPresentation extends WrappedIsValidFieldPresentationBase
{
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        anchor?: IJivsDomElement | null
    )
    {
        super(element, options, anchor);
    }

    protected override defaultPresentationClass(): string | null
    {
        return 'jivs-wrapped-editor-textarea';
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for WrappedTextAreaAdapterDefinition.
 */
export const defaultWrappedTextAreaPresentationName = 'wrappedTextAreaEditor';