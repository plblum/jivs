/**
 * @module ValueHosts/Types/InputValueHost
 */
import { IValidator, ValidatorConfig } from "./Validator";
import { IValidatableValueHostBase, ValidatableValueHostBaseConfig, ValidatableValueHostBaseState } from "./ValidatableValueHostBase";

/**
* Manages a value that uses Validators for its input validation.
* This level is associated with the input field/element itself.
*/
export interface IInputValueHost extends IValidatableValueHostBase {
    /**
     * Gets an Validator already assigned to this InputValueHost.
     * @param errorCode - The errorCode value assigned to the Validator
     * that you want. Same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The Validator or null if the condition type does not match.
     */
        getValidator(errorCode: string): IValidator | null;
    
        /**
         * Intended for the UI developer to add their own UI specific validators
         * to those already configured within ValidationManager.
         * It adds or replaces when the ConditionType matches an existing 
         * ValidatorConfig.
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
        addValidator(config: ValidatorConfig): void;
        
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
    validatorConfigs: Array<ValidatorConfig> | null;
}

/**
 * Elements of InputValueHost that are stateful based on user interaction
 */
export interface InputValueHostState extends ValidatableValueHostBaseState {

}
