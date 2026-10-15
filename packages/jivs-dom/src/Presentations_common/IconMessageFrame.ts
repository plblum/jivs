import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';
import { LayoutMessageFrameBase, LayoutMessageFrameBaseOptions } from './LayoutMessageFrameBase';


/**
 * A Message Frame with an icon column and a content column.
 * 
 * It has a 2 column pattern with the icon in the first column and the Message Content in the second column.
 * The second column may have an optional header followed by the list of error messages.
 * 
 * ```html
 * <div class="jivs-iconmessageframe [outerClasses]">
 *     <div class='jivs-column1'>
 *         <!-- represents the icon element. See below -->
 *     </div>
 *     <div class='jivs-column2'>
 *          <!-- Message Content injected here -->
 *     </div>
 * </div>
 * ```
 * Column 2 containing both a header and the list of error messages:
 * ```html
 *     <div class='jivs-column2'>
 *          <div class='jivs-header'>{Header}</div>
 *          <!-- Message Content injected here -->
 *     </div>
 * ```
 * Example using a single issue with header:
 * ```html
 *     <div class='jivs-column2'>
 *          <div class='jivs-header'>{Header}</div>
 *          <!-- Message Content injected here -->
 *     </div>
 * ```
 * It has these fixed style sheet classes:
 * - jivs-iconmessageframe: The outer element.
 * - jivs-column1: The first column containing the icon element.
 * - jivs-column2: The second column containing the Message Content.
 * - jivs-messagecontent: The container for the list of error messages.
 * - jivs-icon: The element representing the icon within the first column.
 * - jivs-header: The optional header within the second column.
 * 
 * The rest involves the user supplying styling and 
 * passing in the appropriate icon content for the `.jivs-icon` element.
 * 
 * ## Establishing the Icon Content
 * They can pass in a image source URL which will result in an <img src="[url]" alt="" />.
 * They can pass in HTML for anything they want.
 * They can omit content, and this class will still drop the <span class='jivs-icon'></span> element
 * so that style sheets can apply ::after styling to it with content style supplying the unicode character for the icon.
 * 
 * With iconContent property supplied:
 * ```html
 *     <div class="jivs-column1">
 *         <span class="jivs-icon" aria-hidden="true">[exactly iconContent]</span>
 *     </div>
 * ```
 * With imageSrc property supplied:
 * ```html
 *     <div class="jivs-column1">
 *         <img class="jivs-icon" alt="" aria-hidden="true" src="[HTML Encoded imageSrc]" />
 *     </div>
 * ```
 * With none of the properties supplied:
 * ```html
 *     <div class="jivs-column1">
 *         <span class="jivs-icon" aria-hidden="true"></span>
 *     </div>
 * ```
 */
export class IconMessageFrame<TOptions extends IconMessageFrameOptions = IconMessageFrameOptions>
    extends LayoutMessageFrameBase<TOptions>
{
    /**
     * Creates a Message Frame with two columns: icon and content.
     * The icon column is resolved from the iconContent or imageSrc properties.
     * Only one of iconContent or imageSrc will be used. If both are supplied, iconContent takes precedence.
     * 
     * ## Options
     * - outerClasses - The CSS classes for the outer container element.
     *      This class will always insert 'jivs-iconmessageframe' into the outer container's CSS classes.
     * - iconContent - The HTML content for the icon element. Ensure HTML encoding where appropriate.
     * - imageSrc  - Makes an img tag with this as the src for the icon element. Optional.
     * - headerHtml - The text to use for the header section. It can contain HTML. 
     *      Be sure to HTML encode where necessary.
     * - headerHtmll10n - The localization key for the header text.
     * - useSummaryMessages - Whether to use summary messages.
     * - messagesLimit - The limit for the number of messages to display.
     * 
     * @param options - The options for configuring the icon Message Frame.
     */
    constructor(options?: TOptions)
    {
        super(options);

        if (this.options?.iconContent)  // precedence to iconContent over imageSrc
            this.options.imageSrc = undefined;
    }

    public override getOptionDefaults(): Partial<TOptions>
    {
        return {
            ...super.getOptionDefaults()
        };
    }


    protected override gatherOuterClasses(list: string[]): void
    {
        super.gatherOuterClasses(list);
        list.push('jivs-iconmessageframe');
    }

    protected override generateTemplateContent(): string
    {
        const iconTag = this.generateIconTag();
        const headerTag = this.hasHeaderText ? `<div class='jivs-header'>{Header}</div>` : '';
        let template = '<div class="jivs-column1">';
        template += iconTag;
        template += '</div>';
        template += '<div class="jivs-column2">';
        template += headerTag + this.defaultIssuesFoundHtml();
        template += '</div>';
        return template;
    }

    private generateIconTag(): string
    {
        if (this.options.iconContent)
        {
            return `<span class="jivs-icon" aria-hidden="true">${ this.options.iconContent }</span>`;
        }
        else if (this.options.imageSrc)
        {
            return `<img class="jivs-icon" alt="" aria-hidden="true" src="${ encodeHtml(this.options.imageSrc) }" />`;
        }
        else
        {
            return `<span class="jivs-icon" aria-hidden="true"></span>`;
        }
    }

}

export interface IconMessageFrameOptions extends Omit<LayoutMessageFrameBaseOptions, 'footerHtml' | 'footerHtmll10n'>
{
    /**
     * The content for the icon section. It can contain HTML.
     * Ensure HTML encoding where appropriate.
     * When both this and imageSrc are provided, iconContent takes precedence.
     */
    iconContent?: string;

    /**
     * The source URL for the image to be used as an icon.
     * When supplied, the icon is generated as an image element.
     */
    imageSrc?: string;
}