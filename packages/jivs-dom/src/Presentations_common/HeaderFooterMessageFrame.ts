import { LayoutMessageFrameBase, LayoutMessageFrameBaseOptions } from './LayoutMessageFrameBase';

/**
 * Creates a Message Frame with a header and footer, using the provided template structure.
 * It will look like this:
 * ```html
 * <div class="jivs-headerfootermessageframe [outerClasses]">
 *      <div class='jivs-header'>{Header}</div>
 *      <div class="jivs-messagecontent">{IssuesFound}</div>
 *      <div class='jivs-footer'>{Footer}</div>
 * </div>
 * ```
 * When you supply headerText, it will be within a generated <div class='jivs-header'> tag. 
 * No <div class='jivs-header'> if there is no headerText or headerTextl10n.
 * When you supply footerText, it will be within a generated <div class='jivs-footer'> tag. 
 * No <div class='jivs-footer'> if there is no footerText or footerTextl10n.
 * 
 * This class will always inject 'jivs-headerfootermessageframe' into the outer container's CSS classes.
 * You can add more CSS classes through the outerClasses parameter.
 */
export class HeaderFooterMessageFrame extends LayoutMessageFrameBase
{
    /**
     * Creates a header and footer Message Frame.
     * 
     * ## Options   
     * - outerClasses - The CSS classes for the outer container element. 
     *       This class will always insert 'jivs-headerfootermessageframe' 
     *       into the outer container's CSS classes.
     * - headerText - Used WITHIN a generated <div class='jivs-header'> tag
     * - headerTextl10n 
     * - footerText - Used WITHIN a generated <div class='jivs-footer'> tag
     * - footerTextl10n 
     * - useSummaryMessages 
     * - messagesLimit 
     * @param options The options for configuring the header and footer Message Frame.
     */
    constructor(options?: HeaderFooterMessageFrameOptions)
    {
        super(options);    
    }

    protected override gatherOuterClasses(list: string[]): void
    {
        super.gatherOuterClasses(list);
        list.push('jivs-headerfootermessageframe');
    }

    protected override generateTemplateContent(): string
    {
        // uses the parameters to determine if a part is needed, but does not resolve their text until apply time

        let template = '';
        if (this.hasHeaderText)
        {
            template += '<div class="jivs-header">{Header}</div>';
        }
        template += this.defaultIssuesFoundHtml();
        if (this.hasFooterText)
        {
            template += '<div class="jivs-footer">{Footer}</div>';
        }
        return template;
    }
}

export interface HeaderFooterMessageFrameOptions extends LayoutMessageFrameBaseOptions
{
}