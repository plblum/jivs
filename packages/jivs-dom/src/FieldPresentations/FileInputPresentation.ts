/**
 * Provides a field presentation for HTML file input elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FileInputPresentation
 */
import { IsValidFieldPresentationBase } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input tags that feature a file input.
 * That includes these type= attribute values: file.
 * Its default css classes are:
 * - invalidClass: jivs-invalid-editor-file-input
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: null
 * 
 * Registered with FieldPresentationFactory as presentation name 'fileInputEditor'.
 * InputAdapterDefinition should use this presentation name: 'fileInputEditor'.
 */
export class FileInputPresentation extends IsValidFieldPresentationBase
{
    /**
     * 
     * @param element 
     * @param invalidClass - note that this parameter does not allow null, unlike its ancestor
     * because the TextInputPresentation class always expects a valid CSS class for invalid state and does not support a null value.
     */
    constructor(element: HTMLElement,
        invalidClass?: string, // does not support null - must always provide a valid CSS class for invalid state
        validatedClass?: string | null,
        correctedClass?: string | null,
        requiredClass?: string | null,
        presentationClass?: string | null,
    )
    {
        super(element, invalidClass ?? undefined, validatedClass, correctedClass, requiredClass, presentationClass);
    }

    protected override defaultInvalidClass(): string | null
    {
        return 'jivs-invalid-editor-file-input';
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for InputAdapterDefinition.
 */
export const defaultFileInputPresentationName = 'fileInputEditor';