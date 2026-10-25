/**
 * Provides an editor adapter definition for HTML textarea elements.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/TextAreaAdapterDefinition
 */

import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { TextAreaTextValueAdapter } from '../Adapters/TextAreaTextValueAdapter';
import { defaultTextAreaPresentationName } from '../FieldPresentations/TextAreaPresentation';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import type { SetValueOptions } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsElement } from '../Interfaces/IJivsElement';
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
    /**
     * Creates an editor adapter definition for HTML textarea elements.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    public constructor(adapterKey?: string, priority: number = 80,
        recommendedFieldPresentationName?: string | null)
    {
        super(adapterKey ?? defaultTextAreaAdapterKey, priority, recommendedFieldPresentationName);
    }

    public override defaultFieldPresentationName(): string | null
    {
        return defaultTextAreaPresentationName;
    }
    
    public override matches(valueHost: IFieldValueHost, candidateElement: HTMLElement): boolean
    {
        return candidateElement instanceof HTMLTextAreaElement;
    }
    protected override attachToSendValuesCore(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement,
        options: EditorInstallOptions): void
    {
        let textAreaElement = editor as HTMLTextAreaElement;
        let self = this;
        textAreaElement.addEventListener('change', () => {
            self.sendValue.apply(self, [valueHost, editor, jivsElement, { validate: true }]);
        });
        if (options.duringEdit)
        {
            textAreaElement.addEventListener('input', () => {
                self.sendValue.apply(self, [valueHost, editor, jivsElement, { duringEdit: true, validate: true }]);
            });
        }
    }
    public override sendValue(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement, options?: SetValueOptions): void
    {
        this.sendTextValue(valueHost, editor, jivsElement, options);
    }

    public override createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement): ITextValueAdapter | null
    {
        return new TextAreaTextValueAdapter(editor as HTMLTextAreaElement, jivsElement);
    }
    public override createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement): IValueAdapter | null
    {
        return null;
    }

}

export const defaultTextAreaAdapterKey = 'textarea';