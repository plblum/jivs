/**
 * Provides access to various DOM-related services within the Jivs framework.
 * 
 * @module jivs-dom/Services/ConcreteClasses/JivsDomServices
 */

import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { ServiceWithAccessorBase } from '@plblum/jivs-engine/build/Services/ServiceWithAccessorBase';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { DispatcherService } from '../Dispatchers/DispatcherService';
import { EditorAdapterDefinitionFactory } from '../EditorAdapterDefinitions/EditorAdapterDefinitionFactory';
import { EditorInstaller } from '../Editors/EditorInstaller';
import { FieldPresentationFactory } from '../FieldPresentations/FieldPresentationFactory';
import { FieldPresentationInstaller } from '../FieldPresentations/FieldPresentationInstaller';
import { FormPresentationFactory } from '../FormPresentations/FormPresentationFactory';
import { FormPresentationInstaller } from '../FormPresentations/FormPresentationInstaller';
import { IAriaService } from '../Interfaces/AriaService';
import { IDispatcherService } from '../Interfaces/Dispatchers';
import { IEditorAdapterDefinitionFactory } from '../Interfaces/EditorAdapterDefinitions';
import { IEditorInstaller } from '../Interfaces/EditorInstaller';
import { IFieldPresentation, IFieldPresentationInstaller } from '../Interfaces/FieldPresentations';
import { IFormPresentation, IFormPresentationInstaller } from '../Interfaces/FormPresentations';
import { IIssuesFoundFormatterService } from '../Interfaces/IssuesFoundFormatterService';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IPresentationFactory } from '../Interfaces/Presentations_common';
import { ElementRole } from '../Interfaces/Types';
import { DomLoggingFacade } from '../Utilities/DomLoggingFacade';
import { IssuesFoundFormatterService } from './IssuesFoundFormatterService';
/**
 * @inheritdoc jivs-dom/Types/IJivsDomServices
 */
export class JivsDomServices extends ServiceWithAccessorBase
    implements IJivsDomServices
{ 

    /**
     * Gets the installer responsible for setting up one Editor widget.
     * You can use it directly:
     * ```ts
     * services.editorInstaller.install(valueHost, element);
     * ```
     * You can use the FormInstaller run this for you against all editor widgets within a form.
     */
    public get editorInstaller(): IEditorInstaller
    {
        if (!this._editorInstaller) {
            this._editorInstaller = this.createDefaultEditorInstaller();
        }
        return this._editorInstaller;
    }
    public set editorInstaller(value: IEditorInstaller)
    {
        this._editorInstaller = value;
    }
    protected createDefaultEditorInstaller(): IEditorInstaller
    {
        return new EditorInstaller(this);
    }
    private _editorInstaller: IEditorInstaller | undefined = undefined;

    /**
     * Gets the installer responsible for setting up field presentations on one element.
     * 
     * You can use it directly:
     * ```ts
     * services.fieldPresentationInstaller.install(valueHost, element, ElementRole.rolename);
     * ```
     * Consumed by the FormInstaller to create field presentations.
     */
    public get fieldPresentationInstaller(): IFieldPresentationInstaller
    {
        if (!this._fieldPresentationInstaller) {
            this._fieldPresentationInstaller = this.createDefaultFieldPresentationInstaller();
        }
        return this._fieldPresentationInstaller;
    }
    public set fieldPresentationInstaller(value: IFieldPresentationInstaller)
    {
        this._fieldPresentationInstaller = value;
    }
    protected createDefaultFieldPresentationInstaller(): IFieldPresentationInstaller
    {
        return new FieldPresentationInstaller(this);
    }
    private _fieldPresentationInstaller: IFieldPresentationInstaller | undefined = undefined;

    /**
     * Gets the installer responsible for setting up form presentations on one element.
     * 
     * You can use it directly:
     * ```ts
     * services.formPresentationInstaller.install(valueHost, element, ElementRole.rolename);
     * ```
     * Consumed by the FormInstaller to create form presentations.
     */
    public get formPresentationInstaller(): IFormPresentationInstaller
    {
        if (!this._formPresentationInstaller) {
            this._formPresentationInstaller = this.createDefaultFormPresentationInstaller();
        }
        return this._formPresentationInstaller;
    }
    public set formPresentationInstaller(value: IFormPresentationInstaller)
    {
        this._formPresentationInstaller = value;
    }
    protected createDefaultFormPresentationInstaller(): IFormPresentationInstaller
    {
        return new FormPresentationInstaller(this);
    }
    private _formPresentationInstaller: IFormPresentationInstaller | undefined = undefined;

    /**
     * Gets the DOM dispatcher service responsible for handling DOM events 
     * and dispatching them to the appropriate handlers.
     * Use it to attach the ValueHostsManager callbacks.
     * ```ts
     * services.dispatchers.attach(config);
     * ```
     */
    public get dispatchers(): IDispatcherService
    {
        if (!this._dispatchers) {
            this._dispatchers = this.createDefaultDispatcherService();
        }
        return this._dispatchers;
    }
    public set dispatchers(value: IDispatcherService)
    {
        this._dispatchers = value;
    }
    protected createDefaultDispatcherService(): IDispatcherService
    {
        return new DispatcherService(this);
    }
    private _dispatchers: IDispatcherService | undefined = undefined;

    /**
     * Gets the ARIA service responsible for managing ARIA attributes and roles.
     * Set it to null to disable ARIA attribute and role management.
     */
    public get ariaService(): IAriaService | null
    {
        if (!this._ariaService) {
            this._ariaService = this.createDefaultAriaService();
        }
        return this._ariaService;
    }
    public set ariaService(value: IAriaService | null)
    {
        this._ariaService = value;
    }
    protected createDefaultAriaService(): IAriaService | null
    {
        // return new AriaService(this);
        throw new Error('ARIA service is not implemented.');
    }
    private _ariaService: IAriaService | null = null;

    /**
     * Gets the service responsible for creating either HTML or textual content
     * from ValidationState.IssuesFound. It can handle both field and form level,
     * using the summaryMessage for form level if supplied.
     * Built-in FieldPresentations and FormPresentations call upon this to get their 
     * error message content.
     */
    public get issuesFoundFormatterService(): IIssuesFoundFormatterService
    {
        if (!this._issuesFoundFormatterService) {
            this._issuesFoundFormatterService = this.createDefaultIssuesFoundFormatterService();
        }
        return this._issuesFoundFormatterService;
    }
    public set issuesFoundFormatterService(value: IIssuesFoundFormatterService)
    {
        this._issuesFoundFormatterService = value;
    }
    protected createDefaultIssuesFoundFormatterService(): IIssuesFoundFormatterService
    {
        return new IssuesFoundFormatterService(this);
    }
    private _issuesFoundFormatterService: IIssuesFoundFormatterService | undefined = undefined;

    /**
     * Provides a logging facade for all services that retain IJivsDomServices.
     * Generally do this:
     * ```ts
     * services.loggingFacade.log(LoggingLevel.Level, 
     *      facade => facade.prepareLogDetails('Message', element, valueHost, this, 'identity'));
     * ```
     */
    public get loggingFacade(): DomLoggingFacade
    {
        if (!this._loggingFacade) {
            this._loggingFacade = new DomLoggingFacade(this.services);
        }
        return this._loggingFacade;
    }
    private _loggingFacade: DomLoggingFacade | undefined = undefined;

    /**
     * Helper to align a ValueHostsManager with a specific form.
     * Returns an HTMLElement representing the container element such as the form
     * based on ValueHostsManager. ValueHostsManagerConfig.ContainerIdentifier
     * can be setup to specify a custom container element. If not setup, 
     * it will return document.body.
     * @param valueHostsManager 
     */
    public resolveContainerElement(valueHostsManager: IValueHostsManager): HTMLElement
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        const containerIdentifier = valueHostsManager.getContainerIdentifier();
        if (containerIdentifier) {
            const containerElement = document.querySelector(containerIdentifier);
            if (containerElement instanceof HTMLElement) {
                return containerElement;
            }
            this.loggingFacade.log(LoggingLevel.Warn, 
                facade => facade.prepareLogDetails(
                    `Container element not found for identifier: ${ containerIdentifier }`,
                    null, null, this, containerIdentifier));
        }
        return document.body;
    }

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
    public resolveFieldElement(root: HTMLElement | null, valueHost: IFieldValueHost,
        role: ElementRole | string, elementIdentifierTemplate?: string): HTMLElement | null
    {
        assertNotNull(valueHost, 'valueHost');
        if (!root) {
            root = this.resolveContainerElement(valueHost.valueHostsManager);
        }

        const elementIdentifier = valueHost.getElementIdentifier(elementIdentifierTemplate);
        const element = root.querySelector(elementIdentifier);
        if (!element) {
            this.loggingFacade.log(LoggingLevel.Warn, 
                facade => facade.prepareLogDetails(
                    `Field element not found for identifier: ${ elementIdentifier }`,
                    null, valueHost, this, elementIdentifier));
        }
        return element instanceof HTMLElement ? element : null;
    }
    
    /**
     * Gets the factory responsible for creating IEditorAdapterDefinitions.
     * Use it to register editor adapter definitions.
     * ```ts
     * services.editorAdapterDefinitionFactory.register(new MyAdapterDefinition());
     * ```
     * Consumed by the IEditorInstaller to create editor adapters.
     */
    public get editorAdapterDefinitionFactory(): IEditorAdapterDefinitionFactory
    {
        if (!this._editorAdapterDefinitionFactory) {
            this._editorAdapterDefinitionFactory = this.createEditorAdapterDefinitionFactory();
        }
        return this._editorAdapterDefinitionFactory;
    }
    public set editorAdapterDefinitionFactory(value: IEditorAdapterDefinitionFactory)
    {
        this._editorAdapterDefinitionFactory = value;
    }
    protected createEditorAdapterDefinitionFactory(): IEditorAdapterDefinitionFactory
    {
        return new EditorAdapterDefinitionFactory(this);
    }
    private _editorAdapterDefinitionFactory: IEditorAdapterDefinitionFactory | undefined = undefined;

    /**
     * Gets the factory responsible for creating IFieldPresentations.
     * Use it to register your presentations, mapping a name to a creator function.
     * ```ts
     * services.fieldPresentationFactory.register("myPresentation", () => new MyFieldPresentation());
     * ```
     * Consumed by the IFieldPresentationInstaller to create field presentations.
     */
    public get fieldPresentationFactory(): IPresentationFactory<IFieldPresentation>
    {
        if (!this._fieldPresentationFactory) {
            this._fieldPresentationFactory = this.createFieldPresentationFactory();
        }
        return this._fieldPresentationFactory;
    }
    private _fieldPresentationFactory: IPresentationFactory<IFieldPresentation> | undefined = undefined;

    protected createFieldPresentationFactory(): IPresentationFactory<IFieldPresentation>
    {
        return new FieldPresentationFactory(this);
    }

    /**
     * Gets the factory responsible for creating IFormPresentations.
     * Use it to register your form presentations, mapping a name to a creator function.
     * ```ts
     * services.formPresentationFactory.register("myFormPresentation", () => new MyFormPresentation());
     * ```
     * Consumed by the IFormPresentationInstaller to create form presentations.
     */
    public get formPresentationFactory(): IPresentationFactory<IFormPresentation>
    {
        if (!this._formPresentationFactory) {
            this._formPresentationFactory = this.createFormPresentationFactory();
        }
        return this._formPresentationFactory;
    }
    private _formPresentationFactory: IPresentationFactory<IFormPresentation> | undefined = undefined;

    protected createFormPresentationFactory(): IPresentationFactory<IFormPresentation>
    {
        return new FormPresentationFactory(this);
    }

}