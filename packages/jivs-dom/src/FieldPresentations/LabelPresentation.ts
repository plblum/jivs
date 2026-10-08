/**
 * Provides a field presentation for labels, where the jivs-dom ElementRole is
 * 'label'.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/LabelPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML label tags or tags used for labels.
 * ## Style Classes
 * - persistent classes: 'jivs-label', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'label'.
 */
export class LabelPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the LabelPresentation class.
     * @param element The HTML label or tags used for labels element associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.

     * @param anchor The Jivs DOM element associated with this field presentation, if any.
     */
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
        list.push('jivs-label');
    }
}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for LabelAdapterDefinition.
 */
export const defaultLabelPresentationName = 'label';