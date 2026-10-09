import { GeneratedTemplatedIssuesFoundDisplayBase } from './GeneratedTemplatedIssuesFoundDisplayBase';
import { TemplatedIssuesFoundDisplay } from './TemplatedIssuesFoundDisplay';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';


/**
 * A classic appearance of issues found displays is to use one icon to the side of 
 * the error messages container.
 * 
 * It has a 2 column pattern with the icon in the first column and the error messages container in the second column.
 * The second column may have an optional header followed by the list of error messages.
 * 
 * ```html
 * <div class="jivs-iconissuesfounddisplay [outerClasses]">
 *     <div class='jivs-column1'>
 *         <!-- represents the icon element. See below -->
 *     </div>
 *     <div class='jivs-column2'>
 *          <div class='jivs-error-messages-container'>
 *               <ul>
 *                   <li>Error message here</li>
 *               </ul>
 *          </div>
 *     </div>
 * </div>
 * ```
 * Column 2 containing both a header and the list of error messages:
 * ```html
 *     <div class='jivs-column2'>
 *          <header>{Header}</header>
 *          <div class='jivs-error-messages-container'>
 *               <ul>
 *                   <li>Error message here</li>
 *               </ul>
 *          </div>
 *     </div>
 * ```
 * Example using a single issue with header:
 * ```html
 *     <div class='jivs-column2'>
 *          <header>{Header}</header>
 *          <div class='jivs-error-messages-container'>
 *               <span>Error message here</span>
 *          </div>
 *     </div>
 * ```
 * It has these fixed style sheet classes:
 * - jivs-iconissuesfounddisplay: The outer element.
 * - jivs-column1: The first column containing the icon element.
 * - jivs-column2: The second column containing the error messages container.
 * - jivs-error-messages-container: The container for the list of error messages.
 * - jivs-icon: The element representing the icon within the first column.
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
export class IconIssuesFoundDisplay extends GeneratedTemplatedIssuesFoundDisplayBase
{
    /**
     * Creates an icon issues found display with the supplied parameters.
     * Only one of iconContent or imageSrc will be used. If both are supplied, iconContent takes precedence.
     * @param outerClasses - The CSS classes for the outer container element.
     * This class will always insert 'jivs-iconissuesfounddisplay' into the outer container's CSS classes.
     * @param iconContent - The HTML content for the icon element. Ensure HTML encoding where appropriate.
     * @param imageSrc  - Makes an img tag with this as the src for the icon element. Optional.
     * @param headerText - The text to use for the header section. It can contain HTML. Be sure to HTML encode where necessary.
     * @param headerTextl10n - The localization key for the header text.
     * @param useSummaryMessages - Whether to use summary messages.
     * @param messagesLimit - The limit for the number of messages to display.
     */
    constructor(outerClasses: string[] | null, iconContent?: string, imageSrc?: string,
        headerText: string | null = null,
        headerTextl10n: string | null = null,
        useSummaryMessages: boolean = false, messagesLimit?: number)
    {
        super(outerClasses, headerText, headerTextl10n, null, null, useSummaryMessages, messagesLimit);
        this._iconContent = iconContent;
        this._imageSrc = iconContent ? undefined : imageSrc;
    }
    protected get iconContent(): string | undefined
    {
        return this._iconContent;
    }
    protected get imageSrc(): string | undefined
    {
        return this._imageSrc;
    }
    private _iconContent?: string;
    private _imageSrc?: string;

    protected override gatherOuterClasses(list: string[]): void
    {
        list.push('jivs-iconissuesfounddisplay');
    }

    protected generateTemplateContent(): string
    {
        const iconTag = this.generateIconTag();
        const headerTag = this.hasHeaderText ? `<header>{Header}</header>` : '';
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
        if (this.iconContent)
        {
            return `<span class="jivs-icon" aria-hidden="true">${ this.iconContent }</span>`;
        }
        else if (this.imageSrc)
        {
            return `<img class="jivs-icon" alt="" aria-hidden="true" src="${ encodeHtml(this.imageSrc) }" />`;
        }
        else
        {
            return `<span class="jivs-icon" aria-hidden="true"></span>`;
        }
    }

}