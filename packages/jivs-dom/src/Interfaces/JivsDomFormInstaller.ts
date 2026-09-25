/**
 * Form Installers handle collecting all elements that need to participate in jivs-dom
 * and calling the appropriate installers for editors and presentations.
 * 
 * @module jivs-dom/Types/FormInstaller
 */

import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { EditorInstallOptions } from './EditorInstaller';
import { FieldPresentationInstallOptions } from './FieldPresentations';
import { FormPresentationInstallOptions } from './FormPresentations';
import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';

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
export interface IJivsDomFormInstaller
{
    install(valueHostsManager: IValueHostsManager, root?: HTMLElement): void;
}


/**
 * Used by IJivsDomFormInstaller to collect field-related DOM elements for editors and presentations.
 * It builds two lists, editors and presentations. The IJivsDomFormInstaller determines
 * how to consume them.
 */
export interface IFieldElementCollector
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
export interface EditorElementInstallation
{
    element: IJivsDomElement | null;
    fieldValueHost: IFieldValueHost | null;
    elementIdentifier: string | null;
    editorOptions?: EditorInstallOptions;
}

/**
 * Data collected by IFieldElementCollector for field presentation installations.
 */
export interface FieldPresentationElementInstallation
{
    element: IJivsDomElement | null;
    fieldValueHost: IFieldValueHost | null;
    elementIdentifier: string | null;
    role: ElementRole | string;
    presentationOnlyOptions?: FieldPresentationInstallOptions;
}

/**
 * Used by IJivsDomFormInstaller to collect form-related DOM elements for presentations.
 * The IJivsDomFormInstaller determines how to consume them.
 */
export interface IFormElementCollector
{
    readonly presentations: readonly FormElementInstallation[];

    addPresentation(element: IJivsDomElement, role: ElementRole | string,
        options?: FormPresentationInstallOptions): void;

    dispose(): void;
}

/**
 * Data collected by IFormElementCollector for form presentation installations.
 */
export interface FormElementInstallation
{
    element: IJivsDomElement | null;
    role: ElementRole | string;
    presentationOptions?: FormPresentationInstallOptions;
}
