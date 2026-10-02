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
    public constructor(adapterKey?: string, priority: number = 0,
        recommendedFieldPresentationName?: string | null)
    {
        super('checkbox', adapterKey ?? defaultCheckboxAdapterKey,
            priority, recommendedFieldPresentationName);
    }

    public override defaultFieldPresentationName(): string | null
    {
        return defaultCheckboxPresentationName;
    }

    public override createTextValueAdapter(valueHost: IFieldValueHost, element: IJivsDomElement): ITextValueAdapter
    {
        return new CheckboxTextValueAdapter(
            this.requireInputElement(element)   // may throw
        );
    }
}

export const defaultCheckboxAdapterKey = 'input:checkbox';