/**
 * Provides a presentation for HTML select elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/SelectPresentation
 */

import type { IJivsElement } from '../Interfaces/IJivsElement';
import { EditorFieldPresentationBase, EditorFieldPresentationBaseOptions } from './EditorFieldPresentationBase';

/**
 * Presentation for HTML select tags.
 * 
 * - persistent classes: 'jivs-editor-select', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 *
 * ## CSS Classes
 * 
 * Registered with FieldPresentationFactory as presentation name 'selectEditor'.
 * SelectAdapterDefinition should use this presentation name: 'selectEditor'.
 */
export class SelectPresentation extends EditorFieldPresentationBase<EditorFieldPresentationBaseOptions>
{
    /**
     * Constructor for the SelectPresentation class.
     * @param element The HTML select element associated with this presentation.
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
        list.push('jivs-editor-select');
    }
}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for SelectAdapterDefinition.
 */
export const defaultSelectPresentationName = 'selectEditor';