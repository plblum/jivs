import { MockValidationServices } from './../TestSupport/mocks';
import { ValidationManagerConfigBuilder, build } from '../../src/Validation/ValidationManagerConfigBuilder';
import { IValidationManager, ValidationManagerConfig, ValidationManagerInstanceState } from '../../src/Interfaces/ValidationManager';
import { ValueHostConfig, ValueHostInstanceState } from '../../src/Interfaces/ValueHost';
import { IValidatableValueHostBase, ValueHostValidationState } from '../../src/Interfaces/ValidatableValueHostBase';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { ValidationState } from '../../src/Interfaces/Validation';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { FluentConditionBuilder, FluentValidatorBuilder, customRule } from '../../src/ValueHosts/Fluent';
import { RegExpConditionConfig, RequireTextCondition } from '../../src/Conditions/ConcreteConditions';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ensureFluentTestConditions } from '../ValueHosts/ManagerConfigBuilderBase.test';
import { ICalcValueHost, CalcValueHostConfig } from '../../src/Interfaces/CalcValueHost';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { StaticValueHostConfig } from '../../src/Interfaces/StaticValueHost';
import { TextLocalizerService } from '../../src/Services/TextLocalizerService';
import { EvaluateChildConditionResultsBaseConfig } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { CombineUsingCondition, deleteConditionReplacedSymbol, hasConditionBeenReplaced } from '../../src/ValueHosts/ManagerConfigBuilderBase';
import { WhenConditionConfig } from '../../src/Conditions/WhenCondition';


function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: new MockValidationServices(false, true),
        valueHostConfigs: []
    };
    return vmConfig;
}

class Publicify_ValidationManagerConfigBuilder extends ValidationManagerConfigBuilder
{
    constructor(vmConfig: ValidationManagerConfig)
    {
        super(vmConfig);
    }
    public publicify_destinationValueHostConfigs(): Array<ValueHostConfig>
    {
        return super.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValidationManagerConfig
    {
        return super.baseConfig;
    }
    public get publicify_overriddenValueHostConfigs(): Array<Array<ValueHostConfig>>
    {
        return super.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void
    {
        super.addOverride();
    }
    
}
describe('constructor', () => {
    test('Creates a ValidationManagerConfigBuilder with the supplied ValidationServices', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new ValidationManagerConfigBuilder(services);
        expect(testItem.onConfigChanged).toBeNull();
        expect(testItem.notifyValidationStateChangedDelay).toBe(0);
        expect(testItem.savedInstanceState).toBeNull();
        expect(testItem.savedValueHostInstanceStates).toBeNull();
        expect(testItem.onInputValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
        expect(testItem.onValidationStateChanged).toBeNull();
        expect(testItem.onValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
    });
    test('Creates a ValidationManagerConfigBuilder with the supplied ValidationManagerConfig', () => {
        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onConfigChanged).toBeNull();
        expect(testItem.notifyValidationStateChangedDelay).toBe(0);
        expect(testItem.savedInstanceState).toBeNull();
        expect(testItem.savedValueHostInstanceStates).toBeNull();
        expect(testItem.onInputValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
        expect(testItem.onValidationStateChanged).toBeNull();
        expect(testItem.onValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
    });    
});

describe('function build()', () => {
    test('Creates a ValidationManagerConfigBuilder with the supplied ValidationServices', () => {
        let services = new MockValidationServices(false, false);
        let testItem: ValidationManagerConfigBuilder;
        expect(() => testItem = build(services)).not.toThrow();
        expect(testItem!).toBeInstanceOf(ValidationManagerConfigBuilder);
        let result = testItem!.complete();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([]);

        expect(result.onConfigChanged).toBeUndefined();
        expect(result.notifyValidationStateChangedDelay).toBeUndefined();
        expect(result.savedInstanceState).toBeUndefined();
        expect(result.savedValueHostInstanceStates).toBeUndefined();
        expect(result.onInputValueChanged).toBeUndefined();
        expect(result.onValueHostValidationStateChanged).toBeUndefined();
        expect(result.onValidationStateChanged).toBeUndefined();
        expect(result.onValueChanged).toBeUndefined();
        expect(result.onValueHostValidationStateChanged).toBeUndefined();        
    });
    test('Creates a ValidationManagerConfigBuilder with the supplied ValidationManagerConfig', () => {
        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        let testItem: ValidationManagerConfigBuilder;
        expect(() => testItem = build(vmConfig)).not.toThrow();
        expect(testItem!).toBeInstanceOf(ValidationManagerConfigBuilder);
        let result = testItem!.complete();
        expect(result.services).toBe(services);   
        expect(result.valueHostConfigs).toEqual([]);
        expect(result.onConfigChanged).toBeUndefined();
        expect(result.notifyValidationStateChangedDelay).toBeUndefined();
        expect(result.savedInstanceState).toBeUndefined();
        expect(result.savedValueHostInstanceStates).toBeUndefined();
        expect(result.onInputValueChanged).toBeUndefined();
        expect(result.onValueHostValidationStateChanged).toBeUndefined();
        expect(result.onValidationStateChanged).toBeUndefined();
        expect(result.onValueChanged).toBeUndefined();
        expect(result.onValueHostValidationStateChanged).toBeUndefined();               
    });
});
describe('instance state properties', () => {
    test('savedInstanceState', () => {
        const initialState: ValidationManagerInstanceState = {
            stateChangeCounter: 10
        };
        const replacementState: ValidationManagerInstanceState = {
            stateChangeCounter: 20,
        };

        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            savedInstanceState: initialState
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.savedInstanceState).toBe(initialState);
        testItem.savedInstanceState = replacementState;
        expect(testItem.savedInstanceState).toBe(replacementState);
        let result = testItem.complete();
        expect(result.savedInstanceState).toBe(replacementState);
    });    
    test('savedValueHostInstanceStates', () => {
        const initialState: Array<ValueHostInstanceState> = [{ name: 'Property1', value: 'A' }];
        const replacementState: Array<ValueHostInstanceState> = [{ name: 'Property1', value: 'B' }];

        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            savedValueHostInstanceStates: initialState
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.savedValueHostInstanceStates).toBe(initialState);
        testItem.savedValueHostInstanceStates = replacementState;
        expect(testItem.savedValueHostInstanceStates).toBe(replacementState);
        let result = testItem.complete();
        expect(result.savedValueHostInstanceStates).toBe(replacementState);
    });    
    
});
describe('Callbacks get and set', () => {
   
    test('onValueHostValidationStateChanged', () => {
        function handler(valueHost: IValidatableValueHostBase, validationState: ValueHostValidationState): void
        {
            
        }
        function replacementHandler(valueHost: IValidatableValueHostBase, validationState: ValueHostValidationState): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onValueHostValidationStateChanged: handler
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onValueHostValidationStateChanged).toBe(handler);
        testItem.onValueHostValidationStateChanged = replacementHandler;
        expect(testItem.onValueHostValidationStateChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onValueHostValidationStateChanged).toBe(replacementHandler);
    });
    
    test('onValidationStateChanged', () => {
        function handler(validationManager: IValidationManager, validationState: ValidationState): void
        {
            
        }
        function replacementHandler(validationManager: IValidationManager, validationState: ValidationState): void
        {
            
        }
        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onValidationStateChanged: handler
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onValidationStateChanged).toBe(handler);
        testItem.onValidationStateChanged = replacementHandler;
        expect(testItem.onValidationStateChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onValidationStateChanged).toBe(replacementHandler);
    });
    
    
    test('notifyValidationStateChangedDelay', () => {

        let services = new MockValidationServices(false, false);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            notifyValidationStateChangedDelay: 5
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.notifyValidationStateChangedDelay).toBe(5);
        testItem.notifyValidationStateChangedDelay = 10;
        expect(testItem.notifyValidationStateChangedDelay).toBe(10);
        let result = testItem.complete();
        expect(result.notifyValidationStateChangedDelay).toBe(10);
    });
    
});

describe('complete', () => {

    test('Using service, add 1 valueHost then override and add 2 with one matching the first name returns vmConfig with 2 valueHostConfigs with the first merged', () => {
        let vmConfig = createVMConfig();
        let testItem = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        testItem.static('Field1');
        testItem.publicify_addOverride();
        testItem.static('Field1', LookupKey.String, { label: 'Field 1' });
        testItem.property('Field2').requireText();
        let result = testItem.complete();
        expect(result.services).toBe(vmConfig.services);
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: LookupKey.String,
            label: 'Field 1'
        },
        {
            valueHostType: ValueHostType.Property,
            name: 'Field2',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        }]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
        expect(testItem.publicify_overriddenValueHostConfigs).toBeUndefined();
    });        
});
ensureFluentTestConditions();
describe('Fluent chaining on build(vmConfig).input', () => {
    test('build(vmConfig).input: Add RequireTest condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1').testChainRequireText({}, 'Error', {});
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let parentConfig = (testItem as FluentValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).input: Add RequireTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1')
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
describe('customRule', () => {
    test('Provide a valid function and get back a FluentValidatorBuilder with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            'Error',
            {
                summaryMessage: 'Summary'
            });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let parentConfig = (testItem as FluentValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBe('Error');
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBe('Summary');
    });
    test('Provide a valid function without errorMessage or validatorParameters and get back a FluentValidatorBuilder with validatorConfig.conditionCreator setup, and conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.input('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        });
        expect(testItem).toBeInstanceOf(FluentValidatorBuilder);
        let parentConfig = (testItem as FluentValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBeUndefined();
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBeUndefined();
    });

    test('Stand-alone call throws', () => {
        expect(() => customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            'Error',
            {
                summaryMessage: 'Summary'
            })).toThrow();
    });
});

describe('favorUIMessages', () => {
    test('TextLocalizerService has no matches. Keep existing error messages', () => {
        let vmConfig = createVMConfig();
        let tls = new TextLocalizerService();
        vmConfig.services.textLocalizerService = tls;   // start fresh

        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText(null, 'RequireMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        builder.input('Field2').regExp('\\d', null, null, 'RegExpMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }
        ).requireText(null, 'Field2Require');
        builder.input('Field3').requireText(null, null, // has no error message. Must use eml10n, which will result in ''
            {
                errorMessagel10n: 'eml10n',
                summaryMessagel10n: 'sml10n'
            }
        );        
        builder.favorUIMessages();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
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
            valueHostType: ValueHostType.Input,
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
                valueHostType: ValueHostType.Input,
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
        let vmConfig = createVMConfig();
        let tls = new TextLocalizerService();
        vmConfig.services.textLocalizerService = tls;   // start fresh
        tls.registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'tls-required'
        });
        tls.registerErrorMessage(ConditionType.RegExp, null, {
            '*': 'tls-regexp'
        });
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText(null, 'RequireMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        builder.input('Field2').regExp('\\d', null, null, 'RegExpMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }).requireText(null, 'Field2Require');
        builder.favorUIMessages();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        },
        {
            valueHostType: ValueHostType.Input,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expressionAsString: '\\d'
                    }
                },
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },

                }]
        }
        ]);
    });
    test('Using override({favorUIMessages: true})', () => {
        let vmConfig = createVMConfig();
        let tls = new TextLocalizerService();
        vmConfig.services.textLocalizerService = tls;   // start fresh
        tls.registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'tls-required'
        });
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText(null, 'RequireMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        builder.override({ favorUIMessages: true});

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        }
        ]);
    });    
    test('Using override({favorUIMessages: undefined})', () => {
        let vmConfig = createVMConfig();
        let tls = new TextLocalizerService();
        vmConfig.services.textLocalizerService = tls;   // start fresh
        tls.registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'tls-required'
        });
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText(null, 'RequireMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        builder.override();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        }
        ]);
    });        
    test('Using override({favorUIMessages: false}), no changes are made', () => {
        let vmConfig = createVMConfig();
        let tls = new TextLocalizerService();
        vmConfig.services.textLocalizerService = tls;   // start fresh
        tls.registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'tls-required'
        });
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText(null, 'RequireMessage',
            {
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        builder.override({ favorUIMessages: false});

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Input,
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
        }
        ]);
    });    
});

describe('convertPropertyToInput', () => {
    test('With no ValueHostConfigs defined, no changes and no exceptions', () => {
        let vmConfig = createVMConfig();
        
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let result: boolean;
        expect(() => result = builder.convertPropertyToInput()).not.toThrow();
        expect(result!).toBe(false);
    });
    test('With ValueHostConfigs defined but none with ValueHostType=Property, no changes', () => {
        let vmConfig = createVMConfig();
        
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let calcFn = (valueHost: ICalcValueHost, manager: IValueHostsManager) => 0;
        builder.calc('Field1', LookupKey.Number, calcFn);
        builder.static('Field2');
        builder.input('Field3');
        let expectedConfig: Array<ValueHostConfig> = [
            <CalcValueHostConfig>{
                valueHostType: ValueHostType.Calc,
                name: 'Field1',
                dataType: LookupKey.Number,
                calcFn: calcFn
            },
            <StaticValueHostConfig>{
                valueHostType: ValueHostType.Static,
                name: 'Field2'
            },
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field3',
                validatorConfigs: []
            },

        ];

        expect(builder.convertPropertyToInput()).toBe(false);
        expect(builder.publicify_baseConfig.valueHostConfigs).toEqual(expectedConfig);
    });    
    test('With ValueHostConfigs defined and all with ValueHostType=Property, changes to all ValueHostType properties', () => {
        let vmConfig = createVMConfig();
        
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.property('Field1', LookupKey.Number);
        builder.property('Field2');
        let expectedConfig: Array<ValueHostConfig> = [
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                dataType: LookupKey.Number,
                validatorConfigs: []
            },
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field2',
                validatorConfigs: []
            },

        ];

        expect(builder.convertPropertyToInput()).toBe(true);
        expect(builder.publicify_baseConfig.valueHostConfigs).toEqual(expectedConfig);
    });        

    test('With ValueHostConfigs defined in both baseconfig and overrides and all with ValueHostType=Property, changes to all ValueHostType properties in baseConfig and none in overrides', () => {
        let vmConfig = createVMConfig();
        
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.property('Field1', LookupKey.Number);
        builder.property('Field2');
        builder.override({ convertPropertyToInput: false, favorUIMessages: false });
        builder.property('Field3');
        let expectedBaseConfig: Array<ValueHostConfig> = [
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                dataType: LookupKey.Number,
                validatorConfigs: []
            },
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field2',
                validatorConfigs: []
            },

        ];
        let expectedOverrideConfig: Array<ValueHostConfig> = [
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Property,
                name: 'Field3',
                validatorConfigs: []
            }

        ];
        expect(builder.convertPropertyToInput()).toBe(true);
        expect(builder.publicify_baseConfig.valueHostConfigs).toEqual(expectedBaseConfig);
        expect(builder.publicify_overriddenValueHostConfigs[0]).toEqual(expectedOverrideConfig);
    });       
    test('Using override({ convertPropertyToInput: true} ) to invoke, with ValueHostConfigs defined in baseconfig and all with ValueHostType=Property, changes to all ValueHostType properties in baseConfig', () => {
        let vmConfig = createVMConfig();
        
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.property('Field1', LookupKey.Number);
        builder.property('Field2');
        builder.override({ convertPropertyToInput: true, favorUIMessages: false });
        let expectedBaseConfig: Array<ValueHostConfig> = [
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                dataType: LookupKey.Number,
                validatorConfigs: []
            },
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field2',
                validatorConfigs: []
            },

        ];

        expect(builder.publicify_baseConfig.valueHostConfigs).toEqual(expectedBaseConfig);
    });        
    test('Using override({ convertPropertyToInput: undefined } ) to invoke, with ValueHostConfigs defined in baseconfig and all with ValueHostType=Property, changes to all ValueHostType properties in baseConfig', () => {
        let vmConfig = createVMConfig();
        
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.property('Field1', LookupKey.Number);
        builder.property('Field2');
        builder.override({ favorUIMessages: false });
        let expectedBaseConfig: Array<ValueHostConfig> = [
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                dataType: LookupKey.Number,
                validatorConfigs: []
            },
            <InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field2',
                validatorConfigs: []
            },

        ];

        expect(builder.publicify_baseConfig.valueHostConfigs).toEqual(expectedBaseConfig);
    });            
});
describe('conditions()', () => {
    test('Undefined parameter creates a FluentConditionBuilder with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions();
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('null parameter creates a FluentConditionBuilder with vhConfig containing type=TBD and collectionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(null!);
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: 'TBD',
            conditionConfigs: []
        });
    });
    test('Supplied parameter creates a FluentConditionBuilder with the same vhConfig', () => {
        let vmConfig = createVMConfig();

        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        }
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });
    test('Supplied parameter with conditionConfig=null creates a FluentValidatorBuilder with the same vhConfig and conditionConfig=[]', () => {
        let vmConfig = createVMConfig();

        let parentConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: null as unknown as Array<ConditionConfig>
        }
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(parentConfig);
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        expect(testItem.parentConfig).toEqual({
            conditionType: ConditionType.All,
            conditionConfigs: []
        });
    });
    test('Add RequireTest condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions().testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        let parentConfig = (testItem as FluentConditionBuilder).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
    });
    test('Add RequireTest and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions()
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        let parentConfig = (testItem as FluentConditionBuilder).parentConfig;
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
    test('With EvaluateChildConditionResultsBaseConfig parameter: Add RequireText condition to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let eccrConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: 'All',
            conditionConfigs: []
        };
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(eccrConfig).testChainRequireText({});
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        let parentConfig = (testItem as FluentConditionBuilder).parentConfig;
        expect(parentConfig).toBe(eccrConfig);
        expect(parentConfig.conditionConfigs!.length).toBe(1);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
    });
    test('With EvaluateChildConditionResultsBaseConfig parameter: Add RequireText and RegExp conditions to InputValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();

        let eccrConfig: EvaluateChildConditionResultsBaseConfig = {
            conditionType: 'All',
            conditionConfigs: []
        };
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.conditions(eccrConfig)
            .testChainRequireText({})
            .testChainRegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionBuilder);
        let parentConfig = (testItem as FluentConditionBuilder).parentConfig;
        expect(parentConfig).toBe(eccrConfig);
        expect(parentConfig.conditionConfigs!.length).toBe(2);
        expect(parentConfig.conditionConfigs![0]).not.toBeNull();
        expect(parentConfig.conditionConfigs![0].conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.conditionConfigs![1]).not.toBeNull();
        expect(parentConfig.conditionConfigs![1].conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.conditionConfigs![1] as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});

describe('combineWithRule', () => {
    describe('3 parameter overload', () => {
        // NOTE: Error handling found in the underlying objects is not tested here. It is tested in the ManagerConfigBuilderBase tests.
        test('Existing and new condition appear as the new value of ValidatorConfig within AllMatchCondition', () => {
            let vmConfig = createVMConfig();

            let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            builder.override();
            builder.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    combiningBuilder.all((childrenBuilder) =>
                        childrenBuilder.conditionConfig(existingConditionConfig).regExp(/abc/));
                }
            );
            let result = builder.publicify_destinationValueHostConfigs()[0] as InputValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
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

            let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            builder.override();
            builder.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            let result = builder.publicify_destinationValueHostConfigs()[0] as InputValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
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

            let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            builder.override();
            builder.combineWithRule('Field1', ConditionType.RequireText,
                (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                    ;
                }
            );
            let overriddenValueHostConfigs = builder.publicify_destinationValueHostConfigs();
            expect(overriddenValueHostConfigs.length).toBe(1);  // valueHostConfig was moved
            expect(overriddenValueHostConfigs[0]).toEqual({
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

            let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            builder.override();
            builder.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.All,
                (combiningBuilder: FluentConditionBuilder) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            let result = builder.publicify_destinationValueHostConfigs()[0] as InputValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
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

            let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            builder.override();
            builder.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.When,
                (combiningBuilder: FluentConditionBuilder) => {
                    combiningBuilder.regExp(/abc/);
                }
            );
            let result = builder.publicify_destinationValueHostConfigs()[0] as InputValueHostConfig;
            expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
            deleteConditionReplacedSymbol(result.validatorConfigs![0]);

            expect(result).toEqual({
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

            let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
            builder.input('Field1').requireText();
            builder.override();
            builder.combineWithRule('Field1', ConditionType.RequireText,
                CombineUsingCondition.All,
                (combiningBuilder: FluentConditionBuilder) => {
                    ;
                }
            );
            let overriddenValueHostConfigs = builder.publicify_destinationValueHostConfigs();
            expect(overriddenValueHostConfigs.length).toBe(1);  // valueHostConfig was moved
            expect(overriddenValueHostConfigs[0]).toEqual({
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

        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText();
        builder.override();
        builder.replaceRule('Field1', ConditionType.RequireText,
            (replacementBuilder: FluentConditionBuilder) => {
                replacementBuilder.regExp(/abc/);
            }
        );
        let result = builder.publicify_destinationValueHostConfigs()[0] as InputValueHostConfig;
        expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
        deleteConditionReplacedSymbol(result.validatorConfigs![0]);

        expect(result).toEqual({
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

        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        builder.input('Field1').requireText();
        builder.override();
        builder.replaceRule('Field1', ConditionType.RequireText,
            <RegExpConditionConfig>{
                conditionType: ConditionType.RegExp,
                expression: /abc/
            }
        );
        let result = builder.publicify_destinationValueHostConfigs()[0] as InputValueHostConfig;
        expect(hasConditionBeenReplaced(result.validatorConfigs![0])).toBe(true);
        deleteConditionReplacedSymbol(result.validatorConfigs![0]);

        expect(result).toEqual({
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