/** @jest-environment jsdom */
import { ErrorMessageDisplayMouseOutTrigger } from '../../src/Presentations_common/ErrorMessageDisplayMouseOutTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// Pointer movement out of the display requests closing with its configured delay.
describe('ErrorMessageDisplayMouseOutTrigger.install', () => {
    test('Closes on mouseout with its configured delay', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new ErrorMessageDisplayMouseOutTrigger(700);

        testItem.install(setup.context);
        setup.element.dispatchEvent(new MouseEvent('mouseout'));

        expect(setup.actions).toEqual([
            { name: 'close', context: setup.context, delay: 700 }
        ]);
    });
});
