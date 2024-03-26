import {
    CompareToConditionDescriptor, DataTypeCheckConditionDescriptor, RangeConditionDescriptor,
    RequiredTextConditionDescriptor, RequiredTextCondition, RegExpConditionDescriptor, RegExpCondition,
} from "../../src/Conditions/ConcreteConditions";
import { InputValidator } from "../../src/ValueHosts/InputValidator";
import { InputValueHost, InputValueHostGenerator, InputValueHostType, toIInputValueHost } from "../../src/ValueHosts/InputValueHost";
import { ConfigurationCategory, LoggingLevel } from "../../src/Interfaces/Logger";
import { ValidationManager } from "../../src/ValueHosts/ValidationManager";
import { AlwaysMatchesConditionType, IsUndeterminedConditionType, MockCapturingLogger, MockValidationServices, MockValidationManager, NeverMatchesConditionType, NeverMatchesConditionType2, NeverMatchesCondition, registerTestingOnlyConditions } from "../Mocks";
import { ValidationServices } from '../../src/Services/ValidationServices';
import { ValueHostId } from "../../src/DataTypes/BasicTypes";
import { InputValueHostDescriptor, InputValueHostState, IInputValueHost, InputValueHostBaseState } from "../../src/Interfaces/InputValueHost";
import {
    ValidationResult, IssueFound, ValidateResult, ValidationSeverity, ValidateOptions,
    BusinessLogicError, IssueSnapshot
} from "../../src/Interfaces/Validation";
import { InputValidateResult, IInputValidator, InputValidatorDescriptor, IInputValidatorFactory } from "../../src/Interfaces/InputValidator";
import { IValidationManager, ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { SetValueOptions, IValueHost, ValueHostState, ValueHostDescriptor } from "../../src/Interfaces/ValueHost";
import { IInputValueHostCallbacks, toIInputValueHostCallbacks, ValueHostValidatedHandler } from "../../src/ValueHosts/InputValueHostBase";
import { ValueHostStateChangedHandler } from "../../src/ValueHosts/ValueHostBase";
import { createValidationServices } from "../../starter_code/create_services";
import { ConditionWithPromiseTester } from "./InputValidator.test";
import { ConditionCategory, ConditionEvaluateResult, ICondition, ConditionDescriptor, IConditionFactory } from "../../src/Interfaces/Conditions";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { DataTypeServices } from "../../src/DataTypes/DataTypeServices";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IDataTypeCheckGenerator } from "../../src/Interfaces/DataTypes";

interface ITestSetupConfig {
    services: MockValidationServices,
    validationManager: MockValidationManager,
    descriptor: InputValueHostDescriptor,
    state: InputValueHostState,
    valueHost: InputValueHost
};

function createInputValueHostDescriptor(fieldNumber: number = 1,
    dataType: string = LookupKey.String,
    initialValue?: any): InputValueHostDescriptor {
    return {
        Id: 'Field' + fieldNumber,
        Label: 'Label' + fieldNumber,
        Type: InputValueHostType,
        DataType: dataType,
        InitialValue: initialValue,
        ValidatorDescriptors: []
    };
}

function finishPartialInputValueHostDescriptor(partialDescriptor: Partial<InputValueHostDescriptor> | null):
    InputValueHostDescriptor {
    let defaultIVH = createInputValueHostDescriptor(1, LookupKey.String);
    if (partialDescriptor) {
        return { ...defaultIVH, ...partialDescriptor };
    }
    return defaultIVH;
}

function finishPartialInputValueHostDescriptors(partialDescriptors: Array<Partial<InputValueHostDescriptor>> | null):
    Array<InputValueHostDescriptor> | null {
    let result: Array<InputValueHostDescriptor> = [];
    if (partialDescriptors) {
        for (let i = 0; i < partialDescriptors.length; i++) {
            let vhd = partialDescriptors[i];
            result.push(finishPartialInputValueHostDescriptor(vhd));
        }
    }

    return result;
}


function createInputValidatorDescriptor(condDescriptor: ConditionDescriptor | null): InputValidatorDescriptor {
    return {
        ConditionDescriptor: condDescriptor,
        ErrorMessage: 'Local',
        SummaryMessage: 'Summary',
    };
}
function finishPartialInputValidatorDescriptor(validatorDescriptor: Partial<InputValidatorDescriptor> | null):
    InputValidatorDescriptor {
    let defaultIVD = createInputValidatorDescriptor(null);
    if (validatorDescriptor) {
        return { ...defaultIVD, ...validatorDescriptor };
    }
    return defaultIVD;
}

function finishPartialInputValidatorDescriptors(validatorDescriptors: Array<Partial<InputValidatorDescriptor>> | null):
    Array<InputValidatorDescriptor> {
    let result: Array<InputValidatorDescriptor> = [];
    if (validatorDescriptors) {
        let defaultIVD = createInputValidatorDescriptor(null);
        for (let i = 0; i < validatorDescriptors.length; i++) {
            let vd = validatorDescriptors[i];
            result.push(finishPartialInputValidatorDescriptor(vd));
        }
    }

    return result;
}

function createInputValueHostState(fieldNumber: number = 1): InputValueHostState {
    return {
        Id: 'Field' + fieldNumber,
        Value: undefined,
        InputValue: undefined,
        IssuesFound: null,
        ValidationResult: ValidationResult.NotAttempted
    };
}
function finishPartialInputValueHostState(partialState: Partial<InputValueHostState> | null): InputValueHostState {
    let defaultIVS = createInputValueHostState(1);
    if (partialState) {
        return { ...defaultIVS, ...partialState };
    }
    return defaultIVS;
}

/**
 * Returns an ValueHost (PublicifiedValueHost subclass) ready for testing.
 * @param partialIVHDescriptor - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * Id: 'Field1',
 * Label: 'Label1',
 * Type: 'Input',
 * DataType: LookupKey.String,
 * InitialValue: 'DATA'
 * ValidatorDescriptors: []
 * @param partialState - Use the default state by passing null. Otherwise pass
 * a state. Your state will override default values. To avoid overriding,
 * pass the property with a value of undefined.
 * These are the default values
 * Id: 'Field1'
 * Value: undefined
 * InputValue: undefined
 * IssuesFound: null,
 * ValidationResult: NotAttempted
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, ValueHosts, the complete Descriptor,
 * and the state.
 */
function setupInputValueHost(
    partialIVHDescriptor?: Partial<InputValueHostDescriptor> | null,
    partialState?: Partial<InputValueHostState> | null): ITestSetupConfig {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let updatedDescriptor = finishPartialInputValueHostDescriptor(partialIVHDescriptor ?? null);
    let updatedState = finishPartialInputValueHostState(partialState ?? null);

    let vh = vm.addInputValueHostWithDescriptor(updatedDescriptor, updatedState);
    //new InputValueHost(vm, updatedDescriptor, updatedState);
    return {
        services: services,
        validationManager: vm,
        descriptor: updatedDescriptor,
        state: updatedState,
        valueHost: vh as InputValueHost
    };
}

/**
 * Creates a configuration where you can call Validate() and test various results.
 * @param partialValidatorDescriptors - Always provide a list of the validatorDescriptors in the desired order.
 * If null, no validators are made available to Validate
 * @param partialInputValueState - Use to supply initial InputValue and Value properties. Any property
 * not supplied will be provided.
 * @returns Configuration that has been setup. Use valueHost to invoke validation functions.
 */
function setupInputValueHostForValidate(
    partialValidatorDescriptors: Array<Partial<InputValidatorDescriptor>> | null,
    partialInputValueState: Partial<InputValueHostState> | null,
    vhGroup? : string | null): ITestSetupConfig {

    let inputValueDescriptor: Partial<InputValueHostDescriptor> = {
        ValidatorDescriptors: partialValidatorDescriptors ?
            finishPartialInputValidatorDescriptors(partialValidatorDescriptors) :
            undefined
    };
    if (vhGroup !== undefined)
        inputValueDescriptor.Group = vhGroup;

    let updatedState = finishPartialInputValueHostState(
        { ...{ InputValue: '' }, ...partialInputValueState });

    return setupInputValueHost(inputValueDescriptor, updatedState);
}

describe('constructor and resulting property values', () => {

    test('constructor with valid parameters created and sets up Services, Descriptor, and State', () => {
        let config = setupInputValueHost({});
        let testItem = config.valueHost;
        expect(testItem.ValueHostsManager).toBe(config.validationManager);

        expect(testItem.getId()).toBe('Field1');
        expect(testItem.getLabel()).toBe('Label1');
        expect(testItem.getDataType()).toBe(LookupKey.String);
        expect(testItem.getValue()).toBeUndefined();
        expect(testItem.IsChanged).toBe(false);
        expect(testItem.RequiresInput).toBe(false);
        expect(testItem.getConversionErrorMessage()).toBeNull();
        expect(testItem.IsValid).toBe(true);
    });
    test('constructor with Descriptor.labell10n setup. GetLabel results in localized lookup', () => {
        let config = setupInputValueHost({
            Labell10n: 'Label1-key'
        });
        let tls = config.services.TextLocalizerService as TextLocalizerService;
        tls.register('Label1-key', {
            '*': '*-Label1'
        });
        let testItem = config.valueHost;

        expect(testItem.getLabel()).toBe('*-Label1');

    });
});
describe('InputValueHost.GetValue', () => {
    test('Set State.Value to undefined; GetValue is undefined', () => {
        let config = setupInputValueHost(null, {
            Value: undefined
        });
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getValue()).not.toThrow();
        expect(value).toBeUndefined();
    });
    test('Set State.Value to null; GetValue is null', () => {
        let config = setupInputValueHost(null, {
            Value: null
        });
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getValue()).not.toThrow();
        expect(value).toBeNull();
    });
    test('Set State.Value to 10; GetValue is 10', () => {
        let config = setupInputValueHost(null, {
            Value: 0
        });
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getValue()).not.toThrow();
        expect(value).toBe(0);
    });

});

describe('InputValueHost.SetValue with GetValue to check result and IsChanged property', () => {
    test('Value of 10, options is undefined. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10)).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(true);
    });
    test('Value of 10, options is empty object. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, {})).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(true);
    });
    test('Value of 10, options is null. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, null!)).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(true);
    });
    test('Value of 10, options is { Validate: false }. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { Validate: false })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(true);
    });
    test('Value of 10, options is { Validate: true }. Sets value to 10 and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { Validate: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(true);
    });
    test('Before calling, Validate for ValidationResult=Undetermined. Set value to 10 with options { ClearValidate: true }. Expect value to be 20,. IsChanged = false, and ValidationResult to NotAttempted', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        config.valueHost.validate();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
        expect(() => config.valueHost.setValue(10, { Reset: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.IsChanged).toBe(false);
    });
    test('Set Value to 10, with options is { Validate: true } then sets value to 20 with no options. Expect ValidationResult to ValueChangedButUnvalidated', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { Validate: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
        expect(() => config.valueHost.setValue(20)).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
    });
    test('State has Value=10 before calling SetValue with 10. No changes. ValidationResult stays NotAttempted, IsChanged stays false', () => {
        let config = setupInputValueHost(null, {
            Value: 10
        });

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10)).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.IsChanged).toBe(false);
    });
    test('State has Value=10 before calling SetValue with 10 and with Validation option set. No changes, not validation occurs, IsChanged stays false. ValidationResult stays NotAttempted', () => {
        let config = setupInputValueHost(null, {
            Value: 10
        });

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { Validate: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.IsChanged).toBe(false);
        expect(config.valueHost.getValue()).toBe(10);
    });
    test('Value of 10, options is { Validate: true }. Sets value to 10 and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { Validate: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
    });
    test('ConversionErrorTokenValue supplied and is saved because value is undefined.', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(undefined, { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBe('ERROR');
    });
    test('ConversionErrorTokenValue supplied but is not saved because value is defined', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(10, { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue supplied in one call which saves it but a follow up call without it abandons it', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(undefined, { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        config.valueHost.setValue(10, { ConversionErrorTokenValue: 'ERROR' });
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('Use both ConversionErrorTokenValue and Reset options will setup the error message and IsChanged is false', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(undefined, { ConversionErrorTokenValue: 'ERROR', Reset: true })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(false);
    });
    test('Value was changed. OnValueChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedValues: Array<{ newValue: any, oldValue: any }> = [];
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        expect(() => testItem.setValue(secondValue)).not.toThrow();
        expect(() => testItem.setValue(finalValue)).not.toThrow();

        expect(changedValues.length).toBe(2);
        expect(changedValues[0].newValue).toBe(secondValue);
        expect(changedValues[0].oldValue).toBe(initialValue);
        expect(changedValues[1].newValue).toBe(finalValue);
        expect(changedValues[1].oldValue).toBe(secondValue);
    });
    test('Value was not changed. OnValueChanged is not called.', () => {
        const initialValue = 100;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedValues: Array<{ newValue: any, oldValue: any }> = [];
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(() => testItem.setValue(initialValue)).not.toThrow();

        expect(changedValues.length).toBe(0);

    });
    test('Value was changed. OnValueChanged setup but not called because SkipValueChangedCallback is true', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedValues: Array<{ newValue: any, oldValue: any }> = [];
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        expect(() => testItem.setValue(secondValue, { SkipValueChangedCallback: true })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { SkipValueChangedCallback: true })).not.toThrow();

        expect(changedValues.length).toBe(0);

    });
    test('Value was changed. OnValueChanged setup and is not called because SkipValueChangedCallback is false', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedValues: Array<{ newValue: any, oldValue: any }> = [];
        config.validationManager.OnValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        expect(() => testItem.setValue(secondValue, { SkipValueChangedCallback: false })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { SkipValueChangedCallback: false })).not.toThrow();

        expect(changedValues.length).toBe(2);
        expect(changedValues[0].newValue).toBe(secondValue);
        expect(changedValues[0].oldValue).toBe(initialValue);
        expect(changedValues[1].newValue).toBe(finalValue);
        expect(changedValues[1].oldValue).toBe(secondValue);
    });
    test('Value was changed. OnValueHostStateChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedState: Array<InputValueHostState> = [];
        config.validationManager.OnValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain as InputValueHostState);
        };

        expect(() => testItem.setValue(secondValue)).not.toThrow();
        expect(() => testItem.setValue(finalValue)).not.toThrow();

        expect(changedState.length).toBe(2);
        expect(changedState[0].Value).toBe(secondValue);
        expect(changedState[1].Value).toBe(finalValue);
    });

    test('Value was not changed. OnValueHostStateChanged is not called.', () => {
        const initialValue = 100;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedState: Array<InputValueHostState> = [];
        config.validationManager.OnValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain as InputValueHostState);
        };

        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(() => testItem.setValue(initialValue)).not.toThrow();

        expect(changedState.length).toBe(0);
    });
});
describe('InputValueHost.GetInputValue', () => {
    test('Set State.InputValue to undefined; GetInputValue is undefined', () => {
        let config = setupInputValueHost(null, {
            InputValue: undefined
        });
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getInputValue()).not.toThrow();
        expect(value).toBeUndefined();
    });
    test('Set State.InputValue to null; GetInputValue is null', () => {
        let config = setupInputValueHost(null, {
            InputValue: null
        });
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getInputValue()).not.toThrow();
        expect(value).toBeNull();
    });
    test('Set State.InputValue to "abc"; GetInputValue is "abc"', () => {
        let config = setupInputValueHost(null, {
            InputValue: 'abc'
        });
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getInputValue()).not.toThrow();
        expect(value).toBe('abc');
    });

});

describe('InputValueHost.SetInputValue with GetInputValue to check result', () => {
    test('Value of "ABC", options is undefined. Sets value to "ABC" and does not validate. IsChanged is true', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC")).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
    });
    test('Value of "ABC", options is empty object. Sets value to "ABC" and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", {})).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
    });
    test('Value of "ABC", options is null. Sets value to "ABC" and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", null!)).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
    });
    test('Value of "ABC", options is { Validate: false }. Sets value to "ABC" and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", { Validate: false })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
    });
    test('Value of "ABC", options is { Validate: true }. Sets value to "ABC" and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", { Validate: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationResult
        let valueChange = <InputValueHostState>changes[0];
        expect(valueChange.InputValue).toBe("ABC");
        let vrChange = <InputValueHostState>changes[1];
        expect(vrChange.ValidationResult).toBe(ValidationResult.Valid);
        expect(vrChange.ChangeCounter).toBe(1);
    });
    test('Before calling, Validate for ValidationResult=Undetermined. Set value to 10 with options { Reset: true }. Expect value to be 20, IsChanged = false, and ValidationResult to NotAttempted', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        config.valueHost.validate();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
        expect(() => config.valueHost.setInputValue('ABC', { Reset: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssuesFound()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(false);
    });
    test('ConversionErrorTokenValue supplied and is ignored because we are not setting native value here', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue supplied in previous SetValue, but is abandoned by SetWidetValue because we are not setting native value here', () => {
        let config = setupInputValueHost();

        config.valueHost.setValueToUndefined({ ConversionErrorTokenValue: 'ERROR' });

        expect(() => config.valueHost.setInputValue("ABC", { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
});

describe('InputValueHost.SetValues with GetInputValue and GetValue to check result', () => {
    test('InputValue of "10", Value of 10, options is undefined. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10")).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).Value).toBe(10);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('InputValue of "10", Value of 10, options is empty object. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", {})).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).Value).toBe(10);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
    });
    test('InputValue of "10", Value of 10, options is null. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", null!)).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).Value).toBe(10);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
    });
    test('InputValue of "10", Value of 10, options is { Validate: false }. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", { Validate: false })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).Value).toBe(10);
        expect((<InputValueHostState>changes[0]).InputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).ChangeCounter).toBe(1);
    });
    test('InputValue of "10", Value of 10, options is { Validate: true }. Sets both values, IsChanged = true, and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", { Validate: true })).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.IsChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationResult
        let valueChange = <InputValueHostState>changes[0];
        expect(valueChange.Value).toBe(10);
        expect(valueChange.InputValue).toBe("10");
        let vrChange = <InputValueHostState>changes[1];
        expect(vrChange.ValidationResult).toBe(ValidationResult.Valid);
        expect(vrChange.ChangeCounter).toBe(1);
    });

    test('ConversionErrorTokenValue supplied and is saved because native value is undefined', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(undefined, "ABC", { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBe('ERROR');
        expect(config.valueHost.IsChanged).toBe(true);
    });
    test('ConversionErrorTokenValue supplied but is not saved because native value is defined', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue supplied in one call which saves it but a follow up call without it abandons it', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(undefined, { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        config.valueHost.setValues(10, "10", { ConversionErrorTokenValue: 'ERROR' });
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue and Reset supplied on second call. ErrorMessage is null and IsChanged is false.', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(undefined, { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        config.valueHost.setValues(10, "10", { ConversionErrorTokenValue: 'ERROR', Reset: true });
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.IsChanged).toBe(false);
    });
});

/**
 * For testing InputValueHost.Validate (but not the logic of an individual InputValidator.Validate).
 * @param validatorDescriptors - Always provide a list of the validatorDescriptors in the desired order.
 * If null, no validators are made available to Validate
 * @param inputValueState - Use to supply initial InputValue and Value properties. Any property
 * not supplied will be provided.
 * @param expectedValidationResult 
 * @param expectedIssuesFound - This will be matched by Jest's isEqual.
 */
function testValidateFunction(validatorDescriptors: Array<Partial<InputValidatorDescriptor>> | null,
    inputValueState: Partial<InputValueHostState> | null,
    expectedValidationResult: ValidationResult,
    expectedIssuesFound: Array<IssueFound> | null,
    validationGroupForValueHost?: string | undefined,
    validationGroupForValidateFn?: string | undefined,
    expectedStateChanges: number = 1): ITestSetupConfig {

    let config = setupInputValueHostForValidate(validatorDescriptors, inputValueState, validationGroupForValueHost);
    let vrDetails: ValidateResult | null = null;
    expect(() => vrDetails = config.valueHost.validate({ Group: validationGroupForValidateFn })).not.toThrow();
    expect(vrDetails).not.toBeNull();
    expect(vrDetails!.ValidationResult).toBe(expectedValidationResult);
    expect(vrDetails!.IssuesFound).toEqual(expectedIssuesFound);
    expect(vrDetails!.Pending).toBeUndefined();

    let stateChanges = config.validationManager.getHostStateChanges();
    expect(stateChanges).not.toBeNull();
    expect(stateChanges.length).toBe(expectedStateChanges);

    return config;
}

function createIssueFound(conditionType: string,
    severity: ValidationSeverity = ValidationSeverity.Error,
    errorMessage: string = 'Local',
    summaryMessage: string = 'Summary'): IssueFound {
    return {
        ValueHostId: 'Field1',
        ConditionType: conditionType,
        Severity: severity,
        ErrorMessage: errorMessage,
        SummaryMessage: summaryMessage
    };
}
describe('InputValueHost.Validate', () => {
    //NOTE: InputValidator tests already handle testing InputValidator property of Enabled, Enabler,
    // and Validate's Group parameter. When those skip the condition, we expect a ConditionEvaluationResult of Undetermined
    // which is evaluated in these tests.
    test('Without InputValidators is ValidationResult.Valid', () => {
        testValidateFunction(null, null, ValidationResult.Valid, null);
    });
    test('With 1 Condition evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, null);
    });
    test('With 1 Condition evaluating as NoMatch is ValidatorResult.Invalid, IssuesFound = 1', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);
    });
    test('With 1 Condition evaluating as Undetermined is ValidatorResult.Undetermined, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: IsUndeterminedConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Undetermined, null);
    });
    test('With 2 Conditions evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                },
                ErrorMessage: '1'
            },
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                },
                ErrorMessage: '2'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, null);
    });
    test('With 2 Conditions (Required, RangeCondition) evaluating as Undetermined is ValidatorResult.Undetermined, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: IsUndeterminedConditionType
                }
            },
            {
                ConditionDescriptor: {
                    Type: IsUndeterminedConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Undetermined, null);
    });
    test('With Validator of Severe evaluating as NoMatch, second Condition is skipped even though it would be NoMatch, IssuesFound = 1', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                Severity: ValidationSeverity.Severe
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                ErrorMessage: '2'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Severe));
        testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);

    });
    test('With Validator of Severe evaluating as Match, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                },
                Severity: ValidationSeverity.Severe
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);

    });
    test('With Validator of Severe evaluating as Undetermined, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor:
                {
                    Type: IsUndeterminedConditionType
                },
                Severity: ValidationSeverity.Severe
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as NoMatch, second Condition is evaluated and is NoMatch, IssuesFound = 2 with both conditions', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                Severity: ValidationSeverity.Warning,
                ErrorMessage: '1'
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                ErrorMessage: '2'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning, "1"));
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Error, "2"));
        testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as Undetermined, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: IsUndeterminedConditionType
                },
                Severity: ValidationSeverity.Warning
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as Match, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                },
                Severity: ValidationSeverity.Warning
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as NoMatch, second Condition is evaluated and is Match, IssuesFound = 1 with first condition. ValidationResult is Valid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                Severity: ValidationSeverity.Warning
            },
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning));
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, issuesFound);

    });
    test('With Validator of Warning evaluating as NoMatch and no second condition, ValidationResult = Valid, IssuesFound = 1', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                Severity: ValidationSeverity.Warning
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning));
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, issuesFound);

    });
    test('With only 1 Validator, and its set to Enabled=false, acts like there are no validators. ValidationResult is Valid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                Enabled: false
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, null);

    });
    function testGroups(valueHostGroup: string, validateGroup: string, expectedResult: ValidationResult, expectedStateChanges: number = 1): void
    {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issueFound: IssueFound | null = null;
        if (expectedResult === ValidationResult.Invalid)
            issueFound = {
                ConditionType: NeverMatchesConditionType,
                ErrorMessage: 'Local',
                SummaryMessage: 'Summary',
                Severity: ValidationSeverity.Error,
                ValueHostId: 'Field1'
            };
        testValidateFunction(ivDescriptors, state, expectedResult, issueFound ? [issueFound] : null, valueHostGroup, validateGroup, expectedStateChanges);
    }

    test('Group test. InputValueHost has Group name but validate has empty string for group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', '', ValidationResult.Invalid);
    });
    test('Group test. InputValueHost has Group name but validate has * for group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', '*', ValidationResult.Invalid);
    });    
    test('Group test. InputValueHost has Group name and Validate has same group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', 'GROUPA', ValidationResult.Invalid);
    });

    test('Group test. InputValueHost has Group name and Validate has same group name but case mismatch. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', 'groupa', ValidationResult.Invalid);
    });
    test('Group test. InputValueHost has Group name but validate has a different group name. Validation skipped and result is Valid', () => {
        testGroups('GROUPA', 'GROUPB', ValidationResult.Undetermined, 0);
    });

    test('Validate one ValueHost with validators that results in Valid. OnValueHostValidated called.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let results: Array<ValidateResult> = [];
        config.validationManager.OnValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].ValidationResult).toBe(ValidationResult.Valid);
    });
    test('Validate one ValueHost with validators that results in Invalid. OnValueHostValidated called.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let results: Array<ValidateResult> = [];
        config.validationManager.OnValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].ValidationResult).toBe(ValidationResult.Invalid);
    });
});
describe('InputValueHost.Validate uses autogenerated DataTypeCheck condition', () => {
    test('No conditions at all. DataTypeCheckCondition gets added', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            // {
            //     ConditionDescriptor: {
            //         Type: AlwaysMatchesConditionType
            //     }
            // }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;
        config.services.DataTypeServices.AutoGenerateDataTypeConditionEnabled = true;
        (config.services.TextLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.OnValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues(undefined, 'ABC');   // will violate DataTypeCheckCondition
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].ValidationResult).toBe(ValidationResult.Invalid);
        expect(results[0].IssuesFound![0].ConditionType).toBe(ConditionType.DataTypeCheck);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, ConfigurationCategory, 'InputValidator')).not.toBeNull();
    });
    test('1 condition exists and it is not a DataTypeCheck category. DataTypeCheckCondition gets added', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;
        config.services.DataTypeServices.AutoGenerateDataTypeConditionEnabled = true;
        (config.services.TextLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.OnValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues(undefined, 'ABC');   // will violate DataTypeCheckCondition
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].ValidationResult).toBe(ValidationResult.Invalid);
        expect(results[0].IssuesFound![0].ConditionType).toBe(ConditionType.DataTypeCheck);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, ConfigurationCategory, 'InputValidator')).not.toBeNull();
    });    
    test('1 condition and it is an actual DataTypeCheckCondition. No DataTypeCheckCondition gets added.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: ConditionType.DataTypeCheck
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;
        config.services.DataTypeServices.AutoGenerateDataTypeConditionEnabled = true;
        (config.services.TextLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.OnValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues(undefined, 'ABC');   // will violate DataTypeCheckCondition
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].ValidationResult).toBe(ValidationResult.Invalid);
        expect(results[0].IssuesFound![0].ConditionType).toBe(ConditionType.DataTypeCheck);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, ConfigurationCategory, 'InputValidator')).toBeNull(); // proves not auto generated
    });        

    test('1 condition and it has ConditionCategory=DataTypeCheck. No DataTypeCheckCondition gets added.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: <RegExpConditionDescriptor> {
                    Type: ConditionType.RegExp,
                    ExpressionAsString: '^A$', // will match only "A" and we will supply "ABC"
                    Category: ConditionCategory.DataTypeCheck
                },
                ErrorMessage: 'Regexp error'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;
        config.services.DataTypeServices.AutoGenerateDataTypeConditionEnabled = true;
        (config.services.TextLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.OnValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues('ABC', 'ABC');   // will violate the regexp
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].ValidationResult).toBe(ValidationResult.Invalid);
        expect(results[0].IssuesFound![0].ConditionType).toBe(ConditionType.RegExp);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, ConfigurationCategory, 'InputValidator')).toBeNull(); // proves not auto generated
    });            
    test('Register a DataTypeCheckCondition for PhoneNumber and ensure it gets autogenerated and used', () => {
        const phoneNumberLookupKey = 'PhoneNumber';
        const phoneNumberConditionType = 'PhoneNumber';
        class PhoneNumberDataTypeCheckGenerator implements IDataTypeCheckGenerator
        {
            supportsValue(dataTypeLookupKey: string): boolean {
                return dataTypeLookupKey === phoneNumberLookupKey;
            }
            createCondition(valueHost: IInputValueHost, dataTypeLookupKey: string, conditionFactory: IConditionFactory): ICondition | null {
                return new RegExpCondition({
                    Type: phoneNumberConditionType,
                    Expression: /^\d\d\d \d\d\d\-\d{4}$/, // ### ###-####
                    ValueHostId: null
               });
            }

        }
        let services = new MockValidationServices(true, true);
        let logger = services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;
        services.DataTypeServices.AutoGenerateDataTypeConditionEnabled = true;
        (services.DataTypeServices as DataTypeServices).
            registerDataTypeCheckGenerator(new PhoneNumberDataTypeCheckGenerator());
        
        (services.TextLocalizerService as TextLocalizerService).
            registerErrorMessage(phoneNumberConditionType, null,
            {
                '*': 'Error Found'
            });

        let descriptors: Array<ValueHostDescriptor> = [
            <InputValueHostDescriptor>{
                Type: InputValueHostType,
                Id: 'Field1',
                DataType: phoneNumberLookupKey,
                ValidatorDescriptors: []
            }
        ];
        let results: Array<ValidateResult> = [];
        let vmConfig: ValidationManagerConfig = {
            Services: services,
            ValueHostDescriptors: descriptors,
            OnValueHostValidated: (valueHost, validateResult) => {
                results.push(validateResult);
            }
        };
        let vm = new ValidationManager(vmConfig);
        let vh = vm.getValueHost('Field1') as InputValueHost;

        vh.setValues('ABC', 'ABC');   // will violate the regexp
        vh.validate();
        expect(results.length).toBe(1);
        expect(results[0].ValidationResult).toBe(ValidationResult.Invalid);
        expect(results[0].IssuesFound![0].ConditionType).toBe(phoneNumberConditionType);

        expect(logger.findMessage('PhoneNumber Condition for Data Type Check', LoggingLevel.Info, ConfigurationCategory, 'InputValidator')).not.toBeNull();
    });

});

describe('InputValueHost.IsValid and ValidationResult', () => {

    test('Without InputValidators is true, ValidationResult = Valid', () => {
        let config = setupInputValueHostForValidate(null, null);
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(true);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
    });
    test('With 1 Condition evaluating as Match. IsValid is true, ValidationResult=Valid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(true);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
    });
    test('With 1 Condition evaluating as NoMatch. IsValid is false. ValidationResult=Invalid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(false);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Invalid);
    });
    test('Without InputValidators but have a BusinessLogicError (Error), IsValid=false, ValidationResult = Invalid', () => {
        let config = setupInputValueHostForValidate(null, null);
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
        });
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(false);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Invalid);
    });
    test('Without InputValidators but have a BusinessLogicError (Warning), IsValid=true, ValidationResult = Valid', () => {
        let config = setupInputValueHostForValidate(null, null);
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(true);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
    });
    test('With 1 Condition evaluating as NoMatch and have a BusinessLogicError (Warning). IsValid is false due to NoMatch. ValidationResult=Invalid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(false);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Invalid);
    });
    test('With 1 Condition evaluating as Match and have a BusinessLogicError (Error). IsValid is false due to BusinessLogicError. ValidationResult=Invalid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        });
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(false);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Invalid);
    });
    test('With 1 Condition evaluating as Match and have a BusinessLogicError (Warning). IsValid is true. ValidationResult=Valid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        config.valueHost.validate();
        expect(config.valueHost.IsValid).toBe(true);
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Valid);
    });
    test('Ensure Required sorts first amongst several Conditions, placing Required last. Demonstrated by stopping when RequiredTextCondition is NoMatch while others return an error', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType2
                }
            },
            {
                ConditionDescriptor: {
                    Type: ConditionType.RequiredText
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setInputValue('');
        let vr = config.valueHost.validate();
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(ConditionType.RequiredText, ValidationSeverity.Severe));
        expect(vr.IssuesFound).toEqual(issuesFound);
    });
    test('Ensure DataTypeCheck sorts first amongst several Conditions, placing DataTypeCheck last. Demonstrated by stopping when DataTypeCheckCondition is NoMatch while others return an error', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType2
                }
            },
            {
                ConditionDescriptor: {
                    Type: ConditionType.DataTypeCheck
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setInputValue('');
        let vr = config.valueHost.validate();
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(ConditionType.DataTypeCheck, ValidationSeverity.Severe));
        expect(vr.IssuesFound).toEqual(issuesFound);
    });
    test('Ensure Required sorts first, DataTypeCheck sorts second amongst several Conditions, placing Required last. Demonstrated by stopping when DataTypeCheckCondition is NoMatch while others return an error', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            },
            {
                ConditionDescriptor: {
                    Type: ConditionType.DataTypeCheck
                }
            }, {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType2
                }
            },
            {
                ConditionDescriptor: {
                    Type: ConditionType.RequiredText
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setInputValue('abc');
        config.valueHost.setValueToUndefined();
        let vr = config.valueHost.validate();
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(ConditionType.DataTypeCheck, ValidationSeverity.Severe));
        expect(vr.IssuesFound).toEqual(issuesFound);
    });
});

class ThrowExceptionInputValidator extends InputValidator {
    public override validate(options?: ValidateOptions): InputValidateResult {
        throw new Error('Always Throws');
    }
}
class TestInputValidatorFactory implements IInputValidatorFactory {
    public create(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor): IInputValidator {
        return new ThrowExceptionInputValidator(valueHost, descriptor);
    }
}
describe('Validate handles exception from custom InputValidator class', () => {

    test('Expect an exception from the custom InputValidator to be logged and cause InputValueHost.Validator result to be Undetermined', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.services.InputValidatorFactory = new TestInputValidatorFactory();
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;
        expect(() => config.valueHost.validate()).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.Undetermined);
        // 2 log entries: Error level exception and Info Level validation result
        expect(logger.entryCount()).toBe(2);
        expect(logger.Captured[0].Level).toBe(LoggingLevel.Error);
        expect(logger.Captured[1].Level).toBe(LoggingLevel.Info);
    });
});

function testValidateFunctionWithPromise(
    validatorDescriptors: Array<Partial<InputValidatorDescriptor>> | null,
    onValidated: ValueHostValidatedHandler,
    onValueHostStateChanged?: ValueHostStateChangedHandler,
    validationGroup?: string | undefined): {
        services: IValidationServices,
        vm: IValidationManager,
        vh: InputValueHost,
        promises: Array<Promise<InputValidateResult>>
    } {
    let vhd1: InputValueHostDescriptor = {
        Id: 'Field1',
        Label: 'Field 1',
        Type: InputValueHostType,
        ValidatorDescriptors: finishPartialInputValidatorDescriptors(validatorDescriptors ?? null)
    };
    let services = new ValidationServices();
    services.ActiveCultureId = 'en';
    services.ConditionFactory = new ConditionFactory();
    services.LoggerService = new MockCapturingLogger();
    registerTestingOnlyConditions(services.ConditionFactory as ConditionFactory);
    services.DataTypeServices = new DataTypeServices();
    services.MessageTokenResolverService = new MessageTokenResolver();
    let vm = new ValidationManager({
        Services: services,
        ValueHostDescriptors: [],
        OnValueHostValidated: onValidated,
        OnValueHostStateChanged: onValueHostStateChanged
    });
    let vh = vm.addValueHost(vhd1, null) as InputValueHost;

    // let setup = SetupInputValueHostForValidate(validatorDescriptors, inputValueState);
    // setup.validationManager.OnValueHostValidated = onValidated;

    let vrDetails: ValidateResult | null = null;
    expect(() => vrDetails = vh.validate({ Group: validationGroup })).not.toThrow();
    expect(vrDetails).not.toBeNull();
    expect(vrDetails!.Pending).not.toBeNull();
    return {
        services: services,
        vm: vm,
        vh: vh,
        promises: vrDetails!.Pending!
    };
}
async function testOnePendingResult(
    pending: Promise<InputValidateResult>,
    expectedInputValidateResult: InputValidateResult) {
    let asyncResult = await pending;

    expect(asyncResult.ConditionEvaluateResult).toBe(expectedInputValidateResult.ConditionEvaluateResult);
}
function validateWithAsyncConditions(
    conditionEvaluateResult: ConditionEvaluateResult,
    // one entry per promise expected, in the order of the promises
    expectedInputValidateResults: Array<InputValidateResult>,
    // one entry per expected OnValueHostValidate, in the order expected
    expectedValidateResults: Array<ValidateResult>,
    done: jest.DoneCallback,
    // place this before the auto generated async condition
    before?: InputValidatorDescriptor | null,
    // place this after the auto generated async condition
    after?: InputValidatorDescriptor | null,
    doneAfterStateChangeCount?: number): void {
    let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [];
    if (before)
        ivDescriptors.push(before);
    ivDescriptors.push({
        ConditionDescriptor: null,
        ConditionCreator: (requester) =>
            new ConditionWithPromiseTester(
                conditionEvaluateResult, 0
            )
    });
    if (after)
        ivDescriptors.push(after);

    let doneTime = false;
    let handlerCount = 0;
    let onValidateHandler: ValueHostValidatedHandler =
        (valueHost: IInputValueHost, validateResult: ValidateResult) => {
            let vm = (valueHost as InputValueHost).ValueHostsManager as IValidationManager;
            let evr = expectedValidateResults[handlerCount];
            expect(validateResult.ValidationResult).toBe(evr.ValidationResult);
            expect(validateResult.IssuesFound).toEqual(evr.IssuesFound);
            if (evr.Pending) {
                expect(validateResult.Pending!.length).toBe(evr.Pending.length);
            }
            else
                expect(validateResult.Pending).toBeUndefined();
            handlerCount++;
            if (doneTime) {
                expect(vm.doNotSaveNativeValue()).toBe(evr.ValidationResult === ValidationResult.Invalid);
                done();
            }
            else
                expect(vm.doNotSaveNativeValue()).toBe(true);
        };
    let stateChangeCounter = 0;
    let onStateChangedHandler: ValueHostStateChangedHandler =
        (valueHost: IValueHost, stateToRetain: ValueHostState) => {
            stateChangeCounter++;
            if (stateChangeCounter === doneAfterStateChangeCount)
                done();
        };

    let setup = testValidateFunctionWithPromise(ivDescriptors, onValidateHandler, onStateChangedHandler);
    expect(setup.promises.length).toBe(expectedInputValidateResults.length);

    for (let i = 0; i < setup.promises.length; i++)
        testOnePendingResult(setup.promises[i], expectedInputValidateResults[i]);
    // we are awaiting a callback to OnValueHostValidated to finish,
    // but only if the expected result is Invalid
    doneTime = true;
    expect(setup.vm.doNotSaveNativeValue()).toBe(true); // because of Async, regardless of ValidationResult
}
describe('Validate with async Conditions', () => {
    test('With 1 Condition that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.Match,
                    IssueFound: null
                }],
                [{
                    ValidationResult: ValidationResult.Valid,
                    IssuesFound: null,
                    Pending: [<any>{}]
                }],
                done, null, null,
                2); // 2 onstatechanged to invoke done()
        },
        1500);  // shortened timeout
    test('With 1 Condition that returns a promise evaluating as NoMatch is ValidatorResult.Invalid, IssuesFound assigned',
        (done) => {
            let issueFound: IssueFound = {
                ConditionType: 'TEST',
                ErrorMessage: 'Local',
                Severity: ValidationSeverity.Error,
                ValueHostId: 'Field1',
                SummaryMessage: 'Summary'
            };

            validateWithAsyncConditions(ConditionEvaluateResult.NoMatch,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    IssueFound: issueFound
                }],
                [{  // onValueHostValidate prior to promise
                    ValidationResult: ValidationResult.Valid,
                    IssuesFound: null,
                    Pending: [<any>{}]
                },
                {   // after promise
                    ValidationResult: ValidationResult.Invalid,
                    IssuesFound: [issueFound]
                }],
                done);
        },
        1500);  // shortened timeout
    test('With 1 Condition that returns a promise evaluating as Undetermined is ValidatorResult.Undetermined, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Undetermined,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                    IssueFound: null
                }],
                [{
                    ValidationResult: ValidationResult.Valid,
                    IssuesFound: null,
                    Pending: [<any>{}]
                }],
                done, null, null,
                2); // onstatechanges to invoke done()
        },
        1500);  // shortened timeout
    test('With 2 Conditions, first is Match, second is async that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.Match,
                    IssueFound: null
                }],
                [{
                    ValidationResult: ValidationResult.Valid,
                    IssuesFound: null,
                    Pending: [<any>{}]
                }],
                done,
                <InputValidatorDescriptor>{
                    ConditionDescriptor: {
                        Type: AlwaysMatchesConditionType
                    },
                    ErrorMessage: 'Always',
                }, null,
                2); // 2 onstatechanges to invoke done()
        },
        1500);  // shortened timeout
    test('With 2 Conditions, second is Match, first is async that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.Match,
                    IssueFound: null
                }],
                [{
                    ValidationResult: ValidationResult.Valid,
                    IssuesFound: null,
                    Pending: [<any>{}]
                }],
                done,
                null,
                <InputValidatorDescriptor>{
                    ConditionDescriptor: {
                        Type: AlwaysMatchesConditionType
                    },
                    ErrorMessage: 'Always',
                },
                2); // 2 onstatechanges to invoke done()
        },
        1500);  // shortened timeout
    test('With 2 Conditions, first is NoMatch, second is async that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null, result is Invalid with 1 issuefound',
        (done) => {
            let issueFound: IssueFound = {
                ConditionType: NeverMatchesConditionType,
                ErrorMessage: 'Never',
                Severity: ValidationSeverity.Error,
                ValueHostId: 'Field1',
                SummaryMessage: 'Summary'
            };
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.Match,
                    IssueFound: null
                }],
                [
                    // Despite the async returning, it doesn't change the result
                    // so there is only one call to OnValueHostValidate
                    {
                        ValidationResult: ValidationResult.Invalid,
                        IssuesFound: [issueFound],
                        Pending: [<any>{}]
                    }],
                done,
                <InputValidatorDescriptor>{
                    ConditionDescriptor: {
                        Type: NeverMatchesConditionType
                    },
                    ErrorMessage: 'Never',
                },
                null,
                2); // to catch the final promise communication which doesn't use OnValidate
        },
        1500);  // shortened timeout
    test('With 2 Conditions, first is NoMatch, second is async that returns a promise evaluating as NoMatch, result is Invalid with 2 issues found',
        (done) => {
            let issueFoundFromNever: IssueFound = {
                ConditionType: NeverMatchesConditionType,
                ErrorMessage: 'Never',
                Severity: ValidationSeverity.Error,
                ValueHostId: 'Field1',
                SummaryMessage: 'Never Summary'
            };
            let issueFoundFromPromise: IssueFound = {
                ConditionType: 'TEST',
                ErrorMessage: 'Local',
                Severity: ValidationSeverity.Error,
                ValueHostId: 'Field1',
                SummaryMessage: 'Summary'
            };
            validateWithAsyncConditions(ConditionEvaluateResult.NoMatch,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    IssueFound: issueFoundFromPromise
                }],
                [
                    {
                        ValidationResult: ValidationResult.Invalid,
                        IssuesFound: [issueFoundFromNever],
                        Pending: [<any>{}]
                    },
                    {
                        ValidationResult: ValidationResult.Invalid,
                        IssuesFound: [issueFoundFromNever, issueFoundFromPromise],
                    }],
                done,
                <InputValidatorDescriptor>{
                    ConditionDescriptor: {
                        Type: NeverMatchesConditionType
                    },
                    ErrorMessage: 'Never',
                    SummaryMessage: 'Never Summary'
                });
        },
        1500);  // shortened timeout

    test('With 2 Conditions, second is NoMatch, first is async that returns a promise evaluating as NoMatch, result is Invalid with 2 issues found',
        (done) => {
            let issueFoundFromNever: IssueFound = {
                ConditionType: NeverMatchesConditionType,
                ErrorMessage: 'Never',
                Severity: ValidationSeverity.Error,
                ValueHostId: 'Field1',
                SummaryMessage: 'Never Summary'
            };
            let issueFoundFromPromise: IssueFound = {
                ConditionType: 'TEST',
                ErrorMessage: 'Local',
                Severity: ValidationSeverity.Error,
                ValueHostId: 'Field1',
                SummaryMessage: 'Summary'
            };
            validateWithAsyncConditions(ConditionEvaluateResult.NoMatch,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    IssueFound: issueFoundFromPromise
                }],
                [
                    {
                        ValidationResult: ValidationResult.Invalid,
                        IssuesFound: [issueFoundFromNever],
                        Pending: [<any>{}]
                    },
                    {
                        ValidationResult: ValidationResult.Invalid,
                        IssuesFound: [issueFoundFromNever, issueFoundFromPromise],
                    }],
                done,
                null, // before not assigned
                <InputValidatorDescriptor>{
                    ConditionDescriptor: {
                        Type: NeverMatchesConditionType
                    },
                    ErrorMessage: 'Never',
                    SummaryMessage: 'Never Summary'
                });
        },
        1500);  // shortened timeout    
    test('With 2 Conditions, both are async and both return a promise of Match. 1 OnValidate call. 2 OnValueHostStateChanges',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    ConditionEvaluateResult: ConditionEvaluateResult.Match,
                    IssueFound: null
                },
                {
                    ConditionEvaluateResult: ConditionEvaluateResult.Match,
                    IssueFound: null
                }],
                [{
                    ValidationResult: ValidationResult.Valid,
                    IssuesFound: null,
                    Pending: [<any>{}, <any>{}]
                }],
                done,
                null,
                <InputValidatorDescriptor>{
                    ConditionDescriptor: null,
                    ConditionCreator: (requester) =>
                        new ConditionWithPromiseTester(
                            ConditionEvaluateResult.Match, 0
                        ),
                    ErrorMessage: 'Second'
                },
                2); // state change count
        },
        1500);  // shortened timeout   

    test('With 1 Condition that whose promise gets rejected doesnt change validation results',
        (done) => {
            let vds: InputValidatorDescriptor = {
                ConditionDescriptor: null,
                ConditionCreator: (requester) =>
                {
                    return <ICondition>{
                        Category: ConditionCategory.Undetermined,
                        ConditionType: 'TEST',
                        evaluate: (valueHost: IValueHost | null,
                            valueHostResolver: IValueHostResolver) => {
                            let promise = new Promise<ConditionEvaluateResult>(
                                (resolve, reject) => {
                                    reject('REJECTED ERROR');
                                }
                            );
                            return promise;
                        }
                    };
                },
                ErrorMessage: 'Error'
            };
            // expect the sync process does nothing and thus doesn't call onValidate,
            // but it does update the state for AsyncProcessing=true
            // Then when the promise completes, it also doesn't call onValidate
            // but it does update the state for AsyncProcessing=false
            let onValidateHandler: ValueHostValidatedHandler =
                (vh, vr) => { 
           //         fail();
                };
            let statecounter = 0;
            let onStateChangedHandler: ValueHostStateChangedHandler =
                (vh, stateToRetain) => {
                    statecounter++;
                    if (statecounter === 2) {
                        let logger = setup.services.LoggerService as MockCapturingLogger;
                        expect(logger.getLatest()).not.toBeNull();
                        expect(logger.getLatest()!.Message).toMatch(/REJECTED ERROR/);
                        done();
                    }
                };
            let setup = testValidateFunctionWithPromise([vds], onValidateHandler, onStateChangedHandler);
            expect(setup.promises.length).toBe(1);

        },
        1500);  // shortened timeout    
});

// ClearValidation(): void
describe('InputValueHost.ClearValidation', () => {
    test('After Validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivDescriptor: InputValidatorDescriptor = {
            ConditionDescriptor: { Type: IsUndeterminedConditionType },
            ErrorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);

        config.valueHost.validate();
        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();

        let stateChanges = config.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<InputValueHostState> = [
            {
                Id: 'Field1',
                ValidationResult: ValidationResult.Undetermined,
                IssuesFound: null,
                Value: undefined,
                InputValue: ''
            },
            {
                Id: 'Field1',
                ValidationResult: ValidationResult.NotAttempted,
                IssuesFound: null,
                Value: undefined,
                InputValue: ''
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);

    });
    test('Without calling Validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivDescriptor: InputValidatorDescriptor = {
            ConditionDescriptor: { Type: IsUndeterminedConditionType },
            ErrorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);

        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();
        let stateChanges = config.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(0);

    });
    test('With prior state reflecting a validation issue, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivDescriptor: InputValidatorDescriptor = {
            ConditionDescriptor: { Type: NeverMatchesConditionType },
            ErrorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid,
            IssuesFound: []
        };
        state.IssuesFound!.push(createIssueFound(NeverMatchesConditionType));

        let config = setupInputValueHostForValidate(ivDescriptors, state);

        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssueFound(NeverMatchesConditionType)).toBeNull();

    });

    test('Without calling Validate but with BusinessLogicError (Error), Ensure the state discards BusinessLogicError after clear', () => {
        let config = setupInputValueHostForValidate([], {});
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        });

        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.ValidationResult).toBe(ValidationResult.NotAttempted);
        let stateChanges = config.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<InputValueHostState> = [
            {
                Id: 'Field1',
                ValidationResult: ValidationResult.NotAttempted,
                IssuesFound: null,
                Value: undefined,
                InputValue: '',
                BusinessLogicErrors: [
                    {
                        ErrorMessage: 'ERROR',
                        Severity: ValidationSeverity.Error
                    }
                ]
            },
            {
                Id: 'Field1',
                ValidationResult: ValidationResult.NotAttempted,
                IssuesFound: null,
                Value: undefined,
                InputValue: ''
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);
    });
});
// doNotSaveNativeValue(): boolean
describe('InputValueHost.doNotSaveNativeValue', () => {
    function tryDoNotSaveNativeValue(initialValidationResult: ValidationResult, hasPendings: boolean, expectedResult: boolean): void {
        let ivDescriptor: InputValidatorDescriptor = {
            ConditionDescriptor: { Type: NeverMatchesConditionType },
            ErrorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {
            Id: 'Field1',
            ValidationResult: initialValidationResult,
            IssuesFound: [],
            AsyncProcessing: hasPendings
        };

        let config = setupInputValueHostForValidate(ivDescriptors, state);

        expect(config.valueHost.doNotSaveNativeValue()).toBe(expectedResult);
    }
    test('ValidationResult = Valid, DoNotSaveNativeValue=false', () => {
        tryDoNotSaveNativeValue(ValidationResult.Valid, false, false);
    });
    test('ValidationResult = Undetermined, DoNotSaveNativeValue=false', () => {
        tryDoNotSaveNativeValue(ValidationResult.Undetermined, false, false);
    });
    test('ValidationResult = Invalid, DoNotSaveNativeValue=true', () => {
        tryDoNotSaveNativeValue(ValidationResult.Invalid, false, true);
    });
    test('ValidationResult = Valid but with async pending, DoNotSaveNativeValue=true', () => {
        tryDoNotSaveNativeValue(ValidationResult.Valid, true, true);
    });
    test('ValidationResult = ValueChangedButUnvalidated, DoNotSaveNativeValue=true', () => {
        tryDoNotSaveNativeValue(ValidationResult.ValueChangedButUnvalidated, false, true);
    });

});

describe('InputValueHost.SetBusinessLogicError', () => {
    test('One call with error adds to the list for the BusinessLogicInputValueHost', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        })).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1); // first changes the value; second changes ValidationResult
        let valueChange = <InputValueHostBaseState>changes[0];
        expect(valueChange.BusinessLogicErrors).toBeDefined();
        expect(valueChange.BusinessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                ErrorMessage: 'ERROR',
                Severity: ValidationSeverity.Error

            });
    });

    test('Two calls with errors (ERROR, WARNING) adds to the list for the BusinessLogicInputValueHost', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        })).not.toThrow();
        expect(() => config.valueHost.setBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        })).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        let valueChange1 = <InputValueHostBaseState>changes[0];
        expect(valueChange1.BusinessLogicErrors).toBeDefined();
        expect(valueChange1.BusinessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                ErrorMessage: 'ERROR',
                Severity: ValidationSeverity.Error
            });
        let valueChange2 = <InputValueHostBaseState>changes[1];
        expect(valueChange2.BusinessLogicErrors).toBeDefined();
        expect(valueChange2.BusinessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                ErrorMessage: 'ERROR',
                Severity: ValidationSeverity.Error
            });
        expect(valueChange2.BusinessLogicErrors![1]).toEqual(
            <BusinessLogicError>{
                ErrorMessage: 'WARNING',
                Severity: ValidationSeverity.Warning
            });
    });
    test('One call with null makes no changes to the state', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError(null!)).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
});
describe('InputValueHost.ClearBusinessLogicErrors', () => {
    test('Call while no existing makes not changes to the state', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.clearBusinessLogicErrors()).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
    test('Set then Clear creates two state entries with state.BusinessLogicErrors undefined by the end', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        })).not.toThrow();
        expect(() => config.valueHost.clearBusinessLogicErrors()).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationResult
        let valueChange1 = <InputValueHostBaseState>changes[0];
        expect(valueChange1.BusinessLogicErrors).toBeDefined();
        expect(valueChange1.BusinessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                ErrorMessage: 'ERROR',
                Severity: ValidationSeverity.Error
            });
        let valueChange2 = <InputValueHostBaseState>changes[1];
        expect(valueChange2.BusinessLogicErrors).toBeUndefined();
    });
});

// GetIssueFound(validatorDescriptor: InputValidatorDescriptor): IssueFound | null
describe('InputValueHost.GetIssueFound', () => {
    test('Without InputValidators is null', () => {
        let config = testValidateFunction(null, null, ValidationResult.Valid, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = config.valueHost.getIssueFound(null!)).not.toThrow();
        expect(issueFound).toBeNull();
    });
    test('With 1 Condition evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = testValidateFunction(ivDescriptors, state, ValidationResult.Valid, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = config.valueHost.getIssueFound(AlwaysMatchesConditionType)).not.toThrow();
        expect(issueFound).toBeNull();
    });
    test('With 1 Condition evaluating as NoMatch is ValidatorResult.Invalid, IssuesFound = 1', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        let config = testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, issuesFound);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = config.valueHost.getIssueFound(NeverMatchesConditionType)).not.toThrow();
        expect(issueFound).not.toBeNull();
        expect(issuesFound.length).toBe(1);
        expect(issueFound).toEqual(issuesFound[0]);
    });
});

// GetIssuesFound(): IssuesFoundDictionary | null
describe('InputValueHosts.GetIssuesFound', () => {
    test('No issues. Return null', () => {
        let config = testValidateFunction(null, null, ValidationResult.Valid, null);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).toBeNull();
    });
    test('1 issue exists. It is returned.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let expectedIssuesFound: Array<IssueFound> = [];
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType));
        let config = testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, expectedIssuesFound);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();
        expect(issuesFound).toEqual(expectedIssuesFound);
    });
    test('2 issues exist. Both are returned in the order of the ValidationDescriptors array.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                ErrorMessage: '1'
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType2
                },
                ErrorMessage: '2'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let expectedIssuesFound: Array<IssueFound> = [];
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Error, '1'));
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType2, ValidationSeverity.Error, '2'));
        let config = testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, expectedIssuesFound);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();
        expect(issuesFound).toEqual(expectedIssuesFound);
    });
});

// GetIssuesForInput(): Array<IssueSnapshot>
describe('InputValueHost.GetIssuesForInput', () => {
    test('Nothing to report returns empty array', () => {
        let config = testValidateFunction(null, null, ValidationResult.Valid, null);
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();
        expect(issuesFound!.length).toBe(0);
    });
    test('2 issues exist. Both are returned in the order of the ValidationDescriptors array.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                ErrorMessage: '1',
                SummaryMessage: 'Summary1',
                Severity: ValidationSeverity.Warning
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType2
                },
                ErrorMessage: '2',
                SummaryMessage: 'Summary2'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let expectedIssuesFound: Array<IssueFound> = [];
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning, '1', 'Summary1'));
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType2, ValidationSeverity.Error, '2', 'Summary2'));
        let config = testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, expectedIssuesFound);
        let issuesToReport: Array<IssueSnapshot> | null = null;
        expect(() => issuesToReport = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesToReport).not.toBeNull();
        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Warning,
                ErrorMessage: '1'
            },
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: '2'
            }
        ];
        expect(issuesToReport).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Error) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: 'ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Severe) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'SEVERE',
            Severity: ValidationSeverity.Severe
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Severe,
                ErrorMessage: 'SEVERE'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Warning) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Warning,
                ErrorMessage: 'WARNING'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('1 Validation error, and has BusinessLogicError (Error) reports 2 entries with BusinessLogicError last', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                ErrorMessage: 'Condition Error',
                SummaryMessage: 'Summary1',
                Severity: ValidationSeverity.Error
            },

        ];
        let config = setupInputValueHostForValidate(ivDescriptors, {});
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'BL_ERROR',
            Severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        config.valueHost.validate();
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: 'Condition Error'
            },
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: 'BL_ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
});

// GetIssuesForSummary(): Array<IssueSnapshot>
describe('InputValueHost.GetIssuesForSummary', () => {
    test('Nothing to report returns empty array', () => {
        let config = testValidateFunction(null, null, ValidationResult.Valid, null);
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();
        expect(issuesFound!.length).toBe(0);
    });
    test('2 issues exist. Both are returned in the order of the ValidationDescriptors array.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                ErrorMessage: '1',
                SummaryMessage: 'Summary1',
                Severity: ValidationSeverity.Warning
            },
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType2
                },
                ErrorMessage: '2',
                SummaryMessage: 'Summary2'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let expectedIssuesFound: Array<IssueFound> = [];
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning, '1', 'Summary1'));
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType2, ValidationSeverity.Error, '2', 'Summary2'));
        let config = testValidateFunction(ivDescriptors, state, ValidationResult.Invalid, expectedIssuesFound);
        let issuesToReport: Array<IssueSnapshot> | null = null;
        expect(() => issuesToReport = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesToReport).not.toBeNull();
        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Warning,
                ErrorMessage: 'Summary1'
            },
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: 'Summary2'
            }
        ];
        expect(issuesToReport).toEqual(expected);
    });

    test('No Validation errors, but has BusinessLogicError (Error) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'ERROR',
            Severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: 'ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Severe) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'SEVERE',
            Severity: ValidationSeverity.Severe
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Severe,
                ErrorMessage: 'SEVERE'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Warning) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'WARNING',
            Severity: ValidationSeverity.Warning
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Warning,
                ErrorMessage: 'WARNING'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('1 Validation error, and has BusinessLogicError (Error) reports 2 entries with BusinessLogicError last', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                },
                ErrorMessage: 'Condition Error',
                SummaryMessage: 'Summary Condition Error',
                Severity: ValidationSeverity.Error
            },

        ];
        let config = setupInputValueHostForValidate(ivDescriptors, {});
        config.valueHost.setBusinessLogicError({
            ErrorMessage: 'BL_ERROR',
            // use the default         Severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        config.valueHost.validate();
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: 'Summary Condition Error'
            },
            {
                Id: 'Field1',
                Severity: ValidationSeverity.Error,
                ErrorMessage: 'BL_ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
});
describe('InputValueHostGenerator members', () => {
    test('CanCreate returns true for InputValueHostType', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate({
            Type: InputValueHostType,
            Id: 'Field1',
            Label: '',
            ValidatorDescriptors: null
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate({
            Type: 'Unexpected',
            Id: 'Field1',
            Label: '',
            ValidatorDescriptors: null
        })).toBe(false);
    });

    test('CanCreate returns true for Type not defined and presence of ValidationDescriptor property (using null as a value)', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            Id: 'Field1',
            Label: '',
            ValidatorDescriptors: null
        })).toBe(true);
    });
    test('CanCreate returns true for Type not defined and presence of ValidationDescriptor property using [] as a value', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            Id: 'Field1',
            Label: '',
            ValidatorDescriptors: []
        })).toBe(true);
    });
    test('CanCreate returns false for Type not defined and lack of ValidationDescriptor property', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            Id: 'Field1',
            Label: ''
        })).toBe(false);
    });

    test('CanCreate returns false for Type=undefined and lack of ValidationDescriptor property', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            Type: undefined,
            Id: 'Field1',
            Label: ''
        })).toBe(false);
    });

    test('Create returns instance of InputValueHost with VM, Descriptor and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: null
        };
        let state: InputValueHostState = {
            Id: 'Field1',
            IssuesFound: null,
            ValidationResult: ValidationResult.NotAttempted,
            Value: undefined,
            InputValue: 'TEST'
        };
        let testItem = new InputValueHostGenerator();
        let vh: IInputValueHost | null = null;
        expect(() => vh = testItem.create(vm, descriptor, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(InputValueHost);
        expect(vh!.getId()).toBe(descriptor.Id);    // check Descriptor value
        expect(vh!.getInputValue()).toBe('TEST');  // check State value
    });
    test('CleanupState existing state has no IssuesFound. Returns the same data', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            IssuesFound: null,
            ValidationResult: ValidationResult.Valid,
            InputValue: 'ABC',
            Value: 10
        };
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: null
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionDescriptor, CleanupState existing state has no IssuesFound but there is a new ValidationDescriptor which has no impact. Returns the same data', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            IssuesFound: null,
            ValidationResult: ValidationResult.Valid,
            InputValue: 'ABC',
            Value: 10
        };
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: <RequiredTextConditionDescriptor>{
                        Type: ConditionType.RequiredText,
                        ValueHostId: null
                    },
                    ErrorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionCreator, CleanupState existing state has no IssuesFound but there is a new ValidationDescriptor which has no impact. Returns the same data', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            IssuesFound: null,
            ValidationResult: ValidationResult.Valid,
            InputValue: 'ABC',
            Value: 10
        };
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionCreator: (requestor) => new RequiredTextCondition({ Type: ConditionType.RequiredText, ValueHostId: 'Field1' }),
                    ConditionDescriptor: null,
                    ErrorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionDescriptor, CleanupState existing state with ValidationResult.Error has an IssuesFound and there is a ValidatorDescriptor. State.IssuesFound unchanged', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound?.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Error,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: <RequiredTextConditionDescriptor>{
                        Type: ConditionType.RequiredText,
                        ValueHostId: 'Field1'
                    },
                    ErrorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionCreator, CleanupState existing state with ValidationResult.Error has an IssuesFound and there is a ValidatorDescriptor. State.IssuesFound unchanged', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound?.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Error,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionCreator: (requestor) => new RequiredTextCondition({ Type: ConditionType.RequiredText, ValueHostId: 'Field1' }),
                    ConditionDescriptor: null,
                    ErrorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionDescriptor, CleanupState existing state has an IssuesFound but no associated ValidationDescriptor. State.IssuesFound is null', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Warning,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: <RangeConditionDescriptor>{
                        Type: ConditionType.Range,   // different type from in State
                        ValueHostId: 'Field1'
                    },
                    ErrorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.IssuesFound = null;
        expect(state).toEqual(expectedState);
    });
    test('Using ConditionCreator, CleanupState existing state has an IssuesFound but no associated ValidationDescriptor. State.IssuesFound is null', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Valid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Warning,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionCreator: (requestor) => new NeverMatchesCondition({ Type: NeverMatchesConditionType }),
                    ConditionDescriptor: null,
                    ErrorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.IssuesFound = null;
        expect(state).toEqual(expectedState);
    });

    test('CleanupState existing state with ValidationResult=Invalid has an IssuesFound but no associated ValidationDescriptor. State.IssuesFound is null and ValidationResult is ValueChangedButUnvalidated', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Error,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: <RangeConditionDescriptor>{
                        Type: ConditionType.Range,   // different type from in State
                        ValueHostId: 'Field1'
                    },
                    ErrorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.IssuesFound = null;
        expectedState.ValidationResult = ValidationResult.ValueChangedButUnvalidated;
        expect(state).toEqual(expectedState);
    });
    test('CleanupState existing state with ValidationResult=Invalid, 2 IssuesFound where one is Warning and the other is removed. State.IssuesFound is the warning and ValidationResult is Valid', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Error,
            SummaryMessage: ''
        });
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: NeverMatchesConditionType,
            ErrorMessage: '',
            Severity: ValidationSeverity.Warning,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: NeverMatchesConditionType
                    },
                    ErrorMessage: ''
                }
                // we've abandoned ConditionType.RequiredText which was Severity=Error
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.IssuesFound!.splice(0, 1);
        expectedState.ValidationResult = ValidationResult.Valid;
        expect(state).toEqual(expectedState);
    });
    test('CleanupState existing state with ValidationResult=Invalid, 3 IssuesFound (Error, Warning, Error) and one Error is removed. State.IssuesFound is the warning and the remaining error and ValidationResult is Invalid', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Error,
            SummaryMessage: ''
        });
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: NeverMatchesConditionType,
            ErrorMessage: '',
            Severity: ValidationSeverity.Warning,
            SummaryMessage: ''
        });
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.Range,
            ErrorMessage: '',
            Severity: ValidationSeverity.Error,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: NeverMatchesConditionType
                    },
                    ErrorMessage: ''
                },
                {
                    ConditionDescriptor: <RangeConditionDescriptor>{
                        Type: ConditionType.Range,
                        ValueHostId: null
                    },
                    ErrorMessage: ''
                }
                // we've abandoned ConditionType.RequiredText which was Severity=Error
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.IssuesFound!.splice(0, 1);
        expectedState.ValidationResult = ValidationResult.Invalid;
        expect(state).toEqual(expectedState);
    });
    test('CleanupState existing state with ValidationResult=Invalid, 3 IssuesFound (Error, Warning, Severe) where Error is removed. State.IssuesFound is Warning, Severe and ValidationResult is Invalid', () => {
        let originalState: InputValueHostState = {
            Id: 'Field1',
            ValidationResult: ValidationResult.Invalid,
            InputValue: 'ABC',
            Value: 10,
            IssuesFound: [],
        };
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.RequiredText,
            ErrorMessage: '',
            Severity: ValidationSeverity.Error,
            SummaryMessage: ''
        });
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: NeverMatchesConditionType,
            ErrorMessage: '',
            Severity: ValidationSeverity.Warning,
            SummaryMessage: ''
        });
        originalState.IssuesFound!.push({
            ValueHostId: 'Field1',
            ConditionType: ConditionType.Range,
            ErrorMessage: '',
            Severity: ValidationSeverity.Severe,
            SummaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: {
                        Type: NeverMatchesConditionType
                    },
                    ErrorMessage: ''
                },
                {
                    ConditionDescriptor: <RangeConditionDescriptor>{
                        Type: ConditionType.Range,
                        ValueHostId: null
                    },
                    ErrorMessage: ''
                }
                // we've abandoned ConditionType.RequiredText which was Severity=Error
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.IssuesFound!.splice(0, 1);
        expectedState.ValidationResult = ValidationResult.Invalid;
        expect(state).toEqual(expectedState);
    });
    test('CreateState returns instance with ID and InitialValue from Descriptor', () => {
        let testItem = new InputValueHostGenerator();
        let descriptor: InputValueHostDescriptor = {
            Id: 'Field1',
            Type: InputValueHostType,
            Label: '',
            InitialValue: 'TEST',
            ValidatorDescriptors: [
                {
                    ConditionDescriptor: <RequiredTextConditionDescriptor>{
                        Type: ConditionType.RequiredText,
                        ValueHostId: 'Field1'
                    },
                    ErrorMessage: '',
                }
            ]
        };
        let state: InputValueHostState | null = null;
        expect(() => state = testItem.createState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.Id).toBe(descriptor.Id);
        expect(state!.ValidationResult).toBe(ValidationResult.NotAttempted);
        expect(state!.InputValue).toBeUndefined();
        expect(state!.Group).toBeUndefined();
        expect(state!.Value).toBe(descriptor.InitialValue);
        expect(state!.IssuesFound).toBeNull();
    });
});
describe('InputValueHost.RequiresInput', () => {
    test('Has a Required condition. RequiresInput returns true', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: ConditionType.RequiredText
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        expect(config.valueHost.RequiresInput).toBe(true);
    });
    test('Lacks a Required condition. RequiresInput returns false', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: ConditionType.DataTypeCheck
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        expect(config.valueHost.RequiresInput).toBe(false);
    });
    test('Has a Required condition but its last amongst several. RequiresInput returns true', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: {
                    Type: NeverMatchesConditionType
                }
            },
            {
                ConditionDescriptor: {
                    Type: ConditionType.DataTypeCheck
                }
            },
            {
                ConditionDescriptor: {
                    Type: ConditionType.RequiredText
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        expect(config.valueHost.RequiresInput).toBe(true);
    });
});
describe('InputValueHost.GatherValueHostIds', () => {
    test('Gets two ValueHostIds', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                ConditionDescriptor: <DataTypeCheckConditionDescriptor>{
                    Type: ConditionType.DataTypeCheck,
                    ValueHostId: 'Property1'
                }
            },
            {
                ConditionDescriptor: <RequiredTextConditionDescriptor>{
                    Type: ConditionType.RequiredText,
                    ValueHostId: 'Property2'
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let collection = new Set<ValueHostId>();
        expect(() => config.valueHost.gatherValueHostIds(collection, config.validationManager)).not.toThrow();
        expect(collection.size).toBe(2);
        expect(collection.has('Property1')).toBe(true);
        expect(collection.has('Property2')).toBe(true);
    });
});

describe('InputValueHost.OtherValueHostChangedNotification and SetValues triggering ValidationManager.NotifyOtherValueHostsOfValueChange to call OtherValuesHostChangedNotification', () => {
    function setupWithThreeValueHosts(): {
        vm: IValidationManager,
        services: ValidationServices,
        field1: IInputValueHost,
        field2: IInputValueHost,
        field3: IInputValueHost
    } {

        let vhDescriptors: Array<InputValueHostDescriptor> = [
            { // Refers to Field2. So validation on Field2 should force this to update
                Type: InputValueHostType,
                Id: 'Field1',
                Label: 'Label1',
                ValidatorDescriptors: [{
                    ConditionDescriptor: <CompareToConditionDescriptor>{
                        Type: ConditionType.EqualTo,
                        SecondValueHostId: 'Field2',
                        ValueHostId: null
                    },
                    ErrorMessage: 'Field1 Error'
                }]
            },
            {
                Type: InputValueHostType,
                Id: 'Field2',
                Label: 'Label2',
                ValidatorDescriptors: [{
                    ConditionDescriptor: <RequiredTextConditionDescriptor>{
                        Type: ConditionType.RequiredText,
                        ValueHostId: null
                    },
                    ErrorMessage: 'Field2 Error'
                }]
            },
            { // Value changes should not notify another
                Type: InputValueHostType,
                Id: 'Field3',
                Label: 'Label3',
                ValidatorDescriptors: [{
                    ConditionDescriptor: <RequiredTextConditionDescriptor>{
                        Type: ConditionType.RequiredText,
                        ValueHostId: null
                    },
                    ErrorMessage: 'Field3 Error'
                }]
            }
        ];
        let services = createValidationServices();
        let vm = new ValidationManager({ Services: services, ValueHostDescriptors: vhDescriptors });   // the real thing so we use real InputValueHosts


        return {
            vm: vm,
            services: services,
            field1: vm.getValueHost('Field1') as IInputValueHost,
            field2: vm.getValueHost('Field2') as IInputValueHost,
            field3: vm.getValueHost('Field3') as IInputValueHost
        };
    }
    test('Property1 never validated. Property2 changed, revalidate = false. ValidationResult should not change.', () => {
        let config = setupWithThreeValueHosts();
        expect(config.field1.ValidationResult).toBe(ValidationResult.NotAttempted);

        expect(() => config.field1.otherValueHostChangedNotification(
            config.field2.getId(), false)).not.toThrow();
        expect(config.field1.ValidationResult).toBe(ValidationResult.NotAttempted);

    });
    test('Property1 previously validated and is Invalid. Property2 changed, revalidate = false. ValidationResult => ValueChangedButUnvalidated.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);

        expect(() => config.field1.otherValueHostChangedNotification(
            config.field2.getId(), false)).not.toThrow();
        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
    });
    test('Property1 previously validated and is Invalid. Property2 changed via SetValue with Validate=false. ValidationResult => ValueChangedButUnvalidated.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);

        // expect(() => config.field1.OtherValueHostChangedNotification(
        //     config.field2.GetId(), false)).not.toThrow();
        config.field2.setValues('ABC', 'ABC');  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
    });
    test('Property1 previously validated and is Invalid. Property2 changed via SetValue with Validate=true. ValidationResult => Valid because fields are now equal.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);

        // expect(() => config.field1.OtherValueHostChangedNotification(
        //     config.field2.GetId(), false)).not.toThrow();
        config.field2.setValues('ABC', 'ABC', { Validate: true });  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.ValidationResult).toBe(ValidationResult.Valid);
    });
    test('Property1 previously validated. Change Property3 with revalidate=false. No change to Property1.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);

        expect(() => config.field1.otherValueHostChangedNotification(
            config.field3.getId(), false)).not.toThrow();
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);
    });
    test('Property1 previously validated. Use SetValues to change Property3 with Validate=false. No change to Property1.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');
        config.field3.setValues('', '');

        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field2.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field3.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);

        config.field1.validate();
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);
        config.field2.validate();
        expect(config.field2.ValidationResult).toBe(ValidationResult.Valid);
        config.field3.validate();
        expect(config.field3.ValidationResult).toBe(ValidationResult.Invalid);
        // expect(() => config.field1.OtherValueHostChangedNotification(
        //     config.field3.GetId(), false)).not.toThrow();
        config.field3.setValues('X', 'X');  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);  // no change
        expect(config.field2.ValidationResult).toBe(ValidationResult.Valid);
        expect(config.field3.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
    });

    test('Property1 previously validated. Use SetValues to change Property3 with Validate=true. No change to Property1.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');
        config.field3.setValues('', '');

        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field2.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field3.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);

        config.field1.validate();
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);
        config.field2.validate();
        expect(config.field2.ValidationResult).toBe(ValidationResult.Valid);
        config.field3.validate();
        expect(config.field3.ValidationResult).toBe(ValidationResult.Invalid);
        // expect(() => config.field1.OtherValueHostChangedNotification(
        //     config.field3.GetId(), false)).not.toThrow();
        config.field3.setValues('X', 'X', { Validate: true });  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.ValidationResult).toBe(ValidationResult.Invalid);  // no change
        expect(config.field2.ValidationResult).toBe(ValidationResult.Valid);
        expect(config.field3.ValidationResult).toBe(ValidationResult.Valid);
    });
    test('Property1 never validated but had been SetValue. Use SetValue to change Property2 with Validate=true. Expect Property1 ValidationResult=Valid because it was ValidationResult=ValueChanged.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');
        expect(config.field1.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field2.ValidationResult).toBe(ValidationResult.ValueChangedButUnvalidated);


        expect(() => config.field1.otherValueHostChangedNotification(
            config.field2.getId(), true)).not.toThrow();
        config.field2.setValues('ABC', 'ABC', { Validate: true });
        expect(config.field1.ValidationResult).toBe(ValidationResult.Valid);

    });
});
describe('ToIInputValueHost function', () => {
    test('Passing actual InputValueHost matches interface returns same object.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new InputValueHost(vm, {
            Id: 'Field1',
            Label: 'Label1',
            ValidatorDescriptors: []
        },
            {
                Id: 'Field1',
                Value: undefined,
                IssuesFound: null,
                ValidationResult: ValidationResult.NotAttempted,
                InputValue: undefined
            });
        expect(toIInputValueHost(testItem)).toBe(testItem);
    });
    class TestIInputValueHostImplementation implements IInputValueHost {
        getInputValue() {
            throw new Error("Method not implemented.");
        }
        setInputValue(value: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        setValues(nativeValue: any, inputValue: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        otherValueHostChangedNotification(valueHostIdThatChanged: string, revalidate: boolean): void {
            throw new Error("Method not implemented.");
        }
        validate(options?: ValidateOptions | undefined): ValidateResult {
            throw new Error("Method not implemented.");
        }
        clearValidation(): void {
            throw new Error("Method not implemented.");
        }
        IsValid: boolean = true;
        ValidationResult: ValidationResult = ValidationResult.NotAttempted;
        setBusinessLogicError(error: BusinessLogicError): void {
            throw new Error("Method not implemented.");
        }
        clearBusinessLogicErrors(): void {
            throw new Error("Method not implemented.");
        }
        doNotSaveNativeValue(): boolean {
            throw new Error("Method not implemented.");
        }
        getIssuesFound(): IssueFound[] | null {
            throw new Error("Method not implemented.");
        }
        getIssuesForInput(): IssueSnapshot[] {
            throw new Error("Method not implemented.");
        }
        getIssuesForSummary(group?: string | undefined): IssueSnapshot[] {
            throw new Error("Method not implemented.");
        }
        getConversionErrorMessage(): string | null {
            throw new Error("Method not implemented.");
        }
        RequiresInput: boolean = false;
        getId(): string {
            throw new Error("Method not implemented.");
        }
        getLabel(): string {
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
        saveIntoState(key: string, value: any): void {
            throw new Error("Method not implemented.");
        }
        getFromState(key: string) {
            throw new Error("Method not implemented.");
        }
        IsChanged: boolean = false;

    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIInputValueHostImplementation();

        expect(toIInputValueHost(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIInputValueHost(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIInputValueHost(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIInputValueHost(100)).toBeNull();
    });
});

describe('ToIInputValueHostCallbacks function', () => {
    test('Passing actual InputValueHost matches interface returns same object.', () => {
        let testItem = new MockValidationManager(new MockValidationServices(false, false));

        expect(toIInputValueHostCallbacks(testItem)).toBe(testItem);
    });
    class TestIInputValueHostCallbacksImplementation implements IInputValueHostCallbacks {
        OnValueChanged(vh: IValueHost, old: any) { }
        OnValueHostStateChanged(vh: IValueHost, state: ValueHostState) { }
        OnInputValueChanged(vh: IInputValueHost, old: any) { }
        OnValueHostValidated(vh: IInputValueHost, validationResult: ValidateResult) { }
    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIInputValueHostCallbacksImplementation();

        expect(toIInputValueHostCallbacks(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIInputValueHostCallbacks(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIInputValueHostCallbacks(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIInputValueHostCallbacks(100)).toBeNull();
    });
});