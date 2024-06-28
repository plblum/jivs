import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { CalcValueHostConfig, CalcValueHostInstanceState, ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { CalcValueHost, CalcValueHostGenerator, toICalcValueHost } from "../../src/ValueHosts/CalcValueHost";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { ValidationStatus } from "../../src/Interfaces/Validation";
import { SetValueOptions, ValidTypesForInstanceStateStorage } from "../../src/Interfaces/ValueHost";
import { InputValueHost } from "../../src/ValueHosts/InputValueHost";
import { StaticValueHost } from "../../src/ValueHosts/StaticValueHost";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";

function TestCalcFunctionReturnsOne(calcValueHost: ICalcValueHost, findValueHost: IValueHostsManager):
    SimpleValueType {
    return 1;
}
function TestCalcFunctionReturnsValueOfField1(calcValueHost: ICalcValueHost, findValueHost: IValueHostsManager):
    SimpleValueType {
    return findValueHost.getValueHost('Field1')?.getValue();
}
function TestCalcFunctionReentrant(calcValueHost: ICalcValueHost, findValueHost: IValueHostsManager):
    SimpleValueType {
    return findValueHost.getValueHost(calcValueHost.getName())?.getValue();
}
function TestCalcFunctionUsingConvert(calcValueHost: ICalcValueHost, findValueHost: IValueHostsManager):
    SimpleValueType {
    let date1 = new Date(Date.UTC(2000, 0, 1));
    return calcValueHost.convert(date1, 'Date');
}
function TestCalcFunctionUsingConvertToPrimitive(calcValueHost: ICalcValueHost, findValueHost: IValueHostsManager):
    SimpleValueType {
    let date1 = new Date(Date.UTC(2000, 0, 1));
    return calcValueHost.convertToPrimitive(date1, 'Date');
}


describe('CalcValueHost constructor', () => {
    test('constructor with valid parameters created and sets up Services, Config, and InstanceState', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let testItem: CalcValueHost | null = null;
        expect(() => testItem = new CalcValueHost(vm, {
            name: 'Field1',
            valueHostType: ValueHostType.Calc,
            label: 'Label1',
            calcFn: TestCalcFunctionReturnsOne
        },
            {
                name: 'Field1',
                value: undefined
            })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getLabel()).toBe('Label1');
        expect(testItem!.getDataType()).toBeNull();
        expect(testItem!.getValue()).toBe(1);
        expect(testItem!.isChanged).toBe(false);
    });
});

describe('CalcValueHostGenerator members', () => {
    test('CanCreate returns true for ValueHostType.Calc', () => {
        let testItem = new CalcValueHostGenerator();
        expect(testItem.canCreate({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            label: ''
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new CalcValueHostGenerator();
        expect(testItem.canCreate({
            valueHostType: 'Unexpected',
            name: 'Field1',
            label: ''
        })).toBe(false);
    });
    test('CanCreate returns true for type omitted and lack of ValidatorConfigs property', () => {
        let testItem = new CalcValueHostGenerator();
        expect(testItem.canCreate({
            name: 'Field1',
            label: ''
        })).toBe(false);
    });

    test('create returns instance of CalcValueHost with VM, Config and InstanceState established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let config: CalcValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Calc,
            label: '',
            calcFn: TestCalcFunctionReturnsOne
        };
        let state: CalcValueHostInstanceState = {
            name: 'Field1',
            value: undefined,
            items: {
                letters: 'ABC'
            }
        };
        let testItem = new CalcValueHostGenerator();
        let vh: ICalcValueHost | null = null;
        expect(() => vh = testItem.create(vm, config, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(CalcValueHost);
        expect(vh!.getName()).toBe(config.name);    // check Config values
        expect(vh!.getValue()).toBe(1); // from calculation
        expect(vh!.getFromInstanceState('letters')).toBe('ABC');
    });
    test('cleanupInstanceState existing state takes no action. Returns the same data', () => {
        let originalState: CalcValueHostInstanceState = {
            name: 'Field1',
            value: undefined,
            items: {
                letters: 'ABC'
            }
        };
        let state = { ...originalState };
        let config: CalcValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Calc,
            label: '',
            calcFn: TestCalcFunctionReturnsOne
        };
        let testItem = new CalcValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });

    test('createInstanceState returns instance with name and InitialValue from Config', () => {
        let testItem = new CalcValueHostGenerator();
        let config: CalcValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Calc,
            label: '',
            initialValue: 'TEST',
            calcFn: TestCalcFunctionReturnsOne
        };
        let state: CalcValueHostInstanceState | null = null;
        expect(() => state = testItem.createInstanceState(config)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe(config.name);
        expect(state!.value).toBe(config.initialValue);
    });
});
describe('getValue using the calcFn', () => {
    test('Through ValidationManager, TestCalcFunctionReturnsOne always returns 1', () => {
        let services = createValidationServicesForTesting();
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [ 
                <CalcValueHostConfig>{
                    name: 'Field1',
                    valueHostType: ValueHostType.Calc,
                    calcFn: TestCalcFunctionReturnsOne
                }
            ]
        });
        let testItem = vm.getValueHost('Field1');
        expect(testItem).toBeInstanceOf(CalcValueHost);
        expect(testItem!.getValue()).toBe(1);
    });
    test('Through ValidationManager, TestCalcFunctionReturnsValueOfField1 always returns the value from Field1', () => {
        let services = createValidationServicesForTesting();
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [ 
                {
                    name: 'Field1',
                    valueHostType: ValueHostType.Static,
                    dataType: LookupKey.String
                },
                <CalcValueHostConfig>{
                    name: 'Field2',
                    valueHostType: ValueHostType.Calc,
                    calcFn: TestCalcFunctionReturnsValueOfField1
                }
            ]
        });
        let testItem = vm.getValueHost('Field2');
        expect(testItem).toBeInstanceOf(CalcValueHost);
        let field1ValueHost = vm.getValueHost('Field1');

        expect(testItem!.getValue()).toBeUndefined();
        field1ValueHost!.setValue('B');
        expect(testItem!.getValue()).toBe('B');

    });    
    test('Through ValidationManager, function that calls getValue on itself throws', () => {
        let services = createValidationServicesForTesting();
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [ 
                <CalcValueHostConfig>{
                    name: 'Field1',
                    valueHostType: ValueHostType.Calc,
                    calcFn: TestCalcFunctionReentrant
                }
            ]
        });
        let testItem = vm.getValueHost('Field1');
        expect(testItem).toBeInstanceOf(CalcValueHost);
        expect(() => testItem?.getValue()).toThrow(/Recursive/);
    });     
    test('function is null returns undefined and logs', () => {
        let services = createValidationServicesForTesting();
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Info;
        services.loggerService = logger;        
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [ 
                <CalcValueHostConfig>{
                    name: 'Field1',
                    valueHostType: ValueHostType.Calc,
                    calcFn: null as any
                }
            ]
        });
        let testItem = vm.getValueHost('Field1');
        expect(testItem).toBeInstanceOf(CalcValueHost);
        expect(testItem?.getValue()).toBeUndefined();
        expect(logger.findMessage('calcFn', LoggingLevel.Warn)).toBeTruthy();

    });          
    test('function uses convert on a Date and gets a total number of days', () => {
        let services = createValidationServicesForTesting();
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [ 
                <CalcValueHostConfig>{
                    name: 'Field1',
                    valueHostType: ValueHostType.Calc,
                    calcFn: TestCalcFunctionUsingConvert
                }
            ]
        });
        let testItem = vm.getValueHost('Field1');
        expect(testItem).toBeInstanceOf(CalcValueHost);
        expect(typeof testItem?.getValue()).toBe('number');
    });      
    test('function uses convertToPrimitive on a Date and gets a total number of days', () => {
        let services = createValidationServicesForTesting();
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [ 
                <CalcValueHostConfig>{
                    name: 'Field1',
                    valueHostType: ValueHostType.Calc,
                    calcFn: TestCalcFunctionUsingConvertToPrimitive
                }
            ]
        });
        let testItem = vm.getValueHost('Field1');
        expect(testItem).toBeInstanceOf(CalcValueHost);
        expect(typeof testItem?.getValue()).toBe('number');
    });      
});
describe('setValue', () => {
    test('setValue only logs. Has no impact on calculation', () => {
        let services = createValidationServicesForTesting();
        let logger = new CapturingLogger();
        logger.minLevel = LoggingLevel.Info;
        services.loggerService = logger;
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [ 
                <CalcValueHostConfig>{
                    name: 'Field1',
                    valueHostType: ValueHostType.Calc,
                    calcFn: TestCalcFunctionReturnsOne
                }
            ]
        });
        let testItem = vm.getValueHost('Field1');
        expect(testItem).toBeInstanceOf(CalcValueHost);
        expect(() => testItem?.setValue(0)).not.toThrow();

        expect(logger.findMessage('setValue', LoggingLevel.Warn)).toBeTruthy();
    });
});

describe('toICalcValueHost function', () => {
    test('Passing actual CalcValueHost matches interface returns same object.', () => {
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
        expect(toICalcValueHost(testItem)).toBe(testItem);
    });
    test('Passing InputValueHost returns null.', () => {
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
        expect(toICalcValueHost(testItem)).toBeNull();
    });  
    test('Passing StaticValueHost returns null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new StaticValueHost(vm, {
                name: 'Field1',
                label: 'Label1'
            },
            {
                name: 'Field1',
                value: undefined
            });
        expect(toICalcValueHost(testItem)).toBeNull();
    });        
    class TestICalcValueHostImplementation implements ICalcValueHost {
        valueHostsManager: IValueHostsManager = {} as IValueHostsManager;    
        dispose(): void {}
        convert(value: any, dataTypeLookupKey: string | null): SimpleValueType {
            throw new Error("Method not implemented.");
        }
        convertToPrimitive(value: any, dataTypeLookupKey: string | null): string | number | Date | null | undefined {
            throw new Error("Method not implemented.");
        }
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
        isChanged: boolean = false;
        isEnabled(): boolean {
            throw new Error("Method not implemented.");
        }
        setEnabled(enabled: boolean): void {
            throw new Error("Method not implemented.");
        }
    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestICalcValueHostImplementation();

        expect(toICalcValueHost(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toICalcValueHost(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toICalcValueHost(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toICalcValueHost(100)).toBeNull();
    });
});
