
// Example: Demonstrates the use of a CalcValueHost to help build a condition
// that compares two values, one is the difference in days between StartDate and EndDate,
// the other is the number of days. It uses the LessThan condition, with the number of days set to 10.

import { DataTypeCheckCondition, DataTypeCheckConditionConfig, LessThanCondition, LessThanConditionConfig, LessThanOrEqualCondition, LessThanOrEqualConditionConfig, LessThanValueCondition, LessThanValueConditionConfig } from "@plblum/jivs-engine/src/Conditions/ConcreteConditions";
import { ConditionType } from "@plblum/jivs-engine/src/Conditions/ConditionTypes";
import { LookupKey } from "@plblum/jivs-engine/src/DataTypes/LookupKeys";
import { ICalcValueHost, CalcValueHostConfig, CalculationHandlerResult } from "@plblum/jivs-engine/src/Interfaces/CalcValueHost";
import { InputValueHostConfig } from "@plblum/jivs-engine/src/Interfaces/InputValueHost";
import { IValueHostsManager } from "@plblum/jivs-engine/src/Interfaces/ValueHostsManager";
import { createMinimalValidationServices } from "./support";
import { ValidationManager } from '@plblum/jivs-engine/src/Validation/ValidationManager';
import { ValidationSeverity } from "@plblum/jivs-engine/src/Interfaces/Validation";
import { IValidationManager } from "@plblum/jivs-engine/src/Interfaces/ValidationManager";
import { DataTypeConverterService } from "@plblum/jivs-engine/src/Services/DataTypeConverterService";
import { IntegerConverter, TotalDaysConverter } from "@plblum/jivs-engine/src/DataTypes/DataTypeConverters";
import { NumberFormatter, StringFormatter } from "@plblum/jivs-engine/src/DataTypes/DataTypeFormatters";
import { ConditionFactory } from "@plblum/jivs-engine/src/Conditions/ConditionFactory";
import { LoggingLevel } from "@plblum/jivs-engine/src/Interfaces/LoggerService";
import { DataTypeFormatterService } from "@plblum/jivs-engine/src/Services/DataTypeFormatterService";
import { ValueHostType } from "@plblum/jivs-engine/src/Interfaces/ValueHostFactory";

// Here's our target function to use with a CalcValueHost. 
// Assign CalcValueHostConfig.calcFn to it.
function differenceBetweenDates(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) : CalculationHandlerResult {
    let totalDays1 = callingValueHost.convert(findValueHosts.getValueHost('StartDate')?.getValue(), LookupKey.TotalDays);
    let totalDays2 = callingValueHost.convert(findValueHosts.getValueHost('EndDate')?.getValue(), LookupKey.TotalDays);
    if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
        return undefined;   // can log with findValueHosts.services.logger.log();
    return Math.abs(totalDays2 - totalDays1);
}

// written so you can call this function and use the configured ValidationManager to see
// what happens when you call validate with different inputs.
export function configureVMForDifferentBetweenDate(): IValidationManager {
    // create the CalcValueHostConfig to supply to the ValidationManager
        // fluent: let diffDaysConfig = config().calc('DiffDays', LookupKey.Integer, differenceBetweenDates);    
    let diffDaysConfig: CalcValueHostConfig = {
        valueHostType: ValueHostType.Calc, // = 'Calc',
        name: 'DiffDays',
        dataType: LookupKey.Integer,
        calcFn: differenceBetweenDates
    };


    // create the 'StartDate' input with two conditions:
    // startDate <= endDate
    // abs(endDate-startDate) < 10
        // fluent: let startDateConfig = config().input('StartDate', 'Date', { label: 'Start date' })
        //                .lessThanOrEqual('EndDate', 'Start date must be less than or equal to End date.', { severity: ValidationSeverity.Severe });
        //                .lessThanValue(10, 'The two dates must be less than {CompareTo} days apart.', { valueHostName: 'DiffDays' });
    let startDateConfig: InputValueHostConfig = {
        valueHostType: ValueHostType.Input, // = 'Input'
        name: 'StartDate',
        dataType: 'Date',
        label: 'Start date',
        validatorConfigs: [
            {
                conditionConfig: <LessThanOrEqualConditionConfig>{
                    conditionType: ConditionType.LessThanOrEqual,
                    secondValueHostName: 'EndDate',
                },
                errorMessage: '{Label} must be less than or equal to {SecondLabel}.',
                severity: ValidationSeverity.Severe // to avoid running the next validator when there is an error
            },        
            {
                conditionConfig: <LessThanValueConditionConfig>{
                    conditionType: ConditionType.LessThanValue,
                    valueHostName: 'DiffDays',  // source is our CalcValueHost
                    secondValue: 10,    // must be less than 10 days
                },
                errorMessage: 'The two dates must be less than {CompareTo} days apart.'
            }
        ]
    };

        // fluent: let endDateConfig = config().input('EndDate', 'Date', { label: 'End date' }); 
    let endDateConfig: InputValueHostConfig = {
        valueHostType: ValueHostType.Input, // = 'Input'
        name: 'EndDate',
        dataType: 'Date',
        label: 'End date',
        validatorConfigs: []
    };

    let services = createMinimalValidationServices();
    // let's add the supporting tools needed by this example
    // normally you call createValidationServices() which already has this stuff setup
    let convertService = services.dataTypeConverterService as DataTypeConverterService;
    convertService.register(new TotalDaysConverter());  // for LookupKey.TotalDays
    convertService.register(new IntegerConverter());    // for LookupKey.Integer
    let formatterService = services.dataTypeFormatterService as DataTypeFormatterService;
    formatterService.register(new StringFormatter());  // for {Label} and {SecondLabel} tokens in error message    
    formatterService.register(new NumberFormatter());  // for {CompareTo} token in error message    
    let conditionFactory = services.conditionFactory as ConditionFactory;
    // DataTypeCheck is auto generated. So its needed here.
    conditionFactory.register<DataTypeCheckConditionConfig>(ConditionType.DataTypeCheck,
        (config) => new DataTypeCheckCondition(config));
    conditionFactory.register<LessThanValueConditionConfig>(ConditionType.LessThanValue,
        (config) => new LessThanValueCondition(config));
    conditionFactory.register<LessThanOrEqualConditionConfig>(ConditionType.LessThanOrEqual,
        (config) => new LessThanOrEqualCondition(config));
    services.loggerService.minLevel = LoggingLevel.Debug;
    
    let vm = new ValidationManager({
        services: services,
        valueHostConfigs: [
            startDateConfig,
            endDateConfig,
            diffDaysConfig
        ]
    });

    return vm;
}
// This shows it in action.
// Even better, look at the unit tests in \tests folder as they run the same examples.
function demoSeveralCases(): void {
    let vm = configureVMForDifferentBetweenDate();
    vm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
    vm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
    let diffDays = vm.getValueHost('DiffDays')?.getValue();
    // diffDays = 0
    let result = vm.validate();
    /* 
    result = {
        issuesFound: null,
        status: ValidationStatus.Valid,
    }
    */
    vm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 10))); 
    diffDays = vm.getValueHost('DiffDays')?.getValue();
    // diffDays == 9
    result = vm.validate();
    /* 
    result = {
        issuesFound: null,
        status: ValidationStatus.Valid,
    }
    */
    vm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 11))); 
    diffDays = vm.getValueHost('DiffDays')?.getValue();
    // diffDays == 10 
    result = vm.validate();
    /* 
    result == {
        issuesFound: [{
            errorMessage: 'The two dates must be less than 10 days apart.'
         }],
        status: ValidationStatus.Invalid,
    }
    */    

    vm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 12)));    // start > end
    diffDays = vm.getValueHost('DiffDays')?.getValue();
    // diffDays == 1 
    result = vm.validate();
    /* 
    result == {
        issuesFound: [{
            errorMessage: 'Start date must be less than or equal to End date.'
        }],
        status: ValidationStatus.Invalid,
    }
    */    
}