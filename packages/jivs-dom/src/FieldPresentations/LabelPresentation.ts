/**
 * Provides a field presentation for labels, where the jivs-dom ElementRole is
 * 'label'.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/LabelPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML label tags or tags used for labels.
 * Its default css classes are:
 * - invalidClass: jivs-invalid (inherited)
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: jivs-label
 * 
 * Registered with FieldPresentationFactory as presentation name 'label'.
 */
export class LabelPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the LabelPresentation class.
     * @param element The HTML label or tags used for labels element associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * Passing null explicitly disables the corresponding class - except InvalidClass, while omitting the option uses the 
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

    protected override defaultPresentationClass(): string | null
    {
        return 'jivs-label';
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for LabelAdapterDefinition.
 */
export const defaultLabelPresentationName = 'label';