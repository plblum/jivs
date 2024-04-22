import { StaticValueHostConfig, StaticValueHostState, IStaticValueHost } from "../../src/Interfaces/StaticValueHost";
import { IGatherValueHostNames, toIGatherValueHostNames } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { StaticValueHost, StaticValueHostGenerator } from "../../src/ValueHosts/StaticValueHost";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";

describe('StaticValueHost constructor', () => {
    test('constructor with valid parameters created and sets up Services, Config, and State', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let testItem: StaticValueHost | null = null;
        expect(() => testItem = new StaticValueHost(vm, {
            name: 'Field1',
            type: ValueHostType.Static,
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

describe('StaticValueHostGenerator members', () => {
    test('CanCreate returns true for ValueHostType.Static', () => {
        let testItem = new StaticValueHostGenerator();
        expect(testItem.canCreate({
            type: ValueHostType.Static,
            name: 'Field1',
            label: ''
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new StaticValueHostGenerator();
        expect(testItem.canCreate({
            type: 'Unexpected',
            name: 'Field1',
            label: ''
        })).toBe(false);
    });
    test('CanCreate returns true for Type not defined and lack of ValidatorConfigs property', () => {
        let testItem = new StaticValueHostGenerator();
        expect(testItem.canCreate({
            name: 'Field1',
            label: ''
        })).toBe(true);
    });    

    test('CanCreate returns true for Type=undefined and lack of ValidatorConfigs property', () => {
        let testItem = new StaticValueHostGenerator();
        expect(testItem.canCreate({
            type: undefined,
            name: 'Field1',
            label: ''
        })).toBe(true);
    });        

    test('CanCreate returns false for Type not defined and presence of ValidatorConfigs property (using null as a value)', () => {
        let testItem = new StaticValueHostGenerator();
        expect(testItem.canCreate(<any>{
            name: 'Field1',
            label: '',
            validatorConfigs: null
        })).toBe(false);
    });        
    test('CanCreate returns false for Type not defined and presence of ValidatorConfigs property using [] as a value', () => {
        let testItem = new StaticValueHostGenerator();
        expect(testItem.canCreate(<any>{
            name: 'Field1',
            label: '',
            validatorConfigs: []
        })).toBe(false);
    });             
    test('create returns instance of StaticValueHost with VM, Config and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);        
        let config: StaticValueHostConfig = {
            name: 'Field1',
            type: ValueHostType.Static,
            label: ''
        };
        let state: StaticValueHostState = {
            name: 'Field1',
            value: "ABC"
        };
        let testItem = new StaticValueHostGenerator();
        let vh: IStaticValueHost | null = null;
        expect(() => vh = testItem.create(vm, config, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(StaticValueHost);
        expect(vh!.getName()).toBe(config.name);    // check Config values
        expect(vh!.getValue()).toBe("ABC");
    });
    test('cleanupState existing state takes no action. Returns the same data', () => {
        let originalState: StaticValueHostState = {
            name: 'Field1',
            value: 10
        };
        let state = { ...originalState };
        let config: StaticValueHostConfig = {
            name: 'Field1',
            type: ValueHostType.Static,
            label: ''
        };
        let testItem = new StaticValueHostGenerator();
        expect(() => testItem.cleanupState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });
 
    test('createState returns instance with name and InitialValue from Config', () => {
        let testItem = new StaticValueHostGenerator();
        let config: StaticValueHostConfig = {
            name: 'Field1',
            type: ValueHostType.Static,
            label: '',
            initialValue: 'TEST'
        };
        let state: StaticValueHostState | null = null;
        expect(() => state = testItem.createState(config)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe(config.name);
        expect(state!.value).toBe(config.initialValue);
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