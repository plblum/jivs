/**
 * Provides the interfaces for form presentations within the Jivs DOM framework.
 * 
 * Form Presentations handle the visuals for form-level widgets like Validation Summary
 * and Submit controls. They respond to changes in the form's validation state and update the UI accordingly.
 * 
 * - onValidationStateChanged -> IFormValidationDispatcher -> IFormPresentation -> elements changed
 * 
 * @module jivs-dom/Types/FormPresentations
 */

import { ValidationState } from "@plblum/jivs-engine/build/Interfaces/Validation";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';
import { IDomAriaStaticElementUpdater } from './AriaUpdaters';

/**
 * Represents a form presentation, which can apply validation states to Validation Summary,
 * Submit controls and other form-level widgets.
 * IJivsDomServices owns the sole instance of IFormPresentation.
 * 
 * The IFormValidationDispatcher will invoke the apply() method on this presentation to 
 * update the form's validation state.
 * 
 * An IFormPresentation instance allows for its instance to be modified, to support its dynamic behavior.
 * However, it should not references the IValueHostsManager or the validation state directly.
 */
export interface IFormPresentation
{

    /**
     * Supports the validation group feature. When assigned, the validation group supplied
     * on ValidationState.group must be first checked to see if matches the IJivsDomElement.jivsFormPresentationGroup.
     * When this is false, only that match should allow updating its presentation.
     * When true, if the jivsFormPresentationGroup indicates a wildcard group, the presentation should respond to it.
     */
    readonly respondToWildcardGroup?: boolean;
    /**
     * Applies the specified validation state to the form.
     * Its parameters match those of the ValueHostsManager.onValidationStateChanged callback
     * as this is the target for that callback.
     * @param valueHostsManager The manager providing access to the value hosts within the form.
     * @param state The current validation state to be applied to the form.
     */
    apply(valueHostsManager: IValueHostsManager, state: ValidationState): void;

    /**
     * Allows this Presentation to override the default ARIA placement for static attributes.
     * Typically used when the element identified by this presentation uses another element
     * for its static ARIA attributes.
     */
    getStaticAriaElementUpdater(): IDomAriaStaticElementUpdater | null;
}

/**
 * Used by IFormPresentationFactory to create IFormPresentation instances.
 */
export type FormPresentationCreator = (element: IJivsDomElement) => IFormPresentation;

/**
 * Factory that registers and creates IFormPresentation instances.
 * Every registration connects a Presentation Name to an instance.
 * The same instance can be registered under multiple presentation names.
 * That name is used in lookups, either as an option parameter, or from a supplied default presentation name.
 * 
 * The factory is only used during the initialization phase.
 */
export interface IFormPresentationFactory
{
    /**
     * Registers a presentation creator function under the specified presentation name.
     * Replaces any previously registered creator function for the same presentation name.
     * 
     * @param presentationName The name of the presentation to register.
     * @param creator The function that creates an IFormPresentation instance for the given element.
     */
    register(presentationName: string, creator: FormPresentationCreator): void;

    /**
     * Sets the default presentation name for a given role.
     * 
     * @param role The role for which to set the default presentation name.
     * @param presentationName The default presentation name to associate with the role.
     */
    setDefaultPresentationName(role: ElementRole | string, presentationName: string): void;

    /**
     * Creates an IFormPresentation instance for the given element, role, and optional presentation name.
     * 
     * @param element The DOM element for which to create the presentation.
     * @param role The role of the element for which to create the presentation.
     * @param presentationName The optional presentation name to use for creating the presentation.
     * When supplied, it overrides the default presentation name set for the role.
     */
    create(element: IJivsDomElement, role: ElementRole | string, presentationName?: string): IFormPresentation | null;
}


/**
 * Handles installation of IFormPresentations to a specific element.
 * It uses the role and valueHost to determine how to install the field presentation.
 * ValueHost's field name from getElementIdentifier() and data type from getDataType() are often
 * used to resolve the appropriate field presentation for the element.
 * IJivsDomServices owns the sole instance of IFormPresentationInstaller.
 */

export interface IFormPresentationInstaller
{
    /**
     * Installs an IFormPresentation to the specified element based on the role and value host.
     * 
     * @param valueHostsManager The manager for value hosts.
     * @param element The DOM element to which the presentation should be installed.
     * @param role The role of the element for which to install the presentation.
     * @param options Optional installation options.
     * @returns The installed IFormPresentation instance, or null if installation failed.
     */
    install(valueHostsManager: IValueHostsManager, element: IJivsDomElement, role: ElementRole | string,
        options?: FormPresentationInstallOptions): IFormPresentation | null;
}

/**
 * Options for IFormPresentationInstaller.install.
 */
export interface FormPresentationInstallOptions
{
    /**
     * The name of the presentation to use for installation. 
     * If null, the default presentation for the role will be used.
     */
    presentationName?: string | null;
    /**
     * The Validation Group name to which this presentation belongs.
     * Leave undefined if validation groups are not used.
     * When set, expect this to exactly match the ValidationState.group value.
     */
    group?: string;
}