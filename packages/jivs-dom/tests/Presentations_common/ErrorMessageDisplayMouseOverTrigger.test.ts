/** @jest-environment jsdom */
import { ErrorMessageDisplayMouseOverTrigger } from '../../src/Presentations_common/ErrorMessageDisplayMouseOverTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// Pointer movement onto the display requests opening with its configured delay.
describe('ErrorMessageDisplayMouseOverTrigger.install', () => {
    test('Opens on mouseover with its configured delay', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new ErrorMessageDisplayMouseOverTrigger(300);

        testItem.install(setup.context);
        setup.element.dispatchEvent(new MouseEvent('mouseover'));

        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 300 }
        ]);
    });
});
