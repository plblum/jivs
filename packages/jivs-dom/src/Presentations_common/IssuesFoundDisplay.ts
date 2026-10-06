import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IssuesFoundDisplayBase } from './IssuesFoundDisplayBase';

/**
 * Displays the error messages from the issuesFound list as the immediate child of the specified container element.
 * It uses the IssuesFoundFormatterService to format the error messages.
 * 
 * It has limited customization options compared to templated displays via TemplatedIssuesFoundDisplay.
 */
export class IssuesFoundDisplay extends IssuesFoundDisplayBase
{
    constructor(useSummaryMessages: boolean, messagesLimit: number | undefined = undefined)
    {
        super(useSummaryMessages, messagesLimit);
    }
    override apply(containerElement: HTMLElement, issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): void
    {
        let resolvedText = this.getErrorMessageContent(issuesFound, valueHostsManager, fieldValueHost);
        containerElement.innerHTML = resolvedText;
    }
}