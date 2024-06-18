import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { CalcValueHostConfig, ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostsManager, ValueHostsManagerConfig } from "../../src/Interfaces/ValueHostsManager";
import { FluentValidatorCollector } from "../../src/ValueHosts/Fluent";
import { InputValueHost } from "../../src/ValueHosts/InputValueHost";
import { StaticValueHost } from "../../src/ValueHosts/StaticValueHost";
import { ValueHostsManagerConfigBuilder } from "../../src/ValueHosts/ValueHostsManagerConfigBuilder";
import { ValueHostsManagerConfigModifier } from "../../src/ValueHosts/ValueHostsManagerConfigModifier";
import { Publicify_ValueHostsManager } from "../TestSupport/Publicify_classes";
import { MockValidationServices } from "../TestSupport/mocks";
function createVMConfig(): ValueHostsManagerConfig {
    let vmConfig: ValueHostsManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}

class Publicify_ValueHostsManagerConfigModifier extends ValueHostsManagerConfigModifier<ValueHostsManagerConfig> {

    constructor(manager: Publicify_ValueHostsManager) {
        super(manager, manager.publicify_valueHostConfigs);
    }
    public publicify_destinationConfig(): ValueHostsManagerConfig {
        return super.destinationConfig();
    }

    public get publicify_baseConfig(): ValueHostsManagerConfig {
        return super.baseConfig;
    }
    public get publicify_overrideConfigs(): Array<ValueHostsManagerConfig> {
        return super.overrideConfigs;
    }

    public publicify_addOverride(): void {
        super.addOverride();
    }

}
describe('static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem = modifier.static('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem = modifier.static('Field1', 'Test');
        expect(testItem).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        let expected = {
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test'
        };
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Name supplied. Adds ValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem = modifier.static('Field1');
        expect(testItem).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        let expected = {
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        };
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Pass in a StaticValueHostConfig alone. Adds it plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem = modifier.static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        let expected = {
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        };
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Add same name twice throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);

        let testItem = modifier.static('Field1');
        expect(() => modifier.static('Field1')).toThrow(/already defined/);
    });
    test('Add 3 statics. All valid and generates 3 ValueHostConfigs in vmConfig', () => {
        let vmConfig = createVMConfig();

        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem1 = modifier.static('Field1').static('Field2').static('Field3');
        expect(testItem1).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        let expected1 = {
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        };

        let expected2 = {
            valueHostType: ValueHostType.Static,
            name: 'Field2'
        };

        let expected3 = {
            valueHostType: ValueHostType.Static,
            name: 'Field3'
        };
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected1);
        expect(vm.getValueHostConfig('Field2')).toEqual(expected2);
        expect(vm.getValueHostConfig('Field3')).toEqual(expected3);
    });
    test('Null name throws', () => {
        let vm = new Publicify_ValueHostsManager(createVMConfig());
        let testItem = new Publicify_ValueHostsManagerConfigModifier(vm);

        expect(() => testItem.static(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = new Publicify_ValueHostsManager(createVMConfig());
        let testItem = new Publicify_ValueHostsManagerConfigModifier(vm);
        expect(() => testItem.static(100 as any)).toThrow('pass');
    });
});

describe('calc()', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
        return 1;
    }
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem = modifier.calc('Field1', null, calcFnForTests);
        expect(testItem).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem = modifier.calc('Field1', 'Test', calcFnForTests);
        expect(testItem).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        let expected = {
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        };
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Pass in a CalcValueHostConfig alone. Adds it plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem = modifier.calc({ name: 'Field1', dataType: 'Test', calcFn: calcFnForTests });
        expect(testItem).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        let expected = {
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        };
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Add same name twice throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);

        let testItem = modifier.calc('Field1', null, calcFnForTests);
        expect(() => modifier.calc('Field1', null, calcFnForTests)).toThrow(/already defined/);
    });
    test('Add 3 statics. All valid and generates 3 ValueHostConfigs in vmConfig', () => {
        let vmConfig = createVMConfig();

        let vm = new Publicify_ValueHostsManager(vmConfig);

        let modifier = new Publicify_ValueHostsManagerConfigModifier(vm);
        let testItem1 = modifier
            .calc('Field1', null, calcFnForTests)
            .calc('Field2', LookupKey.Integer, calcFnForTests)
            .calc('Field3', LookupKey.Number, calcFnForTests);
        expect(testItem1).toBeInstanceOf(Publicify_ValueHostsManagerConfigModifier);
        let expected1 = {
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        };

        let expected2 = {
            valueHostType: ValueHostType.Calc,
            name: 'Field2',
            dataType: LookupKey.Integer,
            calcFn: calcFnForTests
        };

        let expected3 = {
            valueHostType: ValueHostType.Calc,
            name: 'Field3',
            dataType: LookupKey.Number,
            calcFn: calcFnForTests
        };
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected1);
        expect(vm.getValueHostConfig('Field2')).toEqual(expected2);
        expect(vm.getValueHostConfig('Field3')).toEqual(expected3);
    });
    test('Null name throws', () => {
        let vm = new Publicify_ValueHostsManager(createVMConfig());
        let testItem = new Publicify_ValueHostsManagerConfigModifier(vm);

        expect(() => testItem.calc(null!, null, calcFnForTests)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = new Publicify_ValueHostsManager(createVMConfig());
        let testItem = new Publicify_ValueHostsManagerConfigModifier(vm);
        expect(() => testItem.calc(100 as any, null, calcFnForTests)).toThrow('pass');
    });
});
describe('updateCalc', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
        return 1;
    }

    test('With existing CalcValueHost, all values supplied are updated', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.calc('Field1', LookupKey.Integer, calcFnForTests);
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();

        let testItem = modifier.updateCalc('Field1', { dataType: 'TEST', initialValue: '1', label: 'UpdatedLabel', labell10n: 'ULl10n' });
        expect(testItem).toBeInstanceOf(ValueHostsManagerConfigModifier);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'TEST',
            calcFn: calcFnForTests,
            initialValue: '1',
            label: 'UpdatedLabel',
            labell10n: 'ULl10n'
        });
    });
    test('With existing CalcValueHost, supply unwanted properties. They are not applied, but valid ones are.', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.calc('Field1', LookupKey.Integer, calcFnForTests);
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();
        modifier.updateCalc('Field1', <any>{
            name: 'ToIgnore', valueHostType: 'IgnoreType',
            label: 'UpdatedLabel'
        });
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: LookupKey.Integer,
            label: 'UpdatedLabel',
            calcFn: calcFnForTests
        });
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.static('Field1', LookupKey.Integer);
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.updateCalc('Field1', { label: 'UpdatedLabel' })).toThrow(/not type/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();

        expect(() => modifier.updateCalc('Field1', { label: 'UpdatedLabel' })).toThrow(/not defined/);
    });
});

describe('updateStatic', () => {
    test('With existing StaticValueHost, all values supplied are updated', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.static('Field1', LookupKey.Integer, { label: 'Field 1' });
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();

        let testItem = modifier.updateStatic('Field1', { dataType: 'TEST', initialValue: '1', label: 'UpdatedLabel', labell10n: 'ULl10n' });
        expect(testItem).toBeInstanceOf(ValueHostsManagerConfigModifier);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'TEST',
            initialValue: '1',
            label: 'UpdatedLabel',
            labell10n: 'ULl10n'
        });
    });
    test('With existing StaticValueHost, supply unwanted properties. They are not applied, but valid ones are.', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.static('Field1', LookupKey.Integer, { label: 'Field 1' });
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();
        modifier.updateStatic('Field1', <any>{
            name: 'ToIgnore', valueHostType: 'IgnoreType',
            label: 'UpdatedLabel'
        });
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: LookupKey.Integer,
            label: 'UpdatedLabel'
        });
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        builder.calc('Field1', LookupKey.Integer, ()=> 1);
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.updateStatic('Field1', { label: 'UpdatedLabel' })).toThrow(/not type/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new ValueHostsManagerConfigBuilder(vmConfig);
        let vm = new Publicify_ValueHostsManager(builder);
        let modifier = vm.startModifying();

        expect(() => modifier.updateStatic('Field1', { label: 'UpdatedLabel' })).toThrow(/not defined/);
    });
});
