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
 * 
 * ## About Options
 * There are three levels of options:
 * 1. Option defaults provided by the presentation content class itself.
 *    Override getOptionDefaults to provide the default options for this presentation content.
 * 2. Global options obtained from IJivsDomServices.options.
 *    Override getGlobalOptions to provide the specific global options for this presentation content.
 * 3. Instance-specific options passed to the constructor.
 * The options are a shallow copy from the combination of option defaults, global options, and instance-specific options.
 * The options property is not ready for consumption until after setDomServices has been called.
 */
export abstract class PresentationContentBase<TOptions extends PresentationContentBaseOptions>
    implements IPresentationContent
{
    constructor(options?: TOptions) {
        if (!options)
            options = {} as TOptions;
        this._options = { ...options }; // shallow copy since the object will be modified later
    }

    /**
     * Gets the combined options for this presentation content, including defaults, global options, and instance-specific options.
     * Not ready for consumption until after setDomServices has been called.
     * setDomServices fills in undefined properties from jivsDomServices.options
     * and this classes' option defaults to populate the combined options.
     */
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
     * Subclasses should implement this method to provide the global options for the presentation content.
     * These options typically come from the Jivs DOM services and provide default configurations.
     * ```ts
     * return this.domServices.options.<area>;
     * ```
     * @returns The global options object or undefined if not available.
     */
    protected abstract getGlobalOptions(): object | undefined;

    /**
     * Gets the DOM services instance that was previously set.
     * This is used internally by derived classes to access rendering and formatting utilities.
     */
    protected get domServices(): IJivsDomServices
    {
        if (!this._domServices)
            throw new Error('DOM services not initialized.');        
        return this._domServices;
    }
    private _domServices!: IJivsDomServices;

    public setDomServices(domServices: IJivsDomServices): void {
        this._domServices = domServices;
        this.resolveOptions();
    }
    protected resolveOptions(): void
    {
        const globalOptions = this.getGlobalOptions() ?? {};
        const optionDefaults = this.getOptionDefaults();
        this._options = { ...optionDefaults, ...globalOptions, ...this._options };
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

/**
 * "Global Options" are for options that can be setup in 
 * globally and supply a default when not overridden in the instance options.
 */
export interface PresentationContentBaseGlobalOptions
{
}
/**
 * Options specific to the presentation instance which includes globals.
 * Only add here options are are used situationally.
 */
export interface PresentationContentBaseOptions extends PresentationContentBaseGlobalOptions
{
}
