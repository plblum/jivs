import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { MockValidationManager, MockValidationServices } from "../TestSupport/mocks";
import { InputValueHost, InputValueHostGenerator } from '../../src/ValueHosts/InputValueHost';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { IInputValueHost, InputValueHostConfig, InputValueHostInstanceState } from '../../src/Interfaces/InputValueHost';
import { ValidationStatus, ValidationSeverity, ValueHostValidateResult } from '../../src/Interfaces/Validation';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';
import { deepClone } from '../../src/Utilities/Utilities';
import { IValueHostResolver, toIValueHostResolver } from '../../src/Interfaces/ValueHostResolver';
import { StaticValueHost } from '../../src/ValueHosts/StaticValueHost';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { IValidatableValueHostBase } from "../../src/Interfaces/ValidatableValueHostBase";
import {
    AlwaysMatchesConditionType, NeverMatchesConditionType
} from "../TestSupport/conditionsForTesting";
import { IValueHostsManager, toIValueHostsManager, IValueHostsManagerAccessor, toIValueHostsManagerAccessor, ValueHostsManagerInstanceStateChangedHandler, ValueHostsManagerInstanceState, ValueHostsManagerConfig, IValueHostsManagerCallbacks, toIValueHostsManagerCallbacks } from "../../src/Interfaces/ValueHostsManager";
import { ValueHostsManager } from "../../src/Validation/ValueHostsManager";
import { CalculationHandlerResult, ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { CalcValueHost } from "../../src/ValueHosts/CalcValueHost";
import { ValidatableValueHostBase } from "../../src/ValueHosts/ValidatableValueHostBase";

// Subclass of what we want to test to expose internals to tests
class PublicifiedValueHostsManager extends ValueHostsManager<ValueHostsManagerInstanceState> {
    constructor(setup: ValueHostsManagerConfig) {
        super(setup);
    }

    public get exposedValueHosts(): { [name: string]: IValueHost } {
        return this.valueHosts;
    }
    public get exposedValueHostConfigs(): { [name: string]: ValueHostConfig } {
        return this.valueHostConfigs;
    }
    public get exposedState(): ValueHostsManagerInstanceState {
        return this.instanceState;
    }

}

//  constructor(setup: ValueHostsManagerConfig)
describe('constructor and initial property values', () => {
    test('No configs (empty array), an empty state and no callback', () => {
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager({ services: services, valueHostConfigs: [] })).not.toThrow();
        expect(testItem!.services).toBe(services);
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(0);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
    });
    test('null setup parameter throws', () => {
        let testItem: PublicifiedValueHostsManager | null = null;

        expect(() => testItem = new PublicifiedValueHostsManager(null!)).toThrow(/config/);
    
    });

    test('Config for 1 ValueHost supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [{
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        }];
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager({ services: services, valueHostConfigs: configs })).not.toThrow();
        expect(testItem!.services).toBe(services);
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(1);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
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
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager({ services: services, valueHostConfigs: configs })).not.toThrow();
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
        let state: ValueHostsManagerInstanceState = {};
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager(
            { services: services, valueHostConfigs: [], savedInstanceState: state })).not.toThrow();
        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(0);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
    });
    test('Config and ValueHostInstanceState for 1 ValueHost supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [{
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        }];
        let savedState: ValueHostsManagerInstanceState = {};
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [];
        savedValueHostInstanceStates.push({
            name: 'Field1',
            value: 10   // something we can return
        });
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager({
            services: services, valueHostConfigs: configs,
            savedInstanceState: savedState, savedValueHostInstanceStates: savedValueHostInstanceStates
        })).not.toThrow();
        expect(testItem!.services).toBe(services);

        expect(testItem!.exposedValueHosts).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHosts).length).toBe(1);
        expect(testItem!.exposedValueHostConfigs).not.toBeNull();
        expect(Object.keys(testItem!.exposedValueHostConfigs).length).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
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
        let setup: ValueHostsManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostConfigs: [],
            onInstanceStateChanged: (valueHostsManager: IValueHostsManager, state: ValueHostsManagerInstanceState) => { },

            onValueHostInstanceStateChanged: (valueHost: IValueHost, state: ValueHostInstanceState) => { },

            onValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            onInputValueChanged: (valueHost: IValidatableValueHostBase, oldValue: any) => { }
        };

        let testItem: PublicifiedValueHostsManager | null = null;
        expect(() => testItem = new PublicifiedValueHostsManager(setup)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
    });

});
function testValueHostInstanceState(testItem: PublicifiedValueHostsManager, valueHostName: ValueHostName,
    instanceState: Partial<InputValueHostInstanceState> | null): void
{
    let valueHost = testItem.exposedValueHosts[valueHostName] as InputValueHost;
    expect(valueHost).toBeDefined();
    expect(valueHost).toBeInstanceOf(InputValueHost);

    if (!instanceState)
        instanceState = {};
    // fill in missing properties from factory createInstanceState defaults
    let factory = new ValueHostFactory();
    factory.register(new InputValueHostGenerator());
    let config = testItem.exposedValueHostConfigs[valueHostName] as InputValueHostConfig;
    let defaultState = factory.createInstanceState(config) as InputValueHostInstanceState;    

    let stateToCompare: InputValueHostInstanceState = { ...defaultState, ...instanceState, };

    // ensure ValueHost has an initial state. Use updateState() because it is the only time we can see the real state
    valueHost.updateInstanceState((stateToUpdate) => {
        expect(stateToUpdate).toEqual(stateToCompare);
        return stateToUpdate;
    }, valueHost);        
}

// addValueHost(config: ValueHostConfig): void
describe('ValueHostsManager.addValueHost', () => {

    test('New ValueHostConfig with no previous state creates ValueHost, adds Config, and creates state', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
        testValueHostInstanceState(testItem, 'Field1', null);
    });
    test('Second ValueHost with same name throws', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
        testValueHostInstanceState(testItem, 'Field1', null);
        // Check the valueHosts type and initial state
        testValueHostInstanceState(testItem, 'Field2', null);
    });
    test('Add InputValueHostConfig with required ConditionConfig', () => {
        let testItem = new PublicifiedValueHostsManager({
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

    test('New ValueHostConfig with provided state creates ValueHost, adds Config, and uses the provided state', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        let state: ValueHostInstanceState = {
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
        testValueHostInstanceState(testItem, 'Field1', {
            value: 'ABC'
        });
    });    
    test('InstanceState with ValidationStatus=Valid already exists for the ValueHostConfig being added. That state is used', () => {

        let savedState: ValueHostsManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];
        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: savedState, savedValueHostInstanceStates: savedValueHostInstanceStates
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

        testValueHostInstanceState(testItem, 'Field1', savedValueHostInstanceState);        
    });
    test('InstanceState with ValidationStatus=Invalid already exists for the ValueHostConfig being added.', () => {

        let savedState: ValueHostsManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid, // something we can return
            value: 10,   // something we can return,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];      
        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: savedState, savedValueHostInstanceStates: savedValueHostInstanceStates
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

        testValueHostInstanceState(testItem, 'Field1', savedValueHostInstanceState);        
    });    
    
    test('InstanceState already exists in two places: lastValueHostInstanceState and as parameter for addValueHost. State is sourced from addValueHost.', () => {
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
        let savedState: ValueHostsManagerInstanceState = {};
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [];
        savedValueHostInstanceStates.push(<InputValueHostInstanceState>{
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10   // something we can return
        });
        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: savedState, savedValueHostInstanceStates: savedValueHostInstanceStates
        });
        let addState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 20,
            status: ValidationStatus.Invalid,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        testItem.addValueHost(config, addState);

        testValueHostInstanceState(testItem, 'Field1', addState);        
    });    
    test('InstanceState instance is changed after passing in has no impact on stored state', () => {

        let lastState: ValueHostsManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];
        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: lastState, savedValueHostInstanceStates: savedValueHostInstanceStates
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
        let copiedLastState = deepClone(savedValueHostInstanceState) as InputValueHostInstanceState;
        savedValueHostInstanceState.value = 20;

        testValueHostInstanceState(testItem, 'Field1', copiedLastState);        
    });    
});

// updateValueHost(config: ValueHostConfig): void
describe('ValueHostsManager.updateValueHost completely replaces the ValueHost instance', () => {
    test('Replace the config to install a validator', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
        testValueHostInstanceState(testItem, 'Field1', null);
    });
    test('updateValueHost works like addValueHost with unknown ValueHostConfig', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
        testValueHostInstanceState(testItem, 'Field1', null);
    });

    test('Replace the config with existing ValueHostInstanceState.ValidationStatus of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
        testValueHostInstanceState(testItem, 'Field1', null);
    });
 
    test('Replace the state, keeping the same config. Confirm the state and config', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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

        let updateState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            status: ValidationStatus.NotAttempted
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.updateValueHost(config, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs['Field1']).toBe(config);
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', updateState);
    });    
    test('Edit state instance after updateValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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

        let updateState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            status: ValidationStatus.NotAttempted
        };
        testItem.updateValueHost(config, updateState);

        let savedState = deepClone(updateState);
        updateState.value = 100;
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', savedState);
    });        
});
describe('ValueHostsManager.discardValueHost completely removes ValueHost, its state and config', () => {
    test('After adding in the VM Config, discard the only one leaves empty valueHosts, configs, and state', () => {
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let setup: ValueHostsManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config],
            savedValueHostInstanceStates: [{
                name: config.name,
                value: 10
            }]
        };
        let testItem = new PublicifiedValueHostsManager(setup);
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
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
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
describe('ValueHostsManager.getValueHost, getValidatableValueHost, and getInputValue', () => {
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
        let testItem = new PublicifiedValueHostsManager({
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
        let vh3: IValidatableValueHostBase | null = null;
        expect(() => vh3 = testItem.getValidatableValueHost('Field1')).not.toThrow();
        expect(vh3).toBeInstanceOf(ValidatableValueHostBase);
        expect(vh3!.getName()).toBe('Field1');
        let vh4: IValidatableValueHostBase | null = null;
        expect(() => vh4 = testItem.getValidatableValueHost('Field2')).not.toThrow();
        expect(vh4).toBeInstanceOf(ValidatableValueHostBase);
        expect(vh4!.getName()).toBe('Field2');        
        let vh5: IInputValueHost | null = null;
        expect(() => vh5 = testItem.getInputValueHost('Field1')).not.toThrow();
        expect(vh5).toBeInstanceOf(InputValueHost);
        expect(vh5!.getName()).toBe('Field1');
        let vh6: IInputValueHost | null = null;
        expect(() => vh6 = testItem.getInputValueHost('Field2')).not.toThrow();
        expect(vh6).toBeInstanceOf(InputValueHost);
        expect(vh6!.getName()).toBe('Field2');                
    });
    test('With 2 Array<ValueHostConfig>, get each with both functions. getValueHost returns VH, getValidatableValueHost and getInputValueHost return null', () => {

        let config1: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let config2: ValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Calc,
            label: 'Field 2'
        };
        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1, config2]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Field1')).not.toThrow();
        expect(vh1).toBeInstanceOf(StaticValueHost);
        expect(vh1!.getName()).toBe('Field1');
        let vh2: IValueHost | null = null;
        expect(() => vh2 = testItem.getValueHost('Field2')).not.toThrow();
        expect(vh2).toBeInstanceOf(CalcValueHost);
        expect(vh2!.getName()).toBe('Field2');
        let vh3: IValidatableValueHostBase | null = null;
        expect(() => vh3 = testItem.getValidatableValueHost('Field1')).not.toThrow();
        expect(vh3).toBeNull();
        let vh4: IValidatableValueHostBase | null = null;
        expect(() => vh4 = testItem.getValidatableValueHost('Field2')).not.toThrow();
        expect(vh4).toBeNull();
        let vh5: IInputValueHost | null = null;
        expect(() => vh5 = testItem.getInputValueHost('Field1')).not.toThrow();
        expect(vh5).toBeNull();
        let vh6: IInputValueHost | null = null;
        expect(() => vh6 = testItem.getInputValueHost('Field2')).not.toThrow();
        expect(vh6).toBeNull();        
    });    
    test('When supplying an unknown ValueHostName, return null.', () => {

        let config1: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };

        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();
        let vh2: IValidatableValueHostBase | null = null;
        expect(() => vh2 = testItem.getValidatableValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();    
        let vh3: IInputValueHost | null = null;
        expect(() => vh3 = testItem.getInputValueHost('Unknown')).not.toThrow();
        expect(vh3).toBeNull();
    });
});

function setupValueHostsManager(configs?: Array<InputValueHostConfig> | null,
    savedState?: ValueHostsManagerInstanceState | null,
    callbacks?: IValueHostsManagerCallbacks): {
        services: IValidationServices,
        manager: IValueHostsManager
    } {
    let services = createValidationServicesForTesting();
    services.autoGenerateDataTypeCheckService.enabled = false;
    
    let setup: ValueHostsManagerConfig = {
        services: services,
        valueHostConfigs: configs!,
        savedInstanceState: savedState!,
        savedValueHostInstanceStates: []
    };
    if (callbacks)
        setup = { ...callbacks, ...setup } as ValueHostsManagerConfig;
    let vm = new PublicifiedValueHostsManager(setup);

    return {
        services: services,
        manager: vm
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

// updateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValueHostsManager.updateState', () => {
    interface ITestExtendedState extends ValueHostsManagerInstanceState {
        Value: number;
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedState) => ITestExtendedState, callback: ValueHostsManagerInstanceStateChangedHandler | null): Array<ITestExtendedState> {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let state: ITestExtendedState = {
            Value: initialValue
        };
        let setup = setupValueHostsManager([config], state, {
            onInstanceStateChanged: callback
        });
        let testItem = setup.manager as ValueHostsManager<ITestExtendedState>;
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
            let setup = setupValueHostsManager();
            let testItem = setup.manager as ValueHostsManager<ITestExtendedState>;
            expect(() => testItem.updateInstanceState(null!)).toThrow(/updater/);
        });
});
describe('toIValueHostResolver function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostResolver = {
            getValueHost: (name) => { return <any>{}; },
            getValidatableValueHost: (name) => { return <any>{} },
            getInputValueHost: (name) => { return <any>{}; },
            services: new MockValidationServices(false, false),
        };
        expect(toIValueHostResolver(testItem)).toBe(testItem);
    });
    test('ValueHostsManager matches and returns itself.', () => {
        let testItem = new ValueHostsManager<ValueHostsManagerInstanceState>({
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
            getValidatableValueHost: (name) => { return <any>{} },
            getInputValueHost: (name) => { return <any>{}; },
            services: new MockValidationServices(false, false),
            notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { },
            dispose: () => void {},
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
            }
        };
        expect(toIValueHostsManager(testItem)).toBe(testItem);
    });
    test('ValueHostsManager matches and returns itself.', () => {
        let testItem = new ValueHostsManager<ValueHostsManagerInstanceState>({
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
                getValidatableValueHost: (name) => { return <any>{} },
                getInputValueHost: (name) => { return <any>{}; },
                services: new MockValidationServices(false, false),
                notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { },
                dispose: () => void {},
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
                }
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
describe('toIValueHostsManagerCallbacks function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostsManagerCallbacks = {
            onValueChanged: (vh: IValueHost, old: any) => {},
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => {},
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any)  => {},
            onInstanceStateChanged: (vm, state) => { }
        };
        expect(toIValueHostsManagerCallbacks(testItem)).toBe(testItem);
    });
    test('ValueHostsManager without callbacks defined returns itself.', () => {
        let testItem = new ValueHostsManager<ValueHostsManagerInstanceState>({
            services: new ValidationServices(),
            valueHostConfigs: []
        });
        expect(toIValueHostsManagerCallbacks(testItem)).toBe(testItem);
    });    
    test('ValueHostsManager with callbacks defined returns itself.', () => {
        let testItem = new ValueHostsManager<ValueHostsManagerInstanceState>({
            services: new ValidationServices(),
            valueHostConfigs: [],
            onValueChanged: (vh: IValueHost, old: any) => {},
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => {},
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any)  => {},
            onInstanceStateChanged: (vm, state) => { }    
        });
        expect(toIValueHostsManagerCallbacks(testItem)).toBe(testItem);
    });        
    test('ValueHostsManager with callbacks=null defined returns itself.', () => {
        let testItem = new ValueHostsManager<ValueHostsManagerInstanceState>({
            services: new ValidationServices(),
            valueHostConfigs: [],
            onValueChanged: null,
            onValueHostInstanceStateChanged: null,
            onInputValueChanged: null,
            onInstanceStateChanged: null   
        });
        expect(toIValueHostsManagerCallbacks(testItem)).toBe(testItem);
    });            
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValueHostsManagerCallbacks(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValueHostsManagerCallbacks(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValueHostsManagerCallbacks(100)).toBeNull();
    });        
});

describe('build()', () => {
    test('input().requireText() gets added correctly', () => {
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);

        testItem.build().input('Field1', null, { label: 'Field 1' }).requireText(null, 'msg');

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBeNull();
        let ivh1 = vh1 as InputValueHost;
        expect(ivh1.getValidator(ConditionType.RequireText)).toBeDefined();

        // prove the error message was used.

        ivh1.setValues('', ''); // will be Invalid
        let result = ivh1.validate();
        expect(result).toEqual(<ValueHostValidateResult>{
            status: ValidationStatus.Invalid,
            issuesFound: [
                {
                    errorCode: ConditionType.RequireText,
                    valueHostName: 'Field1',
                    severity: ValidationSeverity.Severe,    // due to required
                    errorMessage: 'msg', 
                    summaryMessage: 'msg'
                }
            ]
        });
    });    
    test('Add Input then replace it fully replaces.', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(true, true), valueHostConfigs: [] });
        testItem.build().input('Field1', null, { label: 'Field 1'});
        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBeNull();
        expect((vh1 as InputValueHost).getValidator(ConditionType.RequireText)).toBeNull();

        testItem.build().input('Field1', 'TEST', { label: 'Field 1'}).requireText({}, 'Error');
        let vh2 = testItem.getValueHost('Field1');
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.getName()).toBe('Field1');        
        expect(vh2!.getLabel()).toBe('Field 1');
        expect(vh2!.getDataType()).toBe('TEST');
        let ivh2 = vh2 as InputValueHost;
        let vh2Validator = ivh2.getValidator(ConditionType.RequireText);
        expect(vh2Validator).toBeDefined();

        // prove the error message was used.

        ivh2.setValues('', ''); // will be Invalid
        let result = ivh2.validate();
        expect(result).toEqual(<ValueHostValidateResult>{
            status: ValidationStatus.Invalid,
            issuesFound: [
                {
                    errorCode: ConditionType.RequireText,
                    valueHostName: 'Field1',
                    severity: ValidationSeverity.Severe,    // due to required
                    errorMessage: 'Error', 
                    summaryMessage: 'Error'
                }
            ]
        });
    });
    test('static() gets added correctly', () => {
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        testItem.build().static('Field1', null, { label: 'Field 1' });

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(StaticValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBeNull();
    });    
    test('calc() gets added correctly', () => {
        function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): CalculationHandlerResult {
            return 1;
        }        
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        testItem.build().calc('Field1', 'Test', calcFnForTests);

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(CalcValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getDataType()).toBe('Test');
    });        
});