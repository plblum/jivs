import { IPresentationContent } from '../Interfaces/IPresentationContent';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { encodeHtml } from '@plblum/jivs-engine/build/Services/HtmlMessageTokenResolverService';

/**
 * Presentations offload content generation to implementations of this class.
 * - IMessageFrame for Message Content from IssuesFoundFormatterService 
 *   and wrapped presentations.
 * - IErrorIndicatorContent for Error Indicator Content used on popup buttons.
 * They all support the presentation's applyValidationState function to
 * build text that contains these tokens:
 * - {Count} - the number of issues found from ValidationState.issuesFound
 * - {Label} - the label associated with the FieldValueHost
 * Use resolveText to obtain the localized and token-replaced text for display.
 */
export abstract class PresentationContentBase<TOptions extends PresentationContentBaseOptions>
    implements IPresentationContent
{
    constructor(options?: TOptions) {
        if (!options)
            options = {} as TOptions;
        options = { ...this.getOptionDefaults(), ...options };
        this._options = options;
    }

    protected get options(): TOptions {
        return this._options;
    }
    private _options: TOptions;

    /**
     * Provide the defaults for any property that is undefined on options.
     * Does not change already assigned option values.
     * @returns 
     */
    protected getOptionDefaults(): Partial<TOptions>
    {
        return {} as TOptions;
    }    

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
        issuesFound: IssueFound[], valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null): string
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

export interface PresentationContentBaseOptions
{
}
