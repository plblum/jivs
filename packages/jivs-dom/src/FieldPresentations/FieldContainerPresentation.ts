/**
 * Provides a presentation an HTML tag around the elements of a field,
 * intended to call out the region as containing an error.
 * Specific to ElementRole.container.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FieldContainerPresentation
 */
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Provides a presentation an HTML tag around the elements of a field,
 * intended to call out the region as containing an error.
 * Specific to ElementRole.container.
 * 
 * Its default css classes are:
 * - invalidClass: jivs-invalid (inherited)
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: jivs-field-container
 * 
 * Registered with FieldPresentationFactory as presentation name 'fieldContainer'.
 */
export class FieldContainerPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the FieldContainerPresentation class.
     * @param element The HTML input element of type checkbox associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * Passing null explicitly disables the corresponding class - except InvalidClass, while omitting the option uses the 
     * default supplied by this class or a derived class.
     * @param anchor The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        anchor?: IJivsDomElement | null
    )
    {
        super(element, options, anchor);
    }

    protected override defaultVariationClass(): string | null
    {
        return 'jivs-field-container';
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory.
 */
export const defaultFieldContainerPresentationName = 'fieldContainer';