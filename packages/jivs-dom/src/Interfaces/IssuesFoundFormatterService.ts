/**
 * Provides the interface for a service that formats IssueFound objects 
 * for display in both HTML and plain text.
 * 
 * @module jivs-dom/Types/IssuesFoundFormatterService
 */

import { IssueFound } from "@plblum/jivs-engine/build/Interfaces/Validation";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";

/**
 * This service provides reusable formatting of IssueFound objects.
 * The service produces either prepared HTML for DOM presentations or 
 * plain text for consumers such as native browser tooltips and ARIA-only content.
 * 
 * Used by both FieldPresentations and FormPresentations when they need to display validation issues.
 */
export interface IIssuesFoundFormatterService
{
    /**
     * Builds the HTML representation of the provided issues.
     * 
     * @param valueHostsManager The manager responsible for handling value hosts, 
     * used to resolve value host names in the issues.
     * @param issues The list of issues to format.
     * @param useSummaryMessage Whether to use the summary message instead of individual issue messages.
     * Set to true when using this at the form level, such as within Validation Summary widgets.
     * @param limit The maximum number of issues to include in the HTML output. 0 or undefined means no limit.
     */
    buildAsHtml(valueHostsManager: IValueHostsManager, issues: IssueFound[],
        useSummaryMessage?: boolean, limit?: number): string;

    /**
     * Builds the plain text representation of the provided issues.
     * 
     * @param valueHostsManager The manager responsible for handling value hosts, 
     * used to resolve value host names in the issues.
     * @param issues The list of issues to format.
     * @param useSummaryMessage Whether to use the summary message instead of individual issue messages.
     * Set to true when using this at the form level, such as within Validation Summary widgets.
     * @param separator The separator to use between individual issue messages.
     * The implementation is expected to supply a default.
     * @param limit The maximum number of issues to include in the plain text output. 0 or undefined means no limit.
     */
    buildAsText(valueHostsManager: IValueHostsManager, issues: IssueFound[],
        useSummaryMessage?: boolean, separator?: string, limit?: number): string;
}
