/**
 * Provides a presentation for HTML input elements of type checkbox.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/CheckboxPresentation
 */
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorFieldPresentationBase } from './EditorFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input tags that feature a checkbox.
 * That includes these type= attribute values: checkbox
 * 
 * ## Style Classes
 * - persistent classes: 'jivs-editor-checkbox', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'checkboxEditor'.
 * CheckboxAdapterDefinition should use this presentation name: 'checkboxEditor'.
 */
export class CheckboxPresentation extends EditorFieldPresentationBase
{
    /**
     * Constructor for the CheckboxPresentation class.
     * @param element The HTML input element of type checkbox associated with this presentation.
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
        list.push('jivs-editor-checkbox');
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for CheckboxAdapterDefinition.
 */
export const defaultCheckboxPresentationName = 'checkboxEditor';