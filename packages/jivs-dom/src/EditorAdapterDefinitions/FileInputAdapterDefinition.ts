/**
 * Provides an editor adapter definition for HTML input type='file' elements.
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/FileInputAdapterDefinition
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { FileInputTextValueAdapter } from '../Adapters/FileInputTextValueAdapter';
import { defaultFileInputPresentationName } from '../FieldPresentations/FileInputPresentation';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { InputAdapterDefinition } from './InputAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML input type='file' elements.
 * This element has some strange behaviors as the value attribute does not 
 * expose its raw value.
 * So we have supplied FileInputTextValueAdapter which returns either a string
 * of file names selected by the user or an empty string.
 * This allows for validation by RequireText and RegExp but not much else.
 * 
 * Supplies:
 * - requires an HTML input type='file' element
 * - onchange event listener calls valueHost.setTextValue
 * - uses FileInputTextValueAdapter
 */
export class FileInputAdapterDefinition extends InputAdapterDefinition
{
    public constructor(adapterKey?: string, priority: number = 0,
        recommendedFieldPresentationName?: string | null)
    {
        super('file', adapterKey ?? defaultFileInputAdapterKey, priority, recommendedFieldPresentationName);
    }

    override defaultFieldPresentationName(): string | null
    {
        return defaultFileInputPresentationName;
    }

    public override createTextValueAdapter(
        valueHost: IFieldValueHost, anchor: IJivsDomElement) : ITextValueAdapter | null
    {
        return new FileInputTextValueAdapter(this.requireInputElement(anchor));
    }
    public override createValueAdapter(
        valueHost: IFieldValueHost, anchor: IJivsDomElement): IValueAdapter | null
    {
        return null;
    }

}

export const defaultFileInputAdapterKey = 'input:file';