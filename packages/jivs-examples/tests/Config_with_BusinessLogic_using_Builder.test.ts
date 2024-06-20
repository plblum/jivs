import { build } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { jest } from '@jest/globals';
import { PropertyValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/PropertyValueHost';
import { MockDocument, MockHTMLSelectElement, createValidationServices, timeZoneRegex } from '../src/Config_example_common_code';
import {
    ReportingBusinessLogicBuilder, 
    configExample
} from '../src/Config_with_BusinessLogic_using_Builder';

import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { RegExpConditionConfig, LessThanConditionConfig } from "@plblum/jivs-engine/build/Conditions/ConcreteConditions";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { InputValueHost } from '@plblum/jivs-engine/build/ValueHosts/InputValueHost';
import { StaticValueHost } from '@plblum/jivs-engine/build/ValueHosts/StaticValueHost';
import { CalcValueHost } from '@plblum/jivs-engine/build/ValueHosts/CalcValueHost';


describe('ReportingBusinessLogicBuilder', () => {
    it('should return correct fields metadata', () => {
        let builder = build(createValidationServices('en'));
        const blBuilder = new ReportingBusinessLogicBuilder(builder);
        blBuilder.populate();
        let vmConfig = builder.complete();
        let expectedStartDate: PropertyValueHostConfig = {
            valueHostType: 'Property',
            name: 'startDate',
            dataType: 'Date',
            validatorConfigs: [
                {
                    errorMessage: 'Second date less than first',
                    conditionConfig: <LessThanConditionConfig>{
                        conditionType: ConditionType.LessThan,
                        secondValueHostName: 'endDate'

                    }
                }
            ]
        };
        let expectedEndDate: PropertyValueHostConfig = {
            valueHostType: 'Property',
            name: 'endDate',
            dataType: 'Date',
            validatorConfigs: []
        };
        let expectedTimeZone: PropertyValueHostConfig = {
            valueHostType: 'Property',
            name: 'timeZone',
            dataType: 'String',
            validatorConfigs: [
                {
                    errorCode: 'TimeZone',
                    errorMessage: 'Invalid time zone',
                    conditionConfig: <RegExpConditionConfig>{
                        conditionType: ConditionType.RegExp,
                        expression: timeZoneRegex,
                        ignoreCase: false
                    }
                }
            ]
        };
        expect(vmConfig.valueHostConfigs).toEqual([expectedStartDate, expectedEndDate, expectedTimeZone]);
    });
});

let originalDocument: any;
beforeEach(() => {
    // Mock document.getElementById to always return a select element
    originalDocument = global.document;

    global.document = new MockDocument() as unknown as Document;

});
afterEach(() => {
    // Restore the original implementation if needed
 //   jest.restoreAllMocks();
    global.document = originalDocument;
});

describe('configExample', () => {
    it('should configure validation manager correctly', () => {
        // Execute configExample
        let vm: ValidationManager;
        expect(() => vm = configExample()).not.toThrow();
        let vh1 = vm!.getValueHost('startDate');
        let vh2 = vm!.getValueHost('endDate');
        let vh3 = vm!.getValueHost('timeZone');
        let vh4 = vm!.getValueHost('numOfDays');
        let vh5 = vm!.getValueHost('diffDays');
        expect(vh1).toBeInstanceOf(InputValueHost);
        expect(vh1!.getDataType()).toBe(LookupKey.Date);
        expect(vh1!.getLabel()).toBe('Start date');
        expect(vh2).toBeInstanceOf(InputValueHost);
        expect(vh2!.getDataType()).toBe(LookupKey.Date);
        expect(vh2!.getLabel()).toBe('End date');
        expect(vh3).toBeInstanceOf(InputValueHost);
        expect(vh3!.getDataType()).toBe(LookupKey.String);
        expect(vh4).toBeInstanceOf(StaticValueHost);
        expect(vh4!.getDataType()).toBe(LookupKey.Integer);
        expect(vh4!.getValue()).toBe(10);
        expect(vh5).toBeInstanceOf(CalcValueHost);
        expect(vh5!.getDataType()).toBe(LookupKey.Integer);
    });
    it('call to timeZonePicker.onchange will change the start date to append "UTC+1"', () => {
        // Execute configExample
        let vm: ValidationManager;
        expect(() => vm = configExample()).not.toThrow();
        let timeZonePicker = global.document.getElementById('timeZonePicker') as unknown as MockHTMLSelectElement;
        timeZonePicker.onchange({} as Event);
        let vh1 = vm!.getValueHost('startDate');
        expect(vh1!.getLabel()).toBe('Start date (UTC+1)');
    });
});