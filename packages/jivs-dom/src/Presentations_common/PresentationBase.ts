/**
 * Base class for field presentations.
 * @module jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase
 */

import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { AdapterBase } from '../Adapters/AdapterBase';
import { IJivsElement } from '../Interfaces/IJivsElement';
/**
 * Base class for both field and form presentations.
 * 
 * ## Persistent CSS classes
 * A Persistent class is a CSS class that remains applied to the presentation element throughout its lifecycle, 
 * regardless of the field's validation state. The init() function will gather and apply these persistent classes to the presentation element
 * using gatherPersistentClasses() to retrieve each persistent class.
 * 
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
 */
export abstract class PresentationBase<TOptions extends PresentationBaseOptions,
    TElement extends HTMLElement = HTMLElement>
    extends AdapterBase<TElement>
{
    /**
     * Initializes a new instance of the adapter with the specified DOM element 
     * and its associated IJivsElement structure.
     * @param element The DOM element that this adapter is associated with.
     * @param options The options for configuring the presentation base.
     * @param jivsElement The element containing the IJivsElement structure.
     * It is often the same as the element itself.
     */
    public constructor(element: TElement, options?: TOptions, jivsElement?: IJivsElement | null)
    {
        super(element, jivsElement ?? null);
        if (!options)
            options = {} as TOptions;
        options = { ...this.getOptionDefaults(), ...options };
        this._options = options;
    }

    protected get options(): TOptions
    {
        return this._options;
    }
    private _options: TOptions;

    /**
     * Provide the defaults for any property that is undefined on options.
     * Does not change already assigned option values.
     * @returns 
     */
    protected getOptionDefaults(): Partial<TOptions>
    {
        return {} as TOptions;
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
    protected addClasses(element: HTMLElement, list: string[]): void
    {
        for (let cls of list)
        {
            element.classList.add(cls);
        }
    }
    /**
     * Utility method to remove a list of CSS classes from the presentation element.
     * @param list The list of CSS classes to remove from the presentation element.
     */
    protected removeClasses(element: HTMLElement, list: string[]): void
    {
        for (let cls of list)
        {
            element.classList.remove(cls);
        }
    }
    /**
     * Use in the constructor to convert style sheet class options into an array of individual CSS classes.
     * If the input is a space-delimited string of classes, it will be split into an array of individual classes.
     * @param styleClass The CSS classes. When just a string, they are treated as a space-delimited list of individual classes.
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
        let variationClasses = PresentationBase.toStyleClassNameArray(this.options.variationClasses);
        if (variationClasses.length > 0)
        {
            persistentClasses.push(...variationClasses);
        }        
        this.addClasses(this.presentationElement, persistentClasses);          
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

    override dispose(): void
    {
        super.dispose();
        this._options = undefined as any;
    }

}

/**
 * Options for configuring the base field and form presentations.
 */
export interface PresentationBaseOptions
{
    /**
     * Style sheet class names to add to the presentation element that will always be present.
     * Defaults to an empty array.
     * The FieldPresentationClass will add its own with predefined names. When building
     * CSS, combine the fixed names with the variationClasses provided here.
     * ```css
     * .jivs-errormessagedisplay.my-variation-class
     * {
     *   // styles
     * }
     * ```
     */
    variationClasses?: string[] | string | null;
}