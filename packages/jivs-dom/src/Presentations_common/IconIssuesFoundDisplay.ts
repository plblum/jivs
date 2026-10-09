import { GeneratedTemplatedIssuesFoundDisplayBase } from './GeneratedTemplatedIssuesFoundDisplayBase';
import { TemplatedIssuesFoundDisplay } from './TemplatedIssuesFoundDisplay';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';


/**
 * A classic appearance of issues found displays is to use one icon to the side of 
 * the error messages container.
 * ```html
 * <div class="jivs-iconissuesfounddisplay [outerClasses]">
 *     <span class="jivs-icon" aria-hidden="true">[some content for an icon]</span>
 *     <div class='jivs-error-messages-container'>
 *          <ul>
 *              <li>Error message here</li>
 *          </ul>
 *     </div>
 * </div>
 * ```
 * It always includes 'jivs-iconissuesfounddisplay' in the outer container's CSS classes
 * to align with the expected styling for icon issues found displays.
 * 
 * The rest involves the user supplying styling to jivs-iconissuesfounddisplay 
 * (recommend display:flex; align-items:flex-start; gap: set to desired spacing)
 * and passing in the appropriate icon content for the `.jivs-icon` element.
 * They can pass in a image source URL which will result in an <img src="[url]" alt="" />.
 * They can pass in HTML for anything they want.
 * They can omit content, and this class will still drop the <span class='jivs-icon'></span> element
 * so that style sheets can apply ::after styling to it with content style supplying the unicode character for the icon.
 * 
 * With iconContent property supplied:
 * ```html
 *     <span class="jivs-icon" aria-hidden="true">[exactly iconContent]</span>
 * ```
 * With imageSrc property supplied:
 * ```html
 *     <img class="jivs-icon" alt="" aria-hidden="true" src="[HTML Encoded imageSrc]" />
 * ```
 * With none of the properties supplied:
 * ```html
 *     <span class="jivs-icon" aria-hidden="true"></span>
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
     * @param imageSrc  - Makes an img tag with this as the src for the icon element.
     * @param useSummaryMessages - Whether to use summary messages.
     * @param messagesLimit - The limit for the number of messages to display.
     */
    constructor(outerClasses: string[] | null, iconContent?: string, imageSrc?: string, useSummaryMessages: boolean = false, messagesLimit?: number )
    {
        super(outerClasses, null, null, null, null, useSummaryMessages, messagesLimit);
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
        let iconTag = '';
        if (this.iconContent)
        {
            iconTag = `<span class="jivs-icon" aria-hidden="true">${ this.iconContent }</span>`;
        }
        else if (this.imageSrc)
        {
            iconTag = `<img class="jivs-icon" alt="" aria-hidden="true" src="${ encodeHtml(this.imageSrc) }" />`;
        }
        else
        {
            iconTag = `<span class="jivs-icon" aria-hidden="true"></span>`;
        }       
        return iconTag + this.defaultIssuesFoundHtml();
    }

}