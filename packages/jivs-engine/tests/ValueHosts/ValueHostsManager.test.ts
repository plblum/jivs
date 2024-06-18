import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { MockValidationManager, MockValidationServices } from "../TestSupport/mocks";
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';
import { deepClone } from '../../src/Utilities/Utilities';
import { IValueHostResolver, toIValueHostResolver } from '../../src/Interfaces/ValueHostResolver';
import { StaticValueHost, StaticValueHostGenerator } from '../../src/ValueHosts/StaticValueHost';
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { IValidatableValueHostBase } from "../../src/Interfaces/ValidatableValueHostBase";
import { IValueHostsManager, toIValueHostsManager, IValueHostsManagerAccessor, toIValueHostsManagerAccessor, ValueHostsManagerInstanceStateChangedHandler, ValueHostsManagerInstanceState, ValueHostsManagerConfig, IValueHostsManagerCallbacks, toIValueHostsManagerCallbacks } from "../../src/Interfaces/ValueHostsManager";
import { ValueHostsManager } from "../../src/ValueHosts/ValueHostsManager";
import { CalcValueHostConfig, ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { CalcValueHost } from "../../src/ValueHosts/CalcValueHost";
import { IValueHostAccessor } from "../../src/Interfaces/ValueHostAccessor";
import { ValueHostAccessor } from "../../src/ValueHosts/ValueHostAccessor";
import { IStaticValueHost, StaticValueHostConfig, StaticValueHostInstanceState } from "../../src/Interfaces/StaticValueHost";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";
import { build } from "../../src/Validation/ValidationManagerConfigBuilder";
import { IDisposable } from "../../src/Interfaces/General_Purpose";
import { ValueHostsManagerConfigBuilder } from "../../src/ValueHosts/ValueHostsManagerConfigBuilder";
import { InputValueHostConfig } from "../../src/Interfaces/InputValueHost";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { AlwaysMatchesCondition, AlwaysMatchesConditionType } from "../TestSupport/conditionsForTesting";
import { LookupKey } from "../../src/DataTypes/LookupKeys";

// Subclass of what we want to test to expose internals to tests
class PublicifiedValueHostsManager extends ValueHostsManager<ValueHostsManagerInstanceState> {
    constructor(setup: ValueHostsManagerConfig | ValueHostsManagerConfigBuilder<ValueHostsManagerConfig>) {
        super(setup as any);
    }

    public get exposedValueHosts(): Map<string, IValueHost> {
        return this.valueHosts;
    }
    public get exposedValueHostConfigs(): Map<string, ValueHostConfig> {
        return this.valueHostConfigs;
    }
    public get exposedState(): ValueHostsManagerInstanceState {
        return this.instanceState;
    }

    public exposedInvokeOnConfigChanged(): void {
        super.invokeOnConfigChanged();
    }

}

//  constructor(setup: ValueHostsManagerConfig)
describe('constructor and initial property values', () => {
    test('No configs (empty array), an empty state and no callback', () => {
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager({ services: services, valueHostConfigs: [] })).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(0);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();
    });
    test('null setup parameter throws', () => {
        let testItem: PublicifiedValueHostsManager | null = null;

        expect(() => testItem = new PublicifiedValueHostsManager(null!)).toThrow(/args1/);

    });
    test('Using Builder, no configs (empty array), an empty state and no callback', () => {
        let services = new MockValidationServices(false, false);
        let builder = new ValueHostsManagerConfigBuilder<ValueHostsManagerConfig>(services);
        let testItem: PublicifiedValueHostsManager | null = null;
        expect(() => testItem = new PublicifiedValueHostsManager(builder)).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(0);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();
    });

    test('Config for 1 ValueHost supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [{
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        }];
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager({ services: services, valueHostConfigs: configs })).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(1);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();


        // ensure ValueHost is supporting the Config
        expect(testItem!.exposedValueHosts.get('Field1')).toBeInstanceOf(StaticValueHost);

        // ensure the stored Config is the same as the one supplied
        expect(testItem!.exposedValueHostConfigs.get('Field1')).not.toBe(configs[0]);
        expect(testItem!.exposedValueHostConfigs.get('Field1')).toEqual(configs[0]);
    });
    test('Using builder, config for 1 ValueHost supplied. Other parameters are null', () => {
        let services = new MockValidationServices(false, false);
        let builder = new ValueHostsManagerConfigBuilder<ValueHostsManagerConfig>(services);
        builder.static('Field1', null, { label: 'Field 1' });
        let testItem: PublicifiedValueHostsManager | null = null;
        expect(() => testItem = new PublicifiedValueHostsManager(builder)).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(1);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();

        // ensure ValueHost is supporting the Config
        expect(testItem!.exposedValueHosts.get('Field1')).toBeInstanceOf(StaticValueHost);
    });

    test('Configs for 2 ValueHosts supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [
            {
                name: 'Field1',
                valueHostType: ValueHostType.Static,
                label: 'Field 1'
            },
            <StaticValueHostConfig>{
                valueHostType: ValueHostType.Static,
                name: 'Field2',
                label: 'Field 2',
                validatorConfigs: []
            }
        ];
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager({ services: services, valueHostConfigs: configs })).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(2);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(2);


        // ensure ValueHost is supporting the Config
        expect(testItem!.exposedValueHosts.get('Field1')).toBeInstanceOf(StaticValueHost);
        expect(testItem!.exposedValueHosts.get('Field2')).toBeInstanceOf(StaticValueHost);

        // ensure the stored Config is a copy of the one supplied
        expect(testItem!.exposedValueHostConfigs.get('Field1')).not.toBe(configs[0]);
        expect(testItem!.exposedValueHostConfigs.get('Field1')).toEqual(configs[0]);

        // when using the resolver, we don't have the original config.
        expect(testItem!.exposedValueHostConfigs.get('Field2')).toEqual({
            name: 'Field2',
            label: 'Field 2',
            valueHostType: ValueHostType.Static,
            validatorConfigs: []
        });
    });
    test('Using Builder, Configs for 2 ValueHosts supplied. Other parameters are null', () => {

        let services = new MockValidationServices(false, false);
        let builder = new ValueHostsManagerConfigBuilder<ValueHostsManagerConfig>(services);
        builder.static('Field1', null, { label: 'Field 1' }).static('Field2', null, { label: 'Field 2' });
        let testItem: PublicifiedValueHostsManager | null = null;
        expect(() => testItem = new PublicifiedValueHostsManager(builder)).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(2);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(2);


        // ensure ValueHost is supporting the Config
        expect(testItem!.exposedValueHosts.get('Field1')).toBeInstanceOf(StaticValueHost);
        expect(testItem!.exposedValueHosts.get('Field2')).toBeInstanceOf(StaticValueHost);

        // when using the resolver, we don't have the original config.
        expect(testItem!.exposedValueHostConfigs.get('Field2')).toEqual({
            name: 'Field2',
            label: 'Field 2',
            valueHostType: ValueHostType.Static
        });
    });
    test('Empty State object. Other parameters are null', () => {
        let state: ValueHostsManagerInstanceState = {};
        let testItem: PublicifiedValueHostsManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValueHostsManager(
            { services: services, valueHostConfigs: [], savedInstanceState: state })).not.toThrow();
        
        expect(testItem!.exposedValueHosts.size).toBe(0);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();
    });
    test('Config and ValueHostInstanceState for 1 ValueHost supplied. Other parameters are null', () => {
        let configs: Array<ValueHostConfig> = [{
            name: 'Field1',
            valueHostType: ValueHostType.Static,
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

        
        expect(testItem!.exposedValueHosts.size).toBe(1);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();


        // ensure ValueHost is supporting the Config and a Value of 10 from State
        expect(testItem!.exposedValueHosts.get('Field1')).toBeInstanceOf(StaticValueHost);
        expect(testItem!.exposedValueHosts.get('Field1')!.getValue()).toBe(10);

        // ensure the stored Config is the same as the one supplied
        expect(testItem!.exposedValueHostConfigs.get('Field1')).not.toBe(configs[0]);
        expect(testItem!.exposedValueHostConfigs.get('Field1')).toStrictEqual(configs[0]);
    });
    test('With Builder, Config and ValueHostInstanceState for 1 ValueHost supplied. Other parameters are null', () => {
        let savedState: ValueHostsManagerInstanceState = {};
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [];
        savedValueHostInstanceStates.push({
            name: 'Field1',
            value: 10   // something we can return
        });
        let services = new MockValidationServices(false, false);
        let builder = new ValueHostsManagerConfigBuilder(services);
        builder.savedInstanceState = savedState;
        builder.savedValueHostInstanceStates = savedValueHostInstanceStates;
        builder.static('Field1', null, { label: 'Field 1' });

        let testItem = new PublicifiedValueHostsManager(builder);
        expect(testItem!.services).toBe(services);

        
        expect(testItem!.exposedValueHosts.size).toBe(1);
        
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);

        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();

        // ensure ValueHost is supporting the Config and a Value of 10 from State
        expect(testItem!.exposedValueHosts.get('Field1')).toBeInstanceOf(StaticValueHost);
        expect(testItem!.exposedValueHosts.get('Field1')!.getValue()).toBe(10);
    });
    test('Callbacks supplied. Other parameters are null', () => {
        let setup: ValueHostsManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostConfigs: [],
            onInstanceStateChanged: (valueHostsManager: IValueHostsManager, state: ValueHostsManagerInstanceState) => { },

            onValueHostInstanceStateChanged: (valueHost: IValueHost, state: ValueHostInstanceState) => { },

            onValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            onInputValueChanged: (valueHost: IValidatableValueHostBase, oldValue: any) => { },
            onConfigChanged: (valueHost, config) => { }
        };

        let testItem: PublicifiedValueHostsManager | null = null;
        expect(() => testItem = new PublicifiedValueHostsManager(setup)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
        expect(testItem!.onConfigChanged).not.toBeNull();
    });
    test('With Builder, Callbacks supplied. Other parameters are null', () => {
        let builder = new ValueHostsManagerConfigBuilder(new MockValidationServices(false, false));

        builder.onInstanceStateChanged = (valueHostsManager: IValueHostsManager, state: ValueHostsManagerInstanceState) => { };

        builder.onValueHostInstanceStateChanged = (valueHost: IValueHost, state: ValueHostInstanceState) => { };

        builder.onValueChanged = (valueHost: IValueHost, oldValue: any) => { };
        builder.onInputValueChanged = (valueHost: IValidatableValueHostBase, oldValue: any) => { };
        builder.onConfigChanged = (valueHostsManager: IValueHostsManager, valueHostConfigs: Array<ValueHostConfig>) => { };


        let testItem: PublicifiedValueHostsManager | null = null;
        expect(() => testItem = new PublicifiedValueHostsManager(builder)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
        expect(testItem!.onConfigChanged).not.toBeNull();
    });
});
function testStaticValueHostInstanceState(testItem: PublicifiedValueHostsManager, valueHostName: ValueHostName,
    instanceState: Partial<StaticValueHostInstanceState> | null): void {
    let valueHost = testItem.exposedValueHosts.get(valueHostName) as StaticValueHost;
    expect(valueHost).toBeDefined();
    expect(valueHost).toBeInstanceOf(StaticValueHost);

    if (!instanceState)
        instanceState = {};
    // fill in missing properties from factory createInstanceState defaults
    let factory = new ValueHostFactory();
    factory.register(new StaticValueHostGenerator());
    let config = testItem.exposedValueHostConfigs.get(valueHostName) as StaticValueHostConfig;
    let defaultState = factory.createInstanceState(config) as StaticValueHostInstanceState;

    let stateToCompare: StaticValueHostInstanceState = { ...defaultState, ...instanceState, };

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
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(config, null)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);
        
        // Check the valueHosts type and initial state
        testStaticValueHostInstanceState(testItem, 'Field1', null);
    });
    test('Second ValueHost with same name throws', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config1: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(config1, null)).not.toThrow();
        let config2: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        expect(() => testItem.addValueHost(config1, null)).toThrow();
    });
    test('Add2 Configs. ValueHosts and states are generated for both.', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config1: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let initialValueHost1 = testItem.addValueHost(config1, null);
        let config2: StaticValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Static,
            label: 'Field 2'
        };
        let initialValueHost2 = testItem.addValueHost(config2, null);

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(2);
        expect(testItem.exposedValueHosts.get('Field1')).toBe(initialValueHost1);
        expect(testItem.exposedValueHosts.get('Field2')).toBe(initialValueHost2);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(testItem.exposedValueHostConfigs.size).toBe(2);
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config1);
        expect(testItem.exposedValueHostConfigs.get('Field2')).toEqual(config2);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config1);
        expect(testItem.exposedValueHostConfigs.get('Field2')).not.toBe(config2);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);

        // Check the valueHosts type and initial state
        testStaticValueHostInstanceState(testItem, 'Field1', null);
        // Check the valueHosts type and initial state
        testStaticValueHostInstanceState(testItem, 'Field2', null);
    });
    test('New ValueHostConfig with provided state creates ValueHost, adds Config, and uses the provided state', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let state: ValueHostInstanceState = {
            name: 'Field1',
            value: 'ABC'
        };
        expect(() => testItem.addValueHost(config, state)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(testItem.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();
        expect(testItem.exposedState.stateChangeCounter).toBe(0);

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);

        // Check the valueHosts type and initial state
        testStaticValueHostInstanceState(testItem, 'Field1', {
            value: 'ABC'
        });
    });
});

// addOrUpdateValueHost(config: ValueHostConfig): void
describe('ValueHostsManager.addOrUpdateValueHost completely replaces the ValueHost instance', () => {
    test('Replace the config to install a validator', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1',
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config };
        replacementConfig.dataType = 'ALT';
        replacementConfig.label = 'ALT Label';

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrUpdateValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHosts.get('Field1')).toBe(replacementValueHost);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(testItem.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toEqual(config);
        expect(config.label).toBe('Field 1');

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(replacementConfig);

        // ensure ValueHost is StaticValueHost and has an initial state
        testStaticValueHostInstanceState(testItem, 'Field1', null);
    });
    test('addOrUpdateValueHost works like addValueHost with unknown ValueHostConfig', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        expect(() => testItem.addOrUpdateValueHost(config, null)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(testItem.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);

        // ensure ValueHost is StaticValueHost and has an initial state
        testStaticValueHostInstanceState(testItem, 'Field1', null);
    });

    test('Replace the state, keeping the same config. Confirm the state and config', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: StaticValueHostInstanceState = {
            name: 'Field1',
            value: 40
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrUpdateValueHost(config, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);

        // ensure ValueHost is StaticValueHost and has an initial state
        testStaticValueHostInstanceState(testItem, 'Field1', updateState);
    });
    test('Edit state instance after addOrUpdateValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1',
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: StaticValueHostInstanceState = {
            name: 'Field1',
            value: 40
        };
        testItem.addOrUpdateValueHost(config, updateState);

        let savedState = deepClone(updateState);
        updateState.value = 100;

        // ensure ValueHost is StaticValueHost and has an initial state
        testStaticValueHostInstanceState(testItem, 'Field1', savedState);
    });
    test('Confirm previous ValueHost is discarded and new one retains the state from the previous one', () => {
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config]
        });

        let initialValueHost = testItem.getValueHost('Field1')!
        initialValueHost.setValue(100); // some stateful info
        let savedValue = initialValueHost.getValue();

        let updatedConfig: StaticValueHostConfig = { ...config, label: 'Label changed' };        

        let replacementValueHost = testItem.addOrUpdateValueHost(updatedConfig, null);
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced
        expect(replacementValueHost.getValue()).toBe(savedValue);
        expect(replacementValueHost.getLabel()).toBe('Label changed');

        expect(() => initialValueHost.getFromInstanceState('anything')).toThrow();  // deref error
    });    
    test('Confirm previous ValueHost is discarded and but uses the state passed into addOrUpdateValueHost', () => {
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config]
        });

        let initialValueHost = testItem.getValueHost('Field1')!
        initialValueHost.setValue(100); // some stateful info
        let savedValue = initialValueHost.getValue();

        let updatedConfig: StaticValueHostConfig = { ...config, label: 'Label changed' };
        let updateState: StaticValueHostInstanceState = {
            name: 'Field1',
            value: 40
        };
        let replacementValueHost = testItem.addOrUpdateValueHost(updatedConfig, updateState);
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced
        expect(replacementValueHost.getValue()).toBe(updateState.value);    // different state
        expect(replacementValueHost.getLabel()).toBe('Label changed');

        expect(() => initialValueHost.getFromInstanceState('anything')).toThrow();  // deref error
    });        
});
describe('ValueHostsManager.discardValueHost completely removes ValueHost, its state and config', () => {
    test('After adding in the VM Config, discard the only one leaves empty valueHosts, configs, and state', () => {
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
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
        let initialValueHost = testItem.getValueHost(config.name)!;
        expect(initialValueHost.getValue()).toBe(10);  // to prove later this is deleted

        expect(() => testItem.discardValueHost(config.name)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(0);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(testItem.exposedValueHostConfigs.size).toBe(0);
        expect(testItem.exposedState).not.toBeNull();

        expect(() => initialValueHost.getFromInstanceState('anything')).toThrow();

        // add back the config to confirm the original state (value=10) was discarded
        let addedVH = testItem.addValueHost(config, null);
        expect(addedVH.getValue()).toBeUndefined();

    });
    test('Discard the only one leaves empty valueHosts, configs, and state', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let initialValueHost = testItem.addValueHost(config, null);

        expect(() => testItem.discardValueHost(config.name)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(0);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(testItem.exposedValueHostConfigs.size).toBe(0);
        expect(testItem.exposedState).not.toBeNull();

        expect(() => initialValueHost.getFromInstanceState('anything')).toThrow();

    });

    test('Start with 2 Configs and discard one retains only the expected ValueHost, its state and config', () => {
        let testItem = new PublicifiedValueHostsManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config1: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let initialValueHost1 = testItem.addValueHost(config1, null);
        let config2: StaticValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Static,
            label: 'Field 2'
        };
        let initialValueHost2 = testItem.addValueHost(config2, null);

        expect(() => testItem.discardValueHost(config2.name)).not.toThrow();

        expect(testItem.exposedValueHosts).not.toBeNull();
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHosts.get('Field1')).toBe(initialValueHost1);
        expect(testItem.exposedValueHostConfigs).not.toBeNull();
        expect(testItem.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config1);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config1);
        expect(testItem.exposedState).not.toBeNull();

    });
});
// getValueHost(valueHostName: ValueHostName): IValueHost | null
describe('ValueHostsManager.getValueHost, getCalcValueHost, getStaticValueHost', () => {
    test('With 2 StaticValueHostConfigs, get each with all functions. Expect null for Calc and Static', () => {

        let config1: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let config2: StaticValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Static,
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
        expect(vh2).toBeInstanceOf(StaticValueHost);
        expect(vh2!.getName()).toBe('Field2');

        let vh9: ICalcValueHost | null = null;
        expect(() => vh9 = testItem.getCalcValueHost('Field2')).not.toThrow();
        expect(vh9).toBeNull();


    });
    test('With 2 Array<ValueHostConfig>, get each with both functions. getValueHost returns VH', () => {

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

        let vh9: ICalcValueHost | null = null;
        expect(() => vh9 = testItem.getCalcValueHost('Field1')).not.toThrow();
        expect(vh9).toBeNull();
        let vh10: ICalcValueHost | null = null;
        expect(() => vh10 = testItem.getCalcValueHost('Field2')).not.toThrow();
        expect(vh10).toBeInstanceOf(CalcValueHost);
        let vh11: IStaticValueHost | null = null;
        expect(() => vh11 = testItem.getStaticValueHost('Field1')).not.toThrow();
        expect(vh11).toBeInstanceOf(StaticValueHost);
        let vh12: IStaticValueHost | null = null;
        expect(() => vh12 = testItem.getStaticValueHost('Field2')).not.toThrow();
        expect(vh12).toBeNull();

    });
    test('When supplying an unknown ValueHostName, return null.', () => {

        let config1: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };

        let testItem = new PublicifiedValueHostsManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();
        let vh4: ICalcValueHost | null = null;
        expect(() => vh4 = testItem.getCalcValueHost('Unknown')).not.toThrow();
        expect(vh4).toBeNull();
        let vh5: IStaticValueHost | null = null;
        expect(() => vh5 = testItem.getStaticValueHost('Unknown')).not.toThrow();
        expect(vh5).toBeNull();
    });
});

// updateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValueHostsManager.updateState', () => {
    interface ITestExtendedState extends ValueHostsManagerInstanceState {
        Value: number;
    }
    class TestValueHostsManager extends ValueHostsManager<ITestExtendedState> {
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedState) => ITestExtendedState, callback: ValueHostsManagerInstanceStateChangedHandler | null): Array<ITestExtendedState> {
        let labelNumber = 1;
        let vhConfig: ValueHostConfig = {
            name: `Field${labelNumber}`,
            valueHostType: ValueHostType.Static,
            label: `Field ${labelNumber}`,
        };
        let state: ITestExtendedState = {
            Value: initialValue
        };
        let services = createValidationServicesForTesting();
        services.autoGenerateDataTypeCheckService.enabled = false;

        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [vhConfig],
            savedInstanceState: state,
            savedValueHostInstanceStates: [],
            onInstanceStateChanged: callback
        };

        let testItem = new TestValueHostsManager(vmConfig);
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
            let services = createValidationServicesForTesting();
            services.autoGenerateDataTypeCheckService.enabled = false;

            let vmConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: [],
                savedInstanceState: null,
                savedValueHostInstanceStates: [],
                onInstanceStateChanged: null
            };

            let testItem = new TestValueHostsManager(vmConfig);
            expect(() => testItem.updateInstanceState(null!)).toThrow(/updater/);
        });
});
describe('vh', () => {
    test('Returns an instance of ValueHostAccessor', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        expect(vhm.vh).toBeInstanceOf(ValueHostAccessor);
        expect(vhm.vh.static('Field1')).toBeInstanceOf(StaticValueHost);
        expect(() => vhm.vh.calc('X')).toThrow(/unknown/);
        expect(() => vhm.vh.calc('Field1')).toThrow(/CalcValueHost/);
        expect(() => vhm.vh.property('Field1')).toThrow(/PropertyValueHost/);
        expect(() => vhm.vh.input('Field1')).toThrow(/InputValueHost/);
    });
});
describe('enumerateValueHosts', () => {
    test('No valuehosts exist, returns generator.result.done=true on first request', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let generator = vhm.enumerateValueHosts();
        expect(generator).toBeDefined();
        let first = generator.next();
        expect(first.done).toBe(true);
        expect(first.value).toBeUndefined();
    });
    test('3 valuehosts exist, returns all 3 and on the 4th call, returns result.done=true', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            },
            <CalcValueHostConfig>{
                valueHostType: ValueHostType.Calc,
                name: 'Field2',
                calcFn: () => 0
            },
            {
                valueHostType: ValueHostType.Static,
                name: 'Field3'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let generator = vhm.enumerateValueHosts();
        expect(generator).toBeDefined();
        let first = generator.next();
        expect(first.done).toBe(false);
        expect(first.value).toBeInstanceOf(StaticValueHost);
        let second = generator.next();
        expect(second.done).toBe(false);
        expect(second.value).toBeInstanceOf(CalcValueHost);
        let third = generator.next();
        expect(third.done).toBe(false);
        expect(third.value).toBeInstanceOf(StaticValueHost);
        let fourth = generator.next();
        expect(fourth.done).toBe(true);
        expect(fourth.value).toBeUndefined();
    });
    test('3 valuehosts exist and filter wants only StaticValueHost, returns 1 StaticValueHost and on the 2nd call, returns result.done=true', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            },
            <CalcValueHostConfig>{
                valueHostType: ValueHostType.Calc,
                name: 'Field2',
                calcFn: () => 0
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let generator = vhm.enumerateValueHosts((vh) => vh instanceof StaticValueHost);
        expect(generator).toBeDefined();
        let first = generator.next();
        expect(first.done).toBe(false);
        expect(first.value).toBeInstanceOf(StaticValueHost);
        let second = generator.next();
        expect(second.done).toBe(true);
        expect(second.value).toBeUndefined();
    });
    test('3 valuehosts exist and filter wants only CalcValueHost, returns result.done=true on first request', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            },
            {
                valueHostType: ValueHostType.Static,
                name: 'Field2'
            },
            {
                valueHostType: ValueHostType.Static,
                name: 'Field3'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let generator = vhm.enumerateValueHosts((vh) => vh instanceof CalcValueHost);
        expect(generator).toBeDefined();
        let first = generator.next();
        expect(first.done).toBe(true);
        expect(first.value).toBeUndefined();
    });
});
describe('toIValueHostResolver function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostResolver = {
            dispose: () => { },
            getValueHost: (name) => { return <any>{}; },
            vh: {} as unknown as IValueHostAccessor,
            getCalcValueHost: (name) => { return <any>{}; },
            getStaticValueHost: (name) => { return <any>{}; },
            services: new MockValidationServices(false, false),
            enumerateValueHosts: function (): Generator<IValueHost, any, unknown> {
                throw new Error("Function not implemented.");
            }
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
            vh: {} as unknown as IValueHostAccessor,
            getCalcValueHost: (name) => { return <any>{}; },
            getStaticValueHost: (name) => { return <any>{}; },
            services: new MockValidationServices(false, false),
            notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { },
            dispose: () => void {},
            addValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");
            },
            addOrUpdateValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");
            },
            addOrMergeValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");

            },
            discardValueHost: function (valueHostName: string): void {
                throw new Error("Function not implemented.");
            },

            enumerateValueHosts: function (filter?: (valueHost: IValueHost) => boolean): Generator<IValueHost> {
                throw new Error("Function not implemented.");
            },
            startModifying: function () {
                throw new Error("Function not implemented.");
            },
            notifyValueHostInstanceStateChanged: function (valueHost: IValueHost, instanceState: ValueHostInstanceState): void {
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
            valueHostsManager: {
                getValueHost: (name) => { return <any>{}; },
                vh: {} as unknown as IValueHostAccessor,
                getCalcValueHost: (name) => { return <any>{}; },
                getStaticValueHost: (name) => { return <any>{}; },
                services: new MockValidationServices(false, false),
                notifyOtherValueHostsOfValueChange: (valueHostIdThatChanged, revalidate) => { },
                dispose: () => void {},
                addValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                    throw new Error("Function not implemented.");
                },
                addOrUpdateValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                    throw new Error("Function not implemented.");
                },
                addOrMergeValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                    throw new Error("Function not implemented.");
                },
                discardValueHost: function (valueHostName: string): void {
                    throw new Error("Function not implemented.");
                },

                enumerateValueHosts: function (filter?: (valueHost: IValueHost) => boolean): Generator<IValueHost> {
                    throw new Error("Function not implemented.");
                },
                startModifying: function () {
                    throw new Error("Function not implemented.");
                },
                notifyValueHostInstanceStateChanged: function (valueHost: IValueHost, instanceState: ValueHostInstanceState): void {
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
            onValueChanged: (vh: IValueHost, old: any) => { },
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => { },
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any) => { },
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
            onValueChanged: (vh: IValueHost, old: any) => { },
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => { },
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any) => { },
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

describe('startModifying()', () => {
    test('static() gets added correctly', () => {
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let modifier = testItem.startModifying();
        modifier.static('Field1', null, { label: 'Field 1' });
        modifier.apply();

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(StaticValueHost);
        expect(vh1!.getName()).toBe('Field1');
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBeNull();
    });
    test('calc() gets added correctly', () => {
        function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
            return 1;
        }
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let modifier = testItem.startModifying();
        modifier.calc('Field1', 'Test', calcFnForTests);
        modifier.apply();

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(CalcValueHost);
        expect(vh1!.getName()).toBe('Field1');
        expect(vh1!.getDataType()).toBe('Test');
    });
    test('no changes if apply is not called', () => {
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let modifier = testItem.startModifying();
        modifier.static('Field1', null, { label: 'Field 1' });

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeNull();
    });
});
describe('invokeOnConfigChanged', () => {
    function testCallback(configs: Array<ValueHostConfig>): void {
        function handler(manager: IValueHostsManager, configs: Array<ValueHostConfig>): void {
            configsReceived = configs;
        }
        let configsReceived: Array<ValueHostConfig> | undefined = undefined;
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false),
            valueHostConfigs: configs,
            onConfigChanged: handler
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        testItem.exposedInvokeOnConfigChanged();
        expect(configsReceived).toEqual(configs);
        // confirm all configs are not the same instances as those that are held in Manager
        configsReceived!.forEach(config => {
            expect(testItem.exposedValueHostConfigs.get(config.name)).not.toBe(config);
        });

    }
    test('Callback not connected does not throw', () => {
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        expect(() => testItem.exposedInvokeOnConfigChanged()).not.toThrow();
    });
    test('With no ValueHostConfigs, callback still invoked and returns an empty array', () => {
        testCallback([]);
    });
    test('With several ValueHostConfigs, callback still invoked and returns the identical configs', () => {
        testCallback([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        },
        {
            valueHostType: ValueHostType.Static,
            name: 'Field2'
        }
        ]);
    });
    test('ValueHostManager constructor does not invoke when it adds ValueHosts from ValueHostsConfig', () => {
        function handler(manager: IValueHostsManager, configs: Array<ValueHostConfig>): void {
            configsReceived = configs;
        }
        let configsReceived: Array<ValueHostConfig> | undefined = undefined;
        let config1: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        };
        let config2: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field2',
            dataType: LookupKey.String,
            label: 'Field 2'
        };        
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false),
            valueHostConfigs: [config1, config2],
            onConfigChanged: handler
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);

        expect(configsReceived).toBeUndefined();
    });            
    test('Use addValueHost to invoke', () => {
        function handler(manager: IValueHostsManager, configs: Array<ValueHostConfig>): void {
            configsReceived = configs;
        }
        let configsReceived: Array<ValueHostConfig> | undefined = undefined;
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false),
            valueHostConfigs: [],
            onConfigChanged: handler
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let config1: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        };
        testItem.addValueHost(config1, null);
        expect(configsReceived).toEqual([config1]);
        let config2: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field2'
        };
        testItem.addValueHost(config2, null);
        expect(configsReceived).toEqual([config1, config2]);
    });
    test('Use addOrUpdateValueHost to invoke, with both referencing the same ValueHostName', () => {
        function handler(manager: IValueHostsManager, configs: Array<ValueHostConfig>): void {
            configsReceived = configs;
        }
        let configsReceived: Array<ValueHostConfig> | undefined = undefined;
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false),
            valueHostConfigs: [],
            onConfigChanged: handler
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let config1: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        };
        testItem.addOrUpdateValueHost(config1, null);
        expect(configsReceived).toEqual([config1]);
        let config2: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: LookupKey.String,
            label: 'Field 1'
        };
        testItem.addOrUpdateValueHost(config2, null);
        expect(configsReceived).toEqual([config2]);
    });    
    test('Use addOrMergeValueHost to invoke, with both referencing the same ValueHostName', () => {
        function handler(manager: IValueHostsManager, configs: Array<ValueHostConfig>): void {
            configsReceived = configs;
        }
        let configsReceived: Array<ValueHostConfig> | undefined = undefined;
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false),
            valueHostConfigs: [],
            onConfigChanged: handler
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let config1: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: LookupKey.String
        };
        testItem.addOrMergeValueHost(config1, null);
        expect(configsReceived).toEqual([config1]);
        let config2: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        };
        testItem.addOrMergeValueHost(config2, null);
        expect(configsReceived).toEqual([<StaticValueHostConfig>{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.String
        }]);
    });       
    test('Use discardValueHost to invoke', () => {
        function handler(manager: IValueHostsManager, configs: Array<ValueHostConfig>): void {
            configsReceived = configs;
        }
        let configsReceived: Array<ValueHostConfig> | undefined = undefined;
        let config1: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        };
        let config2: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field2',
            dataType: LookupKey.String,
            label: 'Field 2'
        };        
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false),
            valueHostConfigs: [config1, config2],
            onConfigChanged: handler
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);

        testItem.discardValueHost('Field1');
        expect(configsReceived).toEqual([config2]);
        // discardValueHost with an unknown field does not invoke the function
        configsReceived = undefined;
        testItem.discardValueHost('Field1');
        expect(configsReceived).toBeUndefined();
    });        
    test('Use Modifier to invoke, merging with existing', () => {
        function handler(manager: IValueHostsManager, configs: Array<ValueHostConfig>): void {
            configsReceived = configs;
        }
        let configsReceived: Array<ValueHostConfig> | undefined = undefined;
        let config1: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: LookupKey.String
        };
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false),
            valueHostConfigs: [config1],
            onConfigChanged: handler
        };
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let modifier = testItem.startModifying();
        modifier.static('Field1', null, { label: 'Field 1' });
        expect(configsReceived).toBeUndefined();    // not unto apply
        modifier.apply();

        expect(configsReceived).toEqual([<StaticValueHostConfig>{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.String
        }]);
    });           
});
describe('dispose', () => {
    test('dispose kills all expected properties', () => {
        let vmConfig: ValueHostsManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.static('Field1');
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        let vh = testItem.vh.static('Field1');
        testItem.dispose();
        expect(testItem.exposedState).toBeUndefined();
        expect(testItem.exposedValueHostConfigs).toBeUndefined();
        expect(testItem.exposedValueHosts).toBeUndefined();

        expect(() => testItem.getValueHost('Field1')).toThrow(TypeError);
        expect(() => vh.getDataType()).toThrow(TypeError);
        expect(() => vh.setValue(0)).toThrow(TypeError);

    });
    test('dispose with valueHostsConfig having its own dispose kills what the config.dispose expects', () => {
        interface X extends ValueHostsManagerConfig, IDisposable {
            x: {}
        }
        let vmConfig: X = {
            services: new MockValidationServices(true, false), valueHostConfigs: [],
            x: {},
            dispose: () => { vmConfig.x = undefined! }
        };
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.static('Field1');
        let testItem = new PublicifiedValueHostsManager(vmConfig);
        testItem.dispose();
        expect(vmConfig.x).toBeUndefined();

    });
});