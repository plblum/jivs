// Tests run the same cases demonstrated in the example source, ../src/DifferenceBetweenDates

import { ValidationSeverity } from "@plblum/jivs-engine/src/Interfaces/Validation";
import { configureVMForDifferentBetweenDate } from "../src/DifferenceBetweenDates";
import { ConditionType } from "@plblum/jivs-engine/src/Conditions/ConditionTypes";
import { CapturingLogger } from "@plblum/jivs-engine/tests/TestSupport/CapturingLogger";
import { LoggingLevel } from "@plblum/jivs-engine/src/Interfaces/LoggerService";
import { ValidationState } from "@plblum/jivs-engine/src/Interfaces/Validation";

describe('Difference between dates is less than 10', () => {
    test('StartDate = EndDate. No errors', () => {
        let vm = configureVMForDifferentBetweenDate();
        vm.services.loggerService = new CapturingLogger();
        vm.services.loggerService.minLevel = LoggingLevel.Debug;
        vm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
        vm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));  
        let diffDays = vm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(0);
        let result = vm.validate();
        let expected: ValidationState = {
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null,
            asyncProcessing: false
        };
        expect(result).toEqual(expected);
    });
    test('StartDate + 9 days = EndDate. No Errors', () => {
        let vm = configureVMForDifferentBetweenDate();
        vm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
        vm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 9)));  
        let diffDays = vm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(9);
        let result = vm.validate();
        let expected: ValidationState = {
            isValid: true,
            doNotSaveNativeValues: false,
            issuesFound: null,
            asyncProcessing: false
        };
        expect(result).toEqual(expected);
    });    
    test('StartDate + 10 = EndDate. ConditionType=LessThan fails', () => {
        let vm = configureVMForDifferentBetweenDate();
        vm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
        vm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 10)));  
        let diffDays = vm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(10);
        let result = vm.validate();

        let expected: ValidationState =
        {
            isValid: false,
            doNotSaveNativeValues: true,

            issuesFound:  [{
                errorMessage: 'The two dates must be less than 10 days apart.',
                summaryMessage: 'The two dates must be less than 10 days apart.',
                errorCode: ConditionType.LessThanValue,
                severity: ValidationSeverity.Error,
                valueHostName: 'StartDate'
            }],
            asyncProcessing: false
        };        
        expect(result).toEqual(expected);
    });    
    test('StartDate = EndDate + 1. ConditionType=LessThanOrEqual fails', () => {
        let vm = configureVMForDifferentBetweenDate();
        vm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 10 + 1)));
        vm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 10)));  
        let diffDays = vm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(1);
        let result = vm.validate();
        let expected: ValidationState =
        {
            isValid: false,
            doNotSaveNativeValues: true,

            issuesFound:  [{
                errorMessage: 'Start date must be less than or equal to End date.',
                summaryMessage: 'Start date must be less than or equal to End date.',
                errorCode: ConditionType.LessThanOrEqual,
                severity: ValidationSeverity.Severe,
                valueHostName: 'StartDate'
                }],
            asyncProcessing: false
        };
        expect(result).toEqual(expected);
    });        
});
