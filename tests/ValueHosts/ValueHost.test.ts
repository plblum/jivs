import { IValueHostDescriptor, IValueHostState, IValueHost } from "../../src/Interfaces/ValueHost";
import { ValueHostGenerator, ValueHostType, ValueHost } from "../../src/ValueHosts/ValueHost";
import { MockValidationServices, MockValidationManager, NeverMatchesConditionType } from "../Mocks";

describe('ValueHost constructor', () => {
    test('constructor with valid parameters created and sets up Services, Descriptor, and State', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let testItem: ValueHost | null = null;
        expect(() => testItem = new ValueHost(vm, {
            Id: 'Field1',
            Type: ValueHostType,
            Label: 'Label1'
        }, {
            Id: 'Field1',
            Value: undefined
        })).not.toThrow();

        expect(testItem!.ValueHostsManager).toBe(vm);

        expect(testItem!.GetId()).toBe('Field1');
        expect(testItem!.GetLabel()).toBe('Label1');
        expect(testItem!.GetDataType()).toBeNull();
        expect(testItem!.GetValue()).toBeUndefined();
        expect(testItem!.IsChanged).toBe(false);
    });
});

describe('ValueHostGenerator members', () => {
    test('CanCreate returns true for ValueHostType', () => {
        let testItem = new ValueHostGenerator();
        expect(testItem.CanCreate({
            Type: ValueHostType,
            Id: 'Field1',
            Label: ''
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new ValueHostGenerator();
        expect(testItem.CanCreate({
            Type: 'Unexpected',
            Id: 'Field1',
            Label: ''
        })).toBe(false);
    });
    test('Create returns instance of ValueHost with VM, Descriptor and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);        
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Type: ValueHostType,
            Label: ''
        };
        let state: IValueHostState = {
            Id: 'Field1',
            Value: "ABC"
        };
        let testItem = new ValueHostGenerator();
        let vh: IValueHost | null = null;
        expect(() => vh = testItem.Create(vm, descriptor, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(ValueHost);
        expect(vh!.GetId()).toBe(descriptor.Id);    // check Descriptor values
        expect(vh!.GetValue()).toBe("ABC");
    });
    test('CleanupState existing state takes no action. Returns the same data', () => {
        let originalState: IValueHostState = {
            Id: 'Field1',
            Value: 10
        };
        let state = { ...originalState };
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Type: ValueHostType,
            Label: ''
        };
        let testItem = new ValueHostGenerator();
        expect(() => testItem.CleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
 
    test('CreateState returns instance with ID and InitialValue from Descriptor', () => {
        let testItem = new ValueHostGenerator();
        let descriptor: IValueHostDescriptor = {
            Id: 'Field1',
            Type: ValueHostType,
            Label: '',
            InitialValue: 'TEST'
        };
        let state: IValueHostState | null = null;
        expect(() => state = testItem.CreateState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.Id).toBe(descriptor.Id);
        expect(state!.Value).toBe(descriptor.InitialValue);
    });
});