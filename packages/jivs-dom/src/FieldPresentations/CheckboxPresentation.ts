/**
 * Provides a presentation for HTML input elements of type checkbox.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/CheckboxPresentation
 */
import { IsValidFieldPresentationBase } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input tags that feature a checkbox.
 * That includes these type= attribute values: checkbox
 * Its default css classes are:
 * - invalidClass: jivs-invalid-editor-checkbox
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: null
 * 
 * Registered with FieldPresentationFactory as presentation name 'checkboxEditor'.
 * CheckboxAdapterDefinition should use this presentation name: 'checkboxEditor'.
 */
export class CheckboxPresentation extends IsValidFieldPresentationBase
{
    /**
     * 
     * @param element 
     * @param invalidClass - note that this parameter does not allow null, unlike its ancestor
     * because the CheckboxPresentation class always expects a valid CSS class for invalid state and does not support a null value.
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
        return 'jivs-invalid-editor-checkbox';
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for CheckboxAdapterDefinition.
 */
export const defaultCheckboxPresentationName = 'checkboxEditor';