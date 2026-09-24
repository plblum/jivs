/**
 * Service for formatting issues found in a consistent manner, either as HTML or plain text.
 * 
 * @module jivs-dom/Services/ConcreteClasses/IssuesFoundFormatterService
 */
import { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IssuesFoundFormatterServiceBase } from './IssuesFoundFormatterServiceBase';

/**
 * Supplied concrete implementation of the IssuesFoundFormatterServiceBase
 * which is a service for formatting issues found in a consistent manner, either as HTML or plain text.
 * 
 * In this implementation, it has a variety of features:
 * - Supports one issue alone in a span tag
 * - Supports multiple issues in a list format (ul/li), 
 *   making it easier to present a summary of all issues found.
 * - The span or li elements include attributes about the issue:
 *      - data-errorcode: The code representing the type of error. From IssueFound.errorCode.
 *          This is useful for CSS variations based on the error code.
 *      - data-identifier: The Element Identifier of the ValueHost. Uses IssueFound.valueHostName
 *          to resolve the FieldValueHost and get the Element Identifier.
 *          This is useful in Validation Summaries when you want to intercept a click
 *          allowing you to navigate to the relevant field when the summary item is clicked.
 *          Generally just attach an onclick handler to the containing element of the 
 *          ValidationSummary and look at the source element of the click event to 
 *          find the relevant data-identifier attribute.
 *      - data-severity: The severity level of the error. From IssueFound.severity.
 *          This is useful for CSS variations based on the severity of the error.
 *          Example usage in HTML:
 *          ```html
 *          <span data-errorcode="RequireText" data-identifier="username" data-severity="error">
 *               Username is required.
 *          </span>
 *          ```
 *          ```html
 *          <ul>
 *              <li data-errorcode="RequireText" data-identifier="username" data-severity="severe">
 *                   Username is required.
 *              </li>
 *              <li data-errorcode="DataTypeCheck" data-identifier="email" data-severity="error">
 *                   Email is invalid.
 *              </li>
 *          </ul>
 *          ```
 * - order of issues found is controlled through subclassing. This class
 *   uses the IssuesFound array as is.
 * - Tokens within error messages are wrapped in HTML elements for styling and emphasis.
 *   (This happens externally as a result of JivsService.messageTokenResolverService set
 *   to HtmlMessageTokenResolverService.)
 */
export class IssuesFoundFormatterService extends IssuesFoundFormatterServiceBase
{
    constructor(domService: IJivsDomServices)
    {
        super(domService);
    }
    /**
     * Creates a string containing HTML representing the issues found.
     * 
     * This class outputs two HTML formats:
     * - 1 issue to display (or limit = 1): Span tag
     * - Multiple issues to display: Unordered list (ul) with list items (li)
     * 
     * @param valueHostsManager - manager for value hosts, used to resolve values 
     * related to the issues found.
     * @param issues - source of issues found.
     * @param useSummaryMessage - set to true on Form level output to use the IssueFound.summaryMessage.
     *  If not supplied, it still uses IssueFound.errorMessage.
     *  Set to false on field level output to use the IssueFound.errorMessage.
     * @param limit - optional limit on the number of issues to include. 0 or undefined indicate
     *  no limit.
     * @returns a string containing the HTML representation of the issues found or ''
     * if none found.
     */
    public buildAsHtml(valueHostsManager: IValueHostsManager, issues: IssueFound[],
        useSummaryMessage?: boolean, limit?: number): string
    {
        if (!issues || issues.length === 0) {
            return '';
        }

        if (limit === 1 || issues.length === 1) {
            return this.buildIssueAsHtml(valueHostsManager, 'span', issues[0], useSummaryMessage ?? false);    
        }

        const limitedIssues = limit && limit > 0 ? issues.slice(0, limit) : issues;
        const listItems = limitedIssues.map(issue => {
            return this.buildIssueAsHtml(valueHostsManager, 'li', issue, useSummaryMessage ?? false);
        });
        return `<ul>${listItems.join('')}</ul>`;
    }

    /**
     * Creates a string containing plain text representing the issues found.
     * It establishes a separator of ' • ' by default.
     * @param valueHostsManager - manager for value hosts, used to resolve values related to the issues found.
     * @param issues - source of issues found.
     * @param useSummaryMessage - set to true on Form level output to use the IssueFound.summaryMessage.
     *  If not supplied, it still uses IssueFound.errorMessage.
     *  Set to false on field level output to use the IssueFound.errorMessage.
     * @param separator - string used to separate individual issues in the output text.
     * @param limit - optional limit on the number of issues to include. 0 or undefined indicate
     *  no limit.
     * @returns a string containing the plain text representation of the issues found or ''
     * if none found.
     */
    public buildAsText(valueHostsManager: IValueHostsManager, issues: IssueFound[],
        useSummaryMessage: boolean = false, separator: string = ' • ', limit?: number): string
    {
        if (!issues || issues.length === 0) {
            return '';
        }

        const limitedIssues = limit && limit > 0 ? issues.slice(0, limit) : issues;
        const issueTexts = limitedIssues.map(issue => {
            return this.retrieveMessage(issue, useSummaryMessage);
        });
        return issueTexts.join(separator);
    }

}