/**
 * FormInstaller is a utility class that simplifies the installation and management of form elements within the DOM.
 * 
 * @module jivs-dom/FormInstaller/ConcreteClasses/FormInstaller
 */

import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../Interfaces/AriaUpdaters';
import { IElementCollector } from '../Interfaces/ElementCollector';
import { IEditorElementRegistryRecord, IElementRegistry, IFieldElementRegistryRecord, IFormElementRegistryRecord } from '../Interfaces/ElementRegistry';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { ElementRole } from '../Interfaces/Types';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';


/**
 * End user focused tool to install all aspects of jivs-dom to a form.
 * 
 * Together with ElementCollector and ElementRegistry,
 * it facilitates the installation and management of form elements within the DOM.
 * - Uses ElementCollector to populate ElementRegistry.
 * - Enumerates the registered elements, and uses role specific installers to finish the work:
 *    - EditorInstaller - installs and manages editor elements (role='editor')
 *    - FieldPresentationInstaller - installs and manages field presentation elements 
 *          (all field oriented roles except aria-error)
 *    - FormPresentationInstaller - installs and manages form presentation elements 
 *          (all form oriented roles) 
 * - Allows the AriaService to initialize after all relevant elements have been installed.
 * 
 * The results:
 *    - IJivsDomElement properties are populated
 *    - Presentations have been applied to the corresponding elements.
 *    - AriaService has run its static phase and a first application of validation state updaters
 *      using the FieldValueHost's current Validation State.
 * 
 * Example usage:
 * ```ts
 * let collector = new myElementCollector();
 * const formInstaller = new FormInstaller(valueHostsManager, collector);
 * formInstaller.install();
 * ```
 * 
 * It provides a static install function that simplifies the installation process
 * further, by including the DispatcherService.attach() step, resulting in 
 * a one-liner installation process.
 * Static install example:
 * ```ts
 * FormInstaller.install(valueHostsManager, collector);
 * ```
 */
export class FormInstaller
{
    public constructor(
        valueHostsManager: IValueHostsManager,
        collector: IElementCollector
    )
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(collector, 'collector');
        this._valueHostsManager = valueHostsManager;
        this._collector = collector;
    }

    protected get valueHostsManager(): IValueHostsManager {
        return this._valueHostsManager;
    }
    private readonly _valueHostsManager: IValueHostsManager;

    protected get collector(): IElementCollector {
        return this._collector;
    } 
    private readonly _collector: IElementCollector;

    protected get domServices(): IJivsDomServices {
        return this.valueHostsManager.services.domServices;
    }

    /**
     * Executes the installation process against all elements added into the ElementRegistry.
     * Its process includes:
     * 1. Collecting elements into the ElementRegistry using the ElementCollector.
     * 2. Installing entries from the registry using specialized installers:
     *    - EditorInstaller - installs and manages editor elements.
     *    - FieldPresentationInstaller - installs and manages field presentation elements.
     *    - FormPresentationInstaller - installs and manages form presentation elements (all form oriented roles).
     *    The results:
     *    - IJivsDomElement properties are populated, except for Aria specific ones.
     *    - Presentations have been applied to the corresponding elements.
     * 3. Letting AriaService handle its own installation based on ElementRegistry.
     */
    public install(): void
    {
        let domServices = this.domServices;
        // will create ElementRegistry if it doesn't exist yet
        let registry = domServices.getElementRegistry(this.valueHostsManager);
        registry.clear();   // if it did exist, start fresh
        let root = domServices.resolveContainerElement(this.valueHostsManager);
        this.collector.collect(root, registry);
        this.installFromRegistry(registry);

        domServices.ariaService?.install(registry); 

    }
    protected installFromRegistry(registry: IElementRegistry): void
    {
        let domServices = this.domServices;

        // enumerate through Iterable registry class
        for (let entry of registry)
        {
            // installers will also do this, but this covers cases where 
            // the entry is not sent to an installer.
            if (!entry.element.jivsElementRole)
                entry.element.jivsElementRole = entry.role;

            if (entry.role === ElementRole.editor)
            {
                if (entry.fieldValueHost)
                {
                    let anchorElement = domServices.editorInstaller.install(
                        entry.fieldValueHost,
                        entry.element,
                        (<IEditorElementRegistryRecord> entry).editorOptions ?? {});
                    registry.setEditorAnchorElement((<IEditorElementRegistryRecord> entry), anchorElement);
                }
                else
                    domServices.loggingFacade.log(LoggingLevel.Warn,
                        (facade) => facade.prepareLogDetails(
                            `Editor element for '${ entry.elementIdentifier }' is missing a fieldValueHost.`,
                            entry.element,
                            null,
                            'FormInstaller'
                        ));
                continue;
            }
            if (entry.kind === 'field')
            {
                if (entry.fieldValueHost)
                    domServices.fieldPresentationInstaller.install(
                        entry.fieldValueHost,
                        entry.element,
                        entry.role,
                        (<IFieldElementRegistryRecord> entry).presentationOptions ?? {});
                else
                    domServices.loggingFacade.log(LoggingLevel.Warn,
                        (facade) => facade.prepareLogDetails(
                            `Element with identifier '${ entry.elementIdentifier }' and role '${ entry.role }' is missing a fieldValueHost.`,
                            entry.element,
                            null,
                            'FormInstaller'
                        ));
                continue;
            }
            if (entry.kind === 'form')
            {
                domServices.formPresentationInstaller.install(
                    this.valueHostsManager,
                    entry.element,
                    entry.role,
                    (<IFormElementRegistryRecord> entry).presentationOptions ?? {});

                continue;
            }
        }        
    }

    /**
     * A one-line convenience method to install the form installer and attach dispatchers.
     * It goes beyond the FormInstaller by also attaching the necessary dispatchers to the DOM services.
     * @param valueHostsManager - the manager responsible for value hosts
     * @param collector - the element collector to be used
     * @param useTextValue - when true, attach the text value dispatcher. Default=true
     * @param useNativeValue - when true, attach the native value dispatcher. Default=false (rarely used)
     */
    public static install(valueHostsManager: IValueHostsManager, collector: IElementCollector,
        useTextValue: boolean = true, useNativeValue: boolean = false): void
    {
        let formInstaller = new FormInstaller(valueHostsManager, collector);
        formInstaller.install();
        let domServices = valueHostsManager.services.domServices;
        domServices.dispatchers.attach(valueHostsManager, useTextValue, useNativeValue);
    }
}