/**
 * Provides an editor adapter definition for HTML input elements of type checkbox.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/CheckboxAdapterDefinition
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ITextValueAdapter } from '../Interfaces/Adapters';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { InputAdapterDefinition } from './InputAdapterDefinition';
import { CheckboxTextValueAdapter } from '../Adapters/CheckboxTextValueAdapter';
import { defaultCheckboxPresentationName } from '../FieldPresentations/CheckboxPresentation';

/**
 * Provides an editor adapter definition for HTML input elements of type checkbox.
 * It uses the CheckboxTextValueAdapter to read and write the checked state of the checkbox.
 * Otherwise its behavior is the same as a standard input element of type checkbox.
 */
export class CheckboxAdapterDefinition extends InputAdapterDefinition
{
    /**
     * Creates an editor adapter definition for HTML input elements of type checkbox.
     *
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    public constructor(adapterKey?: string, priority: number = 80,
        recommendedFieldPresentationName?: string | null)
    {
        super('checkbox', adapterKey ?? defaultCheckboxAdapterKey,
            priority, recommendedFieldPresentationName);
    }

    public override defaultFieldPresentationName(): string | null
    {
        return defaultCheckboxPresentationName;
    }

    public override createTextValueAdapter(valueHost: IFieldValueHost,
        editor: HTMLElement, anchor: IJivsDomElement): ITextValueAdapter
    {
        return new CheckboxTextValueAdapter(
            this.requireInputElement(editor),   // may throw
            anchor
        );
    }
}

export const defaultCheckboxAdapterKey = 'input:checkbox';