import { jest } from '@jest/globals';
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { MockValidationServices } from "../TestSupport/mocks";
import { BusinessLogicErrorsValueHost, BusinessLogicErrorsValueHostName } from '../../src/ValueHosts/BusinessLogicErrorsValueHost';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { IInputValueHost, InputValueHostConfig, InputValueHostInstanceState } from '../../src/Interfaces/InputValueHost';
import { IssueFound, ValidationSeverity, ValidationState, BusinessLogicError, ValidateOptions, ValidationStatus, ValueHostValidateResult, SetIssuesFoundErrorCodeMissingBehavior } from '../../src/Interfaces/Validation';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import {
    IValidationManager, IValidationManagerCallbacks, ValidationManagerConfig, ValidationManagerInstanceState, toIValidationManager,
    toIValidationManagerCallbacks
} from '../../src/Interfaces/ValidationManager';
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { ConditionCategory, ConditionEvaluateResult } from "../../src/Interfaces/Conditions";
import { IValidatableValueHostBase, ValueHostValidationState, ValueHostValidationStateChangedHandler } from "../../src/Interfaces/ValidatableValueHostBase";
import {
    AlwaysMatchesConditionType, NeverMatchesConditionType, IsUndeterminedConditionType, UserSuppliedResultConditionConfig,
    UserSuppliedResultCondition, UserSuppliedResultConditionType
} from "../TestSupport/conditionsForTesting";
import { IValueHostsManager, ValueHostsManagerInstanceState, ValueHostsManagerInstanceStateChangedHandler } from "../../src/Interfaces/ValueHostsManager";
import { IValidatorsValueHostBase } from "../../src/Interfaces/ValidatorsValueHostBase";
import { IValueHostAccessor } from "../../src/Interfaces/ValueHostAccessor";
import { ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { IStaticValueHost, StaticValueHostConfig, StaticValueHostInstanceState } from "../../src/Interfaces/StaticValueHost";
import { IPropertyValueHost } from "../../src/Interfaces/PropertyValueHost";
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { InputValueHost, InputValueHostGenerator } from '../../src/ValueHosts/InputValueHost';
import { PropertyValueHost } from '../../src/ValueHosts/PropertyValueHost';
import { RegExpConditionConfig, RegExpCondition, EqualToValueConditionConfig, EqualToValueCondition } from '../../src/Conditions/ConcreteConditions';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';
import { deepClone } from '../../src/Utilities/Utilities';
import { ValidatableValueHostBase } from '../../src/ValueHosts/ValidatableValueHostBase';
import { StaticValueHost } from '../../src/ValueHosts/StaticValueHost';
import { CalcValueHost } from '../../src/ValueHosts/CalcValueHost';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import { ValidationManagerConfigBuilder, build } from '../../src/Validation/ValidationManagerConfigBuilder';
import { ValidationManagerStartFluent } from '../../src/ValueHosts/Fluent';

// Subclass of what we want to test to expose internals to tests
class PublicifiedValidationManager extends ValidationManager<ValidationManagerInstanceState> {
    constructor(setup: ValidationManagerConfig | ValidationManagerConfigBuilder) {
        super(setup as any);
    }

    public get exposedValueHosts(): Map<string, IValueHost> {
        return this.valueHosts;
    }
    public get exposedValueHostConfigs(): Map<string, ValueHostConfig> {
        return this.valueHostConfigs;
    }
    public get exposedState(): ValidationManagerInstanceState {
        return this.instanceState;
    }

}

//  constructor(setup: ValidationManagerConfig)
describe('constructor and initial property values', () => {
    test('No configs (empty array), an empty state and no callback', () => {
        let testItem: PublicifiedValidationManager | null = null;
        let services = new MockValidationServices(false, false);
        expect(() => testItem = new PublicifiedValidationManager({ services: services, valueHostConfigs: [] })).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(0);
        expect(testItem!.exposedValueHostConfigs.size).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValidationStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostValidationStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();
    });
    test('With builder, No configs (empty array), an empty state and no callback', () => {
        let services = new MockValidationServices(false, false);
        let builder = new ValidationManagerConfigBuilder(services);
        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(builder)).not.toThrow();
        expect(testItem!.services).toBe(services);
        
        expect(testItem!.exposedValueHosts.size).toBe(0);
        expect(testItem!.exposedValueHostConfigs.size).toBe(0);
        expect(testItem!.exposedState).not.toBeNull();
        expect(testItem!.exposedState.stateChangeCounter).toBe(0);
        expect(testItem!.onInstanceStateChanged).toBeNull();
        expect(testItem!.onValidationStateChanged).toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).toBeNull();
        expect(testItem!.onValueHostValidationStateChanged).toBeNull();
        expect(testItem!.onValueChanged).toBeNull();
        expect(testItem!.onInputValueChanged).toBeNull();
        expect(testItem!.onConfigChanged).toBeNull();
    });

    test('Callbacks supplied. Other parameters are null', () => {
        let setup: ValidationManagerConfig = {
            services: new MockValidationServices(false, false),
            valueHostConfigs: [],
            onInstanceStateChanged: (valueHostsManager: IValueHostsManager, state: ValidationManagerInstanceState) => { },
            onValidationStateChanged: (validationManager: IValidationManager, validationState : ValidationState) => { },
            onValueHostInstanceStateChanged: (valueHost: IValueHost, state: ValueHostInstanceState) => { },
            onValueHostValidationStateChanged: (valueHost: IValidatableValueHostBase, snapshot: ValueHostValidationState) => { },
            onValueChanged: (valueHost: IValueHost, oldValue: any) => { },
            onInputValueChanged: (valueHost: IValidatableValueHostBase, oldValue: any) => { },
            onConfigChanged: (manager: IValueHostsManager, valueHostConfigs: Array<ValueHostConfig>) => { }
        };

        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(setup)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValidationStateChanged).not.toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueHostValidationStateChanged).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
        expect(testItem!.onConfigChanged).not.toBeNull();
    });
    test('With builder, Callbacks supplied. Other parameters are null', () => {
        let builder = new ValidationManagerConfigBuilder(new MockValidationServices(false, false));

        builder.onInstanceStateChanged = (valueHostsManager: IValueHostsManager, state: ValidationManagerInstanceState) => { };
        builder.onValidationStateChanged = (validationManager: IValidationManager, validationState: ValidationState) => { };
        builder.onValueHostInstanceStateChanged = (valueHost: IValueHost, state: ValueHostInstanceState) => { };
        builder.onValueHostValidationStateChanged = (valueHost: IValidatableValueHostBase, snapshot: ValueHostValidationState) => { };
        builder.onValueChanged = (valueHost: IValueHost, oldValue: any) => { };
        builder.onInputValueChanged = (valueHost: IValidatableValueHostBase, oldValue: any) => { };
        builder.onConfigChanged = (manager: IValueHostsManager, valueHostConfigs: Array<ValueHostConfig>) => { };

        let testItem: PublicifiedValidationManager | null = null;
        expect(() => testItem = new PublicifiedValidationManager(builder)).not.toThrow();

        // other tests will confirm that the function correctly runs
        expect(testItem!.onInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValidationStateChanged).not.toBeNull();
        expect(testItem!.onValueHostInstanceStateChanged).not.toBeNull();
        expect(testItem!.onValueHostValidationStateChanged).not.toBeNull();
        expect(testItem!.onValueChanged).not.toBeNull();
        expect(testItem!.onInputValueChanged).not.toBeNull();
        expect(testItem!.onConfigChanged).not.toBeNull();
    });    
    test('Configure with an actual RegExp object to ensure that object is still present when needed', () => {
        let services = createValidationServicesForTesting();
        let cf = services.conditionFactory as ConditionFactory;
        cf.register<RegExpConditionConfig>(ConditionType.RegExp, (config) => new RegExpCondition(config));
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [<InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Property1',
                dataType: LookupKey.String,
                validatorConfigs: [
                    {
                        conditionConfig: <RegExpConditionConfig> {
                            conditionType: ConditionType.RegExp,
                            valueHostName: 'Property1',
                            expression: /^ABC$/im // <<< monitoring this value
                        }
                    
                    }
                ]
            }]
        });

        let vh = vm.getInputValueHost('Property1')!;
        vh.setValue('ABC');
        vh.validate();
        expect(vh.validationStatus).toBe(ValidationStatus.Valid);
        vh.setValue('ABCDEF');
        vh.validate();
        expect(vh.validationStatus).toBe(ValidationStatus.Invalid);
    });
    test('With Builder, Configure with an actual RegExp object to ensure that object is still present when needed', () => {
        let services = createValidationServicesForTesting();
        let cf = services.conditionFactory as ConditionFactory;
        cf.register<RegExpConditionConfig>(ConditionType.RegExp, (config) => new RegExpCondition(config));
        let builder = new ValidationManagerConfigBuilder(services);
        builder.input('Property1', LookupKey.String).regExp(/^ABC$/im);
        let vm = new ValidationManager(builder);

        let vh = vm.getInputValueHost('Property1')!;
        vh.setValue('ABC');
        vh.validate();
        expect(vh.validationStatus).toBe(ValidationStatus.Valid);
        vh.setValue('ABCDEF');
        vh.validate();
        expect(vh.validationStatus).toBe(ValidationStatus.Invalid);
    });    
    test('Configure with an actual Date object to ensure that object is still present when needed', () => {
        let services = createValidationServicesForTesting();
        let cf = services.conditionFactory as ConditionFactory;
        cf.register<EqualToValueConditionConfig>(ConditionType.EqualToValue, (config) => new EqualToValueCondition(config));
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: [<InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Property1',
                dataType: LookupKey.Date,
                validatorConfigs: [
                    {
                        conditionConfig: <EqualToValueConditionConfig> {
                            conditionType: ConditionType.EqualToValue,
                            valueHostName: 'Property1',
                            secondValue: new Date(2000, 0, 1)
                        }
                    
                    }
                ]
            }],
            savedValueHostInstanceStates: [
                {
                    name: 'Property1',
                    value: new Date(2000, 0, 1) // <<< monitoring this value
                    
                }
            ]
        });

        let vh = vm.getInputValueHost('Property1')!;
        vh.validate();
        expect(vh.validationStatus).toBe(ValidationStatus.Valid);
    });
    test('Using Builder, Configure with an actual Date object to ensure that object is still present when needed', () => {
        let services = createValidationServicesForTesting();
        let cf = services.conditionFactory as ConditionFactory;
        cf.register<EqualToValueConditionConfig>(ConditionType.EqualToValue, (config) => new EqualToValueCondition(config));
        let builder = new ValidationManagerConfigBuilder(services);
        builder.input('Property1', LookupKey.Date).equalToValue(new Date(2000, 0, 1));
        builder.savedValueHostInstanceStates = [
            {
                name: 'Property1',
                value: new Date(2000, 0, 1) // <<< monitoring this value
                
            }
        ];

        let vm = new ValidationManager(builder);

        let vh = vm.getInputValueHost('Property1')!;
        vh.validate();
        expect(vh.validationStatus).toBe(ValidationStatus.Valid);
    });    
});

function setupValidationManager(configs?: Array<InputValueHostConfig> | null,
    savedState?: ValidationManagerInstanceState | null,
    callbacks?: IValidationManagerCallbacks): {
        services: IValidationServices,
        validationManager: IValidationManager
    } {
    let services = createValidationServicesForTesting();
    services.autoGenerateDataTypeCheckService.enabled = false;
    services.dataTypeParserService.enabled = false;
    
    let setup: ValidationManagerConfig = {
        services: services,
        valueHostConfigs: configs!,
        savedInstanceState: savedState!,
        savedValueHostInstanceStates: []
    };
    if (callbacks)
        setup = { ...callbacks, ...setup } as ValidationManagerConfig;
    let vm = new PublicifiedValidationManager(setup);

    return {
        services: services,
        validationManager: vm
    };
}

function setupInputValueHostConfig(fieldIndex: number,
    conditionTypes: Array<string> | null): InputValueHostConfig {
    let labelNumber = fieldIndex + 1;
    let config: InputValueHostConfig = {
        name: `Field${labelNumber}`,
        valueHostType: ValueHostType.Input,
        label: `Field ${labelNumber}`,
        validatorConfigs: null,
    };
    if (conditionTypes)
        for (let conditionType of conditionTypes) {
            if (!config.validatorConfigs)
                config.validatorConfigs = [];
            config.validatorConfigs.push({
                conditionConfig: {
                    conditionType: conditionType
                },
                errorMessage: `Error ${labelNumber}: ${conditionType}`,
                summaryMessage: `Summary ${labelNumber}: ${conditionType}`
            });
        }

    return config;
}

describe('startModifying()', () => {
    test('input().requireText() gets added correctly', () => {
        let vmConfig: ValidationManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValidationManager(vmConfig);

        let modifier = testItem.startModifying();
        modifier.input('Field1', null, { label: 'Field 1' }).requireText(null, 'msg');
        modifier.apply();

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBeNull();
        let ivh1 = vh1 as InputValueHost;
        expect(ivh1.getValidator(ConditionType.RequireText)).toBeDefined();

        // prove the error message was used.

        ivh1.setValues('', ''); // will be Invalid
        let result = ivh1.validate();
        expect(result).toEqual(<ValueHostValidateResult>{
            status: ValidationStatus.Invalid,
            issuesFound: [
                {
                    errorCode: ConditionType.RequireText,
                    valueHostName: 'Field1',
                    severity: ValidationSeverity.Severe,    // due to required
                    errorMessage: 'msg',
                    summaryMessage: 'msg'
                }
            ]
        });
    });
    test('Add Input then replace it fully replaces.', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(true, true), valueHostConfigs: [] });
        let modifier = testItem.startModifying();
        modifier.input('Field1', null, { label: 'Field 1' });
        modifier.apply();

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBeNull();
        expect((vh1 as InputValueHost).getValidator(ConditionType.RequireText)).toBeNull();

        let modifier2 = testItem.startModifying();
        modifier2.input('Field1', 'TEST', { label: 'Field 1' }).requireText({}, 'Error');
        modifier2.apply();

        let vh2 = testItem.getValueHost('Field1');
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.getName()).toBe('Field1');
        expect(vh2!.getLabel()).toBe('Field 1');
        expect(vh2!.getDataType()).toBe('TEST');
        let ivh2 = vh2 as InputValueHost;
        let vh2Validator = ivh2.getValidator(ConditionType.RequireText);
        expect(vh2Validator).toBeDefined();

        // prove the error message was used.

        ivh2.setValues('', ''); // will be Invalid
        let result = ivh2.validate();
        expect(result).toEqual(<ValueHostValidateResult>{
            status: ValidationStatus.Invalid,
            issuesFound: [
                {
                    errorCode: ConditionType.RequireText,
                    valueHostName: 'Field1',
                    severity: ValidationSeverity.Severe,    // due to required
                    errorMessage: 'Error',
                    summaryMessage: 'Error'
                }
            ]
        });
    });
    test('property().requireText() gets added correctly', () => {
        let vmConfig: ValidationManagerConfig = {
            services: new MockValidationServices(true, false), valueHostConfigs: []
        };
        let testItem = new PublicifiedValidationManager(vmConfig);

        let modifier = testItem.startModifying();
        modifier.property('Field1', null, { label: 'Field 1' }).requireText(null, 'msg');
        modifier.apply();

        let vh1 = testItem.getValueHost('Field1');
        expect(vh1).toBeInstanceOf(PropertyValueHost);
        expect(vh1!.getName()).toBe('Field1');
        expect(vh1!.getLabel()).toBe('Field 1');
        expect(vh1!.getDataType()).toBeNull();
        let ivh1 = vh1 as PropertyValueHost;
        expect(ivh1.getValidator(ConditionType.RequireText)).toBeDefined();

        // prove the error message was used.

        ivh1.setValue(''); // will be Invalid
        let result = ivh1.validate();
        expect(result).toEqual(<ValueHostValidateResult>{
            status: ValidationStatus.Invalid,
            issuesFound: [
                {
                    errorCode: ConditionType.RequireText,
                    valueHostName: 'Field1',
                    severity: ValidationSeverity.Severe,    // due to required
                    errorMessage: 'msg',
                    summaryMessage: 'msg'
                }
            ]
        });
    });    
});

function testValueHostInstanceState(testItem: PublicifiedValidationManager, valueHostName: ValueHostName,
    instanceState: Partial<InputValueHostInstanceState> | null): void
{
    let valueHost = testItem.exposedValueHosts.get(valueHostName) as InputValueHost;
    expect(valueHost).toBeDefined();
    expect(valueHost).toBeInstanceOf(InputValueHost);

    if (!instanceState)
        instanceState = {};
    // fill in missing properties from factory createInstanceState defaults
    let factory = new ValueHostFactory();
    factory.register(new InputValueHostGenerator());
    let config = testItem.exposedValueHostConfigs.get(valueHostName) as InputValueHostConfig;
    let defaultState = factory.createInstanceState(config) as InputValueHostInstanceState;    

    let stateToCompare: InputValueHostInstanceState = { ...defaultState, ...instanceState, };

    // ensure ValueHost has an initial state. Use updateState() because it is the only time we can see the real state
    valueHost.updateInstanceState((stateToUpdate) => {
        expect(stateToUpdate).toEqual(stateToCompare);
        return stateToUpdate;
    }, valueHost);        
}

describe('addToValueHosts with Input or Property ValueHosts', () => {
    
    test('Add InputValueHostConfig with required ConditionConfig', () => {
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(true, false), valueHostConfigs: []
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);
        expect(testItem.exposedValueHostConfigs.get('Field1')).toBeDefined();     
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
    });    

    test('InstanceState with ValidationStatus=Valid already exists for the ValueHostConfig being added. That state is used', () => {

        let savedState: ValidationManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: savedState, savedValueHostInstanceStates: savedValueHostInstanceStates
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);

        testValueHostInstanceState(testItem, 'Field1', savedValueHostInstanceState);        
    });
    test('With Builder, InstanceState with ValidationStatus=Valid already exists for the ValueHostConfig being added. That state is used', () => {

        let savedState: ValidationManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];
        let builder = new ValidationManagerConfigBuilder(new MockValidationServices(false, false));
        builder.savedInstanceState = savedState;
        builder.savedValueHostInstanceStates = savedValueHostInstanceStates;
        
        let testItem = new PublicifiedValidationManager(builder);
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);

        testValueHostInstanceState(testItem, 'Field1', savedValueHostInstanceState);        
    });    
    test('InstanceState with ValidationStatus=Invalid already exists for the ValueHostConfig being added.', () => {

        let savedState: ValueHostsManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid, // something we can return
            value: 10,   // something we can return,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];      
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: savedState, savedValueHostInstanceStates: savedValueHostInstanceStates
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);

        testValueHostInstanceState(testItem, 'Field1', savedValueHostInstanceState);        
    });    
    test('With Builder, InstanceState with ValidationStatus=Invalid already exists for the ValueHostConfig being added.', () => {

        let savedState: ValueHostsManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid, // something we can return
            value: 10,   // something we can return,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];      
        let builder = new ValidationManagerConfigBuilder(new MockValidationServices(false, false));
        builder.savedInstanceState = savedState;
        builder.savedValueHostInstanceStates = savedValueHostInstanceStates;
        
        let testItem = new PublicifiedValidationManager(builder);
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);

        testValueHostInstanceState(testItem, 'Field1', savedValueHostInstanceState);        
    });    
    test('InstanceState already exists in two places: lastValueHostInstanceState and as parameter for addValueHost. State is sourced from addValueHost.', () => {
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        let savedState: ValueHostsManagerInstanceState = {};
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [];
        savedValueHostInstanceStates.push(<InputValueHostInstanceState>{
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10   // something we can return
        });
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: savedState, savedValueHostInstanceStates: savedValueHostInstanceStates
        });
        let addState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 20,
            status: ValidationStatus.Invalid,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        testItem.addValueHost(config, addState);

        testValueHostInstanceState(testItem, 'Field1', addState);        
    });    
    test('With Builder, InstanceState already exists in two places: lastValueHostInstanceState and as parameter for addValueHost. State is sourced from addValueHost.', () => {
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        let savedState: ValueHostsManagerInstanceState = {};
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [];
        savedValueHostInstanceStates.push(<InputValueHostInstanceState>{
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10   // something we can return
        });
        let builder = new ValidationManagerConfigBuilder(new MockValidationServices(false, false));
        builder.savedInstanceState = savedState;
        builder.savedValueHostInstanceStates = savedValueHostInstanceStates;
        
        let testItem = new PublicifiedValidationManager(builder);
        let addState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 20,
            status: ValidationStatus.Invalid,
            issuesFound: [{
                errorMessage: 'msg',
                valueHostName: 'Field1',
                errorCode: ConditionType.RequireText,
                severity: ValidationSeverity.Error
            }]
        };
        testItem.addValueHost(config, addState);

        testValueHostInstanceState(testItem, 'Field1', addState);        
    });
    test('InstanceState instance is changed after passing in has no impact on stored state', () => {

        let lastState: ValueHostsManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false), valueHostConfigs: [],
            savedInstanceState: lastState, savedValueHostInstanceStates: savedValueHostInstanceStates
        });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);
        let copiedLastState = deepClone(savedValueHostInstanceState) as InputValueHostInstanceState;
        savedValueHostInstanceState.value = 20;

        testValueHostInstanceState(testItem, 'Field1', copiedLastState);        
    });    
    test('With Builder, InstanceState instance is changed after passing in has no impact on stored state', () => {

        let lastState: ValueHostsManagerInstanceState = {};

        let savedValueHostInstanceState: InputValueHostInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid, // something we can return
            value: 10,   // something we can return,
            issuesFound: null
        };
        let savedValueHostInstanceStates: Array<ValueHostInstanceState> = [savedValueHostInstanceState];
        let builder = new ValidationManagerConfigBuilder(new MockValidationServices(false, false));
        builder.savedInstanceState = lastState;
        builder.savedValueHostInstanceStates = savedValueHostInstanceStates;
        
        let testItem = new PublicifiedValidationManager(builder);
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText,
                    },
                    errorMessage: 'msg'
                }
            ]
        };
        testItem.addValueHost(config, null);
        let copiedLastState = deepClone(savedValueHostInstanceState) as InputValueHostInstanceState;
        savedValueHostInstanceState.value = 20;

        testValueHostInstanceState(testItem, 'Field1', copiedLastState);        
    });    
});
describe('ValueHostsManager.addOrUpdateValueHost completely replaces the ValueHost instance', () => {
    test('Replace the config to install a validator', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config };
        replacementConfig.validatorConfigs = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType,
                },
                errorMessage: 'Error'
            }
        ];
        let replacementValidatorConfig = replacementConfig.validatorConfigs[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrUpdateValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHosts.get('Field1')).toBe(replacementValueHost);
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toEqual(config);
        expect(config.validatorConfigs).toBeNull();

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(replacementConfig);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(replacementConfig);
        expect(replacementConfig.validatorConfigs[0]).toBe(replacementValidatorConfig);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', null);
    });
    test('addOrUpdateValueHost works like addValueHost with unknown ValueHostConfig', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addOrUpdateValueHost(config, null)).not.toThrow();

        
        expect(testItem.exposedValueHosts.size).toBe(1);

        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', null);
    });

    test('Replace the config with existing ValueHostInstanceState.ValidationStatus of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config };
        replacementConfig.validatorConfigs = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                errorMessage: 'Error'
            }
        ];
        let replacementValidatorConfig = replacementConfig.validatorConfigs[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrUpdateValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHosts.get('Field1')).toBe(replacementValueHost);

        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);
        expect(config.validatorConfigs).toBeNull();

        // ensure ValueHost is supporting the Config
        expect(testItem.exposedValueHosts.get('Field1')).toBeInstanceOf(InputValueHost);

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(replacementConfig);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(replacementConfig);
        expect(replacementConfig.validatorConfigs[0]).toBe(replacementValidatorConfig);  // no side effects

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', null);
    });
 
    test('Replace the state, keeping the same config. Confirm the state and config', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            status: ValidationStatus.NotAttempted
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrUpdateValueHost(config, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', updateState);
    });    
    test('Edit state instance after addOrUpdateValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            status: ValidationStatus.NotAttempted
        };
        testItem.addOrUpdateValueHost(config, updateState);

        let savedState = deepClone(updateState);
        updateState.value = 100;
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', savedState);
    });        
});
describe('ValueHostsManager.addOrMergeValueHost', () => {
    test('Replace the config to install a validator', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config };
        replacementConfig.validatorConfigs = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType,
                },
                errorMessage: 'Error'
            }
        ];
        const expectedConfig: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        };        
        let replacementValidatorConfig = replacementConfig.validatorConfigs[0];

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrMergeValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHosts.get('Field1')).toBe(replacementValueHost);
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);
        expect(config.validatorConfigs).toBeNull();

        // ensure the stored Config has the merged data
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(expectedConfig);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', null);
    });
    test('addOrMergeValueHost works like addValueHost with unknown ValueHostConfig', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1'
        };
        expect(() => testItem.addOrMergeValueHost(config, null)).not.toThrow();

        
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', null);
    });

    test('Replace the config with existing ValueHostInstanceState.ValidationStatus of Invalid retains state when replacement is the same type', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config };
        replacementConfig.validatorConfigs = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                errorMessage: 'Error'
            }
        ];

        const expectedConfig: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        };

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrMergeValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        
        expect(testItem.exposedValueHosts.size).toBe(1);
        expect(testItem.exposedValueHosts.get('Field1')).toBe(replacementValueHost);
        expect(testItem!.exposedValueHostConfigs.size).toBe(1);
        expect(testItem.exposedState).not.toBeNull();

        // no side effects of the originals
        expect(testItem.exposedValueHostConfigs.get('Field1')).not.toBe(config);
        expect(config.validatorConfigs).toBeNull();

        // ensure ValueHost is supporting the Config
        expect(testItem.exposedValueHosts.get('Field1')).toBeInstanceOf(InputValueHost);

        // ensure the stored Config is the expected data
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(expectedConfig);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', null);
    });
    test('Complex merge has correct results', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {   // this does not match in the replacement
                    errorCode: 'Q',
                    conditionConfig: { conditionType: ConditionType.NotNull }
                } , 
                {   // replacement changes its error message
                    errorCode: 'R',
                    errorMessage: 'Required',
                    conditionConfig: { conditionType: ConditionType.RequireText }
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let replacementConfig = { ...config, dataType: LookupKey.String, label: 'First name' };
        
        replacementConfig.validatorConfigs = [
            {
                errorCode: 'R',
                errorMessage: 'Changed',
                conditionConfig:  { conditionType: ConditionType.RequireText }
            },
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                errorMessage: 'Always'
            },
        ];

        const expectedConfig: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            dataType: LookupKey.String,
            label: 'First name',
            validatorConfigs: [
                {
                    errorCode: 'Q',
                    conditionConfig: { conditionType: ConditionType.NotNull }
                },            
                {
                    errorCode: 'R',
                    errorMessage: 'Changed',
                    conditionConfig: { conditionType: ConditionType.RequireText}
                },
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType
                    },
                    errorMessage: 'Always'
                },                
            ]
        };

        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrMergeValueHost(replacementConfig, null)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure ValueHost is supporting the Config
        expect(testItem.exposedValueHosts.get('Field1')).toBeInstanceOf(InputValueHost);

        // ensure the stored Config is the expected data
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(expectedConfig);

        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', null);
    });
 
    test('Replace the state, keeping the same config. Confirm the state and config', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            status: ValidationStatus.NotAttempted
        };
        let replacementValueHost: IValueHost | null = null;
        expect(() => replacementValueHost = testItem.addOrMergeValueHost(config, updateState)).not.toThrow();
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced

        // ensure the stored Config is the same as the one supplied
        expect(testItem.exposedValueHostConfigs.get('Field1')).toEqual(config);
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', updateState);
    });    
    test('Edit state instance after addOrMergeValueHost has no impact on state in ValueHost', () => {
        let testItem = new PublicifiedValidationManager({ services: new MockValidationServices(false, false), valueHostConfigs: [] });
        let config: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Error'
                }
            ]
        };
        let initialValueHost = testItem.addValueHost(config, null);

        let updateState: InputValueHostInstanceState = {
            name: 'Field1',
            value: 40,
            issuesFound: null,
            status: ValidationStatus.NotAttempted
        };
        testItem.addOrMergeValueHost(config, updateState);

        let savedState = deepClone(updateState);
        updateState.value = 100;
     
        // ensure ValueHost is InputValueHost and has an initial state
        testValueHostInstanceState(testItem, 'Field1', savedState);
    });        
    test('Confirm previous ValueHost is discarded and new one retains the state from the previous one', () => {
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config]
        });

        let initialValueHost = testItem.getValueHost('Field1')!
        initialValueHost.setValue(100); // some stateful info
        let savedValue = initialValueHost.getValue();

        let updatedConfig: StaticValueHostConfig = { ...config, label: 'Label changed' };
        let replacementValueHost = testItem.addOrMergeValueHost(updatedConfig, null);
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced
        expect(replacementValueHost.getValue()).toBe(savedValue);
        expect(replacementValueHost.getLabel()).toBe('Label changed');
        expect(() => initialValueHost.getFromInstanceState('anything')).toThrow();  // deref error
    });    
    test('Confirm previous ValueHost is discarded and but uses the state passed into addOrUpdateValueHost', () => {
        let config: StaticValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config]
        });

        let initialValueHost = testItem.getValueHost('Field1')!
        initialValueHost.setValue(100); // some stateful info
        let savedValue = initialValueHost.getValue();

        let updatedConfig: StaticValueHostConfig = { ...config, label: 'Label changed' };        
        let updateState: StaticValueHostInstanceState = {
            name: 'Field1',
            value: 40
        };
        let replacementValueHost = testItem.addOrMergeValueHost(updatedConfig, updateState);
        expect(replacementValueHost).not.toBeNull();
        expect(replacementValueHost).not.toBe(initialValueHost);   // completely replaced
        expect(replacementValueHost.getValue()).toBe(updateState.value);    // different state
        expect(replacementValueHost.getLabel()).toBe('Label changed');

        expect(() => initialValueHost.getFromInstanceState('anything')).toThrow();  // deref error
    });            
});
describe('ValidationManager.getValueHost, getValidatorsValueHost, getInputValueHost, getPropertyValueHost getCalcValueHost, getStaticValueHost', () => {
    test('With 2 InputValueHostConfigs, get each with all functions. Expect null for Calc and Static', () => {

        let config1: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };
        let config2: InputValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Input,
            label: 'Field 2',
            validatorConfigs: null,
        };
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1, config2]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Field1')).not.toThrow();
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getName()).toBe('Field1');
        let vh2: IValueHost | null = null;
        expect(() => vh2 = testItem.getValueHost('Field2')).not.toThrow();
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.getName()).toBe('Field2');
        let vh3: IValidatorsValueHostBase | null = null;
        expect(() => vh3 = testItem.getValidatorsValueHost('Field1')).not.toThrow();
        expect(vh3).toBeInstanceOf(ValidatableValueHostBase);
        expect(vh3!.getName()).toBe('Field1');
        let vh4: IValidatorsValueHostBase | null = null;
        expect(() => vh4 = testItem.getValidatorsValueHost('Field2')).not.toThrow();
        expect(vh4).toBeInstanceOf(ValidatableValueHostBase);
        expect(vh4!.getName()).toBe('Field2');        
        let vh5: IInputValueHost | null = null;
        expect(() => vh5 = testItem.getInputValueHost('Field1')).not.toThrow();
        expect(vh5).toBeInstanceOf(InputValueHost);
        expect(vh5!.getName()).toBe('Field1');
        let vh6: IInputValueHost | null = null;
        expect(() => vh6 = testItem.getInputValueHost('Field2')).not.toThrow();
        expect(vh6).toBeInstanceOf(InputValueHost);
        expect(vh6!.getName()).toBe('Field2');          
        let vh7: IPropertyValueHost | null = null;
        expect(() => vh7 = testItem.getPropertyValueHost('Field1')).not.toThrow();
        expect(vh7).toBeNull();
        let vh8: IPropertyValueHost | null = null;
        expect(() => vh8 = testItem.getPropertyValueHost('Field2')).not.toThrow();
        expect(vh8).toBeNull();                    
        let vh9: ICalcValueHost | null = null;
        expect(() => vh9 = testItem.getCalcValueHost('Field2')).not.toThrow();
        expect(vh9).toBeNull();
        let vh10: IStaticValueHost | null = null;
        expect(() => vh10 = testItem.getStaticValueHost('Field2')).not.toThrow();
        expect(vh10).toBeNull();              

    });
    test('With 2 Array<ValueHostConfig>, get each with both functions. getValueHost returns VH, getValidatorsValueHost and getInputValueHost return null', () => {

        let config1: ValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Static,
            label: 'Field 1'
        };
        let config2: ValueHostConfig = {
            name: 'Field2',
            valueHostType: ValueHostType.Calc,
            label: 'Field 2'
        };
        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1, config2]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Field1')).not.toThrow();
        expect(vh1).toBeInstanceOf(StaticValueHost);
        expect(vh1!.getName()).toBe('Field1');
        let vh2: IValueHost | null = null;
        expect(() => vh2 = testItem.getValueHost('Field2')).not.toThrow();
        expect(vh2).toBeInstanceOf(CalcValueHost);
        expect(vh2!.getName()).toBe('Field2');
        let vh3: IValidatorsValueHostBase | null = null;
        expect(() => vh3 = testItem.getValidatorsValueHost('Field1')).not.toThrow();
        expect(vh3).toBeNull();
        let vh4: IValidatorsValueHostBase | null = null;
        expect(() => vh4 = testItem.getValidatorsValueHost('Field2')).not.toThrow();
        expect(vh4).toBeNull();
        let vh5: IInputValueHost | null = null;
        expect(() => vh5 = testItem.getInputValueHost('Field1')).not.toThrow();
        expect(vh5).toBeNull();
        let vh6: IInputValueHost | null = null;
        expect(() => vh6 = testItem.getInputValueHost('Field2')).not.toThrow();
        expect(vh6).toBeNull();        
        let vh7: IPropertyValueHost | null = null;
        expect(() => vh7 = testItem.getPropertyValueHost('Field1')).not.toThrow();
        expect(vh7).toBeNull();
        let vh8: IPropertyValueHost | null = null;
        expect(() => vh8 = testItem.getPropertyValueHost('Field2')).not.toThrow();
        expect(vh8).toBeNull();                
        let vh9: ICalcValueHost | null = null;
        expect(() => vh9 = testItem.getCalcValueHost('Field1')).not.toThrow();
        expect(vh9).toBeNull();
        let vh10: ICalcValueHost | null = null;
        expect(() => vh10 = testItem.getCalcValueHost('Field2')).not.toThrow();
        expect(vh10).toBeInstanceOf(CalcValueHost);            
        let vh11: IStaticValueHost | null = null;
        expect(() => vh11 = testItem.getStaticValueHost('Field1')).not.toThrow();
        expect(vh11).toBeInstanceOf(StaticValueHost);
        let vh12: IStaticValueHost | null = null;
        expect(() => vh12 = testItem.getStaticValueHost('Field2')).not.toThrow();
        expect(vh12).toBeNull();                 

    });    
    test('When supplying an unknown ValueHostName, return null.', () => {

        let config1: InputValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Input,
            label: 'Field 1',
            validatorConfigs: null,
        };

        let testItem = new PublicifiedValidationManager({
            services: new MockValidationServices(false, false),
            valueHostConfigs: [config1]
        });
        let vh1: IValueHost | null = null;
        expect(() => vh1 = testItem.getValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();
        let vh2: IValidatorsValueHostBase | null = null;
        expect(() => vh2 = testItem.getValidatorsValueHost('Unknown')).not.toThrow();
        expect(vh1).toBeNull();    
        let vh3: IInputValueHost | null = null;
        expect(() => vh3 = testItem.getInputValueHost('Unknown')).not.toThrow();
        expect(vh3).toBeNull();
        let vh4: ICalcValueHost | null = null;
        expect(() => vh4 = testItem.getCalcValueHost('Unknown')).not.toThrow();
        expect(vh4).toBeNull();      
        let vh5: IStaticValueHost | null = null;
        expect(() => vh5 = testItem.getStaticValueHost('Unknown')).not.toThrow();
        expect(vh5).toBeNull();        
    });
});

// validate(group?: string): Array<ValueHostValidateResult>
// get isValid(): boolean
// doNotSave: boolean
// getIssuesForInput(valueHostName: ValueHostName): Array<IssueFound>
// getIssuesFound(group?: string): Array<IssueFound>
describe('ValidationManager.validate, and isValid, doNotSave, getIssuesForInput, getIssuesFound based on the results', () => {
    test('Before calling validate with 0 inputValueHosts, isValid=true, doNotSave=false, getIssuesForInput=[], getIssuesFound=[]', () => {
        let setup = setupValidationManager();
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput('Anything')).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('isValid is true and doNotSave is false before calling validate with 1 inputValueHosts', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost that is ValidationStatus.Valid, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost that is ValidationStatus.Invalid, returns {isValid:false, doNotSave: true, issuesFound: [1 found] }', () => {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });


        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([expectedIssueFound]);
        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound]);
    });

    test('With 1 inputValueHost with 2 validators, one Match the other NoMatch, returns {isValid:false, doNotSave: true, issuesFound: [1 found] }', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType, NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);

        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([expectedIssueFound]);
        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound]);
    });    

    test('With 2 inputValueHost that are both valid, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let config2 = setupInputValueHostConfig(1, [AlwaysMatchesConditionType]);

        let setup = setupValidationManager([config1, config2]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 2 inputValueHost where only one has validators, it should return {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let fluent = new ValidationManagerStartFluent(null);
        let config2 = fluent.input('Field2');

        let setup = setupValidationManager([config1, config2.parentConfig]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.parentConfig.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });    
    test('With 2 inputValueHost that are both undetermined, returns {isValid:true, doNotSave: false, issuesFound: null}', () => {

        let config1 = setupInputValueHostConfig(0, [IsUndeterminedConditionType]);
        let config2 = setupInputValueHostConfig(1, [IsUndeterminedConditionType]);

        let setup = setupValidationManager([config1, config2]);

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 2 inputValueHost that are both Invalid, returns {isValid:false, doNotSave: true, issuesFound: [2 entries]}', () => {

        let config1 = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let config2 = setupInputValueHostConfig(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([config1, config2]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };
        let expectedIssueFound2: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field2',
            errorMessage: 'Error 2: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 2: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate()).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound, expectedIssueFound2],
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config1.name)).toEqual([expectedIssueFound]);
        expect(setup.validationManager.getIssuesForInput(config2.name)).toEqual([expectedIssueFound2]);

        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound, expectedIssueFound2]);
    });
    test('With 1 BusinessLogicError not associated with any ValueHost, isValid=false, DoNotSave=true, getIssuesFound has the businesslogicerror, and there is a new ValueHost for the BusinessLogic', () => {
        let setup = setupValidationManager();
        let result = setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ]);
        expect(result).toBe(true);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);
        expect(setup.validationManager.getIssuesFound()).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);
        expect(setup.validationManager.getValueHost(BusinessLogicErrorsValueHostName)).toBeInstanceOf(BusinessLogicErrorsValueHost);

        expect(setup.validationManager.getIssuesForInput(BusinessLogicErrorsValueHostName)).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);
    });
    test('With 1 ValueHost that is assigned without validators 1 BusinessLogicError, isValid=false, DoNotSave=true, getIssuesFound has the businesslogicerror, and there is a no ValueHost for the BusinessLogic', () => {

        let config = setupInputValueHostConfig(0, []);
        let setup = setupValidationManager([config]);
        let result = setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
                associatedValueHostName: config.name
            }
        ]);
        expect(result).toBe(true);
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);
        expect(setup.validationManager.getIssuesFound()).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: config.name,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);
        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([<IssueFound>{
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: config.name,
            errorCode: 'GENERATED_0',
            summaryMessage: 'BL_ERROR'
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicErrorsValueHostName)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(BusinessLogicErrorsValueHostName)).toBeNull();
    });
    test('With 1 ValueHost that is assigned with 1 validator that is NoMatch, 1 BusinessLogicError not associated with a ValueHost, isValid=false, DoNotSave=true, getIssuesFound has both errors businesslogicerror, BLValueHost has the BLError, InputValueHost has its own error', () => {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        config.validatorConfigs![0].errorMessage = 'CONDITION ERROR';
        config.validatorConfigs![0].summaryMessage = 'SUMMARY CONDITION ERROR';
        let setup = setupValidationManager([config]);
        let result = setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
            }
        ]);
        expect(result).toBe(true);
        setup.validationManager.validate();
        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);
        expect(setup.validationManager.getIssuesFound()).toEqual([
            <IssueFound>{
                errorMessage: 'CONDITION ERROR',
                severity: ValidationSeverity.Error,
                valueHostName: config.name,
                errorCode: NeverMatchesConditionType,
                summaryMessage: 'SUMMARY CONDITION ERROR'
            },
            <IssueFound>{
                errorMessage: 'BL_ERROR',
                severity: ValidationSeverity.Error,
                valueHostName: BusinessLogicErrorsValueHostName,
                errorCode: 'GENERATED_0',
                summaryMessage: 'BL_ERROR'
            }]);
        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([<IssueFound>{
            errorMessage: 'CONDITION ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: config.name,
            errorCode: NeverMatchesConditionType,
            summaryMessage: 'SUMMARY CONDITION ERROR'
        }]);

        expect(setup.validationManager.getValueHost(BusinessLogicErrorsValueHostName)).toBeInstanceOf(BusinessLogicErrorsValueHost);
        expect(setup.validationManager.getIssuesForInput(BusinessLogicErrorsValueHostName)).toEqual(
            [<IssueFound>{
                errorMessage: 'BL_ERROR',
                severity: ValidationSeverity.Error,
                valueHostName: BusinessLogicErrorsValueHostName,
                errorCode: 'GENERATED_0',
                summaryMessage: 'BL_ERROR'
            }]);
    });
    test('setBusinessLogicErrors has not supplied any errors and returns false', () => {
        let setup = setupValidationManager();
        let result = setup.validationManager.setBusinessLogicErrors([]);
        expect(result).toBe(false);
    });    
    test('setBusinessLogicErrors called twice. First time has changes. Second not, but both return true because the second changes by clearing the first', () => {
        let setup = setupValidationManager();
        let result =  setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR',
            }
        ]);
        expect(result).toBe(true);
        result = setup.validationManager.setBusinessLogicErrors([]);
        expect(result).toBe(true);
    });        
    test('OnValidated callback test invokes callback with expected ValidationState', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });
        let expectedIssueFound: IssueFound = {
            errorCode: 'GENERATED_0',
            errorMessage: 'BL_ERROR',
            summaryMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName
        };

        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ]);
        expect(callbackValue).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

    });    
    test('OnValidated callback test with option.OmitCallback=true does not invoke callback', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });
        let expectedIssueFound: IssueFound = {
            errorCode: 'GENERATED_0',
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: BusinessLogicErrorsValueHostName
        };

        setup.validationManager.setBusinessLogicErrors([
            {
                errorMessage: 'BL_ERROR'
            }
        ], { skipCallback: true});
        expect(callbackValue).toBeNull();

    });    
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option Preliminary=true, expect ValidationStatus.Undetermined because Require should be skipped, leaving NO validators', () => {
        const conditionType = 'TEST';
        let config = setupInputValueHostConfig(0, [conditionType]);
        let setup = setupValidationManager([config]);
        (setup.services.conditionFactory as ConditionFactory).register<UserSuppliedResultConditionConfig>(
            conditionType, (config) => new UserSuppliedResultCondition({
                conditionType: conditionType,
                category: ConditionCategory.Require,
            result: ConditionEvaluateResult.NoMatch
            }));
    
        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ preliminary: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option Preliminary=false, expect ValidationStatus.Invalid because Preliminary is off', () => {
        const conditionType = 'TEST';
        let config = setupInputValueHostConfig(0, [conditionType]);
        let setup = setupValidationManager([config]);
        (setup.services.conditionFactory as ConditionFactory).register<UserSuppliedResultConditionConfig>(
            conditionType, (config) => new UserSuppliedResultCondition({
                conditionType: conditionType,
                category: ConditionCategory.Require,
            result: ConditionEvaluateResult.NoMatch
        }));
        let expectedIssueFound: IssueFound = {
            errorCode: conditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + conditionType,
            summaryMessage: 'Summary 1: ' + conditionType,
            severity: ValidationSeverity.Severe // only because Require conditions default to Severe
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');
        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ preliminary: false })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

        expect(setup.validationManager.isValid).toBe(false);
        expect(setup.validationManager.doNotSave).toBe(true);

        expect(setup.validationManager.getIssuesForInput(config.name)).toEqual([expectedIssueFound]);

        expect(setup.validationManager.getIssuesFound()).toEqual([expectedIssueFound]);
    });
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch during Edit, use option DuringEdit=true, expect Invalid', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setInputValue('');
        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

    });
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch during edit, use option DuringEdit=true, expect Invalid', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        setup.validationManager.getInputValueHost('Field1')?.setInputValue(''); // requires text for duringEdit
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });
    });    
    test('With 1 inputValueHost that has a string value and a condition that will evaluate as Match during edit, use option DuringEdit=true, expect Valid', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        setup.validationManager.getInputValueHost(config.name)?.setInputValue('Text');
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });
    });        
    test('With 1 inputValueHost that has an undefined value and a condition that will evaluate as Match during edit, use option DuringEdit=true, expect Undetermined because DuringEdit requires a string value', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);

        setup.validationManager.getInputValueHost(config.name)?.setInputValue(undefined);
        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

    });          
    test('With 1 inputValueHost and a condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit has no impact on Category=Require validators', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: false })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });

    });
    test('With 1 inputValueHost and a condition that does not implement IEvaluateConditionDuringEdits, use option DuringEdit=true, expect condition to be skipped and array of ValidateResults = []', () => {
        let config = setupInputValueHostConfig(0, [UserSuppliedResultConditionType]);
        (config.validatorConfigs![0].conditionConfig as UserSuppliedResultConditionConfig).result = ConditionEvaluateResult.Match;
        let setup = setupValidationManager([config]);

        let vh = (setup.validationManager.getValueHost('Field1')! as IInputValueHost);
        vh.setInputValue('');
        
        let validationState: ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: true })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });

    });
    test('With 1 inputValueHost and a NeverMatch condition that will evaluate as NoMatch, use option DuringEdit=false, expect normal Invalid as DuringEdit=false has no impact on including validators', () => {
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config]);
        let expectedIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            valueHostName: 'Field1',
            errorMessage: 'Error 1: ' + NeverMatchesConditionType,
            summaryMessage: 'Summary 1: ' + NeverMatchesConditionType,
            severity: ValidationSeverity.Error
        };

        (setup.validationManager.getValueHost('Field1')! as IInputValueHost).setValue('');

        let validationState : ValidationState | null = null;
        expect(() => validationState = setup.validationManager.validate({ duringEdit: false })).not.toThrow();
        expect(validationState).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [expectedIssueFound],
            asyncProcessing: false
        });
    });
    test('OnValidated callback test', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });

        let validationState = setup.validationManager.validate();

        expect(callbackValue).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });
    });
    test('OnValidated callback test with skipCallback does not callback', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });

        let validationState = setup.validationManager.validate({ skipCallback: true});

        expect(callbackValue).toBeNull();
    });
});
describe('ValidationManager.clearValidation', () => {
    test('With 2 inputValueHost that are both Invalid, returns 2 ValidateResults each with 1 issue found. isValid=false. DoNotSave=true', () => {

        let config1 = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let config2 = setupInputValueHostConfig(1, [NeverMatchesConditionType]);

        let setup = setupValidationManager([config1, config2]);

        setup.validationManager.validate();
        expect(() => setup.validationManager.clearValidation()).not.toThrow();
        expect(setup.validationManager.isValid).toBe(true);
        expect(setup.validationManager.doNotSave).toBe(false);
        expect(setup.validationManager.getIssuesForInput(config1.name)).toBeNull();
        expect(setup.validationManager.getIssuesForInput(config2.name)).toBeNull();
        expect(setup.validationManager.getIssuesFound()).toBeNull();
    });

    // ValidationManager.validate() itself will call onValidate immediately while
    // each of the child ValueHosts will call it using debounce.
    //
    function testOnValidatedWithDebounce(delayConfig: number | undefined,
        expectedOnValidatedCalls: number, 
        useVHCallback: boolean, numberOfValueHosts: number = 1, delayAfterVHCallback: number = 100): void
    {
        jest.useFakeTimers();

        let capturedFromOnValidated: Array<ValidationState> = [];
        let callbackValidated = (vm: IValidationManager, validationState : ValidationState) => {
            capturedFromOnValidated.push(validationState);
        };
        let capturedFromOnValueHostValidated: Array<ValueHostValidationState> = [];
        let callbackValueHostValidated = (valueHost: IValidatableValueHostBase, validationState : ValueHostValidationState) => {
            capturedFromOnValueHostValidated.push(validationState);
            jest.advanceTimersByTime(delayAfterVHCallback); // has the potential to trigger onValidate
        };        
        let ivConfigs: Array<InputValueHostConfig> = [];
        for (let i = 0; i < numberOfValueHosts; i++)
            ivConfigs.push(setupInputValueHostConfig(i, [NeverMatchesConditionType]));
        let setup = setupValidationManager(ivConfigs, null, {
            onValidationStateChanged: callbackValidated,
            onValueHostValidationStateChanged : useVHCallback ? callbackValueHostValidated : undefined,
            notifyValidationStateChangedDelay: delayConfig
        });
        setup.services.autoGenerateDataTypeCheckService.enabled = false;

        setup.validationManager.validate();

        expect(capturedFromOnValidated.length).toBe(expectedOnValidatedCalls);
        if (useVHCallback)
            expect(capturedFromOnValueHostValidated.length).toBe(numberOfValueHosts);
    }
    test('with notifyValidationStateChangedDelay=0, OnValidated invoked twice because debounce is off and ValueHost.validate fires it once', () => {
        testOnValidatedWithDebounce(0, 2, false);
    });    
    test('with notifyValidationStateChangedDelay=undefined, OnValidated invoked once because debounce is on', () => {
        testOnValidatedWithDebounce(undefined, 1, false);
    });        
    test('with notifyValidationStateChangedDelay=1000, OnValidated invoked once because debounce is on', () => {
        testOnValidatedWithDebounce(1000, 1, false);
    });    
    test('With ValueHostcallbacks enabled and no delay after, and with notifyValidationStateChangedDelay=0, OnValidated invoked twice because debounce is off', () => {
        testOnValidatedWithDebounce(0, 2, true, 1, 0);
        testOnValidatedWithDebounce(0, 3, true, 2, 0);
    });    
    test('With ValueHostcallbacks enabled and no delay after, and with notifyValidationStateChangedDelay=undefined, OnValidated invoked once', () => {
        testOnValidatedWithDebounce(undefined, 1, true, 1, 0);
        testOnValidatedWithDebounce(undefined, 1, true, 2, 0);
    });        
    test('With ValueHostcallbacks enabled and no delay after, and with notifyValidationStateChangedDelay=1000, OnValidated invoked once', () => {
        testOnValidatedWithDebounce(1000, 1, true, 1, 0);
        testOnValidatedWithDebounce(1000, 1, true, 2, 0);        
    });    
    test('With ValueHostcallbacks enabled and delay after < overall delay, and with notifyValidationStateChangedDelay=1000, OnValidated invoked once', () => {
        testOnValidatedWithDebounce(1000, 1, true, 1, 1000 - 1);
        testOnValidatedWithDebounce(1000, 1, true, 2, 1000 - 1);        
    });        
    test('With ValueHostcallbacks enabled and delay after > overall delay, and with notifyValidationStateChangedDelay=1000, OnValidated invoked twice as debounce triggers', () => {
        testOnValidatedWithDebounce(1000, 2, true, 1, 1000 + 1);
        testOnValidatedWithDebounce(1000, 3, true, 2, 1000 + 1);        
    });            
    test('OnValidated callback test with option.OmitCallback=true does not invoke callback', () => {
        let callbackValue: ValidationState | null = null;
        let callback = (vm: IValidationManager, validationState : ValidationState) => {
            callbackValue = validationState
        };
        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: callback
        });

        let validationState = setup.validationManager.validate({ skipCallback: true });
        expect(callbackValue).toBeNull();

        setup.validationManager.clearValidation({ skipCallback: true});
        expect(callbackValue).toBeNull();
    });
});
describe('setIssuesFound', () => {
    interface ITestSetupConfig {
        services: IValidationServices,
        validationManager: IValidationManager
    };    
    // Creates an array of ValidatorConfigs, with the number supplied the length of conditionTypes.
    // The conditionTypes are used in order.
    // The errorCodes are 'EC1', 'EC2', 'EC3', etc
    // 
    function generateVHConfig(conditionTypes: Array<string>, valueHostName: string = 'Field1'): InputValueHostConfig
    {
        let configs: Array<ValidatorConfig> = [];
        let count = 1;
        for (let ct of conditionTypes) {
            let code = 'EC' + count;
            count++;
            configs.push(
                {
                    errorCode: code,
                    conditionConfig: {
                        conditionType: ct 
                    },
                    errorMessage: 'errorcode ' + code    // so we can show this error message is not used
                }
            );
        }
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: valueHostName,
            validatorConfigs: configs
        };    
        return vhConfig;
    }
    // Creates an array of IssueFound, with the number supplied the length of severities.
    // The severities are used in order.
    // The errorCodes are 'EC1', 'EC2', 'EC3', etc
    function generateIssuesFound(severities: Array<ValidationSeverity>, valueHostName: string = 'Field1'): Array<IssueFound>
    {
        let issuesFound: Array<IssueFound> = [];
        let count = 1;
        for (let s of severities) {
            let code = 'EC' + count;
            count++;
            issuesFound.push(
                {
                    errorCode: code,
                    severity: s,
                    valueHostName: valueHostName,
                    errorMessage: 'Message errorcode ' + code + ' from IssueFound',
                    summaryMessage: 'Summary errorcode ' + code + ' from IssueFound'                    
                }
            );
        }
        return issuesFound;
    }
    function setupForSetIssuesFound(vhConfig: Array<InputValueHostConfig>, onValidatedCallback?: ValueHostValidationStateChangedHandler): ITestSetupConfig
    {
        let services = createValidationServicesForTesting();
        services.autoGenerateDataTypeCheckService.enabled = false;

        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: vhConfig,
            onValueHostValidationStateChanged : onValidatedCallback
        };
        let vm = new ValidationManager(vmConfig);
        return {
            services: services,
            validationManager: vm
        };
    }

    function testSetIssuesFound(setup: ITestSetupConfig, issuesFoundToSet: Array<IssueFound>,
        expectedIssuesFoundToGet: Array<IssueFound> | null, expectedChanged: boolean = true,
        expectedIsValid: boolean,
        behavior: SetIssuesFoundErrorCodeMissingBehavior = SetIssuesFoundErrorCodeMissingBehavior.Omit
    ): void
    {
        let testItem = setup.validationManager;
        let changed = false;
        expect(() => changed = testItem.setIssuesFound(issuesFoundToSet, behavior)).not.toThrow();
        expect(changed).toBe(expectedChanged);
        expect(testItem.isValid).toBe(expectedIsValid);
        let retrieved = testItem.getIssuesFound();
        if (expectedIssuesFoundToGet) {
            expect(retrieved).not.toBeNull();
            expect(retrieved).not.toBe(expectedIssuesFoundToGet); // list object is different
            expect(retrieved).toEqual(expectedIssuesFoundToGet); // but structure is the same        
        }
        else
            expect(retrieved).toBeNull();
    }
    function testMatchToGetIssuesFound(setup: ITestSetupConfig, expectedIssuesFoundToGet: Array<IssueFound>): void
    {
        let retrieved = setup.validationManager.getIssuesFound();
        expect(retrieved).not.toBeNull();
        expect(retrieved).toEqual(expectedIssuesFoundToGet); // but structure is the same        
    }
    function getExpectedIssueFoundFromValidator(issueIndex: number, valueHostName: string = 'Field1'): IssueFound
    {
        let ec = 'EC' + (issueIndex + 1);
        return <IssueFound> {
            errorCode: ec,
            errorMessage: 'errorcode ' + ec, // expected to match the one setup in vhConfig
            severity: ValidationSeverity.Error,
            valueHostName: valueHostName,
            summaryMessage: 'errorcode ' + ec, // expected to match the one setup in vhConfig
        };        
    }
    test('With 2 ValueHosts with 1 validator each and nothing validated, provide an IssueFound for each. Expect IsValid=false and both IssuesFound returned verbatim from getIssuesFound()', () => {
        let vhConfigField1 = generateVHConfig([AlwaysMatchesConditionType], 'Field1');
        let vhConfigField2 = generateVHConfig([AlwaysMatchesConditionType], 'Field2');        
        let setup = setupForSetIssuesFound([vhConfigField1, vhConfigField2]);
        let issuesFoundField1 = generateIssuesFound([ValidationSeverity.Error], 'Field1');
        let issuesFoundField2 = generateIssuesFound([ValidationSeverity.Error], 'Field2');   
        let issuesFound = issuesFoundField1.concat(issuesFoundField2);
        testSetIssuesFound(setup, issuesFound, issuesFound, true, false);
    });
    test('With 2 ValueHosts each with one validator, existing validation error on each gets replaced', () => {
        let vhConfigField1 = generateVHConfig([NeverMatchesConditionType], 'Field1');
        let vhConfigField2 = generateVHConfig([NeverMatchesConditionType], 'Field2');        
        let setup = setupForSetIssuesFound([vhConfigField1, vhConfigField2]);
        let issuesFoundField1 = generateIssuesFound([ValidationSeverity.Error], 'Field1');
        let issuesFoundField2 = generateIssuesFound([ValidationSeverity.Error], 'Field2');   
        let issuesFound = issuesFoundField1.concat(issuesFoundField2);

        setup.validationManager.validate();
        
        testSetIssuesFound(setup, issuesFound, issuesFound, true, false);
    });

    test('IssueFound has different errorCode from validators and behavior=Keep includes IssueFound', () => {
        let vhConfigField1 = generateVHConfig([NeverMatchesConditionType], 'Field1');
        let vhConfigField2 = generateVHConfig([NeverMatchesConditionType], 'Field2');        
        let setup = setupForSetIssuesFound([vhConfigField1, vhConfigField2]);
        let issuesFoundField1 = generateIssuesFound([ValidationSeverity.Error], 'Field1');
        issuesFoundField1[0].errorCode = 'Unknown';
        let issuesFoundField2 = generateIssuesFound([ValidationSeverity.Error], 'Field2');   
        issuesFoundField2[0].errorCode = 'Unknown';
        let issuesFound = issuesFoundField1.concat(issuesFoundField2);
        setup.validationManager.validate();
        let expectedIssueFoundField1 = getExpectedIssueFoundFromValidator(0, 'Field1');
        let expectedIssueFoundField2 = getExpectedIssueFoundFromValidator(0, 'Field2');        
        testSetIssuesFound(setup, issuesFound, [expectedIssueFoundField1, issuesFoundField1[0], expectedIssueFoundField2, issuesFoundField2[0]],
            true, false, SetIssuesFoundErrorCodeMissingBehavior.Keep);       
    });

    test('IssueFound has different errorCode from validators and behavior=Omit omits IssueFound and makes no changes', () => {
        let vhConfigField1 = generateVHConfig([NeverMatchesConditionType], 'Field1');
        let vhConfigField2 = generateVHConfig([NeverMatchesConditionType], 'Field2');        
        let setup = setupForSetIssuesFound([vhConfigField1, vhConfigField2]);
        let issuesFoundField1 = generateIssuesFound([ValidationSeverity.Error], 'Field1');
        issuesFoundField1[0].errorCode = 'Unknown';
        let issuesFoundField2 = generateIssuesFound([ValidationSeverity.Error], 'Field2');   
        issuesFoundField2[0].errorCode = 'Unknown';
        let issuesFound = issuesFoundField1.concat(issuesFoundField2);
        setup.validationManager.validate();
        let expectedIssueFoundField1 = getExpectedIssueFoundFromValidator(0, 'Field1');
        let expectedIssueFoundField2 = getExpectedIssueFoundFromValidator(0, 'Field2');        
        testSetIssuesFound(setup, issuesFound, [expectedIssueFoundField1, expectedIssueFoundField2],
            false,
            false, SetIssuesFoundErrorCodeMissingBehavior.Omit);       
    });

    test('Two IssuesFound, but one validator. One errorcode matches and replaces. The other has behavior=Omit. Result is IssuesFound has the first IssueFound only and changed = true', () => {
        let vhConfig = generateVHConfig([NeverMatchesConditionType]);
        let setup = setupForSetIssuesFound([vhConfig]);
        setup.validationManager.validate();
        
        let issuesFound = generateIssuesFound([ValidationSeverity.Error, ValidationSeverity.Error]);
        let issueFoundEC1 = issuesFound[0];
        issuesFound[1].errorCode = 'Unknown';
        testSetIssuesFound(setup, issuesFound, [issueFoundEC1], true, false, SetIssuesFoundErrorCodeMissingBehavior.Omit);     
    });


    test('IssueFound that was added is gone after using validate on valid data.', () => {
        let vhConfig = generateVHConfig([AlwaysMatchesConditionType]);
        let setup = setupForSetIssuesFound([vhConfig]);
        let issuesFound = generateIssuesFound([ValidationSeverity.Error]);
        let testItem = setup.validationManager;
        testItem.setIssuesFound(issuesFound, SetIssuesFoundErrorCodeMissingBehavior.Keep);

        testItem.validate();
        expect(testItem.isValid).toBe(true);
        expect(testItem.getIssuesFound()).toBeNull();
    });
    test('IssueFound that was added is replaced after using validate on invalid data with the same validator errorcode.', () => {
        let vhConfig = generateVHConfig([NeverMatchesConditionType]);
        let setup = setupForSetIssuesFound([vhConfig]);
        let issuesFound = generateIssuesFound([ValidationSeverity.Error]);
        let testItem = setup.validationManager;
        testItem.setIssuesFound(issuesFound, SetIssuesFoundErrorCodeMissingBehavior.Keep);

        testItem.validate();
        expect(testItem.isValid).toBe(false);
        const expectedIssueFound = getExpectedIssueFoundFromValidator(0);
        testMatchToGetIssuesFound(setup, [expectedIssueFound]);
    });
    test('1 issue found with Severity=Warn does not change ValidationState already at Valid', () => {
        let vhConfig = generateVHConfig([AlwaysMatchesConditionType]);
        let setup = setupForSetIssuesFound([vhConfig]);
        let issuesFound = generateIssuesFound([ValidationSeverity.Warning]);
        let testItem = setup.validationManager;
        testItem.validate();    // ValidationStatus is now Valid
        testItem.setIssuesFound(issuesFound, SetIssuesFoundErrorCodeMissingBehavior.Keep);
        expect(testItem.isValid).toBe(true);
    });    

    test('1 issue found with Severity=Warn does not change ValidationState already at Invalid', () => {
        let vhConfig = generateVHConfig([NeverMatchesConditionType]);
        let setup = setupForSetIssuesFound([vhConfig]);
        let issuesFound = generateIssuesFound([ValidationSeverity.Warning]);
        let testItem = setup.validationManager;
        testItem.validate();    // ValidationStatus is now Invalid
        testItem.setIssuesFound(issuesFound, SetIssuesFoundErrorCodeMissingBehavior.Keep);
        expect(testItem.isValid).toBe(false);        
    });        
    test('null parameter throws', () => {
        let vhConfig = generateVHConfig([NeverMatchesConditionType]);
        let setup = setupForSetIssuesFound([vhConfig]);

        let testItem = setup.validationManager;
        expect(() => testItem.setIssuesFound(null!, SetIssuesFoundErrorCodeMissingBehavior.Keep)).toThrow(/issuesFound/);
    });

    test('IssueFound with unsupported valueHostName makes no changes', () => {
        let vhConfig = generateVHConfig([NeverMatchesConditionType]);
        let setup = setupForSetIssuesFound([vhConfig]);

        let testItem = setup.validationManager;
        expect(testItem.setIssuesFound([{
            errorCode: 'EC',
            errorMessage: 'does not matter',
            severity: ValidationSeverity.Error,
            valueHostName: 'unknown'
        }], SetIssuesFoundErrorCodeMissingBehavior.Keep)).toBe(false);
 
    });        
    test('onValueHostValidationStateChanged called when IssueFound was applied', () => {
        let vhConfig = generateVHConfig([NeverMatchesConditionType]);
        let count = 0;
        let setup = setupForSetIssuesFound([vhConfig], (vh) => {
            count++;
        });
        setup.validationManager.validate();
        expect(count).toBe(1);
        
        let issuesFound = generateIssuesFound([ValidationSeverity.Error]);
        let testItem = setup.validationManager;
        testItem.setIssuesFound(issuesFound, SetIssuesFoundErrorCodeMissingBehavior.Keep);
        expect(count).toBe(2);
    });    
    test('onValueHostValidationStateChanged not when IssueFound was not applied', () => {
        let vhConfig = generateVHConfig([NeverMatchesConditionType]);
        let count = 0;
        let setup = setupForSetIssuesFound([vhConfig], (vh) => {
            count++;
        });
        setup.validationManager.validate();
        expect(count).toBe(1);
        
        let issuesFound = generateIssuesFound([ValidationSeverity.Error], 'Different Field');
        let testItem = setup.validationManager;
        testItem.setIssuesFound(issuesFound, SetIssuesFoundErrorCodeMissingBehavior.Keep);
        expect(count).toBe(1);
    });        
});

// updateState(updater: (stateToUpdate: TState) => TState): TState
describe('ValidationManager.updateState', () => {
    interface ITestExtendedState extends ValidationManagerInstanceState {
        Value: number;
    }
    function testUpdateState(initialValue: number, testCallback: (stateToUpdate: ITestExtendedState) => ITestExtendedState, callback: ValueHostsManagerInstanceStateChangedHandler | null): Array<ITestExtendedState> {

        let config = setupInputValueHostConfig(0, [NeverMatchesConditionType]);
        let state: ITestExtendedState = {
            Value: initialValue
        };
        let setup = setupValidationManager([config], state, {
            onInstanceStateChanged: callback
        });
        let testItem = setup.validationManager as ValidationManager<ITestExtendedState>;
        let changes: Array<ITestExtendedState> = [];
        let fn = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
            let lastValue = stateToUpdate.Value;
            stateToUpdate = testCallback(stateToUpdate);
            if (lastValue !== stateToUpdate.Value)
                changes.push(stateToUpdate);
            return stateToUpdate;
        };

        // try several times
        for (let i = 1; i <= 3; i++) {
            expect(() => testItem.updateInstanceState(fn)).not.toThrow();
        }
        return changes;
    }
    test('Update value with +1 results in new instance of State',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                stateToUpdate.Value = stateToUpdate.Value + 1;
                return stateToUpdate;
            };
            const initialValue = 100;
            let changes = testUpdateState(initialValue, testCallback, null);
            expect(changes.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(changes[i - 1].Value).toBe(initialValue + i);
            }

        });
    test('Update value with +0 results in no change to the state instance',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                return stateToUpdate;
            };
            const initialValue = 100;
            let changes = testUpdateState(initialValue, testCallback, null);
            expect(changes.length).toBe(0);
        });
    test('Update value with +1 results in new instance of State and report thru updateState',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                stateToUpdate.Value = stateToUpdate.Value + 1;
                return stateToUpdate;
            };
            const initialValue = 100;
            let onStateChanges: Array<ITestExtendedState> = [];
            let changes = testUpdateState(initialValue, testCallback, (vm, state) => {
                onStateChanges.push(state as ITestExtendedState);
            });
            expect(changes.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(changes[i - 1].Value).toBe(initialValue + i);
            }
            expect(onStateChanges.length).toBe(3);
            for (let i = 1; i <= 3; i++) {
                expect(onStateChanges[i - 1].Value).toBe(initialValue + i);
            }
        });
    test('Update value with +0 results in no change to the state instance nor seen in updateState',
        () => {
            let testCallback = (stateToUpdate: ITestExtendedState): ITestExtendedState => {
                return stateToUpdate;
            };
            const initialValue = 100;
            let onStateChanges: Array<ITestExtendedState> = [];
            let changes = testUpdateState(initialValue, testCallback, (vm, state) => {
                onStateChanges.push(state as ITestExtendedState);
            });
            expect(changes.length).toBe(0);
        });
    test('Updater function is null throws',
        () => {
            let setup = setupValidationManager();
            let testItem = setup.validationManager as ValidationManager<ITestExtendedState>;
            expect(() => testItem.updateInstanceState(null!)).toThrow(/updater/);
        });
});
describe('dispose', () => {
    test('Ordinary does not make any noise', () => {
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);
        let setup = setupValidationManager([config]);
        expect(() => setup.validationManager.dispose()).not.toThrow();
    });
    test('Ordinary does not make any noise', () => {
        jest.useFakeTimers();
        let config = setupInputValueHostConfig(0, [AlwaysMatchesConditionType]);     
        let countCalls = 0;
        let setup = setupValidationManager([config], null, {
            onValidationStateChanged: (vm, vs) => {
                countCalls++;
            },
            notifyValidationStateChangedDelay: 100
        });
        setup.services.autoGenerateDataTypeCheckService.enabled = false;
        setup.validationManager.notifyValidationStateChanged(null);   // starts a debounce delay
        jest.advanceTimersByTime(100);  // force onValidationStateChanged to run
        expect(countCalls).toBe(1);

        setup.validationManager.notifyValidationStateChanged(null);   // repeat, starts a debounce delay
        setup.validationManager.dispose();
        jest.advanceTimersByTime(100);  // force onValidationStateChanged to run   
        expect(countCalls).toBe(1);
    });    
});

describe('toIValidationManagerCallbacks function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValidationManagerCallbacks = {
            onValueChanged: (vh: IValueHost, old: any) => {},
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => {},
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any)  => {},
            onValueHostValidationStateChanged: (vh: IValidatableValueHostBase, snapshot: ValueHostValidationState) => { },
            onInstanceStateChanged: (vm, state) => { },
            onValidationStateChanged: (vm, results) => { },
            onConfigChanged: (vm, config) => { }
        };
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });
    test('ValidationManager without callbacks defined returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: []
        });
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });    
    test('ValidationManager with callbacks defined returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: [],
            onValueChanged: (vh: IValueHost, old: any) => {},
            onValueHostInstanceStateChanged: (vh: IValueHost, state: ValueHostInstanceState) => {},
            onInputValueChanged: (vh: IValidatableValueHostBase, old: any)  => {},
            onValueHostValidationStateChanged: (vh: IValidatableValueHostBase, snapshot: ValueHostValidationState) => { },
            onInstanceStateChanged: (vm, state) => { },
            onValidationStateChanged: (vm, results) => { },
            onConfigChanged: (vm, config) => { }
        });
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });        
    test('ValidationManager with callbacks=null defined returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: [],
            onValueChanged: null,
            onValueHostInstanceStateChanged: null,
            onInputValueChanged: null,
            onValueHostValidationStateChanged: null,
            onInstanceStateChanged: null,
            onValidationStateChanged: null,
            onConfigChanged: null
        });
        expect(toIValidationManagerCallbacks(testItem)).toBe(testItem);
    });            
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidationManagerCallbacks(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValidationManagerCallbacks(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValidationManagerCallbacks(100)).toBeNull();
    });        
});
describe('toIValidationManager function', () => {
    test('Matches interface returns strongly typed object.', () => {
        let testItem: IValidationManager = {
            validate: function (options?: ValidateOptions | undefined): ValidationState {
                throw new Error("Function not implemented.");
            },
            clearValidation: function (options?: ValidateOptions | undefined): boolean {
                throw new Error("Function not implemented.");
            },
            isValid: false,
            doNotSave: true,
            setBusinessLogicErrors: function (errors: BusinessLogicError[] | null, options?: ValidateOptions | undefined): boolean {
                throw new Error("Function not implemented.");
            },
            getIssuesForInput: function (valueHostName: string): IssueFound[] | null {
                throw new Error("Function not implemented.");
            },
            getIssuesFound: function (group?: string | undefined): IssueFound[] | null {
                throw new Error("Function not implemented.");
            },
            setIssuesFound(issuesFound: Array<IssueFound>, behavior: SetIssuesFoundErrorCodeMissingBehavior): boolean {
                throw new Error('Function not implemented.');
            },
            notifyValidationStateChanged: function (validationState: ValidationState | null, options?: ValidateOptions | undefined, force?: boolean | undefined): void {
                throw new Error("Function not implemented.");
            },
            dispose: function (): void {
                throw new Error("Function not implemented.");
            },
            notifyOtherValueHostsOfValueChange: function (valueHostIdThatChanged: string, revalidate: boolean): void {
                throw new Error("Function not implemented.");
            },
            getValueHost: function (valueHostName: string): IValueHost | null {
                throw new Error("Function not implemented.");
            },
            vh: {} as unknown as IValueHostAccessor,
            getValidatorsValueHost(valueHostName: ValueHostName): IValidatorsValueHostBase | null {
                throw new Error("Function not implemented.");
            },
            getInputValueHost: function (valueHostName: string): IInputValueHost | null {
                throw new Error("Function not implemented.");
            },
            getPropertyValueHost: function (valueHostName: string): IPropertyValueHost | null {
                throw new Error("Function not implemented.");
            },
            getCalcValueHost: function (valueHostName: string): ICalcValueHost | null {
                throw new Error("Function not implemented.");
            },
            getStaticValueHost: function (valueHostName: string): IStaticValueHost | null {
                throw new Error("Function not implemented.");
            },
            services: new MockValidationServices(false, false),
            addValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");
            },
            addOrUpdateValueHost: function (config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");
            },
            addOrMergeValueHost(config: ValueHostConfig, initialState: ValueHostInstanceState | null): IValueHost {
                throw new Error("Function not implemented.");

            },
            discardValueHost: function (valueHostName: string): void {
                throw new Error("Function not implemented.");
            },
            enumerateValueHosts: function (filter?: (valueHost: IValueHost) => boolean): Generator<IValueHost> {
                throw new Error('Function not implemented.');
            },
            startModifying: function () {
                throw new Error('Function not implemented.');
            },
            notifyValueHostInstanceStateChanged: function (valueHost: IValueHost, instanceState: ValueHostInstanceState): void {
                throw new Error('Function not implemented.');
            }
        };
        expect(toIValidationManager(testItem)).toBe(testItem);
    });
    test('ValidationManager returns itself.', () => {
        let testItem = new ValidationManager({
            services: new ValidationServices(),
            valueHostConfigs: []
        });
        expect(toIValidationManager(testItem)).toBe(testItem);
    });    

    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidationManager(testItem)).toBeNull();
    });    
    test('null returns null.', () => {
        expect(toIValidationManager(null)).toBeNull();
    });        
    test('Non-object returns null.', () => {
        expect(toIValidationManager(100)).toBeNull();
    });        
});

describe('3 phase configuration: business logic->ui->new ValidationManager->modifier', () => {
    test('Each step adds one ValueHost with a new ValueHostName', () => {
        let services = createValidationServicesForTesting(); 
        (services.conditionFactory as ConditionFactory).register<RegExpConditionConfig>(
            ConditionType.RegExp, (config) => new RegExpCondition(config));    
        // phase 1
        let builder = build(services);
        builder.property('Property1').requireText();

        // phase 2
        builder.override({ convertPropertyToInput: true });
        builder.input('Field2').regExp(/\d/);

        let vm = new PublicifiedValidationManager(builder);

        // phase 3
        let modifier = vm.startModifying();
        modifier.static('Field3');
        modifier.apply();
        expect(vm.exposedValueHostConfigs.get('Property1')).toEqual(<InputValueHostConfig>{
            valueHostType: ValueHostType.Input,
            name: 'Property1',
            validatorConfigs: [
                {
                    conditionConfig: { conditionType: ConditionType.RequireText }
                }
            ]
        });
        expect(vm.exposedValueHostConfigs.get('Field2')).toEqual(<InputValueHostConfig>{
            valueHostType: ValueHostType.Input,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: <RegExpConditionConfig>{ conditionType: ConditionType.RegExp, expression: /\d/ }
                }
            ]
        });        
        expect(vm.exposedValueHostConfigs.get('Field3')).toEqual(<StaticValueHostConfig>{
            valueHostType: ValueHostType.Static,
            name: 'Field3'
        });
    });
    test('All steps modify the same ValueHostName', () => {
        let services = createValidationServicesForTesting(); 
        (services.conditionFactory as ConditionFactory).register<RegExpConditionConfig>(
            ConditionType.RegExp, (config) => new RegExpCondition(config));   
        // phase 1
        let builder = build(services);
        builder.property('Property1').requireText();
        // phase 2
        builder.override({ convertPropertyToInput: true });
        builder.input('Property1').regExp(/\d/);

        let vm = new PublicifiedValidationManager(builder);
        // phase 3
        let modifier = vm.startModifying();
        modifier.input('Property1', LookupKey.String, { label: 'Label1'});
        modifier.apply();
        expect(vm.exposedValueHostConfigs.get('Property1')).toEqual(<InputValueHostConfig>{
            valueHostType: ValueHostType.Input,
            name: 'Property1',
            dataType: LookupKey.String,
            label: 'Label1',
            validatorConfigs: [
                {
                    conditionConfig: { conditionType: ConditionType.RequireText }
                },
                {
                    conditionConfig: <RegExpConditionConfig>{ conditionType: ConditionType.RegExp, expression: /\d/ }
                }
            ]
        });
    });    
});

describe('Round trip caching of Config and State', () => {
    test('With capturing of state and config setup, create another ValidationManager using the captured data to confirm it rebuilds the same config', () => {
        function captureConfig(ValueHostsManager: IValueHostsManager, valueHostConfigs: Array<ValueHostConfig>): void
        {
            capturedConfig = valueHostConfigs;
        }
        let capturedConfig: Array<ValueHostConfig> | undefined = undefined;
        function captureManagerStateChanged(ValueHostsManager: IValueHostsManager, stateToRetain: ValueHostsManagerInstanceState): void
        {
            capturedManagerState = stateToRetain;
        }  
        let capturedManagerState: ValueHostsManagerInstanceState | undefined = undefined;
        function captureValueHostStateChanged(valueHost: IValueHost, stateToRetain: ValueHostInstanceState): void
        {
            capturedValueHostStates.set(valueHost.getName(), stateToRetain);
        }
        let capturedValueHostStates = new Map<string, ValueHostInstanceState>();

        let services = createValidationServicesForTesting();
        services.conditionFactory.register<RegExpConditionConfig>(ConditionType.RegExp, (config) => new RegExpCondition(config));

        let builder = build(services);
        builder.onConfigChanged = captureConfig;
        builder.onInstanceStateChanged = captureManagerStateChanged;
        builder.onValueHostInstanceStateChanged = captureValueHostStateChanged;

        builder.input('Field1', LookupKey.String).requireText(null, 'required');
        builder.static('Field2');
        let vm = new ValidationManager(builder);
        let modifier = vm.startModifying();
        modifier.input('Field1').regExp(/^\d*$/, null, null, 'Digits only');    // only digits allowed
        modifier.static('Field2', LookupKey.Integer);
        modifier.apply();
        vm.getInputValueHost('Field1')!.setValues('abc', ' abc ');    // saved into state
        vm.getStaticValueHost('Field2')!.setValue(10);

        let vmValidationState = vm.validate();  // changes validationManager state and Field1 state which has validation error now.

        let vh1IsValid = vm.getInputValueHost('Field1')!.isValid;
        let vh1ValidationStatus = vm.getInputValueHost('Field1')!.validationStatus;

        let vh1NativeValue = vm.getInputValueHost('Field1')!.getValue();
        let vh1InputValue = vm.getInputValueHost('Field1')!.getInputValue();
        let issuesFoundVH1 = vm.getInputValueHost('Field1')!.getIssuesFound();
        let vh2NativeValue = vm.getStaticValueHost('Field2')!.getValue();

        vm.dispose();   // our captured configs and states are still around
        let expectedField1: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessage: 'required'
                },
                {
                    conditionConfig: <RegExpConditionConfig>{
                        conditionType: ConditionType.RegExp,
                        expression: /^\d*$/
                    },
                    errorMessage: 'Digits only'
                }
            ]
        };
        let expectedField2: StaticValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'Field2',
            dataType: LookupKey.Integer
        }

        expect(capturedConfig).toEqual([expectedField1, expectedField2]);

        let testItem = new ValidationManager({
            services: services,
            valueHostConfigs: capturedConfig!,
            savedInstanceState: capturedManagerState,
            savedValueHostInstanceStates: Array.from(capturedValueHostStates.values()),
            onConfigChanged: captureConfig,
            onInstanceStateChanged: captureManagerStateChanged,
            onValueHostInstanceStateChanged: captureValueHostStateChanged
        });
        expect(testItem.getIssuesFound()).toEqual(vmValidationState.issuesFound);
        expect(testItem.isValid).toBe(vmValidationState.isValid);

        let vh1 = testItem.getInputValueHost('Field1');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getValue()).toBe(vh1NativeValue);
        expect(vh1!.getInputValue()).toBe(vh1InputValue);
        expect(vh1!.isValid).toBe(vh1IsValid);
        expect(vh1!.validationStatus).toBe(vh1ValidationStatus);
        expect(vh1!.getIssuesFound()).toEqual(issuesFoundVH1);
        
        let vh2 = testItem.getStaticValueHost('Field2');
        expect(vh2).toBeInstanceOf(StaticValueHost);
        expect(vh2!.getValue()).toBe(vh2NativeValue);

    });
});