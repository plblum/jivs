import { MockDocument, MockHTMLSelectElement } from './Config_example_common_code.test';
import {
    configExample
} from '../src/Config_with_BusinessLogic_using_Builder';

import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { InputValueHost } from '@plblum/jivs-engine/build/ValueHosts/InputValueHost';
import { StaticValueHost } from '@plblum/jivs-engine/build/ValueHosts/StaticValueHost';
import { CalcValueHost } from '@plblum/jivs-engine/build/ValueHosts/CalcValueHost';


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