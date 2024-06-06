import {
    type ValueHostInstanceState, type IValueHost, ValueHostConfig, IValueHostCallbacks, toIValueHostCallbacks
} from "../../src/Interfaces/ValueHost";
import { ValueHostBase } from "../../src/ValueHosts/ValueHostBase";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";
import { IValueHostsManager, IValueHostsServices } from "../../src/Interfaces/ValueHostsManager";
import { IValueHostGenerator } from "../../src/Interfaces/ValueHostFactory";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import { IDisposable } from "../../src/Interfaces/General_Purpose";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { ValidationManager } from "../../src/Validation/ValidationManager";


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

        expect(testItem!.exposeServices).toBe(services);
        expect(testItem!.exposeConfig).toBe(vhConfig);
        expect(testItem!.exposeState.name).toBe('Field1');
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
describe('ValueHostBase.setLabel', () => {
    test('Override label without intl', () => {
        let setup = setupValueHost({
            label: 'Label-original'
        });
        let testItem = setup.valueHost;
        expect(() => testItem.setLabel('Label-replaced')).not.toThrow();
        expect(testItem.getLabel()).toBe('Label-replaced');
    });
    test('Override label and labell10n', () => {
        let setup = setupValueHost({
            label: 'Label-original',
            labell10n: 'Label-original-key'
        });
        let tls = setup.services.textLocalizerService as TextLocalizerService;
        tls.register('Label-original-key', {
            '*': '*-Label-original'
        });
        tls.register('Label-replaced-key', {
            '*': '*-Label-replaced'
        });        
        let testItem = setup.valueHost;

        expect(() => testItem.setLabel('Label-replaced', 'Label-replaced-key')).not.toThrow();

        expect(testItem.getLabel()).toBe('*-Label-replaced');

        // then remove the overriden key only and see impact
        testItem.setLabel(null, undefined); // label parameter no change, labell10n parameter delete current state
        expect(testItem.getLabel()).toBe('*-Label-original');

        // remove the overridden label and see impact
        testItem.setLabel(undefined, undefined); // label parameter delete current state, labell10n parameter delete current state
        expect(testItem.getLabel()).toBe('*-Label-original');

        // last case restores both overrides then demonstrates that setLabel(undefined, null) only impacts overridden label
        expect(() => testItem.setLabel('Label-replaced-secondtry', 'Label-replaced-key')).not.toThrow();
        testItem.setLabel(undefined, null); // label parameter delete current state, labell10n parameter no change
        expect(testItem.getLabel()).toBe('*-Label-replaced'); 
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