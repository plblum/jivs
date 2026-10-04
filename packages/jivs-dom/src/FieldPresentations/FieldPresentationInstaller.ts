/**
 * Installer class responsible for installing field presentations on DOM elements.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FieldPresentationInstaller
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { FieldPresentationInstallOptions, IFieldPresentation, IFieldPresentationInstaller } from '../Interfaces/FieldPresentations';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { DomServiceBase } from '../Services/DomServiceBase';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Installer class responsible for installing field presentations on DOM elements.
 * 
 * The goal is to ensure the following have happened:
 * - Creates the appropriate IFieldPresentation implementation for the given element and role, 
 *   by a supplied presentation name, using the FieldPresentationFactory.
 * - Executes IFieldPresentation.init()
 * - Executes IFieldPresentation.apply() using the current validation state.
 * - Assigns the created IFieldPresentation instance to the 
 *   element's IJivsDomElement.jivsFieldPresentation property.
 * 
 * It also knows not to run the process if a field presentation is already installed on the element.
 * This allows it to be called after elements have been replaced, even if 
 * the element wasn't replaced.
 * 
 * It can be called directly, handling one element's at a time
 * or you can use the FormInstaller for handling multiple elements at once. It 
 * uses this installer internally to install field presentations on individual elements.
 * 
 * The EditorInstaller calls this to handle the FieldPresentation portion of its work.
 */
export class FieldPresentationInstaller extends DomServiceBase
    implements IFieldPresentationInstaller
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }

    /**
     * Handles installation of FieldPresentation for a given DOM element.
     * Executes FieldPresentation.init() and apply(using currentValidationState).
     * @param valueHost - The host object that contains the field value and its current validation state.
     * @param element - The DOM element to which the field presentation is applied.
     * @param role - The role of the element, which can be an ARIA role or a custom role string.
     * @param options - Optional installation options
     * @returns The installed field presentation instance, or null if installation does not need
     * a FieldPresentation.
     */
    public install(valueHost: IFieldValueHost, element: IJivsDomElement,
        role: ElementRole | string, options?: FieldPresentationInstallOptions): IFieldPresentation | null
    {
        assertNotNull(valueHost, 'valueHost');
        assertNotNull(element, 'element');
        assertNotNull(role, 'role');
        if (!options)
        {
            options = {};
        }
        if (element.jivsFieldPresentation !== undefined)
        {
            return element.jivsFieldPresentation;
        }
        element.jivsElementRole = role;

        let fieldPresentation: IFieldPresentation =
            this.domServices.fieldPresentationFactory.create(element, role, options.presentationName);
        fieldPresentation.init();
        fieldPresentation.apply(valueHost, valueHost.currentValidationState);
        element.jivsFieldPresentation = fieldPresentation;

        return fieldPresentation;
    }
}