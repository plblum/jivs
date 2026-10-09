import { GeneratedTemplatedIssuesFoundDisplayBase, GeneratedTemplatedIssuesFoundDisplayBaseOptions } from './GeneratedTemplatedIssuesFoundDisplayBase';

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
     * Creates a header and footer issues found display.
     * ## Options   
     * outerClasses - The CSS classes for the outer container element. 
     *       This class will always insert 'jivs-headerfooterissuesfounddisplay' 
     *       into the outer container's CSS classes.
     * headerText - Used WITHIN a generated <header> tag
     * headerTextl10n 
     * footerText - Used WITHIN a generated <footer> tag
     * footerTextl10n 
     * useSummaryMessages 
     * messagesLimit 
     * @param options The options for configuring the header and footer issues found display.
     */
    constructor(options?: HeaderFooterIssuesFoundDisplayOptions)
    {
        super(options);    
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

export interface HeaderFooterIssuesFoundDisplayOptions extends GeneratedTemplatedIssuesFoundDisplayBaseOptions
{
}