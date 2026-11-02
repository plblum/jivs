/**
 * Tippy.js-based popup mechanism for Jivs-DOM.
 * This allows the PopupErrorMessageDisplayPresentation to use Tippy.js for displaying popup messages.
 * 
 * TippyPopupMechanism is an implementation of IPopupMechanism. Before Tippy can be used:
 * 1. Ensure that Tippy.js is loaded and available.
 * 2. Include the necessary CSS for Tippy.js in your project.
 * 3. Assign the TippyPopupMechanism to your JivsDomServices like this:
 * ```ts
 * import { TippyPopupMechanism } from '@plblum/jivs-dom-tippy';
 * // inside configureJivsDom() or similar initialization code
 * domServices.popupMechanism = new TippyPopupMechanism();
 * ```
 * 
 * @module jivs-dom-tippy/TippyPopupMechanism
 */

import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService.js';
import { PopupContext } from '@plblum/jivs-dom/build/FieldPresentations/PopupContext.js';
import type { IPopupContext, IPopupMechanism } from '@plblum/jivs-dom/build/Interfaces/PopupErrorMessageDisplays.js';
import tippyDefault from 'tippy.js';
import type { Instance, Props } from 'tippy.js';

const tippy = typeof tippyDefault === 'function'   // eslint-disable-line @typescript-eslint/naming-convention
    ? tippyDefault
    : (tippyDefault as unknown as { default: typeof tippyDefault }).default;

type AdapterOwnedOption = 'content' | 'trigger' | 'triggerTarget' | 'showOnCreate' | 'onShow' | 'onHide' | 'onHidden';

/**
 * Tippy properties accepted by the mechanism. The mechanism owns the reference,
 * content, manual trigger, initial show, and closure notification.
 */
export type TippyPopupOptions = Omit<Partial<Props>, AdapterOwnedOption> & {
    onHidden?: Props['onHidden'];
};

class TippyPopupContext extends PopupContext
{
    public readonly options: TippyPopupOptions;
    public instance: Instance | null = null;
    private _openStarted: boolean = false;
    private _closedNotified: boolean = false;
    private _disposed: boolean = false;

    constructor(
        options: TippyPopupOptions,
        private readonly _logFailure: (context: IPopupContext, message: string, error?: unknown) => void
    )
    {
        super();
        this.options = options;
    }

    public startOpen(): boolean
    {
        if (this._disposed || this._openStarted)
            return false;
        this._openStarted = true;
        return true;
    }

    public notifyClosed(): void
    {
        if (this._disposed || this._closedNotified)
            return;
        this._closedNotified = true;
        let controller = this.controller;
        controller?.closed();
    }

    public override dispose(): void
    {
        if (this._disposed)
            return;
        this._disposed = true;
        let instance = this.instance;
        this.instance = null;
        try
        {
            if (instance && !instance.state.isDestroyed)
                instance.destroy();
        }
        catch (error)
        {
            this._logFailure(this, 'Error disposing popup', error);
        }
        finally
        {
            super.dispose();
        }
    }

    public get disposed(): boolean
    {
        return this._disposed;
    }
}

/**
 * Displays Jivs-DOM's supplied message element with Tippy.js.
 *
 * Opening triggers remain the responsibility of ErrorMessageDisplayPresentation.
 */
export class TippyPopupMechanism implements IPopupMechanism
{
    public createContext(options?: object): IPopupContext
    {
        // IPopupMechanism intentionally leaves options untyped; this package supplies their public type.
        let tippyOptions = options ? { ...options } as TippyPopupOptions : {};
        let context = new TippyPopupContext(
            tippyOptions,
            (failedContext, message, error) =>
            {
                this.logFailure(failedContext, message, error);
            }
        );
        return context;
    }

    public open(context: IPopupContext): boolean
    {
        if (!(context instanceof TippyPopupContext))
        {
            this.logFailure(context, 'Popup context was not created by this Tippy popup mechanism');
            return false;
        }
        if (!context.anchorElement || !context.messageFrameContent)
        {
            this.logFailure(context, 'Cannot open popup without an anchor element and message content');
            return false;
        }
        if (!context.startOpen())
        {
            this.logFailure(context, 'Cannot open a popup context more than once');
            return false;
        }

        let userOnCreate = context.options.onCreate;
        let userOnHidden = context.options.onHidden;
        let createdInstance: Instance | null = null;
        try
        {
            let instance = tippy(context.anchorElement, {
                ...context.options,
                content: context.messageFrameContent,
                trigger: 'manual',
                triggerTarget: null,
                showOnCreate: true,
                onCreate: (created) =>
                {
                    createdInstance = created;
                    userOnCreate?.(created);
                },
                onHidden: (hiddenInstance) =>
                {
                    try
                    {
                        userOnHidden?.(hiddenInstance);
                    }
                    finally
                    {
                        context.notifyClosed();
                    }
                }
            });
            if (context.disposed)
            {
                if (!instance.state.isDestroyed)
                    instance.destroy();
                return false;
            }
            context.instance = instance;
            return true;
        }
        catch (error)
        {
            this.logFailure(context, 'Error opening Tippy popup', error);
            if (createdInstance)
            {
                context.instance = createdInstance;
                context.dispose();
            }
            return false;
        }
    }

    public close(context: IPopupContext): boolean
    {
        if (!(context instanceof TippyPopupContext))
        {
            this.logFailure(context, 'Popup context was not created by this Tippy popup mechanism');
            return false;
        }
        let instance = context.instance;
        if (!instance || instance.state.isDestroyed)
            return true;
        try
        {
            instance.hide();
            return true;
        }
        catch (error)
        {
            this.logFailure(context, 'Error closing Tippy popup', error);
            return false;
        }
    }

    public dispose(): void
    {
        // Per-popup Tippy instances are owned and disposed through their presentation-owned contexts.
    }

    private logFailure(context: IPopupContext, message: string, error?: unknown): void
    {
        let detail = error instanceof Error ? `${message}: ${error.message}` : message;
        context.domServices?.loggingFacade.log(LoggingLevel.Error,
            (facade) => facade.prepareLogDetails(detail, context.anchorElement, undefined, this));
    }
}
