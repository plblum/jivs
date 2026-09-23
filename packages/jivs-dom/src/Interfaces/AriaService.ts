/**
 * Provides interfaces for managing ARIA attributes on DOM elements, 
 * including static and validation state updaters.
 * 
 * There are two categories of ARIA attributes:
 * - static - setup as the element is initialized.
 * - validation state - updated based on the validation state of the associated value host.
 * 
 * The aria service manages these with separate representations for field vs form.
 * It contains a registry for all Aria updaters.
 * 
 * @module jivs-dom/Types/AriaService
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IDomAriaStaticElementUpdater, IDomAriaValidationStateElementUpdater } from './AriaUpdaters';
import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';


/**
 * Service for managing ARIA attributes on DOM elements.
 * It allows registration of static and validation state updaters and applies them to elements as needed.
 * IJivsDomService.ariaService provides access to this service, but that property
 * can be null to disable using arias.
 */
export interface IDomAriaService
{
    /**
     * Registers a static ARIA attribute updater for the specified role.
     * 
     * @param role The role of the element for which the static updater should be applied.
     * @param updater The static ARIA attribute updater to register.
     * As it is an instance, it must be treated as immutable.
     */
    registerStaticUpdater(role: ElementRole | string, updater: IDomAriaStaticElementUpdater): void;

    /**
     * Registers a validation state ARIA attribute updater for the specified role.
     * 
     * @param role The role of the element for which the validation state updater should be applied.
     * @param updater The validation state ARIA attribute updater to register.
     * As it is an instance, it must be treated as immutable.
     */
    registerValidationStateUpdater(role: ElementRole | string,
        updater: IDomAriaValidationStateElementUpdater): void;

    /**
     * Applies the static ARIA attributes to the specified element using the provided updater.
     * The role is used for registry lookup.
     * 
     * @param element The DOM element to which the static ARIA attributes should be applied.
     * @param role The role of the element for which the static attributes should be applied.
     * @param valueHost The value host associated with the element, if any.
     * @param specializedUpdater The specialized static ARIA attribute updater to use, or null if none.
     * When supplied, it runs first. Then if its alsoRunRoleUpdater is true,
     * the updater in the registry is used.
     */
    applyStaticAttributes(element: IJivsDomElement, role: ElementRole | string,
        valueHost: IFieldValueHost | undefined,
        specializedUpdater: IDomAriaStaticElementUpdater | null): void;

    /**
     * Applies the validation state ARIA attributes to the specified root element.
     * It always uses IJivsDomElement.jivsAriaValidationStateUpdater which is setup
     * during the installation phase and does not require a specialized updater to be passed in.
     * 
     * @param root The root DOM element to which the validation state should be applied.
     * @param valueHost The value host associated with the element, if any.
     * @param state The validation state to apply.
     */
    applyValidationState(root: HTMLElement, valueHost: IFieldValueHost, state: ValueHostValidationState): void;
}

/**
 * Fields use ARIAs that change based on their validation state only in the editor
 * and the error message element.
 * AriaService requests this through its findElements() method to get both of those, 
 * if available.
 * There are two possible hosts for an ARIA reader to find error messages to read:
 * - The Error Display widget, which has a presentation supplied by jivs-dom.
 * That presentation may keep the error message element hidden or delayed until it is needed such as in a popup.
 * Such an Error Display widget is a poor choice for ARIA readers that need immediate access to error messages.
 * - A separate tag associated with the role of 'aria-error' that has no content of its own.
 * Its effectively invisible due to its css, but the reader can still access its content for ARIA purposes.
 * 
 * Your findElements() implementation may encounter both for a field, and must
 * know how to select one from them.
 */
export interface IFieldAriaElementAnchors
{
    /**
     * The anchor element for the field's editor, which is used to determine the ARIA context.
     * May be null if the editor is not available.
     */
    readonly editorAnchor: IJivsDomElement | null;

    /**
     * The element that displays the field's error message.
     * May be null if no error message element is available.
     */
    readonly errorMessageElement: IJivsDomElement | null;

    /**
     * The role of the element that displays the field's error message.
     * There are two roles:
     * - ElementRole.error: The element is part of the Error Display widget.
     * - ElementRole.ariaError: The element is a separate tag associated with the role of 'aria-error'.
     * May be null if no such element is available.
     */
    readonly errorMessageRole: ElementRole.error | ElementRole.ariaError | null;
}
