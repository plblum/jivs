/**
 * Updaters are responsible for applying ARIA attributes to DOM elements based on the field's state and role.
 * There are two forms:
 * - Static - Applies ARIA attributes that do not change based on the field's validation state.
 *   They are applied only while initializing the field's editor.
 * - Validation State - Applies ARIA attributes that reflect the field's current validation state.
 * 
 * All updaters are immutable.
 * 
 * The AriaService is responsible for creating these updaters and assigning them to the appropriate elements
 * within its install() function.
 * - Static updaters are executed by AriaService.install alone and not retained on IJivsDomElement instances.
 * - Validation state updaters are assigned to the IJivsDomElement.jivsAriaValidationStateUpdater property 
 *   and are invoked in two use cases:
 *   - During the installation, apply the current validation state from the FieldValueHost.
 *   - Whenever the field's validation state changes, the FieldValidationDispatcher will invoke the updater
 *     when found on IJivsDomElement.jivsAriaValidationStateUpdater.
 * 
 * @module jivs-dom/Types/AriaService
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';

/**
 * Applies ARIA attributes that do not change based on the field's validation state.
 * This updater is run by the PresentationInstallers.
 * Instances are immutable.
 */
export interface IAriaStaticUpdater
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
 * 
 * There should be different classes to handle variations by role. The installation process
 * in AriaService.install is expected to assign the appropriate IAriaValidationStateUpdater instance to the element.
 */
export interface IAriaValidationStateUpdater
{

    /**
     * Applies ARIA attributes to the specified DOM element based on the field's current validation state.
     * @param element The DOM element to which the ARIA attributes will be applied.
     * @param valueHost The host object containing the field's value, which may be used to determine ARIA attributes.
     * @param state The current validation state of the field.
     * @param errorMessageId The ID of the element displaying the field's error message, if applicable.
     */
    applyValidationState(element: IJivsDomElement, valueHost: IFieldValueHost,
        state: ValueHostValidationState, errorMessageId?: string): void;
}
