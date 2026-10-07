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
    public constructor(element: TElement, anchor: IJivsDomElement | null)
    {
        super(element, anchor);
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
     * Initializes the field presentation. 
     * This method should be implemented by derived classes to perform any necessary setup logic.
     * The default implementation does nothing.
     */
    public init(valueHostsManager: IValueHostsManager): void
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