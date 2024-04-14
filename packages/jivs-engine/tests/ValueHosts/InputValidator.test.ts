import {
    type RangeConditionDescriptor,
    RequiredTextCondition, EqualToCondition,
    type RequiredTextConditionDescriptor, type CompareToConditionDescriptor,
    RangeCondition, 
    
} from "../../src/Conditions/ConcreteConditions";

import { InputValidator, InputValidatorFactory } from "../../src/ValueHosts/InputValidator";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import type { TokenLabelAndValue } from "../../src/Interfaces/MessageTokenSource";
import type { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { MockValidationManager, MockValidationServices, MockInputValueHost, MockCapturingLogger } from "../TestSupport/mocks";
import { IValueHostResolver, IValueHostsManager } from '../../src/Interfaces/ValueHostResolver';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { type ICondition, ConditionEvaluateResult, ConditionCategory, ConditionDescriptor } from '../../src/Interfaces/Conditions';
import { IInputValueHost } from '../../src/Interfaces/InputValueHost';
import { ValidationSeverity, ValidateOptions } from '../../src/Interfaces/Validation';
import { InputValidateResult, IInputValidator, InputValidatorDescriptor } from '../../src/Interfaces/InputValidator';
import { TextLocalizerService } from '../../src/Services/TextLocalizerService';
import { IValueHost } from '../../src/Interfaces/ValueHost';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { registerAllConditions } from "../TestSupport/createValidationServices";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { IsUndeterminedConditionType, NeverMatchesConditionType, ThrowsExceptionConditionType } from "../TestSupport/conditionsForTesting";

// subclass of InputValidator to expose many of its protected members so they
// can be individually tested
class PublicifiedInputValidator extends InputValidator {
    public ExposeDescriptor(): InputValidatorDescriptor {
        return this.descriptor;
    }
    public ExposeServices(): IValidationServices {
        return this.services;
    }
    public ExposeValidationManager(): IValueHostsManager {
        return this.valueHostsManager;
    }
    public ExposeValueHost(): IInputValueHost {
        return this.valueHost;
    }

    public ExposeEnabler(): ICondition | null {
        return this.enabler;
    }
    public ExposeSeverity(): ValidationSeverity {
        return this.severity;
    }
    public ExposeGetErrorMessageTemplate(): string {
        return this.getErrorMessageTemplate();
    }
    public ExposeGetSummaryMessageTemplate(): string {
        return this.getSummaryMessageTemplate();
    }
}
/**
 * Returns an InputValidator (PublicifiedInputValidator subclass) ready for testing.
 * The returned ValidationManager includes two InputValueHosts with IDs "Field1" and "Field2".
 * @param descriptor - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * ConditionDescriptor - RequiredTextConditiontType, ValueHostName: null
 * errorMessage: 'Local'
 * summaryMessage: 'Summary'
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, two ValueHosts, the complete Descriptor,
 * and the InputValidator.
 */
function setupWithField1AndField2(descriptor?: Partial<InputValidatorDescriptor>): {
    vm: MockValidationManager,
    services: MockValidationServices,
    valueHost1: MockInputValueHost,
    valueHost2: MockInputValueHost,
    descriptor: InputValidatorDescriptor,
    inputValidator: PublicifiedInputValidator
} {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let vh = vm.addInputValueHost('Field1', LookupKey.String, 'Label1');
    let vh2 = vm.addInputValueHost('Field2', LookupKey.String, 'Label2');
    const defaultDescriptor: InputValidatorDescriptor = {
        conditionDescriptor: <RequiredTextConditionDescriptor>
            { type: ConditionType.RequiredText, valueHostName: 'Field1' },
        errorMessage: 'Local',
        summaryMessage: 'Summary'
    };

    let updatedDescriptor: InputValidatorDescriptor = (!descriptor) ?
        defaultDescriptor :
        { ...defaultDescriptor, ...descriptor };

    let testItem = new PublicifiedInputValidator(vh, updatedDescriptor);
    return {
        vm: vm,
        services: services,
        valueHost1: vh,
        valueHost2: vh2,
        descriptor: updatedDescriptor,
        inputValidator: testItem
    };
}
export class ConditionWithPromiseTester implements ICondition {
    constructor(result: ConditionEvaluateResult, delay: number, error?: string) {
        this.Result = result;
        this.Delay = delay;
        this.Error = error ?? null;
    }
    conditionType: string = 'TEST';
    category: ConditionCategory = ConditionCategory.Undetermined;

    public Result: ConditionEvaluateResult;
    public Delay: number;
    public Error: string | null;
    public evaluate(valueHost: IValueHost, valueHostResolver: IValueHostResolver):
        ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        let self = this;
        return new Promise<ConditionEvaluateResult>((resolve, reject) => {
            function finish() {
                if (self.Error)
                    reject(self.Error);
                else
                    resolve(self.Result);
            }
            if (self.Delay)
                globalThis.setTimeout(finish, self.Delay);
            else
                finish();
        });
    }
}
// constructor(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor)
describe('Inputvalidator.constructor and initial property values', () => {
    test('valueHost parameter null throws', () => {
        let descriptor: InputValidatorDescriptor = {
            conditionDescriptor: { type: '' },
            errorMessage: ''
        };
        expect(() => new InputValidator(null!, descriptor)).toThrow(/valueHost/);
    });
    test('descriptor parameter null throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = new MockInputValueHost(vm, '', '',);
        expect(() => new InputValidator(vh, null!)).toThrow(/descriptor/);
    });
    test('Valid parameters create and setup supporting properties', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: { type: '' },
        });
        expect(config.inputValidator.ExposeDescriptor()).toBe(config.descriptor);
        expect(config.inputValidator.ExposeValidationManager()).toBe(config.vm);

    });
});
describe('InputValidator.condition', () => {
    test('Successful creation of RequiredTextCondition using ConditionDescriptor', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: <RequiredTextConditionDescriptor>
                { type: ConditionType.RequiredText, valueHostName: null },
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.condition).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequiredTextCondition);
    });
    test('Attempt to create Condition with ConditionDescriptor with invalid type throws', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: { type: 'UnknownType' },
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.condition).toThrow(/not supported/);
    });
    test('Successful creation using ConditionCreator', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: null,   // because the Setup function provides a default
            conditionCreator: (requestor) => {
                return {
                    conditionType: 'TEST',
                    evaluate: (valueHost, validationManager) => {
                        return ConditionEvaluateResult.Match;
                    },
                    category: ConditionCategory.Undetermined
                };
            }
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.condition).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition!.conditionType).toBe('TEST');
        expect(condition!.category).toBe(ConditionCategory.Undetermined);
        expect(condition!.evaluate(null, config.vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Neither Descriptor or Creator setup throws', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: null   // because the Setup function provides a default
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.condition).toThrow(/setup/);
    });
    test('Both Descriptor and Creator setup throws', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: { type: ConditionType.RequiredText },
            conditionCreator: (requestor) => {
                return {
                    conditionType: 'TEST',
                    evaluate: (valueHost, validationManager) => {
                        return ConditionEvaluateResult.Match;
                    },
                    category: ConditionCategory.Undetermined
                };
            }
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.condition).toThrow(/both/);
    });
    test('ConditionCreator returns null throws', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: null,
            conditionCreator: (requestor) => null
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.condition).toThrow(/instance/);
    });
});
describe('InputValidator.enabler', () => {
    test('InputValidatorDescriptor has no Enabler assigned sets Enabler to null', () => {
        let config = setupWithField1AndField2({});

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Successful creation of EqualToCondition', () => {
        let config = setupWithField1AndField2({
            enablerDescriptor: <CompareToConditionDescriptor>{
                type: ConditionType.EqualTo,
                valueHostName: null
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler).toBeInstanceOf(EqualToCondition);
    });
    test('Attempt to create Enabler with invalid type throws', () => {
        let config = setupWithField1AndField2({
            enablerDescriptor: {
                type: 'UnknownType'
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).toThrow(/not supported/);
    });
    test('Successful creation using EnablerCreator', () => {
        let config = setupWithField1AndField2({
            enablerCreator: (requestor) => {
                return {
                    conditionType: 'TEST',
                    evaluate: (valueHost, validationManager) => {
                        return ConditionEvaluateResult.Match;
                    },
                    category: ConditionCategory.Undetermined
                };
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler!.conditionType).toBe('TEST');
        expect(enabler!.category).toBe(ConditionCategory.Undetermined);
        expect(enabler!.evaluate(null, config.vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Neither Descriptor or Creator returns null', () => {
        let config = setupWithField1AndField2({
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Both Descriptor and Creator setup throws', () => {
        let config = setupWithField1AndField2({
            enablerDescriptor: { type: ConditionType.RequiredText },
            enablerCreator: (requestor) => {
                return {
                    conditionType: 'TEST',
                    evaluate: (valueHost, services) => {
                        return ConditionEvaluateResult.Match;
                    },
                    category: ConditionCategory.Undetermined
                };
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).toThrow(/both/);
    });
    test('EnablerCreator returns null throws', () => {
        let config = setupWithField1AndField2({
            enablerDescriptor: null,
            enablerCreator: (requestor) => null
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).toThrow(/instance/);
    });
});
describe('InputValidator.enabled', () => {
    test('Descriptor.Enabled = true, Enabled=true', () => {
        let config = setupWithField1AndField2({
            enabled: true
        });

        expect(config.inputValidator.enabled).toBe(true);
    });
    test('Descriptor.Enabled = false, Enabled=false', () => {
        let config = setupWithField1AndField2({
            enabled: false
        });

        expect(config.inputValidator.enabled).toBe(false);
    });
    test('Descriptor.Enabled = undefined, Enabled=true', () => {
        let config = setupWithField1AndField2({
            enabled: undefined
        });

        expect(config.inputValidator.enabled).toBe(true);
    });
    test('Descriptor.Enabled = function, Enabled= result of function', () => {
        let config = setupWithField1AndField2({

            enabled: (iv: IInputValidator) => enabledForFn
        });

        let enabledForFn = true;
        expect(config.inputValidator.enabled).toBe(true);
        enabledForFn = false;
        expect(config.inputValidator.enabled).toBe(false);
    });

    test('Descriptor.Enabled = true but setEnabled sets it to false, Enabled=false', () => {
        let config = setupWithField1AndField2({
            enabled: true
        });

        config.inputValidator.setEnabled(false);
        expect(config.inputValidator.enabled).toBe(false);
        config.inputValidator.setEnabled(true);
        expect(config.inputValidator.enabled).toBe(true);
    });    
});


describe('InputValidator.severity', () => {
    test('Descriptor.Severity = Error, Severity=Error', () => {
        let config = setupWithField1AndField2({
            severity: ValidationSeverity.Error
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Descriptor.Severity = Warning, Severity=Warning', () => {
        let config = setupWithField1AndField2({
            severity: ValidationSeverity.Warning
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
    });
    test('Descriptor.Severity = Severe, Severity=Severe', () => {
        let config = setupWithField1AndField2({
            severity: ValidationSeverity.Severe
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
    test('Descriptor.Severity = Error but setSeverity sets it to Severe, Severity = Severe', () => {
        let config = setupWithField1AndField2({
            severity: ValidationSeverity.Error
        });

        config.inputValidator.setSeverity(ValidationSeverity.Severe);
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
        config.inputValidator.setSeverity(ValidationSeverity.Error);
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });      
    test('Descriptor.Severity unassigned and setSeverity sets it to Severe, Severity = Severe', () => {
        let config = setupWithField1AndField2({
        });

        config.inputValidator.setSeverity(ValidationSeverity.Severe);
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });           
    test('Conditions that use Severity=Severe when Descriptor.Severity = undefined', () => {
        function checkDefaultSeverity(conditionType: string, ) {
            let config = setupWithField1AndField2({
                conditionDescriptor: {
                    type: conditionType
                },
                severity: undefined
            });
            registerAllConditions((config.services.conditionFactory as ConditionFactory));

            expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
        }
        checkDefaultSeverity(ConditionType.RequiredText);
        checkDefaultSeverity(ConditionType.DataTypeCheck);
        checkDefaultSeverity(ConditionType.RegExp);
        checkDefaultSeverity(ConditionType.StringNotEmpty);
        checkDefaultSeverity(ConditionType.NotNull);
    });
    test('Conditions that use Severity=Error when Descriptor.Severity = undefined', () => {
        function checkDefaultSeverity(conditionType: string) {
            let config = setupWithField1AndField2({
                conditionDescriptor: {
                    type: conditionType
                },
                severity: undefined
            });

            expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
        }
        checkDefaultSeverity(ConditionType.Range);
        checkDefaultSeverity(ConditionType.StringLength);
        checkDefaultSeverity(ConditionType.EqualTo);
        checkDefaultSeverity(ConditionType.NotEqualTo);
        checkDefaultSeverity(ConditionType.GreaterThan);
        checkDefaultSeverity(ConditionType.GreaterThanOrEqual);
        checkDefaultSeverity(ConditionType.LessThan);
        checkDefaultSeverity(ConditionType.LessThanOrEqual);
        checkDefaultSeverity(ConditionType.And);
        checkDefaultSeverity(ConditionType.Or);
        checkDefaultSeverity(ConditionType.CountMatches);

    });
    test('RangeCondition Descriptor.Severity = undefined, Severity=Error', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: {
                type: ConditionType.Range
            },
            severity: undefined
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('AllMatchCondition Descriptor.Severity = undefined, Severity=Error', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: {
                type: ConditionType.And
            },
            severity: undefined
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Descriptor.Severity = function, Severity= result of function', () => {
        let config = setupWithField1AndField2({
            severity: (iv: IInputValidator) => severityForFn
        });

        let severityForFn: ValidationSeverity = ValidationSeverity.Warning;
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
        severityForFn = ValidationSeverity.Error;
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
        severityForFn = ValidationSeverity.Severe;
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
});

function setupForLocalization(activeCultureID: string): PublicifiedInputValidator {
    let config = setupWithField1AndField2({
        errorMessage: 'EM-fallback',
        errorMessagel10n: 'EM',
        summaryMessage: 'SEM-fallback',
        summaryMessagel10n: 'SEM'
    });
    let tlService = config.services.textLocalizerService as TextLocalizerService;
    tlService.register('EM', {
        'en': 'enErrorMessage',
        'es': 'esErrorMessage'
    });
    tlService.register('SEM', {
        'en': 'enSummaryMessage',
        'es': 'esSummaryMessage'
    });
    config.services.activeCultureId = activeCultureID;
    return config.inputValidator;
}
describe('InputValidator.getErrorMessageTemplate', () => {
    test('Descriptor.errorMessage = string, return the same string', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Test',
        });

        expect(config.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });

    test('Descriptor.errorMessage = function, getErrorMessageTemplate= result of function', () => {
        let config = setupWithField1AndField2({
            errorMessage: (iv: IInputValidator) => errorMessageForFn
        });

        let errorMessageForFn = 'Test';
        expect(config.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });
    test('Descriptor.errorMessage = function, throws when function returns null', () => {
        let config = setupWithField1AndField2({
            errorMessage: (iv: IInputValidator) => null!
        });

        expect(() => config.inputValidator.ExposeGetErrorMessageTemplate()).toThrow(/Descriptor\.errorMessage/);
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en', () => {
        let testItem = setupForLocalization('en');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('enErrorMessage');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en-US', () => {
        let testItem = setupForLocalization('en-US');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('enErrorMessage');
    });

    test('TextLocalizationService used for labels with existing es language and active culture of es-SP', () => {
        let testItem = setupForLocalization('es-SP');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('esErrorMessage');
    });

    test('TextLocalizationService not setup for fr language and active culture of fr uses errorMessage property', () => {
        let testItem = setupForLocalization('fr');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('EM-fallback');
    });
    test('TextLocalizationService not setup for fr-FR language and active culture of fr uses errorMessage property', () => {
        let testItem = setupForLocalization('fr-FR');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('EM-fallback');
    });

    test('TextLocalizationService.GetErrorMessage used because errorMessage is not supplied', () => {
      
        let config = setupWithField1AndField2({
            errorMessage: null,
            errorMessagel10n: null,
        });
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetErrorMessage is not used because errorMessage is supplied', () => {
      
        let config = setupWithField1AndField2({
            errorMessage: 'supplied',
            errorMessagel10n: null,
        });

        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetErrorMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let config = setupWithField1AndField2({
            conditionDescriptor: {
                type: ConditionType.DataTypeCheck
            },
            errorMessage: null,
            errorMessagel10n: null,
        });
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.DataType
        {
            '*': 'Default Error Message'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetErrorMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let config = setupWithField1AndField2({
            conditionDescriptor: {
                type: ConditionType.DataTypeCheck
            },
            errorMessage: null,
            errorMessagel10n: null,
        });
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (config.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    }); 
    test('Descriptor.errorMessage = string and setErrorMessage overrides without l10n, return the override', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Test',
        });
        config.inputValidator.setErrorMessage('Test-Override');
        expect(config.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test-Override');
    });    
    test('Descriptor.errorMessage = string and setErrorMessage overrides without l10n, return the override', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Test',
        });
        let tls = config.services.textLocalizerService as TextLocalizerService;
        tls.register('Testl10n',
            {
                '*': 'Localized Test'
            });        
    
        config.inputValidator.setErrorMessage('Test-Override', 'Testl10n');
        expect(config.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Localized Test');
    });
});
describe('InputValidator.GetSummaryMessageTemplate', () => {
    test('Descriptor.summaryMessage = string, return the same string', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: 'Summary',
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Descriptor.summaryMessage = null, return errorMessage', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: null,
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Descriptor.summaryMessage = undefined, return errorMessage', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: undefined
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Descriptor.summaryMessage = function, GetSummaryMessageTemplate= result of function', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IInputValidator) => summaryMessageForFn
        });

        let summaryMessageForFn = 'Summary';
        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Descriptor.summaryMessage = function that returns null GetSummaryMessageTemplate = errorMessage', () => {
        let config = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IInputValidator) => null!
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en', () => {
        let testItem = setupForLocalization('en');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('enSummaryMessage');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en-US', () => {
        let testItem = setupForLocalization('en-US');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('enSummaryMessage');
    });

    test('TextLocalizationService used for labels with existing es language and active culture of es-SP', () => {
        let testItem = setupForLocalization('es-SP');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('esSummaryMessage');
    });

    test('TextLocalizationService not setup for fr language and active culture of fr uses summaryMessage property', () => {
        let testItem = setupForLocalization('fr');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('SEM-fallback');
    });
    test('TextLocalizationService not setup for fr-FR language and active culture of fr uses summaryMessage property', () => {
        let testItem = setupForLocalization('fr-FR');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('SEM-fallback');
    });
    test('TextLocalizationService.GetSummaryMessage used because summaryMessage is not supplied', () => {
      
        let config = setupWithField1AndField2({
            summaryMessage: null,
            summaryMessagel10n: null,
        });
        (config.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetSummaryMessage is not used because summaryMessage is supplied', () => {
      
        let config = setupWithField1AndField2({
            summaryMessage: 'supplied',
            summaryMessagel10n: null,
        });

        (config.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetSummaryMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let config = setupWithField1AndField2({
            conditionDescriptor: {
                type: ConditionType.DataTypeCheck
            },
            summaryMessage: null,
            summaryMessagel10n: null,
        });
        (config.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.DataType
        {
            '*': 'Default Error Message'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetSummaryMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let config = setupWithField1AndField2({
            conditionDescriptor: {
                type: ConditionType.DataTypeCheck
            },
            summaryMessage: null,
            summaryMessagel10n: null,
        });
        (config.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (config.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        config.services.activeCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    }); 

    test('Descriptor.summaryMessage = string and setSummaryMessage overrides without l10n, return the override', () => {
        let config = setupWithField1AndField2({
            summaryMessage: 'Test',
        });
        config.inputValidator.setSummaryMessage('Test-Override');
        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Test-Override');
    });    
    test('Descriptor.summaryMessage = string and setSummaryMessage overrides without l10n, return the override', () => {
        let config = setupWithField1AndField2({
            summaryMessage: 'Test',
        });
        let tls = config.services.textLocalizerService as TextLocalizerService;
        tls.register('Testl10n',
            {
                '*': 'Localized Test'
            });        
    
        config.inputValidator.setSummaryMessage('Test-Override', 'Testl10n');
        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Localized Test');
    });    
});
// validate(group?: string): IssueFound | null
describe('InputValidator.validate', () => {

    test('No issue found. Returns ConditionEvaluateResult.Match', () => {
        let config = setupWithField1AndField2();
        config.valueHost1.setValue('valid');

        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.issueFound).toBeNull();
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
    });
    function testSeverity(severity: ValidationSeverity): void {
        let config = setupWithField1AndField2({
            severity: severity
        });
        config.valueHost1.setValue('');   // will be invalid
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.issueFound).not.toBeNull();
        expect(vrResult!.issueFound!.conditionType).toBe(ConditionType.RequiredText);
        expect(vrResult!.issueFound!.severity).toBe(severity);
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.NoMatch);
    }
    test('Warning Issue found. Returns the issue with Severity = warning', () => {
        testSeverity(ValidationSeverity.Warning);
    });
    test('Error Issue found. Returns the issue with Severity = error', () => {
        testSeverity(ValidationSeverity.Error);
    });
    test('Severe Issue found. Returns the issue with Severity = severe', () => {
        testSeverity(ValidationSeverity.Severe);
    });
    function testErrorMessages(errorMessage: string | ((host: IInputValidator) => string),
        summaryMessage: string | ((host: IInputValidator) => string) | null,
        expectedErrorMessage: string, expectedSummaryMessage: string): void {
        let config = setupWithField1AndField2({
            errorMessage: errorMessage,
            summaryMessage: summaryMessage,
        });
        config.valueHost1.setValue('');   // will be an issue
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.issueFound).not.toBeNull();

        let issueFound = vrResult!.issueFound;
        expect(issueFound!.conditionType).toBe(ConditionType.RequiredText);
        expect(issueFound!.errorMessage).toBe(expectedErrorMessage);
        expect(issueFound!.summaryMessage).toBe(expectedSummaryMessage);
    }
    test('Issue found. Only errorMessage supplied. Summary is the same as errorMessage', () => {
        testErrorMessages('Local', null, 'Local', 'Local');
    });
    test('Issue found. errorMessage and summaryMessage supplied. Issue reflects them', () => {
        testErrorMessages('Local', 'Summary', 'Local', 'Summary');
    });
    test('Issue found. errorMessage and summaryMessage supplied each with tokens. Error messages both have correctly replaced the tokens.', () => {
        testErrorMessages('{Label} Local', '{Label} Summary', 'Label1 Local', 'Label1 Summary');
    });
    function testConditionHasIssueButDisabledReturnsNull(descriptorChanges: Partial<InputValidatorDescriptor>): void {
        let config = setupWithField1AndField2(descriptorChanges);
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result        
        config.valueHost1.setValue('');   // will be invalid
        config.valueHost2.setValueToUndefined();   // for use by Enabler to be invalid
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.issueFound).toBeNull();

        // 2 info level log entries: bailout and validation result
        expect(logger.entryCount()).toBe(2);
    }
    test('Issue exists. Enabled = false. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            enabled: false
        });
    });
    test('Issue exists. Enabler = NoMatch. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            enablerDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText,
                valueHostName: 'Field2'
            }
        });
    });
    test('Issue exists. Enabler = Undetermined. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            enablerDescriptor: <ConditionDescriptor>{
                // the input value is '', which causes this condition to return Undetermined
                type: IsUndeterminedConditionType, valueHostName: 'Field2'
            }
        });
    });
    function testConditionHasIssueAndBlockingCheckPermitsValidation(descriptorChanges: Partial<InputValidatorDescriptor>,
        validateOptions: ValidateOptions, logCount: number, issueExpected: boolean = true): void {
        let config = setupWithField1AndField2(descriptorChanges);
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        config.valueHost1.setValue('');   // will be invalid
        config.valueHost2.setValue('ABC');   // for use by Enabler to enable the condition
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.validate(validateOptions)).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        if (issueExpected)
            expect(vrResult!.issueFound).not.toBeNull();
        else
            expect(vrResult!.issueFound).toBeNull();
        // 3 possible info level log entries: intro, Condition evaluate result, validation issues found      
        expect(logger.entryCount()).toBe(logCount);
    }


    test('Issue exists. Enabler = Match. Returns Issue with correct error messages', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            enablerDescriptor: <RequiredTextConditionDescriptor>{
                // the input value is 'ABC', which causes this condition to return Match
                type: ConditionType.RequiredText, valueHostName: 'Field2'
            }
        }, {}, 3);
    });
    test('Issue exists but Required is skipped because IValidateOption.Preliminary = true.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { preliminary: true }, 2, false);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.Preliminary = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { preliminary: false }, 3, true);
    });

    test('Demonstrate that duringEdit=false does not use evaluateDuringEdits.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { duringEdit: false }, 3, true);
    });
    test('Issue exists but NeverMatchCondition is skipped because IValidateOption.DuringEdit = true.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            conditionDescriptor: {
                type: NeverMatchesConditionType
            }
        }, { duringEdit: true }, 2, false);
    });
    test('Issue exists and NeverMatchCondition is run because IValidateOption.DuringEdit = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            conditionDescriptor: {
                type: NeverMatchesConditionType
            }
        }, { duringEdit: false }, 3, true);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.Preliminary = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { preliminary: false }, 3, true);
    });
    function testDuringEditIsTrue(descriptorChanges: Partial<InputValidatorDescriptor>,
        inputValue: string, 
        logCount: number, issueExpected: boolean = true): void {
        let config = setupWithField1AndField2(descriptorChanges);
        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        config.valueHost1.setInputValue(inputValue);   // for RequiredTextCondition.evaluateDuringEdit
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.validate({ duringEdit: true})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        if (issueExpected)
            expect(vrResult!.issueFound).not.toBeNull();
        else
            expect(vrResult!.issueFound).toBeNull();
        // 2 info level log entries: first Condition second validate result
        expect(logger.entryCount()).toBe(logCount);
    }
    test('ValidationOption.duringEdit = true with issue found.', () => {
        testDuringEditIsTrue({}, '', 3, true);
    });    
    test('ValidationOption.duringEdit = true with no issue found.', () => {
        testDuringEditIsTrue({}, 'A', 2, false);
    });        
    test('Condition throws causing result of Undetermined and log to identify exception', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: { type: ThrowsExceptionConditionType }
        });

        let logger = config.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult).not.toBeNull();
        expect(vrResult!.issueFound).toBeNull();
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);

        // 3 log entries: intro, Error level exception
        expect(logger.entryCount()).toBe(2);
        expect(logger.captured[0].level).toBe(LoggingLevel.Info);        
        expect(logger.captured[1].level).toBe(LoggingLevel.Error);
    });

    function setupPromiseTest(result: ConditionEvaluateResult, delay: number, error?: string): {
        vm: MockValidationManager,
        services: MockValidationServices,
        vh: IInputValueHost,
        testItem: InputValidator
    } {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Field1', LookupKey.String, 'Field 1');

        let descriptor: InputValidatorDescriptor = {
            conditionDescriptor: null,
            conditionCreator: (requestor) => {
                return new ConditionWithPromiseTester(result,
                    delay, error);
            },
            errorMessage: 'Local',
            summaryMessage: 'Summary'
        };

        let testItem = new InputValidator(vh, descriptor);
        return {
            vm: vm,
            services: services,
            vh: vh,
            testItem: testItem
        };
    }

    test('Condition using Promise to evaluate as Match results in InputValidateResult setup as Match with no IssuesFound', async () => {
        let setup = setupPromiseTest(ConditionEvaluateResult.Match, 0);
        let result = await setup.testItem.validate({});
        expect(result).toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Match,
            issueFound: null
        });
    });
    test('With delay, Condition using Promise to evaluate as Match results in InputValidateResult setup as Match with no IssuesFound',
        async () => {
            let setup = setupPromiseTest(ConditionEvaluateResult.Match, 100);
            let result = await setup.testItem.validate({});
            expect(result).toEqual({
                conditionEvaluateResult: ConditionEvaluateResult.Match,
                issueFound: null
            });
        });
    test('Condition using Promise to evaluate as NoMatch results in InputValidateResult setup as Match with 1 IssueFound',
        async () => {
            let setup = setupPromiseTest(ConditionEvaluateResult.NoMatch, 0);
            let result = await setup.testItem.validate({});
            expect(result).toEqual(<InputValidateResult>{
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                issueFound: {
                    conditionType: 'TEST',
                    errorMessage: 'Local',
                    summaryMessage: 'Summary',
                    severity: ValidationSeverity.Error,
                    valueHostName: 'Field1'
                }
            });
        });
    test('Condition using Promise to evaluate as Undetermined results in InputValidateResult setup as Undetermined with no IssuesFound',
        async () => {
            let setup = setupPromiseTest(ConditionEvaluateResult.Undetermined, 0);
            let result = await setup.testItem.validate({});
            expect(result).toEqual({
                conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                issueFound: null
            });
        });
    test('Condition using Promise to generate a rejection calls the catch',
        async () => {
     //       expect.assertions(1);
            let setup = setupPromiseTest(ConditionEvaluateResult.Match, 0, 'ERROR');
            try {
                let result = await setup.testItem.validate({});
                fail();
            }
            catch (e) {
                expect(e).toBe('ERROR');
                let logger = setup.services.loggerService as MockCapturingLogger;
                expect(logger.entryCount()).toBe(1);
                expect(logger.getLatest()!.message).toMatch(/ERROR/);

            }
        });
});
describe('InputValidator.gatherValueHostNames', () => {
    test('RequiredTextCondition supplies its ValueHostName', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: <RequiredTextConditionDescriptor>
                { type: ConditionType.RequiredText, valueHostName: 'Property1' },
        });
        let collection = new Set<ValueHostName>();
        expect(() => config.inputValidator.gatherValueHostNames(collection, config.vm)).not.toThrow();
        expect(collection.size).toBe(1);
        expect(collection.has('Property1')).toBe(true);
    });
});

describe('getValuesForTokens', () => {
    test('RequiredTextCondition returns 2 tokens: Label and Value', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText,
                valueHostName: null
            }
        });
        config.valueHost1.setInputValue('Value1');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = config.inputValidator.getValuesForTokens(config.valueHost1, config.vm)).not.toThrow();
        expect(tlvs).not.toBeNull();
        expect(tlvs).toEqual([
            {
                tokenLabel: 'Label',
                associatedValue: 'Label1',
                purpose: 'label'
            },
            {
                tokenLabel: 'Value',
                associatedValue: 'Value1',
                purpose: 'value'
            }
        ]);
    });
    test('RangeCondition returns 4 tokens: Label, Value, Minimum, Maximum', () => {
        let config = setupWithField1AndField2({
            conditionDescriptor: <RangeConditionDescriptor>{
                type: ConditionType.Range, valueHostName: null,
                minimum: 'A',
                maximum: 'Z'
            }
        });
        (config.services.conditionFactory as ConditionFactory).register<RangeConditionDescriptor>(
            ConditionType.RegExp, (descriptor) => new RangeCondition(descriptor));                
        config.valueHost1.setInputValue('C');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = config.inputValidator.getValuesForTokens(config.valueHost1, config.vm)).not.toThrow();
        expect(tlvs).not.toBeNull();
        expect(tlvs).toEqual([
            {
                tokenLabel: 'Label',
                associatedValue: 'Label1',
                purpose: 'label'
            },
            {
                tokenLabel: 'Value',
                associatedValue: 'C',
                purpose: 'value'
            },
            {
                tokenLabel: 'Minimum',
                associatedValue: 'A',
                purpose: 'parameter'
            },
            {
                tokenLabel: 'Maximum',
                associatedValue: 'Z',
                purpose: 'parameter'
            },
        ]);
    });
});

describe('InputValidatorFactory.create', () => {
    test('Returns an InputValidator', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Field1', LookupKey.String, 'Label1');
        const descriptor: InputValidatorDescriptor = {
            conditionDescriptor: <RequiredTextConditionDescriptor>{
                type: ConditionType.RequiredText,
                valueHostName: 'Field1'
            },
            errorMessage: 'Local',
            summaryMessage: 'Summary'
        };
        let testItem = new InputValidatorFactory();
        let created: IInputValidator | null = null;
        expect(() => created = testItem.create(vh, descriptor)).not.toThrow();
        expect(created).not.toBeNull();
        expect(created).toBeInstanceOf(InputValidator);
    });
});