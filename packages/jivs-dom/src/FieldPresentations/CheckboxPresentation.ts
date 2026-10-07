/**
 * Provides a presentation for HTML input elements of type checkbox.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/CheckboxPresentation
 */
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input tags that feature a checkbox.
 * That includes these type= attribute values: checkbox
 * Its default css classes are:
 * - invalidClass: jivs-invalid (inherited)
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - variationClass: null
 * - persistent classes: 'jivs-editor-checkbox' + inherited
 * 
 * Registered with FieldPresentationFactory as presentation name 'checkboxEditor'.
 * CheckboxAdapterDefinition should use this presentation name: 'checkboxEditor'.
 */
export class CheckboxPresentation extends IsValidFieldPresentationBase
{
    /**
     * Constructor for the CheckboxPresentation class.
     * @param element The HTML input element of type checkbox associated with this presentation.
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
        list.push('jivs-editor-checkbox');
    }

}
/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for CheckboxAdapterDefinition.
 */
export const defaultCheckboxPresentationName = 'checkboxEditor';