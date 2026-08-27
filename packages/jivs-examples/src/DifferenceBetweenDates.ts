
// Example: Demonstrates the use of a CalcValueHost to help build a condition
// that compares two values, one is the difference in days between StartDate and EndDate,
// the other is the number of days. It uses the LessThan condition, with the number of days set to 10.

import {
    DataTypeCheckCondition, DataTypeCheckConditionConfig
} from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import {
    LessThanOrEqualCondition,
    LessThanOrEqualConditionConfig, LessThanCondition, LessThanConditionConfig
} from '@plblum/jivs-engine/build/Conditions/ComparisonCondition_classes';
import { valueHost } from '@plblum/jivs-builder/build/Builder/ValidatorBuilder';

import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ICalcValueHost } from '@plblum/jivs-engine/build/Interfaces/CalcValueHost';
import { SimpleValueType } from '@plblum/jivs-engine/build/Interfaces/DataTypeConverterService';
import { createMinimalJivsServices } from './support';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { IntegerConverter, UTCDateOnlyConverter } from '@plblum/jivs-engine/build/DataTypes/DataTypeConverters';
import { NumberFormatter, StringFormatter, DateFormatter } from '@plblum/jivs-engine/build/DataTypes/DataTypeFormatters';
import { ConditionFactory } from '@plblum/jivs-engine/build/Conditions/ConditionFactory';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { DataTypeFormatterService } from '@plblum/jivs-engine/build/Services/DataTypeFormatterService';
import { ValueHostRulesOptions } from '@plblum/jivs-builder/build/Interfaces/ValueHostRules';
import { ValueHostRulesBase } from '@plblum/jivs-builder/build/ValueHostRules/ValueHostRules';
import { IValueHostsManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';

export class DateRangeFormRules extends ValueHostRulesBase {
    constructor(services: IJivsServices) {
        super(services);
    }
    protected configureRules(builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions): void {
        builder.field('StartDate', LookupKey.Date, { label: 'Start date' })
            .lessThanOrEqual(valueHost('EndDate'))
            .lessThan(valueHost('NumOfDays'),   // right operand of the comparison
                {
                    valueHostName: 'DiffDays',  // compare to this valueHost, not StartDate
                    errorMessage: 'Less than {compareTo} days apart',   // our preferred error message,
                    errorCode: 'NumOfDays' // ensures a unique error code, not usually needed because the condition supplies a default of 'LessThanOrEqual'
                 }); 
        builder.field('EndDate', LookupKey.Date, { label: 'End date' });
        builder.static('NumOfDays', LookupKey.Integer, { initialValue: 10 });
        builder.calc('DiffDays', LookupKey.Integer, this.differenceBetweenDates);   // eslint-disable-line @typescript-eslint/unbound-method
    }

// Here's our target function to use with a CalcValueHost. 
// Assign CalcValueHostConfig.calcFn to it.
    private differenceBetweenDates(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) : SimpleValueType {
        let totalDays1 = callingValueHost.convert(
            findValueHosts.getValueHost('StartDate')?.getValue(),
            null, LookupKey.TotalDays);
        let totalDays2 = callingValueHost.convert(
            findValueHosts.getValueHost('EndDate')?.getValue(),
            null, LookupKey.TotalDays);
        if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
            return undefined;   // can log with findValueHosts.services.logger.log();
        return Math.abs(totalDays2 - totalDays1);
    }    
}    

// Our starting point is createMinimumJivsServices() 
// which is a really-stripped down version of createJivsServices() that is in support.ts.
// Since you will be using createJivsServices(), most of this work is done
// for you. We're trying to expose you to what it takes to expand the services
// within this example.
// @returns 
function createJivsServicesForThisExample(): IJivsServices {
    // very stripped down version of createJivsServices() in support.ts
    let services = createMinimalJivsServices('en');

    // let's add the supporting tools needed by this example
    // normally you call createJivsServices() which already has this stuff setup
    let convertService = services.dataTypeConverterService as DataTypeConverterService;
    convertService.register(new UTCDateOnlyConverter());  // for LookupKey.TotalDays
    convertService.register(new IntegerConverter());    // for LookupKey.Integer
    let formatterService = services.dataTypeFormatterService as DataTypeFormatterService;
    formatterService.register(new StringFormatter());  // for {Label} and {SecondLabel} tokens in error message    
    formatterService.register(new NumberFormatter());  // for {CompareTo} token in error message    
    formatterService.register(new DateFormatter());    // setValue() uses a formatter by default to convert native to text value
    let conditionFactory = services.conditionFactory as ConditionFactory;
    // DataTypeCheck is auto generated. So its needed here.
    conditionFactory.register<DataTypeCheckConditionConfig>(ConditionType.DataTypeCheck,
        (config) => new DataTypeCheckCondition(config));
    conditionFactory.register<LessThanConditionConfig>(ConditionType.LessThan,
        (config) => new LessThanCondition(config));
    conditionFactory.register<LessThanOrEqualConditionConfig>(ConditionType.LessThanOrEqual,
        (config) => new LessThanOrEqualCondition(config));
    conditionFactory.register<LessThanConditionConfig>(ConditionType.LessThan,
        (config) => new LessThanCondition(config));

    // This might be the only line you'd customize in your version of createJivsServices()
    // as it relates to this example.
    services.loggerService.minLevel = LoggingLevel.Debug;
    return services;
}

// written so you can call this function and use the configured ValueHostsManager to see
// what happens when you call validate with different inputs.
export function configureVMForDifferenceBetweenDates(): IValueHostsManager {
    let services = createJivsServicesForThisExample();
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();
    return new ValueHostsManager(config);
}
// This shows it in action.
// Even better, look at the unit tests in \tests folder as they run the same examples.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function demoSeveralCases(): void {
    let vhm = configureVMForDifferenceBetweenDates();
    vhm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
    vhm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 1)));
    let diffDays = vhm.getValueHost('DiffDays')?.getValue();
    // DiffDays = 0
    let result = vhm.validate();
    /* 
    result = {
        issuesFound: null,
        status: ValidationStatus.Valid,
    }
    */
    vhm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 10))); 
    diffDays = vhm.getValueHost('DiffDays')?.getValue();
    // DiffDays == 9
    result = vhm.validate();
    /* 
    result = {
        issuesFound: null,
        status: ValidationStatus.Valid,
    }
    */
    vhm.getValueHost('EndDate')?.setValue(new Date(Date.UTC(2000, 0, 11))); 
    diffDays = vhm.getValueHost('DiffDays')?.getValue();
    // DiffDays == 10 
    result = vhm.validate();
    /* 
    result == {
        issuesFound: [{
            errorMessage: 'The two dates must be less than 10 days apart.'
         }],
        status: ValidationStatus.Invalid,
    }
    */    

    vhm.getValueHost('StartDate')?.setValue(new Date(Date.UTC(2000, 0, 12)));    // start > end
    diffDays = vhm.getValueHost('DiffDays')?.getValue();
    // DiffDays == 1 
    result = vhm.validate();
    /* 
    result == {
        issuesFound: [{
            errorMessage: 'Start date must be less than or equal to End date.'
        }],
        status: ValidationStatus.Invalid,
    }
    */    
}