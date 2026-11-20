import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { AsyncValidatorConfig, AsyncValidatorEvaluateHandler, AsyncValidatorEvaluationResult, RestartWhenPending } from '../../src/Interfaces/AsyncValidator';
import { ConditionCategory, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggingService';
import { IssueFound, ValidateOptions, ValidationSeverity } from '../../src/Interfaces/Validation';
import { ValidatorType } from '../../src/Interfaces/Validator';
import { ErrorMessagesService } from '../../src/Services/ErrorMessagesService';
import { TestingLoggingService } from '../../src/Support/TestingLoggingService';
import { CodingError } from '../../src/Utilities/ErrorHandling';
import { AsyncValidator } from '../../src/Validation/AsyncValidator';
import { MockJivsServices, MockValueHostsManager } from '../TestSupport/mocks';

class ThrowingErrorLoggingService extends TestingLoggingService {
    public errorReceived: Error | null = null;

    constructor(private readonly loggingFailure: Error) {
        super();
    }

    public override logError(error: Error): void {
        this.errorReceived = error;
        throw this.loggingFailure;
    }
}

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

// Verify the Promise represents handler completion and supplies the host, manager, and cancellation signal.
describe('AsyncValidator.validate async completion', () => {
    test('Waits for the handler and returns its NoMatch issue with the host and manager', async () => {
        let receivedHost: unknown;
        let receivedManager: unknown;
        let receivedSignal!: AbortSignal;
        let complete!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidator((host, manager, signal) => {
            receivedHost = host;
            receivedManager = manager;
            receivedSignal = signal;
            return new Promise(resolve => { complete = resolve; });
        });

        let pending = setup.validator.validate({});
        let context = setup.validator.pendingContext!;
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
        expect(receivedSignal).toBe(context.abortController.signal);
        expect(receivedSignal.aborted).toBe(false);

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

    test('Returns Undetermined without an issue when the handler cannot evaluate', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined
        }));

        await expect(setup.validator.validate({})).resolves.toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null
        });
        expect(setup.validator.pendingContext).toBeNull();
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
    test('Rejects missing options and validation after disposal', () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        }));

        expect(() => setup.validator.validate(null!)).toThrow(CodingError);
        setup.validator.dispose();
        expect(() => setup.validator.validate({})).toThrow(/AsyncValidator has been disposed/);
        expect(setup.logger.entryCount).toBe(0);
    });

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

    test('Logs and returns a blocking failure when the handler rejects or throws', async () => {
        let failure = new Error('Unexpected handler failure');
        let handlers: AsyncValidatorEvaluateHandler[] = [
            () => Promise.reject(failure),
            () => { throw failure; }
        ];
        for (let handler of handlers) {
            let setup = setupValidator(handler);
            let result = await setup.validator.validate({});
            expect(result.failedToResolve).toBe(failure);
            expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);
            expect(setup.logger.captured).toHaveLength(1);
            expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
                level: LoggingLevel.Error, category: LoggingCategory.Exception,
                message: 'Unexpected handler failure', type: 'AsyncValidator'
            }));
        }
    });

    test('Logs and returns a failure for a malformed NoMatch', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: ''
        }));
        let result = await setup.validator.validate({});
        expect(result.failedToResolve).toBeInstanceOf(CodingError);
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error, category: LoggingCategory.Exception,
            message: expect.stringContaining('must return an error message')
        }));
    });

    test('Logs and returns a failure when a NoMatch result has no error code', async () => {
        let setup = setupValidator(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorMessage: 'Missing code'
        }));

        let result = await setup.validator.validate({});
        expect(result.failedToResolve).toBeInstanceOf(CodingError);
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error, category: LoggingCategory.Exception,
            message: expect.stringContaining('must return an error code')
        }));
    });

    test.each([
        null!,
        { conditionEvaluateResult: 999 as ConditionEvaluateResult }
    ])('Logs and returns a failure for an invalid handler result %#', async handlerResult => {
        let setup = setupValidator(async () => handlerResult);

        let result = await setup.validator.validate({});
        expect(result).toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            failedToResolve: expect.any(CodingError)
        });
        expect(setup.validator.pendingContext).toBeNull();
        expect(setup.logger.captured).toHaveLength(1);
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error,
            category: LoggingCategory.Exception,
            message: 'Invalid async validator result',
            feature: 'Validator',
            type: 'AsyncValidator',
            identity: ['Field1', 'AvailabilityCheck']
        }));
    });

    test('Converts a non-Error rejection to a logged failure', async () => {
        let setup = setupValidator(() => Promise.reject('Service unavailable'));

        let result = await setup.validator.validate({});
        expect(result.failedToResolve).toBeInstanceOf(Error);
        expect(result.failedToResolve?.message).toBe('Service unavailable');
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

    test('Settles and reports the original failure when the logging service throws', async () => {
        let failure = new Error('Handler failed');
        let loggingFailure = new Error('Logger failed');
        let logger = new ThrowingErrorLoggingService(loggingFailure);
        let setup = setupValidator(() => Promise.reject(failure));
        setup.services.loggingService = logger;
        let consoleEntries: unknown[][] = [];
        let originalConsoleError = console.error;
        console.error = (...args: unknown[]) => { consoleEntries.push(args); };

        try {
            let result = await setup.validator.validate({});
            expect(result.failedToResolve).toBe(failure);
            expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);
            expect(result.issueFound).toBeNull();
            expect(logger.errorReceived).toBe(failure);
            expect(consoleEntries).toEqual([
                ['Failed to log async validation failure', failure, loggingFailure]
            ]);
            expect(setup.validator.pendingContext).toBeNull();
        }
        finally {
            console.error = originalConsoleError;
        }
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
        await new Promise(resolve => setTimeout(resolve, 0));
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

    test('Logs unexpected handler rejection after disposal without changing the skipped result', async () => {
        let reject!: (error: Error) => void;
        let failure = new Error('Late handler rejection');
        let setup = setupValidator(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
        let pending = setup.validator.validate({});

        setup.validator.dispose();
        reject(failure);

        await expect(pending).resolves.toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error, category: LoggingCategory.Exception,
            message: 'Late handler rejection'
        }));
    });
});

// Pending operations must be reusable only while their declared inputs remain current.
describe('AsyncValidator pending operation policies', () => {
    test('Does not reuse pending work for disabled, preliminary, or during-edit validation', async () => {
        let enabled = true;
        let setup = setupValidator(() => new Promise(() => {}), { enabled: () => enabled });
        let pending = setup.validator.validate({});

        for (let options of [{ preliminary: true }, { duringEdit: true }]) {
            expect(setup.validator.isPendingResponsible(options)).toBe(false);
            expect(setup.validator.validate(options)).toMatchObject({ skipped: true });
        }
        enabled = false;
        expect(setup.validator.isPendingResponsible({})).toBe(false);
        expect(setup.validator.validate({})).toMatchObject({ skipped: true });
        setup.validator.dispose();
        await expect(pending).resolves.toMatchObject({ skipped: true });
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Reuses the pending operation and restarts it when the owner changes', async () => {
        let calls = 0;
        let setup = setupValidator(() => {
            calls++;
            return new Promise(() => {});
        });
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(false);
        let first = setup.validator.validate({});
        let context = setup.validator.pendingContext!;
        expect(setup.validator.validate({})).toBe(first);
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(true);
        expect(calls).toBe(1);
        setup.valueHost.changeCounter++;
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(false);
        await expect(first).resolves.toMatchObject({ skipped: true });
        expect(context.abortController.signal.aborted).toBe(true);
        let second = setup.validator.validate({});
        expect(calls).toBe(2);
        setup.validator.dispose();
        await expect(second).resolves.toMatchObject({ skipped: true });
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Always restarts, while model-level skip cancels without starting new work', async () => {
        let calls = 0;
        let setup = setupValidator(() => {
            calls++;
            return new Promise(() => {});
        }, { restartWhenPending: RestartWhenPending.Always, skipOnModelLevelValidation: true });
        let first = setup.validator.validate({});
        expect(setup.validator.isPendingResponsible({})).toBe(false);
        await expect(first).resolves.toMatchObject({ skipped: true });
        let second = setup.validator.validate({});
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(false);
        await expect(second).resolves.toMatchObject({ skipped: true });
        expect(setup.validator.validate({ isModelLevel: true })).toMatchObject({ skipped: true });
        expect(calls).toBe(2);
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Detects a changed dependency and its replacement when choosing pending work', async () => {
        let setup = setupValidator(() => new Promise(() => {}), {
            dependencyValueHostNames: ['Field2']
        });
        let dependency = setup.manager.addMockFieldValueHost('Field2', LookupKey.String, 'Other');
        let first = setup.validator.validate({});
        dependency.changeCounter++;
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(false);
        let second = setup.validator.validate({});
        expect(second).not.toBe(first);
        await expect(first).resolves.toMatchObject({ skipped: true });

        setup.manager.addMockFieldValueHost('Field2', LookupKey.String, 'Replacement');
        dependency.getName = () => { throw new Error('Disposed host'); };
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(false);
        await expect(second).resolves.toMatchObject({ skipped: true });
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Keeps the context Promise accessible after it is disposed', async () => {
        let setup = setupValidator(() => new Promise(() => {}));
        let pending = setup.validator.validate({});
        let context = setup.validator.pendingContext!;
        context.dispose();
        expect(context.promise).toBe(pending);
        await expect(context.promise).resolves.toMatchObject({ skipped: true });
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Model-level skip takes precedence over reusing unchanged pending work', async () => {
        let calls = 0;
        let setup = setupValidator(() => {
            calls++;
            return new Promise(() => {});
        }, { skipOnModelLevelValidation: true });
        expect(setup.validator.validate({ isModelLevel: true })).toMatchObject({ skipped: true });
        let pending = setup.validator.validate({});
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(false);
        await expect(pending).resolves.toMatchObject({ skipped: true });
        expect(setup.validator.validate({ isModelLevel: true })).toMatchObject({ skipped: true });
        expect(calls).toBe(1);
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Cancellation cleanup does not clear a replacement started by an abort listener', async () => {
        let setup = setupValidator(() => new Promise(() => {}), {
            restartWhenPending: RestartWhenPending.Always
        });
        let first = setup.validator.validate({});
        let firstContext = setup.validator.pendingContext!;
        let replacement: Promise<unknown> | undefined;
        firstContext.abortController.signal.addEventListener('abort', () => {
            replacement = Promise.resolve(setup.validator.validate({}));
        });
        expect(setup.validator.isPendingResponsible({ isModelLevel: true })).toBe(false);
        expect(setup.validator.pendingContext).not.toBeNull();
        expect(setup.validator.pendingContext).not.toBe(firstContext);
        await expect(first).resolves.toMatchObject({ skipped: true });
        setup.validator.dispose();
        await expect(replacement).resolves.toMatchObject({ skipped: true });
        expect(setup.logger.entryCount).toBe(0);
    });

    test('A cancelled handler resolving late cannot clear or change its replacement', async () => {
        let completions: Array<(result: AsyncValidatorEvaluationResult) => void> = [];
        let setup = setupValidator(() => new Promise(resolve => { completions.push(resolve); }), {
            restartWhenPending: RestartWhenPending.Always
        });
        let first = setup.validator.validate({});
        expect(setup.validator.isPendingResponsible({})).toBe(false);
        let second = setup.validator.validate({});
        let replacement = setup.validator.pendingContext;

        await expect(first).resolves.toMatchObject({ skipped: true });
        completions[0]({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'Stale',
            errorMessage: 'Stale result'
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(setup.validator.pendingContext).toBe(replacement);
        expect(setup.validator.validate({})).toBe(second);
        completions[1]({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await expect(second).resolves.toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Match,
            issueFound: null
        });
        expect(setup.validator.pendingContext).toBeNull();
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Does not log the expected rejection from an aborted handler', async () => {
        let setup = setupValidator((_host, _manager, signal) =>
            new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason));
            }));
        let pending = setup.validator.validate({});
        setup.validator.dispose();
        await expect(pending).resolves.toMatchObject({ skipped: true });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(setup.logger.entryCount).toBe(0);
    });

    test.each([RestartWhenPending.WhenInputsChanged, RestartWhenPending.Always])(
        'Makes the same pending Promise available during synchronous reentry with policy %s', async policy => {
        let reentrant: unknown;
        let setup = setupValidator(() => {
            reentrant = setup.validator.validate({});
            return Promise.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        }, { restartWhenPending: policy });
        let pending = setup.validator.validate({});
        expect(reentrant).toBe(pending);
        await expect(pending).resolves.toMatchObject({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        expect(setup.validator.pendingContext).toBeNull();
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Times out an uncooperative handler, logs the failure, and aborts its signal', async () => {
        let signal!: AbortSignal;
        let setup = setupValidator((_host, _manager, abortSignal) => {
            signal = abortSignal;
            return new Promise(() => {});
        }, { timeout: 10 });
        let result = await setup.validator.validate({});
        expect(result.failedToResolve?.message).toBe('Async validation timed out');
        expect(signal.aborted).toBe(true);
        expect(setup.validator.pendingContext).toBeNull();
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error, category: LoggingCategory.Exception,
            message: 'Async validation timed out', feature: 'Validator',
            type: 'AsyncValidator', identity: ['Field1', 'AvailabilityCheck']
        }));
        expect(setup.logger.entryCount).toBe(1);
    });

    test('Uses the global timeout when the validator has no timeout override', async () => {
        let setup = setupValidator(() => new Promise(() => {}));
        setup.services.settings.asyncValidation.timeout = 10;

        let result = await setup.validator.validate({});
        expect(result.failedToResolve?.message).toBe('Async validation timed out');
        expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);
        expect(result.issueFound).toBeNull();
        expect(setup.validator.pendingContext).toBeNull();
        expect(setup.logger.captured).toHaveLength(1);
        expect(setup.logger.captured[0]).toEqual(expect.objectContaining({
            level: LoggingLevel.Error, category: LoggingCategory.Exception,
            message: 'Async validation timed out', feature: 'Validator',
            type: 'AsyncValidator', identity: ['Field1', 'AvailabilityCheck']
        }));
    });

    test('Rejects an unresolvable declared dependency before starting the handler', () => {
        let calls = 0;
        let setup = setupValidator(async () => {
            calls++;
            return { conditionEvaluateResult: ConditionEvaluateResult.Match };
        }, { dependencyValueHostNames: ['Missing'] });
        expect(() => setup.validator.validate({})).toThrow(/dependency "Missing" was not found/);
        expect(calls).toBe(0);
        expect(setup.validator.pendingContext).toBeNull();
        expect(setup.logger.entryCount).toBe(0);
    });

    test('Defaults zero and negative timeout overrides to 5000 ms', async () => {
        let setups = [0, -1].map(timeout => {
            let setup = setupValidator(() => new Promise(() => {}), { timeout });
            setup.services.settings.asyncValidation.timeout = 10;
            return setup;
        });
        let started = performance.now();

        try {
            // Start both timers together so the fallback can be checked without two five-second waits.
            let results = await Promise.all(setups.map(setup =>
                Promise.resolve(setup.validator.validate({})).then(result => ({
                    result,
                    elapsed: performance.now() - started
                }))
            ));
            for (let [index, { result, elapsed }] of results.entries()) {
                expect(elapsed).toBeGreaterThanOrEqual(4900);
                expect(result.failedToResolve?.message).toBe('Async validation timed out');
                expect(result.conditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);
                expect(result.issueFound).toBeNull();
                expect(setups[index].logger.captured).toHaveLength(1);
                expect(setups[index].logger.captured[0]).toEqual(expect.objectContaining({
                    level: LoggingLevel.Error, category: LoggingCategory.Exception,
                    message: 'Async validation timed out', feature: 'Validator',
                    type: 'AsyncValidator', identity: ['Field1', 'AvailabilityCheck']
                }));
            }
        }
        finally {
            for (let setup of setups)
                setup.validator.dispose();
        }
    }, 15000);

});
