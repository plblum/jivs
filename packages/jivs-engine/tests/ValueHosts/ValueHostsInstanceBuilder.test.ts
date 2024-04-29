import { IValueHostsManager, ValueHostsManagerConfig } from "../../src/Interfaces/ValueHostsManager";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { ValueHostsManager } from "../../src/Validation/ValueHostsManager";
import { ValueHostsInstanceBuilder } from "../../src/ValueHosts/ValueHostsInstanceBuilder";
import { MockValidationServices } from "../TestSupport/mocks";
import { StaticValueHost } from "../../src/ValueHosts/StaticValueHost";
import { FluentValidatorCollector } from "../../src/ValueHosts/Fluent";
import { InputValueHost } from "../../src/ValueHosts/InputValueHost";
import { CalcValueHost } from "../../src/ValueHosts/CalcValueHost";
import { CalculationHandlerResult, ICalcValueHost } from "../../src/Interfaces/CalcValueHost";


function createValueHostsManager(): IValueHostsManager {
    let vmConfig: ValueHostsManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return new ValueHostsManager(vmConfig);
}
describe('constructor', () => {
    test('With valid parameter does not throw', () => {
        let vm = createValueHostsManager();
        expect(()=> new ValueHostsInstanceBuilder(vm)).not.toThrow();
    });
    test('With null parameter throws', () => {
        expect(()=> new ValueHostsInstanceBuilder(null!)).toThrow(/valueHostManager/);
    });    
});
describe('input()', () => {
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        let result = testItem.input('Field1', null, { label: 'Field 1' });
        expect(result).toBeInstanceOf(FluentValidatorCollector);
        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getLabel()).toBe('Field 1');
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        let result = testItem.input('Field1', 'Test');
        expect(result).toBeInstanceOf(FluentValidatorCollector);
        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getDataType()).toBe('Test');
    });
    test('Name supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        let result = testItem.input('Field1');
        expect(result).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        
    });
    test('Pass in a InputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        let result = testItem.input({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(result).toBeInstanceOf(FluentValidatorCollector);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        };
        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBe('Test');
    });
    test('Add same name twice replaces', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        let result = testItem.input('Field1');
        expect(() => testItem.input('Field1', 'CHANGED')).not.toThrow();
        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        
        expect(vh1!.getDataType()).toBe('CHANGED');
    });
    test('Add 2 inputs, 1 non-input. All valid and generates 3 ValueHostConfigs in vmConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        let result1 = testItem.input('Field1');
        let result2 = testItem.input('Field2');
        
        expect(result1).toBeInstanceOf(FluentValidatorCollector);
        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');        

        expect(result2).toBeInstanceOf(FluentValidatorCollector);
        let vh2 = vm.getValueHost('Field2');
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.getName()).toBe('Field2');        
    });
    test('Null name throws', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        expect(() => testItem.input(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);

        expect(() => testItem.input(100 as any)).toThrow('pass');
    });
});

describe('static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.static('Field1', null, { label: 'Field 1' });
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);
        let vh = vm.getValueHost('Field1');
        expect(vh).toBeInstanceOf(StaticValueHost);
        expect(vh!.getName()).toBe('Field1');
        expect(vh!.getLabel()).toBe('Field 1');
    });

    test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.static('Field1', 'Test');
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);
        let vh = vm.getValueHost('Field1');
        expect(vh).toBeInstanceOf(StaticValueHost);
        expect(vh!.getName()).toBe('Field1');
        expect(vh!.getDataType()).toBe('Test');        
    });

    test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.static('Field1');
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);
        let vh = vm.getValueHost('Field1');
        expect(vh).toBeInstanceOf(StaticValueHost);
        expect(vh!.getName()).toBe('Field1');      
    });

    test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);

        let vh = vm.getValueHost('Field1');
        expect(vh).toBeInstanceOf(StaticValueHost);
        expect(vh!.getName()).toBe('Field1');
        expect(vh!.getLabel()).toBe('Field 1');
        expect(vh!.getDataType()).toBe('Test');
    });

    test('Add two differently named StaticValueHostConfigs creates two entries in vmConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.static('Field1').static('Field2');
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);

        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(StaticValueHost);
        expect(vh1!.getName()).toBe('Field1');
      
        let vh2 = vm.getValueHost('Field2');
        expect(vh2).toBeInstanceOf(StaticValueHost);
        expect(vh2!.getName()).toBe('Field2');       
    });

    test('Name added twice replaces', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        testItem.static('Field1', 'Test');
        expect(() => testItem.static('Field1', 'CHANGED')).not.toThrow();
        let vh1 = vm.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(StaticValueHost);
        expect(vh1!.getName()).toBe('Field1');       
        expect(vh1!.getDataType()).toBe('CHANGED');
    });


    test('Null name throws', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        expect(() => testItem.static(null!)).toThrow('arg1');
    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        expect(() => testItem.static(100 as any)).toThrow('pass');
    });
});


describe('calc()', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): CalculationHandlerResult {
        return 1;
    }    
    test('Valid name, null data type and defined vhConfig. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.calc('Field1', null, calcFnForTests);
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);
        let vh = vm.getValueHost('Field1');
        expect(vh).toBeInstanceOf(CalcValueHost);
        expect(vh!.getName()).toBe('Field1');
    });

    test('Valid name, data type assigned. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.calc('Field1', 'Test', calcFnForTests);
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);
        let vh = vm.getValueHost('Field1');
        expect(vh).toBeInstanceOf(CalcValueHost);
        expect(vh!.getName()).toBe('Field1');
        expect(vh!.getDataType()).toBe('Test');        
    });

    test('Null function throws', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        expect(() => testItem.calc('Field1', null, null!)).toThrow(); 
    });

    test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        let result = testItem.calc({ name: 'Field1', dataType: 'Test', calcFn: calcFnForTests });
        expect(result).toBeInstanceOf(ValueHostsInstanceBuilder);

        let vh = vm.getValueHost('Field1');
        expect(vh).toBeInstanceOf(CalcValueHost);
        expect(vh!.getName()).toBe('Field1');
        expect(vh!.getDataType()).toBe('Test');
    });

    test('Null name throws', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        expect(() => testItem.calc(null!)).toThrow('arg1');
    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = createValueHostsManager();
        let testItem = new ValueHostsInstanceBuilder(vm);
        expect(() => testItem.calc(100 as any)).toThrow('pass');
    });
});