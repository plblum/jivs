/**
 * Represents all aspects of a single validation rule.
 * - Has the Validation function, which returns the ValidationResult, error messages, and severity.
 * - Condition - the actual validation rule
 * - Error Message - what to tell the user when there is an error
 * - Summary Error Message - In the ValidationSummary UI element, what to tell the user 
 *   when there is an error.
 * - Severity: Error, Severe, and Warning
 * - Rules to disable the validator: Enabler condition, Enabled property and several ValidateOptions.
 * - Resolves error message tokens
  * Attached to InputValueHosts through their InputValueHostConfig.
  * @module InputValidator/ConcreteClasses
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import { toIGatherValueHostNames, type IValueHost, ValidTypesForStateStorage } from '../Interfaces/ValueHost';
import { type IValueHostResolver, type IValueHostsManager, toIValueHostsManagerAccessor } from '../Interfaces/ValueHostResolver';
import { type ICondition, ConditionCategory, ConditionEvaluateResult, ConditionEvaluateResultStrings, toIEvaluateConditionDuringEdits, IEvaluateConditionDuringEdits } from '../Interfaces/Conditions';
import { type ValidateOptions, ValidationSeverity, type IssueFound } from '../Interfaces/Validation';
import { type InputValidateResult, type IInputValidator, type InputValidatorConfig, type IInputValidatorFactory } from '../Interfaces/InputValidator';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';
import { IMessageTokenSource, TokenLabelAndValue, toIMessageTokenSource } from '../Interfaces/MessageTokenSource';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { cleanString } from '../Utilities/Utilities';
import { ConditionType } from '../Conditions/ConditionTypes';

/**
 * An IInputValidator implementation that represents a single validator 
 * for the value of an InputValueHost.
 * It is stateless.
 * Basically you want to call validate() to get all of the results
 * of a validation, including ValidationResult, error messages,
 * severity, and more.
 * That data ends up in the ValidationManager as part of its state,
 * allowing the system consumer to know how to deal with the data
 * of the ValueHost (save or not) and the UI to display the state.
 * 
 * Each instance depends on a few things, all passed into the constructor
 * and treated as immutable.
 * - IInputValueHost - name, label, and values from the consuming system.
 * - InputValidatorConfig - The business logic supplies these rules
 *   to implement validation including Condition, Enabler, and error messages
 * If the caller changes any of these, discard the instance
 * and create a new one. The IInputValidatorState will restore the state.
 */
export class InputValidator implements IInputValidator {
    // As a rule, InputValueHost discards InputValidator when anything contained in these objects
    // has changed.
    constructor(valueHost: IInputValueHost, config: InputValidatorConfig) {
        assertNotNull(valueHost, 'valueHost');
        assertNotNull(config, 'config');
        this._valueHost = valueHost;
        this._config = config;
    }
    private readonly _valueHost: IInputValueHost;
    /**
    * The business rules behind this validator.
    */
    protected get config(): InputValidatorConfig {
        return this._config;
    }

    protected get services(): IValidationServices {
        return this.valueHostsManager.services;
    }

    protected get valueHost(): IInputValueHost {
        return this._valueHost;
    }

    protected get valueHostsManager(): IValueHostsManager {
        let vh = toIValueHostsManagerAccessor(this.valueHost)?.valueHostsManager;
        if (vh)
            return vh;
        throw new CodingError('ValueHost must implement IValueHostsManagerAccessor');
    }
    /**
     * Always supplied by constructor. Treat it as immutable.
     * Expected to be changed only by the caller (business logic)
     * and at that time, it must replace this instance with 
     * a new one and a new Config instance.
     */
    private readonly _config: InputValidatorConfig;

    /**
     * Provides the error code associated with this instance.
     * It uses InputValidatorConfig.errorCode when assigned
     * and ConditionType when not assigned.
     */
    public get errorCode(): string
    {
        return cleanString(this.config.errorCode) ?? this.conditionType;
    }


    /**
     * Condition used to validate the data.
     * Run by validate(), but only if the Validator is enabled (severity<>Off and Enabler == Match)
     * The actual Condition instance is created by the caller
     * and supplied in the InputValidatorConfig.
     */
    public get condition(): ICondition {
        if (!this._condition) {
            try {
                if (this.config.conditionCreator) {
                    if (this.config.conditionConfig)
                        throw new Error('Cannot assign both ConditionConfig and ConditionCreator');
                    this._condition = this.config.conditionCreator(this.config);
                    if (!this._condition)
                        throw new Error('ConditionCreator function must return an instance');
                }
                else if (this.config.conditionConfig)
                    this._condition = this.services.conditionFactory.create(this.config.conditionConfig);
                else
                    throw new Error('Condition must be setup');
            }
            catch (e) {
                if (e instanceof Error)
                    this.services.loggerService.log(e.message, LoggingLevel.Error, LoggingCategory.Configuration, this.getLogSourceText());
                throw e;
            }
        }
        return this._condition!;
    }
    private _condition: ICondition | null = null;
    /**
     * Gets the conditionType associated with the condition
     */
    public get conditionType(): string {
        return cleanString(this.condition.conditionType) ?? ConditionType.Unknown;
    }

    /**
     * Condition used to enable or disable this validator based on rules.
     * severity = Off takes precedence.
     */
    protected get enabler(): ICondition | null {
        if (!this._enabler)
            try {
                if (this.config.enablerCreator) {
                    if (this.config.enablerConfig)
                        throw new Error('Cannot assign both EnablerConfig and EnablerCreator');
                    this._enabler = this.config.enablerCreator(this.config);
                    if (!this._enabler)
                        throw new Error('EnablerCreator function must return an instance');
                }
                else if (this.config.enablerConfig)
                    this._enabler = this.services.conditionFactory.create(this.config.enablerConfig);
            }
            catch (e) {
                if (e instanceof Error)
                    this.services.loggerService.log(e.message, LoggingLevel.Error, LoggingCategory.Configuration, this.getLogSourceText());
                throw e;
            }
        return this._enabler;
    }
    private _enabler: ICondition | null = null;

    /**
     * Determined from the Config.enabled.
     * Does not use the Enabler.
     */
    public get enabled(): boolean {
        let value = this.getFromState('enabled') ??
            this.config.enabled;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            return true;
        return value as boolean;
    }

    /**
     * Determined from Config.severity.
     */
    protected get severity(): ValidationSeverity {
        let value = this.getFromState('severity') ?? this.config.severity;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            switch (this.condition.category) {
                case ConditionCategory.Required:
                case ConditionCategory.DataTypeCheck:
                    return ValidationSeverity.Severe;
                default:
                    return ValidationSeverity.Error;
            }

        return value as ValidationSeverity;
    }

    /**
     * Resolves the errorMessage as a template - before it has its tokens processed.
     * It uses several sources to get the template. The first to have text is used.
     * 1. Config.errorMessagel10n gets data from TextLocalizerService with Config.errorMessage as fallback
     * 2. Overridden Config.errorMessage or Config.errorMessage
     * 3. TextLocalizerService.getErrorMessage
     * @returns Error message from errorMessage property with localization applied
     * if ErrorMessagel10n is setup.
     */
    protected getErrorMessageTemplate(): string {
        let direct = this.getFromState('errorMessage') ??
                    this.config.errorMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        let l10n = (this.getFromState('errorMessagel10n') ??
                    this.config.errorMessagel10n) as string | null;
        if (l10n)
            msg = this.services.textLocalizerService.localize(this.services.activeCultureId,
                l10n, msg);
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the errorCode and DataTypeLookupKey.
            msg = this.services.textLocalizerService.getErrorMessage(this.services.activeCultureId,
                this.errorCode, this.valueHost.getDataType());
        }
        if (msg == null)
            throw new Error('Must supply a value for Config.errorMessage');
        return msg;
    }

    /**
     * Resolves the summaryMessage as a template - before it has its tokens processed.
     * Falls back to use GetErrorMessageTemplate if Config doesn't supply a value.
     * @returns Error message from summaryMessage property with localization applied
     * if SummaryMessagel10n is setup.
     */
    protected getSummaryMessageTemplate(): string {
        let direct = this.getFromState('summaryMessage') ??
                    this.config.summaryMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        let l10n = (this.getFromState('summaryMessagel10n') ??
                    this.config.summaryMessagel10n) as string | null;
        if (l10n)
            msg = this.services.textLocalizerService.localize(this.services.activeCultureId,
                l10n, msg ?? '');
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the errorCode and DataTypeLookupKey.
            msg = this.services.textLocalizerService.getSummaryMessage(this.services.activeCultureId,
                this.errorCode, this.valueHost.getDataType());
        }
        if (msg == null)
            return this.getErrorMessageTemplate();
        return msg;
    }

    /**
     * Perform validation activity and provide the results including
     * whether there is an error (ValidationResult), fully formatted
     * error messages, severity, and Condition type.
     * @param options - Provides guidance on which validators to include.
     * @returns Identifies the ConditionEvaluateResult.
     * If there were any NoMatch cases, they are in the IssuesFound array.
     */
    public validate(options: ValidateOptions): InputValidateResult | Promise<InputValidateResult> {
        assertNotNull(options, 'options');
        let self = this;
        logInfo(() => {
            return {
                message: `Validating for error code ${this.errorCode}`
            }
        });

        let resultState: InputValidateResult = {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null
        };
        try {
            // options that may bail out
            if (options.preliminary && this.condition.category === ConditionCategory.Required)
                return bailout('Preliminary option skips Required conditions');

            if (options.duringEdit && !this.supportsDuringEdit())
                return bailout('DuringEdit option limited to conditions that implement IEvaluateConditionDuringEdits');

            // enabled
            if (!this.enabled)
                return bailout('Config.enabled is false');

            // enabler
            let enabler = this.enabler;
            if (enabler) { // Many enablers don't use the current value host.
                // When that is the case, their ConditionConfig.valueHostName
                // must be setup to retrieve the correct one.
                // ValueHostName takes precedence.
                let result = enabler.evaluate(this.valueHost, this.valueHostsManager);
                switch (result) {
                    case ConditionEvaluateResult.NoMatch:
                    case ConditionEvaluateResult.Undetermined:
                        return bailout(`Enabler using ${enabler.conditionType} evaluated as ${ConditionEvaluateResultStrings[result]}`);
                }
            }

            if (options.duringEdit && this.supportsDuringEdit()) {
                let text = this.valueHost.getInputValue();
                if (typeof text === 'string')
                    return resolveCER((this.condition as IEvaluateConditionDuringEdits).evaluateDuringEdits(
                        text, this.valueHost, this.services));
                return bailout('Value intended for evaluateDuringEdits was not a string.');
            }

            let pendingCER = this.condition.evaluate(this.valueHost, this.valueHostsManager);

            if (pendingCER instanceof Promise) {
                // Support Async evaluation by letting evaluate() return a promise
                // When an async process returns, it must take NO action
                // if the value of State.ValidationResult is not still AsyncProcessing.
                return processPromise(pendingCER);
            }
            else
                return resolveCER(pendingCER as ConditionEvaluateResult);

        }
        catch (e) {
            if (e instanceof Error)
                logError(e.message);
            // resume normal processing with Undetermined state
            resultState.conditionEvaluateResult = ConditionEvaluateResult.Undetermined;
            resultState.issueFound = null;
            return resultState;
        }
        finally {
            if (resultState.issueFound)
                logInfo(() => {
                    let msg = `Validation error ${this.errorCode} found this issue: ${JSON.stringify(resultState.issueFound)}`;
                    return {
                        message: msg
                    };
                });
        }
        function resolveCER(cer: ConditionEvaluateResult): InputValidateResult {
            logInfo(() => {
                return {
                    message: `Condition ${self.conditionType} evaluated as ${ConditionEvaluateResultStrings[cer]}`
                };
            });
            resultState.conditionEvaluateResult = cer;
            switch (cer) {
                case ConditionEvaluateResult.NoMatch:
                    let issueFound = createIssueFound(self.valueHost, self);   // setup for ValidationResult.Undetermined
                    issueFound.severity = self.severity;
                    self.updateStateForNoMatch(issueFound, self.valueHost);
                    resultState.issueFound = issueFound;
                    break;
            }
            return resultState;
        }
        function processPromise(promiseCER: Promise<ConditionEvaluateResult>): Promise<InputValidateResult> {
            let wrapperPromise = new Promise<InputValidateResult>((resolve, reject) => {
                promiseCER.then(
                    (resultingCER) => {
                        resolve(resolveCER(resultingCER));
                    },
                    (reason) => {
                        logError(reason);
                        reject(reason);
                    });
            });
            return wrapperPromise;
        }
        function bailout(errorMessage: string): InputValidateResult {
            let resultState: InputValidateResult = {
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                issueFound: null
            };
            logInfo(() => {
                return {
                    message: errorMessage
                };
            });
            resultState.skipped = true;
            return resultState;
        }
        function logInfo(
            fn: () => { message: string; source?: string }): void {
            if (self.services.loggerService.minLevel >= LoggingLevel.Info) {
                let parms = fn();
                self.services.loggerService.log(parms.message, LoggingLevel.Info,
                    LoggingCategory.Validation,
                    parms.source ?? `Validation with ${self.getLogSourceText()}`);
            }
        }
        function logError(message: string): void {
            self.services.loggerService.log('Exception: ' + (message ?? 'Reason unspecified'),
                LoggingLevel.Error, LoggingCategory.Validation, self.getLogSourceText());
        }
    }

    /**
     * When true, the condition implements IEvaluateConditionDuringEdits
     * @returns 
     */
    protected supportsDuringEdit(): boolean {
        if (this._supportsDuringEdit === null)
            this._supportsDuringEdit = toIEvaluateConditionDuringEdits(this.condition) !== null;
        return this._supportsDuringEdit;
    }
    /**
     * Flag that identifies if the condition implements IEvaluateConditionDuringEdits.
     */
    private _supportsDuringEdit: boolean | null = null;

    /**
     * validate() found NoMatch. Update the InputValidatorState's properties to show
     * the current ValidationResult and error messages.
     * @param stateToUpdate - this is a COPY of the State, as supplied by updateState().
     * Do not modify the actual instance as it is immutable.
     * @param value 
     */
    protected updateStateForNoMatch(stateToUpdate: IssueFound,
        value: IValueHost): void {
        let services = this.services;
        stateToUpdate.severity = this.severity;
        let errorMessage = this.getErrorMessageTemplate();
        stateToUpdate.errorMessage = services.messageTokenResolverService.resolveTokens(
            errorMessage, this.valueHost, this.valueHostsManager, this);
        let summaryMessage = this.getSummaryMessageTemplate();
        stateToUpdate.summaryMessage = summaryMessage ?
            services.messageTokenResolverService.resolveTokens(summaryMessage, this._valueHost, this.valueHostsManager, this) :
            undefined;
    }
    //#region state management

    /**
     * State is stored in ValueHost's State using its saveInToStore/getFromStore.
     * Each entry needs to be associated with the errorCode of this InputValidator
     * and have its own identifier for the value.
     * This function creates a name to use with saveToStore and getFromStore.
     * @param identifier 
     */
    protected nameForState(identifier: string): string {
        return `_IV[${this.errorCode}].${identifier}`;
    }

    /**
     * Saves an entry into the ValueHostState.
     * @param identifier - used together with the errorCode to form a key in the State.
     * @param value - value to store. Use undefined to remove existing value.
     */
    protected saveIntoState(identifier: string, value: ValidTypesForStateStorage | undefined): void {
        this.valueHost.saveIntoState(this.nameForState(identifier), value);
    }

    /**
     * Returns an entry from the ValueHostState.
     * 
     * Often used to store values that override an entry in the InputValidationConfig.
     * In that case, typical implementation is:
     * let value = this.getFromState('identifier') ?? this.config.identifier;
     * @param identifier - used together with the errorCode to form a key in the State.
     * @returns The value or undefined if the key is not stored in state.
     */
    protected getFromState(identifier: string): ValidTypesForStateStorage | undefined {
        return this.valueHost.getFromState(this.nameForState(identifier));
    }
    //#endregion state management

    //#region config overrides

    /**
     * Use to change the enabled flag. It overrides the value from InputValidatorConfig.enabled.
     * Use case: the list of validators on InputValueHost might change while the form is active.
     * Add all possible cases to InputValueHost and change their enabled flag here when needed.
     * Also remember that you can use the enabler property on 
     * InputValidatorConfig to automatically determine if the validator
     * should run or not. Enabler may not be ideal in some cases though.
     * @param enabled 
     */
    public setEnabled(enabled: boolean): void {
        this.saveIntoState('enabled', enabled);
    }

    /**
     * Use to change the errorMessage and/or errorMessagel10n values. 
     * It overrides the values from InputValidatorConfig.errorMessage and errorMessagel10n.
     * Use case: Business logic supplies a default values for errorMessage and errorMessagel10n which the UI needs to change.
     * @param errorMessage  - If undefined, reverts to InputValidatorConfig.errorMessage.
     * If null, does not make any changes.
     * @param errorMessagel10n  - If undefined, reverts to InputValidatorConfig.errorMessagel10n.
     * If null, does not make any changes.
     */
    public setErrorMessage(errorMessage: string | undefined, errorMessagel10n?: string | undefined): void {
        if (errorMessage !== null)
            this.saveIntoState('errorMessage', errorMessage);
        if (errorMessagel10n !== null)
            this.saveIntoState('errorMessagel10n', errorMessagel10n);
    }

    /**
     * Use to change the summaryMessage and/or summaryMessagel10n values. 
     * It overrides the values from InputValidatorConfig.summaryMessage and summaryMessagel10n.
     * Use case: Business logic supplies a default values for summaryMessage and summaryMessagel10n which the UI needs to change.
     * @param summaryMessage  - If undefined, reverts to InputValidatorConfig.summaryMessage.
     * If null, does not make any changes.
     * @param summaryMessagel10n  - If undefined, reverts to InputValidatorConfig.summaryMessagel10n.
     * If null, does not make any changes.
     */
    public setSummaryMessage(summaryMessage: string | undefined, summaryMessagel10n?: string | undefined): void {
        if (summaryMessage !== null)
            this.saveIntoState('summaryMessage', summaryMessage);
        if (summaryMessagel10n !== null)
            this.saveIntoState('summaryMessagel10n', summaryMessagel10n);
    }

    /**
     * Use to change the severity option. It overrides the value from InputValidatorConfig.severity.
     * Use case: Business logic supplies a default value for severity which the UI needs to change.
     * @param severity 
     */
    public setSeverity(severity: ValidationSeverity): void {
        this.saveIntoState('severity', severity);
    }

    //#endregion config overrides


    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        toIGatherValueHostNames(this.condition)?.gatherValueHostNames(collection, valueHostResolver);
    }

    /**
     * Returns an array of 0 or more tokens supported by this MessageTokenSource.
     * Each returned has the token supported (omitting {} so {Label} is "Label")
     * and the value in its native data type (such as Date, number, or string).
     * Supports these tokens:
     * {Label} - the Config.label property verbatim
     * {Value} - the native value in State.Value. If null/undefined, the value in State.LastRawValue.
     * Plus any from the Condition in use.     
     */
    public getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let tlv: Array<TokenLabelAndValue> = [
            {
                tokenLabel: 'Label',
                associatedValue: valueHost.getLabel(),
                purpose: 'label'
            },
            {
                tokenLabel: 'Value',
                associatedValue: valueHost.getValue() ?? this._valueHost.getInputValue(),
                purpose: 'value'
            }
        ];
        if (toIMessageTokenSource(this.condition))   // since we cannot test for the IMessageTokenSource interface at runtime
            tlv = tlv.concat((this.condition as unknown as IMessageTokenSource).getValuesForTokens(valueHost, valueHostResolver));
        return tlv;
    }

    protected getLogSourceText(): string {
        return `InputValidator on ValueHost ${this._valueHost.getName()}`;
    }
}


export function createIssueFound(valueHost: IValueHost,
    validator: IInputValidator): IssueFound {
    return {
        valueHostName: valueHost.getName(),
        errorCode: validator.errorCode,
        severity: ValidationSeverity.Error,
        errorMessage: '',
        summaryMessage: undefined
    };
}

//#region Factory

/**
 * InputValidatorFactory creates the appropriate IInputValidator class
 */
export class InputValidatorFactory implements IInputValidatorFactory {
    public create(valueHost: IInputValueHost, config: InputValidatorConfig): IInputValidator {
        return new InputValidator(valueHost, config);
    }
}


//#endregion Factory
