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
 * It can be any level of depth below the wrapper,
 * although there should only be exactly one descendant form control
 * except for a radio group implementation.
 * 
 * ```html
 * <div class="jivs-wrapped-editor-type">
 *     <input type="text" name="example" />
 * </div>
 * 
 * <tag>
 *  <nested-element>
 *      <input type="text" name="example" />
 *  </nested-element>
 * </tag>
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
 * presentation element. Validation and required-state CSS classes are applied
 * to that wrapper rather than directly to its descendant form controls.
 *
 * CSS rules may begin with the wrapper's state class and select supported
 * form controls at any descendant depth. The presentation does not locate or
 * manage those controls. That responsibility belongs to the associated
 * EditorAdapterDefinition.
 *
 * Every wrapped editor should have a unique presentation class to allow for consistent styling and behavior.
 * Override defaultPresentationClass() in derived classes to provide a unique presentation class for each wrapped editor.
 * 
 * Here's what it looks like with presentation class 'jivs-wrapped-editor-[type]' but still valid:
 * ```html
 * <div class="jivs-wrapped-editor-type">
 *     <input type="text" name="example" />
 * </div>
 * ```
 * To make it appear invalid:
 * ```css
 * .jivs-wrapped-editor-input.jivs-invalid input[type="text"]
 * {
 *     border-color: var(--jivs-invalid-wrapped-editor-border-color);
 * }
 * ```
 * 
 * ```html
 * <div class="jivs-wrapped-editor-type jivs-invalid">
 *     <input type="text" name="example" />
 * </div>
 * ```
 *
 * The default invalidClass is defined in defaultInvalidClass().
 *
 * validatedClass, correctedClass, and requiredClass remain null by default.
 * Users may enable the corresponding opt-in rules supplied by jivs-dom.css:
 *
 * - jivs-required
 * - jivs-validated
 * - jivs-corrected
 *
 * The required class remains on a required wrapping element independently of its
 * validation-result class. The supplied CSS may suppress its required
 * indicator when a validated or corrected indicator is present.
 */
export abstract class WrappedIsValidFieldPresentationBase<TElement extends HTMLElement = HTMLElement>
    extends IsValidFieldPresentationBase<TElement>
{
    /**
     * Creates a wrapped-editor presentation.
     *
     * @param element The wrapper that receives all presentation classes.
     * @param options Configuration options for the field presentation, including CSS classes.
     * Passing null explicitly disables the corresponding class - except InvalidClass, while omitting the option uses the 
     * default supplied by this class or a derived class.
     * @param jivsElement The Jivs DOM element associated with this field presentation, if any.
     */
    public constructor(
        element: TElement,
        options? : IsValidFieldPresentationOptions,
        // intentionally placed last because its usually used internally
        jivsElement?: IJivsDomElement | null
    )
    {
        super(element, options, jivsElement);
    }

}