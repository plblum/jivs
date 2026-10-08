/**
 * Provides a field presentation for HTML text textarea elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextAreaPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorFieldPresentationBase } from './EditorFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML textarea tags.
 * 
 * ## Style Classes
 * - persistent classes: 'jivs-editor-textarea', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'textareaEditor'.
 * TextAreaAdapterDefinition should use this presentation name: 'textareaEditor'.
 */
export class TextAreaPresentation extends EditorFieldPresentationBase
{
    /**
     * Constructor for the TextAreaPresentation class.
     * @param element The HTML textarea element associated with this presentation.
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
        list.push('jivs-editor-textarea');
    }
}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for TextAreaAdapterDefinition.
 */
export const defaultTextAreaPresentationName = 'textareaEditor';