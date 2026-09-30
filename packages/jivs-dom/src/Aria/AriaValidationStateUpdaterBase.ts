/**
 * Base class for ARIA validation state updaters.
 * 
 * @module jivs-dom/Aria/AbstractClasses/AriaValidationStateUpdaterBase
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IAriaValidationStateUpdater } from '../Interfaces/AriaUpdaters';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Base class for ARIA validation state updaters.
 */
export abstract class AriaValidationStateUpdaterBase
    implements IAriaValidationStateUpdater
{
    public constructor()
    {
    }

    /**
     * Applies ARIA attributes to the specified DOM element based on the field's current validation state.
     * @param element The DOM element to which the ARIA attributes will be applied.
     * @param valueHost The host object containing the field's value, which may be used to determine ARIA attributes.
     * @param state The current validation state of the field.
     * @param errorMessageId The ID of the element displaying the field's error message, if applicable.
     */    
    public abstract applyValidationState(element: IJivsDomElement, valueHost: IFieldValueHost,
        state: ValueHostValidationState, errorMessageId?: string): void;
    
    /**
     * Provides applyValidationState with the actual DOM element that should receive the ARIA attributes.
     * This base class implementation simply returns the element itself. 
     * Subclasses can override this method if the ARIA host element is different.
     * @param element The original DOM element passed to applyValidationState.
     * @returns The DOM element that should receive the ARIA attributes.
     */
    protected resolvingAriaHostElement(element: IJivsDomElement): IJivsDomElement
    {
        // Default implementation returns the element itself.
        // Subclasses can override this method if the ARIA host element is different.
        return element;
    }

}