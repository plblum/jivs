/**
 * A ValueHost that uses the Validator class to provide validation.
 * @module jivs-engine/ValueHosts/AbstractClasses/ValidatorsValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { LoggingLevel } from '../Interfaces/LoggingService';
import { objectKeysCount, cleanString } from '../Utilities/Utilities';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionCategory, ConditionEvaluateResult, ICondition } from '../Interfaces/Conditions';
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, ValidationSeverity, IssueFound } from '../Interfaces/Validation';
import { IValidator, ValidatorConfig, ValidatorType } from '../Interfaces/Validator';
import { assertNotEmptyString, assertNotNull } from '../Utilities/ErrorHandling';
import
    {
        ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState,
        IValidatorsValueHost, ValidatorsValueHostSetValueOptions,
        type InjectedError, InjectedErrorValidatorErrorCode
    } from '../Interfaces/ValidatorsValueHostBase';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { ConditionType } from '../Conditions/ConditionTypes';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { IValueHost } from '../Interfaces/ValueHost';
import { ErrorMessagesService } from '../Services/ErrorMessagesService';
import { resolveErrorCode } from '../Utilities/Validation';
import { AsyncValidatorConfig, isAsyncValidatorConfig } from '../Interfaces/AsyncValidator';
import { ValueHostValidationRunner } from './ValueHostValidationRunner';
import { LoggingFacade } from '../Utilities/LoggingFacade';

/**
 * Standard implementation of IValidatorsValueHost. It owns a list of Validators
 * which support its validate() function.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - valueHostsManager 
* - ValidatorsValueHostBaseConfig - The business logic supplies these rules
*   to implement a ValueHost's name, label, data type, validation rules,
*   and other business logic metadata.
* - ValidatorsValueHostBaseInstanceState - InstanceState used by this ValidatorsValueHostBase including
    its validators.
* If the caller changes any of these, discard the instance
* and create a new one.
 */
export abstract class ValidatorsValueHostBase<TConfig extends ValidatorsValueHostBaseConfig,
    TState extends ValidatorsValueHostBaseInstanceState,
    TOptions extends ValidatorsValueHostSetValueOptions = ValidatorsValueHostSetValueOptions>
    extends ValidatableValueHostBase<TConfig, TState, TOptions>
    implements IValidatorsValueHost<TOptions> {
    constructor(valueHostsManager: IValueHostsManager, config: TConfig, state: TState) {
        super(valueHostsManager, config, state);
    }

    // Version token for validation runs: async results may update the host only
    // while their captured generation matches this one. New runs, value changes,
    // clearing validation, and disposal invalidate older results; they do not
    // cancel the underlying async operations.
    private _validationGeneration = 0;

    /** Identifies the current validation run and changes when it is invalidated. */
    public get validationGeneration(): number {
        return this._validationGeneration;
    }

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public override dispose(): void
    {
        this._validationGeneration++;
        this.config.validatorConfigs = undefined!;
        super.dispose();
        this._validators?.forEach((validator) => { validator.dispose(); });
        this._validators = undefined!;
        this._injectedValidator = null;
    }

    protected override additionalInstanceStateUpdatesOnSetValue(stateToUpdate: TState, valueChanged: boolean, options: TOptions): void
    {
        super.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, valueChanged, options);
        if (valueChanged)
        {
            this._validationGeneration++;
            delete stateToUpdate.asyncProcessing;
        }
        if (stateToUpdate.injectedError || options?.injectedError)
            this._injectedErrorGeneration++;
        if (options && options.injectedError)
            stateToUpdate.injectedError = options.injectedError;
        else
            delete stateToUpdate.injectedError;
    }

    //#endregion IFieldValueHost


    protected override clearValidationDataFromInstanceState(stateToUpdate: TState): void
    {
        this._validationGeneration++;
        if (stateToUpdate.injectedError)
            this._injectedErrorGeneration++;
        super.clearValidationDataFromInstanceState(stateToUpdate);
        delete stateToUpdate.injectedError;
    }

    /**
     * Extends the rules for determining the validation status to 
     * return ValidationStatus.Failed if the ValueHost is enabled and either the status is Failed
     */
    public override get validationStatus(): ValidationStatus
    {
        if (this.isEnabled() && (this.instanceState.status === ValidationStatus.Failed ||
            this.instanceState.failedAsyncIdentities?.length))
            return ValidationStatus.Failed;
        return super.validationStatus;
    }

    /**
     * Returns the InjectedError supplied by the latest call to setTextValue() or setValues().
     * Its null when not supplied or has been cleared.
     */
    public getInjectedError(): InjectedError | null
    {
        return this.instanceState.injectedError ?? null;
    }
    /**
     * Attaches the InjectedError to this ValidatorsValueHostBase. It will be used to create a Validator
     * to report the error. If you supply an errorCode, it will be used to localize the error message.
     * If not supplied, know that ErrorMessagesService will use the errorCode value of 'InjectedError'
     * to localize the error message. You can also provide a summaryMessage for use in a summary of validation errors.
     * 
     * Alternatively use the options.injectedError property when calling setTextValue() or setValues() 
     * to provide a way to inject.
     * @param injectedError 
     */
    public setInjectedError(injectedError: InjectedError): void
    {
        assertNotNull(injectedError, 'injectedError');
        this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.injectedError = injectedError;
            this._injectedErrorGeneration++;
            return stateToUpdate;
        }, this);
    }

    /**
     * Clears the InjectedError from this ValidatorsValueHostBase. It will no longer be used to create a Validator
     * to report the error.
     */
    public clearInjectedError(): void
    {
        if (this.instanceState.injectedError) {
            this.updateInstanceState((stateToUpdate) => {
                delete stateToUpdate.injectedError;
                this._injectedErrorGeneration++;
                return stateToUpdate;
            }, this);
        }
    }

    /**
     * Determines if this ValueHost handles validation for a specific error code.
     * @param errorCode 
     */
    protected handlesErrorCode(errorCode: string): boolean
    {
        return this.getValidator(errorCode) !== null;
    }

    /**
     * Runs validation against some of all validators.
     * If at least one validator was NoMatch, it returns ValueHostValidateResult
     * with all of the NoMatches in issuesFound.
     * If all were Matched, it returns ValueHostValidateResult.Value and issuesFound=null.
     * If there are no validators, or all validators were skipped (disabled),
     * it returns ValidationStatus.Undetermined.
     * If an async validator fails to resolve, its identity is retained and the
     * host reports ValidationStatus.Failed until that validator completes successfully.
     * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * 
     * When called an it is disabled, it clears existing data and returns null.
     * If the enabled state changes, the user must call validate again to get the new state.
     * 
     * @param options - Provides guidance on which validators to include.
     * @returns Non-null when there is something to report. null if there was nothing to evaluate
     * which includes all existing validators reporting "Undetermined"
     */
    public validate(options?: ValidateOptions): ValueHostValidateResult | null {
        if (!this.isEnabled())
        {
            this.clearValidation();
            this.logger.message(LoggingLevel.Debug, () => `Validation skipped because ValueHost "${this.getName()}" is disabled`);
            return null;
        }
        options ??= {};
        this.logger.message(LoggingLevel.Debug, () => `Validating ValueHost "${this.getName()}"`);
        if (!this.groupsMatch(options.group, false)) {
            const message = `Group names do not match "${options.group}" vs "${this.config.group as any}"`;
            this.logger.message(LoggingLevel.Info, () => message);
            return null;
        }

        const runGeneration = ++this._validationGeneration;
        const run = new ValueHostValidationRunner<TState>({
            getState: (): TState => this.instanceState,
            getGeneration: (): number => this._validationGeneration,
            invalidateGeneration: (): void => { this._validationGeneration++; },
            getValidators: (): IValidator[] => this.validators(),
            getLogger: (): LoggingFacade => this.logger,
            updateState: (updater): boolean => this.updateInstanceState(updater, this),
            setStatus: (state, status): void => { this.setInstanceStateStatus(state, status); },
            notify: (runOptions): void => { this.invokeOnValueHostValidationStateChanged(runOptions); }
        }, options, runGeneration);
        return run.execute();
    }

    //#region validation
    /**
     * Provides the list of IValidator instances derived
     * from the ValidatorConfigs. Lazy loads the instances.
     */
    protected validators(): Array<IValidator> {
        if (this._validators === null)
            this._validators = this.orderValidators(this.generateValidators());
        this.resolveInjectedErrorValidator(this._validators);
        return this._validators;
    }
    // populated by Validators() when null. Set to null by UpdateValueHostConfig
    // to account for changes made there.
    private _validators: Array<IValidator> | null = null;
    // InjectedError becomes the first Validator in _validators, which is a cache
    // that is expected to be retained for the rest of the lifecycle.
    // An InjectedErrorValidator doesn't have the same lifecycle needs.
    // It needs to be discarded and re-added whenever the injected error changes.
    private _injectedErrorGeneration = 0;
    private _resolvedInjectedErrorGeneration = -1;
    private _injectedValidator: IValidator | null = null;

    /**
     * Determines if this ValidatorsValueHostBase has any asynchronous validators.
     * @returns True if there are async validators, false otherwise.
     */
    public get hasAsyncValidators(): boolean {
        if (this._hasAsyncValidators === undefined) {
            this._hasAsyncValidators = this.config.validatorConfigs?.some(v => isAsyncValidatorConfig(v)) ?? false;
        }
        return this._hasAsyncValidators;
    }
    private _hasAsyncValidators: boolean | undefined = undefined;

    /**
     * Keeps the first validator aligned with the current injected error without
     * replacing the configured validators.
     */
    protected resolveInjectedErrorValidator(validators: Array<IValidator>): void
    {
        if (this._resolvedInjectedErrorGeneration === this._injectedErrorGeneration)
            return;

        if (this._injectedValidator)
        {
            validators.shift();
            this._injectedValidator.dispose();
            this._injectedValidator = null;
        }

        let injectedError = this.getInjectedError();
        if (injectedError)
        {
            let validatorConfig: ValidatorConfig = this.createValConfigFromInjectedError(injectedError);
            this._injectedValidator = this.services.validatorFactory.create(this, validatorConfig);
            validators.unshift(this._injectedValidator);
        }
        this._resolvedInjectedErrorGeneration = this._injectedErrorGeneration;
    }   
    protected createValConfigFromInjectedError(injectedError: InjectedError): ValidatorConfig
    {
        let errorCode = injectedError.errorCode ?? InjectedErrorValidatorErrorCode;
        return {
            validatorType: ValidatorType.Validator,
            conditionCreator: (valConfig) => new InjectedErrorCondition(),
            conditionConfig: null,
            errorCode: errorCode, // may be null
            errorMessage: injectedError.errorMessage,
            errorMessagel10n: injectedError.errorMessagel10n ?? ErrorMessagesService.getErrorMessagel10nText(errorCode, null),
            summaryMessage: injectedError.summaryMessage,
            summaryMessagel10n: injectedError.summaryMessagel10n ?? ErrorMessagesService.getSummaryMessagel10nText(errorCode, null),
            // always severe since its blocking. It stops further processing of validators, and the user must fix it before continuing.
            severity: ValidationSeverity.Severe
        };
    }   

    /**
     * Generates an array of all Validators from ValueHostConfig.validatorConfigs.
     * Sorts the by Category so Require is always first, DataTypeCheck is just after Require.
     * @returns 
     */
    protected generateValidators(): Array<IValidator> {
        const factory = this.services.validatorFactory;
        const validators: Array<IValidator> = [];
        this.config.validatorConfigs?.forEach((valDesc) => {
            const pv = factory.create(this, valDesc);
            validators.push(pv);
        });
        return validators;
    }

    /**
     * Validators are sorted so category=Require comes first and category=DataTypeCheck second.
     * AsyncValidators have category=Async, which is last, ensuring they
     * will always be ordered after standard validators.
     * @param unordered 
     * @returns 
     */
    protected orderValidators(unordered: Array<IValidator>): Array<IValidator> {
        const fn = (a: IValidator, b: IValidator): number => a.condition.category - b.condition.category;
         /* istanbul ignore if */
        if (unordered.toSorted)    // recently introduced API, so provide fallback
            return unordered.toSorted(fn);
        else        /* istanbul ignore next */ // we don't run our unit tests in pre-ES2016 mode required to test this.
            return unordered.sort(fn);
    }

    /*
    * Standard validators may replace external issues using their error code.
    * Async issues replace an existing validator issue only when their identities match.
    */
    public override addExternalIssueFound(error: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean
    {
        if (error) {
            if (!this.isEnabled())
            {
                this.logger.message(LoggingLevel.Warn, () => `IssueFound applied on disabled ValueHost "${this.getName()}"`);                
            }
        
            const asyncIdentity = error.asyncIdentity;
            if (asyncIdentity != null &&
                !this.instanceState.issuesFound?.some(issue => issue.asyncIdentity === asyncIdentity))
                return super.addExternalIssueFound(error, determinedLocally, options);

            // If the issue aligns to a validator, create that validator's IssueFound shape instead.
            // From this point on, the issue is treated as a validator result, not as an external issue.
            // That means validator semantics apply, including the validator's doNotSave behavior.
            // The external IssueFound likely starts with doNotSave = false
            if (error.errorCode || asyncIdentity != null)
                for (let i = 0; i < this.validators().length; i++) {
                    const validator = this.validators()[i];
                    const valResult = validator.tryValidatorSwap(error);
                    if (valResult &&
                        (asyncIdentity == null || valResult.issueFound?.asyncIdentity === asyncIdentity)) {
                // We are replacing the external issue with a validator-owned IssueFound.
                // Preserve an explicit severity override from the external issue, and if that
                // override makes the issue a warning, also make it non-blocking.
                        if (error.severity !== undefined) {
                            valResult.issueFound!.severity = error.severity;
                            if (error.severity == ValidationSeverity.Warning)
                                valResult.issueFound!.doNotSave = false;
                        }

                        const changed = this.updateInstanceState((stateToUpdate) => {
                            let replacementIndex = -1;
                            if (!stateToUpdate.issuesFound)
                              /* istanbul ignore next */ // defensive. Current code always sets this up
                                stateToUpdate.issuesFound = [];
                            // replace if the same issuefound exists
                            for (let issueIndex = 0; issueIndex < stateToUpdate.issuesFound.length; issueIndex++)
                            {
                                const issueFound = stateToUpdate.issuesFound[issueIndex];
                                if (asyncIdentity != null)
                                {
                                    if (issueFound.asyncIdentity === asyncIdentity)
                                    {
                                        replacementIndex = issueIndex;
                                        break;
                                    }
                                    continue;
                                }
                                if (issueFound.asyncIdentity == null && issueFound.errorCode === error.errorCode) {
                                    replacementIndex = issueIndex;
                                    break;
                                }
                            }

                            if (replacementIndex === -1)
                                stateToUpdate.issuesFound.push(valResult.issueFound!);
                            else
                                stateToUpdate.issuesFound[replacementIndex] = valResult.issueFound!;
                            const onlyWarnings = asyncIdentity != null &&
                                stateToUpdate.issuesFound.every(issue => issue.severity === ValidationSeverity.Warning);
                            this.setInstanceStateStatus(stateToUpdate,
                                onlyWarnings ? ValidationStatus.Valid : ValidationStatus.Invalid);
                            //NOTE: leave stateToUpdate.group and asyncProcessing alone
                            return stateToUpdate;
                        }, this);
                        if (changed) {
                            this.invokeOnValueHostValidationStateChanged(options);
                        }
                        return changed;
                    }
                }
        }
        return super.addExternalIssueFound(error, determinedLocally, options);        
    }

    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        const validators = this.validators();
        for (const validator of validators)
            validator.gatherValueHostNames(collection, valueHostResolver);
    }

    /**
     * Gets an Validator already assigned to this ValidatorsValueHostBase.
     * @param errorCode - Same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The Validator or null if the condition type does not match.
     */
    public getValidator(errorCode: string): IValidator | null {
        const ec = cleanString(errorCode);
        if (ec)
            for (const iv of this.validators())
                if (iv.errorCode === ec)
                    return iv;
        return null;
    }
}


export abstract class ValidatorsValueHostBaseGenerator extends ValidatableValueHostBaseGenerator {

    /**
     * Looking for changes to the ValidationConfigs to impact IssuesFound.
     * If IssuesFound did change, fix ValidationStatus for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationStatus Valid.
     * @param state 
     * @param config 
     */
    public cleanupInstanceState(state: ValidatorsValueHostBaseInstanceState, config: ValidatorsValueHostBaseConfig): void {
        assertNotNull(state, 'state');
        assertNotNull(config, 'config');
        let configChanged = false;
        let oldStateCount = 0;
        let issuesFound: Array<IssueFound> | null = null;

        if (state.failedAsyncIdentities?.length)
        {
            const configuredIdentities = new Set<string>();
            config.validatorConfigs?.forEach(valConfig => {
                if (isAsyncValidatorConfig(valConfig))
                {
                    const identity = (valConfig as AsyncValidatorConfig).handlerIdentity;
                    assertNotEmptyString(identity, 'handlerIdentity');
                    configuredIdentities.add(identity);
                }
            });
            const retained = state.failedAsyncIdentities.filter(identity => configuredIdentities.has(identity));
            if (retained.length !== state.failedAsyncIdentities.length)
            {
                if (retained.length)
                    state.failedAsyncIdentities = retained;
                else
                {
                    delete state.failedAsyncIdentities;
                    if (state.status !== ValidationStatus.Invalid)
                        state.status = ValidationStatus.NeedsValidation;
                }
            }
        }
        if (state.asyncProcessing)
        {
            delete state.asyncProcessing;
            delete state.corrected;
            if (state.status !== ValidationStatus.Failed)
                state.status = ValidationStatus.NeedsValidation;
        }

        if (state.issuesFound) {
            const oldState = state.issuesFound;

            config.validatorConfigs?.forEach((valConfig) =>
            {
                let found: IssueFound | undefined;
                if (isAsyncValidatorConfig(valConfig))
                {
                    const identity = 'handlerIdentity' in valConfig ? valConfig.handlerIdentity : undefined;
                    assertNotEmptyString(identity, 'handlerIdentity');
                    found = oldState.find(value => value.asyncIdentity != null && value.asyncIdentity === identity);
                    if (!found)
                        return;
                }
                else
                {
                    let errorCode: string | null = cleanString(valConfig.errorCode);
                    const vc = valConfig as ValidatorConfig;
                    if (!errorCode && vc.conditionConfig)
                        errorCode = vc.conditionConfig.conditionType;
                    else if (vc.conditionCreator)
                    {
                        const cond = vc.conditionCreator(vc);   // return null is actually a configuration bug reported to the user in Validator.Condition
                        if (cond)
                            errorCode = cond.conditionType;
                    }
                    if (!errorCode)
                        /* istanbul ignore next */  // defensive. Current code always establishes an error code
                        errorCode = ConditionType.Unknown;
                    found = oldState.find(value => value.asyncIdentity == null && value.errorCode === errorCode);
                }
                if (found) {
                    if (!issuesFound)
                        issuesFound = [];
                    issuesFound.push(found);
                    oldStateCount++;
                }
                else
                    configChanged = true;
            });
        }
        if (!configChanged && (oldStateCount === objectKeysCount(state.issuesFound)))
            return;

        state.issuesFound = issuesFound as (Array<IssueFound> | null);
        // fix validation result for when validation had occurred
        if (state.status === ValidationStatus.Invalid) {
            let vr = ValidationStatus.NeedsValidation;
            let warningFound = false;
            if (issuesFound) {
                for (const issueFound of state.issuesFound!) {
                    if (issueFound.severity !== ValidationSeverity.Warning) {
                        vr = ValidationStatus.Invalid;
                        break;
                    }
                    else
                        warningFound = true;
                }
                if (warningFound && vr === ValidationStatus.NeedsValidation)
                    vr = ValidationStatus.Valid;
            }
            state.status = vr;
            delete state.lastStatus;
        }
    }

}


/**
 * Internally managed Condition that is used to represent an injected error when
 * the ValidatorsValueHostBase has an injected error. It is used to provide a ConditionEvaluateResult.NoMatch.
 * Expected to be created by code within ValidatorsValueHostBase.validate()
 * only when the injectedError is present.
 */
class InjectedErrorCondition implements ICondition
{
    constructor()
    {
    }
    public get conditionType(): string
    {
        return InjectedErrorValidatorErrorCode;
    }
    public get category(): ConditionCategory
    {
        return ConditionCategory.Undetermined;
    }
    public evaluate(valueHost: IValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult
    {
        return ConditionEvaluateResult.NoMatch;
    }

}
