import {
    CompareToConditionDescriptor, DataTypeCheckConditionDescriptor, RangeConditionDescriptor,
    RequiredTextConditionDescriptor, RequiredTextCondition, RegExpConditionDescriptor, RegExpCondition,
} from "../../src/Conditions/ConcreteConditions";
import { InputValidator } from "../../src/ValueHosts/InputValidator";
import { InputValueHost, InputValueHostGenerator, toIInputValueHost } from "../../src/ValueHosts/InputValueHost";
import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/Logger";
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
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";

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
        id: 'Field' + fieldNumber,
        label: 'Label' + fieldNumber,
        type: ValueHostType.Input,
        dataType: dataType,
        initialValue: initialValue,
        validatorDescriptors: []
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
        conditionDescriptor: condDescriptor,
        errorMessage: 'Local',
        summaryMessage: 'Summary',
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
        id: 'Field' + fieldNumber,
        value: undefined,
        inputValue: undefined,
        issuesFound: null,
        validationResult: ValidationResult.NotAttempted
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
 * id: 'Field1',
 * label: 'Label1',
 * Type: 'Input',
 * DataType: LookupKey.String,
 * InitialValue: 'DATA'
 * validatorDescriptors: []
 * @param partialState - Use the default state by passing null. Otherwise pass
 * a state. Your state will override default values. To avoid overriding,
 * pass the property with a value of undefined.
 * These are the default values
 * id: 'Field1'
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
 * Creates a configuration where you can call validate() and test various results.
 * @param partialValidatorDescriptors - Always provide a list of the validatorDescriptors in the desired order.
 * If null, no validators are made available to validate
 * @param partialInputValueState - Use to supply initial InputValue and Value properties. Any property
 * not supplied will be provided.
 * @returns Configuration that has been setup. Use valueHost to invoke validation functions.
 */
function setupInputValueHostForValidate(
    partialValidatorDescriptors: Array<Partial<InputValidatorDescriptor>> | null,
    partialInputValueState: Partial<InputValueHostState> | null,
    vhGroup? : string | null): ITestSetupConfig {

    let inputValueDescriptor: Partial<InputValueHostDescriptor> = {
        validatorDescriptors: partialValidatorDescriptors ?
            finishPartialInputValidatorDescriptors(partialValidatorDescriptors) :
            undefined
    };
    if (vhGroup !== undefined)
        inputValueDescriptor.group = vhGroup;

    let updatedState = finishPartialInputValueHostState(
        { ...{ inputValue: '' }, ...partialInputValueState });

    return setupInputValueHost(inputValueDescriptor, updatedState);
}

describe('constructor and resulting property values', () => {

    test('constructor with valid parameters created and sets up Services, Descriptor, and State', () => {
        let config = setupInputValueHost({});
        let testItem = config.valueHost;
        expect(testItem.valueHostsManager).toBe(config.validationManager);

        expect(testItem.getId()).toBe('Field1');
        expect(testItem.getLabel()).toBe('Label1');
        expect(testItem.getDataType()).toBe(LookupKey.String);
        expect(testItem.getValue()).toBeUndefined();
        expect(testItem.isChanged).toBe(false);
        expect(testItem.requiresInput).toBe(false);
        expect(testItem.getConversionErrorMessage()).toBeNull();
        expect(testItem.isValid).toBe(true);
    });
    test('constructor with Descriptor.labell10n setup. GetLabel results in localized lookup', () => {
        let config = setupInputValueHost({
            labell10n: 'Label1-key'
        });
        let tls = config.services.textLocalizerService as TextLocalizerService;
        tls.register('Label1-key', {
            '*': '*-Label1'
        });
        let testItem = config.valueHost;

        expect(testItem.getLabel()).toBe('*-Label1');

    });
});
describe('InputValueHost.getValue', () => {
    test('Set State.Value to undefined; getValue is undefined', () => {
        let config = setupInputValueHost(null, {
            value: undefined
        });
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getValue()).not.toThrow();
        expect(value).toBeUndefined();
    });
    test('Set State.Value to null; getValue is null', () => {
        let config = setupInputValueHost(null, {
            value: null
        });
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getValue()).not.toThrow();
        expect(value).toBeNull();
    });
    test('Set State.Value to 10; getValue is 10', () => {
        let config = setupInputValueHost(null, {
            value: 0
        });
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getValue()).not.toThrow();
        expect(value).toBe(0);
    });

});

describe('InputValueHost.setValue with getValue to check result and IsChanged property', () => {
    test('Value of 10, options is undefined. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10)).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.isChanged).toBe(true);
    });
    test('Value of 10, options is empty object. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, {})).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.isChanged).toBe(true);
    });
    test('Value of 10, options is null. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, null!)).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.isChanged).toBe(true);
    });
    test('Value of 10, options is { validate: false }. Sets value to 10 and does not validate', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { validate: false })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.isChanged).toBe(true);
    });
    test('Value of 10, options is { validate: true }. Sets value to 10 and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.isChanged).toBe(true);
    });
    test('Before calling, validate for ValidationResult=Undetermined. Set value to 10 with options { ClearValidate: true }. Expect value to be 20,. IsChanged = false, and ValidationResult to NotAttempted', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        config.valueHost.validate();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
        expect(() => config.valueHost.setValue(10, { reset: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.isChanged).toBe(false);
    });
    test('Set Value to 10, with options is { validate: true } then sets value to 20 with no options. Expect ValidationResult to ValueChangedButUnvalidated', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
        expect(() => config.valueHost.setValue(20)).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
    });
    test('State has Value=10 before calling setValue with 10. No changes. ValidationResult stays NotAttempted, IsChanged stays false', () => {
        let config = setupInputValueHost(null, {
            value: 10
        });

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10)).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.isChanged).toBe(false);
    });
    test('State has Value=10 before calling setValue with 10 and with Validation option set. No changes, not validation occurs, IsChanged stays false. ValidationResult stays NotAttempted', () => {
        let config = setupInputValueHost(null, {
            value: 10
        });

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.isChanged).toBe(false);
        expect(config.valueHost.getValue()).toBe(10);
    });
    test('Value of 10, options is { validate: true }. Sets value to 10 and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(() => config.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
    });
    test('ConversionErrorTokenValue supplied and is saved because value is undefined.', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(undefined, { conversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBe('ERROR');
    });
    test('ConversionErrorTokenValue supplied but is not saved because value is defined', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(10, { conversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue supplied in one call which saves it but a follow up call without it abandons it', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(undefined, { conversionErrorTokenValue: 'ERROR' })).not.toThrow();
        config.valueHost.setValue(10, { conversionErrorTokenValue: 'ERROR' });
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('Use both ConversionErrorTokenValue and Reset options will setup the error message and IsChanged is false', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValue(undefined, { conversionErrorTokenValue: 'ERROR', reset: true })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.isChanged).toBe(false);
    });
    test('Value was changed. OnValueChanged called.', () => {
        const initialValue = 100;
        const secondValue = 150;
        const finalValue = 200;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedValues: Array<{ newValue: any, oldValue: any }> = [];
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
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
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
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
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        expect(() => testItem.setValue(secondValue, { skipValueChangedCallback: true })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { skipValueChangedCallback: true })).not.toThrow();

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
        config.validationManager.onValueChanged = (valueHost, oldValue) => {
            changedValues.push({
                newValue: valueHost.getValue(),
                oldValue: oldValue
            });
        };

        expect(() => testItem.setValue(secondValue, { skipValueChangedCallback: false })).not.toThrow();
        expect(() => testItem.setValue(finalValue, { skipValueChangedCallback: false })).not.toThrow();

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
        config.validationManager.onValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain as InputValueHostState);
        };

        expect(() => testItem.setValue(secondValue)).not.toThrow();
        expect(() => testItem.setValue(finalValue)).not.toThrow();

        expect(changedState.length).toBe(2);
        expect(changedState[0].value).toBe(secondValue);
        expect(changedState[1].value).toBe(finalValue);
    });

    test('Value was not changed. OnValueHostStateChanged is not called.', () => {
        const initialValue = 100;

        let config = setupInputValueHost();
        let testItem = config.valueHost;
        testItem.setValue(initialValue);
        let changedState: Array<InputValueHostState> = [];
        config.validationManager.onValueHostStateChanged = (valueHost, stateToRetain) => {
            changedState.push(stateToRetain as InputValueHostState);
        };

        expect(() => testItem.setValue(initialValue)).not.toThrow();
        expect(() => testItem.setValue(initialValue)).not.toThrow();

        expect(changedState.length).toBe(0);
    });
});
describe('InputValueHost.getInputValue', () => {
    test('Set State.InputValue to undefined; getInputValue is undefined', () => {
        let config = setupInputValueHost(null, {
            inputValue: undefined
        });
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getInputValue()).not.toThrow();
        expect(value).toBeUndefined();
    });
    test('Set State.InputValue to null; getInputValue is null', () => {
        let config = setupInputValueHost(null, {
            inputValue: null
        });
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getInputValue()).not.toThrow();
        expect(value).toBeNull();
    });
    test('Set State.InputValue to "abc"; getInputValue is "abc"', () => {
        let config = setupInputValueHost(null, {
            inputValue: 'abc'
        });
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        let value: any = null;
        expect(() => value = config.valueHost.getInputValue()).not.toThrow();
        expect(value).toBe('abc');
    });

});

describe('InputValueHost.setInputValue with getInputValue to check result', () => {
    test('Value of "ABC", options is undefined. Sets value to "ABC" and does not validate. IsChanged is true', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC")).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
    });
    test('Value of "ABC", options is empty object. Sets value to "ABC" and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", {})).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
    });
    test('Value of "ABC", options is null. Sets value to "ABC" and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", null!)).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
    });
    test('Value of "ABC", options is { validate: false }. Sets value to "ABC" and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", { validate: false })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("ABC");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
    });
    test('Value of "ABC", options is { validate: true }. Sets value to "ABC" and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", { validate: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getInputValue()).toBe("ABC");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationResult
        let valueChange = <InputValueHostState>changes[0];
        expect(valueChange.inputValue).toBe("ABC");
        let vrChange = <InputValueHostState>changes[1];
        expect(vrChange.validationResult).toBe(ValidationResult.Valid);
        expect(vrChange.changeCounter).toBe(1);
    });
    test('Before calling, validate for ValidationResult=Undetermined. Set value to 10 with options { Reset: true }. Expect value to be 20, IsChanged = false, and ValidationResult to NotAttempted', () => {
        let config = setupInputValueHost();

        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        config.valueHost.validate();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
        expect(() => config.valueHost.setInputValue('ABC', { reset: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssuesFound()).toBeNull();
        expect(config.valueHost.isChanged).toBe(false);
    });
    test('ConversionErrorTokenValue supplied and is ignored because we are not setting native value here', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setInputValue("ABC", { conversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue supplied in previous setValue, but is abandoned by SetWidetValue because we are not setting native value here', () => {
        let config = setupInputValueHost();

        config.valueHost.setValueToUndefined({ conversionErrorTokenValue: 'ERROR' });

        expect(() => config.valueHost.setInputValue("ABC", { conversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
});

describe('InputValueHost.setValues with getInputValue and getValue to check result', () => {
    test('InputValue of "10", Value of 10, options is undefined. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10")).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).value).toBe(10);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('InputValue of "10", Value of 10, options is empty object. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", {})).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).value).toBe(10);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
    });
    test('InputValue of "10", Value of 10, options is null. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", null!)).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).value).toBe(10);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
    });
    test('InputValue of "10", Value of 10, options is { validate: false }. Sets both values, IsChanged = true, and does not validate', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", { validate: false })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);
        expect((<InputValueHostState>changes[0]).value).toBe(10);
        expect((<InputValueHostState>changes[0]).inputValue).toBe("10");
        expect((<InputValueHostState>changes[0]).changeCounter).toBe(1);
    });
    test('InputValue of "10", Value of 10, options is { validate: true }. Sets both values, IsChanged = true, and validate (no InputValidators to cause Invalid, so result is Valid)', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", { validate: true })).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
        expect(config.valueHost.isChanged).toBe(true);
        expect(config.valueHost.getValue()).toBe(10);
        expect(config.valueHost.getInputValue()).toBe("10");
        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationResult
        let valueChange = <InputValueHostState>changes[0];
        expect(valueChange.value).toBe(10);
        expect(valueChange.inputValue).toBe("10");
        let vrChange = <InputValueHostState>changes[1];
        expect(vrChange.validationResult).toBe(ValidationResult.Valid);
        expect(vrChange.changeCounter).toBe(1);
    });

    test('ConversionErrorTokenValue supplied and is saved because native value is undefined', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(undefined, "ABC", { conversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBe('ERROR');
        expect(config.valueHost.isChanged).toBe(true);
    });
    test('ConversionErrorTokenValue supplied but is not saved because native value is defined', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(10, "10", { conversionErrorTokenValue: 'ERROR' })).not.toThrow();
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue supplied in one call which saves it but a follow up call without it abandons it', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(undefined, { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        config.valueHost.setValues(10, "10", { conversionErrorTokenValue: 'ERROR' });
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
    });
    test('ConversionErrorTokenValue and Reset supplied on second call. errorMessage is null and IsChanged is false.', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setValues(undefined, { ConversionErrorTokenValue: 'ERROR' })).not.toThrow();
        config.valueHost.setValues(10, "10", { conversionErrorTokenValue: 'ERROR', reset: true });
        expect(config.valueHost.getConversionErrorMessage()).toBeNull();
        expect(config.valueHost.isChanged).toBe(false);
    });
});

/**
 * For testing InputValueHost.validate (but not the logic of an individual InputValidator.validate).
 * @param validatorDescriptors - Always provide a list of the validatorDescriptors in the desired order.
 * If null, no validators are made available to validate
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
    expect(() => vrDetails = config.valueHost.validate({ group: validationGroupForValidateFn })).not.toThrow();
    expect(vrDetails).not.toBeNull();
    expect(vrDetails!.validationResult).toBe(expectedValidationResult);
    expect(vrDetails!.issuesFound).toEqual(expectedIssuesFound);
    expect(vrDetails!.pending).toBeUndefined();

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
        valueHostId: 'Field1',
        conditionType: conditionType,
        severity: severity,
        errorMessage: errorMessage,
        summaryMessage: summaryMessage
    };
}
describe('InputValueHost.validate', () => {
    //NOTE: InputValidator tests already handle testing InputValidator property of Enabled, Enabler,
    // and validate's Group parameter. When those skip the condition, we expect a ConditionEvaluationResult of Undetermined
    // which is evaluated in these tests.
    test('Without InputValidators is ValidationResult.Valid', () => {
        testValidateFunction(null, null, ValidationResult.Valid, null);
    });
    test('With 1 Condition evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, null);
    });
    test('With 1 Condition evaluating as NoMatch is ValidatorResult.Invalid, IssuesFound = 1', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
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
                conditionDescriptor: {
                    type: IsUndeterminedConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Undetermined, null);
    });
    test('With 2 Conditions evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                },
                errorMessage: '1'
            },
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                },
                errorMessage: '2'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, null);
    });
    test('With 2 Conditions (Required, RangeCondition) evaluating as Undetermined is ValidatorResult.Undetermined, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: IsUndeterminedConditionType
                }
            },
            {
                conditionDescriptor: {
                    type: IsUndeterminedConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Undetermined, null);
    });
    test('With Validator of Severe evaluating as NoMatch, second Condition is skipped even though it would be NoMatch, IssuesFound = 1', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Severe
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                errorMessage: '2'
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
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                },
                severity: ValidationSeverity.Severe
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
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
                conditionDescriptor:
                {
                    type: IsUndeterminedConditionType
                },
                severity: ValidationSeverity.Severe
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Warning,
                errorMessage: '1'
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                errorMessage: '2'
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
                conditionDescriptor: {
                    type: IsUndeterminedConditionType
                },
                severity: ValidationSeverity.Warning
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
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
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                },
                severity: ValidationSeverity.Warning
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Warning
            },
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Warning
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                enabled: false
            }
        ];
        let state: Partial<InputValueHostState> = {};
        testValidateFunction(ivDescriptors, state, ValidationResult.Valid, null);

    });
    function testGroups(valueHostGroup: string, validateGroup: string, expectedResult: ValidationResult, expectedStateChanges: number = 1): void
    {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let issueFound: IssueFound | null = null;
        if (expectedResult === ValidationResult.Invalid)
            issueFound = {
                conditionType: NeverMatchesConditionType,
                errorMessage: 'Local',
                summaryMessage: 'Summary',
                severity: ValidationSeverity.Error,
                valueHostId: 'Field1'
            };
        testValidateFunction(ivDescriptors, state, expectedResult, issueFound ? [issueFound] : null, valueHostGroup, validateGroup, expectedStateChanges);
    }

    test('Group test. InputValueHost has Group name but validate has empty string for group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', '', ValidationResult.Invalid);
    });
    test('Group test. InputValueHost has Group name but validate has * for group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', '*', ValidationResult.Invalid);
    });    
    test('Group test. InputValueHost has Group name and validate has same group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', 'GROUPA', ValidationResult.Invalid);
    });

    test('Group test. InputValueHost has Group name and validate has same group name but case mismatch. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', 'groupa', ValidationResult.Invalid);
    });
    test('Group test. InputValueHost has Group name but validate has a different group name. Validation skipped and result is Valid', () => {
        testGroups('GROUPA', 'GROUPB', ValidationResult.Undetermined, 0);
    });

    test('validate one ValueHost with validators that results in Valid. OnValueHostValidated called.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let results: Array<ValidateResult> = [];
        config.validationManager.onValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].validationResult).toBe(ValidationResult.Valid);
    });
    test('validate one ValueHost with validators that results in Invalid. OnValueHostValidated called.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let results: Array<ValidateResult> = [];
        config.validationManager.onValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].validationResult).toBe(ValidationResult.Invalid);
    });
});
describe('InputValueHost.validate uses autogenerated DataTypeCheck condition', () => {
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
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;
        config.services.dataTypeServices.autoGenerateDataTypeConditionEnabled = true;
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.onValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues(undefined, 'ABC');   // will violate DataTypeCheckCondition
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].validationResult).toBe(ValidationResult.Invalid);
        expect(results[0].issuesFound![0].conditionType).toBe(ConditionType.DataTypeCheck);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, LoggingCategory.Configuration, 'InputValidator')).not.toBeNull();
    });
    test('1 condition exists and it is not a DataTypeCheck category. DataTypeCheckCondition gets added', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;
        config.services.dataTypeServices.autoGenerateDataTypeConditionEnabled = true;
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.onValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues(undefined, 'ABC');   // will violate DataTypeCheckCondition
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].validationResult).toBe(ValidationResult.Invalid);
        expect(results[0].issuesFound![0].conditionType).toBe(ConditionType.DataTypeCheck);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, LoggingCategory.Configuration, 'InputValidator')).not.toBeNull();
    });    
    test('1 condition and it is an actual DataTypeCheckCondition. No DataTypeCheckCondition gets added.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: ConditionType.DataTypeCheck
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;
        config.services.dataTypeServices.autoGenerateDataTypeConditionEnabled = true;
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.onValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues(undefined, 'ABC');   // will violate DataTypeCheckCondition
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].validationResult).toBe(ValidationResult.Invalid);
        expect(results[0].issuesFound![0].conditionType).toBe(ConditionType.DataTypeCheck);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, LoggingCategory.Configuration, 'InputValidator')).toBeNull(); // proves not auto generated
    });        

    test('1 condition and it has ConditionCategory=DataTypeCheck. No DataTypeCheckCondition gets added.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: <RegExpConditionDescriptor> {
                    type: ConditionType.RegExp,
                    expressionAsString: '^A$', // will match only "A" and we will supply "ABC"
                    category: ConditionCategory.DataTypeCheck
                },
                errorMessage: 'Regexp error'
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;
        config.services.dataTypeServices.autoGenerateDataTypeConditionEnabled = true;
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null, {
            '*': 'Error Found'
        });

        let results: Array<ValidateResult> = [];
        config.validationManager.onValueHostValidated = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        config.valueHost.setValues('ABC', 'ABC');   // will violate the regexp
        config.valueHost.validate();
        expect(results.length).toBe(1);
        expect(results[0].validationResult).toBe(ValidationResult.Invalid);
        expect(results[0].issuesFound![0].conditionType).toBe(ConditionType.RegExp);

        expect(logger.findMessage('Condition for Data Type Check', LoggingLevel.Info, LoggingCategory.Configuration, 'InputValidator')).toBeNull(); // proves not auto generated
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
                    type: phoneNumberConditionType,
                    expression: /^\d\d\d \d\d\d\-\d{4}$/, // ### ###-####
                    valueHostId: null
               });
            }

        }
        let services = new MockValidationServices(true, true);
        let logger = services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;
        services.dataTypeServices.autoGenerateDataTypeConditionEnabled = true;
        (services.dataTypeServices as DataTypeServices).
            registerDataTypeCheckGenerator(new PhoneNumberDataTypeCheckGenerator());
        
        (services.textLocalizerService as TextLocalizerService).
            registerErrorMessage(phoneNumberConditionType, null,
            {
                '*': 'Error Found'
            });

        let descriptors: Array<ValueHostDescriptor> = [
            <InputValueHostDescriptor>{
                type: ValueHostType.Input,
                id: 'Field1',
                dataType: phoneNumberLookupKey,
                validatorDescriptors: []
            }
        ];
        let results: Array<ValidateResult> = [];
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostDescriptors: descriptors,
            onValueHostValidated: (valueHost, validateResult) => {
                results.push(validateResult);
            }
        };
        let vm = new ValidationManager(vmConfig);
        let vh = vm.getValueHost('Field1') as InputValueHost;

        vh.setValues('ABC', 'ABC');   // will violate the regexp
        vh.validate();
        expect(results.length).toBe(1);
        expect(results[0].validationResult).toBe(ValidationResult.Invalid);
        expect(results[0].issuesFound![0].conditionType).toBe(phoneNumberConditionType);

        expect(logger.findMessage('PhoneNumber Condition for Data Type Check', LoggingLevel.Info, LoggingCategory.Configuration, 'InputValidator')).not.toBeNull();
    });

});

describe('InputValueHost.isValid and ValidationResult', () => {

    test('Without InputValidators is true, ValidationResult = Valid', () => {
        let config = setupInputValueHostForValidate(null, null);
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(true);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
    });
    test('With 1 Condition evaluating as Match. isValid is true, ValidationResult=Valid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(true);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
    });
    test('With 1 Condition evaluating as NoMatch. isValid is false. ValidationResult=Invalid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(false);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Invalid);
    });
    test('Without InputValidators but have a BusinessLogicError (Error), isValid=false, ValidationResult = Invalid', () => {
        let config = setupInputValueHostForValidate(null, null);
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
        });
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(false);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Invalid);
    });
    test('Without InputValidators but have a BusinessLogicError (Warning), isValid=true, ValidationResult = Valid', () => {
        let config = setupInputValueHostForValidate(null, null);
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(true);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
    });
    test('With 1 Condition evaluating as NoMatch and have a BusinessLogicError (Warning). isValid is false due to NoMatch. ValidationResult=Invalid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(false);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Invalid);
    });
    test('With 1 Condition evaluating as Match and have a BusinessLogicError (Error). isValid is false due to BusinessLogicError. ValidationResult=Invalid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(false);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Invalid);
    });
    test('With 1 Condition evaluating as Match and have a BusinessLogicError (Warning). isValid is true. ValidationResult=Valid', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        config.valueHost.validate();
        expect(config.valueHost.isValid).toBe(true);
        expect(config.valueHost.validationResult).toBe(ValidationResult.Valid);
    });
    test('Ensure Required sorts first amongst several Conditions, placing Required last. Demonstrated by stopping when RequiredTextCondition is NoMatch while others return an error', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                }
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType2
                }
            },
            {
                conditionDescriptor: {
                    type: ConditionType.RequiredText
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.valueHost.setValue('');
        let vr = config.valueHost.validate();
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(ConditionType.RequiredText, ValidationSeverity.Severe));
        expect(vr.issuesFound).toEqual(issuesFound);
    });
    test('Ensure DataTypeCheck sorts first amongst several Conditions, placing DataTypeCheck last. Demonstrated by stopping when DataTypeCheckCondition is NoMatch while others return an error', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                }
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType2
                }
            },
            {
                conditionDescriptor: {
                    type: ConditionType.DataTypeCheck
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
        expect(vr.issuesFound).toEqual(issuesFound);
    });
    test('Ensure Required sorts first, DataTypeCheck sorts second amongst several Conditions, placing Required last. Demonstrated by stopping when DataTypeCheckCondition is NoMatch while others return an error', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                }
            },
            {
                conditionDescriptor: {
                    type: ConditionType.DataTypeCheck
                }
            }, {
                conditionDescriptor: {
                    type: NeverMatchesConditionType2
                }
            },
            {
                conditionDescriptor: {
                    type: ConditionType.RequiredText
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
        expect(vr.issuesFound).toEqual(issuesFound);
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
describe('validate handles exception from custom InputValidator class', () => {

    test('Expect an exception from the custom InputValidator to be logged and cause InputValueHost.Validator result to be Undetermined', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        config.services.inputValidatorFactory = new TestInputValidatorFactory();
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;
        expect(() => config.valueHost.validate()).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.Undetermined);
        // 2 log entries: Error level exception and Info Level validation result
        expect(logger.entryCount()).toBe(2);
        expect(logger.captured[0].level).toBe(LoggingLevel.Error);
        expect(logger.captured[1].level).toBe(LoggingLevel.Info);
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
        id: 'Field1',
        label: 'Field 1',
        type: ValueHostType.Input,
        validatorDescriptors: finishPartialInputValidatorDescriptors(validatorDescriptors ?? null)
    };
    let services = new ValidationServices();
    services.activeCultureId = 'en';
    services.conditionFactory = new ConditionFactory();
    services.loggerService = new MockCapturingLogger();
    registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
    services.dataTypeServices = new DataTypeServices();
    services.messageTokenResolverService = new MessageTokenResolver();
    let vm = new ValidationManager({
        services: services,
        valueHostDescriptors: [],
        onValueHostValidated: onValidated,
        onValueHostStateChanged: onValueHostStateChanged
    });
    let vh = vm.addValueHost(vhd1, null) as InputValueHost;

    // let setup = SetupInputValueHostForValidate(validatorDescriptors, inputValueState);
    // setup.validationManager.OnValueHostValidated = onValidated;

    let vrDetails: ValidateResult | null = null;
    expect(() => vrDetails = vh.validate({ group: validationGroup })).not.toThrow();
    expect(vrDetails).not.toBeNull();
    expect(vrDetails!.pending).not.toBeNull();
    return {
        services: services,
        vm: vm,
        vh: vh,
        promises: vrDetails!.pending!
    };
}
async function testOnePendingResult(
    pending: Promise<InputValidateResult>,
    expectedInputValidateResult: InputValidateResult) {
    let asyncResult = await pending;

    expect(asyncResult.conditionEvaluateResult).toBe(expectedInputValidateResult.conditionEvaluateResult);
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
        conditionDescriptor: null,
        conditionCreator: (requester) =>
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
            let vm = (valueHost as InputValueHost).valueHostsManager as IValidationManager;
            let evr = expectedValidateResults[handlerCount];
            expect(validateResult.validationResult).toBe(evr.validationResult);
            expect(validateResult.issuesFound).toEqual(evr.issuesFound);
            if (evr.pending) {
                expect(validateResult.pending!.length).toBe(evr.pending.length);
            }
            else
                expect(validateResult.pending).toBeUndefined();
            handlerCount++;
            if (doneTime) {
                expect(vm.doNotSaveNativeValue()).toBe(evr.validationResult === ValidationResult.Invalid);
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
describe('validate with async Conditions', () => {
    test('With 1 Condition that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.Match,
                    issueFound: null
                }],
                [{
                    validationResult: ValidationResult.Valid,
                    issuesFound: null,
                    pending: [<any>{}]
                }],
                done, null, null,
                2); // 2 onstatechanged to invoke done()
        },
        1500);  // shortened timeout
    test('With 1 Condition that returns a promise evaluating as NoMatch is ValidatorResult.Invalid, IssuesFound assigned',
        (done) => {
            let issueFound: IssueFound = {
                conditionType: 'TEST',
                errorMessage: 'Local',
                severity: ValidationSeverity.Error,
                valueHostId: 'Field1',
                summaryMessage: 'Summary'
            };

            validateWithAsyncConditions(ConditionEvaluateResult.NoMatch,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    issueFound: issueFound
                }],
                [{  // onValueHostValidate prior to promise
                    validationResult: ValidationResult.Valid,
                    issuesFound: null,
                    pending: [<any>{}]
                },
                {   // after promise
                    validationResult: ValidationResult.Invalid,
                    issuesFound: [issueFound]
                }],
                done);
        },
        1500);  // shortened timeout
    test('With 1 Condition that returns a promise evaluating as Undetermined is ValidatorResult.Undetermined, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Undetermined,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                    issueFound: null
                }],
                [{
                    validationResult: ValidationResult.Valid,
                    issuesFound: null,
                    pending: [<any>{}]
                }],
                done, null, null,
                2); // onstatechanges to invoke done()
        },
        1500);  // shortened timeout
    test('With 2 Conditions, first is Match, second is async that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.Match,
                    issueFound: null
                }],
                [{
                    validationResult: ValidationResult.Valid,
                    issuesFound: null,
                    pending: [<any>{}]
                }],
                done,
                <InputValidatorDescriptor>{
                    conditionDescriptor: {
                        type: AlwaysMatchesConditionType
                    },
                    errorMessage: 'Always',
                }, null,
                2); // 2 onstatechanges to invoke done()
        },
        1500);  // shortened timeout
    test('With 2 Conditions, second is Match, first is async that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.Match,
                    issueFound: null
                }],
                [{
                    validationResult: ValidationResult.Valid,
                    issuesFound: null,
                    pending: [<any>{}]
                }],
                done,
                null,
                <InputValidatorDescriptor>{
                    conditionDescriptor: {
                        type: AlwaysMatchesConditionType
                    },
                    errorMessage: 'Always',
                },
                2); // 2 onstatechanges to invoke done()
        },
        1500);  // shortened timeout
    test('With 2 Conditions, first is NoMatch, second is async that returns a promise evaluating as Match is ValidatorResult.Valid, IssuesFound = null, result is Invalid with 1 issuefound',
        (done) => {
            let issueFound: IssueFound = {
                conditionType: NeverMatchesConditionType,
                errorMessage: 'Never',
                severity: ValidationSeverity.Error,
                valueHostId: 'Field1',
                summaryMessage: 'Summary'
            };
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.Match,
                    issueFound: null
                }],
                [
                    // Despite the async returning, it doesn't change the result
                    // so there is only one call to OnValueHostValidate
                    {
                        validationResult: ValidationResult.Invalid,
                        issuesFound: [issueFound],
                        pending: [<any>{}]
                    }],
                done,
                <InputValidatorDescriptor>{
                    conditionDescriptor: {
                        type: NeverMatchesConditionType
                    },
                    errorMessage: 'Never',
                },
                null,
                2); // to catch the final promise communication which doesn't use OnValidate
        },
        1500);  // shortened timeout
    test('With 2 Conditions, first is NoMatch, second is async that returns a promise evaluating as NoMatch, result is Invalid with 2 issues found',
        (done) => {
            let issueFoundFromNever: IssueFound = {
                conditionType: NeverMatchesConditionType,
                errorMessage: 'Never',
                severity: ValidationSeverity.Error,
                valueHostId: 'Field1',
                summaryMessage: 'Never Summary'
            };
            let issueFoundFromPromise: IssueFound = {
                conditionType: 'TEST',
                errorMessage: 'Local',
                severity: ValidationSeverity.Error,
                valueHostId: 'Field1',
                summaryMessage: 'Summary'
            };
            validateWithAsyncConditions(ConditionEvaluateResult.NoMatch,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    issueFound: issueFoundFromPromise
                }],
                [
                    {
                        validationResult: ValidationResult.Invalid,
                        issuesFound: [issueFoundFromNever],
                        pending: [<any>{}]
                    },
                    {
                        validationResult: ValidationResult.Invalid,
                        issuesFound: [issueFoundFromNever, issueFoundFromPromise],
                    }],
                done,
                <InputValidatorDescriptor>{
                    conditionDescriptor: {
                        type: NeverMatchesConditionType
                    },
                    errorMessage: 'Never',
                    summaryMessage: 'Never Summary'
                });
        },
        1500);  // shortened timeout

    test('With 2 Conditions, second is NoMatch, first is async that returns a promise evaluating as NoMatch, result is Invalid with 2 issues found',
        (done) => {
            let issueFoundFromNever: IssueFound = {
                conditionType: NeverMatchesConditionType,
                errorMessage: 'Never',
                severity: ValidationSeverity.Error,
                valueHostId: 'Field1',
                summaryMessage: 'Never Summary'
            };
            let issueFoundFromPromise: IssueFound = {
                conditionType: 'TEST',
                errorMessage: 'Local',
                severity: ValidationSeverity.Error,
                valueHostId: 'Field1',
                summaryMessage: 'Summary'
            };
            validateWithAsyncConditions(ConditionEvaluateResult.NoMatch,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    issueFound: issueFoundFromPromise
                }],
                [
                    {
                        validationResult: ValidationResult.Invalid,
                        issuesFound: [issueFoundFromNever],
                        pending: [<any>{}]
                    },
                    {
                        validationResult: ValidationResult.Invalid,
                        issuesFound: [issueFoundFromNever, issueFoundFromPromise],
                    }],
                done,
                null, // before not assigned
                <InputValidatorDescriptor>{
                    conditionDescriptor: {
                        type: NeverMatchesConditionType
                    },
                    errorMessage: 'Never',
                    summaryMessage: 'Never Summary'
                });
        },
        1500);  // shortened timeout    
    test('With 2 Conditions, both are async and both return a promise of Match. 1 OnValidate call. 2 OnValueHostStateChanges',
        (done) => {
            validateWithAsyncConditions(ConditionEvaluateResult.Match,
                [{
                    conditionEvaluateResult: ConditionEvaluateResult.Match,
                    issueFound: null
                },
                {
                    conditionEvaluateResult: ConditionEvaluateResult.Match,
                    issueFound: null
                }],
                [{
                    validationResult: ValidationResult.Valid,
                    issuesFound: null,
                    pending: [<any>{}, <any>{}]
                }],
                done,
                null,
                <InputValidatorDescriptor>{
                    conditionDescriptor: null,
                    conditionCreator: (requester) =>
                        new ConditionWithPromiseTester(
                            ConditionEvaluateResult.Match, 0
                        ),
                    errorMessage: 'Second'
                },
                2); // state change count
        },
        1500);  // shortened timeout   

    test('With 1 Condition that whose promise gets rejected doesnt change validation results',
        (done) => {
            let vds: InputValidatorDescriptor = {
                conditionDescriptor: null,
                conditionCreator: (requester) =>
                {
                    return <ICondition>{
                        category: ConditionCategory.Undetermined,
                        conditionType: 'TEST',
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
                errorMessage: 'Error'
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
                        let logger = setup.services.loggerService as MockCapturingLogger;
                        expect(logger.getLatest()).not.toBeNull();
                        expect(logger.getLatest()!.message).toMatch(/REJECTED ERROR/);
                        done();
                    }
                };
            let setup = testValidateFunctionWithPromise([vds], onValidateHandler, onStateChangedHandler);
            expect(setup.promises.length).toBe(1);

        },
        1500);  // shortened timeout    
});

// clearValidation(): void
describe('InputValueHost.clearValidation', () => {
    test('After validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivDescriptor: InputValidatorDescriptor = {
            conditionDescriptor: { type: IsUndeterminedConditionType },
            errorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);

        config.valueHost.validate();
        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();

        let stateChanges = config.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<InputValueHostState> = [
            {
                id: 'Field1',
                validationResult: ValidationResult.Undetermined,
                issuesFound: null,
                value: undefined,
                inputValue: ''
            },
            {
                id: 'Field1',
                validationResult: ValidationResult.NotAttempted,
                issuesFound: null,
                value: undefined,
                inputValue: ''
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);

    });
    test('Without calling validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivDescriptor: InputValidatorDescriptor = {
            conditionDescriptor: { type: IsUndeterminedConditionType },
            errorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {};
        let config = setupInputValueHostForValidate(ivDescriptors, state);

        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();
        let stateChanges = config.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(0);

    });
    test('With prior state reflecting a validation issue, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivDescriptor: InputValidatorDescriptor = {
            conditionDescriptor: { type: NeverMatchesConditionType },
            errorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid,
            issuesFound: []
        };
        state.issuesFound!.push(createIssueFound(NeverMatchesConditionType));

        let config = setupInputValueHostForValidate(ivDescriptors, state);

        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        expect(config.valueHost.getIssueFound(NeverMatchesConditionType)).toBeNull();

    });

    test('Without calling validate but with BusinessLogicError (Error), Ensure the state discards BusinessLogicError after clear', () => {
        let config = setupInputValueHostForValidate([], {});
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });

        expect(() => config.valueHost.clearValidation()).not.toThrow();
        expect(config.valueHost.validationResult).toBe(ValidationResult.NotAttempted);
        let stateChanges = config.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<InputValueHostState> = [
            {
                id: 'Field1',
                validationResult: ValidationResult.NotAttempted,
                issuesFound: null,
                value: undefined,
                inputValue: '',
                businessLogicErrors: [
                    {
                        errorMessage: 'ERROR',
                        severity: ValidationSeverity.Error
                    }
                ]
            },
            {
                id: 'Field1',
                validationResult: ValidationResult.NotAttempted,
                issuesFound: null,
                value: undefined,
                inputValue: ''
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);
    });
});
// doNotSaveNativeValue(): boolean
describe('InputValueHost.doNotSaveNativeValue', () => {
    function trydoNotSaveNativeValue(initialValidationResult: ValidationResult, hasPendings: boolean, expectedResult: boolean): void {
        let ivDescriptor: InputValidatorDescriptor = {
            conditionDescriptor: { type: NeverMatchesConditionType },
            errorMessage: ''
        };
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            ivDescriptor
        ];
        let state: Partial<InputValueHostState> = {
            id: 'Field1',
            validationResult: initialValidationResult,
            issuesFound: [],
            asyncProcessing: hasPendings
        };

        let config = setupInputValueHostForValidate(ivDescriptors, state);

        expect(config.valueHost.doNotSaveNativeValue()).toBe(expectedResult);
    }
    test('ValidationResult = Valid, doNotSaveNativeValue=false', () => {
        trydoNotSaveNativeValue(ValidationResult.Valid, false, false);
    });
    test('ValidationResult = Undetermined, doNotSaveNativeValue=false', () => {
        trydoNotSaveNativeValue(ValidationResult.Undetermined, false, false);
    });
    test('ValidationResult = Invalid, doNotSaveNativeValue=true', () => {
        trydoNotSaveNativeValue(ValidationResult.Invalid, false, true);
    });
    test('ValidationResult = Valid but with async pending, doNotSaveNativeValue=true', () => {
        trydoNotSaveNativeValue(ValidationResult.Valid, true, true);
    });
    test('ValidationResult = ValueChangedButUnvalidated, doNotSaveNativeValue=true', () => {
        trydoNotSaveNativeValue(ValidationResult.ValueChangedButUnvalidated, false, true);
    });

});

describe('InputValueHost.setBusinessLogicError', () => {
    test('One call with error adds to the list for the BusinessLogicInputValueHost', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        })).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1); // first changes the value; second changes ValidationResult
        let valueChange = <InputValueHostBaseState>changes[0];
        expect(valueChange.businessLogicErrors).toBeDefined();
        expect(valueChange.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error

            });
    });

    test('Two calls with errors (ERROR, WARNING) adds to the list for the BusinessLogicInputValueHost', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        })).not.toThrow();
        expect(() => config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        })).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        let valueChange1 = <InputValueHostBaseState>changes[0];
        expect(valueChange1.businessLogicErrors).toBeDefined();
        expect(valueChange1.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error
            });
        let valueChange2 = <InputValueHostBaseState>changes[1];
        expect(valueChange2.businessLogicErrors).toBeDefined();
        expect(valueChange2.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error
            });
        expect(valueChange2.businessLogicErrors![1]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'WARNING',
                severity: ValidationSeverity.Warning
            });
    });
    test('One call with null makes no changes to the state', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError(null!)).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
});
describe('InputValueHost.clearBusinessLogicErrors', () => {
    test('Call while no existing makes not changes to the state', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.clearBusinessLogicErrors()).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
    test('Set then Clear creates two state entries with state.BusinessLogicErrors undefined by the end', () => {
        let config = setupInputValueHost();

        expect(() => config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        })).not.toThrow();
        expect(() => config.valueHost.clearBusinessLogicErrors()).not.toThrow();

        let changes = config.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationResult
        let valueChange1 = <InputValueHostBaseState>changes[0];
        expect(valueChange1.businessLogicErrors).toBeDefined();
        expect(valueChange1.businessLogicErrors![0]).toEqual(
            <BusinessLogicError>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error
            });
        let valueChange2 = <InputValueHostBaseState>changes[1];
        expect(valueChange2.businessLogicErrors).toBeUndefined();
    });
});

// getIssueFound(validatorDescriptor: InputValidatorDescriptor): IssueFound | null
describe('InputValueHost.getIssueFound', () => {
    test('Without InputValidators is null', () => {
        let config = testValidateFunction(null, null, ValidationResult.Valid, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = config.valueHost.getIssueFound(null!)).not.toThrow();
        expect(issueFound).toBeNull();
    });
    test('With 1 Condition evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: AlwaysMatchesConditionType
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
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

// getIssuesFound(): IssuesFoundDictionary | null
describe('InputValueHosts.getIssuesFound', () => {
    test('No issues. Return null', () => {
        let config = testValidateFunction(null, null, ValidationResult.Valid, null);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).toBeNull();
    });
    test('1 issue exists. It is returned.', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                errorMessage: '1'
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType2
                },
                errorMessage: '2'
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

// getIssuesForInput(): Array<IssueSnapshot>
describe('InputValueHost.getIssuesForInput', () => {
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                errorMessage: '1',
                summaryMessage: 'Summary1',
                severity: ValidationSeverity.Warning
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType2
                },
                errorMessage: '2',
                summaryMessage: 'Summary2'
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
                id: 'Field1',
                severity: ValidationSeverity.Warning,
                errorMessage: '1'
            },
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: '2'
            }
        ];
        expect(issuesToReport).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Error) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: 'ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Severe) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'SEVERE',
            severity: ValidationSeverity.Severe
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Severe,
                errorMessage: 'SEVERE'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Warning) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Warning,
                errorMessage: 'WARNING'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('1 Validation error, and has BusinessLogicError (Error) reports 2 entries with BusinessLogicError last', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                errorMessage: 'Condition Error',
                summaryMessage: 'Summary1',
                severity: ValidationSeverity.Error
            },

        ];
        let config = setupInputValueHostForValidate(ivDescriptors, {});
        config.valueHost.setBusinessLogicError({
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        config.valueHost.validate();
        expect(() => issuesFound = config.valueHost.getIssuesForInput()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: 'Condition Error'
            },
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: 'BL_ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
});

// getIssuesForSummary(): Array<IssueSnapshot>
describe('InputValueHost.getIssuesForSummary', () => {
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
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                errorMessage: '1',
                summaryMessage: 'Summary1',
                severity: ValidationSeverity.Warning
            },
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType2
                },
                errorMessage: '2',
                summaryMessage: 'Summary2'
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
                id: 'Field1',
                severity: ValidationSeverity.Warning,
                errorMessage: 'Summary1'
            },
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: 'Summary2'
            }
        ];
        expect(issuesToReport).toEqual(expected);
    });

    test('No Validation errors, but has BusinessLogicError (Error) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: 'ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Severe) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'SEVERE',
            severity: ValidationSeverity.Severe
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Severe,
                errorMessage: 'SEVERE'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has BusinessLogicError (Warning) reports just the BusinessLogicError', () => {
        let config = setupInputValueHost();
        config.valueHost.setBusinessLogicError({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Warning,
                errorMessage: 'WARNING'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('1 Validation error, and has BusinessLogicError (Error) reports 2 entries with BusinessLogicError last', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                },
                errorMessage: 'Condition Error',
                summaryMessage: 'Summary Condition Error',
                severity: ValidationSeverity.Error
            },

        ];
        let config = setupInputValueHostForValidate(ivDescriptors, {});
        config.valueHost.setBusinessLogicError({
            errorMessage: 'BL_ERROR',
            // use the default         Severity: ValidationSeverity.Error
        });
        let issuesFound: Array<IssueSnapshot> | null = null;
        config.valueHost.validate();
        expect(() => issuesFound = config.valueHost.getIssuesForSummary()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueSnapshot> = [
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: 'Summary Condition Error'
            },
            {
                id: 'Field1',
                severity: ValidationSeverity.Error,
                errorMessage: 'BL_ERROR'
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
});
describe('InputValueHostGenerator members', () => {
    test('CanCreate returns true for ValueHostType.Input', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate({
            type: ValueHostType.Input,
            id: 'Field1',
            label: '',
            validatorDescriptors: null
        })).toBe(true);
    });
    test('CanCreate returns false for unexpected type', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate({
            type: 'Unexpected',
            id: 'Field1',
            label: '',
            validatorDescriptors: null
        })).toBe(false);
    });

    test('CanCreate returns true for Type not defined and presence of ValidationDescriptor property (using null as a value)', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            id: 'Field1',
            label: '',
            validatorDescriptors: null
        })).toBe(true);
    });
    test('CanCreate returns true for Type not defined and presence of ValidationDescriptor property using [] as a value', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            id: 'Field1',
            label: '',
            validatorDescriptors: []
        })).toBe(true);
    });
    test('CanCreate returns false for Type not defined and lack of ValidationDescriptor property', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            id: 'Field1',
            label: ''
        })).toBe(false);
    });

    test('CanCreate returns false for Type=undefined and lack of ValidationDescriptor property', () => {
        let testItem = new InputValueHostGenerator();
        expect(testItem.canCreate(<any>{
            Type: undefined,
            id: 'Field1',
            label: ''
        })).toBe(false);
    });

    test('create returns instance of InputValueHost with VM, Descriptor and State established', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: null
        };
        let state: InputValueHostState = {
            id: 'Field1',
            issuesFound: null,
            validationResult: ValidationResult.NotAttempted,
            value: undefined,
            inputValue: 'TEST'
        };
        let testItem = new InputValueHostGenerator();
        let vh: IInputValueHost | null = null;
        expect(() => vh = testItem.create(vm, descriptor, state)).not.toThrow();
        expect(vh).not.toBeNull();
        expect(vh).toBeInstanceOf(InputValueHost);
        expect(vh!.getId()).toBe(descriptor.id);    // check Descriptor value
        expect(vh!.getInputValue()).toBe('TEST');  // check State value
    });
    test('cleanupState existing state has no IssuesFound. Returns the same data', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            issuesFound: null,
            validationResult: ValidationResult.Valid,
            inputValue: 'ABC',
            value: 10
        };
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: null
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionDescriptor, cleanupState existing state has no IssuesFound but there is a new ValidationDescriptor which has no impact. Returns the same data', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            issuesFound: null,
            validationResult: ValidationResult.Valid,
            inputValue: 'ABC',
            value: 10
        };
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionDescriptor: <RequiredTextConditionDescriptor>{
                        type: ConditionType.RequiredText,
                        valueHostId: null
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionCreator, cleanupState existing state has no IssuesFound but there is a new ValidationDescriptor which has no impact. Returns the same data', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            issuesFound: null,
            validationResult: ValidationResult.Valid,
            inputValue: 'ABC',
            value: 10
        };
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionCreator: (requestor) => new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostId: 'Field1' }),
                    conditionDescriptor: null,
                    errorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionDescriptor, cleanupState existing state with ValidationResult.Error has an IssuesFound and there is a ValidatorDescriptor. State.IssuesFound unchanged', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound?.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionDescriptor: <RequiredTextConditionDescriptor>{
                        type: ConditionType.RequiredText,
                        valueHostId: 'Field1'
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionCreator, cleanupState existing state with ValidationResult.Error has an IssuesFound and there is a ValidatorDescriptor. State.IssuesFound unchanged', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound?.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionCreator: (requestor) => new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostId: 'Field1' }),
                    conditionDescriptor: null,
                    errorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionDescriptor, cleanupState existing state has an IssuesFound but no associated ValidationDescriptor. State.IssuesFound is null', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Valid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionDescriptor: <RangeConditionDescriptor>{
                        type: ConditionType.Range,   // different type from in State
                        valueHostId: 'Field1'
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound = null;
        expect(state).toEqual(expectedState);
    });
    test('Using ConditionCreator, cleanupState existing state has an IssuesFound but no associated ValidationDescriptor. State.IssuesFound is null', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Valid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionCreator: (requestor) => new NeverMatchesCondition({ type: NeverMatchesConditionType }),
                    conditionDescriptor: null,
                    errorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound = null;
        expect(state).toEqual(expectedState);
    });

    test('cleanupState existing state with ValidationResult=Invalid has an IssuesFound but no associated ValidationDescriptor. State.IssuesFound is null and ValidationResult is ValueChangedButUnvalidated', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionDescriptor: <RangeConditionDescriptor>{
                        type: ConditionType.Range,   // different type from in State
                        valueHostId: 'Field1'
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound = null;
        expectedState.validationResult = ValidationResult.ValueChangedButUnvalidated;
        expect(state).toEqual(expectedState);
    });
    test('cleanupState existing state with ValidationResult=Invalid, 2 IssuesFound where one is Warning and the other is removed. State.IssuesFound is the warning and ValidationResult is Valid', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: ''
        });
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: NeverMatchesConditionType,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: NeverMatchesConditionType
                    },
                    errorMessage: ''
                }
                // we've abandoned ConditionType.RequiredText which was Severity=Error
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound!.splice(0, 1);
        expectedState.validationResult = ValidationResult.Valid;
        expect(state).toEqual(expectedState);
    });
    test('cleanupState existing state with ValidationResult=Invalid, 3 IssuesFound (Error, Warning, Error) and one Error is removed. State.IssuesFound is the warning and the remaining error and ValidationResult is Invalid', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: ''
        });
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: NeverMatchesConditionType,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: ''
        });
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.Range,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: NeverMatchesConditionType
                    },
                    errorMessage: ''
                },
                {
                    conditionDescriptor: <RangeConditionDescriptor>{
                        type: ConditionType.Range,
                        valueHostId: null
                    },
                    errorMessage: ''
                }
                // we've abandoned ConditionType.RequiredText which was Severity=Error
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound!.splice(0, 1);
        expectedState.validationResult = ValidationResult.Invalid;
        expect(state).toEqual(expectedState);
    });
    test('cleanupState existing state with ValidationResult=Invalid, 3 IssuesFound (Error, Warning, Severe) where Error is removed. State.IssuesFound is Warning, Severe and ValidationResult is Invalid', () => {
        let originalState: InputValueHostState = {
            id: 'Field1',
            validationResult: ValidationResult.Invalid,
            inputValue: 'ABC',
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.RequiredText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: ''
        });
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: NeverMatchesConditionType,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: ''
        });
        originalState.issuesFound!.push({
            valueHostId: 'Field1',
            conditionType: ConditionType.Range,
            errorMessage: '',
            severity: ValidationSeverity.Severe,
            summaryMessage: ''
        });
        let state = { ...originalState };
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            validatorDescriptors: [
                {
                    conditionDescriptor: {
                        type: NeverMatchesConditionType
                    },
                    errorMessage: ''
                },
                {
                    conditionDescriptor: <RangeConditionDescriptor>{
                        type: ConditionType.Range,
                        valueHostId: null
                    },
                    errorMessage: ''
                }
                // we've abandoned ConditionType.RequiredText which was Severity=Error
            ]
        };
        let testItem = new InputValueHostGenerator();
        expect(() => testItem.cleanupState(state, descriptor)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound!.splice(0, 1);
        expectedState.validationResult = ValidationResult.Invalid;
        expect(state).toEqual(expectedState);
    });
    test('createState returns instance with ID and InitialValue from Descriptor', () => {
        let testItem = new InputValueHostGenerator();
        let descriptor: InputValueHostDescriptor = {
            id: 'Field1',
            type: ValueHostType.Input,
            label: '',
            initialValue: 'TEST',
            validatorDescriptors: [
                {
                    conditionDescriptor: <RequiredTextConditionDescriptor>{
                        type: ConditionType.RequiredText,
                        valueHostId: 'Field1'
                    },
                    errorMessage: '',
                }
            ]
        };
        let state: InputValueHostState | null = null;
        expect(() => state = testItem.createState(descriptor)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.id).toBe(descriptor.id);
        expect(state!.validationResult).toBe(ValidationResult.NotAttempted);
        expect(state!.inputValue).toBeUndefined();
        expect(state!.group).toBeUndefined();
        expect(state!.value).toBe(descriptor.initialValue);
        expect(state!.issuesFound).toBeNull();
    });
});
describe('InputValueHost.requiresInput', () => {
    test('Has a Required condition. requiresInput returns true', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: ConditionType.RequiredText
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        expect(config.valueHost.requiresInput).toBe(true);
    });
    test('Lacks a Required condition. requiresInput returns false', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: ConditionType.DataTypeCheck
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        expect(config.valueHost.requiresInput).toBe(false);
    });
    test('Has a Required condition but its last amongst several. requiresInput returns true', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: {
                    type: NeverMatchesConditionType
                }
            },
            {
                conditionDescriptor: {
                    type: ConditionType.DataTypeCheck
                }
            },
            {
                conditionDescriptor: {
                    type: ConditionType.RequiredText
                }
            }
        ];
        let state: Partial<InputValueHostState> = {
        };
        let config = setupInputValueHostForValidate(ivDescriptors, state);
        expect(config.valueHost.requiresInput).toBe(true);
    });
});
describe('InputValueHost.gatherValueHostIds', () => {
    test('Gets two ValueHostIds', () => {
        let ivDescriptors: Array<Partial<InputValidatorDescriptor>> = [
            {
                conditionDescriptor: <DataTypeCheckConditionDescriptor>{
                    type: ConditionType.DataTypeCheck,
                    valueHostId: 'Property1'
                }
            },
            {
                conditionDescriptor: <RequiredTextConditionDescriptor>{
                    type: ConditionType.RequiredText,
                    valueHostId: 'Property2'
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

describe('InputValueHost.otherValueHostChangedNotification and setValues triggering ValidationManager.notifyOtherValueHostsOfValueChange to call otherValueHostChangedNotification', () => {
    function setupWithThreeValueHosts(): {
        vm: IValidationManager,
        services: ValidationServices,
        field1: IInputValueHost,
        field2: IInputValueHost,
        field3: IInputValueHost
    } {

        let vhDescriptors: Array<InputValueHostDescriptor> = [
            { // Refers to Field2. So validation on Field2 should force this to update
                type: ValueHostType.Input,
                id: 'Field1',
                label: 'Label1',
                validatorDescriptors: [{
                    conditionDescriptor: <CompareToConditionDescriptor>{
                        type: ConditionType.EqualTo,
                        secondValueHostId: 'Field2',
                        valueHostId: null
                    },
                    errorMessage: 'Field1 Error'
                }]
            },
            {
                type: ValueHostType.Input,
                id: 'Field2',
                label: 'Label2',
                validatorDescriptors: [{
                    conditionDescriptor: <RequiredTextConditionDescriptor>{
                        type: ConditionType.RequiredText,
                        valueHostId: null
                    },
                    errorMessage: 'Field2 Error'
                }]
            },
            { // Value changes should not notify another
                type: ValueHostType.Input,
                id: 'Field3',
                label: 'Label3',
                validatorDescriptors: [{
                    conditionDescriptor: <RequiredTextConditionDescriptor>{
                        type: ConditionType.RequiredText,
                        valueHostId: null
                    },
                    errorMessage: 'Field3 Error'
                }]
            }
        ];
        let services = createValidationServices();
        let vm = new ValidationManager({ services: services, valueHostDescriptors: vhDescriptors });   // the real thing so we use real InputValueHosts


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
        expect(config.field1.validationResult).toBe(ValidationResult.NotAttempted);

        expect(() => config.field1.otherValueHostChangedNotification(
            config.field2.getId(), false)).not.toThrow();
        expect(config.field1.validationResult).toBe(ValidationResult.NotAttempted);

    });
    test('Property1 previously validated and is Invalid. Property2 changed, revalidate = false. ValidationResult => ValueChangedButUnvalidated.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);

        expect(() => config.field1.otherValueHostChangedNotification(
            config.field2.getId(), false)).not.toThrow();
        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
    });
    test('Property1 previously validated and is Invalid. Property2 changed via setValue with validate=false. ValidationResult => ValueChangedButUnvalidated.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);

        // expect(() => config.field1.otherValueHostChangedNotification(
        //     config.field2.GetId(), false)).not.toThrow();
        config.field2.setValues('ABC', 'ABC');  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
    });
    test('Property1 previously validated and is Invalid. Property2 changed via setValue with validate=true. ValidationResult => Valid because fields are now equal.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);

        // expect(() => config.field1.otherValueHostChangedNotification(
        //     config.field2.GetId(), false)).not.toThrow();
        config.field2.setValues('ABC', 'ABC', { validate: true });  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.validationResult).toBe(ValidationResult.Valid);
    });
    test('Property1 previously validated. Change Property3 with revalidate=false. No change to Property1.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');

        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        config.field1.validate();
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);

        expect(() => config.field1.otherValueHostChangedNotification(
            config.field3.getId(), false)).not.toThrow();
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);
    });
    test('Property1 previously validated. Use setValues to change Property3 with validate=false. No change to Property1.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');
        config.field3.setValues('', '');

        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field2.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field3.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);

        config.field1.validate();
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);
        config.field2.validate();
        expect(config.field2.validationResult).toBe(ValidationResult.Valid);
        config.field3.validate();
        expect(config.field3.validationResult).toBe(ValidationResult.Invalid);
        // expect(() => config.field1.otherValueHostChangedNotification(
        //     config.field3.GetId(), false)).not.toThrow();
        config.field3.setValues('X', 'X');  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);  // no change
        expect(config.field2.validationResult).toBe(ValidationResult.Valid);
        expect(config.field3.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
    });

    test('Property1 previously validated. Use setValues to change Property3 with validate=true. No change to Property1.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');
        config.field3.setValues('', '');

        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field2.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field3.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);

        config.field1.validate();
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);
        config.field2.validate();
        expect(config.field2.validationResult).toBe(ValidationResult.Valid);
        config.field3.validate();
        expect(config.field3.validationResult).toBe(ValidationResult.Invalid);
        // expect(() => config.field1.otherValueHostChangedNotification(
        //     config.field3.GetId(), false)).not.toThrow();
        config.field3.setValues('X', 'X', { validate: true });  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(config.field1.validationResult).toBe(ValidationResult.Invalid);  // no change
        expect(config.field2.validationResult).toBe(ValidationResult.Valid);
        expect(config.field3.validationResult).toBe(ValidationResult.Valid);
    });
    test('Property1 never validated but had been setValue. Use setValue to change Property2 with validate=true. Expect Property1 ValidationResult=Valid because it was ValidationResult=ValueChanged.', () => {
        let config = setupWithThreeValueHosts();
        config.field1.setInputValue('ABC');
        config.field1.setValue('ABC');
        config.field2.setInputValue('BCD');
        config.field2.setValue('BCD');
        expect(config.field1.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);
        expect(config.field2.validationResult).toBe(ValidationResult.ValueChangedButUnvalidated);


        expect(() => config.field1.otherValueHostChangedNotification(
            config.field2.getId(), true)).not.toThrow();
        config.field2.setValues('ABC', 'ABC', { validate: true });
        expect(config.field1.validationResult).toBe(ValidationResult.Valid);

    });
});
describe('toIInputValueHost function', () => {
    test('Passing actual InputValueHost matches interface returns same object.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new InputValueHost(vm, {
            id: 'Field1',
            label: 'Label1',
            validatorDescriptors: []
        },
            {
                id: 'Field1',
                value: undefined,
                issuesFound: null,
                validationResult: ValidationResult.NotAttempted,
                inputValue: undefined
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
        isValid: boolean = true;
        validationResult: ValidationResult = ValidationResult.NotAttempted;
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
        requiresInput: boolean = false;
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
        isChanged: boolean = false;

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

describe('toIInputValueHostCallbacks function', () => {
    test('Passing actual InputValueHost matches interface returns same object.', () => {
        let testItem = new MockValidationManager(new MockValidationServices(false, false));

        expect(toIInputValueHostCallbacks(testItem)).toBe(testItem);
    });
    class TestIInputValueHostCallbacksImplementation implements IInputValueHostCallbacks {
        onValueChanged(vh: IValueHost, old: any) { }
        onValueHostStateChanged(vh: IValueHost, state: ValueHostState) { }
        onInputValueChanged(vh: IInputValueHost, old: any) { }
        onValueHostValidated(vh: IInputValueHost, validationResult: ValidateResult) { }
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