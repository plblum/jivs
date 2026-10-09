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
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
/**
 * Base class for field presentations.
 * 
 * - implement init() when you need to perform initialization logic for the field presentation.
 * - implement apply() to update the field presentation based on the value host and its validation state.
 * - optionally override resolvePresentationElement() to customize the element that is the target of the presentation,
 *   such as the host of the CSS class names.
 * - optionally override getStaticAriaElementUpdater() and getValidationStateAriaElementUpdater() 
 *   to provide ARIA updates on another element than the anchor.
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
 *   For example, ErrorMessageDisplayPresentationBase supplies 'jivs-error-message-display' and its subclass InlineErrorMessageDisplayPresentation supplies 'jivs-inline-error-message-display'.
 *   You should setup up your CSS files to include these persistent classes prior to adding your own.
 *   ```css
 *   .jivs-error-message-display.jivs-inline-error-message-display.my-custom-class {
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
 *  - 'jivs-has-errors' - For when ValidationState.issuesFound.length > 0. Only used for error message displays.
 *  - 'jivs-validated' - For when ValidationState.status = Valid to indicate that the field has been successfully validated. Not used for error message displays.
 *  - 'jivs-corrected' - For when a previously invalid field has been corrected and is now valid. Not used for error message displays.
 *  - 'jivs-required' - For when FieldValueHost.required = true. Not used for error message displays.
 * 
 * There are several strategies for customizing stateful classes:
 * 1. Do not change the fixed stateful class. Let it only be used to change the state, usually by removing or applying display: none.
 *    Instead, create your own custom stateful classes to handle all visualizations. Add each new class to the variationClasses option when constructing the field presentation.
 *    ```css
 *    .jivs-error-message-display: not(.jivs-invalid) {
 *        display: none;
 *    }
 *    .jivs-error-message-display.jivs-invalid {
 *      // do not change this class. Always create custom stateful classes for additional visualizations.
 *    }
 *    .jivs-error-message-display.jivs-invalid.my-custom-stateful-class {
 *        color: red;
 *    }
 *    ```
 * 2. Change the fixed stateful class to support visualizations, ensuring it still correctly handles visibility.
 *    The variationClasses option does not need to be updated.
 *    ```css
 *    .jivs-error-message-display: not(.jivs-invalid) {
 *        display: none;
 *    }
 *    .jivs-error-message-display.jivs-invalid {
 *        color: red;
 *    }
 *    ```
 * 3. Combine both approaches by using fixed stateful classes for essential state changes and custom stateful classes for additional visualizations.
 *    In this case, be careful that a specific style defined in the fixed stateful class does not conflict with the custom stateful classes
 *    because CSS cannot guarantee the order of precedence for conflicting styles.
 *    ```css
 *    .jivs-error-message-display: not(.jivs-invalid) {
 *        display: none;
 *    }
 *    .jivs-error-message-display.jivs-invalid {
 *        color: red;
 *    }
 *    .jivs-error-message-display.jivs-invalid.my-custom-stateful-class {
 *        outline: 1px dotted red;
 *    }
 *    ```
 */
export abstract class FieldPresentationBase<TElement extends HTMLElement = HTMLElement>
    extends AdapterBase<TElement>
    implements IFieldPresentation
{
    /**
     * Initializes a new instance of the adapter with the specified DOM element and its associated IJivsDomElement wrapper.
     * @param element The DOM element that this adapter is associated with.
     * @param anchor The element containing the IJivsDomElement wrapper.
     * It is often the same as the element itself.
     */
    public constructor(element: TElement, options?: FieldPresentationBaseOptions, anchor?: IJivsDomElement | null)
    {
        super(element, anchor ?? null);
        this._variationClasses = FieldPresentationBase.toStyleClassNameArray(options?.variationClasses);
    }

    /**
     * The element property may not always represent the actual presentation element.
     * Use this property to access the element that should be used for presentation purposes.
     * Designed to allow the element to be switched as the widget may discard and rebuild itself.
     */
    protected get presentationElement(): HTMLElement
    {
        return this.resolvePresentationElement(this.element);
    }

    /**
     * Resolves the actual presentation element for the field presentation.
     * @param element The element to resolve as the presentation element.
     * @returns The resolved presentation element.
     * The default implementation returns the element itself.
     */
    protected resolvePresentationElement(element: TElement): HTMLElement
    {
        return element;
    }


    /**
     * Utility method to add a list of CSS classes to the presentation element.
     * @param list The list of CSS classes to add to the presentation element.
     */
    protected addClasses(list: string[]): void
    {
        for (let cls of list)
        {
            this.presentationElement.classList.add(cls);
        }
    }
    /**
     * Utility method to remove a list of CSS classes from the presentation element.
     * @param list The list of CSS classes to remove from the presentation element.
     */
    protected removeClasses(list: string[]): void
    {
        for (let cls of list)
        {
            this.presentationElement.classList.remove(cls);
        }
    }
    /**
     * Use in the constructor to convert style sheet class options into an array of individual CSS classes.
     * If the input is a space-delimited string of classes, it will be split into an array of individual classes.
     * @param styleClass The style classes. When just a string, they are treated as a space-delimited list of individual classes.
     * If the input is null or undefined, an empty array will be returned.
     * @returns An array of individual CSS classes derived from the input.
     */
    public static toStyleClassNameArray(styleClass: string | string[] | null | undefined): string[]
    {
        if (Array.isArray(styleClass))
        {
            return [...styleClass]; // clone to avoid mutation of the original array
        }
        else if (typeof styleClass === 'string')
        { // this can be a space delimited list of classes
            return styleClass.split(' ').filter(cls => cls.length > 0);
        }
        return [];
    }

    /**
     * Style sheet class names to add to the presentation element that will always be present.
     * Defaults to an empty array.
     * The FieldPresentationClass will add its own with predefined names. When building
     * CSS, combine the fixed names with the variationClasses provided here.
     * ```css
     * .jivs-error-message-display.my-variation-class
     * {
     *   // styles
     * }
     */
    protected get variationClasses(): string[]
    {
        return this._variationClasses;
    }
    private _variationClasses: string[];

    /**
     * Initializes the field presentation. 
     * This method should be implemented by derived classes to perform any necessary setup logic.
     * The default implementation does nothing.
     */
    public init(valueHostsManager: IValueHostsManager): void
    {
        let persistentClasses: string[] = [];
        this.gatherPersistentClasses(persistentClasses);
        // placed outside of gatherPersistentClasses to ensure it is always added last
        // for visual appeal only.
        if (this.variationClasses.length > 0)
        {
            persistentClasses.push(...this.variationClasses);
        }        
        this.addClasses(persistentClasses);          
    }

    /**
     * Gathers all persistent classes that should be applied to the presentation element.
     * Override this method to add more persistent classes as needed but
     * be sure to call the base implementation to include the default persistent classes.
     * @param list 
     */
    protected gatherPersistentClasses(list: string[]): void
    {
    }

    /**
     * Updates the field presentation based on the current value and validation state.
     * @param valueHost The field value host providing the current value and context.
     * @param state The current validation state of the value host.
     */
    public abstract apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void;


    /**
     * Return a static ARIA element updater if your widget's elements need
     * ARIA attributes placed in a different element than the anchor.
     * @returns The static ARIA element updater, or null to use the default updater.
     */
    public getStaticAriaElementUpdater(): IAriaStaticUpdater | null
    {
        return null;
    }
    /**
     * Return a validation state ARIA element updater if your widget's elements need
     * ARIA attributes placed in a different element than the anchor.
     * @returns The validation state ARIA element updater, or null to use the default updater.
     */
    public getValidationStateAriaElementUpdater(): IAriaValidationStateUpdater | null
    {
        return null;
    }

}

/**
 * Options for configuring the base field presentation.
 */
export interface FieldPresentationBaseOptions
{
    /**
     * Style sheet class names to add to the presentation element that will always be present.
     * Defaults to an empty array.
     * The FieldPresentationClass will add its own with predefined names. When building
     * CSS, combine the fixed names with the variationClasses provided here.
     * ```css
     * .jivs-error-message-display.my-variation-class
     * {
     *   // styles
     * }
     * ```
     */
    variationClasses?: string[] | string | null;
}