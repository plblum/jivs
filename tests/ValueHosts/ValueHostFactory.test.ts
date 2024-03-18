import { InputValueHostType, InputValueHostGenerator } from "../../src/ValueHosts/InputValueHost";
import { IValueHostState, IValueHost, IValueHostDescriptor } from "../../src/Interfaces/ValueHost";
import { ValueHostBase } from "../../src/ValueHosts/ValueHostBase";
import { ValueHostFactory, RegisterStandardValueHostGenerators } from "../../src/ValueHosts/ValueHostFactory";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostResolver";
import { MockValidationManager, MockValidationServices } from "../Mocks";
import { IValueHostGenerator } from "../../src/Interfaces/ValueHostFactory";
import { LookupKey } from "../../src/DataTypes/LookupKeys";

/**
 * For testing the Factory's support of IValueHostGenerator implementations
 * with a custom IValueHostGenerator implementation
 */
interface IFactoryTestsValueHostState extends IValueHostState
{
    Counter: number;    // incremented each time the state is cleaned    
}

class FactoryTestsValueHost extends ValueHostBase<IValueHostDescriptor, IFactoryTestsValueHostState>
{
    constructor(valueHostsManager : IValueHostsManager, descriptor: IValueHostDescriptor, state: IFactoryTestsValueHostState) {
        super(valueHostsManager, descriptor, state);
    }
}

const FactoryTestGeneratorType = 'FactoryTest';
class FactoryTestsValueHostGenerator implements IValueHostGenerator {
    public CanCreate(descriptor: IValueHostDescriptor): boolean {
        return descriptor.Type === FactoryTestGeneratorType;
    }
    public Create(valueHostsManager : IValueHostsManager, descriptor: IValueHostDescriptor, state: IFactoryTestsValueHostState): IValueHost {
        return new FactoryTestsValueHost(valueHostsManager, descriptor, state);
    }
    public CleanupState(state: IFactoryTestsValueHostState, descriptor: IValueHostDescriptor): void {
        state.Counter = 0;
    }
    public CreateState(descriptor: IValueHostDescriptor): IFactoryTestsValueHostState {
        let state: IFactoryTestsValueHostState = {
            Id: descriptor.Id,
            Value: descriptor.InitialValue,
            Counter: 0
        };
        return state;
    }

}
describe('ValueHostFactory.Register', () => {
    test('Add FactoryTestsValueHostGenerator', () => {
        let factory = new ValueHostFactory();
        expect(factory.IsRegistered({ Type: FactoryTestGeneratorType, Id: '', Label: '' })).toBe(false);
        expect(() => factory.Register(new FactoryTestsValueHostGenerator())).not.toThrow();
        expect(factory.IsRegistered({ Type: FactoryTestGeneratorType, Id: '', Label: '' })).toBe(true);
    });
    test('Add Two Generators retains both', () => {
        let factory = new ValueHostFactory();
        expect(factory.IsRegistered({ Type: FactoryTestGeneratorType, Id: '', Label: '' })).toBe(false);
        expect(factory.IsRegistered({ Type: InputValueHostType, Id: '', Label: '' })).toBe(false);
        expect(() => factory.Register(new FactoryTestsValueHostGenerator())).not.toThrow();
        expect(() => factory.Register(new InputValueHostGenerator())).not.toThrow();
        expect(factory.IsRegistered({ Type: FactoryTestGeneratorType, Id: '', Label: '' })).toBe(true);
        expect(factory.IsRegistered({ Type: InputValueHostType, Id: '', Label: '' })).toBe(true);
    });    
});

// Create(validationManager: IValidationManager, descriptor: IValueHostDescriptor, state: IValueHostState): IValueHost
describe('ValueHostFactory.Create', () => {
    test('Create using FactoryTestValueHostGenerator creates FactoryTestValueHost', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Label: 'Label1',
            Type: FactoryTestGeneratorType,
            DataType: LookupKey.String,
            InitialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            Id: 'Field1',
            Value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.Register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.Create(vm, descriptor, state)).not.toThrow();
        expect(valueHost).not.toBeNull();
        expect(valueHost!.GetId()).toBe('Field1');
        expect(valueHost!.GetValue()).toBe('Value');
    });
    test('Create with null in parameters throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Label: 'Label1',
            Type: FactoryTestGeneratorType,
            DataType: LookupKey.String,
            InitialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            Id: 'Field1',
            Value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.Register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.Create(null!, descriptor, state)).toThrow(/valueHostsManager/);
        expect(() => valueHost = testItem.Create(vm, null!, state)).toThrow(/descriptor/);
        expect(() => valueHost = testItem.Create(vm, descriptor, null!)).toThrow(/state/);
    });
    test('Create with Descriptor.Type of null throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Label: 'Label1',
            Type: null!,
            DataType: LookupKey.String,
            InitialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            Id: 'Field1',
            Value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.Register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.Create(vm, descriptor, state)).toThrow(/ValueHostDescriptor\.Type/);

    });    
    test('Create with Descriptor.Type that has no matching registration throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Label: 'Label1',
            Type: 'Unregistered',
            DataType: LookupKey.String,
            InitialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            Id: 'Field1',
            Value: 'Value',
            Counter: 0
        };
        let testItem = new ValueHostFactory();
        testItem.Register(new FactoryTestsValueHostGenerator());
        let valueHost: IValueHost | null = null;
        expect(() => valueHost = testItem.Create(vm, descriptor, state)).toThrow(/Unsupported/);

    });        
});

// CleanupState(state: IValueHostState, descriptor: IValueHostDescriptor): void
describe('ValueHostFactory.CleanupState', () => {
    test('Changes State.Counter to 0', () => {

        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Label: 'Label1',
            Type: FactoryTestGeneratorType,
            DataType: LookupKey.String,
            InitialValue: 'DATA'
        };

        let state: IFactoryTestsValueHostState = {
            Id: 'Field1',
            Value: 'Value', // cleanup will not touch this
            Counter: 1  // cleanup will set this to 0
        };
        let testItem = new ValueHostFactory();
        testItem.Register(new FactoryTestsValueHostGenerator());

        expect(() => testItem.CleanupState(state, descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.Id).toBe('Field1');
        expect(state!.Value).toBe('Value');
        expect(state!.Counter).toBe(0);
    });
    
});
describe('ValueHostFactory.CreateState', () => {
    test('With InitialValue = undefined, creates with Value = undefined', () => {

        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Label: 'Label1',
            Type: FactoryTestGeneratorType,
            DataType: LookupKey.String,
            InitialValue: undefined
        };

        let testItem = new ValueHostFactory();
        testItem.Register(new FactoryTestsValueHostGenerator());
        let state: IValueHostState | null = null;
        expect(() => state = testItem.CreateState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.Id).toBe('Field1');
        expect(state!.Value).toBeUndefined();
        let x = state! as IFactoryTestsValueHostState;
        expect(x.Counter).toBe(0);
    });
});
describe('RegisterDefaultValueHostGenerators', () => {
    test('Ensure InputValueHostType gets registered', () => {
        let factory = new ValueHostFactory();
        expect(factory.IsRegistered({ Type: InputValueHostType, Id: '', Label: '' })).toBe(false);
        expect(() => RegisterStandardValueHostGenerators(factory)).not.toThrow();
        expect(factory.IsRegistered({ Type: InputValueHostType, Id: '', Label: '' })).toBe(true);
        
    });
})