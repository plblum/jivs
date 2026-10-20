import { ErrorMessageDisplayFocusInTrigger } from '../../src/Presentations_common/ErrorMessageDisplayFocusInTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// Focus entering the display requests opening after the configured delay.
describe('ErrorMessageDisplayFocusInTrigger.install', () => {
    test('Opens on focusin with its configured delay', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new ErrorMessageDisplayFocusInTrigger(250);

        testItem.install(setup.context);
        setup.element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 250 }
        ]);
    });
});
