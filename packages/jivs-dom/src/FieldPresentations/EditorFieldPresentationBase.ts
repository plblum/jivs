import { IJivsElement } from '../Interfaces/IJivsElement';
import { IsValidFieldPresentationBase, IsValidFieldPresentationGlobalOptions, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Base class for editor field presentations (role='editor')
 * 
 * ## CSS Classes
 * - permenant classes: 'jivs-editor', 'jivs-isvalidpresentation' + subclass supplied permanent classes
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 */
export abstract class EditorFieldPresentationBase<
    TOptions extends EditorFieldPresentationBaseOptions,
    TElement extends HTMLElement = HTMLElement>
    extends IsValidFieldPresentationBase<TOptions, TElement>
{
    /**
     * Constructor for EditorFieldPresentationBase class.
     * @param element The HTML element associated with this field presentation.
     * @param options Configuration options for the field presentation.
     * Passing null explicitly disables the corresponding class - except InvalidClass, while omitting the option uses 
     * the default supplied by this class or a derived class.
     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     * When null, it indicates that element itself is used as the Jivs DOM element.
     */
    constructor(element: TElement,
        options? : TOptions,
        // intentionally last as its usually called from internal code
        jivsElement: IJivsElement | null = null
    )
    {
        super(element, options, jivsElement);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-editor');
    }

    public override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.editor;
    }
}

export interface EditorFieldPresentationBaseGlobalOptions extends IsValidFieldPresentationGlobalOptions {}
export interface EditorFieldPresentationBaseOptions
    extends IsValidFieldPresentationOptions, EditorFieldPresentationBaseGlobalOptions
{
    
}