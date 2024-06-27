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
import { deepEquals, valueForLog } from '../Utilities/Utilities';
import { ConditionCategory } from '../Interfaces/Conditions';
import { ValidationSeverity, ValidationStatus } from '../Interfaces/Validation';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { InputValueHostConfig, InputValueHostInstanceState, IInputValueHost, SetInputValueOptions } from '../Interfaces/InputValueHost';
import { SetValueOptions, ValueHostConfig } from '../Interfaces/ValueHost';
import { ValidatorsValueHostBase, ValidatorsValueHostBaseGenerator } from './ValidatorsValueHostBase';
import { LoggingLevel, LoggingCategory } from '../Interfaces/LoggerService';
import { IValidator, ValidatorConfig } from '../Interfaces/Validator';
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { PropertyValueHost, hasIPropertyValueHostSpecificMembers } from './PropertyValueHost';
import { IValidationManager } from '../Interfaces/ValidationManager';
import { DataTypeResolution } from '../Interfaces/DataTypes';
import { CodingError } from '../Utilities/ErrorHandling';


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
    * In HTML, this is typically called by the onchanged event handler.
    * 
    * It can also be called by the oninput event handler so long as options.duringEdit=true.
    * If runs validation when options.validate=true. 
    * 
    * When setting the input value, it is important to also set the native value so the
    * Data Type Check conditions to work. DataTypeCheckCondition itself reports
    * an error if you set the native value to undefined.
    * 
    * To set the native value, you can do it manually, but also consider setting up 
    * a DataTypeParser on the inputValueOptionConfig.parserLookupKey to do it automatically.
    * When setup, setInputValue() will run the parser and call setInput() or setInputAsUndefined() for you.
    * 
    * @param value
    * @param options - 
    * - duringEdit - Set to true when handling an intermediate change activity, such as a keystroke
    *     changed a textbox but the user remains in the textbox. For example, on the 
    *     HTMLInputElement.oninput event.
    *     This will involve only validators that make sense during such an edit.
    *     Specifically their Condition implements IEvaluateConditionDuringEdits.
    *     The IEvaluateConditionDuringEdits.evaluateDuringEdit() function is used
    *     instead of ICondition.evaluate().
    * - validate - Invoke validation after setting the value.
    * - reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * - disableParser - When true, do not use the DataTypeParser to convert from input value to native value.
    * - conversionErrorTokenValue - When setting the value to undefined, it means there was an error
    *    converting. Provide a string here that is a UI friendly error message. It will
    *    appear in the Category=Require validator within the {ConversionError} token.
    *    A Data Type parser will also setup the conversionErrorTokenValue if it reports an error.
    */
    public setInputValue(value: any, options?: SetInputValueOptions): void {
        this.log(()=>`setInputValue(${valueForLog(value)})`, LoggingLevel.Debug);        

        if (!options)
            options = {};
        if (!this.canChangeValueCheck(options))
            return;        
        if (this.tryParse(value, options))
            return; // determines the native value and redirects to setValues().

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
     * Determines if parsing is setup and the value is parsable (must be a string). 
     * If so, it determines the native value, and calls upon setValues() to handle it all.
     * If the parser detects an error, the native value will be set to undefined
     * and options.conversionErrorTokenValue gets set to the parser's reported error info.
     * Supports config.parserDataType and config.parserCreator.
     * 
     * @param inputValue 
     * @param options - Set disableParser = true to prevent parsing. When duringEdit=true,
     * parsing is not supported and this function returns false.
     * @returns True used the parser and finished with setValues. No further work is needed.
     * False means the parser is not used, and setInputValue should continue.
     */
    protected tryParse(inputValue: any, options: SetInputValueOptions): boolean
    {
        function sendResultAlong(resolution: DataTypeResolution<any>): void
        {
            let nativeValue = resolution.value; // may be undefined which indicates a parser error
            if (resolution.errorMessage)
                options.conversionErrorTokenValue = resolution.errorMessage;
            self.log(()=> 'Parsed into native value', LoggingLevel.Debug, LoggingCategory.None);

            self.setValues(nativeValue, inputValue, options);
        }
        let self = this;
        // not supported in duringEdit mode as we are focused
        // on validating the input value alone
        if (options.duringEdit === true)
            return false;
        if (typeof inputValue === 'string') {
            if (options.disableParser === true)
            {
                this.log(()=> 'option.disableParser=true', LoggingLevel.Debug, LoggingCategory.None);
                return false;
            }
            let dtps = this.services.dataTypeParserService;
            if (dtps.isActive()) {
                this.log(()=> 'Attempt to parse into native value', LoggingLevel.Debug, LoggingCategory.None);
                         
                let lookupKey = this.config.parserLookupKey ?? this.getDataType() ?? null;
                let cultureId = this.services.cultureService.activeCultureId;
                let parser = this.config.parserCreator?.(this);
                if (parser && parser.supports(lookupKey!, cultureId, inputValue))
                { // in this case, we have to let the parser function deal with
                    // any fallback behavior and we'll supply a null lookupKey.
                    this.log(() => 'Parsing', LoggingLevel.Info, LoggingCategory.None);
                    let result = parser.parse(inputValue, lookupKey!, cultureId);
                    sendResultAlong(result);
                    return true;
                }
                if (this.config.parserLookupKey === null)
                    return false;
                
                if (lookupKey) {
                    let result = dtps.parse(inputValue, lookupKey, cultureId);
                    sendResultAlong(result);
                    return true;                    
                }
                let msg = `Cannot parse until parserDataType or dataType is assigned to "${this.getName()}"`;
                this.log(() => msg, LoggingLevel.Error, LoggingCategory.Exception);
                throw new CodingError(msg);
            }
        }
        return false;
    }

    /**
     * Sets both (native data type) Value and input field/element Value at the same time
     * and optionally invokes validation.
     * Use when the consuming system resolves both input and native values
     * at the same time so there is one state change and attempt to validate.
     * 
     * NOTE: The DataTypeParser feature is not used by this function as you have already done
     * the parsing to establish the native value.
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
        this.log(()=>`setValues(${valueForLog(nativeValue)}, ${valueForLog(inputValue)})`, LoggingLevel.Debug);        
        options = options ?? {};
        if (!this.canChangeValueCheck(options))
            return;        
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
                let dtcConditions = this.services.autoGenerateDataTypeCheckService.autoGenerateDataTypeConditions(this, lookupKey);
                dtcConditions.forEach((condition)=>{
                    let config: ValidatorConfig = {
                        /* eslint-disable-next-line @typescript-eslint/naming-convention */
                        conditionCreator: (requester) => condition,
                        conditionConfig: null,
                        errorMessage: null, // expecting TextLocalizationService to contribute based on ConditionType + DataTypeLookupKey
                        severity: ValidationSeverity.Severe
                    };
                    validators.push(this.services.validatorFactory.create(this, config));
                    this.log(()=> `Added ${condition.conditionType} Condition for Data Type Check`,
                        LoggingLevel.Info, LoggingCategory.Result);
                    created = true;
                });
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
    /**
     * Returns the value from InputValueHostConfig.parserLookupKey.
     */
    public getParserLookupKey(): string | null | undefined
    {
        return this.config.parserLookupKey;
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
        test.setValues !== undefined &&
        test.getParserLookupKey !== undefined &&
        test.getConversionErrorMessage !== undefined);
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
