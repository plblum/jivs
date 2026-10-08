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
 * ## Style Classes
 * Style classes are applied to the wrapper (the anchor).
 * - persistent classes: `jivs-field-container`, `jivs-isvalidpresentation`
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
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

    override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-field-container');
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory.
 */
export const defaultFieldContainerPresentationName = 'fieldContainer';