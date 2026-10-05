/**
 * Presentation for a text input element within a wrapper.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/WrappedTextInputPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { WrappedIsValidFieldPresentationBase } from './WrappedIsValidFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input element contained within a specific wrapper.
 * The input should be a textbox style. checkboxes, radio buttons, and file are 
 * handled elsewhere.
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
 * .jivs-invalid-wrapped-editor.jivs-required-wrapped-editor::after {
        content: '*';
        color: red;
 * }
 * ```
 * 
 * Its default css classes are:
 * - invalidClass: jivs-invalid-wrapped-editor-input
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: inherited 'jivs-wrapped-editor'
 * 
 * We supply these CSS classes to activate the validated, corrected and required visual cues:
 * - validatedClass: jivs-validated-wrapped-editor
 * - correctedClass: jivs-corrected-wrapped-editor
 * - requiredClass: jivs-required-wrapped-editor
 * 
 * Registered with FieldPresentationFactory as presentation name 'wrappedInputEditor'.
 * WrappedInputAdapterDefinition should use this presentation name: 'wrappedInputEditor'.
 */
export class WrappedTextInputPresentation extends WrappedIsValidFieldPresentationBase
{
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        jivsElement?: IJivsDomElement | null
    )
    {
        super(element, options, jivsElement);
    }

    protected override defaultInvalidClass(): string | null
    {
        return 'jivs-invalid-wrapped-editor-input';
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for WrappedInputAdapterDefinition.
 */
export const defaultWrappedTextInputPresentationName = 'wrappedInputEditor';