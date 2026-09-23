/**
 * Provides the interface for a service that formats IssueFound objects for display in both HTML and plain text.
 * 
 * @module jivs-dom/Types/IssuesFoundFormatterService
 */

import { IssueFound } from "@plblum/jivs-engine/build/Interfaces/Validation";

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
     * @param issues The list of issues to format.
     * @param useSummaryMessage Whether to use the summary message instead of individual issue messages.
     * Set to true when using this at the form level, such as within Validation Summary widgets.
     */
    buildAsHtml(issues: IssueFound[], useSummaryMessage?: boolean): string;

    /**
     * Builds the plain text representation of the provided issues.
     * 
     * @param issues The list of issues to format.
     * @param useSummaryMessage Whether to use the summary message instead of individual issue messages.
     * Set to true when using this at the form level, such as within Validation Summary widgets.
     * @param separator The separator to use between individual issue messages.
     * The implementation is expected to supply a default.
     */
    buildAsText(issues: IssueFound[], useSummaryMessage?: boolean, separator?: string): string;
}
