import { AsyncValidatorConfig, AsyncValidatorEvaluationResult, RestartWhenPending } from '../../src/Interfaces/AsyncValidator';
import { CalcValueHostConfig } from '../../src/Interfaces/CalcValueHost';
import { ConditionCategory, ConditionEvaluateResult } from '../../src/Interfaces/Conditions';
import { FieldValueHostConfig } from '../../src/Interfaces/FieldValueHost';
import { LoggingCategory, LoggingLevel } from '../../src/Interfaces/LoggingService';
import { ValidateOptions, ValidationState, ValidationStatus } from '../../src/Interfaces/Validation';
import { ValidatorConfig, ValidatorType, ValidatorValidateResult } from '../../src/Interfaces/Validator';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { TestingLoggingService } from '../../src/Support/TestingLoggingService';
import { createJivsServicesForTesting } from '../../src/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '../../src/Validation/ValueHostsManager';
import { finishPartialFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
import {
    TestValidatableValueHost, addTestValidatableValueHostGeneratorToServices,
    createValidatableValueHostBaseConfig
} from '../TestSupport/TestValidatableValueHost';

/** Provides controlled handler settlement without relying on timers. */
function deferredResult() {
    let resolve!: (result: AsyncValidatorEvaluationResult) => void;
    let promise = new Promise<AsyncValidatorEvaluationResult>(finish => { resolve = finish; });
    return { promise, resolve };
}

/** Creates real fields and an unchained logger for manager orchestration tests. */
function setupManager(configs: ValueHostConfig[]) {
    let services = createJivsServicesForTesting();
    let logger = new TestingLoggingService(LoggingLevel.Debug);
    services.loggingService = logger;
    services.dataTypeCheckGeneratorService.enabled = false;
    let manager = new ValueHostsManager({ services, valueHostConfigs: configs });
    logger.clearAll();
    return { manager, logger };
}

/** Creates a field with one named async validator and optional policy and group. */
function asyncField(name: string, handler: AsyncValidatorConfig['handler'],
    extra?: Partial<AsyncValidatorConfig>, group?: string): FieldValueHostConfig {
    return finishPartialFieldValueHostConfig({
        name, initialValue: 'initial', group,
        validatorConfigs: [{
            validatorType: ValidatorType.AsyncValidator,
            handlerIdentity: `${name}Check`, handler, ...extra
        }]
    });
}

class SnapshotFailureManager extends ValueHostsManager {
    protected override createValidationState(_options?: ValidateOptions): ValidationState {
        throw new Error('Snapshot failed');
    }
}

class FallbackSnapshotManager extends ValueHostsManager {
    protected override calculateIsValid(_options?: ValidateOptions): boolean {
        throw new Error('State calculation failed');
    }
}

class ReentrantSnapshotManager extends ValueHostsManager {
    public onSnapshot?: () => void;

    protected override createValidationState(options?: ValidateOptions): ValidationState {
        let callback = this.onSnapshot;
        this.onSnapshot = undefined;
        callback?.();
        return super.createValidationState(options);
    }
}

// Manager results must represent host processing, not merely handler settlement.
describe('ValueHostsManager async orchestration', () => {
    test('Without asynchronous work the final callback runs before the returned Promise is observed', async () => {
        let { manager, logger } = setupManager([finishPartialFieldValueHostConfig({ name: 'Field1' })]);
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };

        let promise = manager.validate();
        expect(promise).toBeInstanceOf(Promise);
        expect(notifications).toHaveLength(1);
        let result = await promise;
        expect(result).toBe(notifications[0]);
        expect(result).toEqual(expect.objectContaining({ isValid: true, doNotSave: false, asyncProcessing: false }));
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Waits for every host to publish its result before returning and notifying the final snapshot', async () => {
        let first = deferredResult();
        let second = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('First', () => first.promise),
            asyncField('Second', () => second.promise)
        ]);
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };
        let settled = false;
        let promise = manager.validate().then(result => { settled = true; return result; });

        first.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'Taken', errorMessage: 'Already taken'
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(settled).toBe(false);
        expect(manager.getFieldValueHost('First')!.validationStatus).toBe(ValidationStatus.Invalid);
        expect(manager.asyncProcessing).toBe(true);

        second.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        let result = await promise;
        expect(result).toEqual(expect.objectContaining({
            isValid: false, doNotSave: true, asyncProcessing: false,
            issuesFound: [expect.objectContaining({ errorCode: 'Taken', asyncIdentity: 'FirstCheck' })]
        }));
        expect(notifications[notifications.length - 1]).toBe(result);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Waits for both async validators on one host and includes both issues in the final snapshot', async () => {
        let first = deferredResult();
        let second = deferredResult();
        let firstConfig: AsyncValidatorConfig = {
            validatorType: ValidatorType.AsyncValidator, handlerIdentity: 'FirstCheck', handler: () => first.promise
        };
        let secondConfig: AsyncValidatorConfig = {
            validatorType: ValidatorType.AsyncValidator, handlerIdentity: 'SecondCheck', handler: () => second.promise
        };
        let config = finishPartialFieldValueHostConfig({
            name: 'Field1', initialValue: 'initial',
            validatorConfigs: [firstConfig, secondConfig]
        });
        let { manager, logger } = setupManager([config]);
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };
        let settled = false;
        let promise = manager.validate().then(result => { settled = true; return result; });

        first.resolve({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, errorCode: 'FirstError', errorMessage: 'First issue' });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(settled).toBe(false);
        expect(manager.getFieldValueHost('Field1')!.asyncProcessing).toBe(true);

        second.resolve({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, errorCode: 'SecondError', errorMessage: 'Second issue' });
        let result = await promise;
        expect(result).toEqual(expect.objectContaining({
            isValid: false, doNotSave: true, asyncProcessing: false,
            issuesFound: [
                expect.objectContaining({ errorCode: 'FirstError', asyncIdentity: 'FirstCheck' }),
                expect.objectContaining({ errorCode: 'SecondError', asyncIdentity: 'SecondCheck' })
            ]
        }));
        expect(notifications[notifications.length - 1]).toBe(result);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('An intermediate manager notification exposes a completed issue while another host is pending', async () => {
        let first = deferredResult();
        let second = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('First', () => first.promise),
            asyncField('Second', () => second.promise)
        ]);
        manager.notifyValidationStateChangedDelay = 0;
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };
        let promise = manager.validate();
        first.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'Taken', errorMessage: 'Already taken'
        });
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(notifications[notifications.length - 1]).toEqual(expect.objectContaining({
            asyncProcessing: true, doNotSave: true,
            issuesFound: [expect.objectContaining({ errorCode: 'Taken' })]
        }));
        second.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        let result = await promise;
        expect(notifications[notifications.length - 1]).toBe(result);
        expect(result.asyncProcessing).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('The final notification replaces a queued intermediate notification after async completion', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([asyncField('Field1', () => work.promise)]);
        manager.notifyValidationStateChangedDelay = 50;
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };

        let promise = manager.validate();
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        let result = await promise;
        expect(notifications).toEqual([result]);
        expect(result).toEqual(expect.objectContaining({ isValid: true, doNotSave: false, asyncProcessing: false }));

        await new Promise(resolve => setTimeout(resolve, 100));
        expect(notifications).toEqual([result]);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Preserves group selection and skips model-level handlers configured for server validation', async () => {
        let calls: string[] = [];
        let { manager, logger } = setupManager([
            asyncField('Included', async () => {
                calls.push('included');
                return { conditionEvaluateResult: ConditionEvaluateResult.Match };
            }, undefined, 'A'),
            asyncField('ServerOnly', async () => {
                calls.push('server');
                return { conditionEvaluateResult: ConditionEvaluateResult.Match };
            }, { skipOnModelLevelValidation: true }, 'A'),
            asyncField('OtherGroup', async () => {
                calls.push('other');
                return { conditionEvaluateResult: ConditionEvaluateResult.Match };
            }, undefined, 'B')
        ]);

        let notifications = 0;
        manager.onValidationStateChanged = () => { notifications++; };
        let result = await manager.validate({ group: 'A', skipCallback: true });
        expect(calls).toEqual(['included']);
        expect(notifications).toBe(0);
        expect(result).toEqual(expect.objectContaining({ group: 'A', doNotSave: false, asyncProcessing: false }));
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Model-level skip abandons field-level pending work without applying its late result', async () => {
        let work = deferredResult();
        let signal!: AbortSignal;
        let calls = 0;
        let { manager, logger } = setupManager([asyncField('Field1', (_host, _manager, abortSignal) => {
            calls++;
            signal = abortSignal;
            return work.promise;
        }, { skipOnModelLevelValidation: true })]);
        let field = manager.getFieldValueHost('Field1')!;
        let fieldResult = field.validate({ skipCallback: true });
        expect(field.asyncProcessing).toBe(true);
        expect(signal.aborted).toBe(false);

        let result = await manager.validate({ skipCallback: true });
        expect(calls).toBe(1);
        expect(signal.aborted).toBe(true);
        expect(result).toEqual(expect.objectContaining({
            isValid: true, doNotSave: false, asyncProcessing: false, issuesFound: null
        }));
        await Promise.all(fieldResult!.completions!);

        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, errorCode: 'LateError', errorMessage: 'Late issue' });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(manager.currentValidationState()).toEqual(expect.objectContaining({
            isValid: true, doNotSave: false, asyncProcessing: false, issuesFound: null
        }));
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Selected-group validation finishes without waiting for already pending work in another group', async () => {
        let selected = deferredResult();
        let other = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('Selected', () => selected.promise, undefined, 'A'),
            asyncField('Other', () => other.promise, undefined, 'B')
        ]);
        let otherField = manager.getFieldValueHost('Other')!;
        let otherResult = otherField.validate({ skipCallback: true });
        let promise = manager.validate({ group: 'A', skipCallback: true });
        selected.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        let result = await promise;
        expect(result).toEqual(expect.objectContaining({
            group: 'A', isValid: true, doNotSave: false, asyncProcessing: false
        }));
        expect(otherField.asyncProcessing).toBe(true);
        expect(manager.asyncProcessing).toBe(true);

        other.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(otherResult!.completions!);
        expect(manager.asyncProcessing).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A handler failure fulfills with its blocking issue after host processing', async () => {
        let { manager, logger } = setupManager([asyncField('Field1', async () => {
            throw new Error('Service unavailable');
        })]);
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };

        let result = await manager.validate();
        expect(result).toEqual(expect.objectContaining({
            isValid: false, doNotSave: true, asyncProcessing: false,
            issuesFound: [expect.objectContaining({ asyncIdentity: 'Field1Check' })]
        }));
        expect(notifications[notifications.length - 1]).toBe(result);
        expect(logger.findMessage('Service unavailable', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'Field1Check' })).toBeTruthy();
    });

    test('A timeout publishes its blocking issue in the final manager result and notification', async () => {
        let signal!: AbortSignal;
        let { manager, logger } = setupManager([asyncField('Field1', (_host, _manager, abortSignal) => {
            signal = abortSignal;
            return new Promise<AsyncValidatorEvaluationResult>(() => {});
        }, { timeout: 10 })]);
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };

        let result = await manager.validate();
        expect(signal.aborted).toBe(true);
        expect(result).toEqual(expect.objectContaining({
            isValid: false, doNotSave: true, asyncProcessing: false,
            issuesFound: [expect.objectContaining({
                valueHostName: 'Field1', asyncIdentity: 'Field1Check', errorCode: 'AsyncValidationFailed',
                errorMessage: 'We couldn&#39;t complete this check right now. Please try again.',
                summaryMessage: 'We couldn&#39;t complete this check right now. Please try again.',
                doNotSave: true
            })]
        }));
        expect(notifications[notifications.length - 1]).toBe(result);
        expect(logger.findMessage('Async validation timed out', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'Field1Check' })).toBeTruthy();
    });

    test('Keeps the original group and callback options if the caller changes its options while waiting', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([asyncField('Field1', () => work.promise, undefined, 'A')]);
        let notifications = 0;
        manager.onValidationStateChanged = () => { notifications++; };
        let options: ValidateOptions = { group: 'A', skipCallback: true };
        let promise = manager.validate(options);
        options.group = 'B';
        options.skipCallback = false;
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        let result = await promise;
        expect(result.group).toBe('A');
        expect(result.doNotSave).toBe(false);
        expect(notifications).toBe(0);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Overlapping manager calls reuse pending work but the older call cannot authorize saving or send a final notification', async () => {
        let work = deferredResult();
        let calls = 0;
        let { manager, logger } = setupManager([asyncField('Field1', () => {
            calls++;
            return work.promise;
        })]);
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };
        let first = manager.validate();
        let second = manager.validate();
        expect(calls).toBe(1);

        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        let [oldResult, currentResult] = await Promise.all([first, second]);
        expect(oldResult.doNotSave).toBe(true);
        expect(currentResult.doNotSave).toBe(false);
        expect(notifications).toEqual([currentResult]);
        expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();
    });

    test.each(['edit', 'reset', 'clear', 'replace', 'discard', 'dispose'] as const)(
        'A manager call invalidated by %s fulfills with a blocking result',
        async action => {
            let work = deferredResult();
            let config = asyncField('Field1', () => work.promise);
            let { manager, logger } = setupManager([config]);
            let promise = manager.validate({ skipCallback: true });
            let field = manager.getFieldValueHost('Field1')!;

            if (action === 'edit')
                field.setValue('changed', { validate: false });
            else if (action === 'reset')
                field.setValue('initial', { reset: true, validate: false });
            else if (action === 'clear')
                manager.clearValidation({ skipCallback: true });
            else if (action === 'replace')
                manager.addOrUpdateValueHost(config, null);
            else if (action === 'discard')
                manager.discardValueHost('Field1');
            else
                manager.dispose();
            work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

            let result = await promise;
            expect(result.doNotSave).toBe(true);
            expect(result.isValid).toBe(false);
            expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
                null, { feature: 'Manager' })).toBeTruthy();
        }
    );

    test('A declared dependency outside the selected group invalidates a pending manager call when edited', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('Owner', () => work.promise, { dependencyValueHostNames: ['Dependency'] }, 'A'),
            finishPartialFieldValueHostConfig({ name: 'Dependency', initialValue: 'before', group: 'B' })
        ]);
        let promise = manager.validate({ group: 'A', skipCallback: true });
        manager.getFieldValueHost('Dependency')!.setValue('after', { validate: false });
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        expect((await promise).doNotSave).toBe(true);
        expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();
    });

    test('An unrelated group edit does not invalidate the selected group', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('Owner', () => work.promise, undefined, 'A'),
            finishPartialFieldValueHostConfig({ name: 'Other', initialValue: 'before', group: 'B' })
        ]);
        let promise = manager.validate({ group: 'A', skipCallback: true });
        manager.getFieldValueHost('Other')!.setValue('after', { validate: false });
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        expect((await promise).doNotSave).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Clearing a different group invalidates a pending manager validation', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('Owner', () => work.promise, undefined, 'A'),
            finishPartialFieldValueHostConfig({ name: 'Other', group: 'B' })
        ]);
        let otherField = manager.getFieldValueHost('Other')!;
        otherField.validate({ skipCallback: true });
        let promise = manager.validate({ group: 'A', skipCallback: true });

        expect(manager.clearValidation({ group: 'B', skipCallback: true })).toBe(true);
        expect(otherField.validationStatus).toBe(ValidationStatus.NotAttempted);
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        let result = await promise;
        expect(result).toEqual(expect.objectContaining({ group: 'A', isValid: false, doNotSave: true }));
        expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();
    });

    test('Tracks an already calculated dependency without changing its value version', async () => {
        let work = deferredResult();
        let calculated: CalcValueHostConfig = {
            name: 'Calculated', valueHostType: ValueHostType.Calc,
            calcFn: (_host, resolver) => resolver.getValueHost('Dependency')!.getValue()
        };
        let { manager, logger } = setupManager([
            asyncField('Owner', (_host, resolver) => {
                expect(resolver.getValueHost('Calculated')!.getValue()).toBe('before');
                return work.promise;
            }, { dependencyValueHostNames: ['Calculated', 'Dependency'] }),
            finishPartialFieldValueHostConfig({ name: 'Dependency', initialValue: 'before' }),
            calculated
        ]);
        expect(manager.getValueHost('Calculated')!.getValue()).toBe('before');
        let promise = manager.validate({ skipCallback: true });
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        expect((await promise).doNotSave).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A first calculation read that changes its counter blocks the call until validation is retried', async () => {
        let calculated: CalcValueHostConfig = {
            name: 'Calculated', valueHostType: ValueHostType.Calc,
            calcFn: (_host, resolver) => resolver.getValueHost('Dependency')!.getValue()
        };
        let { manager, logger } = setupManager([
            asyncField('Owner', async (_host, resolver) => {
                expect(resolver.getValueHost('Calculated')!.getValue()).toBe('before');
                return { conditionEvaluateResult: ConditionEvaluateResult.Match };
            }, { dependencyValueHostNames: ['Calculated', 'Dependency'] }),
            finishPartialFieldValueHostConfig({ name: 'Dependency', initialValue: 'before' }),
            calculated
        ]);
        let first = await manager.validate({ skipCallback: true });
        expect(first.doNotSave).toBe(true);
        expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();

        let retry = await manager.validate({ skipCallback: true });
        expect(retry.doNotSave).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A later host callback revalidating an earlier host invalidates the manager run', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('First', () => work.promise),
            asyncField('Second', async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match }))
        ]);
        let restarted = false;
        manager.onValueHostValidationStateChanged = host => {
            if (host.getName() === 'Second' && !restarted) {
                restarted = true;
                manager.getFieldValueHost('First')!.validate();
            }
        };
        let promise = manager.validate({ skipCallback: false });
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        let result = await promise;
        expect(restarted).toBe(true);
        expect(result.doNotSave).toBe(true);
        expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();
    });

    test('Reentrant validation of the current host makes the manager run obsolete', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([asyncField('Field1', () => work.promise)]);
        let reentered = false;
        manager.onValueHostValidationStateChanged = host => {
            if (!reentered) {
                reentered = true;
                manager.getFieldValueHost(host.getName())!.validate();
            }
        };
        let promise = manager.validate();
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        expect((await promise).doNotSave).toBe(true);
        expect(reentered).toBe(true);
        expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();
    });

    test('An unexpected host startup error is logged and fulfills with a blocking result', async () => {
        let { manager, logger } = setupManager([asyncField('Field1',
            async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match }),
            { dependencyValueHostNames: ['Missing'] }
        )]);
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };
        let result = await manager.validate();
        expect(result.isValid).toBe(false);
        expect(result.doNotSave).toBe(true);
        expect(notifications[notifications.length - 1]).toBe(result);
        expect(logger.findMessage('Async validation dependency "Missing" was not found', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'Manager' })).toBeTruthy();
    });

    test('Waits for work already started on another host when a later host fails to start', async () => {
        let work = deferredResult();
        let { manager, logger } = setupManager([
            asyncField('First', () => work.promise),
            asyncField('Second', async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match }),
                { dependencyValueHostNames: ['Missing'] })
        ]);
        let settled = false;
        let promise = manager.validate({ skipCallback: true }).then(result => { settled = true; return result; });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(settled).toBe(false);
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        let result = await promise;
        expect(result.doNotSave).toBe(true);
        expect(result.asyncProcessing).toBe(false);
        expect(logger.findMessage('Async validation dependency "Missing" was not found', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'Manager' })).toBeTruthy();
    });

    test('A custom Promise validator rejection is observed and returned as a blocking manager result', async () => {
        let reject!: (error: Error) => void;
        let custom: ValidatorConfig = {
            validatorType: ValidatorType.Validator, errorCode: 'Custom', conditionConfig: null,
            conditionCreator: () => ({
                conditionType: 'CustomCondition', category: ConditionCategory.Contents,
                evaluate: () => ConditionEvaluateResult.Match
            })
        };
        let config = finishPartialFieldValueHostConfig({
            name: 'Field1', validatorConfigs: [custom]
        });
        let { manager, logger } = setupManager([config]);
        let validator = manager.getFieldValueHost('Field1')!.getValidator('Custom')!;
        validator.validate = () => new Promise<ValidatorValidateResult>((_, fail) => { reject = fail; });
        let promise = manager.validate({ skipCallback: true });
        reject(new Error('Custom validator failed'));

        let result = await promise;
        expect(result.doNotSave).toBe(true);
        expect(result.asyncProcessing).toBe(false);
        expect(logger.findMessage('Error: Custom validator failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
    });

    test('A rejected completion does not stop the manager from waiting for another pending host', async () => {
        let reject!: (error: Error) => void;
        let work = deferredResult();
        let custom: ValidatorConfig = {
            validatorType: ValidatorType.Validator, errorCode: 'Custom', conditionConfig: null,
            conditionCreator: () => ({
                conditionType: 'CustomCondition', category: ConditionCategory.Contents,
                evaluate: () => ConditionEvaluateResult.Match
            })
        };
        let { manager, logger } = setupManager([
            finishPartialFieldValueHostConfig({ name: 'First', validatorConfigs: [custom] }),
            asyncField('Second', () => work.promise)
        ]);
        manager.getFieldValueHost('First')!.getValidator('Custom')!.validate =
            () => new Promise<ValidatorValidateResult>((_, fail) => { reject = fail; });
        let settled = false;
        let promise = manager.validate({ skipCallback: true }).then(result => { settled = true; return result; });

        reject(new Error('Custom validator failed'));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(settled).toBe(false);
        expect(manager.getFieldValueHost('Second')!.asyncProcessing).toBe(true);
        work.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });

        let result = await promise;
        expect(result).toEqual(expect.objectContaining({ isValid: false, doNotSave: true, asyncProcessing: false }));
        expect(logger.findMessage('Error: Custom validator failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'ValueHost', identity: 'First' })).toBeTruthy();
    });

    test('Waits for the completion returned by a custom validatable host', async () => {
        let services = createJivsServicesForTesting();
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        services.loggingService = logger;
        addTestValidatableValueHostGeneratorToServices(services);
        let manager = new ValueHostsManager({ services, valueHostConfigs: [createValidatableValueHostBaseConfig()] });
        let host = manager.getValueHost('Field1') as TestValidatableValueHost;
        let finish!: () => void;
        let completion = new Promise<void>(resolve => { finish = resolve; }).then(() => {
            host.setValidationStatus(ValidationStatus.Valid);
        });
        host.validateWillReturn = { status: ValidationStatus.Undetermined, issuesFound: null, completions: [completion] };
        let settled = false;
        let promise = manager.validate({ skipCallback: true }).then(result => { settled = true; return result; });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(settled).toBe(false);

        finish();
        let result = await promise;
        expect(host.validationStatus).toBe(ValidationStatus.Valid);
        expect(result.doNotSave).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test.each([ValidationStatus.Undetermined, ValidationStatus.NotAttempted])(
        'Clearing the manager invalidates a pending custom host run even when its status is %s',
        async status => {
            let services = createJivsServicesForTesting();
            let logger = new TestingLoggingService(LoggingLevel.Debug);
            services.loggingService = logger;
            addTestValidatableValueHostGeneratorToServices(services);
            let manager = new ValueHostsManager({ services, valueHostConfigs: [createValidatableValueHostBaseConfig()] });
            let host = manager.getValueHost('Field1') as TestValidatableValueHost;
            let finish!: () => void;
            let completion = new Promise<void>(resolve => { finish = resolve; });
            host.validateWillReturn = { status, issuesFound: null, completions: [completion] };
            let notifications: ValidationState[] = [];
            manager.onValidationStateChanged = (_, state) => { notifications.push(state); };
            logger.clearAll();

            let promise = manager.validate();
            expect(manager.clearValidation({ skipCallback: true })).toBe(status !== ValidationStatus.NotAttempted);
            finish();

            let result = await promise;
            expect(result).toEqual(expect.objectContaining({ isValid: false, doNotSave: true }));
            expect(notifications).toEqual([]);
            expect(logger.findMessage('Validation did not complete for the current inputs', LoggingLevel.Info,
                null, { feature: 'Manager' })).toBeTruthy();
        }
    );

    test('A throwing final manager callback is logged and the Promise fulfills with a blocking state', async () => {
        let { manager, logger } = setupManager([]);
        manager.onValidationStateChanged = () => { throw new Error('Observer failed'); };

        let result = await manager.validate();
        expect(result.isValid).toBe(false);
        expect(result.doNotSave).toBe(true);
        expect(logger.findMessage('Observer failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Manager' })).toBeTruthy();
    });

    test('A snapshot error is logged and the final callback receives a blocking fallback state', async () => {
        let services = createJivsServicesForTesting();
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        services.loggingService = logger;
        let manager = new SnapshotFailureManager({ services, valueHostConfigs: [] });
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };

        let result = await manager.validate();
        expect(result).toEqual(expect.objectContaining({ isValid: false, doNotSave: true }));
        expect(notifications).toEqual([result]);
        expect(logger.findMessage('Snapshot failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Manager' })).toBeTruthy();
    });

    test('A state calculation error still fulfills with a last-resort blocking snapshot', async () => {
        let services = createJivsServicesForTesting();
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        services.loggingService = logger;
        let manager = new FallbackSnapshotManager({ services, valueHostConfigs: [] });
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };

        let result = await manager.validate({ group: 'A' });
        expect(result).toEqual({
            isValid: false, doNotSave: true, issuesFound: null, asyncProcessing: false, group: 'A'
        });
        expect(notifications).toEqual([result]);
        expect(logger.findMessage('State calculation failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Manager' })).toBeTruthy();
    });

    test('Reentrant validation while creating the snapshot does not publish or cache the obsolete result', async () => {
        let services = createJivsServicesForTesting();
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        services.loggingService = logger;
        let manager = new ReentrantSnapshotManager({ services, valueHostConfigs: [] });
        let notifications: ValidationState[] = [];
        manager.onValidationStateChanged = (_, state) => { notifications.push(state); };
        let newer!: Promise<ValidationState>;
        manager.onSnapshot = () => { newer = manager.validate({ group: 'B' }); };

        let older = await manager.validate({ group: 'A' });
        let current = await newer;
        expect(older.doNotSave).toBe(true);
        expect(current.doNotSave).toBe(false);
        expect(notifications).toEqual([current]);
        expect(manager.currentValidationState().group).toBeUndefined();
        expect(logger.findMessage('Validation became obsolete while creating its snapshot', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();
    });

    test('Reentrant validation in the final callback causes the older call to return a blocking result', async () => {
        let { manager, logger } = setupManager([]);
        let newer!: Promise<ValidationState>;
        manager.onValidationStateChanged = () => {
            newer = manager.validate({ group: 'B', skipCallback: true });
        };

        let older = await manager.validate({ group: 'A' });
        expect(older.doNotSave).toBe(true);
        expect((await newer).doNotSave).toBe(false);
        expect(logger.findMessage('Validation became obsolete during notification', LoggingLevel.Info,
            null, { feature: 'Manager' })).toBeTruthy();
    });

    test('Validation after disposal fulfills with a logged blocking result', async () => {
        let { manager, logger } = setupManager([]);
        manager.dispose();

        let result = await manager.validate();
        expect(result).toEqual(expect.objectContaining({ isValid: false, doNotSave: true }));
        expect(logger.findMessage('ValueHostsManager has been disposed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Manager' })).toBeTruthy();
    });

    test('A newer manager call can restart the pending validator', async () => {
        let first = deferredResult();
        let second = deferredResult();
        let calls = 0;
        let { manager } = setupManager([asyncField('Field1', () => {
            calls++;
            return calls === 1 ? first.promise : second.promise;
        }, { restartWhenPending: RestartWhenPending.Always })]);

        let oldRun = manager.validate({ skipCallback: true });
        let newRun = manager.validate({ skipCallback: true });
        expect(calls).toBe(2);
        second.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        expect((await newRun).doNotSave).toBe(false);
        expect((await oldRun).doNotSave).toBe(true);
        first.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
    });
});
