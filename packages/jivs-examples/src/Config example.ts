// This example demonstrates how to configure and create the ValidationManager
// using a simple model. It expands upon the diagram shown here:
// https://github.com/plblum/jivs/tree/main#apioverview

import { ValidationServices } from "@plblum/jivs-engine/src/Services/ValidationServices";
import { createMinimalValidationServices } from "./support";
import { DataTypeCheckConditionConfig, DataTypeCheckCondition, LessThanConditionConfig, LessThanCondition } from "@plblum/jivs-engine/src/Conditions/ConcreteConditions";
import { ConditionFactory } from "@plblum/jivs-engine/src/Conditions/ConditionFactory";
import { ConditionType } from "@plblum/jivs-engine/src/Conditions/ConditionTypes";
import { TotalDaysConverter, IntegerConverter } from "@plblum/jivs-engine/src/DataTypes/DataTypeConverters";
import { StringFormatter, NumberFormatter } from "@plblum/jivs-engine/src/DataTypes/DataTypeFormatters";
import { DataTypeConverterService } from "@plblum/jivs-engine/src/Services/DataTypeConverterService";
import { DataTypeFormatterService } from "@plblum/jivs-engine/src/Services/DataTypeFormatterService";
import { TextLocalizerService } from "@plblum/jivs-engine/src/Services/TextLocalizerService";
import { LookupKey } from "@plblum/jivs-engine/src/DataTypes/LookupKeys";
import { IValidationManager, ValidationManagerConfig } from "@plblum/jivs-engine/src/Interfaces/ValidationManager";
import { InputValueHostConfig } from "@plblum/jivs-engine/src/Interfaces/InputValueHost";
import { ValidationSeverity } from "@plblum/jivs-engine/src/Interfaces/Validation";
import { CalcValueHostConfig, CalculationHandlerResult, ICalcValueHost } from "@plblum/jivs-engine/src/Interfaces/CalcValueHost";
import { IValueHostsManager } from "@plblum/jivs-engine/src/Interfaces/ValueHostResolver";
import { ValueHostType } from "@plblum/jivs-engine/src/Interfaces/ValueHostFactory";
import { NonInputValueHostConfig } from "@plblum/jivs-engine/src/Interfaces/NonInputValueHost";
import { ValidationManager } from "@plblum/jivs-engine/src/ValueHosts/ValidationManager";
import { config } from "@plblum/jivs-engine/src/ValueHosts/Fluent";

export interface FilterDatesModel
{
    startDate: Date;
    endDate: Date;
    timeZone: string;
}
// For the purposes of this demo, this function represents
// what is driven by Business Logic.
// The UI will update it with error messages and labels that better suite it.
function BusinessLogicPhase_UseConfigObjects(): ValidationManagerConfig
{
    // create the 'StartDate' input with two conditions:
    // startDate < endDate
    // abs(endDate-startDate) < 10
    let startDateConfig: InputValueHostConfig = {
        type: ValueHostType.Input,  // = "Input"          
        name: 'StartDate',          // we refer to this as "ValueHostName" throughout documentation
        dataType: LookupKey.Date,   // = "Date" which is just the Date part of DateTime and assumes UTC
        validatorConfigs: [
            {
                conditionConfig: <LessThanConditionConfig>{
                    type: ConditionType.LessThan,
                    secondValueHostName: 'EndDate',
                },
                // we expect error messages here to be from business logic layer.
                // We'll let the UI override them elsewhere
                errorMessage: 'StartDate must be less than to EndDate.',
                severity: ValidationSeverity.Severe // to avoid running the next validator when there is an error
            },        
            {
    // Because both validators are LessThan, we need to further differentiate them
    // by supplying an error code on one. The other will use the default errorCode of its conditionType.                
                errorCode: 'NumOfDays', 
                conditionConfig: <LessThanConditionConfig>{
                    type: ConditionType.LessThan,
                    valueHostName: 'DiffDays',          // source is our CalcValueHost
                    secondValueHostName: 'NumOfDays',    // must be less than this
                },
                // we'll be overriding this message too.
                errorMessage: 'Less than 10 days apart.'
            }
        ]
    };

    // No validators needed on EndDate. Jivs adds a DataTypeCheckCondition
    // to validate the input is indeed a date.
    let endDateConfig: InputValueHostConfig = {
        type: ValueHostType.Input,
        name: 'EndDate',
        dataType: LookupKey.Date, 
        validatorConfigs: []
    };

    // We need to use a calculation to get the difference in days part
    // of the validation rule where diff in days < X days.
    // This Config uses the differenceBetweenDates function to do the work.
    let diffDaysConfig: CalcValueHostConfig = {
        type: ValueHostType.Calc,   // = "Calc"
        name: 'DiffDays',
        dataType: LookupKey.Integer,    // = "Integer"
        calcFn: differenceBetweenDates
    };    

    // supply the value for the number of days used in validation
    // through this NonInputValueHost. Alternatively, it could
    // be assigned directly in the LessThanConditionConfig.
    let numOfDaysConfig: NonInputValueHostConfig = {
        type: ValueHostType.NonInput,   // = "NonInput"
        name: 'NumOfDays',
        dataType: LookupKey.Integer
    };

    let vmConfig: ValidationManagerConfig = {
        services: createValidationServices(),
        valueHostConfigs: [
            startDateConfig,
            endDateConfig,
            diffDaysConfig,
            numOfDaysConfig
        ]
    };
    return vmConfig;
}

// In this case, the user has decided that they won't use business logic
// to drive the configuration. They can use the fluent syntax.
function BusinessLogicPhase_UseFluentSyntax(): ValidationManagerConfig
{
    // create the 'StartDate' input with two conditions:
    // startDate <= endDate
    // abs(endDate-startDate) < num of days
    // Because both validators are LessThan, we need to further differentiate them
    // by supplying an error code on one. The other will use the default errorCode of its conditionType.
    let startDateConfig = config().input('StartDate', LookupKey.Date, { label: 'Start date' })
        .lessThan('EndDate', {}, 'StartDate must be less than to EndDate.', { severity: ValidationSeverity.Severe })    // FYI: errorCode="LessThan"
        .lessThan('NumOfDays', { valueHostName: 'DiffDays' }, 'Less than 10 days apart.', { errorCode: 'NumOfDays'});

    // No validators needed on EndDate. Jivs adds a DataTypeCheckCondition
    // to validate the input is indeed a date.
    let endDateConfig = config().input('EndDate', LookupKey.Date, { label: 'End date' });


    // We need to use a calculation to get the difference in days part
    // of the validation rule where diff in days < X days.
    // This Config uses the differenceBetweenDates function to do the work.
    let diffDaysConfig = config().calc('DiffDays', LookupKey.Integer, differenceBetweenDates);

    // supply the value for the number of days used in validation
    // through this NonInputValueHost. Alternatively, it could
    // be assigned directly in the LessThanConditionConfig.
    let numOfDaysConfig = config().nonInput('NumOfDays', LookupKey.Integer);

    let vmConfig: ValidationManagerConfig = {
        services: createValidationServices(),
        valueHostConfigs: [
            startDateConfig,
            endDateConfig,
            diffDaysConfig,
            numOfDaysConfig
        ]
    };
    return vmConfig;
}


// This is how the UI will incorporate the business logic's ValidationManagerConfig
export function UIPhase_Customize(use: 'objects' | 'fluent'): IValidationManager
{
    let vmConfig = use === 'objects' ? 
        BusinessLogicPhase_UseConfigObjects() :
        BusinessLogicPhase_UseFluentSyntax();
    let vm = new ValidationManager(vmConfig);

    // Apply any error messages and labels
    let startDateVH = vm.getInputValueHost('StartDate')!;
    startDateVH.setLabel('Start date');    // a second parameter is for localization
    let val1 = startDateVH.getValidator(ConditionType.LessThan);
    val1?.setErrorMessage('The two dates must be less than {CompareTo} days apart.');  // a second parameter is for localization
    // no need to setup error message for the other validator because
    // its done when setting up the services.

    let endDateVH = vm.getInputValueHost('EndDate')!;
    endDateVH.setLabel('End date');

    return vm;
}


// Your app will already have this function preconfigured,
// with the exception of default error messages.
// Here we show how to prepare it from scratch configured
// for this example.
function createValidationServices(): ValidationServices
{
    let services = createMinimalValidationServices();
    // We are expecting to use
    // Data Types: Date, Integer, String. We automatically get Date and String setup.
    // Integer is supported as "Number" automatically. We only need to
    // specify IntegerConverter if we want to run the Math.floor() function on the initial value.
    // We will use the TotalDaysConverter to return a number of days.
    // It will be used for our difference of dates calculation.

    let convertService = services.dataTypeConverterService as DataTypeConverterService;
    convertService.register(new TotalDaysConverter());  // for LookupKey.TotalDays
    convertService.register(new IntegerConverter());    // for LookupKey.Integer

    // Register the Conditions (validation rules) needed.
    // DataTypeCheck is auto generated. So its needed here.
    let conditionFactory = services.conditionFactory as ConditionFactory;
    conditionFactory.register<DataTypeCheckConditionConfig>(ConditionType.DataTypeCheck,
        (config) => new DataTypeCheckCondition(config));
    conditionFactory.register<LessThanConditionConfig>(ConditionType.LessThan,
        (config) => new LessThanCondition(config));
    conditionFactory.register<LessThanConditionConfig>(ConditionType.LessThan,
        (config) => new LessThanCondition(config));

    // We want to use tokens in our error messages so we can provide standardized templates
    let formatterService = services.dataTypeFormatterService as DataTypeFormatterService;
    formatterService.register(new StringFormatter());  // for {Label} and {SecondLabel} tokens in error message    
    formatterService.register(new NumberFormatter());  // for {CompareTo} token in error message

    // provide default error messages. 
    // These will override any passed through the ValidationManagerConfig as the supplied messages are assumed to
    // come from business logic, not the UI layer.
    // In this case, our error message for LessThan will be a custom one, so we will set it later.
    let textLocalizationService = services.textLocalizerService as TextLocalizerService;
    textLocalizationService.registerErrorMessage(ConditionType.LessThan, null, {
        '*': '{Label} must be less than to {SecondLabel}.'
    });
    
    textLocalizationService.registerErrorMessage(ConditionType.LessThan, null, {
        '*': '{Label} must be less than or equal to {SecondLabel}.'
    });

    return services;
}
// Used by CalcValueHosts in this example
function differenceBetweenDates(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) : CalculationHandlerResult {
    let totalDays1 = callingValueHost.convert(findValueHosts.getValueHost('StartDate')?.getValue(), LookupKey.TotalDays);
    let totalDays2 = callingValueHost.convert(findValueHosts.getValueHost('EndDate')?.getValue(), LookupKey.TotalDays);
    if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
        return undefined;   // can log with findValueHosts.services.logger.log();
    return Math.abs(totalDays2 - totalDays1);
}