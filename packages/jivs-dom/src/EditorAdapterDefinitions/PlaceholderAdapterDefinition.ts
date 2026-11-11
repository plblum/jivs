/**
 * PlaceholderAdapterDefinition associates HTML span elements with Jivs-Dom as read-only editors.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/PlaceholderAdapterDefinition
 */

import { PlaceholderTextValueAdapter } from '../Adapters/PlaceholderTextValueAdapter';
import { defaultPlaceholderPresentationName } from '../FieldPresentations/PlaceholderPresentation';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { SetValueOptions } from '@plblum/jivs-engine/build/Interfaces/ValueHost';

/**
 * Specialized version of an editor adapter definition for non-editable placeholders.
 * 
 * An HTML tag with textContent support (span, div, etc) can act in the role of an editor, albeit
 * a read-only editor, meaning it can display text but cannot be directly edited by the user.
 * 
 * We target this for showing the text values of FieldValueHosts that
 * aren't intended to be directly edited by the user.
 * It benefits from FieldValueHosts having so many tools
 * for managing and formatting the text values, plus the ability to
 * report changes through the TextValueDispatcher.
 * 
 * Default supported tags: span - replace within constructor
 * Default presentation: PlaceholderPresentation
 * TextValueAdapter: PlaceholderTextValueAdapter
 * ValueAdapter: Not Supported
 * Attach and Send Values: Not Supported
 * 
 */
export class PlaceholderAdapterDefinition extends EditorAdapterDefinitionBase
{
    /**
     * Create a new instance of PlaceholderAdapterDefinition.
     * @param adapterKey - The unique key identifying this adapter.
     * @param priority - The priority of this adapter when multiple adapters match the same element.
     * @param tagsSupported - One or more HTML tags. These must already support
     * textContent attribute, as no validation is done.
     * @param recommendedFieldPresentationName - The recommended field presentation name for this adapter.
     */
    public constructor(adapterKey: string, priority: number, tagsSupported: string[] | string = 'span',
        recommendedFieldPresentationName?: string | null)
    {
        super(adapterKey, priority, recommendedFieldPresentationName);
        this._tagsSupported = Array.isArray(tagsSupported) ? tagsSupported : [tagsSupported];
    }
    private _tagsSupported: string[];

    protected override defaultFieldPresentationName(): string | null
    {
        return defaultPlaceholderPresentationName;
    }
    /**
     * Matches only the HTML tags with textContent support (span, div, etc) that are empty or consist solely of whitespace.
     * @param valueHost The FieldValueHost associated with this editor.
     * @param candidateElement The HTML element being evaluated as a potential editor.
     * @returns True if the candidate element matches the criteria for this editor, false otherwise.
     */
    public override matches(valueHost: IFieldValueHost, candidateElement: HTMLElement): boolean
    {
        if (this._tagsSupported.includes(candidateElement.tagName.toLowerCase()) &&
            (!candidateElement.textContent || candidateElement.textContent?.trim() === ''))
        {
            return true;
        }
        return false;
    }


    public override createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement | null): ITextValueAdapter | null
    {
        return new PlaceholderTextValueAdapter(valueHost, editor, jivsElement);
    }
    public override createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement | null): IValueAdapter | null
    {
        return null;
    }

//#region Attach and Send Values (Not Supported)
    public override attachToSendValues(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement, options?: EditorInstallOptions): void
    {
        // not supported
    }
    protected override attachToSendValuesCore(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement, options: EditorInstallOptions): void
    {
        // not supported
    }
    public override sendValue(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement, options?: SetValueOptions): void
    {
        // not supported
    }
//#endregion Attach and Send Values (Not Supported)    
}
