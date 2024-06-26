import {
    type ValueHostInstanceState, type IValueHost, ValueHostConfig, IValueHostCallbacks, toIValueHostCallbacks,
    ValueHostInstanceStateChangedHandler
} from "../../src/Interfaces/ValueHost";
import { ValueHostBase } from "../../src/ValueHosts/ValueHostBase";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { IValueHostsServices } from '../../src/Interfaces/ValueHostsServices';
import { IValueHostGenerator } from "../../src/Interfaces/ValueHostFactory";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import { IDisposable } from "../../src/Interfaces/General_Purpose";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";


interface IPublicifiedValueHostInstanceState extends ValueHostInstanceState
{
    counter: number;    // incremented each time the state is cleaned    
}
/**
 * Subclass of ValueHostBase to focus testing on ValueHostBase members
 * including exposing protected members
 */
class PublicifiedValueHostBase extends ValueHostBase<ValueHostConfig, IPublicifiedValueHostInstanceState>
{
    constructor(valueHostsManager : IValueHostsManager, config: ValueHostConfig, state: IPublicifiedValueHostInstanceState) {
        super(valueHostsManager, config, state);
    }
    public get exposeServices(): IValueHostsServices {
        return this.services;
    }

    public get exposeConfig(): ValueHostConfig {
        return this.config;
    }

    public get exposeState(): IPublicifiedValueHostInstanceState {
        return this.instanceState;
    }
}
/**
 * This implementation of IValueHostGenerator is actually tested in ValueHostFactory.tests.ts
 */
class PublicifiedValueHostBaseGenerator implements IValueHostGenerator {
    public canCreate(config: ValueHostConfig): boolean {
        return config.valueHostType === testValueHostType;
    }
    public create(valueHostsManager : IValueHostsManager, config: ValueHostConfig, state: IPublicifiedValueHostInstanceState): IValueHost {
        return new PublicifiedValueHostBase(valueHostsManager, config, state);
    }
    public cleanupInstanceState(state: IPublicifiedValueHostInstanceState, config: ValueHostConfig): void {
        state.counter = 0;
    }
    public createInstanceState(config: ValueHostConfig): IPublicifiedValueHostInstanceState {
        let state: IPublicifiedValueHostInstanceState = {
            name: config.name,
            value: config.initialValue,
            counter: 0
        };
        return state;
    }

}

const testValueHostType = 'PublicifyValueHostBase';

/**
 * Returns an ValueHost (PublicifiedValueHost subclass) ready for testing.
 * @param config - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * name: 'Field1',
 * Label: 'Label1',
 * Type: testValueHostType,
 * DataType: LookupKey.String,
 * InitialValue: 'DATA'
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, ValueHosts, the complete Config,
 * and the state.
 */
function setupValueHost(config?: Partial<ValueHostConfig>, initialValue?: any): {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    config: ValueHostConfig,
    state: ValueHostInstanceState,
    valueHost: PublicifiedValueHostBase
} {
    let services = new MockValidationServices(false, false);
    let factory = new ValueHostFactory();
    factory.register(new PublicifiedValueHostBaseGenerator());
    services.valueHostFactory = factory;
    let vm = new MockValidationManager(services);

    let defaultConfig: ValueHostConfig = {
        name: 'Field1',
        label: 'Label1',
        valueHostType: testValueHostType,
        dataType: LookupKey.String,
        initialValue: 'DATA'
    };
    let updatedConfig: ValueHostConfig = (!config) ?
        defaultConfig :
        { ...defaultConfig, ...config };
    let state: IPublicifiedValueHostInstanceState = {
        name: 'Field1',
        value: initialValue,
        counter: 0
    };
    let vh = new PublicifiedValueHostBase(vm,
        updatedConfig, state);
    return {
        services: services,
        validationManager: vm,
        config: updatedConfig,
        state: state,
        valueHost: vh
    };
}

// constructor(validationManager: IValidationManager, config: TConfig, state: TState)
describe('constructor and resulting property values', () => {

    test('constructor with valid parameters created and sets up Services, Config, and State', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vhConfig: ValueHostConfig = {
            name: 'Field1',
            valueHostType: 'TestValidatableValueHost',
        };
        let testItem: PublicifiedValueHostBase | null = null;
        expect(()=> testItem = new PublicifiedValueHostBase(vm, vhConfig,
            {
                name: 'Field1',
                counter: 0,
                value: undefined
            })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getLabel()).toBe('');
        expect(testItem!.getDataType()).toBeNull();
        expect(testItem!.getValue()).toBeUndefined();
        expect(testItem!.isChanged).toBe(false);
        expect(testItem!.isEnabled()).toBe(true);

        expect(testItem!.exposeServices).toBe(services);
        expect(testItem!.exposeConfig).toBe(vhConfig);
        expect(testItem!.exposeState.name).toBe('Field1');
        expect(testItem!.exposeState.enabled).toBeUndefined();
        expect(testItem!.valueHostsManager).toBe(vm);
    });

    test('constructor with Config.dataType undefined results in getDataType = null', () => {
        let setup = setupValueHost({
            dataType: undefined
        });
        let testItem = setup.valueHost;
        expect(testItem.getDataType()).toBeNull();
    });
    test('constructor with Config.labell10n setup. GetLabel results in localized lookup', () => {
        let setup = setupValueHost({
            labell10n: 'Label1-key'
        });
        let tls = setup.services.textLocalizerService as TextLocalizerService;
        tls.register('Label1-key', {
            '*': '*-Label1'
        });
        let testItem = setup.valueHost;

        expect(testItem.getLabel()).toBe('*-Label1');
    });
    test('constructor with Config.labell10n setup but not in the textlocalizer and no value in config.label. GetLabel results in empty string', () => {
        let setup = setupValueHost({
            labell10n: 'Label1-key',
            label: undefined
        });
        let tls = setup.services.textLocalizerService as TextLocalizerService;
        tls.register('Different-key', {
            '*': '*-Label1'
        });
        let testItem = setup.valueHost;

        expect(testItem.getLabel()).toBe('');
    });    
    test('constructor with null in each parameter throws', () => {

        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);        
        let config: ValueHostConfig = {
            name: 'Field1',
            label: 'Label1',
            valueHostType: testValueHostType,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };
        let state: IPublicifiedValueHostInstanceState = {
            name: 'Field1',
            value: undefined,
            counter: 0
        };
        let testItem: PublicifiedValueHostBase | null = null;
        expect(() => testItem = new PublicifiedValueHostBase(null!,
            config, state)).toThrow(/valueHostsManager/);
        expect(() => testItem = new PublicifiedValueHostBase(vm,
            null!, state)).toThrow(/config/);
        expect(() => testItem = new PublicifiedValueHostBase(vm,
            config, null!)).toThrow(/state/);
    });
});
describe('ValidatableValueHostBase.getValue', () => {
    test('Set instanceState.Value to undefined; getValue is undefined', () => {
        let setup = setupValueHost(undefined, undefined);
        let value: any = null;
        expect(() => value = setup.valueHost.getValue()).not.toThrow();
        expect(value).toBeUndefined();
    });
    test('Set instanceState.Value to null; getValue is null', () => {
        let setup = setupValueHost(undefined, null);
        let value: any = null;
        expect(() => value = setup.valueHost.getValue()).not.toThrow();
        expect(value).toBeNull();
    });
    test('Set instanceState.Value to 10; getValue is 10', () => {
        let setup = setupValueHost(undefined, 10);
        let value: any = null;
        expect(() => value = setup.valueHost.getValue()).not.toThrow();
        expect(value).toBe(10);
    });

});
describe('updateState', () => {
    test('Update value with +1 results in new instance of State and report to ValidationManager',
        () => {
            let initialValue = 100;
            let setup = setupValueHost({}, initialValue);
            let testItem = setup.valueHost;
            expect(testItem.getValue()).toBe(initialValue);
            let fn = (stateToUpdate: IPublicifiedValueHostInstanceState): IPublicifiedValueHostInstanceState => {
                stateToUpdate.value = stateToUpdate.value + 1;
                return stateToUpdate;
            };
            // try several times
            for (let i = 1; i <= 3; i++) {
                let originalState = testItem.exposeState;
                expect(() => testItem.updateInstanceState(fn, testItem)).not.toThrow();
                expect(testItem.getValue()).toBe(initialValue + i);
                expect(testItem.exposeState).not.toBe(originalState);   // different instances
            }
            let changes = setup.validationManager.getHostStateChanges();
            expect(changes.length).toBe(3);
            for (let i = 1; i <= 3; i++) {

                expect(changes[i - 1].name).toBe('Field1');
                expect(changes[i - 1].value).toBe(initialValue + i);
            }

        });
    test('Update value with +0 results in no change to the state instance or notification to ValidationManager',
        () => {
            let initialValue = 100;
            let setup = setupValueHost({}, initialValue);
            let testItem = setup.valueHost;
            expect(testItem.getValue()).toBe(initialValue);
            let fn = (stateToUpdate: IPublicifiedValueHostInstanceState): IPublicifiedValueHostInstanceState => {
                stateToUpdate.value = stateToUpdate.value + 0;  // not actually changing anything
                return stateToUpdate;
            };
            // try several times
            for (let i = 1; i <= 3; i++) {
                let originalState = testItem.exposeState;
                expect(() => testItem.updateInstanceState(fn, testItem)).not.toThrow();
                expect(testItem.getValue()).toBe(initialValue);
                expect(testItem.exposeState).toBe(originalState);   // same instance
            }
            let changes = setup.validationManager.getHostStateChanges();
            expect(changes.length).toBe(0);


        });
        test('Updater function is null throws',
        () => {
            let setup = setupValueHost({});
            let testItem = setup.valueHost;
            expect(() => testItem.updateInstanceState(null!, testItem)).toThrow(/updater/);
        });    
});

describe('setValue', () => {
    test('Value was changed. State changes.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValueHost({}, initialValue);
        let testItem = setup.valueHost;
        expect(() => testItem.setValue(finalValue)).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].name).toBe('Field1');
        expect(changes[0].value).toBe(finalValue);
        expect(changes[0].changeCounter).toBe(1);
    });
    test('Value was not changed. State did not change', () => {
        const initialValue = 100;
        const finalValue = initialValue;
        let setup = setupValueHost({}, initialValue);
        let testItem = setup.valueHost;
        expect(() => testItem.setValue(finalValue)).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(false);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);

    });
    test('Value was changed with option.Reset = true. State changes, but IsChanged is false.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValueHost({}, initialValue);
        let testItem = setup.valueHost;
        expect(() => testItem.setValue(finalValue, { reset: true })).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(false);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].name).toBe('Field1');
        expect(changes[0].value).toBe(finalValue);
        expect(changes[0].changeCounter).toBe(0);
    });
    test('Value was changed. OnValueChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let setup = setupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = [];
        setup.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        let testItem = setup.valueHost;
        expect(() => testItem.setValue(secondValue)).not.toThrow();
        expect(() => testItem.setValue(finalValue)).not.toThrow();

        expect(changedValues.length).toBe(2);
        expect(changedValues[0].newValue).toBe(secondValue);
        expect(changedValues[0].oldValue).toBe(initialValue);
        expect(changedValues[1].newValue).toBe(finalValue);
        expect(changedValues[1].oldValue).toBe(secondValue);        
    });
    test('Value was not changed. OnValueChanged is not called.', () => {
        const initialValue = 100;

        let setup = setupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = [];
        setup.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        let testItem = setup.valueHost;
        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(() => testItem.setValue(initialValue)).not.toThrow();

        expect(changedValues.length).toBe(0);
    
    });    
    test('Value was changed. OnValueChanged setup but not called because SkipValueChangedCallback is true.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let setup = setupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = [];
        setup.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        let testItem = setup.valueHost;
        expect(() => testItem.setValue(secondValue, { skipValueChangedCallback: true })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { skipValueChangedCallback: true })).not.toThrow();

        expect(changedValues.length).toBe(0);
    });    
    test('Value was changed. OnValueChanged setup and not called because SkipValueChangedCallback is false', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let setup = setupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = [];
        setup.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        let testItem = setup.valueHost;
        expect(() => testItem.setValue(secondValue, { skipValueChangedCallback: false })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { skipValueChangedCallback:false })).not.toThrow();

        expect(changedValues.length).toBe(2);
        expect(changedValues[0].newValue).toBe(secondValue);
        expect(changedValues[0].oldValue).toBe(initialValue);
        expect(changedValues[1].newValue).toBe(finalValue);
        expect(changedValues[1].oldValue).toBe(secondValue);        
    });

    test('Value was changed. OnValueHostInstanceStateChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let setup = setupValueHost({}, initialValue);
        let changedState: Array<ValueHostInstanceState> = [];
        setup.validationManager.onValueHostInstanceStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain);
        };

        let testItem = setup.valueHost;
        expect(() => testItem.setValue(secondValue)).not.toThrow();
        expect(() => testItem.setValue(finalValue)).not.toThrow();

        expect(changedState.length).toBe(2);
        expect(changedState[0].value).toBe(secondValue);
        expect(changedState[1].value).toBe(finalValue);     
    });    

    test('Value was not changed. OnValueHostInstanceStateChanged is not called.', () => {
        const initialValue = 100;

        let setup = setupValueHost({}, initialValue);
        let changedState: Array<ValueHostInstanceState> = [];
        setup.validationManager.onValueHostInstanceStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain);
        };

        let testItem = setup.valueHost;
        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(() => testItem.setValue(initialValue)).not.toThrow();

        expect(changedState.length).toBe(0);
    });       
    test('Log call when Level=Debug.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValueHost({}, initialValue);
        setup.services.loggerService.minLevel = LoggingLevel.Debug;
        let testItem = setup.valueHost;
        testItem.setValue(finalValue);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('setValue\\(200\\)', LoggingLevel.Debug, null, null)).toBeTruthy();
    });
    test('isEnabled=false will not change the value.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValueHost({}, initialValue);
        setup.services.loggerService.minLevel = LoggingLevel.Debug;
        let testItem = setup.valueHost;
        testItem.setEnabled(false);
        testItem.setValue(finalValue);
        expect(testItem.getValue()).toBe(initialValue);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('ValueHost "Field1" disabled.', LoggingLevel.Warn, null, null)).toBeTruthy();
        expect(logger.findMessage('overrideDisabled', LoggingLevel.Info, null, null)).toBeNull();
    });
    test('isEnabled=false will change the value when option.overrideDisabled=true.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValueHost({}, initialValue);
        setup.services.loggerService.minLevel = LoggingLevel.Debug;
        let testItem = setup.valueHost;
        testItem.setEnabled(false);
        testItem.setValue(finalValue, { overrideDisabled: true });
        expect(testItem.getValue()).toBe(finalValue);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('overrideDisabled', LoggingLevel.Info, null, null)).toBeTruthy();
        expect(logger.findMessage('ValueHost "Field1" disabled.', LoggingLevel.Warn, null, null)).toBeNull();
    });
});
describe('setValueToUndefined', () => {
    test('Value was changed. State changes.', () => {
        const initialValue = 100;
        const finalValue = undefined;
        let setup = setupValueHost({}, initialValue);
        let testItem = setup.valueHost;
        expect(() => testItem.setValueToUndefined()).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].name).toBe('Field1');
        expect(changes[0].value).toBe(finalValue);
    });
    test('Value was not changed. State did not change', () => {
        const initialValue = undefined;
        const finalValue = initialValue;
        let setup = setupValueHost({}, initialValue);
        let testItem = setup.valueHost;
        expect(() => testItem.setValueToUndefined()).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(false);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);

    });    
});

describe('ValueHostBase.saveIntoStore and getFromStore', () => {
    test('Save 10 and get it back.', () => {

        let setup = setupValueHost({});
        let testItem = setup.valueHost;
        expect(() => testItem.saveIntoInstanceState('KEY', 10)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].name).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items!['KEY']).toBe(10);
        expect(testItem.getFromInstanceState('KEY')).toBe(10);        
    });
    test('Get without prior Store returns undefined.', () => {

        let setup = setupValueHost({});
        let testItem = setup.valueHost;

        expect(testItem.getFromInstanceState('KEY')).toBeUndefined();       
    });
    test('Save 10 and save undefined to remove it.', () => {

        let setup = setupValueHost({});
        let testItem = setup.valueHost;
        expect(() => testItem.saveIntoInstanceState('KEY', 10)).not.toThrow();
        expect(() => testItem.saveIntoInstanceState('KEY', undefined)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        expect(changes[0].name).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items!['KEY']).toBe(10);
        expect(changes[1].name).toBe('Field1');
        expect(changes[1].items).not.toBeNull();
        expect(changes[1].items!['KEY']).toBeUndefined();        
        expect(testItem.getFromInstanceState('KEY')).toBeUndefined;        
    });
    test('Save two different keys and retrieve both.', () => {

        let setup = setupValueHost({});
        let testItem = setup.valueHost;
        expect(() => testItem.saveIntoInstanceState('KEY1', 10)).not.toThrow();
        expect(() => testItem.saveIntoInstanceState('KEY2', 20)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        expect(changes[0].name).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items!['KEY1']).toBe(10);
        expect(changes[1].name).toBe('Field1');
        expect(changes[1].items).not.toBeNull();
        expect(changes[1].items!['KEY2']).toBe(20);  
        expect(testItem.getFromInstanceState('KEY1')).toBe(10);        
        expect(testItem.getFromInstanceState('KEY2')).toBe(20);
    });    
    test('Save two different keys, delete the second, and retrieve both.', () => {

        let setup = setupValueHost({});
        let testItem = setup.valueHost;
        expect(() => testItem.saveIntoInstanceState('KEY1', 10)).not.toThrow();
        expect(() => testItem.saveIntoInstanceState('KEY2', 20)).not.toThrow();
        expect(() => testItem.saveIntoInstanceState('KEY2', undefined)).not.toThrow();
        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(3);
        expect(changes[0].name).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items!['KEY1']).toBe(10);
        expect(changes[1].name).toBe('Field1');
        expect(changes[1].items).not.toBeNull();
        expect(changes[1].items!['KEY2']).toBe(20);  
        expect(changes[2].name).toBe('Field1');
        expect(changes[2].items).not.toBeNull();
        expect(changes[2].items!['KEY2']).toBeUndefined();
        expect(testItem.getFromInstanceState('KEY1')).toBe(10);        
        expect(testItem.getFromInstanceState('KEY2')).toBeUndefined();
    });        
});

describe('toIValueHostCallbacks function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValueHostCallbacks = {
            onValueChanged: null,
            onValueHostInstanceStateChanged: null
        };
        expect(toIValueHostCallbacks(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem: IValueHostCallbacks = {

        };
        expect(toIValueHostCallbacks(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValueHostCallbacks(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValueHostCallbacks(100)).toBeNull();
    });        
});
describe('getDataTypeLabel', () => {
    // Planned data type is "Integer". If it does not have datatype assigned, a datatypeIdentifierService will
    // resolve a number to "Number". 
    function testGetDataTypeLabel(hasDataType: boolean, hasValue: boolean, hasLocalization: boolean, expectedDataTypeLabel: string): void
    {
        let services = createValidationServicesForTesting();
        let factory = new ValueHostFactory();
        factory.register(new PublicifiedValueHostBaseGenerator());
        services.valueHostFactory = factory;
        
        let tls = new TextLocalizerService();
        services.textLocalizerService = tls; // ensures its inited as empty
        if (hasLocalization) {
            services.cultureService.activeCultureId = 'en';
            tls.registerDataTypeLabel(LookupKey.Number, {
                'en': 'Localized Number'
            });            
            tls.registerDataTypeLabel(LookupKey.Integer, {
                'en': 'Localized Integer'
            });
        }
        // note: dataTypeIdentifierService is used when value!=undefined. It is preconfigured to detect typeof value == 'number'
        services.dataTypeIdentifierService = new DataTypeIdentifierService();
        let vhConfig: ValueHostConfig = {
            name: 'Field1',
            valueHostType: testValueHostType
        }
        if (hasDataType)
            vhConfig.dataType = LookupKey.Integer;
        if (hasValue)
            vhConfig.initialValue = 10;
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [vhConfig]
        });
        let vh = vm.getValueHost('Field1') as PublicifiedValueHostBase;
        expect(vh.getDataTypeLabel()).toBe(expectedDataTypeLabel);

    }
    test('Without localization, no datatype assigned nor value to identify returns empty string', () => {
        testGetDataTypeLabel(false, false, false, '');
    });
    test('With localization setup, no datatype assigned nor value to identify returns empty string', () => {
        testGetDataTypeLabel(false, false, true, '');
    });
    test('Without localization, no datatype assigned but has number to identify returns "Number" from the lookup key', () => {
        testGetDataTypeLabel(false, true, false, LookupKey.Number);
    });
    test('With matching localization, no datatype assigned but has number to identify returns the localized name for number.', () => {
        testGetDataTypeLabel(false, true, true, 'Localized Number');
    });
    test('Without localization, datatype assigned returns "Integer" from the lookup key', () => {
        testGetDataTypeLabel(true, false, false, LookupKey.Integer);
        testGetDataTypeLabel(true, true, false, LookupKey.Integer); // value does not matter
    });
    test('With matching localization, datatype assigned returns the localized name for integer.', () => {
        testGetDataTypeLabel(true, false, true, 'Localized Integer');
        testGetDataTypeLabel(true, true, true, 'Localized Integer'); // value does not matter
    });    
});

describe('dispose', () => {
    test('dispose kills many references including state and config', () => {
        let setup = setupValueHost({
            name: 'Field1',
            dataType: LookupKey.Number
        });
        setup.valueHost.dispose();
        expect(setup.valueHost.exposeConfig).toBeUndefined();
        expect(setup.valueHost.exposeState).toBeUndefined();
        expect(() => setup.valueHost.getValue()).toThrow(TypeError);  // value is from config which is undefined
        expect(()=> setup.valueHost.exposeServices).toThrow(TypeError);

    });   
    
    test('dispose with ValueHostConfig having its own dispose kills what the config.dispose expects', () => {
        interface X extends ValueHostConfig, IDisposable
        {
            x: {}
        }

        let setup = setupValueHost({
            name: 'Field1',
            dataType: LookupKey.Number
        });

        let valConfig = setup.config as X;
        valConfig.x = {};
        valConfig.dispose = () => { (valConfig.x as any) = undefined };
        setup.valueHost.dispose();

        expect(valConfig.x).toBeUndefined();

    });               

});
describe('isEnabled and related enabled', () => {
    function setupTestItem(initialEnabled: boolean | undefined, stateEnabled: boolean | undefined,
        stateChangeCallback?: ValueHostInstanceStateChangedHandler
    ): {
        vh: PublicifiedValueHostBase,
        logger: CapturingLogger
    } {
        let services = new MockValidationServices(false, false);
        services.loggerService.minLevel = LoggingLevel.Debug;
        let vm = new MockValidationManager(services);
        if (stateChangeCallback)
            vm.onValueHostInstanceStateChanged = stateChangeCallback;
        let vhConfig: ValueHostConfig = {
            name: 'Field1',
            valueHostType: 'TestValidatableValueHost'
        };
        if (initialEnabled !== undefined)
            vhConfig.initialEnabled = initialEnabled;

        let state: IPublicifiedValueHostInstanceState = {
            name: 'Field1',
            counter: 0,
            value: undefined
        };
        if (stateEnabled !== undefined)
            state.enabled = stateEnabled;

        return {
            vh: new PublicifiedValueHostBase(vm, vhConfig, state),
            logger: services.loggerService as CapturingLogger
        };
    }

    describe('constructor', () => {
        function testConstructor(initialEnabled: boolean | undefined, stateEnabled: boolean | undefined,
            expectedIsEnabled: boolean, expectedStateEnabled: boolean | undefined): void {
            let setup = setupTestItem(initialEnabled, stateEnabled);

            expect(setup.vh.isEnabled()).toBe(expectedIsEnabled);
            expect(setup.vh.exposeState.enabled).toBe(expectedStateEnabled);
        }
        test('constructor with config.initialEnabled=true, state.enabled=undefined, results in isEnabled=true, state.enabled=undefined', () => {
            testConstructor(true, undefined, true, undefined);
        });
        test('constructor with config.initialEnabled=false, state.enabled=undefined, results in isEnabled=false, state.enabled=undefined', () => {
            testConstructor(false, undefined, false, undefined);
        });
        test('constructor with config.initialEnabled=true, state.enabled=false, results in isEnabled=false, state.enabled=false', () => {
            testConstructor(true, false, false, false);
        });
        test('constructor with config.initialEnabled=true, state.enabled=true, results in isEnabled=true, state.enabled=true', () => {
            testConstructor(true, true, true, true);
        });
        test('constructor with config.initialEnabled=false, state.enabled=true, results in isEnabled=true, state.enabled=true', () => {
            testConstructor(false, true, true, true);
        });
        test('constructor with config.initialEnabled=undefined, state.enabled=true, results in isEnabled=true, state.enabled=true', () => {
            testConstructor(undefined, true, true, true);
        });
        test('constructor with config.initialEnabled=undefined, state.enabled=false, results in isEnabled=false, state.enabled=false', () => {
            testConstructor(undefined, false, false, false);
        });
        test('constructor with config.initialEnabled=undefined, state.enabled=undefined, results in isEnabled=true, state.enabled=undefined', () => {
            testConstructor(undefined, undefined, true, undefined);
        });
    });
    describe('setEnabled and isEnabled', () => {
        function testSetEnabled(initialEnabled: boolean | undefined, stateEnabled: boolean | undefined,
            newEnabled: boolean, expectedIsEnabled: boolean, expectedStateEnabled: boolean | undefined,
            expectStateChange: boolean): void {
            let stateChanged = false;
            let setup = setupTestItem(initialEnabled, stateEnabled,
                (vh, state) => {
                    stateChanged = true;    
                }
            );

            setup.vh.setEnabled(newEnabled);
            expect(setup.vh.isEnabled()).toBe(expectedIsEnabled);
            expect(setup.vh.exposeState.enabled).toBe(expectedStateEnabled);
            expect(stateChanged).toBe(expectStateChange);
            expect(setup.logger.findMessage('setEnabled', LoggingLevel.Debug, null, null)).toBeTruthy();
        }
        test('setEnabled(true) results in isEnabled=true, state.enabled=true', () => {
            testSetEnabled(undefined, undefined, true, true, true, true);
        });
        test('setEnabled(false) results in isEnabled=false, state.enabled=false,', () => {
            testSetEnabled(undefined, undefined, false, false, false, true);
        });
        test('With initialEnabled=false, setEnabled(true) results in isEnabled=true, state.enabled=true', () => {
            testSetEnabled(false, undefined, true, true, true, true);
        });
        test('With initialEnabled=false, setEnabled(false) results in isEnabled=false, state.enabled=false', () => {
            testSetEnabled(false, undefined, false, false, false, true);
        });
        test('With initial state.enabled=false, setEnabled(true) results in isEnabled=true, state.enabled=true', () => {
            testSetEnabled(undefined, false, true, true, true, true);
        });
        test('With initial state.enabled=false, setEnabled(false) results in isEnabled=false, state.enabled=false and no state change', () => {
            testSetEnabled(undefined, false, false, false, false, false);
        });
    });


});