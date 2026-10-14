import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';
import { IErrorIndicatorContent } from '../../Interfaces/IErrorIndicatorContent';
import { IJivsDomServices } from '../../Interfaces/JivsDomServices';

/**
 * Base class for the ErrorIndicatorContent implementations.
 * Provides common functionality for setting DOM services and 
 * enforces the implementation of the apply method.
 * 
 */
export abstract class ErrorIndicatorContentBase<TOptions extends ErrorIndicatorContentBaseOptions = ErrorIndicatorContentBaseOptions> implements IErrorIndicatorContent
{
    constructor(options?: TOptions) {
        this._options = options;
    }

    protected get options(): TOptions | undefined {
        return this._options;
    }
    private _options?: TOptions;

    /**
     * Gets the DOM services instance that was previously set.
     * This is used internally by derived classes to access rendering and formatting utilities.
     */
    protected get domServices(): IJivsDomServices
    {
        return this._domServices;
    }
    private _domServices!: IJivsDomServices;

    public setDomServices(domServices: IJivsDomServices): void {
        this._domServices = domServices;
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
     * that will have jivs-errorindicator class applied.
     * ```html
     * <div class='jivs-errorindicator'>
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

    /**
     * Utility to resolve the appropriate text for a given key, falling back to the default text if no specific text is found.
     * It uses the jivsServices.errorMessagesService to localize based on the key, if available, or falls back to the default text.
     * It supports token replacement as follows:
     * - {Count} - replaced by the number of issues found.
     * - {Label} - replaced by the label of the field associated with the issue. Requires the fieldValueHost to be provided.
     * @param key - The key used to look up the localized text.
     * @param defaultText - The default text to use if no specific text is resolved for the given key.
     * @param issuesFound - The list of issues found.
     * @param valueHostsManager - The manager for value hosts, used for resolving dynamic values in the text.
     * @param fieldValueHost The host object for the field value, if applicable.
     */
    protected resolveText(key: string, defaultText: string,
        issuesFound: IssueFound[], valueHostsManager: IValueHostsManager, fieldValueHost: IFieldValueHost | null): string
    {
        const cultureId = valueHostsManager.behaviors.activeCultureId!;
        let resolvedText = this.domServices.services.errorMessagesService.localize(cultureId, key, defaultText);
        if (resolvedText)
        {
            resolvedText = resolvedText.replace('{Count}', issuesFound.length.toString());
            if (fieldValueHost)
            {
                resolvedText = resolvedText.replace('{Label}', encodeHtml(fieldValueHost.getLabel()));
            }
        }
        return resolvedText ?? '';
    }    
}

export interface ErrorIndicatorContentBaseOptions
{
}
