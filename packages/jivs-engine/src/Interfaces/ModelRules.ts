/**
 * In Jivs, users are expected to place their validation rules in separate areas from their UI code,
 * and if possible, do it in a reusable and testable way. The Rules classes, inheriting from IRules,
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
 * @module Validation/Types/ModelRules
 */

import { IConfigFormAdapter } from "../Interfaces/ManagerConfigBuilder";
import { ValidationManagerConfig } from "./ValidationManager";

/**
 * Extends the behavior within IRules.configure.
 */
export interface RulesConfigOptions {
    /**
     * When `true`, disables caching of the rules configuration. This is useful for testing and debugging.
     */
    disableCache?: boolean;
    /**
     * Developer can use this to allow the caller to execute a named variant.
       Its used at the developer's discretion.
     */
    variantName?: string;

    /**
     * Used together with the IAdaptModelRulesToForm.adaptToForm() function
     * to determine how to transition from the base rules to the form-specific rules.
     * When true or undefined, delete any error messages supplied by business logic for which
     * you have a replacement in TextLocalizationService.
     * If undefined, it defaults to true.
     */
    favorUIMessages?: boolean
}

/**
 * Top level interface for rules classes. It is implemented by RuleBase.
 * It is used to create a ValidationManagerConfig object from any rules built 
 * into each concrete class. Create concrete classes for each Model
 * or Form that uses Jivs validation. 
 */
export interface IRules {
  configure(options?: RulesConfigOptions): ValidationManagerConfig;
}

/**
 * Interface used by Form developers who subclass from a ModelRules class to adapt it to their form.
 * It ensures that the form starts with the ModelRules configuration, 
 * and then adds any form-specific rules to it.
 * It is not used when subclassing FormRulesBase, which is already a form-specific rules class.
 * @param adapter - the IConfigFormAdapter that is used to adapt the model configuration
 * to the form.
 */
export interface IAdaptModelRulesToForm {
  adaptToForm(adapter: IConfigFormAdapter, options?: RulesConfigOptions): void;
}
