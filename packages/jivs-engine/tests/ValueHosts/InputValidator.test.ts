import {
    type RangeConditionConfig,
    RequireTextCondition, EqualToCondition,
    type RequireTextConditionConfig, type CompareToConditionConfig,
    RangeCondition, 
    
} from "../../src/Conditions/ConcreteConditions";

import { InputValidator, InputValidatorFactory } from "../../src/ValueHosts/InputValidator";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import type { TokenLabelAndValue } from "../../src/Interfaces/MessageTokenSource";
import type { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { MockValidationManager, MockValidationServices, MockInputValueHost, MockCapturingLogger } from "../TestSupport/mocks";
import { IValueHostResolver, IValueHostsManager } from '../../src/Interfaces/ValueHostResolver';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { type ICondition, ConditionEvaluateResult, ConditionCategory, ConditionConfig } from '../../src/Interfaces/Conditions';
import { IInputValueHost } from '../../src/Interfaces/InputValueHost';
import { ValidationSeverity, ValidateOptions } from '../../src/Interfaces/Validation';
import { InputValidateResult, IInputValidator, InputValidatorConfig } from '../../src/Interfaces/InputValidator';
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
    public ExposeConfig(): InputValidatorConfig {
        return this.config;
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
 * @param config - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * ConditionConfig - RequireTextConditiontType, ValueHostName: null
 * errorMessage: 'Local'
 * summaryMessage: 'Summary'
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, two ValueHosts, the complete Config,
 * and the InputValidator.
 */
function setupWithField1AndField2(config?: Partial<InputValidatorConfig>): {
    vm: MockValidationManager,
    services: MockValidationServices,
    valueHost1: MockInputValueHost,
    valueHost2: MockInputValueHost,
    config: InputValidatorConfig,
    inputValidator: PublicifiedInputValidator
} {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let vh = vm.addInputValueHost('Field1', LookupKey.String, 'Label1');
    let vh2 = vm.addInputValueHost('Field2', LookupKey.String, 'Label2');
    const defaultConfig: InputValidatorConfig = {
        conditionConfig: <RequireTextConditionConfig>
            { type: ConditionType.RequireText, valueHostName: 'Field1' },
        errorMessage: 'Local',
        summaryMessage: 'Summary'
    };

    let updatedConfig: InputValidatorConfig = (!config) ?
        defaultConfig :
        { ...defaultConfig, ...config };

    let testItem = new PublicifiedInputValidator(vh, updatedConfig);
    return {
        vm: vm,
        services: services,
        valueHost1: vh,
        valueHost2: vh2,
        config: updatedConfig,
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
// constructor(valueHost: IInputValueHost, config: InputValidatorConfig)
describe('Inputvalidator.constructor and initial property values', () => {
    test('valueHost parameter null throws', () => {
        let config: InputValidatorConfig = {
            conditionConfig: { type: '' },
            errorMessage: ''
        };
        expect(() => new InputValidator(null!, config)).toThrow(/valueHost/);
    });
    test('config parameter null throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = new MockInputValueHost(vm, '', '',);
        expect(() => new InputValidator(vh, null!)).toThrow(/config/);
    });
    test('Valid parameters create and setup supporting properties', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { type: '' },
        });
        expect(setup.inputValidator.ExposeConfig()).toBe(setup.config);
        expect(setup.inputValidator.ExposeValidationManager()).toBe(setup.vm);

    });
});
describe('InputValidator.condition', () => {
    test('Successful creation of RequireTextCondition using ConditionConfig', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>
                { type: ConditionType.RequireText, valueHostName: null },
        });

        let condition: ICondition | null = null;
        expect(() => condition = setup.inputValidator.condition).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequireTextCondition);
    });
    test('Attempt to create Condition with ConditionConfig with invalid type throws', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { type: 'UnknownType' },
        });

        let condition: ICondition | null = null;
        expect(() => condition = setup.inputValidator.condition).toThrow(/not supported/);
    });
    test('Successful creation using ConditionCreator', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: null,   // because the Setup function provides a default
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
        expect(() => condition = setup.inputValidator.condition).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition!.conditionType).toBe('TEST');
        expect(condition!.category).toBe(ConditionCategory.Undetermined);
        expect(condition!.evaluate(null, setup.vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Neither Config or Creator setup throws', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: null   // because the Setup function provides a default
        });

        let condition: ICondition | null = null;
        expect(() => condition = setup.inputValidator.condition).toThrow(/setup/);
    });
    test('Both Config and Creator setup throws', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { type: ConditionType.RequireText },
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
        expect(() => condition = setup.inputValidator.condition).toThrow(/both/);
    });
    test('ConditionCreator returns null throws', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: null,
            conditionCreator: (requestor) => null
        });

        let condition: ICondition | null = null;
        expect(() => condition = setup.inputValidator.condition).toThrow(/instance/);
    });
});
describe('InputValidator.enabler', () => {
    test('InputValidatorConfig has no Enabler assigned sets Enabler to null', () => {
        let setup = setupWithField1AndField2({});

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Successful creation of EqualToCondition', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: <CompareToConditionConfig>{
                type: ConditionType.EqualTo,
                valueHostName: null
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler).toBeInstanceOf(EqualToCondition);
    });
    test('Attempt to create Enabler with invalid type throws', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: {
                type: 'UnknownType'
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.inputValidator.ExposeEnabler()).toThrow(/not supported/);
    });
    test('Successful creation using EnablerCreator', () => {
        let setup = setupWithField1AndField2({
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
        expect(() => enabler = setup.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler!.conditionType).toBe('TEST');
        expect(enabler!.category).toBe(ConditionCategory.Undetermined);
        expect(enabler!.evaluate(null, setup.vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Neither Config or Creator returns null', () => {
        let setup = setupWithField1AndField2({
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Both Config and Creator setup throws', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: { type: ConditionType.RequireText },
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
        expect(() => enabler = setup.inputValidator.ExposeEnabler()).toThrow(/both/);
    });
    test('EnablerCreator returns null throws', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: null,
            enablerCreator: (requestor) => null
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.inputValidator.ExposeEnabler()).toThrow(/instance/);
    });
});
describe('InputValidator.enabled', () => {
    test('Config.enabled = true, Enabled=true', () => {
        let setup = setupWithField1AndField2({
            enabled: true
        });

        expect(setup.inputValidator.enabled).toBe(true);
    });
    test('Config.enabled = false, Enabled=false', () => {
        let setup = setupWithField1AndField2({
            enabled: false
        });

        expect(setup.inputValidator.enabled).toBe(false);
    });
    test('Config.enabled = undefined, Enabled=true', () => {
        let setup = setupWithField1AndField2({
            enabled: undefined
        });

        expect(setup.inputValidator.enabled).toBe(true);
    });
    test('Config.enabled = function, Enabled= result of function', () => {
        let setup = setupWithField1AndField2({

            enabled: (iv: IInputValidator) => enabledForFn
        });

        let enabledForFn = true;
        expect(setup.inputValidator.enabled).toBe(true);
        enabledForFn = false;
        expect(setup.inputValidator.enabled).toBe(false);
    });

    test('Config.enabled = true but setEnabled sets it to false, Enabled=false', () => {
        let setup = setupWithField1AndField2({
            enabled: true
        });

        setup.inputValidator.setEnabled(false);
        expect(setup.inputValidator.enabled).toBe(false);
        setup.inputValidator.setEnabled(true);
        expect(setup.inputValidator.enabled).toBe(true);
    });    
});


describe('InputValidator.severity', () => {
    test('Config.severity = Error, severity=Error', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Error
        });

        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Config.severity = Warning, severity=Warning', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Warning
        });

        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
    });
    test('Config.severity = Severe, severity=Severe', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Severe
        });

        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
    test('Config.severity = Error but setSeverity sets it to Severe, severity = Severe', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Error
        });

        setup.inputValidator.setSeverity(ValidationSeverity.Severe);
        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
        setup.inputValidator.setSeverity(ValidationSeverity.Error);
        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });      
    test('Config.severity unassigned and setSeverity sets it to Severe, severity = Severe', () => {
        let setup = setupWithField1AndField2({
        });

        setup.inputValidator.setSeverity(ValidationSeverity.Severe);
        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });           
    test('Conditions that use severity=Severe when Config.severity = undefined', () => {
        function checkDefaultSeverity(conditionType: string, ) {
            let setup = setupWithField1AndField2({
                conditionConfig: {
                    type: conditionType
                },
                severity: undefined
            });
            registerAllConditions((setup.services.conditionFactory as ConditionFactory));

            expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
        }
        checkDefaultSeverity(ConditionType.RequireText);
        checkDefaultSeverity(ConditionType.DataTypeCheck);
        checkDefaultSeverity(ConditionType.RegExp);
        checkDefaultSeverity(ConditionType.NotNull);
    });
    test('Conditions that use severity=Error when Config.severity = undefined', () => {
        function checkDefaultSeverity(conditionType: string) {
            let setup = setupWithField1AndField2({
                conditionConfig: {
                    type: conditionType
                },
                severity: undefined
            });

            expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
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
    test('RangeCondition Config.severity = undefined, severity=Error', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: {
                type: ConditionType.Range
            },
            severity: undefined
        });

        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('AllMatchCondition Config.severity = undefined, severity=Error', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: {
                type: ConditionType.And
            },
            severity: undefined
        });

        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Config.severity = function, severity= result of function', () => {
        let setup = setupWithField1AndField2({
            severity: (iv: IInputValidator) => severityForFn
        });

        let severityForFn: ValidationSeverity = ValidationSeverity.Warning;
        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
        severityForFn = ValidationSeverity.Error;
        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
        severityForFn = ValidationSeverity.Severe;
        expect(setup.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
});

function setupForLocalization(activeCultureID: string): PublicifiedInputValidator {
    let setup = setupWithField1AndField2({
        errorMessage: 'EM-fallback',
        errorMessagel10n: 'EM',
        summaryMessage: 'SEM-fallback',
        summaryMessagel10n: 'SEM'
    });
    let tlService = setup.services.textLocalizerService as TextLocalizerService;
    tlService.register('EM', {
        'en': 'enErrorMessage',
        'es': 'esErrorMessage'
    });
    tlService.register('SEM', {
        'en': 'enSummaryMessage',
        'es': 'esSummaryMessage'
    });
    setup.services.activeCultureId = activeCultureID;
    return setup.inputValidator;
}
describe('InputValidator.getErrorMessageTemplate', () => {
    test('Config.errorMessage = string, return the same string', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Test',
        });

        expect(setup.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });

    test('Config.errorMessage = function, getErrorMessageTemplate= result of function', () => {
        let setup = setupWithField1AndField2({
            errorMessage: (iv: IInputValidator) => errorMessageForFn
        });

        let errorMessageForFn = 'Test';
        expect(setup.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });
    test('Config.errorMessage = function, throws when function returns null', () => {
        let setup = setupWithField1AndField2({
            errorMessage: (iv: IInputValidator) => null!
        });

        expect(() => setup.inputValidator.ExposeGetErrorMessageTemplate()).toThrow(/Config\.errorMessage/);
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
      
        let setup = setupWithField1AndField2({
            errorMessage: null,
            errorMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetErrorMessage is not used because errorMessage is supplied', () => {
      
        let setup = setupWithField1AndField2({
            errorMessage: 'supplied',
            errorMessagel10n: null,
        });

        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetErrorMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                type: ConditionType.DataTypeCheck
            },
            errorMessage: null,
            errorMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.dataType
        {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetErrorMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                type: ConditionType.DataTypeCheck
            },
            errorMessage: null,
            errorMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    }); 
    test('Config.errorMessage = string and setErrorMessage overrides without l10n, return the override', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Test',
        });
        setup.inputValidator.setErrorMessage('Test-Override');
        expect(setup.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test-Override');
    });    
    test('Config.errorMessage = string and setErrorMessage overrides without l10n, return the override', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Test',
        });
        let tls = setup.services.textLocalizerService as TextLocalizerService;
        tls.register('Testl10n',
            {
                '*': 'Localized Test'
            });        
    
        setup.inputValidator.setErrorMessage('Test-Override', 'Testl10n');
        expect(setup.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Localized Test');
    });
});
describe('InputValidator.GetSummaryMessageTemplate', () => {
    test('Config.summaryMessage = string, return the same string', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: 'Summary',
        });

        expect(setup.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Config.summaryMessage = null, return errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: null,
        });

        expect(setup.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Config.summaryMessage = undefined, return errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: undefined
        });

        expect(setup.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Config.summaryMessage = function, GetSummaryMessageTemplate= result of function', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IInputValidator) => summaryMessageForFn
        });

        let summaryMessageForFn = 'Summary';
        expect(setup.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Config.summaryMessage = function that returns null GetSummaryMessageTemplate = errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IInputValidator) => null!
        });

        expect(setup.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
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
      
        let setup = setupWithField1AndField2({
            summaryMessage: null,
            summaryMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetSummaryMessage is not used because summaryMessage is supplied', () => {
      
        let setup = setupWithField1AndField2({
            summaryMessage: 'supplied',
            summaryMessagel10n: null,
        });

        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetSummaryMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                type: ConditionType.DataTypeCheck
            },
            summaryMessage: null,
            summaryMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.dataType
        {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetSummaryMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                type: ConditionType.DataTypeCheck
            },
            summaryMessage: null,
            summaryMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    }); 

    test('Config.summaryMessage = string and setSummaryMessage overrides without l10n, return the override', () => {
        let setup = setupWithField1AndField2({
            summaryMessage: 'Test',
        });
        setup.inputValidator.setSummaryMessage('Test-Override');
        expect(setup.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Test-Override');
    });    
    test('Config.summaryMessage = string and setSummaryMessage overrides without l10n, return the override', () => {
        let setup = setupWithField1AndField2({
            summaryMessage: 'Test',
        });
        let tls = setup.services.textLocalizerService as TextLocalizerService;
        tls.register('Testl10n',
            {
                '*': 'Localized Test'
            });        
    
        setup.inputValidator.setSummaryMessage('Test-Override', 'Testl10n');
        expect(setup.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Localized Test');
    });    
});
// validate(group?: string): IssueFound | null
describe('InputValidator.validate', () => {

    test('No issue found. Returns ConditionEvaluateResult.Match', () => {
        let setup = setupWithField1AndField2();
        setup.valueHost1.setValue('valid');

        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = setup.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.issueFound).toBeNull();
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
    });
    function testSeverity(severity: ValidationSeverity): void {
        let setup = setupWithField1AndField2({
            severity: severity
        });
        setup.valueHost1.setValue('');   // will be invalid
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = setup.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.issueFound).not.toBeNull();
        expect(vrResult!.issueFound!.conditionType).toBe(ConditionType.RequireText);
        expect(vrResult!.issueFound!.severity).toBe(severity);
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.NoMatch);
    }
    test('Warning Issue found. Returns the issue with severity = warning', () => {
        testSeverity(ValidationSeverity.Warning);
    });
    test('Error Issue found. Returns the issue with severity = error', () => {
        testSeverity(ValidationSeverity.Error);
    });
    test('Severe Issue found. Returns the issue with severity = severe', () => {
        testSeverity(ValidationSeverity.Severe);
    });
    function testErrorMessages(errorMessage: string | ((host: IInputValidator) => string),
        summaryMessage: string | ((host: IInputValidator) => string) | null,
        expectedErrorMessage: string, expectedSummaryMessage: string): void {
        let setup = setupWithField1AndField2({
            errorMessage: errorMessage,
            summaryMessage: summaryMessage,
        });
        setup.valueHost1.setValue('');   // will be an issue
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = setup.inputValidator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.issueFound).not.toBeNull();

        let issueFound = vrResult!.issueFound;
        expect(issueFound!.conditionType).toBe(ConditionType.RequireText);
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
    function testConditionHasIssueButDisabledReturnsNull(configChanges: Partial<InputValidatorConfig>): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result        
        setup.valueHost1.setValue('');   // will be invalid
        setup.valueHost2.setValueToUndefined();   // for use by Enabler to be invalid
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = setup.inputValidator.validate({})).not.toThrow();
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
            enablerConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText,
                valueHostName: 'Field2'
            }
        });
    });
    test('Issue exists. Enabler = Undetermined. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            enablerConfig: <ConditionConfig>{
                // the input value is '', which causes this condition to return Undetermined
                type: IsUndeterminedConditionType, valueHostName: 'Field2'
            }
        });
    });
    function testConditionHasIssueAndBlockingCheckPermitsValidation(configChanges: Partial<InputValidatorConfig>,
        validateOptions: ValidateOptions, logCount: number, issueExpected: boolean = true): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        setup.valueHost1.setValue('');   // will be invalid
        setup.valueHost2.setValue('ABC');   // for use by Enabler to enable the condition
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = setup.inputValidator.validate(validateOptions)).not.toThrow();
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
            enablerConfig: <RequireTextConditionConfig>{
                // the input value is 'ABC', which causes this condition to return Match
                type: ConditionType.RequireText, valueHostName: 'Field2'
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
            conditionConfig: {
                type: NeverMatchesConditionType
            }
        }, { duringEdit: true }, 2, false);
    });
    test('Issue exists and NeverMatchCondition is run because IValidateOption.DuringEdit = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            conditionConfig: {
                type: NeverMatchesConditionType
            }
        }, { duringEdit: false }, 3, true);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.Preliminary = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { preliminary: false }, 3, true);
    });
    function testDuringEditIsTrue(configChanges: Partial<InputValidatorConfig>,
        inputValue: string, 
        logCount: number, issueExpected: boolean = true): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        setup.valueHost1.setInputValue(inputValue);   // for RequireTextCondition.evaluateDuringEdit
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = setup.inputValidator.validate({ duringEdit: true})).not.toThrow();
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
        let setup = setupWithField1AndField2({
            conditionConfig: { type: ThrowsExceptionConditionType }
        });

        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = setup.inputValidator.validate({})).not.toThrow();
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

        let config: InputValidatorConfig = {
            conditionConfig: null,
            conditionCreator: (requestor) => {
                return new ConditionWithPromiseTester(result,
                    delay, error);
            },
            errorMessage: 'Local',
            summaryMessage: 'Summary'
        };

        let testItem = new InputValidator(vh, config);
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
    test('RequireTextCondition supplies its ValueHostName', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>
                { type: ConditionType.RequireText, valueHostName: 'Property1' },
        });
        let collection = new Set<ValueHostName>();
        expect(() => setup.inputValidator.gatherValueHostNames(collection, setup.vm)).not.toThrow();
        expect(collection.size).toBe(1);
        expect(collection.has('Property1')).toBe(true);
    });
});

describe('getValuesForTokens', () => {
    test('RequireTextCondition returns 2 tokens: Label and Value', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText,
                valueHostName: null
            }
        });
        setup.valueHost1.setInputValue('Value1');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = setup.inputValidator.getValuesForTokens(setup.valueHost1, setup.vm)).not.toThrow();
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
        let setup = setupWithField1AndField2({
            conditionConfig: <RangeConditionConfig>{
                type: ConditionType.Range, valueHostName: null,
                minimum: 'A',
                maximum: 'Z'
            }
        });
        (setup.services.conditionFactory as ConditionFactory).register<RangeConditionConfig>(
            ConditionType.RegExp, (config) => new RangeCondition(config));                
        setup.valueHost1.setInputValue('C');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = setup.inputValidator.getValuesForTokens(setup.valueHost1, setup.vm)).not.toThrow();
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
        const config: InputValidatorConfig = {
            conditionConfig: <RequireTextConditionConfig>{
                type: ConditionType.RequireText,
                valueHostName: 'Field1'
            },
            errorMessage: 'Local',
            summaryMessage: 'Summary'
        };
        let testItem = new InputValidatorFactory();
        let created: IInputValidator | null = null;
        expect(() => created = testItem.create(vh, config)).not.toThrow();
        expect(created).not.toBeNull();
        expect(created).toBeInstanceOf(InputValidator);
    });
});