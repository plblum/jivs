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
import { type ICondition, ConditionCategory, ConditionEvaluateResult, ConditionEvaluateResultStrings, toIEvaluateConditionDuringEdits, IEvaluateConditionDuringEdits } from '../Interfaces/Conditions';
import type { IInputValueHost } from '../Interfaces/InputValueHost';
import { type ValidateOptions, ValidationSeverity, type IssueFound } from '../Interfaces/Validation';
import { type InputValidateResult, type IInputValidator, type InputValidatorDescriptor, type IInputValidatorFactory, type IMessageTokenSource, type TokenLabelAndValue, toIMessageTokenSource  } from '../Interfaces/InputValidator';
import { LoggingLevel, ConfigurationCategory, ValidationCategory } from '../Interfaces/Logger';
import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';

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
    protected get descriptor(): InputValidatorDescriptor {
        return this._descriptor;
    }

    protected get services(): IValidationServices {
        return this.valueHostsManager.services;
    }

    protected get valueHost(): IInputValueHost
    {
        return this._valueHost;
    }

    protected get valueHostsManager(): IValueHostsManager
    {
        let vh = toIValueHostsManagerAccessor(this.valueHost)?.valueHostsManager;
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
     * Run by validate(), but only if the Validator is enabled (Severity<>Off and Enabler == Match)
     * The actual Condition instance is created by the caller
     * and supplied in the InputValidatorDescriptor.
     */
    public get condition(): ICondition {
        if (!this._condition) {
            try {
                if (this.descriptor.conditionCreator) {
                    if (this.descriptor.conditionDescriptor)
                        throw new Error('Cannot assign both ConditionDescriptor and ConditionCreator');
                    this._condition = this.descriptor.conditionCreator(this.descriptor);
                    if (!this._condition)
                        throw new Error('ConditionCreator function must return an instance');
                }
                else if (this.descriptor.conditionDescriptor)
                    this._condition = this.services.conditionFactory.create(this.descriptor.conditionDescriptor);
                else
                    throw new Error('Condition must be setup');
            }
            catch (e)
            {
                if (e instanceof Error)
                    this.services.loggerService.log(e.message, LoggingLevel.Error, ConfigurationCategory, this.getLogSourceText());
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
    protected get enabler(): ICondition | null {
        if (!this._enabler)
            try {
                if (this.descriptor.enablerCreator) {
                    if (this.descriptor.enablerDescriptor)
                        throw new Error('Cannot assign both EnablerDescriptor and EnablerCreator');                    
                    this._enabler = this.descriptor.enablerCreator(this.descriptor);
                    if (!this._enabler)
                        throw new Error('EnablerCreator function must return an instance');
                }
                else if (this.descriptor.enablerDescriptor)
                    this._enabler = this.services.conditionFactory.create(this.descriptor.enablerDescriptor);
            }
            catch (e)
            {
                if (e instanceof Error)
                    this.services.loggerService.log(e.message, LoggingLevel.Error, ConfigurationCategory, this.getLogSourceText());
                throw e;
            }
        return this._enabler;
    }
    private _enabler: ICondition | null = null;

    /**
     * Determined from the Descriptor.Enabled.
     * Does not use the Enabler.
     */
    public get enabled(): boolean {
        let value = this.descriptor.enabled;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            return true;
        return value;
    }

    /**
     * Determined from Descriptor.Severity.
     */
    protected get severity(): ValidationSeverity {
        let value = this.descriptor.severity;
        if (typeof value == 'function')
            value = value(this);
        if (value == null)  // null/undefined
            switch (this.condition.category)
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
     * Resolves the errorMessage as a template - before it has its tokens processed.
     * It uses several sources to get the template. The first to have text is used.
     * 1. Descriptor.ErrorMessagel10n gets data from TextLocalizerService with Descriptor.errorMessage as fallback
     * 2. Descriptor.errorMessage
     * 3. TextLocalizerService.GetErrorMessage
     * @returns Error message from errorMessage property with localization applied
     * if ErrorMessagel10n is setup.
     */
    protected getErrorMessageTemplate(): string {
        let direct = this.descriptor.errorMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        if (this.descriptor.errorMessagel10n)
            msg = this.services.textLocalizerService.localize(this.services.activeCultureId,
                this.descriptor.errorMessagel10n, msg);
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the ConditionType and DataTypeLookupKey.
            msg = this.services.textLocalizerService.getErrorMessage(this.services.activeCultureId,
                this.condition.conditionType, this.valueHost.getDataType());
        }
        if (msg == null)
            throw new Error('Must supply a value for Descriptor.errorMessage');
        return msg;
    }

    /**
     * Resolves the summaryMessage as a template - before it has its tokens processed.
     * Falls back to use GetErrorMessageTemplate if Descriptor doesn't supply a value.
     * @returns Error message from summaryMessage property with localization applied
     * if SummaryMessagel10n is setup.
     */
    protected getSummaryMessageTemplate(): string {
        let direct = this.descriptor.summaryMessage;
        if (typeof direct == 'function')
            direct = direct(this);
        let msg = direct as string | null;
        if (this.descriptor.summaryMessagel10n)
            msg = this.services.textLocalizerService.localize(this.services.activeCultureId,
                this.descriptor.summaryMessagel10n, msg ?? '');
        if (msg == null)  // null/undefined
        {// fallback: see if TextLocalizerService has an entry specific to the ConditionType and DataTypeLookupKey.
            msg = this.services.textLocalizerService.getSummaryMessage(this.services.activeCultureId,
                this.condition.conditionType, this.valueHost.getDataType());
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
                return bailout('Descriptor.Enabled is false');

            // enabler
            let enabler = this.enabler;
            if (enabler) { // Many enablers don't use the current value host.
                // When that is the case, their ConditionDescriptor.valueHostId
                // must be setup to retrieve the correct one.
                // ValueHostId takes precedence.
                let result = enabler.evaluate(this.valueHost, this.valueHostsManager);         
                switch (result) {
                    case ConditionEvaluateResult.NoMatch:
                    case ConditionEvaluateResult.Undetermined:
                        return bailout(`Enabler evaluated as ${ConditionEvaluateResultStrings[result]}`);
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
        catch (e)
        {
            if (e instanceof Error)
                logError(e.message);
            // resume normal processing with Undetermined state
            resultState.conditionEvaluateResult = ConditionEvaluateResult.Undetermined;
            resultState.issueFound = null;
            return resultState;
        }
        finally {
            logInfo(() => {
                return {
                    message: `Condition result: ${ConditionEvaluateResultStrings[resultState.conditionEvaluateResult]} Issue found: ` +
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
            fn: () => { message: string; source?: string }): void
        {
            if (self.services.loggerService.minLevel >= LoggingLevel.Info)
            {
                let parms = fn();
                self.services.loggerService.log(parms.message, LoggingLevel.Info,
                    ValidationCategory,
                    parms.source ?? `Validation with ${self.getLogSourceText()}`);
            }
        }
        function logError(message: string): void
        {
            self.services.loggerService.log('Exception: ' + (message ?? 'Reason unspecified'),
                LoggingLevel.Error, ValidationCategory, self.getLogSourceText());            
        }
    }

    /**
     * When true, the condition implements IEvaluateConditionDuringEdits
     * @returns 
     */
    protected supportsDuringEdit(): boolean
    {
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

    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        toIGatherValueHostIds(this.condition)?.gatherValueHostIds(collection, valueHostResolver);
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

    protected getLogSourceText(): string
    {
        return `InputValidator on ValueHost ${this._valueHost.getId()}`;
    }
}


export function createIssueFound(valueHost: IValueHost,
    validator: IInputValidator): IssueFound {
    return {
        valueHostId: valueHost.getId(),
        conditionType: validator.condition.conditionType,
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
    public create(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor): IInputValidator {
        return new InputValidator(valueHost, descriptor);
    }
}


//#endregion Factory
