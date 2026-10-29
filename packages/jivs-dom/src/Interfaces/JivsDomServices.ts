/**
 * Exposes various services specific to jivs-dom, including dispatchers, 
 * editor and presentation installers, and ARIA support.
 * One instance of this service container is expected to be installed into the IJivsServices instance.
 * 
 * @module jivs-dom/Types/JivsDomServices
 */

import { DomLoggingFacade } from '../Utilities/DomLoggingFacade';
import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IService, IServicesAccessor } from "@plblum/jivs-engine/build/Interfaces/Services";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { IJivsServices } from "@plblum/jivs-engine/build/Interfaces/JivsServices";
import { IAriaService } from './AriaService';
import { IDispatcherService } from './Dispatchers';
import { IEditorInstaller } from './EditorInstaller';
import { IFieldPresentation, IFieldPresentationInstaller } from './FieldPresentations';
import { IFormPresentation, IFormPresentationInstaller } from './FormPresentations';
import { IIssuesFoundFormatterService } from './IssuesFoundFormatterService';
import { ElementRole } from './Types';
import { IEditorAdapterDefinitionFactory } from './EditorAdapterDefinitions';
import { IPresentationFactory } from './Presentations_common';
import { IElementRegistry } from './ElementRegistry';
import { IPopupMechanism, IPopupService } from './PopupErrorMessageDisplays';
import type { PopupErrorMessageDisplayPresentationGlobalOptions } from '../FieldPresentations/PopupErrorMessageDisplayPresentation';
import type { InlineErrorMessageDisplayPresentationGlobalOptions } from '../FieldPresentations/InlineErrorMessageDisplayPresentation';
import { EditorFieldPresentationBaseGlobalOptions } from '../FieldPresentations/EditorFieldPresentationBase';
import { RequiredIndicatorPresentationGlobalOptions } from '../FieldPresentations/RequiredIndicatorPresentation';
import { FieldContainerPresentationGlobalOptions } from '../FieldPresentations/FieldContainerPresentation';
import { LabelPresentationGlobalOptions } from '../FieldPresentations/LabelPresentation';
import { WrappedEditorFieldPresentationBaseGlobalOptions } from '../FieldPresentations/WrappedEditorFieldPresentationBase';
import { RadioButtonsFieldPresentationGlobalOptions } from '../FieldPresentations/RadioButtonsPresentation';
import { MessageFrameGlobalOptions } from '../Presentations_common/MessageFrame';
import { TemplatedMessageFrameGlobalOptions } from '../Presentations_common/TemplatedMessageFrame';
import { HeaderFooterMessageFrameGlobalOptions } from '../Presentations_common/HeaderFooterMessageFrame';
import { IconMessageFrameGlobalOptions } from '../Presentations_common/IconMessageFrame';
import { ColumnarErrorIndicatorContentGlobalOptions } from '../FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent';
import { ValidationSummaryPresentationGlobalOptions, ValidationSummaryPresentationOptions } from '../FormPresentations/ValidationSummaryPresentation';


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
     * Override services: IServices.
     */
    services: IJivsServices;

    /**
     * Global options for the Jivs DOM services.
     * These options provide default configurations for presentations, message frames,
     * and error indicator containers, which can be overridden by instance-specific values.
     */
    options: JivsDomGlobalOptions;

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
     * Gets the DOM dispatcher service responsible for handling DOM events 
     * and dispatching them to the appropriate handlers.
     * Use it to attach the ValueHostsManager callbacks.
     * ```ts
     * services.dispatchers.attach(config);
     * ```
     */
    dispatchers: IDispatcherService;

    /**
     * Gets the ARIA service responsible for managing ARIA attributes and roles.
     * Set it to null to disable ARIA attribute and role management.
     */
    ariaService: IAriaService | null;

    /**
     * Gets the service responsible for creating either HTML or textual content
     * from ValidationState.IssuesFound. It can handle both field and form level,
     * using the summaryMessage for form level if supplied.
     * Built-in FieldPresentations and FormPresentations call upon this to get their 
     * error message content.
     */
    issuesFoundFormatterService: IIssuesFoundFormatterService;

    /**
     * Gets the popup mechanism responsible for displaying popup error messages.
     * Implementations are usually connected to a specific popup library or
     * approach of using native DOM elements and custom logic to display popups.
     * It is optional and may not be configured in all environments.
     * Typically, it is a singleton set up during app initialization.
     */
    popupMechanism: IPopupMechanism | null;

    /**
     * Provides a logging facade for all services that retain IJivsDomServices.
     * Generally do this:
     * ```ts
     * services.loggingFacade.log(LoggingLevel.Level, 
     *      facade => facade.prepareLogDetails('Message', element, valueHost, this, 'identity'));
     * ```
     */
    loggingFacade: DomLoggingFacade;

    /**
     * Helper to align a ValueHostsManager with a specific form.
     * Returns an HTMLElement representing the container element such as the form
     * based on ValueHostsManager. ValueHostsManagerConfig.ContainerIdentifier
     * can be setup to specify a custom container element. If not setup, 
     * it will return document.body.
     * @param valueHostsManager 
     */
    resolveContainerElement(valueHostsManager: IValueHostsManager): HTMLElement;

    /**
     * Helper to resolve the field element based on the FieldValueHost and role.
     * 
     * Returns an array of HTML elements representing the resolved field elements, or empty array if none are found.
     * 
     * @param valueHost The field value host associated with the field element. 
     * It specifies which field element to resolve within the root element.
     * @param role The role of the element, either as an ElementRole or a string.
     * @returns An array of HTML elements representing the resolved field elements, or empty array if none are found.
     */
    resolveFieldElement(valueHost: IFieldValueHost, role: ElementRole | string): HTMLElement[];
    
    /**
     * Retrieves the element registry associated with the specified ValueHostsManager instance.
     * ValueHostsManager retains it in metadata under the key 'elementRegistry'.
     * If not there, this function must create it and store it under the same key.
     * @param valueHostsManager The ValueHostsManager instance for which to retrieve the element registry.
     */
    getElementRegistry(valueHostsManager: IValueHostsManager): IElementRegistry;

    /**
     * Retrieves the popup service associated with the specified ValueHostsManager instance.
     * Use to close all open popups.
     * @param valueHostsManager The ValueHostsManager instance for which to retrieve the popup service.
     */
    getPopupService(valueHostsManager: IValueHostsManager): IPopupService;

    /**
     * The Install Counter keeps track of invocations of FormInstaller, and its value is assigned
     * to the IJivsElement.jivsInstallCounter property each time the editor is installed.
     * It allows FormInstaller and Readers to know which elements were replaced during installation 
     * that occurs due to replacement of elements. Its intended to ensure that Readers can skip updating
     * values on editors that didn't get replaced.
     * Gets the current value of the 'installCounter' metadata element.
     * If not available, it gets assigned to 1.
     * @param valueHostsManager The ValueHostsManager instance for which to retrieve the installer counter.
     */
    getInstallCounter(valueHostsManager: IValueHostsManager): number;

    /**
     * Increments the Install Counter for the specified ValueHostsManager instance in 'installCounter' metadata.
     * If not available, it gets initialized to 1, without incrementing.
     * @param valueHostsManager The ValueHostsManager instance for which to increment the installer counter.
     */
    incrementInstallCounter(valueHostsManager: IValueHostsManager): void;
    
    /**
     * Gets the factory responsible for creating IEditorAdapterDefinitions.
     * Use it to register editor adapter definitions.
     * ```ts
     * services.editorAdapterDefinitionFactory.register(new MyAdapterDefinition());
     * ```
     * Consumed by the IEditorInstaller to create editor adapters.
     */
    editorAdapterDefinitionFactory: IEditorAdapterDefinitionFactory;

    /**
     * Gets the factory responsible for creating IFieldPresentations.
     * Use it to register your presentations, mapping a name to a creator function.
     * ```ts
     * services.fieldPresentationFactory.register("myPresentation", () => new MyFieldPresentation());
     * ```
     * Consumed by the IFieldPresentationInstaller to create field presentations.
     */
    fieldPresentationFactory: IPresentationFactory<IFieldPresentation>;

    /**
     * Gets the factory responsible for creating IFormPresentations.
     * Use it to register your form presentations, mapping a name to a creator function.
     * ```ts
     * services.formPresentationFactory.register("myFormPresentation", () => new MyFormPresentation());
     * ```
     * Consumed by the IFormPresentationInstaller to create form presentations.
     */
    formPresentationFactory: IPresentationFactory<IFormPresentation>;
}

/**
 * Extends the IJivsServices interface to include domServices, 
 * providing access to the DOM-related services within the Jivs framework.
 * However, it only works at runtime after calling JivsDomServicesInstaller()
 * where the service is actually installed and made available.
 */
declare module "@plblum/jivs-engine/build/Interfaces/JivsServices"
{
    export interface IJivsServices
    {
        domServices: IJivsDomServices;
    }
}

/**
 * Global options for the Jivs DOM services.
 * Presentations, MessageFrames, and ErrorIndicatorContainers
 * support global configuration through these options.
 * Those will allow instance specific values to override the global options.
 */
export interface JivsDomGlobalOptions
{
    inlineErrorMessageDisplay: InlineErrorMessageDisplayPresentationGlobalOptions,
    popupErrorMessageDisplay: PopupErrorMessageDisplayPresentationGlobalOptions,
    editor: EditorFieldPresentationBaseGlobalOptions,  
    radioButtons: RadioButtonsFieldPresentationGlobalOptions,
    wrappedEditor: WrappedEditorFieldPresentationBaseGlobalOptions,
    label: LabelPresentationGlobalOptions,
    requiredIndicator: RequiredIndicatorPresentationGlobalOptions
    fieldContainer: FieldContainerPresentationGlobalOptions
    messageFrame: MessageFrameGlobalOptions,
    templatedMessageFrame: TemplatedMessageFrameGlobalOptions,
    headerFooterMessageFrame: HeaderFooterMessageFrameGlobalOptions,
    iconMessageFrame: IconMessageFrameGlobalOptions,
    columnarErrorIndicatorContent: ColumnarErrorIndicatorContentGlobalOptions,
    validationSummary: ValidationSummaryPresentationGlobalOptions,
    validationBehaviors: ValidationBehaviors
    
    // when adding here, also add to initJivsDomGlobalOptions() below
}
export function initJivsDomGlobalOptions(): JivsDomGlobalOptions
{
    return <JivsDomGlobalOptions>{
        inlineErrorMessageDisplay: {},
        popupErrorMessageDisplay: {},
        editor: {},
        radioButtons: {},
        wrappedEditor: {},
        label: {},
        requiredIndicator: {},
        fieldContainer: {},
        messageFrame: {},
        templatedMessageFrame: {},
        headerFooterMessageFrame: {},
        iconMessageFrame: {},
        columnarErrorIndicatorContent: {},
        validationSummary: {},
        validationBehaviors: {}
    };
}

/**
 * Options for controlling validation behaviors, such as setting up some options
 * passed into FieldValueHost.validate().
 */
export interface ValidationBehaviors
{
    /**
     * Indicates whether validation should occur during editing of the field,
     * such as when the user is typing in the field.
     * This is associated with the FieldValueHost.validate({ duringEdit: true }) option.
     * It only impacts validators that support the feature.
     */
    duringEdit?: boolean;
}