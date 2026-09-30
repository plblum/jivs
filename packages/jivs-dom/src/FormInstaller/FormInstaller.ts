import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IAriaStaticElementUpdater, IAriaValidationStateElementUpdater } from '../Interfaces/AriaUpdaters';
import { IElementCollector } from '../Interfaces/ElementCollector';
import { IEditorElementRegistryRecord, IElementRegistry, IFieldElementRegistryRecord, IFormElementRegistryRecord } from '../Interfaces/ElementRegistry';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { ElementRole } from '../Interfaces/Types';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';


/**
 * Main installer for the entire DOM side of Jivs when using jivs-dom.
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

    public install(): void
    {
        let domServices = this.domServices;
        // will create ElementRegistry if it doesn't exist yet
        let registry = domServices.getElementRegistry(this.valueHostsManager);
        registry.clear();   // if it did exist, start fresh
        let root = domServices.resolveContainerElement(this.valueHostsManager);
        this.collector.collect(root, registry);
        this.applyEntriesToRegistry(registry);

        this.applyRegistryToAriaService(registry);  //!!!PENDING: Move into ariaService as install function

    }
    protected applyEntriesToRegistry(registry: IElementRegistry): void
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
    protected applyRegistryToAriaService(registry: IElementRegistry): void
    {
        const ariaService = this.domServices.ariaService;
        if (!ariaService)
            return;

        let delayedValidationStateUpdaters: Array<IEditorElementRegistryRecord | IFieldElementRegistryRecord> = [];
        for (const resolvedEI of registry.getResolvedElementIdentifiers())
        {

            let ariaElementAnchors = registry.getFieldAriaElementAnchors(resolvedEI.fieldValueHost!.getElementIdentifier());
            for (const record of resolvedEI.records)
            {
                if (record.element === ariaElementAnchors.editorAnchor ||
                    record.element === ariaElementAnchors.errorMessageElement)
                {
                    this.applyAriaUpdaterToElement(record as IFieldElementRegistryRecord);
                    if (record.element.jivsAriaValidationStateUpdater !== undefined)
                        delayedValidationStateUpdaters.push(record);
                }
            }
            // at this point, all the ARIA updaters for the field have been applied,
            // we expect the errormessageeelement to have is id setup.
            // We'll assign that id to the editor's IJivsDomElement.jivsErrorMessageId property.
            // The Validation State updater on editor will use that to setup
            // the aria-errormessage attribute correctly.
            if (ariaElementAnchors.editorAnchor)
            {
                ariaElementAnchors.editorAnchor.jivsErrorMessageId = undefined;
                if (ariaElementAnchors.errorMessageElement)
                {
                    let errorMessageId = ariaElementAnchors.errorMessageElement.id;
                    if (!errorMessageId)
                    {
                        errorMessageId = `error-${encodeHtml(ariaElementAnchors.elementIdentifier)}-${Math.random().toString(36).substring(2, 9) }`;
                        ariaElementAnchors.errorMessageElement.id = errorMessageId;
                    }
                    ariaElementAnchors.editorAnchor.jivsErrorMessageId = errorMessageId;
                }
            }
        }
        // Apply delayed validation state updaters
        // This lets it resolve the errorMessageId needed on individual 
        // validation state updaters so that the editor can use 
        // aria-errormessage='id of the error message element.'
        // Assumes the static updater for the error message ensures an ID exists.
        for (const updater of delayedValidationStateUpdaters)
        {
            ariaService?.applyValidationState(
                updater.element,
                updater.fieldValueHost!,
                updater.fieldValueHost!.currentValidationState
            );
        }

        // apply static updaters to form roles, allowing Validation Summary to have its ARIA attributes correctly set
        for (let entry of registry)
        {
            if (entry.kind === 'form')
            {
                entry = entry as IFormElementRegistryRecord;
                let staticAriaUpdater: IAriaStaticElementUpdater | null = null;
                if (entry.element.jivsFormPresentation)
                    staticAriaUpdater = entry.element.jivsFormPresentation.getStaticAriaElementUpdater() ?? null;

                this.domServices.ariaService?.applyStaticAttributes(
                    entry.element,
                    entry.role,
                    undefined,
                    staticAriaUpdater
                );
            }
        }
 
    }
   
    protected applyAriaUpdaterToElement(entry: IFieldElementRegistryRecord | IEditorElementRegistryRecord): void
    {
        let element = entry.element;
        if (element.jivsAriaValidationStateUpdater === undefined)
        {
            // Both static and validation state ARIA updaters have several sources.
            // The first to assign them in this order is used:
            // 1. Editor adapter definition (not available on non-editor roles)
            // 2. Field presentation
            // 3. AriaServices' default updaters
            let staticUpdater: IAriaStaticElementUpdater | null = null;
            let validationStateUpdater: IAriaValidationStateElementUpdater | null = null;
            if (element.jivsEditorAdapterDefinition)
            {
                staticUpdater = element.jivsEditorAdapterDefinition.getStaticAriaElementUpdater() ?? null;
                validationStateUpdater = element.jivsEditorAdapterDefinition.getValidationStateAriaElementUpdater() ?? null;
            }
            if (!staticUpdater && element.jivsFieldPresentation)
                staticUpdater = element.jivsFieldPresentation.getStaticAriaElementUpdater() ?? null;
            if (!validationStateUpdater && element.jivsFieldPresentation)
                validationStateUpdater = element.jivsFieldPresentation.getValidationStateAriaElementUpdater() ?? null;


            this.domServices.ariaService!.applyStaticAttributes(
                element,
                entry.role,
                entry.fieldValueHost ?? undefined,
                staticUpdater
            );

            // validationStateUpdater is either assigned or null. Never undefined.
            // This is used to block re-application any part of this function.
            element.jivsAriaValidationStateUpdater = validationStateUpdater;
        }
    }
}