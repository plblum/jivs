import { MockDocument, MockHTMLSelectElement } from '../src/Config_example_common_code';
import {
    configPersonEditFormRules
} from '../src/Config_with_a_model';

import { ValueHostsManager } from "@plblum/jivs-engine/build/Validation/ValueHostsManager";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { FieldValueHost } from '@plblum/jivs-engine/build/ValueHosts/FieldValueHost';


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

describe('configPersonEditFormRules', () => {
    it('should configure ValueHostsManager correctly', () => {
        // Execute configExample
        let vhm: ValueHostsManager;
        expect(() => vhm = configPersonEditFormRules()).not.toThrow();
        let vh1 = vhm!.getValueHost('FirstName');
        let vh2 = vhm!.getValueHost('LastName');
        let vh3 = vhm!.getValueHost('BirthDate');
        expect(vh1).toBeInstanceOf(FieldValueHost);
        expect(vh1!.getDataType()).toBe(LookupKey.String);
        expect(vh1!.getLabel()).toBe('First name');
        expect(vh2).toBeInstanceOf(FieldValueHost);
        expect(vh2!.getDataType()).toBe(LookupKey.String);
        expect(vh2!.getLabel()).toBe('Last name');
        expect(vh3).toBeInstanceOf(FieldValueHost);
        expect(vh3!.getDataType()).toBe(LookupKey.Date);
        expect(vh3!.getLabel()).toBe('Birth date');

    });
});