/**
 * Provides a presentation an HTML tag around the elements of a field,
 * intended to call out the region as containing an error.
 * Specific to ElementRole.container.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FieldContainerPresentation
 */
import { IJivsElement } from '../Interfaces/IJivsElement';
import { IsValidFieldPresentationBase, IsValidFieldPresentationGlobalOptions, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Provides a presentation an HTML tag around the elements of a field,
 * intended to call out the region as containing an error.
 * Specific to ElementRole.container.
 * 
 * ## CSS Classes
 * CSS classes are applied to the container element.
 * - persistent classes: `jivs-fieldcontainer`, `jivs-isvalidpresentation`
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'fieldContainer'.
 */
export class FieldContainerPresentation<TOptions extends FieldContainerPresentationOptions = FieldContainerPresentationOptions>
    extends IsValidFieldPresentationBase<TOptions>
{
    /**
     * Constructor for the FieldContainerPresentation class.
     * @param element The HTML input element of type checkbox associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * Passing null explicitly disables the corresponding class - except InvalidClass, while omitting the option uses the 
     * default supplied by this class or a derived class.
     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(element: HTMLElement,
        options?: TOptions,
        jivsElement?: IJivsElement | null
    )
    {
        super(element, options, jivsElement);
    }

    override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-fieldcontainer');
    }
    public override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.fieldContainer;
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory.
 */
export const defaultFieldContainerPresentationName = 'fieldContainer';

/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the Presentations options.
 */
export interface FieldContainerPresentationGlobalOptions extends IsValidFieldPresentationGlobalOptions {}

/**
 * Options specific to the field container presentation instance.
 * Includes both the base options and the global options for the field container.
 * Only add options here that are used situationally.
 */
export interface FieldContainerPresentationOptions
    extends IsValidFieldPresentationOptions,
    FieldContainerPresentationGlobalOptions
{}