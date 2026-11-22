import { ConditionCategory, ConditionEvaluateResult, ICondition } from '../../src/Interfaces/Conditions';
import { IAsyncValidator, IPendingContext } from '../../src/Interfaces/AsyncValidator';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggingService';
import { ValidateOptions, ValidationSeverity, ValidationStatus } from '../../src/Interfaces/Validation';
import { IValidator, ValidatorValidateResult } from '../../src/Interfaces/Validator';
import { ValidatorsValueHostBaseInstanceState } from '../../src/Interfaces/ValidatorsValueHostBase';
import { TestingLoggingService } from '../../src/Support/TestingLoggingService';
import { CodingError } from '../../src/Utilities/ErrorHandling';
import { LoggingFacade } from '../../src/Utilities/LoggingFacade';
import { ValueHostValidationRunner, ValidatorValueHostAccessor } from '../../src/ValueHosts/ValueHostValidationRunner';

class TestValidator implements IValidator {
    public readonly conditionType = 'Test';
    public readonly condition: ICondition;
    public calls = 0;

    constructor(
        public readonly errorCode: string,
        private readonly action: () => ValidatorValidateResult | Promise<ValidatorValidateResult>,
        category: ConditionCategory = ConditionCategory.Undetermined
    ) {
        this.condition = {
            conditionType: this.conditionType,
            category,
            evaluate: () => ConditionEvaluateResult.Undetermined
        };
    }

    public validate(): ValidatorValidateResult | Promise<ValidatorValidateResult> {
        this.calls++;
        return this.action();
    }
    public setEnabled(): void {}
    public tryValidatorSwap(): ValidatorValidateResult | null { return null; }
    public getValuesForTokens(): [] { return []; }
    public gatherValueHostNames(): void {}
    public dispose(): void {}
}

class TestAsyncValidator extends TestValidator implements IAsyncValidator {
    public pendingContext: IPendingContext | null = null;
    public responsible = false;
    public onCheck: (() => void) | null = null;

    constructor(errorCode: string, action: () => ValidatorValidateResult | Promise<ValidatorValidateResult>) {
        super(errorCode, action, ConditionCategory.Async);
    }

    public isPendingResponsible(): boolean {
        this.onCheck?.();
        return this.responsible;
    }
}

class TestRunHost implements ValidatorValueHostAccessor<ValidatorsValueHostBaseInstanceState> {
    public state: ValidatorsValueHostBaseInstanceState = {
        name: 'Field1', value: null, status: ValidationStatus.NotAttempted, issuesFound: null
    };
    public generation = 1;
    public validators: IValidator[] = [];
    public notifications = 0;
    public validatorError: Error | null = null;
    public onGetValidators: (() => void) | null = null;
    public onUpdate: (() => void) | null = null;
    public onUpdated: (() => void) | null = null;
    public onNotify: (() => void) | null = null;

    constructor(public logger: LoggingFacade) {}

    public getState(): ValidatorsValueHostBaseInstanceState { return this.state; }
    public getLogger(): LoggingFacade { return this.logger; }
    public getGeneration(): number { return this.generation; }
    public invalidateGeneration(): void { this.generation++; }
    public getValidators(): IValidator[] {
        this.onGetValidators?.();
        if (this.validatorError)
            throw this.validatorError;
        return this.validators;
    }
    public updateState(updater: (state: ValidatorsValueHostBaseInstanceState) => ValidatorsValueHostBaseInstanceState): boolean {
        this.onUpdate?.();
        let next = updater({ ...this.state });
        let changed = JSON.stringify(next) !== JSON.stringify(this.state);
        this.state = next;
        if (changed)
            this.onUpdated?.();
        return changed;
    }
    public setStatus(state: ValidatorsValueHostBaseInstanceState, status: ValidationStatus): void {
        if (status === ValidationStatus.NeedsValidation) {
            if (state.status !== ValidationStatus.NeedsValidation)
                state.lastStatus = state.status;
        }
        else
            delete state.lastStatus;
        state.status = status;
    }
    public notify(): void {
        this.notifications++;
        this.onNotify?.();
    }
}

class Publicify_ValueHostValidationRunner extends ValueHostValidationRunner<ValidatorsValueHostBaseInstanceState> {
    public publicify_processValidatorResult(result: ValidatorValidateResult, validator: IValidator): boolean {
        return super.processValidatorResult(result, validator);
    }

    public publicify_notifyAsyncStateChanged(): void {
        super.notifyAsyncStateChanged();
    }

    public publicify_logResult(): void {
        super.logResult();
    }
}

/** Creates an isolated run with a recording host, logger, and optional initial state. */
function setup(options: ValidateOptions = {}, initialState: Partial<ValidatorsValueHostBaseInstanceState> = {}) {
    let logging = new TestingLoggingService(LoggingLevel.Debug);
    let logger = new LoggingFacade(logging, 'Validation', 'ValueHostValidationRunner', 'Field1');
    let host = new TestRunHost(logger);
    Object.assign(host.state, initialState);
    let testItem = new Publicify_ValueHostValidationRunner(host, options, host.generation);
    return { testItem, host, logger, logging };
}

function match(): ValidatorValidateResult {
    return { conditionEvaluateResult: ConditionEvaluateResult.Match, issueFound: null };
}

function deferredResult() {
    let resolve!: (result: ValidatorValidateResult) => void;
    let reject!: (error: Error) => void;
    let promise = new Promise<ValidatorValidateResult>((finish, fail) => {
        resolve = finish;
        reject = fail;
    });
    return { promise, resolve, reject };
}

/** Creates a responsible async validator for an explicitly controlled pending result. */
function pendingValidator(identity: string, deferred: ReturnType<typeof deferredResult>): TestAsyncValidator {
    let validator = new TestAsyncValidator(identity, () => deferred.promise);
    validator.responsible = true;
    validator.pendingContext = {
        promise: deferred.promise,
        abortController: new AbortController(),
        inputChanged: () => false,
        dispose: () => {}
    };
    return validator;
}

// Result processing determines both the accumulated status and whether validation should stop.
describe('ValueHostValidationRunner.processValidatorResult', () => {
    test('Matches, warnings, and severe issues accumulate with the correct stop decisions', () => {
        let { testItem, logging } = setup();
        let validator = new TestValidator('a', match);
        expect(testItem.publicify_processValidatorResult(match(), validator)).toBe(false);
        expect(testItem.publicify_processValidatorResult({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorMessage: 'Warning', severity: ValidationSeverity.Warning }
        }, validator)).toBe(false);
        expect(testItem.publicify_processValidatorResult({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorMessage: 'Severe', severity: ValidationSeverity.Severe }
        }, validator)).toBe(true);

        let result = testItem.execute()!;
        expect(result.status).toBe(ValidationStatus.Invalid);
        expect(result.issuesFound?.map(issue => issue.doNotSave)).toEqual([false, true]);
        expect(logging.containsLog('Validation result: Invalid', LoggingLevel.Info, LoggingCategory.Result,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });
});

// Async notification must use the current generation and log callback exceptions.
describe('ValueHostValidationRunner.notifyAsyncStateChanged', () => {
    test('Only a current run notifies, and a notification exception is logged', () => {
        let { testItem, host, logging } = setup();
        testItem.publicify_notifyAsyncStateChanged();
        expect(host.notifications).toBe(1);
        host.onNotify = () => { throw new Error('Callback failed'); };
        expect(() => testItem.publicify_notifyAsyncStateChanged()).not.toThrow();
        expect(host.notifications).toBe(2);
        expect(logging.containsLog('Async validation notification failed: Callback failed',
            LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);

        host.generation++;
        testItem.publicify_notifyAsyncStateChanged();
        expect(host.notifications).toBe(2);
        expect(logging.captured.filter(entry => entry.level === LoggingLevel.Error)).toHaveLength(1);
    });
});

// Result logging belongs to the runner and preserves the host logger's metadata.
describe('ValueHostValidationRunner.logResult', () => {
    test('An undetermined result is logged through the accessor with the expected details', () => {
        let { testItem, logging } = setup();
        testItem.publicify_logResult();
        let entry = logging.findMessage('Validation result: Undetermined Issues found:none',
            LoggingLevel.Info, LoggingCategory.Result,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' });
        expect(entry).not.toBeNull();
        expect(entry?.data).toBeUndefined();
    });

    test('A result with issues is formatted and logged', () => {
        let { testItem, logging } = setup();
        let validator = new TestValidator('a', match);
        testItem.publicify_processValidatorResult({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorMessage: 'Invalid', severity: ValidationSeverity.Error }
        }, validator);
        testItem.publicify_logResult();
        expect(logging.captured).toHaveLength(1);
        expect(logging.captured[0]).toMatchObject({
            message: 'Validation result: Invalid Issues found:[{"errorMessage":"Invalid","severity":1,"doNotSave":true}]',
            level: LoggingLevel.Info,
            category: LoggingCategory.Result,
            type: 'ValueHostValidationRunner',
            feature: 'Validation',
            identity: 'Field1'
        });
    });
});

// Synchronous results must be combined and severe issues must stop later validators.
describe('ValueHostValidationRunner.execute synchronous validators', () => {
    test('A warning is retained and a severe issue stops subsequent validators', () => {
        let { testItem, host, logging } = setup();
        let warning = new TestValidator('warning', () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorCode: 'warning', errorMessage: 'Warning', severity: ValidationSeverity.Warning }
        }));
        let severe = new TestValidator('severe', () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorCode: 'severe', errorMessage: 'Severe', severity: ValidationSeverity.Severe }
        }));
        let later = new TestValidator('later', match);
        host.validators = [warning, severe, later];

        let result = testItem.execute();
        expect(result?.status).toBe(ValidationStatus.Invalid);
        expect(result?.issuesFound?.map(issue => issue.doNotSave)).toEqual([false, true]);
        expect(host.state.status).toBe(ValidationStatus.Invalid);
        expect(host.notifications).toBe(1);
        expect(later.calls).toBe(0);
        expect(logging.containsLog('Validation result: Invalid', LoggingLevel.Info, LoggingCategory.Result,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// Validator errors must retain the existing catch boundary and cleanup semantics.
describe('ValueHostValidationRunner.execute validator errors', () => {
    test('A validator creation error is logged and leaves the run undetermined', () => {
        let { testItem, host, logging } = setup();
        host.validatorError = new Error('Cannot create validators');
        expect(testItem.execute()).toBeNull();
        expect(host.state.status).toBe(ValidationStatus.Undetermined);
        expect(logging.containsLog('Validation result: Undetermined Issues found:none', LoggingLevel.Info,
            LoggingCategory.Result, { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
        expect(logging.containsLog('Cannot create validators', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });

    test('A severe error invalidates pending work, cleans up the host, and is rethrown', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        let error = new CodingError('Severe validator error');
        host.state.status = ValidationStatus.Invalid;
        host.state.corrected = true;
        host.validators = [
            new TestValidator('pending', () => deferred.promise),
            new TestValidator('throws', () => { throw error; })
        ];
        expect(() => testItem.execute()).toThrow(error);
        expect(host.generation).toBe(2);
        expect(host.state.status).toBe(ValidationStatus.NeedsValidation);
        expect(host.state.corrected).toBeUndefined();
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(host.notifications).toBe(1);
        expect(logging.containsLog('Severe validator error', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
        expect(logging.containsLog('Validation result: Undetermined', LoggingLevel.Info, LoggingCategory.Result,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);

        deferred.resolve(match());
        await deferred.promise;
        await Promise.resolve();
        expect(host.state.status).toBe(ValidationStatus.NeedsValidation);
        expect(host.notifications).toBe(1);
    });

    test('A missing logging service does not prevent an ordinary error from being handled', () => {
        let logger = new LoggingFacade(null, 'Validation', 'ValueHostValidationRunner', 'Field1');
        let host = new TestRunHost(logger);
        let testItem = new ValueHostValidationRunner(host, {}, host.generation);
        host.validatorError = new Error('Cannot create validators');
        expect(testItem.execute()).toBeNull();
        expect(host.state.status).toBe(ValidationStatus.Undetermined);
    });
});

// Separate runs share a host, but an obsolete completion must not publish over a newer run.
describe('ValueHostValidationRunner.execute concurrent runs', () => {
    test('Result logging uses the current host logger while late errors use the captured logger', async () => {
        let { testItem, host, logging } = setup();
        let replacementLogging = new TestingLoggingService(LoggingLevel.Debug);
        let replacementLogger = new LoggingFacade(replacementLogging, 'Replacement', 'ReplacementLogger', 'Field1');
        let deferred = deferredResult();
        host.validators = [new TestValidator('legacy', () => {
            host.logger = replacementLogger;
            return deferred.promise;
        })];

        let result = testItem.execute()!;
        expect(replacementLogging.containsLog('Validation result: Undetermined', LoggingLevel.Info,
            LoggingCategory.Result, { type: 'ReplacementLogger', feature: 'Replacement', identity: 'Field1' })).toBe(true);
        expect(logging.containsLog('Validation result:', LoggingLevel.Info, LoggingCategory.Result)).toBe(false);
        let failure = new Error('Late failure');
        deferred.reject(failure);
        await expect(result.completions![0]).rejects.toBe(failure);
        expect(logging.containsLog('Late failure', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
        expect(replacementLogging.containsLog('Late failure', LoggingLevel.Error, LoggingCategory.Exception)).toBe(false);
    });

    test('A later run publishes its result while the earlier completion is ignored', async () => {
        let { testItem, host, logging } = setup();
        let first = deferredResult();
        let second = deferredResult();
        host.validators = [new TestValidator('first', () => first.promise)];
        let firstResult = testItem.execute()!;
        expect(host.state.asyncProcessing).toBe(true);

        host.generation++;
        host.validators = [new TestValidator('second', () => second.promise)];
        let nextRun = new ValueHostValidationRunner(host, {}, host.generation);
        let secondResult = nextRun.execute()!;
        second.resolve(match());
        await Promise.all(secondResult.completions!);
        expect(secondResult.status).toBe(ValidationStatus.Valid);
        expect(host.state.status).toBe(ValidationStatus.Valid);
        expect(host.state.asyncProcessing).toBeUndefined();
        let notifications = host.notifications;

        first.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorMessage: 'Old issue', severity: ValidationSeverity.Error }
        });

        await Promise.all(firstResult.completions!);
        expect(host.state.status).toBe(ValidationStatus.Valid);
        expect(host.state.issuesFound).toBeNull();
        expect(host.notifications).toBe(notifications);
        expect(logging.captured.filter(entry => entry.category === LoggingCategory.Result)).toHaveLength(2);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A rejected validator completion is logged, publishes failure, and stays rejected', async () => {
        let { testItem, host, logging } = setup();
        let failure = new Error('Promise rejected');
        host.validators = [new TestValidator('async', () => Promise.reject(failure))];
        let result = testItem.execute()!;
        await expect(result.completions![0]).rejects.toBe(failure);
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(host.state.status).toBe(ValidationStatus.Failed);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.containsLog('Promise rejected', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });

    test('Reentrant validation still registers and reports a stale promise rejection', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        let failure = new Error('Obsolete promise rejected');
        host.validators = [new TestValidator('reentrant', () => {
            host.generation++;
            return deferred.promise;
        })];
        let result = testItem.execute()!;
        expect(result.completions).toHaveLength(1);
        expect(host.state.status).toBe(ValidationStatus.NotAttempted);
        deferred.reject(failure);
        await expect(result.completions![0]).rejects.toBe(failure);
        expect(host.state.status).toBe(ValidationStatus.NotAttempted);
        expect(host.notifications).toBe(0);
        expect(logging.containsLog('Obsolete promise rejected', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });
});

// AsyncValidator contexts must be reused or reported as missing without losing completion tracking.
describe('ValueHostValidationRunner.execute asynchronous validator contexts', () => {
    test('A responsible pending validator reuses its context and removes it when settled', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        let validator = new TestAsyncValidator('async', () => match());
        validator.responsible = true;
        validator.pendingContext = {
            promise: deferred.promise,
            abortController: new AbortController(),
            inputChanged: () => false,
            dispose: () => {}
        };
        host.validators = [validator];

        let result = testItem.execute()!;
        expect(validator.calls).toBe(0);
        expect(result.pending).toEqual([validator.pendingContext]);
        expect(host.state.asyncProcessing).toBe(true);
        deferred.resolve(match());
        await Promise.all(result.completions!);
        expect(result.pending).toBeUndefined();
        expect(result.status).toBe(ValidationStatus.Valid);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A promise without its async context is tracked but cannot apply a successful result', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        host.validators = [new TestAsyncValidator('async', () => deferred.promise)];
        let result = testItem.execute()!;
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(host.state.failedAsyncIdentities).toEqual(['async']);
        expect(result.pending).toBeUndefined();
        expect(result.completions).toHaveLength(1);
        expect(logging.containsLog('Async validator "async" returned a Promise without its pending context',
            LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);

        deferred.resolve(match());
        await Promise.all(result.completions!);
        expect(host.state.failedAsyncIdentities).toEqual(['async']);
        expect(host.state.asyncProcessing).toBeUndefined();
    });

    test('A reentrant responsibility check stops the obsolete run before invoking the validator', () => {
        let { testItem, host, logging } = setup();
        let validator = new TestAsyncValidator('async', () => match());
        validator.onCheck = () => { host.generation++; };
        host.validators = [validator];
        expect(testItem.execute()).toBeNull();
        expect(validator.calls).toBe(0);
        expect(host.state.status).toBe(ValidationStatus.NotAttempted);
        expect(host.notifications).toBe(0);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// Synchronous aggregation must respect preliminary validation and corrected state.
describe('ValueHostValidationRunner.execute synchronous state transitions', () => {
    test('A skipped validator does not stop a later validator from matching', () => {
        let { testItem, host, logging } = setup();
        let skipped = new TestValidator('skipped', () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        }));
        let later = new TestValidator('later', match);
        host.validators = [skipped, later];

        expect(testItem.execute()?.status).toBe(ValidationStatus.Valid);
        expect(later.calls).toBe(1);
        expect(host.state.status).toBe(ValidationStatus.Valid);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Preliminary Require failure stops evaluation without publishing its issue', () => {
        let { testItem, host, logging } = setup({ preliminary: true });
        let required = new TestValidator('required', () => ({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorMessage: 'Required', severity: ValidationSeverity.Error }
        }), ConditionCategory.Require);
        let later = new TestValidator('later', match);
        host.validators = [required, later];

        expect(testItem.execute()).toBeNull();
        expect(required.calls).toBe(1);
        expect(later.calls).toBe(0);
        expect(host.state.status).toBe(ValidationStatus.Undetermined);
        expect(host.state.issuesFound).toBeNull();
        expect(logging.containsLog('Validation result: Undetermined Issues found:none', LoggingLevel.Info,
            LoggingCategory.Result, { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A synchronous match after an invalid edit sets corrected and saves the validation group', () => {
        let { testItem, host, logging } = setup({ group: 'submit' }, {
            status: ValidationStatus.NeedsValidation,
            lastStatus: ValidationStatus.Invalid
        });
        host.validators = [new TestValidator('valid', match)];

        let result = testItem.execute();
        expect(result?.status).toBe(ValidationStatus.Valid);
        expect(result?.corrected).toBe(true);
        expect(host.state.status).toBe(ValidationStatus.Valid);
        expect(host.state.corrected).toBe(true);
        expect(host.state.lastStatus).toBeUndefined();
        expect(host.state.group).toBe('submit');
        expect(host.notifications).toBe(1);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A warning following an error does not turn an invalid result valid', () => {
        let { testItem, host, logging } = setup();
        host.validators = [
            new TestValidator('error', () => ({
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                issueFound: { errorMessage: 'Error', severity: ValidationSeverity.Error }
            })),
            new TestValidator('warning', () => ({
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                issueFound: { errorMessage: 'Warning', severity: ValidationSeverity.Warning }
            }))
        ];

        let result = testItem.execute();
        expect(result?.status).toBe(ValidationStatus.Invalid);
        expect(result?.issuesFound?.map(issue => issue.doNotSave)).toEqual([true, false]);
        expect(host.state.status).toBe(ValidationStatus.Invalid);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// A retry only clears its own retained failure after a definitive result.
describe('ValueHostValidationRunner.execute asynchronous failure recovery', () => {
    test('A skipped last completion clears pending while retaining its earlier failure', async () => {
        let issue = { asyncIdentity: 'a', errorMessage: 'Old failure' };
        let { testItem, host, logging } = setup({}, {
            failedAsyncIdentities: ['a'], issuesFound: [issue]
        });
        let deferred = deferredResult();
        host.validators = [pendingValidator('a', deferred)];
        let result = testItem.execute()!;
        let notifications = host.notifications;
        deferred.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined, issueFound: null, skipped: true });

        await result.completions![0];
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(result.issuesFound).toEqual([issue]);
        expect(host.state.failedAsyncIdentities).toEqual(['a']);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(host.notifications).toBe(notifications + 1);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A failed retry replaces its old issue and keeps other validators failures', async () => {
        let oldA = { asyncIdentity: 'a', errorMessage: 'Old A', severity: ValidationSeverity.Error };
        let oldB = { asyncIdentity: 'b', errorMessage: 'Old B', severity: ValidationSeverity.Error };
        let { testItem, host, logging } = setup({}, {
            status: ValidationStatus.Invalid,
            failedAsyncIdentities: ['a', 'b'],
            issuesFound: [oldA, oldB]
        });
        let deferred = deferredResult();
        host.validators = [pendingValidator('a', deferred)];

        let result = testItem.execute()!;
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(result.issuesFound).toEqual([oldA, oldB]);
        deferred.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: new Error('Retry failed'),
            issueFound: { asyncIdentity: 'a', errorMessage: 'New A', severity: ValidationSeverity.Error }
        });
        await Promise.all(result.completions!);

        expect(result.status).toBe(ValidationStatus.Failed);
        expect(result.issuesFound).toEqual([
            { asyncIdentity: 'a', errorMessage: 'New A', severity: ValidationSeverity.Error, doNotSave: true },
            oldB
        ]);
        expect(host.state.failedAsyncIdentities).toEqual(['a', 'b']);
        expect(host.state.issuesFound).toEqual(result.issuesFound);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Skipped and matched retries retain only the skipped validator failure', async () => {
        let issueA = { asyncIdentity: 'a', errorMessage: 'A', severity: ValidationSeverity.Error };
        let issueB = { asyncIdentity: 'b', errorMessage: 'B', severity: ValidationSeverity.Error };
        let { testItem, host, logging } = setup({}, {
            failedAsyncIdentities: ['a', 'b'],
            issuesFound: [issueA, issueB]
        });
        let first = deferredResult();
        let second = deferredResult();
        host.validators = [pendingValidator('a', first), pendingValidator('b', second)];

        let result = testItem.execute()!;
        first.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined, issueFound: null, skipped: true });
        await result.completions![0];
        expect(host.state.asyncProcessing).toBe(true);
        expect(host.state.failedAsyncIdentities).toEqual(['a', 'b']);
        expect(result.issuesFound).toEqual([issueA, issueB]);

        second.resolve(match());
        await result.completions![1];
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(result.issuesFound).toEqual([issueA]);
        expect(host.state.failedAsyncIdentities).toEqual(['a']);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A definitive warning clears its failure and is nonblocking after recovery', async () => {
        let { testItem, host, logging } = setup({}, {
            failedAsyncIdentities: ['a'],
            issuesFound: [{ asyncIdentity: 'a', errorMessage: 'Old failure' }]
        });
        let deferred = deferredResult();
        host.validators = [pendingValidator('a', deferred)];

        let result = testItem.execute()!;
        deferred.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { asyncIdentity: 'a', errorMessage: 'Warning', severity: ValidationSeverity.Warning }
        });
        await result.completions![0];
        expect(result.status).toBe(ValidationStatus.Valid);
        expect(result.issuesFound).toEqual([
            { asyncIdentity: 'a', errorMessage: 'Warning', severity: ValidationSeverity.Warning, doNotSave: false }
        ]);
        expect(host.state.failedAsyncIdentities).toBeUndefined();
        expect(host.state.status).toBe(ValidationStatus.Valid);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Undetermined completion retains a previous failure and clears pending status', async () => {
        let issue = { asyncIdentity: 'a', errorMessage: 'Old failure' };
        let { testItem, host, logging } = setup({}, {
            failedAsyncIdentities: ['a'], issuesFound: [issue]
        });
        let deferred = deferredResult();
        host.validators = [pendingValidator('a', deferred)];
        let result = testItem.execute()!;
        deferred.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined, issueFound: null });
        await result.completions![0];

        expect(result.status).toBe(ValidationStatus.Failed);
        expect(result.issuesFound).toEqual([issue]);
        expect(host.state.failedAsyncIdentities).toEqual(['a']);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// Errors during async processing must remain observable without confusing callbacks with validator failures.
describe('ValueHostValidationRunner.execute asynchronous processing errors', () => {
    test('An async validator rejection retains its identity and rejects the completion', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        host.validators = [pendingValidator('a', deferred)];
        let result = testItem.execute()!;
        let failure = new Error('Async rejection');
        deferred.reject(failure);
        await expect(result.completions![0]).rejects.toBe(failure);
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(host.state.failedAsyncIdentities).toEqual(['a']);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.containsLog('Async rejection', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });

    test('NoMatch without an issue rejects the completion and records a processing failure', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        host.validators = [pendingValidator('a', deferred)];
        let result = testItem.execute()!;
        deferred.resolve({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, issueFound: null });

        await expect(result.completions![0]).rejects.toThrow('Validator "a" returned NoMatch without an issue');
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(host.state.failedAsyncIdentities).toEqual(['a']);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.containsLog('Validator "a" returned NoMatch without an issue', LoggingLevel.Error,
            LoggingCategory.Exception, { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });

    test('An async notification exception is logged but does not turn a match into a failure', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        host.validators = [pendingValidator('a', deferred)];
        host.onNotify = () => {
            if (host.notifications === 2)
                throw new Error('Notification error');
        };
        let result = testItem.execute()!;
        deferred.resolve(match());

        await expect(result.completions![0]).resolves.toBeUndefined();
        expect(result.status).toBe(ValidationStatus.Valid);
        expect(host.state.status).toBe(ValidationStatus.Valid);
        expect(host.state.failedAsyncIdentities).toBeUndefined();
        expect(logging.containsLog('Async validation notification failed: Notification error', LoggingLevel.Error,
            LoggingCategory.Exception, { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });

    test('Cleanup failure is logged without replacing the original severe error', () => {
        let { testItem, host, logging } = setup();
        let failure = new CodingError('Validator error');
        host.validators = [new TestValidator('throws', () => { throw failure; })];
        host.onUpdate = () => { throw new Error('Cleanup error'); };

        expect(() => testItem.execute()).toThrow(failure);
        expect(host.generation).toBe(2);
        expect(logging.containsLog('Validation result: Undetermined', LoggingLevel.Info, LoggingCategory.Result,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
        expect(logging.containsLog('Validator error', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
        expect(logging.containsLog('Validation cleanup failed: Cleanup error', LoggingLevel.Error, LoggingCategory.Exception,
            { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });
});

// Starting a validator may create a new context or reenter the host.
describe('ValueHostValidationRunner.execute validator startup', () => {
    test('A newly started async validator registers its context and publishes an operational failure', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        let validator: TestAsyncValidator;
        validator = new TestAsyncValidator('a', () => {
            validator.pendingContext = {
                promise: deferred.promise,
                abortController: new AbortController(),
                inputChanged: () => false,
                dispose: () => {}
            };
            return deferred.promise;
        });
        host.validators = [validator];

        let result = testItem.execute()!;
        expect(validator.calls).toBe(1);
        expect(result.pending).toEqual([validator.pendingContext]);
        deferred.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: new Error('Unavailable'),
            issueFound: { asyncIdentity: 'a', errorMessage: 'Unavailable', severity: ValidationSeverity.Error }
        });
        await result.completions![0];

        expect(result.status).toBe(ValidationStatus.Failed);
        expect(result.pending).toBeUndefined();
        expect(result.issuesFound).toEqual([
            { asyncIdentity: 'a', errorMessage: 'Unavailable', severity: ValidationSeverity.Error, doNotSave: true }
        ]);
        expect(host.state.failedAsyncIdentities).toEqual(['a']);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A responsible validator without a pending context raises a severe error and cleans up', () => {
        let { testItem, host, logging } = setup();
        let validator = new TestAsyncValidator('a', match);
        validator.responsible = true;
        host.validators = [validator];

        expect(() => testItem.execute()).toThrow('Responsible validator has no pending context');
        expect(validator.calls).toBe(0);
        expect(host.generation).toBe(2);
        expect(host.state.status).toBe(ValidationStatus.NeedsValidation);
        expect(logging.containsLog('Responsible validator has no pending context', LoggingLevel.Error,
            LoggingCategory.Exception, { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });

    test('Reentry while obtaining validators prevents the obsolete run from invoking them', () => {
        let { testItem, host, logging } = setup();
        let validator = new TestValidator('a', match);
        host.validators = [validator];
        host.onGetValidators = () => { host.generation++; };

        expect(testItem.execute()).toBeNull();
        expect(validator.calls).toBe(0);
        expect(host.state.status).toBe(ValidationStatus.NotAttempted);
        expect(host.notifications).toBe(0);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A synchronous result from a reentrant validator is not published by the obsolete run', () => {
        let { testItem, host, logging } = setup();
        host.validators = [new TestValidator('a', () => {
            host.generation++;
            return match();
        })];
        expect(testItem.execute()).toBeNull();
        expect(host.state.status).toBe(ValidationStatus.NotAttempted);
        expect(host.notifications).toBe(0);
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// Async results must combine without losing blocking issues or misreporting legacy failures.
describe('ValueHostValidationRunner.execute async result aggregation', () => {
    test('A malformed legacy result rejects its completion and reports failure without an identity', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        host.validators = [new TestValidator('legacy', () => deferred.promise)];
        let result = testItem.execute()!;
        deferred.resolve({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, issueFound: null });

        await expect(result.completions![0]).rejects.toThrow('Validator "legacy" returned NoMatch without an issue');
        expect(result.status).toBe(ValidationStatus.Failed);
        expect(host.state.status).toBe(ValidationStatus.Failed);
        expect(host.state.failedAsyncIdentities).toBeUndefined();
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.containsLog('Validator "legacy" returned NoMatch without an issue', LoggingLevel.Error,
            LoggingCategory.Exception, { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
    });

    // State publication can reenter validation before the old run sends a notification.
    describe('ValueHostValidationRunner.execute reentrant async publication', () => {
        test.each(['match', 'skipped', 'rejected', 'invalid result'] as const)(
            'An obsolete %s completion does not notify after a state update starts a newer run',
            async outcome => {
                let { testItem, host, logging } = setup();
                let deferred = deferredResult();
                host.validators = [pendingValidator('a', deferred)];
                let result = testItem.execute()!;
                let notificationsAfterNewRun = -1;
                let stateAfterNewRun = '';
                host.onUpdated = () => {
                    host.onUpdated = null;
                    host.generation++;
                    host.validators = [new TestValidator('new', match)];
                    let newRun = new ValueHostValidationRunner(host, {}, host.generation);
                    newRun.execute();
                    notificationsAfterNewRun = host.notifications;
                    stateAfterNewRun = JSON.stringify(host.state);
                };

                if (outcome === 'match')
                    deferred.resolve(match());
                else if (outcome === 'skipped')
                    deferred.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined, issueFound: null, skipped: true });
                else if (outcome === 'rejected')
                    deferred.reject(new Error('Validator rejected'));
                else
                    deferred.resolve({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, issueFound: null });

                if (outcome === 'rejected' || outcome === 'invalid result')
                    await expect(result.completions![0]).rejects.toThrow();
                else
                    await expect(result.completions![0]).resolves.toBeUndefined();
                expect(host.generation).toBe(2);
                expect(notificationsAfterNewRun).toBeGreaterThanOrEqual(0);
                expect(host.notifications).toBe(notificationsAfterNewRun);
                expect(JSON.stringify(host.state)).toBe(stateAfterNewRun);
                if (outcome === 'rejected' || outcome === 'invalid result')
                    expect(logging.containsLog(outcome === 'rejected' ? 'Validator rejected' :
                        'Validator "a" returned NoMatch without an issue', LoggingLevel.Error, LoggingCategory.Exception,
                    { type: 'ValueHostValidationRunner', feature: 'Validation', identity: 'Field1' })).toBe(true);
                else
                    expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
            }
        );
    });

    test('An async error remains invalid when a later async warning completes', async () => {
        let { testItem, host, logging } = setup();
        let error = deferredResult();
        let warning = deferredResult();
        host.validators = [pendingValidator('error', error), pendingValidator('warning', warning)];
        let result = testItem.execute()!;

        error.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: true }
        });
        await result.completions![0];
        expect(result.status).toBe(ValidationStatus.Invalid);
        expect(host.state.asyncProcessing).toBe(true);

        warning.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: { errorMessage: 'Warning', severity: ValidationSeverity.Warning }
        });
        await result.completions![1];
        expect(result.status).toBe(ValidationStatus.Invalid);
        expect(result.issuesFound?.map(issue => issue.doNotSave)).toEqual([true, false]);
        expect(host.state.status).toBe(ValidationStatus.Invalid);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A legacy promise operational failure blocks without creating an async identity', async () => {
        let { testItem, host, logging } = setup();
        let deferred = deferredResult();
        host.validators = [new TestValidator('legacy', () => deferred.promise)];
        let result = testItem.execute()!;
        deferred.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: new Error('Unavailable'),
            issueFound: { errorMessage: 'Unavailable', severity: ValidationSeverity.Error }
        });
        await result.completions![0];

        expect(result.status).toBe(ValidationStatus.Failed);
        expect(host.state.status).toBe(ValidationStatus.Failed);
        expect(host.state.failedAsyncIdentities).toBeUndefined();
        expect(result.issuesFound?.[0].doNotSave).toBe(true);
        expect(host.state.asyncProcessing).toBeUndefined();
        expect(logging.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});
