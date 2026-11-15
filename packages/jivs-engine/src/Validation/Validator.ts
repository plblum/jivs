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
  * @module jivs-engine/Validation/ConcreteClasses
 */

import { ConditionType } from '../Conditions/ConditionTypes';
import { WhenCondition } from '../Conditions/WhenCondition';
import { ValueHostName } from '../DataTypes/BasicTypes';
import
    {
        type ICondition,
        ConditionEvaluateResult,
        IEvaluateConditionDuringEdits, toIEvaluateConditionDuringEdits
    } from '../Interfaces/Conditions';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { LogDetails, LogOptions, LoggingCategory, LoggingLevel } from '../Interfaces/LoggingService';
import { type IssueFound, type ValidateOptions, ValidationSeverity } from '../Interfaces/Validation';
import { type IValidator, type ValidatorConfig, type ValidatorValidateResult } from '../Interfaces/Validator';
import { IValidatorsValueHost } from '../Interfaces/ValidatorsValueHostBase';
import { type IValueHost, toIGatherValueHostNames } from '../Interfaces/ValueHost';
import type { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { CodingError, SevereErrorBase, assertNotNull, ensureError } from '../Utilities/ErrorHandling';
import { cleanString } from '../Utilities/Utilities';
import { resolveErrorCode } from '../Utilities/Validation';
import { toIFieldValueHost } from '../ValueHosts/FieldValueHost';
import { ValidatorBase } from './ValidatorBase';

/**
 * A validator that uses a Condition object to evaluate its values.
 * Its configuration supplies:
 * - The Condition object that defines the validation rule.
 * - Error Code, or if not supplied, ConditionType is used.
 * - Error messages to display when the validation fails.
 * - Severity level of the validation issue.
 * - Enabler conditions and other rules to control when the validator is active.
 */
export class Validator extends ValidatorBase<ValidatorConfig> {
    // As a rule, ValidatorsValueHostBase discards Validator when anything contained in these objects
    // has changed.
    constructor(valueHost: IValidatorsValueHost, config: ValidatorConfig) {
        super(valueHost, config);
    }
 

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public override dispose(): void
    {
        function disposeStandardConfigItems(config: ValidatorConfig): void
        {
            toIDisposable(config.conditionConfig)?.dispose();
            config.conditionConfig = undefined!;
            config.conditionCreator = undefined;
        }
        disposeStandardConfigItems(this.config);        
        toIDisposable(this._condition)?.dispose();
        this._condition = undefined!;
        toIDisposable(this._enabler)?.dispose();
        this._enabler = undefined!; 
        super.dispose();        
    }    

    /**
     * The validator's issue identifier.
     * Uses ValidatorConfig.errorCode when assigned,
     * otherwise ConditionType.
     */
    public get errorCode(): string
    {
        return cleanString(this.config.errorCode) ?? this.conditionType;
    }
    protected resolveErrorCodeForLogger(): string
    {
        // avoids resolving this.errorCode because it can recursively this.condition.
        return resolveErrorCode(this.config);
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
                const err = ensureError(e);
                this.logger.error(err);
                throw err;
            }
            if (this._condition instanceof WhenCondition)
            {
                // errors creating these conditions are handled internally
                // and bad conditions get replaced by ErrorResponseCondition
                // so we can continue to execute the validation.
                const { whenToEnableCondition: enabler, thenCondition: child } = this._condition.extractConditions(this.valueHostsManager);
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const temp = this.condition;  // this will assign both _condition and _enabler if using WhenCondition 
            }
            // istanbul ignore next // this.condition is usually called before enabler, leaving its errors handled elsewhere
            catch (e) {
                 // istanbul ignore next
                const err = ensureError(e);
                 // istanbul ignore next
                this.logger.error(err);
                 // istanbul ignore next
                throw err;
            }
        return this._enabler;
    }
    private _enabler: ICondition | null = null;

    /**
     * Resolves the errorMessage as a template - before it has its tokens processed.
     * It uses several sources to get the template. The first to have text is used.
     * 1. Config.errorMessagel10n gets data from ErrorMessagesService with Config.errorMessage as fallback
     * 2. Overridden Config.errorMessage or Config.errorMessage
     * 3. ErrorMessagesService.getErrorMessage
     * @returns Error message from errorMessage property with localization applied
     * if ErrorMessagel10n is setup.
     */
    protected getErrorMessageTemplate(): string {
        let direct = this.config.errorMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let cultureId = this.valueHostsManager.behaviors.activeCultureId!;
        let msg = direct as string | null;
        const l10n = this.config.errorMessagel10n as string | null;
        if (l10n)
            msg = this.services.errorMessagesService.localize(cultureId,
                l10n, msg);
        if (msg == null)  // null/undefined
        {// fallback: see if ErrorMessagesService has an entry specific to the errorCode and DataTypeLookupKey.
            msg = this.services.errorMessagesService.getErrorMessage(cultureId,
                this.errorCode, this.valueHost.getDataType()) ?? null;
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
        let cultureId = this.valueHostsManager.behaviors.activeCultureId!;
        let msg = direct as string | null;
        const l10n = this.config.summaryMessagel10n as string | null;
        if (l10n)
            msg = this.services.errorMessagesService.localize(cultureId,
                l10n, msg ?? '');
        if (msg == null)  // null/undefined
        {// fallback: see if ErrorMessagesService has an entry specific to the errorCode and DataTypeLookupKey.
            msg = this.services.errorMessagesService.getSummaryMessage(cultureId,
                this.errorCode, this.valueHost.getDataType()) ?? null;
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
        const self = this;
        this.logger.message(LoggingLevel.Debug, () => `Starting Validation for errorcode "${this.errorCode}"`);

        const resultState: ValidatorValidateResult = {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null
        };
        try {
            // options that may bail out
            if (options.duringEdit && !this.supportsDuringEdit())
                return bailout('DuringEdit option limited to conditions that implement IEvaluateConditionDuringEdits');

            // enabled
            if (!this.enabled)
                return bailout('Config.enabled is false');

            // enabler
            const enabler = this.enabler;
            if (enabler) { // Many enablers don't use the current value host.
                // When that is the case, their ConditionConfig.valueHostName
                // must be setup to retrieve the correct one.
                // ValueHostName takes precedence.
                const result = enabler.evaluate(this.valueHost, this.valueHostsManager);
                switch (result) {
                    case ConditionEvaluateResult.NoMatch:
                    case ConditionEvaluateResult.Undetermined:
                        return bailout(`Enabler using ${enabler.conditionType} evaluated as ${ConditionEvaluateResult[result]}`);
                }
            }

            if (options.duringEdit && this.supportsDuringEdit()) {
                const ivh = toIFieldValueHost(this.valueHost);
                if (ivh) {
                    const text = ivh.getTextValue();
                    if (typeof text === 'string') {
                        this.logger.message(LoggingLevel.Debug, () => 'Using DuringEdit validation');

                        return resolveCER((this.condition as IEvaluateConditionDuringEdits).evaluateDuringEdits(
                            text, ivh, this.services));
                    }
                }
                return bailout('Value intended for evaluateDuringEdits was not a string.');
            }

            const pendingCER = this.condition.evaluate(this.valueHost, this.valueHostsManager);

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
            const err = ensureError(e);            

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
                    const details: LogDetails = {
                        message: `Validation errorcode "${this.errorCode}" found this issue: ${JSON.stringify(resultState.issueFound)}`,
                        category: LoggingCategory.Result
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
                const details: LogDetails = {
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
                    const issueFound = createIssueFound(self.valueHost, self);   // set up for ConditionEvaluateResult.Undetermined
                    issueFound.severity = self.resolveSeverity(self.config.severity);
                    self.updateIssueFoundWhenNoMatch(issueFound, self.valueHost);
                    resultState.issueFound = issueFound;
                    break;
            }
            return resultState;
        }
        function processPromise(promiseCER: Promise<ConditionEvaluateResult>): Promise<ValidatorValidateResult> {
            const wrapperPromise = new Promise<ValidatorValidateResult>((resolve, reject) => {
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
            const resultState: ValidatorValidateResult = {
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
        const services = this.services;
        issueFound.severity = this.resolveSeverity(this.config.severity);
        const errorMessage = this.getErrorMessageTemplate();
        issueFound.errorMessage = services.messageTokenResolverService.resolveTokens(
            errorMessage, this.valueHost, this.valueHostsManager, this);
        const summaryMessage = this.getSummaryMessageTemplate();
        issueFound.summaryMessage = summaryMessage ?
            services.messageTokenResolverService.resolveTokens(summaryMessage, this.valueHost, this.valueHostsManager, this) :
            issueFound.errorMessage;
        issueFound.doNotSave = issueFound.severity !== ValidationSeverity.Warning; // default to blocking save for errors, but not warnings. This can be overridden by the caller by directly setting doNotSave on the IssueFound.
    }


    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        toIGatherValueHostNames(this.condition)?.gatherValueHostNames(collection, valueHostResolver);
    }
}


export function createIssueFound(valueHost: IValueHost,
    validator: IValidator): IssueFound {
    return {
        valueHostName: valueHost.getName(),
        errorCode: validator.errorCode,
        severity: ValidationSeverity.Error,
        errorMessage: '',
        summaryMessage: undefined,
        doNotSave: true
    };
}

/**
 * Determines the highest severity level from a list of issues.
 *
 * @param issues - An array of `IssueFound` objects or null. If null or an empty array is provided, the function returns null.
 * @returns The highest `ValidationSeverity` found in the issues array, or null if the array is empty or null.
 */
export function highestSeverity(issues: IssueFound[] | null): ValidationSeverity | null {
    if (!issues || issues.length === 0)
        return null;
    let severity: ValidationSeverity = ValidationSeverity.Warning;
    for (const issue of issues) {
        if (issue.severity == null)  // null/undefined
            issue.severity = ValidationSeverity.Error; // default severity
        if (issue.severity > severity)
            severity = issue.severity;
        if (severity === ValidationSeverity.Severe) // optimization
            return severity;
    }
    return severity;
}   
