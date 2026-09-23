/**
 * Provides the interfaces around Field Presentations.
 * Field Presentations are responsible for translating the validation state of a field 
 * into visual changes on the associated DOM element.
 * They are installed onto elements and can retain presentation-specific state.
 * 
 * - onValueHostValidationStateChanged -> IFieldValidationDispatcher -> IFieldPresentation -> elements changed
 * 
 * @module jivs-dom/Types/FieldPresentations
 */


import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { ValueHostValidationState } from "@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase";
import { IJivsDomElement } from "./IJivsDomElement";
import { ElementRole } from './Types';
import { IDomAriaStaticElementUpdater, IDomAriaValidationStateElementUpdater } from './AriaUpdaters';

/**
 * A field presentation translates one field’s current validation state into changes to one widget. 
 * Each installed presentation is an element-bound object that may retain presentation-specific state.
 * 
 * Instances are registered with the field presentation registry, along with a name that 
 * is used for lookup purposes.
 * 
 * The Field Presentation should make any HTML edits to the element it is bound to, or those 
 * it has control over. 
 * However, "Presentation" should not address ARIA attributes directly; 
 * those are managed separately through the ARIA element updaters
 * that IFieldPresentation can optionally supply if there is a specific HTML element that
 * needs those attributes other than the element it is bound to.
 * 
 * IFieldPresentationInstaller is responsible for installing field presentations onto elements, 
 * by creating the instance, calling its init(), and assigning it to IJivsDomElement.jivsFieldPresentation.
 * 
 * The FieldValidationDispatcher identifies which elements have this installed
 * and calls the apply() method on the installed field presentation to update 
 * the element's presentation based on the current validation state.
 */
export interface IFieldPresentation
{
    /**
     * Gives the presentation an opportunity to perform any necessary initialization.
     * It may install elements or attributes that are expected to be ready for 
     * use by the apply() method to adjust the presentation based on the validation state.
     * 
     * For example, a Field Error Display might create its internal elements that surround 
     * the error messages it will display.
     */
    init(): void;

    /**
     * Apply the current validation state to the field presentation.
     * Make HTML adjustments based on the current validation state including classes, attributes, and content.
     * It must be able to handle "valid" and "invalid" states, effectively reversing 
     * any previous presentation adjustments when the state changes.
     * 
     * This method is typically invoked by the FieldValidationDispatcher when the validation state of the field changes.
     * 
     * Its parameters mimic those on the ValueHostsManager.onValueHostValueChanged callback as this
     * is the target of that callback.
     * 
     * @param valueHost 
     * @param state 
     */
    apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void;

    /**
     * Allows a presentation whose generated HTML requires specialized accessibility behavior 
     * to supply its own Static ARIA Element Updater. An omitted getter and a getter returning null 
     * both mean that the presentation supplies no specialized updater of that kind. 
     * The presentation itself does not mutate ARIA attributes through these getters.
     */
    getStaticAriaElementUpdater(): IDomAriaStaticElementUpdater | null;

    /**
     * Allows a presentation whose generated HTML requires specialized accessibility behavior 
     * to supply its own Validation State ARIA Element Updater. An omitted getter and a getter returning null 
     * both mean that the presentation supplies no specialized updater of that kind. 
     * The presentation itself does not mutate ARIA attributes through these getters.
     */
    getValidationStateAriaElementUpdater(): IDomAriaValidationStateElementUpdater | null;
}

/**
 * Creator function used by FieldPresentationFactory to create instances of field presentations.
 */
export type FieldPresentationCreator = (element: IJivsDomElement) => IFieldPresentation;

/**
 * Factory that registers and creates IFieldPresentation instances.
 * Every registration connects a Presentation Name to an instance.
 * The same instance can be registered under multiple presentation names.
 * That name is used in lookups, either as an option parameter, or from a supplied default presentation name.
 * 
 * The factory is only used during the initialization phase.
 */
export interface IFieldPresentationFactory
{
    /**
     * Registers a new field presentation under the specified name.
     * It will replace any existing registration under the same name.
     * @param presentationName The name of the presentation to register.
     * @param creator The creator function that will be used to create instances of the presentation.
     */
    register(presentationName: string, creator: FieldPresentationCreator): void;

    /**
     * Associates a role with the presentation name used when create() receives no explicit name. 
     * For editors, IEditorInstaller first considers EditorInstallOptions.presentationName, 
     * then IDomEditorAdapterDefinition.defaultFieldPresentationName. 
     * Only when neither supplies a value does it pass undefined, 
     * allowing the factory to use the default registered for ElementRole.editor.
     * @param role 
     * @param presentationName 
     */
    setDefaultPresentationName(role: ElementRole | string, presentationName: string): void;

    /**
     * Creates an instance of a field presentation for the specified element and role.
     * If a presentation name is provided, it will be used; 
     * otherwise, the default presentation for the role will be used.
     * @param element The DOM element for which to create the field presentation.
     * @param role The role of the element for which to create the field presentation.
     * @param presentationName - The name of the presentation to use. 
     * If not provided, the default for the role will be used.
     * @returns An instance of the requested field presentation. It allows modification, especially 
     * to set its own properties and behavior. It can retain other data but should not
     * retain references to the element or Jivs objects.
     */
    create(element: IJivsDomElement,role: ElementRole | string,presentationName?: string): IFieldPresentation;
}

/**
 * Handles installation of IFieldPresentations to a specific element.
 * It uses the role and valueHost to determine how to install the field presentation.
 * ValueHost's field name from getElementIdentifier() and data type from getDataType() are often
 * used to resolve the appropriate field presentation for the element.
 * IJivsDomServices owns the sole instance of IFieldPresentationInstaller.
 */
export interface IFieldPresentationInstaller
{
    /**
     * Installs a field presentation for the specified element and role using the provided value host and options.
     * @param valueHost The host providing the field value.
     * @param element The DOM element for which the field presentation is being installed.
     * @param role The role of the field presentation.
     * @param options Optional installation options.
     */
    install(valueHost: IFieldValueHost, element: IJivsDomElement, role: ElementRole | string,
        options?: FieldPresentationInstallOptions): IFieldPresentation | null;
}

/**
 * Options for installing a field presentation, including the presentation name and ARIA updaters.
 */
export interface FieldPresentationInstallOptions
{
    /**
     * The name of the presentation to be installed. 
     * If not specified, the default presentation for the role will be used.
     */
    presentationName?: string | null;

    /**
     * The static ARIA updater to be used for the field presentation. 
     * If not specified, a default static ARIA updater will be used.
     */
    staticAriaUpdater?: IDomAriaStaticElementUpdater | null;

    /**
     * The validation state ARIA updater to be used for the field presentation.
     * If not specified, a default validation state ARIA updater will be used.
     */
    validationStateAriaUpdater?: IDomAriaValidationStateElementUpdater | null;
}
