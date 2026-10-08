import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Base class for editor field presentations (role='editor')
 * 
 * ## Style Classes
 * - permenant classes: 'jivs-editor', 'jivs-isvalidpresentation' + subclass supplied permanent classes
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 */
export abstract class EditorFieldPresentationBase<TElement extends HTMLElement = HTMLElement> extends IsValidFieldPresentationBase<TElement>
{
    /**
     * Constructor for EditorFieldPresentationBase class.
     * @param element The HTML element associated with this field presentation.
     * @param options Configuration options for the field presentation.
     * Passing null explicitly disables the corresponding class - except InvalidClass, while omitting the option uses 
     * the default supplied by this class or a derived class.
     * @param anchor The Jivs DOM element associated with this field presentation, if any.
     * When null, it indicates that element itself is used as the Jivs DOM element.
     */
    constructor(element: TElement,
        options? : IsValidFieldPresentationOptions,
        // intentionally last as its usually called from internal code
        anchor: IJivsDomElement | null = null
    )
    {
        super(element, options, anchor);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-editor');
    }
}