import { GeneratedTemplatedIssuesFoundDisplayBase } from './GeneratedTemplatedIssuesFoundDisplayBase';

/**
 * Creates an issue display with a header and footer, using the provided template structure.
 * It will look like this:
 * ```html
 * <div class="jivs-headerfooterissuesfounddisplay [outerClasses]">
 *      <header>{Header}</header>
 *      <div class="jivs-error-messages-container">{IssuesFound}</div>
 *      <footer>{Footer}</footer>
 * </div>
 * ```
 * When you supply headerText, it will be within a generated <header> tag. No <header> if there is no headerText or headerTextl10n.
 * When you supply footerText, it will be within a generated <footer> tag. No <footer> if there is no footerText or footerTextl10n.
 * 
 * This class will always inject 'jivs-headerfooterissuesfounddisplay' into the outer container's CSS classes.
 * You can add more CSS classes through the outerClasses parameter.
 */
export class HeaderFooterIssuesFoundDisplay extends GeneratedTemplatedIssuesFoundDisplayBase
{
    /**
     * 
     * @param outerClasses - The CSS classes for the outer container element. 
     * This class will always insert 'jivs-headerfooterissuesfounddisplay' into the outer container's CSS classes.
     * @param headerText - Used WITHIN a generated <header> tag
     * @param headerTextl10n 
     * @param footerText - Used WITHIN a generated <footer> tag
     * @param footerTextl10n 
     * @param useSummaryMessages 
     * @param messagesLimit 
     */
    constructor(outerClasses: string[] | null,
        headerText: string | null,
        headerTextl10n: string | null,
        footerText: string | null,
        footerTextl10n: string | null,
        useSummaryMessages: boolean, messagesLimit: number | undefined = undefined)
    {
        super(outerClasses, headerText, headerTextl10n, footerText, footerTextl10n, useSummaryMessages, messagesLimit);    
    }

    override gatherOuterClasses(list: string[]): void
    {
        list.push('jivs-headerfooterissuesfounddisplay');
    }

    protected generateTemplateContent(): string
    {
        // uses the parameters to determine if a part is needed, but does not resolve their text until apply time

        let template = '';
        if (this.hasHeaderText)
        {
            template += '<header>{Header}</header>';
        }
        template += this.defaultIssuesFoundHtml();
        if (this.hasFooterText)
        {
            template += '<footer>{Footer}</footer>';
        }
        return template;
    }
}