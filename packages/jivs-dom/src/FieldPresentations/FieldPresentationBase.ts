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
        this._variationClass = (options?.variationClass !== undefined) ?
            options.variationClass :
            this.defaultVariationClass();
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
     * A class to add to the presentation element regardless of its state.
     * If assigned, it will be affixed upon initialization and not later removed.
     * 
     * Use to select a different CSS class for the presentation element.
     * Defaults to null.
     */
    protected get variationClass(): string | null
    {
        return this._variationClass;
    }
    private _variationClass: string | null;
    protected defaultVariationClass(): string | null
    {
        return null;
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
        if (this.variationClass)
        {
            persistentClasses.push(this.variationClass);
        }        
        for (let cls of persistentClasses)
        {
            this.presentationElement.classList.add(cls);
        }        
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
     * The CSS class to add to the presentation element regardless of its state.
     * If assigned, it will be affixed upon initialization and not later removed.
     * Defaults to null.
     */
    variationClass?: string | null;
}