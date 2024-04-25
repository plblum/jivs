import { InputValueHostGenerator } from "../../src/ValueHosts/InputValueHost";
import { ValueHostInstanceState, IValueHost, ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostBase } from "../../src/ValueHosts/ValueHostBase";
import { ValueHostFactory, registerStandardValueHostGenerators } from "../../src/ValueHosts/ValueHostFactory";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostResolver";
import { MockValidationManager, MockValidationServices } from "../TestSupport/mocks";
import { IValueHostGenerator, ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { LookupKey } from "../../src/DataTypes/LookupKeys";

/**
 * For testing the Factory's support of IValueHostGenerator implementations
 * with a custom IValueHostGenerator implementation
 */
interface IFactoryTestsValueHostInstanceState extends ValueHostInstanceState
{
    Counter: number;    // incremented each time the state is cleaned    
}

class FactoryTestsValueHost extends ValueHostBase<ValueHostConfig, IFactoryTestsValueHostInstanceState>
{
    constructor(valueHostsManager : IValueHostsManager, config: ValueHostConfig, state: IFactoryTestsValueHostInstanceState) {
        super(valueHostsManager, config, state);
    }
}

const FactoryTestGeneratorType = 'FactoryTest';
class FactoryTestsValueHostGenerator implements IValueHostGenerator {
    public canCreate(config: ValueHostConfig): boolean {
        return config.valueHostType === FactoryTestGeneratorType;
    }
    public create(valueHostsManager : IValueHostsManager, config: ValueHostConfig, state: IFactoryTestsValueHostInstanceState): IValueHost {
        return new FactoryTestsValueHost(valueHostsManager, config, state);
    }
    public cleanupInstanceState(state: IFactoryTestsValueHostInstanceState, config: ValueHostConfig): void {
        state.Counter = 0;
    }
    public createInstanceState(config: ValueHostConfig): IFactoryTestsValueHostInstanceState {
        let state: IFactoryTestsValueHostInstanceState = {
            name: config.name,
            value: config.initialValue,
            Counter: 0
        };
        return state;
    }

}
describe('ValueHostFactory.register', () => {
    test('Add FactoryTestsValueHostGenerator', () => {
        let factory = new ValueHostFactory();
        expect(factory.isRegistered({ valueHostType: FactoryTestGeneratorType, name: '', label: '' })).toBe(false);
        expect(() => factory.register(new FactoryTestsValueHostGenerator())).not.toThrow();
        expect(factory.isRegistered({ valueHostType: FactoryTestGeneratorType, name: '', label: '' })).toBe(true);
    });
    test('Add Two Generators retains both', () => {
        let factory = new ValueHostFactory();
        expect(factory.isRegistered({ valueHostType: FactoryTestGeneratorType, name: '', label: '' })).toBe(false);
        expect(factory.isRegistered({ valueHostType: ValueHostType.Input, name: '', label: '' })).toBe(false);
        expect(() => factory.register(new FactoryTestsValueHostGenerator())).not.toThrow();
        expect(() => factory.register(new InputValueHostGenerator())).not.toThrow();
        expect(factory.isRegistered({ valueHostType: FactoryTestGeneratorType, name: '', label: '' })).toBe(true);
        expect(factory.isRegistered({ valueHostType: ValueHostType.Input, name: '', label: '' })).toBe(true);
    });    
});

// create(validationManager: IValidationManager, config: ValueHostConfig, state: ValueHostInstanceState): IValueHost
describe('ValueHostFactory.create', () => {
    test('create using FactoryTestValueHostGenerator creates FactoryTestValueHost', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let config: ValueHostConfig = {
            name: 'Field1',
            label: 'Label1',
            valueHostType: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostInstanceState = {
            name: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(vm, config, state)).not.toThrow();
        expect(valueHost).not.toBeNull();
        expect(valueHost!.getName()).toBe('Field1');
        expect(valueHost!.getValue()).toBe('Value');
    });
    test('create with null in parameters throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let config: ValueHostConfig = {
            name: 'Field1',
            label: 'Label1',
            valueHostType: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostInstanceState = {
            name: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(null!, config, state)).toThrow(/valueHostsManager/);
        expect(() => valueHost = testItem.create(vm, null!, state)).toThrow(/config/);
        expect(() => valueHost = testItem.create(vm, config, null!)).toThrow(/state/);
    });
    test('create with Config.valueHostType of null throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let config: ValueHostConfig = {
            name: 'Field1',
            label: 'Label1',
            valueHostType: null!,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostInstanceState = {
            name: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(vm, config, state)).toThrow(/ValueHostConfig\.valueHostType/);

    });    
    test('create with Config.valueHostType that has no matching registration throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let config: ValueHostConfig = {
            name: 'Field1',
            label: 'Label1',
            valueHostType: 'Unregistered',
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostInstanceState = {
            name: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(vm, config, state)).toThrow(/Unsupported/);

    });        
});

// cleanupInstanceState(state: ValueHostInstanceState, config: ValueHostConfig): void
describe('ValueHostFactory.cleanupInstanceState', () => {
    test('Changes State.Counter to 0', () => {

        let config: ValueHostConfig = {
            name: 'Field1',
            label: 'Label1',
            valueHostType: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostInstanceState = {
            name: 'Field1',
            value: 'Value', // cleanup will not touch this
            Counter: 1  // cleanup will set this to 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());

        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe('Field1');
        expect(state!.value).toBe('Value');
        expect(state!.Counter).toBe(0);
    });
    
});
describe('ValueHostFactory.createInstanceState', () => {
    test('With InitialValue = undefined, creates with Value = undefined', () => {

        let config: ValueHostConfig = {
            name: 'Field1',
            label: 'Label1',
            valueHostType: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: undefined
        };

        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let state: ValueHostInstanceState | null = null;
        expect(() => state = testItem.createInstanceState(config)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe('Field1');
        expect(state!.value).toBeUndefined();
        let x = state! as IFactoryTestsValueHostInstanceState;
        expect(x.Counter).toBe(0);
    });
});
describe('registerDefaultValueHostGenerators', () => {
    test('Ensure InputValueHostType gets registered', () => {
        let factory = new ValueHostFactory();
        expect(factory.isRegistered({ valueHostType: ValueHostType.Input, name: '', label: '' })).toBe(false);
        expect(() => registerStandardValueHostGenerators(factory)).not.toThrow();
        expect(factory.isRegistered({ valueHostType: ValueHostType.Input, name: '', label: '' })).toBe(true);
        
    });
});