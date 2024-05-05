import { PropertyValueHost, PropertyValueHostGenerator, toIPropertyValueHost } from "../../src/ValueHosts/PropertyValueHost";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";
import { PropertyValueHostConfig, PropertyValueHostInstanceState, IPropertyValueHost } from "../../src/Interfaces/PropertyValueHost";
import {
    ValidationStatus, IssueFound, ValueHostValidateResult, ValidateOptions,
    BusinessLogicError
} from "../../src/Interfaces/Validation";
import { IValidator, ValidatorConfig } from "../../src/Interfaces/Validator";
import { SetValueOptions, ValidTypesForInstanceStateStorage } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { StaticValueHost } from '../../src/ValueHosts/StaticValueHost';
import { FluentValidatorCollector } from "../../src/ValueHosts/Fluent";
import { InputValueHost } from "../../src/ValueHosts/InputValueHost";
import { CalcValueHost } from "../../src/ValueHosts/CalcValueHost";

interface ITestSetupConfig {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    config: PropertyValueHostConfig,
    state: PropertyValueHostInstanceState,
    valueHost: PropertyValueHost
};

function createPropertyValueHostConfig(fieldNumber: number = 1,
    dataType: string = LookupKey.String,
    initialValue?: any): PropertyValueHostConfig {
    return {
        name: 'Field' + fieldNumber,
        label: 'Label' + fieldNumber,
        valueHostType: ValueHostType.Property,
        dataType: dataType,
        initialValue: initialValue,
        validatorConfigs: []
    };
}

function finishPartialPropertyValueHostConfig(partialConfig: Partial<PropertyValueHostConfig> | null):
    PropertyValueHostConfig {
    let defaultIVH = createPropertyValueHostConfig(1, LookupKey.String);
    if (partialConfig) {
        return { ...defaultIVH, ...partialConfig };
    }
    return defaultIVH;
}

// function finishPartialPropertyValueHostConfigs(partialConfigs: Array<Partial<PropertyValueHostConfig>> | null):
//     Array<PropertyValueHostConfig> | null {
//     let result: Array<PropertyValueHostConfig> = [];
//     if (partialConfigs) {
//         for (let i = 0; i < partialConfigs.length; i++) {
//             let vhd = partialConfigs[i];
//             result.push(finishPartialPropertyValueHostConfig(vhd));
//         }
//     }

//     return result;
// }


// function createValidatorConfig(condConfig: ConditionConfig | null): ValidatorConfig {
//     return {
//         conditionConfig: condConfig,
//         errorMessage: 'Local',
//         summaryMessage: 'Summary',
//     };
// }
// function finishPartialValidatorConfig(validatorConfig: Partial<ValidatorConfig> | null):
//     ValidatorConfig {
//     let defaultIVD = createValidatorConfig(null);
//     if (validatorConfig) {
//         return { ...defaultIVD, ...validatorConfig };
//     }
//     return defaultIVD;
// }

// function finishPartialValidatorConfigs(validatorConfigs: Array<Partial<ValidatorConfig>> | null):
//     Array<ValidatorConfig> {
//     let result: Array<ValidatorConfig> = [];
//     if (validatorConfigs) {
//         for (let i = 0; i < validatorConfigs.length; i++) {
//             let vd = validatorConfigs[i];
//             result.push(finishPartialValidatorConfig(vd));
//         }
//     }

//     return result;
// }

function createPropertyValueHostInstanceState(fieldNumber: number = 1): PropertyValueHostInstanceState {
    return {
        name: 'Field' + fieldNumber,
        value: undefined,
        issuesFound: null,
        status: ValidationStatus.NotAttempted
    };
}
function finishPartialPropertyValueHostInstanceState(partialState: Partial<PropertyValueHostInstanceState> | null): PropertyValueHostInstanceState {
    let defaultIVS = createPropertyValueHostInstanceState(1);
    if (partialState) {
        return { ...defaultIVS, ...partialState };
    }
    return defaultIVS;
}

/**
 * Returns an ValueHost (PublicifiedValueHost subclass) ready for testing.
 * @param partialIVHConfig - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * name: 'Field1',
 * label: 'Label1',
 * valueHostType: 'Property',
 * DataType: LookupKey.String,
 * InitialValue: 'DATA'
 * validatorConfigs: []
 * @param partialState - Use the default state by passing null. Otherwise pass
 * a state. Your state will override default values. To avoid overriding,
 * pass the property with a value of undefined.
 * These are the default values
 * name: 'Field1'
 * Value: undefined
 * PropertyValue: undefined
 * IssuesFound: null,
 * ValidationStatus: NotAttempted
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, ValueHosts, the complete Config,
 * and the state.
 */
function setupPropertyValueHost(
    partialIVHConfig?: Partial<PropertyValueHostConfig> | null,
    partialState?: Partial<PropertyValueHostInstanceState> | null): ITestSetupConfig {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let updatedConfig = finishPartialPropertyValueHostConfig(partialIVHConfig ?? null);
    let updatedState = finishPartialPropertyValueHostInstanceState(partialState ?? null);

    let vh = vm.addPropertyValueHostWithConfig(updatedConfig, updatedState);
    //new PropertyValueHost(vm, updatedConfig, updatedState);
    return {
        services: services,
        validationManager: vm,
        config: updatedConfig,
        state: updatedState,
        valueHost: vh as PropertyValueHost
    };
}

// /**
//  * Creates a configuration where you can call validate() and test various results.
//  * @param partialValidatorConfigs - Always provide a list of the validatorConfigs in the desired order.
//  * If null, no validators are made available to validate
//  * @param partialPropertyValueState - Use to supply initial PropertyValue and Value properties. Any property
//  * not supplied will be provided.
//  * @returns Configuration that has been setup. Use valueHost to invoke validation functions.
//  */
// function setupPropertyValueHostForValidate(
//     partialValidatorConfigs: Array<Partial<ValidatorConfig>> | null,
//     partialPropertyValueState: Partial<PropertyValueHostInstanceState> | null,
//     vhGroup?: string | null): ITestSetupConfig {

//     let propertyValueConfig: Partial<PropertyValueHostConfig> = {
//         validatorConfigs: partialValidatorConfigs ?
//             finishPartialValidatorConfigs(partialValidatorConfigs) :
//             undefined
//     };
//     if (vhGroup !== undefined)
//         propertyValueConfig.group = vhGroup;

//     let updatedState = finishPartialPropertyValueHostInstanceState(
//         { ...{ propertyValue: '' }, ...partialPropertyValueState });

//     return setupPropertyValueHost(propertyValueConfig, updatedState);
// }

describe('constructor and resulting property values', () => {

    test('constructor with valid parameters created and sets up Services, Config, and InstanceState', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let testItem: PropertyValueHost | null = null;
        expect(()=> testItem = new PropertyValueHost(vm, {
            name: 'Field1',
            valueHostType: ValueHostType.Property,
            validatorConfigs: []
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined
            })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getPropertyName()).toBe('Field1');
        expect(testItem!.getLabel()).toBe('');
        expect(testItem!.getDataType()).toBeNull();
        expect(testItem!.getValue()).toBeUndefined();
        expect(testItem!.isChanged).toBe(false);
        expect(testItem!.isValid).toBe(true);
        expect(testItem!.asyncProcessing).toBe(false);
        expect(testItem!.corrected).toBe(false);        
    });
    test('constructor with Config.propertyName sets up getPropertyName correctly', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let testItem: PropertyValueHost | null = null;
        expect(()=> testItem = new PropertyValueHost(vm, {
            name: 'Field1',
            valueHostType: ValueHostType.Property,
            validatorConfigs: [],
            propertyName: 'Property1'
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined
            })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getPropertyName()).toBe('Property1');  
    });    
});

describe('setValue', () => {
    test('Value was changed. OnValueChanged called. (confirm ancestor was not broken)', () => {
        let setup = setupPropertyValueHost();
        let testItem = setup.valueHost;

        let callbackInvoked = 0;
        setup.validationManager.onValueChanged = (valueHost, oldValue) => {
            callbackInvoked++;
        };
        testItem.setValue(100);
        expect(callbackInvoked).toBe(1);

    });

    test('Value was changed. OnValueHostInstanceStateChanged called.(confirm ancestor was not broken) ', () => {
        const initialValue = 100;

        let setup = setupPropertyValueHost();
        let callbackInvoked = 0;
        setup.validationManager.onValueHostInstanceStateChanged = (valueHost, stateToRetain) => {
            callbackInvoked++;
        };        
        let testItem = setup.valueHost;
        testItem.setValue(initialValue);

        expect(callbackInvoked).toBe(1);
    });
});


describe('PropertyValueHostGenerator members', () => {
    test('CanCreate returns true for ValueHostType.Property', () => {
        let testItem = new PropertyValueHostGenerator();
        expect(testItem.canCreate({
            valueHostType: ValueHostType.Property,
            name: 'Field1',
            label: '',
            validatorConfigs: null
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected ValueHostType', () => {
        let testItem = new PropertyValueHostGenerator();
        expect(testItem.canCreate({
            valueHostType: 'Unexpected',
            name: 'Field1',
            label: '',
            validatorConfigs: null
        })).toBe(false);
    });

    test('CanCreate returns false for ValueHostType not defined even if it has validatorConfigs and propertyName', () => {
        let testItem = new PropertyValueHostGenerator();
        expect(testItem.canCreate({
            name: 'Field1',
            label: '',
            validatorConfigs: null,
            propertyName: 'Property1'
        })).toBe(false);
    });

    test('create returns instance of PropertyValueHost with VM, Config and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let config: PropertyValueHostConfig = {
            name: 'Field1',
            valueHostType: ValueHostType.Property,
            label: '',
            validatorConfigs: null
        };
        let state: PropertyValueHostInstanceState = {
            name: 'Field1',
            issuesFound: null,
            status: ValidationStatus.NotAttempted,
            value: 10
        };
        let testItem = new PropertyValueHostGenerator();
        let vh: IPropertyValueHost | null = null;
        expect(() => vh = testItem.create(vm, config, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(PropertyValueHost);
        expect(vh!.getName()).toBe(config.name);    // check Config value
        expect(vh!.getValue()).toBe(10);  // check instanceState value
    });
});

describe('toIPropertyValueHost function', () => {
    test('Passing actual PropertyValueHost matches interface returns same object.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new PropertyValueHost(vm, {
            name: 'Field1',
            label: 'Label1',
            validatorConfigs: []
        },
            {
                name: 'Field1',
                value: undefined,
                issuesFound: null,
                status: ValidationStatus.NotAttempted
            });
        expect(toIPropertyValueHost(testItem)).toBe(testItem);
    });
    class TestIPropertyValueHostImplementation implements IPropertyValueHost {
        getPropertyName(): string {
            throw new Error("Method not implemented.");
        }
        getValidator(errorCode: string): IValidator | null {
            throw new Error("Method not implemented.");
        }
        addValidator(config: ValidatorConfig): void {
            throw new Error("Method not implemented.");
        }
        configValidators(): FluentValidatorCollector {
            throw new Error("Method not implemented.");
        }
        setGroup(group: string): void {
            throw new Error("Method not implemented.");
        }
        otherValueHostChangedNotification(valueHostIdThatChanged: string, revalidate: boolean): void {
            throw new Error("Method not implemented.");
        }
        validate(options?: ValidateOptions | undefined): ValueHostValidateResult | null {
            throw new Error("Method not implemented.");
        }
        clearValidation(options?: ValidateOptions | undefined): boolean {
            throw new Error("Method not implemented.");
        }
        isValid: boolean = true;
        validationStatus: ValidationStatus = ValidationStatus.NotAttempted;
        asyncProcessing: boolean = false;
        setBusinessLogicError(error: BusinessLogicError, options?: ValidateOptions | undefined): boolean {
            throw new Error("Method not implemented.");
        }
        clearBusinessLogicErrors(options?: ValidateOptions | undefined): boolean {
            throw new Error("Method not implemented.");
        }
        doNotSave: boolean = false;
        corrected: boolean = false;
        getIssueFound(errorCode: string): IssueFound | null {
            throw new Error("Method not implemented.");
        }
        getIssuesFound(group?: string | undefined): IssueFound[] | null {
            throw new Error("Method not implemented.");
        }
        getName(): string {
            throw new Error("Method not implemented.");
        }
        getLabel(): string {
            throw new Error("Method not implemented.");
        }
        setLabel(label: string, labell10n?: string | undefined): void {
            throw new Error("Method not implemented.");
        }
        getValue() {
            throw new Error("Method not implemented.");
        }
        setValue(value: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        setValueToUndefined(options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        getDataType(): string | null {
            throw new Error("Method not implemented.");
        }
        saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void {
            throw new Error("Method not implemented.");
        }
        getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined {
            throw new Error("Method not implemented.");
        }
        isChanged: boolean = false;
        gatherValueHostNames(collection: Set<string>, valueHostResolver: IValueHostResolver): void {
            throw new Error("Method not implemented.");
        }
    }

    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIPropertyValueHostImplementation();

        expect(toIPropertyValueHost(testItem)).toBe(testItem);
    });
    test('InputValueHost return null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new InputValueHost(vm, {
            name: 'Field1',
            label: 'Label1',
            validatorConfigs: []
        },
            {
                name: 'Field1',
                value: undefined,
                issuesFound: null,
                status: ValidationStatus.NotAttempted
            });
        expect(toIPropertyValueHost(testItem)).toBeNull();
    });    
    test('StaticValueHost return null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new StaticValueHost(vm, {
                name: 'Field1',
                label: 'Label1'
            },
            {
                name: 'Field1',
                value: undefined
            });
        expect(toIPropertyValueHost(testItem)).toBeNull();
    });        
    test('CalcValueHost return null.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new CalcValueHost(vm, {
                name: 'Field1',
                label: 'Label1',
                calcFn: (host, manager)=> 0
            },
            {
                name: 'Field1',
                value: undefined
            });
        expect(toIPropertyValueHost(testItem)).toBeNull();
    });        
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIPropertyValueHost(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIPropertyValueHost(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIPropertyValueHost(100)).toBeNull();
    });
});