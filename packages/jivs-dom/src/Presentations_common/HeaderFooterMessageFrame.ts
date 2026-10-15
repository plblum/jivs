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
 * When you supply headerHtml, it will be within a generated <div class='jivs-header'> tag. 
 * No <div class='jivs-header'> if there is no headerHtml or headerHtmll10n.
 * When you supply footerHtml, it will be within a generated <div class='jivs-footer'> tag. 
 * No <div class='jivs-footer'> if there is no footerHtml or footerHtmll10n.
 * 
 * This class will always inject 'jivs-headerfootermessageframe' into the outer container's CSS classes.
 * You can add more CSS classes through the outerClasses parameter.
 */
export class HeaderFooterMessageFrame<TOptions extends HeaderFooterMessageFrameOptions = HeaderFooterMessageFrameOptions>
    extends LayoutMessageFrameBase<TOptions>
{
    /**
     * Creates a header and footer Message Frame.
     * 
     * ## Options   
     * - outerClasses - The CSS classes for the outer container element. 
     *       This class will always insert 'jivs-headerfootermessageframe' 
     *       into the outer container's CSS classes.
     * - headerHtml - Used WITHIN a generated <div class='jivs-header'> tag
     *   Expects HTML, so HTML encode where appropriate.
     * - headerHtmll10n - The localization key for the header text.
     * - footerHtml - Used WITHIN a generated <div class='jivs-footer'> tag
     *   Expects HTML, so HTML encode where appropriate.
     * - footerHtmll10n - The localization key for the footer text.
     * - useSummaryMessages 
     * - messagesLimit 
     * @param options The options for configuring the header and footer Message Frame.
     */
    constructor(options?: TOptions)
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