import {
    type RangeConditionConfig,
    RequireTextCondition, EqualToCondition,
    type RequireTextConditionConfig, 
    RangeCondition,
    EqualToConditionConfig, 
    
} from "../../src/Conditions/ConcreteConditions";

import { Validator, ValidatorFactory } from "../../src/Validation/Validator";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { IMessageTokenSource, toIMessageTokenSource, type TokenLabelAndValue } from "../../src/Interfaces/MessageTokenSource";
import type { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { MockValidationManager, MockValidationServices, MockInputValueHost, MockCapturingLogger } from "../TestSupport/mocks";
import { IValueHostResolver, IValueHostsManager } from '../../src/Interfaces/ValueHostResolver';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { type ICondition, ConditionEvaluateResult, ConditionCategory, ConditionConfig } from '../../src/Interfaces/Conditions';
import { IInputValueHost } from '../../src/Interfaces/InputValueHost';
import { ValidationSeverity, ValidateOptions } from '../../src/Interfaces/Validation';
import { ValidatorValidateResult, IValidator, ValidatorConfig } from '../../src/Interfaces/Validator';
import { TextLocalizerService } from '../../src/Services/TextLocalizerService';
import { IValueHost } from '../../src/Interfaces/ValueHost';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { registerAllConditions } from "../TestSupport/createValidationServices";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { IsUndeterminedConditionType, NeverMatchesConditionType, ThrowsExceptionConditionType } from "../TestSupport/conditionsForTesting";
import { InputValueHost } from "../../src/ValueHosts/InputValueHost";

// subclass of Validator to expose many of its protected members so they
// can be individually tested
class PublicifiedValidator extends Validator {
    public ExposeConfig(): ValidatorConfig {
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
 * Returns an Validator (PublicifiedValidator subclass) ready for testing.
 * The returned ValidationManager includes two InputValueHosts with IDs "Field1" and "Field2".
 * @param config - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * ConditionConfig - RequireTextConditiontType, ValueHostName: null
 * errorMessage: 'Local'
 * summaryMessage: 'Summary'
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, two ValueHosts, the complete Config,
 * and the Validator.
 */
function setupWithField1AndField2(config?: Partial<ValidatorConfig>): {
    vm: MockValidationManager,
    services: MockValidationServices,
    valueHost1: MockInputValueHost,
    valueHost2: MockInputValueHost,
    config: ValidatorConfig,
    validator: PublicifiedValidator
} {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let vh = vm.addInputValueHost('Field1', LookupKey.String, 'Label1');
    let vh2 = vm.addInputValueHost('Field2', LookupKey.String, 'Label2');
    const defaultConfig: ValidatorConfig = {
        conditionConfig: <RequireTextConditionConfig>
            { conditionType: ConditionType.RequireText, valueHostName: 'Field1' },
        errorMessage: 'Local',
        summaryMessage: 'Summary'
    };

    let updatedConfig: ValidatorConfig = (!config) ?
        defaultConfig :
        { ...defaultConfig, ...config };

    let testItem = new PublicifiedValidator(vh, updatedConfig);
    return {
        vm: vm,
        services: services,
        valueHost1: vh,
        valueHost2: vh2,
        config: updatedConfig,
        validator: testItem
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
// constructor(valueHost: IInputValueHost, config: ValidatorConfig)
describe('Validator.constructor and initial property values', () => {
    test('valueHost parameter null throws', () => {
        let config: ValidatorConfig = {
            conditionConfig: { conditionType: '' },
            errorMessage: ''
        };
        expect(() => new Validator(null!, config)).toThrow(/valueHost/);
    });
    test('config parameter null throws', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = new MockInputValueHost(vm, '', '',);
        expect(() => new Validator(vh, null!)).toThrow(/config/);
    });
    test('Valid parameters create and setup supporting properties', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { conditionType: '' },
        });
        expect(setup.validator.ExposeConfig()).toBe(setup.config);
        expect(setup.validator.ExposeValidationManager()).toBe(setup.vm);
        expect(()=>setup.validator.errorCode).toThrow();   // because errorCode is undefined and type=''
    });
});
describe('errorCode', () => {
    test('Value assigned is returned regardless of ConditionType', () => {
        let setup = setupWithField1AndField2({
            errorCode: 'TEST',
            conditionConfig: { conditionType: ConditionType.RequireText },
        });
        expect(setup.validator.errorCode).toBe('TEST');
    });
    test('Value assigned with whitespace is returned trimmed regardless of ConditionType', () => {
        let setup = setupWithField1AndField2({
            errorCode: ' TEST ',
            conditionConfig: { conditionType: ConditionType.RequireText },
        });
        expect(setup.validator.errorCode).toBe('TEST');
    });    
    test('Value empty string returns ConditionType', () => {
        let setup = setupWithField1AndField2({
            errorCode: '',
            conditionConfig: { conditionType: ConditionType.RequireText },
        });
        expect(setup.validator.errorCode).toBe(ConditionType.RequireText);
    });    
    test('Value undefined returns ConditionType', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { conditionType: ConditionType.RequireText },
        });
        expect(setup.validator.errorCode).toBe(ConditionType.RequireText);
    });   
    /* Couldn't find a way to set this up as omitted and unknown types both throw exceptions.
    test('Value undefined and same with conditiontype returns"UNKNOWN"', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { conditionType: '' },
        });
        
        expect(setup.validator.errorCode).toBe(ConditionType.Unknown);
    });     
    */
});
describe('Validator.condition', () => {
    test('Successful creation of RequireTextCondition using ConditionConfig', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>
                { conditionType: ConditionType.RequireText, valueHostName: null },
        });

        let condition: ICondition | null = null;
        expect(() => condition = setup.validator.condition).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequireTextCondition);
    });
    test('Attempt to create Condition with ConditionConfig with invalid type throws', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { conditionType: 'UnknownType' },
        });

        let condition: ICondition | null = null;
        expect(() => condition = setup.validator.condition).toThrow(/not supported/);
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
        expect(() => condition = setup.validator.condition).not.toThrow();
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
        expect(() => condition = setup.validator.condition).toThrow(/setup/);
    });
    test('Both Config and Creator setup throws', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { conditionType: ConditionType.RequireText },
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
        expect(() => condition = setup.validator.condition).toThrow(/both/);
    });
    test('ConditionCreator returns null throws', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: null,
            conditionCreator: (requestor) => null
        });

        let condition: ICondition | null = null;
        expect(() => condition = setup.validator.condition).toThrow(/instance/);
    });
});
describe('Validator.enabler', () => {
    test('ValidatorConfig has no Enabler assigned sets Enabler to null', () => {
        let setup = setupWithField1AndField2({});

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Successful creation of EqualToCondition', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo,
                valueHostName: null
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler).toBeInstanceOf(EqualToCondition);
    });
    test('Attempt to create Enabler with invalid type throws', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: {
                conditionType: 'UnknownType'
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.ExposeEnabler()).toThrow(/not supported/);
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
        expect(() => enabler = setup.validator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler!.conditionType).toBe('TEST');
        expect(enabler!.category).toBe(ConditionCategory.Undetermined);
        expect(enabler!.evaluate(null, setup.vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Neither Config or Creator returns null', () => {
        let setup = setupWithField1AndField2({
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Both Config and Creator setup throws', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: { conditionType: ConditionType.RequireText },
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
        expect(() => enabler = setup.validator.ExposeEnabler()).toThrow(/both/);
    });
    test('EnablerCreator returns null throws', () => {
        let setup = setupWithField1AndField2({
            enablerConfig: null,
            enablerCreator: (requestor) => null
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.ExposeEnabler()).toThrow(/instance/);
    });
});
describe('Validator.enabled', () => {
    test('Config.enabled = true, Enabled=true', () => {
        let setup = setupWithField1AndField2({
            enabled: true
        });

        expect(setup.validator.enabled).toBe(true);
    });
    test('Config.enabled = false, Enabled=false', () => {
        let setup = setupWithField1AndField2({
            enabled: false
        });

        expect(setup.validator.enabled).toBe(false);
    });
    test('Config.enabled = undefined, Enabled=true', () => {
        let setup = setupWithField1AndField2({
            enabled: undefined
        });

        expect(setup.validator.enabled).toBe(true);
    });
    test('Config.enabled = function, Enabled= result of function', () => {
        let setup = setupWithField1AndField2({

            enabled: (iv: IValidator) => enabledForFn
        });

        let enabledForFn = true;
        expect(setup.validator.enabled).toBe(true);
        enabledForFn = false;
        expect(setup.validator.enabled).toBe(false);
    });

    test('Config.enabled = true but setEnabled sets it to false, Enabled=false', () => {
        let setup = setupWithField1AndField2({
            enabled: true
        });

        setup.validator.setEnabled(false);
        expect(setup.validator.enabled).toBe(false);
        setup.validator.setEnabled(true);
        expect(setup.validator.enabled).toBe(true);
    });    
});


describe('Validator.severity', () => {
    test('Config.severity = Error, severity=Error', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Error
        });

        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Config.severity = Warning, severity=Warning', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Warning
        });

        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
    });
    test('Config.severity = Severe, severity=Severe', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Severe
        });

        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
    test('Config.severity = Error but setSeverity sets it to Severe, severity = Severe', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Error
        });

        setup.validator.setSeverity(ValidationSeverity.Severe);
        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
        setup.validator.setSeverity(ValidationSeverity.Error);
        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });      
    test('Config.severity unassigned and setSeverity sets it to Severe, severity = Severe', () => {
        let setup = setupWithField1AndField2({
        });

        setup.validator.setSeverity(ValidationSeverity.Severe);
        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });           
    test('Conditions that use severity=Severe when Config.severity = undefined', () => {
        function checkDefaultSeverity(conditionType: string, ) {
            let setup = setupWithField1AndField2({
                conditionConfig: {
                    conditionType: conditionType
                },
                severity: undefined
            });
            registerAllConditions((setup.services.conditionFactory as ConditionFactory));

            expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
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
                    conditionType: conditionType
                },
                severity: undefined
            });

            expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Error);
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
                conditionType: ConditionType.Range
            },
            severity: undefined
        });

        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('AllMatchCondition Config.severity = undefined, severity=Error', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.And
            },
            severity: undefined
        });

        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Config.severity = function, severity= result of function', () => {
        let setup = setupWithField1AndField2({
            severity: (iv: IValidator) => severityForFn
        });

        let severityForFn: ValidationSeverity = ValidationSeverity.Warning;
        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
        severityForFn = ValidationSeverity.Error;
        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Error);
        severityForFn = ValidationSeverity.Severe;
        expect(setup.validator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
});

function setupForLocalization(activeCultureID: string): PublicifiedValidator {
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
    return setup.validator;
}
describe('Validator.getErrorMessageTemplate', () => {
    test('Config.errorMessage = string, return the same string', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Test',
        });

        expect(setup.validator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });

    test('Config.errorMessage = function, getErrorMessageTemplate= result of function', () => {
        let setup = setupWithField1AndField2({
            errorMessage: (iv: IValidator) => errorMessageForFn
        });

        let errorMessageForFn = 'Test';
        expect(setup.validator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });
    test('Config.errorMessage = function, throws when function returns null', () => {
        let setup = setupWithField1AndField2({
            errorMessage: (iv: IValidator) => null!
        });

        expect(() => setup.validator.ExposeGetErrorMessageTemplate()).toThrow(/Config\.errorMessage/);
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
        let testItem = setup.validator;
    
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
        let testItem = setup.validator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetErrorMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: null,
            errorMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.dataType
        {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.validator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetErrorMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
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
        let testItem = setup.validator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    }); 
    test('Config.errorMessage = string and setErrorMessage overrides without l10n, return the override', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Test',
        });
        setup.validator.setErrorMessage('Test-Override');
        expect(setup.validator.ExposeGetErrorMessageTemplate()).toBe('Test-Override');
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
    
        setup.validator.setErrorMessage('Test-Override', 'Testl10n');
        expect(setup.validator.ExposeGetErrorMessageTemplate()).toBe('Localized Test');
    });
});
describe('Validator.GetSummaryMessageTemplate', () => {
    test('Config.summaryMessage = string, return the same string', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: 'Summary',
        });

        expect(setup.validator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Config.summaryMessage = null, return errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: null,
        });

        expect(setup.validator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Config.summaryMessage = undefined, return errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: undefined
        });

        expect(setup.validator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Config.summaryMessage = function, GetSummaryMessageTemplate= result of function', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IValidator) => summaryMessageForFn
        });

        let summaryMessageForFn = 'Summary';
        expect(setup.validator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Config.summaryMessage = function that returns null GetSummaryMessageTemplate = errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IValidator) => null!
        });

        expect(setup.validator.ExposeGetSummaryMessageTemplate()).toBe('Local');
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
        let testItem = setup.validator;
    
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
        let testItem = setup.validator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetSummaryMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
            },
            summaryMessage: null,
            summaryMessagel10n: null,
        });
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.dataType
        {
            '*': 'Default Error Message'
        });
        setup.services.activeCultureId = 'en';
        let testItem = setup.validator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetSummaryMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
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
        let testItem = setup.validator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    }); 

    test('Config.summaryMessage = string and setSummaryMessage overrides without l10n, return the override', () => {
        let setup = setupWithField1AndField2({
            summaryMessage: 'Test',
        });
        setup.validator.setSummaryMessage('Test-Override');
        expect(setup.validator.ExposeGetSummaryMessageTemplate()).toBe('Test-Override');
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
    
        setup.validator.setSummaryMessage('Test-Override', 'Testl10n');
        expect(setup.validator.ExposeGetSummaryMessageTemplate()).toBe('Localized Test');
    });    
});
// validate(group?: string): IssueFound | null
describe('Validator.validate', () => {

    test('No issue found. Returns ConditionEvaluateResult.Match', () => {
        let setup = setupWithField1AndField2();
        setup.valueHost1.setValue('valid');

        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
        expect(vrResult!.issueFound).toBeNull();
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
    });
    function testSeverity(severity: ValidationSeverity): void {
        let setup = setupWithField1AndField2({
            severity: severity
        });
        setup.valueHost1.setValue('');   // will be invalid
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
        expect(vrResult!.issueFound).not.toBeNull();
        expect(vrResult!.issueFound!.errorCode).toBe(ConditionType.RequireText);
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
    function testErrorMessages(errorMessage: string | ((host: IValidator) => string),
        summaryMessage: string | ((host: IValidator) => string) | null,
        expectedErrorMessage: string, expectedSummaryMessage: string): void {
        let setup = setupWithField1AndField2({
            errorMessage: errorMessage,
            summaryMessage: summaryMessage,
        });
        setup.valueHost1.setValue('');   // will be an issue
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
        expect(vrResult!.issueFound).not.toBeNull();

        let issueFound = vrResult!.issueFound;
        expect(issueFound!.errorCode).toBe(ConditionType.RequireText);
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
    function testConditionHasIssueButDisabledReturnsNull(configChanges: Partial<ValidatorConfig>): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result        
        setup.valueHost1.setValue('');   // will be invalid
        setup.valueHost2.setValueToUndefined();   // for use by Enabler to be invalid
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
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
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            }
        });
    });
    test('Issue exists. Enabler = Undetermined. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            enablerConfig: <ConditionConfig>{
                // the input value is '', which causes this condition to return Undetermined
                conditionType: IsUndeterminedConditionType, valueHostName: 'Field2'
            }
        });
    });
    function testConditionHasIssueAndBlockingCheckPermitsValidation(configChanges: Partial<ValidatorConfig>,
        validateOptions: ValidateOptions, logCount: number, issueExpected: boolean = true): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        setup.valueHost1.setValue('');   // will be invalid
        setup.valueHost2.setValue('ABC');   // for use by Enabler to enable the condition
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate(validateOptions)).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
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
                conditionType: ConditionType.RequireText, valueHostName: 'Field2'
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
                conditionType: NeverMatchesConditionType
            }
        }, { duringEdit: true }, 2, false);
    });
    test('Issue exists and NeverMatchCondition is run because IValidateOption.DuringEdit = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            conditionConfig: {
                conditionType: NeverMatchesConditionType
            }
        }, { duringEdit: false }, 3, true);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.Preliminary = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { preliminary: false }, 3, true);
    });
    function testDuringEditIsTrue(configChanges: Partial<ValidatorConfig>,
        inputValue: string, 
        logCount: number, issueExpected: boolean = true): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        setup.valueHost1.setInputValue(inputValue);   // for RequireTextCondition.evaluateDuringEdit
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({ duringEdit: true})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
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
            conditionConfig: { conditionType: ThrowsExceptionConditionType }
        });

        let logger = setup.services.loggerService as MockCapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
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
        testItem: Validator
    } {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Field1', LookupKey.String, 'Field 1');

        let config: ValidatorConfig = {
            conditionConfig: null,
            conditionCreator: (requestor) => {
                return new ConditionWithPromiseTester(result,
                    delay, error);
            },
            errorMessage: 'Local',
            summaryMessage: 'Summary'
        };

        let testItem = new Validator(vh, config);
        return {
            vm: vm,
            services: services,
            vh: vh,
            testItem: testItem
        };
    }

    test('Condition using Promise to evaluate as Match results in ValidatorValidateResult setup as Match with no IssuesFound', async () => {
        let setup = setupPromiseTest(ConditionEvaluateResult.Match, 0);
        let result = await setup.testItem.validate({});
        expect(result).toEqual({
            conditionEvaluateResult: ConditionEvaluateResult.Match,
            issueFound: null
        });
    });
    test('With delay, Condition using Promise to evaluate as Match results in ValidatorValidateResult setup as Match with no IssuesFound',
        async () => {
            let setup = setupPromiseTest(ConditionEvaluateResult.Match, 100);
            let result = await setup.testItem.validate({});
            expect(result).toEqual({
                conditionEvaluateResult: ConditionEvaluateResult.Match,
                issueFound: null
            });
        });
    test('Condition using Promise to evaluate as NoMatch results in ValidatorValidateResult setup as Match with 1 IssueFound',
        async () => {
            let setup = setupPromiseTest(ConditionEvaluateResult.NoMatch, 0);
            let result = await setup.testItem.validate({});
            expect(result).toEqual(<ValidatorValidateResult>{
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                issueFound: {
                    errorCode: 'TEST',
                    errorMessage: 'Local',
                    summaryMessage: 'Summary',
                    severity: ValidationSeverity.Error,
                    valueHostName: 'Field1'
                }
            });
        });
    test('Condition using Promise to evaluate as Undetermined results in ValidatorValidateResult setup as Undetermined with no IssuesFound',
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
describe('Validator.gatherValueHostNames', () => {
    test('RequireTextCondition supplies its ValueHostName', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>
                { conditionType: ConditionType.RequireText, valueHostName: 'Property1' },
        });
        let collection = new Set<ValueHostName>();
        expect(() => setup.validator.gatherValueHostNames(collection, setup.vm)).not.toThrow();
        expect(collection.size).toBe(1);
        expect(collection.has('Property1')).toBe(true);
    });
});

describe('getValuesForTokens', () => {
    test('RequireTextCondition returns 2 tokens: Label and Value', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: null
            }
        });
        setup.valueHost1.setInputValue('Value1');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = setup.validator.getValuesForTokens(setup.valueHost1, setup.vm)).not.toThrow();
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
                conditionType: ConditionType.Range, valueHostName: null,
                minimum: 'A',
                maximum: 'Z'
            }
        });
        (setup.services.conditionFactory as ConditionFactory).register<RangeConditionConfig>(
            ConditionType.RegExp, (config) => new RangeCondition(config));                
        setup.valueHost1.setInputValue('C');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = setup.validator.getValuesForTokens(setup.valueHost1, setup.vm)).not.toThrow();
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

describe('ValidatorFactory.create', () => {
    function setupValidatorFactory(): {
        vm: MockValidationManager,
        vh: MockInputValueHost,
        validatorConfig: ValidatorConfig,
        factory: ValidatorFactory
    }
    {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addInputValueHost('Field1', LookupKey.String, 'Label1');
        const config: ValidatorConfig = {
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field1'
            },
            errorMessage: 'Local',
            summaryMessage: 'Summary'
        };
        let factory = new ValidatorFactory();
        return {
            vm: vm,
            vh: vh,
            validatorConfig: config,
            factory: factory
        }
    }
    class TestValidator extends Validator
    {
        constructor(valueHost: IInputValueHost, validatorConfig: ValidatorConfig)
        {
            super(valueHost, validatorConfig);
        }
    }
    test('ValidatorConfig.validatorType = undefined returns a Validator', () => {
        let setup = setupValidatorFactory();
        let testItem = setup.factory;
        let created: IValidator | null = null;
        expect(() => created = testItem.create(setup.vh, setup.validatorConfig)).not.toThrow();
        expect(created).not.toBeNull();
        expect(created).toBeInstanceOf(Validator);
    });
    test('ValidatorConfig.validatorType = null returns a Validator', () => {
        let setup = setupValidatorFactory();
        setup.validatorConfig.validatorType = null!;
        let testItem = setup.factory;
        let created: IValidator | null = null;
        expect(() => created = testItem.create(setup.vh, setup.validatorConfig)).not.toThrow();
        expect(created).not.toBeNull();
        expect(created).toBeInstanceOf(Validator);
    });    
    test('ValidatorConfig.validatorType non null and nothing matching registered throws', () => {
        let setup = setupValidatorFactory();
        setup.validatorConfig.validatorType = 'TEST';
        let testItem = setup.factory;
        let created: IValidator | null = null;
        expect(() => created = testItem.create(setup.vh, setup.validatorConfig)).toThrow(/not supported/);
    });    
    test('Register new Validator and confirm it gets created returns that class', () => {
        let setup = setupValidatorFactory();
        setup.validatorConfig.validatorType = 'TEST';
        let testItem = setup.factory;
        expect(testItem.isRegistered('TEST')).toBe(false);
        testItem.register('TEST', (config) => new TestValidator(setup.vh, config));
        let created: IValidator | null = null;
        expect(() => created = testItem.create(setup.vh, setup.validatorConfig)).not.toThrow();
        expect(created).not.toBeNull();
        expect(created).toBeInstanceOf(TestValidator);
    });        
});

describe('toIMessageTokenSource', () => {
    test('Valid object with getValuesForTokens=null returns it', () => {
        let test: IMessageTokenSource = {
            getValuesForTokens: null!
        };
        expect(toIMessageTokenSource(test)).toBe(test);
    });
    test('Valid object with getValuesForTokens assigned returns it', () => {
        let test: IMessageTokenSource = {
            getValuesForTokens: (vh: IInputValueHost, vhr: IValueHostResolver) => []
        };
        expect(toIMessageTokenSource(test)).toBe(test);
    });    
    test('Invalid object returns null', () => {
        expect(toIMessageTokenSource({})).toBeNull();
        expect(toIMessageTokenSource({ GETValuesForTokens: null })).toBeNull();        
    });    
});
