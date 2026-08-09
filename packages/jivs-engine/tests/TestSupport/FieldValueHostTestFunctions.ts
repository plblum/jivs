import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { FieldValueHostConfig, FieldValueHostInstanceState, FieldValueHostSetValueOptions, IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IJivsServices } from '../../src/Interfaces/JivsServices';
import { ValidationStatus } from '../../src/Interfaces/Validation';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { FieldValueHost, FieldValueHostGenerator } from '../../src/ValueHosts/FieldValueHost';
import { ValueHostFactory } from '../../src/ValueHosts/ValueHostFactory';

/**
 * # FieldValueHostTestFunctions - Test Support Utilities
 * 
 * This module provides factory functions and test classes for creating and configuring FieldValueHost instances
 * in test scenarios. It includes utilities for building configurations, managing state, and testing internal behavior.
 * 
 * ## Key Functions and Classes
 * 
 * ### Configure FieldValueHosts and their ValidatorConfig.
 * - `finishPartialFieldValueHostConfig()` - Completes partial FieldValueHostConfig objects with sensible defaults.
 *   Use this to quickly create field configurations in tests without specifying every property.
 * - `finishPartialValidatorConfig()` - Completes partial ValidatorConfig objects with default error and summary messages.
 *   Useful for building validator configurations alongside field configs.
 * 
 * ### Testing Infrastructure
 * - `TestFieldValueHost` - An extended FieldValueHost class that exposes protected methods for unit testing.
 *   Allows direct testing of internal behavior and formatting logic that would otherwise be inaccessible.
 * - `supportTestValueHostInServices()` - Registers TestFieldValueHost with IJivsServices.
 *   Call this during test setup to enable TestFieldValueHost instantiation throughout your test suite.
 * 
 * ## Usage Example
 * 
 * ```typescript
 * // Setup services for testing
 * supportTestValueHostInServices(services);
 * 
 * // Create field configuration with defaults
 * const fieldConfig = finishPartialFieldValueHostConfig({ name: 'MyField', dataType: LookupKey.Number });
 * 
 * // Create validator configuration with defaults
 * const validatorConfig = finishPartialValidatorConfig({ errorMessage: 'Custom error' });
 * ```
 */

/**
 * Creates a FieldValueHostConfig with default values.
 * Generally use finishPartialFieldValueHostConfig instead, which consumes this.
 * @param fieldNumber - The field number used for naming (default: 1)
 * @param dataType - The lookup key for the data type (default: LookupKey.String)
 * @param initialValue - Optional initial value for the field
 * @returns A FieldValueHostConfig object
 */
export function createFieldValueHostConfig(fieldNumber: number = 1,
    dataType: string = LookupKey.String,
    initialValue?: any): FieldValueHostConfig 
{
    return {
        name: 'Field' + fieldNumber,
        label: 'Label' + fieldNumber,
        valueHostType: ValueHostType.Field,
        dataType: dataType,
        initialValue: initialValue,
        validatorConfigs: []
    };
}

/**
 * Creates a complete FieldValueHostConfig object from a partial configuration.
 * Any missing properties will be filled with default values defined by createFieldValueHostConfig.
 * @param partialConfig - The partial configuration to complete
 * @returns A complete FieldValueHostConfig object
 */
export function finishPartialFieldValueHostConfig(partialConfig: Partial<FieldValueHostConfig> | null, fieldNumber: number = 1):
    FieldValueHostConfig 
{
    let defaultIVH = createFieldValueHostConfig(fieldNumber, LookupKey.String);
    if (partialConfig) {
        return { ...defaultIVH, ...partialConfig };
    }
    return defaultIVH;
}

/**
 * Creates an array of complete FieldValueHostConfig objects from an array of partial configurations.
 * Any missing properties in each partial configuration will be filled with default values 
 * defined by createFieldValueHostConfig, where each name is given a sequential number starting from 1.
 * @param partialConfigs - The array of partial configurations to complete
 * @returns An array of complete FieldValueHostConfig objects
 */
export function finishPartialFieldValueHostConfigs(partialConfigs: Array<Partial<FieldValueHostConfig>> | null):
    Array<FieldValueHostConfig> | null {
    let result: Array<FieldValueHostConfig> = [];
    if (partialConfigs) {
        for (let i = 0; i < partialConfigs.length; i++) {
            let vhd = partialConfigs[i];
            result.push(finishPartialFieldValueHostConfig(vhd, i + 1));
        }
    }

    return result;
}


/**
 * Creates a complete ValidatorConfig object from a condition configuration.
 * Generally use finishPartialValidatorConfig instead, which consumes this.
 * @param condConfig - The condition configuration to use
 * @returns A complete ValidatorConfig object
 */
export function createValidatorConfig(condConfig: ConditionConfig | null): ValidatorConfig {
    return {
        conditionConfig: condConfig,
        errorMessage: 'Local',
        summaryMessage: 'Summary',
    };
}

/**
 * Creates a complete ValidatorConfig object from a partial configuration.
 * Any missing properties will be filled with default values defined by createValidatorConfig.
 * @param validatorConfig - The partial ValidatorConfig to complete
 * @returns A complete ValidatorConfig object
 */
export function finishPartialValidatorConfig(validatorConfig: Partial<ValidatorConfig> | null):
    ValidatorConfig {
    let defaultIVD = createValidatorConfig(null);
    if (validatorConfig) {
        return { ...defaultIVD, ...validatorConfig };
    }
    return defaultIVD;
}

/**
 * Creates an array of complete ValidatorConfig objects from an array of partial configurations.
 * Any missing properties in each partial configuration will be filled with default values defined by createValidatorConfig.
 * @param validatorConfigs - The array of partial ValidatorConfig objects to complete
 * @returns An array of complete ValidatorConfig objects
 */
export function finishPartialValidatorConfigs(validatorConfigs: Array<Partial<ValidatorConfig>> | null):
    Array<ValidatorConfig> {
    let result: Array<ValidatorConfig> = [];
    if (validatorConfigs) {
        let defaultIVD = createValidatorConfig(null);
        for (let i = 0; i < validatorConfigs.length; i++) {
            let vd = validatorConfigs[i];
            result.push(finishPartialValidatorConfig(vd));
        }
    }

    return result;
}

/**
 * Creates a complete FieldValueHostInstanceState object for a given field number.
 * Generally use finishPartialFieldValueHostInstanceState instead, which consumes this.
 * @param fieldNumber - The field number to use for the instance state
 * @returns A complete FieldValueHostInstanceState object
 */
export function createFieldValueHostInstanceState(fieldNumber: number = 1): FieldValueHostInstanceState {
    return {
        name: 'Field' + fieldNumber,
        value: undefined,
        textValue: undefined,
        issuesFound: null,
        status: ValidationStatus.NotAttempted
    };
}
/**
 * Creates a complete FieldValueHostInstanceState object from a partial configuration.
 * Any missing properties will be filled with default values defined by createFieldValueHostInstanceState.
 * @param partialState - The partial FieldValueHostInstanceState to complete
 * @returns A complete FieldValueHostInstanceState object
 */
export function finishPartialFieldValueHostInstanceState(partialState: Partial<FieldValueHostInstanceState> | null): FieldValueHostInstanceState {
    let defaultIVS = createFieldValueHostInstanceState(1);
    if (partialState) {
        return { ...defaultIVS, ...partialState };
    }
    return defaultIVS;
}

//#region TestFieldValueHost
/** 
 * TestFieldValueHost is a subclass of FieldValueHost used for testing purposes.
 * Its intended to expose protected methods for testing, and to be used with a custom FieldValueHostGenerator.
 * It is not intended for production use.
 * 
 * You must use supportTestValueHostInServices() to register the 
 * TestValidatorsValueHostGenerator with your IJivsServices instance 
 * before you can create instances of TestFieldValueHost.
 */
export class TestFieldValueHost extends FieldValueHost
{
    public publicifiy_TryReformatTextValue(originalText: string, options: FieldValueHostSetValueOptions): void {
        super.tryReformatTextValue(originalText, options);
    }
}


export const TestFieldValueHostType = 'TestFieldValueHost';

/**
 * TestValidatorsValueHostGenerator is a FieldValueHostGenerator that creates TestFieldValueHost instances.
 * It is used for testing purposes and is not intended for production use.
 */
export class TestValidatorsValueHostGenerator extends FieldValueHostGenerator {
    public override canCreate(config: ValueHostConfig): boolean {
        return config.valueHostType === TestFieldValueHostType;
    }
    public override create(valueHostsManager: IValueHostsManager, config: FieldValueHostConfig,
        state: FieldValueHostInstanceState): IFieldValueHost
    {
        return new TestFieldValueHost(valueHostsManager, config, state);
    }
}

/**
 * Registers the TestValidatorsValueHostGenerator with the given IJivsServices instance.
 * This allows tests to easily set up the necessary services for using TestFieldValueHost.
 * It entirely replaces any existing ValueHostFactory in the services, to ensure that the native
 * FieldValueHost isn't used in tests that require the TestFieldValueHost.
 * @param services - The IJivsServices instance to register the TestValidatorsValueHostGenerator with
 */
export function supportTestValueHostInServices(services: IJivsServices): void
{
    let factory = new ValueHostFactory();
    factory.register(new TestValidatorsValueHostGenerator());
    services.valueHostFactory = factory;
}
//#endregion TestFieldValueHost
