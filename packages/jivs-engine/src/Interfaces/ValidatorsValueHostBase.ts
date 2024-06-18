/**
 * @module ValueHosts/Types/ValidatorsValueHostBase
 */
import { IValidator, ValidatorConfig } from "./Validator";
import { IValidatableValueHostBase, IValidatableValueHostBaseCallbacks, ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState, toIValidatableValueHostBase, toIValidatableValueHostBaseCallbacks } from "./ValidatableValueHostBase";

/**
* Extends ValidatableValueHost to use the Validators class in support of validation.
*/
export interface IValidatorsValueHostBase extends IValidatableValueHostBase {

    /**
     * Gets an Validator already assigned to this ValidatorsValueHostBase.
     * @param errorCode - The errorCode value assigned to the Validator
     * that you want. Same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The Validator or null if the condition type does not match.
     */
    getValidator(errorCode: string): IValidator | null;
}
/**
 * Just the data that is used to describe this input value.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to ValidatorsValueHostBaseConfig.
 * This provides the backing data for each ValidatorsValueHostBase.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this, except values are converted to their native forms
 * like a JSON date is a Date object.
 * However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 */
export interface ValidatorsValueHostBaseConfig extends ValidatableValueHostBaseConfig {

    /**
     * How to validate based on the business rules.
     * These are used to create actual validator objects.
     * This array may need to host validators that are client-side only,
     * such as parser error converting "abc" to number.
     */
    validatorConfigs: Array<ValidatorConfig> | null;
}

/**
 * Elements of ValidatorsValueHostBase that are stateful based on user interaction
 */
export interface ValidatorsValueHostBaseInstanceState extends ValidatableValueHostBaseInstanceState {


}


/**
 * Provides callback hooks for the consuming system to supply to IValidatorsValueHostBases.
 */
export interface IValidatorsValueHostBaseCallbacks extends IValidatableValueHostBaseCallbacks {

}
/**
 * Determines if the object implements IValidatorsValueHostBaseCallbacks.
 * @param source 
 * @returns source typecasted to IValidatorsValueHostBaseCallbacks if appropriate or null if not.
 */
export function toIValidatorsValueHostBaseCallbacks(source: any): IValidatorsValueHostBaseCallbacks | null
{
    if (toIValidatableValueHostBaseCallbacks(source))
    {
        return source as IValidatorsValueHostBaseCallbacks;
    }
    return null;
}

/**
 * Determines if the object implements IValidatorsValueHostBase.
 * @param source 
 * @returns source typecasted to IValidatorsValueHostBase if appropriate or null if not.
 */
export function toIValidatorsValueHostBase(source: any): IValidatorsValueHostBase | null
{
    if (toIValidatableValueHostBase(source))
    {
        let test = source as IValidatorsValueHostBase;    
        // some select members of IValidatorsValueHostBase
        if (test.getValidator !== undefined)
            return test;
    }
    return null;
}
