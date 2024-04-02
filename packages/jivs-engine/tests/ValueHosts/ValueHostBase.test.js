import { toIValueHostCallbacks } from "../../src/Interfaces/ValueHost";
import { ValueHostBase } from "../../src/ValueHosts/ValueHostBase";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { MockValidationServices, MockValidationManager } from "../Mocks";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
/**
 * Subclass of ValueHostBase to focus testing on ValueHostBase members
 * including exposing protected members
 */
class PublicifiedValueHostBase extends ValueHostBase {
    constructor(valueHostsManager, descriptor, state) {
        super(valueHostsManager, descriptor, state);
    }
    ExposeServices() {
        return this.services;
    }
    ExposeDescriptor() {
        return this.descriptor;
    }
    ExposeState() {
        return this.state;
    }
}
/**
 * This implementation of IValueHostGenerator is actually tested in ValueHostFactory.tests.ts
 */
class PublicifiedValueHostBaseGenerator {
    canCreate(descriptor) {
        return descriptor.type === 'PublicifyValueHostBase';
    }
    create(valueHostsManager, descriptor, state) {
        return new PublicifiedValueHostBase(valueHostsManager, descriptor, state);
    }
    cleanupState(state, descriptor) {
        state.Counter = 0;
    }
    createState(descriptor) {
        let state = {
            id: descriptor.id,
            value: descriptor.initialValue,
            Counter: 0
        };
        return state;
    }
}
/**
 * Returns an ValueHost (PublicifiedValueHost subclass) ready for testing.
 * @param descriptor - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * Id: 'Field1',
 * Label: 'Label1',
 * Type: 'PublicifyValueHostBase',
 * DataType: LookupKey.String,
 * InitialValue: 'DATA'
 * @returns An object with all of the parts that were setup including
 * ValidationManager, Services, ValueHosts, the complete Descriptor,
 * and the state.
 */
function setupValueHost(descriptor, initialValue) {
    let services = new MockValidationServices(false, false);
    let factory = new ValueHostFactory();
    factory.register(new PublicifiedValueHostBaseGenerator());
    services.valueHostFactory = factory;
    let vm = new MockValidationManager(services);
    let defaultDescriptor = {
        id: 'Field1',
        label: 'Label1',
        type: 'PublicifyValueHostBase',
        dataType: LookupKey.String,
        initialValue: 'DATA'
    };
    let updatedDescriptor = (!descriptor) ?
        defaultDescriptor : Object.assign(Object.assign({}, defaultDescriptor), descriptor);
    let state = {
        id: 'Field1',
        value: initialValue,
        Counter: 0
    };
    let vh = new PublicifiedValueHostBase(vm, updatedDescriptor, state);
    return {
        services: services,
        validationManager: vm,
        descriptor: updatedDescriptor,
        state: state,
        valueHost: vh
    };
}
// constructor(validationManager: IValidationManager, descriptor: TDescriptor, state: TState)
describe('constructor and resulting property values', () => {
    test('constructor with valid parameters created and sets up Services, Descriptor, and State', () => {
        let config = setupValueHost({});
        let testItem = config.valueHost;
        expect(testItem.ExposeServices()).toBe(config.services);
        expect(testItem.ExposeDescriptor()).toBe(config.descriptor);
        expect(testItem.ExposeState().id).toBe('Field1');
        expect(testItem.valueHostsManager).toBe(config.validationManager);
        expect(testItem.getId()).toBe('Field1');
        expect(testItem.getLabel()).toBe('Label1');
        expect(testItem.getDataType()).toBe(LookupKey.String);
        expect(testItem.getValue()).toBeUndefined();
        expect(testItem.isChanged).toBe(false);
    });
    test('constructor with Descriptor.DataType undefined results in GetDataType = null', () => {
        let config = setupValueHost({
            dataType: undefined
        });
        let testItem = config.valueHost;
        expect(testItem.getDataType()).toBeNull();
    });
    test('constructor with null in each parameter throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor = {
            id: 'Field1',
            label: 'Label1',
            type: 'PublicifyValueHostBase',
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };
        let state = {
            id: 'Field1',
            value: undefined,
            Counter: 0
        };
        let testItem = null;
        expect(() => testItem = new PublicifiedValueHostBase(null, descriptor, state)).toThrow(/valueHostsManager/);
        expect(() => testItem = new PublicifiedValueHostBase(vm, null, state)).toThrow(/descriptor/);
        expect(() => testItem = new PublicifiedValueHostBase(vm, descriptor, null)).toThrow(/state/);
    });
});
describe('updateState', () => {
    test('Update value with +1 results in new instance of State and report to ValidationManager', () => {
        let initialValue = 100;
        let config = setupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(testItem.getValue()).toBe(initialValue);
        let fn = (stateToUpdate) => {
            stateToUpdate.value = stateToUpdate.value + 1;
            return stateToUpdate;
        };
        // try several times
        for (let i = 1; i <= 3; i++) {
            let originalState = testItem.ExposeState();
            expect(() => testItem.updateState(fn, testItem)).not.toThrow();
            expect(testItem.getValue()).toBe(initialValue + i);
            expect(testItem.ExposeState()).not.toBe(originalState); // different instances
        }
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(3);
        for (let i = 1; i <= 3; i++) {
            expect(changes[i - 1].id).toBe('Field1');
            expect(changes[i - 1].value).toBe(initialValue + i);
        }
    });
    test('Update value with +0 results in no change to the state instance or notification to ValidationManager', () => {
        let initialValue = 100;
        let config = setupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(testItem.getValue()).toBe(initialValue);
        let fn = (stateToUpdate) => {
            stateToUpdate.value = stateToUpdate.value + 0; // not actually changing anything
            return stateToUpdate;
        };
        // try several times
        for (let i = 1; i <= 3; i++) {
            let originalState = testItem.ExposeState();
            expect(() => testItem.updateState(fn, testItem)).not.toThrow();
            expect(testItem.getValue()).toBe(initialValue);
            expect(testItem.ExposeState()).toBe(originalState); // same instance
        }
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
    test('Updater function is null throws', () => {
        let config = setupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.updateState(null, testItem)).toThrow(/updater/);
    });
});
describe('setValue', () => {
    test('Value was changed. State changes.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let config = setupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.setValue(finalValue)).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(true);
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].id).toBe('Field1');
        expect(changes[0].value).toBe(finalValue);
        expect(changes[0].changeCounter).toBe(1);
    });
    test('Value was not changed. State did not change', () => {
        const initialValue = 100;
        const finalValue = initialValue;
        let config = setupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.setValue(finalValue)).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(false);
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
    test('Value was changed with option.Reset = true. State changes, but IsChanged is false.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let config = setupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.setValue(finalValue, { reset: true })).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(false);
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].id).toBe('Field1');
        expect(changes[0].value).toBe(finalValue);
        expect(changes[0].changeCounter).toBe(0);
    });
    test('Value was changed. OnValueChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;
        let config = setupValueHost({}, initialValue);
        let changedValues = [];
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };
        let testItem = config.valueHost;
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
        let config = setupValueHost({}, initialValue);
        let changedValues = [];
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };
        let testItem = config.valueHost;
        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(changedValues.length).toBe(0);
    });
    test('Value was changed. OnValueChanged setup but not called because SkipValueChangedCallback is true.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;
        let config = setupValueHost({}, initialValue);
        let changedValues = [];
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };
        let testItem = config.valueHost;
        expect(() => testItem.setValue(secondValue, { skipValueChangedCallback: true })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { skipValueChangedCallback: true })).not.toThrow();
        expect(changedValues.length).toBe(0);
    });
    test('Value was changed. OnValueChanged setup and not called because SkipValueChangedCallback is false', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;
        let config = setupValueHost({}, initialValue);
        let changedValues = [];
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };
        let testItem = config.valueHost;
        expect(() => testItem.setValue(secondValue, { skipValueChangedCallback: false })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { skipValueChangedCallback: false })).not.toThrow();
        expect(changedValues.length).toBe(2);
        expect(changedValues[0].newValue).toBe(secondValue);
        expect(changedValues[0].oldValue).toBe(initialValue);
        expect(changedValues[1].newValue).toBe(finalValue);
        expect(changedValues[1].oldValue).toBe(secondValue);
    });
    test('Value was changed. OnValueHostStateChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;
        let config = setupValueHost({}, initialValue);
        let changedState = [];
        config.validationManager.onValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain);
        };
        let testItem = config.valueHost;
        expect(() => testItem.setValue(secondValue)).not.toThrow();
        expect(() => testItem.setValue(finalValue)).not.toThrow();
        expect(changedState.length).toBe(2);
        expect(changedState[0].value).toBe(secondValue);
        expect(changedState[1].value).toBe(finalValue);
    });
    test('Value was not changed. OnValueHostStateChanged is not called.', () => {
        const initialValue = 100;
        let config = setupValueHost({}, initialValue);
        let changedState = [];
        config.validationManager.onValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain);
        };
        let testItem = config.valueHost;
        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(changedState.length).toBe(0);
    });
});
describe('setValueToUndefined', () => {
    test('Value was changed. State changes.', () => {
        const initialValue = 100;
        const finalValue = undefined;
        let config = setupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.setValueToUndefined()).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(true);
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].id).toBe('Field1');
        expect(changes[0].value).toBe(finalValue);
    });
    test('Value was not changed. State did not change', () => {
        const initialValue = undefined;
        const finalValue = initialValue;
        let config = setupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.setValueToUndefined()).not.toThrow();
        expect(testItem.getValue()).toBe(finalValue);
        expect(testItem.isChanged).toBe(false);
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
});
describe('ValueHostBase.setLabel', () => {
    test('Override label without intl', () => {
        let config = setupValueHost({
            label: 'Label-original'
        });
        let testItem = config.valueHost;
        expect(() => testItem.setLabel('Label-replaced')).not.toThrow();
        expect(testItem.getLabel()).toBe('Label-replaced');
    });
    test('Override label and labell10n', () => {
        let config = setupValueHost({
            label: 'Label-original',
            labell10n: 'Label-original-key'
        });
        let tls = config.services.textLocalizerService;
        tls.register('Label-original-key', {
            '*': '*-Label-original'
        });
        tls.register('Label-replaced-key', {
            '*': '*-Label-replaced'
        });
        let testItem = config.valueHost;
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
        let config = setupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.saveIntoState('KEY', 10)).not.toThrow();
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].id).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items['KEY']).toBe(10);
        expect(testItem.getFromState('KEY')).toBe(10);
    });
    test('Get without prior Store returns undefined.', () => {
        let config = setupValueHost({});
        let testItem = config.valueHost;
        expect(testItem.getFromState('KEY')).toBeUndefined();
    });
    test('Save 10 and save undefined to remove it.', () => {
        let config = setupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.saveIntoState('KEY', 10)).not.toThrow();
        expect(() => testItem.saveIntoState('KEY', undefined)).not.toThrow();
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        expect(changes[0].id).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items['KEY']).toBe(10);
        expect(changes[1].id).toBe('Field1');
        expect(changes[1].items).not.toBeNull();
        expect(changes[1].items['KEY']).toBeUndefined();
        expect(testItem.getFromState('KEY')).toBeUndefined;
    });
    test('Save two different keys and retrieve both.', () => {
        let config = setupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.saveIntoState('KEY1', 10)).not.toThrow();
        expect(() => testItem.saveIntoState('KEY2', 20)).not.toThrow();
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        expect(changes[0].id).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items['KEY1']).toBe(10);
        expect(changes[1].id).toBe('Field1');
        expect(changes[1].items).not.toBeNull();
        expect(changes[1].items['KEY2']).toBe(20);
        expect(testItem.getFromState('KEY1')).toBe(10);
        expect(testItem.getFromState('KEY2')).toBe(20);
    });
    test('Save two different keys, delete the second, and retrieve both.', () => {
        let config = setupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.saveIntoState('KEY1', 10)).not.toThrow();
        expect(() => testItem.saveIntoState('KEY2', 20)).not.toThrow();
        expect(() => testItem.saveIntoState('KEY2', undefined)).not.toThrow();
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(3);
        expect(changes[0].id).toBe('Field1');
        expect(changes[0].items).not.toBeNull();
        expect(changes[0].items['KEY1']).toBe(10);
        expect(changes[1].id).toBe('Field1');
        expect(changes[1].items).not.toBeNull();
        expect(changes[1].items['KEY2']).toBe(20);
        expect(changes[2].id).toBe('Field1');
        expect(changes[2].items).not.toBeNull();
        expect(changes[2].items['KEY2']).toBeUndefined();
        expect(testItem.getFromState('KEY1')).toBe(10);
        expect(testItem.getFromState('KEY2')).toBeUndefined();
    });
});
describe('toIValueHostCallbacks function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem = {
            onValueChanged: null,
            onValueHostStateChanged: null
        };
        expect(toIValueHostCallbacks(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValueHostCallbacks(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIValueHostCallbacks(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIValueHostCallbacks(100)).toBeNull();
    });
});
//# sourceMappingURL=ValueHostBase.test.js.map