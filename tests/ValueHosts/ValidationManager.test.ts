import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValidationManagerCallbacks, toIValidationManagerCallbacks, ValidationManager, ValidationManagerStateChangedHandler } from "../../src/ValueHosts/ValidationManager";
import { IValueHost, ValueHostDescriptor, ValueHostState } from "../../src/Interfaces/ValueHost";
import { AlwaysMatchesConditionType, IsUndeterminedConditionType, MockCapturingLogger, MockValidationManager, MockValidationServices, NeverMatchesConditionType, registerTestingOnlyConditions } from "../Mocks";
import { InputValueHost, InputValueHostGenerator } from '../../src/ValueHosts/InputValueHost';
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
import { RegExpConditionDescriptor } from "../../src/Conditions/ConcreteConditions";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";

// Subclass of what we want to test to expose internals to tests
class PublicifiedValidationManager extends ValidationManager<ValidationManagerState> {
    constructor(setup: ValidationManagerConfig) {
        super(setup);
    }

    public get exposedValueHosts(): { [id: string]: IValueHost } {
        return this.valueHosts;
    }
    public get exposedValueHostDescriptors(): { [id: string]: ValueHostDescriptor } {
        return this.valueHostDescriptors;
    }
    public get exposedState(): ValidationManagerState {
        return this.state;
    }

}

//  constructor(config: ValidationManagerConfig)
describe('constructor and initial property values', () => {
    test('No descriptors (empty array), an empty state and no callback', () => {
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ services: services, valueHostDescriptors: [] })).not.toThrow();
        expect(testItem!.services).toBe(services);
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(0);
        expect(testItem!.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
    });
    test('null config parameter throws', () => {
        let testItem: PublicifiedValidationManager | null = null;

        expect(() => testItem = new PublicifiedValidationManager(null!)).toThrow(/config/);
    
    });

    test('Descriptor for 1 ValueHost supplied. Other parameters are null', () => {
        let descriptors: Array<ValueHostDescriptor> = [{
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1'
        }];
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ services: services, valueHostDescriptors: descriptors })).not.toThrow();
        expect(testItem!.services).toBe(services);
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(1);
        expect(testItem!.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();


        // ensure ValueHost is supporting the Descriptor
        expect(testItem!.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem!.exposedValueHostDescriptors['Field1']).not.toBe(descriptors[0]);
        expect(testItem!.exposedValueHostDescriptors['Field1']).toEqual(descriptors[0]);
    });
    test('Empty State object. Other parameters are null', () => {
        let state: ValidationManagerState = {};
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager(
            { services: services, valueHostDescriptors: [], savedState: state })).not.toThrow();
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(0);
        expect(testItem!.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostDescriptors).length).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
    });
    test('Descriptor and ValueHostState for 1 ValueHost supplied. Other parameters are null', () => {
        let descriptors: Array<ValueHostDescriptor> = [{
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1'
        }];
        let savedState: ValidationManagerState = {};
        let savedValueHostStates: Array<ValueHostState> = [];
        savedValueHostStates.push({
            id: 'Field1',
            value: 10   // something we can return
        });
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({
            services: services, valueHostDescriptors: descriptors,
            savedState: savedState, savedValueHostStates: savedValueHostStates
        })).not.toThrow();
        expect(testItem!.services).toBe(services);

        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(1);
        expect(testItem!.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();


        // ensure ValueHost is supporting the Descriptor and a Value of 10 from State
        expect(testItem!.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);
        expect(testItem!.exposedValueHosts['Field1'].getValue()).toBe(10);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem!.exposedValueHostDescriptors['Field1']).not.toBe(descriptors[0]);
        expect(testItem!.exposedValueHostDescriptors['Field1']).toStrictEqual(descriptors[0]);
    });
    test('Callbacks supplied. Other parameters are null', () => {
        let config: ValidationManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostDescriptors: [],
            onStateChanged: (validationManager: IValidationManager, state: ValidationManagerState) => { },
            onValidated: (validationManager: IValidationManager, validateResults: Array<ValidateResult>) => { },
            onValueHostStateChanged: (valueHost: IValueHost, state: ValueHostState) => { },
            onValueHostValidated: (valueHost: IInputValueHost, validateResult: ValidateResult) => { },
            onValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            onInputValueChanged: (valueHost: IInputValueHost, oldValue: any) => { }
        };

        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(config)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onStateChanged).not.toBeNull();
        expect(testItem!.onValidated).not.toBeNull();
        expect(testItem!.onValueHostStateChanged).not.toBeNull();
        expect(testItem!.onValueHostValidated).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
    });

});
function testValueHostState(testItem: PublicifiedValidationManager, valueHostId: ValueHostId,
    valueHostState: Partial<InputValueHostState> | null): void
{
    let valueHost = testItem.exposedValueHosts[valueHostId] as InputValueHost;
    expect(valueHost).toBeDefined();
    expect(valueHost).toBeInstanceOf(InputValueHost);

    if (!valueHostState)
        valueHostState = {};
    // fill in missing properties from factory createState defaults
    let factory = new ValueHostFactory();
    factory.register(new InputValueHostGenerator());
    let descriptor = testItem.exposedValueHostDescriptors[valueHostId] as InputValueHostDescriptor;
    let defaultState = factory.createState(descriptor) as InputValueHostState;    

    let stateToCompare: InputValueHostState = { ...defaultState, ...valueHostState, };

    // ensure ValueHost has an initial state. Use updateState() because it is the only time we can see the real state
    valueHost.updateState((stateToUpdate) => {
        expect(stateToUpdate).toEqual(stateToCompare);
        return stateToUpdate;
    }, valueHost);        
}

// addValueHost(descriptor: ValueHostDescriptor): void
describe('ValidationManager.addValueHost', () => {

    test('New ValueHostDescriptor with no previous state creates ValueHost, adds Descriptor, and creates state', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(descriptor, null)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(descriptor);

        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('Second ValueHost with same Id throws', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor1: ValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(descriptor1, null)).not.toThrow();
        let descriptor2: ValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(descriptor1, null)).toThrow();
    });
    test('Add2 Descriptors. ValueHosts and states are generated for both.', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor1: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };
        let initialValueHost1 = testItem.addValueHost(descriptor1, null);
        let descriptor2: InputValueHostDescriptor = {
            id: 'Field2',
            type: ValueHostType.Input,
            label: 'Field 2',
            validatorDescriptors: null,
        };
        let initialValueHost2 = testItem.addValueHost(descriptor2, null);

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(2);
        expect(testItem.exposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.exposedValueHosts['Field2']).toBe(initialValueHost2);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(2);
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(descriptor1);
        expect(testItem.exposedValueHostDescriptors['Field2']).toBe(descriptor2);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);
        
        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', null);
        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field2', null);
    });
    test('New ValueHostDescriptor with provided state creates ValueHost, adds Descriptor, and uses the provided state', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1'
        };
        let state: ValueHostState = {
            id: 'Field1',
            value: 'ABC'
        };
        expect(() => testItem.addValueHost(descriptor, state)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(descriptor);

        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', {
            value: 'ABC'
        });
    });    
    test('State with ValidationResult=Valid already exists for the ValueHostDescriptor being added. That state is used', () => {

        let savedState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostDescriptors: [],
            savedState: savedState, savedValueHostStates: savedValueHostStates
        });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: ConditionType.RequiredText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(descriptor, null);

        testValueHostState(testItem, 'Field1', savedValueHostState);        
    });
    test('State with ValidationResult=Invalid already exists for the ValueHostDescriptor being added.', () => {

        let savedState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid, // something we can return
            value: 10,   // something we can return,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostId: 'Field1',
                conditionType: ConditionType.RequiredText,
                severity: ValidationSeverity.Error
            }]
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];      
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostDescriptors: [],
            savedState: savedState, savedValueHostStates: savedValueHostStates
        });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: ConditionType.RequiredText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(descriptor, null);

        testValueHostState(testItem, 'Field1', savedValueHostState);        
    });    
    test('State already exists in two places: lastValueHostState and as parameter for addValueHost. State is sourced from addValueHost.', () => {
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: ConditionType.RequiredText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        let savedState: ValidationManagerState = {};
        let savedValueHostStates: Array<ValueHostState> = [];
        savedValueHostStates.push(<InputValueHostState>{
            id: 'Field1',
            validationResult: ValidationResult.Valid, // something we can return
            value: 10   // something we can return
        });
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostDescriptors: [],
            savedState: savedState, savedValueHostStates: savedValueHostStates
        });
        let addState: InputValueHostState = {
            id: 'Field1',
            value: 20,
            validationResult: ValidationResult.Invalid,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostId: 'Field1',
                conditionType: ConditionType.RequiredText,
                severity: ValidationSeverity.Error
            }]
        };
        testItem.addValueHost(descriptor, addState);

        testValueHostState(testItem, 'Field1', addState);        
    });    
    test('State instance is changed after passing in has no impact on stored state', () => {

        let lastState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostDescriptors: [],
            savedState: lastState, savedValueHostStates: savedValueHostStates
        });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: ConditionType.RequiredText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(descriptor, null);
        let copiedLastState = deepClone(savedValueHostState) as InputValueHostState;
        savedValueHostState.value = 20;

        testValueHostState(testItem, 'Field1', copiedLastState);        
    });    
});

// updateValueHost(descriptor: ValueHostDescriptor): void
describe('ValidationManager.updateValueHost completely replaces the ValueHost instance', () => {
    test('Replace the descriptor to install a validator', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

        let replacementDescriptor = { ...descriptor };
        replacementDescriptor.validatorDescriptors = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType,
                },
                errorMessage: 'Error'
            }
        ];
        let replacementValidatorDescriptor = replacementDescriptor.validatorDescriptors[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(replacementDescriptor, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostDescriptors['Field1']).not.toBe(descriptor);
        expect(descriptor.validatorDescriptors).toBeNull();

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(replacementDescriptor);
        expect(replacementDescriptor.validatorDescriptors[0]).toBe(replacementValidatorDescriptor);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('updateValueHost works like addValueHost with unknown ValueHostDescriptor', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.updateValueHost(descriptor, null)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(descriptor);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });

    test('Replace the descriptor with existing ValueHostState.ValidationResult of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

        let replacementDescriptor = { ...descriptor };
        replacementDescriptor.validatorDescriptors = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                },
                errorMessage: 'Error'
            }
        ];
        let replacementValidatorDescriptor = replacementDescriptor.validatorDescriptors[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(replacementDescriptor, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostDescriptors['Field1']).not.toBe(descriptor);
        expect(descriptor.validatorDescriptors).toBeNull();

        // ensure ValueHost is supporting the Descriptor
        expect(testItem.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(replacementDescriptor);
        expect(replacementDescriptor.validatorDescriptors[0]).toBe(replacementValidatorDescriptor);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('Replace the state, keeping the same descriptor. Confirm the state and descriptor', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

        let updateState: InputValueHostState = {
            id: 'Field1',
            value: 40,
            issuesFound: null,
            validationResult: ValidationResult.NotAttempted
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(descriptor, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Descriptor is the same as the one supplied
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(descriptor);
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', updateState);
    });    
    test('Edit state instance after updateValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

        let updateState: InputValueHostState = {
            id: 'Field1',
            value: 40,
            issuesFound: null,
            validationResult: ValidationResult.NotAttempted
        };
        testItem.updateValueHost(descriptor, updateState);

        let savedState = deepClone(updateState);
        updateState.value = 100;
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', savedState);
    });        
});
describe('ValidationManager.discardValueHost completely removes ValueHost, its state and descriptor', () => {
    test('After adding in the VM Config, discard the only one leaves empty valueHosts, descriptors, and state', () => {
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };
        let config: ValidationManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostDescriptors: [descriptor],
            savedValueHostStates: [{
                id: descriptor.id,
                value: 10
            }]
        };
        let testItem = new PublicifiedValidationManager(config);
        expect(testItem.getValueHost(descriptor.id)!.getValue()).toBe(10);  // to prove later this is deleted

        expect(() => testItem.discardValueHost(descriptor)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(0);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(0);
        expect(testItem.exposedState).not.toBeNull();

        // add back the descriptor to confirm the original state (value=10) was discarded
        let addedVH = testItem.addValueHost(descriptor, null);
        expect(addedVH.getValue()).toBeUndefined();

    });    
    test('Discard the only one leaves empty valueHosts, descriptors, and state', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };
        let initialValueHost = testItem.addValueHost(descriptor, null);

        expect(() => testItem.discardValueHost(descriptor)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(0);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(0);
        expect(testItem.exposedState).not.toBeNull();

    });

    test('Start with 2 Descriptors and discard one retains only the expected ValueHost, its state and descriptor', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostDescriptors: [] });
        let descriptor1: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };
        let initialValueHost1 = testItem.addValueHost(descriptor1, null);
        let descriptor2: InputValueHostDescriptor = {
            id: 'Field2',
            type: ValueHostType.Input,
            label: 'Field 2',
            validatorDescriptors: null,
        };
        let initialValueHost2 = testItem.addValueHost(descriptor2, null);

        expect(() => testItem.discardValueHost(descriptor2)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.exposedValueHostDescriptors).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostDescriptors).length).toBe(1);
        expect(testItem.exposedValueHostDescriptors['Field1']).toBe(descriptor1);
        expect(testItem.exposedState).not.toBeNull();

    });
});
// getValueHost(valueHostId: ValueHostId): IValueHost | null
describe('ValidationManager.getValueHost', () => {
    test('With 2 Descriptors, get each.', () => {

        let descriptor1: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };
        let descriptor2: InputValueHostDescriptor = {
            id: 'Field2',
            type: ValueHostType.Input,
            label: 'Field 2',
            validatorDescriptors: null,
        };
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostDescriptors: [descriptor1, descriptor2]
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
            id: 'Field1',
            type: ValueHostType.Input,
            label: 'Field 1',
            validatorDescriptors: null,
        };

        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostDescriptors: [descriptor1]
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
    services.conditionFactory = conditionFactory;
    services.loggerService = new MockCapturingLogger();
    services.dataTypeServices = createDataTypeServices();
    services.messageTokenResolverService = new MessageTokenResolver();
    
    let config: ValidationManagerConfig = {
        services: services,
        valueHostDescriptors: descriptors!,
        savedState: savedState!,
        savedValueHostStates: []
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
    expect(validateResults[indexIntoResults].validationResult).toBe(expectedValidationResult);
    let issuesFound = validateResults[indexIntoResults].issuesFound;
    if (issuesFound) {
        if (expectedIssuesFound) {
            for (let eif of expectedIssuesFound) {
                if (!eif.conditionType)
                    throw new Error('Forgot to set ConditionType property on IssueFound');
                expect(issuesFound).not.toBeNull();
                let type = eif.conditionType!;
                let issueFound = issuesFound.find((value) => value.conditionType === type);
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
        id: `Field${labelNumber}`,
        type: ValueHostType.Input,
        label: `Field ${labelNumber}`,
        validatorDescriptors: null,
    };
    if (conditionTypes)
        for (let conditionType of conditionTypes) {
            if (!descriptor.validatorDescriptors)
                descriptor.validatorDescriptors = [];
            descriptor.validatorDescriptors.push({
                conditionDescriptor: {
                    type: conditionType
                },
                errorMessage: `Error ${labelNumber}: ${conditionType}`,
                summaryMessage: `Summary ${labelNumber}: ${conditionType}`
            });
        }

    return descriptor;
}

// validate(group?: string): Array<ValidateResult>
// get isValid(): boolean
// doNotSaveNativeValue(): boolean
// getIssuesForInput(valueHostId: ValueHostId): Array<IssueSnapshot>
// getIssuesForSummary(group?: string): Array<IssueSnapshot>
describe('ValidationManager.validate, and isValid, doNotSaveNativeValue, getIssuesForInput, getIssuesForSummary based on the results', () => {
    test('Before calling validate with 0 inputValueHosts, isValid=true, doNotSaveNativeValue=false, getIssuesForInput=[], getIssuesForSummary=[]', () => {
        let setup = setupValidationManager();
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput('Anything')).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('isValid is true and doNotSaveNativeValue is false before calling validate with 1 inputValueHosts', () => {
        let descriptor = setupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost that is ValidationResult.Valid, returns 1 ValidateResult', () => {
        let descriptor = setupInputValueHostDescriptor(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost that is ValidationResult.Invalid, returns 1 ValidateResult', () => {

        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid,
            [{
                conditionType: NeverMatchesConditionType,
                valueHostId: 'Field1',
                errorMessage: 'Error 1: ' + NeverMatchesConditionType,
                summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
                severity: ValidationSeverity.Error
            }]);

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        let inputSnapshot: IssueSnapshot = {
            id: descriptor.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([inputSnapshot]);
        let summarySnapshot: IssueSnapshot = {
            id: descriptor.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Summary 1: ' + NeverMatchesConditionType,
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
                conditionType: NeverMatchesConditionType,
                valueHostId: 'Field1',
                errorMessage: 'Error 1: ' + NeverMatchesConditionType,
                summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
                severity: ValidationSeverity.Error
            }
            ]);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);

        let inputSnapshot: IssueSnapshot = {
            id: descriptor.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([inputSnapshot]);
        let summarySnapshot: IssueSnapshot = {
            id: descriptor.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Summary 1: ' + NeverMatchesConditionType,
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
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);

        expect(setup.validationManager.getIssuesForInput(descriptor1.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForInput(descriptor2.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 2 inputValueHost that are both undetermined, returns 2 ValidateResults without issues found. isValid=true. DoNotSave=false', () => {

        let descriptor1 = setupInputValueHostDescriptor(0, [IsUndeterminedConditionType]);
        let descriptor2 = setupInputValueHostDescriptor(1, [IsUndeterminedConditionType]);

        let setup = setupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Undetermined, null);
        testIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Undetermined, null);
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor1.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForInput(descriptor2.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 2 inputValueHost that are both Invalid, returns 2 ValidateResults each with 1 issue found. isValid=false. DoNotSave=true', () => {

        let descriptor1 = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let descriptor2 = setupInputValueHostDescriptor(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([descriptor1, descriptor2]);

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [
            {
                conditionType: NeverMatchesConditionType,
                valueHostId: 'Field1',
                errorMessage: 'Error 1: ' + NeverMatchesConditionType,
                summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
                severity: ValidationSeverity.Error
            }
        ]);
        testIssueFoundFromValidateResults(validateResults, 1, ValidationResult.Invalid, [
            {
                conditionType: NeverMatchesConditionType,
                valueHostId: 'Field2',
                errorMessage: 'Error 2: ' + NeverMatchesConditionType,
                summaryMessage: 'Summary 2: ' + NeverMatchesConditionType,
                severity: ValidationSeverity.Error
            }
        ]);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);

        let inputSnapshot1: IssueSnapshot = {
            id: descriptor1.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor1.id)).toEqual([inputSnapshot1]);
        let inputSnapshot2: IssueSnapshot = {
            id: descriptor2.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Error 2: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor2.id)).toEqual([inputSnapshot2]);
        let summarySnapshot1: IssueSnapshot = {
            id: descriptor1.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Summary 1: ' + NeverMatchesConditionType,
        };
        let summarySnapshot2: IssueSnapshot = {
            id: descriptor2.id,
            severity: ValidationSeverity.Error,
            errorMessage: 'Summary 2: ' + NeverMatchesConditionType,
        };
        expect(setup.validationManager.getIssuesForSummary()).toEqual([summarySnapshot1, summarySnapshot2]);
    });
    test('With 1 BusinessLogicError not associated with any ValueHost, isValid=false, DoNotSave=true, getIssuesForSummary has the businesslogicerror, and there is a new ValueHost for the BusinessLogic', () => {
        let setup = setupValidationManager();
        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ]);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([<IssueSnapshot>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            id: BusinessLogicValueHostId
        }]);
        expect(setup.validationManager.getValueHost(BusinessLogicValueHostId)).toBeInstanceOf(BusinessLogicInputValueHost);

        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostId)).toEqual([<IssueSnapshot>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            id: BusinessLogicValueHostId
        }]);
    });
    test('With 1 ValueHost that is assigned without validators 1 BusinessLogicError, isValid=false, DoNotSave=true, getIssuesForSummary has the businesslogicerror, and there is a no ValueHost for the BusinessLogic', () => {

        let descriptor = setupInputValueHostDescriptor(0, []);
        let setup = setupValidationManager([descriptor]);
        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
                associatedValueHostId: descriptor.id
            }
        ]);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([<IssueSnapshot>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            id: descriptor.id
        }]);
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([<IssueSnapshot>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            id: descriptor.id
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicValueHostId)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostId)).toEqual([]);
    });
    test('With 1 ValueHost that is assigned with 1 validator that is NoMatch, 1 BusinessLogicError not associated with a ValueHost, isValid=false, DoNotSave=true, getIssuesForSummary has both errors businesslogicerror, BLValueHost has the BLError, InputValueHost has its own error', () => {

        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        descriptor.validatorDescriptors![0].errorMessage = 'CONDITION ERROR';
        descriptor.validatorDescriptors![0].summaryMessage = 'SUMMARY CONDITION ERROR';
        let setup = setupValidationManager([descriptor]);
        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
            }
        ]);
        setup.validationManager.validate();
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([
            <IssueSnapshot>{
                errorMessage: 'SUMMARY CONDITION ERROR',
                severity: ValidationSeverity.Error,
                id: descriptor.id
            },
            <IssueSnapshot>{
                errorMessage: 'BL_ERROR',
                severity: ValidationSeverity.Error,
                id: BusinessLogicValueHostId
            }]);
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([<IssueSnapshot>{
            errorMessage: 'CONDITION ERROR',
            severity: ValidationSeverity.Error,
            id: descriptor.id
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicValueHostId)).toBeInstanceOf(BusinessLogicInputValueHost);
        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostId)).toEqual(
            [<IssueSnapshot>{
                errorMessage: 'BL_ERROR',
                severity: ValidationSeverity.Error,
                id: BusinessLogicValueHostId
            }]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option Preliminary=true, expect ValidationResult.Valid because Required should be skipped, leaving NO validators which means Valid', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ preliminary: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option Preliminary=false, expect ValidationResult.Invalid because Preliminary is off', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');
        expect(() => validateResults = setup.validationManager.validate({ preliminary: false })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [{
            conditionType: ConditionType.RequiredText,
            valueHostId: 'Field1',
            errorMessage: 'Error 1: ' + ConditionType.RequiredText,
            summaryMessage: 'Summary 1: ' + ConditionType.RequiredText,
            severity: ValidationSeverity.Severe // only because Required conditions default to Severe
        }
        ]);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(true);
        let inputSnapshot: IssueSnapshot = {
            id: descriptor.id,
            severity: ValidationSeverity.Severe, // only because Required conditions default to Severe
            errorMessage: 'Error 1: ' + ConditionType.RequiredText,
        };
        expect(setup.validationManager.getIssuesForInput(descriptor.id)).toEqual([inputSnapshot]);
        let summarySnapshot: IssueSnapshot = {
            id: descriptor.id,
            severity: ValidationSeverity.Severe, // only because Required conditions default to Severe
            errorMessage: 'Summary 1: ' + ConditionType.RequiredText,
        };
        expect(setup.validationManager.getIssuesForSummary()).toEqual([summarySnapshot]);
    });
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option DuringEdit=true, expect Invalid', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ duringEdit: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [{
            conditionType: ConditionType.RequiredText
        }]);
    });
    test('With 1 inputValueHost and a RegExp condition that will evaluate as NoMatch, use option DuringEdit=true, expect Invalid', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RegExp]);
        (descriptor.validatorDescriptors![0].conditionDescriptor as RegExpConditionDescriptor).expressionAsString =
            'ABC';
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue(' X ');
        expect(() => validateResults = setup.validationManager.validate({ duringEdit: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [{
            conditionType: ConditionType.RegExp
        }]);
    });    
    test('With 1 inputValueHost and a RegExp condition that will evaluate as Match, use option DuringEdit=true, expect Valid', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RegExp]);
        (descriptor.validatorDescriptors![0].conditionDescriptor as RegExpConditionDescriptor).expressionAsString =
            'ABC';
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue(' ABC ');
        expect(() => validateResults = setup.validationManager.validate({ duringEdit: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
    });        
    test('With 1 inputValueHost and a Required condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit has no impact on Required validators', () => {
        let descriptor = setupInputValueHostDescriptor(0, [ConditionType.RequiredText]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');
        expect(() => validateResults = setup.validationManager.validate({ duringEdit: false })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [{
            conditionType: ConditionType.RequiredText
        }]);
    });
    test('With 1 inputValueHost and a NeverMatch condition, use option DuringEdit=true, expect condition to be skipped and ValidationResult=valid', () => {
        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        expect(() => validateResults = setup.validationManager.validate({ duringEdit: true })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Valid, null);
    });
    test('With 1 inputValueHost and a NeverMatch condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit=false has no impact on including validators', () => {
        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor]);

        let validateResults: Array<ValidateResult> = [];
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');
        expect(() => validateResults = setup.validationManager.validate({ duringEdit: false })).not.toThrow();

        testIssueFoundFromValidateResults(validateResults, 0, ValidationResult.Invalid, [{
            conditionType: NeverMatchesConditionType
        }]);
    });
    test('OnValidated callback test', () => {
        let changeMe = false;
        let callback = (vm: IValidationManager, validateResults: Array<ValidateResult>) => {
            changeMe = true;
        };
        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([descriptor], null, {
            onValidated: callback
        });

        let validateResults: Array<ValidateResult> = [];
        expect(() => validateResults = setup.validationManager.validate()).not.toThrow();

        expect(changeMe).toBe(true);
    });
});
describe('ValidationManager.clearValidation', () => {
    test('With 2 inputValueHost that are both Invalid, returns 2 ValidateResults each with 1 issue found. isValid=false. DoNotSave=true', () => {

        let descriptor1 = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let descriptor2 = setupInputValueHostDescriptor(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([descriptor1, descriptor2]);

        setup.validationManager.validate();
        expect(() => setup.validationManager.clearValidation()).not.toThrow();
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValue()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(descriptor1.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForInput(descriptor2.id)).toEqual([]);
        expect(setup.validationManager.getIssuesForSummary()).toEqual([]);
    });
});
// updateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValidationManager.updateState', () => {
    interface ITestExtendedState extends ValidationManagerState {
        Value: number;
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedState) => ITestExtendedState, callback: ValidationManagerStateChangedHandler | null): Array<ITestExtendedState> {

        let descriptor = setupInputValueHostDescriptor(0, [NeverMatchesConditionType]);
        let state: ITestExtendedState = {
            Value: initialValue
        };
        let setup = setupValidationManager([descriptor], state, {
            onStateChanged: callback
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
            expect(() => testItem.updateState(null!)).toThrow(/updater/);
        });
});
describe('toIValueHostResolver function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostResolver = {
            getValueHost: (id) => { return <any>{}; },
            services: new MockValidationServices(false, false),
        };
        expect(toIValueHostResolver(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostDescriptors: []
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
describe('toIValueHostsManager function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostsManager = {
            getValueHost: (id) => { return <any>{}; },
            services: new MockValidationServices(false, false),
            notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { }
        };
        expect(toIValueHostsManager(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostDescriptors: []
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
describe('toIValueHostsManagerAccessor function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostsManagerAccessor = {
            valueHostsManager :{
                getValueHost: (id) => { return <any>{}; },
                services: new MockValidationServices(false, false),
                notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { }
            }
        };
        expect(toIValueHostsManagerAccessor(testItem)).toBe(testItem);
    });
    test('ValueHost matches and returns itself.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new NonInputValueHost(vm, {
            id: 'Field1',
            label: 'Label1',
        },
        {
            id: 'Field1',
            value: undefined
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
describe('toIValidationManagerCallbacks function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValidationManagerCallbacks = {
            onValueChanged: (vh: IValueHost, old: any) => {},
            onValueHostStateChanged: (vh: IValueHost, state: ValueHostState) => {},
            onInputValueChanged: (vh: IInputValueHost, old: any)  => {},
            onValueHostValidated: (vh: IInputValueHost, validationResult: ValidateResult) => { },
            onStateChanged: (vm, state) => { },
            onValidated: (vm, results) => { }
        };
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostDescriptors: []
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