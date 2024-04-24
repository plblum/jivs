import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValueHost, ValueHostConfig, ValueHostState } from "../../src/Interfaces/ValueHost";
import { MockValidationManager, MockValidationServices } from "../TestSupport/mocks";
import { InputValueHost, InputValueHostGenerator } from '../../src/ValueHosts/InputValueHost';
import { BusinessLogicInputValueHost, BusinessLogicValueHostName } from '../../src/ValueHosts/BusinessLogicInputValueHost';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { IInputValueHost, InputValueHostConfig, InputValueHostState } from '../../src/Interfaces/InputValueHost';
import { ValueHostValidateResult, ValidationResult, IssueFound, ValidationSeverity } from '../../src/Interfaces/Validation';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import {
    IValidationManager, IValidationManagerCallbacks, ValidationManagerConfig, ValidationManagerState,
    ValidationManagerStateChangedHandler, ValidationSnapshot, toIValidationManagerCallbacks
} from '../../src/Interfaces/ValidationManager';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';
import { deepClone } from '../../src/Utilities/Utilities';
import { IValueHostResolver, IValueHostsManager, IValueHostsManagerAccessor, toIValueHostResolver, toIValueHostsManager, toIValueHostsManagerAccessor } from '../../src/Interfaces/ValueHostResolver';
import { StaticValueHost } from '../../src/ValueHosts/StaticValueHost';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { ConditionCategory, ConditionEvaluateResult } from "../../src/Interfaces/Conditions";
import { IValidatableValueHostBase } from "../../src/Interfaces/ValidatableValueHostBase";
import {
    AlwaysMatchesConditionType, NeverMatchesConditionType, IsUndeterminedConditionType, UserSuppliedResultConditionConfig,
    UserSuppliedResultCondition, UserSuppliedResultConditionType
} from "../TestSupport/conditionsForTesting";
import { fluent } from "../../src/ValueHosts/Fluent";

// Subclass of what we want to test to expose internals to tests
class PublicifiedValidationManager extends ValidationManager<ValidationManagerState> {
    constructor(setup: ValidationManagerConfig) {
        super(setup);
    }

    public get exposedValueHosts(): { [name: string]: IValueHost } {
        return this.valueHosts;
    }
    public get exposedValueHostConfigs(): { [name: string]: ValueHostConfig } {
        return this.valueHostConfigs;
    }
    public get exposedState(): ValidationManagerState {
        return this.state;
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
        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
    });
    test('null setup parameter throws', () => {
        let testItem: PublicifiedValidationManager | null = null;

        expect(() => testItem = new PublicifiedValidationManager(null!)).toThrow(/config/);
    
    });

    test('Config for 1 ValueHost supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [{
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        }];
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ services: services, valueHostConfigs: configs })).not.toThrow();
        expect(testItem!.services).toBe(services);
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(1);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();


        // ensure ValueHost is supporting the Config
        expect(testItem!.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Config is the same as the one supplied
        expect(testItem!.exposedValueHostConfigs['Field1']).not.toBe(configs[0]);
        expect(testItem!.exposedValueHostConfigs['Field1']).toEqual(configs[0]);
    });
    test('Configs for 2 ValueHosts supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [
            {
                name: 'Field1',
                valueHostType: ValueHostType.Input,
                label: 'Field 1'
            },
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field2',
                label: 'Field 2',
                validatorConfigs: []
            }
        ];
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ services: services, valueHostConfigs: configs })).not.toThrow();
        expect(testItem!.services).toBe(services);
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(2);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(2);


        // ensure ValueHost is supporting the Config
        expect(testItem!.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);
        expect(testItem!.exposedValueHosts['Field2']).toBeInstanceOf(InputValueHost);

        // ensure the stored Config is a copy of the one supplied
        expect(testItem!.exposedValueHostConfigs['Field1']).not.toBe(configs[0]);
        expect(testItem!.exposedValueHostConfigs['Field1']).toEqual(configs[0]);

        // when using the resolver, we don't have the original config.
        expect(testItem!.exposedValueHostConfigs['Field2']).toEqual({
            name: 'Field2',
            label: 'Field 2',
            valueHostType: ValueHostType.Input,
            validatorConfigs: []
        });
    });    
    test('Empty State object. Other parameters are null', () => {
        let state: ValidationManagerState = {};
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager(
            { services: services, valueHostConfigs: [], savedState: state })).not.toThrow();
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(0);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
    });
    test('Config and ValueHostState for 1 ValueHost supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [{
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        }];
        let savedState: ValidationManagerState = {};
        let savedValueHostStates: Array<ValueHostState> = [];
        savedValueHostStates.push({
            name: 'Field1',
            value: 10   // something we can return
        });
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({
            services: services, valueHostConfigs: configs,
            savedState: savedState, savedValueHostStates: savedValueHostStates
        })).not.toThrow();
        expect(testItem!.services).toBe(services);

        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(1);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onStateChanged).toBeNull();
        expect(testItem!.onValidated).toBeNull();
        expect(testItem!.onValueHostStateChanged).toBeNull();
        expect(testItem!.onValueHostValidated).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();


        // ensure ValueHost is supporting the Config and a Value of 10 from State
        expect(testItem!.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);
        expect(testItem!.exposedValueHosts['Field1'].getValue()).toBe(10);

        // ensure the stored Config is the same as the one supplied
        expect(testItem!.exposedValueHostConfigs['Field1']).not.toBe(configs[0]);
        expect(testItem!.exposedValueHostConfigs['Field1']).toStrictEqual(configs[0]);
    });
    test('Callbacks supplied. Other parameters are null', () => {
        let setup: ValidationManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostConfigs: [],
            onStateChanged: (validationManager: IValidationManager, state: ValidationManagerState) => { },
            onValidated: (validationManager: IValidationManager, validationSnapshot : ValidationSnapshot) => { },
            onValueHostStateChanged: (valueHost: IValueHost, state: ValueHostState) => { },
            onValueHostValidated: (valueHost: IValidatableValueHostBase, validateResult: ValueHostValidateResult) => { },
            onValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            onInputValueChanged: (valueHost: IValidatableValueHostBase, oldValue: any) => { }
        };

        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(setup)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onStateChanged).not.toBeNull();
        expect(testItem!.onValidated).not.toBeNull();
        expect(testItem!.onValueHostStateChanged).not.toBeNull();
        expect(testItem!.onValueHostValidated).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
    });

});
function testValueHostState(testItem: PublicifiedValidationManager, valueHostName: ValueHostName,
    valueHostState: Partial<InputValueHostState> | null): void
{
    let valueHost = testItem.exposedValueHosts[valueHostName] as InputValueHost;
    expect(valueHost).toBeDefined();
    expect(valueHost).toBeInstanceOf(InputValueHost);

    if (!valueHostState)
        valueHostState = {};
    // fill in missing properties from factory createState defaults
    let factory = new ValueHostFactory();
    factory.register(new InputValueHostGenerator());
    let config = testItem.exposedValueHostConfigs[valueHostName] as InputValueHostConfig;
    let defaultState = factory.createState(config) as InputValueHostState;    

    let stateToCompare: InputValueHostState = { ...defaultState, ...valueHostState, };

    // ensure ValueHost has an initial state. Use updateState() because it is the only time we can see the real state
    valueHost.updateState((stateToUpdate) => {
        expect(stateToUpdate).toEqual(stateToCompare);
        return stateToUpdate;
    }, valueHost);        
}

// addValueHost(config: ValueHostConfig): void
describe('ValidationManager.addValueHost', () => {

    test('New ValueHostConfig with no previous state creates ValueHost, adds Config, and creates state', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(config, null)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(config);

        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('Second ValueHost with same name throws', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config1: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(config1, null)).not.toThrow();
        let config2: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(config1, null)).toThrow();
    });
    test('Add2 Configs. ValueHosts and states are generated for both.', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config1: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost1 = testItem.addValueHost(config1, null);
        let config2: InputValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Input,
            label: 'Field 2',
            validatorConfigs: null,
        };
        let initialValueHost2 = testItem.addValueHost(config2, null);

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(2);
        expect(testItem.exposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.exposedValueHosts['Field2']).toBe(initialValueHost2);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(2);
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(config1);
        expect(testItem.exposedValueHostConfigs['Field2']).toBe(config2);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);
        
        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', null);
        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field2', null);
    });
    test('Add InputValueHostConfig with required ConditionConfig', () => {
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(true, false), valueHostConfigs: []
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);
        expect(testItem.exposedValueHostConfigs['Field1']).toBeDefined();     
        expect(testItem.exposedValueHostConfigs['Field1']).toEqual(config);
    });    

    test('Using fluent syntax, add InputValueHostConfig with required ConditionConfig', () => {
        let vmConfig: ValidationManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValidationManager(vmConfig);

        testItem.addValueHost(fluent().input('Field1', null, { label: 'Field 1' }).requireText(null, 'msg'),
            null);
        expect(testItem.exposedValueHostConfigs['Field1']).toBeDefined();     
        expect(testItem.exposedValueHostConfigs['Field1']).toEqual({
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        });
    });    
    test('New ValueHostConfig with provided state creates ValueHost, adds Config, and uses the provided state', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        let state: ValueHostState = {
            name: 'Field1',
            value: 'ABC'
        };
        expect(() => testItem.addValueHost(config, state)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(config);

        // Check the valueHosts type and initial state
        testValueHostState(testItem, 'Field1', {
            value: 'ABC'
        });
    });    
    test('State with ValidationResult=Valid already exists for the ValueHostConfig being added. That state is used', () => {

        let savedState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            name: 'Field1',
            validationResult: ValidationResult.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedState: savedState, savedValueHostStates: savedValueHostStates
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);

        testValueHostState(testItem, 'Field1', savedValueHostState);        
    });
    test('State with ValidationResult=Invalid already exists for the ValueHostConfig being added.', () => {

        let savedState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            name: 'Field1',
            validationResult: ValidationResult.Invalid, // something we can return
            value: 10,   // something we can return,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];      
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedState: savedState, savedValueHostStates: savedValueHostStates
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);

        testValueHostState(testItem, 'Field1', savedValueHostState);        
    });    
    
    test('State already exists in two places: lastValueHostState and as parameter for addValueHost. State is sourced from addValueHost.', () => {
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        let savedState: ValidationManagerState = {};
        let savedValueHostStates: Array<ValueHostState> = [];
        savedValueHostStates.push(<InputValueHostState>{
            name: 'Field1',
            validationResult: ValidationResult.Valid, // something we can return
            value: 10   // something we can return
        });
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedState: savedState, savedValueHostStates: savedValueHostStates
        });
        let addState: InputValueHostState = {
            name: 'Field1',
            value: 20,
            validationResult: ValidationResult.Invalid,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        testItem.addValueHost(config, addState);

        testValueHostState(testItem, 'Field1', addState);        
    });    
    test('State instance is changed after passing in has no impact on stored state', () => {

        let lastState: ValidationManagerState = {};

        let savedValueHostState: InputValueHostState = {
            name: 'Field1',
            validationResult: ValidationResult.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostStates: Array<ValueHostState> = [savedValueHostState];
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedState: lastState, savedValueHostStates: savedValueHostStates
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);
        let copiedLastState = deepClone(savedValueHostState) as InputValueHostState;
        savedValueHostState.value = 20;

        testValueHostState(testItem, 'Field1', copiedLastState);        
    });    
});

// updateValueHost(config: ValueHostConfig): void
describe('ValidationManager.updateValueHost completely replaces the ValueHost instance', () => {
    test('Replace the config to install a validator', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config };
        replacementConfig.validatorConfigs = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType,
                },
                errorMessage: 'Error'
            }
        ];
        let replacementValidatorConfig = replacementConfig.validatorConfigs[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostConfigs['Field1']).not.toBe(config);
        expect(config.validatorConfigs).toBeNull();

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(replacementConfig);
        expect(replacementConfig.validatorConfigs[0]).toBe(replacementValidatorConfig);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('updateValueHost works like addValueHost with unknown ValueHostConfig', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.updateValueHost(config, null)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(config);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });

    test('Replace the config with existing ValueHostState.ValidationResult of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config };
        replacementConfig.validatorConfigs = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                errorMessage: 'Error'
            }
        ];
        let replacementValidatorConfig = replacementConfig.validatorConfigs[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostConfigs['Field1']).not.toBe(config);
        expect(config.validatorConfigs).toBeNull();

        // ensure ValueHost is supporting the Config
        expect(testItem.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(replacementConfig);
        expect(replacementConfig.validatorConfigs[0]).toBe(replacementValidatorConfig);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });
    test('Using fluent syntax, replace the config with existing ValueHostState.ValidationResult of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let ivConfig = fluent().input('Field1', null, { label: 'Field 1'});
        let initialValueHost = testItem.addValueHost(ivConfig, null);

        let replacementConfig = fluent().input('Field1', null, { label: 'Field 1'}).requireText({}, 'Error');

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHosts['Field1']).toBe(replacementValueHost);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        let replacementValueHostConfig = testItem.exposedValueHostConfigs['Field1'];
        expect(replacementValueHostConfig).not.toBe(ivConfig.parentConfig);
        expect((replacementValueHostConfig as InputValueHostConfig).validatorConfigs).toBeDefined();
        expect((replacementValueHostConfig as InputValueHostConfig).validatorConfigs!.length).toBe(1);
        expect((replacementValueHostConfig as InputValueHostConfig).validatorConfigs![0].errorMessage).toBe('Error');        
        expect((replacementValueHostConfig as InputValueHostConfig).validatorConfigs![0].conditionConfig).toBeDefined();
        expect((replacementValueHostConfig as InputValueHostConfig).validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
        
        // ensure ValueHost is supporting the Config
        expect(testItem.exposedValueHosts['Field1']).toBeInstanceOf(InputValueHost);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', null);
    });

    test('Replace the state, keeping the same config. Confirm the state and config', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: InputValueHostState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            validationResult: ValidationResult.NotAttempted
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(config, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(config);
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', updateState);
    });    
    test('Edit state instance after updateValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: InputValueHostState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            validationResult: ValidationResult.NotAttempted
        };
        testItem.updateValueHost(config, updateState);

        let savedState = deepClone(updateState);
        updateState.value = 100;
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostState(testItem, 'Field1', savedState);
    });        
});
describe('ValidationManager.discardValueHost completely removes ValueHost, its state and config', () => {
    test('After adding in the VM Config, discard the only one leaves empty valueHosts, configs, and state', () => {
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let setup: ValidationManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config],
            savedValueHostStates: [{
                name: config.name,
                value: 10
            }]
        };
        let testItem = new PublicifiedValidationManager(setup);
        expect(testItem.getValueHost(config.name)!.getValue()).toBe(10);  // to prove later this is deleted

        expect(() => testItem.discardValueHost(config.name)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(0);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(0);
        expect(testItem.exposedState).not.toBeNull();

        // add back the config to confirm the original state (value=10) was discarded
        let addedVH = testItem.addValueHost(config, null);
        expect(addedVH.getValue()).toBeUndefined();

    });    
    test('Discard the only one leaves empty valueHosts, configs, and state', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost = testItem.addValueHost(config, null);

        expect(() => testItem.discardValueHost(config.name)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(0);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(0);
        expect(testItem.exposedState).not.toBeNull();

    });

    test('Start with 2 Configs and discard one retains only the expected ValueHost, its state and config', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config1: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost1 = testItem.addValueHost(config1, null);
        let config2: InputValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Input,
            label: 'Field 2',
            validatorConfigs: null,
        };
        let initialValueHost2 = testItem.addValueHost(config2, null);

        expect(() => testItem.discardValueHost(config2.name)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHosts).length).toBe(1);
        expect(testItem.exposedValueHosts['Field1']).toBe(initialValueHost1);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem.exposedValueHostConfigs).length).toBe(1);
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(config1);
        expect(testItem.exposedState).not.toBeNull();

    });
});
// getValueHost(valueHostName: ValueHostName): IValueHost | null
describe('ValidationManager.getValueHost and getInputValue', () => {
    test('With 2 InputValueHostConfigs, get each with both functions.', () => {

        let config1: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let config2: InputValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Input,
            label: 'Field 2',
            validatorConfigs: null,
        };
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1, config2]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Field1')).not.toThrow();
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');
        let vh2: IValueHost | null = null;
        expect(() => vh2 = testItem.getValueHost('Field2')).not.toThrow();
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.getName()).toBe('Field2');
        let vh3: IInputValueHost | null = null;
        expect(() => vh3 = testItem.getInputValueHost('Field1')).not.toThrow();
        expect(vh3).toBeInstanceOf(InputValueHost);
        expect(vh3!.getName()).toBe('Field1');
        let vh4: IInputValueHost | null = null;
        expect(() => vh4 = testItem.getInputValueHost('Field2')).not.toThrow();
        expect(vh4).toBeInstanceOf(InputValueHost);
        expect(vh4!.getName()).toBe('Field2');        
    });
    test('With 2 Array<ValueHostConfig>, get each with both functions. getValueHost returns VH, getInputValueHost returns null', () => {

        let config1: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let config2: ValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Static,
            label: 'Field 2'
        };
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1, config2]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Field1')).not.toThrow();
        expect(vh1).toBeInstanceOf(StaticValueHost);
        expect(vh1!.getName()).toBe('Field1');
        let vh2: IValueHost | null = null;
        expect(() => vh2 = testItem.getValueHost('Field2')).not.toThrow();
        expect(vh2).toBeInstanceOf(StaticValueHost);
        expect(vh2!.getName()).toBe('Field2');
        let vh3: IInputValueHost | null = null;
        expect(() => vh3 = testItem.getInputValueHost('Field1')).not.toThrow();
        expect(vh3).toBeNull();
        let vh4: IInputValueHost | null = null;
        expect(() => vh4 = testItem.getInputValueHost('Field2')).not.toThrow();
        expect(vh4).toBeNull();
    });    
    test('When supplying an unknown ValueHostName, return null.', () => {

        let config1: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };

        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();
    });
});

function setupValidationManager(configs?: Array<InputValueHostConfig> | null,
    savedState?: ValidationManagerState | null,
    callbacks?: IValidationManagerCallbacks): {
        services: IValidationServices,
        validationManager: IValidationManager
    } {
    let services = createValidationServicesForTesting();
    services.autoGenerateDataTypeCheckService.enabled = false;
    
    let setup: ValidationManagerConfig = {
        services: services,
        valueHostConfigs: configs!,
        savedState: savedState!,
        savedValueHostStates: []
    };
    if (callbacks)
        setup = { ...callbacks, ...setup } as ValidationManagerConfig;
    let vm = new PublicifiedValidationManager(setup);

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
// doNotSaveNativeValue(): boolean
// getIssuesForInput(valueHostName: ValueHostName): Array<IssueFound>
// getIssuesFound(group?: string): Array<IssueFound>
describe('ValidationManager.validate, and isValid, doNotSaveNativeValue, getIssuesForInput, getIssuesFound based on the results', () => {
    test('Before calling validate with 0 inputValueHosts, isValid=true, doNotSaveNativeValue=false, getIssuesForInput=[], getIssuesFound=[]', () => {
        let setup = setupValidationManager();
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);
        expect(setup.validationManager.getIssuesForInput('Anything')).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('isValid is true and doNotSaveNativeValue is false before calling validate with 1 inputValueHosts', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost that is ValidationResult.Valid, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate()).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost that is ValidationResult.Invalid, returns {isValid:false, doNotSave: true, issuesFound: [1 found] }', () => {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate()).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
        });


        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(true);

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

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate()).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([expectedIssueFound]);
        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound]);
    });    

    test('With 2 inputValueHost that are both valid, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let config2 = setupInputValueHostConfig(1, [AlwaysMatchesConditionType]);

        let setup = setupValidationManager([config1, config2]);

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate()).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 2 inputValueHost where only one has validators, it should return {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let config2 = fluent().input('Field2');

        let setup = setupValidationManager([config1, config2.parentConfig]);

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate()).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.parentConfig.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });    
    test('With 2 inputValueHost that are both undetermined, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [IsUndeterminedConditionType]);
        let config2 = setupInputValueHostConfig(1, [IsUndeterminedConditionType]);

        let setup = setupValidationManager([config1, config2]);

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate()).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);
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

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate()).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound, expectedIssueFound2]
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(true);

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
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(true);
        expect(setup.validationManager.getIssuesFound()).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);
        expect(setup.validationManager.getValueHost(BusinessLogicValueHostName)).toBeInstanceOf(BusinessLogicInputValueHost);

        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostName)).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName,
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
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(true);
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

        expect(setup.validationManager.getValueHost(BusinessLogicValueHostName)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostName)).toBeNull();
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
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(true);
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
                valueHostName: BusinessLogicValueHostName,
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

        expect(setup.validationManager.getValueHost(BusinessLogicValueHostName)).toBeInstanceOf(BusinessLogicInputValueHost);
        expect(setup.validationManager.getIssuesForInput(BusinessLogicValueHostName)).toEqual(
            [<IssueFound>{
                errorMessage: 'BL_ERROR',
                severity: ValidationSeverity.Error,
                valueHostName: BusinessLogicValueHostName,
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
    test('OnValidated callback test invokes callback with expected ValidationSnapshot', () => {
        let callbackValue: ValidationSnapshot | null = null;
        let callback = (vm: IValidationManager, validationSnapshot : ValidationSnapshot) => {
            callbackValue = validationSnapshot
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidated: callback
        });
        let expectedIssueFound: IssueFound = {
            errorCode: 'GENERATED_0',
            errorMessage: 'BL_ERROR',
            summaryMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName
        };

        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ]);
        expect(callbackValue).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
        });

    });    
    test('OnValidated callback test with option.OmitCallback=true does not invoke callback', () => {
        let callbackValue: ValidationSnapshot | null = null;
        let callback = (vm: IValidationManager, validationSnapshot : ValidationSnapshot) => {
            callbackValue = validationSnapshot
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidated: callback
        });
        let expectedIssueFound: IssueFound = {
            errorCode: 'GENERATED_0',
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicValueHostName
        };

        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ], { omitCallback: true});
        expect(callbackValue).toBeNull();

    });    
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option Preliminary=true, expect ValidationResult.Undetermined because Required should be skipped, leaving NO validators', () => {
        const conditionType = 'TEST';
        let config = setupInputValueHostConfig(0, [conditionType]);
        let setup = setupValidationManager([config]);
        (setup.services.conditionFactory as ConditionFactory).register<UserSuppliedResultConditionConfig>(
            conditionType, (config) => new UserSuppliedResultCondition({
                conditionType: conditionType,
                category: ConditionCategory.Required,
            result: ConditionEvaluateResult.NoMatch
            }));
    
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        
        let validationSnapshot: ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ preliminary: true })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option Preliminary=false, expect ValidationResult.Invalid because Preliminary is off', () => {
        const conditionType = 'TEST';
        let config = setupInputValueHostConfig(0, [conditionType]);
        let setup = setupValidationManager([config]);
        (setup.services.conditionFactory as ConditionFactory).register<UserSuppliedResultConditionConfig>(
            conditionType, (config) => new UserSuppliedResultCondition({
                conditionType: conditionType,
                category: ConditionCategory.Required,
            result: ConditionEvaluateResult.NoMatch
        }));
        let expectedIssueFound: IssueFound = {
            errorCode: conditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + conditionType,
            summaryMessage: 'Summary 1: ' + conditionType,
            severity: ValidationSeverity.Severe // only because Required conditions default to Severe
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');
        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ preliminary: false })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(true);

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
        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
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
        let validationSnapshot: ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
        });
    });    
    test('With 1 inputValueHost that has a string value and a condition that will evaluate as Match during edit, use option DuringEdit=true, expect Valid', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        setup.validationManager.getInputValueHost(config.name)?.setInputValue('Text');
        let validationSnapshot: ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });
    });        
    test('With 1 inputValueHost that has an undefined value and a condition that will evaluate as Match during edit, use option DuringEdit=true, expect Undetermined because DuringEdit requires a string value', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);

        setup.validationManager.getInputValueHost(config.name)?.setInputValue(undefined);
        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });

    });          
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit has no impact on Required validators', () => {
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

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ duringEdit: false })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
        });

    });
    test('With 1 inputValueHost and a condition that does not implement IEvaluateConditionDuringEdits, use option DuringEdit=true, expect condition to be skipped and array of ValidateResults = []', () => {
        let config = setupInputValueHostConfig(0, [UserSuppliedResultConditionType]);
        (config.validatorConfigs![0].conditionConfig as UserSuppliedResultConditionConfig).result = ConditionEvaluateResult.Match;
        let setup = setupValidationManager([config]);

        let vh = (setup.validationManager.getValueHost('Field1')! as IInputValueHost);
        vh.setInputValue('');
        
        let validationSnapshot: ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
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

        let validationSnapshot : ValidationSnapshot | null = null;
        expect(() => validationSnapshot = setup.validationManager.validate({ duringEdit: false })).not.toThrow();
        expect(validationSnapshot).toEqual(<ValidationSnapshot>{
            isValid: false,
            doNotSaveNativeValues: true,
            issuesFound: [expectedIssueFound]
        });
    });
    test('OnValidated callback test', () => {
        let callbackValue: ValidationSnapshot | null = null;
        let callback = (vm: IValidationManager, validationSnapshot : ValidationSnapshot) => {
            callbackValue = validationSnapshot
        };
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidated: callback
        });

        let validationSnapshot = setup.validationManager.validate();

        expect(callbackValue).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });
    });
    test('OnValidated callback test with omitCallback does not callback', () => {
        let callbackValue: ValidationSnapshot | null = null;
        let callback = (vm: IValidationManager, validationSnapshot : ValidationSnapshot) => {
            callbackValue = validationSnapshot
        };
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidated: callback
        });

        let validationSnapshot = setup.validationManager.validate({ omitCallback: true});

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
        expect(setup.validationManager.doNotSaveNativeValues()).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('OnValidated callback test invokes callback', () => {

        let callbackValue: ValidationSnapshot | null = null;
        let callback = (vm: IValidationManager, validationSnapshot : ValidationSnapshot) => {
            callbackValue = validationSnapshot
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidated: callback
        });

        let validationSnapshot = setup.validationManager.validate({ omitCallback: true });
        expect(callbackValue).toBeNull();

        setup.validationManager.clearValidation();
        expect(callbackValue).toEqual(<ValidationSnapshot>{
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null
        });        
    });    
    test('OnValidated callback test with option.OmitCallback=true does not invoke callback', () => {
        let callbackValue: ValidationSnapshot | null = null;
        let callback = (vm: IValidationManager, validationSnapshot : ValidationSnapshot) => {
            callbackValue = validationSnapshot
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidated: callback
        });

        let validationSnapshot = setup.validationManager.validate({ omitCallback: true });
        expect(callbackValue).toBeNull();

        setup.validationManager.clearValidation({ omitCallback: true});
        expect(callbackValue).toBeNull();
    });
});
// updateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValidationManager.updateState', () => {
    interface ITestExtendedState extends ValidationManagerState {
        Value: number;
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedState) => ITestExtendedState, callback: ValidationManagerStateChangedHandler | null): Array<ITestExtendedState> {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let state: ITestExtendedState = {
            Value: initialValue
        };
        let setup = setupValidationManager([config], state, {
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
            getValueHost: (name) => { return <any>{}; },
            getInputValueHost: (name) => { return <any>{}; },
            services: new MockValidationServices(false, false),
        };
        expect(toIValueHostResolver(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: []
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
            getValueHost: (name) => { return <any>{}; },
            getInputValueHost: (name) => { return <any>{}; },            
            services: new MockValidationServices(false, false),
            notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { }
        };
        expect(toIValueHostsManager(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: []
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
                getValueHost: (name) => { return <any>{}; },
                getInputValueHost: (name) => { return <any>{}; },                
                services: new MockValidationServices(false, false),
                notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { }
            }
        };
        expect(toIValueHostsManagerAccessor(testItem)).toBe(testItem);
    });
    test('ValueHost matches and returns itself.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new StaticValueHost(vm, {
            name: 'Field1',
            label: 'Label1',
        },
        {
            name: 'Field1',
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
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any)  => {},
            onValueHostValidated: (vh: IValidatableValueHostBase, validationResult: ValueHostValidateResult) => { },
            onStateChanged: (vm, state) => { },
            onValidated: (vm, results) => { }
        };
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });
    test('ValidationManager matches and returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: []
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