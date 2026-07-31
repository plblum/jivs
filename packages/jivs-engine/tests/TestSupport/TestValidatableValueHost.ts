/*
A subclass of ValidatableValueHostBase used for testing. It exposes protected members and methods for testing purposes,
allows setting the some values without triggering validation, and provide data capturing useful in tests.

You can expand its features so long as you don't break existing tests.

To consume, either use the setupValidatableValueHostBase function or use it as a guide.

*/

import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionConfig } from "../../src/Interfaces/Conditions";
import { ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState } from "../../src/Interfaces/ValidatableValueHostBase";
import { ValueHostValidateResult, ValidationStatus, ValidationSeverity, ValidateOptions, IssueFound } from "../../src/Interfaces/Validation";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { IJivsServices } from "../../src/Interfaces/JivsServices";
import { ValidatorConfig } from "../../src/Interfaces/Validator";
import { ValueHostConfig, IValueHost } from "../../src/Interfaces/ValueHost";
import { IValueHostGenerator } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { ValidatableValueHostBase } from "../../src/ValueHosts/ValidatableValueHostBase";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { MockJivsServices, MockValueHostsManager } from "./mocks";


/**
 * Used to test the abstract class. We won't be testing overridden abstract methods.
 */
export class TestValidatableValueHost extends ValidatableValueHostBase<ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState>
{
    public resetTestDoubles(): void {
        this.addExternalIssueFoundCallCount = 0;
        this.addExternalIssueFoundCalls = [];
        this.addExternalIssueFoundReturnValue = true;
        this.callSuperAddExternalIssueFound = true;
        this.validateCallCount = 0;
        this.validateWillReturn = null;
    }    
    public validateWillReturn: ValueHostValidateResult | null = null;
    public setValidateWillReturn(validationStatus: ValidationStatus | null): void
    {
        if (validationStatus)
            this.validateWillReturn = {
                status: validationStatus,
                issuesFound: (validationStatus === ValidationStatus.Undetermined ||
                    validationStatus === ValidationStatus.NeedsValidation ||
                    validationStatus === ValidationStatus.Valid) ? null : [{
                        valueHostName: 'Field1',
                        errorCode: 'TEST',
                        errorMessage: 'Error',
                        severity: ValidationSeverity.Error
                    }]
            };
        else
            this.validateWillReturn = null;
    }
    // emulate the state change
    public setCorrected(corrected: boolean): void
    {
        this.updateInstanceState((stateToUpdate) => {
            if (corrected)
                stateToUpdate.corrected = true;
            else
                delete stateToUpdate.corrected;
            return stateToUpdate;
        }, this);
    }
    // emulate the state change
    public setAsyncProcess(isAsync: boolean): void
    {
        this.updateInstanceState((stateToUpdate) => {
            if (isAsync)
                stateToUpdate.asyncProcessing = true;
            else
                delete stateToUpdate.asyncProcessing;
            return stateToUpdate;
        }, this);
    }    
    // emulate the state change
    public setValidationStatus(status: ValidationStatus): void
    {
        this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.status = status;
            return stateToUpdate;
        }, this);
    }        
    public gatherValueHostNames(collection: Set<string>, valueHostResolver: IValueHostResolver): void {
        for (const name of this.associatedValueHostNames)
            collection.add(name);
    }

    public get handledErrorCodes(): Array<string>
    {
        return this._handledErrorCodes;
    }
    public set handledErrorCodes(value: Array<string>)
    {
        this._handledErrorCodes = value;
    }    
    private _handledErrorCodes: Array<string> = [];
    protected handlesErrorCode(errorCode: string): boolean {
        return this.handledErrorCodes.includes(errorCode);
    }    
    public validate(options?: ValidateOptions | undefined): ValueHostValidateResult | null {
        this.validateCallCount++;
        this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.status =
                this.validateWillReturn ? this.validateWillReturn.status : ValidationStatus.NotAttempted;
            stateToUpdate.issuesFound =
                this.validateWillReturn ? this.validateWillReturn.issuesFound : null;

            return stateToUpdate;
        }, this);
        return this.validateWillReturn;    // setup to allow setValueOptions.validate to invoke it.
    }
    public associatedValueHostNames: Array<string> = [];
    public validateCallCount: number = 0;

//#region addExternalIssueFound capturing    
    public addExternalIssueFoundCallCount = 0;
    public addExternalIssueFoundCalls: Array<{
        issueFound: IssueFound;
        determinedLocally: boolean;
        options: any;
    }> = [];
    public addExternalIssueFoundReturnValue = true;
    public callSuperAddExternalIssueFound = true;

    public override addExternalIssueFound(
        issueFound: IssueFound,
        determinedLocally: boolean,
        options?: ValidateOptions
    ): boolean {
        this.addExternalIssueFoundCallCount++;
        this.addExternalIssueFoundCalls.push({ issueFound, determinedLocally, options });

        if (this.callSuperAddExternalIssueFound)
            return super.addExternalIssueFound(issueFound, determinedLocally, options);

        return this.addExternalIssueFoundReturnValue;
    }
    public get lastAddExternalIssueFoundCall() {
        return this.addExternalIssueFoundCalls[this.addExternalIssueFoundCalls.length - 1];
    }    
//#endregion    

    public get exposed_externalIssuesFound(): Array<IssueFound> | null {
        return this.externalIssuesFound;
    }
    public get exposed_issuesFound(): Array<IssueFound> | null {
        return this.instanceState.issuesFound;
    }
    public exposed_setIssueFound(issueFound: IssueFound): boolean 
    {
        return this.setIssueFound(issueFound);
    }

}

/**
 * This implementation of IValueHostGenerator is actually tested in ValueHostFactory.tests.ts
 */
class TestValidatableValueHostGenerator implements IValueHostGenerator {
    public canCreate(config: ValueHostConfig): boolean {
        return config.valueHostType === 'TestValidatableValueHost';
    }
    public create(valueHostsManager : IValueHostsManager, config: ValueHostConfig, state: ValidatableValueHostBaseInstanceState): IValueHost {
        return new TestValidatableValueHost(valueHostsManager, config, state);
    }
    public cleanupInstanceState(state: ValidatableValueHostBaseInstanceState, config: ValueHostConfig): void {
    }
    public createInstanceState(config: ValueHostConfig): ValidatableValueHostBaseInstanceState {
        let state: ValidatableValueHostBaseInstanceState = {
            name: config.name,
            value: config.initialValue,
            status: ValidationStatus.NotAttempted,
            issuesFound: null
        };
        return state;
    }

}
export function addTestValidatableValueHostGeneratorToServices(services: IJivsServices): void
{
    let factory = new ValueHostFactory();
    factory.register(new TestValidatableValueHostGenerator());
    services.valueHostFactory = factory;
}

//#region types and setup functions for tests

export interface ITestValidatableValueHostBaseSetupConfig {
    services: MockJivsServices,
    valueHostsManager: MockValueHostsManager,
    config: ValidatableValueHostBaseConfig,
    state: ValidatableValueHostBaseInstanceState,
    valueHost: TestValidatableValueHost
};

export function createValidatableValueHostBaseConfig(fieldNumber: number = 1,
    dataType: string = LookupKey.String,
    initialValue?: any): ValidatableValueHostBaseConfig {
    return {
        name: 'Field' + fieldNumber,
        label: 'Label' + fieldNumber,
        valueHostType: 'TestValidatableValueHost',
        dataType: dataType,
        initialValue: initialValue
    };
}

export function finishPartialValidatableValueHostBaseConfig(partialConfig: Partial<ValidatableValueHostBaseConfig> | null):
    ValidatableValueHostBaseConfig {
    let defaultIVH = createValidatableValueHostBaseConfig(1, LookupKey.String);
    if (partialConfig) {
        return { ...defaultIVH, ...partialConfig };
    }
    return defaultIVH;
}

export function finishPartialValidatableValueHostBaseConfigs(partialConfigs: Array<Partial<ValidatableValueHostBaseConfig>> | null):
    Array<ValidatableValueHostBaseConfig> | null {
    let result: Array<ValidatableValueHostBaseConfig> = [];
    if (partialConfigs) {
        for (let i = 0; i < partialConfigs.length; i++) {
            let vhd = partialConfigs[i];
            result.push(finishPartialValidatableValueHostBaseConfig(vhd));
        }
    }

    return result;
}


export function createValidatorConfig(condConfig: ConditionConfig | null): ValidatorConfig {
    return {
        conditionConfig: condConfig,
        errorMessage: 'Local',
        summaryMessage: 'Summary',
    };
}
export function finishPartialValidatorConfig(validatorConfig: Partial<ValidatorConfig> | null):
    ValidatorConfig {
    let defaultIVD = createValidatorConfig(null);
    if (validatorConfig) {
        return { ...defaultIVD, ...validatorConfig };
    }
    return defaultIVD;
}

export function finishPartialValidatorConfigs(validatorConfigs: Array<Partial<ValidatorConfig>> | null):
    Array<ValidatorConfig> {
    let result: Array<ValidatorConfig> = [];
    if (validatorConfigs) {
        let defaultIVD = createValidatorConfig(null);
        for (let i = 0; i < validatorConfigs.length; i++) {
            let vd = validatorConfigs[i];
            result.push(finishPartialValidatorConfig(vd));
        }
    }

    return result;
}

export function createValidatableValueHostBaseInstanceState(fieldNumber: number = 1): ValidatableValueHostBaseInstanceState {
    return {
        name: 'Field' + fieldNumber,
        value: undefined,
        issuesFound: null,
        status: ValidationStatus.NotAttempted
    };
}
export function finishPartialValidatableValueHostBaseInstanceState(partialState: Partial<ValidatableValueHostBaseInstanceState> | null): ValidatableValueHostBaseInstanceState {
    let defaultIVS = createValidatableValueHostBaseInstanceState(1);
    if (partialState) {
        return { ...defaultIVS, ...partialState };
    }
    return defaultIVS;
}

/**
 * Returns an ValueHost (ValidatableValueHostBase subclass) ready for testing.
 * @param partialIVHConfig - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * name: 'Field1',
 * label: 'Label1',
 * valueHostType: 'Test',
 * DataType: LookupKey.String,
 * InitialValue: 'DATA'
 * @param partialState - Use the default state by passing null. Otherwise pass
 * a state. Your state will override default values. To avoid overriding,
 * pass the property with a value of undefined.
 * These are the default values
 * name: 'Test'
 * Value: undefined
 * TextValue: undefined
 * IssuesFound: null,
 * ValidationStatus: NotAttempted
 * @returns An object with all of the parts that were setup including 
 * ValueHostsManager, Services, ValueHosts, the complete Config,
 * and the state.
 */
export function setupValidatableValueHostBase(
    partialIVHConfig?: Partial<ValidatableValueHostBaseConfig> | null,
    partialState?: Partial<ValidatableValueHostBaseInstanceState> | null,
    validateWillReturn: ValidationStatus | null = null): ITestValidatableValueHostBaseSetupConfig {
    let services = new MockJivsServices(true, true);
    addTestValidatableValueHostGeneratorToServices(services);

    let vm = new MockValueHostsManager(services);
    let updatedConfig = finishPartialValidatableValueHostBaseConfig(partialIVHConfig ?? null);
    let updatedState = finishPartialValidatableValueHostBaseInstanceState(partialState ?? null);

    let vh = vm.addValueHost(updatedConfig, updatedState) as TestValidatableValueHost;
    vh.setValidateWillReturn(validateWillReturn);
    //new ValidatableValueHostBase(vm, updatedConfig, updatedState);
    return {
        services: services,
        valueHostsManager: vm,
        config: updatedConfig,
        state: updatedState,
        valueHost: vh as TestValidatableValueHost
    };
}

//#endregion