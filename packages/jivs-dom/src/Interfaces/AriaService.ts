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
import { IAriaStaticUpdater, IAriaValidationStateUpdater } from './AriaUpdaters';
import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';
import { IElementRegistry } from './ElementRegistry';


/**
 * Service for managing ARIA attributes on DOM elements.
 * It allows registration of static and validation state updaters and applies them to elements as needed.
 * IJivsDomService.ariaService provides access to this service, but that property
 * can be null to disable using arias.
 */
export interface IAriaService
{
    /**
     * Registers a static ARIA attribute updater for the specified role.
     * 
     * @param role The role of the element for which the static updater should be applied.
     * @param updater The static ARIA attribute updater to register.
     * As it is an instance, it must be treated as immutable.
     */
    registerStaticUpdater(role: ElementRole | string, updater: IAriaStaticUpdater): void;

    /**
     * Registers a validation state ARIA attribute updater for the specified role.
     * 
     * @param role The role of the element for which the validation state updater should be applied.
     * @param updater The validation state ARIA attribute updater to register.
     * As it is an instance, it must be treated as immutable.
     */
    registerValidationStateUpdater(role: ElementRole | string,
        updater: IAriaValidationStateUpdater): void;
    
    /**
     * Call during initialization phase to apply all static updaters,
     * assign IJivsDomElement.jivsAriaValidationStateUpdater if possible,
     * and apply initial validation state to validation state updaters.
     * @param registry 
     */
    install(registry: IElementRegistry): void;

    /**
     * Applies the static ARIA attributes to the specified element.
     * 
     * It resolves the appropriate static ARIA attribute updater for the element based on the
     * element's IJivsDomElement properties.
     * 
     * The first to assign them in this order is used:
     * 1. Editor adapter definition (not available on non-editor roles): 
     *      jivsEditorAdapterDefinition.getStaticAriaElementUpdater()
     * 2. Field presentation: 
     *      jivsFieldPresentation.getStaticAriaElementUpdater()
     * 3. AriaServices' default updaters based on role:
     *      jivsElementRole
     * When none are found, nothing happens because its common to have roles and elements
     * that do not need ARIA support.
     * @param element The DOM element to which the static ARIA attributes should be applied.
     * @param valueHost The value host associated with the element, if any. 
     * Field level elements will have a FieldValueHost, but may have undefined if their Element Identifier 
     * didn't match to a FieldValueHost.
     * Form level elements will always have null/undefined.
     * @returns The resolved static ARIA element updater, or null if none could be resolved.
     */
    applyStaticAttributes(element: IJivsDomElement, valueHost: IFieldValueHost | null | undefined):
        IAriaStaticUpdater | null;

    /**
     * Applies the validation state ARIA attributes to the specified element.
     * 
     * It resolves the appropriate validation state ARIA attribute updater for the element based on the
     * element's IJivsDomElement properties.
     * 
     * The first to assign them in this order is used:
     * 1. Editor adapter definition (not available on non-editor roles): 
     *      jivsEditorAdapterDefinition.getValidationStateAriaElementUpdater()
     * 2. Field presentation: 
     *      jivsFieldPresentation.getValidationStateAriaElementUpdater()
     * 3. AriaServices' default updaters based on role:
     *      jivsElementRole
     * When none are found, nothing happens because its common to have roles and elements
     * that do not need ARIA support. 
     * @returns The resolved validation state ARIA element updater, or null if none could be resolved.
     * @param element The DOM element to which the validation state should be applied.
     * @param valueHost The value host associated with the element, if any.
     * @param state The validation state to apply.
     */
    applyValidationState(element: IJivsDomElement, 
        valueHost: IFieldValueHost, state: ValueHostValidationState): IAriaValidationStateUpdater | null;
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
