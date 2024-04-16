/**
 * @module ValueHosts/Types/InputValueHost
 */
import { IInputValidator, InputValidatorConfig } from "./InputValidator";
import { IValidatableValueHostBase, ValidatableValueHostBaseConfig, ValidatableValueHostBaseState } from "./ValidatableValueHostBase";

/**
* Manages a value that uses InputValidators for its input validation.
* This level is associated with the input field/element itself.
*/
export interface IInputValueHost extends IValidatableValueHostBase {
    /**
     * Gets an InputValidator already assigned to this InputValueHost.
     * @param conditionType - The ConditionType value assigned to the InputValidator
     * that you want.
     * @returns The InputValidator or null if the condition type does not match.
     */
        getValidator(conditionType: string): IInputValidator | null;
    
        /**
         * Intended for the UI developer to add their own UI specific validators
         * to those already configured within ValidationManager.
         * It adds or replaces when the ConditionType matches an existing 
         * InputValidatorConfig.
         * 
         * Try to avoid using it for validators coming from business logic.
         * 
         * This fits well with Data Type Check cases that were
         * not setup by Auto Generate Data Type Checks (see AutoGenerateDataTypeCheckService).
         * 
         * The RequireTextCondition and StringLengthCondition are good too,
         * but their rules typically are known by business logic and its just
         * a matter of converting "required" and "string length" business rules
         * to these conditions during setup in ValidationManager.
         * @param config 
         */
        addValidator(config: InputValidatorConfig): void;
        
        /**
         * While you normally set the validation group name with InputValueHostConfig.group,
         * InputValueHostConfig is often setup from the perspective of the business logic,
         * which does not make the ultimate decision on field grouping.
         * Call this from the UI layer when establishing the input to replace the supplied
         * group name.
         * @param group 
         */
        setGroup(group: string): void;
    
    }
/**
 * Just the data that is used to describe this input value.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to InputValueHostConfig.
 * This provides the backing data for each InputValueHost.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this, except values are converted to their native forms
 * like a JSON date is a Date object.
 * However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 */
export interface InputValueHostConfig extends ValidatableValueHostBaseConfig {

    /**
     * How to validate based on the business rules.
     * These are used to create actual validator objects.
     * This array may need to host validators that are client-side only,
     * such as parser error converting "abc" to number.
     */
    validatorConfigs: Array<InputValidatorConfig> | null;
}

/**
 * Elements of InputValueHost that are stateful based on user interaction
 */
export interface InputValueHostState extends ValidatableValueHostBaseState {

}

/**
 * Provides a way to get an InputValueHostConfig from another object,
 * as an alternative to being supplied one directly.
 * Fluent uses this to supply the config to ValidationManagerConfig.valueHostConfigs.
 */
export interface IInputValueHostConfigResolver
{
    /**
     * The InputValueHostConfig that is being constructed and will be supplied to ValidationManagerConfig.valueHostConfigs.
     */
    parentConfig: InputValueHostConfig;
}

/**
 * Determines if the object implements IInputValueHostConfigResolver.
 * @param source 
 * @returns source typecasted to IInputValueHostConfigResolver if appropriate or null if not.
 */
export function toIInputValueHostConfigResolver(source: any): IInputValueHostConfigResolver | null
{
    if (source && typeof source === 'object')
    {
        let test = source as IInputValueHostConfigResolver;    
        // some select members of IInputValueHostConfigResolver
        if (test.parentConfig)
            return test;
    }
    return null;
}
