/**
 * Provides the interface for Jivs DOM elements, which extend ordinary HTMLElements 
 * with additional properties and behaviors installed by the Jivs framework.
 * 
 * HTMLElement extended with:
 * - jivsEditorAdapterDefinition: Describes the requirements for a specific editor widget upon installation.
 * - jivsTextValueAdapter: Handles onTextValueChange events specific to this editor.
 * - jivsValueAdapter: Handles onValueChange events specific to this editor.
 * - jivsFieldPresentation: Handles the onValidationStateChanged callback to provide visual feedback for the validation state of the field.
 * - jivsAriaValidationStateUpdater: AriaService's own updater for the validation state of the element.
 * - jivsFormPresentation: Handles the presentation of the form containing this element.
 * - jivsFormPresentationGroup: Allows a form element to be dedicated to a specific validation group.
 * 
 * @module jivs-dom/Types/IJivsDomElement
 */

import { IDomTextValueAdapter, IDomValueAdapter } from './Adapters';
import { IDomAriaValidationStateElementUpdater } from './AriaUpdaters';
import { IEditorAdapterDefinition } from './EditorAdapterDefinitions';
import { IFieldPresentation } from './FieldPresentations';
import { IFormPresentation } from './FormPresentations';

/**
 * Augments an ordinary HTMLElement with the Jivs behavior installed for that element.
 * Properties are set by the installation process.
 */
export interface IJivsDomElement extends HTMLElement
{
    /**
     * Describes the requirements for a specific editor widget upon installation.
     * The installed definition is shared and immutable. 
     * It describes the widget behavior but does not contain state belonging to this element.
     * Two states:
     * - Installed: The definition has been successfully installed on the element.
     * - Uninstalled: The value is undefined
     */
    jivsEditorAdapterDefinition?: IEditorAdapterDefinition;

    /**
     * Handles onTextValueChange events specific to this editor. Its value is created from the IEditorAdapterDefinition.
     * The ITextValueDispatcher routes text value changes to this adapter.
     * Three states determined by the installation process.:
     * - Installed: The adapter has been successfully installed on the element.
     * - Uninstalled: undefined.
     * - Not used: null. 
     */
    jivsTextValueAdapter?: IDomTextValueAdapter | null;

    /**
     * Handles onValueChange events specific to this editor. Its value is created from the IEditorAdapterDefinition.
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
