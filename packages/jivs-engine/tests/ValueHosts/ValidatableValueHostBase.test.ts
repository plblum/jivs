import { IssueFound, ValidationStatus } from './../../src/Interfaces/Validation';
import { IValidatableValueHostBaseCallbacks, ValidatableValueHostBaseInstanceState, ValueHostValidationState, toIValidatableValueHostBaseCallbacks } from './../../src/Interfaces/ValidatableValueHostBase';
import { ValidatableValueHostBase, toIValidatableValueHostBase } from "../../src/ValueHosts/ValidatableValueHostBase";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";
import { ValidatableValueHostBaseConfig, IValidatableValueHostBase } from "../../src/Interfaces/ValidatableValueHostBase";
import {
    ValueHostValidateResult, ValidationSeverity, ValidateOptions,
    BusinessLogicError
} from "../../src/Interfaces/Validation";
import { IValidator, ValidatorConfig } from "../../src/Interfaces/Validator";
import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { SetValueOptions, IValueHost, ValueHostInstanceState, ValidTypesForInstanceStateStorage, ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ConditionConfig } from "../../src/Interfaces/Conditions";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IValueHostGenerator } from "../../src/Interfaces/ValueHostFactory";
import { StaticValueHost } from '../../src/ValueHosts/StaticValueHost';
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { NeverMatchesConditionType, IsUndeterminedConditionType } from "../TestSupport/conditionsForTesting";
import { FluentValidatorCollector } from "../../src/ValueHosts/Fluent";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';

/**
 * Used to test the abstract class. We won't be testing overridden abstract methods.
 */
class TestValidatableValueHost extends ValidatableValueHostBase<ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState>
{
    public validateWillReturn: ValueHostValidateResult | null = null;
    public setValidateWillReturn(validationStatus: ValidationStatus | null): void
    {
        if (validationStatus)
            this.validateWillReturn = {
                status: validationStatus,
                issuesFound: (validationStatus === ValidationStatus.Undetermined ||
                    validationStatus === ValidationStatus.ValueChangedButUnvalidated ||
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
    public gatherValueHostNames(collection: Set<string>, valueHostResolver: IValueHostResolver): void {
    }
    public validate(options?: ValidateOptions | undefined): ValueHostValidateResult | null {
        this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.status =
                this.validateWillReturn ? this.validateWillReturn.status : ValidationStatus.NotAttempted;
            stateToUpdate.issuesFound =
                this.validateWillReturn ? this.validateWillReturn.issuesFound : null;

            return stateToUpdate;
        }, this);
        return this.validateWillReturn;    // setup to allow setValueOptions.validate to invoke it.
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
function addGeneratorToServices(services: IValidationServices): void
{
    let factory = new ValueHostFactory();
    factory.register(new TestValidatableValueHostGenerator());
    services.valueHostFactory = factory;
}

interface ITestSetupConfig {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    config: ValidatableValueHostBaseConfig,
    state: ValidatableValueHostBaseInstanceState,
    valueHost: TestValidatableValueHost
};

function createValidatableValueHostBaseConfig(fieldNumber: number = 1,
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

function finishPartialValidatableValueHostBaseConfig(partialConfig: Partial<ValidatableValueHostBaseConfig> | null):
    ValidatableValueHostBaseConfig {
    let defaultIVH = createValidatableValueHostBaseConfig(1, LookupKey.String);
    if (partialConfig) {
        return { ...defaultIVH, ...partialConfig };
    }
    return defaultIVH;
}

function finishPartialValidatableValueHostBaseConfigs(partialConfigs: Array<Partial<ValidatableValueHostBaseConfig>> | null):
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


function createValidatorConfig(condConfig: ConditionConfig | null): ValidatorConfig {
    return {
        conditionConfig: condConfig,
        errorMessage: 'Local',
        summaryMessage: 'Summary',
    };
}
function finishPartialValidatorConfig(validatorConfig: Partial<ValidatorConfig> | null):
    ValidatorConfig {
    let defaultIVD = createValidatorConfig(null);
    if (validatorConfig) {
        return { ...defaultIVD, ...validatorConfig };
    }
    return defaultIVD;
}

function finishPartialValidatorConfigs(validatorConfigs: Array<Partial<ValidatorConfig>> | null):
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

function createValidatableValueHostBaseInstanceState(fieldNumber: number = 1): ValidatableValueHostBaseInstanceState {
    return {
        name: 'Field' + fieldNumber,
        value: undefined,
        issuesFound: null,
        status: ValidationStatus.NotAttempted
    };
}
function finishPartialValidatableValueHostBaseInstanceState(partialState: Partial<ValidatableValueHostBaseInstanceState> | null): ValidatableValueHostBaseInstanceState {
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
 * InputValue: undefined
 * IssuesFound: null,
 * ValidationStatus: NotAttempted
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, ValueHosts, the complete Config,
 * and the state.
 */
function setupValidatableValueHostBase(
    partialIVHConfig?: Partial<ValidatableValueHostBaseConfig> | null,
    partialState?: Partial<ValidatableValueHostBaseInstanceState> | null,
    validateWillReturn: ValidationStatus | null = null): ITestSetupConfig {
    let services = new MockValidationServices(true, true);
    addGeneratorToServices(services);

    let vm = new MockValidationManager(services);
    let updatedConfig = finishPartialValidatableValueHostBaseConfig(partialIVHConfig ?? null);
    let updatedState = finishPartialValidatableValueHostBaseInstanceState(partialState ?? null);

    let vh = vm.addValueHost(updatedConfig, updatedState) as TestValidatableValueHost;
    vh.setValidateWillReturn(validateWillReturn);
    //new ValidatableValueHostBase(vm, updatedConfig, updatedState);
    return {
        services: services,
        validationManager: vm,
        config: updatedConfig,
        state: updatedState,
        valueHost: vh as TestValidatableValueHost
    };
}

describe('constructor and resulting property values', () => {

    test('constructor with valid parameters created and sets up Services, Config, and InstanceState', () => {
        let services = new MockValidationServices(true, true);
        addGeneratorToServices(services);
        let vm = new MockValidationManager(services);
        let testItem: TestValidatableValueHost | null = null;
        expect(()=> testItem = new TestValidatableValueHost(vm, {
            name: 'Field1',
            valueHostType: 'TestValidatableValueHost',
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined
            })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getLabel()).toBe('');
        expect(testItem!.getDataType()).toBeNull();
        expect(testItem!.getValue()).toBeUndefined();
        expect(testItem!.isChanged).toBe(false);
        expect(testItem!.isValid).toBe(true);
    });

});

describe('setValue', () => {
    test('No setValueOptions. ValidationStatus changes to ValueChanged', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.ValueChangedButUnvalidated);
    });
    test('setValueOptions is empty. ValidationStatus changes to ValueChanged', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, {})).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.ValueChangedButUnvalidated);
    });    
    test('setValueOptions is null. ValidationStatus changes to ValueChanged', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, null!)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.ValueChangedButUnvalidated);
    });
    test('setValueOptions = { validate: false }. ValidationStatus changes to ValueChanged', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: false })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.ValueChangedButUnvalidated);
    });
    test('setValueOptions = { validate: true }. ValidationStatus changes to result of Validate()', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
    });

    test('Before calling, validate for ValidationStatus=Undetermined. Then setValueOptions { reset: true }. Expect IsChanged = false and ValidationStatus to NotAttempted', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(() => setup.valueHost.setValue(10, { reset: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.isChanged).toBe(false);
    });
    test('Set Value using { validate: true } then set value with no options. Expect ValidationStatus to ValueChangedButUnvalidated', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(() => setup.valueHost.setValue(20)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.ValueChangedButUnvalidated);
        expect(setup.valueHost.isChanged).toBe(true);
    });
    test('instanceState has Value=10, then set Value to the same value. No changes. ValidationStatus stays NotAttempted, IsChanged stays false', () => {
        let setup = setupValidatableValueHostBase(null, {
            value: 10
        });

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getValue()).toBe(10);
        expect(setup.valueHost.isChanged).toBe(false);
    });
    test('instanceState has Value=10 then set Value to the same value with { validate: true }. No changes, not validation occurs, IsChanged stays false. ValidationStatus stays NotAttempted', () => {
        let setup = setupValidatableValueHostBase(null, {
            value: 10
        }, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.isChanged).toBe(false);
        expect(setup.valueHost.getValue()).toBe(10);
    });


    test('Value was changed. OnValueChanged called. (confirm ancestor was not broken)', () => {
        let setup = setupValidatableValueHostBase();
        let testItem = setup.valueHost;

        let callbackInvoked = 0;
        setup.validationManager.onValueChanged = (valueHost, oldValue) => {
            callbackInvoked++;
        };
        testItem.setValue(100);
        expect(callbackInvoked).toBe(1);

    });

    test('Value was changed. OnValueHostInstanceStateChanged called.(confirm ancestor was not broken) ', () => {
        const initialValue = 100;

        let setup = setupValidatableValueHostBase();
        let callbackInvoked = 0;
        setup.validationManager.onValueHostInstanceStateChanged = (valueHost, stateToRetain) => {
            callbackInvoked++;
        };
        let testItem = setup.valueHost;
        testItem.setValue(initialValue);

        expect(callbackInvoked).toBe(1);
    });

    test('SetValue called with duringEdit=true reports that it is not supported into the log', () => {
        let setup = setupValidatableValueHostBase();
        let logger = setup.validationManager.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let options: SetValueOptions = { duringEdit: true };
        expect(() => setup.valueHost.setValue(10, options)).not.toThrow();
        expect(logger.findMessage('does not support duringEdit', LoggingLevel.Warn, null, null)).toBeDefined();
        expect(options.duringEdit).not.toBe(true);
    });

});

describe('validate() and its impact on isValid and ValidationStatus', () => {

    test('When validate result is Valid, IsValid=true, ValidationStatus = Valid', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Valid);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
    });
    test('When validate result is InValid, IsValid=false, ValidationStatus = InValid', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Invalid);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });    
    test('When validate result is Undetermined, IsValid=true, ValidationStatus = Undetermined', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
    });    
});

// clearValidation(): void
describe('ValidatableValueHostBase.clearValidation', () => {
    test('After validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {

        let setup = setupValidatableValueHostBase({}, null, ValidationStatus.Undetermined);
        setup.valueHost.validate();

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();

        let stateChanges = setup.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<ValidatableValueHostBaseInstanceState> = [
            {
                name: 'Field1',
                status: ValidationStatus.Undetermined,
                issuesFound: null,
                value: undefined
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);

    });
    test('Without calling validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let setup = setupValidatableValueHostBase({}, null, ValidationStatus.Undetermined);

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();
        let stateChanges = setup.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(0);

    });

    test('Without calling validate but with BusinessLogicError (Error), Ensure the state discards BusinessLogicError after clear', () => {
        let setup = setupValidatableValueHostBase({}, null, ValidationStatus.Undetermined);

        setup.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        let stateChanges = setup.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<ValidatableValueHostBaseInstanceState> = [
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined,
                businessLogicErrors: [
                    {
                        errorMessage: 'ERROR',
                        severity: ValidationSeverity.Error
                    }
                ]
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined,
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);
    });
});
// doNotSave: boolean
describe('ValidatableValueHostBase.doNotSave', () => {

    function trydoNotSave(initialValidationStatusCode: ValidationStatus, hasPendings: boolean, expectedResult: boolean): void {
        let vhConfig: ValidatableValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: 'TestValidatableValueHost'
        }


            let state: Partial<ValidatableValueHostBaseInstanceState> = {
                name: 'Field1',
                status: initialValidationStatusCode,
                issuesFound: [],
                asyncProcessing: hasPendings
            };
    
            let setup = setupValidatableValueHostBase(vhConfig, state);
    
            expect(setup.valueHost.doNotSave).toBe(expectedResult);
        }    
    test('ValidationStatus = Valid, doNotSave=false', () => {
        trydoNotSave(ValidationStatus.Valid, false, false);
    });
    test('ValidationStatus = Undetermined, doNotSave=false', () => {
        trydoNotSave(ValidationStatus.Undetermined, false, false);
    });
    test('ValidationStatus = Invalid, doNotSave=true', () => {
        trydoNotSave(ValidationStatus.Invalid, false, true);
    });
    test('ValidationStatus = Valid but with async pending, doNotSave=true', () => {
        trydoNotSave(ValidationStatus.Valid, true, true);
    });
    test('ValidationStatus = ValueChangedButUnvalidated, doNotSave=true', () => {
        trydoNotSave(ValidationStatus.ValueChangedButUnvalidated, true, true);
    });

});

describe('ValidatableValueHostBase.setBusinessLogicError', () => {
    test('One call with error adds to the list for the BusinessLogicErrorsValueHost', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        })).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1); // first changes the value; second changes ValidationStatus
        let valueChange = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange.businessLogicErrors).toBeDefined();
        expect(valueChange.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error

            });
    });

    test('Two calls with errors (ERROR, WARNING) adds to the list for the BusinessLogicErrorsValueHost', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        })).not.toThrow();
        expect(() => setup.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        })).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        let valueChange1 = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange1.businessLogicErrors).toBeDefined();
        expect(valueChange1.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error
            });
        let valueChange2 = <ValidatableValueHostBaseInstanceState>changes[1];
        expect(valueChange2.businessLogicErrors).toBeDefined();
        expect(valueChange2.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error
            });
        expect(valueChange2.businessLogicErrors![1]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'WARNING',
                severity: ValidationSeverity.Warning
            });
    });
    test('One call with null makes no changes to the state', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.setBusinessLogicError(null!)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
});
describe('clearBusinessLogicErrors', () => {
    test('Call while no existing makes not changes to the state', () => {
        let setup = setupValidatableValueHostBase();
        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearBusinessLogicErrors()).not.toThrow();
        expect(result).toBe(false);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
    test('Set then Clear creates two state entries with state.BusinessLogicErrors undefined by the end', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        })).not.toThrow();
        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearBusinessLogicErrors()).not.toThrow();
        expect(result).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationStatus
        let valueChange1 = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange1.businessLogicErrors).toBeDefined();
        expect(valueChange1.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error
            });
        let valueChange2 = <ValidatableValueHostBaseInstanceState>changes[1];
        expect(valueChange2.businessLogicErrors).toBeUndefined();
    });
    test('OnValueHostValidated called', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };
        addGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        }, null) as TestValidatableValueHost;

        vm.validate({ skipCallback: true }); // ensure we have an invalid state without business logic

        expect(() => vh.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, { skipCallback: true })).not.toThrow();
        expect(onValidateResult).toBeNull();  // because of skipCallback

        let result = vh.clearBusinessLogicErrors();
        expect(result).toBe(true);
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            isValid: true,
            issuesFound: null,
            doNotSave: false,
            asyncProcessing: false,
            status: ValidationStatus.NotAttempted
        });
    });    
    test('OnValueHostValidated not called from clearBusinessLogic because options.skipCallback=true', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };
        addGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        }, null) as TestValidatableValueHost;
        vm.validate({ skipCallback: true });

        vh.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, { skipCallback: true });
        expect(onValidateResult).toBeNull();  // because of skipCallback

        let result = vh.clearBusinessLogicErrors({ skipCallback: true});
        expect(result).toBe(true);
        expect(onValidateResult).toBeNull(); // because of skipCallback
    });       

});

// getIssueFound(validatorConfig: ValidatorConfig): IssueFound | null
describe('ValidatableValueHostBase.getIssueFound only checking without calls to validate', () => {
    test('Pass null returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound(null!)).not.toThrow();
        expect(issueFound).toBeNull();
    });
    test('Pass empty string returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('')).not.toThrow();
        expect(issueFound).toBeNull();
    });    
    test('Pass empty string returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('')).not.toThrow();
        expect(issueFound).toBeNull();
    });    
    test('Pass not defined valuehostname returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('UNKNOWN')).not.toThrow();
        expect(issueFound).toBeNull();
    });        
    test('Pass errorcode returns null because we didnt validate', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('code')).not.toThrow();
        expect(issueFound).toBeNull();
    });        

    test('Pass errorcode with surrounding whitespace returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound(' code ')).not.toThrow();
        expect(issueFound).toBeNull();
    });            

});

// getIssuesFound(): Array<IssueFound>
describe('ValidatableValueHostBase.getIssuesFound without calling validate', () => {
    test('Nothing to report returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).toBeNull();
    });

    test('No Validation errors, but has BusinessLogicError (Error) reports just the BusinessLogicError', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: 'GENERATED_0',
                severity: ValidationSeverity.Error,
                errorMessage: 'ERROR',
                summaryMessage: 'ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Severe) reports just the BusinessLogicError', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setBusinessLogicError({
            errorMessage: 'SEVERE',
            severity: ValidationSeverity.Severe
        });
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: 'GENERATED_0',
                severity: ValidationSeverity.Severe,
                errorMessage: 'SEVERE',
                summaryMessage: 'SEVERE'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Warning) reports just the BusinessLogicError', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: 'GENERATED_0',
                severity: ValidationSeverity.Warning,
                errorMessage: 'WARNING',
                summaryMessage: 'WARNING'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });

});

describe('toIValidatableValueHostBase', () => {
    test('Real instance match', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new TestValidatableValueHost(vm, {
            name: 'Field1'
        }, {
            name: 'Field1',
            issuesFound: null,
            value: null,
            status: ValidationStatus.Undetermined
        });
        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    test('Compatible object match', () => {
        let testItem: IValidatableValueHostBase = {

            otherValueHostChangedNotification: function (valueHostIdThatChanged: string, revalidate: boolean): void {
                throw new Error('Function not implemented.');
            },
            validate: function (options?: ValidateOptions | undefined): ValueHostValidateResult {
                throw new Error('Function not implemented.');
            },
            clearValidation: function (): boolean {
                throw new Error('Function not implemented.');
            },
            isValid: false,
            validationStatus: ValidationStatus.NotAttempted,
            asyncProcessing: false,
            setBusinessLogicError: function (error: BusinessLogicError): boolean {
                throw new Error('Function not implemented.');
            },
            clearBusinessLogicErrors: function (): boolean {
                throw new Error('Function not implemented.');
            },
            doNotSave: false,

            getIssueFound(errorCode: string): IssueFound | null {
                throw new Error('Function not implemented.');
            },
            getIssuesFound: function (group?: string | undefined): IssueFound[] {
                throw new Error('Function not implemented.');
            },

            getLabel: function (): string {
                throw new Error('Function not implemented.');
            },
            setLabel: function (label: string, labell10n?: string | undefined): void {
                throw new Error('Function not implemented.');
            },
            getValue: function () {
                throw new Error('Function not implemented.');
            },
            setValue: function (value: any, options?: SetValueOptions | undefined): void {
                throw new Error('Function not implemented.');
            },
            setValueToUndefined: function (options?: SetValueOptions | undefined): void {
                throw new Error('Function not implemented.');
            },
            getDataType: function (): string | null {
                throw new Error('Function not implemented.');
            },
            saveIntoInstanceState: function (key: string, value: any): void {
                throw new Error('Function not implemented.');
            },
            getFromInstanceState: function (key: string) {
                throw new Error('Function not implemented.');
            },
            isChanged: false,

            getName: function (): string {
                throw new Error('Function not implemented.');
            },
            gatherValueHostNames: function (collection: Set<string>, valueHostResolver: IValueHostResolver): void {
                throw new Error("Function not implemented.");
            }
        }
        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    test('Wrong instance class returns null', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let vh = new StaticValueHost(vm, {
            name: 'Field1',
        }, {
            name: 'Field1',
            value: null,
        });
        expect(toIValidatableValueHostBase(new Date())).toBeNull();
        expect(toIValidatableValueHostBase(vh)).toBeNull();
    });
    test('Wrong plain old object returns null', () => {
        expect(toIValidatableValueHostBase({})).toBeNull();
        expect(toIValidatableValueHostBase({ getName: null })).toBeNull();
    });
});

describe('toIValidatableValueHostBase function', () => {
    test('Passing actual ValidatableValueHostBase matches interface returns same object.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new TestValidatableValueHost(vm, {
            name: 'Field1',
            label: 'Label1'
        },
            {
                name: 'Field1',
                value: undefined,
                issuesFound: null,
                status: ValidationStatus.NotAttempted,
            });
        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    class TestIValidatableValueHostBaseImplementation implements IValidatableValueHostBase {
        gatherValueHostNames(collection: Set<string>, valueHostResolver: IValueHostResolver): void {
            throw new Error("Method not implemented.");
        }
        configValidators(): FluentValidatorCollector {
            throw new Error("Method not implemented.");
        }

        getInputValue() {
            throw new Error("Method not implemented.");
        }
        setInputValue(value: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        setValues(nativeValue: any, inputValue: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        otherValueHostChangedNotification(valueHostIdThatChanged: string, revalidate: boolean): void {
            throw new Error("Method not implemented.");
        }
        validate(options?: ValidateOptions | undefined): ValueHostValidateResult {
            throw new Error("Method not implemented.");
        }
        clearValidation(): boolean {
            throw new Error("Method not implemented.");
        }
        isValid: boolean = true;
        validationStatus: ValidationStatus = ValidationStatus.NotAttempted;
        asyncProcessing: boolean = false;
        setBusinessLogicError(error: BusinessLogicError): boolean {
            throw new Error("Method not implemented.");
        }
        clearBusinessLogicErrors(): boolean {
            throw new Error("Method not implemented.");
        }
        doNotSave = false;
        getIssueFound(errorCode: string): IssueFound | null {
            throw new Error("Method not implemented.");
        }

        getIssuesFound(group?: string | undefined): IssueFound[] {
            throw new Error("Method not implemented.");
        }
        getConversionErrorMessage(): string | null {
            throw new Error("Method not implemented.");
        }
        requiresInput: boolean = false;
        getName(): string {
            throw new Error("Method not implemented.");
        }
        getLabel(): string {
            throw new Error("Method not implemented.");
        }
        setLabel(label: string, labell10n?: string | undefined): void {
            throw new Error("Method not implemented.");
        }
        getValue() {
            throw new Error("Method not implemented.");
        }
        setValue(value: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        setValueToUndefined(options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        getDataType(): string | null {
            throw new Error("Method not implemented.");
        }

        isChanged: boolean = false;
        saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void {
            throw new Error("Method not implemented.");
        }
        getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined {
            throw new Error("Method not implemented.");
        }
        getValidator(errorCode: string): IValidator | null {
            throw new Error("Method not implemented.");
        }

        addValidator(config: ValidatorConfig): void {
            throw new Error("Method not implemented.");
        }
        setGroup(group: string): void {
            throw new Error("Method not implemented.");
        }
    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIValidatableValueHostBaseImplementation();

        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidatableValueHostBase(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIValidatableValueHostBase(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIValidatableValueHostBase(100)).toBeNull();
    });
});

describe('toIValidatableValueHostBaseCallbacks function', () => {
    test('Passing actual ValidatableValueHostBase matches interface returns same object.', () => {
        let testItem = new MockValidationManager(new MockValidationServices(false, false));

        expect(toIValidatableValueHostBaseCallbacks(testItem)).toBe(testItem);
    });
    class TestIValidatableValueHostBaseCallbacksImplementation implements IValidatableValueHostBaseCallbacks {
        onValueChanged(vh: IValueHost, old: any) { }
        onValueHostInstanceStateChanged(vh: IValueHost, state: ValueHostInstanceState) { }
        onInputValueChanged(vh: IValidatableValueHostBase, old: any) { }
        onValueHostValidationStateChanged(vh: IValidatableValueHostBase, validationState: ValueHostValidationState) { }
    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIValidatableValueHostBaseCallbacksImplementation();

        expect(toIValidatableValueHostBaseCallbacks(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidatableValueHostBaseCallbacks(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIValidatableValueHostBaseCallbacks(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIValidatableValueHostBaseCallbacks(100)).toBeNull();
    });
});

