import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IIssuesFoundDisplay } from '../Interfaces/IIssuesFoundDisplay';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ErrorMessageDisplayPresentationBase } from './ErrorMessageDisplayPresentationBase';
/**
 * A presentation class for displaying inline error messages, which means
 * the container itself contains the error message content.
 */
export class InlineErrorMessageDisplayPresentation extends ErrorMessageDisplayPresentationBase
{
    constructor(element: HTMLElement, anchor: IJivsDomElement,
        issuesFoundDisplay: IIssuesFoundDisplay, presentationClass?: string, hasIssuesClass?: string)
    {
        super(element, anchor, issuesFoundDisplay, presentationClass, hasIssuesClass);
    }

    override defaultPresentationClass(): string | null
    {
        return 'jivs-inline-error-message-display';
    }
    /**
     * Expands the base class implementation to apply the issues found using the issuesFoundDisplay.
     * @param valueHost The host of the field value.
     * @param issuesFound The list of issues found for the field value.
     */
    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        super.applyIssuesFound(valueHost, issuesFound); // add hasIssuesClass if needed
        this.issuesFoundDisplay.apply(this.presentationElement, issuesFound,
            valueHost.valueHostsManager, valueHost);
    }

    protected override removeIssuesFound(): void
    {
        super.removeIssuesFound();
        this.presentationElement.textContent = '';
    }
}