import { IssueFound, ValidationStatus } from './../../src/Interfaces/Validation';
import { IValidatableValueHostBaseCallbacks, ValidatableValueHostBaseInstanceState, ValueHostValidationState, toIValidatableValueHostBaseCallbacks } from './../../src/Interfaces/ValidatableValueHostBase';
import { toIValidatableValueHostBase } from "../../src/ValueHosts/ValidatableValueHostBase";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";
import { ValidatableValueHostBaseConfig, IValidatableValueHostBase } from "../../src/Interfaces/ValidatableValueHostBase";
import {
    ValueHostValidateResult, ValidationSeverity, ValidateOptions
} from "../../src/Interfaces/Validation";
import { IValidator } from "../../src/Interfaces/Validator";
import { IValidationManager, ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { SetValueOptions, IValueHost, ValueHostInstanceState, ValidTypesForInstanceStateStorage } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { StaticValueHost } from '../../src/ValueHosts/StaticValueHost';
import { createValidationServicesForTesting } from '../../src/Support/createValidationServicesForTesting';
import { NeverMatchesConditionType, IsUndeterminedConditionType } from "../../src/Support/conditionsForTesting";
import { CapturingLogger } from "../../src/Support/CapturingLogger";
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { TestValidatableValueHost, addTestValidatableValueHostGeneratorToServices, setupValidatableValueHostBase } from '../TestSupport/TestValidatableValueHost';



describe('constructor and resulting property values', () => {

    test('constructor with valid parameters created and sets up Services, Config, and InstanceState', () => {
        let services = new MockValidationServices(true, true);
        addTestValidatableValueHostGeneratorToServices(services);
        let vm = new MockValidationManager(services);
        let testItem: TestValidatableValueHost | null = null;
        expect(()=> testItem = new TestValidatableValueHost(vm, {
            name: 'Field1',
            valueHostType: 'TestValidatableValueHost',
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined
            })).not.toThrow();

        expect(testItem!.valueHostsManager).toBe(vm);

        expect(testItem!.getName()).toBe('Field1');
        expect(testItem!.getLabel()).toBe('');
        expect(testItem!.getDataType()).toBeNull();
        expect(testItem!.getValue()).toBeUndefined();
        expect(testItem!.isChanged).toBe(false);
        expect(testItem!.isValid).toBe(true);
        expect(testItem!.asyncProcessing).toBe(false);
        expect(testItem!.corrected).toBe(false);
    });

});

describe('setValue', () => {
    test('No setValueOptions. ValidationStatus changes to NeedsValidation', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });
    test('setValueOptions is empty. ValidationStatus changes to NeedsValidation', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, {})).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });    
    test('setValueOptions is null. ValidationStatus changes to NeedsValidation', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, null!)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });
    test('setValueOptions = { validate: false }. ValidationStatus changes to NeedsValidation', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: false })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });
    test('setValueOptions = { validate: true }. ValidationStatus changes to result of Validate()', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
    });

    test('Before calling, validate for ValidationStatus=Undetermined. Then setValueOptions { reset: true }. Expect IsChanged = false and ValidationStatus to NotAttempted', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(() => setup.valueHost.setValue(10, { reset: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.isChanged).toBe(false);
    });
    test('Set Value using { validate: true } then set value with no options. Expect ValidationStatus to NeedsValidation', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
        expect(() => setup.valueHost.setValue(20)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.isChanged).toBe(true);
    });
    test('instanceState has Value=10, then set Value to the same value. No changes. ValidationStatus stays NotAttempted, IsChanged stays false', () => {
        let setup = setupValidatableValueHostBase(null, {
            value: 10
        });

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10)).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getValue()).toBe(10);
        expect(setup.valueHost.isChanged).toBe(false);
    });
    test('instanceState has Value=10 then set Value to the same value with { validate: true }. No changes, not validation occurs, IsChanged stays false. ValidationStatus stays NotAttempted', () => {
        let setup = setupValidatableValueHostBase(null, {
            value: 10
        }, ValidationStatus.Undetermined);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(() => setup.valueHost.setValue(10, { validate: true })).not.toThrow();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.isChanged).toBe(false);
        expect(setup.valueHost.getValue()).toBe(10);
    });


    test('Value was changed. OnValueChanged called. (confirm ancestor was not broken)', () => {
        let setup = setupValidatableValueHostBase();
        let testItem = setup.valueHost;

        let callbackInvoked = 0;
        setup.validationManager.onValueChanged = (valueHost, oldValue) => {
            callbackInvoked++;
        };
        testItem.setValue(100);
        expect(callbackInvoked).toBe(1);

    });

    test('Value was changed. OnValueHostInstanceStateChanged called.(confirm ancestor was not broken) ', () => {
        const initialValue = 100;

        let setup = setupValidatableValueHostBase();
        let callbackInvoked = 0;
        setup.validationManager.onValueHostInstanceStateChanged = (valueHost, stateToRetain) => {
            callbackInvoked++;
        };
        let testItem = setup.valueHost;
        testItem.setValue(initialValue);

        expect(callbackInvoked).toBe(1);
    });

    test('SetValue called with duringEdit=true reports that it is not supported into the log', () => {
        let setup = setupValidatableValueHostBase();
        let logger = setup.validationManager.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let options: SetValueOptions = { duringEdit: true };
        expect(() => setup.valueHost.setValue(10, options)).not.toThrow();
        expect(logger.findMessage('does not support duringEdit', LoggingLevel.Warn)).toBeTruthy();
        expect(options.duringEdit).not.toBe(true);
    });
    test('Log call when Level=Debug.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValidatableValueHostBase({},  { value: initialValue });
        setup.services.loggerService.minLevel = LoggingLevel.Debug;
        let testItem = setup.valueHost;
        testItem.setValue(finalValue);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('setValue\\(200\\)', LoggingLevel.Debug, null)).toBeTruthy();
    });
    test('isEnabled=false will not change the value.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValidatableValueHostBase({},  { value: initialValue });
        setup.services.loggerService.minLevel = LoggingLevel.Debug;
        let testItem = setup.valueHost;
        testItem.setEnabled(false);
        testItem.setValue(finalValue);
        expect(testItem.getValue()).toBe(initialValue);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('ValueHost "Field1" disabled.', LoggingLevel.Warn, null)).toBeTruthy();
        expect(logger.findMessage('overrideDisabled', LoggingLevel.Info, null)).toBeNull();
    });
    test('isEnabled=false will change the value when option.overrideDisabled=true.', () => {
        const initialValue = 100;
        const finalValue = 200;
        let setup = setupValidatableValueHostBase({},  { value: initialValue });
        setup.services.loggerService.minLevel = LoggingLevel.Debug;
        let testItem = setup.valueHost;
        testItem.setEnabled(false);
        testItem.setValue(finalValue, { overrideDisabled: true });
        expect(testItem.getValue()).toBe(finalValue);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('overrideDisabled', LoggingLevel.Info, null)).toBeTruthy();
        expect(logger.findMessage('ValueHost "Field1" disabled.', LoggingLevel.Warn, null)).toBeNull();
    });
});

describe('validate() and its impact on isValid and ValidationStatus', () => {

    test('When validate result is Valid, IsValid=true, ValidationStatus = Valid', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Valid);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
    });
    test('When validate result is InValid, IsValid=false, ValidationStatus = InValid', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Invalid);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
    });    
    test('When validate result is Undetermined, IsValid=true, ValidationStatus = Undetermined', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Undetermined);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Undetermined);
    });    
    test('When isEnabled=false, even though validate result should be Valid, result is IsValid=true, ValidationStatus = Disabled', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Valid);
        setup.valueHost.setEnabled(false);
        setup.valueHost.validate();
        expect(setup.valueHost.isValid).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
    });    
});

// clearValidation(): void
describe('clearValidation', () => {
    test('After validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {

        let setup = setupValidatableValueHostBase({}, null, ValidationStatus.Undetermined);
        setup.valueHost.validate();

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();

        let stateChanges = setup.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<ValidatableValueHostBaseInstanceState> = [
            {
                name: 'Field1',
                status: ValidationStatus.Undetermined,
                issuesFound: null,
                value: undefined
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);

    });
    test('Without calling validate, Ensure no exceptions and the state is NotAttempted with IssuesFound = null', () => {
        let setup = setupValidatableValueHostBase({}, null, ValidationStatus.Undetermined);

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssueFound(IsUndeterminedConditionType)).toBeNull();
        let stateChanges = setup.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(0);

    });

    test('Without calling validate but with external IssuesFound (Error), Ensure the state discards external IssuesFound after clear', () => {
        let setup = setupValidatableValueHostBase({}, null, ValidationStatus.Undetermined);

        setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true);

        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearValidation()).not.toThrow();
        expect(result).toBe(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        let stateChanges = setup.validationManager.getHostStateChanges();
        expect(stateChanges).not.toBeNull();
        expect(stateChanges.length).toBe(2);
        let expectedChanges: Array<ValidatableValueHostBaseInstanceState> = [
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined,
                externalIssuesFound: [
                    {
                        errorMessage: 'ERROR',
                        severity: ValidationSeverity.Error,
                        doNotSave: true
                    }
                ]
            },
            {
                name: 'Field1',
                status: ValidationStatus.NotAttempted,
                issuesFound: null,
                value: undefined,
            },
        ];
        expect(stateChanges).toEqual(expectedChanges);
    });
});
// doNotSave: boolean
describe('doNotSave', () => {

/* Rules are:
- asyncProcessing=true, doNotSave=true
- ValidationStatus=NeedsValidation, doNotSave=true
- ValidationStatus=Disabled, doNotSave=false
- Any IssuesFound or ExternalIssuesFound with doNotSave=true, doNotSave=true (overridden by ValidationStatus and asyncProcessing)
- otherwise false
*/    

    function tryDoNotSave(initialValidationStatusCode: ValidationStatus, hasPendings: boolean, expectedResult: boolean,
        initialIssuesFound: Array<IssueFound> = [],
        externalIssuesFound: Array<IssueFound> | null = null
    ): void {
        let vhConfig: ValidatableValueHostBaseConfig = {
            name: 'Field1',
            valueHostType: 'TestValidatableValueHost'
        }

        let state: Partial<ValidatableValueHostBaseInstanceState> = {
            name: 'Field1',
            status: initialValidationStatusCode,
            issuesFound: initialIssuesFound,
            asyncProcessing: hasPendings
        };

        let setup = setupValidatableValueHostBase(vhConfig, state);
        if (externalIssuesFound)
            setup.valueHost.addExternalIssuesFound(externalIssuesFound, true);

        expect(setup.valueHost.doNotSave).toBe(expectedResult);

    }    
    test('ValidationStatus = Valid and asyncProcessing=false, doNotSave=false', () => {
        tryDoNotSave(ValidationStatus.Valid, false, false);
        issuesFoundImpact_NoAsyncProcessing(ValidationStatus.Valid);
    });
    test('ValidationStatus = Valid and asyncProcessing=true, doNotSave=true', () => {
        tryDoNotSave(ValidationStatus.Valid, true, true);
    });    
    test('ValidationStatus = Undetermined and asyncProcessing=false, doNotSave=false without issuesfound, doNotSave=true when issuesFound indicate so', () => {
        tryDoNotSave(ValidationStatus.Undetermined, false, false);
        issuesFoundImpact_NoAsyncProcessing(ValidationStatus.Undetermined);
    });
    test('ValidationStatus = Undetermined and asyncProcessing=true, doNotSave=true', () => {
        tryDoNotSave(ValidationStatus.Undetermined, true, true);
    });    
    test('ValidationStatus = Invalid and asyncProcessing=false, doNotSave=false without issuesfound, doNotSave=true when issuesFound indicate so', () => {
        tryDoNotSave(ValidationStatus.Invalid, false, false);
        issuesFoundImpact_NoAsyncProcessing(ValidationStatus.Invalid);
    });
    test('ValidationStatus = Invalid and asyncProcessing=true, doNotSave=true', () => {
        tryDoNotSave(ValidationStatus.Invalid, true, true);
    });
    test('ValidationStatus = NeedsValidation and asyncProcessing=false, doNotSave=true', () => {
        tryDoNotSave(ValidationStatus.NeedsValidation, false, true);
    });
    test('ValidationStatus = NeedsValidation and asyncProcessing=true, doNotSave=true', () => {
        tryDoNotSave(ValidationStatus.NeedsValidation, true, true);
    });
    test('ValidationStatus = Disabled and asyncProcessing=false, doNotSave=false', () => {
        tryDoNotSave(ValidationStatus.Disabled, false, false);
    });
    test('ValidationStatus = Disabled and asyncProcessing=true, doNotSave=true', () => {
        tryDoNotSave(ValidationStatus.Disabled, true, true);
    });
    test('ValidationStatus = NotAttempted and asyncProcessing=false, doNotSave=false without issuesfound, doNotSave=true when issuesFound indicate so', () => {
        tryDoNotSave(ValidationStatus.NotAttempted, false, false);
        issuesFoundImpact_NoAsyncProcessing(ValidationStatus.NotAttempted);
    });
    test('ValidationStatus = NotAttempted and asyncProcessing=true, doNotSave=true', () => {
        tryDoNotSave(ValidationStatus.NotAttempted, true, true);
    });    
    function issuesFoundImpact_NoAsyncProcessing(valStatus: ValidationStatus) {
        // when we have any issuesfound or externalissues found, we use their doNotSave flags instead of ValidationStatus.
        // With one issueFound.doNotSave=true
        tryDoNotSave(valStatus, false, true, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: true }]);
        // With one issueFound.doNotSave=false
        tryDoNotSave(valStatus, false, false, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false }]);
        // With multiple issueFound with mixed doNotSave but at least one is true, doNotSave=true
        tryDoNotSave(valStatus, false, true, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: true }]);
        // With multiple issueFound with with all doNotSave=false, doNotSave=false
        tryDoNotSave(valStatus, false, false, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: false }]);
        // With external issues found with mixed doNotSave but at least one is true, doNotSave=true
        tryDoNotSave(valStatus, false, true, [], [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: true }]);
        // With external issues found with all doNotSave=false, doNotSave=false
        tryDoNotSave(valStatus, false, false, [], [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: false }]);
        // both issuesfound and externalissues where one issuefound is doNotSave=true, doNotSave=true
        tryDoNotSave(valStatus, false, true, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: true }],
            [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: false }]);
        // both issuesfound and externalissues where one externalissue is doNotSave=true, doNotSave=true
        tryDoNotSave(valStatus, false, true, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: false }],
            [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
                { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: true }]);
        // both issuesfound and externalissues where one issueFound are doNotSave=true, doNotSave=true
        tryDoNotSave(valStatus, false, true, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: true }],
            [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
                { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: false }]);
        // both issuesfound and externalissues where all issueFound and externalissues are doNotSave=false, doNotSave=false
        tryDoNotSave(valStatus, false, false, [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
            { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: false }],
            [{ errorMessage: 'Error', severity: ValidationSeverity.Error, doNotSave: false },
                { errorMessage: 'Error2', severity: ValidationSeverity.Error, doNotSave: false }]);        
    }

});
describe('corrected property', () => {
// due to lack of real validate() function, we defer many tests to ValidatorsValueHostBase.test.ts

    test('When initial state has corrected=true, corrected=true', () => {
        let setup = setupValidatableValueHostBase(null, {
            corrected: true,
            name: 'Field1'
        });
        expect(setup.valueHost.corrected).toBe(true);
    });
    test('From state has corrected=true ->NeedsValidation, corrected=false', () => {
        let setup = setupValidatableValueHostBase(null, {
            corrected: true,
            name: 'Field1',
            status: ValidationStatus.Valid
        });
        setup.valueHost.setValue('A');
        expect(setup.valueHost.corrected).toBe(false);
    });
    test('Test our test class custom function setCorrected=true then false', () => {
        let setup = setupValidatableValueHostBase(null, null);
        expect(setup.valueHost.corrected).toBe(false);        
        setup.valueHost.setCorrected(true);
        expect(setup.valueHost.corrected).toBe(true);   
        setup.valueHost.setCorrected(false);
        expect(setup.valueHost.corrected).toBe(false);   
    });        
    test('Initially corrected=true then use setExternalIssuesFound, corrected=false', () => {
        let setup = setupValidatableValueHostBase(null, null);
        setup.valueHost.setCorrected(true);
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'Error',
            errorCode: 'EC',
        }, true);
        expect(setup.valueHost.corrected).toBe(false);
    });    
    test('Initially corrected=true then use clearExternalIssuesFound, corrected=false', () => {
        let setup = setupValidatableValueHostBase(null, null);
        setup.valueHost.addExternalIssueFound({ // because clearExternalIssuesFound depends on an existing error to take any action
            errorMessage: 'Error',
            errorCode: 'EC',
        }, true);        
        setup.valueHost.setCorrected(true);
        setup.valueHost.clearExternalIssuesFound();
        expect(setup.valueHost.corrected).toBe(false);
    });        
    test('Initially corrected=true then use clearValidation, corrected=false', () => {
        let setup = setupValidatableValueHostBase(null, null);
        setup.valueHost.setCorrected(true);
        setup.valueHost.clearValidation();
        expect(setup.valueHost.corrected).toBe(false);
    });        
});
describe('addExternalIssuesFound', () => {
    test('Adds multiple issues in order', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'ERROR 1',
                severity: ValidationSeverity.Error
            },
            {
                errorMessage: 'WARNING 1',
                severity: ValidationSeverity.Warning
            }
        ], true);

        expect(result).toBe(true);
        expect(setup.valueHost.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'ERROR 1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            },
            {
                errorMessage: 'WARNING 1',
                severity: ValidationSeverity.Warning,
                doNotSave: false
            }
        ]);
    });

    test('Applies default doNotSave per item', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error
            },
            {
                errorMessage: 'WARNING',
                severity: ValidationSeverity.Warning
            }
        ], false);

        expect(result).toBe(true);
        expect(setup.valueHost.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: false
            },
            {
                errorMessage: 'WARNING',
                severity: ValidationSeverity.Warning,
                doNotSave: false
            }
        ]);
    });

    test('Preserves explicit doNotSave values per item', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: false
            },
            {
                errorMessage: 'WARNING',
                severity: ValidationSeverity.Warning,
                doNotSave: true
            }
        ], true);

        expect(result).toBe(true);
        expect(setup.valueHost.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: false
            },
            {
                errorMessage: 'WARNING',
                severity: ValidationSeverity.Warning,
                doNotSave: true
            }
        ]);
    });

    test('Same errorCode in batch replaces earlier issue instead of appending', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'ERROR 1',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error
            },
            {
                errorMessage: 'ERROR 2',
                errorCode: 'EC1',
                severity: ValidationSeverity.Warning
            }
        ], true);

        expect(result).toBe(true);
        expect(setup.valueHost.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'ERROR 2',
                errorCode: 'EC1',
                severity: ValidationSeverity.Warning,
                doNotSave: false
            }
        ]);
    });

    test('Distinct errorCode values append in order', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'ERROR 1',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error
            },
            {
                errorMessage: 'ERROR 2',
                errorCode: 'EC2',
                severity: ValidationSeverity.Error
            }
        ], true);

        expect(result).toBe(true);
        expect(setup.valueHost.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'ERROR 1',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            },
            {
                errorMessage: 'ERROR 2',
                errorCode: 'EC2',
                severity: ValidationSeverity.Error,
                doNotSave: true
            }
        ]);
    });

    test('Adding a batch clears corrected', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setCorrected(true);

        expect(setup.valueHost.corrected).toBe(true);

        let result = setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'ERROR',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error
            }
        ], true);

        expect(result).toBe(true);
        expect(setup.valueHost.corrected).toBe(false);
    });

    test('onValueHostValidationStateChanged not called when options.skipCallback=true', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };

        addTestValidatableValueHostGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1'
        }, null) as TestValidatableValueHost;

        let result = vh.addExternalIssuesFound([
            {
                errorMessage: 'ERROR',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error
            },
            {
                errorMessage: 'WARNING',
                errorCode: 'EC2',
                severity: ValidationSeverity.Warning
            }
        ], true, { skipCallback: true });

        expect(result).toBe(true);
        expect(onValidateResult).toBeNull();
        expect(vh.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'ERROR',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            },
            {
                errorMessage: 'WARNING',
                errorCode: 'EC2',
                severity: ValidationSeverity.Warning,
                doNotSave: false
            }
        ]);
    });

    test('onValueHostValidationStateChanged called with current validation state', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };

        addTestValidatableValueHostGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1'
        }, null) as TestValidatableValueHost;

        let result = vh.addExternalIssuesFound([
            {
                errorMessage: 'ERROR',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error
            },
            {
                errorMessage: 'WARNING',
                errorCode: 'EC2',
                severity: ValidationSeverity.Warning
            }
        ], true);

        expect(result).toBe(true);
        expect(vh.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'ERROR',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            },
            {
                errorMessage: 'WARNING',
                errorCode: 'EC2',
                severity: ValidationSeverity.Warning,
                doNotSave: false
            }
        ]);
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            isValid: false,
            issuesFound: [
                {
                    valueHostName: 'Field1',
                    errorCode: 'EC1',
                    severity: ValidationSeverity.Error,
                    errorMessage: 'ERROR',
                    summaryMessage: 'ERROR',
                    doNotSave: true
                },
                {
                    valueHostName: 'Field1',
                    errorCode: 'EC2',
                    severity: ValidationSeverity.Warning,
                    errorMessage: 'WARNING',
                    summaryMessage: 'WARNING',
                    doNotSave: false
                }
            ],
            doNotSave: true,
            asyncProcessing: false,
            status: ValidationStatus.Invalid,
            corrected: false
        });
    });

    test('Empty list is a no-op', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssuesFound([], true);

        expect(result).toBe(false);
        expect(setup.valueHost.exposed_externalIssuesFound).toBeNull();
    });
    test('Adding external issues does not overwrite existing validator-managed issues', () => {
        let setup = setupValidatableValueHostBase();

        let setResult = setup.valueHost.exposed_setIssueFound({
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        });

        expect(setResult).toBe(true);
        expect(setup.valueHost.exposed_issuesFound).toEqual(<IssueFound[]>[
            {
                valueHostName: 'Field1',
                errorMessage: 'VALIDATOR ERROR',
                summaryMessage: 'VALIDATOR ERROR',
                errorCode: 'VAL1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            }
        ]);

        let result = setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'EXTERNAL ERROR',
                errorCode: 'EXT1',
                severity: ValidationSeverity.Error
            }
        ], true);

        expect(result).toBe(true);

        expect(setup.valueHost.exposed_issuesFound).toEqual(<IssueFound[]>[
            {
                valueHostName: 'Field1',
                errorMessage: 'VALIDATOR ERROR',
                summaryMessage: 'VALIDATOR ERROR',
                errorCode: 'VAL1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            }
        ]);

        expect(setup.valueHost.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'EXTERNAL ERROR',
                errorCode: 'EXT1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            }
        ]);
    });    
});
describe('addExternalIssueFound', () => {
    test('One call with error adds to the list', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1); // first changes the value; second changes ValidationStatus
        let valueChange = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange.externalIssuesFound).toBeDefined();
        expect(valueChange.externalIssuesFound![0]).toEqual(
            <IssueFound>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: true

            });
    });

    test('Two calls with errors (ERROR, WARNING) adds to the list', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true)).not.toThrow();
        expect(() => setup.valueHost.addExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        }, true)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);
        let valueChange1 = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange1.externalIssuesFound).toBeDefined();
        expect(valueChange1.externalIssuesFound![0]).toEqual(
            <IssueFound>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: true
            });
        let valueChange2 = <ValidatableValueHostBaseInstanceState>changes[1];
        expect(valueChange2.externalIssuesFound).toBeDefined();
        expect(valueChange2.externalIssuesFound![0]).toEqual(
            <IssueFound>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: true
            });
        expect(valueChange2.externalIssuesFound![1]).toEqual(
            <IssueFound>{
                errorMessage: 'WARNING',
                severity: ValidationSeverity.Warning,
                doNotSave: false
            });
    });
    test('One call with null makes no changes to the state', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.addExternalIssueFound(null!, true)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });

    test('With ValueHost.isEnabled=false, still applied and now has a logged message', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setEnabled(false);
        expect(() => setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true)).not.toThrow();

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the enabled flag; second changes ValidationStatus
        let valueChange = <ValidatableValueHostBaseInstanceState>changes[1];
        expect(valueChange.externalIssuesFound).toBeDefined();
        expect(valueChange.externalIssuesFound![0]).toEqual(
            <IssueFound>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: true
            });
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('IssueFound applied on disabled ValueHost', LoggingLevel.Warn, null)).toBeTruthy();
    });
    test('Error with determinedLocally=false defaults doNotSave=false', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, false);

        expect(result).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);

        let valueChange = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange.externalIssuesFound).toBeDefined();
        expect(valueChange.externalIssuesFound![0]).toEqual(<IssueFound>{
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error,
            doNotSave: false
        });
    });

    test('Explicit doNotSave is preserved', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error,
            doNotSave: false
        }, true);

        expect(result).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);

        let valueChange = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange.externalIssuesFound).toBeDefined();
        expect(valueChange.externalIssuesFound![0]).toEqual(<IssueFound>{
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error,
            doNotSave: false
        });
    });

    test('Same errorCode replaces existing external issue instead of appending', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR 1',
            errorCode: 'EC1',
            severity: ValidationSeverity.Error
        }, true)).toBe(true);

        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR 2',
            errorCode: 'EC1',
            severity: ValidationSeverity.Warning
        }, true)).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);

        let valueChange2 = <ValidatableValueHostBaseInstanceState>changes[1];
        expect(valueChange2.externalIssuesFound).toBeDefined();
        expect(valueChange2.externalIssuesFound!.length).toBe(1);
        expect(valueChange2.externalIssuesFound![0]).toEqual(<IssueFound>{
            errorMessage: 'ERROR 2',
            errorCode: 'EC1',
            severity: ValidationSeverity.Warning,
            doNotSave: false
        });
    });

    test('Different errorCode values append to the external issues list', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR 1',
            errorCode: 'EC1',
            severity: ValidationSeverity.Error
        }, true)).toBe(true);

        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR 2',
            errorCode: 'EC2',
            severity: ValidationSeverity.Error
        }, true)).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2);

        let valueChange2 = <ValidatableValueHostBaseInstanceState>changes[1];
        expect(valueChange2.externalIssuesFound).toBeDefined();
        expect(valueChange2.externalIssuesFound!.length).toBe(2);
        expect(valueChange2.externalIssuesFound![0]).toEqual(<IssueFound>{
            errorMessage: 'ERROR 1',
            errorCode: 'EC1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        });
        expect(valueChange2.externalIssuesFound![1]).toEqual(<IssueFound>{
            errorMessage: 'ERROR 2',
            errorCode: 'EC2',
            severity: ValidationSeverity.Error,
            doNotSave: true
        });
    });

    test('Adding an external issue clears corrected', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setCorrected(true);

        expect(setup.valueHost.corrected).toBe(true);

        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            errorCode: 'EC1',
            severity: ValidationSeverity.Error
        }, true);

        expect(result).toBe(true);
        expect(setup.valueHost.corrected).toBe(false);
    });

    test('onValueHostValidationStateChanged not called when options.skipCallback=true', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };

        addTestValidatableValueHostGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1'
        }, null) as TestValidatableValueHost;

        let result = vh.addExternalIssueFound({
            errorMessage: 'ERROR',
            errorCode: 'EC1',
            severity: ValidationSeverity.Error
        }, true, { skipCallback: true });

        expect(result).toBe(true);
        expect(onValidateResult).toBeNull();
    });

    test('onValueHostValidationStateChanged called with current validation state', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };

        addTestValidatableValueHostGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1'
        }, null) as TestValidatableValueHost;

        let result = vh.addExternalIssueFound({
            errorMessage: 'ERROR',
            errorCode: 'EC1',
            severity: ValidationSeverity.Error
        }, true);

        expect(result).toBe(true);
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            isValid: false,
            issuesFound: [{
                valueHostName: 'Field1',
                errorCode: 'EC1',
                severity: ValidationSeverity.Error,
                errorMessage: 'ERROR',
                summaryMessage: 'ERROR',
                doNotSave: true
            }],
            doNotSave: true,
            asyncProcessing: false,
            status: ValidationStatus.Invalid,
            corrected: false
        });
    });

    test('Returns true when a real change is applied', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            errorCode: 'EC1',
            severity: ValidationSeverity.Error
        }, true);

        expect(result).toBe(true);
    });
    test('Non-warning defaults doNotSave to determinedLocally=true when omitted', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true);

        expect(result).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(1);

        let valueChange = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange.externalIssuesFound![0]).toEqual(<IssueFound>{
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error,
            doNotSave: true
        });
    });  
    test('External issue with summaryMessage preserves it in getIssueFound', () => {
        let setup = setupValidatableValueHostBase();

        let addResult = setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            summaryMessage: 'EXTERNAL SUMMARY',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true);

        expect(addResult).toBe(true);

        let result = setup.valueHost.getIssueFound('EXT1');

        expect(result).toEqual(<IssueFound>{
            valueHostName: 'Field1',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error,
            errorMessage: 'EXTERNAL ERROR',
            summaryMessage: 'EXTERNAL SUMMARY',
            doNotSave: true
        });
    });

    test('External issue with summaryMessage preserves it in getIssuesFound', () => {
        let setup = setupValidatableValueHostBase();

        let addResult = setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            summaryMessage: 'EXTERNAL SUMMARY',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true);

        expect(addResult).toBe(true);

        let result = setup.valueHost.getIssuesFound();

        expect(result).toEqual(<IssueFound[]>[
            {
                valueHostName: 'Field1',
                errorCode: 'EXT1',
                severity: ValidationSeverity.Error,
                errorMessage: 'EXTERNAL ERROR',
                summaryMessage: 'EXTERNAL SUMMARY',
                doNotSave: true
            }
        ]);
    });    
});
describe('clearExternalIssuesFound', () => {
    test('Call while no existing makes not changes to the state', () => {
        let setup = setupValidatableValueHostBase();
        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearExternalIssuesFound()).not.toThrow();
        expect(result).toBe(false);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(0);
    });
    test('Set then Clear creates two state entries with state.ExternalIssuesFound undefined by the end', () => {
        let setup = setupValidatableValueHostBase();

        expect(() => setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true)).not.toThrow();
        let result: boolean | null = null;
        expect(() => result = setup.valueHost.clearExternalIssuesFound()).not.toThrow();
        expect(result).toBe(true);

        let changes = setup.validationManager.getHostStateChanges();
        expect(changes.length).toBe(2); // first changes the value; second changes ValidationStatus
        let valueChange1 = <ValidatableValueHostBaseInstanceState>changes[0];
        expect(valueChange1.externalIssuesFound).toBeDefined();
        expect(valueChange1.externalIssuesFound![0]).toEqual(
            <IssueFound>{
                errorMessage: 'ERROR',
                severity: ValidationSeverity.Error,
                doNotSave: true
            });
        let valueChange2 = <ValidatableValueHostBaseInstanceState>changes[1];
        expect(valueChange2.externalIssuesFound).toBeUndefined();
    });
    test('onValueHostValidationStateChanged called', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };
        addTestValidatableValueHostGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        }, null) as TestValidatableValueHost;

        vm.validate({ skipCallback: true }); // ensure we have an invalid state without business logic

        expect(() => vh.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true, { skipCallback: true })).not.toThrow();
        expect(onValidateResult).toBeNull();  // because of skipCallback

        let result = vh.clearExternalIssuesFound();
        expect(result).toBe(true);
        expect(onValidateResult).toEqual(<ValueHostValidationState>{
            isValid: true,
            issuesFound: null,
            doNotSave: false,
            asyncProcessing: false,
            status: ValidationStatus.NotAttempted,
            corrected: false
        });
    });    
    test('onValueHostValidationStateChanged not called from clearBusinessLogic because options.skipCallback=true', () => {
        let onValidateResult: ValueHostValidationState | null = null;

        let vmConfig: ValidationManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [],
            onValueHostValidationStateChanged: (vh, vr) => {
                onValidateResult = vr;
            }
        };
        addTestValidatableValueHostGeneratorToServices(vmConfig.services);
        let vm = new ValidationManager(vmConfig);
        let vh = vm.addValueHost(<ValidatableValueHostBaseConfig>{
            valueHostType: 'TestValidatableValueHost',
            name: 'Field1',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: NeverMatchesConditionType
                    },
                    errorMessage: 'Error'
                }
            ]
        }, null) as TestValidatableValueHost;
        vm.validate({ skipCallback: true });

        vh.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true, { skipCallback: true });
        expect(onValidateResult).toBeNull();  // because of skipCallback

        let result = vh.clearExternalIssuesFound({ skipCallback: true});
        expect(result).toBe(true);
        expect(onValidateResult).toBeNull(); // because of skipCallback
    });       
    test('Clearing externalIssuesFound does not clear validator-managed issuesFound', () => {
        let setup = setupValidatableValueHostBase();

        let validatorIssue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        expect(setup.valueHost.exposed_setIssueFound(validatorIssue)).toBe(true);
        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true)).toBe(true);

        expect(setup.valueHost.exposed_issuesFound).toEqual([validatorIssue]);
        expect(setup.valueHost.exposed_externalIssuesFound).toEqual(<IssueFound[]>[
            {
                errorMessage: 'EXTERNAL ERROR',
                errorCode: 'EXT1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            }
        ]);

        expect(() => setup.valueHost.clearExternalIssuesFound()).not.toThrow();

        expect(setup.valueHost.exposed_issuesFound).toEqual([validatorIssue]);
        expect(setup.valueHost.exposed_externalIssuesFound).toBeNull();
    });

    test('After clearing externalIssuesFound, getIssuesFound returns only validator-managed issues', () => {
        let setup = setupValidatableValueHostBase();

        let validatorIssue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        expect(setup.valueHost.exposed_setIssueFound(validatorIssue)).toBe(true);
        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true)).toBe(true);

        expect(() => setup.valueHost.clearExternalIssuesFound()).not.toThrow();

        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).toEqual([validatorIssue]);
    });

    test('When there are only external issues, clearing externalIssuesFound makes getIssuesFound return null', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.addExternalIssuesFound([
            {
                errorMessage: 'EXTERNAL ERROR',
                errorCode: 'EXT1',
                severity: ValidationSeverity.Error
            },
            {
                errorMessage: 'EXTERNAL WARNING',
                errorCode: 'EXT2',
                severity: ValidationSeverity.Warning
            }
        ], true)).toBe(true);

        expect(setup.valueHost.exposed_issuesFound).toBeNull();
        expect(setup.valueHost.exposed_externalIssuesFound).not.toBeNull();

        expect(() => setup.valueHost.clearExternalIssuesFound()).not.toThrow();

        expect(setup.valueHost.exposed_issuesFound).toBeNull();
        expect(setup.valueHost.exposed_externalIssuesFound).toBeNull();

        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).toBeNull();
    });
});

// getIssueFound(validatorConfig: ValidatorConfig): IssueFound | null
describe('getIssueFound only checking without calls to validate', () => {
    test('Pass null returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound(null!)).not.toThrow();
        expect(issueFound).toBeNull();
    });
    test('Pass empty string returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('')).not.toThrow();
        expect(issueFound).toBeNull();
    });    
    test('Pass empty string returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('')).not.toThrow();
        expect(issueFound).toBeNull();
    });    
    test('Pass not defined valuehostname returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('UNKNOWN')).not.toThrow();
        expect(issueFound).toBeNull();
    });        
    test('Pass errorcode returns null because we didnt validate', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound('code')).not.toThrow();
        expect(issueFound).toBeNull();
    });        

    test('Pass errorcode with surrounding whitespace returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issueFound: IssueFound | null = null;
        expect(() => issueFound = setup.valueHost.getIssueFound(' code ')).not.toThrow();
        expect(issueFound).toBeNull();
    });            
    test('When ValueHost.isEnabled=false, always return null and create log entry', () => {
        let setup = setupValidatableValueHostBase(null, null);
        setup.valueHost.setEnabled(false);
        let issueFound = setup.valueHost.getIssueFound('Field1');
        expect(issueFound).toBeNull();
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('Issues not available', LoggingLevel.Warn, null)).toBeTruthy();
        setup.valueHost.setEnabled(true);
        logger.clearAll();
        issueFound = setup.valueHost.getIssueFound('Field1')
        expect(logger.findMessage('Issues not available', LoggingLevel.Warn, null)).toBeNull();
    });                

});
describe('getIssueFound various', () => {
    test('Returns null when disabled even if validator-managed issue exists', () => {
        let setup = setupValidatableValueHostBase();

        let setResult = setup.valueHost.exposed_setIssueFound({
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        });

        expect(setResult).toBe(true);

        setup.valueHost.setEnabled(false);

        let result = setup.valueHost.getIssueFound('VAL1');

        expect(result).toBeNull();
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('Issues not available', LoggingLevel.Warn, null)).toBeTruthy();

    });

    test('Returns null when errorCode is null, empty, or whitespace', () => {
        let setup = setupValidatableValueHostBase();

        expect(setup.valueHost.getIssueFound(null as unknown as string)).toBeNull();
        expect(setup.valueHost.getIssueFound('')).toBeNull();
        expect(setup.valueHost.getIssueFound('   ')).toBeNull();
    });

    test('Returns matching validator-managed issue by errorCode', () => {
        let setup = setupValidatableValueHostBase();

        let issue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let setResult = setup.valueHost.exposed_setIssueFound(issue);

        expect(setResult).toBe(true);
        expect(setup.valueHost.exposed_issuesFound).toEqual([issue]);

        let result = setup.valueHost.getIssueFound('VAL1');

        expect(result).toEqual(issue);
    });

    test('Trims whitespace and returns matching validator-managed issue', () => {
        let setup = setupValidatableValueHostBase();

        let issue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let setResult = setup.valueHost.exposed_setIssueFound(issue);

        expect(setResult).toBe(true);

        let result = setup.valueHost.getIssueFound('  VAL1  ');

        expect(result).toEqual(issue);
    });

    test('Returns null when no validator-managed or external issue matches', () => {
        let setup = setupValidatableValueHostBase();

        let setResult = setup.valueHost.exposed_setIssueFound({
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        });

        expect(setResult).toBe(true);

        setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true);

        let result = setup.valueHost.getIssueFound('MISSING');

        expect(result).toBeNull();
    });

    test('Returns matching external issue by errorCode', () => {
        let setup = setupValidatableValueHostBase();

        let addResult = setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true);

        expect(addResult).toBe(true);

        let result = setup.valueHost.getIssueFound('EXT1');

        expect(result).toEqual(<IssueFound>{
            valueHostName: 'Field1',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error,
            errorMessage: 'EXTERNAL ERROR',
            summaryMessage: 'EXTERNAL ERROR',
            doNotSave: true
        });
    });

    test('Returns matching external warning issue with normalized shape', () => {
        let setup = setupValidatableValueHostBase();

        let addResult = setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL WARNING',
            errorCode: 'EXTWARN1',
            severity: ValidationSeverity.Warning
        }, true);

        expect(addResult).toBe(true);

        let result = setup.valueHost.getIssueFound('EXTWARN1');

        expect(result).toEqual(<IssueFound>{
            valueHostName: 'Field1',
            errorCode: 'EXTWARN1',
            severity: ValidationSeverity.Warning,
            errorMessage: 'EXTERNAL WARNING',
            summaryMessage: 'EXTERNAL WARNING',
            doNotSave: false
        });
    });

    test('Finds validator-managed and external issues from the combined visible issue set', () => {
        let setup = setupValidatableValueHostBase();

        let validatorIssue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let setResult = setup.valueHost.exposed_setIssueFound(validatorIssue);
        expect(setResult).toBe(true);

        let addResult = setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true);
        expect(addResult).toBe(true);

        expect(setup.valueHost.getIssueFound('VAL1')).toEqual(validatorIssue);
        expect(setup.valueHost.getIssueFound('EXT1')).toEqual(<IssueFound>{
            valueHostName: 'Field1',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error,
            errorMessage: 'EXTERNAL ERROR',
            summaryMessage: 'EXTERNAL ERROR',
            doNotSave: true
        });
    });

});
// getIssuesFound(): Array<IssueFound>
describe('getIssuesFound without calling validate', () => {
    test('Nothing to report returns null', () => {
        let setup = setupValidatableValueHostBase(null, null);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).toBeNull();
    });

    test('No Validation errors, but has external IssuesFound (Error) reports just the external IssuesFound', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'ERROR',
            severity: ValidationSeverity.Error
        }, true);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: 'GENERATED_0',
                severity: ValidationSeverity.Error,
                errorMessage: 'ERROR',
                summaryMessage: 'ERROR',
                doNotSave: true
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has external IssuesFound (Severe) reports just the external IssuesFound', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'SEVERE',
            severity: ValidationSeverity.Severe
        }, true);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: 'GENERATED_0',
                severity: ValidationSeverity.Severe,
                errorMessage: 'SEVERE',
                summaryMessage: 'SEVERE',
                doNotSave: true
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('No Validation errors, but has external IssuesFound (Warning) reports just the external IssuesFound', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.addExternalIssueFound({
            errorMessage: 'WARNING',
            severity: ValidationSeverity.Warning
        }, true);
        let issuesFound: Array<IssueFound> | null = null;
        expect(() => issuesFound = setup.valueHost.getIssuesFound()).not.toThrow();
        expect(issuesFound).not.toBeNull();

        let expected: Array<IssueFound> = [
            {
                valueHostName: 'Field1',
                errorCode: 'GENERATED_0',
                severity: ValidationSeverity.Warning,
                errorMessage: 'WARNING',
                summaryMessage: 'WARNING',
                doNotSave: false
            },
        ];
        expect(issuesFound).toEqual(expected);
    });
    test('When ValueHost.isEnabled=false, always return null and create log entry', () => {
        let setup = setupValidatableValueHostBase(null, null);
        setup.valueHost.setEnabled(false);
        let issuesFound = setup.valueHost.getIssuesFound();
        expect(issuesFound).toBeNull();
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('Issues not available', LoggingLevel.Warn, null)).toBeTruthy();
        setup.valueHost.setEnabled(true);
        logger.clearAll();
        issuesFound = setup.valueHost.getIssuesFound()
        expect(logger.findMessage('Issues not available', LoggingLevel.Warn, null)).toBeNull();
    });         

    test('Returns validator-managed issues when they exist and there are no external issues', () => {
        let setup = setupValidatableValueHostBase();

        let validatorIssue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let setResult = setup.valueHost.exposed_setIssueFound(validatorIssue);

        expect(setResult).toBe(true);
        expect(setup.valueHost.exposed_issuesFound).toEqual([validatorIssue]);
        expect(setup.valueHost.exposed_externalIssuesFound).toBeNull();

        let result = setup.valueHost.getIssuesFound();

        expect(result).toEqual([validatorIssue]);
    });

    test('Returns combined validator-managed and external issues', () => {
        let setup = setupValidatableValueHostBase();

        let validatorIssue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        let setResult = setup.valueHost.exposed_setIssueFound(validatorIssue);
        expect(setResult).toBe(true);

        let addResult = setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true);
        expect(addResult).toBe(true);

        let result = setup.valueHost.getIssuesFound();

        expect(result).toEqual(<IssueFound[]>[
            {
                valueHostName: 'Field1',
                errorMessage: 'VALIDATOR ERROR',
                summaryMessage: 'VALIDATOR ERROR',
                errorCode: 'VAL1',
                severity: ValidationSeverity.Error,
                doNotSave: true
            },
            {
                valueHostName: 'Field1',
                errorCode: 'EXT1',
                severity: ValidationSeverity.Error,
                errorMessage: 'EXTERNAL ERROR',
                summaryMessage: 'EXTERNAL ERROR',
                doNotSave: true
            }
        ]);
    });
});
describe('setEnabled', () => {
    test('When set to false, existing validation is cleared', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.Invalid);
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.getIssuesFound()!.length).toBe(1);
        setup.valueHost.setEnabled(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(setup.valueHost.isValid).toBe(true);
    });
    test('When set to false but no previous validation has occurred, ValidationState=Disabled', () => {
        let setup = setupValidatableValueHostBase(null, null, ValidationStatus.NotAttempted);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        setup.valueHost.setEnabled(false);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        expect(setup.valueHost.getIssuesFound()).toBeNull();
        expect(setup.valueHost.isValid).toBe(true);
    });
    test('When set to true and was previously false, validationState=NotAttempted', () => {
        let setup = setupValidatableValueHostBase(null, { enabled: false }, ValidationStatus.NotAttempted);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        setup.valueHost.setEnabled(true);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.getIssuesFound()).toBeNull();     
        expect(setup.valueHost.isValid).toBe(true);
    });
    test('When set to true and was previously false, call to validate() works correctly', () => {
        let setup = setupValidatableValueHostBase(null, { enabled: false }, ValidationStatus.Invalid);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Disabled);
        setup.valueHost.setEnabled(true);
        setup.valueHost.validate();
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.getIssuesFound()!.length).toBe(1);     
        expect(setup.valueHost.isValid).toBe(false);
    });    
});
describe('otherValueHostChangedNotification', () => {
    test('Same ValueHost name is ignored', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.associatedValueHostNames = ['OtherField'];
        setup.valueHost.setValidationStatus(ValidationStatus.Valid);

        setup.valueHost.otherValueHostChangedNotification('Field1', false);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.validateCallCount).toBe(0);
    });

    test('When validationStatus is NotAttempted, notification is ignored', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.associatedValueHostNames = ['OtherField'];
        setup.valueHost.setValidationStatus(ValidationStatus.NotAttempted);

        setup.valueHost.otherValueHostChangedNotification('OtherField', false);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NotAttempted);
        expect(setup.valueHost.validateCallCount).toBe(0);
    });

    test('When revalidate=false and validationStatus is already NeedsValidation, notification is ignored', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.associatedValueHostNames = ['OtherField'];
        setup.valueHost.setValidationStatus(ValidationStatus.NeedsValidation);

        setup.valueHost.otherValueHostChangedNotification('OtherField', false);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.validateCallCount).toBe(0);
    });

    test('Unassociated ValueHost name is ignored', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.associatedValueHostNames = ['DifferentField'];
        setup.valueHost.setValidationStatus(ValidationStatus.Valid);

        setup.valueHost.otherValueHostChangedNotification('OtherField', false);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Valid);
        expect(setup.valueHost.validateCallCount).toBe(0);
    });

    test('Associated ValueHost name with revalidate=false sets NeedsValidation', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.associatedValueHostNames = ['OtherField'];
        setup.valueHost.setValidationStatus(ValidationStatus.Valid);
        setup.valueHost.setCorrected(true);
        setup.valueHost.setAsyncProcess(true);

        setup.valueHost.otherValueHostChangedNotification('OtherField', false);

        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(setup.valueHost.validateCallCount).toBe(0);
        expect(setup.valueHost.corrected).toBe(false);
        expect(setup.valueHost.asyncProcessing).toBe(false);
        expect(setup.valueHost.exposed_issuesFound).toBeNull();
    });

    test('Associated ValueHost name with revalidate=true calls validate', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.associatedValueHostNames = ['OtherField'];
        setup.valueHost.setValidationStatus(ValidationStatus.Valid);
        setup.valueHost.setValidateWillReturn(ValidationStatus.Invalid);

        setup.valueHost.otherValueHostChangedNotification('OtherField', true);

        expect(setup.valueHost.validateCallCount).toBe(1);
        expect(setup.valueHost.validationStatus).toBe(ValidationStatus.Invalid);
        expect(setup.valueHost.exposed_issuesFound).not.toBeNull();
    });
});
describe('toIValidatableValueHostBase', () => {
    test('Real instance match', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new TestValidatableValueHost(vm, {
            name: 'Field1'
        }, {
            name: 'Field1',
            issuesFound: null,
            value: null,
            status: ValidationStatus.Undetermined
        });
        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    test('Compatible object match', () => {
        let testItem: IValidatableValueHostBase = {
            valueHostsManager: {} as IValidationManager,
            dispose(): void { },
            otherValueHostChangedNotification: function (valueHostIdThatChanged: string, revalidate: boolean): void {
                throw new Error('Function not implemented.');
            },
            validate: function (options?: ValidateOptions | undefined): ValueHostValidateResult {
                throw new Error('Function not implemented.');
            },
            clearValidation: function (): boolean {
                throw new Error('Function not implemented.');
            },
            isValid: false,
            validationStatus: ValidationStatus.NotAttempted,
            asyncProcessing: false,
            corrected: false,
            currentValidationState: {} as any,

            addExternalIssuesFound(issuesFound: IssueFound[], determinedLocally: boolean, options?: ValidateOptions | undefined): boolean {
                throw new Error("Method not implemented.");
            },
            addExternalIssueFound(issueFound: IssueFound, determinedLocally: boolean, options?: ValidateOptions | undefined): boolean {
                throw new Error("Method not implemented.");
            },
            clearExternalIssuesFound: function (options?: ValidateOptions): boolean {
                throw new Error('Function not implemented.');
            },
            doNotSave: false,

            getIssueFound(errorCode: string): IssueFound | null {
                throw new Error('Function not implemented.');
            },
            getIssuesFound: function (group?: string | undefined): IssueFound[] {
                throw new Error('Function not implemented.');
            },

            getLabel: function (): string {
                throw new Error('Function not implemented.');
            },
            getValue: function () {
                throw new Error('Function not implemented.');
            },
            setValue: function (value: any, options?: SetValueOptions | undefined): void {
                throw new Error('Function not implemented.');
            },
            setValueToUndefined: function (options?: SetValueOptions | undefined): void {
                throw new Error('Function not implemented.');
            },
            getDataType: function (): string | null {
                throw new Error('Function not implemented.');
            },
            getDataTypeLabel(): string {
                throw new Error("Method not implemented.");
            },

            saveIntoInstanceState: function (key: string, value: any): void {
                throw new Error('Function not implemented.');
            },
            getFromInstanceState: function (key: string) {
                throw new Error('Function not implemented.');
            },
            isChanged: false,

            getName: function (): string {
                throw new Error('Function not implemented.');
            },
            gatherValueHostNames: function (collection: Set<string>, valueHostResolver: IValueHostResolver): void {
                throw new Error("Function not implemented.");
            },
            isEnabled(): boolean {
                throw new Error("Method not implemented.");
            },
            setEnabled(enabled: boolean): void {
                throw new Error("Method not implemented.");
            },
            groupCheck: function (options?: ValidateOptions | undefined): boolean {
                throw new Error('Function not implemented.');
            }
        }
        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    test('Wrong instance class returns null', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let vh = new StaticValueHost(vm, {
            name: 'Field1',
        }, {
            name: 'Field1',
            value: null,
        });
        expect(toIValidatableValueHostBase(new Date())).toBeNull();
        expect(toIValidatableValueHostBase(vh)).toBeNull();
    });
    test('Wrong plain old object returns null', () => {
        expect(toIValidatableValueHostBase({})).toBeNull();
        expect(toIValidatableValueHostBase({ getName: null })).toBeNull();
    });
});
describe('currentValidationState', () => {
    test('No issues returns a valid empty state', () => {
        let setup = setupValidatableValueHostBase();

        let result = setup.valueHost.currentValidationState;

        expect(result).toEqual(<ValueHostValidationState>{
            isValid: true,
            issuesFound: null,
            doNotSave: false,
            asyncProcessing: false,
            status: ValidationStatus.NotAttempted,
            corrected: false
        });
    });
    test('No issues but setValue returns a valid empty state with NeedsValidation', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setValue('Test');

        let result = setup.valueHost.currentValidationState;

        expect(result).toEqual(<ValueHostValidationState>{
            isValid: true,
            issuesFound: null,
            doNotSave: true,
            asyncProcessing: false,
            status: ValidationStatus.NeedsValidation,
            corrected: false
        });
    });
    test('Validator-managed error returns invalid blocking state', () => {
        let setup = setupValidatableValueHostBase();

        let validatorIssue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR ERROR',
            summaryMessage: 'VALIDATOR ERROR',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Error,
            doNotSave: true
        };

        expect(setup.valueHost.exposed_setIssueFound(validatorIssue)).toBe(true);

        let result = setup.valueHost.currentValidationState;

        expect(result).toEqual(<ValueHostValidationState>{
            isValid: false,
            issuesFound: [validatorIssue],
            doNotSave: true,
            asyncProcessing: false,
            status: ValidationStatus.Invalid,
            corrected: false
        });
    });

    test('External warning returns valid non-blocking state with issue present', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setValidateWillReturn(ValidationStatus.Valid);
        setup.valueHost.setValue('Test');
        setup.valueHost.validate();

        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL WARNING',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Warning
        }, true)).toBe(true);

        let result = setup.valueHost.currentValidationState;

        expect(result).toEqual(<ValueHostValidationState>{
            isValid: true,
            issuesFound: [
                {
                    valueHostName: 'Field1',
                    errorCode: 'EXT1',
                    severity: ValidationSeverity.Warning,
                    errorMessage: 'EXTERNAL WARNING',
                    summaryMessage: 'EXTERNAL WARNING',
                    doNotSave: false
                }
            ],
            doNotSave: false,
            asyncProcessing: false,
            status: ValidationStatus.Valid,
            corrected: false
        });
    });

    test('Combined validator-managed and external issues return correct aggregate state', () => {
        let setup = setupValidatableValueHostBase();

        let validatorIssue = <IssueFound>{
            valueHostName: 'Field1',
            errorMessage: 'VALIDATOR WARNING',
            summaryMessage: 'VALIDATOR WARNING',
            errorCode: 'VAL1',
            severity: ValidationSeverity.Warning,
            doNotSave: false
        };

        expect(setup.valueHost.exposed_setIssueFound(validatorIssue)).toBe(true);
        expect(setup.valueHost.addExternalIssueFound({
            errorMessage: 'EXTERNAL ERROR',
            errorCode: 'EXT1',
            severity: ValidationSeverity.Error
        }, true)).toBe(true);

        let result = setup.valueHost.currentValidationState;

        expect(result).toEqual(<ValueHostValidationState>{
            isValid: false,
            issuesFound: [
                {
                    valueHostName: 'Field1',
                    errorMessage: 'VALIDATOR WARNING',
                    summaryMessage: 'VALIDATOR WARNING',
                    errorCode: 'VAL1',
                    severity: ValidationSeverity.Warning,
                    doNotSave: false
                },
                {
                    valueHostName: 'Field1',
                    errorCode: 'EXT1',
                    severity: ValidationSeverity.Error,
                    errorMessage: 'EXTERNAL ERROR',
                    summaryMessage: 'EXTERNAL ERROR',
                    doNotSave: true
                }
            ],
            doNotSave: true,
            asyncProcessing: false,
            status: ValidationStatus.Invalid,
            corrected: false
        });
    });

    test('Corrected is reflected in currentValidationState', () => {
        let setup = setupValidatableValueHostBase();
        setup.valueHost.setValidateWillReturn(ValidationStatus.Valid);
        setup.valueHost.validate();
        setup.valueHost.setCorrected(true);

        let result = setup.valueHost.currentValidationState;

        expect(result).toEqual(<ValueHostValidationState>{
            isValid: true,
            issuesFound: null,
            doNotSave: false,
            asyncProcessing: false,
            status: ValidationStatus.Valid,
            corrected: true
        });
    });
});
describe('toIValidatableValueHostBase function', () => {
    test('Passing actual ValidatableValueHostBase matches interface returns same object.', () => {
        let vm = new MockValidationManager(new MockValidationServices(false, false));
        let testItem = new TestValidatableValueHost(vm, {
            name: 'Field1',
            label: 'Label1'
        },
            {
                name: 'Field1',
                value: undefined,
                issuesFound: null,
                status: ValidationStatus.NotAttempted,
            });
        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    class TestIValidatableValueHostBaseImplementation implements IValidatableValueHostBase {
        valueHostsManager: IValueHostsManager = {} as IValidationManager;  
        dispose(): void {}
        groupCheck(options?: ValidateOptions | undefined): boolean {
            throw new Error('Method not implemented.');
        }
        gatherValueHostNames(collection: Set<string>, valueHostResolver: IValueHostResolver): void {
            throw new Error("Method not implemented.");
        }
        getInputValue() {
            throw new Error("Method not implemented.");
        }
        setInputValue(value: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        setValues(nativeValue: any, inputValue: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        otherValueHostChangedNotification(valueHostIdThatChanged: string, revalidate: boolean): void {
            throw new Error("Method not implemented.");
        }
        validate(options?: ValidateOptions | undefined): ValueHostValidateResult {
            throw new Error("Method not implemented.");
        }
        clearValidation(): boolean {
            throw new Error("Method not implemented.");
        }
        isValid: boolean = true;
        validationStatus: ValidationStatus = ValidationStatus.NotAttempted;
        asyncProcessing: boolean = false;
        corrected: boolean = false;
        get currentValidationState(): ValueHostValidationState {
            throw new Error("Method not implemented.");
        }

        addExternalIssuesFound(issuesFound: IssueFound[], determinedLocally: boolean, options?: ValidateOptions | undefined): boolean {
            throw new Error('Method not implemented.');
        }
        addExternalIssueFound(issueFound: IssueFound, determinedLocally: boolean, options?: ValidateOptions | undefined): boolean {
            throw new Error('Method not implemented.');
        }        
        clearExternalIssuesFound(options?: ValidateOptions): boolean {
            throw new Error("Method not implemented.");
        }
        doNotSave = false;
        getIssueFound(errorCode: string): IssueFound | null {
            throw new Error("Method not implemented.");
        }

        getIssuesFound(group?: string | undefined): IssueFound[] {
            throw new Error("Method not implemented.");
        }
   
        getConversionErrorMessage(): string | null {
            throw new Error("Method not implemented.");
        }
        requiresInput: boolean = false;
        getName(): string {
            throw new Error("Method not implemented.");
        }
        getLabel(): string {
            throw new Error("Method not implemented.");
        }

        getValue() {
            throw new Error("Method not implemented.");
        }
        setValue(value: any, options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        setValueToUndefined(options?: SetValueOptions | undefined): void {
            throw new Error("Method not implemented.");
        }
        getDataType(): string | null {
            throw new Error("Method not implemented.");
        }
        getDataTypeLabel(): string {
            throw new Error("Method not implemented.");
        }
    
        isChanged: boolean = false;
        isEnabled(): boolean {
            throw new Error("Method not implemented.");
        }
        setEnabled(enabled: boolean): void {
            throw new Error("Method not implemented.");
        }        
        saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void {
            throw new Error("Method not implemented.");
        }
        getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined {
            throw new Error("Method not implemented.");
        }
        getValidator(errorCode: string): IValidator | null {
            throw new Error("Method not implemented.");
        }

    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIValidatableValueHostBaseImplementation();

        expect(toIValidatableValueHostBase(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidatableValueHostBase(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIValidatableValueHostBase(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIValidatableValueHostBase(100)).toBeNull();
    });
});

describe('toIValidatableValueHostBaseCallbacks function', () => {
    test('Passing actual ValidatableValueHostBase matches interface returns same object.', () => {
        let testItem = new MockValidationManager(new MockValidationServices(false, false));

        expect(toIValidatableValueHostBaseCallbacks(testItem)).toBe(testItem);
    });
    class TestIValidatableValueHostBaseCallbacksImplementation implements IValidatableValueHostBaseCallbacks {
        onValueChanged(vh: IValueHost, old: any) { }
        onValueHostInstanceStateChanged(vh: IValueHost, state: ValueHostInstanceState) { }
        onInputValueChanged(vh: IValidatableValueHostBase, old: any) { }
        onValueHostValidationStateChanged(vh: IValidatableValueHostBase, validationState: ValueHostValidationState) { }
    }
    test('Passing object with interface match returns same object.', () => {
        let testItem = new TestIValidatableValueHostBaseCallbacksImplementation();

        expect(toIValidatableValueHostBaseCallbacks(testItem)).toBe(testItem);
    });
    test('Non-matching interface returns null.', () => {
        let testItem = {};
        expect(toIValidatableValueHostBaseCallbacks(testItem)).toBeNull();
    });
    test('null returns null.', () => {
        expect(toIValidatableValueHostBaseCallbacks(null)).toBeNull();
    });
    test('Non-object returns null.', () => {
        expect(toIValidatableValueHostBaseCallbacks(100)).toBeNull();
    });
});

