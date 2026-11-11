import { EditorFieldPresentationBase, EditorFieldPresentationBaseGlobalOptions, EditorFieldPresentationBaseOptions } from './EditorFieldPresentationBase';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IJivsElement } from '../Interfaces/IJivsElement';

/**
 * Abstract base for all HTML form control presentations.
 * 
 * It offers an option to set the readonly attribute to true
 * when FieldValueHost.readOnly is true. Be aware that a readonly
 * attribute will be added to all subclasses regardless of whether they
 * actually support it.
 */
export abstract class HtmlFormControlFieldPresentationBase<
    TOptions extends HtmlFormControlFieldPresentationBaseOptions,
    TElement extends HTMLElement> extends EditorFieldPresentationBase<TOptions, TElement>
{

    /**
     * Constructor for HtmlFormControlFieldPresentationBase class.
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
    protected override applyToElement(element: TElement, valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        super.applyToElement(element, valueHost, state);
    // Note that some HTML form controls do not support the readonly attribute,
    // but this option will just assign it anyway.
    
        if(!this._readOnlyResolved && this.options.forceReadOnly !== false)
        {
            if (valueHost.readOnly) // readOnly is a fixed state. So this only has impact on the initial call
                element.setAttribute('readonly', 'true');
            this._readOnlyResolved = true;
        }
    }
    private _readOnlyResolved: boolean = false;
}

export interface HtmlFormControlFieldPresentationBaseGlobalOptions extends EditorFieldPresentationBaseGlobalOptions
{
}


export interface HtmlFormControlFieldPresentationBaseOptions
    extends EditorFieldPresentationBaseOptions, HtmlFormControlFieldPresentationBaseGlobalOptions
{

}