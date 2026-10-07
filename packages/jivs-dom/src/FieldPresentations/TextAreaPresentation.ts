/**
 * Provides a field presentation for HTML text textarea elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextAreaPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML textarea tags.
 * Its default css classes are:
 * - invalidClass: jivs-invalid (inherited)
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - variationClass: null
 * - persistent classes: 'jivs-editor-textarea' + inherited
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

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-editor-textarea');
    }
}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for TextAreaAdapterDefinition.
 */
export const defaultTextAreaPresentationName = 'textareaEditor';