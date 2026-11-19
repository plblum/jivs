/**
 * Asynchronous validator for performing validation that may involve asynchronous operations.
 * 
 * @module jivs-engine/Validation/ConcreteClasses/AsyncValidator
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { AsyncValidatorConfig, AsyncValidatorEvaluationResult } from '../Interfaces/AsyncValidator';
import { ConditionCategory, ConditionEvaluateResult, ICondition } from '../Interfaces/Conditions';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggingService';
import { IssueFound, ValidateOptions, ValidationSeverity } from '../Interfaces/Validation';
import type { ValidatorValidateResult } from '../Interfaces/Validator';
import { IValidatorsValueHost } from '../Interfaces/ValidatorsValueHostBase';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { encodeHtml } from '../Services/HtmlMessageTokenResolverService';
import { assertNotEmptyString, assertNotNull, CodingError, ensureError } from '../Utilities/ErrorHandling';
import { Validator } from './Validator';
import { ValidatorBase } from './ValidatorBase';

/**
 * An asynchronous implementation of the IValidator interface.
 * This class is intended to perform validation that may involve asynchronous operations.
 * 
 * See {@see jivs-engine/Validation/Types/AsyncValidator} for usage details.
 */
export class AsyncValidator extends ValidatorBase<AsyncValidatorConfig>
{

    constructor(valueHost: IValidatorsValueHost, config: AsyncValidatorConfig)
    {
        super(valueHost, config);
        assertNotEmptyString(config.handlerIdentity);
        assertNotNull(config.handler);

        this._condition = new InternalConditionForAsyncValidator(config.handlerIdentity);
    }


    public get errorCode(): string
    {
        return this.config.handlerIdentity;
    }
    protected resolveErrorCodeForLogger(): string
    {
        return this.config.handlerIdentity
    }

    public get conditionType(): string
    {
        return this.config.handlerIdentity;
    }
    private _condition: ICondition;
    public get condition(): ICondition
    {
        return this._condition;
    }

    public override dispose(): void
    {
        this._disposed = true;
        super.dispose();
        this._condition = undefined as any;
    }
    private _disposed = false;

    public validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult>
    {
        assertNotNull(options);
        if (!this.enabled || options.preliminary || options.duringEdit)
            return {
                issueFound: null,
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                skipped: true
            };

        const handlerIdentity = this.config.handlerIdentity;
        const disposalSurvivingLogger = this.logger;
        let tempAbortSignal = new AbortController().signal; //!!! REPLACE WHEN FORMALLY CODED AbortController
        const handlerResult = new Promise<AsyncValidatorEvaluationResult>(resolve => {
            resolve(this.config.handler(this.valueHost, this.valueHostsManager, tempAbortSignal));
        });
        return handlerResult.then(
            result => {
                if (this._disposed)
                {
                    if (result.failedToResolve)
                        disposalSurvivingLogger.error(result.failedToResolve);
                    return {
                        issueFound: null,
                        conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                        skipped: true
                    };
                }
                return this.resolveValidationResult(result);
            },
            error => {
                const originalError = ensureError(error);
                throw new CodingError(
                    `Async validator "${handlerIdentity}" handler failed to resolve: ${originalError.message}`,
                    { cause: originalError }
                );
            }
        );
    }

    protected resolveValidationResult(result: AsyncValidatorEvaluationResult): ValidatorValidateResult
    {
        const identity = this.config.handlerIdentity;

        if (result.failedToResolve)
        {
            this.logger.error(result.failedToResolve);
            return {
                issueFound: null,
                conditionEvaluateResult: result.conditionEvaluateResult,
                failedToResolve: result.failedToResolve
            };
        }
        switch (result.conditionEvaluateResult)
        {
            case ConditionEvaluateResult.NoMatch:
                if (!result.errorMessage)
                    throw new CodingError(`Validator ${identity} must return an error message for NoMatch condition`);
                if (!result.errorCode)
                    throw new CodingError(`Validator ${identity} must return an error code for NoMatch condition`);
                let errorMessage = this.resolveErrorMessage(result);
                let severity = this.resolveSeverity(result.severity);
                let issueFound = this.createIssueFound();
                issueFound.doNotSave = severity !== ValidationSeverity.Warning;
                issueFound.errorCode = result.errorCode ?? this.errorCode;
                issueFound.errorMessage = errorMessage;
                issueFound.summaryMessage = errorMessage;
                issueFound.severity = severity;
                return {
                    issueFound: issueFound,
                    conditionEvaluateResult: result.conditionEvaluateResult
                };
                break;
            default:
                return {
                    issueFound: null,
                    conditionEvaluateResult: result.conditionEvaluateResult
                }
        }
    }

    /**
     * Resolves the errorMessage using localization based on errorCode and resolving tokens.
     * @returns Error message from errorMessage property with localization applied
     * if ErrorMessagel10n is setup.
     */
    protected resolveErrorMessage(result: AsyncValidatorEvaluationResult): string {
        const identity = this.config.handlerIdentity;
        let cultureId = this.valueHostsManager.behaviors.activeCultureId!;
        let errorCode = result.errorCode ?? this.errorCode;

        let msg = this.services.errorMessagesService.getErrorMessage(cultureId,
            errorCode, this.valueHost.getDataType()) ?? result.errorMessage;

        if (msg == null) {
            msg = Validator.errorMessageMissing;
            this.logger.log(LoggingLevel.Error, () => {
                return {
                    message: `Error message missing for Validator ${identity} using this error code ${errorCode}`,
                    category: LoggingCategory.Configuration
                };
            });

        }
        msg = encodeHtml(msg);
        msg = this.services.messageTokenResolverService.resolveTokens(
            msg, this.valueHost, this.valueHostsManager, this);                
            
        return msg;
    }

    protected override updateIssueFoundWhenNoMatch(issueFound: IssueFound, valueHost: IValueHost): void
    {
        issueFound.errorMessage = this.services.messageTokenResolverService.resolveTokens(
            issueFound.errorMessage, this.valueHost, this.valueHostsManager, this);       
    }
    

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void
    {
        // config.dependencyValueHostNames contains the names of value hosts this validator depends on
        for (const name of this.config.dependencyValueHostNames ?? [])
            collection.add(name);
    }

    /**
     * No way to map an external issue found to this async validator, always returns null.
     * External issues are the result of things performed outside of this async validator and cannot be mapped back to it.
     * @param externalIssueFound 
     * @returns 
     */
    public override tryValidatorSwap(externalIssueFound: IssueFound): ValidatorValidateResult | null
    {
        if (externalIssueFound.asyncIdentity != null && // null/undefined
            externalIssueFound.asyncIdentity === this.config.handlerIdentity)
        {
            const issueFound = this.createIssueFound();   // set up as if ConditionEvaluateResult.Undetermined
            issueFound.severity = this.resolveSeverity(externalIssueFound.severity);
            issueFound.errorMessage = externalIssueFound.errorMessage;
            issueFound.summaryMessage = externalIssueFound.summaryMessage;
            issueFound.doNotSave = externalIssueFound.doNotSave || externalIssueFound.severity !== ValidationSeverity.Warning;
            issueFound.errorCode = externalIssueFound.errorCode ?? this.errorCode;
            const resultState: ValidatorValidateResult = {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                issueFound: issueFound
            };
            return resultState;
        }
        return null;
    }
    /**
     * Creates a base representation of an issue found for an async validator.
     * @param valueHost 
     * @returns 
     */
    protected createIssueFound(): IssueFound {
        return {
            asyncIdentity: this.config.handlerIdentity,
            valueHostName: this.valueHost.getName(),
            severity: ValidationSeverity.Error,
            errorMessage: '',
            doNotSave: true
        };
    }

}

/**
 * A stub of a condition that lets consumers of AsyncValidator 
 * provide a condition's API for non-validation purposes of
 * ConditionType and Category. Those have fixed values.
 */
class InternalConditionForAsyncValidator implements ICondition
{
    constructor (conditionType: string) 
    {
        assertNotEmptyString(conditionType);
        this._conditionType = conditionType;
    }   
    get conditionType(): string
    {
        return this._conditionType;
    }
    private _conditionType: string;

    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult
    {
        throw new Error('Method not implemented.');
    }
    public get category(): ConditionCategory
    {
        return ConditionCategory.Async; // sorts after all standard conditions, including Undetermined
    }
    // Implementation of InternalCondition goes here
}