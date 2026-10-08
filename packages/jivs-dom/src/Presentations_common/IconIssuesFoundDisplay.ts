import { TemplatedIssuesFoundDisplay } from './TemplatedIssuesFoundDisplay';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';


/**
 * A classic appearance of issues found displays is to use one icon to the side of 
 * the error messages container.
 * ```html
 * <div class="jivs-icon-issues-found-display">
 *     <span class="jivs-icon" aria-hidden="true">[some content for an icon]</span>
 *     <div class='jivs-error-messages-container'>
 *     <ul>
 *         <li>Error message here</li>
 *     </ul>
 *     </div>
 * </div>
 * ```
 * The rest involves the user supplying styling (recommend display:flex; align-items:flex-start; gap: set to desired spacing)
 * and passing in the appropriate icon content for the `.jivs-icon` element.
 * They can pass in a reference for an <img> tag which will be generated if supplied.
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
export class IconIssuesFoundDisplay extends TemplatedIssuesFoundDisplay
{
    /**
     * Creates a template from the supplied parameters.
     * @param iconContent - The HTML content for the icon element. Ensure HTML encoding where appropriate.
     * @param imageSrc  - Makes an img tag with this as the src for the icon element.
     */
    constructor(iconContent?: string, imageSrc?: string, useSummaryMessages: boolean = false, messagesLimit?: number )
    {
        super(IconIssuesFoundDisplay.createTemplate(iconContent, imageSrc), null, null, null, null, useSummaryMessages, messagesLimit);

    }
    public static createTemplate(iconContent?: string, imageSrc?: string): string
    {
        let template = '';
        if (iconContent)
        {
            template = `<span class="jivs-icon" aria-hidden="true">${iconContent}</span>`;
        }
        else if (imageSrc)
        {
            template = `<img class="jivs-icon" alt="" aria-hidden="true" src="${ encodeHtml(imageSrc) }" />`;
        }
        else
        {
            template = `<span class="jivs-icon" aria-hidden="true"></span>`;
        }
        return '<div class="jivs-icon-issues-found-display">' + template + TemplatedIssuesFoundDisplay.defaultIssuesFoundHtml() + '</div>';
    }
}