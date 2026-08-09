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
 * Subclass from abstract ValueHostRulesBase to implement your own rules.
 * 
 * Then use it to create a ValueHostsManagerConfig object, which can be used to create a ValueHostsManager.
 * 
    ```ts
    const rules = new PersonEditFormRules(services);
    const config = rules.configure();
    config.onValidationStateChanged = (parms)=> {}; // various callbacks hooked up
    const vhm = new ValueHostsManager(config);
    ```
 * @module jivs-builder/ValueHostRules/ConcreteClasses
 */

import { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { createFormConfigAdapter } from '../Builder/FormConfigAdapter';
import { ValueHostsManagerConfigBuilder } from '../Builder/ValueHostsManagerConfigBuilder';
import { IFormConfigAdapter, IManagerConfigBuilder, IValueHostsManagerConfigBuilder } from '../Interfaces/ManagerConfigBuilder';
import { IAdaptModelRulesToForm, IValueHostRules, ValueHostRulesOptions } from '../Interfaces/ValueHostRules';


/**
 * Core implementation of IValueHostRules. It is used to create a ValueHostsManagerConfig object from any rules 
 * defined by the implementation of its configureRules() method.
 * 
 * Subclasses are used by both the model and the form.
 * - Subclass from ValueHostRulesBase and implement configureRules() to define the model-oriented or form rules.
 *    ```ts
 *    export class PersonModelRules extends ValueHostRulesBase {
 *        configureRules(builder: IValueHostsManagerConfigBuilder, options?: ValueHostRulesOptions): void {
 *            // add model-oriented rules here
 *        }
 *    }
 *    ```
 * - Forms that use the business logic model from an existing ValueHostRulesBase class need to be adapted to avoid breaking
 * the business logic rules while allowing for form related customizations. 
 * Subclass from the Model's ValueHostRulesBase class and implement IAdaptModelRulesToForm 
 * to add any form-specific rules to the model rules. 
 *    ```ts
 *    export class PersonEditFormRules extends PersonModelRules implements IAdaptModelRulesToForm {
 *        adaptToForm(adapter: IFormConfigAdapter, options?: ValueHostRulesOptions): void {
 *            // add form-specific rules and adjustments such as to labels and error messages here
 *        }
 *    }
 *    ```
 * Supports caching of the configuration. Uses ICachingService with a key formed by createConfigCacheKey().
 * Disable caching by setting options.disableCache to true.
 */
export abstract class ValueHostRulesBase implements IValueHostRules
{
    protected constructor(services: IJivsServices)
    {
        assertNotNull(services, 'services');
        this._services = services;
    }
    protected get services(): IJivsServices {
        return this._services;
    }
    private readonly _services: IJivsServices;

    /**
     * Creates a ValueHostsManagerConfig object from the rules built into this class.
     * @param options 
     * @returns 
     */
    public configure(options?: ValueHostRulesOptions): ValueHostsManagerConfig {
        let config: ValueHostsManagerConfig | null | undefined = undefined;
        const cacheKey = this.createConfigCacheKey(options);
        const cachingService = !options?.disableCache ? this.services.cachingService : null;

        if (cachingService)
            config = cachingService.get(cacheKey);

        if (!config) {
            const builder = this.createBuilder(options);

            this.configureRules(builder, options);

            const uiRules = this as Partial<IAdaptModelRulesToForm>;
            if (typeof uiRules.adaptToForm === 'function') {
            // formAdapter is updating the same configuration data as builder itself.
                const formAdapter = this.createFormAdapter(builder, { favorUIMessages: options?.favorUIMessages });
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
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions,
    ): void;

    /**
     * Part of caching the configuration.
     * Supplies the base identity string used as the first component of the cache key.
     * The default implementation should return `this.constructor.name`.
     * Override this only when the default identity is not suitable.
     * @returns 
     */
    protected getValueHostRulesKey(): string
    {
        return this.constructor.name;
    }

    /**
     * Part of caching the configuration.
     * Builds the full cache key used for configuration caching.
     * Its default implementation should use `getValueHostRulesKey()` together with `variantName` 
     * and may be extended by subclasses when additional options affect the produced configuration.
     * It is intended to be overridable when a subclass needs extra cache-key components.
     * @param options 
     * @returns 
     */
    protected createConfigCacheKey(options?: ValueHostRulesOptions): string
    {
        let key = this.getValueHostRulesKey();
        if (options?.variantName)
            key += `:${options.variantName}`;
        return key;
    }

    /**
     * Creates the Builder used during configuration.
     * @param options - Available if the subclass needs to customize the builder creation.
     * @returns 
     */    
    protected createBuilder(options?: ValueHostRulesOptions): IValueHostsManagerConfigBuilder
    {
        return new ValueHostsManagerConfigBuilder(this.services);
    }

    protected createFormAdapter(source: IManagerConfigBuilder<any>, options?: ValueHostRulesOptions): IFormConfigAdapter
    {
        return createFormConfigAdapter(source, options);
    }

    /**
     * Finalizes the builder into `ValueHostsManagerConfig`.
     * @param builder 
     * @param options - Available if the subclass needs to customize the finalization.
     */
    protected buildConfig(builder: IValueHostsManagerConfigBuilder, options?: ValueHostRulesOptions): ValueHostsManagerConfig
    {
        return builder.complete();
    }

}