import { ValueHostId } from "../DataTypes/BasicTypes";
import { ValidationGroupsMatch } from "../Utilities/Utilities";
import type { IValidationServices } from "../Interfaces/ValidationServices";
import { ToIGatherValueHostIds, type IValueHost } from "../Interfaces/ValueHost";
import { type IValueHostResolver, type IValueHostsManager, ToIValueHostsManagerAccessor } from "../Interfaces/ValueHostResolver";
import { type ICondition, ConditionCategory, ConditionEvaluateResult, ConditionEvaluateResultStrings } from "../Interfaces/Conditions";
import type { IInputValueHost } from "../Interfaces/InputValueHost";
import { type IValidateOptions, ValidationSeverity, type IIssueFound } from "../Interfaces/Validation";
import type { IInputValidateResult, IInputValidator, IInputValidatorDescriptor, IInputValidatorFactory, IMessageTokenSource, ITokenLabelAndValue  } from "../Interfaces/InputValidator";
import { LoggingLevel, ConfigurationCategory, ValidationCategory } from "../Interfaces/Logger";
import { AssertNotNull, CodingError } from "../Utilities/ErrorHandling";

/**
 * An IInputValidator implementation represents a single validator 
 * for the value of an InputValueHost.
 * It is stateless.
 * Basically you want to call Validate() to get all of the results
 * of a validation, including ValidationResult, error messages,
 * severity, and more.
 * That data ends up in the ValidationManager as part of its state,
 * allowing the system consumer to know how to deal with the data
 * of the ValueHost (save or not) and the UI to display the state.
 */


/**
 * Standard implementation of IInputValidator
 * Each instance depends on a few things, all passed into the constructor
 * and treated as immutable.
 * - IInputValueHost - ID, label, and values from the consuming system.
 * - IInputValidatorDescriptor - The business logic supplies these rules
 *   to implement validation including Condition, Enabler, and error messages
 * If the caller changes any of these, discard the instance
 * and create a new one. The IInputValidatorState will restore the state.
 */
export class InputValidator implements IInputValidator {
    // As a rule, InputValueHost discards InputValidator when anything contained in these objects
    // has changed.
    constructor(valueHost: IInputValueHost, descriptor: IInputValidatorDescriptor) {
        AssertNotNull(valueHost, 'valueHost');
        AssertNotNull(descriptor, 'descriptor');
        this._valueHost = valueHost;
        this._descriptor = descriptor;
    }
    private _valueHost: IInputValueHost;
    /**
    * The business rules behind this validator.
    */
    protected get Descriptor(): IInputValidatorDescriptor {
        return this._descriptor;
    }

    protected get Services(): IValidationServices {
        return this.ValueHostsManager.Services;
    }

    protected get ValueHost(): IInputValueHost
    {
        return this._valueHost;
    }

    protected get ValueHostsManager(): IValueHostsManager
    {
        let vh = ToIValueHostsManagerAccessor(this.ValueHost)?.ValueHostsManager;
        if (vh)
            return vh;
        throw new CodingError('ValueHost must implement IValueHostsManagerAccessor');
    }
    /**
     * Always supplied by constructor. Treat it as immutable.
     * Expected to be changed only by the caller (business logic)
     * and at that time, it must replace this instance with 
     * a new one and a new Descriptor instance.
     */
    private _descriptor: IInputValidatorDescriptor;


    /**
     * Condition used to validate the data.
     * Run by Validate, but only if the Validator is enabled (Severity<>Off and Enabler == Match)
     * The actual Condition instance is created by the caller
     * and supplied in the InputValidatorDescriptor.
     */
    public get Condition(): ICondition {
        if (!this._condition) {
            try {
                if (this.Descriptor.ConditionCreator) {
                    if (this.Descriptor.ConditionDescriptor)
                        throw new Error('Cannot assign both ConditionDescriptor and ConditionCreator');
                    this._condition = this.Descriptor.ConditionCreator(this.Descriptor);
                    if (!this._condition)
                        throw new Error('ConditionCreator function must return an instance');
                }
                else if (this.Descriptor.ConditionDescriptor)
                    this._condition = this.Services.ConditionFactory.Create(this.Descriptor.ConditionDescriptor);
                else
                    throw new Error('Condition must be setup');
            }
            catch (e)
            {
                if (e instanceof Error)
                    this.Services.LoggerService.Log(e.message, LoggingLevel.Error, ConfigurationCategory, this.GetLogSourceText());
                throw e;
            }
        }
        return this._condition!;
    }
    private _condition: ICondition | null = null;

    /**
     * Condition used to enable or disable this validator based on rules.
     * Severity = Off takes precedence.
     */
    protected get Enabler(): ICondition | null {
        if (!this._enabler)
            try {
                if (this.Descriptor.EnablerCreator) {
                    if (this.Descriptor.EnablerDescriptor)
                        throw new Error('Cannot assign both EnablerDescriptor and EnablerCreator');                    
                    this._enabler = this.Descriptor.EnablerCreator(this.Descriptor);
                    if (!this._enabler)
                        throw new Error('EnablerCreator function must return an instance');
                }
                else if (this.Descriptor.EnablerDescriptor)
                    this._enabler = this.Services.ConditionFactory.Create(this.Descriptor.EnablerDescriptor);
            }
            catch (e)
            {
                if (e instanceof Error)
                    this.Services.LoggerService.Log(e.message, LoggingLevel.Error, ConfigurationCategory, this.GetLogSourceText());
                throw e;
            }
        return this._enabler;
    }
    private _enabler: ICondition | null = null;

    /**
     * Determined from the Descriptor.Enabled.
     * Does not use the Enabler.
     */
    public get Enabled(): boolean {
        let value = this.Descriptor.Enabled;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            return true;
        return value;
    }

    /**
     * Determines if the supplied group or group(s) matches the Descriptor.Group.
     * When there is an array, it just requires an intersection of the group names.
     * @param group 
     */
    protected GroupMatch(group: string | Array<string> | undefined | null): boolean {
        return ValidationGroupsMatch(group, this.Descriptor.Group);
    }

    /**
     * Determined from Descriptor.Severity.
     */
    protected get Severity(): ValidationSeverity {
        let value = this.Descriptor.Severity;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            switch (this.Condition.Category)
            {
                case ConditionCategory.Required:
                case ConditionCategory.DataTypeCheck:
                    return ValidationSeverity.Severe;
                default:
                    return ValidationSeverity.Error;
            }

        return value;
    }

    /**
     * Resolves the ErrorMessage as a template - before it has its tokens processed.
     * @returns 
     */
    protected GetErrorMessageTemplate(): string {
        let value = this.Descriptor.ErrorMessage;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            throw new Error('Must supply a value for Descriptor.ErrorMessage');
        return value;
    }

    /**
     * Resolves the SummaryErrorMessage as a template - before it has its tokens processed.
     * Falls back to use GetErrorMessageTemplate if Descriptor doesn't supply a value.
     * @returns 
     */
    protected GetSummaryErrorMessageTemplate(): string {
        let value = this.Descriptor.SummaryErrorMessage;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)
            return this.GetErrorMessageTemplate();
        return value;
    }

    /**
     * Perform validation activity and provide the results including
     * whether there is an error (ValidationResult), fully formatted
     * error messages, severity, and Condition type.
     * @param options - Provides guidance on which validators to include.
     * @returns Identifies the ConditionEvaluateResult.
     * If there were any NoMatch cases, they are in the IssuesFound array.
     */
    public Validate(options: IValidateOptions): IInputValidateResult {
        AssertNotNull(options, 'options');
        let resultState: IInputValidateResult = {
            ConditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            IssueFound: null
        };
        try {
            // options that may bail out
            if (options.Preliminary && this.Condition.Category === ConditionCategory.Required)
                return Bailout(this, 'Preliminary option skips Required conditions');

            if (options.DuringEdit && this.Condition.Category !== ConditionCategory.Required)
                return Bailout(this, 'DuringEdit option limited to Required conditions');
                
            // enabled
            if (!this.Enabled)
                return Bailout(this, 'Descriptor.Enabled is false');

            // validation groups
            if (!this.GroupMatch(options.Group))
                return Bailout(this, `Group names do not match "${options.Group}" vs "${this.Descriptor.Group?.toString()}"`);

            // enabler
            let enabler = this.Enabler;
            if (enabler) { // Many enablers don't use the current value host.
                // When that is the case, their ConditionDescriptor.ValueHostId
                // must be setup to retrieve the correct one.
                // ValueHostId takes precedence.
                let result = enabler.Evaluate(this.ValueHost, this.ValueHostsManager);         
                switch (result) {
                    case ConditionEvaluateResult.NoMatch:
                    case ConditionEvaluateResult.Undetermined:
                        return Bailout(this, `Enabler evaluated as ${ConditionEvaluateResultStrings[result]}`);
                }
            }
            //!!!PENDING Support Async evaluation by letting Evaluate return a promise
            // When an async process returns, it must take NO action
            // if the value of State.ValidationResult is not still AsyncProcessing.

            let cer = this.Condition.Evaluate(this.ValueHost, this.ValueHostsManager);
            LogInfo(this, () => {
                    return {
                        message: `Condition evaluated as ${ConditionEvaluateResultStrings[cer]}`,
                    }
            });            
            resultState.ConditionEvaluateResult = cer;
            switch (cer) {
                case ConditionEvaluateResult.NoMatch:
                    let issueFound = CreateIssueFound(this.ValueHost, this);   // setup for ValidationResult.Undetermined
                    issueFound.Severity = this.Severity;
                    this.UpdateStateForNoMatch(issueFound, this.ValueHost);
                    resultState.IssueFound = issueFound;
                    break;
            }
            return resultState;
        }
        catch (e)
        {
            if (e instanceof Error)
                this.Services.LoggerService.Log('Exception: ' + e.message,
                    LoggingLevel.Error, ValidationCategory, this.GetLogSourceText())
            // resume normal processing with Undetermined state
            resultState.ConditionEvaluateResult = ConditionEvaluateResult.Undetermined;
            resultState.IssueFound = null;
            return resultState;
        }
        finally {
            LogInfo(this, () => {
                return {
                    message: `Condition result: ${ConditionEvaluateResultStrings[resultState.ConditionEvaluateResult]} Issue found: ` +
                        (resultState ? JSON.stringify(resultState) : 'none'),
                }
            });
        }
        function Bailout(self: InputValidator, errorMessage: string): IInputValidateResult
        {
            let resultState: IInputValidateResult = {
                ConditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                IssueFound: null
            };
            LogInfo(self, () => {
                return {
                    message: errorMessage,
                }
            });
            resultState.Skipped = true;
            return resultState;                    
        }
        function LogInfo(self: InputValidator,
            fn: () => { message: string, source?: string })
        {
            if (self.Services.LoggerService.MinLevel >= LoggingLevel.Info)
            {
                let parms = fn();
                self.Services.LoggerService.Log(parms.message, LoggingLevel.Info,
                    ValidationCategory,
                    parms.source ?? `Validation with ${self.GetLogSourceText()}`);
            }
        }
    }

    /**
     * Validate found NoMatch. Update the InputValidatorState's properties to show
     * the current ValidationResult and error messages.
     * @param stateToUpdate - this is a COPY of the State, as supplied by UpdateState.
     * Do not modify the actual instance as it is immutable.
     * @param value 
     */
    protected UpdateStateForNoMatch(stateToUpdate: IIssueFound,
        value: IValueHost): void {
        let services = this.Services;
        stateToUpdate.Severity = this.Severity;
        let errorMessage = this.GetErrorMessageTemplate();
        stateToUpdate.ErrorMessage = services.MessageTokenResolverService.ResolveTokens(
            errorMessage, this.ValueHost, this.ValueHostsManager, this);
        let summaryErrorMessage = this.GetSummaryErrorMessageTemplate();
        stateToUpdate.SummaryErrorMessage = summaryErrorMessage ?
            services.MessageTokenResolverService.ResolveTokens(summaryErrorMessage, this._valueHost, this.ValueHostsManager, this) :
            undefined;
    }

    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public GatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        ToIGatherValueHostIds(this.Condition)?.GatherValueHostIds?.(collection, valueHostResolver);
    }
        
    /**
     * Returns an array of 0 or more tokens supported by this MessageTokenSource.
     * Each returned has the token supported (omitting {} so {Label} is "Label")
     * and the value in its native data type (such as Date, number, or string).
     * Supports these tokens:
     * {Label} - the Descriptor.Label property verbatim
     * {Value} - the native value in State.Value. If null/undefined, the value in State.LastRawValue.
     * Plus any from the Condition in use.     
     */
    public GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<ITokenLabelAndValue> {
        let tlv: Array<ITokenLabelAndValue> = [
            {
                TokenLabel: 'Label',
                AssociatedValue: valueHost.GetLabel(),
                Purpose: 'label'
            },
            {
                TokenLabel: 'Value',
                AssociatedValue: valueHost.GetValue() ?? this._valueHost.GetInputValue(),
                Purpose: 'value'
            }
        ];
        if ((<any>this.Condition)['GetValuesForTokens'])   // since we cannot test for the IMessageTokenSource interface at runtime
            tlv = tlv.concat((this.Condition as unknown as IMessageTokenSource).GetValuesForTokens(valueHost, valueHostResolver));
        return tlv;
    }

    protected GetLogSourceText(): string
    {
        return `InputValidator on ValueHost ${this._valueHost.GetId()}`;
    }
}


export function CreateIssueFound(valueHost: IValueHost,
    validator: IInputValidator): IIssueFound {
    return {
        ValueHostId: valueHost.GetId(),
        ConditionType: validator.Condition.ConditionType,
        Severity: ValidationSeverity.Error,
        ErrorMessage: '',
        SummaryErrorMessage: undefined
    }
}

//#region Factory

/**
 * InputvalidatorFactory is a system-wide singleton declared in
 * valGlobals with SetInputValidatorFactory.
 */
export class InputValidatorFactory implements IInputValidatorFactory {
    public Create(valueHost: IInputValueHost, descriptor: IInputValidatorDescriptor): IInputValidator {
        return new InputValidator(valueHost, descriptor);
    }
}


//#endregion Factory
