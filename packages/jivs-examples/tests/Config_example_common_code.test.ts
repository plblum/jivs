import { createValidationServices } from '../src/Config_example_common_code';

// Mocks for the document.getElementById function and the HTMLSelectElement 'timeZonePicker'
// used in all examples


describe('Config_example_common_code', () => {
    it('createValidationServices', () => {
        let services = createValidationServices('en');
        expect(services).toBeDefined();
        //!!!PENDING: Confirm the services object is correct
    });
});