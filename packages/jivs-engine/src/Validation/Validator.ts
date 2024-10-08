/**
 * Represents all aspects of a single validation rule.
 * - Has the Validation function, which returns the ConditionEvaluateResult, error messages, and severity.
 * - Condition - the actual validation rule
 * - Error Message - what to tell the user when there is an error
 * - Summary Error Message - In the ValidationSummary UI element, what to tell the user 
 *   when there is an error.
 * - Severity: Error, Severe, and Warning
 * - Rules to disable the validator: Enabler condition, Enabled property and several ValidateOptions.
 * - Resolves error message tokens
  * Attached to ValidatorsValueHostBases through their ValidatorsValueHostBaseConfig.
  * @module Validator/ConcreteClasses
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import { toIGatherValueHostNames, type IValueHost, ValidTypesForInstanceStateStorage } from '../Interfaces/ValueHost';
import { type IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { type ICondition, ConditionCategory, ConditionEvaluateResult, toIEvaluateConditionDuringEdits, IEvaluateConditionDuringEdits } from '../Interfaces/Conditions';
import { type ValidateOptions, ValidationSeverity, type IssueFound, BusinessLogicError } from '../Interfaces/Validation';
import { type ValidatorValidateResult, type IValidator, type ValidatorConfig, type IValidatorFactory } from '../Interfaces/Validator';
import { LogDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from '../Interfaces/LoggerService';
import { assertNotNull, assertWeakRefExists, CodingError, ensureError, SevereErrorBase } from '../Utilities/ErrorHandling';
import { IMessageTokenSource, TokenLabelAndValue, toIMessageTokenSource } from '../Interfaces/MessageTokenSource';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { cleanString } from '../Utilities/Utilities';
import { ConditionType } from '../Conditions/ConditionTypes';
import { NameToFunctionMapper } from '../Utilities/NameToFunctionMap';
import { toIValueHostsManagerAccessor } from '../Interfaces/ValueHostsManager';
import { toIInputValueHost } from '../ValueHosts/InputValueHost';
import { IValidationManager, toIValidationManager } from '../Interfaces/ValidationManager';
import { ValidationManager } from './ValidationManager';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { WhenCondition } from '../Conditions/WhenCondition';
import { resolveErrorCode } from '../Utilities/Validation';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';
import { LoggerFacade } from '../Utilities/LoggerFacade';

/**
 * An IValidator implementation that represents a single validator 
 * for the value of an ValidatorsValueHostBase.
 * It is stateless.
 * Basically you want to call validate() to get all of the results
 * of a validation, including ConditionEvaluateResult, error messages,
 * severity, and more.
 * That data ends up in the ValidationManager as part of its state,
 * allowing the system consumer to know how to deal with the data
 * of the ValueHost (save or not) and the UI to display the state.
 * 
 * Each instance depends on a few things, all passed into the constructor
 * and treated as immutable.
 * - IValidatorsValueHostBase - name, label, and values from the consuming system.
 * - ValidatorConfig - The business logic supplies these rules
 *   to implement validation including Condition, Enabler, and error messages
 * If the caller changes any of these, discard the instance
 * and create a new one. The parent ValueHost will restore the state.
 */
export class Validator implements IValidator {
    // As a rule, ValidatorsValueHostBase discards Validator when anything contained in these objects
    // has changed.
    constructor(valueHost: IValidatorsValueHostBase, config: ValidatorConfig) {
        assertNotNull(valueHost, 'valueHost');
        assertNotNull(config, 'config');
        this._valueHost = new WeakRef<IValidatorsValueHostBase>(valueHost);
        this._config = config;
    }
    private readonly _valueHost: WeakRef<IValidatorsValueHostBase>;
    /**
    * The business rules behind this validator.
    */
    protected get config(): ValidatorConfig {
        return this._config;
    }

    protected get services(): IValidationServices {
        return this.validationManager.services;
    }

    protected get valueHost(): IValidatorsValueHostBase {
        assertWeakRefExists(this._valueHost, 'ValueHost disposed');
        return this._valueHost.deref()!;
    }

    protected get validationManager(): IValidationManager {
        let vm = toIValueHostsManagerAccessor(this.valueHost)?.valueHostsManager;
        if (vm) {
            if (vm instanceof ValidationManager || toIValidationManager(vm))
                return vm as IValidationManager;
            throw new CodingError('ValueHost.services must contain IValidationManager');
        }
        /* istanbul ignore next */
        throw new CodingError('ValueHost must implement IValueHostsManagerAccessor');
    }
    /**
     * Always supplied by constructor. Treat it as immutable.
     * Expected to be changed only by the caller (business logic)
     * and at that time, it must replace this instance with 
     * a new one and a new Config instance.
     */
    private readonly _config: ValidatorConfig;

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        function disposeStandardConfigItems(config: ValidatorConfig)
        {
            toIDisposable(config.conditionConfig)?.dispose();
            config.conditionConfig = undefined!;
            config.conditionCreator = undefined;
        }
        toIDisposable(this._condition)?.dispose();
        this._condition = undefined!;
        toIDisposable(this._enabler)?.dispose();
        this._enabler = undefined!;
        disposeStandardConfigItems(this._config);
        toIDisposable(this._config)?.dispose(); // handle anything introduced by alternative implementations if they add dispose()
        (this._config as any) = undefined;
        (this._valueHost as any) = undefined;
        (this._logger as any) = undefined!;        
    }    

    /**
     * Provides an API for logging, sending entries to the loggerService.
     */
    protected get logger(): LoggerFacade
    {
        if (!this._logger)
            this._logger = new LoggerFacade(this.services.loggerService,
                'Validator', this,
                [this.valueHost.getName() ?? 'ValueHost', resolveErrorCode(this.config)],
            false);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;    
    /**
     * Provides the error code associated with this instance.
     * It uses ValidatorConfig.errorCode when assigned
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
     * and supplied in the ValidatorConfig.
     * WhenCondition is a special case. When it is the condition returned, its child Condition is used here
     * as the WhenCondition is more of a container to supply both condition and Enabler with conditions.
     */
    public get condition(): ICondition {
        if (!this._condition) {
            try {
                if (this.config.conditionCreator) {
                    if (this.config.conditionConfig)
                        throw new CodingError('Cannot assign both ConditionConfig and ConditionCreator');
                    this._condition = this.config.conditionCreator(this.config);
                    if (!this._condition)
                        throw new CodingError('ConditionCreator function must return an instance');
                }
                else if (this.config.conditionConfig)
                    this._condition = this.services.conditionFactory.create(this.config.conditionConfig);
                else
                    throw new CodingError('Condition must be setup');
            }
            catch (e) {
                let err = ensureError(e);
                this.logger.error(err);
                throw err;
            }
            if (this._condition instanceof WhenCondition)
            {
                // errors creating these conditions are handled internally
                // and bad conditions get replaced by ErrorResponseCondition
                // so we can continue to execute the validation.
                let { enabler, child } = this._condition.extractConditions(this.validationManager);
                this._condition = child;
                this._enabler = enabler;
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
     * WhenCondition is a special case. When it is the condition returned, its child Condition is used here
     * as the WhenCondition is more of a container to supply both condition and Enabler with conditions.
     */
    protected get enabler(): ICondition | null {
        if (!this._enabler)
            try {
                let temp = this.condition;  // this will assign both _condition and _enabler if using WhenCondition 
            }
            // istanbul ignore next // this.condition is usually called before enabler, leaving its errors handled elsewhere
            catch (e) {
                 // istanbul ignore next
                let err = ensureError(e);
                 // istanbul ignore next
                this.logger.error(err);
                 // istanbul ignore next
                throw err;
            }
        return this._enabler;
    }
    private _enabler: ICondition | null = null;

    /**
     * Determined from the Config.enabled.
     * Does not use the Enabler.
     */
    public get enabled(): boolean {
        let value = this.getFromInstanceState('enabled') ??
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
        let value = this.config.severity;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            switch (this.condition.category) {
                case ConditionCategory.Require:
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
        let direct = this.config.errorMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        let l10n = this.config.errorMessagel10n as string | null;
        if (l10n)
            msg = this.services.textLocalizerService.localize(this.services.cultureService.activeCultureId,
                l10n, msg);
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the errorCode and DataTypeLookupKey.
            msg = this.services.textLocalizerService.getErrorMessage(this.services.cultureService.activeCultureId,
                this.errorCode, this.valueHost.getDataType());
        }
        if (msg == null) {
            msg = Validator.errorMessageMissing;
            this.logger.log(LoggingLevel.Error, () => {
                return {
                    message: `Error message missing for Validator ${this.errorCode}`,
                    category: LoggingCategory.Configuration
                };
            });

        }
        return msg;
    }

    public static readonly errorMessageMissing = '***ERROR MESSAGE MISSING***';

    /**
     * Resolves the summaryMessage as a template - before it has its tokens processed.
     * Falls back to use GetErrorMessageTemplate if Config doesn't supply a value.
     * @returns Error message from summaryMessage property with localization applied
     * if SummaryMessagel10n is setup.
     */
    protected getSummaryMessageTemplate(): string {
        let direct = this.config.summaryMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        let l10n = this.config.summaryMessagel10n as string | null;
        if (l10n)
            msg = this.services.textLocalizerService.localize(this.services.cultureService.activeCultureId,
                l10n, msg ?? '');
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the errorCode and DataTypeLookupKey.
            msg = this.services.textLocalizerService.getSummaryMessage(this.services.cultureService.activeCultureId,
                this.errorCode, this.valueHost.getDataType());
        }
        if (msg == null)
            return this.getErrorMessageTemplate();
        return msg;
    }

    /**
     * Perform validation activity and provide the results including
     * whether there is an error (ConditionEvaluateResult), fully formatted
     * error messages, severity, and Condition type.
     * @param options - Provides guidance on which validators to include.
     * @returns Identifies the ConditionEvaluateResult.
     * If there were any NoMatch cases, they are in the IssuesFound array.
     */
    public validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult> {
        assertNotNull(options, 'options');
        let self = this;
        this.logger.message(LoggingLevel.Debug, () => `Starting Validation for errorcode "${this.errorCode}"`);

        let resultState: ValidatorValidateResult = {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null
        };
        try {
            // options that may bail out
            if (options.preliminary && this.condition.category === ConditionCategory.Require)
                return bailout('Preliminary option skips Category=Require conditions');

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
                let result = enabler.evaluate(this.valueHost, this.validationManager);
                switch (result) {
                    case ConditionEvaluateResult.NoMatch:
                    case ConditionEvaluateResult.Undetermined:
                        return bailout(`Enabler using ${enabler.conditionType} evaluated as ${ConditionEvaluateResult[result]}`);
                }
            }

            if (options.duringEdit && this.supportsDuringEdit()) {
                let ivh = toIInputValueHost(this.valueHost);
                if (ivh) {
                    let text = ivh.getInputValue();
                    if (typeof text === 'string') {
                        this.logger.message(LoggingLevel.Debug, () => 'Using DuringEdit validation');

                        return resolveCER((this.condition as IEvaluateConditionDuringEdits).evaluateDuringEdits(
                            text, ivh, this.services));
                    }
                }
                return bailout('Value intended for evaluateDuringEdits was not a string.');
            }

            let pendingCER = this.condition.evaluate(this.valueHost, this.validationManager);

            if (pendingCER instanceof Promise) {
                // Support Async evaluation by letting evaluate() return a promise
                // When an async process returns, it must take NO action
                // if the state.asyncProcessing is no longer true.
                return processPromise(pendingCER);
            }
            else
                return resolveCER(pendingCER as ConditionEvaluateResult);

        }
        catch (e) {
            let err = ensureError(e);            

            this.logger.error(err);
            if (err instanceof SevereErrorBase)
                throw err;
            
            // resume normal processing with Undetermined state
            resultState.conditionEvaluateResult = ConditionEvaluateResult.Undetermined;
            resultState.issueFound = null;
            return resultState;
        }
        finally {
            if (resultState.issueFound)
                this.logger.log(LoggingLevel.Info, (options?: LogOptions) => {
                    let details: LogDetails = {
                        message: `Validation errorcode "${this.errorCode}" found this issue: ${JSON.stringify(resultState.issueFound)}`,
                        category: LoggingCategory.Result,
                    };
                    if (options?.includeData)
                        details.data = {
                            conditionType: this.conditionType,
                            result: ConditionEvaluateResult[resultState.conditionEvaluateResult],
                            issueFound: resultState.issueFound
                        };
                    return details;
                });

        }
        function resolveCER(cer: ConditionEvaluateResult): ValidatorValidateResult {
            self.logger.log(LoggingLevel.Info, (options? : LogOptions) => {
                let details: LogDetails = {
                    message: `Condition ${self.conditionType} evaluated as ${ConditionEvaluateResult[cer]}`,
                    category: LoggingCategory.Result
                };
                if (options?.includeData)
                    details.data = {
                        conditionType: self.conditionType,
                        result: ConditionEvaluateResult[cer]
                    };
                return details;
            });
            resultState.conditionEvaluateResult = cer;
            switch (cer) {
                case ConditionEvaluateResult.NoMatch:
                    let issueFound = createIssueFound(self.valueHost, self);   // set up for ConditionEvaluateResult.Undetermined
                    issueFound.severity = self.severity;
                    self.updateIssueFoundWhenNoMatch(issueFound, self.valueHost);
                    resultState.issueFound = issueFound;
                    break;
            }
            return resultState;
        }
        function processPromise(promiseCER: Promise<ConditionEvaluateResult>): Promise<ValidatorValidateResult> {
            let wrapperPromise = new Promise<ValidatorValidateResult>((resolve, reject) => {
                promiseCER.then(
                    (resultingCER) => {
                        resolve(resolveCER(resultingCER));
                    },
                    (reason) => {
                        self.logger.error(new Error(reason));
                        reject(reason);
                    });
            });
            return wrapperPromise;
        }
        function bailout(errorMessage: string): ValidatorValidateResult {
            let resultState: ValidatorValidateResult = {
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                issueFound: null
            };
            self.logger.message(LoggingLevel.Info, () => errorMessage);
            resultState.skipped = true;
            return resultState;
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
     * validate() found NoMatch. Update the IssueFound to show
     * the current ConditionEvaluateResult and error messages.
     * @param issueFound - this is a COPY of the IssueFound.
     * Do not modify the actual instance as it is immutable.
     * @param valueHost 
     */
    protected updateIssueFoundWhenNoMatch(issueFound: IssueFound,
        valueHost: IValueHost): void {
        let services = this.services;
        issueFound.severity = this.severity;
        let errorMessage = this.getErrorMessageTemplate();
        issueFound.errorMessage = services.messageTokenResolverService.resolveTokens(
            errorMessage, this.valueHost, this.validationManager, this);
        let summaryMessage = this.getSummaryMessageTemplate();
        issueFound.summaryMessage = summaryMessage ?
            services.messageTokenResolverService.resolveTokens(summaryMessage, this.valueHost, this.validationManager, this) :
            undefined;
    }

    /**
     * When ValueHost.setBusinessLogicError is called, it provides each entry to the existing
     * list of Validators through this. This function determines if the businessLogicError is
     * actually for the same error code as itself, and returns a ValidatorValidateResult, just
     * like calling validate() itself.
     * The idea is to use the UI's representation of the validator, including its error messages
     * with its own tokens, instead of those supplied by the business logic.
     * @param businessLogicError 
     * @returns if null, it did not handle the BusinessLogicError. If a ValidatorValidateResult,
     * it should be used in the ValueHost's state of validation.
     */
    public tryValidatorSwap(businessLogicError: BusinessLogicError): ValidatorValidateResult | null
    {
        if (businessLogicError.errorCode === this.errorCode)
        {
            let issueFound = createIssueFound(this.valueHost, this);   // set up as if ConditionEvaluateResult.Undetermined
            issueFound.severity = this.severity;
            this.updateIssueFoundWhenNoMatch(issueFound, this.valueHost);            
            let resultState: ValidatorValidateResult = {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                issueFound: issueFound
            };
            return resultState;
        }
        return null;
    }
    //#region state management

    /**
     * InstanceState is stored in ValueHost's InstanceState using its saveIntoInstanceStare/getFromInstanceState.
     * Each entry needs to be associated with the errorCode of this Validator
     * and have its own identifier for the value.
     * This function creates a name to use with saveToStore and getFromStore.
     * @param identifier 
     */
    protected nameForInstanceState(identifier: string): string {
        return `_IV[${this.errorCode}].${identifier}`;
    }

    /**
     * Saves an entry into the ValueHostInstanceState.
     * @param identifier - used together with the errorCode to form a key in the instanceState.
     * @param value - value to store. Use undefined to remove existing value.
     */
    protected saveIntoInstanceState(identifier: string, value: ValidTypesForInstanceStateStorage | undefined): void {
        this.valueHost.saveIntoInstanceState(this.nameForInstanceState(identifier), value);
    }

    /**
     * Returns an entry from the ValueHostInstanceState.
     * 
     * Often used to store values that override an entry in the ValidatorConfig.
     * In that case, typical implementation is:
     * let value = this.getFromInstanceState('identifier') ?? this.config.identifier;
     * @param identifier - used together with the errorCode to form a key in the instanceState.
     * @returns The value or undefined if the key is not stored in state.
     */
    protected getFromInstanceState(identifier: string): ValidTypesForInstanceStateStorage | undefined {
        return this.valueHost.getFromInstanceState(this.nameForInstanceState(identifier));
    }
    //#endregion state management

    //#region config overrides

    /**
     * Use to change the enabled flag. It overrides the value from ValidatorConfig.enabled.
     * Use case: the list of validators on ValidatorsValueHostBase might change while the form is active.
     * Add all possible cases to ValidatorsValueHostBase and change their enabled flag here when needed.
     * Also remember that you can use the enabler property on 
     * ValidatorConfig to automatically determine if the validator
     * should run or not. Enabler may not be ideal in some cases though.
     * @param enabled 
     */
    public setEnabled(enabled: boolean): void {
        this.saveIntoInstanceState('enabled', enabled);
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
     * {Value} - the native value in instanceState.Value. If null/undefined, the value in instanceState.LastRawValue.
     * Plus any from the Condition in use.     
     * {DataType} - the name of the data type. Uses values registered with TextLocalizerService and LookupKey enum's strings as a fallback.
     */
    public getValuesForTokens(valueHost: IValidatorsValueHostBase, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let tlv: Array<TokenLabelAndValue> = [
            {
                tokenLabel: 'Label',
                associatedValue: valueHost.getLabel(),
                purpose: 'label'
            },
            {
                tokenLabel: 'Value',
                associatedValue: valueHost.getValue(),
                purpose: 'value'
            },
            {
                tokenLabel: 'DataType',
                associatedValue: valueHost.getDataTypeLabel(),
                purpose: 'message'
            }
        ];
        if (tlv[1].associatedValue === undefined)   // fallback to input value if available
        {
            let ivh = toIInputValueHost(valueHost);
            if (ivh)
                tlv[1].associatedValue = ivh?.getInputValue();
        }
        if (toIMessageTokenSource(this.condition))   // since we cannot test for the IMessageTokenSource interface at runtime
            tlv = tlv.concat((this.condition as unknown as IMessageTokenSource).getValuesForTokens(valueHost, valueHostResolver));
        return tlv;
    }

}


export function createIssueFound(valueHost: IValueHost,
    validator: IValidator): IssueFound {
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
 * ValidatorFactory creates the appropriate IValidator class.
 * It supports the built-in Validator class when ValidatorConfig.validatorType=null/undefined.
 */
export class ValidatorFactory implements IValidatorFactory {

    /**
     * Checks if a validator can be created based on the provided configuration.
     * @param config - The configuration for the validator.
     * @returns A boolean indicating whether the validator can be created.
     */
    public canCreate(config: ValidatorConfig): boolean {
        return config.validatorType == null || this.isRegistered(config.validatorType);
    }
    
    public create(valueHost: IValidatorsValueHostBase, config: ValidatorConfig): IValidator {
        if (config.validatorType == null)   // null or undefined
            return new Validator(valueHost, config);
        let fn = this._map.get(config.validatorType);
        if (fn)
            return fn(config) as IValidator;
        throw new CodingError(`ValidationType not supported: ${config.validatorType}`);        
    }
   // user supplies JSON string or object implementing ValidatorConfig
    // and it returns an instance of IValidator.

    private readonly _map = new NameToFunctionMapper<ValidatorConfig, IValidator>();

    /**
     * Add or replace a function to create an instance of the Validator
     * given a ValidatorConfig.
     * @param validatorType - Unique way to select the function. Uses ValidatorConfig.validatorType.
     * @param fn - Expected to create an instance of a Validator.
     */
    public register<TConfig extends ValidatorConfig>(validatorType: string,
        fn: (config: TConfig) => IValidator): void {
        this._map.register(validatorType, fn as any);
    }

    /**
     * Utility to determine if a ValidatorType has been registered.
     * @param validatorType 
     * @returns 
     */
    public isRegistered(validatorType: string): boolean {
        return this._map.get(validatorType) !== undefined;
    }    

}


//#endregion Factory