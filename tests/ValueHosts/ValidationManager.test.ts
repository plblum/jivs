
import { RequiredTextConditionType } from '../../src/Conditions/ConcreteConditions';
import { ConditionFactory, RegisterStandardConditions } from "../../src/Conditions/ConditionFactory";
import { DataTypeResolver } from "../../src/DataTypes/DataTypeResolver";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IModelCallbacks, ModelStateChangedHandler, ValidationManager } from "../../src/ValueHosts/ValidationManager";
import { IValueHost, IValueHostDescriptor, IValueHostState } from "../../src/Interfaces/ValueHost";
import { AlwaysMatchesConditionType, IsUndeterminedConditionType, MockCapturingLogger, MockValidationServices, NeverMatchesConditionType, RegisterPredictableConditions } from "../Mocks";
import { InputValueHostType, InputValueHost, InputValueHostGenerator } from '../../src/ValueHosts/InputValueHost';
import { BusinessLogicInputValueHost, BusinessLogicValueHostId } from '../../src/ValueHosts/BusinessLogicInputValueHost';
import { ValueHostId } from '../../src/DataTypes/BasicTypes';
import { IInputValueHost, IInputValueHostDescriptor, IInputValueHostState } from '../../src/Interfaces/InputValueHost';
import { IValidateResult, ValidationResult, IIssueFound, ValidationSeverity, IIssueSnapshot } from '../../src/Interfaces/Validation';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { IModelState, IValidationManager } from '../../src/Interfaces/ValidationManager';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';
import { DeepClone } from '../../src/Utilities/Utilities';

// Subclass of what we want to test to expose internals to tests
class PublicifiedValidationManager extends ValidationManager<IModelState> {
    constructor(services: IValidationServices, descriptors?: Array<IValueHostDescriptor>,
        lastModelState?: IModelState,
        lastValueHostStates?: Array<IValueHostState>,
        callbacks?: IModelCallbacks) {
        super(services, descriptors, lastModelState, lastValueHostStates, callbacks);
    }

    public get ExposedValueHosts(): { [id: string]: IValueHost } {
        return this.ValueHosts;
    }
    public get ExposedValueHostDescriptors(): { [id: string]: IValueHostDescriptor } {
        return this.ValueHostDescriptors;
    }
    public get ExposedModelState(): IModelState {
        return this.ModelState;
    }

}

//  constructor(descriptors?: IValueHostDescriptorsMap,
// lastModelState?: IModelState,
// callbacks?:IModelState
describe('constructor and initial property values', () => {
    test('All parameters undefined creates with no descriptors, an empty state and no callback', () => {
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager(services)).not.toThrow();
        expect(testItem!.Services).toBe(services);
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(0);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.ExposedModelState).not.toBeNull();
        expect(testItem!.ExposedModelState.StateChangeCounter).toBe(0);
        expect(testItem!.OnModelStateChanged).toBeNull();
        expect(testItem!.OnModelValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnWidgetValueChanged).toBeNull();
    });
    test('All parameters null creates with no descriptors, an empty state and no callback', () => {
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager(services,
            null!, null!, null!)).not.toThrow();
        expect(testItem!.Services).toBe(services);
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(0);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.ExposedModelState).not.toBeNull();
        expect(testItem!.ExposedModelState.StateChangeCounter).toBe(0);
        expect(testItem!.OnModelStateChanged).toBeNull();
        expect(testItem!.OnModelValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnWidgetValueChanged).toBeNull();
    });
    test('Empty Descriptor object. Other parameters are null', () => {
        let descriptors: Array<IValueHostDescriptor> = [];
        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            descriptors, null!, null!)).not.toThrow();
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(0);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.ExposedModelState).not.toBeNull();
        expect(testItem!.ExposedModelState.StateChangeCounter).toBe(0);

        expect(testItem!.OnModelStateChanged).toBeNull();
        expect(testItem!.OnModelValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnWidgetValueChanged).toBeNull();
    });
    test('Descriptor for 1 ValueHost supplied. Other parameters are null', () => {
        let descriptors: Array<IValueHostDescriptor> = [{
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        }];
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager(services,
            descriptors, null!, null!)).not.toThrow();
        expect(testItem!.Services).toBe(services);
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(1);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem!.ExposedModelState).not.toBeNull();
        expect(testItem!.ExposedModelState.StateChangeCounter).toBe(0);
        expect(testItem!.OnModelStateChanged).toBeNull();
        expect(testItem!.OnModelValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnWidgetValueChanged).toBeNull();


        // ensure ValueHost is supporting the Descriptor
        expect(testItem!.ExposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem!.ExposedValueHostDescriptors['Field1']).toBe(descriptors[0]);
    });
    test('Empty State object. Other parameters are null', () => {
        let state: IModelState = {};
        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, state, null!)).not.toThrow();
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(0);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.ExposedModelState).not.toBeNull();
        expect(testItem!.ExposedModelState.StateChangeCounter).toBe(0);

        expect(testItem!.OnModelStateChanged).toBeNull();
        expect(testItem!.OnModelValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnWidgetValueChanged).toBeNull();
    });
    test('Descriptor and State for 1 ValueHost supplied. Other parameters are null', () => {
        let descriptors: Array<IValueHostDescriptor> = [{
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        }];
        let state: IModelState = {};
        let lastValueHostStates: Array<IValueHostState> = [];
        lastValueHostStates.push({
            Id: 'Field1',
            Value: 10   // something we can return
        });
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager(services,
            descriptors, state, lastValueHostStates, null!)).not.toThrow();
        expect(testItem!.Services).toBe(services);

        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(1);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem!.ExposedModelState).not.toBeNull();
        expect(testItem!.ExposedModelState.StateChangeCounter).toBe(0);

        expect(testItem!.OnModelStateChanged).toBeNull();
        expect(testItem!.OnModelValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnWidgetValueChanged).toBeNull();


        // ensure ValueHost is supporting the Descriptor and a Value of 10 from State
        expect(testItem!.ExposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);
        expect(testItem!.ExposedValueHosts['Field1'].GetValue()).toBe(10);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem!.ExposedValueHostDescriptors['Field1']).toBe(descriptors[0]);

    });
    test('Callbacks supplied. Other parameters are null', () => {
        let callbacks: IModelCallbacks = {
            OnModelStateChanged: (validationManager: IValidationManager, state: IModelState) => { },
            OnModelValidated: (validationManager: IValidationManager, validateResults: Array<IValidateResult>) => { },
            OnValueHostStateChanged: (valueHost: IValueHost, state: IValueHostState) => { },
            OnValueHostValidated: (valueHost: IInputValueHost, validateResult: IValidateResult) => { },
            OnValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            OnWidgetValueChanged: (valueHost: IInputValueHost, oldValue: any) => { }
        };

        let callback = (valueHost: IValueHost, stateToRetain: IModelState) => {

        };
        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!, callbacks)).not.toThrow();

        expect(testItem!.OnModelStateChanged).toBe(callbacks.OnModelStateChanged);
        expect(testItem!.OnModelValidated).toBe(callbacks.OnModelValidated);
        expect(testItem!.OnValueHostStateChanged).toBe(callbacks.OnValueHostStateChanged);
        expect(testItem!.OnValueHostValidated).toBe(callbacks.OnValueHostValidated);
        expect(testItem!.OnValueChanged).toBe(callbacks.OnValueChanged);
        expect(testItem!.OnWidgetValueChanged).toBe(callbacks.OnWidgetValueChanged);
    });

});
function TestValueHostState(testItem: PublicifiedValidationManager, valueHostId: ValueHostId,
    valueHostState: Partial<IInputValueHostState> | null): void
{
    let valueHost = testItem.ExposedValueHosts[valueHostId] as InputValueHost;
    expect(valueHost).toBeDefined();
    expect(valueHost).toBeInstanceOf(InputValueHost);

    if (!valueHostState)
        valueHostState = {};
    // fill in missing properties from factory CreateState defaults
    let factory = new ValueHostFactory();
    factory.Register(new InputValueHostGenerator());
    let descriptor = testItem.ExposedValueHostDescriptors[valueHostId] as IInputValueHostDescriptor;
    let defaultState = factory.CreateState(descriptor) as IInputValueHostState;    

    let stateToCompare: IInputValueHostState = { ...defaultState, ...valueHostState, };

    // ensure ValueHost has an initial state. Use UpdateState because it is the only time we can see the real state
    valueHost.UpdateState((stateToUpdate) => {
        expect(stateToUpdate).toEqual(stateToCompare);
        return stateToUpdate;
    }, valueHost);        
}

// AddValueHost(descriptor: IValueHostDescriptor): void
describe('ValidationManager.AddValueHost', () => {

    test('New ValueHostDescriptor with no previous state creates ValueHost, adds Descriptor, and creates state', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!, null!);
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.AddValueHost(descriptor, null)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedModelState).not.toBeNull();
        expect(testItem.ExposedModelState.StateChangeCounter).toBe(0);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);

        // Check the valueHosts type and initial state
        TestValueHostState(testItem, 'Field1', null);
    });
    test('Second ValueHost with same Id throws', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor1: IValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.AddValueHost(descriptor1, null)).not.toThrow();
        let descriptor2: IValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.AddValueHost(descriptor1, null)).toThrow();
    });
    test('Add2 Descriptors. ValueHosts and states are generated for both.', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor1: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost1 = testItem.AddValueHost(descriptor1, null);
        let descriptor2: IInputValueHostDescriptor = {
            Id: 'Field2',
            Type: InputValueHostType,
            Label: 'Field 2',
            ValidatorDescriptors: null,
        };
        let initialValueHost2 = testItem.AddValueHost(descriptor2, null);

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(2);
        expect(testItem.ExposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.ExposedValueHosts['Field2']).toBe(initialValueHost2);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(2);
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor1);
        expect(testItem.ExposedValueHostDescriptors['Field2']).toBe(descriptor2);
        expect(testItem.ExposedModelState).not.toBeNull();
        expect(testItem.ExposedModelState.StateChangeCounter).toBe(0);
        
        // Check the valueHosts type and initial state
        TestValueHostState(testItem, 'Field1', null);
        // Check the valueHosts type and initial state
        TestValueHostState(testItem, 'Field2', null);
    });
    test('New ValueHostDescriptor with provided state creates ValueHost, adds Descriptor, and uses the provided state', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!, null!);
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        let state: IValueHostState = {
            Id: 'Field1',
            Value: 'ABC'
        };
        expect(() => testItem.AddValueHost(descriptor, state)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedModelState).not.toBeNull();
        expect(testItem.ExposedModelState.StateChangeCounter).toBe(0);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);

        // Check the valueHosts type and initial state
        TestValueHostState(testItem, 'Field1', {
            Value: 'ABC'
        });
    });    
    test('State with ValidationResult=Valid already exists for the ValueHostDescriptor being added. That state is used', () => {

        let state: IModelState = {};

        let lastState: IInputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid, // something we can return
            Value: 10,   // something we can return,
            IssuesFound: null
        };
        let lastValueHostStates: Array<IValueHostState> = [lastState];
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, state, lastValueHostStates, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: RequiredTextConditionType,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        testItem.AddValueHost(descriptor, null);

        TestValueHostState(testItem, 'Field1', lastState);        
    });
    test('State with ValidationResult=Invalid already exists for the ValueHostDescriptor being added.', () => {

        let state: IModelState = {};
        let lastValueHostStates: Array<IValueHostState> = [];
        let lastState: IInputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid, // something we can return
            Value: 10,   // something we can return,
            IssuesFound: [{
                ErrorMessage: 'msg',
                ValueHostId: 'Field1',
                ConditionType: RequiredTextConditionType,
                Severity: ValidationSeverity.Error
            }]
        };
        lastValueHostStates.push(lastState);
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, state, lastValueHostStates, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: RequiredTextConditionType,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        testItem.AddValueHost(descriptor, null);

        TestValueHostState(testItem, 'Field1', lastState);        
    });    
    test('State already exists in two places: lastValueHostState and as parameter for AddValueHost. State is sourced from AddValueHost.', () => {
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: RequiredTextConditionType,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        let state: IModelState = {};
        let lastValueHostStates: Array<IValueHostState> = [];
        lastValueHostStates.push(<IInputValueHostState>{
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid, // something we can return
            Value: 10   // something we can return
        });
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, state, lastValueHostStates, null!);
        let addState: IInputValueHostState = {
            Id: 'Field1',
            Value: 20,
            ValidationResult: ValidationResult.Invalid,
            IssuesFound: [{
                ErrorMessage: 'msg',
                ValueHostId: 'Field1',
                ConditionType: RequiredTextConditionType,
                Severity: ValidationSeverity.Error
            }]
        };
        testItem.AddValueHost(descriptor, addState);

        TestValueHostState(testItem, 'Field1', addState);        
    });    
    test('State instance is changed after passing in has no impact on stored state', () => {

        let state: IModelState = {};

        let lastState: IInputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid, // something we can return
            Value: 10,   // something we can return,
            IssuesFound: null
        };
        let lastValueHostStates: Array<IValueHostState> = [lastState];
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, state, lastValueHostStates, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: RequiredTextConditionType,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        testItem.AddValueHost(descriptor, null);
        let copiedLastState = DeepClone(lastState) as IInputValueHostState;
        lastState.Value = 20;

        TestValueHostState(testItem, 'Field1', copiedLastState);        
    });    
    test('Null Descriptor throws', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);

        expect(() => testItem.AddValueHost(null!, null)).toThrow();

    });
});

// UpdateValueHost(descriptor: IValueHostDescriptor): void
describe('ValidationManager.UpdateValueHost completely replaces the ValueHost instance', () => {
    test('Replace the descriptor to install a validator', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost = testItem.AddValueHost(descriptor, null);

        let replacementDescriptor = { ...descriptor };
        replacementDescriptor.ValidatorDescriptors = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType,
                },
                ErrorMessage: 'Error'
            }
        ];
        let replacementValidatorDescriptor = replacementDescriptor.ValidatorDescriptors[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.UpdateValueHost(replacementDescriptor, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedModelState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.ExposedValueHostDescriptors['Field1']).not.toBe(descriptor);
        expect(descriptor.ValidatorDescriptors).toBeNull();

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(replacementDescriptor);
        expect(replacementDescriptor.ValidatorDescriptors[0]).toBe(replacementValidatorDescriptor);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        TestValueHostState(testItem, 'Field1', null);
    });
    test('UpdateValueHost works like AddValueHost with unknown ValueHostDescriptor', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.UpdateValueHost(descriptor, null)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedModelState).not.toBeNull();

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);

        // ensure ValueHost is InputValueHost and has an initial state
        TestValueHostState(testItem, 'Field1', null);
    });

    test('Replace the descriptor with existing ValueHostState.ValidationResult of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost = testItem.AddValueHost(descriptor, null);

        let replacementDescriptor = { ...descriptor };
        replacementDescriptor.ValidatorDescriptors = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                },
                ErrorMessage: 'Error'
            }
        ];
        let replacementValidatorDescriptor = replacementDescriptor.ValidatorDescriptors[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.UpdateValueHost(replacementDescriptor, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedModelState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.ExposedValueHostDescriptors['Field1']).not.toBe(descriptor);
        expect(descriptor.ValidatorDescriptors).toBeNull();

        // ensure ValueHost is supporting the Descriptor
        expect(testItem.ExposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(replacementDescriptor);
        expect(replacementDescriptor.ValidatorDescriptors[0]).toBe(replacementValidatorDescriptor);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        TestValueHostState(testItem, 'Field1', null);
    });
    test('Replace the state, keeping the same descriptor. Confirm the state and descriptor', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: AlwaysMatchesConditionType,
                    },
                    ErrorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.AddValueHost(descriptor, null);


        let updateState: IInputValueHostState = {
            Id: 'Field1',
            Value: 40,
            IssuesFound: null,
            ValidationResult: ValidationResult.NotAttempted
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.UpdateValueHost(descriptor, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);
     
        // ensure ValueHost is InputValueHost and has an initial state
        TestValueHostState(testItem, 'Field1', updateState);
    });    
    test('Edit state instance after UpdateValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: AlwaysMatchesConditionType,
                    },
                    ErrorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.AddValueHost(descriptor, null);

        let updateState: IInputValueHostState = {
            Id: 'Field1',
            Value: 40,
            IssuesFound: null,
            ValidationResult: ValidationResult.NotAttempted
        };
        testItem.UpdateValueHost(descriptor, updateState);

        let savedState = DeepClone(updateState);
        updateState.Value = 100;
     
        // ensure ValueHost is InputValueHost and has an initial state
        TestValueHostState(testItem, 'Field1', savedState);
    });        
});
describe('ValidationManager.DiscardValueHost completely removes ValueHost, its state and descriptor', () => {
    test('Discard the only one leaves empty valueHosts, descriptors, and state', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost = testItem.AddValueHost(descriptor, null);

        expect(() => testItem.DiscardValueHost(descriptor)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(0);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem.ExposedModelState).not.toBeNull();

    });

    test('Start with 2 Descriptors and discard one retains only the expected ValueHost, its state and descriptor', () => {
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            null!, null!, null!);
        let descriptor1: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost1 = testItem.AddValueHost(descriptor1, null);
        let descriptor2: IInputValueHostDescriptor = {
            Id: 'Field2',
            Type: InputValueHostType,
            Label: 'Field 2',
            ValidatorDescriptors: null,
        };
        let initialValueHost2 = testItem.AddValueHost(descriptor2, null);

        expect(() => testItem.DiscardValueHost(descriptor2)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor1);
        expect(testItem.ExposedModelState).not.toBeNull();

    });
});
// GetValueHost(valueHostId: ValueHostId): IValueHost | null
describe('ValidationManager.GetValueHost', () => {
    test('With 2 Descriptors, get each.', () => {

        let descriptor1: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let descriptor2: IInputValueHostDescriptor = {
            Id: 'Field2',
            Type: InputValueHostType,
            Label: 'Field 2',
            ValidatorDescriptors: null,
        };
        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            [descriptor1, descriptor2], null!, null!);
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.GetValueHost('Field1')).not.toThrow();
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.GetId()).toBe('Field1');
        let vh2: IValueHost | null = null;
        expect(() => vh2 = testItem.GetValueHost('Field2')).not.toThrow();
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.GetId()).toBe('Field2');
    });
    test('When supplying an unknown ValueHostId, return null.', () => {

        let descriptor1: IInputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };

        let testItem = new PublicifiedValidationManager(new MockValidationServices(false, false),
            [descriptor1], null!, null!);
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.GetValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();
    });
});

function SetupValidationManager(descriptors?: Array<IInputValueHostDescriptor> | null,
    lastModelState?: IModelState | null,
    callbacks?: IModelCallbacks): {
        services: IValidationServices,
        validationManager: IValidationManager
    } {
    let services = new ValidationServices();
    let vm = new PublicifiedValidationManager(services, descriptors!, lastModelState!, [], callbacks);

    let conditionFactory = new ConditionFactory();
    RegisterStandardConditions(conditionFactory);
    RegisterPredictableConditions(conditionFactory);
    services.ConditionFactory = conditionFactory;
    services.LoggerService = new MockCapturingLogger();
    services.DataTypeResolverService = new DataTypeResolver();
    services.MessageTokenResolverService = new MessageTokenResolver();
    return {
        services: services,
        validationManager: vm
    }
}

function TestIssueFound(actual: IIssueFound, expected: Partial<IIssueFound>): void {
    let untypedActual = actual as any;
    let untypedExpected = expected as any;
    Object.keys(untypedExpected).every((key) => {
        expect(untypedActual[key]).toBe(untypedExpected[key]);
        return true;
    });
}
function TestIssueFoundFromValidateResults(validateResults: Array<IValidateResult>,
    indexIntoResults: number,
    expectedValidationResult: ValidationResult,
    expectedIssuesFound: Array<Partial<IIssueFound>> | null): void {
    expect(validateResults).not.toBeNull();
    expect(validateResults.length).toBeGreaterThan(indexIntoResults);
    expect(validateResults[indexIntoResults].ValidationResult).toBe(expectedValidationResult);
    let issuesFound = validateResults[indexIntoResults].IssuesFound;
    if (issuesFound) {
        if (expectedIssuesFound) {
            for (let eif of expectedIssuesFound) {
                if (!eif.ConditionType)
                    throw new Error('Forgot to set ConditionType property on IssueFound')
                expect(issuesFound).not.toBeNull();
                let type = eif.ConditionType!;
                let issueFound = issuesFound.find((value) => value.ConditionType === type);
                expect(issueFound).toBeDefined();
                TestIssueFound(issueFound!, eif);
            }
        }
    }
    else
        expect(issuesFound).toBeNull();
}
function SetupInputValueHostDescriptor(fieldIndex: number,
    conditionTypes: Array<string> | null): IInputValueHostDescriptor {
    let labelNumber = fieldIndex + 1;
    let descriptor: IInputValueHostDescriptor = {
        Id: `Field${labelNumber}`,
        Type: InputValueHostType,
        Label: `Field ${labelNumber}`,
        ValidatorDescriptors: null,
    };
    if (conditionTypes)
        for (let conditionType of conditionTypes) {
            if (!descriptor.ValidatorDescriptors)
                descriptor.ValidatorDescriptors = [];
            descriptor.ValidatorDescriptors.push({
                ConditionDescriptor: {
                    Type: conditionType
                },
                ErrorMessage: `Error ${labelNumber}: ${conditionType}`,
                SummaryErrorMessage: `Summary ${labelNumber}: ${conditionType}`
            });
        }

    return descriptor;
}

// Validate(group?: string): Array<IValidateResult>
// get IsValid(): boolean
// DoNotSaveNativeValue(): boolean
// GetIssuesForWidget(valueHostId: ValueHostId): Array<IIssueSnapshot>
// GetIssuesForSummary(group?: string): Array<IIssueSnapshot>
describe('ValidationManager.Validate, and IsValid, DoNotSaveNativeValue, GetIssuesForWidget, GetIssuesForSummary based on the results', () => {
    test('Before calling Validate with 0 inputValueHosts, IsValid=true, DoNotSave=false, GetIssuesNearWidget=[], GetIssuesInSummary=[]', () => {
        let config = SetupValidationManager();
        expect(config.validationManager.IsValid).toBe(true);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(false);
        expect(config.validationManager.GetIssuesForWidget('Anything')).toEqual([]);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([]);
    });
    test('IsValid is true and DoNotSaveNativeValue is false before calling Validate with 1 inputValueHosts', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let config = SetupValidationManager([descriptor]);
        expect(config.validationManager.IsValid).toBe(true);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(false);
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost that is ValidationResult.Valid, returns 1 IValidateResult', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        expect(() => validateResults = config.validationManager.Validate()).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        expect(config.validationManager.IsValid).toBe(true);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(false);
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost that is ValidationResult.Invalid, returns 1 IValidateResult', () => {

        let descriptor = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        expect(() => validateResults = config.validationManager.Validate()).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid,
            [{
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field1',
                ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
                SummaryErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }]);

        expect(config.validationManager.IsValid).toBe(false);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(true);
        let widgetSnapshot: IIssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([widgetSnapshot]);
        let summarySnapshot: IIssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
        };
        expect(config.validationManager.GetIssuesForSummary()).toEqual([summarySnapshot]);
    });
    test('With 1 inputValueHost that has 2 validators with Match and NoMatch, returns 2 IValidateResults and is Invalid', () => {

        let descriptor = SetupInputValueHostDescriptor(0, [AlwaysMatchesConditionType, NeverMatchesConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        expect(() => validateResults = config.validationManager.Validate()).not.toThrow();


        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid,
            [{
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field1',
                ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
                SummaryErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }
            ]);
        expect(config.validationManager.IsValid).toBe(false);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(true);

        let widgetSnapshot: IIssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([widgetSnapshot]);
        let summarySnapshot: IIssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
        };
        expect(config.validationManager.GetIssuesForSummary()).toEqual([summarySnapshot]);
    });
    test('With 2 inputValueHost that are both valid, returns 2 IValidateResults without issues found', () => {

        let descriptor1 = SetupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let descriptor2 = SetupInputValueHostDescriptor(1, [AlwaysMatchesConditionType]);

        let config = SetupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<IValidateResult> = [];
        expect(() => validateResults = config.validationManager.Validate()).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        TestIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Valid, null);
        expect(config.validationManager.IsValid).toBe(true);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(false);

        expect(config.validationManager.GetIssuesForWidget(descriptor1.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForWidget(descriptor2.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([]);
    });
    test('With 2 inputValueHost that are both undetermined, returns 2 IValidateResults without issues found. IsValid=true. DoNotSave=false', () => {

        let descriptor1 = SetupInputValueHostDescriptor(0, [IsUndeterminedConditionType]);
        let descriptor2 = SetupInputValueHostDescriptor(1, [IsUndeterminedConditionType]);

        let config = SetupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<IValidateResult> = [];
        expect(() => validateResults = config.validationManager.Validate()).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Undetermined, null);
        TestIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Undetermined, null);
        expect(config.validationManager.IsValid).toBe(true);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(false);
        expect(config.validationManager.GetIssuesForWidget(descriptor1.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForWidget(descriptor2.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([]);
    });
    test('With 2 inputValueHost that are both Invalid, returns 2 IValidateResults each with 1 issue found. IsValid=false. DoNotSave=true', () => {

        let descriptor1 = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let descriptor2 = SetupInputValueHostDescriptor(1, [NeverMatchesConditionType]);

        let config = SetupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<IValidateResult> = [];
        expect(() => validateResults = config.validationManager.Validate()).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [
            {
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field1',
                ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
                SummaryErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }
        ]);
        TestIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Invalid, [
            {
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field2',
                ErrorMessage: 'Error 2: ' + NeverMatchesConditionType,
                SummaryErrorMessage: 'Summary 2: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }
        ]);
        expect(config.validationManager.IsValid).toBe(false);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(true);

        let widgetSnapshot1: IIssueSnapshot = {
            Id: descriptor1.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(config.validationManager.GetIssuesForWidget(descriptor1.Id)).toEqual([widgetSnapshot1]);
        let widgetSnapshot2: IIssueSnapshot = {
            Id: descriptor2.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 2: ' + NeverMatchesConditionType,
        };
        expect(config.validationManager.GetIssuesForWidget(descriptor2.Id)).toEqual([widgetSnapshot2]);
        let summarySnapshot1: IIssueSnapshot = {
            Id: descriptor1.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
        };
        let summarySnapshot2: IIssueSnapshot = {
            Id: descriptor2.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 2: ' + NeverMatchesConditionType,
        };
        expect(config.validationManager.GetIssuesForSummary()).toEqual([summarySnapshot1, summarySnapshot2]);
    });
    test('With 1 BusinessLogicError not associated with any ValueHost, IsValid=false, DoNotSave=true, GetIssuesForSummary has the businesslogicerror, and there is a new ValueHost for the BusinessLogic', () => {
        let config = SetupValidationManager();
        config.validationManager.SetBusinessLogicErrors([
            {
                ErrorMessage: 'BL_ERROR'
            }
        ]);
        expect(config.validationManager.IsValid).toBe(false);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(true);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([<IIssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: BusinessLogicValueHostId
        }]);
        expect(config.validationManager.GetValueHost(BusinessLogicValueHostId)).toBeInstanceOf(BusinessLogicInputValueHost);

        expect(config.validationManager.GetIssuesForWidget(BusinessLogicValueHostId)).toEqual([<IIssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: BusinessLogicValueHostId
        }]);
    });
    test('With 1 ValueHost that is assigned without validators 1 BusinessLogicError, IsValid=false, DoNotSave=true, GetIssuesForSummary has the businesslogicerror, and there is a no ValueHost for the BusinessLogic', () => {

        let descriptor = SetupInputValueHostDescriptor(0, []);
        let config = SetupValidationManager([descriptor]);
        config.validationManager.SetBusinessLogicErrors([
            {
                ErrorMessage: 'BL_ERROR',
                AssociatedValueHostId: descriptor.Id
            }
        ]);
        expect(config.validationManager.IsValid).toBe(false);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(true);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([<IIssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: descriptor.Id
        }]);
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([<IIssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: descriptor.Id
        }]);

        expect(config.validationManager.GetValueHost(BusinessLogicValueHostId)).toBeNull();
        expect(config.validationManager.GetIssuesForWidget(BusinessLogicValueHostId)).toEqual([]);
    });
    test('With 1 ValueHost that is assigned with 1 validator that is NoMatch, 1 BusinessLogicError not associated with a ValueHost, IsValid=false, DoNotSave=true, GetIssuesForSummary has both errors businesslogicerror, BLValueHost has the BLError, InputValueHost has its own error', () => {

        let descriptor = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        descriptor.ValidatorDescriptors![0].ErrorMessage = 'CONDITION ERROR';
        descriptor.ValidatorDescriptors![0].SummaryErrorMessage = 'SUMMARY CONDITION ERROR';
        let config = SetupValidationManager([descriptor]);
        config.validationManager.SetBusinessLogicErrors([
            {
                ErrorMessage: 'BL_ERROR',
            }
        ]);
        config.validationManager.Validate();
        expect(config.validationManager.IsValid).toBe(false);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(true);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([
            <IIssueSnapshot>{
                ErrorMessage: 'SUMMARY CONDITION ERROR',
                Severity: ValidationSeverity.Error,
                Id: descriptor.Id
            },
            <IIssueSnapshot>{
                ErrorMessage: 'BL_ERROR',
                Severity: ValidationSeverity.Error,
                Id: BusinessLogicValueHostId
            }]);
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([<IIssueSnapshot>{
            ErrorMessage: 'CONDITION ERROR',
            Severity: ValidationSeverity.Error,
            Id: descriptor.Id
        }]);

        expect(config.validationManager.GetValueHost(BusinessLogicValueHostId)).toBeInstanceOf(BusinessLogicInputValueHost);
        expect(config.validationManager.GetIssuesForWidget(BusinessLogicValueHostId)).toEqual(
            [<IIssueSnapshot>{
                ErrorMessage: 'BL_ERROR',
                Severity: ValidationSeverity.Error,
                Id: BusinessLogicValueHostId
            }]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option Preliminary=true, expect ValidationResult.Valid because Required should be skipped, leaving NO validators which means Valid', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [RequiredTextConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        (config.validationManager.GetValueHost('Field1')! as IInputValueHost).SetWidgetValue('');
        expect(() => validateResults = config.validationManager.Validate({ Preliminary: true })).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        expect(config.validationManager.IsValid).toBe(true);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(false);
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option Preliminary=false, expect ValidationResult.Invalid because Preliminary is off', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [RequiredTextConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        (config.validationManager.GetValueHost('Field1')! as IInputValueHost).SetWidgetValue('');
        expect(() => validateResults = config.validationManager.Validate({ Preliminary: false })).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [{
            ConditionType: RequiredTextConditionType,
            ValueHostId: 'Field1',
            ErrorMessage: 'Error 1: ' + RequiredTextConditionType,
            SummaryErrorMessage: 'Summary 1: ' + RequiredTextConditionType,
            Severity: ValidationSeverity.Severe // only because Required conditions default to Severe
        }
        ]);
        expect(config.validationManager.IsValid).toBe(false);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(true);
        let widgetSnapshot: IIssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Severe, // only because Required conditions default to Severe
            ErrorMessage: 'Error 1: ' + RequiredTextConditionType,
        };
        expect(config.validationManager.GetIssuesForWidget(descriptor.Id)).toEqual([widgetSnapshot]);
        let summarySnapshot: IIssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Severe, // only because Required conditions default to Severe
            ErrorMessage: 'Summary 1: ' + RequiredTextConditionType,
        };
        expect(config.validationManager.GetIssuesForSummary()).toEqual([summarySnapshot]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option DuringEdit=true, expect normal Invalid as DuringEdit has no impact on Required validators', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [RequiredTextConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        (config.validationManager.GetValueHost('Field1')! as IInputValueHost).SetWidgetValue('');
        expect(() => validateResults = config.validationManager.Validate({ DuringEdit: true })).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, null);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit has no impact on Required validators', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [RequiredTextConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        (config.validationManager.GetValueHost('Field1')! as IInputValueHost).SetWidgetValue('');
        expect(() => validateResults = config.validationManager.Validate({ DuringEdit: false })).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, null);
    });
    test('With 1 inputValueHost and a NeverMatch condition, use option DuringEdit=true, expect condition to be skipped and ValidationResult=valid', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        (config.validationManager.GetValueHost('Field1')! as IInputValueHost).SetWidgetValue('');
        expect(() => validateResults = config.validationManager.Validate({ DuringEdit: true })).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
    });
    test('With 1 inputValueHost and a NeverMatch condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit=false has no impact on including validators', () => {
        let descriptor = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let config = SetupValidationManager([descriptor]);

        let validateResults: Array<IValidateResult> = [];
        (config.validationManager.GetValueHost('Field1')! as IInputValueHost).SetWidgetValue('');
        expect(() => validateResults = config.validationManager.Validate({ DuringEdit: false })).not.toThrow();

        TestIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, null);
    });
    test('OnModelValidated callback test', () => {
        let changeMe = false;
        let callback = (vm: IValidationManager, validateResults: Array<IValidateResult>) => {
            changeMe = true;
        }
        let descriptor = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let config = SetupValidationManager([descriptor], null, {
            OnModelValidated: callback
        });

        let validateResults: Array<IValidateResult> = [];
        expect(() => validateResults = config.validationManager.Validate()).not.toThrow();

        expect(changeMe).toBe(true);
    });
});
describe('ValidationManager.ClearValidator', () => {
    test('With 2 inputValueHost that are both Invalid, returns 2 IValidateResults each with 1 issue found. IsValid=false. DoNotSave=true', () => {

        let descriptor1 = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let descriptor2 = SetupInputValueHostDescriptor(1, [NeverMatchesConditionType]);

        let config = SetupValidationManager([descriptor1, descriptor2]);

        config.validationManager.Validate();
        expect(() => config.validationManager.ClearValidation()).not.toThrow();
        expect(config.validationManager.IsValid).toBe(true);
        expect(config.validationManager.DoNotSaveNativeValue()).toBe(false);
        expect(config.validationManager.GetIssuesForWidget(descriptor1.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForWidget(descriptor2.Id)).toEqual([]);
        expect(config.validationManager.GetIssuesForSummary()).toEqual([]);
    });
});
// UpdateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValidationManager.UpdateState', () => {
    interface ITestExtendedModelState extends IModelState {
        Value: number;
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedModelState) => ITestExtendedModelState, callback: ModelStateChangedHandler | null): Array<ITestExtendedModelState> {

        let descriptor = SetupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let state: ITestExtendedModelState = {
            Value: initialValue
        }
        let config = SetupValidationManager([descriptor], state, {
            OnModelStateChanged: callback
        });
        let testItem = config.validationManager as ValidationManager<ITestExtendedModelState>;
        let changes: Array<ITestExtendedModelState> = [];
        let fn = (stateToUpdate: ITestExtendedModelState): ITestExtendedModelState => {
            let lastValue = stateToUpdate.Value;
            stateToUpdate = testCallback(stateToUpdate);
            if (lastValue !== stateToUpdate.Value)
                changes.push(stateToUpdate);
            return stateToUpdate;
        };

        // try several times
        for (let i = 1; i <= 3; i++) {
            expect(() => testItem.UpdateState(fn)).not.toThrow();
        }
        return changes;
    }
    test('Update value with +1 results in new instance of State',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedModelState): ITestExtendedModelState => {
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
            let testCallback = (stateToUpdate: ITestExtendedModelState): ITestExtendedModelState => {
                return stateToUpdate;
            };
            const initialValue = 100;
            let changes = testUpdateState(initialValue, testCallback, null);
            expect(changes.length).toBe(0);
        });
    test('Update value with +1 results in new instance of State and report thru OnModelChanged',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedModelState): ITestExtendedModelState => {
                stateToUpdate.Value = stateToUpdate.Value + 1;
                return stateToUpdate;
            };
            const initialValue = 100;
            let onModelChanges: Array<ITestExtendedModelState> = [];
            let changes = testUpdateState(initialValue, testCallback, (vm, state) => {
                onModelChanges.push(state as ITestExtendedModelState);
            });
            expect(changes.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(changes[i - 1].Value).toBe(initialValue + i);
            }
            expect(onModelChanges.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(onModelChanges[i - 1].Value).toBe(initialValue + i);
            }
        });
    test('Update value with +0 results in no change to the state instance nor reported to OnModelChanged callback',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedModelState): ITestExtendedModelState => {
                return stateToUpdate;
            };
            const initialValue = 100;
            let onModelChanges: Array<ITestExtendedModelState> = [];
            let changes = testUpdateState(initialValue, testCallback, (vm, state) => {
                onModelChanges.push(state as ITestExtendedModelState);
            });
            expect(changes.length).toBe(0);
        });
    test('Updater function is null throws',
        () => {
            let config = SetupValidationManager();
            let testItem = config.validationManager as ValidationManager<ITestExtendedModelState>;
            expect(() => testItem.UpdateState(null!)).toThrow(/updater/);
        });
});