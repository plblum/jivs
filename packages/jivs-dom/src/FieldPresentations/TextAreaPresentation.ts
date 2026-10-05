/**
 * Provides a field presentation for HTML text textarea elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextAreaPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML textarea tags.
 * Its default css classes are:
 * - invalidClass: jivs-invalid-editor-textarea
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: null
 * 
 * Registered with FieldPresentationFactory as presentation name 'textareaEditor'.
 * TextAreaAdapterDefinition should use this presentation name: 'textareaEditor'.
 */
export class TextAreaPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the TextAreaPresentation class.
     * @param element The HTML textarea element associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * Passing null explicitly disables the corresponding class, while omitting the option uses the 
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

    protected override defaultInvalidClass(): string | null
    {
        return 'jivs-invalid-editor-textarea';
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for TextAreaAdapterDefinition.
 */
export const defaultTextAreaPresentationName = 'textareaEditor';