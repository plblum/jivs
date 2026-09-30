/**
 * Base class for ARIA static attribute updaters. 
 * Provides common functionality for safely adding ARIA attributes to DOM elements without overwriting existing ones.
 * 
 * @module jivs-dom/Aria/AbstractClasses/AriaStaticUpdaterBase
 */

import { IAriaStaticUpdater } from '../Interfaces/AriaUpdaters';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * Base class for ARIA static attribute updaters. 
 * Provides common functionality for safely adding ARIA attributes to DOM elements without overwriting existing ones.
 */
export abstract class AriaStaticUpdaterBase
    implements IAriaStaticUpdater
{
    public constructor()
    {
    }    

    /**
     * Applies static ARIA attributes to the specified DOM element if applicable.
     * @param element The DOM element to which the static ARIA attributes will be applied.
     * @param role The role of the element, which may influence the ARIA attributes applied.
     * @param valueHost The host object containing the field's value, which may be used to determine ARIA attributes.
     */    
    public abstract applyStaticAttributes(element: IJivsDomElement, role: ElementRole | string,
        valueHost?: IFieldValueHost): void;


    /**
     * Utility for subclasses as we want to safely add attributes without overwriting existing ones.
     * Adds an attribute to the specified DOM element. Does not allow replacing an existing attribute value.
     * @param element The DOM element to which the attribute will be added.
     * @param name The name of the attribute to add.
     * @param value The value of the attribute to add.
     */
    protected addAttribute(element: IJivsDomElement, name: string, value: string): void
    {
        if (!element.hasAttribute(name))
        {
            element.setAttribute(name, value);
        }
    }
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
    