/**
 * Installer class responsible for installing form presentations on DOM elements.
 * 
 * @module jivs-dom/FormPresentations/ConcreteClasses/FormPresentationInstaller
 */

import { FormPresentationInstallOptions, IFormPresentation, IFormPresentationInstaller } from '../Interfaces/FormPresentations';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { DomServiceBase } from '../Services/DomServiceBase';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';

/**
 * Installer class responsible for installing form presentations on DOM elements.
 * 
 * The goal is to ensure the following have happened:
 * - Creates the appropriate IFormPresentation implementation for the given element and role, 
 *   by a supplied presentation name, using the FormPresentationFactory.
 * - Executes IFormPresentation.init()
 * - Executes IFormPresentation.apply() using the current validation state.
 * - Assigns the created IFormPresentation instance to the 
 *   element's IJivsDomElement.jivsFormPresentation property.
 * 
 * It also knows not to run the process if a form presentation is already installed on the element.
 * This allows it to be called after elements have been replaced, even if 
 * the element wasn't replaced.
 * 
 * It can be called directly, handling one element's at a time
 * or you can use the FormInstaller for handling multiple elements at once. It 
 * uses this installer internally to install form presentations on individual elements.
 */
export class FormPresentationInstaller extends DomServiceBase
    implements IFormPresentationInstaller
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }

    /**
     * Handles installation of FormPresentation for a given DOM element.
     * Executes FormPresentation.init() and apply(using currentValidationState).
     * @param valueHostsManager - The manager responsible for handling value hosts and their validation states.
     * @param element - The DOM element to which the form presentation is applied.
     * @param role - The role of the element, which can be a custom role string.
     * @param options - Optional installation options, including ARIA updaters.
     * @returns The installed form presentation instance, or null if installation does not need
     * a FormPresentation.
     */    
    public install(valueHostsManager: IValueHostsManager, element: IJivsDomElement,
        role: ElementRole | string, options?: FormPresentationInstallOptions): IFormPresentation | null
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(element, 'element');
        assertNotNull(role, 'role');
        if (!options)
        {
            options = {};
        }
        if (element.jivsFormPresentation !== undefined)
        {
            return element.jivsFormPresentation;
        }

        element.jivsElementRole = role;
        let formPresentation: IFormPresentation =
            this.domServices.formPresentationFactory.create(element, role, options.presentationName);
        formPresentation.init();
        formPresentation.apply(valueHostsManager, valueHostsManager.currentValidationState({
            group: options.group
        }));
        element.jivsFormPresentation = formPresentation;
        element.jivsFormPresentationGroup = options.group;
        return formPresentation;
    }
}