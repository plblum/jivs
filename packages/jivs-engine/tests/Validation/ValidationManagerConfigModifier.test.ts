import { RegExpConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { EvaluateChildConditionResultsBaseConfig } from "../../src/Conditions/EvaluateChildConditionResultsBase";
import { WhenConditionConfig } from "../../src/Conditions/WhenCondition";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionConfig } from "../../src/Interfaces/Conditions";
import { InputValueHostConfig } from "../../src/Interfaces/InputValueHost";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { ValidationSeverity } from "../../src/Interfaces/Validation";
import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { ValidationManagerConfigBuilder } from "../../src/Validation/ValidationManagerConfigBuilder";
import { ValidationManagerConfigModifier } from "../../src/Validation/ValidationManagerConfigModifier";
import { FluentConditionBuilder, FluentValidatorBuilder } from "../../src/ValueHosts/Fluent";
import { CombineUsingCondition, hasConditionBeenReplaced } from "../../src/ValueHosts/ManagerConfigBuilderBase";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { Publicify_ValidationManager } from "../TestSupport/Publicify_classes";
import { MockValidationServices } from "../TestSupport/mocks";
import { ensureFluentTestConditions } from "../ValueHosts/ManagerConfigBuilderBase.test";

ensureFluentTestConditions();

function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    let logger = vmConfig.services.loggerService as CapturingLogger;
    logger.mainLogger = new ConsoleLoggerService();
    logger.minLevel = LoggingLevel.Debug

    return vmConfig;
}

class Publicify_ValidationManagerConfigModifier extends ValidationManagerConfigModifier {

    constructor(manager: Publicify_ValidationManager) {
        super(manager, manager.publicify_valueHostConfigs);
    }
    public publicify_destinationValueHostConfigs(): Array<ValueHostConfig> {
        return super.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValidationManagerConfig {
        return super.baseConfig;
    }
    public get publicify_overriddenValueHostConfigs(): Array<Array<ValueHostConfig>> {
        return super.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void {
        super.addOverride();
    }

}
describe('input()', () => {
    test('Existing Field1 of input gets updated', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs.push({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: LookupKey.Integer
        });
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.input('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Integer,
            validatorConfigs: []
        });
    });        
    test('Valid name, null data type and defined vhConfig. Adds InputValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.input('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.input('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Name supplied. Adds ValueHostConfig with all inputs plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.input('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Pass in a InputValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.input({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Use the 2 parameter API: name + config. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.input('Field1', { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Use the 2 parameter API: name + config, except pass something other than a string or object into the second parameter. Throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        expect(() => modifier.input('Field1', false as any)).toThrow(/Second parameter/);
        expect(() => modifier.input('Field1', 10 as any)).toThrow(/Second parameter/);
        expect(() => modifier.input('Field1', false as any)).toThrow(/Second parameter/);        
    });        
    test('Add same name twice throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);

        let testItem = modifier.input('Field1');
        expect(() => modifier.input('Field1')).toThrow(/already defined/);
    });
    test('Add 2 inputs, 1 non-input. All valid and generates 3 ValueHostConfigs in vmConfig', () => {
        let vmConfig = createVMConfig();

        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem1 = modifier.input('Field1');
        expect(testItem1).toBeInstanceOf(FluentValidatorBuilder);
        let expected1 = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem1.parentConfig).toEqual(expected1);
        let testItem2 = modifier.input('Field2');
        expect(testItem2).toBeInstanceOf(FluentValidatorBuilder);
        let expected2 = {
            valueHostType: ValueHostType.Input,
            name: 'Field2',
            validatorConfigs: []
        };
        expect(testItem2.parentConfig).toEqual(expected2);

        let testItem3 = modifier.static('Field3');
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
        let vm = new Publicify_ValidationManager(createVMConfig());
        let testItem = new Publicify_ValidationManagerConfigModifier(vm);

        expect(() => testItem.input(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = new Publicify_ValidationManager(createVMConfig());
        let testItem = new Publicify_ValidationManagerConfigModifier(vm);
        expect(() => testItem.input(100 as any)).toThrow('name could not be identified.');
    });
});


describe('property()', () => {
    test('Existing Field1 of property gets updated', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs.push({
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            dataType: LookupKey.Integer
        });
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.property('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Integer,
            validatorConfigs: []
        });
    });            
    test('Valid name, null data type and defined vhConfig. Adds PropertyValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();

        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.property('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        expect(testItem.parentConfig).toEqual({
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.property('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);

    });
    test('Name supplied. Adds ValueHostConfig with all propertys plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.property('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Pass in a PropertyValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.property({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);

    });

    test('Use the 2 parameter API: name + config. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.property('Field1', { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });    
    test('Use the 2 parameter API: name + config, except pass something other than a string or object into the second parameter. Throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        expect(() => modifier.property('Field1', false as any)).toThrow(/Second parameter/);
        expect(() => modifier.property('Field1', 10 as any)).toThrow(/Second parameter/);
        expect(() => modifier.property('Field1', false as any)).toThrow(/Second parameter/);        
    });         
    test('Add same name twice throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);

        let testItem = modifier.property('Field1');
        expect(() => modifier.property('Field1')).toThrow(/already defined/)
    });
    test('Add 2 properties, 1 non-property. All valid and generates 3 ValueHostConfigs in vmConfig', () => {
        let vmConfig = createVMConfig();

        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem1 = modifier.property('Field1');
        expect(testItem1).toBeInstanceOf(FluentValidatorBuilder);
        let expected1 = {
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem1.parentConfig).toEqual(expected1);
        let testItem2 = modifier.property('Field2');
        expect(testItem2).toBeInstanceOf(FluentValidatorBuilder);
        let expected2 = {
            valueHostType: ValueHostType.Property,
            name: 'Field2',
            validatorConfigs: []
        };
        expect(testItem2.parentConfig).toEqual(expected2);

        let testItem3 = modifier.static('Field3');
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
        let vm = new Publicify_ValidationManager(createVMConfig());

        let testItem = new Publicify_ValidationManagerConfigModifier(vm);

        expect(() => testItem.property(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = new Publicify_ValidationManager(createVMConfig());

        let testItem = new Publicify_ValidationManagerConfigModifier(vm);
        expect(() => testItem.property(100 as any)).toThrow('name could not be identified');
    });
});

describe('updateValidator', () => {
    test('With existing Validator, all values supplied are updated', () => {
        let vmConfig = createVMConfig();

        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1')
            .requireText(null, 'OriginalError');
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        modifier.updateValidator('Field1', ConditionType.RequireText,
            {
                enabled: true, errorMessage: 'UpdatedMessage', errorMessagel10n: 'l10n',
                summaryMessage: 'Summary', summaryMessagel10n: 'Summl10n',
                severity: ValidationSeverity.Severe
            });
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                enabled: true,
                errorMessage: 'UpdatedMessage',
                errorMessagel10n: 'l10n',
                summaryMessage: 'Summary',
                summaryMessagel10n: 'Summl10n',
                severity: ValidationSeverity.Severe
            }]
        });
    });
    test('With existing Validator, supply unwanted properties. They are not applied, but valid ones are.', () => {
        let vmConfig = createVMConfig();

        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1').requireText(null, 'OriginalError');
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        modifier.updateValidator('Field1', ConditionType.RequireText,
            <any>{
                errorMessage: 'Wanted',
                notDefined: 'Unwanted',
 //               conditionConfig: { conditionType: 'TEST' },
                conditionCreator: (x: unknown) => null
            });
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'Wanted',
                notDefined: 'Unwanted'   // however we don't block properties that we didn't build
            }]
        });
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();
        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.static('Field1', LookupKey.Integer, { label: 'Field 1' });
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.updateValidator('Field1', ConditionType.RequireText, { errorMessage: 'errormessage' })).toThrow(/does not support validators/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.updateValidator('Field1', 'ERRORCODE',
            { errorMessage: 'UpdatedMessage' })).toThrow(/not defined/);
    });
    test('With no matching errorCode, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1');
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.updateValidator('Field1', 'ERRORCODE',
            { errorMessage: 'UpdatedMessage' })).toThrow(/not defined/);
    });
});

describe('addValidatorsTo', () => {
    test('Without any matching validator, adds the new one', () => {
        let vmConfig = createVMConfig();

        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1');
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        modifier.addValidatorsTo('Field1').requireText(null, 'RequireMessage');
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'RequireMessage',
            }]
        });
    });
    test('Add 2 validators using chaining works', () => {
        let vmConfig = createVMConfig();

        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1');
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        modifier.addValidatorsTo('Field1').requireText().regExp('\\d');
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
            },
            {
                conditionConfig: {
                    conditionType: ConditionType.RegExp,
                    expressionAsString: '\\d'
                },
            }]
        });
    });
    test('With name assigned to another type of valueHost, throws.', () => {
        let vmConfig = createVMConfig();
        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.static('Field1', LookupKey.Integer, { label: 'Field 1' });
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.addValidatorsTo('Field1')).toThrow(/does not support validators/);
    });
    test('With no matching ValueHostName, throws', () => {
        let vmConfig = createVMConfig();
        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.addValidatorsTo('Field1')).toThrow(/not defined/);
    });
    test('With matching errorCode on conditionType, it merges like updateValidator would', () => {
        let vmConfig = createVMConfig();

        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1').requireText();
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.addValidatorsTo('Field1').requireText(null, 'Required')).not.toThrow();
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'Required'
            }]
        });
    });
    test('With matching errorCode on Validator.errorCode but different conditionTypes, logs ConditionType as a warning', () => {
        let vmConfig = createVMConfig();

        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1').requireText({}, null, { errorCode: 'ERRORCODE' });
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.addValidatorsTo('Field1').notNull(null, {
            errorCode: 'ERRORCODE',
            errorMessage: 'not null'
            
        })).not.toThrow();
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText    // this did not get overwritte
                },
                errorCode: 'ERRORCODE',
                errorMessage: 'not null'
            }]
        });
        let logger = vmConfig.services.loggerService as CapturingLogger;
        expect(logger.findMessage('ConditionType mismatch', LoggingLevel.Warn, null)).toBeTruthy();
    });
});

describe('combineWithRule', () => {
    describe('3 parameter overload', () => {
        // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.
        test('Existing and new condition appear as the new value of ValidatorConfig within AllMatchCondition', () => {
            let vmConfig = createVMConfig();
            let builder = new ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            let vm = new Publicify_ValidationManager(builder);
            let modifier = vm.startModifying();

            let testItem = modifier.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    combiningBuilder.all((childrenBuilder) =>
                        childrenBuilder.conditionConfig(existingConditionConfig).regExp(/abc/));
                }
            );
            modifier.apply();   
            expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
            let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
            expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

            expect(updateValueHostConfig).toEqual({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: [{
                    errorCode: ConditionType.RequireText,
                    conditionConfig: {
                        conditionType: ConditionType.All,
                        conditionConfigs: [
                            {
                                conditionType: ConditionType.RequireText
                            },
                            {
                                conditionType: ConditionType.RegExp,
                                expression: /abc/
                            }
                        ]
                    }
                }]
            });
        });

        test('New condition replaces existing and errorCode is set to the original condition', () => {
            let vmConfig = createVMConfig();
            let builder = new ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            let vm = new Publicify_ValidationManager(builder);
            let modifier = vm.startModifying();

            modifier.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            modifier.apply();        
            let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
            expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

            expect(updateValueHostConfig).toEqual({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: [{
                    errorCode: ConditionType.RequireText,
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expression: /abc/
                    }
                    
                }]
            });
        });
 
        test('No changes are made in the builder results in preserving original ValidatorConfig', () => {
            let vmConfig = createVMConfig();
            let builder = new ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            let vm = new Publicify_ValidationManager(builder);
            let modifier = vm.startModifying();

            modifier.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                }
            );
            modifier.apply();        
            let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
            expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

            expect(updateValueHostConfig).toEqual({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: [{
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    }
                }]
            });
        });
    });
    describe('4 parameter overload', () => {
        // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.
        test('CombineUsingCondition.All', () => {
            let vmConfig = createVMConfig();
            let builder = new ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            let vm = new Publicify_ValidationManager(builder);
            let modifier = vm.startModifying();

            let testItem = modifier.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.All,
                (combiningBuilder: FluentConditionBuilder) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            modifier.apply();    
            expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
            let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
            expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

            expect(updateValueHostConfig).toEqual({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: [{
                    errorCode: ConditionType.RequireText,
                    conditionConfig: {
                        conditionType: ConditionType.All,
                        conditionConfigs: [
                            {
                                conditionType: ConditionType.RequireText
                            },
                            {
                                conditionType: ConditionType.RegExp,
                                expression: /abc/
                            }
                        ]
                    }
                }]
            });
        });
        test('CombineUsingCondition.When', () => {
            let vmConfig = createVMConfig();
            let builder = new ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            let vm = new Publicify_ValidationManager(builder);
            let modifier = vm.startModifying();

            let testItem = modifier.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.When,
                (combiningBuilder: FluentConditionBuilder) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            modifier.apply();
            expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
            let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
            expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

            expect(updateValueHostConfig).toEqual({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: [{
                    errorCode: ConditionType.RequireText,
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        enablerConfig: <RegExpConditionConfig>{
                                conditionType: ConditionType.RegExp,
                                expression: /abc/               
                        },
                        childConditionConfig : {
                                conditionType: ConditionType.RequireText
                            }
                            
                    }
                }]
            });
        });        

        test('No changes are made in the builder results in preserving original ValidatorConfig', () => {
            let vmConfig = createVMConfig();
            let builder = new ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            let vm = new Publicify_ValidationManager(builder);
            let modifier = vm.startModifying();

            modifier.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.All,
                (combiningBuilder: FluentConditionBuilder) => {
                }
            );
            modifier.apply();        
            let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
            expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

            expect(updateValueHostConfig).toEqual({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: [{
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    }
                }]
            });
        });
      });
    
});
describe('replaceRule', () => {
    // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.

    test('Using builder to create replacement replaces and errorCode is set to the original condition', () => {
        let vmConfig = createVMConfig();
        let builder = new ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText();
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();

        let testItem = modifier.replaceRule('Field1', ConditionType.RequireText,
            (replacementBuilder: FluentConditionBuilder) => {
                replacementBuilder.regExp(/abc/);
            }
        );
        modifier.apply();        
        expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
        let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
        expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

        expect(updateValueHostConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                errorCode: ConditionType.RequireText,
                conditionConfig: {
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
                
            }]
        });
    });
    test('Using ConditionConfig as the replacement replaces and errorCode is set to the original condition', () => {
        let vmConfig = createVMConfig();
        let builder = new ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText();
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();

        modifier.replaceRule('Field1', ConditionType.RequireText,
            <RegExpConditionConfig>{ 
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        );
        modifier.apply();        
        let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as InputValueHostConfig;;
        expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

        expect(updateValueHostConfig).toEqual({
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                errorCode: ConditionType.RequireText,
                conditionConfig: {
                    conditionType: ConditionType.RegExp,
                    expression: /abc/
                }
                
            }]
        });
    });    
 
});