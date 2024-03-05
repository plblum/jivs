import {
    ValueGTESecondValueConditionType, ValueGTSecondValueConditionType, ValueLTSecondValueConditionType, ValueLTESecondValueConditionType,
    OrConditionsType, CountMatchingConditionsType, StringLengthConditionType
} from '../../src/Conditions/ConcreteConditions';
import {
   type IRangeConditionDescriptor,
    RequiredTextConditionType, RequiredTextCondition, ValuesEqualConditionType, ValuesEqualCondition, RangeConditionType,
    type IRequiredTextConditionDescriptor, type ICompareToConditionDescriptor, RequiredIndexConditionType,
    DataTypeCheckConditionType, RegExpConditionType, AndConditionsType, ValuesNotEqualConditionType
} from "../../src/Conditions/ConcreteConditions";

import { InputValidator, InputValidatorFactory } from "../../src/ValueHosts/InputValidator";
import { LoggingLevel } from "../../src/Interfaces/Logger";
import type { ITokenLabelAndValue } from "../../src/ValueHosts/MessageTokenResolver";
import type { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { MockValidationManager, MockValidationServices, MockInputValueHost, MockCapturingLogger, ThrowsExceptionConditionType, NeverMatchesConditionType } from "../Mocks";
import { StringLookupKey } from '../../src/DataTypes/LookupKeys';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostResolver';
import { ValueHostId } from '../../src/DataTypes/BasicTypes';
import { type ICondition, ConditionEvaluateResult, ConditionCategory } from '../../src/Interfaces/Conditions';
import { IInputValueHost } from '../../src/Interfaces/InputValueHost';
import { ValidationSeverity, IValidateOptions } from '../../src/Interfaces/Validation';
import { IInputValidateResult, IInputValidator, IInputValidatorDescriptor } from '../../src/Interfaces/InputValidator';

// subclass of InputValidator to expose many of its protected members so they
// can be individually tested
class PublicifiedInputValidator extends InputValidator {
    public ExposeDescriptor(): IInputValidatorDescriptor {
        return this.Descriptor;
    }
    public ExposeServices(): IValidationServices {
        return this.Services;
    }
    public ExposeValidationManager(): IValueHostsManager
    {
        return this.ValueHostsManager;
    }
    public ExposeValueHost(): IInputValueHost
    {
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
    public ExposeGetSummaryErrorMessageTemplate(): string {
        return this.GetSummaryErrorMessageTemplate();
    }
}
/**
 * Returns an InputValidator (PublicifiedInputValidator subclass) ready for testing.
 * The returned ValidationManager includes two InputValueHosts with IDs "Field1" and "Field2".
 * @param descriptor - Provide just the properties that you want to test.
 * Any not supplied but are required will be assigned using these rules:
 * ConditionDescriptor - RequiredTextConditiontType, ValueHostId: null
 * ErrorMessage: 'Local'
 * SummaryErrorMessage: 'Summary'
 * @returns An object with all of the parts that were setup including 
 * ValidationManager, Services, two ValueHosts, the complete Descriptor,
 * and the InputValidator.
 */
function SetupWithField1AndField2(descriptor?: Partial<IInputValidatorDescriptor>): {
    vm: MockValidationManager,
    services: MockValidationServices,
    valueHost1: MockInputValueHost,
    valueHost2: MockInputValueHost,
    descriptor: IInputValidatorDescriptor,
    inputValidator: PublicifiedInputValidator
} {
    let services = new MockValidationServices(true, true);
    let vm = new MockValidationManager(services);
    let vh = vm.AddInputValueHost('Field1', StringLookupKey, 'Label1');
    let vh2 = vm.AddInputValueHost('Field2', StringLookupKey, 'Label2');
    const defaultDescriptor: IInputValidatorDescriptor = {
        ConditionDescriptor: <IRequiredTextConditionDescriptor>
            { Type: RequiredTextConditionType, ValueHostId: 'Field1' },
        ErrorMessage: 'Local',
        SummaryErrorMessage: 'Summary'
    };

    let updatedDescriptor: IInputValidatorDescriptor = (!descriptor) ?
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

// constructor(valueHost: IInputValueHost, descriptor: IInputValidatorDescriptor)
describe('Inputvalidator.constructor and initial property values', () => {
    test('valueHost parameter null throws', () => {
        let descriptor: IInputValidatorDescriptor = {
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
            ConditionDescriptor: <IRequiredTextConditionDescriptor>
                { Type: RequiredTextConditionType, ValueHostId: null },
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
                    Evaluate: (valueHost, validationManager)=> {
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
            ConditionDescriptor: { Type: RequiredTextConditionType },
            ConditionCreator: (requestor) => {
                return {
                    ConditionType: 'TEST',
                    Evaluate: (valueHost, validationManager)=> {
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
    test('Successful creation of ValuesEqualCondition', () => {
        let config = SetupWithField1AndField2({
            EnablerDescriptor: <ICompareToConditionDescriptor>{
                Type: ValuesEqualConditionType,
                ValueHostId: null
            }
        });        

        let enabler: ICondition | null = null;
        expect(() => enabler = config.inputValidator.ExposeEnabler()).not.toThrow();
        expect(enabler).not.toBeNull();
        expect(enabler).toBeInstanceOf(ValuesEqualCondition);
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
                    Evaluate: (valueHost, validationManager)=> {
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
            EnablerDescriptor: { Type: RequiredTextConditionType },
            EnablerCreator: (requestor) => {
                return {
                    ConditionType: 'TEST',
                    Evaluate: (valueHost, services)=> {
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
        CheckDefaultSeverity(RequiredTextConditionType);
        CheckDefaultSeverity(RequiredIndexConditionType);
        CheckDefaultSeverity(DataTypeCheckConditionType);
        CheckDefaultSeverity(RegExpConditionType);
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
        CheckDefaultSeverity(RangeConditionType);
        CheckDefaultSeverity(StringLengthConditionType);
        CheckDefaultSeverity(ValuesEqualConditionType);
        CheckDefaultSeverity(ValuesNotEqualConditionType);
        CheckDefaultSeverity(ValueGTSecondValueConditionType);        
        CheckDefaultSeverity(ValueGTESecondValueConditionType);        
        CheckDefaultSeverity(ValueLTSecondValueConditionType);        
        CheckDefaultSeverity(ValueLTESecondValueConditionType);        
        CheckDefaultSeverity(AndConditionsType);        
        CheckDefaultSeverity(OrConditionsType);        
        CheckDefaultSeverity(CountMatchingConditionsType);        
  
    });
    test('RangeCondition Descriptor.Severity = undefined, Severity=Error', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: RangeConditionType
            },
            Severity: undefined
        });               

        expect(config.inputValidator.ExposeSeverity()).toBe(ValidationSeverity.Error);
    });
    test('AndConditions Descriptor.Severity = undefined, Severity=Error', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: {
                Type: AndConditionsType
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
});
describe('InputValidator.GetSummaryErrorMessageTemplate', () => {
    test('Descriptor.SummaryErrorMessage = string, return the same string', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryErrorMessage: 'Summary',
        });               

        expect(config.inputValidator.ExposeGetSummaryErrorMessageTemplate()).toBe('Summary');
    });
    test('Descriptor.SummaryErrorMessage = null, return ErrorMessage', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryErrorMessage: null,
        });               
        
        expect(config.inputValidator.ExposeGetSummaryErrorMessageTemplate()).toBe('Local');
    });
    test('Descriptor.SummaryErrorMessage = undefined, return ErrorMessage', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryErrorMessage: undefined
        });               

        expect(config.inputValidator.ExposeGetSummaryErrorMessageTemplate()).toBe('Local');
    });
    test('Descriptor.SummaryErrorMessage = function, GetSummaryErrorMessageTemplate= result of function', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryErrorMessage: (iv: IInputValidator) => summaryerrorMessageForFn
        });               

        let summaryerrorMessageForFn = 'Summary';
        expect(config.inputValidator.ExposeGetSummaryErrorMessageTemplate()).toBe('Summary');
    });
    test('Descriptor.SummaryErrorMessage = function that returns null GetSummaryErrorMessageTemplate = ErrorMessage', () => {
        let config = SetupWithField1AndField2({
            ErrorMessage: 'Local',
            SummaryErrorMessage: (iv: IInputValidator) => null!
        });               

        expect(config.inputValidator.ExposeGetSummaryErrorMessageTemplate()).toBe('Local');
    });
});
// Validate(group?: string): IIssueFound | null
describe('InputValidator.Validate', () => {

    test('No issue found. Returns ConditionEvaluateResult.Match', () => {
        let config = SetupWithField1AndField2();
        config.valueHost1.SetWidgetValue('valid');

        let vrResult: IInputValidateResult | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult!.IssueFound).toBeNull();
        expect(vrResult!.ConditionEvaluateResult).toBe(ConditionEvaluateResult.Match);
    });
    function testSeverity(severity: ValidationSeverity): void {
        let config = SetupWithField1AndField2({
            Severity: severity
        });
        config.valueHost1.SetWidgetValue('');   // will be invalid
        let vrResult: IInputValidateResult | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult!.IssueFound).not.toBeNull();
        expect(vrResult!.IssueFound!.ConditionType).toBe(RequiredTextConditionType);
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
        summaryErrorMessage: string | ((host: IInputValidator) => string) | null,
        expectedErrorMessage: string, expectedSummaryMessage: string): void {
        let config = SetupWithField1AndField2({
            ErrorMessage: errorMessage,
            SummaryErrorMessage: summaryErrorMessage,
        });
        config.valueHost1.SetWidgetValue('');   // will be an issue
        let vrResult: IInputValidateResult | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult!.IssueFound).not.toBeNull();

        let issueFound = vrResult!.IssueFound;
        expect(issueFound!.ConditionType).toBe(RequiredTextConditionType);
        expect(issueFound!.ErrorMessage).toBe(expectedErrorMessage);
        expect(issueFound!.SummaryErrorMessage).toBe(expectedSummaryMessage);
    }
    test('Issue found. Only ErrorMessage supplied. Summary is the same as ErrorMessage', () => {
        testErrorMessages('Local', null, 'Local', 'Local');
    });
    test('Issue found. ErrorMessage and SummaryErrorMessage supplied. Issue reflects them', () => {
        testErrorMessages('Local', 'Summary', 'Local', 'Summary');
    });
    test('Issue found. ErrorMessage and SummaryErrorMessage supplied each with tokens. Error messages both have correctly replaced the tokens.', () => {
        testErrorMessages('{Label} Local', '{Label} Summary', 'Label1 Local', 'Label1 Summary');
    });
    function testConditionHasIssueButDisabledReturnsNull(descriptorChanges: Partial<IInputValidatorDescriptor>): void {
        let config = SetupWithField1AndField2(descriptorChanges);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;  // to confirm logged condition result        
        config.valueHost1.SetWidgetValue('');   // will be invalid
        config.valueHost2.SetWidgetValue('');   // for use by Enabler to be invalid
        let vrResult: IInputValidateResult | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
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
            EnablerDescriptor: <IRequiredTextConditionDescriptor>{
                Type: RequiredTextConditionType,
                ValueHostId: 'Field2'
            }
        });
    });
    test('Issue exists. Enabler = Undetermined. Returns null', () => {
        testConditionHasIssueButDisabledReturnsNull({
            EnablerDescriptor: <IRangeConditionDescriptor>{
                // the Widget value is '', which causes this condition to return Undetermined
                Type: RangeConditionType, ValueHostId: 'Field2',
                Minimum: 0, Maximum: 10
            }
        });
    });
    function testConditionHasIssueAndBlockingCheckPermitsValidation(descriptorChanges: Partial<IInputValidatorDescriptor>,
        validateOptions: IValidateOptions, logCount: number, issueExpected: boolean = true): void {
        let config = SetupWithField1AndField2(descriptorChanges);
        let logger = config.services.LoggerService as MockCapturingLogger;
        logger.MinLevel = LoggingLevel.Info;  // to confirm logged condition result
        config.valueHost1.SetWidgetValue('');   // will be invalid
        config.valueHost2.SetWidgetValue('ABC');   // for use by Enabler to enable the condition
        let vrResult: IInputValidateResult | null = null;
        expect(() => vrResult = config.inputValidator.Validate(validateOptions)).not.toThrow();
        expect(vrResult).not.toBeNull();
        if (issueExpected)
            expect(vrResult!.IssueFound).not.toBeNull();
        else
            expect(vrResult!.IssueFound).toBeNull();
        // 2 info level log entries: first Condition second Validate result
        expect(logger.EntryCount()).toBe(logCount);
    }
    test('Issue exists. Enabler = Match. Returns Issue with correct error messages', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            EnablerDescriptor: <IRequiredTextConditionDescriptor>{
                // the Widget value is 'ABC', which causes this condition to return Match
                Type: RequiredTextConditionType, ValueHostId: 'Field2'
            }
        }, {}, 2);
    });
    test('Issue exists. Group parameter = empty string always continues. Returns issue', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            Group: 'Anything'
        }, { Group: '' }, 2);
    });
    test('Issue exists. Group parameter = "*" always continues. Returns issue', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            Group: 'Anything'
        }, { Group: '*' }, 2);
    });
    test('Issue exists. Group parameter assigned and matches Descriptor.Group. Returns issue', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            Group: 'group1'
        }, { Group: 'group1' }, 2);
    });
    test('Issue exists. Group parameter assigned and matches Descriptor.Group while cases do not match. Returns issue', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            Group: 'GROUP1'
        }, { Group: 'group1' }, 2);
    });
    test('Issue exists. Group parameter assigned and but does not match Descriptor.Group. Returns null', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            Group: 'groupB'
        }, { Group: 'groupA' }, 2, false);       
    });
    test('Issue exists. Group parameter assigned and matches Descriptor.Group with array. Returns issue', () => {
        testConditionHasIssueAndBlockingCheckPermitsValidation({
            Group: ['group1', 'group2']
        }, { Group: 'group1' }, 2);
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
        let vrResult: IInputValidateResult | null = null;
        expect(() => vrResult = config.inputValidator.Validate({})).not.toThrow();
        expect(vrResult).not.toBeNull();
        expect(vrResult!.IssueFound).toBeNull();
        expect(vrResult!.ConditionEvaluateResult).toBe(ConditionEvaluateResult.Undetermined);

        // 2 log entries: Error level exception and Info Level validation result
        expect(logger.EntryCount()).toBe(2);
        expect(logger.Captured[0].Level).toBe(LoggingLevel.Error);
        expect(logger.Captured[1].Level).toBe(LoggingLevel.Info);
    });
     
});
describe('InputValidator.GatherValueHostIds', () => {
    test('RequiredTextCondition supplies its ValueHostId', () => {
        let config = SetupWithField1AndField2({
            ConditionDescriptor: <IRequiredTextConditionDescriptor>
                { Type: RequiredTextConditionType, ValueHostId: 'Property1' },
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
            ConditionDescriptor: <IRequiredTextConditionDescriptor>{
                Type: RequiredTextConditionType,
                ValueHostId: null
            }
        });
        config.valueHost1.SetWidgetValue('Value1');
        let tlvs: Array<ITokenLabelAndValue> | null = null;
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
            ConditionDescriptor: <IRangeConditionDescriptor>{
                Type: RangeConditionType, ValueHostId: null,
                Minimum: 'A',
                Maximum: 'Z'
            }
        });
        config.valueHost1.SetWidgetValue('C');
        let tlvs: Array<ITokenLabelAndValue> | null = null;
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
        let vh = vm.AddInputValueHost('Field1', StringLookupKey, 'Label1');
        const descriptor: IInputValidatorDescriptor = {
            ConditionDescriptor: <IRequiredTextConditionDescriptor>{
                Type: RequiredTextConditionType,
                ValueHostId: 'Field1'
            },
            ErrorMessage: 'Local',
            SummaryErrorMessage: 'Summary'
        };
        let testItem = new InputValidatorFactory();
        let created: IInputValidator | null = null;
        expect(() => created = testItem.Create(vh, descriptor)).not.toThrow();
        expect(created).not.toBeNull();
        expect(created).toBeInstanceOf(InputValidator);
    });
});