/**
 * Top-level service container interface for jivs-dom.
 * Provides access to various DOM-related services, including dispatchers, editor and presentation installers, 
 * and ARIA support.
 * 
 * @module jivs-dom/Types/JivsDomServices
 */

import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IService, IServicesAccessor } from "@plblum/jivs-engine/build/Interfaces/Services";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { IDomEditorAdapterDefinitionFactory } from './Adapters';
import { IDomAriaService } from './AriaService';
import { IDomDispatcherService } from './Dispatchers';
import { IEditorInstaller } from './EditorInstaller';
import { IFieldPresentationFactory, IFieldPresentationInstaller } from './FieldPresentations';
import { IFormPresentationFactory, IFormPresentationInstaller } from './FormPresentations';
import { IIssuesFoundFormatterService } from './IssuesFoundFormatterService';
import { ElementRole } from './Types';


/**
 * Top level service container for jivs-dom. It joins IJivsServices through
 * getService/setService, and thus is accessible to all consumers of IJivsService.
 * 
 * It provides access to various services related to DOM manipulation, 
 * editor and presentation installations, and ARIA support.
 * 
 * Expected to be installed into the IJivsServices instance through its setService() method
 * making it available to anything that has access to the IJivsServices instance.
 */
export interface IJivsDomServices
    extends IService, IServicesAccessor
{

    /**
     * Gets the DOM dispatcher service responsible for handling DOM events 
     * and dispatching them to the appropriate handlers.
     * Use it to attach the ValueHostsManager callbacks.
     * ```ts
     * services.dispatchers.attach(config);
     * ```
     */
    dispatchers: IDomDispatcherService;

    /**
     * Gets the factory responsible for creating IDomEditorAdapterDefinitions.
     * Use it to register editor adapter definitions.
     * ```ts
     * services.editorAdapterDefinitionFactory.register(new MyAdapterDefinition());
     * ```
     * Consumed by the IEditorInstaller to create editor adapters.
     */
    editorAdapterDefinitionFactory: IDomEditorAdapterDefinitionFactory;

    /**
     * Gets the factory responsible for creating IFieldPresentations.
     * Use it to register your presentations, mapping a name to a creator function.
     * ```ts
     * services.fieldPresentationFactory.register("myPresentation", () => new MyFieldPresentation());
     * ```
     * Consumed by the IFieldPresentationInstaller to create field presentations.
     */
    fieldPresentationFactory: IFieldPresentationFactory;

    /**
     * Gets the factory responsible for creating IFormPresentations.
     * Use it to register your form presentations, mapping a name to a creator function.
     * ```ts
     * services.formPresentationFactory.register("myFormPresentation", () => new MyFormPresentation());
     * ```
     * Consumed by the IFormPresentationInstaller to create form presentations.
     */
    formPresentationFactory: IFormPresentationFactory;

    /**
     * Gets the installer responsible for setting up one Editor widget.
     * You can use it directly:
     * ```ts
     * services.editorInstaller.install(valueHost, element);
     * ```
     * You can use the FormInstaller run this for you against all editor widgets within a form.
     */
    editorInstaller: IEditorInstaller;

    /**
     * Gets the installer responsible for setting up field presentations on one element.
     * 
     * You can use it directly:
     * ```ts
     * services.fieldPresentationInstaller.install(valueHost, element, ElementRole.rolename);
     * ```
     * Consumed by the FormInstaller to create field presentations.
     */
    fieldPresentationInstaller: IFieldPresentationInstaller;

    /**
     * Gets the installer responsible for setting up form presentations on one element.
     * 
     * You can use it directly:
     * ```ts
     * services.formPresentationInstaller.install(valueHost, element, ElementRole.rolename);
     * ```
     * Consumed by the FormInstaller to create form presentations.
     */
    formPresentationInstaller: IFormPresentationInstaller;

    /**
     * Gets the ARIA service responsible for managing ARIA attributes and roles.
     * Set it to null to disable ARIA attribute and role management.
     */
    ariaService: IDomAriaService | null;

    /**
     * Gets the service responsible for creating either HTML or textual content
     * from ValidationState.IssuesFound. It can handle both field and form level,
     * using the summaryMessage for form level if supplied.
     * Built-in FieldPresentations and FormPresentations call upon this to get their 
     * error message content.
     */
    issuesFoundFormatter: IIssuesFoundFormatterService;

    /**
     * Helper to align a ValueHostsManager with a specific form.
     * Returns an HTMLElement representing the container element such as the form
     * based on ValueHostsManager. ValueHostsManagerConfig.ContainerIdentifier
     * can be setup to specify a custom container element. If not setup, 
     * it will return document.body.
     * @param valueHostsManager 
     */
    resolveContainerElement(valueHostsManager: IValueHostsManager): HTMLElement | null;

    /**
     * Helper to resolve the field element based on the FieldValueHost.
     * 
     * Returns an HTML element representing the resolved field element, or null if not found.
     * 
     * @param root The root HTMLElement to search within. If null, it uses resolveContainerElement().
     * @param valueHost The field value host associated with the field element. 
     * It specifies which field element to resolve within the root element.
     * @param role The role of the element, either as an ElementRole or a string.
     * @param elementIdentifierTemplate Optional template to identify the element.
     */
    resolveFieldElement(root: HTMLElement | null, valueHost: IFieldValueHost,
        role: ElementRole | string, elementIdentifierTemplate?: string): HTMLElement | null;
}