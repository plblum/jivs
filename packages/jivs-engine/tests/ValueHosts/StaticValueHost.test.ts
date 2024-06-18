import { StaticValueHostConfig, StaticValueHostInstanceState, IStaticValueHost } from "../../src/Interfaces/StaticValueHost";
import { ValidationStatus } from "../../src/Interfaces/Validation";
import { IGatherValueHostNames, SetValueOptions, ValidTypesForInstanceStateStorage, toIGatherValueHostNames } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { CalcValueHost } from "../../src/ValueHosts/CalcValueHost";
import { InputValueHost } from "../../src/ValueHosts/InputValueHost";
import { PropertyValueHost } from "../../src/ValueHosts/PropertyValueHost";
import { StaticValueHost, StaticValueHostGenerator, toIStaticValueHost } from "../../src/ValueHosts/StaticValueHost";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";

describe('StaticValueHost constructor', () => {
    test('constructor with valid parameters created and sets up Services, Config, and State', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let testItem: StaticValueHost | null = null;
        expect(() => testItem = new StaticValueHost(vm, {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
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
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: ''
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new StaticValueHostGenerator();
        expect(testItem.canCreate({
            valueHostType: 'Unexpected',
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
            valueHostType: undefined,
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
            valueHostType: ValueHostType.Static,
            label: ''
        };
        let state: StaticValueHostInstanceState = {
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
    test('cleanupInstanceState existing state takes no action. Returns the same data', () => {
        let originalState: StaticValueHostInstanceState = {
            name: 'Field1',
            value: 10
        };
        let state = { ...originalState };
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: ''
        };
        let testItem = new StaticValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });

    test('createInstanceState returns instance with name and InitialValue from Config', () => {
        let testItem = new StaticValueHostGenerator();
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: '',
            initialValue: 'TEST'
        };
        let state: StaticValueHostInstanceState | null = null;
        expect(() => state = testItem.createInstanceState(config)).not.toThrow();
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
describe('toIStaticValueHost function', () => {
    test('Passing actual StaticValueHost matches interface returns same object.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new StaticValueHost(vm, {
                name: 'Field1',
                label: 'Label1'
            },
            {
                name: 'Field1',
                value: undefined
            });
        expect(toIStaticValueHost(testItem)).toBe(testItem);
    });
    test('Passing actual InputValueHost returns null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new InputValueHost(vm, {
                name: 'Field1',
                label: 'Label1',
                validatorConfigs: []
            },
            {
                name: 'Field1',
                value: undefined,
                status: ValidationStatus.NotAttempted,
                issuesFound: null
            });
        expect(toIStaticValueHost(testItem)).toBeNull();
    });  
    test('Passing actual CalcValueHost returns null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new CalcValueHost(vm, {
                name: 'Field1',
                label: 'Label1',
                calcFn: (host, manager) => null
            },
            {
                name: 'Field1',
                value: undefined
            });
        expect(toIStaticValueHost(testItem)).toBeNull();
    });        
    class TestIStaticValueHostImplementation implements IStaticValueHost {
        dispose(): void {}
        getName(): string {
            throw new Error("Method not implemented.");
        }
        getLabel(): string {
            throw new Error("Method not implemented.");
        }

        getValue() {
            throw new Error("Method not implemented.");
        }
        setValue(value: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        setValueToUndefined(options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        getDataType(): string | null {
            throw new Error("Method not implemented.");
        }
        getDataTypeLabel(): string {
            throw new Error("Method not implemented.");
        }
    
        saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void {
            throw new Error("Method not implemented.");
        }
        getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined {
            throw new Error("Method not implemented.");
        }
        isChanged: boolean = false
        
    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIStaticValueHostImplementation();

        expect(toIStaticValueHost(testItem)).toBe(testItem);
    });
    test('PropertyValueHost return null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new PropertyValueHost(vm, {
                name: 'Field1',
                label: 'Label1',
                validatorConfigs: []
            },
            {
                name: 'Field1',
                value: undefined,
                issuesFound: null,
                status: ValidationStatus.NotAttempted
            });
        expect(toIStaticValueHost(testItem)).toBeNull();
    });            
    test('InputValueHost return null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new InputValueHost(vm, {
                name: 'Field1',
                label: 'Label1',
                validatorConfigs: []
            },
            {
                name: 'Field1',
                value: undefined,
                issuesFound: null,
                status: ValidationStatus.NotAttempted
            });
        expect(toIStaticValueHost(testItem)).toBeNull();
    });                
    test('CalcValueHost return null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new CalcValueHost(vm, {
                name: 'Field1',
                label: 'Label1',
                calcFn: (host, mgr)=> 0
            },
            {
                name: 'Field1',
                value: undefined
            });
        expect(toIStaticValueHost(testItem)).toBeNull();
    });                
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIStaticValueHost(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIStaticValueHost(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIStaticValueHost(100)).toBeNull();
    });
});
