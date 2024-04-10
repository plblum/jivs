import { BusinessLogicInputValueHostGenerator, BusinessLogicValueHostName } from '../../src/ValueHosts/BusinessLogicInputValueHost';
import { BusinessLogicInputValueHost, BusinessLogicInputValueHostType } from "../../src/ValueHosts/BusinessLogicInputValueHost";
import { MockValidationManager, MockValidationServices } from "../TestSupport/mocks";
import { objectKeysCount } from '../../src/Utilities/Utilities';
import { ValidationResult, ValidateResult, IssueFound, ValidationSeverity } from '../../src/Interfaces/Validation';
import { ValidatableValueHostBaseDescriptor, ValidatableValueHostBaseState, IValidatableValueHostBase } from '../../src/Interfaces/ValidatableValueHostBase';


interface ITestSetupConfig {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    descriptor: ValidatableValueHostBaseDescriptor,
    state: ValidatableValueHostBaseState,
    valueHost: BusinessLogicInputValueHost
};


function setupInputValueHost(
    descriptor?: Partial<ValidatableValueHostBaseDescriptor> | null,
    state?: Partial<ValidatableValueHostBaseState> | null): ITestSetupConfig {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let defaultDescriptor: ValidatableValueHostBaseDescriptor = {
        type: BusinessLogicInputValueHostType,
        name: BusinessLogicValueHostName,
        label: '*',
    };
    let updatedDescriptor: ValidatableValueHostBaseDescriptor = (!descriptor) ?
        defaultDescriptor :
        { ...defaultDescriptor, ...descriptor };
    let defaultState: ValidatableValueHostBaseState = {
        name: 'Field1',
        value: undefined,
        inputValue: undefined,
        issuesFound: null,
        validationResult: ValidationResult.NotAttempted
    };
    let updatedState: ValidatableValueHostBaseState = (!state) ?
        defaultState :
        { ...defaultState, ...state };
    let vh = new BusinessLogicInputValueHost(vm,
        updatedDescriptor, updatedState);
    return {
        services: services,
        validationManager: vm,
        descriptor: updatedDescriptor,
        state: updatedState,
        valueHost: vh
    };
}

describe('BusinessLogicInputValueHost.validate', () => {
    test('No BusinessLogicErrors results in ValidationResult.Valid', () => {
        let config = setupInputValueHost();
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Valid);
        expect(vr!.issuesFound).toBeNull();
    });
    test('Has group which is ignored. No BusinessLogicErrors results in ValidationResult.Valid', () => {
        let config = setupInputValueHost();
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate({ group: 'GROUPA' })).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Valid);
        expect(vr!.issuesFound).toBeNull();
    });    
    test('One BusinessLogicErrors with only ErrorMesage results in ValidationResult.Invalid and one IssueFound because Severity=undefined means Severity=Error', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
        });
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            conditionType: "GENERATED_0",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName
        });
    });    
    test('One BusinessLogicErrors with only ErrorMesage and Severity=Error results in ValidationResult.Invalid and one IssueFound', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            conditionType: "GENERATED_0",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName
        });
    });        
    test('One BusinessLogicErrors with only ErrorMesage and Severity=Severe results in ValidationResult.Invalid and one IssueFound', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Severe
        });
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            conditionType: "GENERATED_0",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Severe,
            valueHostName: BusinessLogicValueHostName
        });
    });            
    test('One BusinessLogicErrors with only ErrorMesage and Severity=Warning results in ValidationResult.Valid and one IssueFound', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Valid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            conditionType: "GENERATED_0",
            errorMessage: "WARNING",
            severity: ValidationSeverity.Warning,
            valueHostName: BusinessLogicValueHostName
        });
    });            
    test('One BusinessLogicErrors with ErrorMesage, ErrorCode="EC1" and Severity=Error results in ValidationResult.Invalid and one IssueFound identified as "EC1"', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error,
            errorCode: "EC1"
        });
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(1);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            conditionType: "EC1",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName
        });
    });          
    test('2 BusinessLogicErrors (Warning, Error) results in ValidationResult.Invalid and two IssueFounds', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });        
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Invalid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(2);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            conditionType: "GENERATED_0",
            errorMessage: "WARNING",
            severity: ValidationSeverity.Warning,
            valueHostName: BusinessLogicValueHostName
        });
        expect(vr!.issuesFound![1]).toEqual(<IssueFound>{
            conditionType: "GENERATED_1",
            errorMessage: "ERROR",
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName
        });        
    });            
    test('2 BusinessLogicErrors (Warning, Warning) results in ValidationResult.Valid and two IssueFounds', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING2',
            severity: ValidationSeverity.Warning
        });        
        let vr: ValidateResult | null = null;
        expect(() => vr = config.valueHost.validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.validationResult).toBe(ValidationResult.Valid);
        expect(vr!.issuesFound).not.toBeNull();
        expect(objectKeysCount(vr!.issuesFound)).toBe(2);
        expect(vr!.issuesFound![0]).toEqual(<IssueFound>{
            conditionType: "GENERATED_0",
            errorMessage: "WARNING",
            severity: ValidationSeverity.Warning,
            valueHostName: BusinessLogicValueHostName
        });
        expect(vr!.issuesFound![1]).toEqual(<IssueFound>{
            conditionType: "GENERATED_1",
            errorMessage: "WARNING2",
            severity: ValidationSeverity.Warning,
            valueHostName: BusinessLogicValueHostName
        });        
    });                
});

describe('BusinessLogicInputValueHostGenerator members', () => {
    test('CanCreate returns true for BusinessLogicInputValueHostType', () => {
        let testItem = new BusinessLogicInputValueHostGenerator();
        expect(testItem.canCreate({
            type: BusinessLogicInputValueHostType,
            name: 'Field1',
            label: '',
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new BusinessLogicInputValueHostGenerator();
        expect(testItem.canCreate({
            type: 'Unexpected',
            name: 'Field1',
            label: '',
        })).toBe(false);
    });
    test('create returns instance of InputValueHost with VM, Descriptor and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: ValidatableValueHostBaseDescriptor = {
            name: 'Field1',
            type: BusinessLogicInputValueHostType,
            label: '',
        };
        let state: ValidatableValueHostBaseState = {
            name: 'Field1',
            issuesFound: null,
            validationResult: ValidationResult.NotAttempted,
            value: undefined,
            inputValue: 'TEST'
        };
        let testItem = new BusinessLogicInputValueHostGenerator();
        let vh: IValidatableValueHostBase | null = null;
        expect(() => vh = testItem.create(vm, descriptor, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(BusinessLogicInputValueHost);
        expect(vh!.getName()).toBe(descriptor.name);    // check Descriptor value
        expect(vh!.getInputValue()).toBe('TEST');  // check State value
    });
    test('cleanupState existing state has no IssuesFound. Returns the same data', () => {
        let originalState: ValidatableValueHostBaseState = {
            name: 'Field1',
            issuesFound: null,
            validationResult: ValidationResult.Valid,
            inputValue: 'ABC',
            value: 10
        };
        let state = { ...originalState };
        let descriptor: ValidatableValueHostBaseDescriptor = {
            name: 'Field1',
            type: BusinessLogicInputValueHostType,
            label: '',
        };
        let testItem = new BusinessLogicInputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });

    test('createState returns instance with name and InitialValue from Descriptor', () => {
        let testItem = new BusinessLogicInputValueHostGenerator();
        let descriptor: ValidatableValueHostBaseDescriptor = {
            name: 'Field1',
            type: BusinessLogicInputValueHostType,
            label: '',
            initialValue: 'TEST',
        };
        let state: ValidatableValueHostBaseState | null = null;
        expect(() => state = testItem.createState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe(descriptor.name);
        expect(state!.validationResult).toBe(ValidationResult.NotAttempted);
        expect(state!.inputValue).toBeUndefined();
        expect(state!.group).toBeUndefined();
        expect(state!.value).toBe(descriptor.initialValue);
        expect(state!.issuesFound).toBeNull();
    });
});