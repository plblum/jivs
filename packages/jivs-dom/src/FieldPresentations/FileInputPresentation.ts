/**
 * Provides a field presentation for HTML file input elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FileInputPresentation
 */
import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorFieldPresentationBase } from './EditorFieldPresentationBase';

/**
 * Presentation for HTML input tags that feature a file input.
 * That includes these type= attribute values: file.
 * 
 * ## Style Classes
 * - persistent classes: 'jivs-editor-file-input', 'jivs-isvalidpresentation', 'jivs-editor'
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'fileInputEditor'.
 * InputAdapterDefinition should use this presentation name: 'fileInputEditor'.
 */
export class FileInputPresentation extends EditorFieldPresentationBase
{
    /**
     * Constructor for the FileInputPresentation class.
     * @param element The HTML input element of type file associated with this presentation.
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
        list.push('jivs-editor-file-input');
    }
}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for InputAdapterDefinition.
 */
export const defaultFileInputPresentationName = 'fileInputEditor';