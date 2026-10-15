/**
 * Base class for field presentations.
 * @module jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { AdapterBase } from '../Adapters/AdapterBase';
import { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../Interfaces/AriaUpdaters';
import { IFieldPresentation } from '../Interfaces/FieldPresentations';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { PresentationBase, PresentationBaseGlobalOptions, PresentationBaseOptions } from '../Presentations_common/PresentationBase';
/**
 * Base class for field presentations.
 * 
 * - implement init() when you need to perform initialization logic for the field presentation.
 * - implement apply() to update the field presentation based on the value host and its validation state.
 * - optionally override resolvePresentationElement() to customize the element that is the target of the presentation,
 *   such as the host of the CSS class names.
 * - optionally override getStaticAriaUpdater() and getAriaValidationStateUpdater() 
 *   to provide ARIA updates on another element than the presentation element.
 * 
 * ## CSS Class rules
 * ### Persistent classes
 * A Persistent class is a CSS class that remains applied to the presentation element throughout its lifecycle, 
 * regardless of the field's validation state. The init() function will gather and apply these persistent classes to the presentation element
 * using gatherPersistentClasses() to retrieve each persistent class.
 * All class names should follow the 'jivs-' prefix convention to maintain consistency across the field presentations.
 * 
 * - Concrete field presentations should define their own persistent classes.
 * - Base classes should also define their persistent classes if they provide any foundational styling or add stateful classes.
 * - Expect that all persistent classes from the concrete class up through the inheritance chain to be collected and applied to the presentation element.
 * 
 *   For example, ErrorMessageDisplayPresentationBase supplies 'jivs-errormessagedisplay' and its subclass InlineErrorMessageDisplayPresentation supplies 'jivs-inlineerrormessagedisplay'.
 *   You should setup up your CSS files to include these persistent classes prior to adding your own.
 *   ```css
 *   .jivs-errormessagedisplay.jivs-inlineerrormessagedisplay.my-custom-class {
 *       // Inline error message display styling
 *   }
 *   ```
 * - Add your own custom classes through the `variationClasses` option when constructing the field presentation.
 * 
 * ### Stateful classes
 * Stateful classes are CSS classes that are applied to the presentation element based on specific states of the field.
 * These classes may change dynamically as the field's state changes, such as when it becomes focused, invalid, or disabled.
 * There are fixed stateful classes that jivs-dom manages:
 *  - 'jivs-invalid' - For when ValidationState.isValid = false. Not used for error message displays (role='error').
 *  - 'jivs-has-issues' - For when ValidationState.issuesFound.length > 0. Only used for error message displays.
 *  - 'jivs-validated' - For when ValidationState.status = Valid to indicate that the field has been successfully validated. Not used for error message displays.
 *  - 'jivs-corrected' - For when a previously invalid field has been corrected and is now valid. Not used for error message displays.
 *  - 'jivs-required' - For when FieldValueHost.required = true. Not used for error message displays.
 * 
 * There are several strategies for customizing stateful classes:
 * 1. Do not change the fixed stateful class. Let it only be used to change the state, usually by removing or applying display: none.
 *    Instead, create your own custom stateful classes to handle all visualizations. Add each new class to the variationClasses option when constructing the field presentation.
 *    ```css
 *    .jivs-errormessagedisplay: not(.jivs-invalid) {
 *        display: none;
 *    }
 *    .jivs-errormessagedisplay.jivs-invalid {
 *      // do not change this class. Always create custom stateful classes for additional visualizations.
 *    }
 *    .jivs-errormessagedisplay.jivs-invalid.my-custom-stateful-class {
 *        color: red;
 *    }
 *    ```
 * 2. Change the fixed stateful class to support visualizations, ensuring it still correctly handles visibility.
 *    The variationClasses option does not need to be updated.
 *    ```css
 *    .jivs-errormessagedisplay: not(.jivs-invalid) {
 *        display: none;
 *    }
 *    .jivs-errormessagedisplay.jivs-invalid {
 *        color: red;
 *    }
 *    ```
 * 3. Combine both approaches by using fixed stateful classes for essential state changes and custom stateful classes for additional visualizations.
 *    In this case, be careful that a specific style defined in the fixed stateful class does not conflict with the custom stateful classes
 *    because CSS cannot guarantee the order of precedence for conflicting styles.
 *    ```css
 *    .jivs-errormessagedisplay: not(.jivs-invalid) {
 *        display: none;
 *    }
 *    .jivs-errormessagedisplay.jivs-invalid {
 *        color: red;
 *    }
 *    .jivs-errormessagedisplay.jivs-invalid.my-custom-stateful-class {
 *        outline: 1px dotted red;
 *    }
 *    ```
 */
export abstract class FieldPresentationBase<TOptions extends FieldPresentationBaseOptions,
    TElement extends HTMLElement = HTMLElement>
    extends PresentationBase<TOptions, TElement>
    implements IFieldPresentation
{
    /**
     * Initializes a new instance of the adapter with the specified DOM element and its associated IJivsElement structure.
     * @param element The DOM element that this adapter is associated with.
     * @param jivsElement The element containing the IJivsElement structure.
     * It is often the same as the element itself.
     */
    public constructor(element: TElement, options?: TOptions, jivsElement?: IJivsElement | null)
    {
        super(element, options, jivsElement);
    }

    /**
     * Updates the field presentation based on the current value and validation state.
     * @param valueHost The field value host providing the current value and context.
     * @param state The current validation state of the value host.
     */
    public abstract apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void;


    /**
     * Return a static ARIA element updater if your widget's elements need
     * ARIA attributes placed in a different element than the presentation element.
     * @returns The static ARIA element updater, or null to use the default updater.
     */
    public getStaticAriaUpdater(): IAriaStaticUpdater | null
    {
        return null;
    }
    /**
     * Return a validation state ARIA element updater if your widget's elements need
     * ARIA attributes placed in a different element than the presentation element.
     * @returns The validation state ARIA element updater, or null to use the default updater.
     */
    public getAriaValidationStateUpdater(): IAriaValidationStateUpdater | null
    {
        return null;
    }

    public override dispose(): void
    {
        super.dispose();
    }
}

/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the Presentations options. 
 */
export interface FieldPresentationBaseGlobalOptions extends PresentationBaseGlobalOptions
{
}
/**
 * Options specific to the field presentation instance.
 * Includes both the base options and the global options for the field presentation.
 * Only add here options are are used situationally.
 */
export interface FieldPresentationBaseOptions extends PresentationBaseOptions,
    FieldPresentationBaseGlobalOptions
{
}