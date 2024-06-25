import { RequireTextConditionConfig, RegExpConditionConfig, AllMatchConditionConfig, AnyMatchConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { enableFluentConditions } from "../../src/Conditions/FluentConditionBuilderExtensions";
import { WhenConditionConfig } from "../../src/Conditions/WhenCondition";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import { ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { ConditionConfig } from "../../src/Interfaces/Conditions";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { PropertyValueHostConfig } from "../../src/Interfaces/PropertyValueHost";
import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { ValidatorConfig } from "../../src/Interfaces/Validator";
import { ValidatorsValueHostBaseConfig } from "../../src/Interfaces/ValidatorsValueHostBase";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostsManager, ValueHostsManagerConfig } from "../../src/Interfaces/ValueHostsManager";
import { IValueHostsServices } from "../../src/Interfaces/ValueHostsServices";
import { CodingError } from "../../src/Utilities/ErrorHandling";
import {
    FluentValidatorBuilder, FluentConditionBuilder, FluentValidatorConfig,
    finishFluentValidatorBuilder, finishFluentConditionBuilder, ValueHostsManagerStartFluent,
    ValidationManagerStartFluent,
    FluentPropertyParameters
} from "../../src/ValueHosts/Fluent";
import { CombineUsingCondition, ManagerConfigBuilderBase, deleteConditionReplacedSymbol, hasConditionBeenReplaced } from "../../src/ValueHosts/ManagerConfigBuilderBase";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { MockValidationServices } from "../TestSupport/mocks";

function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}

class TestValueHostManagerConfigBuilderBase extends ManagerConfigBuilderBase<ValueHostsManagerConfig>
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
class TestValidationManagerConfigBuilderBase extends ManagerConfigBuilderBase<ValidationManagerConfig>
{
    protected createFluent(): ValidationManagerStartFluent {
        return new ValidationManagerStartFluent(this.destinationValueHostConfigs(), this.services);
    }

    public publicify_setupValueHostToCombine(valueHostName: ValueHostName, errorCode: string):{
        vhc: ValidatorsValueHostBaseConfig,
        vc: ValidatorConfig
    } {
        return super.setupValueHostToCombine(valueHostName, errorCode);
    }

    public publicify_combineWithValidatorConfig(
        destinationOfCondition: ValidatorConfig,
        arg2: CombineUsingCondition | ((combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg3?: (combiningBuilder: FluentConditionBuilder) => void): void
    {
        super.combineWithValidatorConfig(destinationOfCondition, arg2, arg3);
    }

    public publicify_replaceConditionWith(destinationOfCondition: ValidatorConfig, sourceOfConditionConfig: ConditionConfig | ((builder: FluentConditionBuilder) => void)): void
    {
        super.replaceConditionWith(destinationOfCondition, sourceOfConditionConfig);
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

    public property(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorBuilder {
        return this.addValidatorsValueHost<PropertyValueHostConfig>(ValueHostType.Property, valueHostName, dataType, parameters);
    }}

describe('ManagerConfigBuilderBase constructor', () => {
    test('Initial setup with vmConfig successful', () => {
        let testItem = createVMConfig();
        let builder = new TestValueHostManagerConfigBuilderBase(testItem);
        expect(builder.publicify_baseConfig).toBe(testItem);
        expect(builder.publicify_overrideValueHostConfigs).toEqual([]);
        expect(builder.publicify_destinationValueHostConfigs()).toBe(testItem.valueHostConfigs);
    });
    test('Initial setup with services successful', () => {
        let services = new MockValidationServices(false, false);
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
    test('vmConfig with valueHostConfigs that contains 1 InputValueHost retains that value', () => {
        let testItem = createVMConfig();
        let valueHostsConfigs: Array<ValueHostConfig> = [
            {
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }
        ];
        testItem.valueHostConfigs.push(valueHostsConfigs[0]);
        let builder = new TestValueHostManagerConfigBuilderBase(testItem);
        expect(testItem.valueHostConfigs).toEqual(valueHostsConfigs);
    });
    test('services supplied as parameter creates a vmConfig with services', () => {
        let services = new MockValidationServices(false, false);
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
                valueHostType: ValueHostType.Input,
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
                valueHostType: ValueHostType.Input,
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
        let services = new MockValidationServices(false, false);
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
        let services = new MockValidationServices(false, false);
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

describe('build(vmConfig).static()', () => {
    test('Valid name, null data type and defined vhConfig. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
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

    test('Valid name, data type assigned. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
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

    test('Valid name. Adds StaticValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValueHostManagerConfigBuilderBase(vmConfig);
        testItem.static('Field1');
        expect(testItem).toBeInstanceOf(ManagerConfigBuilderBase);
        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
        }]);
    });

    test('Pass in a StaticValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
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

    test('Use the 2 parameter API: name + config. Adds it plus type to ValidationManagerConfig', () => {
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
    test('Valid name, null data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
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
    test('Valid name, data type and calcFn. Adds CalcValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
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
    test('Pass in a CalcValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
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


// Test cases for creating fluent functions...
function testChainRequireText_Val(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig
): FluentValidatorBuilder {
    if (!conditionConfig) {
        conditionConfig = { };
    }
    return finishFluentValidatorBuilder(this, ConditionType.RequireText, conditionConfig, errorMessage, validatorParameters);
}
function testChainRequireText_Cond(conditionConfig: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>
): FluentConditionBuilder {
    if (!conditionConfig) {
        conditionConfig = { };
    }

    return finishFluentConditionBuilder(this, ConditionType.RequireText, conditionConfig);

}

function testChainRegExp_Val(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig
): FluentValidatorBuilder {

    return finishFluentValidatorBuilder(this, ConditionType.RegExp, conditionConfig,
        errorMessage, validatorParameters);
}
function testChainRegExp_Cond(conditionConfig: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>): FluentConditionBuilder {

    return finishFluentConditionBuilder(this, ConditionType.RegExp, conditionConfig);
}
// interface that extends the class FluentValidatorBuilder
declare module './../../src/ValueHosts/Fluent'
{
    export interface FluentValidatorBuilder {
        testChainRequireText(conditionConfig?: Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig
        ): FluentValidatorBuilder;
        testChainRegExp(conditionConfig?: Omit<RegExpConditionConfig, 'conditionType' | 'valueHostName'>,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig
        ): FluentValidatorBuilder;
    }
    export interface FluentConditionBuilder {
        testChainRequireText(conditionConfig?:
            Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName'>
        ): FluentConditionBuilder;
        testChainRegExp(conditionConfig?:
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

describe('ManagerConfigBuilderBase.setupValueHostToCombine', () => {
    function setup(includeOverrideData: boolean): TestValidationManagerConfigBuilderBase {
        ensureFluentTestConditions();
        let vmConfig = createVMConfig();

        let builder = new TestValidationManagerConfigBuilderBase(vmConfig);

        builder.property('Field1');
        builder.property('Field2').testChainRegExp({ expression: /abc/ });
        builder.property('Field3').testChainRequireText({}, null, { errorCode: 'RequireText1' }).testChainRegExp({ expression: /def/ }, null, { errorCode: 'RegExp1' });
        // same as Field3 to show it always gets the first found
        builder.property('Field4').testChainRequireText({}, null, { errorCode: 'RequireText1' }).testChainRequireText({}, null, { errorCode: 'RequireText2' });
        if (includeOverrideData) {
            builder.publicify_addOverride();
            builder.property('Field1').testChainRequireText();
            builder.property('Field2').testChainRegExp({ expression: /abc_alt/ }, null, { errorCode: 'RegExp1_alt' });
        }
        return builder;
    }
    function findValueHostName(name: string, vhc: Array<ValueHostConfig>): ValueHostConfig | null {
        return vhc.find(v => v.name === name) ?? null;
    }
    // when found in earlier array of ValueHostConfigs, the ValidatorConfig is newly generated and added to the latest array of ValueHostConfigs
    // expects "earlier" to be the first found in the array of ValueHostConfigs, baseConfig
    function testFoundInEarlier(builder: TestValidationManagerConfigBuilderBase,
        valueHostName: ValueHostName, errorCode: string,
        expectedValidatorConfig: ValidatorConfig): void {
                
        // call before setup, which can modify the source config arrays
        let original = findValueHostName(valueHostName, builder.publicify_baseConfig.valueHostConfigs);

        let result = builder.publicify_setupValueHostToCombine(valueHostName, errorCode);
        expect(result).toBeTruthy();
        expect(result.vhc.name).toEqual(valueHostName);
        expect(result.vhc.validatorConfigs).toContain(result.vc);
        expect(result.vc).toEqual(expectedValidatorConfig);
        // prove vhc is a clone
        expect(original).not.toBe(result.vhc);
        expect(original).toEqual(result.vhc);

    }
    // when found latest array of ValueHostConfigs, the ValidatorConfig is the original object
    // expects "latest" to be after creating an entry in overriddenValueHostConfigs
    function testFoundInLatest(builder: TestValidationManagerConfigBuilderBase,
        valueHostName: ValueHostName, errorCode: string,
            expectedValidatorConfig: ValidatorConfig): void {
        // call before setup, which can modify the source config arrays
        let original = findValueHostName(valueHostName, builder.publicify_destinationValueHostConfigs());

        let result = builder.publicify_setupValueHostToCombine(valueHostName, errorCode);
        expect(result).toBeTruthy();
        expect(result.vhc.name).toEqual(valueHostName);
        expect(result.vhc.validatorConfigs).toContain(result.vc);
        expect(result.vc).toEqual(expectedValidatorConfig);
        // prove not cloned
        expect(original).toBe(result.vhc);
    }    
    function testValueHostNotFoundThrows(builder: TestValidationManagerConfigBuilderBase,
        valueHostName: ValueHostName, errorCode: string): void {
        expect(() => builder.publicify_setupValueHostToCombine(valueHostName, errorCode)).toThrow(/not defined/);
    }
    function testErrorCodeNotFoundThrows(builder: TestValidationManagerConfigBuilderBase,
        valueHostName: ValueHostName, errorCode: string): void {
        expect(() => builder.publicify_setupValueHostToCombine(valueHostName, errorCode)).toThrow(/validator with error code/);
    }


    test('With valueHosts in the initial config and empty overridden ValueHosts, finds the correct validatorConfig and valueHostConfig', () => {
        // configuration is shown in setup function
        let testItem = setup(false);
        testItem.publicify_addOverride();
        testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);

        testItem = setup(false);
        testItem.publicify_addOverride();        
        testFoundInEarlier(testItem, 'Field2', ConditionType.RegExp, <ValidatorConfig>{
            conditionConfig: {
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        });

        testItem = setup(false);
        testItem.publicify_addOverride();        
        testFoundInEarlier(testItem, 'Field3', 'RequireText1', <ValidatorConfig>{
            errorCode: 'RequireText1',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
        testItem = setup(false);
        testItem.publicify_addOverride();        
        testFoundInEarlier(testItem, 'Field3', 'RegExp1', <ValidatorConfig>{
            errorCode: 'RegExp1',
            conditionConfig: {
                conditionType: ConditionType.RegExp,
                expression: /def/
            }
        });
        testItem = setup(false);
        testItem.publicify_addOverride();        
        testFoundInEarlier(testItem, 'Field4', 'RequireText1', <ValidatorConfig>{
            errorCode: 'RequireText1',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
        testItem = setup(false);
        testItem.publicify_addOverride();        
        testFoundInEarlier(testItem, 'Field4', 'RequireText2', <ValidatorConfig>{
            errorCode: 'RequireText2',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
       
    });
    test('With valueHosts in the initial config and nothing overriden, never finds a match because cannot modify the initial config', () => {
        // configuration is shown in setup function
        let testItem = setup(false);
        testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);

        testItem = setup(false);     
        testFoundInLatest(testItem, 'Field2', ConditionType.RegExp, <ValidatorConfig>{
            conditionConfig: {
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        });

        testItem = setup(false);      
        testFoundInLatest(testItem, 'Field3', 'RequireText1', <ValidatorConfig>{
            errorCode: 'RequireText1',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
        testItem = setup(false);       
        testFoundInLatest(testItem, 'Field3', 'RegExp1', <ValidatorConfig>{
            errorCode: 'RegExp1',
            conditionConfig: {
                conditionType: ConditionType.RegExp,
                expression: /def/
            }
        });
        testItem = setup(false);     
        testFoundInLatest(testItem, 'Field4', 'RequireText1', <ValidatorConfig>{
            errorCode: 'RequireText1',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
        testItem = setup(false);      
        testFoundInLatest(testItem, 'Field4', 'RequireText2', <ValidatorConfig>{
            errorCode: 'RequireText2',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
       
    });    
    test('With valueHosts in the initial config and in overridden ValueHosts, finds the correct validatorConfig and valueHostConfig', () => {
        // configuration is shown in setup function
        let testItem = setup(true);
        testFoundInLatest(testItem, 'Field1', ConditionType.RequireText, <ValidatorConfig>{
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
        testItem = setup(true);
        testFoundInLatest(testItem, 'Field2', 'RegExp1_alt', <ValidatorConfig>{
            errorCode: 'RegExp1_alt',
            conditionConfig: {
                conditionType: ConditionType.RegExp,
                expression: /abc_alt/
            }
        });        
        testItem = setup(true);
        testFoundInEarlier(testItem, 'Field3', 'RequireText1', <ValidatorConfig>{
            errorCode: 'RequireText1',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
        testItem = setup(true);
        testFoundInEarlier(testItem, 'Field3', 'RegExp1', <ValidatorConfig>{
            errorCode: 'RegExp1',
            conditionConfig: {
                conditionType: ConditionType.RegExp,
                expression: /def/
            }
        });
        testItem = setup(true);
        testFoundInEarlier(testItem, 'Field4', 'RequireText1', <ValidatorConfig>{
            errorCode: 'RequireText1',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
        testItem = setup(true);
        testFoundInEarlier(testItem, 'Field4', 'RequireText2', <ValidatorConfig>{
            errorCode: 'RequireText2',
            conditionConfig: {
                conditionType: ConditionType.RequireText
            }
        });
       
    });

    test('The ValueHostName is unknown throws and no valueHosts defined', () => {
        let testItem = new TestValidationManagerConfigBuilderBase(createVMConfig());   // has no valueHosts
        testValueHostNotFoundThrows(testItem, 'Field2', ConditionType.RegExp);        
    });
    test('The ValueHostName is unknown throws and different named valueHost defined', () => {
        let testItem = new TestValidationManagerConfigBuilderBase(createVMConfig());
        testItem.property('Field1');
        testValueHostNotFoundThrows(testItem, 'Field2', ConditionType.RegExp);        
    });
    test('The ValueHostName is null throws', () => {
        let testItem = new TestValidationManagerConfigBuilderBase(createVMConfig());   // has no valueHosts
        expect(()=> testItem.publicify_setupValueHostToCombine(null!, ConditionType.RegExp)).toThrow(/valueHostName/);
    });

    test('The errorCode is unknown throws when no validators on valuehost', () => {
        let testItem = new TestValidationManagerConfigBuilderBase(createVMConfig());
        testItem.property('Field1');
        testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);        
    });
    test('The errorCode is unknown throws when different validator on valuehost', () => {
        ensureFluentTestConditions();
        let testItem = new TestValidationManagerConfigBuilderBase(createVMConfig());
        testItem.property('Field1').testChainRequireText();
        testErrorCodeNotFoundThrows(testItem, 'Field1', ConditionType.RegExp);        
    });    
    test('The errorCode is null throws', () => {
        ensureFluentTestConditions();
        let testItem = new TestValidationManagerConfigBuilderBase(createVMConfig());
        testItem.property('Field1').testChainRequireText();
        expect(()=> testItem.publicify_setupValueHostToCombine('Field1', null!)).toThrow(/errorCode/);       
    });
});

describe('ManagerConfigBuilderBase.combineWithValidatorConfig', () => {
    // existing condition is RegExp. New condition is RequireText
    function testCombineUsing(combineUsing: CombineUsingCondition,
        expectedValidatorConfig: ValidatorConfig
    ) { 
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_combineWithValidatorConfig(destinationConfig,
            combineUsing,
            (combiningBuilder: FluentConditionBuilder) => combiningBuilder.testChainRequireText())).not.toThrow();  
       
        expect(hasConditionBeenReplaced(destinationConfig)).toBe(true);
        deleteConditionReplacedSymbol(destinationConfig);
        expect(destinationConfig).toEqual(expectedValidatorConfig);        
    }
    function testFunctionHandlesAllCombining(fn: (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void,
        expectedValidatorConfig: ValidatorConfig
    ) { 
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_combineWithValidatorConfig(destinationConfig,
            fn)).not.toThrow();  
       
        expect(hasConditionBeenReplaced(destinationConfig)).toBe(true);
        deleteConditionReplacedSymbol(destinationConfig);
        expect(destinationConfig).toEqual(expectedValidatorConfig);        
    }    

    test('CombineUsing=When', () => {

        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                enablerConfig: {
                    conditionType: ConditionType.RequireText
                
                },
                childConditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            }
        };

        testCombineUsing(CombineUsingCondition.When, expectedConfig);
    });
    test('CombineUsing=All', () => {

        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <AllMatchConditionConfig>{
                conditionType: ConditionType.All,
                conditionConfigs: [
                    <RegExpConditionConfig>{
                        conditionType: ConditionType.RegExp,
                        expression: /abc/
                    },
                    {
                        conditionType: ConditionType.RequireText
                    }
                ]

            }
        };

        testCombineUsing(CombineUsingCondition.All, expectedConfig);
    });    
    test('CombineUsing=Any', () => {

        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <AnyMatchConditionConfig>{
                conditionType: ConditionType.Any,
                conditionConfigs: [
                    <RegExpConditionConfig>{
                        conditionType: ConditionType.RegExp,
                        expression: /abc/
                    },
                    {
                        conditionType: ConditionType.RequireText
                    }
                ]

            }
        };

        testCombineUsing(CombineUsingCondition.Any, expectedConfig);
    });        

    test('Function to combine', () => {

        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                enablerConfig: {
                    conditionType: ConditionType.RequireText
                
                },
                childConditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            }
        };

        testFunctionHandlesAllCombining(
            (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                combiningBuilder.when(
                    (enablerBuilder) => enablerBuilder.testChainRequireText(),
                    (childBuilder) => childBuilder.conditionConfig(existingConditionConfig));
            },
            expectedConfig);
    });
    test('2 parameter function to combine does not provide any replacement makes no change but logs', () => {
        const destinationConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            
        };
        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            
        };

        let vmConfig = createVMConfig();
        let logger = vmConfig.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);

        expect(()=> testItem.publicify_combineWithValidatorConfig(destinationConfig,
            (combiningBuilder) => { })).not.toThrow();          
        expect(destinationConfig).toEqual(expectedConfig);
        expect(logger.findMessage('did not create a conditionConfig', LoggingLevel.Warn, null, null)).toBeTruthy();

    });    
    test('3 parameter function to combine does not provide any replacement makes no change but logs', () => {
        const destinationConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            
        };
        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            
        };

        let vmConfig = createVMConfig();
        let logger = vmConfig.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);

        expect(() => testItem.publicify_combineWithValidatorConfig(destinationConfig,
            CombineUsingCondition.All,
            (combiningBuilder) => { })).not.toThrow();          
        expect(destinationConfig).toEqual(expectedConfig);
        expect(logger.findMessage('did not create a conditionConfig', LoggingLevel.Warn, null, null)).toBeTruthy();

    });        
    test('arg1 parameter null', () => {
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);

        expect(()=> testItem.publicify_combineWithValidatorConfig(null!,
            () => { })).toThrow(/destinationOfCondition/);          
    });    
    test('arg2 parameter null throws', () => {
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_combineWithValidatorConfig(destinationConfig,
            null!)).toThrow();          
    });
    test('In 2 parameter form, no parameter has a function throws', () => {
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_combineWithValidatorConfig(destinationConfig,
            10 as any)).toThrow(/Invalid parameters/);          
    });    
    test('In 3 parameter form, no parameter has a function throws', () => {
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_combineWithValidatorConfig(destinationConfig,
            CombineUsingCondition.All,
            10 as any)).toThrow(/Invalid parameters/);          
    });        
    test('In 3 parameter form, arg2 is not a number or function throws', () => {
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_combineWithValidatorConfig(destinationConfig,
            'invalidinput' as any,
            10 as any)).toThrow(/Invalid parameters/);          
    });            

});

describe('replaceConditionWith', () => {
    function testFunctionHandlesReplacement(sourceOfConditionConfig: ConditionConfig | ((builder: FluentConditionBuilder) => void),
        expectedValidatorConfig: ValidatorConfig
    ) { 
        ensureFluentTestConditions();
        enableFluentConditions();
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_replaceConditionWith(destinationConfig,
            sourceOfConditionConfig)).not.toThrow();  
       
        expect(hasConditionBeenReplaced(destinationConfig)).toBe(true);
        deleteConditionReplacedSymbol(destinationConfig);
        expect(destinationConfig).toEqual(expectedValidatorConfig);        
    }        
    test('function with actual conditionConfig', () => {
        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };

        testFunctionHandlesReplacement(
            (replacementBuilder: FluentConditionBuilder) => {
                replacementBuilder.testChainRegExp({ expression: /abc/ });
            },
            expectedConfig);       
    });
    test('function with callback to create conditionConfig', () => {
        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/,
                valueHostName: null
            }
        };
        const sourceConfig: RegExpConditionConfig = {
            conditionType: ConditionType.RegExp,
            expression: /abc/,
            valueHostName: null
        };

        testFunctionHandlesReplacement(
            sourceConfig,
            expectedConfig);               
    });
    test('With invalid 2nd parameter type, throw', () => {
        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_replaceConditionWith(destinationConfig,
            10 as any)).toThrow(/Invalid parameters/);              
    });
    test('With 1st parameter null, throw', () => {

        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);


        expect(()=> testItem.publicify_replaceConditionWith(null!,
            { conditionType: 'x '})).toThrow(/destinationOfCondition/);              
    });    
    test('With 2nd parameter null, throw', () => {

        let vmConfig = createVMConfig();
        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);
        let destinationConfig: ValidatorConfig = {
            conditionConfig: <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        };        

        expect(()=> testItem.publicify_replaceConditionWith(destinationConfig, null!)).toThrow(/sourceOfConditionConfig/);              
    });        
    test('When function does not provide a replacement, no change and log', () => {
        const destinationConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            
        };
        const expectedConfig: ValidatorConfig = {
            errorCode: ConditionType.RegExp,
            conditionConfig: <RegExpConditionConfig>{
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
            
        };

        let vmConfig = createVMConfig();
        let logger = vmConfig.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;

        let testItem = new TestValidationManagerConfigBuilderBase(vmConfig);

        expect(() => testItem.publicify_replaceConditionWith(destinationConfig,
            (replacementBuilder) => { })).not.toThrow();          
        expect(destinationConfig).toEqual(expectedConfig);
        expect(logger.findMessage('did not create a conditionConfig', LoggingLevel.Warn, null, null)).toBeTruthy();

    });            
});