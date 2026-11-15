import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { AsyncValidatorConfig, AsyncValidatorEvaluateHandler, AsyncValidatorEvaluationResult } from '../../src/Interfaces/AsyncValidator';
import { ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggingService';
import { ValidateOptions, ValidationSeverity } from '../../src/Interfaces/Validation';
import { ValidatorType } from '../../src/Interfaces/Validator';
import { TestingLoggingService } from '../../src/Support/TestingLoggingService';
import { CodingError } from '../../src/Utilities/ErrorHandling';
import { AsyncValidator } from '../../src/Validation/AsyncValidator';
import { MockJivsServices, MockValueHostsManager } from '../TestSupport/mocks';

/**
 * Creates a validator with a field and recording logger for validate() scenarios.
 */
function setupValidator(handler: AsyncValidatorEvaluateHandler, config?: Partial<AsyncValidatorConfig>) {
    let services = new MockJivsServices(false, false);
    let logger = new TestingLoggingService();
    services.loggingService = logger;
    let manager = new MockValueHostsManager(services);
    let valueHost = manager.addMockFieldValueHost('Field1', LookupKey.String, 'Label1');
    let validator = new AsyncValidator(valueHost, {
        validatorType: ValidatorType.AsyncValidator,
        handlerIdentity: 'AvailabilityCheck',
        handler,
        ...config
    });
    logger.clearAll();
    return { validator, valueHost, manager, logger };
}

// Verify the Promise represents the handler's actual completion and receives its configured context.
describe('AsyncValidator.validate async completion', () => {
    test('Waits for the handler and returns its NoMatch issue with the configured payload', async () => {
        let payload = { endpoint: 'availability' };
        let receivedHost: unknown;
        let receivedManager: unknown;
        let receivedPayload: unknown;
        let complete!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidator((host, manager, context) => {
            receivedHost = host;
            receivedManager = manager;
            receivedPayload = context;
            return new Promise(resolve => { complete = resolve; });
        }, { payload });

        let pending = setup.validator.validate({});
        let settled = false;
        let observed = Promise.resolve(pending).then(result => {
            settled = true;
            return result;
        });
        await Promise.resolve();
        await Promise.resolve();
        expect(settled).toBe(false);
        expect(receivedHost).toBe(setup.valueHost);
        expect(receivedManager).toBe(setup.manager);
        expect(receivedPayload).toBe(payload);

        complete({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Already taken'
        });
        let result = await observed;
        expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.NoMatch);
        expect(result.issueFound).toEqual(expect.objectContaining({
            errorCode: 'NameTaken',
            errorMessage: 'Already taken',
            severity: ValidationSeverity.Error,
            doNotSave: true
        }));
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Returns the Match result once the handler resolves', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        }));
        await expect(setup.validator.validate({})).resolves.toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Match,
            issueFound: null
        });
        expect(setup.logger.entryCount).toBe(0);
    });
});

// Skipped validations must not start a request or be counted as evaluated validators.
describe('AsyncValidator.validate exclusions', () => {
    test('Skips disabled, preliminary, and during-edit validations without invoking the handler', () => {
        let calls = 0;
        let handler: AsyncValidatorEvaluateHandler = async () => {
            calls++;
            return { conditionEvaluateResult: ConditionEvaluateResult.Match };
        };
        let setup = setupValidator(handler);
        let disabled = setupValidator(handler, { enabled: false });
        let options: ValidateOptions[] = [{ preliminary: true }, { duringEdit: true }];

        for (let option of options)
            expect(setup.validator.validate(option)).toEqual({
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                issueFound: null,
                skipped: true
            });
        expect(disabled.validator.validate({})).toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        });
        expect(calls).toBe(0);
        expect(setup.logger.entryCount).toBe(0);
        expect(disabled.logger.entryCount).toBe(0);
    });
});

// Confirm handled operational errors and broken handler contracts remain distinguishable.
describe('AsyncValidator.validate failures', () => {
    test('Returns and logs the Error reported by a successfully resolved handler', async () => {
        let failure = new Error('Service unavailable');
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: failure
        }));

        let result = await setup.validator.validate({});
        expect(result.failedToResolve).toBe(failure);
        expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);
        expect(result.issueFound).toBeNull();
        expect(setup.logger.captured).toHaveLength(1);
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error,
            category: LoggingCategory.Exception,
            message: 'Service unavailable',
            feature: 'Validator',
            type: 'AsyncValidator',
            identity: ['Field1', 'AvailabilityCheck']
        }));
    });

    test('Rejects with a CodingError when the handler rejects or throws', async () => {
        let failure = new Error('Unexpected handler failure');
        let handlers: AsyncValidatorEvaluateHandler[] = [
            () => Promise.reject(failure),
            () => { throw failure; }
        ];
        for (let handler of handlers) {
            let setup = setupValidator(handler);
            let result = setup.validator.validate({});
            await expect(result).rejects.toBeInstanceOf(CodingError);
            await expect(result).rejects.toMatchObject({
                message: expect.stringContaining('Unexpected handler failure'),
                cause: failure
            });
            expect(setup.logger.entryCount).toBe(0);
        }
    });

    test('Propagates a CodingError produced while converting a malformed NoMatch', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: ''
        }));
        await expect(setup.validator.validate({})).rejects.toThrow(CodingError);
        expect(setup.logger.entryCount).toBe(0);
    });
});
