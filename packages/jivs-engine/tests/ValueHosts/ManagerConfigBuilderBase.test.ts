import { RequireTextConditionConfig, RegExpConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";
import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostsManager, ValueHostsManagerConfig } from "../../src/Interfaces/ValueHostsManager";
import { IValueHostsServices } from "../../src/Interfaces/ValueHostsServices";
import { CodingError } from "../../src/Utilities/ErrorHandling";
import {
    FluentValidatorBuilder, FluentConditionBuilder, FluentValidatorConfig,
    finishFluentValidatorBuilder, finishFluentConditionBuilder, ValueHostsManagerStartFluent
} from "../../src/ValueHosts/Fluent";
import { ManagerConfigBuilderBase } from "../../src/ValueHosts/ManagerConfigBuilderBase";
import { MockValidationServices } from "../TestSupport/mocks";

function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}

class TestManagerConfigBuilderBase extends ManagerConfigBuilderBase<ValueHostsManagerConfig>
{
    protected createFluent(): ValueHostsManagerStartFluent {
        return new ValueHostsManagerStartFluent(this.destinationValueHostConfigs(), this.services);
    }

    public get publicify_services(): IValueHostsServices
    {   
        return super.services;
    }

    public publicify_destinationValueHostConfigs(): Array<ValueHostConfig>
    {
        return super.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValueHostsManagerConfig
    {
        return super.baseConfig;
    }
    public get publicify_overrideValueHostConfigs(): Array<Array<ValueHostConfig>>
    {
        return super.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void
    {
        super.addOverride();
    }
    
}

describe('ManagerConfigBuilderBase constructor', () => {
    test('Initial setup with vmConfig successful', () => {
        let testItem = createVMConfig();
        let builder = new TestManagerConfigBuilderBase(testItem);
        expect(builder.publicify_baseConfig).toBe(testItem);
        expect(builder.publicify_overrideValueHostConfigs).toEqual([]);
        expect(builder.publicify_destinationValueHostConfigs()).toBe(testItem.valueHostConfigs);
    });
    test('Initial setup with services successful', () => {
        let services = new MockValidationServices(false, false);
        let builder = new TestManagerConfigBuilderBase(services);
        expect(builder.publicify_baseConfig).not.toBeUndefined();
        expect(builder.publicify_baseConfig.services).toBe(services);
        expect(builder.publicify_overrideValueHostConfigs).toEqual([]);
        expect(builder.publicify_destinationValueHostConfigs()).toBe(builder.publicify_baseConfig.valueHostConfigs);
    });
    test('vmConfig with valueHostConfigs = null gets reassigned to []', () => {
        let testItem = createVMConfig();
        testItem.valueHostConfigs = null as any;
        let builder = new TestManagerConfigBuilderBase(testItem);
        expect(testItem.valueHostConfigs).toEqual([]);
    });
    test('vmConfig with valueHostConfigs that contains 1 InputValueHost retains that value', () => {
        let testItem = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }
        ];
        testItem.valueHostConfigs.push(valueHostsConfigs[0]);
        let builder = new TestManagerConfigBuilderBase(testItem);
        expect(testItem.valueHostConfigs).toEqual(valueHostsConfigs);
    });
    test('services supplied as parameter creates a vmConfig with services', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new TestManagerConfigBuilderBase(services);
        expect(testItem.publicify_destinationValueHostConfigs()).not.toBeNull();
        expect(testItem.publicify_services).toBe(services);
        expect(testItem.publicify_destinationValueHostConfigs()).toEqual([]);
    });    
    test('null parameter throws', () => {
        expect(() => new TestManagerConfigBuilderBase(null!)).toThrow(CodingError); 
    });
    test('Invalid value in parameter throws', () => {
        expect(() => new TestManagerConfigBuilderBase('abc' as any)).toThrow('parameter value'); 
    });
});
describe('dispose', () => {
    test('With no overrides', () => {
        let vmConfig = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }
        ];
        vmConfig.valueHostConfigs.push(valueHostsConfigs[0]);
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.dispose();
        expect(testItem.publicify_baseConfig).toBeUndefined();
    });    
    test('With an override', () => {
        let vmConfig = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }
        ];
        vmConfig.valueHostConfigs.push(valueHostsConfigs[0]);
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.publicify_addOverride();
        testItem.dispose();
        expect(testItem.publicify_baseConfig).toBeUndefined();
    });        
});
describe('addOverride', () => {
    test('One call adds one and destinationConfig points to it', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.publicify_addOverride();
        expect(testItem.publicify_baseConfig).toBe(vmConfig);
        expect(testItem.publicify_overrideValueHostConfigs.length).toBe(1);
        expect(testItem.publicify_destinationValueHostConfigs()).toBe(testItem.publicify_overrideValueHostConfigs[0]);
    });
    test('Twos call adds two and destinationConfig points to the last', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.publicify_addOverride();
        testItem.publicify_addOverride();
        expect(testItem.publicify_baseConfig).toBe(vmConfig);
        expect(testItem.publicify_overrideValueHostConfigs.length).toBe(2);
        expect(testItem.publicify_destinationValueHostConfigs()).toBe(testItem.publicify_overrideValueHostConfigs[1]);
    });    
});
describe('complete', () => {
    test('Using service, with no valueHosts or overrides returns vmConfig with 0 valueHostConfigs, plus disposal checks', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new TestManagerConfigBuilderBase(services);
        let result = testItem.complete();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });
    test('Using VMConfig, with no valueHosts or overrides returns vmConfig with 0 valueHostConfigs, plus disposal checks', () => {
        let testItem = new TestManagerConfigBuilderBase(createVMConfig());
        let result = testItem.complete();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });    
    test('Using service, add 1 valueHost but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new TestManagerConfigBuilderBase(services);
        testItem.static('Field1');
        let result = testItem.complete();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        }]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });    
    test('Using VMConfig, add 1 valueHost but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let testItem = new TestManagerConfigBuilderBase(createVMConfig());
        testItem.static('Field1');
        let result = testItem.complete();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        }]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    }); 
    test('Using VMConfig that already has 1 value, add 0 valueHosts but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs.push({
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        });
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        let result = testItem.complete();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        }]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });   
    test('Using VMConfig that already has 1 value, add 1 valueHosts but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs.push({
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        });
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static('Field2');
        let result = testItem.complete();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        },
        {
            valueHostType: ValueHostType.Static,
            name: 'Field2'
        }]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });       
});

describe('build(vmConfig).static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        }]);
    });

    test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1', 'Test');
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test'
        }]);
    });

    test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1');
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        }]);
    });

    test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        }]);
    });

    test('Use the 2 parameter API: name + config. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1', { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        }]);
    });
    test('Use the 2 parameter API: name + config, except pass something other than a string or object into the second parameter. Throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        expect(() => testItem.static('Field1', false as any)).toThrow(/Second parameter/);
        expect(() => testItem.static('Field1', 10 as any)).toThrow(/Second parameter/);
        expect(() => testItem.static('Field1', false as any)).toThrow(/Second parameter/);        
    });    
    test('Add two differently named StaticValueHostConfigs creates two entries in vmConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1').static('Field2');
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        },
        {
            valueHostType: ValueHostType.Static,
            name: 'Field2',
        }]);
    });

    test('Valid name but added twice throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1');
        expect(() => testItem.static('Field1')).toThrow(/already defined/);
    });


    test('Null name throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        expect(() => testItem.static(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
                
        expect(() => testItem.static(100 as any)).toThrow('pass');
    });
});
describe('build(vmConfig).calc', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
        return 1;
    }
    test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let builder = new TestManagerConfigBuilderBase(vmConfig);
        let testItem = builder.calc('Field1', null, calcFnForTests);
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        }]);
    });
    test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let builder = new TestManagerConfigBuilderBase(vmConfig);
        let testItem = builder.calc('Field1', 'Test', calcFnForTests);
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            calcFn: calcFnForTests
        }]);
    });
    test('Null function throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
        
        expect(() => testItem.calc('Field1', 'Test', null!)).toThrow();

    });
    test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let builder = new TestManagerConfigBuilderBase(vmConfig);
                
        let testItem = builder.calc({ name: 'Field1', dataType: 'Test', label: 'Field 1', calcFn: calcFnForTests });
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            calcFn: calcFnForTests
        }]);
    });
    test('Null name throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
                
        expect(() => testItem.calc(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestManagerConfigBuilderBase(vmConfig);
                
        expect(() => testItem.calc(100 as any)).toThrow('pass');
    });
});


// Test cases for creating fluent functions...
function testChainRequireText_Val(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig
): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this, ConditionType.RequireText, conditionConfig, errorMessage, validatorParameters);
}
function testChainRequireText_Cond(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>
): FluentConditionBuilder {
    return finishFluentConditionBuilder(this, ConditionType.RequireText, conditionConfig, 'valueHostName');

}

function testChainRegExp_Val(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig
): FluentValidatorBuilder {

    return finishFluentValidatorBuilder(this, ConditionType.RegExp, conditionConfig,
        errorMessage, validatorParameters);
}
function testChainRegExp_Cond(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>): FluentConditionBuilder {

    return finishFluentConditionBuilder(this, ConditionType.RegExp, conditionConfig, 'valueHostName');
}
// interface that extends the class FluentValidatorBuilder
declare module './../../src/ValueHosts/Fluent'
{
    export interface FluentValidatorBuilder {
        testChainRequireText(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig
        ): FluentValidatorBuilder;
        testChainRegExp(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig
        ): FluentValidatorBuilder;
    }
    export interface FluentConditionBuilder {
        testChainRequireText(conditionConfig:
            Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>
        ): FluentConditionBuilder;
        testChainRegExp(conditionConfig:
            Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>
        ): FluentConditionBuilder;
    }
}

export function ensureFluentTestConditions(): void {
    //  Make JavaScript associate the function with the class.
    FluentValidatorBuilder.prototype.testChainRequireText = testChainRequireText_Val;
    FluentValidatorBuilder.prototype.testChainRegExp = testChainRegExp_Val;
    FluentConditionBuilder.prototype.testChainRequireText = testChainRequireText_Cond;
    FluentConditionBuilder.prototype.testChainRegExp = testChainRegExp_Cond;
}
