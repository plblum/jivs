/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 * @module ValueHosts/ConcreteClasses/BusinessLogicInputValueHost
 */

import { ValueHostId } from '../DataTypes/BasicTypes';
import { InputValueHostBaseDescriptor, InputValueHostBaseState, IInputValueHost, IInputValueHostBase } from '../Interfaces/InputValueHost';
import { ValidateOptions, ValidateResult, ValidationResult, IssueFound, ValidationSeverity } from '../Interfaces/Validation';
import { InputValueHostBase, InputValueHostBaseGenerator } from './InputValueHostBase';
import { IValueHostResolver, IValueHostsManager } from '../Interfaces/ValueHostResolver';
import { toIValidationManagerCallbacks } from '../Interfaces/ValidationManager';


/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 */
export class BusinessLogicInputValueHost extends InputValueHostBase<InputValueHostBaseDescriptor, InputValueHostBaseState>
{
    /**
     * Result is based on the presence of Business Logic Errors that are not warnings.
     * If none, ValidationResult = Valid.
     * If only warnings, ValidationResult = Valid and IssuesFound are generated for each.
     * Otherwise, ValidationResult = Invalid and IssuesFound are generated from each error.
     * @param options 
     * @returns 
     */
    public validate(options?: ValidateOptions): ValidateResult {
        let result: ValidateResult = {
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
                let errorCode = error.errorCode ?? `GENERATED_${issueCount}`;
                if (error.severity !== ValidationSeverity.Warning)
                    errorFound = true;
                iif.push({
                    conditionType: errorCode,
                    errorMessage: error.errorMessage,
                    severity: error.severity ?? ValidationSeverity.Error,
                    valueHostId: '*'
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
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        // nothing to do
    }
}
export const BusinessLogicValueHostId = '*';   

export const BusinessLogicInputValueHostType = 'BusinessLogic';
export class BusinessLogicInputValueHostGenerator extends InputValueHostBaseGenerator {

    public canCreate(descriptor: InputValueHostBaseDescriptor): boolean {
        return descriptor.type === BusinessLogicInputValueHostType;
    }
    public create(valueHostsManager: IValueHostsManager, descriptor: InputValueHostBaseDescriptor, state: InputValueHostBaseState): IInputValueHostBase {
        return new BusinessLogicInputValueHost(valueHostsManager, descriptor, state);
    }
    public cleanupState(state: InputValueHostBaseState, descriptor: InputValueHostBaseDescriptor): void {
        // nothing to do
    }
}