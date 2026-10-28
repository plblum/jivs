import type { IPopupContext, IPopupMechanism } from '../../../src/Interfaces/PopupErrorMessageDisplays';
import { PopupContext } from '../../../src/FieldPresentations/PopupContext';

/**
 * The context for one emulated popup opening. It holds the wrapper element that stands in for
 * the popup a real library would create.
 */
export class EmulatedPopupContext extends PopupContext
{
    /** Present only while the popup is showing. */
    public wrapper: HTMLElement | null = null;
    public disposeCalls: number = 0;

    public override dispose(): void
    {
        this.disposeCalls++;
        this.wrapper?.remove();
        this.wrapper = null;
        super.dispose();
    }
}

/**
 * An IPopupMechanism for integration tests. There is no popup library in this repository,
 * so this emulator does what the guide (Implementing_IPopupMechanism.md) asks of one, minus positioning:
 * open() puts the message frame content into a wrapper element appended to document.body,
 * where the test can see it, and close() removes it.
 *
 * It does not dismiss on its own. closeFromMechanism() is the test's way to make the "library" close
 * the popup for any reason of its own (Escape, outside click, ...), which must tell the presentation through
 * controller.closed().
 */
export class EmulatedPopupMechanism implements IPopupMechanism
{
    public readonly createdContexts: EmulatedPopupContext[] = [];
    public openCount: number = 0;
    public closeCount: number = 0;

    /**
     * When true, close() calls controller.closed() before returning, like a library whose
     * closed callback fires synchronously. The guide says the presentation must cope with that.
     */
    public notifyClosedDuringClose: boolean = false;

    /**
     * When true, each open and close is written to the console, including the wrapper's HTML.
     * It is for a person studying a test. Run jest without --silent to see it.
     */
    public logToConsole: boolean = false;

    private log(action: string, context: EmulatedPopupContext, wrapper: HTMLElement | null): void
    {
        if (!this.logToConsole)
            return;
        let index = this.createdContexts.indexOf(context);
        console.log(`EmulatedPopupMechanism ${action} (context #${index})\n` +
            (wrapper ? wrapper.outerHTML : '(no wrapper)'));
    }

    public createContext(options?: object): IPopupContext
    {
        let context = new EmulatedPopupContext();
        this.createdContexts.push(context);
        return context;
    }

    public open(context: IPopupContext): boolean
    {
        let emulated = context as EmulatedPopupContext;
        if (!emulated.anchorElement || !emulated.messageFrameContent)
            return false;
        let wrapper = document.createElement('div');
        wrapper.className = 'emulated-popup';
        wrapper.appendChild(emulated.messageFrameContent);
        document.body.appendChild(wrapper);
        emulated.wrapper = wrapper;
        this.openCount++;
        this.log('open', emulated, wrapper);
        return true;
    }

    public close(context: IPopupContext): boolean
    {
        let emulated = context as EmulatedPopupContext;
        this.closeCount++;
        this.log('close', emulated, emulated.wrapper);
        emulated.wrapper?.remove();
        emulated.wrapper = null;
        if (this.notifyClosedDuringClose)
            emulated.controller?.closed();
        return true;
    }

    public dispose(): void
    {
        for (let context of this.createdContexts)
        {
            context.wrapper?.remove();
            context.wrapper = null;
        }
    }

    /** The contexts whose popup is showing, in the order they opened. */
    public get openPopups(): EmulatedPopupContext[]
    {
        return this.createdContexts.filter(c => c.wrapper !== null && c.wrapper.isConnected);
    }

    /** The text the user would read in the popup. Empty when it is not showing. */
    public popupTextFor(context: EmulatedPopupContext): string
    {
        return context.wrapper?.textContent ?? '';
    }

    /**
     * The "library" closes the popup by itself. It is the last use of the context, because
     * controller.closed() may dispose it.
     * @param context The popup to close. Defaults to the most recently opened one.
     */
    public closeFromMechanism(context?: EmulatedPopupContext): void
    {
        let target = context ?? this.openPopups[this.openPopups.length - 1];
        if (!target || !target.wrapper)
            throw new Error('closeFromMechanism: no popup is open.');
        let controller = target.controller;
        this.log('closeFromMechanism', target, target.wrapper);
        target.wrapper.remove();
        target.wrapper = null;
        controller?.closed();
    }
}
