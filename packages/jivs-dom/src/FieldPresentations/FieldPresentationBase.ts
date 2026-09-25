/**
 * Base class for field presentations.
 * @module jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase
 */

import { IFieldPresentation } from '../Interfaces/FieldPresentations';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IAriaStaticElementUpdater, IAriaValidationStateElementUpdater } from '../Interfaces/AriaUpdaters';
import { AdapterBase } from '../Adapters/AdapterBase';

/**
 * Base class for field presentations.
 * 
 * - implement init() when you need to perform initialization logic for the field presentation.
 * - implement apply() to update the field presentation based on the value host and its validation state.
 * - optionally override getStaticAriaElementUpdater() and getValidationStateAriaElementUpdater() 
 *   to provide ARIA updates on another element than the anchor.
 */
export abstract class FieldPresentationBase<TElement extends HTMLElement = HTMLElement>
    extends AdapterBase<TElement>
    implements IFieldPresentation
{

    public constructor(element: TElement)
    {
        super(element);
    }

    /**
     * Initializes the field presentation. 
     * This method should be implemented by derived classes to perform any necessary setup logic.
     * The default implementation does nothing.
     */
    public init(): void
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
    public getStaticAriaElementUpdater(): IAriaStaticElementUpdater | null
    {
        return null;
    }
    /**
     * Return a validation state ARIA element updater if your widget's elements need
     * ARIA attributes placed in a different element than the anchor.
     * @returns The validation state ARIA element updater, or null to use the default updater.
     */
    public getValidationStateAriaElementUpdater(): IAriaValidationStateElementUpdater | null
    {
        return null;
    }

}