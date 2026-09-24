/**
 * Base class implementation of IIssuesFoundFormatterService.
 * Service for formatting issues found in a consistent manner, either as HTML or plain text.
 * @module jivs-dom/Services/AbstractClasses/IssuesFoundFormatterServiceBase
 */
import { IssueFound, ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';
import { IIssuesFoundFormatterService } from '../Interfaces/IssuesFoundFormatterService';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { DomServiceBase } from './DomServiceBase';

/**
 * Base class for the service that formats issues found in a consistent manner, 
 * either as HTML or plain text.
 * 
 * The engine service prepares an issue’s message, including message-token resolution. 
 * The DOM service formats already-prepared messages for presentation, and is 
 * used by FieldPresentations for Field Error Display widgets and 
 * by FormPresentations for Validation Summary widgets.
 * 
 * The plain text is used in various use cases:
 * - Aria's own Error Message container
 * - Presentations that use a tooltip with error messages
 * - Content shown in a status bar
 * - Content shown in a field's description hint ajoined with or replacement to the description.
 */
export abstract class IssuesFoundFormatterServiceBase extends DomServiceBase
    implements IIssuesFoundFormatterService
{
    constructor(domService: IJivsDomServices)
    {
        super(domService);
    }
    /**
     * Creates a string containing HTML representing the issues found.
     * @param issues - source of issues found.
     * @param useSummaryMessage - set to true on Form level output to use the IssueFound.summaryMessage.
     *  If not supplied, it still uses IssueFound.errorMessage.
     *  Set to false on field level output to use the IssueFound.errorMessage.
     * @param limit - optional limit on the number of issues to include. 0 or undefined indicate
     *  no limit.
     */
    public abstract buildAsHtml(valueHostsManager: IValueHostsManager, issues: IssueFound[],
        useSummaryMessage?: boolean, limit?: number): string;

    /**
     * Creates a string containing plain text representing the issues found.
     * @param issues - source of issues found.
     * @param useSummaryMessage - set to true on Form level output to use the IssueFound.summaryMessage.
     *  If not supplied, it still uses IssueFound.errorMessage.
     *  Set to false on field level output to use the IssueFound.errorMessage.
     * @param separator - string used to separate individual issues in the plain text output.
     *  Subclass is expected to provide a default.
     * @param limit - optional limit on the number of issues to include. 0 or undefined indicate
     *  no limit.
     */
    public abstract buildAsText(valueHostsManager: IValueHostsManager, issues: IssueFound[],
        useSummaryMessage?: boolean, separator?: string, limit?: number): string;

    /**
     * Utility that converts HTML content into plain text.
     * @param html - the HTML content to convert.
     * @returns a plain text representation of the HTML content.
     */
    public static htmlToText(html: string): string
    {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    /**
     * Orders the issues found based on a specific criteria.
     * If reordering happens, it must not modify the original array of issues.
     * 
     * This class retains the issues found array as is.
     * 
     * @param issues - source of issues found.
     * @returns the ordered list of issues found.
     */
    protected orderIssuesFound(issues: IssueFound[]): IssueFound[]
    {
        return issues.slice();
    }

    /**
     * Creates an HTML representation of a single IssueFound, enclosed in the supplied
     * tags. 
     * 
     * The tag will include three attributes: error code, severity, and valuehost name.
     * - error code uses buildErrorCodeAttribute()
     * - severity uses buildSeverityAttribute()
     * - valuehost uses buildValueHostAttribute()
     * Each supply a default the suggested attribute name and value.
     * Override them to change or return no string for the attribute.
     * 
     * The content is the value from IssueFound.errorMessage or summaryMessage verbatim,
     * including any HTML tags already there. 
     * (Jivs supplies <span> tags with attributes around each token's value
     * and handles encoding values from user input.)
     * 
     * @param tagName - the HTML tag name to use for wrapping the issue.
     * @param issue - the issue found to be formatted as HTML.
     * @param useSummaryMessage - set to true to use the IssueFound.summaryMessage, false to use the IssueFound.errorMessage.
     */
    protected buildIssueAsHtml(valueHostsManager: IValueHostsManager,
        tagName: keyof HTMLElementTagNameMap, issue: IssueFound,
        useSummaryMessage: boolean): string
    {
        const errorCodeAttribute = this.buildErrorCodeAttribute(valueHostsManager, issue);
        const severityAttribute = this.buildSeverityAttribute(valueHostsManager, issue);
        const valueHostAttribute = this.buildValueHostAttribute(valueHostsManager, issue);
        const message = this.retrieveMessage(issue, useSummaryMessage);

        return `<${tagName} ${errorCodeAttribute} ${severityAttribute} ${valueHostAttribute}>${message}</${tagName}>`;
    }

    /**
     * Builds the HTML attribute for the error code of the given issue from IssueFound.errorCode.
     * Returns a complete HTML attribute without leading whitespace. 
     * Its default attribute name is `data-errorcode`.
     * @param issue 
     * @param attributeName - the name of the HTML attribute to use for the error code. 
     * Defaults to `data-errorcode`.
     */
    protected buildErrorCodeAttribute(valueHostsManager: IValueHostsManager,
        issue: IssueFound, attributeName: string = 'data-errorcode'): string
    {
        if (!issue.errorCode)
            return '';
        let errorCode = encodeHtml(issue.errorCode);
        return `${attributeName}="${errorCode}"`; 
    }

    /**
     * Builds the HTML attribute for the severity of the given issue from IssueFound.severity.
     * Returns a complete HTML attribute without leading whitespace. 
     * Its default attribute name is `data-severity`.
     * @param issue - the issue found to be formatted as an HTML attribute.
     * @param attributeName - the name of the HTML attribute to use for the severity. 
     * Defaults to `data-severity`.
     * @returns a complete HTML attribute without leading whitespace.
     */
    protected buildSeverityAttribute(valueHostsManager: IValueHostsManager,
        issue: IssueFound, attributeName: string = 'data-severity'): string
    {
        if (!issue.severity)
            return '';
        let serverity = this.retrieveSeverityName(issue.severity);
        if (!serverity)
            return '';
        return `${attributeName}="${serverity}"`;   // no html encoding needed
    }

    /**
     * Builds the HTML attribute for the value host of the given issue from IssueFound.valueHostName.
     * The actual name is from the associated FieldValueHost.getElementIdentifer().
     * This ensures that the HTML attribute correctly references the DOM element associated with the value host.
     * Returns a complete HTML attribute without leading whitespace. 
     * Its default attribute name is `data-identifier`.
     * @param issue - the issue found to be formatted as an HTML attribute.
     * @param attributeName - the name of the HTML attribute to use for the value host. 
     * Defaults to `data-identifier`.
     * @returns a complete HTML attribute without leading whitespace.
     */
    protected buildValueHostAttribute(valueHostsManager: IValueHostsManager,
        issue: IssueFound, attributeName: string = 'data-identifier'): string
    {
        if (!issue.valueHostName)
            return '';
        let vh = valueHostsManager.getFieldValueHost(issue.valueHostName);
        if (!vh) // unexpected, but error handling is available
            return '';
        let valueHostName = encodeHtml(vh.getElementIdentifier());
        return `${attributeName}="${valueHostName}"`;
    }

    /**
     * Retrieves the appropriate message for the given issue.
     * This is the content of the message that will be displayed for the issue.
     * It may have HTML tags embedded within it.
     * If `useSummaryMessage` is true, the summary message is returned; 
     * otherwise, the individual issue message is returned.
     * If no summary message is found, the error message is returned.
     * @param issue - the issue found to be formatted.
     * @param useSummaryMessage - whether to use the summary message instead of the individual issue message.
     */
    protected retrieveMessage(issue: IssueFound, useSummaryMessage: boolean): string
    {
        let message = '';
        if (useSummaryMessage && issue.summaryMessage)
            message = issue.summaryMessage;
        else if (issue.errorMessage)
            message = issue.errorMessage;
        return message;
    }

    /**
     * Creates the string representation of the given severity
     * used by buildSeverityAttribute. If it returns an empty string, no severity attribute will be added.
     * @param severity - the severity level to be converted into a string representation.
     * @returns this implementationalways returns one of these: 'warning', 'severe', or 'error'.
     */
    protected retrieveSeverityName(severity: ValidationSeverity | undefined): string
    {
        switch (severity)
        {
            case ValidationSeverity.Warning:
                return 'warning';
            case ValidationSeverity.Severe:
                return 'severe';
            default:
                return 'error';
        }
    }
}