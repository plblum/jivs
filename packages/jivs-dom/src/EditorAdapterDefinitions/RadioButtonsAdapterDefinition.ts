/**
 * Provides an editor adapter definition for HTML input elements of type radio.
 * 
 * Within a radio group, only one should have IDomJivsElement and this associated
 * jivsEditorAdapterDefinition. Adapters designed for this scenario should
 * use that one element as the identifying name for the radio group
 * and use it to get all radio buttons within the same group.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/RadioButtonAdapterDefinition
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ITextValueAdapter } from '../Interfaces/Adapters';
import { RadioButtonsTextValueAdapter } from '../Adapters/RadioButtonsTextValueAdapter';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { InputAdapterDefinition } from './InputAdapterDefinition';
import { defaultRadioButtonsPresentationName } from '../FieldPresentations/RadioButtonsPresentation';

/**
 * Provides an editor adapter definition for HTML input elements of type radio.
 * 
 * Within a radio group, only one should have IDomJivsElement and this associated
 * jivsEditorAdapterDefinition. Adapters designed for this scenario should
 * use that one element as the identifying name for the radio group
 * and use it to get all radio buttons within the same group.
 * 
 * It uses the RadioButtonsTextValueAdapter to read and write the checked state of the radio button.
 * It uses RadioButtonsPresentation as the default field presentation.
 */
export class RadioButtonsAdapterDefinition extends InputAdapterDefinition
{
    /**
     * Creates an editor adapter definition for HTML input elements of type radio.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    public constructor(adapterKey?: string, priority: number = 80,
        recommendedFieldPresentationName?: string | null)
    {
        super('radio', adapterKey ?? defaultRadioButtonsAdapterKey, priority, recommendedFieldPresentationName);
    }

    public override defaultFieldPresentationName(): string | null
    {
        return defaultRadioButtonsPresentationName;
    }

    public override createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement, anchor: IJivsDomElement): ITextValueAdapter
    {
        return new RadioButtonsTextValueAdapter(
            this.requireInputElement(editor),   // may throw
            anchor
        );
    }
}

export const defaultRadioButtonsAdapterKey = 'input:radio';