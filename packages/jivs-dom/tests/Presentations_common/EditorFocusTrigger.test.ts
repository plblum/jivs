/** @jest-environment jsdom */
import { EditorFocusTrigger } from '../../src/Presentations_common/EditorFocusTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// Editor focus transitions request open and close with the trigger's configured delays.
describe('EditorFocusTrigger.install', () => {
    test('Opens on focusin and closes on focusout for each editor', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new EditorFocusTrigger(125, 450);

        testItem.install(setup.context);

        expect(setup.editorEventHandlerCalls.map(call => call.eventName)).toEqual(['focusin', 'focusout']);
        setup.editorEventHandlerCalls[0].editor.dispatchEvent(
            new FocusEvent('focusin', { bubbles: true })
        );
        setup.editorEventHandlerCalls[1].editor.dispatchEvent(
            new FocusEvent('focusout', { bubbles: true })
        );

        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 125 },
            { name: 'close', context: setup.context, delay: 450 }
        ]);
    });

    test('Uses default delays when constructor delays are omitted', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new EditorFocusTrigger();

        testItem.install(setup.context);
        setup.editorEventHandlerCalls[0].handler(new FocusEvent('focusin'));
        setup.editorEventHandlerCalls[1].handler(new FocusEvent('focusout'));

        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 500 },
            { name: 'close', context: setup.context, delay: 500 }
        ]);
    });
});
