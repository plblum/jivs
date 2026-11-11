/**
 * Provides a field presentation for HTML span elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/PlaceholderPresentation
 */

import type { IJivsElement } from '../Interfaces/IJivsElement';
import { EditorFieldPresentationBase, EditorFieldPresentationBaseOptions } from './EditorFieldPresentationBase';

/**
 * Presentation for HTML tags with textContent support (span, div, etc).
 * 
 * An HTML tag with textContent support (span, div, etc) can act in the role of an editor, albeit
 * a read-only editor, meaning it can display text but cannot be directly edited by the user.
 * 
 * We target this for showing the text values of FieldValueHosts that
 * aren't intended to be directly edited by the user.
 * It benefits from FieldValueHosts having so many tools
 * for managing and formatting the text values, plus the ability to
 * report changes through the TextValueDispatcher.
 * 
 * ## CSS Classes
 * - persistent classes: 'jivs-editor-placeholder', 'jivs-editor', 'jivs-isvalidpresentation'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   even though only jivs-invalid is typically relevant for span elements.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 */
export class PlaceholderPresentation extends EditorFieldPresentationBase<EditorFieldPresentationBaseOptions>
{
    /**
     * Constructor for the PlaceholderPresentation class.
     * @param element The HTML tag with textContent support (span, div, etc) associated with this presentation.
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
        list.push('jivs-editor-placeholder');
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for InputAdapterDefinition.
 */
export const defaultPlaceholderPresentationName = 'placeholderEditor';