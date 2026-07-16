import { RegExpConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { WhenConditionConfig } from "../../src/Conditions/WhenCondition";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionConfig } from "../../src/Interfaces/Conditions";
import { FieldValueHostConfig } from "../../src/Interfaces/FieldValueHost";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { ValidationSeverity } from "../../src/Interfaces/Validation";
import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { ValidationManagerConfigBuilder } from "../../src/Builder/ValidationManagerConfigBuilder";
import { ValidationManagerConfigModifier } from "../../src/Builder/ValidationManagerConfigModifier";
import { hasConditionBeenReplaced } from "../../src/Builder/ManagerConfigBuilderBase";
import { CapturingLogger } from "../../src/Support/CapturingLogger";
import { Publicify_ValidationManager } from "../TestSupport/Publicify_classes";
import { MockValidationServices } from "../TestSupport/mocks";
import { FluentValidatorBuilder } from "../../src/Builder/FluentValidatorBuilder";
import { IStartConditionBuilder } from "../../src/Interfaces/ChildBuilders";

function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    let logger = vmConfig.services.loggerService as CapturingLogger;
    logger.chainedLogger = new ConsoleLoggerService();
    logger.minLevel = LoggingLevel.Debug

    return vmConfig;
}

class Publicify_ValidationManagerConfigModifier extends ValidationManagerConfigModifier {

    constructor(manager: Publicify_ValidationManager) {
        super(manager, manager.publicify_valueHostConfigs);
    }
    public publicify_destinationValueHostConfigs(): Array<ValueHostConfig> {
        return this.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValidationManagerConfig {
        return this.baseConfig;
    }
    public get publicify_overriddenValueHostConfigs(): Array<Array<ValueHostConfig>> {
        return this.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void {
        this.addOverride();
    }

}
describe('field()', () => {
    test('Existing Field1 of field gets updated', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs.push({
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.Integer
        });
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.field('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Integer,
            validatorConfigs: []
        });
    });        
    test('Valid name, null data type and defined vhConfig. Adds FieldValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.field('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Name, data type supplied. Adds ValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.field('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: 'Test',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Name supplied. Adds ValueHostConfig with all fields plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.field('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem.parentConfig).toEqual(expected);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual(expected);
    });
    test('Pass in a FieldValueHostConfig. Adds it plus type to ValidationManagerConfig', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem = modifier.field({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let expected = {
            valueHostType: ValueHostType.Field,
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
        let testItem = modifier.field('Field1', { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            label: 'Field 1',
            validatorConfigs: []
        });
    });
    test('Use the 2 parameter API: name + config, except pass something other than a string or object into the second parameter. Throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        expect(() => modifier.field('Field1', false as any)).toThrow(/Second parameter/);
        expect(() => modifier.field('Field1', 10 as any)).toThrow(/Second parameter/);
        expect(() => modifier.field('Field1', false as any)).toThrow(/Second parameter/);        
    });        
    test('Add same name twice throws', () => {
        let vmConfig = createVMConfig();
        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);

        let testItem = modifier.field('Field1');
        expect(() => modifier.field('Field1')).toThrow(/already defined/);
    });
    test('Add 2 fields, 1 non-field. All valid and generates 3 ValueHostConfigs in vmConfig', () => {
        let vmConfig = createVMConfig();

        let vm = new Publicify_ValidationManager(vmConfig);

        let modifier = new Publicify_ValidationManagerConfigModifier(vm);
        let testItem1 = modifier.field('Field1');
        expect(testItem1).toBeInstanceOf(FluentValidatorBuilder);
        let expected1 = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(testItem1.parentConfig).toEqual(expected1);
        let testItem2 = modifier.field('Field2');
        expect(testItem2).toBeInstanceOf(FluentValidatorBuilder);
        let expected2 = {
            valueHostType: ValueHostType.Field,
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

        expect(() => testItem.field(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        let vm = new Publicify_ValidationManager(createVMConfig());
        let testItem = new Publicify_ValidationManagerConfigModifier(vm);
        expect(() => testItem.field(100 as any)).toThrow('name could not be identified.');
    });
});

describe('updateValidator', () => {
    test('With existing Validator, all values supplied are updated', () => {
        let vmConfig = createVMConfig();

        let builder = new ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1')
            .requireText('OriginalError');
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
            valueHostType: ValueHostType.Field,
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
        let testItem = builder.field('Field1').requireText('OriginalError');
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
            valueHostType: ValueHostType.Field,
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
        let testItem = builder.field('Field1');
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
        let testItem = builder.field('Field1');
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        modifier.addValidatorsTo('Field1').requireText('RequireMessage');
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Field,
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
        let testItem = builder.field('Field1');
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        modifier.addValidatorsTo('Field1').requireText().regExp('\\d');
        modifier.apply();

        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Field,
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
        let testItem = builder.field('Field1').requireText();
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.addValidatorsTo('Field1').requireText('Required')).not.toThrow();
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Field,
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
        builder.field('Field1').requireText({ errorCode: 'ERRORCODE' });
        let vm = new Publicify_ValidationManager(builder);
        let modifier = vm.startModifying();
        expect(() => modifier.addValidatorsTo('Field1').notNull({
            errorCode: 'ERRORCODE',
            errorMessage: 'not null'
            
        })).not.toThrow();
        modifier.apply();
        expect(vm.getValueHostConfig('Field1')).toEqual({
            valueHostType: ValueHostType.Field,
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

// describe('combineWithRule', () => {
//     describe('3 parameter overload', () => {
//         // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.
//         test('Existing and new condition appear as the new value of ValidatorConfig within AllMatchCondition', () => {
//             let vmConfig = createVMConfig();
//             let builder = new ValidationManagerConfigBuilder(vmConfig);
//             builder.field('Field1').requireText();
//             let vm = new Publicify_ValidationManager(builder);
//             let modifier = vm.startModifying();

//             let testItem = modifier.combineWithRule('Field1', ConditionType.RequireText,
//                 (combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => {
//                     combiningBuilder.all((childrenBuilder) => {
//                         childrenBuilder.conditionConfig(existingConditionConfig);
//                         childrenBuilder.parentValue().regExp(/abc/);
//                     });
//                 }
//             );
//             modifier.apply();   
//             expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
//             let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//             expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//             expect(updateValueHostConfig).toEqual({
//                 valueHostType: ValueHostType.Field,
//                 name: 'Field1',
//                 validatorConfigs: [{
//                     errorCode: ConditionType.RequireText,
//                     conditionConfig: {
//                         conditionType: ConditionType.All,
//                         conditionConfigs: [
//                             {
//                                 conditionType: ConditionType.RequireText
//                             },
//                             {
//                                 conditionType: ConditionType.RegExp,
//                                 expression: /abc/
//                             }
//                         ]
//                     }
//                 }]
//             });
//         });

//         test('New condition replaces existing and errorCode is set to the original condition', () => {
//             let vmConfig = createVMConfig();
//             let builder = new ValidationManagerConfigBuilder(vmConfig);
//             builder.field('Field1').requireText();
//             let vm = new Publicify_ValidationManager(builder);
//             let modifier = vm.startModifying();

//             modifier.combineWithRule('Field1', ConditionType.RequireText,
//                 (combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => {
//                     combiningBuilder.parentValue().regExp(/abc/);
//                 }
//             );
//             modifier.apply();        
//             let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//             expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//             expect(updateValueHostConfig).toEqual({
//                 valueHostType: ValueHostType.Field,
//                 name: 'Field1',
//                 validatorConfigs: [{
//                     errorCode: ConditionType.RequireText,
//                     conditionConfig: {
//                         conditionType: ConditionType.RegExp,
//                         expression: /abc/
//                     }
                    
//                 }]
//             });
//         });
 
//         test('No changes are made in the builder results in preserving original ValidatorConfig', () => {
//             let vmConfig = createVMConfig();
//             let builder = new ValidationManagerConfigBuilder(vmConfig);
//             builder.field('Field1').requireText();
//             let vm = new Publicify_ValidationManager(builder);
//             let modifier = vm.startModifying();

//             modifier.combineWithRule('Field1', ConditionType.RequireText,
//                 (combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => {
//                 }
//             );
//             modifier.apply();        
//             let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//             expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//             expect(updateValueHostConfig).toEqual({
//                 valueHostType: ValueHostType.Field,
//                 name: 'Field1',
//                 validatorConfigs: [{
//                     conditionConfig: {
//                         conditionType: ConditionType.RequireText
//                     }
//                 }]
//             });
//         });
//     });
//     describe('4 parameter overload', () => {
//         // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.
//         test('CombineUsingCondition.All', () => {
//             let vmConfig = createVMConfig();
//             let builder = new ValidationManagerConfigBuilder(vmConfig);
//             builder.field('Field1').requireText();
//             let vm = new Publicify_ValidationManager(builder);
//             let modifier = vm.startModifying();

//             let testItem = modifier.combineWithRule('Field1', ConditionType.RequireText,
//                 CombineUsingCondition.All,
//                 (combiningBuilder: IStartConditionBuilder) => {
//                     combiningBuilder.parentValue().regExp(/abc/);
//                 }
//             );
//             modifier.apply();    
//             expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
//             let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//             expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//             expect(updateValueHostConfig).toEqual({
//                 valueHostType: ValueHostType.Field,
//                 name: 'Field1',
//                 validatorConfigs: [{
//                     errorCode: ConditionType.RequireText,
//                     conditionConfig: {
//                         conditionType: ConditionType.All,
//                         conditionConfigs: [
//                             {
//                                 conditionType: ConditionType.RequireText
//                             },
//                             {
//                                 conditionType: ConditionType.RegExp,
//                                 expression: /abc/
//                             }
//                         ]
//                     }
//                 }]
//             });
//         });
//         test('CombineUsingCondition.When', () => {
//             let vmConfig = createVMConfig();
//             let builder = new ValidationManagerConfigBuilder(vmConfig);
//             builder.field('Field1').requireText();
//             let vm = new Publicify_ValidationManager(builder);
//             let modifier = vm.startModifying();

//             let testItem = modifier.combineWithRule('Field1', ConditionType.RequireText,
//                 CombineUsingCondition.When,
//                 (combiningBuilder: IStartConditionBuilder) => {
//                     combiningBuilder.parentValue().regExp(/abc/);
//                 }
//             );
//             modifier.apply();
//             expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
//             let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//             expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//             expect(updateValueHostConfig).toEqual({
//                 valueHostType: ValueHostType.Field,
//                 name: 'Field1',
//                 validatorConfigs: [{
//                     errorCode: ConditionType.RequireText,
//                     conditionConfig: <WhenConditionConfig>{
//                         conditionType: ConditionType.When,
//                         whenToEnableConfig: <RegExpConditionConfig>{
//                                 conditionType: ConditionType.RegExp,
//                                 expression: /abc/               
//                         },
//                         thenConfig : {
//                                 conditionType: ConditionType.RequireText
//                             }
                            
//                     }
//                 }]
//             });
//         });        

//         test('No changes are made in the builder results in preserving original ValidatorConfig', () => {
//             let vmConfig = createVMConfig();
//             let builder = new ValidationManagerConfigBuilder(vmConfig);
//             builder.field('Field1').requireText();
//             let vm = new Publicify_ValidationManager(builder);
//             let modifier = vm.startModifying();

//             modifier.combineWithRule('Field1', ConditionType.RequireText,
//                 CombineUsingCondition.All,
//                 (combiningBuilder: IStartConditionBuilder) => {
//                 }
//             );
//             modifier.apply();        
//             let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//             expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//             expect(updateValueHostConfig).toEqual({
//                 valueHostType: ValueHostType.Field,
//                 name: 'Field1',
//                 validatorConfigs: [{
//                     conditionConfig: {
//                         conditionType: ConditionType.RequireText
//                     }
//                 }]
//             });
//         });
//       });
    
// });
// describe('replaceRule', () => {
//     // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.

//     test('Using builder to create replacement replaces and errorCode is set to the original condition', () => {
//         let vmConfig = createVMConfig();
//         let builder = new ValidationManagerConfigBuilder(vmConfig);
//         builder.field('Field1').requireText();
//         let vm = new Publicify_ValidationManager(builder);
//         let modifier = vm.startModifying();

//         let testItem = modifier.replaceRule('Field1', ConditionType.RequireText,
//             (replacementBuilder: IStartConditionBuilder) => {
//                 replacementBuilder.parentValue().regExp(/abc/);
//             }
//         );
//         modifier.apply();        
//         expect(testItem).toBeInstanceOf(ValidationManagerConfigModifier);
//         let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//         expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//         expect(updateValueHostConfig).toEqual({
//             valueHostType: ValueHostType.Field,
//             name: 'Field1',
//             validatorConfigs: [{
//                 errorCode: ConditionType.RequireText,
//                 conditionConfig: {
//                     conditionType: ConditionType.RegExp,
//                     expression: /abc/
//                 }
                
//             }]
//         });
//     });
//     test('Using ConditionConfig as the replacement replaces and errorCode is set to the original condition', () => {
//         let vmConfig = createVMConfig();
//         let builder = new ValidationManagerConfigBuilder(vmConfig);
//         builder.field('Field1').requireText();
//         let vm = new Publicify_ValidationManager(builder);
//         let modifier = vm.startModifying();

//         modifier.replaceRule('Field1', ConditionType.RequireText,
//             <RegExpConditionConfig>{ 
//                 conditionType: ConditionType.RegExp,
//                 expression: /abc/
//             }
//         );
//         modifier.apply();        
//         let updateValueHostConfig  = vm.publicify_valueHostConfigs.get('Field1') as FieldValueHostConfig;;
//         expect(!hasConditionBeenReplaced(updateValueHostConfig.validatorConfigs![0])).toBe(true);

//         expect(updateValueHostConfig).toEqual({
//             valueHostType: ValueHostType.Field,
//             name: 'Field1',
//             validatorConfigs: [{
//                 errorCode: ConditionType.RequireText,
//                 conditionConfig: {
//                     conditionType: ConditionType.RegExp,
//                     expression: /abc/
//                 }
                
//             }]
//         });
//     });    
 
// });