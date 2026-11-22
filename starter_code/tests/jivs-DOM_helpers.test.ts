import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { AsyncValidatorConfig, AsyncValidatorEvaluationResult } from '@plblum/jivs-engine/build/Interfaces/AsyncValidator';
import { ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValidatorType } from '@plblum/jivs-engine/build/Interfaces/Validator';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { TestingLoggingService } from '@plblum/jivs-engine/build/Support/TestingLoggingService';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { JivsClientSubmitBase, SaveModelResponse } from '../jivs-DOM_helpers';

type Model = { Name: string };

class RecordingSubmit extends JivsClientSubmitBase<Model, never>
{
    public saved: Model[] = [];
    public succeeded: Model[] = [];

    protected async saveModel(model: Model): Promise<SaveModelResponse<Model, never>>
    {
        this.saved.push(model);
        return {};
    }

    protected handleConnectionFailure(error: unknown): void { throw error; }
    protected handleHttpFailure(): boolean { return false; }
    protected handleServerIssues(): boolean { return false; }
    protected submissionSucceeded(model: Model): void { this.succeeded.push(model); }
}

/** Creates an actual manager whose async validator is controlled by the test. */
function setupSubmission()
{
    let resolve!: (result: AsyncValidatorEvaluationResult) => void;
    let validation = new Promise<AsyncValidatorEvaluationResult>(finish => { resolve = finish; });
    let services = createJivsServicesForTesting();
    let logger = new TestingLoggingService(LoggingLevel.Warn);
    services.loggingService = logger;
    let validator: AsyncValidatorConfig = {
        validatorType: ValidatorType.AsyncValidator,
        handlerIdentity: 'NameCheck',
        handler: () => validation
    };
    let field: FieldValueHostConfig = {
        valueHostType: ValueHostType.Field,
        name: 'Name',
        dataType: LookupKey.String,
        initialValue: 'Alice',
        validatorConfigs: [validator]
    };
    let manager = new ValueHostsManager({ services, valueHostConfigs: [field] });
    let factoryCalls = 0;
    let submitter = new RecordingSubmit(manager, () => {
        factoryCalls++;
        return { Name: '' };
    });
    return { manager, logger, submitter, resolve, factoryCalls: () => factoryCalls };
}

// Submission must wait for the manager's final result before creating or saving a model.
describe('JivsClientSubmitBase.submit asynchronous validation', () =>
{
    test('A successful pending validator delays model creation and saving until it completes', async () =>
    {
        let setup = setupSubmission();
        let completion = setup.submitter.submit();

        expect(setup.factoryCalls()).toBe(0);
        expect(setup.submitter.saved).toEqual([]);
        setup.resolve({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await completion;

        expect(setup.factoryCalls()).toBe(1);
        expect(setup.submitter.saved).toEqual([{ Name: 'Alice' }]);
        expect(setup.submitter.succeeded).toEqual([{ Name: 'Alice' }]);
        expect(setup.logger.entryCount).toBe(0);
        setup.manager.dispose();
    });

    test('A pending validator reporting a blocking issue prevents model creation and saving', async () =>
    {
        let setup = setupSubmission();
        let completion = setup.submitter.submit();

        expect(setup.factoryCalls()).toBe(0);
        expect(setup.submitter.saved).toEqual([]);
        setup.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Name is already in use'
        });
        await completion;

        expect(setup.factoryCalls()).toBe(0);
        expect(setup.submitter.saved).toEqual([]);
        expect(setup.submitter.succeeded).toEqual([]);
        expect(setup.manager.doNotSave).toBe(true);
        expect(setup.logger.entryCount).toBe(0);
        setup.manager.dispose();
    });
});
