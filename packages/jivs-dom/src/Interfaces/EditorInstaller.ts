
/**
 * Provides the interfaces around the Editor Installer.
 * The Editor Installer is called upon during element initialization and whenever the form's elements are replaced.
 * It ensures that an editor widget has the necessary adapters, presentations, and event handlers installed correctly.
 * 
 * @module jivs-dom/Types/EditorInstaller
 */

import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IJivsDomElement } from "./IJivsDomElement";

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
export interface IEditorInstaller
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
export interface EditorInstallOptions
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
