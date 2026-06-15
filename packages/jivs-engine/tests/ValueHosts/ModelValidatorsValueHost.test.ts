import { ModelValidatorsValueHostGenerator, ModelValidatorsValueHostName } from '../../src/ValueHosts/ModelValidatorsValueHost';
import { ModelValidatorsValueHost, ModelValidatorsValueHostType } from "../../src/ValueHosts/ModelValidatorsValueHost";
import { MockValidationManager, MockValidationServices } from "../TestSupport/mocks";
import { objectKeysCount } from '../../src/Utilities/Utilities';
import { ValidationStatus, ValueHostValidateResult, IssueFound, ValidationSeverity } from '../../src/Interfaces/Validation';
import { ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState, IValidatableValueHostBase } from '../../src/Interfaces/ValidatableValueHostBase';


interface ITestSetupConfig {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    config: ValidatableValueHostBaseConfig,
    state: ValidatableValueHostBaseInstanceState,
    valueHost: ModelValidatorsValueHost
};


function setupInputValueHost(
    config?: Partial<ValidatableValueHostBaseConfig> | null,
    state?: Partial<ValidatableValueHostBaseInstanceState> | null): ITestSetupConfig {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let defaultConfig: ValidatableValueHostBaseConfig = {
        valueHostType: ModelValidatorsValueHostType,
        name: ModelValidatorsValueHostName,
        label: '*',
    };
    let updatedConfig: ValidatableValueHostBaseConfig = (!config) ?
        defaultConfig :
        { ...defaultConfig, ...config };
    let defaultState: ValidatableValueHostBaseInstanceState = {
        name: 'Field1',
        value: undefined,
        issuesFound: null,
        status: ValidationStatus.NotAttempted
    };
    let updatedState: ValidatableValueHostBaseInstanceState = (!state) ?
        defaultState :
        { ...defaultState, ...state };
    let vh = new ModelValidatorsValueHost(vm,
        updatedConfig, updatedState);
    return {
        services: services,
        validationManager: vm,
        config: updatedConfig,
        state: updatedState,
        valueHost: vh
    };
}

describe('ModelValidatorsValueHost.validate', () => {
    test('No ExternalIssuesFound results in ValidationStatus.Valid', () => {
        let setup = setupInputValueHost();
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Valid);
        expect(vr!.issuesFound).toBeNull();
    });
    test('Has group which is ignored. No ExternalIssuesFound results in ValidationStatus.Valid', () => {
        let setup = setupInputValueHost();
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate({ group: 'GROUPA' })).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Valid);
        expect(vr!.issuesFound).toBeNull();
    });    
    test('One ExternalIssuesFound with only ErrorMesage results in ValidationStatus.Invalid and one IssueFound because severity=undefined means severity=Error', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'ERROR',
        });
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "GENERATED_0",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });
    });    
    test('One ExternalIssuesFound with only ErrorMesage and severity=Error results in ValidationStatus.Invalid and one IssueFound', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "GENERATED_0",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });
    });        
    test('One ExternalIssuesFound with only ErrorMesage and severity=Severe results in ValidationStatus.Invalid and one IssueFound', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Severe
        });
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "GENERATED_0",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Severe,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });
    });            
    test('One ExternalIssuesFound with only ErrorMesage and severity=Warning results in ValidationStatus.Valid and one IssueFound', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Valid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "GENERATED_0",
            errorMessage: "WARNING",
            severity: ValidationSeverity.Warning,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });
    });            
    test('One ExternalIssuesFound with ErrorMesage, ErrorCode="EC1" and severity=Error results in ValidationStatus.Invalid and one IssueFound identified as "EC1"', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error,
            errorCode: "EC1"
        });
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "EC1",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });
    });          
    test('2 ExternalIssuesFound (Warning, Error) results in ValidationStatus.Invalid and two IssueFounds', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });        
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(2);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "GENERATED_0",
            errorMessage: "WARNING",
            severity: ValidationSeverity.Warning,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });
        expect(vr!.issuesFound![1]).toEqual(<IssueFound>{
            errorCode: "GENERATED_1",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });        
    });            
    test('2 ExternalIssuesFound (Warning, Warning) results in ValidationStatus.Valid and two IssueFounds', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'WARNING2',
            severity: ValidationSeverity.Warning
        });        
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Valid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(2);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "GENERATED_0",
            errorMessage: "WARNING",
            severity: ValidationSeverity.Warning,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });
        expect(vr!.issuesFound![1]).toEqual(<IssueFound>{
            errorCode: "GENERATED_1",
            errorMessage: "WARNING2",
            severity: ValidationSeverity.Warning,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: false
        });        
    });   
    test('One ExternalIssuesFound with displayOnly=true results in ValidationStatus.Valid', () => {
        let setup = setupInputValueHost();
        setup.valueHost.setExternalIssueFound({
            errorMessage: 'ERROR',
            displayOnly: true,
        });
        let vr: ValueHostValidateResult | null = null;
        expect(() => vr = setup.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.status).toBe(ValidationStatus.Valid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            errorCode: "GENERATED_0",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: ModelValidatorsValueHostName,
            displayOnly: true
        });
    });       
});

describe('ModelValidatorsValueHostGenerator members', () => {
    test('CanCreate returns true for ModelValidatorsValueHostType', () => {
        let testItem = new ModelValidatorsValueHostGenerator();
        expect(testItem.canCreate({
            valueHostType: ModelValidatorsValueHostType,
            name: 'Field1',
            label: '',
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new ModelValidatorsValueHostGenerator();
        expect(testItem.canCreate({
            valueHostType: 'Unexpected',
            name: 'Field1',
            label: '',
        })).toBe(false);
    });
    test('create returns instance of ModelValidatorsValueHost with VM, Config and InstanceState established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let config: ValidatableValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: ModelValidatorsValueHostType,
            label: '',
        };
        let state: ValidatableValueHostBaseInstanceState = {
            name: 'Field1',
            issuesFound: null,
            status: ValidationStatus.NotAttempted,
            value: undefined,
        };
        let testItem = new ModelValidatorsValueHostGenerator();
        let vh: IValidatableValueHostBase | null = null;
        expect(() => vh = testItem.create(vm, config, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(ModelValidatorsValueHost);
        expect(vh!.getName()).toBe(config.name);    // check Config value
    });
    test('cleanupInstanceState existing state has no IssuesFound. Returns the same data', () => {
        let originalState: ValidatableValueHostBaseInstanceState = {
            name: 'Field1',
            issuesFound: null,
            status: ValidationStatus.Valid,
            value: 10
        };
        let state = { ...originalState };
        let config: ValidatableValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: ModelValidatorsValueHostType,
            label: '',
        };
        let testItem = new ModelValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });

    test('createInstanceState returns instance with name and InitialValue from Config', () => {
        let testItem = new ModelValidatorsValueHostGenerator();
        let config: ValidatableValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: ModelValidatorsValueHostType,
            label: '',
            initialValue: 'TEST',
        };
        let state: ValidatableValueHostBaseInstanceState | null = null;
        expect(() => state = testItem.createInstanceState(config)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe(config.name);
        expect(state!.status).toBe(ValidationStatus.NotAttempted);
        expect(state!.group).toBeUndefined();
        expect(state!.value).toBe(config.initialValue);
        expect(state!.issuesFound).toBeNull();
    });
});