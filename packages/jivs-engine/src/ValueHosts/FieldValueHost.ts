/**
 * A ValueHost that supports field validation.
 * It is associated with the input field/element itself.
 * It provides:
 * - validate() function which returns Validation Results in the form of a list of IssuesFound.
 * - A list of Validators, each for a single validation rule and containing their own error messages
 * - An additional value that can be validated, the value directly from the Input, which is often
 *   quite different from the value intended to be stored in the Model/Entity.
 * @module jivs-engine/ValueHosts/ConcreteClasses/FieldValueHost
 */
import { deepEquals, valueForLog } from '../Utilities/Utilities';
import { ConditionCategory } from '../Interfaces/Conditions';
import { ValidationSeverity, ValidationStatus } from '../Interfaces/Validation';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { FieldValueHostConfig, FieldValueHostInstanceState, IFieldValueHost, FieldValueHostSetValueOptions, toIFieldValueHostCallbacks } from '../Interfaces/FieldValueHost';
import { SetValueOptions, ValueHostConfig } from '../Interfaces/ValueHost';
import { ValidatorsValueHostBase, ValidatorsValueHostBaseGenerator } from './ValidatorsValueHostBase';
import { LoggingLevel, LoggingCategory } from '../Interfaces/LoggerService';
import { IValidator, ValidatorConfig } from '../Interfaces/Validator';
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { IValidationManager } from '../Interfaces/ValidationManager';
import { DataTypeResolution } from '../Interfaces/DataTypes';
import { CodingError, ensureError } from '../Utilities/ErrorHandling';


/**
 * A ValueHost for validation of a single field-like value. It is the most common ValueHost 
 * you will use because it works both with user input and with model properties to provide validation.
 *
 * On the client side, it supports editing widgets whose values are handled in text form.
 * On the server side, it supports model properties whose incoming values may also arrive
 * in text form before being resolved to their typed form.
 *
 * Because validation may need to evaluate either representation, an IFieldValueHost tracks:
 * - text value - the value exactly as supplied in text form
 * - typed value - the value in its native application form
 *
 * The text value may fail to resolve to the typed value. Conditions that inspect text,
 * such as RequireTextCondition, DataTypeCheckCondition, and RegExpCondition, evaluate
 * the text value. Most other Conditions evaluate the typed value.
 *
 * When configuring the ValidationManager for a FieldValueHost, use the builder's field() method.
 * ```ts
 * builder.field("firstName", LookupKey.String);
 * builder.field("birthDate", LookupKey.Date, { label: 'Birth Date' });
 * builder.field("Badge number", LookupKey.String)
 *      .requireText()
 *      .regExp(/^\d{3}\-\d{2}-[A-D]{4}$/);
 * ```
 * 
 * If configuring directly from a Config object, use the ValueHostType.Field type and provide a list of ValidatorConfigs.
 * ```ts
 * const config: FieldValueHostConfig = <FieldValueHostConfig>{
 *    valueHostType: ValueHostType.Field,
 *    name: "firstName",
 *    dataType: LookupKey.String,
 * ...and more...
 * };
 * ```
*/
export class FieldValueHost extends ValidatorsValueHostBase<FieldValueHostConfig, FieldValueHostInstanceState>
    implements IFieldValueHost {
    constructor(validationManager: IValidationManager, config: FieldValueHostConfig, state: FieldValueHostInstanceState) {
        super(validationManager, config, state);
    }
    

    /**
     * Called by setValue() to determine if a formatter is setup and the value is formattable.
     * If so, it determines the text value, and calls upon setValues() to handle it all.
     * Supports config.formatterDataType and config.formatterCreator.
     * Also supports options.disableFormatter to skip formatting.
     * @param value 
     * @param options 
     * @returns When true, it used the formatter and finished with setValues. No further work is needed.
     * When false, setValue() should continue.
     */
    protected override tryFormatToText(value: any, options?: FieldValueHostSetValueOptions): boolean
    {
        /**
         * 
         * @param resolution 
         * @returns when true, it successfully sent
         */
        function sendResultAlong(resolution: DataTypeResolution<string>): boolean
        {
            if (resolution.errorMessage)
            {
                self.logger.message(LoggingLevel.Info, () => `Formatter reported error: ${resolution.errorMessage}`);
                return false;
            }
            self.logger.message(LoggingLevel.Debug, ()=> 'Formatter used. Switching to setValues()');
            self.setValues(value, resolution.value, options); 
            return true;
        }
        let self = this;
        // similar to tryParser.
        if (value === undefined)
            return false;
        if (options?.disableFormatter)
        {
            this.logger.message(LoggingLevel.Debug, () => 'option.disableFormatter=true');
            return false;
        }
        if (this.config.formatterLookupKey || this.config.formatterCreator)
        {
        
            this.logger.message(LoggingLevel.Debug, () => 'Attempt to format into text value');
            const lookupKey = this.config.formatterLookupKey ?? this.getDataType() ?? null;
            if (this.config.formatterCreator)
            {
                // unlike with tryParser, we don't check formatter.supports
                // because we want to let the formatter decide 
                // if it can handle the value or not. It may have its own fallback behavior.
                const formatter = this.config.formatterCreator?.(this);
                if (formatter)
                { // in this case, we have to let the formatter function deal with
                    // any fallback behavior and we'll supply a null lookupKey.
                    const cultureId = this.services.cultureService.activeCultureId;
                    const result = formatter.format(value, lookupKey!, cultureId);
                    return sendResultAlong(result);

                }
            }
            // if neither formatterCreator nor formatterLookupKey is configured, we cannot format.
            // and let setValue() continue as normal. It will set the text value to undefined.
            if (!this.config.formatterLookupKey)
            {
                this.logger.message(LoggingLevel.Info, () => 'No formatterLookupKey or formatterCreator configured. Cannot format.');
                return false;
            }

            const dtfs = this.services.dataTypeFormatterService;
            const result = dtfs.format(value, lookupKey);
            return sendResultAlong(result);
        }

        return false;
    }

    protected useOnTextValueChanged(changed: boolean, oldValue: any, options: SetValueOptions): void
    {
        if (changed && (!options || !options.skipValueChangedCallback))
            toIFieldValueHostCallbacks(this.validationManager)?.onTextValueChanged?.(this, oldValue);
    }    
    //#region IFieldValueHost
    /**
     * Gets the current text value exactly as last provided.
     * This is the string representation before parsing into the typed value.
     * For example, a date field or posted form value is exposed as text, not as a Date.
     * The text is returned unchanged, with no trimming or other normalization applied.
     */
    public getTextValue(): string | undefined {
        return this.instanceState.textValue;
    }

    /**
     * Replaces the text value.
     *
     * Call when application code updates the text representation of the value.
     * On the client side, this is typically called from an onchange handler.
     * On the server side, this is used when incoming data provides text values
     * rather than native typed values.
     *
     * Common server-side examples include:
     * - posted form values
     * - query string values
     * - route values
     * - API or JSON payloads whose values are represented as strings
     *
     * When setting the text value, it is usually important to also set the typed value so that
     * DataTypeCheckCondition can evaluate correctly. DataTypeCheckCondition itself reports
     * an error when the typed value is undefined.
     *
     * The typed value may be set manually. Alternatively, configure a DataTypeParser through
     * TextValueOptionConfig.parserLookupKey to resolve it automatically. When configured,
     * setTextValue() will run the parser and set the typed value for you, including when
     * parsing fails.
     *
     * @param textValue - The text value to store exactly as supplied.
     * @param options -
     * duringEdit - Set to true for an intermediate edit activity rather than a completed change.
     *   For example, on the client side this may be used for an HTMLInputElement.oninput event,
     *   where the user is still editing. In this mode, only validators intended for in-progress
     *   edits are used. Specifically, their Condition implements IEvaluateConditionDuringEdits,
     *   and IEvaluateConditionDuringEdits.evaluateDuringEdit() is used instead of
     *   ICondition.evaluate().
     * validate - Invoke validation after setting the text value.
     * reset - Clear validation state, unless validate = true, and set IsChanged to false.
     * disableParser - When true, do not use the DataTypeParser to resolve the typed value
     *   from the text value.
     * conversionErrorTokenValue - When the typed value is undefined because it could not be
     *   resolved from the text value, provide a user-friendly error message here. It will appear
     *   in the Category=Require validator within the {ConversionError} token. A DataTypeParser
     *   may also set conversionErrorTokenValue when it reports an error.
     * skipValueChangedCallback - Skip the automatic callback setup through the OnValueChanged property.
     */
    public setTextValue(textValue: string | undefined, options?: FieldValueHostSetValueOptions): void {  
        this.logger.message(LoggingLevel.Debug, () => `setTextValue(${valueForLog(textValue)})`);        

        if (!options)
            options = {};
        if (!this.canChangeValueCheck(options))
            return;        
        if (this.tryParse(textValue, options))
            return; // determines the native value and redirects to setValues().

        const oldValue: any = this.instanceState.textValue;
        const changed = !deepEquals(textValue, oldValue);
        let valStateChanged = false;
        this.updateInstanceState((stateToUpdate) => {
            if (changed) {
                valStateChanged = stateToUpdate.status !== ValidationStatus.NeedsValidation;
                stateToUpdate.status = ValidationStatus.NeedsValidation;
                stateToUpdate.textValue = textValue;
            }
            this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);
            return stateToUpdate;
        }, this);
        this.processValidationOptions(options, valStateChanged); //NOTE: If validates or clears, results in a second updateInstanceState()
        this.notifyOthersOfChange(options);
        this.useOnTextValueChanged(changed, oldValue, options);

    }

    /**
     * Determines if parsing is setup and the value is parsable (must be a string). 
     * If so, it determines the native value, and calls upon setValues() to handle it all.
     * If the parser detects an error, the native value will be set to undefined
     * and options.conversionErrorTokenValue gets set to the parser's reported error info.
     * Supports config.parserDataType and config.parserCreator.
     * 
     * @param textValue 
     * @param options - Set disableParser = true to prevent parsing. When duringEdit=true,
     * parsing is not supported and this function returns false.
     * @returns True used the parser and finished with setValues. No further work is needed.
     * False means the parser is not used, and setTextValue should continue.
     */
    protected tryParse(textValue: any, options: FieldValueHostSetValueOptions): boolean
    {
        function sendResultAlong(resolution: DataTypeResolution<any>): void
        {
            const nativeValue = resolution.value; // may be undefined which indicates a parser error
            if (resolution.errorMessage)
                options.conversionErrorTokenValue = resolution.errorMessage;
            self.logger.log(LoggingLevel.Debug, (options) => {
                if (resolution.errorMessage)
                    return {
                        message: `Parser reported error and assigned the native value to undefined: ${resolution.errorMessage}`,
                        data: resolution
                    };
                return {
                    message: 'Parsed into native value',
                    data: resolution
                };
            });

            self.setValues(nativeValue, textValue, options);
        }
        const self = this;
        // not supported in duringEdit mode as we are focused
        // on validating the input value alone
        if (options.duringEdit === true)
            return false;
        try {
            if (typeof textValue === 'string') {
                if (options.disableParser === true) {
                    this.logger.message(LoggingLevel.Debug, () => 'option.disableParser=true');
                    return false;
                }
                const dtps = this.services.dataTypeParserService;
                if (dtps.isActive()) {
                    this.logger.message(LoggingLevel.Debug, () => 'Attempt to parse into native value');
                         
                    const lookupKey = this.config.parserLookupKey ?? this.getDataType() ?? null;
                    const cultureId = this.services.cultureService.activeCultureId;
                    const parser = this.config.parserCreator?.(this);
                    if (parser && parser.supports(lookupKey!, cultureId, textValue)) { // in this case, we have to let the parser function deal with
                        // any fallback behavior and we'll supply a null lookupKey.
                        this.logger.message(LoggingLevel.Info, () => 'Parsing');
                        const result = parser.parse(textValue, lookupKey!, cultureId);
                        sendResultAlong(result);
                        return true;
                    }
                    if (this.config.parserLookupKey === null)
                        return false;
                
                    if (lookupKey) {
                        const result = dtps.parse(textValue, lookupKey, cultureId);
                        sendResultAlong(result);
                        return true;
                    }
                    const error = new CodingError(`Cannot parse until parserDataType or dataType is assigned in "${this.getName()}"`);
                    this.logger.error(error);
                    throw error;
                }
            }
        }
        catch (e) {
            const err = ensureError(e);            
            this.logger.error(err);
            throw err;
        }            
        return false;
    }

    /**
     * Replaces both the typed value and the text value at the same time,
     * and optionally invokes validation.
     * Use when application code resolves both values together so there is
     * a single state change and validation pass.
     *
     * Note: This function does not use the DataTypeParser feature because
     * the typed value has already been resolved by the caller.
     *
     * @param nativeValue - The typed value to store. Use undefined to indicate that the
     * typed value could not be resolved from the text value, such as when parsing
     * a date from text fails. All other values, including null and the empty string,
     * are treated as real data.
     * @param textValue - The text value to store exactly as supplied.
     * @param options -
     *    * validate - Invoke validation after setting the values.
     *    * reset - Clear validation state, unless validate = true, and set IsChanged to false.
     *    * conversionErrorTokenValue - When the typed value is undefined because it could not be
     *    *    resolved from the text value, provide a user-friendly error message here. It will
     *    *    appear in the Category=Require validator within the {ConversionError} token.
     *    * skipValueChangedCallback - Skip the automatic callback setup through the OnValueChanged property.
     */
    public setValues(nativeValue: any, textValue: string | undefined, options?: SetValueOptions): void {    
        this.logger.message(LoggingLevel.Debug, () => `setValues(${valueForLog(nativeValue)}, ${valueForLog(textValue)})`);        
        options = options ?? {};
        if (!this.canChangeValueCheck(options))
            return;        
        const oldNative: any = this.instanceState.value;
        const nativeChanged = !deepEquals(nativeValue, oldNative);
        const oldText = this.instanceState.textValue;
        const textChanged = !deepEquals(textValue, oldText);
        const changed = nativeChanged || textChanged;
        let valStateChanged = false;
        this.updateInstanceState((stateToUpdate) => {
            if (changed) {
                // effectively clear past validation
                valStateChanged = (stateToUpdate.status !== ValidationStatus.NeedsValidation) || (stateToUpdate.issuesFound != null);
                stateToUpdate.status = ValidationStatus.NeedsValidation;
                stateToUpdate.issuesFound = null;

                stateToUpdate.value = nativeValue;
                stateToUpdate.textValue = textValue;
            }
            this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);

            return stateToUpdate;
        }, this);

        this.processValidationOptions(options, valStateChanged); //NOTE: If validates or clears, results in a second updateInstanceState()
        this.notifyOthersOfChange(options);
        this.useOnValueChanged(nativeChanged, oldNative, options);
        this.useOnTextValueChanged(textChanged, oldText, options);
    }

    protected additionalInstanceStateUpdatesOnSetValue(stateToUpdate: FieldValueHostInstanceState, valueChanged: boolean, options: SetValueOptions): void {
        super.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, valueChanged, options);
        if (options && (stateToUpdate.value === undefined) && options.conversionErrorTokenValue)
            stateToUpdate.conversionErrorTokenValue = options.conversionErrorTokenValue;
        else
            delete stateToUpdate.conversionErrorTokenValue;
    }

    //#endregion IFieldValueHost


    protected clearValidationDataFromInstanceState(stateToUpdate: FieldValueHostInstanceState): void {
        super.clearValidationDataFromInstanceState(stateToUpdate);
        delete stateToUpdate.conversionErrorTokenValue;
    }

    /**
     * Generates an array of all Validators from ValueHostConfig.validatorConfigs.
     * @returns 
     */
    protected generateValidators(): Array<IValidator> {

        const validators: Array<IValidator> = super.generateValidators();
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
            const lookupKey = this.getDataType();
            if (lookupKey) {
                const dtcConditions = this.services.autoGenerateDataTypeCheckService.autoGenerateDataTypeConditions(this, lookupKey);
                dtcConditions.forEach((condition)=>{
                    const config: ValidatorConfig = {
                         
                        conditionCreator: (requester) => condition,
                        conditionConfig: null,
                        errorMessage: null, // expecting TextLocalizationService to contribute based on ConditionType + DataTypeLookupKey
                        severity: ValidationSeverity.Severe
                    };
                    validators.push(this.services.validatorFactory.create(this, config));
                    this.logger.log(LoggingLevel.Info, (options) => {
                        return {
                            message: `Added ${condition.conditionType} Condition for Data Type Check`,
                            category: LoggingCategory.Result
                        };
                    });                    
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
    public get required(): boolean {
        // by design, Validators are sorted with Require first. So only check the first
        const validators = this.validators();

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
     * Returns the value from FieldValueHostConfig.parserLookupKey.
     */
    public getParserLookupKey(): string | null | undefined
    {
        return this.config.parserLookupKey;
    }

    /**
     * The actual property name on the model. If its the same as Config.name,
     * this can be undefined.
     * Helps mapping between model and valuehost.
     */
    public getPropertyName(): string
    {
        return this.config.propertyName ?? this.getName();
    }    
}

/**
 * Determines if the object implements IFieldValueHost.
 * @param source 
 * @returns source typecasted to IFieldValueHost if appropriate or null if not.
 */
export function toIFieldValueHost(source: any): IFieldValueHost | null {
    if (source instanceof FieldValueHost)
        return source as IFieldValueHost;

    if (toIValidatorsValueHostBase(source) &&
        hasIFieldValueHostSpecificMembers(source)) {
        return source as IFieldValueHost;
    }
    return null;
}
/**
 *  Returns true when it finds members introduced on IFieldValueHost.
 * @param source 
 * @returns 
 */
export function hasIFieldValueHostSpecificMembers(source: IValidatorsValueHostBase): boolean
{
    const test = source as IFieldValueHost;
    return (test.getTextValue !== undefined &&
        test.setTextValue !== undefined &&
        test.setValues !== undefined &&
        test.getParserLookupKey !== undefined &&
        test.getConversionErrorMessage !== undefined);
}

export class FieldValueHostGenerator extends ValidatorsValueHostBaseGenerator {
    public canCreate(config: ValueHostConfig): boolean {
        if (config.valueHostType != null)    // null/undefined
            return config.valueHostType === ValueHostType.Field;

        if ((config as FieldValueHostConfig).validatorConfigs === undefined)
            return false;
        return true;
    }
    public create(validationManager: IValidationManager, config: FieldValueHostConfig, state: FieldValueHostInstanceState): IFieldValueHost {
        return new FieldValueHost(validationManager, config, state);
    }

    public createInstanceState(config: FieldValueHostConfig): FieldValueHostInstanceState {
        const state = super.createInstanceState(config);

        return {
            ...state,
            textValue: undefined
        };
    }
}
