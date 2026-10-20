import type { IErrorMessageDisplayTriggerContext } from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { EditorTriggerBase } from '../../src/Presentations_common/EditorTriggerBase';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

class Publicify_EditorTriggerBase extends EditorTriggerBase
{
    public publicify_openDelay(): number
    {
        return this.openDelay;
    }

    public publicify_closeDelay(): number
    {
        return this.closeDelay;
    }

    protected override attachEventHandlers(
        editor: IJivsElement,
        context: IErrorMessageDisplayTriggerContext
    ): void
    {
        this.attachEventHandler(editor, context, 'custom-trigger', () => {
            context.controller.open(context, this.openDelay);
        });
    }
}

// Default and explicit delays define the timing every editor-based trigger passes to its controller.
describe('EditorTriggerBase constructor', () => {
    test('Uses 500 milliseconds by default and preserves explicit zero delays', () => {
        let defaultTrigger = new Publicify_EditorTriggerBase();
        let immediateTrigger = new Publicify_EditorTriggerBase(0, 0);

        expect(defaultTrigger.publicify_openDelay()).toBe(500);
        expect(defaultTrigger.publicify_closeDelay()).toBe(500);
        expect(immediateTrigger.publicify_openDelay()).toBe(0);
        expect(immediateTrigger.publicify_closeDelay()).toBe(0);
    });
});

// install resolves every editor anchor and uses its adapter to attach event handlers with the value host.
describe('EditorTriggerBase.install', () => {
    test('Attaches the subclass handler to each resolved editor', () => {
        let firstEditor = document.createElement('input') as IJivsElement;
        let secondEditor = document.createElement('input') as IJivsElement;
        let setup = createErrorMessageDisplayTriggerTestContext([firstEditor, secondEditor]);
        let testItem = new Publicify_EditorTriggerBase(75, 25);

        testItem.install(setup.context);

        expect(setup.resolveFieldElementCalls).toEqual([{
            valueHost: setup.valueHost,
            role: 'editor'
        }]);
        expect(setup.editorEventHandlerCalls.map(call => ({
            editor: call.editor,
            valueHost: call.valueHost,
            eventName: call.eventName
        }))).toEqual([
            { editor: firstEditor, valueHost: setup.valueHost, eventName: 'custom-trigger' },
            { editor: secondEditor, valueHost: setup.valueHost, eventName: 'custom-trigger' }
        ]);
        firstEditor.dispatchEvent(new Event('custom-trigger'));
        secondEditor.dispatchEvent(new Event('custom-trigger'));
        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 75 },
            { name: 'open', context: setup.context, delay: 75 }
        ]);
    });

    test('Does nothing when there are no resolved editors or an editor has no adapter definition', () => {
        let emptySetup = createErrorMessageDisplayTriggerTestContext([]);
        let missingAdapterSetup = createErrorMessageDisplayTriggerTestContext(
            [document.createElement('input') as IJivsElement],
            false
        );
        let testItem = new Publicify_EditorTriggerBase();

        expect(() => testItem.install(emptySetup.context)).not.toThrow();
        expect(() => testItem.install(missingAdapterSetup.context)).not.toThrow();
        expect(emptySetup.editorEventHandlerCalls).toHaveLength(0);
        expect(missingAdapterSetup.editorEventHandlerCalls).toHaveLength(0);
    });
});
