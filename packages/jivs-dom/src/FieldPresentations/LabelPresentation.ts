/**
 * Provides a field presentation for labels, where the jivs-dom ElementRole is 'label'.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/LabelPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationGlobalOptions, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsElement } from '../Interfaces/IJivsElement';

/**
 * Presentation for HTML label tags or tags used for labels.
 * ## CSS Classes
 * - persistent classes: 'jivs-label', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'label'.
 */
export class LabelPresentation<TOptions extends LabelPresentationOptions = LabelPresentationOptions>
    extends IsValidFieldPresentationBase<TOptions, HTMLElement>
{
    /**
     * Constructor for the LabelPresentation class.
     * @param element The HTML label or tags used for labels element associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.

     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(element: HTMLElement,
        options?: TOptions,
        jivsElement?: IJivsElement | null
    )
    {
        super(element, options, jivsElement);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-label');
    }
    public override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.label;
    }
}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for LabelAdapterDefinition.
 */
export const defaultLabelPresentationName = 'label';

/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the Presentations options.
 */
export interface LabelPresentationGlobalOptions extends IsValidFieldPresentationGlobalOptions
{
}
/**
 * Options specific to the label presentation instance.
 * Includes both the base options and the global options for labels.
 * Only add options here that are used situationally.
 */
export interface LabelPresentationOptions
    extends IsValidFieldPresentationOptions, LabelPresentationGlobalOptions
{
}