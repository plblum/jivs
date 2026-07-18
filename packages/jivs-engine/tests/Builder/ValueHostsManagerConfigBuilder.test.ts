import { ValidationManagerConfig, ValidationManagerInstanceState } from "../../src/Interfaces/ValidationManager";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { IValidationManager } from "../../src/Interfaces/ValidationManager";
import { ValueHostsManagerConfigBuilder } from "../../src/Builder/ValueHostsManagerConfigBuilder";
import { MockValidationServices } from "../TestSupport/mocks";

function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}
class Publicify_ValueHostsManagerConfigBuilder extends ValueHostsManagerConfigBuilder
{
    public get publicify_baseConfig(): ValidationManagerConfig {
        return this.baseConfig;
    }

    public get publicify_overriddenValueHostConfigs(): Array<Array<ValueHostConfig>> {
        return this.overriddenValueHostConfigs;
    }
}
describe('instance state properties', () => {
    test('savedInstanceState', () => {
        const initialState: ValidationManagerInstanceState = {
            stateChangeCounter: 10
        };
        const replacementState: ValidationManagerInstanceState = {
            stateChangeCounter: 20,
        };

        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
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
        let vmConfig: ValidationManagerConfig = {
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
        let vmConfig: ValidationManagerConfig = {
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
        let vmConfig: ValidationManagerConfig = {
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
    
    test('onTextValueChanged', () => {
        function handler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        function replacementHandler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onTextValueChanged: handler
        };
        let testItem = new ValueHostsManagerConfigBuilder(vmConfig);
        expect(testItem.onTextValueChanged).toBe(handler);
        testItem.onTextValueChanged = replacementHandler;
        expect(testItem.onTextValueChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onTextValueChanged).toBe(replacementHandler);
    });
    
    
    test('onInstanceStateChanged', () => {
        function handler(validationManager: IValidationManager, stateToRetain: ValidationManagerInstanceState): void
        {
            
        }
        function replacementHandler(validationManager: IValidationManager, stateToRetain: ValidationManagerInstanceState): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
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
        function handler(validationManager: IValidationManager, valueHostConfigs: Array<ValueHostConfig>): void
        {
            
        }
        function replacementHandler(validationManager: IValidationManager, valueHostConfigs: Array<ValueHostConfig>): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
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
