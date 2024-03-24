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
  * Attached to InputValueHosts through their InputValueHostDescriptor.
  * @module InputValidator/ConcreteClasses
 */

import { ValueHostId } from '../DataTypes/BasicTypes';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import { toIGatherValueHostIds, type IValueHost } from '../Interfaces/ValueHost';
import { type IValueHostResolver, type IValueHostsManager, toIValueHostsManagerAccessor } from '../Interfaces/ValueHostResolver';
import { type ICondition, ConditionCategory, ConditionEvaluateResult, ConditionEvaluateResultStrings } from '../Interfaces/Conditions';
import type { IInputValueHost } from '../Interfaces/InputValueHost';
import { type ValidateOptions, ValidationSeverity, type IssueFound } from '../Interfaces/Validation';
import type { InputValidateResult, IInputValidator, InputValidatorDescriptor, IInputValidatorFactory, IMessageTokenSource, TokenLabelAndValue  } from '../Interfaces/InputValidator';
import { LoggingLevel, ConfigurationCategory, ValidationCategory } from '../Interfaces/Logger';
import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';

/**
 * An IInputValidator implementation that represents a single validator 
 * for the value of an InputValueHost.
 * It is stateless.
 * Basically you want to call Validate() to get all of the results
 * of a validation, including ValidationResult, error messages,
 * severity, and more.
 * That data ends up in the ValidationManager as part of its state,
 * allowing the system consumer to know how to deal with the data
 * of the ValueHost (save or not) and the UI to display the state.
 * 
 * Each instance depends on a few things, all passed into the constructor
 * and treated as immutable.
 * - IInputValueHost - ID, label, and values from the consuming system.
 * - InputValidatorDescriptor - The business logic supplies these rules
 *   to implement validation including Condition, Enabler, and error messages
 * If the caller changes any of these, discard the instance
 * and create a new one. The IInputValidatorState will restore the state.
 */
export class InputValidator implements IInputValidator {
    // As a rule, InputValueHost discards InputValidator when anything contained in these objects
    // has changed.
    constructor(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor) {
        assertNotNull(valueHost, 'valueHost');
        assertNotNull(descriptor, 'descriptor');
        this._valueHost = valueHost;
        this._descriptor = descriptor;
    }
    private readonly _valueHost: IInputValueHost;
    /**
    * The business rules behind this validator.
    */
    protected get Descriptor(): InputValidatorDescriptor {
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
        let vh = toIValueHostsManagerAccessor(this.ValueHost)?.ValueHostsManager;
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
    private readonly _descriptor: InputValidatorDescriptor;


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
                    this._condition = this.Services.ConditionFactory.create(this.Descriptor.ConditionDescriptor);
                else
                    throw new Error('Condition must be setup');
            }
            catch (e)
            {
                if (e instanceof Error)
                    this.Services.LoggerService.log(e.message, LoggingLevel.Error, ConfigurationCategory, this.getLogSourceText());
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
                    this._enabler = this.Services.ConditionFactory.create(this.Descriptor.EnablerDescriptor);
            }
            catch (e)
            {
                if (e instanceof Error)
                    this.Services.LoggerService.log(e.message, LoggingLevel.Error, ConfigurationCategory, this.getLogSourceText());
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
     * It uses several sources to get the template. The first to have text is used.
     * 1. Descriptor.ErrorMessagel10n gets data from TextLocalizerService with Descriptor.ErrorMessage as fallback
     * 2. Descriptor.ErrorMessage
     * 3. TextLocalizerService.GetErrorMessage
     * @returns Error message from ErrorMessage property with localization applied
     * if ErrorMessagel10n is setup.
     */
    protected getErrorMessageTemplate(): string {
        let direct = this.Descriptor.ErrorMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        if (this.Descriptor.ErrorMessagel10n)
            msg = this.Services.TextLocalizerService.localize(this.Services.ActiveCultureId,
                this.Descriptor.ErrorMessagel10n, msg);
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the ConditionType and DataTypeLookupKey.
            msg = this.Services.TextLocalizerService.getErrorMessage(this.Services.ActiveCultureId,
                this.Condition.ConditionType, this.ValueHost.getDataType());
        }
        if (msg == null)
            throw new Error('Must supply a value for Descriptor.ErrorMessage');
        return msg;
    }

    /**
     * Resolves the SummaryMessage as a template - before it has its tokens processed.
     * Falls back to use GetErrorMessageTemplate if Descriptor doesn't supply a value.
     * @returns Error message from SummaryMessage property with localization applied
     * if SummaryMessagel10n is setup.
     */
    protected getSummaryMessageTemplate(): string {
        let direct = this.Descriptor.SummaryMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        if (this.Descriptor.SummaryMessagel10n)
            msg = this.Services.TextLocalizerService.localize(this.Services.ActiveCultureId,
                this.Descriptor.SummaryMessagel10n, msg ?? '');
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the ConditionType and DataTypeLookupKey.
            msg = this.Services.TextLocalizerService.getSummaryMessage(this.Services.ActiveCultureId,
                this.Condition.ConditionType, this.ValueHost.getDataType());
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

        let resultState: InputValidateResult = {
            ConditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            IssueFound: null
        };
        try {
            // options that may bail out
            if (options.Preliminary && this.Condition.Category === ConditionCategory.Required)
                return bailout('Preliminary option skips Required conditions');

            if (options.DuringEdit && this.Condition.Category !== ConditionCategory.Required)
                return bailout('DuringEdit option limited to Required conditions');
                
            // enabled
            if (!this.Enabled)
                return bailout('Descriptor.Enabled is false');

            // enabler
            let enabler = this.Enabler;
            if (enabler) { // Many enablers don't use the current value host.
                // When that is the case, their ConditionDescriptor.ValueHostId
                // must be setup to retrieve the correct one.
                // ValueHostId takes precedence.
                let result = enabler.evaluate(this.ValueHost, this.ValueHostsManager);         
                switch (result) {
                    case ConditionEvaluateResult.NoMatch:
                    case ConditionEvaluateResult.Undetermined:
                        return bailout(`Enabler evaluated as ${ConditionEvaluateResultStrings[result]}`);
                }
            }

            let pendingCER = this.Condition.evaluate(this.ValueHost, this.ValueHostsManager);

            if (pendingCER instanceof Promise) {
            // Support Async evaluation by letting Evaluate return a promise
            // When an async process returns, it must take NO action
            // if the value of State.ValidationResult is not still AsyncProcessing.
                return processPromise(pendingCER);
            }
            else
                return resolveCER(pendingCER as ConditionEvaluateResult);

        }
        catch (e)
        {
            if (e instanceof Error)
                logError(e.message);
            // resume normal processing with Undetermined state
            resultState.ConditionEvaluateResult = ConditionEvaluateResult.Undetermined;
            resultState.IssueFound = null;
            return resultState;
        }
        finally {
            logInfo(() => {
                return {
                    message: `Condition result: ${ConditionEvaluateResultStrings[resultState.ConditionEvaluateResult]} Issue found: ` +
                        JSON.stringify(resultState)
                };
            });
        }
        function resolveCER(cer: ConditionEvaluateResult): InputValidateResult {
            logInfo(() => {
                return {
                    message: `Condition evaluated as ${ConditionEvaluateResultStrings[cer]}`
                };
            });
            resultState.ConditionEvaluateResult = cer;
            switch (cer) {
                case ConditionEvaluateResult.NoMatch:
                    let issueFound = createIssueFound(self.ValueHost, self);   // setup for ValidationResult.Undetermined
                    issueFound.Severity = self.Severity;
                    self.updateStateForNoMatch(issueFound, self.ValueHost);
                    resultState.IssueFound = issueFound;
                    break;
            }
            return resultState;
        }        
        function processPromise(promiseCER: Promise<ConditionEvaluateResult>): Promise<InputValidateResult>
        {
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
        function bailout(errorMessage: string): InputValidateResult
        {
            let resultState: InputValidateResult = {
                ConditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                IssueFound: null
            };
            logInfo(() => {
                return {
                    message: errorMessage
                };
            });
            resultState.Skipped = true;
            return resultState;                    
        }
        function logInfo(
            fn: () => { message: string; source?: string })
        {
            if (self.Services.LoggerService.MinLevel >= LoggingLevel.Info)
            {
                let parms = fn();
                self.Services.LoggerService.log(parms.message, LoggingLevel.Info,
                    ValidationCategory,
                    parms.source ?? `Validation with ${self.getLogSourceText()}`);
            }
        }
        function logError(message: string): void
        {
            self.Services.LoggerService.log('Exception: ' + (message ?? 'Reason unspecified'),
                LoggingLevel.Error, ValidationCategory, self.getLogSourceText());            
        }
    }

    /**
     * Validate found NoMatch. Update the InputValidatorState's properties to show
     * the current ValidationResult and error messages.
     * @param stateToUpdate - this is a COPY of the State, as supplied by UpdateState.
     * Do not modify the actual instance as it is immutable.
     * @param value 
     */
    protected updateStateForNoMatch(stateToUpdate: IssueFound,
        value: IValueHost): void {
        let services = this.Services;
        stateToUpdate.Severity = this.Severity;
        let errorMessage = this.getErrorMessageTemplate();
        stateToUpdate.ErrorMessage = services.MessageTokenResolverService.resolveTokens(
            errorMessage, this.ValueHost, this.ValueHostsManager, this);
        let summaryMessage = this.getSummaryMessageTemplate();
        stateToUpdate.SummaryMessage = summaryMessage ?
            services.MessageTokenResolverService.resolveTokens(summaryMessage, this._valueHost, this.ValueHostsManager, this) :
            undefined;
    }

    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        toIGatherValueHostIds(this.Condition)?.gatherValueHostIds(collection, valueHostResolver);
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
    public getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let tlv: Array<TokenLabelAndValue> = [
            {
                TokenLabel: 'Label',
                AssociatedValue: valueHost.getLabel(),
                Purpose: 'label'
            },
            {
                TokenLabel: 'Value',
                AssociatedValue: valueHost.getValue() ?? this._valueHost.getInputValue(),
                Purpose: 'value'
            }
        ];
        if ((<any>this.Condition)['getValuesForTokens'])   // since we cannot test for the IMessageTokenSource interface at runtime
            tlv = tlv.concat((this.Condition as unknown as IMessageTokenSource).getValuesForTokens(valueHost, valueHostResolver));
        return tlv;
    }

    protected getLogSourceText(): string
    {
        return `InputValidator on ValueHost ${this._valueHost.getId()}`;
    }
}


export function createIssueFound(valueHost: IValueHost,
    validator: IInputValidator): IssueFound {
    return {
        ValueHostId: valueHost.getId(),
        ConditionType: validator.Condition.ConditionType,
        Severity: ValidationSeverity.Error,
        ErrorMessage: '',
        SummaryMessage: undefined
    };
}

//#region Factory

/**
 * InputValidatorFactory creates the appropriate IInputValidator class
 */
export class InputValidatorFactory implements IInputValidatorFactory {
    public create(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor): IInputValidator {
        return new InputValidator(valueHost, descriptor);
    }
}


//#endregion Factory
