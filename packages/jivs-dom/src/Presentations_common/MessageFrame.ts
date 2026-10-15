import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { MessageFrameBase, MessageFrameBaseOptions, MessageFrameBaseGlobalOptions } from './MessageFrameBase';

/**
 * The most basic of Message Frames. It is just the container element with
 * the Message Content inside it.
 * 
 * It applies the 'jivs-messageframe' class to the container element.
 */
export class MessageFrame<TOptions extends MessageFrameOptions = MessageFrameOptions> 
    extends MessageFrameBase<TOptions>
{
    constructor(options?: TOptions)
    {
        super(options);
    }
    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.messageFrame;
    }
    public override needsContainerUpdate(): boolean
    {
        return true;
    }
    public override apply(containerElement: HTMLElement, issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): void
    {
        let resolvedText = this.getErrorMessageContent(issuesFound, valueHostsManager, fieldValueHost);
        containerElement.classList.add('jivs-messageframe');
        containerElement.innerHTML = resolvedText;
    }
}
/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the instance options.
 */
export interface MessageFrameGlobalOptions extends MessageFrameBaseGlobalOptions
{
}
/**
 * Options specific to the instance which includes globals.
 * Only add here options are are used situationally.
 */
export interface MessageFrameOptions
    extends MessageFrameBaseOptions,
    MessageFrameGlobalOptions
{
}