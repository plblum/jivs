// Tests run the same cases demonstrated in the example source, ../src/DifferenceBetweenDates
import { ValidationSeverity } from "@plblum/jivs-engine/build/Interfaces/Validation";
import { configureVMForDifferenceBetweenDates } from "../src/DifferenceBetweenDates";
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { ValidationState } from "@plblum/jivs-engine/build/Interfaces/Validation";

describe('Difference between dates is less than 10', () => {
    test('StartDate = EndDate. No errors', () => {
        let vhm = configureVMForDifferenceBetweenDates();
        vhm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
        vhm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));  
        let diffDays = vhm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(0);
        let result = vhm.validate();
        let expected: ValidationState = {
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        };
        expect(result).toEqual(expected);
    });
    test('StartDate + 9 days = EndDate. No Errors', () => {
        let vhm = configureVMForDifferenceBetweenDates();
        vhm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
        vhm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 9)));  
        let diffDays = vhm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(9);
        let result = vhm.validate();
        let expected: ValidationState = {
            isValid: true,
            doNotSave: false,
            issuesFound: null,
            asyncProcessing: false
        };
        expect(result).toEqual(expected);
    });    
    test('StartDate + 10 = EndDate. ConditionType=LessThan fails', () => {
        let vhm = configureVMForDifferenceBetweenDates();
        vhm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
        vhm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 12)));  
        let diffDays = vhm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(12);
        let result = vhm.validate();

        let expected: ValidationState =
        {
            isValid: false,
            doNotSave: true,

            issuesFound:  [{
                errorMessage: 'Less than 10 days apart',
                summaryMessage: 'Less than 10 days apart',
                errorCode: 'NumOfDays',
                severity: ValidationSeverity.Error,
                valueHostName: 'StartDate',
                doNotSave: true
            }],
            asyncProcessing: false
        };        
        expect(result).toEqual(expected);
    });    
    test('StartDate = EndDate + 1. ConditionType=LessThanOrEqual fails', () => {
        let vhm = configureVMForDifferenceBetweenDates();
        vhm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 10 + 1)));
        vhm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1 + 10)));  
        let diffDays = vhm.getValueHost('DiffDays')?.getValue();
        expect(diffDays).toBe(1);
        let result = vhm.validate();
        let expected: ValidationState =
        {
            isValid: false,
            doNotSave: true,

            issuesFound:  [{
                errorMessage: '***ERROR MESSAGE MISSING***',
                summaryMessage: '***ERROR MESSAGE MISSING***',
                errorCode: ConditionType.LessThanOrEqual,
                severity: ValidationSeverity.Error,
                valueHostName: 'StartDate',
                doNotSave: true
                }],
            asyncProcessing: false
        };
        expect(result).toEqual(expected);
    });        
});
