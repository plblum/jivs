/** @jest-environment jsdom */
import { ErrorMessageDisplayKeyAsClickTrigger } from '../../src/Presentations_common/ErrorMessageDisplayKeyAsClickTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// Enter and Space provide keyboard activation by preventing their default action and clicking the element.
describe('ErrorMessageDisplayKeyAsClickTrigger.install', () => {
    test('Converts Enter and Space keydown events into clicks and ignores other keys', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let clickCount = 0;
        let testItem = new ErrorMessageDisplayKeyAsClickTrigger();
        setup.element.addEventListener('click', () => clickCount++);
        testItem.install(setup.context);

        let enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true
        });
        let spaceEvent = new KeyboardEvent('keydown', {
            key: ' ',
            bubbles: true,
            cancelable: true
        });
        let otherKeyEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true
        });
        setup.element.dispatchEvent(enterEvent);
        setup.element.dispatchEvent(spaceEvent);
        setup.element.dispatchEvent(otherKeyEvent);

        expect(clickCount).toBe(2);
        expect(enterEvent.defaultPrevented).toBe(true);
        expect(spaceEvent.defaultPrevented).toBe(true);
        expect(otherKeyEvent.defaultPrevented).toBe(false);
    });
});
