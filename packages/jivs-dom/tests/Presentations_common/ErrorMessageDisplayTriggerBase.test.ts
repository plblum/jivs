import type { IErrorMessageDisplayTriggerContext } from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import { ErrorMessageDisplayTriggerBase } from '../../src/Presentations_common/ErrorMessageDisplayTriggerBase';
import { createErrorMessageDisplayTriggerTestContext } from '../TestSupport/ErrorMessageDisplayTriggerTestFunctions';

class Publicify_ErrorMessageDisplayTriggerBase extends ErrorMessageDisplayTriggerBase
{
    public publicify_delay(): number
    {
        return this.delay;
    }

    public installOpen(eventName: string, context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventToOpen(eventName, context);
    }

    public installClose(eventName: string, context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventToClose(eventName, context);
    }

    public install(_context: IErrorMessageDisplayTriggerContext): void
    {
    }
}

// The base retains its configured delay and wires open/close actions to its context element.
describe('ErrorMessageDisplayTriggerBase', () => {
    test('Exposes its configured delay and opens or closes with that delay', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let testItem = new Publicify_ErrorMessageDisplayTriggerBase(325);

        expect(testItem.publicify_delay()).toBe(325);
        testItem.installOpen('open-event', setup.context);
        testItem.installClose('close-event', setup.context);
        setup.element.dispatchEvent(new Event('open-event'));
        setup.element.dispatchEvent(new Event('close-event'));

        expect(setup.actions).toEqual([
            { name: 'open', context: setup.context, delay: 325 },
            { name: 'close', context: setup.context, delay: 325 }
        ]);
    });

    test('Does not throw when the context has no element to receive a listener', () => {
        let setup = createErrorMessageDisplayTriggerTestContext();
        let context = { ...setup.context, jivsElement: null } as unknown as IErrorMessageDisplayTriggerContext;
        let testItem = new Publicify_ErrorMessageDisplayTriggerBase(0);

        expect(() => testItem.installOpen('open-event', context)).not.toThrow();
        expect(() => testItem.installClose('close-event', context)).not.toThrow();
    });
});
