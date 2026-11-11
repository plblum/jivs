/**
 * Provides a field presentation for HTML text input elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextInputPresentation
 */

import type { IJivsElement } from '../Interfaces/IJivsElement';
import { HtmlFormControlFieldPresentationBase, HtmlFormControlFieldPresentationBaseOptions } from './HtmlFormControlFieldPresentationBase';
/**
 * Presentation for HTML input tags that feature a textbox.
 * That includes these type= attribute values: text, password, email, number, search, tel, url,
 *    date, datetime-local, month, week, and time.
 * 
 * ## CSS Classes
 * - persistent classes: 'jivs-editor-input', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'inputEditor'.
 * InputAdapterDefinition should use this presentation name: 'inputEditor'.
 */
export class TextInputPresentation extends HtmlFormControlFieldPresentationBase<HtmlFormControlFieldPresentationBaseOptions, HTMLInputElement>
{
    /**
     * Constructor for the TextInputPresentation class.
     * @param element The HTML input element of type text associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(element: HTMLInputElement,
        options?: HtmlFormControlFieldPresentationBaseOptions,
        jivsElement?: IJivsElement | null
    )
    {
        super(element, options, jivsElement);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-editor-input');
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for InputAdapterDefinition.
 */
export const defaultTextInputPresentationName = 'inputEditor';