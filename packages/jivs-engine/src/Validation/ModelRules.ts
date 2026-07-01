/**
 * In Jivs, users are expected to place their validation rules in separate areas from their UI code,
 * and if possible, do it in a reusable and testable way. The Rules classes
 * encapsolate a configuration abstraction that is:
 * - reusable
 * - testable
 * - UI-independent
 * - compatible with both business-logic-owned and UI-authored rules
 * - suitable for subclass-based UI augmentation
 * 
 * Subclass from abstract ModelRulesBase or FormRulesBase to implement your own rules.
 * 
 * Then use it to create a ValidationManagerConfig object, which can be used to create a ValidationManager.
 * 
    ```ts
    const rules = new PersonEditFormRules(services);
    const config = rules.configure();
    config.onValidationStateChanged = (parms)=> {}; // various callbacks hooked up
    const vm = new ValidationManager(config);
    ```
 * @module ValidationManager/ConcreteClasses
 */

import { IManagerConfigBuilder, IValidationManagerConfigBuilder, IValidationManagerConfigFormAdapter } from "../Interfaces/ManagerConfigBuilder";
import { IAdaptModelRulesToForm, IRules, RulesConfigOptions } from "../Interfaces/ModelRules";
import { ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValueHostsManagerConfig } from "../Interfaces/ValueHostsManager";
import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { ManagerConfigBuilderBase } from "../ValueHosts/ManagerConfigBuilderBase";
import { ValidationManagerConfigBuilder } from "./ValidationManagerConfigBuilder";
import { ValidationManagerConfigFormAdapter, createFormAdapter } from "./ValidationManagerConfigFormAdapter";

/**
 * Core implementation of IRules. It is used to create a ValidationManagerConfig object from any rules built 
 * into each concrete class.
 * Supports caching of the configuration. Uses ICachingService with a key formed by createConfigCacheKey().
 * Disable caching by setting options.disableCache to true.
 * Supports analysis of the configuration when the jivs-configAnalysis module is installed.
 * Disable analysis by not assigning options.configAnalysisOptions.
 */
export abstract class RulesBase implements IRules
{
    protected constructor(services: IValidationServices)
    {
        assertNotNull(services, 'services');
        this._services = services;
    }
    protected get services(): IValidationServices {
        return this._services;
    }
    private _services: IValidationServices;

    /**
     * Creates a ValidationManagerConfig object from the rules built into this class.
     * @param options 
     * @returns 
     */
    public configure(options?: RulesConfigOptions): ValidationManagerConfig {
        let config: ValidationManagerConfig | null | undefined = undefined;
        const cacheKey = this.createConfigCacheKey(options);
        const cachingService = !options?.disableCache ? this.services.cachingService : null;

        if (cachingService)
            config = cachingService.get(cacheKey);

        if (!config) {
            const builder = this.createBuilder(options);

            this.configureRules(builder, options);

            const uiRules = this as Partial<IAdaptModelRulesToForm>;
            if (typeof uiRules.adaptToForm === "function") {
            // formAdapter is updating the same configuration data as builder itself.
                let formAdapter = this.createFormAdapter(builder, { favorUIMessages: options?.favorUIMessages });
                uiRules.adaptToForm(formAdapter, options);
            }

            config = this.buildConfig(builder, options);

            if (cachingService)
                cachingService.set(cacheKey, config);
        }

        return config;
    }

    /**
     * Defines the main configuration for the rules class.
     * This is the required subclass hook (an abstract method).
     * Override to define the model-oriented rules for a business model, or the full rules for a standalone Form-only rules class.
     * 
     * @param builder 
     * @param options 
     */
    protected abstract configureRules(
        builder: ValidationManagerConfigBuilder,
        options?: RulesConfigOptions,
    ): void;

    /**
     * Part of caching the configuration.
     * Supplies the base identity string used as the first component of the cache key.
     * The default implementation should return `this.constructor.name`.
     * Override this only when the default identity is not suitable.
     * @returns 
     */
    protected getModelRulesKey(): string
    {
        return this.constructor.name;
    }

    /**
     * Part of caching the configuration.
     * Builds the full cache key used for configuration caching.
     * Its default implementation should use `getModelRulesKey()` together with `variantName` 
     * and may be extended by subclasses when additional options affect the produced configuration.
     * It is intended to be overridable when a subclass needs extra cache-key components.
     * @param options 
     * @returns 
     */
    protected createConfigCacheKey(options?: RulesConfigOptions): string
    {
        let key = this.getModelRulesKey();
        if (options?.variantName)
            key += `:${options.variantName}`;
        return key;
    }

    /**
     * Creates the Builder used during configuration.
     * @param options - Available if the subclass needs to customize the builder creation.
     * @returns 
     */    
    protected createBuilder(options?: RulesConfigOptions): ValidationManagerConfigBuilder
    {
        return new ValidationManagerConfigBuilder(this.services);
    }

    protected createFormAdapter(source: IManagerConfigBuilder<any>, options?: RulesConfigOptions): IValidationManagerConfigFormAdapter
    {
        return createFormAdapter(source, options);
    }

    /**
     * Finalizes the builder into `ValidationManagerConfig`.
     * @param builder 
     * @param options - Available if the subclass needs to customize the finalization.
     */
    protected buildConfig(builder: ValidationManagerConfigBuilder, options?: RulesConfigOptions): ValidationManagerConfig
    {
        return builder.complete();
    }

}

/**
 * Use to develop rules for a model. It is subclassed to create concrete rules classes for each Model.
 * Subclasses are used by both the business logic and the Form.
 * - Business Logic: implements configureRules() to define the model-oriented rules for a business model.
 *    ```ts
 *    export class PersonModelRules extends ModelRulesBase {
 *        configureRules(builder: ValidationManagerConfigBuilder, options?: RulesConfigOptions): void {
 *            // add model-oriented rules here
 *        }
 *    }
 *    ```
 * - Form: subclass from the ModelRules class and then implement IAdaptModelRulesToForm.adaptToForm() 
 * to add any form-specific rules to the model rules. 
 *    ```ts
 *    export class PersonEditFormRules extends PersonModelRules implements IAdaptModelRulesToForm {
 *        adaptToForm(adapter: IValidationManagerConfigFormAdapter, options?: RulesConfigOptions): void {
 *            // add form-specific rules and adjustments such as to labels and error messages here
 *        }
 *    }
 *    ```
 * If you have a form without a model, start with FormRulesBase instead of ModelRulesBase.
 */
export abstract class ModelRulesBase extends RulesBase {
    protected constructor(services: IValidationServices) {
        super(services);
    }
}

/**
 * Use to develop rules for a Form that doesn't have a model. 
 * It is subclassed to create concrete rules classes for each Form.
 * ```ts
 *    export class PersonEditFormRules extends FormRulesBase {
 *       configureRules(builder: ValidationManagerConfigBuilder, options?: RulesConfigOptions): void {
 *           // add form-specific rules
 *      }
 *    }
 * ```
 */
export abstract class FormRulesBase extends RulesBase {
    protected constructor(services: IValidationServices) {
        super(services);
    }
}