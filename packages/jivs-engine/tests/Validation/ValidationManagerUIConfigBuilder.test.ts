import { RegExpConditionConfig } from '../../src/Conditions/ConcreteConditions';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { WhenConditionConfig } from '../../src/Conditions/WhenCondition';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { FieldValueHostConfig } from '../../src/Interfaces/FieldValueHost';
import { BuilderOverrideOptions } from '../../src/Interfaces/ManagerConfigBuilder';
import { ValidationManagerConfig } from '../../src/Interfaces/ValidationManager';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { TextLocalizerService } from '../../src/Services/TextLocalizerService';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { ValidationManagerConfigBuilder, build } from '../../src/Validation/ValidationManagerConfigBuilder';
import { ValidationManagerUIConfigBuilder, createUIBuilder } from '../../src/Validation/ValidationManagerUIConfigBuilder';
import { FluentConditionBuilder, FluentValidatorBuilder } from '../../src/ValueHosts/Fluent';
import { BuilderState, CombineUsingCondition, deleteConditionReplacedSymbol, hasConditionBeenReplaced } from '../../src/ValueHosts/ManagerConfigBuilderBase';
import { ensureFluentTestConditions } from '../ValueHosts/ManagerConfigBuilderBase.test';
import { MockValidationServices } from './../TestSupport/mocks';


function createVMConfig(standardDataTypes?: boolean): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, standardDataTypes ?? true),
        valueHostConfigs: []
    };
    return vmConfig;
}

function setupPublicifyUIBuilder(options?: BuilderOverrideOptions, standardDataTypes?: boolean): Publicify_ValidationManagerUIConfigBuilder {
    let state = new BuilderState<ValidationManagerConfig>(createVMConfig(standardDataTypes));
    return new Publicify_ValidationManagerUIConfigBuilder(state);
}


class Publicify_ValidationManagerUIConfigBuilder extends ValidationManagerUIConfigBuilder {
    constructor(state: BuilderState<ValidationManagerConfig>, options?: BuilderOverrideOptions) {
        super(state, options);
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
    protected override favorUIMessages(): void {
        super.favorUIMessages();
        // uninitialized favorUIMessagesCount because this is running from the constructor
        if (this.favorUIMessagesCount === undefined)
            this.favorUIMessagesCount = 0;
        this.favorUIMessagesCount++;
    }

    public publicify_favorUIMessages(): void {
        this.favorUIMessages();
    }
    public favorUIMessagesCount?: number;   // favorUIMessages() is called once in constructor, prior to this getting initialized

}


describe('constructor', () => {

    test('Basic state', () => {
        let services = new MockValidationServices(false, false);
        let state = new BuilderState<ValidationManagerConfig>({
            services: services,
            valueHostConfigs: []
        });
        let testItem = new ValidationManagerUIConfigBuilder(state);
        expect(testItem.onConfigChanged).toBeNull();
        expect(testItem.notifyValidationStateChangedDelay).toBe(0);
        expect(testItem.savedInstanceState).toBeNull();
        expect(testItem.savedValueHostInstanceStates).toBeNull();
        expect(testItem.onTextValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
        expect(testItem.onValidationStateChanged).toBeNull();
        expect(testItem.onValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
    });

    // confirm constructor uses favorUIMessages option to set favorUIMessagesCount
    test('favorUIMessages option undefined runs favorUIMessages', () => {
        let builder = build(createVMConfig());
        builder.field('Field1').requireText();
        let uiBuilder = new Publicify_ValidationManagerUIConfigBuilder(
            builder.handOffState());    // no options

        expect(uiBuilder.favorUIMessagesCount).toBe(1);
    });
    test('favorUIMessages option true runs favorUIMessages', () => {
        let builder = build(createVMConfig());
        builder.field('Field1').requireText();
        let uiBuilder = new Publicify_ValidationManagerUIConfigBuilder(
            builder.handOffState(), { favorUIMessages: true });       

        expect(uiBuilder.favorUIMessagesCount).toBe(1);
    });
    test('favorUIMessages option false does not run favorUIMessages', () => {
        let builder = build(createVMConfig());
        builder.field('Field1').requireText();
        let uiBuilder = new Publicify_ValidationManagerUIConfigBuilder(
            builder.handOffState(), { favorUIMessages: false });        
        expect(uiBuilder.favorUIMessagesCount).toBeUndefined(); // because favorUIMessage is called in the constructor and the counter doesn't get initiatialized
    });

});

ensureFluentTestConditions();
describe('Fluent chaining on build(vmConfig).field', () => {
    test('build(vmConfig).field: Add RequireTest condition to FieldValueHostConfig via chaining', () => {
        let uiBuilder = setupPublicifyUIBuilder();
        let testItem = uiBuilder.field('Field1').testChainRequireText({}, 'Error', {});
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let parentConfig = (testItem as FluentValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).field: Add RequireTest and RegExp conditions to FieldValueHostConfig via chaining', () => {
        let uiBuilder = setupPublicifyUIBuilder();
        let testItem = uiBuilder.field('Field1')
            .testChainRequireText({}, 'Error', {})
            .testChainRegExp({ expressionAsString: '\\d' }, 'Error2');
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let parentConfig = (testItem as FluentValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(2);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.validatorConfigs![1].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![1].conditionConfig!.conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.validatorConfigs![1].conditionConfig! as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});

describe('favorUIMessages', () => {
    test('TextLocalizerService has no matches. Keep existing error messages', () => {
        let uiBuilder = setupPublicifyUIBuilder();
        let tls = new TextLocalizerService();
        uiBuilder.services.textLocalizerService = tls;   // start fresh
        uiBuilder.field('Field1').requireText(null, 'RequireMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        uiBuilder.field('Field2').regExp('\\d', null, null, 'RegExpMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }
        ).requireText(null, 'Field2Require');
        uiBuilder.field('Field3').requireText(null, null, // has no error message. Must use eml10n, which will result in ''
            {
                errorMessagel10n: 'eml10n',
                summaryMessagel10n: 'sml10n'
            }
        );
        uiBuilder.publicify_favorUIMessages();
        let vmConfig = uiBuilder.snapshot();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'RequireMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }]
        },
        {
            valueHostType: ValueHostType.Field,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expressionAsString: '\\d'
                    },
                    errorMessage: 'RegExpMessage',
                    errorMessagel10n: 'eml10n',
                    summaryMessage: 'SummaryRegExpMessage',
                    summaryMessagel10n: 'sml10n'
                },
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessage: 'Field2Require',
                }]
        },
        {
            valueHostType: ValueHostType.Field,
            name: 'Field3',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessagel10n: 'eml10n',
                    summaryMessagel10n: 'sml10n'
                }]
        }
        ]);
    });
    test('TextLocalizerService has matches. Null all 4 message properties on all matches', () => {
        let uiBuilder = setupPublicifyUIBuilder();

        let tls = new TextLocalizerService();
        uiBuilder.services.textLocalizerService = tls;   // start fresh
        tls.registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'tls-required'
        });
        tls.registerErrorMessage(ConditionType.RegExp, null, {
            '*': 'tls-regexp'
        });
        uiBuilder.field('Field1').requireText(null, 'RequireMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        uiBuilder.field('Field2').regExp('\\d', null, null, 'RegExpMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }).requireText(null, 'Field2Require');
        uiBuilder.publicify_favorUIMessages();
        let vmConfig = uiBuilder.snapshot();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'RequireMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n',                
            }]
        },
        {
            valueHostType: ValueHostType.Field,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expressionAsString: '\\d'
                    },
                    errorMessage: 'RegExpMessage',
                    errorMessagel10n: 'eml10n',
                    summaryMessage: 'SummaryRegExpMessage',
                    summaryMessagel10n: 'sml10n',                    
                },
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessage: 'Field2Require',
                }]
        }
        ]);
    });
});

describe('useOnlyTheseModelFields', () => {
    test('useOnlyTheseModelFields: Add 2 fields, then useOnlyTheseModelFields with 1 of the 2. Only the one is kept', () => {
        let vmConfig = createVMConfig();
        let builder = build(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let uiBuilder = createUIBuilder(builder);
        uiBuilder.useOnlyTheseModelFields(['Field1']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled does not exist
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBeUndefined();
        // get field2's config and inspect initialEnabled is false
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBe(false);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('useOnlyTheseModelFields')).toBe(false);
    });
    // empty array means keep none
    test('useOnlyTheseModelFields: Add 2 fields, then useOnlyTheseModelFields with empty array. None are kept', () => {
        let vmConfig = createVMConfig();
        let builder = build(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let uiBuilder = createUIBuilder(builder);

        uiBuilder.useOnlyTheseModelFields([]);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled is false
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBe(false);
        // get field2's config and inspect initialEnabled is false
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBe(false);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('useOnlyTheseModelFields')).toBe(false);
    });
    // unknown field name is ignored
    test('useOnlyTheseModelFields: Add 2 fields, then useOnlyTheseModelFields with 1 of the 2 and an unknown field. Only the one is kept', () => {
        let vmConfig = createVMConfig();
        let builder = build(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let uiBuilder = createUIBuilder(builder);
        uiBuilder.useOnlyTheseModelFields(['Field1', 'UnknownField']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled does not exist
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBeUndefined();
        // get field2's config and inspect initialEnabled is false
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBe(false);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('useOnlyTheseModelFields')).toBe(true);
        expect(loggerService.containsLog('UnknownField')).toBe(true);
        expect(loggerService.containsLog('Field1')).toBe(false);
    });
});
describe('disableTheseModelFields', () => {
    test('disableTheseModelFields: Add 2 fields, then disableTheseModelFields with 1 of the 2. Only the one is disabled', () => {
        let vmConfig = createVMConfig();
        let builder = build(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let uiBuilder = createUIBuilder(builder);
        uiBuilder.disableTheseModelFields(['Field1']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled is false
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBe(false);
        // get field2's config and inspect initialEnabled does not exist
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('disableTheseModelFields')).toBe(false);

    });
    // empty array
    test('disableTheseModelFields: Add 2 fields, then disableTheseModelFields with empty array. None are disabled', () => {
        let vmConfig = createVMConfig();
        let builder = build(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let uiBuilder = createUIBuilder(builder);
        uiBuilder.disableTheseModelFields([]);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled does not exist
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBeUndefined();
        // get field2's config and inspect initialEnabled does not exist
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('disableTheseModelFields')).toBe(false);
    });
    // unknown field name is ignored
    test('disableTheseModelFields: Add 2 fields, then disableTheseModelFields with 1 of the 2 and an unknown field. Only the one is disabled', () => {
        let vmConfig = createVMConfig();
        let builder = build(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let uiBuilder = createUIBuilder(builder);
        uiBuilder.disableTheseModelFields(['Field1', 'UnknownField']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled is false
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBe(false);
        // get field2's config and inspect initialEnabled does not exist
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('disableTheseModelFields')).toBe(true);
        expect(loggerService.containsLog('UnknownField')).toBe(true);
        expect(loggerService.containsLog('Field1')).toBe(false);
    });
});

describe('combineWithRule', () => {
    describe('3 parameter overload', () => {
        // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.
        test('Existing and new condition appear as the new value of ValidatorConfig within AllMatchCondition', () => {
            let vmConfig = createVMConfig();

            let uiBuilder = setupPublicifyUIBuilder();
            uiBuilder.field('Field1').requireText();

            let testItem = uiBuilder.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    combiningBuilder.all((childrenBuilder) =>
                        childrenBuilder.conditionConfig(existingConditionConfig).regExp(/abc/));
                }
            );
            expect(testItem).toBeInstanceOf(ValidationManagerConfigBuilder);
            let result = uiBuilder.publicify_destinationValueHostConfigs()[0] as FieldValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
                valueHostType: ValueHostType.Field,
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

            let uiBuilder = setupPublicifyUIBuilder();
            uiBuilder.field('Field1').requireText();

            uiBuilder.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            let result = uiBuilder.publicify_destinationValueHostConfigs()[0] as FieldValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
                valueHostType: ValueHostType.Field,
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

            let uiBuilder = setupPublicifyUIBuilder();
            uiBuilder.field('Field1').requireText();
            uiBuilder.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    ;
                }
            );
            let overriddenValueHostConfigs = uiBuilder.publicify_destinationValueHostConfigs();
            expect(overriddenValueHostConfigs.length).toBe(1);  // valueHostConfig was moved
            expect(overriddenValueHostConfigs[0]).toEqual({
                valueHostType: ValueHostType.Field,
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
            let uiBuilder = setupPublicifyUIBuilder();
            uiBuilder.field('Field1').requireText();

            let testItem = uiBuilder.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.All,
                (combiningBuilder: FluentConditionBuilder) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            expect(testItem).toBeInstanceOf(ValidationManagerConfigBuilder);
            let result = uiBuilder.publicify_destinationValueHostConfigs()[0] as FieldValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
                valueHostType: ValueHostType.Field,
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
            let uiBuilder = setupPublicifyUIBuilder();
            uiBuilder.field('Field1').requireText();

            let testItem = uiBuilder.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.When,
                (combiningBuilder: FluentConditionBuilder) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            expect(testItem).toBeInstanceOf(ValidationManagerConfigBuilder);
            let result = uiBuilder.publicify_destinationValueHostConfigs()[0] as FieldValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: [{
                    errorCode: ConditionType.RequireText,
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        enablerConfig: <RegExpConditionConfig>{
                            conditionType: ConditionType.RegExp,
                            expression: /abc/
                        },
                        childConditionConfig: {
                            conditionType: ConditionType.RequireText
                        }

                    }
                }]
            });
        });

        test('No changes are made in the builder results in preserving original ValidatorConfig', () => {
            let uiBuilder = setupPublicifyUIBuilder();
            uiBuilder.field('Field1').requireText();
            uiBuilder.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.All,
                (combiningBuilder: FluentConditionBuilder) => {
                    ;
                }
            );
            let overriddenValueHostConfigs = uiBuilder.publicify_destinationValueHostConfigs();
            expect(overriddenValueHostConfigs.length).toBe(1);  // valueHostConfig was moved
            expect(overriddenValueHostConfigs[0]).toEqual({
                valueHostType: ValueHostType.Field,
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
        let uiBuilder = setupPublicifyUIBuilder();
        uiBuilder.field('Field1').requireText();

        let testItem = uiBuilder.replaceRule('Field1', ConditionType.RequireText,
            (replacementBuilder: FluentConditionBuilder) => {
                replacementBuilder.regExp(/abc/);
            }
        );
        expect(testItem).toBeInstanceOf(ValidationManagerConfigBuilder);

        let result = uiBuilder.publicify_destinationValueHostConfigs()[0] as FieldValueHostConfig;
        expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
        deleteConditionReplacedSymbol(result.validatorConfigs![0]);

        expect(result).toEqual({
            valueHostType: ValueHostType.Field,
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
        let uiBuilder = setupPublicifyUIBuilder();
        uiBuilder.field('Field1').requireText();
        uiBuilder.replaceRule('Field1', ConditionType.RequireText,
            <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        );
        let result = uiBuilder.publicify_destinationValueHostConfigs()[0] as FieldValueHostConfig;
        expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
        deleteConditionReplacedSymbol(result.validatorConfigs![0]);

        expect(result).toEqual({
            valueHostType: ValueHostType.Field,
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