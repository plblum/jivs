/**
 * Provides a field presentation for HTML file input elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FileInputPresentation
 */
import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Presentation for HTML input tags that feature a file input.
 * That includes these type= attribute values: file.
 * Its default css classes are:
 * - invalidClass: jivs-invalid (inherited)
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - variationClass: null
 * - persistent classes: jivs-editor-file-input + inherited
 * 
 * Registered with FieldPresentationFactory as presentation name 'fileInputEditor'.
 * InputAdapterDefinition should use this presentation name: 'fileInputEditor'.
 */
export class FileInputPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the FileInputPresentation class.
     * @param element The HTML input element of type file associated with this presentation.
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
        list.push('jivs-editor-file-input');
    }
}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for InputAdapterDefinition.
 */
export const defaultFileInputPresentationName = 'fileInputEditor';