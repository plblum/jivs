/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 * Those errors do not specify a ValueHostName associated with any ValueHost registered.
 * @module jivs-engine/ValueHosts/ConcreteClasses/ModelValidatorsValueHost
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState, IValidatableValueHost } from '../Interfaces/ValidatableValueHostBase';
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, IssueFound, ValidationSeverity } from '../Interfaces/Validation';

import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { cleanString } from '../Utilities/Utilities';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';


/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 * Those errors do not specify a ValueHostName associated with any ValueHost registered.
 */
export class ModelValidatorsValueHost extends ValidatableValueHostBase<ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState>
{
    constructor(valueHostsManager: IValueHostsManager, config: ValidatableValueHostBaseConfig, state: ValidatableValueHostBaseInstanceState) {
        super(valueHostsManager, config, state);

    }    

    /**
     * Determines if this ValueHost handles validation for a specific error code.
     * @param errorCode 
     */
    protected handlesErrorCode(errorCode: string): boolean
    {
        return true;
    }

    /**
     * Result is based on the presence of external IssuesFound that are not warnings.
     * If none, ValidationStatus = Valid.
     * If only warnings, ValidationStatus = Valid and IssuesFound are generated for each.
     * Otherwise, ValidationStatus = Invalid and IssuesFound are generated from each error.
     * @param options 
     * @returns 
     */
    public validate(options?: ValidateOptions): ValueHostValidateResult | null {
        const result: ValueHostValidateResult = {
            issuesFound: null,
            status: ValidationStatus.Valid
        };
        if (this.externalIssuesFound)
        {
            const iif: Array<IssueFound> = [];
            let issueCount = 0; // used to generate unique keys in IssueCount. They are fake ConditionTypes.
            let errorFound = false;

            for (const error of this.externalIssuesFound)
            {
                const errorCode = cleanString(error.errorCode) ?? `GENERATED_${issueCount}`;
                if (error.severity !== ValidationSeverity.Warning)
                    errorFound = true;
                iif.push({
                    errorCode: errorCode,
                    errorMessage: error.errorMessage,
                    summaryMessage: error.summaryMessage,
                    severity: error.severity ?? ValidationSeverity.Error,
                    valueHostName: ModelValidatorsValueHostName,    // should be the same as the ValueHostName of this ValueHost, which is '*'
                    doNotSave: error.doNotSave ?? false // NOTE: default to false only for external issues
                });
                issueCount++;
            }
            if (issueCount)
            {
                result.issuesFound = iif;
                result.status = errorFound ? ValidationStatus.Invalid : ValidationStatus.Valid;
            }
        }
        this.invokeOnValueHostValidationStateChanged(options);
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
export const ModelValidatorsValueHostName = '*';   

export const ModelValidatorsValueHostType = 'ModelValidatorsValueHost';
export class ModelValidatorsValueHostGenerator extends ValidatableValueHostBaseGenerator {

    public canCreate(config: ValidatableValueHostBaseConfig): boolean {
        return config.valueHostType === ModelValidatorsValueHostType;
    }
    public create(valueHostsManager: IValueHostsManager, config: ValidatableValueHostBaseConfig, state: ValidatableValueHostBaseInstanceState): IValidatableValueHost {
        return new ModelValidatorsValueHost(valueHostsManager, config, state);
    }
    public cleanupInstanceState(state: ValidatableValueHostBaseInstanceState, config: ValidatableValueHostBaseConfig): void {
        // nothing to do
    }
}