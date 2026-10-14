/**
 * Provides a field presentation for HTML text textarea elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/TextAreaPresentation
 */

import type { IJivsElement } from '../Interfaces/IJivsElement';
import { EditorFieldPresentationBase, EditorFieldPresentationBaseOptions } from './EditorFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML textarea tags.
 * 
 * ## CSS Classes
 * - persistent classes: 'jivs-editor-textarea', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'textareaEditor'.
 * TextAreaAdapterDefinition should use this presentation name: 'textareaEditor'.
 */
export class TextAreaPresentation extends EditorFieldPresentationBase<EditorFieldPresentationBaseOptions>
{
    /**
     * Constructor for the TextAreaPresentation class.
     * @param element The HTML textarea element associated with this presentation.
     * @param options Configuration options for the field presentation, including CSS classes.
     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     */
    constructor(element: HTMLElement,
        options?: EditorFieldPresentationBaseOptions,
        jivsElement?: IJivsElement | null
    )
    {
        super(element, options, jivsElement);
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