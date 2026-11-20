import {
    RegExpConditionConfig, RegExpCondition, StringLengthConditionConfig,
    StringLengthCondition, AllMatchConditionConfig, AllMatchCondition, DataTypeCheckConditionConfig,
    RequireTextConditionConfig, 
    RequireTextCondition, RangeConditionConfig
} from "../../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionCategory, ConditionConfig, ConditionEvaluateResult, ICondition } from "../../src/Interfaces/Conditions";
import { InjectedError, InjectedErrorValidatorErrorCode, ValidatorsValueHostBaseInstanceState, toIValidatorsValueHost } from "../../src/Interfaces/ValidatorsValueHostBase";
import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggingService";
import { ValueHostValidationState } from "../../src/Interfaces/ValidatableValueHostBase";
import { ValueHostValidateResult, ValidationStatus, ValidationSeverity, ValidateOptions, IssueFound, ValidationState } from "../../src/Interfaces/Validation";
import { IValueHostsManager, StateContainer, ValueHostsManagerConfig } from "../../src/Interfaces/ValueHostsManager";
import { IJivsServices } from "../../src/Interfaces/JivsServices";
import { IValidator, IValidatorFactory, ValidatorConfig, ValidatorConfigBase, ValidatorType, ValidatorValidateResult } from "../../src/Interfaces/Validator";
import { AsyncValidatorConfig, AsyncValidatorEvaluateHandler, AsyncValidatorEvaluationResult, RestartWhenPending } from "../../src/Interfaces/AsyncValidator";
import { ValidatorsValueHostBaseConfig, IValidatorsValueHost } from "../../src/Interfaces/ValidatorsValueHostBase";
import {
    IValueHost, SetValueOptions, ValidTypesForInstanceStateStorage,
    ValueHostConfig, ValueHostInstanceState
} from "../../src/Interfaces/ValueHost";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { ValueHostsManager } from "../../src/Validation/ValueHostsManager";
import { Validator } from "../../src/Validation/Validator";
import { ValidatorsValueHostBase, ValidatorsValueHostBaseGenerator } from "../../src/ValueHosts/ValidatorsValueHostBase";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { TestingLoggingService } from "../../src/Support/TestingLoggingService";
import {
    AlwaysMatchesConditionType, NeverMatchesConditionType,
    IsUndeterminedConditionType, NeverMatchesConditionType2, UserSuppliedResultConditionType,
    UserSuppliedResultConditionConfig,
    NeverMatchesCondition, ThrowsSevereExceptionConditionType
} from "../../src/Support/conditionsForTesting";
import { createJivsServicesForTesting } from '../../src/Support/createJivsServicesForTesting';
import { MockJivsServices, MockValueHostsManager } from "../TestSupport/mocks";
import { IDisposable } from "../../src/Interfaces/General_Purpose";
import { ErrorMessagesService } from '../../src/Services/ErrorMessagesService';
import { restoreCapturedState } from '../TestSupport/utilities';
import { EqualToConditionConfig, EqualToCondition } from '../../src/Conditions/ComparisonCondition_classes';
import { CodingError } from '../../src/Utilities/ErrorHandling';

/**
 * Used to test the abstract class. We won't be testing overridden abstract methods.
 */
class TestValidatorsValueHost extends ValidatorsValueHostBase<ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState>
{
    public get exposeValidators(): Array<IValidator>
    {
        return this.validators();
    }
    public get exposeServices(): IJivsServices {
        return this.services;
    }

    public get exposeConfig(): ValueHostConfig {
        return this.config;
    }

    public get exposeState(): ValidatorsValueHostBaseInstanceState {
        return this.instanceState;
    }    
    public exposeSetIssueFound(issueFound: IssueFound): boolean
    {
        return super.setIssueFound(issueFound);
    }        
}

const TestValueHostType = 'TestValidatorsValueHost';
/**
 * This implementation of IValueHostGenerator is actually tested in ValueHostFactory.tests.ts
 */
class TestValidatorsValueHostGenerator extends ValidatorsValueHostBaseGenerator {
    public canCreate(config: ValueHostConfig): boolean {
        return config.valueHostType === TestValueHostType;
    }
    public create(valueHostsManager : IValueHostsManager, config: ValidatorsValueHostBaseConfig, state: ValidatorsValueHostBaseInstanceState): IValidatorsValueHost {
        return new TestValidatorsValueHost(valueHostsManager, config, state);
    }
    // public cleanupInstanceState(state: ValidatorsValueHostBaseInstanceState, config: ValueHostConfig): void {
    // }
    // public createInstanceState(config: ValueHostConfig): ValidatorsValueHostBaseInstanceState {
    //     let state: ValidatorsValueHostBaseInstanceState = {
    //         name: config.name,
    //         value: config.initialValue,
    //         status: ValidationStatus.NotAttempted,
    //         issuesFound: null
    //     };
    //     return state;
    // }

}

function supportTestValueHostInServices(services: IJivsServices): void
{
    let factory = new ValueHostFactory();
    factory.register(new TestValidatorsValueHostGenerator());
    services.valueHostFactory = factory;
}

interface ITestSetupConfigWithMocks {
    services: MockJivsServices,
    valueHostsManager: MockValueHostsManager,
    config: ValidatorsValueHostBaseConfig,
    state: ValidatorsValueHostBaseInstanceState,
    valueHost: TestValidatorsValueHost
};
interface ITestSetupConfig {
    services: IJivsServices,
    valueHostsManager: IValueHostsManager,
    config: ValidatorsValueHostBaseConfig,
    state: ValidatorsValueHostBaseInstanceState,
    valueHost: TestValidatorsValueHost
};

function createValidatorsValueHostBaseConfig(fieldNumber: number = 1,
    dataType: string = LookupKey.String,
    initialValue?: any): ValidatorsValueHostBaseConfig {
    return {
        name: 'Field' + fieldNumber,
        label: 'Label' + fieldNumber,
        valueHostType: TestValueHostType,
        dataType: dataType,
        initialValue: initialValue,
        validatorConfigs: null
    };
}
function finishPartialValidatorsValueHostBaseConfig(partialConfig: Partial<ValidatorsValueHostBaseConfig> | null):
    ValidatorsValueHostBaseConfig {
    let defaultIVH = createValidatorsValueHostBaseConfig(1, LookupKey.String);
    if (partialConfig) {
        return { ...defaultIVH, ...partialConfig };
    }
    return defaultIVH;
}

function finishPartialValidatorsValueHostBaseConfigs(partialConfigs: Array<Partial<ValidatorsValueHostBaseConfig>> | null):
    Array<ValidatorsValueHostBaseConfig> | null {
    let result: Array<ValidatorsValueHostBaseConfig> = [];
    if (partialConfigs) {
        for (let i = 0; i < partialConfigs.length; i++) {
            let vhd = partialConfigs[i];
            result.push(finishPartialValidatorsValueHostBaseConfig(vhd));
        }
    }

    return result;
}
function createValidatorConfig(condConfig: ConditionConfig | null): ValidatorConfig {
    return {
        validatorType: ValidatorType.Validator,
        conditionConfig: condConfig,
        errorMessage: 'Local',
        summaryMessage: 'Summary',
    };
}
function finishPartialValidatorConfig(validatorConfig: Partial<ValidatorConfig> | null):
    ValidatorConfig {
    let defaultIVD = createValidatorConfig(null);
    if (validatorConfig) {
        return { ...defaultIVD, ...validatorConfig };
    }
    return defaultIVD;
}

function finishPartialValidatorConfigs(validatorConfigs: Array<Partial<ValidatorConfig>> | null):
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

function createValidatorsValueHostBaseInstanceState(fieldNumber: number = 1): ValidatorsValueHostBaseInstanceState {
    return {
        name: 'Field' + fieldNumber,
        value: undefined,
        issuesFound: null,
        status: ValidationStatus.NotAttempted
    };
}
function finishPartialValidatorsValueHostBaseInstanceState(partialState: Partial<ValidatorsValueHostBaseInstanceState> | null): ValidatorsValueHostBaseInstanceState {
    let defaultIVS = createValidatorsValueHostBaseInstanceState(1);
    if (partialState) {
        return { ...defaultIVS, ...partialState };
    }
    return defaultIVS;
}



/**
 * Returns an ValueHost (ValidatorsValueHostBase subclass) ready for testing.
 * @param partialIVHConfig - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * name: 'Field1',
 * label: 'Label1',
 * valueHostType: 'Test',
 * DataType: LookupKey.String,
 * InitialValue: 'DATA'
 * @param partialState - Use the default state by passing null. Otherwise pass
 * a state. Your state will override default values. To avoid overriding,
 * pass the property with a value of undefined.
 * These are the default values
 * name: 'Test'
 * Value: undefined
 * TextValue: undefined
 * IssuesFound: null,
 * ValidationStatus: NotAttempted
 * @returns An object with all of the parts that were setup including 
 * ValueHostsManager, Services, ValueHosts, the complete Config,
 * and the state.
 */
function setupValidatorsValueHostBase(
    partialIVHConfig?: Partial<ValidatorsValueHostBaseConfig> | null,
    partialState?: Partial<ValidatorsValueHostBaseInstanceState> | null): ITestSetupConfigWithMocks {
    let services = new MockJivsServices(true, true);
    supportTestValueHostInServices(services);

    let vhm = new MockValueHostsManager(services);
    let updatedConfig = finishPartialValidatorsValueHostBaseConfig(partialIVHConfig ?? null);
    let updatedState = finishPartialValidatorsValueHostBaseInstanceState(partialState ?? null);

    let vh = vhm.addValueHost(updatedConfig, updatedState) as TestValidatorsValueHost;

    //new ValidatorsValueHostBase(vhm, updatedConfig, updatedState);
    return {
        services: services,
        valueHostsManager: vhm,
        config: updatedConfig,
        state: updatedState,
        valueHost: vh as TestValidatorsValueHost
    };
}


/**
 * Creates a configuration where you can call validate() and test various results.
 * @param partialValidatorConfigs - Always provide a list of the validatorConfigs in the desired order.
 * If null, no validators are made available to validate
 * @param partialValidatorsState - Use to supply initial Validators and Value properties. Any property
 * not supplied will be provided.
 * @returns Configuration that has been setup. Use valueHost to invoke validation functions.
 */
function setupValidatorsValueHostBaseForValidate(
    partialValidatorConfigs: Array<Partial<ValidatorConfig>> | null,
    partialValidatorsState: Partial<ValidatorsValueHostBaseInstanceState> | null,
    vhGroup?: string | null): ITestSetupConfigWithMocks {

    let fieldValueConfig: Partial<ValidatorsValueHostBaseConfig> = {
        validatorConfigs: partialValidatorConfigs ?
            finishPartialValidatorConfigs(partialValidatorConfigs) :
            undefined
    };
    if (vhGroup !== undefined)
        fieldValueConfig.group = vhGroup;

    let updatedState = finishPartialValidatorsValueHostBaseInstanceState(
        { ...partialValidatorsState });

    return setupValidatorsValueHostBase(fieldValueConfig, updatedState);
}

type AsyncOwnedIssue = IssueFound & { asyncIdentity: string };

/**
 * Sets up a host with real async validators and, optionally, previously stored issues.
 * Seeding issues isolates replacement tests from the unfinished async result handling.
 */
function setupAsyncIssueHost(
    handlers: Array<{
        identity: string,
        handler: AsyncValidatorEvaluateHandler,
        restartWhenPending?: RestartWhenPending,
        skipOnModelLevelValidation?: boolean
    }>,
    issues: AsyncOwnedIssue[] = [],
    standardValidators: ValidatorConfig[] = []
) {
    let validatorConfigs: AsyncValidatorConfig[] = handlers.map(({ identity, handler, restartWhenPending, skipOnModelLevelValidation }) => ({
        validatorType: ValidatorType.AsyncValidator,
        handlerIdentity: identity,
        handler,
        restartWhenPending,
        skipOnModelLevelValidation
    }));
    let setup = setupValidatorsValueHostBase({ validatorConfigs: [...standardValidators, ...validatorConfigs] });
    let logger = new TestingLoggingService(LoggingLevel.Debug);
    setup.services.loggingService = logger;
    if (issues.length)
        setup.valueHost.updateInstanceState(state => {
            state.issuesFound = issues;
            state.status = ValidationStatus.Invalid;
            return state;
        }, setup.valueHost);
    logger.clearAll();
    return { ...setup, logger };
}

/**
 * Sets up a real manager with one async validator that depends on a second value host.
 */
function setupAsyncDependencyHost(handler: AsyncValidatorEvaluateHandler) {
    let services = createJivsServicesForTesting({ loggerLevel: LoggingLevel.Debug });
    supportTestValueHostInServices(services);
    let logger = services.loggingService as TestingLoggingService;
    let manager = new ValueHostsManager(<ValueHostsManagerConfig>{
        services,
        valueHostConfigs: [
            <ValidatorsValueHostBaseConfig>{
                name: 'Field1',
                label: 'Label1',
                valueHostType: TestValueHostType,
                validatorConfigs: [<AsyncValidatorConfig>{
                    validatorType: ValidatorType.AsyncValidator,
                    handlerIdentity: 'DependentCheck',
                    handler,
                    dependencyValueHostNames: ['Field2']
                }]
            },
            {
                name: 'Field2',
                label: 'Label2',
                valueHostType: TestValueHostType,
                validatorConfigs: null!
            }
        ]
    });
    return {
        valueHost: manager.getValueHost('Field1') as TestValidatorsValueHost,
        dependency: manager.getValueHost('Field2') as TestValidatorsValueHost,
        logger
    };
}

/**
 * Starts validation and waits for every validator Promise registered by the host.
 */
async function finishAsyncIssueValidation(valueHost: TestValidatorsValueHost, logger: TestingLoggingService) {
    let result = valueHost.validate();
    expect(result?.pending?.length).toBeGreaterThan(0);
    let pending = [...result!.pending!];
    await Promise.all(pending);
    expect(logger.findMessage('Validation result:', LoggingLevel.Info, LoggingCategory.Result)).not.toBeNull();
    expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
}

function asyncIssue(identity: string, code: string, message: string): AsyncOwnedIssue {
    return {
        asyncIdentity: identity,
        valueHostName: 'Field1',
        errorCode: code,
        errorMessage: message,
        severity: ValidationSeverity.Error,
        doNotSave: true
    };
}

class FailedPromiseValidator extends Validator {
    public override validate(options: ValidateOptions): Promise<ValidatorValidateResult> {
        return Promise.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            failedToResolve: new Error('Legacy promise failed')
        });
    }
}

class FailedPromiseValidatorFactory implements IValidatorFactory {
    public create(valueHost: IValidatorsValueHost, config: ValidatorConfig): IValidator {
        return new FailedPromiseValidator(valueHost, config);
    }
    public canCreate(): boolean {
        return true;
    }
}

// A severe validation exception must abandon its promises without leaving the host saveable or pending.
describe('ValidatorsValueHostBase severe validation cleanup', () => {
    test('A failed replacement invalidates an earlier async run and permits a later retry', async () => {
        let resolvers: Array<(result: AsyncValidatorEvaluationResult) => void> = [];
        let shouldThrow = false;
        let severeError = new CodingError('Synchronous validator failed');
        let setup = setupAsyncIssueHost([{
            identity: 'DeferredCheck',
            handler: () => new Promise(resolve => { resolvers.push(resolve); })
        }], [], [{
            validatorType: ValidatorType.Validator,
            conditionConfig: null,
            conditionCreator: () => ({
                conditionType: 'FailingCondition',
                category: ConditionCategory.Undetermined,
                evaluate: () => {
                    if (shouldThrow)
                        throw severeError;
                    return ConditionEvaluateResult.Match;
                }
            })
        }]);
        let notifications: ValueHostValidationState[] = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };

        let first = setup.valueHost.validate()!;
        let firstPending = [...first.pending!];
        expect(setup.valueHost.asyncProcessing).toBe(true);

        shouldThrow = true;
        expect(() => setup.valueHost.validate()).toThrow(severeError);
        expect(resolvers).toHaveLength(1);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(notifications[notifications.length - 1]).toEqual(expect.objectContaining({
            status: ValidationStatus.NeedsValidation, doNotSave: true, asyncProcessing: false
        }));

        // The obsolete request resolves after the exception and must not update the host.
        resolvers[0]({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'StaleIssue',
            errorMessage: 'Must not be applied'
        });
        await Promise.all(firstPending);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(first.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toBeNull();

        shouldThrow = false;
        let retry = setup.valueHost.validate()!;
        let retryPending = [...retry.pending!];
        resolvers[1]({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(retryPending);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.doNotSave).toBe(false);
        expect(setup.logger.findMessage('Synchronous validator failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
    });

    test('A notification failure is logged without replacing the original severe error', () => {
        let setup = setupValidatorsValueHostBaseForValidate([
            { conditionConfig: { conditionType: ThrowsSevereExceptionConditionType } }
        ], null);
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        setup.services.loggingService = logger;
        setup.valueHostsManager.onValueHostValidationStateChanged = () => { throw new Error('Observer failed'); };

        expect(() => setup.valueHost.validate()).toThrow('Always Throws');
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(logger.findMessage('Always Throws', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(logger.findMessage('Validation cleanup failed: Observer failed', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
    });

    test('Cleanup preserves an earlier async failure and respects skipCallback', async () => {
        let shouldThrow = false;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: new Error('Service offline')
            })
        }], [], [{
            validatorType: ValidatorType.Validator,
            conditionConfig: null,
            conditionCreator: () => ({
                conditionType: 'FailingCondition',
                category: ConditionCategory.Undetermined,
                evaluate: () => {
                    if (shouldThrow)
                        throw new CodingError('Synchronous validator failed');
                    return ConditionEvaluateResult.Match;
                }
            })
        }]);
        let first = setup.valueHost.validate()!;
        await Promise.all([...first.pending!]);
        let callbacks = 0;
        setup.valueHostsManager.onValueHostValidationStateChanged = () => { callbacks++; };

        shouldThrow = true;
        expect(() => setup.valueHost.validate({ skipCallback: true })).toThrow('Synchronous validator failed');
        expect(setup.valueHost.exposeState.status).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(callbacks).toBe(0);
        expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.findMessage('Synchronous validator failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
    });

    test('A reentrant newer validation remains pending when the older run throws', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let nestedResult: ValueHostValidateResult | null = null;
        let isOuterRun = true;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }], [], [{
            validatorType: ValidatorType.Validator,
            conditionConfig: null,
            conditionCreator: () => ({
                conditionType: 'ReentrantCondition',
                category: ConditionCategory.Undetermined,
                evaluate: () => {
                    if (isOuterRun) {
                        isOuterRun = false;
                        nestedResult = setup.valueHost.validate();
                        throw new CodingError('Outer validation failed');
                    }
                    return ConditionEvaluateResult.Match;
                }
            })
        }]);

        expect(() => setup.valueHost.validate()).toThrow('Outer validation failed');
        expect(setup.valueHost.asyncProcessing).toBe(true);
        expect(setup.valueHost.doNotSave).toBe(true);
        let pending = [...nestedResult!.pending!];
        finish({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(pending);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.doNotSave).toBe(false);
        expect(setup.logger.findMessage('Outer validation failed', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
    });
});

// Obsolete validation loops must stop without cancelling or overwriting newer work.
describe('ValidatorsValueHostBase reentrant validation loop', () => {
    test('A nested validation remains pending when the outer synchronous validator returns', async () => {
        let nestedResult: ValueHostValidateResult | null = null;
        let isOuterRun = true;
        let calls = 0;
        let signal!: AbortSignal;
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidatorsValueHostBase({
            validatorConfigs: [<ValidatorConfig>{
                validatorType: ValidatorType.Validator,
                conditionConfig: null,
                conditionCreator: () => ({
                    conditionType: 'ReentrantCondition',
                    category: ConditionCategory.Undetermined,
                    evaluate: () => {
                        if (isOuterRun) {
                            isOuterRun = false;
                            nestedResult = setup.valueHost.validate();
                        }
                        return ConditionEvaluateResult.Match;
                    }
                })
            }, <AsyncValidatorConfig>{
                validatorType: ValidatorType.AsyncValidator,
                handlerIdentity: 'AvailabilityCheck',
                restartWhenPending: RestartWhenPending.Always,
                handler: (_host, _manager, abortSignal) => {
                    calls++;
                    signal = abortSignal;
                    return new Promise(resolve => { finish = resolve; });
                }
            }]
        });
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        setup.services.loggingService = logger;

        setup.valueHost.validate();

        expect(calls).toBe(1);
        expect(signal.aborted).toBe(false);
        expect(setup.valueHost.asyncProcessing).toBe(true);
        expect(setup.valueHost.doNotSave).toBe(true);
        let pending = [...nestedResult!.pending!];
        finish({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(pending);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('An abort listener can start a newer validation without the older loop restarting it', async () => {
        let nestedResult: ValueHostValidateResult | null = null;
        let calls = 0;
        let latestSignal!: AbortSignal;
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidatorsValueHostBase({
            validatorConfigs: [<AsyncValidatorConfig>{
                validatorType: ValidatorType.AsyncValidator,
                handlerIdentity: 'AvailabilityCheck',
                restartWhenPending: RestartWhenPending.Always,
                handler: (host, _manager, signal) => {
                    calls++;
                    latestSignal = signal;
                    if (calls === 1)
                        signal.addEventListener('abort', () => { nestedResult = host.validate(); });
                    return new Promise(resolve => { finish = resolve; });
                }
            }]
        });
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        setup.services.loggingService = logger;
        let first = [...setup.valueHost.validate()!.pending!];

        setup.valueHost.validate();

        expect(calls).toBe(2);
        expect(latestSignal.aborted).toBe(false);
        expect(setup.valueHost.asyncProcessing).toBe(true);
        expect(setup.valueHost.doNotSave).toBe(true);
        await Promise.all(first);
        let pending = [...nestedResult!.pending!];
        finish({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(pending);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('An obsolete Promise remains observed without starting later validators', async () => {
        let laterCalls = 0;
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'FirstCheck',
            handler: host => {
                host.setValue('changed', { validate: false });
                return new Promise(resolve => { finish = resolve; });
            }
        }, {
            identity: 'LaterCheck',
            handler: async () => {
                laterCalls++;
                return { conditionEvaluateResult: ConditionEvaluateResult.Match };
            }
        }]);

        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];
        expect(laterCalls).toBe(0);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        finish({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(pending);
        expect(result.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// Pending work must be associated with the current host validation or explicitly skipped.
describe('ValidatorsValueHostBase pending async policies', () => {
    test('Reuses unchanged pending work and publishes its issue only for the latest validation', async () => {
        let calls = 0;
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => {
                calls++;
                return new Promise(resolve => { finish = resolve; });
            }
        }]);

        let first = setup.valueHost.validate()!;
        let firstPending = [...first.pending!];
        let second = setup.valueHost.validate()!;
        let secondPending = [...second.pending!];
        expect(calls).toBe(1);
        expect(secondPending[0]).toBe(firstPending[0]);
        expect(setup.valueHost.asyncProcessing).toBe(true);
        expect(setup.valueHost.doNotSave).toBe(true);

        finish({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Taken'
        });
        await Promise.all([...firstPending, ...secondPending]);

        expect(first.pending).toBeUndefined();
        expect(second.pending).toBeUndefined();
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.getIssuesFound()).toEqual([
            expect.objectContaining({ asyncIdentity: 'AvailabilityCheck', errorCode: 'NameTaken' })
        ]);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Model-level skip cancels pending work and ignores its late result', async () => {
        let calls = 0;
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let signal!: AbortSignal;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            skipOnModelLevelValidation: true,
            handler: (_host, _manager, abortSignal) => {
                calls++;
                signal = abortSignal;
                return new Promise(resolve => { finish = resolve; });
            }
        }]);

        let first = setup.valueHost.validate()!;
        let pending = [...first.pending!];
        expect(setup.valueHost.validate({ isModelLevel: true })).toBeNull();
        expect(signal.aborted).toBe(true);
        expect(calls).toBe(1);
        await expect(pending[0]).resolves.toMatchObject({ skipped: true });
        finish({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'Stale',
            errorMessage: 'Must not be applied'
        });
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(first.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.doNotSave).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// Failed async checks block saving and expose a safe issue through the ValueHost and manager.
describe('ValidatorsValueHostBase async resolution failures', () => {
    test('A legacy Promise explicitly reporting failedToResolve also blocks saving', async () => {
        let setup = setupValidatorsValueHostBaseForValidate([
            { conditionConfig: { conditionType: AlwaysMatchesConditionType } }
        ], null);
        setup.services.validatorFactory = new FailedPromiseValidatorFactory();
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        setup.services.loggingService = logger;
        let result = setup.valueHost.validate()!;
        await Promise.all([...result.pending!]);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(logger.findMessage('Validation result:', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();
    });

    test('Records a failed handler, displays its safe issue, and includes it in the manager snapshot', async () => {
        let failure = new Error('Availability service unavailable');
        let setup = setupAsyncDependencyHost(async () => ({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: failure,
            errorCode: 'AvailabilityCheckUnavailable',
            errorMessage: 'Unable to verify this account right now.'
        }));
        let notifications: ValueHostValidationState[] = [];
        let manager = setup.valueHost.valueHostsManager as ValueHostsManager;
        manager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };

        let result = setup.valueHost.validate()!;
        await Promise.all([...result.pending!]);

        expect(result.status).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toEqual(expect.arrayContaining([
            expect.objectContaining({
                asyncIdentity: 'DependentCheck',
                valueHostName: 'Field1',
                errorCode: 'AvailabilityCheckUnavailable',
                errorMessage: 'Unable to verify this account right now.',
                severity: ValidationSeverity.Error,
                doNotSave: true
            })
        ]));
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['DependentCheck']);
        expect(manager.doNotSave).toBe(true);
        expect(manager.getIssuesFound()).toEqual(expect.arrayContaining([
            expect.objectContaining({
                asyncIdentity: 'DependentCheck',
                errorCode: 'AvailabilityCheckUnavailable',
                errorMessage: 'Unable to verify this account right now.'
            })
        ]));
        expect(manager.currentValidationState().issuesFound).toEqual(expect.arrayContaining([
            expect.objectContaining({
                asyncIdentity: 'DependentCheck',
                errorCode: 'AvailabilityCheckUnavailable'
            })
        ]));
        expect(notifications[notifications.length - 1]).toEqual(expect.objectContaining({
            status: ValidationStatus.Failed, doNotSave: true, asyncProcessing: false
        }));
        expect(setup.logger.findMessage('Availability service unavailable', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'Validator', identity: 'DependentCheck' })).toBeTruthy();
    });

    test('A skipped failed handler remains blocked while another handler succeeds, then its own retry clears it', async () => {
        let failAvailability = true;
        let failCredit = true;
        let setup = setupAsyncIssueHost([
            {
                identity: 'AvailabilityCheck',
                handler: async () => failAvailability
                    ? { conditionEvaluateResult: ConditionEvaluateResult.Undetermined, failedToResolve: new Error('Availability offline') }
                    : { conditionEvaluateResult: ConditionEvaluateResult.Match }
            },
            {
                identity: 'CreditCheck',
                handler: async () => failCredit
                    ? { conditionEvaluateResult: ConditionEvaluateResult.Undetermined, failedToResolve: new Error('Credit offline') }
                    : { conditionEvaluateResult: ConditionEvaluateResult.Match }
            }
        ]);
        let first = setup.valueHost.validate()!;
        await Promise.all([...first.pending!]);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck', 'CreditCheck']);

        failAvailability = false;
        setup.valueHost.getValidator('CreditCheck')!.setEnabled(false);
        let second = setup.valueHost.validate()!;
        expect(second.status).toBe(ValidationStatus.Failed);
        await Promise.all([...second.pending!]);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['CreditCheck']);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);

        failCredit = false;
        setup.valueHost.getValidator('CreditCheck')!.setEnabled(true);
        let third = setup.valueHost.validate()!;
        await Promise.all([...third.pending!]);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.doNotSave).toBe(false);
        expect(setup.logger.findMessage('Availability offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.findMessage('Credit offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'CreditCheck' })).toBeTruthy();
    });

    test('Promise-skipped validators keep processing pending until the last result and retain prior failures', async () => {
        let setup = setupAsyncIssueHost([
            {
                identity: 'AvailabilityCheck',
                handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
            },
            {
                identity: 'CreditCheck',
                handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
            }
        ]);
        setup.valueHost.updateInstanceState(state => {
            state.status = ValidationStatus.Failed;
            state.failedAsyncIdentities = ['AvailabilityCheck'];
            return state;
        }, setup.valueHost);
        let finishers: Array<(result: ValidatorValidateResult) => void> = [];
        for (let validator of setup.valueHost.exposeValidators)
            validator.validate = () => new Promise(resolve => { finishers.push(resolve); });

        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];
        expect(setup.valueHost.asyncProcessing).toBe(true);

        let skippedResult: ValidatorValidateResult = {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            issueFound: null,
            skipped: true
        };
        finishers[0](skippedResult);
        await pending[0];
        expect(setup.valueHost.asyncProcessing).toBe(true);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);

        finishers[1](skippedResult);
        await pending[1];

        expect(result.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A warning on retry clears the handler failure without blocking saving', async () => {
        let failed = true;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => failed
                ? { conditionEvaluateResult: ConditionEvaluateResult.Undetermined, failedToResolve: new Error('Service offline') }
                : {
                    conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                    errorCode: 'NameWarning', errorMessage: 'Please check the name',
                    severity: ValidationSeverity.Warning
                }
        }]);
        let first = setup.valueHost.validate()!;
        await Promise.all([...first.pending!]);
        failed = false;
        let retry = setup.valueHost.validate()!;
        await Promise.all([...retry.pending!]);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.doNotSave).toBe(false);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toBeUndefined();
        expect(setup.valueHost.getIssuesFound()).toEqual([expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck', errorCode: 'NameWarning',
            severity: ValidationSeverity.Warning, doNotSave: false
        })]);
        expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
    });

    test('An undetermined retry retains the failure but a later NoMatch clears it and reports the issue', async () => {
        let attempt = 0;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => {
                attempt++;
                if (attempt === 1)
                    return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined, failedToResolve: new Error('Service offline') };
                if (attempt === 2)
                    return { conditionEvaluateResult: ConditionEvaluateResult.Undetermined };
                return { conditionEvaluateResult: ConditionEvaluateResult.NoMatch, errorCode: 'NameTaken', errorMessage: 'Taken' };
            }
        }]);
        let first = setup.valueHost.validate()!;
        await Promise.all([...first.pending!]);
        let second = setup.valueHost.validate()!;
        await Promise.all([...second.pending!]);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        let third = setup.valueHost.validate()!;
        await Promise.all([...third.pending!]);

        expect(setup.valueHost.exposeState.failedAsyncIdentities).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.getIssuesFound()).toEqual([expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck', errorCode: 'NameTaken'
        })]);
        expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
    });

    test('Failed takes precedence over an invalid issue without discarding it', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: new Error('Service offline')
            })
        }], [], [createValidatorConfig({ conditionType: NeverMatchesConditionType })]);
        let result = setup.valueHost.validate()!;
        await Promise.all([...result.pending!]);

        expect(setup.valueHost.getIssuesFound()).toEqual(expect.arrayContaining([
            expect.objectContaining({ errorCode: NeverMatchesConditionType }),
            expect.objectContaining({
                asyncIdentity: 'AvailabilityCheck',
                errorCode: 'AsyncValidationFailed',
                doNotSave: true
            })
        ]));
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        setup.valueHost.addExternalIssueFound({ errorCode: 'ServerOnly', errorMessage: 'Server issue', doNotSave: false }, false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
    });

    test('Clearing or disabling retains the failure but a disabled host does not block saving', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: new Error('Service offline')
            })
        }]);
        let result = setup.valueHost.validate()!;
        await Promise.all([...result.pending!]);

        setup.valueHost.clearValidation();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        setup.valueHost.setEnabled(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        expect(setup.valueHost.doNotSave).toBe(false);
        setup.valueHost.setEnabled(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
    });

    test('A rejected handler is logged, blocks saving, and shows the global failure issue', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => { throw new Error('Unexpected rejection'); }
        }]);
        let result = setup.valueHost.validate()!;
        await Promise.allSettled([...result.pending!]);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.getIssuesFound()).toEqual(expect.arrayContaining([
            expect.objectContaining({
                asyncIdentity: 'AvailabilityCheck',
                errorCode: 'AsyncValidationFailed',
                severity: ValidationSeverity.Error,
                doNotSave: true
            })
        ]));
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        expect(setup.logger.findMessage('Unexpected rejection', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toHaveLength(1);
    });

    test.each([
        {
            outcome: 'Match', evaluation: { conditionEvaluateResult: ConditionEvaluateResult.Match },
            status: ValidationStatus.Valid, doNotSave: false, failed: false
        },
        {
            outcome: 'NoMatch', evaluation: {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken', errorMessage: 'Taken'
            },
            status: ValidationStatus.Invalid, doNotSave: true, failed: false
        },
        {
            outcome: 'Undetermined', evaluation: { conditionEvaluateResult: ConditionEvaluateResult.Undetermined },
            status: ValidationStatus.Undetermined, doNotSave: false, failed: false
        },
        {
            outcome: 'failedToResolve', evaluation: {
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: new Error('Service offline')
            },
            status: ValidationStatus.Failed, doNotSave: true, failed: true
        }
    ])('A throwing observer does not change the async $outcome result or receive a retry', async ({
        evaluation, status, doNotSave, failed
    }) => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }]);
        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];
        let notifications: ValueHostValidationState[] = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => {
            notifications.push(state);
            throw new Error('Observer failed');
        };
        finish(evaluation);
        await Promise.all(pending);
        // Flush the Promise chain's error handler as well as the validator Promise.
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.status).toBe(status);
        expect(setup.valueHost.validationStatus).toBe(status);
        expect(setup.valueHost.doNotSave).toBe(doNotSave);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(failed ? ['AvailabilityCheck'] : undefined);
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toEqual(expect.objectContaining({ status, doNotSave, asyncProcessing: false }));
        expect(setup.logger.findMessage('Async validation notification failed: Observer failed',
            LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        if (failed)
            expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
                { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toHaveLength(failed ? 2 : 1);
    });

    test('A throwing observer does not change or repeat notification of a rejected async handler', async () => {
        let reject!: (error: Error) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise((_, rejectPromise) => { reject = rejectPromise; })
        }]);
        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];
        let calls = 0;
        setup.valueHostsManager.onValueHostValidationStateChanged = () => {
            calls++;
            throw new Error('Observer failed');
        };
        reject(new Error('Unexpected rejection'));
        await Promise.allSettled(pending);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.status).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        expect(calls).toBe(1);
        expect(setup.logger.findMessage('Unexpected rejection', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.findMessage('Async validation notification failed: Observer failed', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toHaveLength(2);
    });

    test('A malformed async result still blocks saving when its failure notification throws', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
        }]);
        setup.valueHost.exposeValidators[0].validate = () => Promise.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            issueFound: null
        });
        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];
        let calls = 0;
        setup.valueHostsManager.onValueHostValidationStateChanged = () => {
            calls++;
            throw new Error('Observer failed');
        };
        await Promise.all(pending);
        // The malformed result is processed in a continuation after the validator Promise settles.
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.status).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        expect(calls).toBe(1);
        expect(setup.logger.findMessage('returned NoMatch without an issue', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(setup.logger.findMessage('Async validation notification failed: Observer failed', LoggingLevel.Error,
            LoggingCategory.Exception, { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toHaveLength(2);
    });

    test('A synchronous validation observer exception still propagates to the caller', () => {
        let setup = setupAsyncIssueHost([], [], [createValidatorConfig({ conditionType: AlwaysMatchesConditionType })]);
        setup.valueHostsManager.onValueHostValidationStateChanged = () => { throw new Error('Observer failed'); };

        expect(() => setup.valueHost.validate()).toThrow('Observer failed');
        expect(setup.logger.findMessage('Validation result: Valid', LoggingLevel.Info, LoggingCategory.Result,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('An older failure cannot overwrite a later successful validation', async () => {
        let finishFirst!: (result: AsyncValidatorEvaluationResult) => void;
        let finishSecond!: (result: AsyncValidatorEvaluationResult) => void;
        let calls = 0;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            restartWhenPending: RestartWhenPending.Always,
            handler: () => new Promise(resolve => {
                if (calls++ === 0)
                    finishFirst = resolve;
                else
                    finishSecond = resolve;
            })
        }]);
        let first = [...setup.valueHost.validate()!.pending!];
        let second = [...setup.valueHost.validate()!.pending!];
        expect(calls).toBe(2);
        expect(second[0]).not.toBe(first[0]);
        finishSecond({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(second);
        finishFirst({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined, failedToResolve: new Error('Old failure') });
        await Promise.all(first);
        // Cancellation settles the wrapper before the old handler's late result is observed.
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.doNotSave).toBe(false);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toBeUndefined();
        expect(setup.logger.findMessage('Old failure', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toHaveLength(1);
    });

    test('An older success cannot clear a later failed validation', async () => {
        let finishFirst!: (result: AsyncValidatorEvaluationResult) => void;
        let finishSecond!: (result: AsyncValidatorEvaluationResult) => void;
        let calls = 0;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            restartWhenPending: RestartWhenPending.Always,
            handler: () => new Promise(resolve => {
                if (calls++ === 0)
                    finishFirst = resolve;
                else
                    finishSecond = resolve;
            })
        }]);
        let first = [...setup.valueHost.validate()!.pending!];
        let second = [...setup.valueHost.validate()!.pending!];
        expect(calls).toBe(2);
        expect(second[0]).not.toBe(first[0]);
        finishSecond({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined, failedToResolve: new Error('Current failure') });
        await Promise.all(second);
        finishFirst({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(first);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Failed);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
        expect(setup.logger.findMessage('Current failure', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toHaveLength(1);
    });

    test('Editing without revalidation abandons a pending failure and clears its pending flag', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }]);
        let pending = [...setup.valueHost.validate()!.pending!];
        setup.valueHost.setValue('changed');
        expect(setup.valueHost.asyncProcessing).toBe(false);
        finish({ conditionEvaluateResult: ConditionEvaluateResult.Undetermined, failedToResolve: new Error('Old failure') });
        await Promise.all(pending);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toBeUndefined();
        expect(setup.logger.findMessage('Old failure', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
    });

    test('A group-mismatched validation does not invalidate the current pending run', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let calls = 0;
        let setup = setupValidatorsValueHostBase({
            group: 'GroupA',
            validatorConfigs: [<AsyncValidatorConfig>{
                validatorType: ValidatorType.AsyncValidator,
                handlerIdentity: 'AvailabilityCheck',
                handler: () => {
                    calls++;
                    return new Promise(resolve => { finish = resolve; });
                }
            }]
        });
        let logger = setup.services.loggingService as TestingLoggingService;
        let result = setup.valueHost.validate({ group: 'GroupA' })!;
        let pending = [...result.pending!];

        expect(setup.valueHost.validate({ group: 'GroupB' })).toBeNull();
        expect(calls).toBe(1);
        expect(setup.valueHost.asyncProcessing).toBe(true);

        finish({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Taken'
        });
        await Promise.all(pending);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toEqual([expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck',
            errorCode: 'NameTaken'
        })]);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A group-mismatched clearValidation does not invalidate the current pending run', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupValidatorsValueHostBase({
            group: 'GroupA',
            validatorConfigs: [<AsyncValidatorConfig>{
                validatorType: ValidatorType.AsyncValidator,
                handlerIdentity: 'AvailabilityCheck',
                handler: () => new Promise(resolve => { finish = resolve; })
            }]
        });
        let result = setup.valueHost.validate({ group: 'GroupA' })!;
        let pending = [...result.pending!];

        expect(setup.valueHost.clearValidation({ group: 'GroupB' })).toBe(false);
        expect(setup.valueHost.asyncProcessing).toBe(true);

        finish({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Taken'
        });
        await Promise.all(pending);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toEqual([expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck',
            errorCode: 'NameTaken'
        })]);
    });

    test('Clearing validation while a request is pending prevents its result from restoring validation state', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }]);
        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];

        expect(setup.valueHost.clearValidation()).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.asyncProcessing).toBe(false);

        finish({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Taken'
        });
        await Promise.all(pending);

        expect(result.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toBeUndefined();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Disabling a host while a request is pending prevents its result from restoring validation state', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }]);
        let pending = [...setup.valueHost.validate()!.pending!];

        setup.valueHost.setEnabled(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        expect(setup.valueHost.asyncProcessing).toBe(false);

        finish({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'NameTaken',
            errorMessage: 'Taken'
        });
        await Promise.all(pending);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(setup.valueHost.exposeState.failedAsyncIdentities).toBeUndefined();
        setup.valueHost.setEnabled(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Disposing a host while a request is pending lets the obsolete result settle without logging an error', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }]);
        let pending = [...setup.valueHost.validate()!.pending!];

        setup.valueHost.dispose();
        finish({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await Promise.all(pending);

        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Error)).toEqual([]);
    });

    test('A reported operational failure is still logged when its host was disposed while pending', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }]);
        let pending = [...setup.valueHost.validate()!.pending!];

        setup.valueHost.dispose();
        finish({
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: new Error('Late service failure')
        });
        await Promise.all(pending);
        // The handler may report its failure after disposal has settled the pending wrapper.
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(setup.logger.findMessage('Late service failure', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toHaveLength(1);
    });

    test.each([
        { name: 'preliminary', options: { preliminary: true } },
        { name: 'during-edit', options: { duringEdit: true } }
    ])('A $name validation does not start async handlers', ({ options }) => {
        let calls = 0;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => {
                calls++;
                return { conditionEvaluateResult: ConditionEvaluateResult.Match };
            }
        }]);

        expect(setup.valueHost.validate(options)).toBeNull();
        expect(calls).toBe(0);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Manager cached state reflects failure even when validation callbacks are skipped', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: new Error('Service offline')
            })
        }]);
        let manager = new ValueHostsManager({ services: setup.services, valueHostConfigs: [setup.config] });
        let host = manager.getValidatorsValueHost('Field1')!;
        let callbacks = 0;
        manager.onValueHostValidationStateChanged = () => { callbacks++; };
        let result = host.validate({ skipCallback: true })!;
        expect(manager.currentValidationState().asyncProcessing).toBe(true);
        await Promise.all([...result.pending!]);

        expect(callbacks).toBe(0);
        expect(manager.currentValidationState()).toEqual(expect.objectContaining({
            isValid: false, doNotSave: true, asyncProcessing: false
        }));
        expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
    });

    test('Captured failures survive restoration and are removed when their handler is removed', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                failedToResolve: new Error('Service offline')
            })
        }]);
        let result = setup.valueHost.validate()!;
        await Promise.all([...result.pending!]);
        let capturedState = setup.valueHostsManager.captureState();

        let restoredManager = new ValueHostsManager({
            services: setup.services, valueHostConfigs: [setup.config], capturedState
        });
        let restored = restoredManager.getValidatorsValueHost('Field1')!;
        expect(restored.validationStatus).toBe(ValidationStatus.Failed);
        expect(restored.doNotSave).toBe(true);
        expect(restoredManager.currentValidationState().doNotSave).toBe(true);

        let withoutHandler = { ...setup.config, validatorConfigs: [] };
        let removedManager = new ValueHostsManager({
            services: setup.services, valueHostConfigs: [withoutHandler], capturedState
        });
        let removed = removedManager.getValidatorsValueHost('Field1')!;
        expect(removed.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(removed.doNotSave).toBe(true);
        expect(setup.logger.findMessage('Service offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
    });

    test('Restoring after removing one failed handler retains the other failure', async () => {
        let setup = setupAsyncIssueHost([
            {
                identity: 'AvailabilityCheck',
                handler: async () => ({
                    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                    failedToResolve: new Error('Availability offline')
                })
            },
            {
                identity: 'CreditCheck',
                handler: async () => ({
                    conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                    failedToResolve: new Error('Credit offline')
                })
            }
        ]);
        let result = setup.valueHost.validate()!;
        await Promise.all([...result.pending!]);
        let capturedState = setup.valueHostsManager.captureState();
        let config = { ...setup.config, validatorConfigs: [setup.config.validatorConfigs![1]] };
        let manager = new ValueHostsManager({
            services: setup.services, valueHostConfigs: [config], capturedState
        });
        let host = manager.getValueHost('Field1') as TestValidatorsValueHost;

        expect(host.exposeState.failedAsyncIdentities).toEqual(['CreditCheck']);
        expect(host.validationStatus).toBe(ValidationStatus.Failed);
        expect(host.doNotSave).toBe(true);
        expect(setup.logger.findMessage('Availability offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'AvailabilityCheck' })).toBeTruthy();
        expect(setup.logger.findMessage('Credit offline', LoggingLevel.Error, LoggingCategory.Exception,
            { feature: 'Validator', identity: 'CreditCheck' })).toBeTruthy();
    });
});

// Async results must combine consistently regardless of the order in which requests settle.
describe('ValidatorsValueHostBase async result aggregation', () => {
    test('Runs synchronous validators before async validators even when the async config is listed first', async () => {
        let callOrder: string[] = [];
        let setup = setupValidatorsValueHostBase({
            validatorConfigs: [
                <AsyncValidatorConfig>{
                    validatorType: ValidatorType.AsyncValidator,
                    handlerIdentity: 'AvailabilityCheck',
                    handler: async () => {
                        callOrder.push('async');
                        return { conditionEvaluateResult: ConditionEvaluateResult.Match };
                    }
                },
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: null,
                    conditionCreator: () => ({
                        conditionType: 'SynchronousCondition',
                        category: ConditionCategory.Contents,
                        evaluate: () => {
                            callOrder.push('synchronous');
                            return ConditionEvaluateResult.Match;
                        }
                    })
                }
            ]
        });
        let logger = setup.services.loggingService as TestingLoggingService;

        let result = setup.valueHost.validate()!;
        expect(callOrder).toEqual(['synchronous', 'async']);
        expect(result.pending).toHaveLength(1);
        await Promise.all([...result.pending!]);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test.each([
        {
            outcome: 'Match',
            evaluation: { conditionEvaluateResult: ConditionEvaluateResult.Match },
            expectedIssueCount: 1
        },
        {
            outcome: 'Warning',
            evaluation: {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameWarning',
                errorMessage: 'Please review this name',
                severity: ValidationSeverity.Warning
            },
            expectedIssueCount: 2
        }
    ])('Preserves a synchronous error when the async validator resolves as $outcome', async ({
        evaluation, expectedIssueCount
    }) => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }], [], [createValidatorConfig({ conditionType: NeverMatchesConditionType })]);
        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        finish(evaluation);
        await Promise.all(pending);

        expect(result.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toHaveLength(expectedIssueCount);
        expect(setup.valueHost.getIssuesFound()).toEqual(expect.arrayContaining([
            expect.objectContaining({ errorCode: NeverMatchesConditionType, severity: ValidationSeverity.Error })
        ]));
        if (evaluation.conditionEvaluateResult === ConditionEvaluateResult.NoMatch)
            expect(setup.valueHost.getIssuesFound()).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    asyncIdentity: 'AvailabilityCheck',
                    errorCode: 'NameWarning',
                    severity: ValidationSeverity.Warning,
                    doNotSave: false
                })
            ]));
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test.each(['error-first', 'warning-first'] as const)(
        'Retains both async issues and blocks saving when the error settles %s',
        async order => {
            let finishError!: (result: AsyncValidatorEvaluationResult) => void;
            let finishWarning!: (result: AsyncValidatorEvaluationResult) => void;
            let setup = setupAsyncIssueHost([
                {
                    identity: 'ErrorCheck',
                    handler: () => new Promise(resolve => { finishError = resolve; })
                },
                {
                    identity: 'WarningCheck',
                    handler: () => new Promise(resolve => { finishWarning = resolve; })
                }
            ]);
            let notifications: ValueHostValidationState[] = [];
            setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };
            let result = setup.valueHost.validate()!;
            let pending = [...result.pending!];
            let errorResult: AsyncValidatorEvaluationResult = {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken',
                errorMessage: 'Taken'
            };
            let warningResult: AsyncValidatorEvaluationResult = {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameWarning',
                errorMessage: 'Please review this name',
                severity: ValidationSeverity.Warning
            };

            if (order === 'error-first') {
                finishError(errorResult);
                await pending[0];
                expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
                finishWarning(warningResult);
                await pending[1];
            }
            else {
                finishWarning(warningResult);
                await pending[1];
                expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
                finishError(errorResult);
                await pending[0];
            }

            expect(result.pending).toBeUndefined();
            expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
            expect(setup.valueHost.doNotSave).toBe(true);
            expect(setup.valueHost.asyncProcessing).toBe(false);
            expect(setup.valueHost.getIssuesFound()).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    asyncIdentity: 'ErrorCheck',
                    errorCode: 'NameTaken',
                    severity: ValidationSeverity.Error,
                    doNotSave: true
                }),
                expect.objectContaining({
                    asyncIdentity: 'WarningCheck',
                    errorCode: 'NameWarning',
                    severity: ValidationSeverity.Warning,
                    doNotSave: false
                })
            ]));
            expect(setup.valueHost.getIssuesFound()).toHaveLength(2);
            expect(notifications).toHaveLength(3);
            expect(notifications[notifications.length - 1]).toEqual(expect.objectContaining({
                status: ValidationStatus.Invalid,
                doNotSave: true,
                asyncProcessing: false
            }));
            expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
        }
    );

    test('A severe async issue does not prevent another already-started validator from settling', async () => {
        let finishSevere!: (result: AsyncValidatorEvaluationResult) => void;
        let finishWarning!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([
            {
                identity: 'SevereCheck',
                handler: () => new Promise(resolve => { finishSevere = resolve; })
            },
            {
                identity: 'WarningCheck',
                handler: () => new Promise(resolve => { finishWarning = resolve; })
            }
        ]);
        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];

        finishSevere({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'SevereIssue',
            errorMessage: 'Must be fixed',
            severity: ValidationSeverity.Severe
        });
        await pending[0];
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.asyncProcessing).toBe(true);

        finishWarning({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'WarningIssue',
            errorMessage: 'Please review',
            severity: ValidationSeverity.Warning
        });
        await pending[1];

        expect(setup.valueHost.getIssuesFound()).toHaveLength(2);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// The host must associate each displayed async result with the validator that produced it.
describe('ValidatorsValueHostBase async issue ownership', () => {
    test('Stores and captures the handler identity when an async validator reports an issue', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken',
                errorMessage: 'Already taken'
            })
        }]);

        await finishAsyncIssueValidation(setup.valueHost, setup.logger);
        expect(setup.valueHost.getIssuesFound()).toEqual([expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck',
            errorCode: 'NameTaken',
            errorMessage: 'Already taken'
        })]);
        let saved = restoreCapturedState(setup.valueHostsManager);
        expect(saved.vh[0]).toEqual(expect.objectContaining({
            issuesFound: [expect.objectContaining({
                asyncIdentity: 'AvailabilityCheck',
                errorCode: 'NameTaken'
            })]
        }));
    });

    test('Replaces the previous issue when the same handler returns a different code', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameReserved',
                errorMessage: 'Reserved name'
            })
        }], [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);

        await finishAsyncIssueValidation(setup.valueHost, setup.logger);
        expect(setup.valueHost.getIssuesFound()).toEqual([expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck',
            errorCode: 'NameReserved',
            errorMessage: 'Reserved name'
        })]);
    });

    test('Clears the previous issue when the same handler later succeeds', async () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
        }], [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);

        await finishAsyncIssueValidation(setup.valueHost, setup.logger);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
    });

    test('Keeps each identity with its issue when two handlers finish in reverse order', async () => {
        let finishAvailability!: (result: AsyncValidatorEvaluationResult) => void;
        let finishAlternate!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([
            { identity: 'AvailabilityCheck', handler: () => new Promise(resolve => { finishAvailability = resolve; }) },
            { identity: 'AlternateCheck', handler: () => new Promise(resolve => { finishAlternate = resolve; }) }
        ]);
        let result = setup.valueHost.validate();
        expect(result?.pending).toHaveLength(2);
        let pending = [...result!.pending!];

        finishAlternate({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, errorCode: 'AlternateInvalid', errorMessage: 'Alternate' });
        await pending[1];
        finishAvailability({ conditionEvaluateResult: ConditionEvaluateResult.NoMatch, errorCode: 'NameTaken', errorMessage: 'Taken' });
        await Promise.all(pending);

        expect(setup.valueHost.getIssuesFound()).toEqual([
            expect.objectContaining({ asyncIdentity: 'AlternateCheck', errorCode: 'AlternateInvalid' }),
            expect.objectContaining({ asyncIdentity: 'AvailabilityCheck', errorCode: 'NameTaken' })
        ]);
        expect(setup.logger.findMessage('Validation result:', LoggingLevel.Info, LoggingCategory.Result)).not.toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// External issues replace a known async issue without losing its handler identity.
describe('ValidatorsValueHostBase async issue external replacement', () => {
    let match: AsyncValidatorEvaluateHandler = async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match });

    test('Replaces the issue for the supplied identity even when the error code changes', () => {
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }],
            [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);
        let incoming = asyncIssue('AvailabilityCheck', 'NameReserved', 'Server says reserved');
        let notifications: ValueHostValidationState[] = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([expect.objectContaining(incoming)]);
        expect(setup.valueHost.exposeState.externalIssuesFound ?? null).toBeNull();
        expect(notifications).toHaveLength(1);
        expect(notifications[0].issuesFound).toEqual([expect.objectContaining(incoming)]);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Keeps an issue with the same code external when it has no async identity', () => {
        let original = asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken');
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }],
            [original]);
        let incoming: IssueFound = { errorCode: 'NameTaken', errorMessage: 'Server message', doNotSave: true };

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([original]);
        expect(setup.valueHost.exposeState.externalIssuesFound).toEqual([incoming]);
        expect(setup.valueHost.getIssuesFound()).toHaveLength(2);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Keeps a different code without an identity as a separate external issue', () => {
        let original = asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken');
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }], [original]);

        expect(setup.valueHost.addExternalIssueFound({
            errorCode: 'NameReserved',
            errorMessage: 'Server says reserved'
        }, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([original]);
        expect(setup.valueHost.exposeState.externalIssuesFound).toEqual([expect.objectContaining({
            errorCode: 'NameReserved',
            errorMessage: 'Server says reserved',
            doNotSave: false
        })]);
        expect(setup.valueHost.getIssuesFound()).toHaveLength(2);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A later successful validation clears a replacement owned by the handler', async () => {
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }],
            [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);
        let incoming = asyncIssue('AvailabilityCheck', 'NameReserved', 'Server says reserved');

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([expect.objectContaining(incoming)]);
        expect(setup.valueHost.exposeState.externalIssuesFound ?? null).toBeNull();

        await finishAsyncIssueValidation(setup.valueHost, setup.logger);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
    });

    test('Does not replace either handler when two issues share the external code but no identity is supplied', () => {
        let first = asyncIssue('AvailabilityCheck', 'NameTaken', 'First');
        let second = asyncIssue('AlternateCheck', 'NameTaken', 'Second');
        let setup = setupAsyncIssueHost([
            { identity: 'AvailabilityCheck', handler: match },
            { identity: 'AlternateCheck', handler: match }
        ], [first, second]);

        expect(setup.valueHost.addExternalIssueFound({
            errorCode: 'NameTaken',
            errorMessage: 'Server message',
            doNotSave: true
        }, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([first, second]);
        expect(setup.valueHost.exposeState.externalIssuesFound).toEqual([expect.objectContaining({
            errorCode: 'NameTaken',
            errorMessage: 'Server message'
        })]);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Uses the supplied identity rather than a matching code from another handler', () => {
        let first = asyncIssue('AvailabilityCheck', 'NameTaken', 'First');
        let second = asyncIssue('AlternateCheck', 'OtherCode', 'Second');
        let setup = setupAsyncIssueHost([
            { identity: 'AvailabilityCheck', handler: match },
            { identity: 'AlternateCheck', handler: match }
        ], [first, second]);
        let incoming = asyncIssue('AlternateCheck', 'NameTaken', 'Server message');

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([first, expect.objectContaining(incoming)]);
        expect(setup.valueHost.exposeState.externalIssuesFound ?? null).toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Keeps an identified issue external when that handler has no existing issue', () => {
        let standard = createValidatorConfig({ conditionType: NeverMatchesConditionType });
        standard.errorCode = 'NameTaken';
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }], [], [standard]);
        let incoming = asyncIssue('AvailabilityCheck', 'NameTaken', 'Server message');

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toBeNull();
        expect(setup.valueHost.exposeState.externalIssuesFound).toEqual([incoming]);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Does not let a standard validator claim an identified async issue with the same code', () => {
        let standard = createValidatorConfig({ conditionType: NeverMatchesConditionType });
        standard.errorCode = 'NameTaken';
        let original = asyncIssue('AvailabilityCheck', 'OtherCode', 'Old async message');
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }], [original], [standard]);
        let incoming = asyncIssue('AvailabilityCheck', 'NameTaken', 'Server message');

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([expect.objectContaining(incoming)]);
        expect(setup.valueHost.exposeState.externalIssuesFound ?? null).toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A standard swap without an identity does not replace an async issue with the same code', () => {
        let standard = createValidatorConfig({ conditionType: NeverMatchesConditionType });
        standard.errorCode = 'NameTaken';
        let original = asyncIssue('AvailabilityCheck', 'NameTaken', 'Async message');
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }], [original], [standard]);

        expect(setup.valueHost.addExternalIssueFound({
            errorCode: 'NameTaken',
            errorMessage: 'Server message'
        }, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toHaveLength(2);
        expect(setup.valueHost.exposeState.issuesFound).toEqual(expect.arrayContaining([
            original,
            expect.objectContaining({ errorCode: 'NameTaken', errorMessage: 'Local' })
        ]));
        expect(setup.valueHost.exposeState.externalIssuesFound ?? null).toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Uses a matching identity to replace an issue even when the external issue has no error code', () => {
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }],
            [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);
        let incoming: IssueFound = {
            asyncIdentity: 'AvailabilityCheck',
            errorMessage: 'Server message'
        };

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([expect.objectContaining({
            asyncIdentity: 'AvailabilityCheck',
            errorMessage: 'Server message'
        })]);
        expect(setup.valueHost.exposeState.externalIssuesFound ?? null).toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Repeating the same async swap does not add an external issue or notify again', () => {
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }],
            [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);
        let incoming = asyncIssue('AvailabilityCheck', 'NameReserved', 'Server message');
        let notifications: ValueHostValidationState[] = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(false);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([expect.objectContaining(incoming)]);
        expect(setup.valueHost.exposeState.externalIssuesFound ?? null).toBeNull();
        expect(notifications).toHaveLength(1);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('An async warning replacement does not leave the host invalid or block saving', () => {
        let setup = setupAsyncIssueHost([{ identity: 'AvailabilityCheck', handler: match }],
            [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);
        let incoming: AsyncOwnedIssue = {
            ...asyncIssue('AvailabilityCheck', 'NameReserved', 'Warning'),
            severity: ValidationSeverity.Warning,
            doNotSave: false
        };

        expect(setup.valueHost.addExternalIssueFound(incoming, false)).toBe(true);
        expect(setup.valueHost.exposeState.issuesFound).toEqual([expect.objectContaining(incoming)]);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.doNotSave).toBe(false);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});
describe('hasAsyncValidators', () =>
{
    function testHandler(valueHost: IValidatorsValueHost,
        valueHostsManager: IValueHostsManager,
        signal: AbortSignal
    ) : Promise<AsyncValidatorEvaluationResult>
    {
        return Promise.resolve({
            conditionEvaluateResult: ConditionEvaluateResult.Match
        });
    }

    test('Initially hasAsyncValidators is false', () => {
        let setup = setupValidatorsValueHostBase();
        expect(setup.valueHost.hasAsyncValidators).toBe(false);
    });
    test('After adding an async validator, hasAsyncValidators becomes true', () => {
        let ivConfigs: Array<Partial<ValidatorConfigBase>> = [
            <AsyncValidatorConfig>{
                validatorType: ValidatorType.AsyncValidator,
                handler: testHandler,
                handlerIdentity: 'testHandler'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        expect(setup.valueHost.hasAsyncValidators).toBe(true);
    });
    test('Validators are all sync resolves as false', () => {
        let ivConfigs: Array<Partial<ValidatorConfigBase>> = [
            <ValidatorConfig>{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        expect(setup.valueHost.hasAsyncValidators).toBe(false);
    });
    // mixture
    test('Mixture of sync and async validators', () => {
        let ivConfigs: Array<Partial<ValidatorConfigBase>> = [
            <ValidatorConfig>{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            },
            <AsyncValidatorConfig>{
                validatorType: ValidatorType.AsyncValidator,
                handler: testHandler,
                handlerIdentity: 'testHandler'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        expect(setup.valueHost.hasAsyncValidators).toBe(true);
    });
    // asyncValidatorConfig has handler and handlerIdentity but validatorType is different
    test('Async validator config with different validatorType still async when it has handler and handlerIdentity properties', () => {
        let ivConfigs: Array<Partial<ValidatorConfigBase>> = [
            <AsyncValidatorConfig>{
                validatorType: 'Test',
                handler: testHandler,
                handlerIdentity: 'testHandler'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        expect(setup.valueHost.hasAsyncValidators).toBe(true);
    });
    test('Async validator config without handler or handlerIdentity is not counted as async', () => {
        let ivConfigs: Array<Partial<ValidatorConfigBase>> = [
            <AsyncValidatorConfig>{
                validatorType: 'Test'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        expect(setup.valueHost.hasAsyncValidators).toBe(false);
    });
});


describe('ValidatorsValueHostBase.getValidator', () => {
    test('Request errorCode without any validators setup return null', () => {
        let setup = setupValidatorsValueHostBase();
        expect(setup.valueHost.getValidator('anything')).toBeNull();
    });

    test('With 1 validator registered, request its errorCode. Returns the correct Validator', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        let result = setup.valueHost.getValidator(ConditionType.RequireText);
        expect(result).toBeInstanceOf(Validator);
        expect((result as Validator).errorCode).toBe(ConditionType.RequireText);
    });
    test('With 1 validator registered, request a different errorCode. Returns null', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        (setup.services.conditionFactory as ConditionFactory).register<RegExpConditionConfig>(
            ConditionType.RegExp, (config) => new RegExpCondition(config));
        let result = setup.valueHost.getValidator(ConditionType.RegExp);
        expect(result).toBeNull();
    });
    test('With 4 validators registered, request each and it returns the correct Validator', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            },
            {
                conditionConfig: {
                    conditionType: ConditionType.RegExp
                }
            },
            {
                conditionConfig: {
                    conditionType: ConditionType.StringLength
                }
            },
            {
                conditionConfig: {
                    conditionType: ConditionType.All
                }
            },
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        let cf = setup.services.conditionFactory as ConditionFactory;
        cf.register<RegExpConditionConfig>(
            ConditionType.RegExp, (config) => new RegExpCondition(config));
        cf.register<StringLengthConditionConfig>
            (ConditionType.StringLength, (config) => new StringLengthCondition(config));
        cf.register<AllMatchConditionConfig>
            (ConditionType.All, (config) => new AllMatchCondition(config));


        let result = setup.valueHost.getValidator(ConditionType.RequireText);
        expect(result).toBeInstanceOf(Validator);
        expect((result as Validator).errorCode).toBe(ConditionType.RequireText);
        result = setup.valueHost.getValidator(ConditionType.RegExp);
        expect(result).toBeInstanceOf(Validator);
        expect((result as Validator).errorCode).toBe(ConditionType.RegExp);
        result = setup.valueHost.getValidator(ConditionType.StringLength);
        expect(result).toBeInstanceOf(Validator);
        expect((result as Validator).errorCode).toBe(ConditionType.StringLength);
        result = setup.valueHost.getValidator(ConditionType.All);
        expect(result).toBeInstanceOf(Validator);
        expect((result as Validator).errorCode).toBe(ConditionType.All);
        result = setup.valueHost.getValidator('Anything');
        expect(result).toBeNull();
    });
});
/**
 * For testing ValidatorsValueHostBase.validate (but not the logic of an individual Validator.validate).
 * @param validatorConfigs - Always provide a list of the validatorConfigs in the desired order.
 * If null, no validators are made available to validate
 * @param fieldValueState - Use to supply initial TextValue and Value properties. Any property
 * not supplied will be provided.
 * @param expectedValidationStatusCode 
 * @param expectedIssuesFound - This will be matched by Jest's isEqual.
 */
function testValidateFunctionHasResult(validatorConfigs: Array<Partial<ValidatorConfig>> | null,
    fieldValueState: Partial<ValidatorsValueHostBaseInstanceState> | null,
    expectedValidationStatusCode: ValidationStatus,
    expectedIssuesFound: Array<IssueFound> | null,
    validationGroupForValueHost?: string | undefined,
    validationGroupForValidateFn?: string | undefined): ITestSetupConfigWithMocks {

    let setup = setupValidatorsValueHostBaseForValidate(validatorConfigs, fieldValueState, validationGroupForValueHost);
    setup.services.loggingService.minLevel = LoggingLevel.Debug;

    let vrDetails: ValueHostValidateResult | null = null;
    expect(() => vrDetails = setup.valueHost.validate({ group: validationGroupForValidateFn })).not.toThrow();

    expect(vrDetails).not.toBeNull();
    expect(vrDetails!.status).toBe(expectedValidationStatusCode);
    expect(vrDetails!.issuesFound).toEqual(expectedIssuesFound);
    expect(vrDetails!.pending).toBeUndefined();

    return setup;
}
/**
 * For testing ValidatorsValueHostBase.validate (but not the logic of an individual Validator.validate).
 * @param validatorConfigs - Always provide a list of the validatorConfigs in the desired order.
 * If null, no validators are made available to validate
 * @param fieldValueState - Use to supply initial TextValue and Value properties. Any property
 * not supplied will be provided.
 * @param expectedValidationStatusCode 
 */
function testValidateFunctionIsNull(validatorConfigs: Array<Partial<ValidatorConfig>> | null,
    fieldValueState: Partial<ValidatorsValueHostBaseInstanceState> | null,
    validationGroupForValueHost?: string | undefined,
    validationGroupForValidateFn?: string | undefined): ITestSetupConfigWithMocks {

    let setup = setupValidatorsValueHostBaseForValidate(validatorConfigs, fieldValueState, validationGroupForValueHost);
    setup.services.loggingService.minLevel = LoggingLevel.Debug;
    let vrDetails: ValueHostValidateResult | null = null;
    expect(() => vrDetails = setup.valueHost.validate({ group: validationGroupForValidateFn })).not.toThrow();
    expect(vrDetails).toBeNull();

    return setup;
}


function createIssueFound(errorCode: string,
    severity: ValidationSeverity = ValidationSeverity.Error,
    errorMessage: string = 'Local',
    summaryMessage: string = 'Summary'): IssueFound {
    return {
        valueHostName: 'Field1',
        errorCode: errorCode,
        severity: severity,
        errorMessage: errorMessage,
        summaryMessage: summaryMessage,
        doNotSave: severity !== ValidationSeverity.Warning
    };
}
describe('constructor and resulting property values', () => {

    test('constructor with valid parameters created and sets up Services, Config, and InstanceState', () => {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let testItem: TestValidatorsValueHost | null = null;
        expect(()=> testItem = new TestValidatorsValueHost(vhm, {
            name: 'Field1',
            valueHostType: TestValueHostType,
            validatorConfigs: []
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined
            })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vhm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getLabel()).toBe('');
        expect(testItem!.getDataType()).toBeNull();
        expect(testItem!.getValue()).toBeUndefined();
        expect(testItem!.isChanged).toBe(false);
        expect(testItem!.isValid).toBe(true);
        expect(testItem!.asyncProcessing).toBe(false);
        expect(testItem!.corrected).toBe(false);        
        expect(testItem!.hasAsyncValidators).toBe(false);
    });
});

describe('ValidatorsValueHostBase.validate', () => {
    //NOTE: Validator tests already handle testing Validator property of Enabled, Enabler,
    // and validate's Group parameter. When those skip the condition, we expect a ConditionEvaluateResult of Undetermined
    // which is evaluated in these tests.
    test('Without Validators is null', () => {
        testValidateFunctionIsNull(null, null);
    });
    test('With 1 Condition evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Valid, null);
    });
    test('With 1 Condition evaluating as NoMatch is ValidatorResult.Invalid, IssuesFound = 1', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);
    });
    test('With 1 Condition evaluating as Undetermined returns null', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: IsUndeterminedConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        testValidateFunctionIsNull(ivConfigs, state);
    });
    test('With 1 Condition that throws logs that throw and throw bubbles up', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: ThrowsSevereExceptionConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        let logger = setup.services.loggingService as TestingLoggingService;        
        let vrDetails: ValueHostValidateResult | null = null;
        expect(() => vrDetails = setup.valueHost.validate()).toThrow('Always Throws');
        expect(logger.findMessage('Always Throws', LoggingLevel.Error)).toBeTruthy();
    });    
    test('With 2 Conditions evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                errorMessage: '1'
            },
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                errorMessage: '2'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Valid, null);
    });
    test('With 2 Conditions evaluating as Undetermined returns null', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: IsUndeterminedConditionType
                },
                errorCode: '1'
            },
            {
                conditionConfig: {
                    conditionType: IsUndeterminedConditionType
                },
                errorCode: '2'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        testValidateFunctionIsNull(ivConfigs, state);
    });
    test('With Validator of Severe evaluating as NoMatch, second Condition is skipped even though it would be NoMatch, IssuesFound = 1', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Severe
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                errorMessage: '2'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Severe));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);

    });
    test('With Validator of Severe evaluating as Match, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                severity: ValidationSeverity.Severe
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);

    });
    test('With Validator of Severe evaluating as Undetermined, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig:
                {
                    conditionType: IsUndeterminedConditionType
                },
                severity: ValidationSeverity.Severe
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as NoMatch, second Condition is evaluated and is NoMatch, IssuesFound = 2 with both conditions', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Warning,
                errorMessage: '1'
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                errorMessage: '2'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning, "1"));
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Error, "2"));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as Undetermined, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: IsUndeterminedConditionType
                },
                severity: ValidationSeverity.Warning
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as Match, second Condition is evaluated and is NoMatch, IssuesFound = 1 with second condition', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                severity: ValidationSeverity.Warning
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);

    });
    test('With Validator of Warning evaluating as NoMatch, second Condition is evaluated and is Match, IssuesFound = 1 with first condition. ValidationStatus is Valid', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Warning
            },
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Valid, issuesFound);

    });
    test('With Validator of Warning evaluating as NoMatch and no second condition, ValidationStatus = Valid, IssuesFound = 1', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                severity: ValidationSeverity.Warning
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning));
        testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Valid, issuesFound);

    });
    test('With only 1 Validator, and its set to Enabled=false, acts like there are no validators. Returns null', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                enabled: false
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        testValidateFunctionIsNull(ivConfigs, state);

    });
    function testGroups(valueHostGroup: string, validateGroup: string,
        expectedResult: ValidationStatus | null): void
    {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issueFound: IssueFound | null = null;
        if (expectedResult === ValidationStatus.Invalid)
            issueFound = {
                errorCode: NeverMatchesConditionType,
                errorMessage: 'Local',
                summaryMessage: 'Summary',
                severity: ValidationSeverity.Error,
                valueHostName: 'Field1',
                doNotSave: true
            };
        let setup: ITestSetupConfigWithMocks;
        if (expectedResult)
        {
            setup = testValidateFunctionHasResult(ivConfigs, state, expectedResult,
                issueFound ? [issueFound] : null, valueHostGroup, validateGroup);
        }
        else
            setup = testValidateFunctionIsNull(ivConfigs, state, valueHostGroup, validateGroup);
        let logger = setup.services.loggingService as TestingLoggingService;
        if (expectedResult === null) {
            expect(logger.findMessage('Group names do not match', LoggingLevel.Info)).toBeTruthy();
        }
        else
            expect(logger.findMessage('Validation result', LoggingLevel.Info)).toBeTruthy();            
    }

    test('Group test. ValidatorsValueHostBase has Group name but validate has empty string for group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', '', ValidationStatus.Invalid);
    });
    test('Group test. ValidatorsValueHostBase has Group name but validate has * for group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', '*', ValidationStatus.Invalid);
    });
    test('Group test. ValidatorsValueHostBase has Group name and validate has same group name. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', 'GROUPA', ValidationStatus.Invalid);
    });

    test('Group test. ValidatorsValueHostBase has Group name and validate has same group name but case mismatch. Validation occurs and returns an issue', () => {
        testGroups('GROUPA', 'groupa', ValidationStatus.Invalid);
    });
    test('Group test. ValidatorsValueHostBase has Group name but validate has a different group name. Validation skipped and result is Valid', () => {
        testGroups('GROUPA', 'GROUPB', null);
    });
    test('validate one ValueHost with validators that results in Valid. onValueHostValidationStateChanged called.', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        let results: Array<ValueHostValidationState> = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        setup.valueHost.validate();
        expect(results).toEqual([
            <ValueHostValidationState>{
                issuesFound: null,
                isValid: true,
                doNotSave: false,
                asyncProcessing: false,
                status: ValidationStatus.Valid,
                corrected: false
            }
        ]);
    });
    test('validate one ValueHost with validators that results in Invalid. onValueHostValidationStateChanged called.', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                errorMessage: 'Error', 
                summaryMessage: 'Error'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        let results: Array<ValueHostValidationState> = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (valueHost, validateResult) => {
            results.push(validateResult);
        };
        setup.valueHost.validate();
        expect(results).toEqual([
            <ValueHostValidationState>{
                issuesFound: [{
                    errorCode: NeverMatchesConditionType,
                    valueHostName: 'Field1',
                    severity: ValidationSeverity.Error,
                    errorMessage: 'Error',
                    summaryMessage: 'Error',
                    doNotSave: true
                }],
                isValid: false,
                doNotSave: true,
                asyncProcessing: false,
                status: ValidationStatus.Invalid,
                corrected: false
            }
        ]);

    });
    test('With loggingLevel=Debug, expect validate() to log Validating ValueHostName [hostname]', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];

        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, {});
        let logger = setup.services.loggingService as TestingLoggingService;
        logger.minLevel = LoggingLevel.Debug;
        setup.valueHost.validate();
        expect(logger.findMessage('Validating ValueHost "Field1"', LoggingLevel.Debug)).toBeTruthy();
    });    
    test('With ValueHost.isEnabled=false, return null and log', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = { enabled: false };
        let setup = testValidateFunctionIsNull(ivConfigs, state, undefined, undefined);
        let logger = setup.services.loggingService as TestingLoggingService;
        expect(logger.findMessage('ValueHost "Field1" is disabled', LoggingLevel.Debug)).toBeTruthy();
    });    
});


describe('validate() and its impact on isValid and ValidationStatus', () => {

    test('Without Validators IsValid=true, ValidationStatus = Undetermined', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
    });
    test('With 1 Condition evaluating as Match. isValid is true, ValidationStatus=Valid', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
    });
    test('With 1 Condition evaluating as NoMatch. isValid is false. ValidationStatus=Invalid', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });
    test('Without Validators but have a external IssueFound (Error), isValid=false, ValidationStatus = Invalid', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
        }, true);
        expect(result).toBe(true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });
    test('Without Validators but have a external IssueFound (Warning), isValid=true, ValidationStatus = Undetermined because warning does not change anything and no validators means Undetermined', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        }, true);
        expect(result).toBe(true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
    });
    test('Without Validators but have a external IssueFound (Error) and doNotSave=true, isValid=false and ValidationStatus=Invalid because the external issuefound exists and is not warning', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error,
            doNotSave: true
        }, true);
        expect(result).toBe(true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });    
    test('Without Validators but have a external IssueFound (Warning) and doNotSave=true, isValid=true because the external issuefound exists and is  warning', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning,
            doNotSave: true
        }, true);
        expect(result).toBe(true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
    }); 
    test('Without Validators but have a external IssueFound (Severe) and doNotSave=true, isValid=false and ValidationStatus=Invalid because the external issuefound exists and is not warning', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'SEVERE',
            severity: ValidationSeverity.Severe,
            doNotSave: true
        }, true);
        expect(result).toBe(true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });     
    test('addExternalIssueFound with same data back-to-back with different error codes returns true on both calls. Expect two IssuesFound', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        let result = setup.valueHost.addExternalIssueFound({
            errorCode: 'TEST1',
            errorMessage: 'ERROR',
        }, true);
        expect(result).toBe(true);
        result = setup.valueHost.addExternalIssueFound({
            errorCode: 'TEST2',
            errorMessage: 'ERROR',
        }, true);
        expect(result).toBe(true);
        let issuesFound = setup.valueHost.getIssuesFound();
        expect(issuesFound).not.toBeNull();
        expect(issuesFound!.length).toBe(2);
    });    
    test('addExternalIssueFound with same data back-to-back with the same error codes returns true on first and false on second due to no real change. Only one IssueFound', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        let result = setup.valueHost.addExternalIssueFound({
            errorCode: 'TEST',
            errorMessage: 'ERROR',
        }, true);
        expect(result).toBe(true);
        result = setup.valueHost.addExternalIssueFound({
            errorCode: 'TEST',
            errorMessage: 'ERROR',
        }, true);
        expect(result).toBe(false);
        let issuesFound = setup.valueHost.getIssuesFound();
        expect(issuesFound).not.toBeNull();
        expect(issuesFound!.length).toBe(1);
    });    
    test('With 1 Condition evaluating as NoMatch and have a external IssueFound (Warning). isValid is false due to NoMatch. ValidationStatus=Invalid', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        }, true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });
    test('With 1 Condition evaluating as Match and have a external IssueFound (Error). isValid is false due to external IssueFound. ValidationStatus=Invalid', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });
    test('With 1 Condition evaluating as Match and have a external IssueFound (Warning). isValid is true. ValidationStatus=Valid', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        }, true);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
    });
    test('With ValueHost.isEnabled=false, Without Validators but have a external IssueFound (Error), everything continues to work plus there is a log entry so when re-enabled it is there', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        setup.valueHost.setEnabled(false);
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
        }, true);
        let logger = setup.services.loggingService as TestingLoggingService;
        expect(logger.findMessage('IssueFound applied on disabled ValueHost', LoggingLevel.Warn)).toBeTruthy();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        let issuesFound = setup.valueHost.getIssuesFound();
        expect(issuesFound).toBeNull();
        setup.valueHost.setEnabled(true);
        issuesFound = setup.valueHost.getIssuesFound();
        expect(issuesFound).not.toBeNull();
        expect(issuesFound!.length).toBe(1);        
    });    
    test('Confirm the OnValueHostValidate event is called and captures the correct ValidationStatus', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [],
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        vhm.onValueHostValidationStateChanged = (vh, vr) => {
            onValidateResult = vr;
        };
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig>{
            valueHostType: TestValueHostType,
            name: 'Field1',
            validatorConfigs: [
                <ValidatorConfig>{
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType
                    }
                }
            ]
        }, null) as TestValidatorsValueHost;
        let expectedIssueFound: IssueFound = {
            errorMessage: 'BL_ERROR',
            severity: ValidationSeverity.Error,
            valueHostName: 'Field1',
            summaryMessage: 'BL_ERROR',
            errorCode: 'GENERATED_0',
            doNotSave: true
        };

        let result = vh.addExternalIssueFound({
            errorMessage: 'BL_ERROR',
        }, true);
        expect(result).toBe(true);
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            issuesFound: [expectedIssueFound],
            doNotSave: true,
            isValid: false,
            asyncProcessing: false,
            status: ValidationStatus.Invalid,
            corrected: false
        });
    });    
    test('Confirm the OnValueHostValidate event is setup but not called due to option.skipCallback', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [],
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        vhm.onValueHostValidationStateChanged = (vh, vr) => {
            onValidateResult = vr;
        };
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig>{
            valueHostType: TestValueHostType,
            name: 'Field1',
            validatorConfigs: [
                <ValidatorConfig> {
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType
                    }
                }
            ]
        }, null) as TestValidatorsValueHost;

        let result = vh.addExternalIssueFound({
            errorMessage: 'BL_ERROR',
        }, true, { skipCallback: true});
        expect(result).toBe(true);
        expect(onValidateResult).toBeNull();
    });        
    test('Ensure Require sorts first amongst several Conditions, placing Require last. Demonstrated by stopping when RequireTextCondition is NoMatch while others return an error', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType2
                }
            },
            {
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        setup.valueHost.setValue('');
        let vr = setup.valueHost.validate();
        expect(vr).toBeDefined();
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(ConditionType.RequireText, ValidationSeverity.Severe));
        expect(vr!.issuesFound).toEqual(issuesFound);
    });
    test('Ensure Category=DataTypeCheck sorts first amongst several Conditions, placing DataTypeCheck last. Demonstrated by stopping when DataTypeCheckCondition is NoMatch while others return an error', () => {

        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType2
                }
            },
            { // emulate DataTypeCheck because the real condition needs text value
                conditionConfig: <UserSuppliedResultConditionConfig>{
                    conditionType: UserSuppliedResultConditionType,
                    category: ConditionCategory.DataTypeCheck,
                    result: ConditionEvaluateResult.NoMatch
                },
                errorCode: 'DTC'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        let vr = setup.valueHost.validate();
        expect(vr).toBeDefined();
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound('DTC', ValidationSeverity.Severe));
        expect(vr!.issuesFound).toEqual(issuesFound);
    });
    test('Ensure Category=Require sorts first, Category=DataTypeCheck sorts second amongst several Conditions, placing Require last. Demonstrated by stopping when DataTypeCheckCondition is NoMatch while others return an error', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            },
            
            { // emulate DataTypeCheck because the real condition needs text value
                conditionConfig: <UserSuppliedResultConditionConfig>{
                    conditionType: UserSuppliedResultConditionType,
                    category: ConditionCategory.DataTypeCheck,
                    result: ConditionEvaluateResult.NoMatch
                },
                errorCode: 'DTC'
            }, {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType2
                }
            },
            { // emulate RequireText because the real condition needs text value
                conditionConfig: <UserSuppliedResultConditionConfig>{
                    conditionType: UserSuppliedResultConditionType,
                    category: ConditionCategory.Require,
                    result: ConditionEvaluateResult.Match
                },
                errorCode: 'RT'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);

        let vr = setup.valueHost.validate();
        expect(vr).toBeDefined();
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound('DTC', ValidationSeverity.Severe));
        expect(vr!.issuesFound).toEqual(issuesFound);
    });

    describe('options.preliminary with Category=Require', () => {
        function requireConfig(result: ConditionEvaluateResult, severity?: ValidationSeverity): Partial<ValidatorConfig> {
            const config: Partial<ValidatorConfig> = {
                conditionConfig: <UserSuppliedResultConditionConfig>{
                    conditionType: UserSuppliedResultConditionType,
                    category: ConditionCategory.Require,
                    result: result
                },
                errorCode: 'RT'
            };
            if (severity !== undefined)
                config.severity = severity;
            return config;
        }
        const otherConfig: Partial<ValidatorConfig> = {
            conditionConfig: {
                conditionType: NeverMatchesConditionType
            }
        };

        test('Require is NoMatch: its issue is not reported and later validators do not run. Result is null (nothing to report)', () => {
            let setup = setupValidatorsValueHostBaseForValidate(
                [requireConfig(ConditionEvaluateResult.NoMatch), otherConfig], {});
            let vr: ValueHostValidateResult | null = null;
            expect(() => vr = setup.valueHost.validate({ preliminary: true })).not.toThrow();
            expect(vr).toBeNull();
            expect(setup.valueHost.isValid).toBe(true);
            expect(setup.valueHost.getIssuesFound()).toBeNull();
        });
        test('Require is NoMatch with severity Warning: still stops processing and reports nothing', () => {
            let setup = setupValidatorsValueHostBaseForValidate(
                [requireConfig(ConditionEvaluateResult.NoMatch, ValidationSeverity.Warning), otherConfig], {});
            let vr: ValueHostValidateResult | null = null;
            expect(() => vr = setup.valueHost.validate({ preliminary: true })).not.toThrow();
            expect(vr).toBeNull();
            expect(setup.valueHost.getIssuesFound()).toBeNull();
        });
        test('Require is Match: it is evaluated, so later validators run and their issues are reported', () => {
            let setup = setupValidatorsValueHostBaseForValidate(
                [requireConfig(ConditionEvaluateResult.Match), otherConfig], {});
            let vr: ValueHostValidateResult | null = null;
            expect(() => vr = setup.valueHost.validate({ preliminary: true })).not.toThrow();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([createIssueFound(NeverMatchesConditionType)]);
        });
        test('Require is Match and no other validators: status is Valid', () => {
            let setup = setupValidatorsValueHostBaseForValidate(
                [requireConfig(ConditionEvaluateResult.Match)], {});
            let vr: ValueHostValidateResult | null = null;
            expect(() => vr = setup.valueHost.validate({ preliminary: true })).not.toThrow();
            expect(vr!.status).toBe(ValidationStatus.Valid);
            expect(vr!.issuesFound).toBeNull();
        });
        test('Require is Undetermined: later validators run and their issues are reported', () => {
            let setup = setupValidatorsValueHostBaseForValidate(
                [requireConfig(ConditionEvaluateResult.Undetermined), otherConfig], {});
            let vr: ValueHostValidateResult | null = null;
            expect(() => vr = setup.valueHost.validate({ preliminary: true })).not.toThrow();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([createIssueFound(NeverMatchesConditionType)]);
        });
        test('A non-Require validator that is NoMatch is still reported with preliminary', () => {
            let setup = setupValidatorsValueHostBaseForValidate([otherConfig], {});
            let vr: ValueHostValidateResult | null = null;
            expect(() => vr = setup.valueHost.validate({ preliminary: true })).not.toThrow();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([createIssueFound(NeverMatchesConditionType)]);
        });
        test('Without preliminary, Require NoMatch is reported (Severe) and stops later validators', () => {
            let setup = setupValidatorsValueHostBaseForValidate(
                [requireConfig(ConditionEvaluateResult.NoMatch), otherConfig], {});
            let vr: ValueHostValidateResult | null = null;
            expect(() => vr = setup.valueHost.validate({ preliminary: false })).not.toThrow();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([createIssueFound('RT', ValidationSeverity.Severe)]);
        });
    });
});

describe('injectedErrors', () =>
{
    // tests additionalInstanceStateUpdatesOnSetValue and clearValidationDataFromInstanceState
    describe('setValue with options to test options.injectErrors', () =>
    {
        test('InjectedError added to state when value supplied is undefined.', () =>
        {
            let setup = setupValidatorsValueHostBase();

            setup.valueHost.setValue(undefined, {
                injectedError: { errorMessage: 'ERROR' }
            });
            const expectedInjectedError: InjectedError = {
                errorMessage: 'ERROR'
            };
            expect(setup.valueHost.getValue()).toBeUndefined();
            expect(setup.valueHost.getInjectedError()).toEqual(expectedInjectedError);
        });
        test('InjectedError added to state when value supplied is supplied.', () =>
        {
            let setup = setupValidatorsValueHostBase();

            setup.valueHost.setValue(10, {
                injectedError: { errorMessage: 'ERROR' }
            });
            const expectedInjectedError: InjectedError = {
                errorMessage: 'ERROR'
            };
            expect(setup.valueHost.getValue()).toBe(10);
            expect(setup.valueHost.getInjectedError()).toEqual(expectedInjectedError);
        });
        // full set of properties on injectedError
        test('InjectedError added to state and all properties are retained.', () =>
        {
            let setup = setupValidatorsValueHostBase();
            setup.valueHost.setValue(10, {
                injectedError: {
                    errorMessage: 'ERROR',
                    errorCode: 'ERROR_CODE',
                    errorMessagel10n: 'l10n',
                    summaryMessage: 'SUMMARY',
                    summaryMessagel10n: 'SUMMARY_L10N',
                }
            });
            const expectedInjectedError: InjectedError = {
                errorMessage: 'ERROR',
                errorCode: 'ERROR_CODE',
                errorMessagel10n: 'l10n',
                summaryMessage: 'SUMMARY',
                summaryMessagel10n: 'SUMMARY_L10N'
            };
            expect(setup.valueHost.getValue()).toBe(10);
            expect(setup.valueHost.getInjectedError()).toEqual(expectedInjectedError);
        });

        test('injectedError supplied in one call which saves it but a follow up call without it abandons it', () =>
        {
            let setup = setupValidatorsValueHostBase();

            setup.valueHost.setValue(10, {
                injectedError: { errorMessage: 'ERROR' }
            });
            setup.valueHost.setValue(20);
            expect(setup.valueHost.getValue()).toBe(20);
            expect(setup.valueHost.getInjectedError()).toBeNull();
        });
        test('Use both injectedError and Reset options will setup the error message and IsChanged is false because the value did not change', () =>
        {
            let setup = setupValidatorsValueHostBase();

            // reset and injectedError are mutually exclusive: the injectedError wins and reset does not clear it
            expect(() => setup.valueHost.setValue(undefined, {
                injectedError: { errorMessage: 'ERROR' },
                reset: true
            })).not.toThrow();
            expect(setup.valueHost.getInjectedError()).toEqual({ errorMessage: 'ERROR' });
            expect(setup.valueHost.isChanged).toBe(false);
        });
    });

    describe('setInjectedError and clearInjectedError', () =>
    {
        test('setInjectedError sets the error', () =>
        {
            let setup = setupValidatorsValueHostBase();
            setup.valueHost.setInjectedError({ errorMessage: 'ERROR' });
            expect(setup.valueHost.getInjectedError()).toEqual({ errorMessage: 'ERROR' });
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toEqual({ errorMessage: 'ERROR' });
        });
        test('setInjectedError sets the error and clearInjectedError clears it', () =>
        {
            let setup = setupValidatorsValueHostBase();
            setup.valueHost.setInjectedError({ errorMessage: 'ERROR' });
            setup.valueHost.clearInjectedError();
            expect(setup.valueHost.getInjectedError()).toBeNull();
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeUndefined();
        });
        // clearInjectedError when injectedError is null should not throw
        test('clearInjectedError when injectedError is null should not throw', () =>
        {
            let setup = setupValidatorsValueHostBase();
            expect(() => setup.valueHost.clearInjectedError()).not.toThrow();
            expect(setup.valueHost.getInjectedError()).toBeNull();
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeUndefined();

        });
    });

    describe('validate() and its impact on injectedError', () =>
    {
        test('Refreshes the injected validator after adding, replacing, and clearing an error', () =>
        {
            let setup = setupValidatorsValueHostBaseForValidate(null, null);
            let logger = setup.services.loggingService as TestingLoggingService;
            expect(setup.valueHost.validate()).toBeNull();

            setup.valueHost.setInjectedError({ errorMessage: 'First error', errorCode: 'First' });
            expect(setup.valueHost.validate()!.issuesFound).toEqual([
                expect.objectContaining({ errorCode: 'First', errorMessage: 'First error' })
            ]);
            let injectedValidator = setup.valueHost.getValidator('First');
            expect(injectedValidator).not.toBeNull();
            expect(setup.valueHost.getValidator('First')).toBe(injectedValidator);

            setup.valueHost.setInjectedError({ errorMessage: 'Replacement', errorCode: 'Second' });
            expect(setup.valueHost.validate()!.issuesFound).toEqual([
                expect.objectContaining({ errorCode: 'Second', errorMessage: 'Replacement' })
            ]);
            expect(setup.valueHost.getValidator('First')).toBeNull();

            setup.valueHost.clearInjectedError();
            expect(setup.valueHost.validate()).toBeNull();
            expect(setup.valueHost.getValidator('Second')).toBeNull();
            expect(setup.valueHost.doNotSave).toBe(false);
            expect(logger.entryCount).toBe(0);
        });

        test('Refreshes the injected validator when value options or clearValidation change the error', () =>
        {
            let setup = setupValidatorsValueHostBaseForValidate(null, null);
            let logger = setup.services.loggingService as TestingLoggingService;
            expect(setup.valueHost.validate()).toBeNull();

            // The error can change even when the value itself is unchanged.
            setup.valueHost.setValue(undefined, { injectedError: { errorMessage: 'First error' } });
            expect(setup.valueHost.validate()!.issuesFound![0].errorMessage).toBe('First error');
            setup.valueHost.setValue(undefined, { injectedError: { errorMessage: 'Replacement' } });
            expect(setup.valueHost.validate()!.issuesFound![0].errorMessage).toBe('Replacement');
            setup.valueHost.setValue(undefined);
            expect(setup.valueHost.validate()).toBeNull();

            setup.valueHost.setValue('new value', { injectedError: { errorMessage: 'Another error' } });
            expect(setup.valueHost.validate()!.issuesFound![0].errorMessage).toBe('Another error');
            expect(setup.valueHost.clearValidation()).toBe(true);
            expect(setup.valueHost.validate()).toBeNull();
            expect(logger.entryCount).toBe(0);
        });

        test('Refreshing an injected validator preserves a configured pending async validator', async () =>
        {
            let finish!: (result: AsyncValidatorEvaluationResult) => void;
            let signal!: AbortSignal;
            let setup = setupAsyncIssueHost([{
                identity: 'AvailabilityCheck',
                handler: (_host, _manager, abortSignal) => {
                    signal = abortSignal;
                    return new Promise(resolve => { finish = resolve; });
                }
            }]);
            let result = setup.valueHost.validate()!;
            let pending = [...result.pending!];
            let asyncValidator = setup.valueHost.getValidator('AvailabilityCheck');

            setup.valueHost.setInjectedError({ errorMessage: 'Injected error' });
            expect(setup.valueHost.getValidator(InjectedErrorValidatorErrorCode)).not.toBeNull();
            expect(setup.valueHost.getValidator('AvailabilityCheck')).toBe(asyncValidator);
            expect(signal.aborted).toBe(false);

            setup.valueHost.clearInjectedError();
            expect(setup.valueHost.getValidator(InjectedErrorValidatorErrorCode)).toBeNull();
            expect(setup.valueHost.getValidator('AvailabilityCheck')).toBe(asyncValidator);
            expect(signal.aborted).toBe(false);

            finish({ conditionEvaluateResult: ConditionEvaluateResult.Match });
            await Promise.all(pending);
            expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
            expect(setup.valueHost.asyncProcessing).toBe(false);
            expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
        });

        // ensure that when InjectedError is present, it creates a Validator object within the validate()
        // function. That validator is first amongst all, and is severe, with the same properties
        // as found on the InjectedError. The result of validate() is Invalid, and the IssuesFound contains the injected error.
        // The injected error is not removed from the state, and remains there until clearInjectedError() is called.
        test('InjectedError present without errorcode, validate() returns Invalid and IssuesFound contains the injected error', () =>
        {
            let setup = setupValidatorsValueHostBaseForValidate(null, null);
            setup.valueHost.setInjectedError({
                errorMessage: 'ERROR',
                errorMessagel10n: 'l10n',
                summaryMessage: 'SUMMARY',
                summaryMessagel10n: 'SUMMARY_L10N'
            });
            let vr = setup.valueHost.validate();
            expect(vr).toBeDefined();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([{
                doNotSave: true,
                valueHostName: 'Field1',
                errorMessage: 'ERROR',
                errorCode: InjectedErrorValidatorErrorCode,
                summaryMessage: 'SUMMARY',
                severity: ValidationSeverity.Severe
            }]);
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeDefined();  // prove it is still there after validate() is called
        });
        test('InjectedError present with errorcode, validate() returns Invalid and IssuesFound contains the injected error', () =>
        {
            let setup = setupValidatorsValueHostBaseForValidate(null, null);
            setup.valueHost.setInjectedError({
                errorMessage: 'ERROR',
                errorCode: 'ERROR_CODE',
                errorMessagel10n: 'l10n',
                summaryMessage: 'SUMMARY',
                summaryMessagel10n: 'SUMMARY_L10N'
            });
            let vr = setup.valueHost.validate();
            expect(vr).toBeDefined();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([{
                doNotSave: true,
                valueHostName: 'Field1',
                errorMessage: 'ERROR',
                errorCode: 'ERROR_CODE',
                summaryMessage: 'SUMMARY',
                severity: ValidationSeverity.Severe
            }]);
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeDefined();  // prove it is still there after validate() is called
        });

        test('Several validators exist, InjectedError present, validate() returns Invalid and IssuesFound contains the injected error first', () =>
        {
            let ivConfigs: Array<Partial<ValidatorConfig>> = [
                {
                    // while it should be reported normally, the injected error should be first in the list of issues found
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    }
                },
                {   
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType
                    }
                }
            ];
        
            let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, null);
            setup.valueHost.setInjectedError({
                errorMessage: 'ERROR',
            });
            let vr = setup.valueHost.validate();
            expect(vr).toBeDefined();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            // only the injected error
            expect(vr!.issuesFound).toEqual([{
                errorMessage: 'ERROR',
                summaryMessage: 'ERROR',    // carried over from errorMessage
                severity: ValidationSeverity.Severe,
                doNotSave: true,
                valueHostName: 'Field1',
                errorCode: InjectedErrorValidatorErrorCode,
            }]);
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeDefined();  // prove it is still there after validate() is called
        });

        // setup ErrorMessagesService to have supporting error message but not summary for the injected error, and ensure that the l10n messages are used in the IssuesFound
        test('InjectedError present with localized error message and summary setup uses those localized versions when summary is unassigned', () =>
        {
            let setup = setupValidatorsValueHostBaseForValidate(null, null);
            let errorCode = InjectedErrorValidatorErrorCode;
            let errorMessagesService = setup.services.errorMessagesService as ErrorMessagesService;
            errorMessagesService.registerErrorMessage(errorCode, null, {
                "*": 'Localized Error Message',
            });
            errorMessagesService.registerSummaryMessage(errorCode, null, {
                "*": 'Localized Summary Message',
            });
            setup.valueHost.setInjectedError({
                errorMessage: 'ERROR'
            });
            let vr = setup.valueHost.validate();
            expect(vr).toBeDefined();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([{
                errorMessage: 'Localized Error Message',
            // summary happens because the injectedError.summaryMessage is blank
                summaryMessage: 'Localized Summary Message',
                severity: ValidationSeverity.Severe,
                doNotSave: true,
                valueHostName: 'Field1',
                errorCode: InjectedErrorValidatorErrorCode,
            }]);
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeDefined();  // prove it is still there after validate() is called
        });
        test('InjectedError present with localized error message and summary setup uses those localized versions when summary is assigned', () =>
        {
            let setup = setupValidatorsValueHostBaseForValidate(null, null);
            let errorCode = InjectedErrorValidatorErrorCode;
            let errorMessagesService = setup.services.errorMessagesService as ErrorMessagesService;
            errorMessagesService.registerErrorMessage(errorCode, null, {
                "*": 'Localized Error Message',
            });
            errorMessagesService.registerSummaryMessage(errorCode, null, {
                "*": 'Localized Summary Message',
            });
            setup.valueHost.setInjectedError({
                errorMessage: 'ERROR',
                summaryMessage: 'SUMMARY',
                summaryMessagel10n: ErrorMessagesService.getSummaryMessagel10nText(errorCode, null),
            });
            let vr = setup.valueHost.validate();
            expect(vr).toBeDefined();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([{
                errorMessage: 'Localized Error Message',
                // summary happens because the injectedError.summaryMessage is blank
                summaryMessage: 'Localized Summary Message',
                severity: ValidationSeverity.Severe,
                doNotSave: true,
                valueHostName: 'Field1',
                errorCode: InjectedErrorValidatorErrorCode,
            }]);
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeDefined();  // prove it is still there after validate() is called
        });        
        test('InjectedError present with localized error message and summary setup, injectedError has the unassigned l10n values uses original text', () =>
        {
            let setup = setupValidatorsValueHostBaseForValidate(null, null);
            let errorCode = InjectedErrorValidatorErrorCode;
            let errorMessagesService = setup.services.errorMessagesService as ErrorMessagesService;
            errorMessagesService.registerErrorMessage(errorCode, null, {
                "*": 'Localized Error Message',
            });
            errorMessagesService.registerSummaryMessage(errorCode, null, {
                "*": 'Localized Summary Message',
            });
            setup.valueHost.setInjectedError({
                errorMessage: 'ERROR',
                errorMessagel10n: 'Unknown l10n text',
                summaryMessage: 'SUMMARY',
                summaryMessagel10n: 'Unknown l10n text',
            });
            let vr = setup.valueHost.validate();
            expect(vr).toBeDefined();
            expect(vr!.status).toBe(ValidationStatus.Invalid);
            expect(vr!.issuesFound).toEqual([{
                errorMessage: 'ERROR',
                summaryMessage: 'SUMMARY',
                severity: ValidationSeverity.Severe,
                doNotSave: true,
                valueHostName: 'Field1',
                errorCode: InjectedErrorValidatorErrorCode,
            }]);
            let state = setup.valueHost.exposeState;
            expect(state).not.toBeNull();
            expect(state.injectedError).toBeDefined();  // prove it is still there after validate() is called
        });        
    });

});

// Corrected identifies synchronous Invalid-to-Valid transitions without anticipating pending results.
describe('corrected property', () => {

    test('Validate without validators, corrected=false', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, null);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('When initial state has corrected=true, corrected=true', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, {
            corrected: true,
            name: 'Field1'
        });
        expect(setup.valueHost.corrected).toBe(true);
    });
    test('From Invalid->Valid, corrected=true', () => {
        let setup = setupValidatorsValueHostBaseForValidate([{
            conditionConfig: {
                conditionType: NeverMatchesConditionType,
            },
            errorMessage: 'NeverMatch',
            enabled: true
        },
        {
            conditionConfig: {
                conditionType: AlwaysMatchesConditionType,
            },
            errorMessage: 'Never shown',
            enabled: false
        }], null);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(false);
        setup.valueHost.getValidator(NeverMatchesConditionType)?.setEnabled(false);
        setup.valueHost.getValidator(AlwaysMatchesConditionType)?.setEnabled(true);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(true);
    });
    test.each([
        {
            outcome: 'Match', editFirst: false,
            evaluation: { conditionEvaluateResult: ConditionEvaluateResult.Match },
            finalStatus: ValidationStatus.Valid, finalDoNotSave: false
        },
        {
            outcome: 'NoMatch', editFirst: true,
            evaluation: {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken', errorMessage: 'Taken'
            },
            finalStatus: ValidationStatus.Invalid, finalDoNotSave: true
        }
    ])('A synchronous Match does not report corrected while pending or after async $outcome',
        async ({ editFirst, evaluation, finalStatus, finalDoNotSave }) => {
            let finish!: (result: AsyncValidatorEvaluationResult) => void;
            let setup = setupAsyncIssueHost([{
                identity: 'AvailabilityCheck',
                handler: () => new Promise(resolve => { finish = resolve; })
            }], [asyncIssue('AvailabilityCheck', 'OldIssue', 'Previous error')],
            [createValidatorConfig({ conditionType: AlwaysMatchesConditionType })]);
            if (editFirst)
                setup.valueHost.setValue('changed');
            let notifications: ValueHostValidationState[] = [];
            setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };

            let result = setup.valueHost.validate()!;
            let pending = [...result.pending!];
            expect(result.status).toBe(ValidationStatus.Valid);
            expect(result.corrected).toBeUndefined();
            expect(setup.valueHost.corrected).toBe(false);
            expect(setup.valueHost.asyncProcessing).toBe(true);
            expect(setup.valueHost.doNotSave).toBe(true);

            finish(evaluation);
            await Promise.all(pending);
            expect(result.status).toBe(finalStatus);
            expect(result.corrected).toBeUndefined();
            expect(setup.valueHost.validationStatus).toBe(finalStatus);
            expect(setup.valueHost.corrected).toBe(false);
            expect(setup.valueHost.asyncProcessing).toBe(false);
            expect(setup.valueHost.doNotSave).toBe(finalDoNotSave);
            expect(notifications.length).toBeGreaterThanOrEqual(2);
            expect(notifications.every(state => state.corrected === false)).toBe(true);
            expect(setup.logger.findMessage('Validation result: Valid', LoggingLevel.Info, LoggingCategory.Result,
                { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
            expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
        });
    test('A skipped async validator does not suppress a synchronous correction', () => {
        let calls = 0;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => {
                calls++;
                return { conditionEvaluateResult: ConditionEvaluateResult.Match };
            }
        }], [asyncIssue('AvailabilityCheck', 'OldIssue', 'Previous error')],
        [createValidatorConfig({ conditionType: AlwaysMatchesConditionType })]);
        setup.valueHost.getValidator('AvailabilityCheck')!.setEnabled(false);

        let result = setup.valueHost.validate()!;
        expect(result.pending).toBeUndefined();
        expect(result.corrected).toBe(true);
        expect(setup.valueHost.corrected).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(calls).toBe(0);
        expect(setup.logger.findMessage('Validation result: Valid', LoggingLevel.Info, LoggingCategory.Result,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
    // Helper for the tests below: starts Invalid, then lets the caller switch to Valid conditions.
    function setupInvalid() {
        let setup = setupValidatorsValueHostBaseForValidate([{
            conditionConfig: { conditionType: NeverMatchesConditionType },
            errorMessage: 'NeverMatch',
            enabled: true
        },
        {
            conditionConfig: { conditionType: AlwaysMatchesConditionType },
            errorMessage: 'Never shown',
            enabled: false
        }], null);
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        return setup;
    }
    function switchToValidConditions(setup: ReturnType<typeof setupInvalid>) {
        setup.valueHost.getValidator(NeverMatchesConditionType)?.setEnabled(false);
        setup.valueHost.getValidator(AlwaysMatchesConditionType)?.setEnabled(true);
    }
    test('From Invalid->several edits without validation->Valid, corrected=true', () => {
        let setup = setupInvalid();
        switchToValidConditions(setup);
        setup.valueHost.setValue('A');
        setup.valueHost.setValue('B');
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.corrected).toBe(false);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(true);
    });
    test('From Invalid->clearValidation->Valid, corrected=false because the Invalid history is gone', () => {
        let setup = setupInvalid();
        switchToValidConditions(setup);
        setup.valueHost.clearValidation();
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('From Invalid->Valid(corrected)->edit->Valid, corrected=false', () => {
        let setup = setupInvalid();
        switchToValidConditions(setup);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(true);
        setup.valueHost.setValue('A');
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('From Invalid->Valid->Valid, corrected lasts only one validation cycle', () => {
        let setup = setupInvalid();
        switchToValidConditions(setup);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(true);
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('From Invalid->Valid->Invalid, corrected=false', () => {
        let setup = setupValidatorsValueHostBaseForValidate([{
            conditionConfig: {
                conditionType: NeverMatchesConditionType,
            },
            errorMessage: 'NeverMatch',
            enabled: true
        },
        {
            conditionConfig: {
                conditionType: AlwaysMatchesConditionType,
            },
            errorMessage: 'Never shown',
            enabled: false
        }], null);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(false);
        setup.valueHost.getValidator(NeverMatchesConditionType)?.setEnabled(false);
        setup.valueHost.getValidator(AlwaysMatchesConditionType)?.setEnabled(true);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(true);
        setup.valueHost.getValidator(NeverMatchesConditionType)?.setEnabled(true);
        setup.valueHost.getValidator(AlwaysMatchesConditionType)?.setEnabled(false);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('From Invalid->Valid->NotAttempted, corrected=false', () => {
        let setup = setupValidatorsValueHostBaseForValidate([{
            conditionConfig: {
                conditionType: NeverMatchesConditionType,
            },
            errorMessage: 'NeverMatch',
            enabled: true
        },
        {
            conditionConfig: {
                conditionType: AlwaysMatchesConditionType,
            },
            errorMessage: 'Never shown',
            enabled: false
        }], null);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(false);
        setup.valueHost.getValidator(NeverMatchesConditionType)?.setEnabled(false);
        setup.valueHost.getValidator(AlwaysMatchesConditionType)?.setEnabled(true);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(true);
        setup.valueHost.clearValidation();
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('From Invalid->Valid->NeedsValidation, corrected=false', () => {
        let setup = setupValidatorsValueHostBaseForValidate([
            <ValidatorConfig>{
            conditionConfig: {
                conditionType: NeverMatchesConditionType,
            },
            errorMessage: 'NeverMatch',
            enabled: true
        },
        <ValidatorConfig>{
            conditionConfig: {
                conditionType: AlwaysMatchesConditionType,
            },
            errorMessage: 'Never shown',
            enabled: false
        }], null);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(false);
        setup.valueHost.getValidator(NeverMatchesConditionType)?.setEnabled(false);
        setup.valueHost.getValidator(AlwaysMatchesConditionType)?.setEnabled(true);
        setup.valueHost.validate();
        expect(setup.valueHost.corrected).toBe(true);
        setup.valueHost.setValue('A');
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('From state has corrected=true ->NeedsValidation, corrected=false', () => {
        let setup = setupValidatorsValueHostBaseForValidate(null, {
            corrected: true,
            name: 'Field1',
            status: ValidationStatus.Valid
        });
        setup.valueHost.setValue('A');
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('onValueHostValidationStateChanged setup. corrected reported as true after Invalid->Valid and omitted any other time', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [],
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        vhm.onValueHostValidationStateChanged = (vh, vr) => {
            onValidateResult = vr;
        };
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig>{
            valueHostType: TestValueHostType,
            name: 'Field1',
            validatorConfigs: [
                <ValidatorConfig> {
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType,
                    },
                    errorMessage: 'NeverMatch',
                    enabled: true
                },
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: AlwaysMatchesConditionType,
                    },
                    errorMessage: 'Never shown',
                    enabled: false
                }]
        }, null) as TestValidatorsValueHost;

        let neverMatchIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            errorMessage: 'NeverMatch',
            summaryMessage: 'NeverMatch',
            valueHostName: 'Field1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let snapshot = vhm.validate(); // ensure we have an invalid state without business logic
        expect(snapshot).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [neverMatchIssueFound],
            asyncProcessing: false,
        });
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            status: ValidationStatus.Invalid,
            isValid: false,
            doNotSave: true,
            issuesFound: [neverMatchIssueFound],
            asyncProcessing: false,
            corrected: false
        });

        vh.getValidator(NeverMatchesConditionType)?.setEnabled(false);
        vh.getValidator(AlwaysMatchesConditionType)?.setEnabled(true);

        snapshot = vhm.validate();
        expect(snapshot).toEqual(<ValidationState>{
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        });
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            status: ValidationStatus.Valid,
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false,
            corrected: true
        });

        vh.setValue(10);    // without validation changes status=NeedsValidation and triggers callback
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            status: ValidationStatus.NeedsValidation,
            isValid: true,
            doNotSave: true,
            issuesFound: null,
            asyncProcessing: false,
            corrected: false
        });
    });        

});

class ThrowExceptionValidator extends Validator {
    constructor(valueHost: IValidatorsValueHost, config: ValidatorConfig)
    {
        super(valueHost as any, config);
    }
    public override validate(options?: ValidateOptions): ValidatorValidateResult {
        throw new Error('Always Throws');
    }
}
class TestValidatorFactory implements IValidatorFactory {
    public create(valueHost: IValidatorsValueHost, config: ValidatorConfig): IValidator {
        return new ThrowExceptionValidator(valueHost, config);
    }
    canCreate(config: ValidatorConfig): boolean {
        return true;
    }
}

describe('validate handles exception from custom Validator class', () => {

    test('Expect an exception from the custom Validator to be logged and cause ValidatorsValueHostBase.Validator result to be Undetermined', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        setup.services.validatorFactory = new TestValidatorFactory();
        let logger = setup.services.loggingService as TestingLoggingService;
        logger.minLevel = LoggingLevel.Info;
        expect(() => setup.valueHost.validate()).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        // 2 log entries: Error level exception and Info Level validation result
        expect(logger.findMessage('Always Throws', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
        expect(logger.findMessage('Validation result', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();
    });
});

// Promise-based validators publish pending and completed states to the host and manager.
describe('ValidatorsValueHostBase validation with AsyncValidator', () => {
    test.each([
        {
            outcome: 'Match',
            evaluation: { conditionEvaluateResult: ConditionEvaluateResult.Match },
            status: ValidationStatus.Valid,
            issues: null,
            doNotSave: false
        },
        {
            outcome: 'NoMatch',
            evaluation: {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken',
                errorMessage: 'Name is taken'
            },
            status: ValidationStatus.Invalid,
            issues: [{
                asyncIdentity: 'AvailabilityCheck',
                valueHostName: 'Field1',
                errorCode: 'NameTaken',
                errorMessage: 'Name is taken',
                summaryMessage: 'Name is taken',
                severity: ValidationSeverity.Error,
                doNotSave: true
            }],
            doNotSave: true
        },
        {
            outcome: 'Undetermined',
            evaluation: { conditionEvaluateResult: ConditionEvaluateResult.Undetermined },
            status: ValidationStatus.Undetermined,
            issues: null,
            doNotSave: false
        }
    ])('A pending validator resolves as $outcome and publishes its final state', async ({
        evaluation, status, issues, doNotSave
    }) => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: () => new Promise(resolve => { finish = resolve; })
        }]);
        let notifications: ValueHostValidationState[] = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };

        let result = setup.valueHost.validate()!;
        expect(result.pending).toHaveLength(1);
        let pending = result.pending![0];
        expect(setup.valueHost.asyncProcessing).toBe(true);
        expect(setup.valueHost.doNotSave).toBe(true);
        expect(setup.valueHostsManager.asyncProcessing).toBe(true);
        expect(setup.valueHostsManager.doNotSave).toBe(true);
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toEqual(expect.objectContaining({
            status: ValidationStatus.Undetermined, issuesFound: null,
            asyncProcessing: true, doNotSave: true
        }));

        finish(evaluation);
        let validatorResult = await pending;
        expect(validatorResult.conditionEvaluateResult).toBe(evaluation.conditionEvaluateResult);
        expect(validatorResult.issueFound).toEqual(issues?.[0] ?? null);
        expect(result.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(status);
        expect(setup.valueHost.getIssuesFound()).toEqual(issues);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.doNotSave).toBe(doNotSave);
        expect(setup.valueHostsManager.asyncProcessing).toBe(false);
        expect(setup.valueHostsManager.doNotSave).toBe(doNotSave);
        expect(notifications).toHaveLength(2);
        expect(notifications[1]).toEqual(expect.objectContaining({
            status, issuesFound: issues, asyncProcessing: false, doNotSave
        }));
        expect(setup.logger.findMessage('Validation result:', LoggingLevel.Info, LoggingCategory.Result,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test.each(['async-first', 'standard-first'] as const)(
        'Retains both errors when the %s configuration is listed first',
        async order => {
            let finish!: (result: AsyncValidatorEvaluationResult) => void;
            let asyncConfig: AsyncValidatorConfig = {
                validatorType: ValidatorType.AsyncValidator,
                handlerIdentity: 'AvailabilityCheck',
                handler: () => new Promise(resolve => { finish = resolve; })
            };
            let standardConfig = createValidatorConfig({ conditionType: NeverMatchesConditionType });
            let setup = setupValidatorsValueHostBase({
                validatorConfigs: order === 'async-first' ?
                    [asyncConfig, standardConfig] : [standardConfig, asyncConfig]
            });
            let logger = new TestingLoggingService(LoggingLevel.Debug);
            setup.services.loggingService = logger;
            let notifications: ValueHostValidationState[] = [];
            setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };

            let result = setup.valueHost.validate()!;
            expect(result.pending).toHaveLength(1);
            let pending = result.pending![0];
            expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
            expect(setup.valueHost.getIssuesFound()).toHaveLength(1);
            expect(setup.valueHostsManager.asyncProcessing).toBe(true);

            finish({
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                errorCode: 'NameTaken',
                errorMessage: 'Name is taken'
            });
            expect((await pending).conditionEvaluateResult).toBe(ConditionEvaluateResult.NoMatch);
            expect(result.pending).toBeUndefined();
            expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
            expect(setup.valueHost.doNotSave).toBe(true);
            expect(setup.valueHostsManager.asyncProcessing).toBe(false);
            expect(setup.valueHost.getIssuesFound()).toEqual([
                {
                    valueHostName: 'Field1', errorCode: NeverMatchesConditionType,
                    errorMessage: 'Local', summaryMessage: 'Summary',
                    severity: ValidationSeverity.Error, doNotSave: true
                },
                {
                    asyncIdentity: 'AvailabilityCheck', valueHostName: 'Field1',
                    errorCode: 'NameTaken', errorMessage: 'Name is taken', summaryMessage: 'Name is taken',
                    severity: ValidationSeverity.Error, doNotSave: true
                }
            ]);
            expect(notifications).toHaveLength(2);
            expect(notifications[1]).toEqual(expect.objectContaining({
                status: ValidationStatus.Invalid, asyncProcessing: false, doNotSave: true,
                issuesFound: setup.valueHost.getIssuesFound()
            }));
            expect(logger.findMessage('Validation result:', LoggingLevel.Info, LoggingCategory.Result,
                { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
            expect(logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
        }
    );

    test('Two successful async validators notify while one remains pending and again on completion', async () => {
        let finishFirst!: (result: AsyncValidatorEvaluationResult) => void;
        let finishSecond!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncIssueHost([
            { identity: 'FirstCheck', handler: () => new Promise(resolve => { finishFirst = resolve; }) },
            { identity: 'SecondCheck', handler: () => new Promise(resolve => { finishSecond = resolve; }) }
        ]);
        let notifications: ValueHostValidationState[] = [];
        setup.valueHostsManager.onValueHostValidationStateChanged = (_, state) => { notifications.push(state); };
        let result = setup.valueHost.validate()!;
        expect(result.pending).toHaveLength(2);
        let pending = [...result.pending!];

        finishFirst({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        expect((await pending[0]).conditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
        expect(result.pending).toHaveLength(1);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHostsManager.asyncProcessing).toBe(true);
        expect(setup.valueHostsManager.doNotSave).toBe(true);
        expect(notifications).toHaveLength(2);
        expect(notifications[1]).toEqual(expect.objectContaining({
            status: ValidationStatus.Valid, issuesFound: null, asyncProcessing: true, doNotSave: true
        }));

        finishSecond({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        expect((await pending[1]).conditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
        expect(result.pending).toBeUndefined();
        expect(setup.valueHostsManager.asyncProcessing).toBe(false);
        expect(setup.valueHostsManager.doNotSave).toBe(false);
        expect(notifications).toHaveLength(3);
        expect(notifications[2]).toEqual(expect.objectContaining({
            status: ValidationStatus.Valid, issuesFound: null, asyncProcessing: false, doNotSave: false
        }));
        expect(setup.logger.findMessage('Validation result:', LoggingLevel.Info, LoggingCategory.Result,
            { feature: 'ValueHost', identity: 'Field1' })).toBeTruthy();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

// clearValidation(): void
describe('clearValidation', () => {
    test('After validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivConfig: ValidatorConfig = {
            validatorType: ValidatorType.Validator,
            conditionConfig: { conditionType: IsUndeterminedConditionType },
            errorMessage: ''
        };
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            ivConfig
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);

        setup.valueHost.validate();
        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();

        let capturedState = restoreCapturedState(setup.valueHostsManager);
        expect(capturedState.vh[0]).toEqual({
            name: 'Field1',
            status: ValidationStatus.NotAttempted,
            issuesFound: null,
            value: undefined
        });

    });
    test('Without calling validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivConfig: ValidatorConfig = {
            validatorType: ValidatorType.Validator,
            conditionConfig: { conditionType: IsUndeterminedConditionType },
            errorMessage: ''
        };
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            ivConfig
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();
        let capturedState = restoreCapturedState(setup.valueHostsManager);
        expect(capturedState.vhm.stateChangeCounter).toBe(0);

    });
    test('With prior state reflecting a validation issue, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let ivConfig: ValidatorConfig = {
            validatorType: ValidatorType.Validator,
            conditionConfig: { conditionType: NeverMatchesConditionType },
            errorMessage: ''
        };
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            ivConfig
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
            name: 'Field1',
            status: ValidationStatus.Invalid,
            issuesFound: []
        };
        state.issuesFound!.push(createIssueFound(NeverMatchesConditionType));

        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssueFound(NeverMatchesConditionType)).toBeNull();

    });

    test('Without calling validate but with external IssueFound (Error), Ensure the state discards external IssueFound after clear', () => {
        let setup = setupValidatorsValueHostBaseForValidate([], {});
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true);

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        let capturedState = restoreCapturedState(setup.valueHostsManager);

        expect(capturedState.vh[0]).toEqual({
            name: 'Field1',
            status: ValidationStatus.NotAttempted,
            issuesFound: null,
            value: undefined
        });
    });
    test('onValueHostValidationStateChanged called', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [],
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        vhm.onValueHostValidationStateChanged = (vh, vr) => {
            onValidateResult = vr;
        };
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig>{
            valueHostType: TestValueHostType,
            name: 'Field1',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        }, null) as TestValidatorsValueHost;

        let neverMatchIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            errorMessage: 'Error',
            summaryMessage: 'Error',
            valueHostName: 'Field1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let snapshot = vhm.validate({ skipCallback: true }); // ensure we have an invalid state without business logic
        expect(snapshot).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [neverMatchIssueFound],
            asyncProcessing: false
        });

        let result: boolean | null = null;
        expect(() => result = vh.clearValidation()).not.toThrow();

        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            issuesFound: null,
            isValid: true,
            doNotSave: false,
            asyncProcessing: false,
            status: ValidationStatus.NotAttempted,
            corrected: false
        });
    });        

    test('onValueHostValidationStateChanged not called when options.skipCallback = true', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [],
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        vhm.onValueHostValidationStateChanged = (vh, vr) => {
            onValidateResult = vr;
        };
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig>{
            valueHostType: TestValueHostType,
            name: 'Field1',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        }, null) as TestValidatorsValueHost;

        let neverMatchIssueFound: IssueFound = {
            errorCode: NeverMatchesConditionType,
            errorMessage: 'Error',
            summaryMessage: 'Error',
            valueHostName: 'Field1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let snapshot = vhm.validate({ skipCallback: true }); // ensure we have an invalid state without business logic
        expect(snapshot).toEqual(<ValidationState>{
            isValid: false,
            doNotSave: true,
            issuesFound: [neverMatchIssueFound],
            asyncProcessing: false
        });

        let result: boolean | null = null;
        expect(() => result = vh.clearValidation({ skipCallback: true })).not.toThrow();

        expect(onValidateResult).toBeNull();
    });        
});

describe('currentValidationState', () =>
{
    function setup(group?: string | string[] | null | undefined): { vhm: ValueHostsManager, vh: TestValidatorsValueHost; }
    {
        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: []
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig> {
            valueHostType: TestValueHostType,
            name: 'Field1',
            group: group,
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        }, null) as TestValidatorsValueHost;
        return { vhm, vh };
    }
    // state when no validation has occurred. 
    test('currentValidationState is status: ValidationStatus.NotAttempted when no validation has occurred', () =>
    {
        let { vhm, vh } = setup();
        expect(vh.currentValidationState).not.toBeNull();
        expect(vh.currentValidationState).toEqual(<ValueHostValidationState> {
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false,
            corrected: false,
            status: ValidationStatus.NotAttempted
        });
    });
    test('currentValidationState is status: ValidationStatus.Invalid after validation due to validator involved', () =>
    {
        let { vhm, vh } = setup();
        vh.validate();
        expect(vh.currentValidationState).toEqual(<ValueHostValidationState> {
            isValid: false,
            doNotSave: true,
            issuesFound: [
                {
                    errorCode: NeverMatchesConditionType,
                    errorMessage: 'Error',
                    summaryMessage: 'Error',
                    valueHostName: 'Field1',
                    doNotSave: true,
                    severity: ValidationSeverity.Error,
                }
            ],
            asyncProcessing: false,
            corrected: false,
            status: ValidationStatus.Invalid
        });
    });
    // validation group 'A' adds that to the current validation state
    test('currentValidationState includes issues from validation group A', () =>
    {
        let { vhm, vh } = setup('A');
        vh.validate();
        expect(vh.currentValidationState).toEqual(<ValueHostValidationState> {
            isValid: false,
            doNotSave: true,
            issuesFound: [
                {
                    errorCode: NeverMatchesConditionType,
                    errorMessage: 'Error',
                    summaryMessage: 'Error',
                    valueHostName: 'Field1',
                    doNotSave: true,
                    severity: ValidationSeverity.Error,
                }
            ],
            asyncProcessing: false,
            corrected: false,
            status: ValidationStatus.Invalid,
            group: 'A'
        });
    });
    // group = null reports undefined 
    test('fieldValueHost with group = null reports undefined', () =>
    {
        let { vhm, vh } = setup(null);
        vh.validate();
        expect(vh.currentValidationState).toEqual(<ValueHostValidationState> {
            isValid: false,
            doNotSave: true,
            issuesFound: [
                {
                    errorCode: NeverMatchesConditionType,
                    errorMessage: 'Error',
                    summaryMessage: 'Error',
                    valueHostName: 'Field1',
                    doNotSave: true,
                    severity: ValidationSeverity.Error,
                }
            ],
            asyncProcessing: false,
            corrected: false,
            status: ValidationStatus.Invalid
        });
    });
    test('fieldValueHost with group = ["A"] reports "A"', () =>
    {
        let { vhm, vh } = setup(['A']);
        vh.validate();
        expect(vh.currentValidationState).toEqual(<ValueHostValidationState> {
            isValid: false,
            doNotSave: true,
            issuesFound: [
                {
                    errorCode: NeverMatchesConditionType,
                    errorMessage: 'Error',
                    summaryMessage: 'Error',
                    valueHostName: 'Field1',
                    doNotSave: true,
                    severity: ValidationSeverity.Error,
                }
            ],
            asyncProcessing: false,
            corrected: false,
            status: ValidationStatus.Invalid,
            group: 'A'
        });
    });
    test('fieldValueHost with group = ["A", "B"] reports "A,B"', () =>
    {
        let { vhm, vh } = setup(['A', 'B']);
        vh.validate();
        expect(vh.currentValidationState).toEqual(<ValueHostValidationState> {
            isValid: false,
            doNotSave: true,
            issuesFound: [
                {
                    errorCode: NeverMatchesConditionType,
                    errorMessage: 'Error',
                    summaryMessage: 'Error',
                    valueHostName: 'Field1',
                    doNotSave: true,
                    severity: ValidationSeverity.Error,
                }
            ],
            asyncProcessing: false,
            corrected: false,
            status: ValidationStatus.Invalid,
            group: 'A,B'
        });
    });
    
});


describe('ValidatorsValueHostBase.clearExternalIssuesFound', () => {
    
    test('With existing validator using the same errorcode as externalIssueFound and the validator was previously valid, add an issueFound and not a externalIssueFound', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [],
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        vhm.onValueHostValidationStateChanged = (vh, vr) => {
            onValidateResult = vr;
        };
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig>{
            valueHostType: TestValueHostType,
            name: 'Field1',
            validatorConfigs: [
                <ValidatorConfig> {
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: UserSuppliedResultConditionType,
                        result: ConditionEvaluateResult.Match,
                        category: ConditionCategory.Contents
                    },
                    errorMessage: 'TOBEREPLACED Error message',
                    errorCode: 'TOBEREPLACED',
                },
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType,
                    },
                    errorMessage: 'Never match',
                    errorCode: 'WILLNOTBEREPLACED'
                }
            ]
        }, null) as TestValidatorsValueHost;

        let toBeReplacedIssueFound: IssueFound = {
            errorCode: 'TOBEREPLACED',
            errorMessage: 'TOBEREPLACED Error message',
            summaryMessage: 'TOBEREPLACED Error message',
            valueHostName: 'Field1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };
        let neverMatchIssueFound: IssueFound = {
            errorCode: 'WILLNOTBEREPLACED',
            errorMessage: 'Never match',
            summaryMessage: 'Never match',
            valueHostName: 'Field1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };        

        vhm.validate(); 
        expect(vh.getIssuesFound()).toEqual([neverMatchIssueFound]);        

        let result = vh.addExternalIssueFound({
            errorCode: 'TOBEREPLACED',
            errorMessage: 'Business Logic error message',
//            severity: ValidationSeverity.Error will use Severe for Category=Require
        }, true);
        expect(result).toBe(true);
        expect(vh.getIssuesFound()).toEqual([neverMatchIssueFound, toBeReplacedIssueFound]);        
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            isValid: false,
            issuesFound: [neverMatchIssueFound, toBeReplacedIssueFound],
            doNotSave: true,
            asyncProcessing: false,
            status: ValidationStatus.Invalid,
            corrected: false
        });

    });    
    test('With existing validator using the same errorcode as externalIssueFound and the validator was previously invalid, replace that validators IssueFound and do not add the externalIssueFound', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValueHostsManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [],
        };
        supportTestValueHostInServices(vmConfig.services);
        let vhm = new ValueHostsManager(vmConfig);
        vhm.onValueHostValidationStateChanged = (vh, vr) => {
            onValidateResult = vr;
        };
        let vh = vhm.addValueHost(<ValidatorsValueHostBaseConfig>{
            valueHostType: TestValueHostType,
            name: 'Field1',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: UserSuppliedResultConditionType,
                        result: ConditionEvaluateResult.NoMatch,
                        category: ConditionCategory.Contents
                    },
                    errorMessage: 'TOBEREPLACED Error message',
                    errorCode: 'TOBEREPLACED',
                    severity: ValidationSeverity.Warning   // helps notice the issue was replaced when we later change the severity
                },
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType,
                    },
                    errorMessage: 'Never match',
                    errorCode: 'WILLNOTBEREPLACED'
                }
            ]
        }, null) as TestValidatorsValueHost;

        let strLenIssueFound: IssueFound = {
            errorCode: 'TOBEREPLACED',
            errorMessage: 'TOBEREPLACED Error message',
            summaryMessage: 'TOBEREPLACED Error message',
            valueHostName: 'Field1',
            severity: ValidationSeverity.Warning,
            doNotSave: false
        };
        let neverMatchIssueFound: IssueFound = {
            errorCode: 'WILLNOTBEREPLACED',
            errorMessage: 'Never match',
            summaryMessage: 'Never match',
            valueHostName: 'Field1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };        
        vhm.validate(); 
        expect(vh.getIssuesFound()).toEqual([strLenIssueFound, neverMatchIssueFound]);        

        let result = vh.addExternalIssueFound({
            errorCode: 'TOBEREPLACED',
            errorMessage: 'Business Logic error message',
            severity: ValidationSeverity.Error // by declaring, it overrides the original and is useful here to see the issuefound changed
        }, true);
        expect(result).toBe(true);
        strLenIssueFound.severity = ValidationSeverity.Error;
        expect(vh.getIssuesFound()).toEqual([strLenIssueFound, neverMatchIssueFound]);        
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            isValid: false,
            issuesFound: [strLenIssueFound, neverMatchIssueFound],
            doNotSave: true,
            asyncProcessing: false,
            status: ValidationStatus.Invalid,
            corrected: false
        });

    });        
});


// getIssueFound(validatorConfig: ValidatorConfig): IssueFound | null
describe('ValidatorsValueHostBase.getIssueFound', () => {
    test('Without Validators is null', () => {
        let setup = testValidateFunctionIsNull(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound(null!)).not.toThrow();
        expect(issueFound).toBeNull();
    });
    test('With 1 Condition evaluating as Match is ValidatorResult.Valid, IssuesFound = null', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: AlwaysMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let setup = testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Valid, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound(AlwaysMatchesConditionType)).not.toThrow();
        expect(issueFound).toBeNull();
    });
    test('With 1 Condition evaluating as NoMatch is ValidatorResult.Invalid, IssuesFound = 1', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let issuesFound: Array<IssueFound> = [];
        issuesFound.push(createIssueFound(NeverMatchesConditionType));
        let setup = testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, issuesFound);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound(NeverMatchesConditionType)).not.toThrow();
        expect(issueFound).not.toBeNull();
        expect(issuesFound.length).toBe(1);
        expect(issueFound).toEqual(issuesFound[0]);
    });
});

// getIssuesFound(): Array<IssueFound>
describe('ValidatorsValueHostBase.getIssuesFound', () => {
    test('Nothing to report returns null', () => {
        let setup = testValidateFunctionIsNull(null, null);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).toBeNull();
    });
    test('2 issues exist. Both are returned in the order of the ValidationConfigs array.', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                errorMessage: '1',
                summaryMessage: 'Summary1',
                severity: ValidationSeverity.Warning
            },
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType2
                },
                errorMessage: '2',
                summaryMessage: 'Summary2'
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {};
        let expectedIssuesFound: Array<IssueFound> = [];
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType, ValidationSeverity.Warning, '1', 'Summary1'));
        expectedIssuesFound.push(createIssueFound(NeverMatchesConditionType2, ValidationSeverity.Error, '2', 'Summary2'));
        let setup = testValidateFunctionHasResult(ivConfigs, state, ValidationStatus.Invalid, expectedIssuesFound);
        let issuesToReport: Array<IssueFound> | null = null;
        expect(() => issuesToReport = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesToReport).not.toBeNull();
        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: NeverMatchesConditionType,
                severity: ValidationSeverity.Warning,
                errorMessage: '1',
                summaryMessage: 'Summary1',
                doNotSave: false
            },
            {
                valueHostName: 'Field1',
                errorCode: NeverMatchesConditionType2,
                severity: ValidationSeverity.Error,
                errorMessage: '2',
                summaryMessage: 'Summary2',
                doNotSave: true
            }
        ];
        expect(issuesToReport).toEqual(expected);
    });

    test('1 Validation error, and has external IssueFound (Error) reports 2 entries with external IssueFound last', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: {
                    conditionType: NeverMatchesConditionType
                },
                errorMessage: 'Condition Error',
                summaryMessage: 'Summary Condition Error',
                severity: ValidationSeverity.Error
            },

        ];
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, {});
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'BL_ERROR',
            // use the default         severity: ValidationSeverity.Error
        }, true);
        let issuesFound: Array<IssueFound> | null = null;
        setup.valueHost.validate();
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: NeverMatchesConditionType,
                severity: ValidationSeverity.Error,
                errorMessage: 'Condition Error',
                summaryMessage: 'Summary Condition Error',
                doNotSave: true
            },
            {
                valueHostName: 'Field1',
                errorCode: 'GENERATED_0',
                severity: ValidationSeverity.Error,
                errorMessage: 'BL_ERROR',
                summaryMessage: 'BL_ERROR',
                doNotSave: true
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
});

describe('ValidatorsValueHostBase.gatherValueHostNames', () => {
    test('Gets two ValueHostNames', () => {
        let ivConfigs: Array<Partial<ValidatorConfig>> = [
            {
                conditionConfig: <DataTypeCheckConditionConfig>{
                    conditionType: ConditionType.DataTypeCheck,
                    valueHostName: 'Field1'
                }
            },
            {
                conditionConfig: <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                }
            }
        ];
        let state: Partial<ValidatorsValueHostBaseInstanceState> = {
        };
        let setup = setupValidatorsValueHostBaseForValidate(ivConfigs, state);
        let collection = new Set<ValueHostName>();
        expect(() => setup.valueHost.gatherValueHostNames(collection, setup.valueHostsManager)).not.toThrow();
        expect(collection.size).toBe(2);
        expect(collection.has('Field1')).toBe(true);
        expect(collection.has('Field2')).toBe(true);
    });
});

// Async dependency changes must invalidate old requests or start a fresh validation run.
describe('ValidatorsValueHostBase async dependency invalidation', () => {
    test('A dependency change without revalidation abandons the pending async result', async () => {
        let finish!: (result: AsyncValidatorEvaluationResult) => void;
        let setup = setupAsyncDependencyHost(() => new Promise(resolve => { finish = resolve; }));
        let result = setup.valueHost.validate()!;
        let pending = [...result.pending!];

        setup.dependency.setValue('changed');
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.asyncProcessing).toBe(false);

        finish({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'StaleDependencyResult',
            errorMessage: 'Must not be applied'
        });
        await Promise.all(pending);

        expect(result.pending).toBeUndefined();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('A dependency change with revalidation preserves the new run when the old request settles first', async () => {
        let finishes: Array<(result: AsyncValidatorEvaluationResult) => void> = [];
        let calls = 0;
        let setup = setupAsyncDependencyHost(() => {
            calls++;
            return new Promise(resolve => { finishes.push(resolve); });
        });
        let firstResult = setup.valueHost.validate()!;
        let firstPending = [...firstResult.pending!];

        setup.dependency.setValue('changed', { validate: true });
        expect(calls).toBe(2);
        expect(setup.valueHost.asyncProcessing).toBe(true);
        finishes[0]({
            conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
            errorCode: 'StaleDependencyResult',
            errorMessage: 'Must not be applied'
        });
        await Promise.all(firstPending);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(setup.valueHost.asyncProcessing).toBe(true);
        expect(setup.valueHost.getIssuesFound()).toBeNull();

        finishes[1]({ conditionEvaluateResult: ConditionEvaluateResult.Match });
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});


describe('ValidatorsValueHostBase.otherValueHostChangedNotification and setValues triggering ValueHostsManager.notifyOtherValueHostsOfValueChange to call otherValueHostChangedNotification', () => {

    // field1 has an Equals condition compared to field2
    // field2 will always validate as NoMatch
    // field3 will always validate as NoMatch
    function setupWithThreeValueHosts(): {
        vhm: IValueHostsManager,
        services: IJivsServices,
        field1: IValidatorsValueHost,
        field2: IValidatorsValueHost,
        field3: IValidatorsValueHost
    } {

        let vhConfigs: Array<ValidatorsValueHostBaseConfig> = [
            { // Refers to Field2. So validation on Field2 should force this to update
                valueHostType: TestValueHostType,
                name: 'Field1',
                label: 'Label1',
                validatorConfigs: [<ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <EqualToConditionConfig>{
                        conditionType: ConditionType.EqualTo,
                        secondValueHostName: 'Field2',
                        valueHostName: null
                    },
                    errorMessage: 'Field1 Error'
                }]
            },
            {
                valueHostType: TestValueHostType,
                name: 'Field2',
                label: 'Label2',
                validatorConfigs: [<ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    // emulate RequireText because the real condition needs text value
                    conditionConfig: <UserSuppliedResultConditionConfig>{
                        conditionType: UserSuppliedResultConditionType,
                        category: ConditionCategory.Require,
                        result: ConditionEvaluateResult.NoMatch,
                    },           
                    errorMessage: 'Field2 Error',
                    errorCode: 'RTFld2'
                }]
            },
            { // Value changes should not notify another
                valueHostType: TestValueHostType,
                name: 'Field3',
                label: 'Label3',

                validatorConfigs: [<ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    // emulate RequireText because the real condition needs text value
                    conditionConfig: <UserSuppliedResultConditionConfig>{
                        conditionType: UserSuppliedResultConditionType,
                        category: ConditionCategory.Require,
                        result: ConditionEvaluateResult.NoMatch,

                    },           
                    errorMessage: 'Field3 Error',
                    errorCode: 'RTFld3'
                }]                
            }
        ];
        let services = createJivsServicesForTesting();
        supportTestValueHostInServices(services);
        let cf = services.conditionFactory as ConditionFactory;
        cf.register<EqualToConditionConfig>(
            ConditionType.EqualTo, (config) => new EqualToCondition(config));
        let vhm = new ValueHostsManager({ services: services, valueHostConfigs: vhConfigs });   // the real thing so we use real ValidatorsValueHostBases


        return {
            vhm: vhm,
            services: services,
            field1: vhm.getValueHost('Field1') as IValidatorsValueHost,
            field2: vhm.getValueHost('Field2') as IValidatorsValueHost,
            field3: vhm.getValueHost('Field3') as IValidatorsValueHost
        };
    }
    test('No field previously validated or changed. Use Notification from field1 to field2 with revalidate = false. ValidationStatus should not change.', () => {
        let setup = setupWithThreeValueHosts();
        expect(() => setup.field1.otherValueHostChangedNotification(
            setup.field2.getName(), false)).not.toThrow();
        expect(setup.field1.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.field2.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NotAttempted);
    });
    test('No field previously validated or changed. Use Notification from field2 to field1 with revalidate = false. ValidationStatus should not change.', () => {
        let setup = setupWithThreeValueHosts();

        expect(() => setup.field2.otherValueHostChangedNotification(
            setup.field1.getName(), false)).not.toThrow();
        expect(setup.field1.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.field2.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NotAttempted);
    });
    test('Field1 previously validated and is Invalid. Field2 changed, revalidate = false. Field1.ValidationStatus => NeedsValidation.', () => {
        let setup = setupWithThreeValueHosts();
        setup.field1.setValue('ABC');   // Equal condition will fail
        setup.field2.setValue('BCD');  

        setup.field1.validate();       // field1 = invalid

        expect(() => setup.field1.otherValueHostChangedNotification(
            setup.field2.getName(), false)).not.toThrow();
        expect(setup.field1.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.field2.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NotAttempted);
    });
    test('Field1 previously validated and is Invalid. Field2 changed via setValue with validate=false. Field1.ValidationStatus => NeedsValidation.', () => {
        let setup = setupWithThreeValueHosts();
        setup.field1.setValue('ABC');   // Equal condiiton will fail
        setup.field2.setValue('BCD');

        setup.field1.validate();        // field1 = invalid

        setup.field2.setValue('ABC');  // will trigger OtherValueHostChangedNotification with revalidate=false
        expect(setup.field1.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.field2.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NotAttempted);
    });
    test('Field1 previously validated and is Invalid. Field2 changed via setValue with validate=true. Field1.ValidationStatus => Valid because fields are now equal.', () => {
        let setup = setupWithThreeValueHosts();
        setup.field1.setValue('ABC');
        setup.field2.setValue('BCD');

        expect(setup.field1.validationStatus).toBe(ValidationStatus.NeedsValidation);
        setup.field1.validate();
        expect(setup.field1.validationStatus).toBe(ValidationStatus.Invalid);

        setup.field2.setValue('ABC', { validate: true });  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(setup.field1.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.field2.validationStatus).toBe(ValidationStatus.Invalid);   // we validated and its always invalid
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NotAttempted);
    });
    test('Field1 previously validated. Change Field3 with revalidate=false. No change to Field1. Field3.ValidationState=>NotAttempted because it was not NeedsValidation', () => {
        let setup = setupWithThreeValueHosts();
        setup.field1.setValue('ABC');
        setup.field2.setValue('BCD');

        setup.field1.validate();    // field1 = Invalid

        expect(() => setup.field1.otherValueHostChangedNotification(
            setup.field3.getName(), false)).not.toThrow();
        expect(setup.field1.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.field2.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NotAttempted);
    });
    test('Field1 previously validated. Use setValues to change Field3 with validate=false. No change to Field1. Field3.ValidationState=>ValueChangedButInvalided', () => {
        let setup = setupWithThreeValueHosts();
        setup.field1.setValue('ABC');   // Equal condition will fail
        setup.field2.setValue('BCD');
        setup.field3.setValue('');  // field3 is always Invalid

        setup.field1.validate();    // = invalid
        setup.field2.validate();    // = invalid
        setup.field3.validate();    // = invalid

        setup.field3.setValue('X');  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(setup.field1.validationStatus).toBe(ValidationStatus.Invalid);  // no change
        expect(setup.field2.validationStatus).toBe(ValidationStatus.Invalid);   // when validated, always invalid
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });

    test('Field1 previously validated. Use setValues to change Field3 with validate=true. No change to Field1.', () => {
        let setup = setupWithThreeValueHosts();
        setup.field1.setValue('ABC');   // Equal condition will fail
        setup.field2.setValue('BCD');
        setup.field3.setValue('');  // field3 is always Invalid
        setup.field1.validate();    // = invalid
        setup.field2.validate();    // = invalid
        setup.field3.validate();    // = invalid
        setup.field3.setValue('X', { validate: true });  // will trigger OtherValueHostCHangedNotification with revalidate=false
        expect(setup.field1.validationStatus).toBe(ValidationStatus.Invalid);  // no change
        expect(setup.field2.validationStatus).toBe(ValidationStatus.Invalid);   // when validated, always invalid
        expect(setup.field3.validationStatus).toBe(ValidationStatus.Invalid);  // when validated, always invalid
    });
    test('Field1 never validated but had been setValue. Use setValue to change Field2 with validate=true. Expect Field1 ValidationStatus=Valid because it was ValidationStatus=ValueChanged.', () => {
        let setup = setupWithThreeValueHosts();
        setup.field1.setValue('ABC');
        setup.field2.setValue('BCD');
        setup.field2.setValue('ABC', { validate: true }); 
        expect(setup.field1.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.field2.validationStatus).toBe(ValidationStatus.Invalid);   // when validated, always invalid
        expect(setup.field3.validationStatus).toBe(ValidationStatus.NotAttempted);

    });
});


describe('toIValidatorsValueHost function', () => {
    test('Passing actual ValidatorsValueHostBase matches interface returns same object.', () => {
        let vhm = new MockValueHostsManager(new MockJivsServices(false, false));
        let testItem = new TestValidatorsValueHost(vhm, {
            name: 'Field1',
            label: 'Label1',
            validatorConfigs: []
        },
            {
                name: 'Field1',
                value: undefined,
                issuesFound: null,
                status: ValidationStatus.NotAttempted,
            });
        expect(toIValidatorsValueHost(testItem)).toBe(testItem);
    });
    class TestIValidatorsValueHostImplementation implements IValidatorsValueHost {

        private issues: IssueFound[] = [];
        private data: Map<string, ValidTypesForInstanceStateStorage> = new Map();
        private hostValue: any = undefined;
        private hostTextValue: string | undefined = undefined;
        private hostEnabled: boolean = true;

        valueHostsManager: IValueHostsManager = {} as IValueHostsManager;
        dispose(): void {}
        gatherValueHostNames(collection: Set<string>, valueHostResolver: IValueHostResolver): void {
        }
        groupCheck(options?: ValidateOptions | undefined): boolean {
            return true;
        }

        getTextValue() : string | undefined {
            return this.hostTextValue;
        }
        setTextValue(textValue: string | undefined, options?: SetValueOptions | undefined): void {
            this.hostTextValue = textValue;
        }
        setValues(nativeValue: any, textValue: any, options?: SetValueOptions | undefined): void {
            this.hostValue = nativeValue;
            this.hostTextValue = textValue;
        }
        otherValueHostChangedNotification(valueHostIdThatChanged: string, revalidate: boolean): void {
        }
        validate(options?: ValidateOptions | undefined): ValueHostValidateResult {
            return { issuesFound: null, status: ValidationStatus.Valid };
        }
        clearValidation(): boolean {
            this.issues = [];
            return true;
        }
        isValid: boolean = true;
        validationStatus: ValidationStatus = ValidationStatus.NotAttempted;
        asyncProcessing: boolean = false;
        hasAsyncValidators: boolean = false;
        changeCounter: number = 0;
        corrected: boolean = false;
        get currentValidationState(): ValueHostValidationState {
            return { isValid: this.isValid, doNotSave: this.doNotSave, status: this.validationStatus, issuesFound: this.issues, asyncProcessing: false, corrected: false };
        }

        addExternalIssuesFound(issuesFound: IssueFound[], determinedLocally: boolean, options?: ValidateOptions | undefined): boolean {
            this.issues.push(...issuesFound);
            return true;
        }
        addExternalIssueFound(issueFound: IssueFound, determinedLocally: boolean, options?: ValidateOptions | undefined): boolean {
            this.issues.push(issueFound);
            return true;
        }        
        clearExternalIssuesFound(options?: ValidateOptions): boolean {
            return true;
        }
        doNotSave: boolean = false;
        getIssueFound(errorCode: string): IssueFound | null {
            return this.issues.find(i => i.errorCode === errorCode) ?? null;
        }

        getIssuesFound(group?: string | undefined): IssueFound[] {
            return this.issues;
        }  
        getInjectedError(): InjectedError | null {
            return null;
        }
        setInjectedError(injectedError: InjectedError): void
        {
            throw new Error('Method not implemented.');
        }
        clearInjectedError(): void
        {
            throw new Error('Method not implemented.');
        }        
        required: boolean = false;
        getType(): string {
            return 'TestType';
        }
        getName(): string {
            return 'TestHost';
        }
        getLabel(): string {
            return 'Test Host Label';
        }

        getValue() {
            return this.hostValue;
        }
        setValue(value: any, options?: SetValueOptions | undefined): void {
            this.hostValue = value;
        }
        setValueToUndefined(options?: SetValueOptions | undefined): void {
            this.hostValue = undefined;
        }
        getDataType(): string | null {
            return null;
        }
        getDataTypeLabel(): string {
            return '';
        }
        isChanged: boolean = false;
        readOnly: boolean = false;
        isEnabled(): boolean {
            return this.hostEnabled;
        }
        setEnabled(enabled: boolean): void {
            this.hostEnabled = enabled;
        }        
        saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void {
            if (value === undefined) {
                this.data.delete(key);
            } else {
                this.data.set(key, value);
            }
        }
        getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined {
            return this.data.get(key);
        }
        getValidator(errorCode: string): IValidator | null {
            return null;
        }
        _captureState(stateContainer: StateContainer): void {
            throw new Error('Method not implemented.');
        }
        broadcastState(validationState: boolean = true, values: boolean = true): void
        {
            throw new Error("Method not implemented.");
        }
    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIValidatorsValueHostImplementation();

        expect(toIValidatorsValueHost(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidatorsValueHost(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIValidatorsValueHost(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIValidatorsValueHost(100)).toBeNull();
    });
});

describe('ValidatorsValueHostBaseGenerator members', () => {
    test('cleanupInstanceState existing state has no IssuesFound. Returns the same data', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            issuesFound: null,
            status: ValidationStatus.Valid,
            value: 10
        };
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: null
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionConfig, cleanupInstanceState existing state has no IssuesFound but there is a new ValidationConfig which has no impact. Returns the same data', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            issuesFound: null,
            status: ValidationStatus.Valid,
            value: 10
        };
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <RequireTextConditionConfig>{
                        conditionType: ConditionType.RequireText,
                        valueHostName: null
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionCreator, cleanupInstanceState existing state has no IssuesFound but there is a new ValidationConfig which has no impact. Returns the same data', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            issuesFound: null,
            status: ValidationStatus.Valid,
            value: 10
        };
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionCreator: (requestor) => new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: 'Field1' }),
                    conditionConfig: null,
                    errorMessage: ''
                }
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionConfig, cleanupInstanceState existing state with ValidationStatus.Error has an IssuesFound and there is a ValidatorConfig. instanceState.IssuesFound unchanged', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound?.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: '',
            doNotSave: true
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <RequireTextConditionConfig>{
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'Field1'
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionCreator, cleanupInstanceState existing state with ValidationStatus.Error has an IssuesFound and there is a ValidatorConfig. instanceState.IssuesFound unchanged', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound?.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: '',
            doNotSave: true
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionCreator: (requestor) => new RequireTextCondition({ conditionType: ConditionType.RequireText, valueHostName: 'Field1' }),
                    conditionConfig: null,
                    errorMessage: ''
                }
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        expect(state).toEqual(originalState);
    });
    test('Using ConditionConfig, cleanupInstanceState existing state has an IssuesFound but no associated ValidationConfig. instanceState.IssuesFound is null', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: '',
            doNotSave: true
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <RangeConditionConfig>{
                        conditionType: ConditionType.Range,   // different type from in InstanceState
                        valueHostName: 'Field1'
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound = null;
        expect(state).toEqual(expectedState);
    });
    test('Using ConditionCreator, cleanupInstanceState existing state has an IssuesFound but no associated ValidationConfig. instanceState.IssuesFound is null', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Valid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: '',
            doNotSave: true
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionCreator: (requestor) => new NeverMatchesCondition({ conditionType: NeverMatchesConditionType }),
                    conditionConfig: null,
                    errorMessage: ''
                }
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound = null;
        expect(state).toEqual(expectedState);
    });

    test('cleanupInstanceState existing state with ValidationStatus=Invalid has an IssuesFound but no associated ValidationConfig. instanceState.IssuesFound is null and ValidationStatus is NeedsValidation', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: '',
            doNotSave: true
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <RangeConditionConfig>{
                        conditionType: ConditionType.Range,   // different type from in InstanceState
                        valueHostName: 'Field1'
                    },
                    errorMessage: ''
                }
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound = null;
        expectedState.status = ValidationStatus.NeedsValidation;
        expect(state).toEqual(expectedState);
    });
    test('cleanupInstanceState existing state with ValidationStatus=Invalid, 2 IssuesFound where one is Warning and the other is removed. State.IssuesFound is the warning and ValidationStatus is Valid', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: '',
            doNotSave: true
        });
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: NeverMatchesConditionType,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: '',
            doNotSave: false
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: ''
                }
                // we've abandoned ConditionType.RequireText which was severity=Error
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound!.splice(0, 1);
        expectedState.status = ValidationStatus.Valid;
        expect(state).toEqual(expectedState);
    });
    test('cleanupInstanceState existing state with ValidationStatus=Invalid, 3 IssuesFound (Error, Warning, Error) and one Error is removed. State.IssuesFound is the warning and the remaining error and ValidationStatus is Invalid', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: '',
            doNotSave: true
        });
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: NeverMatchesConditionType,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: '',
            doNotSave: false
        });
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.Range,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: '',
            doNotSave: true
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: ''
                },
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <RangeConditionConfig>{
                        conditionType: ConditionType.Range,
                        valueHostName: null
                    },
                    errorMessage: ''
                }
                // we've abandoned ConditionType.RequireText which was severity=Error
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound!.splice(0, 1);
        expectedState.status = ValidationStatus.Invalid;
        expect(state).toEqual(expectedState);
    });
    test('cleanupInstanceState existing state with ValidationStatus=Invalid, 3 IssuesFound (Error, Warning, Severe) where Error is removed. State.IssuesFound is Warning, Severe and ValidationStatus is Invalid', () => {
        let originalState: ValidatorsValueHostBaseInstanceState = {
            name: 'Field1',
            status: ValidationStatus.Invalid,
            value: 10,
            issuesFound: [],
        };
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.RequireText,
            errorMessage: '',
            severity: ValidationSeverity.Error,
            summaryMessage: '',
            doNotSave: true
        });
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: NeverMatchesConditionType,
            errorMessage: '',
            severity: ValidationSeverity.Warning,
            summaryMessage: '',
            doNotSave: false
        });
        originalState.issuesFound!.push({
            valueHostName: 'Field1',
            errorCode: ConditionType.Range,
            errorMessage: '',
            severity: ValidationSeverity.Severe,
            summaryMessage: '',
            doNotSave: true
        });
        let state = { ...originalState };
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: ''
                },
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <RangeConditionConfig>{
                        conditionType: ConditionType.Range,
                        valueHostName: null
                    },
                    errorMessage: ''
                }
                // we've abandoned ConditionType.RequireText which was severity=Error
            ]
        };
        let testItem = new TestValidatorsValueHostGenerator();
        expect(() => testItem.cleanupInstanceState(state, config)).not.toThrow();
        let expectedState = { ...originalState };
        expectedState.issuesFound!.splice(0, 1);
        expectedState.status = ValidationStatus.Invalid;
        expect(state).toEqual(expectedState);
    });
    test('createInstanceState returns instance with name and InitialValue from Config', () => {
        let testItem = new TestValidatorsValueHostGenerator();
        let config: ValidatorsValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: TestValueHostType,
            label: '',
            initialValue: 'TEST',
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: <RequireTextConditionConfig>{
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'Field1'
                    },
                    errorMessage: '',
                }
            ]
        };
        let state: ValidatorsValueHostBaseInstanceState | null = null;
        expect(() => state = testItem.createInstanceState(config)).not.toThrow();
        expect(state).not.toBeNull();
        expect(state!.name).toBe(config.name);
        expect(state!.status).toBe(ValidationStatus.NotAttempted);
        expect(state!.group).toBeUndefined();
        expect(state!.value).toBe(config.initialValue);
        expect(state!.issuesFound).toBeNull();
    });
});

/**
 * Creates an async configuration for cleanup; the handler is not executed by the generator.
 */
function asyncCleanupConfig(identity: string): AsyncValidatorConfig {
    return {
        validatorType: ValidatorType.AsyncValidator,
        handlerIdentity: identity,
        handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
    };
}

/**
 * Prepares previously stored issues and a replacement configuration for cleanup.
 */
function setupAsyncCleanup(
    validatorConfigs: NonNullable<ValidatorsValueHostBaseConfig['validatorConfigs']>,
    issuesFound: IssueFound[],
    status: ValidationStatus = ValidationStatus.Invalid
) {
    let testItem = new TestValidatorsValueHostGenerator();
    let config = finishPartialValidatorsValueHostBaseConfig({ validatorConfigs });
    let state = finishPartialValidatorsValueHostBaseInstanceState({ issuesFound, status });
    return { testItem, config, state };
}

// Cleanup retains configured handler ownership and removes transient pending state after restoration.
describe('ValidatorsValueHostBaseGenerator async issue cleanup', () => {
    test('Clears restored async processing and corrected state and requires validation again', () => {
        let setup = setupAsyncCleanup([asyncCleanupConfig('AvailabilityCheck')], [], ValidationStatus.Valid);
        setup.state.asyncProcessing = true;
        setup.state.corrected = true;

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.asyncProcessing).toBeUndefined();
        expect(setup.state.corrected).toBeUndefined();
        expect(setup.state.status).toBe(ValidationStatus.NeedsValidation);
    });

    test('Clears restored pending flags but preserves Failed status and configured failure identities', () => {
        let setup = setupAsyncCleanup([asyncCleanupConfig('AvailabilityCheck')], [], ValidationStatus.Failed);
        setup.state.asyncProcessing = true;
        setup.state.corrected = true;
        setup.state.failedAsyncIdentities = ['AvailabilityCheck'];

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.asyncProcessing).toBeUndefined();
        expect(setup.state.corrected).toBeUndefined();
        expect(setup.state.status).toBe(ValidationStatus.Failed);
        expect(setup.state.failedAsyncIdentities).toEqual(['AvailabilityCheck']);
    });

    test('Retains an async issue when its handler remains configured even though its error code differs', () => {
        let issue = asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken');
        let setup = setupAsyncCleanup([asyncCleanupConfig('AvailabilityCheck')], [issue]);
        let external: IssueFound = { errorCode: 'ServerOnly', errorMessage: 'Server issue', doNotSave: false };
        setup.state.externalIssuesFound = [external];

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual([issue]);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
        expect(setup.state.externalIssuesFound).toEqual([external]);
    });

    test('Removes an async issue and requires validation when its handler is removed', () => {
        let setup = setupAsyncCleanup([], [asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken')]);
        setup.state.lastStatus = ValidationStatus.Invalid;

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toBeNull();
        expect(setup.state.status).toBe(ValidationStatus.NeedsValidation);
        expect(setup.state.lastStatus).toBeUndefined();
    });

    test('Retains both standard and async issues when both validators remain configured', () => {
        let standardConfig = createValidatorConfig({ conditionType: ConditionType.RequireText });
        let standard: IssueFound = {
            errorCode: ConditionType.RequireText,
            errorMessage: 'Enter a name',
            severity: ValidationSeverity.Error
        };
        let async = asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken');
        let setup = setupAsyncCleanup([standardConfig, asyncCleanupConfig('AvailabilityCheck')], [standard, async]);

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual(expect.arrayContaining([standard, async]));
        expect(setup.state.issuesFound).toHaveLength(2);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
    });

    test('Keeps a standard issue when a configured async validator has no issue', () => {
        let standardConfig = createValidatorConfig({ conditionType: ConditionType.RequireText });
        let standard: IssueFound = {
            errorCode: ConditionType.RequireText,
            errorMessage: 'Enter a name',
            severity: ValidationSeverity.Error
        };
        let setup = setupAsyncCleanup([standardConfig, asyncCleanupConfig('AvailabilityCheck')], [standard]);

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual([standard]);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
    });

    test('Rejects an async configuration without an identity instead of claiming a standard issue', () => {
        let standard: IssueFound = {
            errorCode: ConditionType.RequireText,
            errorMessage: 'Enter a name',
            severity: ValidationSeverity.Error
        };
        let setup = setupAsyncCleanup([{ validatorType: ValidatorType.AsyncValidator }], [standard]);

        expect(() => setup.testItem.cleanupInstanceState(setup.state, setup.config))
            .toThrow(/handlerIdentity/);
        expect(setup.state.issuesFound).toEqual([standard]);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
    });

    test('Removes only the issue belonging to the removed async handler', () => {
        let retained = asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken');
        let removed = asyncIssue('AlternateCheck', 'AlternateInvalid', 'Alternate invalid');
        let setup = setupAsyncCleanup([asyncCleanupConfig('AvailabilityCheck')], [retained, removed]);

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual([retained]);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
    });

    test('Does not mistake an async issue for a standard issue with the same error code', () => {
        let standardConfig = createValidatorConfig({ conditionType: ConditionType.RequireText });
        let async = asyncIssue('RemovedCheck', ConditionType.RequireText, 'Async message');
        let standard: IssueFound = {
            errorCode: ConditionType.RequireText,
            errorMessage: 'Standard message',
            severity: ValidationSeverity.Error
        };
        let setup = setupAsyncCleanup([standardConfig], [async, standard]);

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual([standard]);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
    });

    test('Retains issues from two configured handlers even when they have the same issue code', () => {
        let first = asyncIssue('AvailabilityCheck', 'NameTaken', 'First');
        let second = asyncIssue('AlternateCheck', 'NameTaken', 'Second');
        let setup = setupAsyncCleanup([
            asyncCleanupConfig('AvailabilityCheck'),
            asyncCleanupConfig('AlternateCheck')
        ], [first, second]);

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual(expect.arrayContaining([first, second]));
        expect(setup.state.issuesFound).toHaveLength(2);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
    });

    test('Changes Invalid to Valid when only a retained async warning remains', () => {
        let warning: AsyncOwnedIssue = {
            ...asyncIssue('AvailabilityCheck', 'NameTaken', 'Warning'),
            severity: ValidationSeverity.Warning,
            doNotSave: false
        };
        let removed: IssueFound = { errorCode: ConditionType.RequireText, errorMessage: 'Required', severity: ValidationSeverity.Error };
        let setup = setupAsyncCleanup([asyncCleanupConfig('AvailabilityCheck')], [warning, removed]);
        setup.state.lastStatus = ValidationStatus.Invalid;

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual([warning]);
        expect(setup.state.status).toBe(ValidationStatus.Valid);
        expect(setup.state.lastStatus).toBeUndefined();
    });

    test('Keeps Invalid when a retained async error remains after a warning is removed', () => {
        let error = asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken');
        let removed: IssueFound = { errorCode: ConditionType.RequireText, errorMessage: 'Warning', severity: ValidationSeverity.Warning };
        let setup = setupAsyncCleanup([asyncCleanupConfig('AvailabilityCheck')], [error, removed]);

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual([error]);
        expect(setup.state.status).toBe(ValidationStatus.Invalid);
    });

    test('Changes Invalid to Valid when an async error is removed and a standard warning remains', () => {
        let standardConfig = createValidatorConfig({ conditionType: ConditionType.RequireText });
        let warning: IssueFound = { errorCode: ConditionType.RequireText, errorMessage: 'Warning', severity: ValidationSeverity.Warning };
        let removed = asyncIssue('RemovedCheck', 'NameTaken', 'Already taken');
        let setup = setupAsyncCleanup([standardConfig], [removed, warning]);

        setup.testItem.cleanupInstanceState(setup.state, setup.config);

        expect(setup.state.issuesFound).toEqual([warning]);
        expect(setup.state.status).toBe(ValidationStatus.Valid);
    });
});

// The real manager must pass captured async ownership through generator cleanup during restoration.
describe('ValidatorsValueHostBaseGenerator async issue restoration integration', () => {
    test('Recreated manager clears captured pending state and requires a fresh validation', () => {
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
        }]);
        setup.valueHost.updateInstanceState(state => {
            state.status = ValidationStatus.Valid;
            state.asyncProcessing = true;
            state.corrected = true;
            return state;
        }, setup.valueHost);
        let capturedState = setup.valueHostsManager.captureState();

        let restoredManager = new ValueHostsManager({
            services: setup.services,
            valueHostConfigs: [setup.config],
            capturedState
        });
        let restored = restoredManager.getValidatorsValueHost('Field1');

        expect(restored).not.toBeNull();
        expect(restored!.asyncProcessing).toBe(false);
        expect(restored!.corrected).toBe(false);
        expect(restored!.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(restoredManager.currentValidationState()).toEqual(expect.objectContaining({
            asyncProcessing: false,
            doNotSave: true
        }));
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });

    test('Retains a captured async issue when the manager recreates its configured ValueHost', () => {
        let issue = asyncIssue('AvailabilityCheck', 'NameTaken', 'Already taken');
        let setup = setupAsyncIssueHost([{
            identity: 'AvailabilityCheck',
            handler: async () => ({ conditionEvaluateResult: ConditionEvaluateResult.Match })
        }], [issue]);
        let capturedState = setup.valueHostsManager.captureState();

        let restoredManager = new ValueHostsManager({
            services: setup.services,
            valueHostConfigs: [setup.config],
            capturedState
        });
        let restored = restoredManager.getValidatorsValueHost('Field1');

        expect(restored).not.toBeNull();
        expect(restored!.getIssuesFound()).toEqual([issue]);
        expect(restored!.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.logger.captured.filter(entry => entry.level >= LoggingLevel.Warn)).toEqual([]);
    });
});

describe('dispose', () => {

    test('dispose kills many references including state and config', () => {
        let setup = setupValidatorsValueHostBase({
            validatorConfigs: [
                <ValidatorConfig>{
                    validatorType: ValidatorType.Validator,
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    }
                }
            ]
        });
        let vhConfig = setup.config;
        setup.valueHost.validate(); // ensure validators and conditions are created, so we can test disposing them
        setup.valueHost.dispose();
        expect(setup.valueHost.exposeValidators).toBeUndefined();
        expect(setup.valueHost.exposeState).toBeUndefined();
        expect(setup.valueHost.exposeConfig).toBeUndefined();            
        expect(() => setup.valueHost.getValue()).toThrow(TypeError);  // value is from config which is undefined
        expect(() => setup.valueHost.exposeServices).toThrow(TypeError);

    });   
    
    test('dispose with ValidatorsValueHostBaseConfig having its own dispose kills what the config.dispose expects', () => {
        interface X extends ValidatorsValueHostBaseConfig, IDisposable
        {
            x: {}
        }

        let setup = setupValidatorsValueHostBase();
        let vhConfig: X = {
            ...setup.config,
            x: {},
            dispose: () => { (vhConfig.x as any) = undefined }
        };
        let newVH = setup.valueHostsManager.addOrUpdateValueHost(vhConfig, null);
        setup.valueHost = newVH as TestValidatorsValueHost;

        setup.valueHost.validate();         

        setup.valueHost.dispose();

        expect(vhConfig.x).toBeUndefined();

    });               

});