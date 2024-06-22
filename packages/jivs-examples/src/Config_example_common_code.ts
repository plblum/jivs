import { IValidationManager } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
/*
 Supporting code for all Config examples.
 Each example uses the same model and services, which are defined here.
 It expands upon the diagram shown here:
 https://github.com/plblum/jivs/tree/main#apioverview

 You will find:
 - How to configure the ValidationServices object by adding conditions, localizable error messages, 
   parsers, formatters, and converters.
 - The model used in the examples.
 - Callback functions used by the ValidationManager.
 - Unit testing Mocks for the document.getElementById function and the HTMLSelectElement 'timeZonePicker'


*/
import { ValidationServices } from "@plblum/jivs-engine/build/Services/ValidationServices";
import { createMinimalValidationServices } from "./support";
import {
    DataTypeCheckConditionConfig, DataTypeCheckCondition,
    LessThanConditionConfig, LessThanCondition,
    NotNullConditionConfig, NotNullCondition,
    RequireTextConditionConfig, RequireTextCondition,
    LessThanOrEqualConditionConfig, LessThanOrEqualCondition
} from "@plblum/jivs-engine/build/Conditions/ConcreteConditions";
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { TotalDaysConverter, IntegerConverter } from "@plblum/jivs-engine/build/DataTypes/DataTypeConverters";
import { StringFormatter, NumberFormatter } from "@plblum/jivs-engine/build/DataTypes/DataTypeFormatters";
import { ShortDatePatternParser, CleanUpStringParser } from "@plblum/jivs-engine/build/DataTypes/DataTypeParsers";
import { DateTimeCultureInfo } from "@plblum/jivs-engine/build/DataTypes/DataTypeParserBase";
import { DataTypeConverterService } from "@plblum/jivs-engine/build/Services/DataTypeConverterService";
import { DataTypeParserService } from '@plblum/jivs-engine/build/Services/DataTypeParserService';
import { SimpleValueType } from "@plblum/jivs-engine/build/Interfaces/DataTypeConverterService";
import { DataTypeFormatterService } from "@plblum/jivs-engine/build/Services/DataTypeFormatterService";
import { TextLocalizerService } from "@plblum/jivs-engine/build/Services/TextLocalizerService";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ICalcValueHost } from "@plblum/jivs-engine/build/Interfaces/CalcValueHost";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";

// Our model
export interface FilterDatesModel {
    // Validation rules:
    // - does not require a value (can be null)
    // - must be less than endDate
    // - must limit the difference is days to a value supplied 
    //   (a rule defined by the UI in this example)
    startDate: Date;
    // Validation rules:
    // - does not require a value (can be null)
    endDate: Date;
    // Validation rules:
    // - cannot be null
    // - ensure it is a legal time zone with pattern:
    //   UTC[+-]h, where h is a decimal number of hours. See timeZoneRegex
    timeZone: string;
}

export const timeZoneRegex = /^UTC([+-]\d+(\.\d+)?)?$/;

// Used by CalcValueHosts in this example
export function differenceBetweenDates(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
    let totalDays1 = callingValueHost.convert(findValueHosts.getValueHost('startDate')?.getValue(), LookupKey.TotalDays);
    let totalDays2 = callingValueHost.convert(findValueHosts.getValueHost('endDate')?.getValue(), LookupKey.TotalDays);
    if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
        return undefined;   // can log with findValueHosts.services.logger.log();
    return Math.abs(totalDays2 - totalDays1);
}


// Your app will already have this function preconfigured,
// with the exception of default error messages.
// Here we show how to prepare it from scratch configured
// for this example.
export function createValidationServices(cultureID: string): ValidationServices {
    let services = createMinimalValidationServices(cultureID);
    // We are expecting to use Data Types: Date, Integer, String. 
    // Jivs preconfigures Date and String.
    // Integer is supported as "Number" automatically. We only need to
    // specify IntegerConverter if we want to run the Math.floor() function on the initial value.
    // We will use the TotalDaysConverter to return a number of days.
    // It will be used for our difference of dates calculation.

    let convertService = services.dataTypeConverterService as DataTypeConverterService;
    convertService.register(new TotalDaysConverter());  // for LookupKey.TotalDays
    convertService.register(new IntegerConverter());    // for LookupKey.Integer

    // Register the Conditions (validation rules) needed.
    // DataTypeCheck is auto generated. So its needed here.
    services.conditionFactory.register<DataTypeCheckConditionConfig>(
        ConditionType.DataTypeCheck,
        (config) => new DataTypeCheckCondition(config));
    services.conditionFactory.register<LessThanConditionConfig>(
        ConditionType.LessThan,
        (config) => new LessThanCondition(config));
    services.conditionFactory.register<LessThanOrEqualConditionConfig>(
        ConditionType.LessThanOrEqual,
        (config) => new LessThanOrEqualCondition(config));
    services.conditionFactory.register<NotNullConditionConfig>(
        ConditionType.NotNull,
        (config) => new NotNullCondition(config));
    services.conditionFactory.register<RequireTextConditionConfig>(
        ConditionType.RequireText,
        (config) => new RequireTextCondition(config));

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

    textLocalizationService.registerErrorMessage(ConditionType.LessThanOrEqual, null, {
        '*': '{Label} must be less than or equal to {SecondLabel}.'
    });

    textLocalizationService.registerErrorMessage('NumOfDays', null, {
        '*': 'Less than {compareTo} days apart'
    });
    textLocalizationService.registerSummaryMessage('NumOfDays', null, {
        '*': 'The dates must be less than {compareTo} days apart'
    });

    // enable parsing so HTML change events can pass their raw value into the InputValueHost
    // through setInputValue, and the parser converts it to the native value

    let dtps = services.dataTypeParserService as DataTypeParserService;
    dtps.enabled = true;
    // NOTE: This is heavily stripped down from the default configuration, to have just enough for the demo.
    // For string input, such as the timeZone field
    dtps.register(new CleanUpStringParser(LookupKey.String, { trim: true }));

    // --- DateTimes ------
    // 'US'
    let enUSDateTimes: DateTimeCultureInfo = {
        order: 'mdy',
        shortDateSeparator: '/',
        twoDigitYearBreak: 29
    };

    dtps.register(new ShortDatePatternParser(LookupKey.Date, ['en-US'], enUSDateTimes, true));
    dtps.register(new ShortDatePatternParser(LookupKey.ShortDate, ['en-US'], enUSDateTimes, true));

    return services;
}

// Callback functions used by ValidationManager.

// Builder.onValueChanged is called each time any ValueHost's value changes.
// Here we want a change in the timeZone ValueHost to trigger a change in the startDate ValueHost's label.
// It demonstrates the use of the Modifier API
export function onValueChangedUsingModifierAPI(vh: IValueHost, oldValue: any) : void {
    if (vh.getName() === 'timeZone')
    {
        let vm = vh.valueHostsManager as IValidationManager;
        let modifier = vm.startModifying();
        modifier.input('startDate', null, { label: `Start date (${vm.getValueHost('timeZone')?.getValue()})` });
        modifier.apply();
    }
}
