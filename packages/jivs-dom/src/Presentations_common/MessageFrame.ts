import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { MessageFrameBase, MessageFrameBaseOptions } from './MessageFrameBase';

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

export interface MessageFrameOptions extends MessageFrameBaseOptions
{
}