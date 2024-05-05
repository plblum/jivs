import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { MockValidationManager, MockValidationServices } from "../TestSupport/mocks";
import { InputValueHost, InputValueHostGenerator } from '../../src/ValueHosts/InputValueHost';
import { BusinessLogicErrorsValueHost, BusinessLogicErrorsValueHostName } from '../../src/ValueHosts/BusinessLogicErrorsValueHost';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { IInputValueHost, InputValueHostConfig, InputValueHostInstanceState } from '../../src/Interfaces/InputValueHost';
import { ValidationStatus, IssueFound, ValidationSeverity, ValidationState, BusinessLogicError, ValidateOptions } from '../../src/Interfaces/Validation';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import {
    IValidationManager, IValidationManagerCallbacks, ValidationManagerConfig, ValidationManagerInstanceState,
    defaultNotifyValidationStateChangedDelay,
    toIValidationManager,
    toIValidationManagerCallbacks
} from '../../src/Interfaces/ValidationManager';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';
import { deepClone } from '../../src/Utilities/Utilities';
import { IValueHostResolver, toIValueHostResolver } from '../../src/Interfaces/ValueHostResolver';
import { StaticValueHost } from '../../src/ValueHosts/StaticValueHost';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { ConditionCategory, ConditionEvaluateResult } from "../../src/Interfaces/Conditions";
import { IValidatableValueHostBase, ValueHostValidationState } from "../../src/Interfaces/ValidatableValueHostBase";
import {
    AlwaysMatchesConditionType, NeverMatchesConditionType, IsUndeterminedConditionType, UserSuppliedResultConditionConfig,
    UserSuppliedResultCondition, UserSuppliedResultConditionType,
    NeverMatchesConditionType2
} from "../TestSupport/conditionsForTesting";
import { fluent } from "../../src/ValueHosts/Fluent";
import { IValueHostsManager, toIValueHostsManager, IValueHostsManagerAccessor, toIValueHostsManagerAccessor, ValueHostsManagerInstanceStateChangedHandler } from "../../src/Interfaces/ValueHostsManager";
import { IValidatorsValueHostBase } from "../../src/Interfaces/ValidatorsValueHostBase";
import { IValueHostAccessor } from "../../src/Interfaces/ValueHostAccessor";
import { ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { IStaticValueHost } from "../../src/Interfaces/StaticValueHost";
import { IPropertyValueHost } from "../../src/Interfaces/PropertyValueHost";

// Subclass of what we want to test to expose internals to tests
class PublicifiedValidationManager extends ValidationManager<ValidationManagerInstanceState> {
    constructor(setup: ValidationManagerConfig) {
        super(setup);
    }

    public get exposedValueHosts(): { [name: string]: IValueHost } {
        return this.valueHosts;
    }
    public get exposedValueHostConfigs(): { [name: string]: ValueHostConfig } {
        return this.valueHostConfigs;
    }
    public get exposedState(): ValidationManagerInstanceState {
        return this.instanceState;
    }

}

//  constructor(setup: ValidationManagerConfig)
describe('constructor and initial property values', () => {
    test('No configs (empty array), an empty state and no callback', () => {
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ services: services, valueHostConfigs: [] })).not.toThrow();
        expect(testItem!.services).toBe(services);
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(0);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValidationStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostValidationStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
    });

    test('Callbacks supplied. Other parameters are null', () => {
        let setup: ValidationManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostConfigs: [],
            onInstanceStateChanged: (valueHostsManager: IValueHostsManager, state: ValidationManagerInstanceState) => { },
            onValidationStateChanged: (validationManager: IValidationManager, validationState : ValidationState) => { },
            onValueHostInstanceStateChanged: (valueHost: IValueHost, state: ValueHostInstanceState) => { },
            onValueHostValidationStateChanged: (valueHost: IValidatableValueHostBase, snapshot: ValueHostValidationState) => { },
            onValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            onInputValueChanged: (valueHost: IValidatableValueHostBase, oldValue: any) => { }
        };

        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(setup)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValidationStateChanged).not.toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueHostValidationStateChanged).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
    });

});

function setupValidationManager(configs?: Array<InputValueHostConfig> | null,
    savedState?: ValidationManagerInstanceState | null,
    callbacks?: IValidationManagerCallbacks): {
        services: IValidationServices,
        validationManager: IValidationManager
    } {
    let services = createValidationServicesForTesting();
    services.autoGenerateDataTypeCheckService.enabled = false;
    
    let setup: ValidationManagerConfig = {
        services: services,
        valueHostConfigs: configs!,
        savedInstanceState: savedState!,
        savedValueHostInstanceStates: []
    };
    if (callbacks)
        setup = { ...callbacks, ...setup } as ValidationManagerConfig;
    let vm = new PublicifiedValidationManager(setup);

    return {
        services: services,
        validationManager: vm
    };
}

function setupInputValueHostConfig(fieldIndex: number,
    conditionTypes: Array<string> | null): InputValueHostConfig {
    let labelNumber = fieldIndex + 1;
    let config: InputValueHostConfig = {
        name: `Field${labelNumber}`,
        valueHostType: ValueHostType.Input,
        label: `Field ${labelNumber}`,
        validatorConfigs: null,
    };
    if (conditionTypes)
        for (let conditionType of conditionTypes) {
            if (!config.validatorConfigs)
                config.validatorConfigs = [];
            config.validatorConfigs.push({
                conditionConfig: {
                    conditionType: conditionType
                },
                errorMessage: `Error ${labelNumber}: ${conditionType}`,
                summaryMessage: `Summary ${labelNumber}: ${conditionType}`
            });
        }

    return config;
}

// validate(group?: string): Array<ValueHostValidateResult>
// get isValid(): boolean
// doNotSave: boolean
// getIssuesForInput(valueHostName: ValueHostName): Array<IssueFound>
// getIssuesFound(group?: string): Array<IssueFound>
describe('ValidationManager.validate, and isValid, doNotSave, getIssuesForInput, getIssuesFound based on the results', () => {
    test('Before calling validate with 0 inputValueHosts, isValid=true, doNotSave=false, getIssuesForInput=[], getIssuesFound=[]', () => {
        let setup = setupValidationManager();
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput('Anything')).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('isValid is true and doNotSave is false before calling validate with 1 inputValueHosts', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost that is ValidationStatus.Valid, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost that is ValidationStatus.Invalid, returns {isValid:false, doNotSave: true, issuesFound: [1 found] }', () => {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });


        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([expectedIssueFound]);
        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound]);
    });

    test('With 1 inputValueHost with 2 validators, one Match the other NoMatch, returns {isValid:false, doNotSave: true, issuesFound: [1 found] }', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType, NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([expectedIssueFound]);
        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound]);
    });    

    test('With 2 inputValueHost that are both valid, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let config2 = setupInputValueHostConfig(1, [AlwaysMatchesConditionType]);

        let setup = setupValidationManager([config1, config2]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 2 inputValueHost where only one has validators, it should return {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let config2 = fluent().input('Field2');

        let setup = setupValidationManager([config1, config2.parentConfig]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.parentConfig.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });    
    test('With 2 inputValueHost that are both undetermined, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [IsUndeterminedConditionType]);
        let config2 = setupInputValueHostConfig(1, [IsUndeterminedConditionType]);

        let setup = setupValidationManager([config1, config2]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 2 inputValueHost that are both Invalid, returns {isValid:false, doNotSave: true, issuesFound: [2 entries]}', () => {

        let config1 = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let config2 = setupInputValueHostConfig(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([config1, config2]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };
        let expectedIssueFound2: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field2',
            errorMessage: 'Error 2: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 2: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound, expectedIssueFound2],
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toEqual([expectedIssueFound]);
        expect(setup.validationManager.getIssuesForInput(config2.name)).toEqual([expectedIssueFound2]);

        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound, expectedIssueFound2]);
    });
    test('With 1 BusinessLogicError not associated with any ValueHost, isValid=false, DoNotSave=true, getIssuesFound has the businesslogicerror, and there is a new ValueHost for the BusinessLogic', () => {
        let setup = setupValidationManager();
        let result = setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ]);
        expect(result).toBe(true);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);
        expect(setup.validationManager.getIssuesFound()).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);
        expect(setup.validationManager.getValueHost(BusinessLogicErrorsValueHostName)).toBeInstanceOf(BusinessLogicErrorsValueHost);

        expect(setup.validationManager.getIssuesForInput(BusinessLogicErrorsValueHostName)).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);
    });
    test('With 1 ValueHost that is assigned without validators 1 BusinessLogicError, isValid=false, DoNotSave=true, getIssuesFound has the businesslogicerror, and there is a no ValueHost for the BusinessLogic', () => {

        let config = setupInputValueHostConfig(0, []);
        let setup = setupValidationManager([config]);
        let result = setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
                associatedValueHostName: config.name
            }
        ]);
        expect(result).toBe(true);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);
        expect(setup.validationManager.getIssuesFound()).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: config.name,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);
        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: config.name,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicErrorsValueHostName)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(BusinessLogicErrorsValueHostName)).toBeNull();
    });
    test('With 1 ValueHost that is assigned with 1 validator that is NoMatch, 1 BusinessLogicError not associated with a ValueHost, isValid=false, DoNotSave=true, getIssuesFound has both errors businesslogicerror, BLValueHost has the BLError, InputValueHost has its own error', () => {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        config.validatorConfigs![0].errorMessage = 'CONDITION ERROR';
        config.validatorConfigs![0].summaryMessage = 'SUMMARY CONDITION ERROR';
        let setup = setupValidationManager([config]);
        let result = setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
            }
        ]);
        expect(result).toBe(true);
        setup.validationManager.validate();
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);
        expect(setup.validationManager.getIssuesFound()).toEqual([
            <IssueFound>{
                errorMessage: 'CONDITION ERROR',
                severity: ValidationSeverity.Error,
                valueHostName: config.name,
                errorCode: NeverMatchesConditionType,
                summaryMessage: 'SUMMARY CONDITION ERROR'
            },
            <IssueFound>{
                errorMessage: 'BL_ERROR',
                severity: ValidationSeverity.Error,
                valueHostName: BusinessLogicErrorsValueHostName,
                errorCode: 'GENERATED_0',
                summaryMessage: 'BL_ERROR'
            }]);
        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([<IssueFound>{
            errorMessage: 'CONDITION ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: config.name,
            errorCode: NeverMatchesConditionType,
            summaryMessage: 'SUMMARY CONDITION ERROR'
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicErrorsValueHostName)).toBeInstanceOf(BusinessLogicErrorsValueHost);
        expect(setup.validationManager.getIssuesForInput(BusinessLogicErrorsValueHostName)).toEqual(
            [<IssueFound>{
                errorMessage: 'BL_ERROR',
                severity: ValidationSeverity.Error,
                valueHostName: BusinessLogicErrorsValueHostName,
                errorCode: 'GENERATED_0',
                summaryMessage: 'BL_ERROR'
            }]);
    });
    test('setBusinessLogicErrors has not supplied any errors and returns false', () => {
        let setup = setupValidationManager();
        let result = setup.validationManager.setBusinessLogicErrors([]);
        expect(result).toBe(false);
    });    
    test('setBusinessLogicErrors called twice. First time has changes. Second not, but both return true because the second changes by clearing the first', () => {
        let setup = setupValidationManager();
        let result =  setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
            }
        ]);
        expect(result).toBe(true);
        result = setup.validationManager.setBusinessLogicErrors([]);
        expect(result).toBe(true);
    });        
    test('OnValidated callback test invokes callback with expected ValidationState', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });
        let expectedIssueFound: IssueFound = {
            errorCode: 'GENERATED_0',
            errorMessage: 'BL_ERROR',
            summaryMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName
        };

        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ]);
        expect(callbackValue).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

    });    
    test('OnValidated callback test with option.OmitCallback=true does not invoke callback', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });
        let expectedIssueFound: IssueFound = {
            errorCode: 'GENERATED_0',
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName
        };

        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ], { skipCallback: true});
        expect(callbackValue).toBeNull();

    });    
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option Preliminary=true, expect ValidationStatus.Undetermined because Require should be skipped, leaving NO validators', () => {
        const conditionType = 'TEST';
        let config = setupInputValueHostConfig(0, [conditionType]);
        let setup = setupValidationManager([config]);
        (setup.services.conditionFactory as ConditionFactory).register<UserSuppliedResultConditionConfig>(
            conditionType, (config) => new UserSuppliedResultCondition({
                conditionType: conditionType,
                category: ConditionCategory.Require,
            result: ConditionEvaluateResult.NoMatch
            }));
    
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ preliminary: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option Preliminary=false, expect ValidationStatus.Invalid because Preliminary is off', () => {
        const conditionType = 'TEST';
        let config = setupInputValueHostConfig(0, [conditionType]);
        let setup = setupValidationManager([config]);
        (setup.services.conditionFactory as ConditionFactory).register<UserSuppliedResultConditionConfig>(
            conditionType, (config) => new UserSuppliedResultCondition({
                conditionType: conditionType,
                category: ConditionCategory.Require,
            result: ConditionEvaluateResult.NoMatch
        }));
        let expectedIssueFound: IssueFound = {
            errorCode: conditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + conditionType,
            summaryMessage: 'Summary 1: ' + conditionType,
            severity: ValidationSeverity.Severe // only because Require conditions default to Severe
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');
        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ preliminary: false })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([expectedIssueFound]);

        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound]);
    });
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch during Edit, use option DuringEdit=true, expect Invalid', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

    });
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch during edit, use option DuringEdit=true, expect Invalid', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        setup.validationManager.getInputValueHost('Field1')?.setInputValue(''); // requires text for duringEdit
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });
    });    
    test('With 1 inputValueHost that has a string value and a condition that will evaluate as Match during edit, use option DuringEdit=true, expect Valid', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        setup.validationManager.getInputValueHost(config.name)?.setInputValue('Text');
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });
    });        
    test('With 1 inputValueHost that has an undefined value and a condition that will evaluate as Match during edit, use option DuringEdit=true, expect Undetermined because DuringEdit requires a string value', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);

        setup.validationManager.getInputValueHost(config.name)?.setInputValue(undefined);
        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

    });          
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit has no impact on Category=Require validators', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: false })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

    });
    test('With 1 inputValueHost and a condition that does not implement IEvaluateConditionDuringEdits, use option DuringEdit=true, expect condition to be skipped and array of ValidateResults = []', () => {
        let config = setupInputValueHostConfig(0, [UserSuppliedResultConditionType]);
        (config.validatorConfigs![0].conditionConfig as UserSuppliedResultConditionConfig).result = ConditionEvaluateResult.Match;
        let setup = setupValidationManager([config]);

        let vh = (setup.validationManager.getValueHost('Field1')! as IInputValueHost);
        vh.setInputValue('');
        
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

    });
    test('With 1 inputValueHost and a NeverMatch condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit=false has no impact on including validators', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: false })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });
    });
    test('OnValidated callback test', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });

        let validationState = setup.validationManager.validate();

        expect(callbackValue).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });
    });
    test('OnValidated callback test with skipCallback does not callback', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });

        let validationState = setup.validationManager.validate({ skipCallback: true});

        expect(callbackValue).toBeNull();
    });
});
describe('ValidationManager.clearValidation', () => {
    test('With 2 inputValueHost that are both Invalid, returns 2 ValidateResults each with 1 issue found. isValid=false. DoNotSave=true', () => {

        let config1 = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let config2 = setupInputValueHostConfig(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([config1, config2]);

        setup.validationManager.validate();
        expect(() => setup.validationManager.clearValidation()).not.toThrow();
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });

    // ValidationManager.validate() itself will call onValidate immediately while
    // each of the child ValueHosts will call it using debounce.
    //
    function testOnValidatedWithDebounce(delayConfig: number | undefined,
        expectedOnValidatedCalls: number, 
        useVHCallback: boolean, numberOfValueHosts: number = 1, delayAfterVHCallback: number = 100): void
    {
        jest.useFakeTimers();

        let capturedFromOnValidated: Array<ValidationState> = [];
        let callbackValidated = (vm: IValidationManager, validationState : ValidationState) => {
            capturedFromOnValidated.push(validationState);
        };
        let capturedFromOnValueHostValidated: Array<ValueHostValidationState> = [];
        let callbackValueHostValidated = (valueHost: IValidatableValueHostBase, validationState : ValueHostValidationState) => {
            capturedFromOnValueHostValidated.push(validationState);
            jest.advanceTimersByTime(delayAfterVHCallback); // has the potential to trigger onValidate
        };        
        let ivConfigs: Array<InputValueHostConfig> = [];
        for (let i = 0; i < numberOfValueHosts; i++)
            ivConfigs.push(setupInputValueHostConfig(i, [NeverMatchesConditionType]));
        let setup = setupValidationManager(ivConfigs, null, {
            onValidationStateChanged: callbackValidated,
            onValueHostValidationStateChanged : useVHCallback ? callbackValueHostValidated : undefined,
            notifyValidationStateChangedDelay: delayConfig
        });
        setup.services.autoGenerateDataTypeCheckService.enabled = false;

        setup.validationManager.validate();

        expect(capturedFromOnValidated.length).toBe(expectedOnValidatedCalls);
        if (useVHCallback)
            expect(capturedFromOnValueHostValidated.length).toBe(numberOfValueHosts);
    }
    test('with notifyValidationStateChangedDelay=0, OnValidated invoked twice because debounce is off and ValueHost.validate fires it once', () => {
        testOnValidatedWithDebounce(0, 2, false);
    });    
    test('with notifyValidationStateChangedDelay=undefined, OnValidated invoked once because debounce is on', () => {
        testOnValidatedWithDebounce(undefined, 1, false);
    });        
    test('with notifyValidationStateChangedDelay=1000, OnValidated invoked once because debounce is on', () => {
        testOnValidatedWithDebounce(1000, 1, false);
    });    
    test('With ValueHostcallbacks enabled and no delay after, and with notifyValidationStateChangedDelay=0, OnValidated invoked twice because debounce is off', () => {
        testOnValidatedWithDebounce(0, 2, true, 1, 0);
        testOnValidatedWithDebounce(0, 3, true, 2, 0);
    });    
    test('With ValueHostcallbacks enabled and no delay after, and with notifyValidationStateChangedDelay=undefined, OnValidated invoked once', () => {
        testOnValidatedWithDebounce(undefined, 1, true, 1, 0);
        testOnValidatedWithDebounce(undefined, 1, true, 2, 0);
    });        
    test('With ValueHostcallbacks enabled and no delay after, and with notifyValidationStateChangedDelay=1000, OnValidated invoked once', () => {
        testOnValidatedWithDebounce(1000, 1, true, 1, 0);
        testOnValidatedWithDebounce(1000, 1, true, 2, 0);        
    });    
    test('With ValueHostcallbacks enabled and delay after < overall delay, and with notifyValidationStateChangedDelay=1000, OnValidated invoked once', () => {
        testOnValidatedWithDebounce(1000, 1, true, 1, 1000 - 1);
        testOnValidatedWithDebounce(1000, 1, true, 2, 1000 - 1);        
    });        
    test('With ValueHostcallbacks enabled and delay after > overall delay, and with notifyValidationStateChangedDelay=1000, OnValidated invoked twice as debounce triggers', () => {
        testOnValidatedWithDebounce(1000, 2, true, 1, 1000 + 1);
        testOnValidatedWithDebounce(1000, 3, true, 2, 1000 + 1);        
    });            
    test('OnValidated callback test with option.OmitCallback=true does not invoke callback', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });

        let validationState = setup.validationManager.validate({ skipCallback: true });
        expect(callbackValue).toBeNull();

        setup.validationManager.clearValidation({ skipCallback: true});
        expect(callbackValue).toBeNull();
    });
});
// updateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValidationManager.updateState', () => {
    interface ITestExtendedState extends ValidationManagerInstanceState {
        Value: number;
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedState) => ITestExtendedState, callback: ValueHostsManagerInstanceStateChangedHandler | null): Array<ITestExtendedState> {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let state: ITestExtendedState = {
            Value: initialValue
        };
        let setup = setupValidationManager([config], state, {
            onInstanceStateChanged: callback
        });
        let testItem = setup.validationManager as ValidationManager<ITestExtendedState>;
        let changes: Array<ITestExtendedState> = [];
        let fn = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
            let lastValue = stateToUpdate.Value;
            stateToUpdate = testCallback(stateToUpdate);
            if (lastValue !== stateToUpdate.Value)
                changes.push(stateToUpdate);
            return stateToUpdate;
        };

        // try several times
        for (let i = 1; i <= 3; i++) {
            expect(() => testItem.updateInstanceState(fn)).not.toThrow();
        }
        return changes;
    }
    test('Update value with +1 results in new instance of State',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                stateToUpdate.Value = stateToUpdate.Value + 1;
                return stateToUpdate;
            };
            const initialValue = 100;
            let changes = testUpdateState(initialValue, testCallback, null);
            expect(changes.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(changes[i - 1].Value).toBe(initialValue + i);
            }

        });
    test('Update value with +0 results in no change to the state instance',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                return stateToUpdate;
            };
            const initialValue = 100;
            let changes = testUpdateState(initialValue, testCallback, null);
            expect(changes.length).toBe(0);
        });
    test('Update value with +1 results in new instance of State and report thru updateState',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                stateToUpdate.Value = stateToUpdate.Value + 1;
                return stateToUpdate;
            };
            const initialValue = 100;
            let onStateChanges: Array<ITestExtendedState> = [];
            let changes = testUpdateState(initialValue, testCallback, (vm, state) => {
                onStateChanges.push(state as ITestExtendedState);
            });
            expect(changes.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(changes[i - 1].Value).toBe(initialValue + i);
            }
            expect(onStateChanges.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(onStateChanges[i - 1].Value).toBe(initialValue + i);
            }
        });
    test('Update value with +0 results in no change to the state instance nor seen in updateState',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                return stateToUpdate;
            };
            const initialValue = 100;
            let onStateChanges: Array<ITestExtendedState> = [];
            let changes = testUpdateState(initialValue, testCallback, (vm, state) => {
                onStateChanges.push(state as ITestExtendedState);
            });
            expect(changes.length).toBe(0);
        });
    test('Updater function is null throws',
        () => {
            let setup = setupValidationManager();
            let testItem = setup.validationManager as ValidationManager<ITestExtendedState>;
            expect(() => testItem.updateInstanceState(null!)).toThrow(/updater/);
        });
});
describe('dispose', () => {
    test('Ordinary does not make any noise', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        expect(() => setup.validationManager.dispose()).not.toThrow();
    });
    test('Ordinary does not make any noise', () => {
        jest.useFakeTimers();
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);     
        let countCalls = 0;
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: (vm, vs) => {
                countCalls++;
            },
            notifyValidationStateChangedDelay: 100
        });
        setup.services.autoGenerateDataTypeCheckService.enabled = false;
        setup.validationManager.notifyValidationStateChanged(null);   // starts a debounce delay
        jest.advanceTimersByTime(100);  // force onValidationStateChanged to run
        expect(countCalls).toBe(1);

        setup.validationManager.notifyValidationStateChanged(null);   // repeat, starts a debounce delay
        setup.validationManager.dispose();
        jest.advanceTimersByTime(100);  // force onValidationStateChanged to run   
        expect(countCalls).toBe(1);
    });    
});

describe('toIValidationManagerCallbacks function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValidationManagerCallbacks = {
            onValueChanged: (vh: IValueHost, old: any) => {},
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => {},
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any)  => {},
            onValueHostValidationStateChanged: (vh: IValidatableValueHostBase, snapshot: ValueHostValidationState) => { },
            onInstanceStateChanged: (vm, state) => { },
            onValidationStateChanged: (vm, results) => { }
        };
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });
    test('ValidationManager without callbacks defined returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: []
        });
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });    
    test('ValidationManager with callbacks defined returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: [],
            onValueChanged: (vh: IValueHost, old: any) => {},
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => {},
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any)  => {},
            onValueHostValidationStateChanged: (vh: IValidatableValueHostBase, snapshot: ValueHostValidationState) => { },
            onInstanceStateChanged: (vm, state) => { },
            onValidationStateChanged: (vm, results) => { }            
        });
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });        
    test('ValidationManager with callbacks=null defined returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: [],
            onValueChanged: null,
            onValueHostInstanceStateChanged: null,
            onInputValueChanged: null,
            onValueHostValidationStateChanged: null,
            onInstanceStateChanged: null,
            onValidationStateChanged: null            
        });
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });            
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidationManagerCallbacks(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValidationManagerCallbacks(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValidationManagerCallbacks(100)).toBeNull();
    });        
});
describe('toIValidationManager function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValidationManager = {
            validate: function (options?: ValidateOptions | undefined): ValidationState {
                throw new Error("Function not implemented.");
            },
            clearValidation: function (options?: ValidateOptions | undefined): boolean {
                throw new Error("Function not implemented.");
            },
            isValid: false,
            doNotSave: true,
            setBusinessLogicErrors: function (errors: BusinessLogicError[] | null, options?: ValidateOptions | undefined): boolean {
                throw new Error("Function not implemented.");
            },
            getIssuesForInput: function (valueHostName: string): IssueFound[] | null {
                throw new Error("Function not implemented.");
            },
            getIssuesFound: function (group?: string | undefined): IssueFound[] | null {
                throw new Error("Function not implemented.");
            },
            notifyValidationStateChanged: function (validationState: ValidationState | null, options?: ValidateOptions | undefined, force?: boolean | undefined): void {
                throw new Error("Function not implemented.");
            },
            dispose: function (): void {
                throw new Error("Function not implemented.");
            },
            notifyOtherValueHostsOfValueChange: function (valueHostIdThatChanged: string, revalidate: boolean): void {
                throw new Error("Function not implemented.");
            },
            getValueHost: function (valueHostName: string): IValueHost | null {
                throw new Error("Function not implemented.");
            },
            vh: {} as unknown as IValueHostAccessor,
            getValidatorsValueHost(valueHostName: ValueHostName): IValidatorsValueHostBase | null {
                throw new Error("Function not implemented.");
            },
            getInputValueHost: function (valueHostName: string): IInputValueHost | null {
                throw new Error("Function not implemented.");
            },
            getPropertyValueHost: function (valueHostName: string): IPropertyValueHost | null {
                throw new Error("Function not implemented.");
            },
            getCalcValueHost: function (valueHostName: string): ICalcValueHost | null {
                throw new Error("Function not implemented.");
            },
            getStaticValueHost: function (valueHostName: string): IStaticValueHost | null {
                throw new Error("Function not implemented.");
            },            
            services: new MockValidationServices(false, false),
            addValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");
            },
            updateValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");
            },
            discardValueHost: function (valueHostName: string): void {
                throw new Error("Function not implemented.");
            },
            build: function () {
                throw new Error("Function not implemented.");
            },

        };
        expect(toIValidationManager(testItem)).toBe(testItem);
    });
    test('ValidationManager returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: []
        });
        expect(toIValidationManager(testItem)).toBe(testItem);
    });    

    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidationManager(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValidationManager(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValidationManager(100)).toBeNull();
    });        
});
