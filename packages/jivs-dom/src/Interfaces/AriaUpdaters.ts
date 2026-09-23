/**
 * Updaters are responsible for applying ARIA attributes to DOM elements based on the field's state and role.
 * There are two forms:
 * - Static - Applies ARIA attributes that do not change based on the field's validation state.
 *   They are applied only while initializing the field's editor.
 * - Validation State - Applies ARIA attributes that reflect the field's current validation state.
 * 
 * All updaters are immutable.
 * 
 * @module jivs-dom/Types/AriaService
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';

/**
 * Base interface for all ARIA element updaters.
 */
export interface IDomAriaElementUpdaterBase
{
    /**
     * When true, this updater should be run followed by the role updater.
     * When false, only this update should be run.
     */
    readonly alsoRunRoleUpdater: boolean;

}

/**
 * Applies ARIA attributes that do not change based on the field's validation state.
 * This updater is run by the PresentationInstallers.
 * Instances are immutable.
 */
export interface IDomAriaStaticElementUpdater extends IDomAriaElementUpdaterBase
{
    /**
     * Applies static ARIA attributes to the specified DOM element if applicable.
     * @param element The DOM element to which the static ARIA attributes will be applied.
     * @param role The role of the element, which may influence the ARIA attributes applied.
     * @param valueHost The host object containing the field's value, which may be used to determine ARIA attributes.
     */
    applyStaticAttributes(element: IJivsDomElement, role: ElementRole | string, valueHost?: IFieldValueHost): void;
}


/**
 * Applies ARIA attributes that reflect the field's current validation state.
 * This updater is run whenever the field's validation state changes, through
 * IFieldValidationDispatcher.
 * 
 * ARIAs require a relationship between the element and its error message element, if applicable.
 * We use the aria-errormessage attribute to establish this relationship on the editor.
 * It takes the ID of the element displaying the error message as its value.
 * Thus the caller must resolve the id from the error message in use before invoking this updater.
 *
 * Instances are immutable.
 */
export interface IDomAriaValidationStateElementUpdater extends IDomAriaElementUpdaterBase
{

    /**
     * Applies ARIA attributes to the specified DOM element based on the field's current validation state.
     * @param element The DOM element to which the ARIA attributes will be applied.
     * @param role The role of the element, which may influence the ARIA attributes applied.
     * @param valueHost The host object containing the field's value, which may be used to determine ARIA attributes.
     * @param state The current validation state of the field.
     * @param errorMessageId The ID of the element displaying the field's error message, if applicable.
     */
    applyValidationState(element: IJivsDomElement, role: ElementRole | string, valueHost: IFieldValueHost,
        state: ValueHostValidationState, errorMessageId?: string): void;
}
