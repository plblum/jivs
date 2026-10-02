/**
 * Provides an editor adapter definition for HTML textarea elements.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/TextAreaAdapterDefinition
 */

import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { TextAreaTextValueAdapter } from '../Adapters/TextAreaTextValueAdapter';
import { defaultTextAreaPresentationName } from '../FieldPresentations/TextAreaPresentation';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';

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
        recommendedFieldPresentationName?: string | null)
    {
        super(adapterKey ?? defaultTextAreaAdapterKey, priority, recommendedFieldPresentationName);
    }

    public override defaultFieldPresentationName(): string | null
    {
        return defaultTextAreaPresentationName;
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
    public override createTextValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): ITextValueAdapter | null
    {
        return new TextAreaTextValueAdapter(anchor as HTMLTextAreaElement);
    }
    public override createValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IValueAdapter | null
    {
        return null;
    }

}

export const defaultTextAreaAdapterKey = 'textarea';