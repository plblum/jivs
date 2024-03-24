import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValidationManagerCallbacks, toIValidationManagerCallbacks, ValidationManager, ValidationManagerStateChangedHandler } from "../../src/ValueHosts/ValidationManager";
import { IValueHost, ValueHostDescriptor, ValueHostState } from "../../src/Interfaces/ValueHost";
import { AlwaysMatchesConditionType, IsUndeterminedConditionType, MockCapturingLogger, MockValidationManager, MockValidationServices, NeverMatchesConditionType, registerTestingOnlyConditions } from "../Mocks";
import { InputValueHostType, InputValueHost, InputValueHostGenerator } from '../../src/ValueHosts/InputValueHost';
import { BusinessLogicInputValueHost, BusinessLogicValueHostId } from '../../src/ValueHosts/BusinessLogicInputValueHost';
import { ValueHostId } from '../../src/DataTypes/BasicTypes';
import { IInputValueHost, InputValueHostDescriptor, InputValueHostState } from '../../src/Interfaces/InputValueHost';
import { ValidateResult, ValidationResult, IssueFound, ValidationSeverity, IssueSnapshot } from '../../src/Interfaces/Validation';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { IValidationManager, ValidationManagerConfig, ValidationManagerState } from '../../src/Interfaces/ValidationManager';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';
import { deepClone } from '../../src/Utilities/Utilities';
import { IValueHostResolver, IValueHostsManager, IValueHostsManagerAccessor, toIValueHostResolver, toIValueHostsManager, toIValueHostsManagerAccessor } from '../../src/Interfaces/ValueHostResolver';
import { NonInputValueHost } from '../../src/ValueHosts/NonInputValueHost';
import { createDataTypeServices, registerConditions } from '../../starter_code/create_services';
import { ConditionType } from "../../src/Conditions/ConditionTypes";

// Subclass of what we want to test to expose internals to tests
class PublicifiedValidationManager extends ValidationManager<ValidationManagerState> {
    constructor(setup: ValidationManagerConfig) {
        super(setup);
    }

    public get ExposedValueHosts(): { [id: string]: IValueHost } {
        return this.ValueHosts;
    }
    public get ExposedValueHostDescriptors(): { [id: string]: ValueHostDescriptor } {
        return this.ValueHostDescriptors;
    }
    public get ExposedState(): ValidationManagerState {
        return this.State;
    }

}

//  constructor(config: ValidationManagerConfig)
describe('constructor and initial property values', () => {
    test('No descriptors (empty array), an empty state and no callback', () => {
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ Services: services, ValueHostDescriptors: [] })).not.toThrow();
        expect(testItem!.Services).toBe(services);
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(0);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.ExposedState).not.toBeNull();
        expect(testItem!.ExposedState.StateChangeCounter).toBe(0);
        expect(testItem!.OnStateChanged).toBeNull();
        expect(testItem!.OnValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnInputValueChanged).toBeNull();
    });
    test('null config parameter throws', () => {
        let testItem: PublicifiedValidationManager | null = null;

        expect(() => testItem = new PublicifiedValidationManager(null!)).toThrow(/config/);
    
    });

    test('Descriptor for 1 ValueHost supplied. Other parameters are null', () => {
        let descriptors: Array<ValueHostDescriptor> = [{
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        }];
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ Services: services, ValueHostDescriptors: descriptors })).not.toThrow();
        expect(testItem!.Services).toBe(services);
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(1);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem!.ExposedState).not.toBeNull();
        expect(testItem!.ExposedState.StateChangeCounter).toBe(0);
        expect(testItem!.OnStateChanged).toBeNull();
        expect(testItem!.OnValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnInputValueChanged).toBeNull();


        // ensure ValueHost is supporting the Descriptor
        expect(testItem!.ExposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem!.ExposedValueHostDescriptors['Field1']).not.toBe(descriptors[0]);
        expect(testItem!.ExposedValueHostDescriptors['Field1']).toEqual(descriptors[0]);
    });
    test('Empty State object. Other parameters are null', () => {
        let state: ValidationManagerState = {};
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager(
            { Services: services, ValueHostDescriptors: [], SavedState: state })).not.toThrow();
        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(0);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.ExposedState).not.toBeNull();
        expect(testItem!.ExposedState.StateChangeCounter).toBe(0);

        expect(testItem!.OnStateChanged).toBeNull();
        expect(testItem!.OnValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnInputValueChanged).toBeNull();
    });
    test('Descriptor and ValueHostState for 1 ValueHost supplied. Other parameters are null', () => {
        let descriptors: Array<ValueHostDescriptor> = [{
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        }];
        let savedState: ValidationManagerState = {};
        let savedValueHostStates: Array<ValueHostState> = [];
        savedValueHostStates.push({
            Id: 'Field1',
            Value: 10   // something we can return
        });
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({
            Services: services, ValueHostDescriptors: descriptors,
            SavedState: savedState, SavedValueHostStates: savedValueHostStates
        })).not.toThrow();
        expect(testItem!.Services).toBe(services);

        expect(testItem!.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHosts).length).toBe(1);
        expect(testItem!.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem!.ExposedState).not.toBeNull();
        expect(testItem!.ExposedState.StateChangeCounter).toBe(0);

        expect(testItem!.OnStateChanged).toBeNull();
        expect(testItem!.OnValidated).toBeNull();
        expect(testItem!.OnValueHostStateChanged).toBeNull();
        expect(testItem!.OnValueHostValidated).toBeNull();
        expect(testItem!.OnValueChanged).toBeNull();
        expect(testItem!.OnInputValueChanged).toBeNull();


        // ensure ValueHost is supporting the Descriptor and a Value of 10 from State
        expect(testItem!.ExposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);
        expect(testItem!.ExposedValueHosts['Field1'].getValue()).toBe(10);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem!.ExposedValueHostDescriptors['Field1']).not.toBe(descriptors[0]);
        expect(testItem!.ExposedValueHostDescriptors['Field1']).toStrictEqual(descriptors[0]);
    });
    test('Callbacks supplied. Other parameters are null', () => {
        let config: ValidationManagerConfig = {
            Services: new MockValidationServices(false, false),
            ValueHostDescriptors: [],
            OnStateChanged: (validationManager: IValidationManager, state: ValidationManagerState) => { },
            OnValidated: (validationManager: IValidationManager, validateResults: Array<ValidateResult>) => { },
            OnValueHostStateChanged: (valueHost: IValueHost, state: ValueHostState) => { },
            OnValueHostValidated: (valueHost: IInputValueHost, validateResult: ValidateResult) => { },
            OnValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            OnInputValueChanged: (valueHost: IInputValueHost, oldValue: any) => { }
        };

        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(config)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.OnStateChanged).not.toBeNull();
        expect(testItem!.OnValidated).not.toBeNull();
        expect(testItem!.OnValueHostStateChanged).not.toBeNull();
        expect(testItem!.OnValueHostValidated).not.toBeNull();
        expect(testItem!.OnValueChanged).not.toBeNull();
        expect(testItem!.OnInputValueChanged).not.toBeNull();
    });

});
function testValueHostState(testItem: PublicifiedValidationManager, valueHostId: ValueHostId,
    valueHostState: Partial<InputValueHostState> | null): void
{
    let valueHost = testItem.ExposedValueHosts[valueHostId] as InputValueHost;
    expect(valueHost).toBeDefined();
    expect(valueHost).toBeInstanceOf(InputValueHost);

    if (!valueHostState)
        valueHostState = {};
    // fill in missing properties from factory CreateState defaults
    let factory = new ValueHostFactory();
    factory.register(new InputValueHostGenerator());
    let descriptor = testItem.ExposedValueHostDescriptors[valueHostId] as InputValueHostDescriptor;
    let defaultState = factory.createState(descriptor) as InputValueHostState;    

    let stateToCompare: InputValueHostState = { ...defaultState, ...valueHostState, };

    // ensure ValueHost has an initial state. Use UpdateState because it is the only time we can see the real state
    valueHost.updateState((stateToUpdate) => {
        expect(stateToUpdate).toEqual(stateToCompare);
        return stateToUpdate;
    }, valueHost);        
}

// AddValueHost(descriptor: ValueHostDescriptor): void
describe('ValidationManager.AddValueHost', () => {

    test('New ValueHostDescriptor with no previous state creates ValueHost, adds Descriptor, and creates state', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: ValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.addValueHost(descriptor, null)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedState).not.toBeNull();
        expect(testItem.ExposedState.StateChangeCounter).toBe(0);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);

        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('Second ValueHost with same Id throws', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor1: ValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.addValueHost(descriptor1, null)).not.toThrow();
        let descriptor2: ValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.addValueHost(descriptor1, null)).toThrow();
    });
    test('Add2 Descriptors. ValueHosts and states are generated for both.', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor1: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost1 = testItem.addValueHost(descriptor1, null);
        let descriptor2: InputValueHostDescriptor = {
            Id: 'Field2',
            Type: InputValueHostType,
            Label: 'Field 2',
            ValidatorDescriptors: null,
        };
        let initialValueHost2 = testItem.addValueHost(descriptor2, null);

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(2);
        expect(testItem.ExposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.ExposedValueHosts['Field2']).toBe(initialValueHost2);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(2);
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor1);
        expect(testItem.ExposedValueHostDescriptors['Field2']).toBe(descriptor2);
        expect(testItem.ExposedState).not.toBeNull();
        expect(testItem.ExposedState.StateChangeCounter).toBe(0);
        
        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', null);
        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field2', null);
    });
    test('New ValueHostDescriptor with provided state creates ValueHost, adds Descriptor, and uses the provided state', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: ValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        let state: ValueHostState = {
            Id: 'Field1',
            Value: 'ABC'
        };
        expect(() => testItem.addValueHost(descriptor, state)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedState).not.toBeNull();
        expect(testItem.ExposedState.StateChangeCounter).toBe(0);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);

        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', {
            Value: 'ABC'
        });
    });    
    test('State with ValidationResult=Valid already exists for the ValueHostDescriptor being added. That state is used', () => {

        let savedState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid, // something we can return
            Value: 10,   // something we can return,
            IssuesFound: null
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];
        let testItem = new PublicifiedValidationManager({
            Services: new MockValidationServices(false, false), ValueHostDescriptors: [],
            SavedState: savedState, SavedValueHostStates: savedValueHostStates
        });
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: ConditionType.RequiredText,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(descriptor, null);

        testValueHostState(testItem, 'Field1', savedValueHostState);        
    });
    test('State with ValidationResult=Invalid already exists for the ValueHostDescriptor being added.', () => {

        let savedState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid, // something we can return
            Value: 10,   // something we can return,
            IssuesFound: [{
                ErrorMessage: 'msg',
                ValueHostId: 'Field1',
                ConditionType: ConditionType.RequiredText,
                Severity: ValidationSeverity.Error
            }]
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];      
        let testItem = new PublicifiedValidationManager({
            Services: new MockValidationServices(false, false), ValueHostDescriptors: [],
            SavedState: savedState, SavedValueHostStates: savedValueHostStates
        });
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: ConditionType.RequiredText,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(descriptor, null);

        testValueHostState(testItem, 'Field1', savedValueHostState);        
    });    
    test('State already exists in two places: lastValueHostState and as parameter for AddValueHost. State is sourced from AddValueHost.', () => {
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: ConditionType.RequiredText,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        let savedState: ValidationManagerState = {};
        let savedValueHostStates: Array<ValueHostState> = [];
        savedValueHostStates.push(<InputValueHostState>{
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid, // something we can return
            Value: 10   // something we can return
        });
        let testItem = new PublicifiedValidationManager({
            Services: new MockValidationServices(false, false), ValueHostDescriptors: [],
            SavedState: savedState, SavedValueHostStates: savedValueHostStates
        });
        let addState: InputValueHostState = {
            Id: 'Field1',
            Value: 20,
            ValidationResult: ValidationResult.Invalid,
            IssuesFound: [{
                ErrorMessage: 'msg',
                ValueHostId: 'Field1',
                ConditionType: ConditionType.RequiredText,
                Severity: ValidationSeverity.Error
            }]
        };
        testItem.addValueHost(descriptor, addState);

        testValueHostState(testItem, 'Field1', addState);        
    });    
    test('State instance is changed after passing in has no impact on stored state', () => {

        let lastState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid, // something we can return
            Value: 10,   // something we can return,
            IssuesFound: null
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];
        let testItem = new PublicifiedValidationManager({
            Services: new MockValidationServices(false, false), ValueHostDescriptors: [],
            SavedState: lastState, SavedValueHostStates: savedValueHostStates
        });
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: ConditionType.RequiredText,
                    },
                    ErrorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(descriptor, null);
        let copiedLastState = deepClone(savedValueHostState) as InputValueHostState;
        savedValueHostState.Value = 20;

        testValueHostState(testItem, 'Field1', copiedLastState);        
    });    
});

// UpdateValueHost(descriptor: ValueHostDescriptor): void
describe('ValidationManager.UpdateValueHost completely replaces the ValueHost instance', () => {
    test('Replace the descriptor to install a validator', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

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
        expect(() => replacementValueHost = testItem.updateValueHost(replacementDescriptor, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.ExposedValueHostDescriptors['Field1']).not.toBe(descriptor);
        expect(descriptor.ValidatorDescriptors).toBeNull();

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(replacementDescriptor);
        expect(replacementDescriptor.ValidatorDescriptors[0]).toBe(replacementValidatorDescriptor);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('UpdateValueHost works like AddValueHost with unknown ValueHostDescriptor', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: ValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1'
        };
        expect(() => testItem.updateValueHost(descriptor, null)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedState).not.toBeNull();

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });

    test('Replace the descriptor with existing ValueHostState.ValidationResult of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

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
        expect(() => replacementValueHost = testItem.updateValueHost(replacementDescriptor, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.ExposedValueHostDescriptors['Field1']).not.toBe(descriptor);
        expect(descriptor.ValidatorDescriptors).toBeNull();

        // ensure ValueHost is supporting the Descriptor
        expect(testItem.ExposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(replacementDescriptor);
        expect(replacementDescriptor.ValidatorDescriptors[0]).toBe(replacementValidatorDescriptor);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('Replace the state, keeping the same descriptor. Confirm the state and descriptor', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
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
        let initialValueHost = testItem.addValueHost(descriptor, null);

        let updateState: InputValueHostState = {
            Id: 'Field1',
            Value: 40,
            IssuesFound: null,
            ValidationResult: ValidationResult.NotAttempted
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(descriptor, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor);
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', updateState);
    });    
    test('Edit state instance after UpdateValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
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
        let initialValueHost = testItem.addValueHost(descriptor, null);

        let updateState: InputValueHostState = {
            Id: 'Field1',
            Value: 40,
            IssuesFound: null,
            ValidationResult: ValidationResult.NotAttempted
        };
        testItem.updateValueHost(descriptor, updateState);

        let savedState = deepClone(updateState);
        updateState.Value = 100;
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', savedState);
    });        
});
describe('ValidationManager.DiscardValueHost completely removes ValueHost, its state and descriptor', () => {
    test('After adding in the VM Config, discard the only one leaves empty valueHosts, descriptors, and state', () => {
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let config: ValidationManagerConfig = {
            Services: new MockValidationServices(false, false),
            ValueHostDescriptors: [descriptor],
            SavedValueHostStates: [{
                Id: descriptor.Id,
                Value: 10
            }]
        };
        let testItem = new PublicifiedValidationManager(config);
        expect(testItem.getValueHost(descriptor.Id)!.getValue()).toBe(10);  // to prove later this is deleted

        expect(() => testItem.discardValueHost(descriptor)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(0);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem.ExposedState).not.toBeNull();

        // add back the descriptor to confirm the original state (value=10) was discarded
        let addedVH = testItem.addValueHost(descriptor, null);
        expect(addedVH.getValue()).toBeUndefined();

    });    
    test('Discard the only one leaves empty valueHosts, descriptors, and state', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

        expect(() => testItem.discardValueHost(descriptor)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(0);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(0);
        expect(testItem.ExposedState).not.toBeNull();

    });

    test('Start with 2 Descriptors and discard one retains only the expected ValueHost, its state and descriptor', () => {
        let testItem = new PublicifiedValidationManager({ Services: new MockValidationServices(false, false), ValueHostDescriptors: [] });
        let descriptor1: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let initialValueHost1 = testItem.addValueHost(descriptor1, null);
        let descriptor2: InputValueHostDescriptor = {
            Id: 'Field2',
            Type: InputValueHostType,
            Label: 'Field 2',
            ValidatorDescriptors: null,
        };
        let initialValueHost2 = testItem.addValueHost(descriptor2, null);

        expect(() => testItem.discardValueHost(descriptor2)).not.toThrow();

        expect(testItem.ExposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHosts).length).toBe(1);
        expect(testItem.ExposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.ExposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.ExposedValueHostDescriptors).length).toBe(1);
        expect(testItem.ExposedValueHostDescriptors['Field1']).toBe(descriptor1);
        expect(testItem.ExposedState).not.toBeNull();

    });
});
// GetValueHost(valueHostId: ValueHostId): IValueHost | null
describe('ValidationManager.GetValueHost', () => {
    test('With 2 Descriptors, get each.', () => {

        let descriptor1: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };
        let descriptor2: InputValueHostDescriptor = {
            Id: 'Field2',
            Type: InputValueHostType,
            Label: 'Field 2',
            ValidatorDescriptors: null,
        };
        let testItem = new PublicifiedValidationManager({
            Services: new MockValidationServices(false, false),
            ValueHostDescriptors: [descriptor1, descriptor2]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Field1')).not.toThrow();
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getId()).toBe('Field1');
        let vh2: IValueHost | null = null;
        expect(() => vh2 = testItem.getValueHost('Field2')).not.toThrow();
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.getId()).toBe('Field2');
    });
    test('When supplying an unknown ValueHostId, return null.', () => {

        let descriptor1: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: 'Field 1',
            ValidatorDescriptors: null,
        };

        let testItem = new PublicifiedValidationManager({
            Services: new MockValidationServices(false, false),
            ValueHostDescriptors: [descriptor1]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();
    });
});

function setupValidationManager(descriptors?: Array<InputValueHostDescriptor> | null,
    savedState?: ValidationManagerState | null,
    callbacks?: IValidationManagerCallbacks): {
        services: IValidationServices,
        validationManager: IValidationManager
    } {
    let services = new ValidationServices();
    let conditionFactory = new ConditionFactory();
    registerConditions(conditionFactory);
    registerTestingOnlyConditions(conditionFactory);
    services.ConditionFactory = conditionFactory;
    services.LoggerService = new MockCapturingLogger();
    services.DataTypeServices = createDataTypeServices();
    services.MessageTokenResolverService = new MessageTokenResolver();
    
    let config: ValidationManagerConfig = {
        Services: services,
        ValueHostDescriptors: descriptors!,
        SavedState: savedState!,
        SavedValueHostStates: []
    };
    if (callbacks)
        config = { ...callbacks, ...config } as ValidationManagerConfig;
    let vm = new PublicifiedValidationManager(config);

    return {
        services: services,
        validationManager: vm
    };
}

function testIssueFound(actual: IssueFound, expected: Partial<IssueFound>): void {
    let untypedActual = actual as any;
    let untypedExpected = expected as any;
    Object.keys(untypedExpected).every((key) => {
        expect(untypedActual[key]).toBe(untypedExpected[key]);
        return true;
    });
}
function testIssueFoundFromValidateResults(validateResults: Array<ValidateResult>,
    indexIntoResults: number,
    expectedValidationResult: ValidationResult,
    expectedIssuesFound: Array<Partial<IssueFound>> | null): void {
    expect(validateResults).not.toBeNull();
    expect(validateResults.length).toBeGreaterThan(indexIntoResults);
    expect(validateResults[indexIntoResults].ValidationResult).toBe(expectedValidationResult);
    let issuesFound = validateResults[indexIntoResults].IssuesFound;
    if (issuesFound) {
        if (expectedIssuesFound) {
            for (let eif of expectedIssuesFound) {
                if (!eif.ConditionType)
                    throw new Error('Forgot to set ConditionType property on IssueFound');
                expect(issuesFound).not.toBeNull();
                let type = eif.ConditionType!;
                let issueFound = issuesFound.find((value) => value.ConditionType === type);
                expect(issueFound).toBeDefined();
                testIssueFound(issueFound!, eif);
            }
        }
    }
    else
        expect(issuesFound).toBeNull();
}
function setupInputValueHostDescriptor(fieldIndex: number,
    conditionTypes: Array<string> | null): InputValueHostDescriptor {
    let labelNumber = fieldIndex + 1;
    let descriptor: InputValueHostDescriptor = {
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
                SummaryMessage: `Summary ${labelNumber}: ${conditionType}`
            });
        }

    return descriptor;
}

// Validate(group?: string): Array<ValidateResult>
// get IsValid(): boolean
// DoNotSaveNativeValue(): boolean
// GetIssuesForInput(valueHostId: ValueHostId): Array<IssueSnapshot>
// GetIssuesForSummary(group?: string): Array<IssueSnapshot>
describe('ValidationManager.Validate, and IsValid, DoNotSaveNativeValue, GetIssuesForInput, GetIssuesForSummary based on the results', () => {
    test('Before calling Validate with 0 inputValueHosts, IsValid=true, DoNotSave=false, GetIssuesForInput=[], GetIssuesForSummary=[]', () => {
        let setup = setupValidationManager();
        expect(setup.validationManager.IsValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput('Anything')).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('IsValid is true and DoNotSaveNativeValue is false before calling Validate with 1 inputValueHosts', () => {
        let descriptor = setupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);
        expect(setup.validationManager.IsValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost that is ValidationResult.Valid, returns 1 ValidateResult', () => {
        let descriptor = setupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        expect(setup.validationManager.IsValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost that is ValidationResult.Invalid, returns 1 ValidateResult', () => {

        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid,
            [{
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field1',
                ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
                SummaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }]);

        expect(setup.validationManager.IsValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        let inputSnapshot: IssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([inputSnapshot]);
        let summarySnapshot: IssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForSummary()).toEqual([summarySnapshot]);
    });
    test('With 1 inputValueHost that has 2 validators with Match and NoMatch, returns 2 ValidateResults and is Invalid', () => {

        let descriptor = setupInputValueHostDescriptor(0, [AlwaysMatchesConditionType, NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();


        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid,
            [{
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field1',
                ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
                SummaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }
            ]);
        expect(setup.validationManager.IsValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);

        let inputSnapshot: IssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([inputSnapshot]);
        let summarySnapshot: IssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForSummary()).toEqual([summarySnapshot]);
    });
    test('With 2 inputValueHost that are both valid, returns 2 ValidateResults without issues found', () => {

        let descriptor1 = setupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let descriptor2 = setupInputValueHostDescriptor(1, [AlwaysMatchesConditionType]);

        let setup = setupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        testIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Valid, null);
        expect(setup.validationManager.IsValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);

        expect(setup.validationManager.getIssuesForInput(descriptor1.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForInput(descriptor2.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 2 inputValueHost that are both undetermined, returns 2 ValidateResults without issues found. IsValid=true. DoNotSave=false', () => {

        let descriptor1 = setupInputValueHostDescriptor(0, [IsUndeterminedConditionType]);
        let descriptor2 = setupInputValueHostDescriptor(1, [IsUndeterminedConditionType]);

        let setup = setupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Undetermined, null);
        testIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Undetermined, null);
        expect(setup.validationManager.IsValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor1.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForInput(descriptor2.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 2 inputValueHost that are both Invalid, returns 2 ValidateResults each with 1 issue found. IsValid=false. DoNotSave=true', () => {

        let descriptor1 = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let descriptor2 = setupInputValueHostDescriptor(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [
            {
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field1',
                ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
                SummaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }
        ]);
        testIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Invalid, [
            {
                ConditionType: NeverMatchesConditionType,
                ValueHostId: 'Field2',
                ErrorMessage: 'Error 2: ' + NeverMatchesConditionType,
                SummaryMessage: 'Summary 2: ' + NeverMatchesConditionType,
                Severity: ValidationSeverity.Error
            }
        ]);
        expect(setup.validationManager.IsValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);

        let inputSnapshot1: IssueSnapshot = {
            Id: descriptor1.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor1.Id)).toEqual([inputSnapshot1]);
        let inputSnapshot2: IssueSnapshot = {
            Id: descriptor2.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Error 2: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor2.Id)).toEqual([inputSnapshot2]);
        let summarySnapshot1: IssueSnapshot = {
            Id: descriptor1.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 1: ' + NeverMatchesConditionType,
        };
        let summarySnapshot2: IssueSnapshot = {
            Id: descriptor2.Id,
            Severity: ValidationSeverity.Error,
            ErrorMessage: 'Summary 2: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForSummary()).toEqual([summarySnapshot1, summarySnapshot2]);
    });
    test('With 1 BusinessLogicError not associated with any ValueHost, IsValid=false, DoNotSave=true, GetIssuesForSummary has the businesslogicerror, and there is a new ValueHost for the BusinessLogic', () => {
        let setup = setupValidationManager();
        setup.validationManager.setBusinessLogicErrors([
            {
                ErrorMessage: 'BL_ERROR'
            }
        ]);
        expect(setup.validationManager.IsValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([<IssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: BusinessLogicValueHostId
        }]);
        expect(setup.validationManager.getValueHost(BusinessLogicValueHostId)).toBeInstanceOf(BusinessLogicInputValueHost);

        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostId)).toEqual([<IssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: BusinessLogicValueHostId
        }]);
    });
    test('With 1 ValueHost that is assigned without validators 1 BusinessLogicError, IsValid=false, DoNotSave=true, GetIssuesForSummary has the businesslogicerror, and there is a no ValueHost for the BusinessLogic', () => {

        let descriptor = setupInputValueHostDescriptor(0, []);
        let setup = setupValidationManager([descriptor]);
        setup.validationManager.setBusinessLogicErrors([
            {
                ErrorMessage: 'BL_ERROR',
                AssociatedValueHostId: descriptor.Id
            }
        ]);
        expect(setup.validationManager.IsValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([<IssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: descriptor.Id
        }]);
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([<IssueSnapshot>{
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error,
            Id: descriptor.Id
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicValueHostId)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostId)).toEqual([]);
    });
    test('With 1 ValueHost that is assigned with 1 validator that is NoMatch, 1 BusinessLogicError not associated with a ValueHost, IsValid=false, DoNotSave=true, GetIssuesForSummary has both errors businesslogicerror, BLValueHost has the BLError, InputValueHost has its own error', () => {

        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        descriptor.ValidatorDescriptors![0].ErrorMessage = 'CONDITION ERROR';
        descriptor.ValidatorDescriptors![0].SummaryMessage = 'SUMMARY CONDITION ERROR';
        let setup = setupValidationManager([descriptor]);
        setup.validationManager.setBusinessLogicErrors([
            {
                ErrorMessage: 'BL_ERROR',
            }
        ]);
        setup.validationManager.validate();
        expect(setup.validationManager.IsValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([
            <IssueSnapshot>{
                ErrorMessage: 'SUMMARY CONDITION ERROR',
                Severity: ValidationSeverity.Error,
                Id: descriptor.Id
            },
            <IssueSnapshot>{
                ErrorMessage: 'BL_ERROR',
                Severity: ValidationSeverity.Error,
                Id: BusinessLogicValueHostId
            }]);
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([<IssueSnapshot>{
            ErrorMessage: 'CONDITION ERROR',
            Severity: ValidationSeverity.Error,
            Id: descriptor.Id
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicValueHostId)).toBeInstanceOf(BusinessLogicInputValueHost);
        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostId)).toEqual(
            [<IssueSnapshot>{
                ErrorMessage: 'BL_ERROR',
                Severity: ValidationSeverity.Error,
                Id: BusinessLogicValueHostId
            }]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option Preliminary=true, expect ValidationResult.Valid because Required should be skipped, leaving NO validators which means Valid', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ Preliminary: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        expect(setup.validationManager.IsValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option Preliminary=false, expect ValidationResult.Invalid because Preliminary is off', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ Preliminary: false })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [{
            ConditionType: ConditionType.RequiredText,
            ValueHostId: 'Field1',
            ErrorMessage: 'Error 1: ' + ConditionType.RequiredText,
            SummaryMessage: 'Summary 1: ' + ConditionType.RequiredText,
            Severity: ValidationSeverity.Severe // only because Required conditions default to Severe
        }
        ]);
        expect(setup.validationManager.IsValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        let inputSnapshot: IssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Severe, // only because Required conditions default to Severe
            ErrorMessage: 'Error 1: ' + ConditionType.RequiredText,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor.Id)).toEqual([inputSnapshot]);
        let summarySnapshot: IssueSnapshot = {
            Id: descriptor.Id,
            Severity: ValidationSeverity.Severe, // only because Required conditions default to Severe
            ErrorMessage: 'Summary 1: ' + ConditionType.RequiredText,
        };
        expect(setup.validationManager.getIssuesForSummary()).toEqual([summarySnapshot]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option DuringEdit=true, expect normal Invalid as DuringEdit has no impact on Required validators', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ DuringEdit: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, null);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit has no impact on Required validators', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ DuringEdit: false })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, null);
    });
    test('With 1 inputValueHost and a NeverMatch condition, use option DuringEdit=true, expect condition to be skipped and ValidationResult=valid', () => {
        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ DuringEdit: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
    });
    test('With 1 inputValueHost and a NeverMatch condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit=false has no impact on including validators', () => {
        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ DuringEdit: false })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, null);
    });
    test('OnValidated callback test', () => {
        let changeMe = false;
        let callback = (vm: IValidationManager, validateResults: Array<ValidateResult>) => {
            changeMe = true;
        };
        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor], null, {
            OnValidated: callback
        });

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        expect(changeMe).toBe(true);
    });
});
describe('ValidationManager.ClearValidator', () => {
    test('With 2 inputValueHost that are both Invalid, returns 2 ValidateResults each with 1 issue found. IsValid=false. DoNotSave=true', () => {

        let descriptor1 = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let descriptor2 = setupInputValueHostDescriptor(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([descriptor1, descriptor2]);

        setup.validationManager.validate();
        expect(() => setup.validationManager.clearValidation()).not.toThrow();
        expect(setup.validationManager.IsValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor1.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForInput(descriptor2.Id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
});
// UpdateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValidationManager.UpdateState', () => {
    interface ITestExtendedState extends ValidationManagerState {
        Value: number;
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedState) => ITestExtendedState, callback: ValidationManagerStateChangedHandler | null): Array<ITestExtendedState> {

        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let state: ITestExtendedState = {
            Value: initialValue
        };
        let setup = setupValidationManager([descriptor], state, {
            OnStateChanged: callback
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
            expect(() => testItem.updateState(fn)).not.toThrow();
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
    test('Update value with +1 results in new instance of State and report thru UpdateState',
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
    test('Update value with +0 results in no change to the state instance nor seen in UpdateState',
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
            expect(() => testItem.updateState(null!)).toThrow(/updater/);
        });
});
describe('ToIValueHostResolverfunction', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostResolver = {
            getValueHost: (id) => { return <any>{}; },
            Services: new MockValidationServices(false, false),
        };
        expect(toIValueHostResolver(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            Services: new ValidationServices(),
            ValueHostDescriptors: []
        });
        expect(toIValueHostResolver(testItem)).toBe(testItem);
    });    
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValueHostResolver(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValueHostResolver(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValueHostResolver(100)).toBeNull();
    });        
});
describe('ToIValueHostsManager function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostsManager = {
            getValueHost: (id) => { return <any>{}; },
            Services: new MockValidationServices(false, false),
            notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { }
        };
        expect(toIValueHostsManager(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            Services: new ValidationServices(),
            ValueHostDescriptors: []
        });
        expect(toIValueHostsManager(testItem)).toBe(testItem);
    });    
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValueHostsManager(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValueHostsManager(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValueHostsManager(100)).toBeNull();
    });        
});
describe('ToIValueHostsManagerAccessor function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostsManagerAccessor = {
            ValueHostsManager :{
                getValueHost: (id) => { return <any>{}; },
                Services: new MockValidationServices(false, false),
                notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { }
            }
        };
        expect(toIValueHostsManagerAccessor(testItem)).toBe(testItem);
    });
    test('ValueHost matches and returns itself.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new NonInputValueHost(vm, {
            Id: 'Field1',
            Label: 'Label1',
        },
        {
            Id: 'Field1',
            Value: undefined
        });
        expect(toIValueHostsManagerAccessor(testItem)).toBe(testItem);
    });    
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValueHostsManagerAccessor(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValueHostsManagerAccessor(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValueHostsManagerAccessor(100)).toBeNull();
    });        
});
describe('ToIValidationManagerCallbacks function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValidationManagerCallbacks = {
            OnValueChanged: (vh: IValueHost, old: any) => {},
            OnValueHostStateChanged: (vh: IValueHost, state: ValueHostState) => {},
            OnInputValueChanged: (vh: IInputValueHost, old: any)  => {},
            OnValueHostValidated: (vh: IInputValueHost, validationResult: ValidateResult) => { },
            OnStateChanged: (vm, state) => { },
            OnValidated: (vm, results) => { }
        };
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            Services: new ValidationServices(),
            ValueHostDescriptors: []
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