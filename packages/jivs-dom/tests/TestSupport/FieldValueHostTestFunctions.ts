import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig, IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import {
    createJivsServicesForTesting,
    TestingJivsServices
} from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';

import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();  // install the domServices service property on JivsServices
/**
 * Creates a FieldValueHostConfig with defaults used by jivs-dom tests.
 * @param fieldNumber - Number used to generate the default name and label; defaults to 1.
 * @param dataType - Field data type; defaults to LookupKey.String.
 */
export function createFieldValueHostConfig(
    fieldNumber: number = 1,
    dataType: string = LookupKey.String
): FieldValueHostConfig
{
    return {
        name: `Field${fieldNumber}`,
        label: `Label${fieldNumber}`,
        valueHostType: ValueHostType.Field,
        dataType: dataType,
        validatorConfigs: []
    };
}

/**
 * Completes a partial field config using the standard jivs-dom test defaults.
 * @param partialConfig - Properties that override the default field configuration.
 * @param fieldNumber - Number used to generate default name and label; defaults to 1.
 */
export function finishPartialFieldValueHostConfig(
    partialConfig: Partial<FieldValueHostConfig> | null = null,
    fieldNumber: number = 1
): FieldValueHostConfig
{
    return {
        ...createFieldValueHostConfig(fieldNumber),
        ...partialConfig
    };
}

/**
 * Creates a real FieldValueHost with the engine's real testing services and manager.
 * The services include a real ErrorMessagesService; use it to test localization end to end.
 * @param partialConfig - Field properties that override defaults.
 * @param activeCultureId - Default and active culture; defaults to 'en'.
 */
export function setupFieldValueHostForTesting(
    partialConfig: Partial<FieldValueHostConfig> | null = null,
    activeCultureId: string = 'en'
): {
    services: TestingJivsServices,
    valueHostsManager: ValueHostsManager,
    config: FieldValueHostConfig,
    valueHost: IFieldValueHost,
    errorMessagesService: ErrorMessagesService
}
{
    let services = createJivsServicesForTesting({ defaultCultureId: activeCultureId });
    let config = finishPartialFieldValueHostConfig(partialConfig);
    let valueHostsManager = new ValueHostsManager({
        services: services as any,   // build vs src copies of jivs-dom types are incompatible
        valueHostConfigs: [config]
    });
    let valueHost = valueHostsManager.getFieldValueHost(config.name);
    if (!valueHost)
        throw new Error(`Failed to create FieldValueHost "${config.name}" for testing.`);

    let errorMessagesService = services.errorMessagesService;
    if (!(errorMessagesService instanceof ErrorMessagesService))
        throw new Error('createJivsServicesForTesting() did not provide the real ErrorMessagesService.');

    return {
        services: services,
        valueHostsManager: valueHostsManager,
        config: config,
        valueHost: valueHost,
        errorMessagesService: errorMessagesService
    };
}
