import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IErrorIndicatorContent } from '../../Interfaces/IErrorIndicatorContent';
import { PresentationContentBase, PresentationContentBaseGlobalOptions, PresentationContentBaseOptions } from '../../Presentations_common/PresentationContentBase';

/**
 * Base class for the ErrorIndicatorContent implementations.
 * Provides common functionality for setting DOM services and 
 * enforces the implementation of the apply method.
 */
export abstract class ErrorIndicatorContentBase<TOptions extends ErrorIndicatorContentBaseOptions = ErrorIndicatorContentBaseOptions>
    extends PresentationContentBase<TOptions>
    implements IErrorIndicatorContent
{
    constructor(options?: TOptions) {
        super(options);
    }

    /**
     * Builds and replaces the content within the specified element.
     * Does not modify the CSS classes on element itself. Its own
     * content should be in a container element with its own CSS classes for styling and layout.
     * @param containerElement The container element where the error indicator content should be rendered.
     * @param issuesFound The list of issues found for the field. Used primarily to 
     * support the {Count} token.
     * @param valueHostsManager The manager for value hosts, used for resolving dynamic values in the content.
     * @param fieldValueHost The host object for the field value, if applicable.
     * Used primarily to resolve the {Label} token if applicable.
     */
    public apply(containerElement: HTMLElement, issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null): void
    {
        const persistentClasses: string[] = [];
        this.gatherPersistentClasses(persistentClasses);
        let content = '<div class="' + persistentClasses.join(' ') + '">';
        content += this.getChildContentHtml(issuesFound, valueHostsManager, fieldValueHost);
        content += '</div>';
        containerElement.innerHTML = content;
    }
    /**
     * Gathers all persistent classes that should be applied to the outer element.
     * Override this method to add more persistent classes as needed but
     * be sure to call the base implementation to include the default persistent classes.
     * @param list 
     */
    protected gatherPersistentClasses(list: string[]): void
    {
        list.push('jivs-errorindicatorcontent');
    }

    /**
     * HTML representing the content inside of the enclosing container element
     * that will have jivs-errorindicatorcontent class applied.
     * ```html
     * <div class='jivs-errorindicatorcontent'>
     *     <!-- child content goes here -->
     * </div>
     * ```
     * @param issuesFound 
     * @param valueHostsManager 
     * @param fieldValueHost 
     */
    protected abstract getChildContentHtml(issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null): string;


}
/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the Presentations options.
 */
export interface ErrorIndicatorContentBaseGlobalOptions extends PresentationContentBaseGlobalOptions
{
}
/**
 * Options specific to the presentation instance which includes globals.
 * Only add here options are are used situationally.
 */
export interface ErrorIndicatorContentBaseOptions extends PresentationContentBaseOptions,
    ErrorIndicatorContentBaseGlobalOptions
{
}
