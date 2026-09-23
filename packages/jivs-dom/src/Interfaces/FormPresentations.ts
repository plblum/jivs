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
     * Initializes the form presentation. 
     * This method is called once after the presentation is created and 
     * before it is applied to any validation state.
     */
    init(): void;

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