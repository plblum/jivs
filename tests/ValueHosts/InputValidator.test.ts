import {
    type RangeConditionDescriptor,
    RequiredTextCondition, EqualToCondition,
    type RequiredTextConditionDescriptor, type CompareToConditionDescriptor, 
    
} from "../../src/Conditions/ConcreteConditions";

import { InputValidator, InputValidatorFactory } from "../../src/ValueHosts/InputValidator";
import { LoggingLevel } from "../../src/Interfaces/Logger";
import type { TokenLabelAndValue } from "../../src/Interfaces/InputValidator";
import type { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { MockValidationManager, MockValidationServices, MockInputValueHost, MockCapturingLogger, ThrowsExceptionConditionType, NeverMatchesConditionType } from "../Mocks";
import { IValueHostResolver, IValueHostsManager } from '../../src/Interfaces/ValueHostResolver';
import { ValueHostId } from '../../src/DataTypes/BasicTypes';
import { type ICondition, ConditionEvaluateResult, ConditionCategory } from '../../src/Interfaces/Conditions';
import { IInputValueHost } from '../../src/Interfaces/InputValueHost';
import { ValidationSeverity, ValidateOptions } from '../../src/Interfaces/Validation';
import { InputValidateResult, IInputValidator, InputValidatorDescriptor } from '../../src/Interfaces/InputValidator';
import { TextLocalizerService } from '../../src/Services/TextLocalizerService';
import { IValueHost } from '../../src/Interfaces/ValueHost';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";

// subclass of InputValidator to expose many of its protected members so they
// can be individually tested
class PublicifiedInputValidator extends InputValidator {
    public ExposeDescriptor(): InputValidatorDescriptor {
        return this.Descriptor;
    }
    public ExposeServices(): IValidationServices {
        return this.Services;
    }
    public ExposeValidationManager(): IValueHostsManager {
        return this.ValueHostsManager;
    }
    public ExposeValueHost(): IInputValueHost {
        return this.ValueHost;
    }

    public ExposeEnabler(): ICondition | null {
        return this.Enabler;
    }
    public ExposeSeverity(): ValidationSeverity {
        return this.Severity;
    }
    public ExposeGetErrorMessageTemplate(): string {
        return this.GetErrorMessageTemplate();
    }
    public ExposeGetSummaryMessageTemplate(): string {
        return this.GetSummaryMessageTemplate();
    }
}
/**
 * Returns an InputValidator (PublicifiedInputValidator subclass) ready for testing.
 * The returned ValidationManager includes two InputValueHosts with IDs "Field1" and "Field2".
 * @param descriptor - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * ConditionDescriptor - RequiredTextConditiontType, ValueHostId: null
 * ErrorMessage: 'Local'
 * SummaryMessage: 'Summary'
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, two ValueHosts, the complete Descriptor,
 * and the InputValidator.
 */
function SetupWithField1AndField2(descriptor?: Partial<InputValidatorDescriptor>): {
    vm: MockValidationManager,
    services: MockValidationServices,
    valueHost1: MockInputValueHost,
    valueHost2: MockInputValueHost,
    descriptor: InputValidatorDescriptor,
    inputValidator: PublicifiedInputValidator
} {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let vh = vm.AddInputValueHost('Field1', LookupKey.String, 'Label1');
    let vh2 = vm.AddInputValueHost('Field2', LookupKey.String, 'Label2');
    const defaultDescriptor: InputValidatorDescriptor = {
        ConditionDescriptor: <RequiredTextConditionDescriptor>
            { Type: ConditionType.RequiredText, ValueHostId: 'Field1' },
        ErrorMessage: 'Local',
        SummaryMessage: 'Summary'
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
    ConditionType: string = 'TEST';
    Category: ConditionCategory = ConditionCategory.Undetermined;

    public Result: ConditionEvaluateResult;
    public Delay: number;
    public Error: string | null;
    public Evaluate(valueHost: IValueHost, valueHostResolver: IValueHostResolver):
        ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        let self = this;
        return new Promise<ConditionEvaluateResult>((resolve, reject) => {
            function Finish() {
                if (self.Error)
                    reject(self.Error);
                else
                    resolve(self.Result);
            }
            if (self.Delay)
                globalThis.setTimeout(Finish, self.Delay);
            else
                Finish();
        });
    }
}
// constructor(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor)
describe('Inputvalidator.constructor and initial property values', () => {
    test('valueHost parameter null throws', () => {
        let descriptor: InputValidatorDescriptor = {
            ConditionDescriptor: { Type: '' },
            ErrorMessage: ''
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
        let config = SetupWithField1AndField2({
            ConditionDescriptor: { Type: '' },
        });
        expect(config.inputValidator.ExposeDescriptor()).toBe(config.descriptor);
        expect(config.inputValidator.ExposeValidationManager()).toBe(config.vm);

    });
});
describe('InputValidator.Condition', () => {
    test('Successful creation of RequiredTextCondition using ConditionDescriptor', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: <RequiredTextConditionDescriptor>
                { Type: ConditionType.RequiredText, ValueHostId: null },
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.Condition).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition).toBeInstanceOf(RequiredTextCondition);
    });
    test('Attempt to create Condition with ConditionDescriptor with invalid type throws', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: { Type: 'UnknownType' },
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.Condition).toThrow(/not supported/);
    });
    test('Successful creation using ConditionCreator', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: null,   // because the Setup function provides a default
            ConditionCreator: (requestor) => {
                return {
                    ConditionType: 'TEST',
                    Evaluate: (valueHost, validationManager) => {
                        return ConditionEvaluateResult.Match;
                    },
                    Category: ConditionCategory.Undetermined
                }
            }
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.Condition).not.toThrow();
        expect(condition).not.toBeNull();
        expect(condition!.ConditionType).toBe('TEST');
        expect(condition!.Category).toBe(ConditionCategory.Undetermined);
        expect(condition!.Evaluate(null, config.vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Neither Descriptor or Creator setup throws', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: null   // because the Setup function provides a default
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.Condition).toThrow(/setup/);
    });
    test('Both Descriptor and Creator setup throws', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: { Type: ConditionType.RequiredText },
            ConditionCreator: (requestor) => {
                return {
                    ConditionType: 'TEST',
                    Evaluate: (valueHost, validationManager) => {
                        return ConditionEvaluateResult.Match;
                    },
                    Category: ConditionCategory.Undetermined
                }
            }
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.Condition).toThrow(/both/);
    });
    test('ConditionCreator returns null throws', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: null,
            ConditionCreator: (requestor) => null
        });

        let condition: ICondition | null = null;
        expect(() => condition = config.inputValidator.Condition).toThrow(/instance/);
    });
});
describe('InputValidator.Enabler', () => {
    test('InputValidatorDescriptor has no Enabler assigned sets Enabler to null', () => {
        let config = SetupWithField1AndField2({});

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Successful creation of EqualToCondition', () => {
        let config = SetupWithField1AndField2({
            EnablerDescriptor: <CompareToConditionDescriptor>{
                Type: ConditionType.EqualTo,
                ValueHostId: null
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler).toBeInstanceOf(EqualToCondition);
    });
    test('Attempt to create Enabler with invalid type throws', () => {
        let config = SetupWithField1AndField2({
            EnablerDescriptor: {
                Type: 'UnknownType'
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).toThrow(/not supported/);
    });
    test('Successful creation using EnablerCreator', () => {
        let config = SetupWithField1AndField2({
            EnablerCreator: (requestor) => {
                return {
                    ConditionType: 'TEST',
                    Evaluate: (valueHost, validationManager) => {
                        return ConditionEvaluateResult.Match;
                    },
                    Category: ConditionCategory.Undetermined
                }
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler!.ConditionType).toBe('TEST');
        expect(enabler!.Category).toBe(ConditionCategory.Undetermined);
        expect(enabler!.Evaluate(null, config.vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('Neither Descriptor or Creator returns null', () => {
        let config = SetupWithField1AndField2({
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).toBeNull();
    });
    test('Both Descriptor and Creator setup throws', () => {
        let config = SetupWithField1AndField2({
            EnablerDescriptor: { Type: ConditionType.RequiredText },
            EnablerCreator: (requestor) => {
                return {
                    ConditionType: 'TEST',
                    Evaluate: (valueHost, services) => {
                        return ConditionEvaluateResult.Match;
                    },
                    Category: ConditionCategory.Undetermined
                }
            }
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).toThrow(/both/);
    });
    test('EnablerCreator returns null throws', () => {
        let config = SetupWithField1AndField2({
            EnablerDescriptor: null,
            EnablerCreator: (requestor) => null
        });

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).toThrow(/instance/);
    });
});
describe('InputValidator.Enabled', () => {
    test('Descriptor.Enabled = true, Enabled=true', () => {
        let config = SetupWithField1AndField2({
            Enabled: true
        });

        expect(config.inputValidator.Enabled).toBe(true);
    });
    test('Descriptor.Enabled = false, Enabled=false', () => {
        let config = SetupWithField1AndField2({
            Enabled: false
        });

        expect(config.inputValidator.Enabled).toBe(false);
    });
    test('Descriptor.Enabled = undefined, Enabled=true', () => {
        let config = SetupWithField1AndField2({
            Enabled: undefined
        });

        expect(config.inputValidator.Enabled).toBe(true);
    });
    test('Descriptor.Enabled = function, Enabled= result of function', () => {
        let config = SetupWithField1AndField2({

            Enabled: (iv: IInputValidator) => enabledForFn
        });

        let enabledForFn = true;
        expect(config.inputValidator.Enabled).toBe(true);
        enabledForFn = false;
        expect(config.inputValidator.Enabled).toBe(false);
    });
});


describe('InputValidator.Severity', () => {
    test('Descriptor.Severity = Error, Severity=Error', () => {
        let config = SetupWithField1AndField2({
            Severity: ValidationSeverity.Error
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Descriptor.Severity = Warning, Severity=Warning', () => {
        let config = SetupWithField1AndField2({
            Severity: ValidationSeverity.Warning
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
    });
    test('Descriptor.Severity = Severe, Severity=Severe', () => {
        let config = SetupWithField1AndField2({
            Severity: ValidationSeverity.Severe
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
    test('Conditions that use Severity=Severe when Descriptor.Severity = undefined', () => {
        function CheckDefaultSeverity(conditionType: string) {
            let config = SetupWithField1AndField2({
                ConditionDescriptor: {
                    Type: conditionType
                },
                Severity: undefined
            });

            expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
        }
        CheckDefaultSeverity(ConditionType.RequiredText);
        CheckDefaultSeverity(ConditionType.RequiredIndex);
        CheckDefaultSeverity(ConditionType.DataTypeCheck);
        CheckDefaultSeverity(ConditionType.RegExp);
    });
    test('Conditions that use Severity=Error when Descriptor.Severity = undefined', () => {
        function CheckDefaultSeverity(conditionType: string) {
            let config = SetupWithField1AndField2({
                ConditionDescriptor: {
                    Type: conditionType
                },
                Severity: undefined
            });

            expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
        }
        CheckDefaultSeverity(ConditionType.Range);
        CheckDefaultSeverity(ConditionType.StringLength);
        CheckDefaultSeverity(ConditionType.EqualTo);
        CheckDefaultSeverity(ConditionType.NotEqualTo);
        CheckDefaultSeverity(ConditionType.GreaterThan);
        CheckDefaultSeverity(ConditionType.GreaterThanOrEqualTo);
        CheckDefaultSeverity(ConditionType.LessThan);
        CheckDefaultSeverity(ConditionType.LessThanOrEqualTo);
        CheckDefaultSeverity(ConditionType.And);
        CheckDefaultSeverity(ConditionType.Or);
        CheckDefaultSeverity(ConditionType.CountMatches);

    });
    test('RangeCondition Descriptor.Severity = undefined, Severity=Error', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: ConditionType.Range
            },
            Severity: undefined
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('AndConditions Descriptor.Severity = undefined, Severity=Error', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: ConditionType.And
            },
            Severity: undefined
        });

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('Descriptor.Severity = function, Severity= result of function', () => {
        let config = SetupWithField1AndField2({
            Severity: (iv: IInputValidator) => severityForFn
        });

        let severityForFn: ValidationSeverity = ValidationSeverity.Warning;
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Warning);
        severityForFn = ValidationSeverity.Error;
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
        severityForFn = ValidationSeverity.Severe;
        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Severe);
    });
});

function SetupForLocalization(activeCultureID: string): PublicifiedInputValidator {
    let config = SetupWithField1AndField2({
        ErrorMessage: 'EM-fallback',
        ErrorMessagel10n: 'EM',
        SummaryMessage: 'SEM-fallback',
        SummaryMessagel10n: 'SEM'
    });
    let tlService = config.services.TextLocalizerService as TextLocalizerService;
    tlService.Register('EM', {
        'en': 'enErrorMessage',
        'es': 'esErrorMessage'
    });
    tlService.Register('SEM', {
        'en': 'enSummaryMessage',
        'es': 'esSummaryMessage'
    });
    config.services.ActiveCultureId = activeCultureID;
    return config.inputValidator;
}
describe('InputValidator.GetErrorMessageTemplate', () => {
    test('Descriptor.ErrorMessage = string, return the same string', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Test',
        });

        expect(config.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });

    test('Descriptor.ErrorMessage = function, GetErrorMessageTemplate= result of function', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: (iv: IInputValidator) => errorMessageForFn
        });

        let errorMessageForFn = 'Test';
        expect(config.inputValidator.ExposeGetErrorMessageTemplate()).toBe('Test');
    });
    test('Descriptor.ErrorMessage = function, throws when function returns null', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: (iv: IInputValidator) => null!
        });

        expect(() => config.inputValidator.ExposeGetErrorMessageTemplate()).toThrow(/Descriptor\.ErrorMessage/);
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en', () => {
        let testItem = SetupForLocalization('en');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('enErrorMessage');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en-US', () => {
        let testItem = SetupForLocalization('en-US');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('enErrorMessage');
    });

    test('TextLocalizationService used for labels with existing es language and active culture of es-SP', () => {
        let testItem = SetupForLocalization('es-SP');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('esErrorMessage');
    });

    test('TextLocalizationService not setup for fr language and active culture of fr uses ErrorMessage property', () => {
        let testItem = SetupForLocalization('fr');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('EM-fallback');
    });
    test('TextLocalizationService not setup for fr-FR language and active culture of fr uses ErrorMessage property', () => {
        let testItem = SetupForLocalization('fr-FR');
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('EM-fallback');
    });

    test('TextLocalizationService.GetErrorMessage used because ErrorMessage is not supplied', () => {
      
        let config = SetupWithField1AndField2({
            ErrorMessage: null,
            ErrorMessagel10n: null,
        });
        (config.services.TextLocalizerService as TextLocalizerService).RegisterErrorMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetErrorMessage is not used because ErrorMessage is supplied', () => {
      
        let config = SetupWithField1AndField2({
            ErrorMessage: 'supplied',
            ErrorMessagel10n: null,
        });

        (config.services.TextLocalizerService as TextLocalizerService).RegisterErrorMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetErrorMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: ConditionType.DataTypeCheck
            },
            ErrorMessage: null,
            ErrorMessagel10n: null,
        });
        (config.services.TextLocalizerService as TextLocalizerService).RegisterErrorMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.DataType
        {
            '*': 'Default Error Message'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetErrorMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: ConditionType.DataTypeCheck
            },
            ErrorMessage: null,
            ErrorMessagel10n: null,
        });
        (config.services.TextLocalizerService as TextLocalizerService).RegisterErrorMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (config.services.TextLocalizerService as TextLocalizerService).RegisterErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetErrorMessageTemplate()).toBe('Default Error Message');
    }); 
});
describe('InputValidator.GetSummaryMessageTemplate', () => {
    test('Descriptor.SummaryMessage = string, return the same string', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryMessage: 'Summary',
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Descriptor.SummaryMessage = null, return ErrorMessage', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryMessage: null,
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Descriptor.SummaryMessage = undefined, return ErrorMessage', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryMessage: undefined
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });
    test('Descriptor.SummaryMessage = function, GetSummaryMessageTemplate= result of function', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryMessage: (iv: IInputValidator) => summaryMessageForFn
        });

        let summaryMessageForFn = 'Summary';
        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Summary');
    });
    test('Descriptor.SummaryMessage = function that returns null GetSummaryMessageTemplate = ErrorMessage', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryMessage: (iv: IInputValidator) => null!
        });

        expect(config.inputValidator.ExposeGetSummaryMessageTemplate()).toBe('Local');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en', () => {
        let testItem = SetupForLocalization('en');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('enSummaryMessage');
    });

    test('TextLocalizationService used for labels with existing en language and active culture of en-US', () => {
        let testItem = SetupForLocalization('en-US');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('enSummaryMessage');
    });

    test('TextLocalizationService used for labels with existing es language and active culture of es-SP', () => {
        let testItem = SetupForLocalization('es-SP');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('esSummaryMessage');
    });

    test('TextLocalizationService not setup for fr language and active culture of fr uses SummaryMessage property', () => {
        let testItem = SetupForLocalization('fr');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('SEM-fallback');
    });
    test('TextLocalizationService not setup for fr-FR language and active culture of fr uses SummaryMessage property', () => {
        let testItem = SetupForLocalization('fr-FR');
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('SEM-fallback');
    });
    test('TextLocalizationService.GetSummaryMessage used because SummaryMessage is not supplied', () => {
      
        let config = SetupWithField1AndField2({
            SummaryMessage: null,
            SummaryMessagel10n: null,
        });
        (config.services.TextLocalizerService as TextLocalizerService).RegisterSummaryMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });    
    test('TextLocalizationService.GetSummaryMessage is not used because SummaryMessage is supplied', () => {
      
        let config = SetupWithField1AndField2({
            SummaryMessage: 'supplied',
            SummaryMessagel10n: null,
        });

        (config.services.TextLocalizerService as TextLocalizerService).RegisterSummaryMessage(ConditionType.RequiredText, null, {
            '*': 'Default Error Message'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('supplied');
    });        
    test('TextLocalizationService.GetSummaryMessage together with both Condition Type and DataTypeLookupKey', () => {
      
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: ConditionType.DataTypeCheck
            },
            SummaryMessage: null,
            SummaryMessagel10n: null,
        });
        (config.services.TextLocalizerService as TextLocalizerService).RegisterSummaryMessage(ConditionType.DataTypeCheck, LookupKey.String, // LookupKey must conform to ValueHost.DataType
        {
            '*': 'Default Error Message'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    });        
    test('TextLocalizationService.GetSummaryMessage where DataTypeLookupKey does not match and ConditionType alone works', () => {
      
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: ConditionType.DataTypeCheck
            },
            SummaryMessage: null,
            SummaryMessagel10n: null,
        });
        (config.services.TextLocalizerService as TextLocalizerService).RegisterSummaryMessage(ConditionType.DataTypeCheck, null,
        {
            '*': 'Default Error Message'
        });        
        (config.services.TextLocalizerService as TextLocalizerService).RegisterSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date, // LookupKey of VH is LookupKey.String
        {
            '*': 'Default Error Message-String'
        });
        config.services.ActiveCultureId = 'en';
        let testItem = config.inputValidator;
    
        expect(testItem.ExposeGetSummaryMessageTemplate()).toBe('Default Error Message');
    }); 
});
// Validate(group?: string): IssueFound | null
describe('InputValidator.Validate', () => {

    test('No issue found. Returns ConditionEvaluateResult.Match', () => {
        let config = SetupWithField1AndField2();
        config.valueHost1.SetInputValue('valid');

        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.IssueFound).toBeNull();
        expect(vrResult!.ConditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
    });
    function testSeverity(severity: ValidationSeverity): void {
        let config = SetupWithField1AndField2({
            Severity: severity
        });
        config.valueHost1.SetInputValue('');   // will be invalid
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.IssueFound).not.toBeNull();
        expect(vrResult!.IssueFound!.ConditionType).toBe(ConditionType.RequiredText);
        expect(vrResult!.IssueFound!.Severity).toBe(severity);
        expect(vrResult!.ConditionEvaluateResult).toBe(ConditionEvaluateResult.NoMatch);
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
        let config = SetupWithField1AndField2({
            ErrorMessage: errorMessage,
            SummaryMessage: summaryMessage,
        });
        config.valueHost1.SetInputValue('');   // will be an issue
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.IssueFound).not.toBeNull();

        let issueFound = vrResult!.IssueFound;
        expect(issueFound!.ConditionType).toBe(ConditionType.RequiredText);
        expect(issueFound!.ErrorMessage).toBe(expectedErrorMessage);
        expect(issueFound!.SummaryMessage).toBe(expectedSummaryMessage);
    }
    test('Issue found. Only ErrorMessage supplied. Summary is the same as ErrorMessage', () => {
        testErrorMessages('Local', null, 'Local', 'Local');
    });
    test('Issue found. ErrorMessage and SummaryMessage supplied. Issue reflects them', () => {
        testErrorMessages('Local', 'Summary', 'Local', 'Summary');
    });
    test('Issue found. ErrorMessage and SummaryMessage supplied each with tokens. Error messages both have correctly replaced the tokens.', () => {
        testErrorMessages('{Label} Local', '{Label} Summary', 'Label1 Local', 'Label1 Summary');
    });
    function testConditionHasIssueButDisabledReturnsNull(descriptorChanges: Partial<InputValidatorDescriptor>): void {
        let config = SetupWithField1AndField2(descriptorChanges);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;  // to confirm logged condition result        
        config.valueHost1.SetInputValue('');   // will be invalid
        config.valueHost2.SetInputValue('');   // for use by Enabler to be invalid
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult!.IssueFound).toBeNull();

        // 2 info level log entries: bailout and validation result
        expect(logger.EntryCount()).toBe(2);
    }
    test('Issue exists. Enabled = false. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            Enabled: false
        });
    });
    test('Issue exists. Enabler = NoMatch. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            EnablerDescriptor: <RequiredTextConditionDescriptor>{
                Type: ConditionType.RequiredText,
                ValueHostId: 'Field2'
            }
        });
    });
    test('Issue exists. Enabler = Undetermined. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            EnablerDescriptor: <RangeConditionDescriptor>{
                // the input value is '', which causes this condition to return Undetermined
                Type: ConditionType.Range, ValueHostId: 'Field2',
                Minimum: 0, Maximum: 10
            }
        });
    });
    function testConditionHasIssueAndBlockingCheckPermitsValidation(descriptorChanges: Partial<InputValidatorDescriptor>,
        validateOptions: ValidateOptions, logCount: number, issueExpected: boolean = true): void {
        let config = SetupWithField1AndField2(descriptorChanges);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;  // to confirm logged condition result
        config.valueHost1.SetInputValue('');   // will be invalid
        config.valueHost2.SetInputValue('ABC');   // for use by Enabler to enable the condition
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.Validate(validateOptions)).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        if (issueExpected)
            expect(vrResult!.IssueFound).not.toBeNull();
        else
            expect(vrResult!.IssueFound).toBeNull();
        // 2 info level log entries: first Condition second Validate result
        expect(logger.EntryCount()).toBe(logCount);
    }
    test('Issue exists. Enabler = Match. Returns Issue with correct error messages', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            EnablerDescriptor: <RequiredTextConditionDescriptor>{
                // the input value is 'ABC', which causes this condition to return Match
                Type: ConditionType.RequiredText, ValueHostId: 'Field2'
            }
        }, {}, 2);
    });
    test('Issue exists but Required is skipped because IValidateOption.Preliminary = true.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { Preliminary: true }, 2, false);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.Preliminary = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { Preliminary: false }, 2, true);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.DuringEdit = true.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { DuringEdit: true }, 2, true);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.DuringEdit = false doesnt skip that condition.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { DuringEdit: false }, 2, true);
    });
    test('Issue exists but NeverMatchCondition is skipped because IValidateOption.DuringEdit = true.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            ConditionDescriptor: {
                Type: NeverMatchesConditionType
            }
        }, { DuringEdit: true }, 2, false);
    });
    test('Issue exists and NeverMatchCondition is run because IValidateOption.DuringEdit = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            ConditionDescriptor: {
                Type: NeverMatchesConditionType
            }
        }, { DuringEdit: false }, 2, true);
    });
    test('Issue exists and Required is evaluated (as NoMatch) because IValidateOption.Preliminary = false.', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
        }, { Preliminary: false }, 2, true);
    });

    test('Condition throws causing result of Undetermined and log to identify exception', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: { Type: ThrowsExceptionConditionType }
        });

        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;  // to confirm logged condition result
        let vrResult: InputValidateResult | Promise<InputValidateResult> | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult).not.toBeInstanceOf(Promise);
        vrResult = vrResult as unknown as InputValidateResult;
        expect(vrResult).not.toBeNull();
        expect(vrResult!.IssueFound).toBeNull();
        expect(vrResult!.ConditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);

        // 2 log entries: Error level exception and Info Level validation result
        expect(logger.EntryCount()).toBe(2);
        expect(logger.Captured[0].Level).toBe(LoggingLevel.Error);
        expect(logger.Captured[1].Level).toBe(LoggingLevel.Info);
    });

    function SetupPromiseTest(result: ConditionEvaluateResult, delay: number, error?: string): {
        vm: MockValidationManager,
        services: MockValidationServices,
        vh: IInputValueHost,
        testItem: InputValidator
    } {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost('Field1', LookupKey.String, 'Field 1');

        let descriptor: InputValidatorDescriptor = {
            ConditionDescriptor: null,
            ConditionCreator: (requestor) => {
                return new ConditionWithPromiseTester(result,
                    delay, error);
            },
            ErrorMessage: 'Local',
            SummaryMessage: 'Summary'
        };

        let testItem = new InputValidator(vh, descriptor);
        return {
            vm: vm,
            services: services,
            vh: vh,
            testItem: testItem
        }
    }

    test('Condition using Promise to evaluate as Match results in InputValidateResult setup as Match with no IssuesFound', async () => {
        let setup = SetupPromiseTest(ConditionEvaluateResult.Match, 0);
        let result = await setup.testItem.Validate({});
        expect(result).toEqual({
            ConditionEvaluateResult: ConditionEvaluateResult.Match,
            IssueFound: null
        });
    });
    test('With delay, Condition using Promise to evaluate as Match results in InputValidateResult setup as Match with no IssuesFound',
        async () => {
            let setup = SetupPromiseTest(ConditionEvaluateResult.Match, 100);
            let result = await setup.testItem.Validate({});
            expect(result).toEqual({
                ConditionEvaluateResult: ConditionEvaluateResult.Match,
                IssueFound: null
            });
        });
    test('Condition using Promise to evaluate as NoMatch results in InputValidateResult setup as Match with 1 IssueFound',
        async () => {
            let setup = SetupPromiseTest(ConditionEvaluateResult.NoMatch, 0);
            let result = await setup.testItem.Validate({});
            expect(result).toEqual(<InputValidateResult>{
                ConditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                IssueFound: {
                    ConditionType: 'TEST',
                    ErrorMessage: 'Local',
                    SummaryMessage: 'Summary',
                    Severity: ValidationSeverity.Error,
                    ValueHostId: 'Field1'
                }
            });
        });
    test('Condition using Promise to evaluate as Undetermined results in InputValidateResult setup as Undetermined with no IssuesFound',
        async () => {
            let setup = SetupPromiseTest(ConditionEvaluateResult.Undetermined, 0);
            let result = await setup.testItem.Validate({});
            expect(result).toEqual({
                ConditionEvaluateResult: ConditionEvaluateResult.Undetermined,
                IssueFound: null
            });
        });
    test('Condition using Promise to generate a rejection calls the catch',
        async () => {
     //       expect.assertions(1);
            let setup = SetupPromiseTest(ConditionEvaluateResult.Match, 0, 'ERROR');
            try {
                let result = await setup.testItem.Validate({});
                fail();
            }
            catch (e) {
                expect(e).toBe('ERROR');
                let logger = setup.services.LoggerService as MockCapturingLogger;
                expect(logger.EntryCount()).toBe(1);
                expect(logger.GetLatest()!.Message).toMatch(/ERROR/);

            }
        });
});
describe('InputValidator.GatherValueHostIds', () => {
    test('RequiredTextCondition supplies its ValueHostId', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: <RequiredTextConditionDescriptor>
                { Type: ConditionType.RequiredText, ValueHostId: 'Property1' },
        });
        let collection = new Set<ValueHostId>();
        expect(() => config.inputValidator.GatherValueHostIds(collection, config.vm)).not.toThrow();
        expect(collection.size).toBe(1);
        expect(collection.has('Property1')).toBe(true);
    });
});

describe('GetValuesForTokens', () => {
    test('RequiredTextCondition returns 2 tokens: Label and Value', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: <RequiredTextConditionDescriptor>{
                Type: ConditionType.RequiredText,
                ValueHostId: null
            }
        });
        config.valueHost1.SetInputValue('Value1');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = config.inputValidator.GetValuesForTokens(config.valueHost1, config.vm)).not.toThrow();
        expect(tlvs).not.toBeNull();
        expect(tlvs).toEqual([
            {
                TokenLabel: 'Label',
                AssociatedValue: 'Label1',
                Purpose: 'label'
            },
            {
                TokenLabel: 'Value',
                AssociatedValue: 'Value1',
                Purpose: 'value'
            }
        ])
    });
    test('RangeCondition returns 4 tokens: Label, Value, Minimum, Maximum', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: <RangeConditionDescriptor>{
                Type: ConditionType.Range, ValueHostId: null,
                Minimum: 'A',
                Maximum: 'Z'
            }
        });
        config.valueHost1.SetInputValue('C');
        let tlvs: Array<TokenLabelAndValue> | null = null;
        expect(() => tlvs = config.inputValidator.GetValuesForTokens(config.valueHost1, config.vm)).not.toThrow();
        expect(tlvs).not.toBeNull();
        expect(tlvs).toEqual([
            {
                TokenLabel: 'Label',
                AssociatedValue: 'Label1',
                Purpose: 'label'
            },
            {
                TokenLabel: 'Value',
                AssociatedValue: 'C',
                Purpose: 'value'
            },
            {
                TokenLabel: 'Minimum',
                AssociatedValue: 'A',
                Purpose: 'parameter'
            },
            {
                TokenLabel: 'Maximum',
                AssociatedValue: 'Z',
                Purpose: 'parameter'
            },
        ])
    });
});

describe('InputValidatorFactory.Create', () => {
    test('Returns an InputValidator', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.AddInputValueHost('Field1', LookupKey.String, 'Label1');
        const descriptor: InputValidatorDescriptor = {
            ConditionDescriptor: <RequiredTextConditionDescriptor>{
                Type: ConditionType.RequiredText,
                ValueHostId: 'Field1'
            },
            ErrorMessage: 'Local',
            SummaryMessage: 'Summary'
        };
        let testItem = new InputValidatorFactory();
        let created: IInputValidator | null = null;
        expect(() => created = testItem.Create(vh, descriptor)).not.toThrow();
        expect(created).not.toBeNull();
        expect(created).toBeInstanceOf(InputValidator);
    });
});