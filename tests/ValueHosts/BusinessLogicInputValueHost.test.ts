import { BusinessLogicInputValueHostGenerator, BusinessLogicValueHostId } from '../../src/ValueHosts/BusinessLogicInputValueHost';
import { BusinessLogicInputValueHost, BusinessLogicInputValueHostType } from "../../src/ValueHosts/BusinessLogicInputValueHost";
import { MockValidationManager, MockValidationServices } from "../Mocks";
import { ObjectKeysCount } from '../../src/Utilities/Utilities';
import { IInputValueHostBaseDescriptor, IInputValueHostBaseState, IInputValueHost } from '../../src/Interfaces/InputValueHost';
import { ValidationResult, IValidateResult, IIssueFound, ValidationSeverity } from '../../src/Interfaces/Validation';


interface ITestSetupConfig {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    descriptor: IInputValueHostBaseDescriptor,
    state: IInputValueHostBaseState,
    valueHost: BusinessLogicInputValueHost
};


function SetupInputValueHost(
    descriptor?: Partial<IInputValueHostBaseDescriptor> | null,
    state?: Partial<IInputValueHostBaseState> | null): ITestSetupConfig {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let defaultDescriptor: IInputValueHostBaseDescriptor = {
        Type: BusinessLogicInputValueHostType,
        Id: BusinessLogicValueHostId,
        Label: '*',
    };
    let updatedDescriptor: IInputValueHostBaseDescriptor = (!descriptor) ?
        defaultDescriptor :
        { ...defaultDescriptor, ...descriptor };
    let defaultState: IInputValueHostBaseState = {
        Id: 'Field1',
        Value: undefined,
        InputValue: undefined,
        IssuesFound: null,
        ValidationResult: ValidationResult.NotAttempted
    };
    let updatedState: IInputValueHostBaseState = (!state) ?
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

describe('BusinessLogicInputValueHost.Validate', () => {
    test('No BusinessLogicErrors results in ValidationResult.Valid', () => {
        let config = SetupInputValueHost();
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Valid);
        expect(vr!.IssuesFound).toBeNull();
    });
    test('Has group which is ignored. No BusinessLogicErrors results in ValidationResult.Valid', () => {
        let config = SetupInputValueHost();
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate({ Group: 'GROUPA' })).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Valid);
        expect(vr!.IssuesFound).toBeNull();
    });    
    test('One BusinessLogicErrors with only ErrorMesage results in ValidationResult.Invalid and one IssueFound because Severity=undefined means Severity=Error', () => {
        let config = SetupInputValueHost();
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'ERROR',
        });
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Invalid);
        expect(vr!.IssuesFound).not.toBeNull();
        expect(ObjectKeysCount(vr!.IssuesFound)).toBe(1);
        expect(vr!.IssuesFound![0]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_0",
            ErrorMessage: "ERROR",
            Severity: ValidationSeverity.Error,
            ValueHostId: BusinessLogicValueHostId
        });
    });    
    test('One BusinessLogicErrors with only ErrorMesage and Severity=Error results in ValidationResult.Invalid and one IssueFound', () => {
        let config = SetupInputValueHost();
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        });
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Invalid);
        expect(vr!.IssuesFound).not.toBeNull();
        expect(ObjectKeysCount(vr!.IssuesFound)).toBe(1);
        expect(vr!.IssuesFound![0]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_0",
            ErrorMessage: "ERROR",
            Severity: ValidationSeverity.Error,
            ValueHostId: BusinessLogicValueHostId
        });
    });        
    test('One BusinessLogicErrors with only ErrorMesage and Severity=Severe results in ValidationResult.Invalid and one IssueFound', () => {
        let config = SetupInputValueHost();
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Severe
        });
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Invalid);
        expect(vr!.IssuesFound).not.toBeNull();
        expect(ObjectKeysCount(vr!.IssuesFound)).toBe(1);
        expect(vr!.IssuesFound![0]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_0",
            ErrorMessage: "ERROR",
            Severity: ValidationSeverity.Severe,
            ValueHostId: BusinessLogicValueHostId
        });
    });            
    test('One BusinessLogicErrors with only ErrorMesage and Severity=Warning results in ValidationResult.Valid and one IssueFound', () => {
        let config = SetupInputValueHost();
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Valid);
        expect(vr!.IssuesFound).not.toBeNull();
        expect(ObjectKeysCount(vr!.IssuesFound)).toBe(1);
        expect(vr!.IssuesFound![0]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_0",
            ErrorMessage: "WARNING",
            Severity: ValidationSeverity.Warning,
            ValueHostId: BusinessLogicValueHostId
        });
    });            
    test('One BusinessLogicErrors with ErrorMesage, ErrorCode="EC1" and Severity=Error results in ValidationResult.Invalid and one IssueFound identified as "EC1"', () => {
        let config = SetupInputValueHost();
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error,
            ErrorCode: "EC1"
        });
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Invalid);
        expect(vr!.IssuesFound).not.toBeNull();
        expect(ObjectKeysCount(vr!.IssuesFound)).toBe(1);
        expect(vr!.IssuesFound![0]).toEqual(<IIssueFound>{
            ConditionType: "EC1",
            ErrorMessage: "ERROR",
            Severity: ValidationSeverity.Error,
            ValueHostId: BusinessLogicValueHostId
        });
    });          
    test('2 BusinessLogicErrors (Warning, Error) results in ValidationResult.Invalid and two IssueFounds', () => {
        let config = SetupInputValueHost();
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        });        
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Invalid);
        expect(vr!.IssuesFound).not.toBeNull();
        expect(ObjectKeysCount(vr!.IssuesFound)).toBe(2);
        expect(vr!.IssuesFound![0]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_0",
            ErrorMessage: "WARNING",
            Severity: ValidationSeverity.Warning,
            ValueHostId: BusinessLogicValueHostId
        });
        expect(vr!.IssuesFound![1]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_1",
            ErrorMessage: "ERROR",
            Severity: ValidationSeverity.Error,
            ValueHostId: BusinessLogicValueHostId
        });        
    });            
    test('2 BusinessLogicErrors (Warning, Warning) results in ValidationResult.Valid and two IssueFounds', () => {
        let config = SetupInputValueHost();
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        config.valueHost.SetBusinessLogicError({
            ErrorMessage: 'WARNING2',
            Severity: ValidationSeverity.Warning
        });        
        let vr: IValidateResult | null = null;
        expect(() => vr = config.valueHost.Validate()).not.toThrow();
        expect(vr).not.toBeNull();
        expect(vr!.ValidationResult).toBe(ValidationResult.Valid);
        expect(vr!.IssuesFound).not.toBeNull();
        expect(ObjectKeysCount(vr!.IssuesFound)).toBe(2);
        expect(vr!.IssuesFound![0]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_0",
            ErrorMessage: "WARNING",
            Severity: ValidationSeverity.Warning,
            ValueHostId: BusinessLogicValueHostId
        });
        expect(vr!.IssuesFound![1]).toEqual(<IIssueFound>{
            ConditionType: "GENERATED_1",
            ErrorMessage: "WARNING2",
            Severity: ValidationSeverity.Warning,
            ValueHostId: BusinessLogicValueHostId
        });        
    });                
});

describe('BusinessLogicInputValueHostGenerator members', () => {
    test('CanCreate returns true for BusinessLogicInputValueHostType', () => {
        let testItem = new BusinessLogicInputValueHostGenerator();
        expect(testItem.CanCreate({
            Type: BusinessLogicInputValueHostType,
            Id: 'Field1',
            Label: '',
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new BusinessLogicInputValueHostGenerator();
        expect(testItem.CanCreate({
            Type: 'Unexpected',
            Id: 'Field1',
            Label: '',
        })).toBe(false);
    });
    test('Create returns instance of InputValueHost with VM, Descriptor and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: IInputValueHostBaseDescriptor = {
            Id: 'Field1',
            Type: BusinessLogicInputValueHostType,
            Label: '',
        };
        let state: IInputValueHostBaseState = {
            Id: 'Field1',
            IssuesFound: null,
            ValidationResult: ValidationResult.NotAttempted,
            Value: undefined,
            InputValue: 'TEST'
        };
        let testItem = new BusinessLogicInputValueHostGenerator();
        let vh: IInputValueHost | null = null;
        expect(() => vh = testItem.Create(vm, descriptor, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(BusinessLogicInputValueHost);
        expect(vh!.GetId()).toBe(descriptor.Id);    // check Descriptor value
        expect(vh!.GetInputValue()).toBe('TEST');  // check State value
    });
    test('CleanupState existing state has no IssuesFound. Returns the same data', () => {
        let originalState: IInputValueHostBaseState = {
            Id: 'Field1',
            IssuesFound: null,
            ValidationResult: ValidationResult.Valid,
            InputValue: 'ABC',
            Value: 10
        };
        let state = { ...originalState };
        let descriptor: IInputValueHostBaseDescriptor = {
            Id: 'Field1',
            Type: BusinessLogicInputValueHostType,
            Label: '',
        };
        let testItem = new BusinessLogicInputValueHostGenerator();
        expect(() => testItem.CleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });

    test('CreateState returns instance with ID and InitialValue from Descriptor', () => {
        let testItem = new BusinessLogicInputValueHostGenerator();
        let descriptor: IInputValueHostBaseDescriptor = {
            Id: 'Field1',
            Type: BusinessLogicInputValueHostType,
            Label: '',
            InitialValue: 'TEST',
        };
        let state: IInputValueHostBaseState | null = null;
        expect(() => state = testItem.CreateState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.Id).toBe(descriptor.Id);
        expect(state!.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(state!.InputValue).toBeUndefined();
        expect(state!.Group).toBeUndefined();
        expect(state!.Value).toBe(descriptor.InitialValue);
        expect(state!.IssuesFound).toBeNull();
    });
});