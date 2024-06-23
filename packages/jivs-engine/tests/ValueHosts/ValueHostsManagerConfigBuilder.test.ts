import { ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "../../src/Interfaces/ValueHostsManager";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
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

    public get publicify_overriddenValueHostConfigs(): Array<Array<ValueHostConfig>> {
        return super.overriddenValueHostConfigs;
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
