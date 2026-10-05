/**
 * Provides a presentation for HTML select elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/SelectPresentation
 */

import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML select tags.
 * Its default css classes are:
 * - invalidClass: jivs-invalid-editor-select
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: null
 * 
 * Registered with FieldPresentationFactory as presentation name 'selectEditor'.
 * SelectAdapterDefinition should use this presentation name: 'selectEditor'.
 */
export class SelectPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the SelectPresentation class.
     * @param element The HTML select element associated with this presentation.
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
        return 'jivs-invalid-editor-select';
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for SelectAdapterDefinition.
 */
export const defaultSelectPresentationName = 'selectEditor';