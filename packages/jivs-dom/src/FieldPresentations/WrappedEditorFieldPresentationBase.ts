/**
 * Base class for field presentations applied to a wrapper surrounding one or
 * more native HTML form controls.
 *
 * @module jivs-dom/FieldPresentations/AbstractClasses/WrappedIsValidFieldPresentationBase
 */

import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IsValidFieldPresentationBase, IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Base class for wrapped-editor presentations where the editor is an
 * HTML form control contained within a surrounding wrapper.
 * There should only be exactly one descendant form control
 * except for a radio group implementation.
 * 
 * ```html
 * <div class="jivs-wrapped-editor [more-classes]">
 *     <input type="text" name="example" />
 * </div>
 * ```
 * 
 * It can be any level of depth below the wrapper,
 * although it can be nested at any depth within the wrapper.
 * ```html
 * <div class="jivs-wrapped-editor [more-classes]">
 *  <div>
 *      <input type="text" name="example" />
 *  </div>
 * </div>
 * ```
 * 
 * Uses:
 * - If you want to apply styles with corrected, validated, or required states
 *   using ::after, it needs a wrapper so that the pseudo-element can be applied 
 *   to the wrapper rather than the form control itself.
 *   ```css
 *   .jivs-corrected::after {
 *       content: 'checkmark character';
 *       display: block;
 *   }
 *   ```
 * - Radio button groups can have enclosing presentation around all of the fields.
 * - Third party or custom widgets that have a wrapper but use an HTML form control inside.
 *
 * The element passed to the constructor is the wrapper and remains the
 * presentation element. 
 * 
 * ## Style Classes
 * Style classes are applied to the wrapper (the anchor).
 * - persistent classes: `jivs-wrapped-editor`, `jivs-isvalidpresentation`
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * CSS that targets the editor must be framed through the wrapper's classes.
 * ```css
 * .jivs-wrapped-editor.jivs-invalid input[type="text"] {
 *     border-color: red;
 * }
 * ```
 */
export abstract class WrappedEditorFieldPresentationBase<TElement extends HTMLElement = HTMLElement>
    extends IsValidFieldPresentationBase<TElement>
{
    /**
     * Creates a wrapped-editor presentation.
     *
     * @param element The wrapper that receives all presentation classes.
     * @param options Configuration options for the field presentation, including CSS classes.
     * @param anchor The Jivs DOM element associated with this field presentation, if any.
     */
    public constructor(
        element: TElement,
        options?: WrappedEditorFieldPresentationBaseOptions,
        // intentionally placed last because its usually used internally
        anchor?: IJivsDomElement | null
    )
    {
        super(element, options, anchor);
    }
    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-wrapped-editor');
    }
}

export interface WrappedEditorFieldPresentationBaseOptions extends IsValidFieldPresentationOptions
{
}