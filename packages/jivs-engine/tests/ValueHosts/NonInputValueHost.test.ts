import { NonInputValueHostDescriptor, NonInputValueHostState, INonInputValueHost } from "../../src/Interfaces/NonInputValueHost";
import { IGatherValueHostNames, toIGatherValueHostNames } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { NonInputValueHost, NonInputValueHostGenerator } from "../../src/ValueHosts/NonInputValueHost";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";

describe('NonInputValueHost constructor', () => {
    test('constructor with valid parameters created and sets up Services, Descriptor, and State', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let testItem: NonInputValueHost | null = null;
        expect(() => testItem = new NonInputValueHost(vm, {
            name: 'Field1',
            type: ValueHostType.NonInput,
            label: 'Label1'
        }, {
            name: 'Field1',
            value: undefined
        })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getLabel()).toBe('Label1');
        expect(testItem!.getDataType()).toBeNull();
        expect(testItem!.getValue()).toBeUndefined();
        expect(testItem!.isChanged).toBe(false);
    });
});

describe('NonInputValueHostGenerator members', () => {
    test('CanCreate returns true for ValueHostType.NonInput', () => {
        let testItem = new NonInputValueHostGenerator();
        expect(testItem.canCreate({
            type: ValueHostType.NonInput,
            name: 'Field1',
            label: ''
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new NonInputValueHostGenerator();
        expect(testItem.canCreate({
            type: 'Unexpected',
            name: 'Field1',
            label: ''
        })).toBe(false);
    });
    test('CanCreate returns true for Type not defined and lack of ValidatorDescriptors property', () => {
        let testItem = new NonInputValueHostGenerator();
        expect(testItem.canCreate({
            name: 'Field1',
            label: ''
        })).toBe(true);
    });    

    test('CanCreate returns true for Type=undefined and lack of ValidatorDescriptors property', () => {
        let testItem = new NonInputValueHostGenerator();
        expect(testItem.canCreate({
            type: undefined,
            name: 'Field1',
            label: ''
        })).toBe(true);
    });        

    test('CanCreate returns false for Type not defined and presence of ValidatorDescriptors property (using null as a value)', () => {
        let testItem = new NonInputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            name: 'Field1',
            label: '',
            validatorDescriptors: null
        })).toBe(false);
    });        
    test('CanCreate returns false for Type not defined and presence of ValidatorDescriptors property using [] as a value', () => {
        let testItem = new NonInputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            name: 'Field1',
            label: '',
            validatorDescriptors: []
        })).toBe(false);
    });             
    test('create returns instance of NonInputValueHost with VM, Descriptor and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);        
        let descriptor: NonInputValueHostDescriptor = {
            name: 'Field1',
            type: ValueHostType.NonInput,
            label: ''
        };
        let state: NonInputValueHostState = {
            name: 'Field1',
            value: "ABC"
        };
        let testItem = new NonInputValueHostGenerator();
        let vh: INonInputValueHost | null = null;
        expect(() => vh = testItem.create(vm, descriptor, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(NonInputValueHost);
        expect(vh!.getName()).toBe(descriptor.name);    // check Descriptor values
        expect(vh!.getValue()).toBe("ABC");
    });
    test('cleanupState existing state takes no action. Returns the same data', () => {
        let originalState: NonInputValueHostState = {
            name: 'Field1',
            value: 10
        };
        let state = { ...originalState };
        let descriptor: NonInputValueHostDescriptor = {
            name: 'Field1',
            type: ValueHostType.NonInput,
            label: ''
        };
        let testItem = new NonInputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
 
    test('createState returns instance with name and InitialValue from Descriptor', () => {
        let testItem = new NonInputValueHostGenerator();
        let descriptor: NonInputValueHostDescriptor = {
            name: 'Field1',
            type: ValueHostType.NonInput,
            label: '',
            initialValue: 'TEST'
        };
        let state: NonInputValueHostState | null = null;
        expect(() => state = testItem.createState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe(descriptor.name);
        expect(state!.value).toBe(descriptor.initialValue);
    });
});
describe('toIGatherValueHostNames function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IGatherValueHostNames = {
            gatherValueHostNames: (a, b) => { }
        };
        expect(toIGatherValueHostNames(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIGatherValueHostNames(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIGatherValueHostNames(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIGatherValueHostNames(100)).toBeNull();
    });        
});