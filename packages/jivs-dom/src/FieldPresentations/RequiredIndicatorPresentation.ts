/**
 * Provides a field presentation for an element, where the jivs-dom ElementRole is
 * 'required'.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/RequiredIndicatorPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsElement } from '../Interfaces/IJivsElement';
import { IAriaStaticUpdater } from '../Interfaces/AriaUpdaters';
import { RequiredIndicatorAriaStaticUpdater } from '../Aria/RequiredIndicatorAriaStaticUpdater';

/**
 * Presentation for HTML tags indicating required indicator fields.
 * Typically they are an empty span tag with a specific CSS class to indicate the required status.
 * Also typical is to include the textual content in the span tag, and the CSS class will style it accordingly.
 * 
 * This implementation can work either way, although our default CSS class expects an empty span tag with the appropriate CSS class.
 * 
 * ## CSS Classes
 * - persistent classes: 'jivs-indicator', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'requiredIndicator'.
 */
export class RequiredIndicatorPresentation<TOptions extends RequiredIndicatorPresentationOptions = RequiredIndicatorPresentationOptions>
    extends IsValidFieldPresentationBase<TOptions, HTMLElement>
{
    /**
     * Constructor for the RequiredIndicatorPresentation class.
     * @param element The HTML element used for the required indicator.
     * @param options Configuration options for the field presentation, including CSS classes.
     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(element: HTMLElement,
        options?: TOptions,
        jivsElement?: IJivsElement | null
    )
    {
        if (options)
            options.requiredClassEnabled = true;
        super(element, options, jivsElement);
    }

    protected override getOptionDefaults(): Partial<TOptions>
    {
        let superDefaults = super.getOptionDefaults();
        return {
            ...superDefaults,
            requiredClassEnabled: true
        };
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-indicator');
    }
    override getStaticAriaUpdater(): IAriaStaticUpdater | null
    {
        return new RequiredIndicatorAriaStaticUpdater();
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 */
export const defaultRequiredIndicatorPresentationName = 'requiredIndicator';

export interface RequiredIndicatorPresentationOptions extends IsValidFieldPresentationOptions
{
}