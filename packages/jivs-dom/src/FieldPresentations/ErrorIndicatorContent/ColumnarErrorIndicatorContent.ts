import { ErrorIndicatorContentBase, ErrorIndicatorContentBaseGlobalOptions, ErrorIndicatorContentBaseOptions } from './ErrorIndicatorContentBase';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';

/**
 * Implements the standard for Error Indicator Content.
 * It contains 3 columns for displaying parts of the error indicator content.
 * A typical setup would be like this:
 * - column 1: displays an icon
 * - column 2: displays text orienting the user, such as 'errors found'
 * - column 3: displays a glyph indicating a popup
 * 
 * ```html
 * <div class='jivs-errorindicatorcontent jivs-columnarerrorindicatorcontent'>
 *     <div class='jivs-column1'>
 *         ⚠
 *     </div>
 *     <div class='jivs-column2'>
 *         Errors found
 *     </div>
 *     <div class='jivs-column3'>
 *         ›
 *     </div>
 * </div>
 * ```
 */
export class ColumnarErrorIndicatorContent<TOptions extends ColumnarErrorIndicatorContentOptions = ColumnarErrorIndicatorContentOptions>
    extends ErrorIndicatorContentBase<TOptions>
{
    constructor(options?: TOptions) {
        super(options);
    }

    protected override getOptionDefaults(): Partial<TOptions>
    {
        return {
            ...super.getOptionDefaults(),
            column1Html: defaultColumn1Html
        };
    }

    protected override getGlobalOptions(): object | undefined
    {
        return this.domServices.options.columnarErrorIndicatorContent;
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-columnarerrorindicatorcontent');
    }

    /**
     * Creates content based on the options.
     * @param issuesFound 
     * @param valueHostsManager 
     * @param fieldValueHost 
     * @returns 
     */
    protected override getChildContentHtml(issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null): string
    {
        // each column is added even when there is no content for it,
        // to let CSS add styling like :empty::after { content: 'value' }
        let html = '';
        let column1 = this.resolveText(
            this.options?.column1HtmlL10n ?? '',
            this.options?.column1Html ?? '',
            issuesFound, valueHostsManager, fieldValueHost);

        html += `<div class='jivs-column1'>${column1 ?? ''}</div>`;
        
        let column2 = this.resolveText(
            this.options?.column2HtmlL10n ?? '',
            this.options?.column2Html ?? '',
            issuesFound, valueHostsManager, fieldValueHost);

        html += `<div class='jivs-column2'>${column2 ?? ''}</div>`;
        let column3 = this.resolveText(
            this.options?.column3HtmlL10n ?? '',
            this.options?.column3Html ?? '',
            issuesFound, valueHostsManager, fieldValueHost);
        html += `<div class='jivs-column3'>${column3 ?? ''}</div>`;
        return html;
    }
}

/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the Presentations options.
 */
export interface ColumnarErrorIndicatorContentGlobalOptions extends ErrorIndicatorContentBaseGlobalOptions
{
    /**
     * HTML content for column 1. 
     * Any text must be HTML encoded.
     * If localization is needed, use the corresponding `column1HtmlL10n` property.
     */
    column1Html?: string;
    /**
     * Localization key for column 1 HTML content.
     */
    column1HtmlL10n?: string;
    /**
     * HTML content for column 2. 
     * Any text must be HTML encoded.
     * If localization is needed, use the corresponding `column2HtmlL10n` property.
     */
    column2Html?: string;
    /**
     * Localization key for column 2 HTML content.
     */
    column2HtmlL10n?: string;
    /**
     * HTML content for column 3. 
     * Any text must be HTML encoded.
     * If localization is needed, use the corresponding `column3HtmlL10n` property.
     */
    column3Html?: string;
    /**
     * Localization key for column 3 HTML content.
     */
    column3HtmlL10n?: string;
}
/**
 * Options specific to the presentation instance which includes globals.
 * Only add here options are are used situationally.
 */
export interface ColumnarErrorIndicatorContentOptions extends ErrorIndicatorContentBaseOptions,
    ColumnarErrorIndicatorContentGlobalOptions
{

}

export const defaultColumn1Html = '&#9888;'; // The "Warning" symbol: ⚠