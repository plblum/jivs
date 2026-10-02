/**
 * Provides an editor adapter definition for HTML select elements.
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/SelectAdapterDefinition
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { SelectTextValueAdapter } from '../Adapters/SelectTextValueAdapter';
import { defaultSelectPresentationName as selectPresentationName } from '../FieldPresentations/SelectPresentation';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';

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
        recommendedFieldPresentationName?: string | null)
    {
        super(adapterKey ?? defaultSelectAdapterKey, priority, recommendedFieldPresentationName);
    }

    override defaultFieldPresentationName(): string | null
    {
        return selectPresentationName;
    }
    
    public override matches(valueHost: IFieldValueHost, candidateElement: HTMLElement): boolean
    {
        return candidateElement instanceof HTMLSelectElement;
    }
    protected override attachToSendValuesCore(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement,
        options: EditorInstallOptions): void
    {
        let selectElement = editor as HTMLSelectElement;
        let self = this;
        selectElement.addEventListener('change', () => {
            self.sendTextValue(valueHost, editor, anchor, false);
        });
    }
    public override createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement): ITextValueAdapter | null
    {
        return new SelectTextValueAdapter(editor as HTMLSelectElement, anchor);
    }
    public override createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement): IValueAdapter | null
    {
        return null;
    }

}

export const defaultSelectAdapterKey = 'select';