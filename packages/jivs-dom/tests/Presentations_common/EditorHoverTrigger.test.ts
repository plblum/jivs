/** @jest-environment jsdom */
import { EditorHoverTrigger } from '../../src/Presentations_common/EditorHoverTrigger';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

// Editor focus transitions request open and close with the trigger's configured delays.
describe('EditorHoverTrigger.install', () => {
    test('Opens on mouseenter and closes on mouseleave for each editor', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new EditorHoverTrigger(125, 450);

        testItem.install(setup.context);

        expect(setup.editorEventHandlerCalls.map(call => call.eventName)).toEqual(['mouseenter', 'mouseleave']);
        setup.editorEventHandlerCalls[0].editor.dispatchEvent(
            new FocusEvent('mouseenter', { bubbles: true })
        );
        setup.editorEventHandlerCalls[1].editor.dispatchEvent(
            new FocusEvent('mouseleave', { bubbles: true })
        );

        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 125 },
            { name: 'close', context: setup.context, delay: 450 }
        ]);
    });

    test('Uses default delays when constructor delays are omitted', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new EditorHoverTrigger();

        testItem.install(setup.context);
        setup.editorEventHandlerCalls[0].handler(new FocusEvent('mouseenter'));
        setup.editorEventHandlerCalls[1].handler(new FocusEvent('mouseleave'));

        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 500 },
            { name: 'close', context: setup.context, delay: 500 }
        ]);
    });
});
