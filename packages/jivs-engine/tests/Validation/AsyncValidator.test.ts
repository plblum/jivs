import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { AsyncValidatorConfig, AsyncValidatorEvaluateHandler, AsyncValidatorEvaluationResult } from '../../src/Interfaces/AsyncValidator';
import { ConditionCategory, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggingService';
import { IssueFound, ValidateOptions, ValidationSeverity } from '../../src/Interfaces/Validation';
import { ValidatorType } from '../../src/Interfaces/Validator';
import { ErrorMessagesService } from '../../src/Services/ErrorMessagesService';
import { TestingLoggingService } from '../../src/Support/TestingLoggingService';
import { CodingError } from '../../src/Utilities/ErrorHandling';
import { AsyncValidator } from '../../src/Validation/AsyncValidator';
import { MockJivsServices, MockValueHostsManager } from '../TestSupport/mocks';

/**
 * Creates a validator with a field and recording logger for validate() scenarios.
 */
function setupValidator(handler: AsyncValidatorEvaluateHandler, config?: Partial<AsyncValidatorConfig>) {
    let services = new MockJivsServices(false, true);
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
    return { validator, valueHost, manager, logger, services };
}

// Configuration identity supplies the validator's stable public identity and async category.
describe('AsyncValidator construction and identity', () => {
    test('Rejects missing constructor dependencies, empty identity, and a missing handler', () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        }));
        let config: AsyncValidatorConfig = {
            validatorType: ValidatorType.AsyncValidator,
            handlerIdentity: 'AvailabilityCheck',
            handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
        };

        expect(() => new AsyncValidator(null!, config)).toThrow(CodingError);
        expect(() => new AsyncValidator(setup.valueHost, null!)).toThrow(CodingError);
        expect(() => new AsyncValidator(setup.valueHost, { ...config, handlerIdentity: '' })).toThrow(CodingError);
        expect(() => new AsyncValidator(setup.valueHost, { ...config, handler: null! })).toThrow(CodingError);
    });

    test('Uses the configured identity for its error code and async condition category', () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        }), { handlerIdentity: 'AccountAvailability' });

        expect(setup.validator.errorCode).toBe('AccountAvailability');
        expect(setup.validator.conditionType).toBe('AccountAvailability');
        expect(setup.validator.condition.conditionType).toBe('AccountAvailability');
        expect(setup.validator.condition.category).toBe(ConditionCategory.Async);
    });
});

// Verify the Promise represents handler completion and receives only the host and manager.
describe('AsyncValidator.validate async completion', () => {
    test('Waits for the handler and returns its NoMatch issue with the host and manager', async () => {
        let receivedHost: unknown;
        let receivedManager: unknown;
// THIS TEST NEEDS TO BE REVISED TO SUPPORT AbortSignal as the third argument to the handler.
//        let extraArguments: unknown[] = [];
        let complete!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidator((host, manager, ...extra) => {
            receivedHost = host;
            receivedManager = manager;
//            extraArguments = extra;
            return new Promise(resolve => { complete = resolve; });
        });

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
//        expect(extraArguments).toEqual([]);

        complete({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Already taken'
        });
        let result = await observed;
        expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.NoMatch);
        expect(result.issueFound).toEqual(expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck',
            valueHostName: 'Field1',
            errorCode: 'NameTaken',
            errorMessage: 'Already taken',
            summaryMessage: 'Already taken',
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

    test('Allows a handler to use application context captured in a closure', async () => {
        let context = Object.freeze({ isAvailable: async () => false });
        let setup = setupValidator(async () => await context.isAvailable()
            ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
            : {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken',
                errorMessage: 'Already taken'
            });

        let result = await setup.validator.validate({});
        expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.NoMatch);
        expect(result.issueFound).toEqual(expect.objectContaining({ errorCode: 'NameTaken' }));
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Allows a handler to retrieve shared application context from manager metadata', async () => {
        let context = Object.freeze({ available: true });
        let receivedContext: unknown;
        let setup = setupValidator(async (host, manager) => {
            receivedContext = manager.getMetadata('app.availability');
            if (receivedContext !== context)
                return {
                    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                    failedToResolve: new Error('Availability service is not configured')
                };
            return {
                conditionEvaluateResult: (receivedContext as any).available
                    ? ConditionEvaluateResult.Match
                    : ConditionEvaluateResult.Undetermined
            };
        });
        setup.manager.setMetadata('app.availability', context);

        await expect(setup.validator.validate({})).resolves.toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Match,
            issueFound: null
        });
        expect(receivedContext).toBe(context);
        expect(setup.logger.entryCount).toBe(0);
    });
});

// Handler-provided severities control the issue severity and blocking flag.
describe('AsyncValidator.validate severity', () => {
    test.each([
        { severity: ValidationSeverity.Warning, doNotSave: false },
        { severity: ValidationSeverity.Severe, doNotSave: true }
    ])('Returns severity $severity with doNotSave=$doNotSave', async ({ severity, doNotSave }) => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Already taken',
            severity
        }));

        let result = await setup.validator.validate({});
        expect(result.issueFound).toEqual(expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck',
            errorCode: 'NameTaken',
            severity,
            doNotSave
        }));
        expect(setup.logger.entryCount).toBe(0);
    });
});

// Localized messages use the issue code, are HTML-encoded, then have tokens resolved.
describe('AsyncValidator.validate message resolution', () => {
    test('Uses the issue code and data type to select a localized template before encoding and resolving tokens', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Handler fallback'
        }));
        let messages = setup.services.errorMessagesService as ErrorMessagesService;
        messages.registerErrorMessage('NameTaken', LookupKey.String, {
            en: '<strong>{Label}</strong> is unavailable'
        });
        messages.registerErrorMessage('AvailabilityCheck', null, {
            en: 'The validator identity is not the issue code'
        });

        let result = await setup.validator.validate({});

        expect(result.issueFound).toEqual(expect.objectContaining({
            errorCode: 'NameTaken',
            errorMessage: '&lt;strong&gt;Label1&lt;/strong&gt; is unavailable',
            summaryMessage: '&lt;strong&gt;Label1&lt;/strong&gt; is unavailable'
        }));
        expect(setup.logger.entryCount).toBe(0);
    });

    test('HTML-encodes and resolves tokens in the handler fallback message', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: '<strong>{Label}</strong> is unavailable'
        }));

        let result = await setup.validator.validate({});

        expect(result.issueFound).toEqual(expect.objectContaining({
            errorMessage: '&lt;strong&gt;Label1&lt;/strong&gt; is unavailable',
            summaryMessage: '&lt;strong&gt;Label1&lt;/strong&gt; is unavailable'
        }));
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

    test('Rejects with a CodingError when a NoMatch result has no error code', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorMessage: 'Missing code'
        }));

        await expect(setup.validator.validate({})).rejects.toThrow(CodingError);
        expect(setup.logger.entryCount).toBe(0);
    });
});

// Async validators discover only their declared dependencies and swap issues by identity.
describe('AsyncValidator dependencies and external issue swaps', () => {
    test('Adds each configured dependency name to the supplied collection', () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        }), { dependencyValueHostNames: ['Field2', 'Field3', 'Field2'] });
        let names = new Set<string>();

        expect(() => setup.validator.gatherValueHostNames(names, setup.manager)).not.toThrow();
        expect(names).toEqual(new Set(['Field2', 'Field3']));
    });

    test('Leaves the collection unchanged when no dependencies are configured', () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        }));
        let names = new Set<string>(['Existing']);

        setup.validator.gatherValueHostNames(names, setup.manager);

        expect(names).toEqual(new Set(['Existing']));
    });

    test('Swaps an issue only when its async identity matches and preserves its display data', () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        }));
        let incoming: IssueFound = {
            asyncIdentity: 'AvailabilityCheck',
            errorCode: 'NameReserved',
            errorMessage: 'Already reserved',
            summaryMessage: 'Reserved',
            severity: ValidationSeverity.Warning,
            doNotSave: false
        };

        let result = setup.validator.tryValidatorSwap(incoming);

        expect(result).toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: expect.objectContaining({
                asyncIdentity: 'AvailabilityCheck',
                valueHostName: 'Field1',
                errorCode: 'NameReserved',
                errorMessage: 'Already reserved',
                summaryMessage: 'Reserved',
                severity: ValidationSeverity.Warning,
                doNotSave: false
            })
        });
        expect(setup.validator.tryValidatorSwap({
            ...incoming,
            asyncIdentity: 'AnotherCheck'
        })).toBeNull();
        expect(setup.validator.tryValidatorSwap({
            errorCode: 'NameReserved',
            errorMessage: 'Already reserved'
        })).toBeNull();
    });
});

// Results arriving after disposal must not be converted through cleared validator state.
describe('AsyncValidator.dispose with pending handlers', () => {
    test('Returns a skipped result when a pending handler resolves after disposal', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidator(() => new Promise(resolve => { finish = resolve; }));
        let pending = setup.validator.validate({});

        setup.validator.dispose();
        finish({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        await expect(pending).resolves.toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        });
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Still logs a resolved operational failure after disposal', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidator(() => new Promise(resolve => { finish = resolve; }));
        let failure = new Error('Late service failure');
        let pending = setup.validator.validate({});

        setup.validator.dispose();
        finish({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: failure
        });

        await expect(pending).resolves.toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        });
        expect(setup.logger.captured).toHaveLength(1);
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error,
            category: LoggingCategory.Exception,
            message: 'Late service failure',
            feature: 'Validator',
            type: 'AsyncValidator',
            identity: ['Field1', 'AvailabilityCheck']
        }));
    });

    test('Preserves handler rejection details when the validator is disposed while pending', async () => {
        let reject!: (error: Error) => void;
        let failure = new Error('Late handler rejection');
        let setup = setupValidator(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
        let pending = setup.validator.validate({});

        setup.validator.dispose();
        reject(failure);

        await expect(pending).rejects.toMatchObject({
            message: expect.stringContaining('AvailabilityCheck'),
            cause: failure
        });
        expect(setup.logger.entryCount).toBe(0);
    });
});
