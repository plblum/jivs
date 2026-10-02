/**
 * Provides a presentation for HTML select elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/SelectPresentation
 */

import { IsValidFieldPresentationBase } from './IsValidFieldPresentationBase';
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
     * 
     * @param element 
     * @param invalidClass - note that this parameter does not allow null, unlike its ancestor
     * because the SelectPresentation class always expects a valid CSS class for invalid state and does not support a null value.
     */
    constructor(element: HTMLElement,
        invalidClass?: string, // does not support null - must always provide a valid CSS class for invalid state
        validatedClass?: string | null,
        correctedClass?: string | null,
        requiredClass?: string | null,
        presentationClass?: string | null,
        jivsElement?: IJivsDomElement | null
    )
    {
        super(element, invalidClass ?? undefined, validatedClass, correctedClass, requiredClass, presentationClass, jivsElement);
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