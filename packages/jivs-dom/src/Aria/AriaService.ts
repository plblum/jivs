/**
 * Provides interfaces for managing ARIA attributes on DOM elements, 
 * including static and validation state updaters.
 * 
 * There are two categories of ARIA attributes:
 * - static - setup as the element is initialized.
 * - validation state - updated based on the validation state of the associated value host.
 * 
 * The aria service manages these with separate representations for field vs form.
 * It contains a registry for all Aria updaters.
 * 
 * @module jivs-dom/Types/AriaService
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IAriaService } from '../Interfaces/AriaService';
import { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../Interfaces/AriaUpdaters';
import { IEditorElementRegistryRecord, IElementRegistry, IFieldElementRegistryRecord, IFormElementRegistryRecord } from '../Interfaces/ElementRegistry';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { ElementRole } from '../Interfaces/Types';
import { DomServiceBase } from '../Services/DomServiceBase';


/**
 * Service for managing ARIA attributes on DOM elements.
 * It allows registration of static and validation state updaters and applies them to elements as needed.
 * IJivsDomService.ariaService provides access to this service, but that property
 * can be null to disable using arias.
 */
export class AriaService extends DomServiceBase
    implements IAriaService
{
    constructor(domServices: IJivsDomServices) {
        super(domServices);
    }

    /**
     * Storage for static ARIA attribute updaters by role.
     * Key is always lowercase and trimmed.
     */
    protected get staticUpdatersByRole(): Map<string, IAriaStaticUpdater> {
        return this._staticUpdatersByRole;
    }
    private _staticUpdatersByRole: Map<string, IAriaStaticUpdater> = new Map();

    /**
     * Storage for validation state ARIA attribute updaters by role.
     * Key is always lowercase and trimmed.
     */
    protected get validationStateUpdatersByRole(): Map<string, IAriaValidationStateUpdater> {
        return this._validationStateUpdatersByRole;
    }
    private _validationStateUpdatersByRole: Map<string, IAriaValidationStateUpdater> = new Map();

    /**
     * A way to lazily register role-specific updaters.
     * It is called automatically if nothing has been registered with the factory yet,
     * but only when the factory is first accessed.
     * ```ts
     * factory.lazyRegistration((factory) => {
     *     factory.register(new InputStaticUpdater());
     * });
     * ```
     * @param registrationFunction The function that will be called to lazily register updaters with the factory.
     */
    public lazyRegistration(registrationFunction: (factory: IAriaService) => void): void
    {
        this._lazyRegistrationFunction = registrationFunction;
    }
    private _lazyRegistrationFunction: ((factory: IAriaService) => void) | undefined = undefined;

    protected ensureLazyRegistration(): void
    {
        if (this._lazyRegistrationFunction) {
            this._lazyRegistrationFunction(this);
            this._lazyRegistrationFunction = undefined;
        }
    }

    /**
     * Registers a static ARIA attribute updater for the specified role.
     * 
     * @param role The role of the element for which the static updater should be applied.
     * @param updater The static ARIA attribute updater to register.
     * As it is an instance, it must be treated as immutable.
     */
    public registerStaticUpdater(role: ElementRole | string, updater: IAriaStaticUpdater): void
    {
        assertNotNull(role, 'role');
        assertNotNull(updater, 'updater');
        this.ensureLazyRegistration();
        const key = this.normalizeRole(role.toString());
        this._staticUpdatersByRole.set(key, updater);
    }

    /**
     * Registers a validation state ARIA attribute updater for the specified role.
     * 
     * @param role The role of the element for which the validation state updater should be applied.
     * @param updater The validation state ARIA attribute updater to register.
     * As it is an instance, it must be treated as immutable.
     */
    public registerValidationStateUpdater(role: ElementRole | string,
        updater: IAriaValidationStateUpdater): void
    {
        assertNotNull(role, 'role');
        assertNotNull(updater, 'updater');
        this.ensureLazyRegistration();
        const key = this.normalizeRole(role);
        this._validationStateUpdatersByRole.set(key, updater);
    }
    
    /**
     * Call during initialization phase to apply all static updaters,
     * assign IJivsDomElement.jivsAriaValidationStateUpdater if possible,
     * and apply initial validation state to validation state updaters.
     * @param registry 
     */
    public install(registry: IElementRegistry): void
    {
        assertNotNull(registry, 'registry');
        this.ensureLazyRegistration();
    /* 
     * The process:
     * Handle fields:
     * 1. Iterate over all resolved element identifiers in the registry.
     * 2. For each element, apply static ARIA updaters if applicable.
     * 3. Collect elements with validation state updaters for delayed application.
     *    This step allows the error message IDs to be assigned before applying the validation state updaters.
     * 4. Assign error message IDs to editor elements.
     * 5. Apply delayed validation state updaters after error message IDs are set.
     * Handle form: 
     * 6. Iterate over form elements and apply static ARIA updaters.
     */

        let delayedValidationStateUpdaters: Array<IEditorElementRegistryRecord | IFieldElementRegistryRecord> = [];
        for (const resolvedEI of registry.getResolvedElementIdentifiers()) // only returns field elements
        {

            let ariaElementAnchors = registry.getFieldAriaElementAnchors(resolvedEI.fieldValueHost!.getElementIdentifier());
            for (const record of resolvedEI.records)
            {
                if (record.element === ariaElementAnchors.editorAnchor ||
                    record.element === ariaElementAnchors.errorMessageElement)
                {
                    if (record.element.jivsAriaValidationStateUpdater === undefined) // has yet to have installation attempted
                    {
                        this.applyStaticAttributes(record.element, resolvedEI.fieldValueHost ?? undefined);

                        // validationStateUpdater is either assigned or null to indicate that installation has been attempted.
                        record.element.jivsAriaValidationStateUpdater = this.resolveValidationStateUpdater(record.element);
                    }

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
            this.applyValidationState(
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
                this.domServices.ariaService?.applyStaticAttributes(entry.element, undefined);
            }
        }        
    }

    /**
     * Applies the static ARIA attributes to the specified element.
     * Supports all roles.
     * 
     * It resolves the appropriate static ARIA attribute updater for the element based on the
     * element's IJivsDomElement properties.
     * 
     * The first to assign them in this order is used:
     * 1. Editor adapter definition (not available on non-editor roles): 
     *      jivsEditorAdapterDefinition.getStaticAriaElementUpdater()
     * 2. Field presentation: 
     *      jivsFieldPresentation.getStaticAriaElementUpdater()
     * 3. AriaServices' default updaters based on role:
     *      jivsElementRole
     * When none are found, nothing happens because its common to have roles and elements
     * that do not need ARIA support.
     * 
     * @param element The DOM element to which the static ARIA attributes should be applied.
     * @param valueHost The value host associated with the element, if any. 
     * Field level elements will have a FieldValueHost, but may have undefined if their Element Identifier 
     * didn't match to a FieldValueHost.
     * Form level elements will always have null/undefined.
     * @returns The resolved static ARIA element updater, or null if none could be resolved.
     */
    public applyStaticAttributes(element: IJivsDomElement, valueHost: IFieldValueHost | null | undefined):
        IAriaStaticUpdater | null
    {
        assertNotNull(element, 'element');
        assertNotNull(element.jivsElementRole, 'element.jivsElementRole');
        this.ensureLazyRegistration();

        let staticUpdater: IAriaStaticUpdater | null = this.resolveStaticUpdater(element);
        if (staticUpdater)
        {
            staticUpdater.applyStaticAttributes(element,
                this.normalizeRole(element.jivsElementRole!),
                valueHost ?? undefined);
            return staticUpdater;
        }

        this.domServices.loggingFacade.log(LoggingLevel.Debug, (facade) =>
            facade.prepareLogDetails(
                `No static ARIA updater could be resolved for element '{element}' with role: ${ element.jivsElementRole }`,
                element, valueHost, this));
        return null;
    }

    /**
     * Resolves the appropriate static ARIA element updater for the specified DOM element.
     * The rules are:
     * 1. Editor adapter definition (not available on non-editor roles)
     * 2. Field presentation or form presentation
     * 3. AriaServices' default updaters based on role
     * @param element The DOM element for which to resolve the static ARIA updater.
     * @returns The resolved static ARIA element updater, or null if none could be resolved.
     */
    protected resolveStaticUpdater(element: IJivsDomElement): IAriaStaticUpdater | null
    {
        let staticUpdater: IAriaStaticUpdater | null = null;
        if (element.jivsEditorAdapterDefinition)
        {
            staticUpdater = element.jivsEditorAdapterDefinition.getStaticAriaElementUpdater() ?? null;
        }
        // NOTE: Element may have either a field presentation or a form presentation, but not both.
        if (!staticUpdater && element.jivsFieldPresentation)
            staticUpdater = element.jivsFieldPresentation.getStaticAriaElementUpdater() ?? null;
        if (!staticUpdater && element.jivsFormPresentation)
            staticUpdater = element.jivsFormPresentation.getStaticAriaElementUpdater() ?? null;
        if (!staticUpdater && element.jivsElementRole)
        {
            staticUpdater = this.staticUpdatersByRole.get(element.jivsElementRole) ?? null;
        }
        return staticUpdater;
    }

    /**
     * Applies the validation state ARIA attributes to the specified element.
     * 
     * It resolves the appropriate validation state ARIA attribute updater for the element based on the
     * element's IJivsDomElement properties.
     * 
     * The first to assign them in this order is used:
     * 1. Editor adapter definition (not available on non-editor roles): 
     *      jivsEditorAdapterDefinition.getValidationStateAriaElementUpdater()
     * 2. Field presentation: 
     *      jivsFieldPresentation.getValidationStateAriaElementUpdater()
     * 3. AriaServices' default updaters based on role:
     *      jivsElementRole
     * When none are found, nothing happens because its common to have roles and elements
     * that do not need ARIA support.
     * 
     * @param element The DOM element to which the validation state should be applied.
     * @param valueHost The value host associated with the element, if any.
     * @param state The validation state to apply.
     * @returns The resolved ValidationState ARIA element updater, or null if none could be resolved.
     * If it ran 
     */
    public applyValidationState(element: IJivsDomElement, 
        valueHost: IFieldValueHost, state: ValueHostValidationState): IAriaValidationStateUpdater | null
    {
        assertNotNull(element, 'element');
        this.ensureLazyRegistration();
        const validationStateUpdater = this.resolveValidationStateUpdater(element);
        if (validationStateUpdater)
        {
            validationStateUpdater.applyValidationState(element, valueHost, state);
            return validationStateUpdater;
        }

        this.domServices.loggingFacade.log(LoggingLevel.Debug, (facade) =>
            facade.prepareLogDetails(
                `No Validation State ARIA updater could be resolved for element '{element}' with role: ${ element.jivsElementRole }`,
                element, valueHost, this));
        
        return null;
    }
    /**
     * Resolves the appropriate ValidationState ARIA element updater for the specified DOM element.
     * 
     * The rules are:
     * 1. Editor adapter definition (not available on non-editor roles)
     * 2. Field presentation
     * 3. AriaServices' default updaters based on role
     * @param element The DOM element for which to resolve the ValidationState ARIA updater.
     * @returns The resolved ValidationState ARIA element updater, or null if none could be resolved.
     */
    protected resolveValidationStateUpdater(element: IJivsDomElement): IAriaValidationStateUpdater | null
    {
        let ValidationStateUpdater: IAriaValidationStateUpdater | null = null;
        if (element.jivsEditorAdapterDefinition)
        {
            ValidationStateUpdater = element.jivsEditorAdapterDefinition.getValidationStateAriaElementUpdater() ?? null;
        }

        if (!ValidationStateUpdater && element.jivsFieldPresentation)
            ValidationStateUpdater = element.jivsFieldPresentation.getValidationStateAriaElementUpdater() ?? null;
        if (!ValidationStateUpdater && element.jivsElementRole)
        {
            ValidationStateUpdater = this.validationStateUpdatersByRole.get(element.jivsElementRole) ?? null;
        }
        return ValidationStateUpdater;
    }

    protected normalizeRole(role: string): string
    {
        return role.trim().toLowerCase();
    }
}
