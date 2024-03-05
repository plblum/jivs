import type { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { valGlobals } from "../../src/Services/ValidationGlobals";
import {
    type IValueHostState, type IValueHost, IValueHostDescriptor
} from "../../src/Interfaces/ValueHost";
import { ValueHostBase } from "../../src/ValueHosts/ValueHostBase";
import { IValueHostGenerator, ValueHostFactory, RegisterDefaultValueHostGenerators } from "../../src/ValueHosts/ValueHostFactory";
import { MockValidationServices, MockValidationManager } from "../Mocks";
import { StringLookupKey } from "../../src/DataTypes/LookupKeys";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostResolver";


interface IPublicifiedValueHostState extends IValueHostState
{
    Counter: number;    // incremented each time the state is cleaned    
}
/**
 * Subclass of ValueHostBase to focus testing on ValueHostBase members
 * including exposing protected members
 */
class PublicifiedValueHostBase extends ValueHostBase<IValueHostDescriptor, IPublicifiedValueHostState>
{
    constructor(valueHostsManager : IValueHostsManager, descriptor: IValueHostDescriptor, state: IPublicifiedValueHostState) {
        super(valueHostsManager, descriptor, state);
    }
    public ExposeServices(): IValidationServices {
        return this.Services;
    }

    public ExposeDescriptor(): IValueHostDescriptor {
        return this.Descriptor;
    }

    public ExposeState(): IPublicifiedValueHostState {
        return this.State;
    }
}
/**
 * This implementation of IValueHostGenerator is actually tested in ValueHostFactory.tests.ts
 */
class PublicifiedValueHostBaseGenerator implements IValueHostGenerator {
    public CanCreate(descriptor: IValueHostDescriptor): boolean {
        return descriptor.Type === 'PublicifyValueHostBase';
    }
    public Create(valueHostsManager : IValueHostsManager, descriptor: IValueHostDescriptor, state: IPublicifiedValueHostState): IValueHost {
        return new PublicifiedValueHostBase(valueHostsManager, descriptor, state);
    }
    public CleanupState(state: IPublicifiedValueHostState, descriptor: IValueHostDescriptor): void {
        state.Counter = 0;
    }
    public CreateState(descriptor: IValueHostDescriptor): IPublicifiedValueHostState {
        let state: IPublicifiedValueHostState = {
            Id: descriptor.Id,
            Value: descriptor.InitialValue,
            Counter: 0
        };
        return state;
    }

}

beforeEach(() => {
    let factory = new ValueHostFactory();
    factory.Register(new PublicifiedValueHostBaseGenerator());
    valGlobals.SetValueHostFactory(factory);
});
afterEach(() => {
    let factory = new ValueHostFactory();
    RegisterDefaultValueHostGenerators(factory);
    valGlobals.SetValueHostFactory(factory);
});
/**
 * Returns an ValueHost (PublicifiedValueHost subclass) ready for testing.
 * @param descriptor - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * Id: 'Field1',
 * Label: 'Label1',
 * Type: 'PublicifyValueHostBase',
 * DataType: StringLookupKey,
 * InitialValue: 'DATA'
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, ValueHosts, the complete Descriptor,
 * and the state.
 */
function SetupValueHost(descriptor?: Partial<IValueHostDescriptor>, initialValue?: any): {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    descriptor: IValueHostDescriptor,
    state: IValueHostState,
    valueHost: PublicifiedValueHostBase
} {
    let services = new MockValidationServices(false, false);
    let vm = new MockValidationManager(services);

    let defaultDescriptor: IValueHostDescriptor = {
        Id: 'Field1',
        Label: 'Label1',
        Type: 'PublicifyValueHostBase',
        DataType: StringLookupKey,
        InitialValue: 'DATA'
    };
    let updatedDescriptor: IValueHostDescriptor = (!descriptor) ?
        defaultDescriptor :
        { ...defaultDescriptor, ...descriptor };
    let state: IPublicifiedValueHostState = {
        Id: 'Field1',
        Value: initialValue,
        Counter: 0
    };
    let vh = new PublicifiedValueHostBase(vm,
        updatedDescriptor, state);
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
        let config = SetupValueHost({});
        let testItem = config.valueHost;
        expect(testItem.ExposeServices()).toBe(config.services);
        expect(testItem.ExposeDescriptor()).toBe(config.descriptor);
        expect(testItem.ExposeState().Id).toBe('Field1');
        expect(testItem.ValueHostsManager).toBe(config.validationManager);

        expect(testItem.GetId()).toBe('Field1');
        expect(testItem.GetLabel()).toBe('Label1');
        expect(testItem.GetDataType()).toBe(StringLookupKey);
        expect(testItem.GetValue()).toBeUndefined();
        expect(testItem.IsChanged).toBe(false);
    });

    test('constructor with Descriptor.DataType undefined results in GetDataType = null', () => {
        let config = SetupValueHost({
            DataType: undefined
        });
        let testItem = config.valueHost;
        expect(testItem.GetDataType()).toBeNull();
    });

    test('constructor with null in each parameter throws', () => {

        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);        
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Label: 'Label1',
            Type: 'PublicifyValueHostBase',
            DataType: StringLookupKey,
            InitialValue: 'DATA'
        };
        let state: IPublicifiedValueHostState = {
            Id: 'Field1',
            Value: undefined,
            Counter: 0
        };
        let testItem: PublicifiedValueHostBase | null = null;
        expect(() => testItem = new PublicifiedValueHostBase(null!,
            descriptor, state)).toThrow(/valueHostsManager/);
        expect(() => testItem = new PublicifiedValueHostBase(vm,
            null!, state)).toThrow(/descriptor/);
        expect(() => testItem = new PublicifiedValueHostBase(vm,
            descriptor, null!)).toThrow(/state/);
    });
});

describe('UpdateState', () => {
    test('Update value with +1 results in new instance of State and report to ValidationManager',
        () => {
            let initialValue = 100;
            let config = SetupValueHost({}, initialValue);
            let testItem = config.valueHost;
            expect(testItem.GetValue()).toBe(initialValue);
            let fn = (stateToUpdate: IPublicifiedValueHostState): IPublicifiedValueHostState => {
                stateToUpdate.Value = stateToUpdate.Value + 1;
                return stateToUpdate;
            };
            // try several times
            for (let i = 1; i <= 3; i++) {
                let originalState = testItem.ExposeState();
                expect(() => testItem.UpdateState(fn, testItem)).not.toThrow();
                expect(testItem.GetValue()).toBe(initialValue + i);
                expect(testItem.ExposeState()).not.toBe(originalState);   // different instances
            }
            let changes = config.validationManager.GetHostStateChanges();
            expect(changes.length).toBe(3);
            for (let i = 1; i <= 3; i++) {

                expect(changes[i - 1].Id).toBe('Field1');
                expect(changes[i - 1].Value).toBe(initialValue + i);
            }

        });
    test('Update value with +0 results in no change to the state instance or notification to ValidationManager',
        () => {
            let initialValue = 100;
            let config = SetupValueHost({}, initialValue);
            let testItem = config.valueHost;
            expect(testItem.GetValue()).toBe(initialValue);
            let fn = (stateToUpdate: IPublicifiedValueHostState): IPublicifiedValueHostState => {
                stateToUpdate.Value = stateToUpdate.Value + 0;  // not actually changing anything
                return stateToUpdate;
            };
            // try several times
            for (let i = 1; i <= 3; i++) {
                let originalState = testItem.ExposeState();
                expect(() => testItem.UpdateState(fn, testItem)).not.toThrow();
                expect(testItem.GetValue()).toBe(initialValue);
                expect(testItem.ExposeState()).toBe(originalState);   // same instance
            }
            let changes = config.validationManager.GetHostStateChanges();
            expect(changes.length).toBe(0);


        });
        test('Updater function is null throws',
        () => {
            let config = SetupValueHost({});
            let testItem = config.valueHost;
            expect(() => testItem.UpdateState(null!, testItem)).toThrow(/updater/);
        });    
});

describe('SetValue', () => {
    test('Value was changed. State changes.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let config = SetupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.SetValue(finalValue)).not.toThrow();
        expect(testItem.GetValue()).toBe(finalValue);
        expect(testItem.IsChanged).toBe(true);

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].Id).toBe('Field1');
        expect(changes[0].Value).toBe(finalValue);
        expect(changes[0].ChangeCounter).toBe(1);
    });
    test('Value was not changed. State did not change', () => {
        const initialValue = 100;
        const finalValue = initialValue;
        let config = SetupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.SetValue(finalValue)).not.toThrow();
        expect(testItem.GetValue()).toBe(finalValue);
        expect(testItem.IsChanged).toBe(false);

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(0);

    });
    test('Value was changed with option.Reset = true. State changes, but IsChanged is false.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let config = SetupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.SetValue(finalValue, { Reset: true })).not.toThrow();
        expect(testItem.GetValue()).toBe(finalValue);
        expect(testItem.IsChanged).toBe(false);

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].Id).toBe('Field1');
        expect(changes[0].Value).toBe(finalValue);
        expect(changes[0].ChangeCounter).toBe(0);
    });
    test('Value was changed. OnValueChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = SetupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = []
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.GetValue(),
                oldValue: oldValue
            })
        };

        let testItem = config.valueHost;
        expect(() => testItem.SetValue(secondValue)).not.toThrow();
        expect(() => testItem.SetValue(finalValue)).not.toThrow();

        expect(changedValues.length).toBe(2);
        expect(changedValues[0].newValue).toBe(secondValue);
        expect(changedValues[0].oldValue).toBe(initialValue);
        expect(changedValues[1].newValue).toBe(finalValue);
        expect(changedValues[1].oldValue).toBe(secondValue);        
    });
    test('Value was not changed. OnValueChanged is not called.', () => {
        const initialValue = 100;

        let config = SetupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = []
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.GetValue(),
                oldValue: oldValue
            })
        };

        let testItem = config.valueHost;
        expect(() => testItem.SetValue(initialValue)).not.toThrow();
        expect(() => testItem.SetValue(initialValue)).not.toThrow();

        expect(changedValues.length).toBe(0);
    
    });    
    test('Value was changed. OnValueChanged setup but not called because SkipValueChangedCallback is true.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = SetupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = []
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.GetValue(),
                oldValue: oldValue
            })
        };

        let testItem = config.valueHost;
        expect(() => testItem.SetValue(secondValue, { SkipValueChangedCallback: true })).not.toThrow();
        expect(() => testItem.SetValue(finalValue, { SkipValueChangedCallback: true })).not.toThrow();

        expect(changedValues.length).toBe(0);
    });    
    test('Value was changed. OnValueChanged setup and not called because SkipValueChangedCallback is false', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = SetupValueHost({}, initialValue);
        let changedValues: Array<{newValue: any, oldValue: any}> = []
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.GetValue(),
                oldValue: oldValue
            })
        };

        let testItem = config.valueHost;
        expect(() => testItem.SetValue(secondValue, { SkipValueChangedCallback: false })).not.toThrow();
        expect(() => testItem.SetValue(finalValue, { SkipValueChangedCallback:false })).not.toThrow();

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

        let config = SetupValueHost({}, initialValue);
        let changedState: Array<IValueHostState> = []
        config.validationManager.OnValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain);
        };

        let testItem = config.valueHost;
        expect(() => testItem.SetValue(secondValue)).not.toThrow();
        expect(() => testItem.SetValue(finalValue)).not.toThrow();

        expect(changedState.length).toBe(2);
        expect(changedState[0].Value).toBe(secondValue);
        expect(changedState[1].Value).toBe(finalValue);     
    });    

    test('Value was not changed. OnValueHostStateChanged is not called.', () => {
        const initialValue = 100;

        let config = SetupValueHost({}, initialValue);
        let changedState: Array<IValueHostState> = []
        config.validationManager.OnValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain);
        };

        let testItem = config.valueHost;
        expect(() => testItem.SetValue(initialValue)).not.toThrow();
        expect(() => testItem.SetValue(initialValue)).not.toThrow();

        expect(changedState.length).toBe(0);
    });        
});
describe('SetValueToUndefined', () => {
    test('Value was changed. State changes.', () => {
        const initialValue = 100;
        const finalValue = undefined;
        let config = SetupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.SetValueToUndefined()).not.toThrow();
        expect(testItem.GetValue()).toBe(finalValue);
        expect(testItem.IsChanged).toBe(true);

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].Id).toBe('Field1');
        expect(changes[0].Value).toBe(finalValue);
    });
    test('Value was not changed. State did not change', () => {
        const initialValue = undefined;
        const finalValue = initialValue;
        let config = SetupValueHost({}, initialValue);
        let testItem = config.valueHost;
        expect(() => testItem.SetValueToUndefined()).not.toThrow();
        expect(testItem.GetValue()).toBe(finalValue);
        expect(testItem.IsChanged).toBe(false);

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(0);

    });    
});

describe('ValueHostBase.SaveIntoStore and GetFromStore', () => {
    test('Save 10 and get it back.', () => {

        let config = SetupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.SaveIntoState('KEY', 10)).not.toThrow();

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(1);
        expect(changes[0].Id).toBe('Field1');
        expect(changes[0].Items).not.toBeNull();
        expect(changes[0].Items!['KEY']).toBe(10);
        expect(testItem.GetFromState('KEY')).toBe(10);        
    });
    test('Get without prior Store returns undefined.', () => {

        let config = SetupValueHost({});
        let testItem = config.valueHost;

        expect(testItem.GetFromState('KEY')).toBeUndefined();       
    });
    test('Save 10 and save undefined to remove it.', () => {

        let config = SetupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.SaveIntoState('KEY', 10)).not.toThrow();
        expect(() => testItem.SaveIntoState('KEY', undefined)).not.toThrow();

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(2);
        expect(changes[0].Id).toBe('Field1');
        expect(changes[0].Items).not.toBeNull();
        expect(changes[0].Items!['KEY']).toBe(10);
        expect(changes[1].Id).toBe('Field1');
        expect(changes[1].Items).not.toBeNull();
        expect(changes[1].Items!['KEY']).toBeUndefined();        
        expect(testItem.GetFromState('KEY')).toBeUndefined;        
    });
    test('Save two different keys and retrieve both.', () => {

        let config = SetupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.SaveIntoState('KEY1', 10)).not.toThrow();
        expect(() => testItem.SaveIntoState('KEY2', 20)).not.toThrow();

        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(2);
        expect(changes[0].Id).toBe('Field1');
        expect(changes[0].Items).not.toBeNull();
        expect(changes[0].Items!['KEY1']).toBe(10);
        expect(changes[1].Id).toBe('Field1');
        expect(changes[1].Items).not.toBeNull();
        expect(changes[1].Items!['KEY2']).toBe(20);  
        expect(testItem.GetFromState('KEY1')).toBe(10);        
        expect(testItem.GetFromState('KEY2')).toBe(20);
    });    
    test('Save two different keys, delete the second, and retrieve both.', () => {

        let config = SetupValueHost({});
        let testItem = config.valueHost;
        expect(() => testItem.SaveIntoState('KEY1', 10)).not.toThrow();
        expect(() => testItem.SaveIntoState('KEY2', 20)).not.toThrow();
        expect(() => testItem.SaveIntoState('KEY2', undefined)).not.toThrow();
        let changes = config.validationManager.GetHostStateChanges();
        expect(changes.length).toBe(3);
        expect(changes[0].Id).toBe('Field1');
        expect(changes[0].Items).not.toBeNull();
        expect(changes[0].Items!['KEY1']).toBe(10);
        expect(changes[1].Id).toBe('Field1');
        expect(changes[1].Items).not.toBeNull();
        expect(changes[1].Items!['KEY2']).toBe(20);  
        expect(changes[2].Id).toBe('Field1');
        expect(changes[2].Items).not.toBeNull();
        expect(changes[2].Items!['KEY2']).toBeUndefined();
        expect(testItem.GetFromState('KEY1')).toBe(10);        
        expect(testItem.GetFromState('KEY2')).toBeUndefined();
    });        
});