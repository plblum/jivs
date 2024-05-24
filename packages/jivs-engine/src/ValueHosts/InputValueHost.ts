/**
 * A ValueHost that supports input validation.
 * It is associated with the input field/element itself.
 * It provides:
 * - validate() function which returns Validation Results in the form of a list of IssuesFound.
 * - A list of Validators, each for a single validation rule and containing their own error messages
 * - An additional value that can be validated, the value directly from the Input, which is often
 *   quite different from the value intended to be stored in the Model/Entity.
 * @module ValueHosts/ConcreteClasses/InputValueHost
 */
import { deepEquals } from '../Utilities/Utilities';
import { ConditionCategory } from '../Interfaces/Conditions';
import { ValidationSeverity, ValidationStatus } from '../Interfaces/Validation';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { InputValueHostConfig, InputValueHostInstanceState, IInputValueHost } from '../Interfaces/InputValueHost';
import { SetValueOptions, ValueHostConfig } from '../Interfaces/ValueHost';
import { ValidatorsValueHostBase, ValidatorsValueHostBaseGenerator } from './ValidatorsValueHostBase';
import { LoggingLevel, LoggingCategory } from '../Interfaces/LoggerService';
import { IValidator, ValidatorConfig } from '../Interfaces/Validator';
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { PropertyValueHost, hasIPropertyValueHostSpecificMembers } from './PropertyValueHost';
import { IValidationManager } from '../Interfaces/ValidationManager';


/**
 * Standard implementation of IInputValueHost. It owns a list of Validators
 * which support its validate() function.
 * Use ValueHostConfig.valueHostType = "Input" for the ValidationManager to use this class.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - valueHostsManager - Typically this is the ValidationManager.
* - InputValueHostConfig - The business logic supplies these rules
*   to implement a ValueHost's name, label, data type, validation rules,
*   and other business logic metadata.
* - InputValueHostInstanceState - InstanceState used by this InputValueHost including
    its validators.
* If the caller changes any of these, discard the instance
* and create a new one.
 */
export class InputValueHost extends ValidatorsValueHostBase<InputValueHostConfig, InputValueHostInstanceState>
    implements IInputValueHost {
    constructor(validationManager: IValidationManager, config: InputValueHostConfig, state: InputValueHostInstanceState) {
        super(validationManager, config, state);
    }

    //#region IInputValueHost
    /**
     * Exposes the latest value retrieved from the input field/element
     * exactly as supplied by that input. For example,
     * an <input type="date"> returns a string, not a date.
     * Strings are not cleaned up, no trimming applied.
     */
    public getInputValue(): any {
        return this.instanceState.inputValue;
    }

    /**
    * Consuming system assigns the same value it assigns to the input field/element.
    * Its used with any condition that supports the validationOption { duringEdit: true},
    * including RequireTextCondition and RegExpCondition.
    * It is also used by DataTypeCheckCondition which determines the input is invalid
    * when InputValue is assigned and native Value is undefined.
    * @param value
    * @param options - 
    * - validate - Invoke validation after setting the value.
    * - reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * - conversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
    */
    public setInputValue(value: any, options?: SetValueOptions): void {
        if (!options)
            options = {};
        let oldValue: any = this.instanceState.inputValue;
        let changed = !deepEquals(value, oldValue);
        let valStateChanged = false;
        this.updateInstanceState((stateToUpdate) => {
            if (changed) {
                valStateChanged = stateToUpdate.status !== ValidationStatus.NeedsValidation;
                stateToUpdate.status = ValidationStatus.NeedsValidation;
                stateToUpdate.inputValue = value;
            }
            this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);
            return stateToUpdate;
        }, this);
        this.processValidationOptions(options, valStateChanged); //NOTE: If validates or clears, results in a second updateInstanceState()
        this.notifyOthersOfChange(options);
        this.useOnValueChanged(changed, oldValue, options);
    }

    /**
     * Sets both (native data type) Value and input field/element Value at the same time
     * and optionally invokes validation.
     * Use when the consuming system resolves both input and native values
     * at the same time so there is one state change and attempt to validate.
     * @param nativeValue - Can be undefined to indicate the value could not be resolved
     * from the input field/element's value, such as inability to convert a string to a date.
     * All other values, including null and the empty string, are considered real data.
     * @param inputValue - Can be undefined to indicate there is no value.
     * All other values, including null and the empty string, are considered real data.
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
     */
    public setValues(nativeValue: any, inputValue: any, options?: SetValueOptions): void {
        options = options ?? {};
        let oldNative: any = this.instanceState.value;
        let nativeChanged = !deepEquals(nativeValue, oldNative);
        let oldInput: any = this.instanceState.inputValue;
        let inputChanged = !deepEquals(inputValue, oldInput);
        let changed = nativeChanged || inputChanged;
        let valStateChanged = false;
        this.updateInstanceState((stateToUpdate) => {
            if (changed) {
                // effectively clear past validation
                valStateChanged = (stateToUpdate.status !== ValidationStatus.NeedsValidation) || (stateToUpdate.issuesFound != null);
                stateToUpdate.status = ValidationStatus.NeedsValidation;
                stateToUpdate.issuesFound = null;

                stateToUpdate.value = nativeValue;
                stateToUpdate.inputValue = inputValue;
            }
            this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);

            return stateToUpdate;
        }, this);

        this.processValidationOptions(options, valStateChanged); //NOTE: If validates or clears, results in a second updateInstanceState()
        this.notifyOthersOfChange(options);
        this.useOnValueChanged(nativeChanged, oldNative, options);
        this.useOnValueChanged(inputChanged, oldInput, options);
    }

    protected additionalInstanceStateUpdatesOnSetValue(stateToUpdate: InputValueHostInstanceState, valueChanged: boolean, options: SetValueOptions): void {
        super.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, valueChanged, options);
        if (options && (stateToUpdate.value === undefined) && options.conversionErrorTokenValue)
            stateToUpdate.conversionErrorTokenValue = options.conversionErrorTokenValue;
        else
            delete stateToUpdate.conversionErrorTokenValue;
    }

    //#endregion IInputValueHost


    protected clearValidationDataFromInstanceState(stateToUpdate: InputValueHostInstanceState): void {
        super.clearValidationDataFromInstanceState(stateToUpdate);
        delete stateToUpdate.conversionErrorTokenValue;
    }

    /**
     * Generates an array of all Validators from ValueHostConfig.validatorConfigs.
     * @returns 
     */
    protected generateValidators(): Array<IValidator> {

        let validators: Array<IValidator> = super.generateValidators();
        let needsDataTypeCheck = true;
        validators.forEach((validator) => {
            if (needsDataTypeCheck && validator.condition.category === ConditionCategory.DataTypeCheck)
                needsDataTypeCheck = false;
        });
        if (needsDataTypeCheck)
            this.tryAutoGenerateDataTypeCheckCondition(validators);
        return this.orderValidators(validators);
    }

    protected tryAutoGenerateDataTypeCheckCondition(validators: Array<IValidator>): boolean {
        let created = false;
        if (this.services.autoGenerateDataTypeCheckService.enabled) {
            let lookupKey = this.getDataType();
            if (lookupKey) {
                let dtcCondition = this.services.autoGenerateDataTypeCheckService.autoGenerateDataTypeCondition(this, lookupKey);
                if (dtcCondition != null) {
                    let config: ValidatorConfig = {
                        /* eslint-disable-next-line @typescript-eslint/naming-convention */
                        conditionCreator: (requester) => dtcCondition,
                        conditionConfig: null,
                        errorMessage: null, // expecting TextLocalizationService to contribute based on ConditionType + DataTypeLookupKey
                        severity: ValidationSeverity.Severe
                    };
                    validators.push(this.services.validatorFactory.create(this, config));
                    this.services.loggerService.log(`Added ${dtcCondition.conditionType} Condition for Data Type Check`,
                        LoggingLevel.Info, LoggingCategory.Configuration, `Validator on ${this.getName()}`);
                    created = true;
                }
            }
        }
        return created;
    }
    /**
     * Resolves from the generated Validators by checking the first for
     * Condition.category = Require
     */
    public get requiresInput(): boolean {
        // by design, Validators are sorted with Require first. So only check the first
        let validators = this.validators();

        return validators != null && validators.length > 0 &&
            (validators[0].condition.category === ConditionCategory.Require);
    }

    /**
     * Returns the ConversionErrorTokenValue supplied by the latest call
     * to setValue() or setValues(). Its null when not supplied or has been cleared.
     * Associated with the {ConversionError} token of the DataTypeCheckCondition.
     */
    public getConversionErrorMessage(): string | null {
        return this.instanceState.conversionErrorTokenValue ?? null;
    }

}

/**
 * Determines if the object implements IInputValueHost.
 * @param source 
 * @returns source typecasted to IInputValueHost if appropriate or null if not.
 */
export function toIInputValueHost(source: any): IInputValueHost | null {
    if (source instanceof InputValueHost)
        return source as IInputValueHost;
    if (source instanceof PropertyValueHost)
        return null;
    if (toIValidatorsValueHostBase(source) &&
        !hasIPropertyValueHostSpecificMembers(source) &&
        hasIInputValueHostSpecificMembers(source)) {
        return source as IInputValueHost;
    }
    return null;
}
/**
 *  Returns true when it finds members introduced on IInputValueHost.
 * @param source 
 * @returns 
 */
export function hasIInputValueHostSpecificMembers(source: IValidatorsValueHostBase): boolean
{
    let test = source as IInputValueHost;
    return (test.getInputValue !== undefined &&
        test.setInputValue !== undefined &&
        test.setValues !== undefined);
}

export class InputValueHostGenerator extends ValidatorsValueHostBaseGenerator {
    public canCreate(config: ValueHostConfig): boolean {
        if (config.valueHostType != null)    // null/undefined
            return config.valueHostType === ValueHostType.Input;

        if ((config as InputValueHostConfig).validatorConfigs === undefined)
            return false;
        return true;
    }
    public create(validationManager: IValidationManager, config: InputValueHostConfig, state: InputValueHostInstanceState): IInputValueHost {
        return new InputValueHost(validationManager, config, state);
    }

    public createInstanceState(config: InputValueHostConfig): InputValueHostInstanceState {
        let state = super.createInstanceState(config);

        return {
            ...state,
            inputValue: undefined
        };
    }
}
