/**
 * Provides a presentation for HTML input elements of type checkbox.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/CheckboxPresentation
 */
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

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
     * Constructor for the CheckboxPresentation class.
     * @param element The HTML input element of type checkbox associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * Passing null explicitly disables the corresponding class, while omitting the option uses the 
     * default supplied by this class or a derived class.
     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        jivsElement?: IJivsDomElement | null
    )
    {
        super(element, options, jivsElement);
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