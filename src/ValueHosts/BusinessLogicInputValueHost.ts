import { ValueHostId } from "../DataTypes/BasicTypes";
import { IInputValueHostBaseDescriptor, IInputValueHostBaseState, IInputValueHost } from "../Interfaces/InputValueHost";
import { IValidateOptions, IValidateResult, ValidationResult, IIssueFound, ValidationSeverity } from "../Interfaces/Validation";
import { InputValueHostBase, InputValueHostBaseGenerator } from "./InputValueHostBase";
import { ToIModelCallbacks } from "./ValidationManager";
import { IValueHostResolver, IValueHostsManager } from "../Interfaces/ValueHostResolver";


/**
 * Special ValueHost used internally to hold business logic errors that are only available to the ValidationSummary.
 */
export class BusinessLogicInputValueHost extends InputValueHostBase<IInputValueHostBaseDescriptor, IInputValueHostBaseState>
{
    /**
     * Result is based on the presence of Business Logic Errors that are not warnings.
     * If none, ValidationResult = Valid.
     * If only warnings, ValidationResult = Valid and IssuesFound are generated for each.
     * Otherwise, ValidationResult = Invalid and IssuesFound are generated from each error.
     * @param options 
     * @returns 
     */
    public Validate(options?: IValidateOptions): IValidateResult {
        let result: IValidateResult = {
            IssuesFound: null,
            ValidationResult: ValidationResult.Valid
        };
        if (this.BusinessLogicErrors)
        {
            let iif: Array<IIssueFound> = [];
            let issueCount = 0; // used to generate unique keys in IssueCount. They are fake ConditionTypes.
            let errorFound = false;

            for (let error of this.BusinessLogicErrors)
            {
                let errorCode = error.ErrorCode ?? `GENERATED_${issueCount}`;
                if (error.Severity !== ValidationSeverity.Warning)
                    errorFound = true;
                iif.push({
                    ConditionType: errorCode,
                    ErrorMessage: error.ErrorMessage,
                    Severity: error.Severity ?? ValidationSeverity.Error,
                    ValueHostId: '*'
                });
                issueCount++;
            }
            if (issueCount)
            {
                result.IssuesFound = iif;
                result.ValidationResult = errorFound ? ValidationResult.Invalid : ValidationResult.Valid;
            };
        }
        ToIModelCallbacks(this.ValueHostsManager)?.OnValueHostValidated?.(this, result);
        return result;
    }
    public get RequiresInput(): boolean
    {
        return false;
    }
    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public GatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        // nothing to do
    }
}
export const BusinessLogicValueHostId = '*';   

export const BusinessLogicInputValueHostType = 'BusinessLogic';
export class BusinessLogicInputValueHostGenerator extends InputValueHostBaseGenerator {

    public CanCreate(descriptor: IInputValueHostBaseDescriptor): boolean {
        return descriptor.Type === BusinessLogicInputValueHostType;
    }
    public Create(valueHostsManager: IValueHostsManager, descriptor: IInputValueHostBaseDescriptor, state: IInputValueHostBaseState): IInputValueHost {
        return new BusinessLogicInputValueHost(valueHostsManager, descriptor, state);
    }
    public CleanupState(state: IInputValueHostBaseState, descriptor: IInputValueHostBaseDescriptor): void {
        // nothing to do
    }
}