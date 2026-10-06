/**
 * Provides a field presentation for HTML text input elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextInputPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML input tags that feature a textbox.
 * That includes these type= attribute values: text, password, email, number, search, tel, url,
 *    date, datetime-local, month, week, and time.
 * Its default css classes are:
 * - invalidClass: jivs-invalid (inherited)
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: jivs-editor-input
 * 
 * Registered with FieldPresentationFactory as presentation name 'inputEditor'.
 * InputAdapterDefinition should use this presentation name: 'inputEditor'.
 */
export class TextInputPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the TextInputPresentation class.
     * @param element The HTML input element of type text associated with this presentation.
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
    protected override defaultPresentationClass(): string | null
    {
        return 'jivs-editor-input';
    }

}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for InputAdapterDefinition.
 */
export const defaultTextInputPresentationName = 'inputEditor';