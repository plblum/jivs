/**
 * Provides an editor adapter definition for HTML select elements.
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/SelectAdapterDefinition
 */
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { SelectTextValueAdapter } from '../Adapters/SelectTextValueAdapter';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Provides an editor adapter definition for HTML select elements.
 * 
 * Supplies:
 * - requires an HTML select element
 * - onchange event listener calls valueHost.setTextValue
 * - uses SelectTextValueAdapter
 */
export class SelectAdapterDefinition extends EditorAdapterDefinitionBase
{
    public constructor(adapterKey?: string, priority: number = 0,
        defaultFieldPresentationName?: string | null)
    {
        super(adapterKey ?? 'select', priority, defaultFieldPresentationName);
    }
    
    public override matches(valueHost: IFieldValueHost, element: HTMLElement): boolean
    {
        return element instanceof HTMLSelectElement;
    }
    protected override attachToSendValuesCore(valueHost: IFieldValueHost, anchor: IJivsDomElement,
        options: EditorInstallOptions): void
    {
        let element = anchor as HTMLSelectElement;
        let self = this;
        element.addEventListener('change', () => {
            self.sendTextValue(valueHost, anchor, false);
        });
    }
    public override createTextValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): ITextValueAdapter | null
    {
        return new SelectTextValueAdapter(anchor as HTMLSelectElement);
    }
    public override createValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IValueAdapter | null
    {
        return null;
    }

}