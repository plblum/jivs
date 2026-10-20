import { ErrorMessageDisplayClickTrigger } from '../../src/Presentations_common/ErrorMessageDisplayClickTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// A click toggles the error display exactly once with immediate open and close requests.
describe('ErrorMessageDisplayClickTrigger.install', () => {
    test('Requests one immediate toggle when the display element is clicked', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new ErrorMessageDisplayClickTrigger();

        testItem.install(setup.context);
        setup.element.click();

        expect(setup.actions).toEqual([{
            name: 'toggle',
            context: setup.context,
            openDelay: 0,
            closeDelay: 0
        }]);
    });
});
