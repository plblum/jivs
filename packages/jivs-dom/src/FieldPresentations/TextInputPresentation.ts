/**
 * Provides a field presentation for HTML text input elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextInputPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorFieldPresentationBase } from './EditorFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input tags that feature a textbox.
 * That includes these type= attribute values: text, password, email, number, search, tel, url,
 *    date, datetime-local, month, week, and time.
 * 
 * ## Style Classes
 * - persistent classes: 'jivs-editor-input', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'inputEditor'.
 * InputAdapterDefinition should use this presentation name: 'inputEditor'.
 */
export class TextInputPresentation extends EditorFieldPresentationBase
{
    /**
     * Constructor for the TextInputPresentation class.
     * @param element The HTML input element of type text associated with this presentation.
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
        list.push('jivs-editor-input');
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for InputAdapterDefinition.
 */
export const defaultTextInputPresentationName = 'inputEditor';