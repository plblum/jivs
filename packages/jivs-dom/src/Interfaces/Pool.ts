// Currently pools together all interfaces from the implementation spec.
// These all will be redistributed into other files and pool.ts will be discarded

import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { ValueHostValidationState } from "@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase";
import { IValueHostsManager, ValueHostsManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { ValidationState, IssueFound } from "@plblum/jivs-engine/build/Interfaces/Validation";
import { IService, IServicesAccessor } from "@plblum/jivs-engine/build/Interfaces/Services";

enum ElementRole
{
    editor = 'editor',  // editor widget
    error = 'error',    // Field Error Display widget
    ariaError = 'aria-error',   // alternative aria specific host for error message reading
    label = 'label',        // the field label widget
    required = 'required',  // required indicator widget
    container = 'container',    // container element for the editor that is specific to its field

    summary = 'summary',    // validation summary widget
    submit = 'submit',      // form submission widget
}


/**
 * Augments an ordinary HTMLElement with the Jivs behavior installed for that element.
 * Properties are set by the installation process.
 */
interface IJivsDomElement extends HTMLElement
{
    /**
     * Describes the requirements for a specific editor widget upon installation.
     * The installed definition is shared and immutable. 
     * It describes the widget behavior but does not contain state belonging to this element.
     * Two states:
     * - Installed: The definition has been successfully installed on the element.
     * - Uninstalled: The value is undefined
     */
    jivsEditorAdapterDefinition?: IDomEditorAdapterDefinition;

    /**
     * Handles onTextValueChange events specific to this editor. Its value is created from the IDomEditorAdapterDefinition.
     * The ITextValueDispatcher routes text value changes to this adapter.
     * Three states determined by the installation process.:
     * - Installed: The adapter has been successfully installed on the element.
     * - Uninstalled: undefined.
     * - Not used: null. 
     */
    jivsTextValueAdapter?: IDomTextValueAdapter | null;

    /**
     * Handles onValueChange events specific to this editor. Its value is created from the IDomEditorAdapterDefinition.
     * The IValueDispatcher routes native value changes to this adapter.
     * Three states determined by the installation process:
     * - Installed: The adapter has been successfully installed on the element.
     * - Uninstalled: undefined.
     * - Not used: null. 

     */
    jivsValueAdapter?: IDomValueAdapter | null;

    /**
     * Handles the onValidationStateChanged callback to provide visual feedback for the validation state of the field.
     * It is installed by IEditorInstaller and IFieldPresentationInstaller.
     * The FieldValidationDispatcher routes to it.
     * Three states determined by the installation process:
     * - Installed: The field presentation has been successfully installed on the element.
     * - Uninstalled: undefined.
     * - Not used: null. 
     */
    jivsFieldPresentation?: IFieldPresentation | null;

    /**
     * AriaService's own updater for the validation state of the element.
     */
    jivsAriaValidationStateUpdater?: IDomAriaValidationStateElementUpdater | null;

    /**
     * Handles the presentation of the form containing this element.
     * Three states determined by the installation process:
     * - Installed: The form presentation has been successfully installed on the element.
     * - Uninstalled: undefined.
     * - Not used: null. 
     */
    jivsFormPresentation?: IFormPresentation | null;

    /**
     * Allows a form element to be dedicated to a specific validation group.
     * When assigned and not '','*', or null, the IFormPresentation should check this upon
     * being called by the dispatcher. It will be supplied with the validation group in the ValidationState.group property.
     * Use jivs-engine's matchGroups() utility to determine if the element belongs to the specified validation group.
     */
    jivsFormPresentationGroup?: string;
}

/**
 * Provides text value read/write capabilities for a specific editor widget.
 * Determined by IDomEditorAdapterDefinition, which only creates this if
 * the editor supports text value read/write operations.
 */
interface IDomTextValueAdapter
{
    /**
     * Reads the current text value from the widget. Returns undefined if no value is present.
     * Used by change event handlers from the editor to determine the current value of the widget
     * before passing it along to IFieldValueHost.setTextValue().
     */
    readTextValue(): string | undefined;

    /**
     * Writes the specified text value to the widget in an editor specific way.
     * Used as part of the onTextValueChanged callback process.
     * @param textValue The text value to be written to the widget. 
     * Can be undefined to indicate there is no value available.
     * The Adapter determines what to do with undefined values.
     */
    writeTextValue(textValue: string | undefined): void;
}

/**
 * Provides native value read/write capabilities for a specific widget.
 * Determined by IDomEditorAdapterDefinition, which only creates this if
 * the editor supports native value read/write operations.
 * It is less used than IDomTextValueAdapter because most widgets primarily deal with text values 
 * rather than native values. As a result, only create it if the widget truly requires native value handling.
 */
interface IDomValueAdapter
{
    /**
     * Reads the current native value from the widget. Returns undefined if no value is present.
     * Used by change event handlers from the editor to determine the current value of the widget
     * before passing it along to IFieldValueHost.setValue().
     */
    readValue(): unknown;

    /**
     * Writes the specified native value to the widget in an editor specific way.
     * @param value The native value to be written to the widget. 
     * Can be undefined to indicate there is no value available.
     * The Adapter determines what to do with undefined values.
     */
    writeValue(value: unknown): void;
}

/**
 * An Editor Adapter Definition keeps the behaviors for one widget model together.
 * Without this coordinating type, widget recognition, installation-anchor selection, 
 * Jivs-to-DOM value transfer, and DOM-to-Jivs event handling could be implemented 
 * independently and disagree about how the editor represents its value.
 * 
 * A definition is responsible for:
 *  - recognizing fields and elements that use its widget model;
 *  - resolving the element that serves as the installation anchor;
 *  - directly constructing the anchor’s Text Value and Native Value adapters;
 *  - attaching DOM event handlers that send edited values to the IFieldValueHost;
 *  - identifying the default field presentation associated with the widget, when applicable;
 *  - optionally supplying specialized static and validation-state ARIA updaters for the widget.
 * 
 * Every implementation gets assigned a unique adapterKey and a priority when registered
 * with the IJivsDomService's factory to determine its order of consideration among multiple adapter definitions.
 * 
 * During installation by EditorInstaller, the matching instance registered with the IJivsDomService's factory
 * is selected and retained with the IJivsDomElement.jivsEditorAdapterDefinition property,
 * and its members create the adapters, presentations, and aria updaters for the widget.
 */
interface IDomEditorAdapterDefinition
{
    /**
     * The unique key that identifies this adapter definition.
     */
    readonly adapterKey: string;
    /**
     * The priority of this adapter definition, used to determine its order of consideration 
     * among multiple adapter definitions.
     * Lower numbers indicate higher priority. Recommended range: 0 to 100, where 0 is the highest priority.
     */
    readonly priority: number;

    /**
     * The presentation name recommended for this widget's default field presentation.
     * It must have an associated IFieldPresentation registered with the IJivsDomService's factory.
     */
    readonly defaultFieldPresentationName?: string | null;

    /**
     * Used when searching the registry for a matching adapter definition.
     * Uses characteristics found on its parameters to match.
     * @param valueHost - Supplies the field name from getElementIdentifier() and its data type
     * from its getDataType().
     * @param element The DOM element to check against. Often used to match the tag, classes, and attributes.
     * For example, an InputHtmlElement can be matched by its tag name and type attribute.
     * @returns True if the adapter definition matches the given value host and element; otherwise, false.
     */
    matches(valueHost: IFieldValueHost, element: HTMLElement): boolean;

    /**
     * The element supplied to IEditorInstaller.install() identifies the editor encountered by the caller. 
     * The selected definition determines which element stores the completed installation and 
     * its installed capabilities.
     *
     * resolveInstallationAnchor() returns that element.
     * 
     * For ordinary editors, the supplied element is also the installation anchor.
     *
     * A composite editor may use several DOM elements for one logical value. 
     * Its definition can override resolveInstallationAnchor() so calls involving those elements converge on one anchor. 
     * A group of radio buttons, input type='radio' name='groupname', would have multiple input elements 
     * but a single installation anchor representing the group.
     * 
     * @param valueHost The field value host associated with the installation.
     * @param element The DOM element representing the editor encountered by the caller.
     * @returns The DOM element that serves as the installation anchor for this adapter definition.
     */
    resolveInstallationAnchor(valueHost: IFieldValueHost, element: IJivsDomElement): IJivsDomElement;

    /**
     * Creates a suitable IDomTextValueAdapter for the given value host and installation anchor.
     * @param valueHost The field value host associated with the installation.
     * @param anchor The DOM element serving as the installation anchor.
     * @returns A suitable IDomTextValueAdapter instance, or null if none can be created.
     * This method may return null if no suitable adapter can be created for the given value host and anchor.
     */
    createTextValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IDomTextValueAdapter | null;

    /**
     * Creates a suitable IDomValueAdapter for the given value host and installation anchor.
     * @param valueHost The field value host associated with the installation.
     * @param anchor The DOM element serving as the installation anchor.
     * @returns A suitable IDomValueAdapter instance, or null if none can be created.
     */
    createValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IDomValueAdapter | null;

    /**
     * Gets the static ARIA element updater associated with this adapter definition, if any.
     * The static ARIA element updater is responsible for managing ARIA attributes on the associated DOM element
     * without regard to validation state. Its run once, during installation of the editor.
     * This instance is considered immutable.
     * @returns An IDomAriaStaticElementUpdater instance, or null if none is available.
     */
    getStaticAriaElementUpdater?(): IDomAriaStaticElementUpdater | null;

    /**
     * Gets the validation state ARIA element updater associated with this adapter definition, if any.
     * The validation state ARIA element updater is responsible for managing ARIA attributes 
     * on the associated DOM element
     * based on the validation state of the editor.
     * This instance is considered immutable.
     * @returns An IDomAriaValidationStateElementUpdater instance, or null if none is available.
     */
    getValidationStateAriaElementUpdater?(): IDomAriaValidationStateElementUpdater | null;

    /**
     * The EditorInstaller uses this method to attach the editor to the send values mechanism
     * such as an onchange event handler.
     * EditorInstaller must ensure it can only be run once during the lifecycle of the editor
     * to avoid multiple attachments of the same editor to the send values mechanism.
     * @param valueHost The field value host associated with the installation.
     * @param anchor The DOM element serving as the installation anchor.
     * @param options The options for installing the editor.
     */
    attachToSendValues(valueHost: IFieldValueHost, anchor: IJivsDomElement, options: EditorInstallOptions): void;
}

/**
 * Registers and selects editor adapter definitions as part of running 
 * the IEditorInstaller.
 * IJivsDomService.editorAdapterFactory retains the sole instance.
 */
interface IDomEditorAdapterDefinitionFactory
{
    register(
        definition: IDomEditorAdapterDefinition
    ): void;

    getDefinition(
        adapterKey: string
    ): IDomEditorAdapterDefinition | null;

    findDefinition(
        valueHost: IFieldValueHost,
        element: HTMLElement
    ): IDomEditorAdapterDefinition | null;
}

/**
 * The EditorInstaller coordinates the following operations for one supplied element and IFieldValueHost:
 * - one adapter definition must be selected;
 * - one installation anchor must be resolved;
 * - the definition’s Text Value and Native Value capabilities must be examined;
 * - its DOM-to-Jivs event handlers must be attached;
 * - its field presentation and ARIA behavior must be installed independently;
 * - the completed installation must be recorded on the anchor element.
 * 
 * It should be used both initially and after the form's elements have been replaced.
 * The FormInstaller is a solution that knows how to find the editor elements and call this installer for each of them.
 */
interface IEditorInstaller
{
    /**
     * Installs the editor for the specified element and field value host.
     * Must ensure calling it multiple times does not result in multiple installations of the same editor.
     * Only the first call will take any actions.
     * 
     * @param valueHost The field value host associated with the installation.
     * @param element The DOM element serving as the installation anchor.
     * @param options The options for installing the editor.
     */
    install(valueHost: IFieldValueHost, element: IJivsDomElement, options?: EditorInstallOptions): void;
}

/**
 * The options for installing an editor through IEditorInstaller.install().
 */
interface EditorInstallOptions
{
    /**
     * Supply a specific adapter key to directly use a particular Editor Adapter Definition 
     * instead of searching the registry.
     */
    adapterKey?: string | null;
    /**
     * Supply a specific presentation name to directly use a particular field presentation 
     * instead of relying on default found on the Editor Adapter Definition.
     */
    presentationName?: string | null;
    /**
     * Lets the installer know that the user will accept validation during the editing process.
     * If the widget supports that, attachToSendValues() is expected to wire up 
     * the necessary event handlers to handle validation during editing.
     * For example, input tags support oninput events for this purpose.
     * It can be ignored if the editor does not support validation during editing.
     */
    duringEdit?: boolean;
}

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
 * by creating the instance and assign it to IJivsDomElement.jivsFieldPresentation.
 * 
 * The FieldValidationDispatcher identifies which elements have this installed
 * and calls the apply() method on the installed field presentation to update 
 * the element's presentation based on the current validation state.
 */
interface IFieldPresentation
{
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
interface IFieldPresentationFactory
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
interface IFieldPresentationInstaller
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
interface FieldPresentationInstallOptions
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
interface IFormPresentation
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
interface IFormPresentationFactory
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

interface IFormPresentationInstaller
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
interface FormPresentationInstallOptions
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
/**
 * This service provides reusable formatting of IssueFound objects.
 * The service produces either prepared HTML for DOM presentations or 
 * plain text for consumers such as native browser tooltips and ARIA-only content.
 * 
 * Used by both FieldPresentations and FormPresentations when they need to display validation issues.
 */
interface IIssuesFoundFormatterService
{
    /**
     * Builds the HTML representation of the provided issues.
     * 
     * @param issues The list of issues to format.
     * @param useSummaryMessage Whether to use the summary message instead of individual issue messages.
     * Set to true when using this at the form level, such as within Validation Summary widgets.
     */
    buildAsHtml(issues: IssueFound[], useSummaryMessage?: boolean): string;

    /**
     * Builds the plain text representation of the provided issues.
     * 
     * @param issues The list of issues to format.
     * @param useSummaryMessage Whether to use the summary message instead of individual issue messages.
     * Set to true when using this at the form level, such as within Validation Summary widgets.
     * @param separator The separator to use between individual issue messages.
     * The implementation is expected to supply a default.
     */
    buildAsText(issues: IssueFound[], useSummaryMessage?: boolean, separator?: string): string;
}

/**
 * Service for managing ARIA attributes on DOM elements.
 * It allows registration of static and validation state updaters and applies them to elements as needed.
 * IJivsDomService.ariaService provides access to this service, but that property
 * can be null to disable using arias.
 */
interface IDomAriaService
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
interface IFieldAriaElementAnchors
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

/**
 * Updaters are responsible for applying ARIA attributes to DOM elements based on the field's state and role.
 * There are two forms:
 * - Static - Applies ARIA attributes that do not change based on the field's validation state.
 *   They are applied only while initializing the field's editor.
 * - Validation State - Applies ARIA attributes that reflect the field's current validation state.
 * 
 * All updaters are immutable.
 */

interface IDomAriaElementUpdaterBase
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
interface IDomAriaStaticElementUpdater extends IDomAriaElementUpdaterBase
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
interface IDomAriaValidationStateElementUpdater extends IDomAriaElementUpdaterBase
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

/**
 * Connected to ValueHostsManager.onTextValueChanged handler to route
 * the change to elements associated with the valueHost.
 * Its destination are IDomTextValueAdapters. 
 * Each element it finds must have its IJivsDomElement.jivsTextValueAdapter assigned
 * if it gets dispatched to.
 * 
 * The dispatcher has the job of knowing how to query DOM to find those elements,
 * usually by using data attributes or other identifying markers on the DOM elements
 * against the IFieldValueHost.getElementIdentifier().
 */
interface ITextValueDispatcher
{
    /**
     * Handles the onTextValueChanged callback directly, routing the change to
     * IDomTextValueAdapters. An element found must also have its 
     * IJivsDomElement.jivsTextValueAdapter assigned, and that adapter will be run.
     * @param valueHost 
     * @param oldTextValue 
     */
    dispatch(valueHost: IFieldValueHost, oldTextValue: string | undefined): void;
}

/**
 * Connected to ValueHostsManager.onValueChanged handler to route
 * the change to elements associated with the valueHost.
 * Its destination are IDomValueAdapters. 
 * Each element it finds must have its IJivsDomElement.jivsValueAdapter assigned
 * if it gets dispatched to.
 *
 * The dispatcher has the job of knowing how to query DOM to find those elements,
 * usually by using data attributes or other identifying markers on the DOM elements
 * against the IFieldValueHost.getElementIdentifier().
 */
interface IValueDispatcher
{
    /**
     * Handles the onValueChanged callback directly, routing the change to
     * IDomValueAdapters. An element found must also have its 
     * IJivsDomElement.jivsValueAdapter assigned, and that adapter will be run.
     * @param valueHost The host object containing the field's value.
     * @param oldValue The previous value of the field.
     */
    dispatch(valueHost: IFieldValueHost, oldValue: unknown): void;
}

/**
 * Connected to ValueHostsManager.onValueHostValidationStateChanged handler to route
 * the validation state change to elements associated with the valueHost.
 * Its destination are IFieldPresentation objects. 
 * Each element it finds must have its IJivsDomElement.jivsFieldPresentation assigned
 * if it gets dispatched to.
 * 
 * The dispatcher has the job of knowing how to query DOM to find those elements,
 * usually by using data attributes or other identifying markers on the DOM elements
 * against the IFieldValueHost.getElementIdentifier().
 */
interface IFieldValidationDispatcher
{
    /**
     * Handles the onValueHostValidationStateChanged callback directly, routing the change to
     * IFieldPresentation objects. An element found must also have its 
     * IJivsDomElement.jivsFieldPresentation assigned, and that adapter will be run.
     * @param valueHost The host object containing the field's value.
     * @param state The new validation state of the field.
     */
    dispatch(valueHost: IFieldValueHost, state: ValueHostValidationState): void;
}

/**
 * Connected to ValueHostsManager.onValidationStateChanged handler to route
 * the validation state change to the form as a whole.
 * Its destination are IFormPresentation objects.
 * Each element it finds must have its IJivsDomElement.jivsFormPresentation assigned
 * if it gets dispatched to.
 *
 * The dispatcher has the job of knowing how to query DOM to find the form element,
 * usually by using data attributes or other identifying markers on the DOM element
 * against the IValueHostsManager.getContainerIdentifier().
 */
interface IFormValidationDispatcher
{
    /**
     * Handles the onValidationStateChanged callback directly, routing the change to
     * IFormPresentation objects. An element found must also have its 
     * IJivsDomElement.jivsFormPresentation assigned, and that adapter will be run.
     * @param valueHostsManager The manager containing the form's validation state.
     * @param state The new validation state of the form.
     */
    dispatch(valueHostsManager: IValueHostsManager, state: ValidationState): void;
}
/**
 * A factory function type for creating dispatcher instances.
 * Used by IDomDispatcherService.
 * @template TDispatcher The type of dispatcher the factory will create.
 */
export type DispatcherCreator<TDispatcher> = (domServices: IJivsDomServices, options?: unknown) => TDispatcher;

/**
 * This service ensures that the correct dispatcher is attached to the appropriate DOM elements 
 * based on the configuration provided.
 * Handles registration, creation, and ValueHostsManager callback assignment of Dispatchers.
 * IJivsDomServices.dispatcherService holds the one instance of this service.
 */
interface IDomDispatcherService
{
    /**
     * Registers a factory function for creating text value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerTextValueChangedDispatcher(
        creator: DispatcherCreator<ITextValueDispatcher>): void;

    /**
     * Registers a factory function for creating value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerValueChangedDispatcher(
        creator: DispatcherCreator<IValueDispatcher>): void;

    /**
     * Registers a factory function for creating value host validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerValueHostValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFieldValidationDispatcher>): void;

    /**
     * Registers a factory function for creating form validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFormValidationDispatcher>): void;
    
    /**
     * Composite of using individual attach functions so you can have a one-call
     * solution to attachment. It always attaches onValidationState and onValueHostValidationState
     * because those are fundamental to the operation of the value hosts manager.
     * The decision of using onTextValueChanged and onValueChanged attachments is left to the caller.
     * Unlike the other attach functions, this does not offer an options parameter that is passed
     * through to the dispatcher. If that is needed, use the dispatcher-specific attach functions instead.
     */
    attach(config: ValueHostsManagerConfig, addTextValueChanged? : boolean, addValueChanged? : boolean): void;

    /**
     * Attaches a ITextValueDispatcher to ValueHostsManagerConfig.onTextValueChanged callback.
     * This allows the dispatcher to respond to text value changes in the value hosts managed by the configuration.
     * If onTextValueChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param config The configuration for the value hosts manager.
     * @param options Optional additional options for the dispatcher.
     * @returns The attached ITextValueDispatcher instance, or null if none could be attached.
     */
    attachTextValueChanged(config: ValueHostsManagerConfig, options?: unknown): ITextValueDispatcher | null;

    /**
     * Attaches a IValueDispatcher to ValueHostsManagerConfig.onValueChanged callback.
     * This allows the dispatcher to respond to value changes in the value hosts managed by the configuration.
     * If onValueChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param config The configuration for the value hosts manager.
     * @param options Optional additional options for the dispatcher.
     * @returns The attached IValueDispatcher instance, or null if none could be attached.
     */
    attachValueChanged(config: ValueHostsManagerConfig, options?: unknown): IValueDispatcher | null;

    /**
     * Attaches a IFieldValidationDispatcher to ValueHostsManagerConfig.onValueHostValidationStateChanged callback.
     * This allows the dispatcher to respond to value host validation state changes in the value hosts managed by the configuration.
     * If onValueHostValidationStateChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param config The configuration for the value hosts manager.
     * @param options Optional additional options for the dispatcher.
     * @returns The attached IFieldValidationDispatcher instance, or null if none could be attached.
     */
    attachValueHostValidationStateChanged(config: ValueHostsManagerConfig, options?: unknown): IFieldValidationDispatcher | null;

    /**
     * Attaches a IFormValidationDispatcher to ValueHostsManagerConfig.onValidationStateChanged callback.
     * This allows the dispatcher to respond to form validation state changes in the value hosts managed by the configuration.
     * If onValidationStateChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param config The configuration for the value hosts manager.
     * @param options Optional additional options for the dispatcher.
     * @returns The attached IFormValidationDispatcher instance, or null if none could be attached.
     */
    attachValidationStateChanged(config: ValueHostsManagerConfig, options?: unknown): IFormValidationDispatcher | null;
}

/**
 * Creating an IValueHostsManager establishes the Jivs fields and their validation state. 
 * It does not locate DOM elements, connect editors to those fields, install validation presentations, 
 * or synchronize the DOM with validation state that may already exist.
 * 
 * Form installation bridges that gap.
 * 
 * The application calls one public install() operation after creating the manager. 
 * A concrete form installer identifies the field and form elements represented by its markup,
 * then calls either the IEditorInstaller, IFieldPresentationInstaller, or 
 * IFormPresentationInstaller depending on the specified role.
 */
interface IDomFormInstaller
{
    install(valueHostsManager: IValueHostsManager, root?: HTMLElement): void;
}


/**
 * Used by IDomFormInstaller to collect field-related DOM elements for editors and presentations.
 * It builds two lists, editors and presentations. The IDomFormInstaller determines
 * how to consume them.
 */
interface IFieldElementCollector
{

    readonly editors: EditorElementInstallation[];
    readonly presentations: FieldPresentationElementInstallation[];

    addEditor(element: IJivsDomElement, elementIdentifier: string, options?: EditorInstallOptions): void;

    addEditor(element: IJivsDomElement, fieldValueHost: IFieldValueHost, options?: EditorInstallOptions): void;

    addPresentation(element: IJivsDomElement, elementIdentifier: string, role: ElementRole | string,
        options?: FieldPresentationInstallOptions): void;

    addPresentation(element: IJivsDomElement, fieldValueHost: IFieldValueHost, role: ElementRole | string,
        options?: FieldPresentationInstallOptions): void;

    dispose(): void;
}

/**
 * Data collected by IFieldElementCollector for editor installations.
 */
interface EditorElementInstallation
{
    element: IJivsDomElement | null;
    fieldValueHost: IFieldValueHost | null;
    elementIdentifier: string | null;
    editorOptions?: EditorInstallOptions;
}

/**
 * Data collected by IFieldElementCollector for field presentation installations.
 */
interface FieldPresentationElementInstallation
{
    element: IJivsDomElement | null;
    fieldValueHost: IFieldValueHost | null;
    elementIdentifier: string | null;
    role: ElementRole | string;
    presentationOnlyOptions?: FieldPresentationInstallOptions;
}

/**
 * Used by IDomFormInstaller to collect form-related DOM elements for presentations.
 * The IDomFormInstaller determines how to consume them.
 */
interface IFormElementCollector
{
    readonly presentations: readonly FormElementInstallation[];

    addPresentation(element: IJivsDomElement, role: ElementRole | string,
        options?: FormPresentationInstallOptions): void;

    dispose(): void;
}

/**
 * Data collected by IFormElementCollector for form presentation installations.
 */
interface FormElementInstallation
{
    element: IJivsDomElement | null;
    role: ElementRole | string;
    presentationOptions?: FormPresentationInstallOptions;
}

/**
 * Top level service container for jivs-dom. It joins IJivsServices through
 * getService/setService, and thus is accessible to all consumers of IJivsService.
 * 
 * It provides access to various services related to DOM manipulation, 
 * editor and presentation installations, and ARIA support.
 */
interface IJivsDomServices
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