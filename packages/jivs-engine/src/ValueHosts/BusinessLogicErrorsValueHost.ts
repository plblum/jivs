/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 * Those errors do not specify a ValueHostName associated with any ValueHost registered.
 * @module ValueHosts/ConcreteClasses/BusinessLogicErrorsValueHost
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState, IValidatableValueHostBase } from '../Interfaces/ValidatableValueHostBase';
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, IssueFound, ValidationSeverity } from '../Interfaces/Validation';

import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { cleanString } from '../Utilities/Utilities';


/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 * Those errors do not specify a ValueHostName associated with any ValueHost registered.
 */
export class BusinessLogicErrorsValueHost extends ValidatableValueHostBase<ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState>
{
    /**
     * Result is based on the presence of Business Logic Errors that are not warnings.
     * If none, ValidationStatus = Valid.
     * If only warnings, ValidationStatus = Valid and IssuesFound are generated for each.
     * Otherwise, ValidationStatus = Invalid and IssuesFound are generated from each error.
     * @param options 
     * @returns 
     */
    public validate(options?: ValidateOptions): ValueHostValidateResult | null {
        let result: ValueHostValidateResult = {
            issuesFound: null,
            status: ValidationStatus.Valid
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
                    valueHostName: BusinessLogicErrorsValueHostName
                });
                issueCount++;
            }
            if (issueCount)
            {
                result.issuesFound = iif;
                result.status = errorFound ? ValidationStatus.Invalid : ValidationStatus.Valid;
            }
        }
        this.invokeOnValueHostValidated(options);
        // when the result hasn't changed from the start, report null as there were no issues found
        return result.status !== ValidationStatus.Undetermined || result.issuesFound !== null || result.pending ?
            result : null;
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
export const BusinessLogicErrorsValueHostName = '*';   

export const BusinessLogicErrorsValueHostType = 'BusinessLogicErrors';
export class BusinessLogicErrorsValueHostGenerator extends ValidatableValueHostBaseGenerator {

    public canCreate(config: ValidatableValueHostBaseConfig): boolean {
        return config.valueHostType === BusinessLogicErrorsValueHostType;
    }
    public create(valueHostsManager: IValueHostsManager, config: ValidatableValueHostBaseConfig, state: ValidatableValueHostBaseInstanceState): IValidatableValueHostBase {
        return new BusinessLogicErrorsValueHost(valueHostsManager, config, state);
    }
    public cleanupInstanceState(state: ValidatableValueHostBaseInstanceState, config: ValidatableValueHostBaseConfig): void {
        // nothing to do
    }
}