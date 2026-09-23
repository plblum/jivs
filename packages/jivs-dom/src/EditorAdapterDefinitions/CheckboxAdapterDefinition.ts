/**
 * Provides an editor adapter definition for HTML input elements of type checkbox.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/CheckboxAdapterDefinition
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IDomTextValueAdapter } from '../Interfaces/Adapters';
import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { InputAdapterDefinition } from './InputAdapterDefinition';
import { CheckboxTextValueAdapter } from '../Adapters/CheckboxTextValueAdapter';

/**
 * Provides an editor adapter definition for HTML input elements of type checkbox.
 * It uses the CheckboxTextValueAdapter to read and write the checked state of the checkbox.
 * Otherwise its behavior is the same as a standard input element of type checkbox.
 */
export class CheckboxAdapterDefinition extends InputAdapterDefinition
{
    public constructor(adapterKey?: string, priority: number = 0,
        defaultFieldPresentationName?: string | null)
    {
        super('checkbox', adapterKey, priority, defaultFieldPresentationName);
    }

    override createTextValueAdapter(valueHost: IFieldValueHost, element: IJivsDomElement): IDomTextValueAdapter
    {
        return new CheckboxTextValueAdapter(
            this.requireInputElement(element)   // may throw
        );
    }
}