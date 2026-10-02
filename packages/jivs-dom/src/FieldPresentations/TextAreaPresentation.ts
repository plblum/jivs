/**
 * Provides a field presentation for HTML text textarea elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextAreaPresentation
 */

import { IsValidFieldPresentationBase } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML textarea tags.
 * Its default css classes are:
 * - invalidClass: jivs-invalid-editor-textarea
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: null
 * 
 * Registered with FieldPresentationFactory as presentation name 'textareaEditor'.
 * TextAreaAdapterDefinition should use this presentation name: 'textareaEditor'.
 */
export class TextAreaPresentation extends IsValidFieldPresentationBase
{
    /**
     * 
     * @param element 
     * @param invalidClass - note that this parameter does not allow null, unlike its ancestor
     * because the TextAreaPresentation class always expects a valid CSS class for invalid state and does not support a null value.
     */
    constructor(element: HTMLElement,
        invalidClass?: string, // does not support null - must always provide a valid CSS class for invalid state
        validatedClass?: string | null,
        correctedClass?: string | null,
        requiredClass?: string | null,
        presentationClass?: string | null,
    )
    {
        super(element, invalidClass ?? undefined, validatedClass, correctedClass, requiredClass, presentationClass);
    }

    protected override defaultInvalidClass(): string | null
    {
        return 'jivs-invalid-editor-textarea';
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for TextAreaAdapterDefinition.
 */
export const defaultTextAreaPresentationName = 'textareaEditor';