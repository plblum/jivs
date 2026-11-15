/**
 * Represents the base class for all validators, providing common functionality and structure.
  * @module jivs-engine/Validation/AbstractClasses/ValidatorBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import
    {
        type ICondition, ConditionCategory, ConditionEvaluateResult
    } from '../Interfaces/Conditions';
import { toIDisposable } from '../Interfaces/General_Purpose';
import type { IJivsServices } from '../Interfaces/JivsServices';
import { IMessageTokenSource, TokenLabelAndValue, toIMessageTokenSource } from '../Interfaces/MessageTokenSource';
import { type IssueFound, type ValidateOptions, ValidationSeverity } from '../Interfaces/Validation';
import { type IValidator, type ValidatorValidateResult, ValidatorConfigBase } from '../Interfaces/Validator';
import { IValidatorsValueHost } from '../Interfaces/ValidatorsValueHostBase';
import { type IValueHost, ValidTypesForInstanceStateStorage } from '../Interfaces/ValueHost';
import type { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IValueHostsManager, toIValueHostsManager, toIValueHostsManagerAccessor } from '../Interfaces/ValueHostsManager';
import { CodingError, assertNotNull, assertWeakRefExists } from '../Utilities/ErrorHandling';
import { LoggingFacade } from '../Utilities/LoggingFacade';
import { toIFieldValueHost } from '../ValueHosts/FieldValueHost';
import { ValueHostsManager } from './ValueHostsManager';

/**
 * Abstract base class for validators.
 * 
 * An IValidator implementation that represents a single validator 
 * for the value of an ValidatorsValueHostBase.
 * It is stateless.
 * Basically you want to call validate() to get all of the results
 * of a validation, including ConditionEvaluateResult, error messages,
 * severity, and more.
 * That data ends up in the ValueHostsManager as part of its state,
 * allowing the system consumer to know how to deal with the data
 * of the ValueHost (save or not) and the UI to display the state.
 * 
 * Each instance depends on a few things, all passed into the constructor
 * and treated as immutable.
 * - IValidatorsValueHost - name, label, and values from the consuming system.
 * - ValidatorConfig - The business logic supplies these rules
 *   to implement validation including Condition, Enabler, and error messages
 * If the caller changes any of these, discard the instance
 * and create a new one. The parent ValueHost will restore the state.
 */
export abstract class ValidatorBase<TConfig extends ValidatorConfigBase> implements IValidator {
    // As a rule, ValidatorsValueHostBase discards Validator when anything contained in these objects
    // has changed.
    constructor(valueHost: IValidatorsValueHost, config: TConfig) {
        assertNotNull(valueHost, 'valueHost');
        assertNotNull(config, 'config');
        this._valueHost = new WeakRef<IValidatorsValueHost>(valueHost);
        this._config = config;
    }
    private readonly _valueHost: WeakRef<IValidatorsValueHost>;
    /**
    * The business rules behind this validator.
    */
    protected get config(): TConfig {
        return this._config;
    }

    protected get services(): IJivsServices {
        return this.valueHostsManager.services;
    }

    protected get valueHost(): IValidatorsValueHost {
        assertWeakRefExists(this._valueHost, 'ValueHost disposed');
        return this._valueHost.deref()!;
    }

    protected get valueHostsManager(): IValueHostsManager {
        const vhm = toIValueHostsManagerAccessor(this.valueHost)?.valueHostsManager;
        if (vhm) {
            if (vhm instanceof ValueHostsManager || toIValueHostsManager(vhm))
                return vhm as IValueHostsManager;
            throw new CodingError('ValueHost.valueHostsManager must contain IValueHostsManager');
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
    private readonly _config: TConfig;

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        toIDisposable(this._config)?.dispose(); // handle anything introduced by alternative implementations if they add dispose()
        (this._config as any) = undefined;
        (this._valueHost as any) = undefined;
        (this._logger as any) = undefined!;        
    }    

    /**
     * Provides an API for logging, sending entries to the loggingService.
     */
    protected get logger(): LoggingFacade
    {
        if (!this._logger)
            this._logger = new LoggingFacade(this.services.loggingService,
                'Validator', this,
                [this.valueHost.getName() ?? 'ValueHost', this.resolveErrorCodeForLogger()],
            false);
        return this._logger;
    }
    private _logger: LoggingFacade | null = null;    

    protected abstract resolveErrorCodeForLogger(): string;

    /**
     * The validator's issue identifier.
     * Uses ValidatorConfig.errorCode when assigned,
     * otherwise ConditionType.
     */
    public abstract get errorCode(): string;

    /**
     * Condition used to validate the data.
     * Run by validate(), but only if the Validator is enabled (severity<>Off and Enabler == Match)
     * The actual Condition instance is created by the caller
     * and supplied in the ValidatorConfig.
     * WhenCondition is a special case. When it is the condition returned, its child Condition is used here
     * as the WhenCondition is more of a container to supply both condition and Enabler with conditions.
     */
    public abstract get condition(): ICondition

    /**
     * Gets the conditionType associated with the condition
     */
    public abstract get conditionType(): string;

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
     * Addresses the severity offered taking into account a function source
     * and undefined value, which uses the condition's category to determine the default severity.
     */
    protected resolveSeverity(value: ValidationSeverity | ((validator: this) => ValidationSeverity) | null | undefined): ValidationSeverity {
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
     * Perform validation activity and provide the results including
     * whether there is an error (ConditionEvaluateResult), fully formatted
     * error messages, severity, and Condition type.
     * @param options - Provides guidance on which validators to include.
     * @returns Identifies the ConditionEvaluateResult.
     * If there were any NoMatch cases, they are in the IssuesFound array.
     */
    public abstract validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult>;


    /**
     * validate() found NoMatch. Update the IssueFound to show
     * the current ConditionEvaluateResult and error messages.
     * @param issueFound - this is a COPY of the IssueFound.
     * Do not modify the actual instance as it is immutable.
     * @param valueHost 
     */
    protected abstract updateIssueFoundWhenNoMatch(issueFound: IssueFound,
        valueHost: IValueHost): void;

    /**
     * Creates a validator-aligned IssueFound when the supplied issue has the same errorCode.
     * This does not execute validation logic.
     * @param externalIssueFound 
     * @returns null when the issue does not align to this validator.
     * Returns a ValidatorValidateResult that can be stored in validator-owned state when it does.
     */
    public tryValidatorSwap(externalIssueFound: IssueFound): ValidatorValidateResult | null
    {
        if (externalIssueFound.errorCode === this.errorCode)
        {
            const issueFound = createIssueFound(this.valueHost, this);   // set up as if ConditionEvaluateResult.Undetermined
            issueFound.severity = this.resolveSeverity(this.config.severity);
            this.updateIssueFoundWhenNoMatch(issueFound, this.valueHost);
            const resultState: ValidatorValidateResult = {
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
    public abstract gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void;

    /**
     * Returns an array of 0 or more tokens supported by this MessageTokenSource.
     * Each returned has the token supported (omitting {} so {Label} is "Label")
     * and the value in its native data type (such as Date, number, or string).
     * Supports these tokens:
     * {Label} - the Config.label property verbatim
     * {Value} - the native value in instanceState.Value. If null/undefined, the value in instanceState.LastRawValue.
     * Plus any from the Condition in use.     
     * {DataType} - the name of the data type. Uses values registered with ErrorMessagesService and LookupKey enum's strings as a fallback.
     */
    public getValuesForTokens(valueHost: IValidatorsValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
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
            const ivh = toIFieldValueHost(valueHost);
            if (ivh)
                tlv[1].associatedValue = ivh?.getTextValue();
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
