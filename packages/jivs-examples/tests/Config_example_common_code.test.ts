import { createValidationServices } from '../src/Config_example_common_code';

// Mocks for the document.getElementById function and the HTMLSelectElement 'timeZonePicker'
// used in all examples

export class MockHTMLSelectElement {
    constructor(id: string, initiaValue: string = 'UTC+1') {
        this.id = id;
        this.value = initiaValue;
    }
    id: string;
    value: string;
    public addEventListener(event: string, callback: (e: Event) => void): void {
        if (event === "change") {
            this._onchangeCallback = callback;

        }
    }
    public onchange(event: Event): void {
        this._onchangeCallback(event);
    }
    private _onchangeCallback: (event: Event) => void = () => { };
}
export class MockDocument {
    public getElementById(id: string): MockHTMLSelectElement | null {
        switch (id) {
            case 'timeZonePicker':
                return this._timeZonePicker;
        }
        return null;
    }
    private _timeZonePicker = new MockHTMLSelectElement('timeZonePicker', 'UTC+1');
}

describe('Config_example_common_code', () => {
    it('createValidationServices', () => {
        let services = createValidationServices('en');
        expect(services).toBeDefined();
        //!!!PENDING: Confirm the services object is correct
    });
});