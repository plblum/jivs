/** @jest-environment jsdom */
import { ErrorMessageDisplayFocusOutTrigger } from '../../src/Presentations_common/ErrorMessageDisplayFocusOutTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// Focus leaving the display requests closing after the configured delay.
describe('ErrorMessageDisplayFocusOutTrigger.install', () => {
    test('Closes on focusout with its configured delay', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new ErrorMessageDisplayFocusOutTrigger(425);

        testItem.install(setup.context);
        setup.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

        expect(setup.actions).toEqual([
            { name: 'close', context: setup.context, delay: 425 }
        ]);
    });
});
