import { InputValueHostGenerator } from "../../src/ValueHosts/InputValueHost";
import { ValueHostState, IValueHost, ValueHostDescriptor } from "../../src/Interfaces/ValueHost";
import { ValueHostBase } from "../../src/ValueHosts/ValueHostBase";
import { ValueHostFactory, registerStandardValueHostGenerators } from "../../src/ValueHosts/ValueHostFactory";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostResolver";
import { MockValidationManager, MockValidationServices } from "../Mocks";
import { IValueHostGenerator, ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { LookupKey } from "../../src/DataTypes/LookupKeys";

/**
 * For testing the Factory's support of IValueHostGenerator implementations
 * with a custom IValueHostGenerator implementation
 */
interface IFactoryTestsValueHostState extends ValueHostState
{
    Counter: number;    // incremented each time the state is cleaned    
}

class FactoryTestsValueHost extends ValueHostBase<ValueHostDescriptor, IFactoryTestsValueHostState>
{
    constructor(valueHostsManager : IValueHostsManager, descriptor: ValueHostDescriptor, state: IFactoryTestsValueHostState) {
        super(valueHostsManager, descriptor, state);
    }
}

const FactoryTestGeneratorType = 'FactoryTest';
class FactoryTestsValueHostGenerator implements IValueHostGenerator {
    public canCreate(descriptor: ValueHostDescriptor): boolean {
        return descriptor.type === FactoryTestGeneratorType;
    }
    public create(valueHostsManager : IValueHostsManager, descriptor: ValueHostDescriptor, state: IFactoryTestsValueHostState): IValueHost {
        return new FactoryTestsValueHost(valueHostsManager, descriptor, state);
    }
    public cleanupState(state: IFactoryTestsValueHostState, descriptor: ValueHostDescriptor): void {
        state.Counter = 0;
    }
    public createState(descriptor: ValueHostDescriptor): IFactoryTestsValueHostState {
        let state: IFactoryTestsValueHostState = {
            id: descriptor.id,
            value: descriptor.initialValue,
            Counter: 0
        };
        return state;
    }

}
describe('ValueHostFactory.register', () => {
    test('Add FactoryTestsValueHostGenerator', () => {
        let factory = new ValueHostFactory();
        expect(factory.isRegistered({ type: FactoryTestGeneratorType, id: '', label: '' })).toBe(false);
        expect(() => factory.register(new FactoryTestsValueHostGenerator())).not.toThrow();
        expect(factory.isRegistered({ type: FactoryTestGeneratorType, id: '', label: '' })).toBe(true);
    });
    test('Add Two Generators retains both', () => {
        let factory = new ValueHostFactory();
        expect(factory.isRegistered({ type: FactoryTestGeneratorType, id: '', label: '' })).toBe(false);
        expect(factory.isRegistered({ type: ValueHostType.Input, id: '', label: '' })).toBe(false);
        expect(() => factory.register(new FactoryTestsValueHostGenerator())).not.toThrow();
        expect(() => factory.register(new InputValueHostGenerator())).not.toThrow();
        expect(factory.isRegistered({ type: FactoryTestGeneratorType, id: '', label: '' })).toBe(true);
        expect(factory.isRegistered({ type: ValueHostType.Input, id: '', label: '' })).toBe(true);
    });    
});

// create(validationManager: IValidationManager, descriptor: ValueHostDescriptor, state: ValueHostState): IValueHost
describe('ValueHostFactory.create', () => {
    test('create using FactoryTestValueHostGenerator creates FactoryTestValueHost', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            label: 'Label1',
            type: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            id: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(vm, descriptor, state)).not.toThrow();
        expect(valueHost).not.toBeNull();
        expect(valueHost!.getId()).toBe('Field1');
        expect(valueHost!.getValue()).toBe('Value');
    });
    test('create with null in parameters throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            label: 'Label1',
            type: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            id: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(null!, descriptor, state)).toThrow(/valueHostsManager/);
        expect(() => valueHost = testItem.create(vm, null!, state)).toThrow(/descriptor/);
        expect(() => valueHost = testItem.create(vm, descriptor, null!)).toThrow(/state/);
    });
    test('create with Descriptor.Type of null throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            label: 'Label1',
            type: null!,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            id: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(vm, descriptor, state)).toThrow(/ValueHostDescriptor\.Type/);

    });    
    test('create with Descriptor.Type that has no matching registration throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            label: 'Label1',
            type: 'Unregistered',
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            id: 'Field1',
            value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.create(vm, descriptor, state)).toThrow(/Unsupported/);

    });        
});

// cleanupState(state: ValueHostState, descriptor: ValueHostDescriptor): void
describe('ValueHostFactory.cleanupState', () => {
    test('Changes State.Counter to 0', () => {

        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            label: 'Label1',
            type: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            id: 'Field1',
            value: 'Value', // cleanup will not touch this
            Counter: 1  // cleanup will set this to 0
        };
        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());

        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.id).toBe('Field1');
        expect(state!.value).toBe('Value');
        expect(state!.Counter).toBe(0);
    });
    
});
describe('ValueHostFactory.createState', () => {
    test('With InitialValue = undefined, creates with Value = undefined', () => {

        let descriptor: ValueHostDescriptor = {
            id: 'Field1',
            label: 'Label1',
            type: FactoryTestGeneratorType,
            dataType: LookupKey.String,
            initialValue: undefined
        };

        let testItem = new ValueHostFactory();
        testItem.register(new FactoryTestsValueHostGenerator());
        let state: ValueHostState | null = null;
        expect(() => state = testItem.createState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.id).toBe('Field1');
        expect(state!.value).toBeUndefined();
        let x = state! as IFactoryTestsValueHostState;
        expect(x.Counter).toBe(0);
    });
});
describe('registerDefaultValueHostGenerators', () => {
    test('Ensure InputValueHostType gets registered', () => {
        let factory = new ValueHostFactory();
        expect(factory.isRegistered({ type: ValueHostType.Input, id: '', label: '' })).toBe(false);
        expect(() => registerStandardValueHostGenerators(factory)).not.toThrow();
        expect(factory.isRegistered({ type: ValueHostType.Input, id: '', label: '' })).toBe(true);
        
    });
});