import { createJivsServices } from '../src/Config_example_common_code';

// Mocks for the document.getElementById function and the HTMLSelectElement 'timeZonePicker'
// used in all examples


describe('Config_example_common_code', () => {
    it('createJivsServices', () => {
        let services = createJivsServices('en');
        expect(services).toBeDefined();
        //!!!PENDING: Confirm the services object is correct
    });
});