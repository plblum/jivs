import { RegExpConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { EvaluateChildConditionResultsBaseConfig } from "../../src/Conditions/EvaluateChildConditionResultsBase";
import { ConditionConfig } from "../../src/Interfaces/Conditions";
import { ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "../../src/Interfaces/ValueHostsManager";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { FluentConditionCollector } from "../../src/ValueHosts/Fluent";
import { ValueHostsManagerConfigBuilder } from "../../src/ValueHosts/ValueHostsManagerConfigBuilder";
import { MockValidationServices } from "../TestSupport/mocks";
import { ensureFluentTestConditions } from "./ManagerConfigBuilderBase.test";


ensureFluentTestConditions();


function createVMConfig(): ValueHostsManagerConfig {
    let vmConfig: ValueHostsManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}
class Publicify_ValueHostsManagerConfigBuilder extends ValueHostsManagerConfigBuilder
{
    public get publicify_baseConfig(): ValueHostsManagerConfig {
        return super.baseConfig;
    }

    public get publicify_overridenValueHostConfigs(): Array<Array<ValueHostConfig>> {
        return super.overridenValueHostConfigs;
    }
}
describe('instance state properties', () => {
    test('savedInstanceState', () => {
        const initialState: ValueHostsManagerInstanceState = {
            stateChangeCounter: 10
        };
        const replacementState: ValueHostsManagerInstanceState = {
            stateChangeCounter: 20,
        };

        let services = new MockValidationServices(false, false);
        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [],
            savedInstanceState: initialState
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.savedInstanceState).toBe(initialState);
        testItem.savedInstanceState = replacementState;
        expect(testItem.savedInstanceState).toBe(replacementState);
        let result = testItem.complete();
        expect(result.savedInstanceState).toBe(replacementState);
    });    
    test('savedValueHostInstanceStates', () => {
        const initialState: Array<ValueHostInstanceState> = [{ name: 'Property1', value: 'A' }];
        const replacementState: Array<ValueHostInstanceState> = [{ name: 'Property1', value: 'B' }];

        let services = new MockValidationServices(false, false);
        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [],
            savedValueHostInstanceStates: initialState
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.savedValueHostInstanceStates).toBe(initialState);
        testItem.savedValueHostInstanceStates = replacementState;
        expect(testItem.savedValueHostInstanceStates).toBe(replacementState);
        let result = testItem.complete();
        expect(result.savedValueHostInstanceStates).toBe(replacementState);
    });    
});
describe('Callbacks get and set', () => {
    test('onValueHostInstanceStateChanged', () => {
        function handler(valueHost: IValueHost, stateToRetain: ValueHostInstanceState): void
        {
            
        }
        function replacementHandler(valueHost: IValueHost, stateToRetain: ValueHostInstanceState): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onValueHostInstanceStateChanged: handler
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.onValueHostInstanceStateChanged).toBe(handler);
        testItem.onValueHostInstanceStateChanged = replacementHandler;
        expect(testItem.onValueHostInstanceStateChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onValueHostInstanceStateChanged).toBe(replacementHandler);
    });
    test('onValueChanged', () => {
        function handler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        function replacementHandler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onValueChanged: handler
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.onValueChanged).toBe(handler);
        testItem.onValueChanged = replacementHandler;
        expect(testItem.onValueChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onValueChanged).toBe(replacementHandler);
    });
    
    test('onInputValueChanged', () => {
        function handler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        function replacementHandler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onInputValueChanged: handler
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.onInputValueChanged).toBe(handler);
        testItem.onInputValueChanged = replacementHandler;
        expect(testItem.onInputValueChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onInputValueChanged).toBe(replacementHandler);
    });
    
    
    test('onInstanceStateChanged', () => {
        function handler(ValueHostsManager: IValueHostsManager, stateToRetain: ValueHostsManagerInstanceState): void
        {
            
        }
        function replacementHandler(ValueHostsManager: IValueHostsManager, stateToRetain: ValueHostsManagerInstanceState): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onInstanceStateChanged: handler
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.onInstanceStateChanged).toBe(handler);
        testItem.onInstanceStateChanged = replacementHandler;
        expect(testItem.onInstanceStateChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onInstanceStateChanged).toBe(replacementHandler);
    });
    test('onConfigChanged', () => {
        function handler(ValueHostsManager: IValueHostsManager, valueHostConfigs: Array<ValueHostConfig>): void
        {
            
        }
        function replacementHandler(ValueHostsManager: IValueHostsManager, valueHostConfigs: Array<ValueHostConfig>): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onConfigChanged: handler
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.onConfigChanged).toBe(handler);
        testItem.onConfigChanged = replacementHandler;
        expect(testItem.onConfigChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onConfigChanged).toBe(replacementHandler);
    });    
});
describe('build(vmConfig).conditions', () => {
    test('Undefined parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions();
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionCollector with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(null!);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('Supplied parameter creates a FluentConditionCollector with the same vhConfig', () => {
        let vmConfig = createVMConfig();

        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorCollector with the same vhConfig and conditionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });
});

describe('Fluent chaining on build(vmConfig).conditions', () => {
    test('build(vmConfig).conditions: Add RequireTest condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions().testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).conditions: Add RequireTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions()
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
    test('build(vmConfig).conditions with EvaluateChildConditionResultsBaseConfig parameter: Add RequireText condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let eccrConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: 'All',
            conditionConfigs: []
        };
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(eccrConfig).testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig).toBe(eccrConfig);
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).conditions with EvaluateChildConditionResultsBaseConfig parameter: Add RequireText and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let eccrConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: 'All',
            conditionConfigs: []
        };
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(eccrConfig)
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let parentConfig = (testItem as FluentConditionCollector).parentConfig;
        expect(parentConfig).toBe(eccrConfig);
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});

