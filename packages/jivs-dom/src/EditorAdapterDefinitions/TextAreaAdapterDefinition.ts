/**
 * Provides an editor adapter definition for HTML textarea elements.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/TextAreaAdapterDefinition
 */

import { IDomTextValueAdapter, IDomValueAdapter } from '../Interfaces/Adapters';
import { TextAreaTextValueAdapter } from '../Adapters/TextAreaTextValueAdapter';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Provides an editor adapter definition for HTML textarea elements.
 * 
 * Supplies:
 * - requires an HTML textarea element
 * - onchange event listener calls valueHost.setTextValue
 * - uses TextAreaTextValueAdapter
 */
export class TextAreaAdapterDefinition extends EditorAdapterDefinitionBase
{
    public constructor(adapterKey?: string, priority: number = 0,
        defaultFieldPresentationName?: string | null)
    {
        super(adapterKey ?? 'textarea', priority, defaultFieldPresentationName);
    }
    
    public override matches(valueHost: IFieldValueHost, element: HTMLElement): boolean
    {
        return element instanceof HTMLTextAreaElement;
    }
    protected override attachToSendValuesCore(valueHost: IFieldValueHost, anchor: IJivsDomElement,
        options: EditorInstallOptions): void
    {
        let element = anchor as HTMLTextAreaElement;
        let self = this;
        element.addEventListener('change', () => {
            self.sendTextValue(valueHost, anchor, false);
        });
        if (options.duringEdit)
        {
            element.addEventListener('input', () => {
                self.sendTextValue(valueHost, anchor, true);
            });
        }
    }
    public override createTextValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IDomTextValueAdapter | null
    {
        return new TextAreaTextValueAdapter(anchor as HTMLTextAreaElement);
    }
    public override createValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IDomValueAdapter | null
    {
        return null;
    }

}