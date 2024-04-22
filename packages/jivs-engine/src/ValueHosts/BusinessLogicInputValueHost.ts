/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 * @module ValueHosts/ConcreteClasses/BusinessLogicInputValueHost
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValidatableValueHostBaseConfig, ValidatableValueHostBaseState, IValidatableValueHostBase } from '../Interfaces/ValidatableValueHostBase';
import { ValidateOptions, ValueHostValidateResult, ValidationResult, IssueFound, ValidationSeverity } from '../Interfaces/Validation';

import { IValueHostResolver, IValueHostsManager } from '../Interfaces/ValueHostResolver';
import { toIValidationManagerCallbacks } from '../Interfaces/ValidationManager';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { cleanString } from '../Utilities/Utilities';


/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 */
export class BusinessLogicInputValueHost extends ValidatableValueHostBase<ValidatableValueHostBaseConfig, ValidatableValueHostBaseState>
{
    /**
     * Result is based on the presence of Business Logic Errors that are not warnings.
     * If none, ValidationResult = Valid.
     * If only warnings, ValidationResult = Valid and IssuesFound are generated for each.
     * Otherwise, ValidationResult = Invalid and IssuesFound are generated from each error.
     * @param options 
     * @returns 
     */
    public validate(options?: ValidateOptions): ValueHostValidateResult {
        let result: ValueHostValidateResult = {
            issuesFound: null,
            validationResult: ValidationResult.Valid
        };
        if (this.businessLogicErrors)
        {
            let iif: Array<IssueFound> = [];
            let issueCount = 0; // used to generate unique keys in IssueCount. They are fake ConditionTypes.
            let errorFound = false;

            for (let error of this.businessLogicErrors)
            {
                let errorCode = cleanString(error.errorCode) ?? `GENERATED_${issueCount}`;
                if (error.severity !== ValidationSeverity.Warning)
                    errorFound = true;
                iif.push({
                    errorCode: errorCode,
                    errorMessage: error.errorMessage,
                    severity: error.severity ?? ValidationSeverity.Error,
                    valueHostName: '*'
                });
                issueCount++;
            }
            if (issueCount)
            {
                result.issuesFound = iif;
                result.validationResult = errorFound ? ValidationResult.Invalid : ValidationResult.Valid;
            }
        }
        toIValidationManagerCallbacks(this.valueHostsManager)?.onValueHostValidated?.(this, result);
        return result;
    }
    public get requiresInput(): boolean
    {
        return false;
    }
    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void
    {
        // nothing to do
    }
}
export const BusinessLogicValueHostName = '*';   

export const BusinessLogicInputValueHostType = 'BusinessLogic';
export class BusinessLogicInputValueHostGenerator extends ValidatableValueHostBaseGenerator {

    public canCreate(config: ValidatableValueHostBaseConfig): boolean {
        return config.type === BusinessLogicInputValueHostType;
    }
    public create(valueHostsManager: IValueHostsManager, config: ValidatableValueHostBaseConfig, state: ValidatableValueHostBaseState): IValidatableValueHostBase {
        return new BusinessLogicInputValueHost(valueHostsManager, config, state);
    }
    public cleanupState(state: ValidatableValueHostBaseState, config: ValidatableValueHostBaseConfig): void {
        // nothing to do
    }
}