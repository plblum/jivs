import { AsyncValidatorEvaluateHandler } from '@plblum/jivs-engine/build/Interfaces/AsyncValidator';
import { ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { LoggingCategory, LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValidationSeverity, ValidationState, ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { TestingLoggingService } from '@plblum/jivs-engine/build/Support/TestingLoggingService';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManagerConfigBuilder } from '../../src/Builder/ValueHostsManagerConfigBuilder';
import { BuildersFactoryInstaller } from '../../src/Services/BuildersFactoryInstaller';

beforeAll(() => {
    new BuildersFactoryInstaller();
});

/**
 * Builds a real ValueHostsManager from a fluent async-validator configuration.
 */
function setupManager(handler: AsyncValidatorEvaluateHandler): {
    manager: ValueHostsManager,
    logger: TestingLoggingService
} {
    let services = createJivsServicesForTesting();
    let builder = new ValueHostsManagerConfigBuilder(services);
    builder.field('Field1', LookupKey.String)
        .asyncValidator('RemoteCheck', handler);
    let manager = new ValueHostsManager(builder.complete());
    let logger = services.loggingService as TestingLoggingService;
    logger.clearAll();
    return { manager, logger };
}

/**
 * Starts validation and captures the pending state before awaiting the manager result.
 */
function startValidation(manager: ValueHostsManager): {
    initialState: ValidationState,
    completion: Promise<ValidationState>
} {
    let completion = manager.validate();
    let initialState = manager.currentValidationState();
    return { initialState, completion };
}

// Exercises the complete fluent-builder-to-manager path for each async validation outcome.
describe('ValidatorBuilder asyncValidator integration', () => {
    test('A builder-created handler that returns Match completes validation successfully', async () => {
        let callCount = 0;
        let receivedValueHost: unknown;
        let receivedManager: unknown;
        let handler: AsyncValidatorEvaluateHandler = async (valueHost, manager) => {
            callCount++;
            receivedValueHost = valueHost;
            receivedManager = manager;
            return { conditionEvaluateResult: ConditionEvaluateResult.Match };
        };
        let setup = setupManager(handler);
        let run = startValidation(setup.manager);

        expect(run.initialState).toEqual(expect.objectContaining({
            isValid: true,
            doNotSave: true,
            issuesFound: null,
            asyncProcessing: true
        }));
        let finalState = await run.completion;

        expect(callCount).toBe(1);
        expect(receivedValueHost).toBe(setup.manager.getValueHost('Field1'));
        expect(receivedManager).toBe(setup.manager);
        expect(finalState).toEqual({
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false,
            group: undefined
        });
        expect(setup.manager.getFieldValueHost('Field1')?.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.logger.entryCount).toBe(0);
        setup.manager.dispose();
    });

    test('A builder-created handler that returns NoMatch publishes its issue', async () => {
        let handler: AsyncValidatorEvaluateHandler = async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'This name is already in use'
        });
        let setup = setupManager(handler);
        let run = startValidation(setup.manager);

        expect(run.initialState.asyncProcessing).toBe(true);
        let finalState = await run.completion;

        expect(finalState.isValid).toBe(false);
        expect(finalState.doNotSave).toBe(true);
        expect(finalState.asyncProcessing).toBe(false);
        expect(finalState.issuesFound).toEqual([
            expect.objectContaining({
                valueHostName: 'Field1',
                asyncIdentity: 'RemoteCheck',
                errorCode: 'NameTaken',
                errorMessage: 'This name is already in use',
                summaryMessage: 'This name is already in use',
                severity: ValidationSeverity.Error,
                doNotSave: true
            })
        ]);
        expect(setup.manager.getFieldValueHost('Field1')?.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.logger.entryCount).toBe(0);
        setup.manager.dispose();
    });

    test('A builder-created handler that returns Undetermined settles without an issue', async () => {
        let handler: AsyncValidatorEvaluateHandler = async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined
        });
        let setup = setupManager(handler);
        let run = startValidation(setup.manager);

        expect(run.initialState.asyncProcessing).toBe(true);
        let finalState = await run.completion;

        expect(finalState).toEqual({
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false,
            group: undefined
        });
        expect(setup.manager.getFieldValueHost('Field1')?.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(setup.logger.entryCount).toBe(0);
        setup.manager.dispose();
    });

    test('A builder-created handler that returns failedToResolve marks validation failed and logs the error', async () => {
        let failure = new Error('Remote service is unavailable');
        let handler: AsyncValidatorEvaluateHandler = async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: failure
        });
        let setup = setupManager(handler);
        let run = startValidation(setup.manager);

        expect(run.initialState.asyncProcessing).toBe(true);
        let finalState = await run.completion;

        expect(finalState).toEqual({
            isValid: false,
            doNotSave: true,
            issuesFound: [expect.objectContaining({
                valueHostName: 'Field1',
                asyncIdentity: 'RemoteCheck',
                errorCode: 'AsyncValidationFailed',
                doNotSave: true
            })],
            asyncProcessing: false,
            group: undefined
        });
        expect(setup.manager.getFieldValueHost('Field1')?.validationStatus).toBe(ValidationStatus.Failed);
        let logged = setup.logger.findMessage(failure.message, LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', type: 'AsyncValidator' });
        expect(logged).not.toBeNull();
        expect(logged?.level).toBe(LoggingLevel.Error);
        expect(logged?.category).toBe(LoggingCategory.Exception);
        expect(logged?.message).toBe(failure.message);
        expect(logged?.feature).toBe('Validator');
        expect(logged?.type).toBe('AsyncValidator');
        expect(logged?.identity).toEqual(['Field1', 'RemoteCheck']);
        expect(logged?.data).toBeUndefined();
        setup.manager.dispose();
    });
});
