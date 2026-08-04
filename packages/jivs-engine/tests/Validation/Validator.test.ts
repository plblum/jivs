import {
    type RangeConditionConfig,
    RequireTextCondition, EqualToCondition,
    type RequireTextConditionConfig,
    RangeCondition,
    EqualToConditionConfig,

} from "../../src/Conditions/ConcreteConditions";

import { Validator, ValidatorFactory, highestSeverity } from "../../src/Validation/Validator";
import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { IMessageTokenSource, toIMessageTokenSource, type TokenLabelAndValue } from "../../src/Interfaces/MessageTokenSource";
import type { IJivsServices } from "../../src/Interfaces/JivsServices";
import { MockValueHostsManager, MockJivsServices, MockFieldValueHost } from "../TestSupport/mocks";
import { IValueHostResolver } from '../../src/Interfaces/ValueHostResolver';
import { ValueHostName } from '../../src/DataTypes/BasicTypes';
import { type ICondition, ConditionEvaluateResult, ConditionCategory, ConditionConfig } from '../../src/Interfaces/Conditions';
import { IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { ValidationSeverity, ValidateOptions, IssueFound } from '../../src/Interfaces/Validation';
import { ValidatorValidateResult, IValidator, ValidatorConfig } from '../../src/Interfaces/Validator';
import { TextLocalizerService } from '../../src/Services/TextLocalizerService';
import { IValueHost } from '../../src/Interfaces/ValueHost';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { registerAllConditions } from "../../src/Support/createJivsServicesForTesting";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { AlwaysMatchesConditionType, IsUndeterminedConditionType, NeverMatchesConditionType, ThrowsExceptionConditionType } from "../../src/Support/conditionsForTesting";
import { CapturingLogger } from "../../src/Support/CapturingLogger";
import { IValidatorsValueHostBase } from "../../src/Interfaces/ValidatorsValueHostBase";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { IDisposable } from "../../src/Interfaces/General_Purpose";
import { WhenConditionConfig } from "../../src/Conditions/WhenCondition";


// subclass of Validator to expose many of its protected members so they
// can be individually tested
class PublicifiedValidator extends Validator {
    public exposeConfig(): ValidatorConfig {
        return this.config;
    }
    public exposeServices(): IJivsServices {
        return this.services;
    }
    public exposeValueHostsManager(): IValueHostsManager {
        return this.valueHostsManager;
    }
    public exposeValueHost(): IValidatorsValueHostBase {
        return this.valueHost;
    }

    public exposeEnabler(): ICondition | null {
        return this.enabler;
    }
    public exposeSeverity(): ValidationSeverity {
        return this.severity;
    }
    public exposeGetErrorMessageTemplate(): string {
        return this.getErrorMessageTemplate();
    }
    public exposeGetSummaryMessageTemplate(): string {
        return this.getSummaryMessageTemplate();
    }
}
/**
 * Returns an Validator (PublicifiedValidator subclass) ready for testing.
 * The returned ValueHostsManager includes two FieldValueHosts with IDs "Field1" and "Field2".
 * @param config - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * ConditionConfig - RequireTextConditiontType, ValueHostName: null
 * errorMessage: 'Local'
 * summaryMessage: 'Summary'
 * @returns An object with all of the parts that were setup including 
 * ValueHostsManager, Services, two ValueHosts, the complete Config,
 * and the Validator.
 */
function setupWithField1AndField2(config?: Partial<ValidatorConfig>,
    defaultCultureId: string = 'en'
): {
    vhm: MockValueHostsManager,
    services: MockJivsServices,
    valueHost1: MockFieldValueHost,
    valueHost2: MockFieldValueHost,
    config: ValidatorConfig,
    validator: PublicifiedValidator
} {
    let services = new MockJivsServices(true, true, defaultCultureId);
    let vhm = new MockValueHostsManager(services);
    let vh = vhm.addMockFieldValueHost('Field1', LookupKey.String, 'Label1');
    let vh2 = vhm.addMockFieldValueHost('Field2', LookupKey.String, 'Label2');
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
        vhm: vhm,
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
// constructor(valueHost: IFieldValueHost, config: ValidatorConfig)
describe('Validator.constructor and initial property values', () => {
    test('valueHost parameter null throws', () => {
        let config: ValidatorConfig = {
            conditionConfig: { conditionType: '' },
            errorMessage: ''
        };
        expect(() => new Validator(null!, config)).toThrow(/valueHost/);
    });
    test('config parameter null throws', () => {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = new MockFieldValueHost(vhm, '', '',);
        expect(() => new Validator(vh, null!)).toThrow(/config/);
    });
    test('Valid parameters create and setup supporting properties', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { conditionType: '' },
        });
        expect(setup.validator.exposeConfig()).toBe(setup.config);
        expect(setup.validator.exposeValueHostsManager()).toBe(setup.vhm);
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
        expect(() => condition = setup.validator.condition).toThrow(/not registered/);
    });
    test('Successful creation using ConditionCreator', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: null,   // because the Setup function provides a default
            conditionCreator: (requestor) => {
                return {
                    conditionType: 'TEST',
                    evaluate: (valueHost, valueHostsManager) => {
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
        expect(condition!.evaluate(null, setup.vhm)).toBe(ConditionEvaluateResult.Match);
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
                    evaluate: (valueHost, valueHostsManager) => {
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
//NOTE: Enabler is setup by using WhenCondition as the top level condition.    
    test('ValidatorConfig has no Enabler assigned sets Enabler to null', () => {
        let setup = setupWithField1AndField2({});

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.exposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Successful creation of EqualToCondition', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                whenToEnableConfig: <EqualToConditionConfig>{
                    conditionType: ConditionType.EqualTo,
                    valueHostName: null
                },
                thenConfig: {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
            }            

        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.exposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler).toBeInstanceOf(EqualToCondition);
    });
    test('Attempt to create Enabler with invalid type logs and replaces the condition with ErrorResponseCondition', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                whenToEnableConfig: {
                    conditionType: 'UnknownType'
                },
                thenConfig: {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
            }            
        });

        expect(() => setup.validator.exposeEnabler()).toThrow(/ConditionType/);

        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('UnknownType', LoggingLevel.Error, null)).toBeTruthy();
    });
    test('Attempt to create WhenCondition child condition with invalid type logs, throws, and replaces the condition with ErrorResponseCondition', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                whenToEnableConfig: {
                    conditionType: AlwaysMatchesConditionType
                },
                thenConfig: {
                    conditionType:  'UnknownType'
                }
            }            
        });
        let child: ICondition | null = null;
        expect(() => child = setup.validator.condition).toThrow(/ConditionType/);

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.exposeEnabler()).not.toThrow();
        expect(enabler).toBeNull(); // because of the error
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('UnknownType', LoggingLevel.Error, null)).toBeTruthy();
    });    

    test('Not using WhenCondition sets enabler to null', () => {
        let setup = setupWithField1AndField2({
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = setup.validator.exposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
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

        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Config.severity = Warning, severity=Warning', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Warning
        });

        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Warning);
    });
    test('Config.severity = Severe, severity=Severe', () => {
        let setup = setupWithField1AndField2({
            severity: ValidationSeverity.Severe
        });

        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Severe);
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

            expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Severe);
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

            expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Error);
        }
        checkDefaultSeverity(ConditionType.Range);
        checkDefaultSeverity(ConditionType.StringLength);
        checkDefaultSeverity(ConditionType.EqualTo);
        checkDefaultSeverity(ConditionType.NotEqualTo);
        checkDefaultSeverity(ConditionType.GreaterThan);
        checkDefaultSeverity(ConditionType.GreaterThanOrEqual);
        checkDefaultSeverity(ConditionType.LessThan);
        checkDefaultSeverity(ConditionType.LessThanOrEqual);
        checkDefaultSeverity(ConditionType.All);
        checkDefaultSeverity(ConditionType.Any);
        checkDefaultSeverity(ConditionType.CountMatches);

    });
    test('RangeCondition Config.severity = undefined, severity=Error', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.Range
            },
            severity: undefined
        });

        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('AllMatchCondition Config.severity = undefined, severity=Error', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.All
            },
            severity: undefined
        });

        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Config.severity = function, severity= result of function', () => {
        let setup = setupWithField1AndField2({
            severity: (iv: IValidator) => severityForFn
        });

        let severityForFn: ValidationSeverity = ValidationSeverity.Warning;
        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Warning);
        severityForFn = ValidationSeverity.Error;
        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Error);
        severityForFn = ValidationSeverity.Severe;
        expect(setup.validator.exposeSeverity()).toBe(ValidationSeverity.Severe);
    });
});

function setupForLocalization(activeCultureID: string): PublicifiedValidator {
    let setup = setupWithField1AndField2({
        errorMessage: 'EM-fallback',
        errorMessagel10n: 'EM',
        summaryMessage: 'SEM-fallback',
        summaryMessagel10n: 'SEM'
    }, activeCultureID);
    let tlService = setup.services.textLocalizerService as TextLocalizerService;
    tlService.register('EM', {
        'en': 'enErrorMessage',
        'es': 'esErrorMessage'
    });
    tlService.register('SEM', {
        'en': 'enSummaryMessage',
        'es': 'esSummaryMessage'
    });
    return setup.validator;
}
describe('Validator.getErrorMessageTemplate', () => {
    test('Config.errorMessage = string, return the same string', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Test',
        });

        expect(setup.validator.exposeGetErrorMessageTemplate()).toBe('Test');
    });

    test('Config.errorMessage = function, getErrorMessageTemplate= result of function', () => {
        let setup = setupWithField1AndField2({
            errorMessage: (iv: IValidator) => errorMessageForFn
        });

        let errorMessageForFn = 'Test';
        expect(setup.validator.exposeGetErrorMessageTemplate()).toBe('Test');
    });
    test('Config.errorMessage = function, throws when function returns static error message', () => {
        let setup = setupWithField1AndField2({
            errorMessage: (iv: IValidator) => null!
        });

        expect(setup.validator.exposeGetErrorMessageTemplate()).toBe(Validator.errorMessageMissing);
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en', () => {
        let testItem = setupForLocalization('en');
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('enErrorMessage');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en-US', () => {
        let testItem = setupForLocalization('en-US');
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('enErrorMessage');
    });

    test('TextLocalizationService used for labels with existing es language and active culture of es-SP', () => {
        let testItem = setupForLocalization('es-SP');
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('esErrorMessage');
    });

    test('TextLocalizationService not setup for fr language and active culture of fr uses errorMessage property', () => {
        let testItem = setupForLocalization('fr');
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('EM-fallback');
    });
    test('TextLocalizationService not setup for fr-FR language and active culture of fr uses errorMessage property', () => {
        let testItem = setupForLocalization('fr-FR');
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('EM-fallback');
    });

    test('TextLocalizationService.GetErrorMessage used because errorMessage is not supplied', () => {
      
        let setup = setupWithField1AndField2({
            errorMessage: null,
            errorMessagel10n: null,
        }, 'en');
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetErrorMessage is not used because errorMessage is supplied', () => {
      
        let setup = setupWithField1AndField2({
            errorMessage: 'supplied',
            errorMessagel10n: null,
        }, 'en');

        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetErrorMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: null,
            errorMessagel10n: null,
        }, 'en');
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.dataType
        {
            '*': 'Default Error Message'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetErrorMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: null,
            errorMessagel10n: null,
        }, 'en');
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (setup.services.textLocalizerService as TextLocalizerService).registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetErrorMessageTemplate()).toBe('Default Error Message');
    }); 
});
describe('Validator.GetSummaryMessageTemplate', () => {
    test('Config.summaryMessage = string, return the same string', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: 'Summary',
        });

        expect(setup.validator.exposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Config.summaryMessage = null, return errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: null,
        });

        expect(setup.validator.exposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Config.summaryMessage = undefined, return errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: undefined
        });

        expect(setup.validator.exposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Config.summaryMessage = function, GetSummaryMessageTemplate= result of function', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IValidator) => summaryMessageForFn
        });

        let summaryMessageForFn = 'Summary';
        expect(setup.validator.exposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Config.summaryMessage = function that returns null GetSummaryMessageTemplate = errorMessage', () => {
        let setup = setupWithField1AndField2({
            errorMessage: 'Local',
            summaryMessage: (iv: IValidator) => null!
        });

        expect(setup.validator.exposeGetSummaryMessageTemplate()).toBe('Local');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en', () => {
        let testItem = setupForLocalization('en');
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('enSummaryMessage');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en-US', () => {
        let testItem = setupForLocalization('en-US');
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('enSummaryMessage');
    });

    test('TextLocalizationService used for labels with existing es language and active culture of es-SP', () => {
        let testItem = setupForLocalization('es-SP');
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('esSummaryMessage');
    });

    test('TextLocalizationService not setup for fr language and active culture of fr uses summaryMessage property', () => {
        let testItem = setupForLocalization('fr');
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('SEM-fallback');
    });
    test('TextLocalizationService not setup for fr-FR language and active culture of fr uses summaryMessage property', () => {
        let testItem = setupForLocalization('fr-FR');
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('SEM-fallback');
    });
    test('TextLocalizationService.GetSummaryMessage used because summaryMessage is not supplied', () => {
      
        let setup = setupWithField1AndField2({
            summaryMessage: null,
            summaryMessagel10n: null,
        }, 'en');
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetSummaryMessage is not used because summaryMessage is supplied', () => {
      
        let setup = setupWithField1AndField2({
            summaryMessage: 'supplied',
            summaryMessagel10n: null,
        }, 'en');

        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.RequireText, null, {
            '*': 'Default Error Message'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetSummaryMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
            },
            summaryMessage: null,
            summaryMessagel10n: null,
        }, 'en');
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.dataType
        {
            '*': 'Default Error Message'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetSummaryMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let setup = setupWithField1AndField2({
            conditionConfig: {
                conditionType: ConditionType.DataTypeCheck
            },
            summaryMessage: null,
            summaryMessagel10n: null,
        }, 'en');
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (setup.services.textLocalizerService as TextLocalizerService).registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        let testItem = setup.validator;
    
        expect(testItem.exposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    }); 

});
// validate(group?: string): IssueFound | null
describe('Validator.validate', () => {

    test('No issue found. Returns ConditionEvaluateResult.Match', () => {
        let setup = setupWithField1AndField2();
        setup.services.loggerService.minLevel = LoggingLevel.Info;
        setup.valueHost1.setValue('valid');

        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
        expect(vrResult!.issueFound).toBeNull();
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('Match', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();
    });
    function testSeverity(severity: ValidationSeverity): void {
        let setup = setupWithField1AndField2({
            severity: severity
        });
        setup.services.loggerService.minLevel = LoggingLevel.Info;
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
        let logger = setup.services.loggerService as CapturingLogger;
        expect(logger.findMessage('NoMatch', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();     
        expect(logger.findMessage('Validation errorcode "RequireText"', LoggingLevel.Info, LoggingCategory.Result)).toBeTruthy();                
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
    function testConditionHasIssueButDisabledReturnsNull(configChanges: Partial<ValidatorConfig>,
        loggedMessage: string, loggingLevel: LoggingLevel): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;  // to confirm logged condition result        
        setup.valueHost1.setValue('');   // will be invalid
        setup.valueHost2.setValueToUndefined();   // for use by Enabler to be invalid
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
        expect(vrResult!.issueFound).toBeNull();
        expect(logger.findMessage(loggedMessage, loggingLevel)).toBeTruthy();
    }
    test('Issue exists. Enabled = false. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            enabled: false
        }, 'Config.enabled', LoggingLevel.Info);
    });
    test('Issue exists. Enabler = NoMatch. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                whenToEnableConfig: <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },
                thenConfig: {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
            }
        }, 'Enabler using', LoggingLevel.Info);
    });
    test('Issue exists. Enabler = Undetermined. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                whenToEnableConfig: <RequireTextConditionConfig>{
                    conditionType: IsUndeterminedConditionType,
                    valueHostName: 'Field2'
                },
                thenConfig: {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
            }
        }, 'Enabler using', LoggingLevel.Info);
    });
    function testConditionHasIssueAndBlockingCheckPermitsValidation(
        configChanges: Partial<ValidatorConfig>,
        validateOptions: ValidateOptions, loggedMessage: string | null,
        logLevel: LoggingLevel | null,
        issueExpected: boolean = true): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;  // to confirm logged condition result
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

        if (loggedMessage || logLevel)
            expect(logger.findMessage(loggedMessage, logLevel)).toBeTruthy();
    }


    test('Issue exists. Enabler = Match. Returns Issue with correct error messages', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            conditionConfig: <WhenConditionConfig>{
                conditionType: ConditionType.When,
                whenToEnableConfig: <RequireTextConditionConfig>{
                // the text value is 'ABC', which causes this condition to return Match
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                },
                thenConfig: {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
            }            
        }, {}, null, null);
    });
    test('Issue exists but Require is skipped because IValidateOption.Preliminary = true.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { preliminary: true }, 'Preliminary option', LoggingLevel.Info, false);
    });
    test('Issue exists and Require is evaluated (as NoMatch) because IValidateOption.Preliminary = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { preliminary: false }, null, null, true);
    });

    test('Demonstrate that duringEdit=false does not use evaluateDuringEdits.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { duringEdit: false }, null, null, true);
    });
    test('Issue exists but NeverMatchCondition is skipped because IValidateOption.DuringEdit = true.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            conditionConfig: {
                conditionType: NeverMatchesConditionType
            }
        }, { duringEdit: true }, null, null, false);
    });
    test('Issue exists and NeverMatchCondition is run because IValidateOption.DuringEdit = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            conditionConfig: {
                conditionType: NeverMatchesConditionType
            }
        }, { duringEdit: false }, null, null, true);
    });

    function testDuringEditIsTrue(configChanges: Partial<ValidatorConfig>,
        textValue: string, 
        loggedMessage: string, logLevel: LoggingLevel, issueExpected: boolean = true): void {
        let setup = setupWithField1AndField2(configChanges);
        let logger = setup.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;  // to confirm logged condition result
        setup.valueHost1.setTextValue(textValue);   // for RequireTextCondition.evaluateDuringEdit
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({ duringEdit: true})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
        if (issueExpected)
            expect(vrResult!.issueFound).not.toBeNull();
        else
            expect(vrResult!.issueFound).toBeNull();

        expect(logger.findMessage(loggedMessage, logLevel)).toBeTruthy();
    }
    test('ValidationOption.duringEdit = true with issue found.', () => {
        testDuringEditIsTrue({}, '', 'DuringEdit', LoggingLevel.Debug, true);
    });    
    test('ValidationOption.duringEdit = true with no issue found.', () => {
        testDuringEditIsTrue({}, 'A', 'DuringEdit', LoggingLevel.Debug, false);
    });        
    test('Condition throws causing result of Undetermined and log to identify exception', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: { conditionType: ThrowsExceptionConditionType }
        });

        let logger = setup.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Info;  // to confirm logged condition result
        let vrResult: ValidatorValidateResult | Promise<ValidatorValidateResult> | null = null;
        expect(() => vrResult = setup.validator.validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as ValidatorValidateResult;
        expect(vrResult).not.toBeNull();
        expect(vrResult!.issueFound).toBeNull();
        expect(vrResult!.conditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);

        expect(logger.findMessage('Always throws', LoggingLevel.Error)).toBeTruthy();
    });

    function setupPromiseTest(result: ConditionEvaluateResult, delay: number, error?: string): {
        vhm: MockValueHostsManager,
        services: MockJivsServices,
        vh: IFieldValueHost,
        testItem: Validator
    } {
        let services = new MockJivsServices(false, false);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost('Field1', LookupKey.String, 'Field 1');

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
            vhm: vhm,
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
                    valueHostName: 'Field1',
                    doNotSave: true
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
                let logger = setup.services.loggerService as CapturingLogger;
                expect(logger.findMessage('ERROR', LoggingLevel.Error, null)).toBeTruthy();

            }
    });
    test('With loggingLevel=Debug, expect validate() to log Starting Validation for error code [errorCode]', () => {
        let setup = setupWithField1AndField2();
        let logger = setup.services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        setup.valueHost1.setValue('valid');

        setup.validator.validate({});
        expect(logger.findMessage('Starting Validation for errorcode', LoggingLevel.Debug)).toBeTruthy();
    });    
});
describe('Validator.gatherValueHostNames', () => {
    test('RequireTextCondition supplies its ValueHostName', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>
                { conditionType: ConditionType.RequireText, valueHostName: 'Property1' },
        });
        let collection = new Set<ValueHostName>();
        expect(() => setup.validator.gatherValueHostNames(collection, setup.vhm)).not.toThrow();
        expect(collection.size).toBe(1);
        expect(collection.has('Property1')).toBe(true);
    });
});

describe('getValuesForTokens', () => {
    test('RequireTextCondition returns 3 tokens: Label, Value, and DataType', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: null
            }
        });
        setup.valueHost1.setTextValue('Value1');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = setup.validator.getValuesForTokens(setup.valueHost1, setup.vhm)).not.toThrow();
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
            },
            {
                tokenLabel: 'DataType',
                associatedValue: 'String',
                purpose: 'message'
            }
        ]);
    });
    test('RangeCondition returns 5 tokens: Label, Value, DataType, Minimum, Maximum', () => {
        let setup = setupWithField1AndField2({
            conditionConfig: <RangeConditionConfig>{
                conditionType: ConditionType.Range, valueHostName: null,
                minimum: 'A',
                maximum: 'Z'
            }
        });
        (setup.services.conditionFactory as ConditionFactory).register<RangeConditionConfig>(
            ConditionType.RegExp, (config) => new RangeCondition(config));                
        setup.valueHost1.setTextValue('C');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = setup.validator.getValuesForTokens(setup.valueHost1, setup.vhm)).not.toThrow();
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
                tokenLabel: 'DataType',
                associatedValue: 'String',
                purpose: 'message'
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
        vhm: MockValueHostsManager,
        vh: MockFieldValueHost,
        validatorConfig: ValidatorConfig,
        factory: ValidatorFactory
    }
    {
        let services = new MockJivsServices(true, true);
        let vhm = new MockValueHostsManager(services);
        let vh = vhm.addMockFieldValueHost('Field1', LookupKey.String, 'Label1');
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
            vhm: vhm,
            vh: vh,
            validatorConfig: config,
            factory: factory
        }
    }
    class TestValidator extends Validator
    {
        constructor(valueHost: IFieldValueHost, validatorConfig: ValidatorConfig)
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
            getValuesForTokens: (vh: IFieldValueHost, vhr: IValueHostResolver) => []
        };
        expect(toIMessageTokenSource(test)).toBe(test);
    });    
    test('Invalid object returns null', () => {
        expect(toIMessageTokenSource({})).toBeNull();
        expect(toIMessageTokenSource({ GETValuesForTokens: null })).toBeNull();        
    });    
});

describe('dispose', () => {
    test('dispose kills many references including state and config', () => {
        let setup = setupWithField1AndField2({
            errorCode: ' TEST ',
            conditionConfig: { conditionType: ConditionType.RequireText },
        });
        setup.validator.dispose();
        expect(() => setup.validator.errorCode).toThrow(TypeError);  // value is from config which is undefined
        // config items locally can be checked
        expect(setup.config.conditionConfig).toBeUndefined();
        expect(setup.config.conditionCreator).toBeUndefined();
    });   
    
    test('dispose with validatorConfig having its own dispose kills what the config.dispose expects', () => {
        interface X extends ValidatorConfig, IDisposable
        {
            x: {}
        }

        let setup = setupWithField1AndField2({
            errorCode: ' TEST ',
            conditionConfig: { conditionType: ConditionType.RequireText },
        });
        let valConfig = setup.config as X;
        valConfig.x = {};
        valConfig.dispose = () => { (valConfig.x as any) = undefined };
        setup.validator.dispose();

        expect(valConfig.x).toBeUndefined();

    });               

});

describe('highestSeverity', () => {
    // Tests the highestSeverity function against an array of IssueFound objects, 0 IssueFound, or null.
    function createIF(severity: ValidationSeverity): IssueFound {
        return {
            valueHostName: 'name',
            errorCode: 'code',
            severity: severity,
            errorMessage: '',
            summaryMessage: undefined,
            doNotSave: severity !== ValidationSeverity.Warning   // just to have some difference in the objects based on severity
        };
    }
    
    test('highestSeverity returns the highest severity from an array of issues', () => {
        let issues: IssueFound[] = [
            createIF(ValidationSeverity.Warning),
            createIF(ValidationSeverity.Error),
            createIF(ValidationSeverity.Severe)
        ];
        expect(highestSeverity(issues)).toBe(ValidationSeverity.Severe);
    });
    test('highestSeverity returns null when passed an empty array', () => {
        expect(highestSeverity([])).toBeNull();
    });
    test('highestSeverity returns null when passed null', () => {
        expect(highestSeverity(null)).toBeNull();
    }); 
    test('highestSeverity returns the severity when passed a single IssueFound', () => {
        let issue: IssueFound = createIF(ValidationSeverity.Warning);
        expect(highestSeverity([issue])).toBe(ValidationSeverity.Warning);
    }); 
    test('highestSeverity returns the Warning severity when passed 3 warning IssueFounds', () => {
        let issues: IssueFound[] = [
            createIF(ValidationSeverity.Warning),
            createIF(ValidationSeverity.Warning),
            createIF(ValidationSeverity.Warning)
        ];

        expect(highestSeverity(issues)).toBe(ValidationSeverity.Warning);
    });
    test('highestSeverity returns the Error severity when passed 2 warning and one Error IssueFounds', () => {
        let issues: IssueFound[] = [
            createIF(ValidationSeverity.Warning),
            createIF(ValidationSeverity.Warning),
            createIF(ValidationSeverity.Error)
        ];

        expect(highestSeverity(issues)).toBe(ValidationSeverity.Error);
    });    
    test('highestSeverity returns the Severe severity when passed 2 warning and 1 severe IssueFounds', () => {
        let issues: IssueFound[] = [
            createIF(ValidationSeverity.Severe),
            createIF(ValidationSeverity.Warning),
            createIF(ValidationSeverity.Warning)
        ];

        expect(highestSeverity(issues)).toBe(ValidationSeverity.Severe);
    });    
});