
/**
 * Provides an editor adapter definition for HTML input elements of a specific type.
 * It uses the InputTextValueAdapter to read and write text values from the input element.
 * It does not support type=radio or type=file. Those have other AdapterDefinitions.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/InputAdapterDefinition
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { InputTextValueAdapter } from '../Adapters/InputTextValueAdapter';
import { ITextValueAdapter, IValueAdapter } from '../Interfaces/Adapters';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Provides an editor adapter definition for HTML input elements of a specific type.
 * It uses the InputTextValueAdapter to read and write text values from the input element.
 * It does not support type=radio or type=file. Those have other AdapterDefinitions.
 */
export class InputAdapterDefinition
    extends EditorAdapterDefinitionBase
{

    public constructor(inputType: string, adapterKey?: string, priority: number = 0,
        defaultFieldPresentationName?: string | null)
    {
        const normalizedInputType = inputType.toLowerCase();

        super(
            adapterKey ??
            `input:${ normalizedInputType }`,
            priority,
            defaultFieldPresentationName
        );

        this._inputType = normalizedInputType;
    }
    /**
     * Supports inputs with this value for its type attribute.
     * Always lowercase, enforced by the constructor.
     */
    protected get inputType(): string
    {
        return this._inputType;
    }
    private readonly _inputType: string;

    /**
     * Matches when element is an HTMLInputElement and its type matches the inputType of this adapter.
     * @param valueHost - The host object that provides the field value.
     * @param element - The HTML element to check for a match.
     * @returns True if the element matches the input type of this adapter; otherwise, false.
     */
    public matches(valueHost: IFieldValueHost, element: HTMLElement): boolean
    {
        return element instanceof HTMLInputElement
            && element.type === this.inputType;
    }

    public createTextValueAdapter(valueHost: IFieldValueHost, element: IJivsDomElement): ITextValueAdapter | null
    {
        return new InputTextValueAdapter(
            this.requireInputElement(element)   // may throw
        );
    }
    public override createValueAdapter(valueHost: IFieldValueHost, anchor: IJivsDomElement): IValueAdapter | null
    {
        return null;
    }

    /**
     * Wires up the onchange event and optionally oninput event for the input element.
     * @param valueHost - The host object that provides the field value.
     * @param element - The HTML element to attach the event listeners to.
     * @param options - The editor installation options that determine event wiring.
     */
    protected attachToSendValuesCore(valueHost: IFieldValueHost, element: IJivsDomElement,
        options: EditorInstallOptions): void
    {
        const input = this.requireInputElement(element); // may throw
        let self = this;
        input.addEventListener('change',
            () => self.sendTextValue(valueHost, element, false)
        );

        if (options.duringEdit)
        {
            input.addEventListener('input',
                () => self.sendTextValue(valueHost, element, true)
            );
        }
    }

    /**
     * Ensures that the provided element is an HTMLInputElement with the correct type
     * and typecasts it back to an HTMLInputElement.
     * @param element - The DOM element to be checked and cast to an HTMLInputElement.
     * @returns The input element if it matches the required type; otherwise, throws an error.
     */
    protected requireInputElement(element: IJivsDomElement): HTMLInputElement
    {
        if (!(element instanceof HTMLInputElement)
            || element.type !== this.inputType)
        {
            throw new Error(
                `Adapter definition '${ this.adapterKey }' `
                + `requires input type '${ this.inputType }'.`
            );
        }

        return element as HTMLInputElement;
    }
}