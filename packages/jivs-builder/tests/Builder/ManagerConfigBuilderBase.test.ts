import { BuildersFactoryInstaller } from './../../src/Services/BuildersFactoryInstaller';
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { ICalcValueHost } from "@plblum/jivs-engine/build/Interfaces/CalcValueHost";
import { SimpleValueType } from "@plblum/jivs-engine/build/Interfaces/DataTypeConverterService";
import { LoggingLevel } from "@plblum/jivs-engine/build/Interfaces/LoggerService";
import { IValueHostsManager, ValueHostsManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { IJivsServices } from "@plblum/jivs-engine/build/Interfaces/JivsServices";
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { ValueHostType } from "@plblum/jivs-engine/build/Interfaces/ValueHostFactory";
import { CapturingLogger } from "@plblum/jivs-engine/build/Support/CapturingLogger";
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { CodingError } from "@plblum/jivs-engine/build/Utilities/ErrorHandling";
import { ManagerConfigBuilderBase } from "../../src/Builder/ManagerConfigBuilderBase";
import { ValueHostsManagerConfigBuilder } from "../../src/Builder/ValueHostsManagerConfigBuilder";
import {
    ValidatableValueHostConfigBuilder,
    ValueHostConfigBuilder
} from "../../src/Builder/ValueHostConfigBuilder";

function createVMConfig(): ValueHostsManagerConfig {
    let vmConfig: ValueHostsManagerConfig = {
        services: createJivsServicesForTesting(),
        valueHostConfigs: []
    };
    vmConfig.services.loggerService = new CapturingLogger(LoggingLevel.Debug, vmConfig.services.loggerService);
    return vmConfig;
}

class TestValueHostManagerConfigBuilderBase extends ManagerConfigBuilderBase<ValueHostsManagerConfig>
{
    protected createValueHostBuilder(): ValueHostConfigBuilder {
        return new ValueHostConfigBuilder(this.destinationValueHostConfigs(), this.services);
    }

    public get publicify_services(): IJivsServices
    {   
        return this.services;
    }

    public publicify_destinationValueHostConfigs(): Array<ValueHostConfig>
    {
        return this.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValueHostsManagerConfig
    {
        return this.baseConfig;
    }
    public get publicify_overrideValueHostConfigs(): Array<Array<ValueHostConfig>>
    {
        return this.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void
    {
        super.addOverride();
    }
    
}
class TestValueHostsManagerConfigBuilderBase extends ValueHostsManagerConfigBuilder
{
    protected createValueHostBuilder(): ValidatableValueHostConfigBuilder {
        return new ValidatableValueHostConfigBuilder(this.destinationValueHostConfigs(), this.services);
    }

    // public publicify_setupValueHostToCombine(valueHostName: ValueHostName, errorCode: string):{
    //     vhc: ValidatorsValueHostBaseConfig,
    //     vc: ValidatorConfig
    // } {
    //     return super.setupValueHostToCombine(valueHostName, errorCode);
    // }

    // public publicify_combineWithValidatorConfig(
    //     destinationOfCondition: ValidatorConfig,
    //     arg2: CombineUsingCondition | ((combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => void),
    //     arg3?: (combiningBuilder: IStartConditionBuilder) => void): void
    // {
    //     super.combineWithValidatorConfig(destinationOfCondition, arg2, arg3);
    // }

    // public publicify_replaceConditionWith(destinationOfCondition: ValidatorConfig, sourceOfConditionConfig: ConditionConfig | ((builder: IStartConditionBuilder) => void)): void
    // {
    //     super.replaceConditionWith(destinationOfCondition, sourceOfConditionConfig);
    // }    

    public get publicify_services(): IJivsServices
    {   
        return this.services;
    }

    public publicify_destinationValueHostConfigs(): Array<ValueHostConfig>
    {
        return this.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValueHostsManagerConfig
    {
        return this.baseConfig;
    }
    public get publicify_overrideValueHostConfigs(): Array<Array<ValueHostConfig>>
    {
        return this.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void
    {
        super.addOverride();
    }
    // public field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): IValidatorBuilder {
    //     return this.addValidatorsValueHost<FieldValueHostConfig>(ValueHostType.Field, valueHostName, dataType, parameters);
    // }

    public publicify_getExistingValueHostConfig(valueHostName: string, throwWhenNotFound: boolean): ValueHostConfig | null {
        return this.getExistingValueHostConfig(valueHostName, throwWhenNotFound);
    }

}

beforeAll(() => {
    new BuildersFactoryInstaller();  // this will install buildersFactory on JivsServices.prototype
});

describe('ManagerConfigBuilderBase constructor', () => {
    test('Initial setup with vmConfig successful', () => {
        let testItem = createVMConfig();
        let builder = new TestValueHostManagerConfigBuilderBase(testItem);
        expect(builder.publicify_baseConfig).toBe(testItem);
        expect(builder.publicify_overrideValueHostConfigs).toEqual([]);
        expect(builder.publicify_destinationValueHostConfigs()).toBe(testItem.valueHostConfigs);
    });
    test('Initial setup with services successful', () => {
        let services = createJivsServicesForTesting();
        let builder = new TestValueHostManagerConfigBuilderBase(services);
        expect(builder.publicify_baseConfig).not.toBeUndefined();
        expect(builder.publicify_baseConfig.services).toBe(services);
        expect(builder.publicify_overrideValueHostConfigs).toEqual([]);
        expect(builder.publicify_destinationValueHostConfigs()).toBe(builder.publicify_baseConfig.valueHostConfigs);
    });
    test('vmConfig with valueHostConfigs = null gets reassigned to []', () => {
        let testItem = createVMConfig();
        testItem.valueHostConfigs = null as any;
        let builder = new TestValueHostManagerConfigBuilderBase(testItem);
        expect(testItem.valueHostConfigs).toEqual([]);
    });
    test('vmConfig with valueHostConfigs that contains 1 FieldValueHost retains that value', () => {
        let testItem = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }
        ];
        testItem.valueHostConfigs.push(valueHostsConfigs[0]);
        let builder = new TestValueHostManagerConfigBuilderBase(testItem);
        expect(testItem.valueHostConfigs).toEqual(valueHostsConfigs);
    });
    test('services supplied as parameter creates a vmConfig with services', () => {
        let services = createJivsServicesForTesting();
        let testItem = new TestValueHostManagerConfigBuilderBase(services);
        expect(testItem.publicify_destinationValueHostConfigs()).not.toBeNull();
        expect(testItem.publicify_services).toBe(services);
        expect(testItem.publicify_destinationValueHostConfigs()).toEqual([]);
    });    
    test('null parameter throws', () => {
        expect(() => new TestValueHostManagerConfigBuilderBase(null!)).toThrow(CodingError); 
    });
    test('Invalid value in parameter throws', () => {
        expect(() => new TestValueHostManagerConfigBuilderBase('abc' as any)).toThrow('parameter value'); 
    });
});
describe('dispose', () => {
    test('With no overrides', () => {
        let vmConfig = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }
        ];
        vmConfig.valueHostConfigs.push(valueHostsConfigs[0]);
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.dispose();
        expect(testItem.publicify_baseConfig).toBeUndefined();
    });    
    test('With an override', () => {
        let vmConfig = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }
        ];
        vmConfig.valueHostConfigs.push(valueHostsConfigs[0]);
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.publicify_addOverride();
        testItem.dispose();
        expect(testItem.publicify_baseConfig).toBeUndefined();
    });        
});
describe('addOverride', () => {
    test('One call adds one and destinationConfig points to it', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.publicify_addOverride();
        expect(testItem.publicify_baseConfig).toBe(vmConfig);
        expect(testItem.publicify_overrideValueHostConfigs.length).toBe(1);
        expect(testItem.publicify_destinationValueHostConfigs()).toBe(testItem.publicify_overrideValueHostConfigs[0]);
    });
    test('Twos call adds two and destinationConfig points to the last', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.publicify_addOverride();
        testItem.publicify_addOverride();
        expect(testItem.publicify_baseConfig).toBe(vmConfig);
        expect(testItem.publicify_overrideValueHostConfigs.length).toBe(2);
        expect(testItem.publicify_destinationValueHostConfigs()).toBe(testItem.publicify_overrideValueHostConfigs[1]);
    });    
});
describe('complete', () => {
    test('Using service, with no valueHosts or overrides returns vmConfig with 0 valueHostConfigs, plus disposal checks', () => {
        let services = createJivsServicesForTesting();
        let testItem = new TestValueHostManagerConfigBuilderBase(services);
        let result = testItem.complete();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });
    test('Using VMConfig, with no valueHosts or overrides returns vmConfig with 0 valueHostConfigs, plus disposal checks', () => {
        let testItem = new TestValueHostManagerConfigBuilderBase(createVMConfig());
        let result = testItem.complete();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });    
    test('Using service, add 1 valueHost but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let services = createJivsServicesForTesting();
        let testItem = new TestValueHostManagerConfigBuilderBase(services);
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
        let testItem = new TestValueHostManagerConfigBuilderBase(createVMConfig());
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
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
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
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
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
describe('snapshot', () => {
    test('Using service, with no valueHosts or overrides returns vmConfig with 0 valueHostConfigs, plus disposal checks', () => {
        let services = createJivsServicesForTesting();
        let testItem = new TestValueHostManagerConfigBuilderBase(services);
        let result = testItem.snapshot();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([]);
        expect(testItem.publicify_baseConfig).toBeTruthy();
    });
    test('Using VMConfig, with no valueHosts or overrides returns vmConfig with 0 valueHostConfigs, plus disposal checks', () => {
        let testItem = new TestValueHostManagerConfigBuilderBase(createVMConfig());
        let result = testItem.snapshot();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([]);
        expect(testItem.publicify_baseConfig).toBeTruthy();
    });    
    test('Using service, add 1 valueHost but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let services = createJivsServicesForTesting();
        let testItem = new TestValueHostManagerConfigBuilderBase(services);
        testItem.static('Field1');
        let result = testItem.snapshot();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        }]);
        expect(testItem.publicify_baseConfig).toBeTruthy();
    });    
    test('Using service, override and add a new field', () => {
        let services = createJivsServicesForTesting();
        let testItem = new TestValueHostManagerConfigBuilderBase(services);
        testItem.static('Field1');
        testItem.publicify_addOverride();
        testItem.static('Field2');
        let result = testItem.snapshot();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
            },
            {
                valueHostType: ValueHostType.Static,
                name: 'Field2'
            
        }]);
        expect(testItem.publicify_baseConfig).toBeTruthy();
    });        
    test('Using VMConfig, add 1 valueHost but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let testItem = new TestValueHostManagerConfigBuilderBase(createVMConfig());
        testItem.static('Field1');
        let result = testItem.snapshot();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        }]);
        expect(testItem.publicify_baseConfig).toBeTruthy();
    }); 
    test('Using VMConfig that already has 1 value, add 0 valueHosts but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs.push({
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        });
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        let result = testItem.snapshot();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        }]);
        expect(testItem.publicify_baseConfig).toBeTruthy();
    });   
    test('Using VMConfig that already has 1 value, add 1 valueHosts but no overrides returns vmConfig with 1 valueHostConfigs', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs.push({
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        });
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.static('Field2');
        let result = testItem.snapshot();
        expect(result.services).not.toBeNull();
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1'
        },
        {
            valueHostType: ValueHostType.Static,
            name: 'Field2'
        }]);
        expect(testItem.publicify_baseConfig).toBeTruthy();
    });       
});

describe('build(vmConfig).static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            label: 'Field 1'
        }]);
    });

    test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1', 'Test');
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test'
        }]);
    });

    test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1');
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        }]);
    });

    test('Pass in a StaticValueHostConfig. Adds it plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.static({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        }]);
    });

    test('Use the 2 parameter API: name + config. Adds it plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
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
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        expect(() => testItem.static('Field1', false as any)).toThrow(/Second parameter/);
        expect(() => testItem.static('Field1', 10 as any)).toThrow(/Second parameter/);
        expect(() => testItem.static('Field1', false as any)).toThrow(/Second parameter/);        
    });    
    test('Add two differently named StaticValueHostConfigs creates two entries in vmConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
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
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1');
        expect(() => testItem.static('Field1')).toThrow(/already defined/);
    });


    test('Null name throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        expect(() => testItem.static(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
                
        expect(() => testItem.static(100 as any)).toThrow('pass');
    });
});
describe('build(vmConfig).calc', () => {
    function calcFnForTests(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
        return 1;
    }
    test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();

        let builder = new TestValueHostManagerConfigBuilderBase(vmConfig);
        let testItem = builder.calc('Field1', null, calcFnForTests);
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Calc,
            name: 'Field1',
            calcFn: calcFnForTests
        }]);
    });
    test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();

        let builder = new TestValueHostManagerConfigBuilderBase(vmConfig);
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
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        
        expect(() => testItem.calc('Field1', 'Test', null!)).toThrow();

    });
    test('Pass in a CalcValueHostConfig. Adds it plus type to ValueHostsManagerConfig', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostManagerConfigBuilderBase(vmConfig);
                
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
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
                
        expect(() => testItem.calc(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
                
        expect(() => testItem.calc(100 as any)).toThrow('pass');
    });
});

// describe('ManagerConfigBuilderBase.setupValueHostToCombine', () => {
//     function setup(includeOverrideData: boolean): TestValueHostsManagerConfigBuilderBase {
//         let vmConfig = createVMConfig();

//         let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);

//         builder.field('Field1');
//         builder.field('Field2').regExp(/abc/);
//         builder.field('Field3').requireText({ errorCode: 'RequireText1' }).regExp(/def/, { errorCode: 'RegExp1' });
//         // same as Field3 to show it always gets the first found
//         builder.field('Field4').requireText({ errorCode: 'RequireText1' }).requireText({ errorCode: 'RequireText2' });
//         if (includeOverrideData) {
//             builder.publicify_addOverride();
//             builder.field('Field1').requireText();
//             builder.field('Field2').regExp(/abc_alt/, { errorCode: 'RegExp1_alt' });
//         }
//         return builder;
//     }
//     function findValueHostName(name: string, vhc: Array<ValueHostConfig>): ValueHostConfig | null {
//         return vhc.find(v => v.name === name) ?? null;
//     }
//     // when found in earlier array of ValueHostConfigs, the ValidatorConfig is newly generated and added to the latest array of ValueHostConfigs
//     // expects "earlier" to be the first found in the array of ValueHostConfigs, baseConfig
//     function testFoundInEarlier(builder: TestValueHostsManagerConfigBuilderBase,
//         valueHostName: ValueHostName, errorCode: string,
//         expectedValidatorConfig: ValidatorConfig): void {
                
//         // call before setup, which can modify the source config arrays
//         let original = findValueHostName(valueHostName, builder.publicify_baseConfig.valueHostConfigs);

//         let result = builder.publicify_setupValueHostToCombine(valueHostName, errorCode);
//         expect(result).toBeTruthy();
//         expect(result.vhc.name).toEqual(valueHostName);
//         expect(result.vhc.validatorConfigs).toContain(result.vc);
//         expect(result.vc).toEqual(expectedValidatorConfig);
//         // prove vhc is a clone
//         expect(original).not.toBe(result.vhc);
//         expect(original).toEqual(result.vhc);

//     }
//     // when found latest array of ValueHostConfigs, the ValidatorConfig is the original object
//     // expects "latest" to be after creating an entry in overriddenValueHostConfigs
//     function testFoundInLatest(builder: TestValueHostsManagerConfigBuilderBase,
//         valueHostName: ValueHostName, errorCode: string,
//             expectedValidatorConfig: ValidatorConfig): void {
//         // call before setup, which can modify the source config arrays
//         let original = findValueHostName(valueHostName, builder.publicify_destinationValueHostConfigs());

//         let result = builder.publicify_setupValueHostToCombine(valueHostName, errorCode);
//         expect(result).toBeTruthy();
//         expect(result.vhc.name).toEqual(valueHostName);
//         expect(result.vhc.validatorConfigs).toContain(result.vc);
//         expect(result.vc).toEqual(expectedValidatorConfig);
//         // prove not cloned
//         expect(original).toBe(result.vhc);
//     }    
//     function testValueHostNotFoundThrows(builder: TestValueHostsManagerConfigBuilderBase,
//         valueHostName: ValueHostName, errorCode: string): void {
//         expect(() => builder.publicify_setupValueHostToCombine(valueHostName, errorCode)).toThrow(/not defined/);
//     }
//     function testErrorCodeNotFoundThrows(builder: TestValueHostsManagerConfigBuilderBase,
//         valueHostName: ValueHostName, errorCode: string): void {
//         expect(() => builder.publicify_setupValueHostToCombine(valueHostName, errorCode)).toThrow(/validator with error code/);
//     }


//     test('With valueHosts in the initial config and empty overridden ValueHosts, finds the correct validatorConfig and valueHostConfig', () => {
//         // configuration is shown in setup function
//         let testItem = setup(false);
//         testItem.publicify_addOverride();
//         testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);

//         testItem = setup(false);
//         testItem.publicify_addOverride();        
//         testFoundInEarlier(testItem, 'Field2', ConditionType.RegExp, <ValidatorConfig>{
//             conditionConfig: {
//                 conditionType: ConditionType.RegExp,
//                 expression: /abc/
//             }
//         });

//         testItem = setup(false);
//         testItem.publicify_addOverride();        
//         testFoundInEarlier(testItem, 'Field3', 'RequireText1', <ValidatorConfig>{
//             errorCode: 'RequireText1',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
//         testItem = setup(false);
//         testItem.publicify_addOverride();        
//         testFoundInEarlier(testItem, 'Field3', 'RegExp1', <ValidatorConfig>{
//             errorCode: 'RegExp1',
//             conditionConfig: {
//                 conditionType: ConditionType.RegExp,
//                 expression: /def/
//             }
//         });
//         testItem = setup(false);
//         testItem.publicify_addOverride();        
//         testFoundInEarlier(testItem, 'Field4', 'RequireText1', <ValidatorConfig>{
//             errorCode: 'RequireText1',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
//         testItem = setup(false);
//         testItem.publicify_addOverride();        
//         testFoundInEarlier(testItem, 'Field4', 'RequireText2', <ValidatorConfig>{
//             errorCode: 'RequireText2',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
       
//     });
//     test('With valueHosts in the initial config and nothing overriden, never finds a match because cannot modify the initial config', () => {
//         // configuration is shown in setup function
//         let testItem = setup(false);
//         testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);

//         testItem = setup(false);     
//         testFoundInLatest(testItem, 'Field2', ConditionType.RegExp, <ValidatorConfig>{
//             conditionConfig: {
//                 conditionType: ConditionType.RegExp,
//                 expression: /abc/
//             }
//         });

//         testItem = setup(false);      
//         testFoundInLatest(testItem, 'Field3', 'RequireText1', <ValidatorConfig>{
//             errorCode: 'RequireText1',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
//         testItem = setup(false);       
//         testFoundInLatest(testItem, 'Field3', 'RegExp1', <ValidatorConfig>{
//             errorCode: 'RegExp1',
//             conditionConfig: {
//                 conditionType: ConditionType.RegExp,
//                 expression: /def/
//             }
//         });
//         testItem = setup(false);     
//         testFoundInLatest(testItem, 'Field4', 'RequireText1', <ValidatorConfig>{
//             errorCode: 'RequireText1',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
//         testItem = setup(false);      
//         testFoundInLatest(testItem, 'Field4', 'RequireText2', <ValidatorConfig>{
//             errorCode: 'RequireText2',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
       
//     });    
//     test('With valueHosts in the initial config and in overridden ValueHosts, finds the correct validatorConfig and valueHostConfig', () => {
//         // configuration is shown in setup function
//         let testItem = setup(true);
//         testFoundInLatest(testItem, 'Field1', ConditionType.RequireText, <ValidatorConfig>{
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
//         testItem = setup(true);
//         testFoundInLatest(testItem, 'Field2', 'RegExp1_alt', <ValidatorConfig>{
//             errorCode: 'RegExp1_alt',
//             conditionConfig: {
//                 conditionType: ConditionType.RegExp,
//                 expression: /abc_alt/
//             }
//         });        
//         testItem = setup(true);
//         testFoundInEarlier(testItem, 'Field3', 'RequireText1', <ValidatorConfig>{
//             errorCode: 'RequireText1',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
//         testItem = setup(true);
//         testFoundInEarlier(testItem, 'Field3', 'RegExp1', <ValidatorConfig>{
//             errorCode: 'RegExp1',
//             conditionConfig: {
//                 conditionType: ConditionType.RegExp,
//                 expression: /def/
//             }
//         });
//         testItem = setup(true);
//         testFoundInEarlier(testItem, 'Field4', 'RequireText1', <ValidatorConfig>{
//             errorCode: 'RequireText1',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
//         testItem = setup(true);
//         testFoundInEarlier(testItem, 'Field4', 'RequireText2', <ValidatorConfig>{
//             errorCode: 'RequireText2',
//             conditionConfig: {
//                 conditionType: ConditionType.RequireText
//             }
//         });
       
//     });

//     test('The ValueHostName is unknown throws and no valueHosts defined', () => {
//         let testItem = new TestValueHostsManagerConfigBuilderBase(createVMConfig());   // has no valueHosts
//         testValueHostNotFoundThrows(testItem, 'Field2', ConditionType.RegExp);        
//     });
//     test('The ValueHostName is unknown throws and different named valueHost defined', () => {
//         let testItem = new TestValueHostsManagerConfigBuilderBase(createVMConfig());
//         testItem.field('Field1');
//         testValueHostNotFoundThrows(testItem, 'Field2', ConditionType.RegExp);        
//     });
//     test('The ValueHostName is null throws', () => {
//         let testItem = new TestValueHostsManagerConfigBuilderBase(createVMConfig());   // has no valueHosts
//         expect(()=> testItem.publicify_setupValueHostToCombine(null!, ConditionType.RegExp)).toThrow(/valueHostName/);
//     });

//     test('The errorCode is unknown throws when no validators on valuehost', () => {
//         let testItem = new TestValueHostsManagerConfigBuilderBase(createVMConfig());
//         testItem.field('Field1');
//         testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);        
//     });
//     test('The errorCode is unknown throws when different validator on valuehost', () => {
//         let testItem = new TestValueHostsManagerConfigBuilderBase(createVMConfig());
//         testItem.field('Field1').requireText();
//         testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);        
//     });    
//     test('The errorCode is null throws', () => {
//         let testItem = new TestValueHostsManagerConfigBuilderBase(createVMConfig());
//         testItem.field('Field1').requireText();
//         expect(()=> testItem.publicify_setupValueHostToCombine('Field1', null!)).toThrow(/errorCode/);       
//     });
// });

describe('whenToEnable', ()=> {
    // existing valueHostName returns the StartConditionWithOneChildBuilder
    test('With a known valueHostName, returns the same instance', () => {
        let vmConfig = createVMConfig();
        let logger = vmConfig.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        let result = builder.whenToEnable('Field1', (builder)=>builder.parentValue().requireText());
        expect(result).toBe(builder);
        // check log for the message about adding the enabler to the valueHost
        expect(logger.findMessage('whenToEnable', LoggingLevel.Debug)).toBeTruthy();
    });
    // same but call addOverride() first
    test('With a known valueHostName and addOverride() called, returns the StartConditionWithOneChildBuilder', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.publicify_addOverride();
        let result = builder.whenToEnable('Field1', (builder)=>builder.parentValue().requireText());
        expect(result).toBe(builder);
    });
    test('With an unknown valueHostName, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        expect(() => builder.whenToEnable('Field2', (builder)=>builder)).toThrow(/not defined/);
    });
    // build with fluent RequireText condition
    test('With a known valueHostName and child using parentValue().requireText(), updates enablerConfig', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.whenToEnable('Field1', 
            (builder)=>builder.parentValue().requireText());
        let expectedConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [],
            enablerConfig: {
                conditionType: ConditionType.RequireText
            }
        };
        expect(vmConfig.valueHostConfigs[0]).toEqual(expectedConfig);   
    });
    test('With a known valueHostName and child using fieldValue().requireText(), updates enablerConfig', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.whenToEnable('Field1', 
            (builder)=>builder.fieldValue('Field2').requireText());
        let expectedConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [],
            enablerConfig: {
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            }
        };
        expect(vmConfig.valueHostConfigs[0]).toEqual(expectedConfig);   
    });
    // same using conditionConfig to supply a predefined config
    test('With a known valueHostName and child using conditionConfig(), updates enablerConfig', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.whenToEnable('Field1', 
            (builder)=>builder.conditionConfig({
                conditionType: ConditionType.RequireText
            }));
        let expectedConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [],
            enablerConfig: {
                conditionType: ConditionType.RequireText
            }
        };
        expect(vmConfig.valueHostConfigs[0]).toEqual(expectedConfig);   
    });
    // when the child function does not add to its builder, there is no condition to use. Throws
    test('With a known valueHostName and child does not add to builder, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        expect(() => builder.whenToEnable('Field1', 
            (childBuilder)=>childBuilder)).toThrow(/Child builder/);
    });
});

describe('getExistingValueHostConfig() using publicify_getExistingValueHostConfig()', () => {
    test('With a known valueHostName, returns the ValueHostConfig', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.field('Field2');
        builder.publicify_addOverride();    // required to find the valueHostConfig in the overriddenValueHostConfigs array
        let result1 = builder.publicify_getExistingValueHostConfig('Field1', true);
        expect(result1).toBeTruthy();
        expect(result1!.name).toEqual('Field1');
        let result2 = builder.publicify_getExistingValueHostConfig('Field2', true);
        expect(result2).toBeTruthy();
        expect(result2!.name).toEqual('Field2');
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('ValueHost name "Field2" is not defined')).toBeFalsy();

    });
    // not found and throwWhenNotFound = true, throws
    test('With an unknown valueHostName and throwWhenNotFound=true, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.field('Field2');
        builder.publicify_addOverride();    // required to find the valueHostConfig in the overriddenValueHostConfigs array
        expect(() => builder.publicify_getExistingValueHostConfig('Field3', true)).toThrow(/not defined/);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('ValueHost name "Field3" is not defined')).toBeTruthy();

    }); 
    // not found and throwWhenNotFound = false, returns null
    test('With an unknown valueHostName and throwWhenNotFound=false, returns null', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.field('Field2');
        builder.publicify_addOverride();    // required to find the valueHostConfig in the overriddenValueHostConfigs array
        let result = builder.publicify_getExistingValueHostConfig('Field3', false);
        expect(result).toBeNull();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('ValueHost name "Field3" is not defined')).toBeTruthy();

    });
    // when addOverride is not used and throwWhenNotFound = true, throws because the valueHostConfig is not in the overriddenValueHostConfigs array
    test('With a known valueHostName but addOverride not used and throwWhenNotFound=true, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.field('Field2');
        expect(() => builder.publicify_getExistingValueHostConfig('Field1', true)).toThrow(/not defined/);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('ValueHost name "Field1" is not defined')).toBeTruthy();

    });
    // when addOverride is not used and throwWhenNotFound = false, returns null because the valueHostConfig is not in the overriddenValueHostConfigs array
    test('With a known valueHostName but addOverride not used and throwWhenNotFound=false, returns null', () => {
        let vmConfig = createVMConfig();
        let builder = new TestValueHostsManagerConfigBuilderBase(vmConfig);
        builder.field('Field1');
        builder.field('Field2');
        let result = builder.publicify_getExistingValueHostConfig('Field1', false);
        expect(result).toBeNull();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('ValueHost name "Field1" is not defined')).toBeTruthy();

    });
});