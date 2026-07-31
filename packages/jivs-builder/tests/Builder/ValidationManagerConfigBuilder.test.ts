import { BuildersFactoryInstaller } from './../../src/Services/BuildersFactoryInstaller';
import { RegExpConditionConfig, RequireTextCondition } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { IValidatableValueHostBase, ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IValidationManager, ValidationManagerConfig, ValidationManagerInstanceState } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValidationManagerConfigBuilder, createConfigBuilder } from '../../src/Builder/ValidationManagerConfigBuilder';
import { ValidatorBuilder } from './../../src/Builder/ValidatorBuilder';


function createVMConfig(): ValidationManagerConfig {
    let vmConfig: ValidationManagerConfig = {
        services: createJivsServicesForTesting(),
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
        return this.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValidationManagerConfig
    {
        return this.baseConfig;
    }
    public get publicify_overriddenValueHostConfigs(): Array<Array<ValueHostConfig>>
    {
        return this.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void
    {
        super.addOverride();
    }
    
}
beforeAll(() => {
    new BuildersFactoryInstaller();  // this will install buildersFactory on JivsServices.prototype
});


describe('constructor', () => {
    test('Creates a ValidationManagerConfigBuilder with the supplied JivsServices', () => {
        let services = createJivsServicesForTesting();
        let testItem = new ValidationManagerConfigBuilder(services);
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
    test('Creates a ValidationManagerConfigBuilder with the supplied ValidationManagerConfig', () => {
        let services = createJivsServicesForTesting();
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
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
});

describe('function build()', () => {
    test('Creates a ValidationManagerConfigBuilder with the supplied JivsServices', () => {
        let services = createJivsServicesForTesting();
        let testItem: ValidationManagerConfigBuilder;
        expect(() => testItem = createConfigBuilder(services)).not.toThrow();
        expect(testItem!).toBeInstanceOf(ValidationManagerConfigBuilder);
        let result = testItem!.complete();
        expect(result.services).toBe(services);
        expect(result.valueHostConfigs).toEqual([]);

        expect(result.onConfigChanged).toBeUndefined();
        expect(result.notifyValidationStateChangedDelay).toBeUndefined();
        expect(result.savedInstanceState).toBeUndefined();
        expect(result.savedValueHostInstanceStates).toBeUndefined();
        expect(result.onTextValueChanged).toBeUndefined();
        expect(result.onValueHostValidationStateChanged).toBeUndefined();
        expect(result.onValidationStateChanged).toBeUndefined();
        expect(result.onValueChanged).toBeUndefined();
        expect(result.onValueHostValidationStateChanged).toBeUndefined();        
    });
    test('Creates a ValidationManagerConfigBuilder with the supplied ValidationManagerConfig', () => {
        let services = createJivsServicesForTesting();
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        let testItem: ValidationManagerConfigBuilder;
        expect(() => testItem = createConfigBuilder(vmConfig)).not.toThrow();
        expect(testItem!).toBeInstanceOf(ValidationManagerConfigBuilder);
        let result = testItem!.complete();
        expect(result.services).toBe(services);   
        expect(result.valueHostConfigs).toEqual([]);
        expect(result.onConfigChanged).toBeUndefined();
        expect(result.notifyValidationStateChangedDelay).toBeUndefined();
        expect(result.savedInstanceState).toBeUndefined();
        expect(result.savedValueHostInstanceStates).toBeUndefined();
        expect(result.onTextValueChanged).toBeUndefined();
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

        let services = createJivsServicesForTesting();
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

        let services = createJivsServicesForTesting();
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
    test('onValueHostInstanceStateChanged', () => {
        function handler(valueHost: IValueHost, stateToRetain: ValueHostInstanceState): void
        {
            
        }
        function replacementHandler(valueHost: IValueHost, stateToRetain: ValueHostInstanceState): void
        {
            
        }
        let services = createJivsServicesForTesting();
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onValueHostInstanceStateChanged: handler
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onValueHostInstanceStateChanged).toBe(handler);
        testItem.onValueHostInstanceStateChanged = replacementHandler;
        expect(testItem.onValueHostInstanceStateChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onValueHostInstanceStateChanged).toBe(replacementHandler);
    });
    test('onValueChanged', () => {
        function handler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        function replacementHandler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        let services = createJivsServicesForTesting();
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onValueChanged: handler
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onValueChanged).toBe(handler);
        testItem.onValueChanged = replacementHandler;
        expect(testItem.onValueChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onValueChanged).toBe(replacementHandler);
    });
    
    test('onTextValueChanged', () => {
        function handler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        function replacementHandler(valueHost: IValueHost, oldValue: any): void
        {
            
        }
        let services = createJivsServicesForTesting();
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onTextValueChanged: handler
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onTextValueChanged).toBe(handler);
        testItem.onTextValueChanged = replacementHandler;
        expect(testItem.onTextValueChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onTextValueChanged).toBe(replacementHandler);
    });
    
    
    test('onInstanceStateChanged', () => {
        function handler(validationManager: IValidationManager, stateToRetain: ValidationManagerInstanceState): void
        {
            
        }
        function replacementHandler(validationManager: IValidationManager, stateToRetain: ValidationManagerInstanceState): void
        {
            
        }
        let services = createJivsServicesForTesting();
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onInstanceStateChanged: handler
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onInstanceStateChanged).toBe(handler);
        testItem.onInstanceStateChanged = replacementHandler;
        expect(testItem.onInstanceStateChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onInstanceStateChanged).toBe(replacementHandler);
    });
    test('onConfigChanged', () => {
        function handler(validationManager: IValidationManager, valueHostConfigs: Array<ValueHostConfig>): void
        {
            
        }
        function replacementHandler(validationManager: IValidationManager, valueHostConfigs: Array<ValueHostConfig>): void
        {
            
        }
        let services = createJivsServicesForTesting();
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [],
            onConfigChanged: handler
        };
        let testItem = new ValidationManagerConfigBuilder(vmConfig);
        expect(testItem.onConfigChanged).toBe(handler);
        testItem.onConfigChanged = replacementHandler;
        expect(testItem.onConfigChanged).toBe(replacementHandler);
        let result = testItem.complete();
        expect(result.onConfigChanged).toBe(replacementHandler);
    });    
    test('onValueHostValidationStateChanged', () => {
        function handler(valueHost: IValidatableValueHostBase, validationState: ValueHostValidationState): void
        {
            
        }
        function replacementHandler(valueHost: IValidatableValueHostBase, validationState: ValueHostValidationState): void
        {
            
        }
        let services = createJivsServicesForTesting();
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
        let services = createJivsServicesForTesting();
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

        let services = createJivsServicesForTesting();
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
        testItem.field('Field2').requireText();
        let result = testItem.complete();
        expect(result.services).toBe(vmConfig.services);
        expect(result.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Static,
            name: 'Field1',
            dataType: LookupKey.String,
            label: 'Field 1'
        },
        {
            valueHostType: ValueHostType.Field,
            name: 'Field2',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        }]);
        expect(testItem.publicify_baseConfig).toBeUndefined();  // indicates disposal
    });        
});

describe('Fluent chaining on build(vmConfig).field', () => {
    test('build(vmConfig).field: Add RequireTest condition to FieldValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').requireText('Error');
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
    });
    test('build(vmConfig).field: Add RequireTest and RegExp conditions to FieldValueHostConfig via chaining', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1')
            .requireText('Error')
            .regExp('\\d', true, 'Error2');
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(2);
        expect(parentConfig.validatorConfigs![0].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
        expect(parentConfig.validatorConfigs![1].conditionConfig).not.toBeNull();
        expect(parentConfig.validatorConfigs![1].conditionConfig!.conditionType).toBe(ConditionType.RegExp);
        expect((parentConfig.validatorConfigs![1].conditionConfig! as RegExpConditionConfig).expressionAsString).toBe('\\d');
    });
});
describe('customRule', () => {
    test('customRule(fn, error message, summary message), creates ValidatorBuilder with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').customRule((requester) => {
                return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
            },
            'Error',
            'Summary');
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBe('Error');
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBe('Summary');
    });
    test('customRule(fn), creates a ValidatorBuilder with validatorConfig.conditionCreator setup, and conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        });
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBeUndefined();
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBeUndefined();
    });
    // customRule(fn, error message, null)
    test('customRule(fn, error message, null), creates ValidatorBuilder with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            'Error',
            null);
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBe('Error');
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBeUndefined();
    });
    // customRule(fn, null, summary message)
    test('customRule(fn, null, summary message), creates ValidatorBuilder with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            null,
            'Summary');
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBeUndefined();
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBe('Summary');
    });
    // customRule(fn, { error message, summary message })
    test('customRule(fn, { error message, summary message }), creates ValidatorBuilder with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            {
                errorMessage: 'Error',
                summaryMessage: 'Summary'
            });
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBe('Error');
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBe('Summary');
    });
    // customRule(fn, { })
    test('customRule(fn, { }), creates ValidatorBuilder with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            {
            });
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBeUndefined();
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBeUndefined();
    });
    // customRule(fn, null)
    test('customRule(fn, null), creates ValidatorBuilder with validatorConfig.conditionCreator setup, and  conditionConfig null', () => {
        let vmConfig = createVMConfig();
        let builder = new Publicify_ValidationManagerConfigBuilder(vmConfig);
        let testItem = builder.field('Field1').customRule((requester) => {
            return new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: null });
        },
            null);
        expect(testItem).toBeInstanceOf(ValidatorBuilder);
        let parentConfig = (testItem as ValidatorBuilder).parentConfig;
        expect(parentConfig.validatorConfigs!.length).toBe(1);
        expect(parentConfig.validatorConfigs![0].conditionConfig).toBeNull();
        expect(parentConfig.validatorConfigs![0].conditionCreator).not.toBeNull();
        expect(parentConfig.validatorConfigs![0].errorMessage).toBeUndefined();
        expect(parentConfig.validatorConfigs![0].summaryMessage).toBeUndefined();
    });
});
