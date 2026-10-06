/**
 * Base class for an adapter for a group of HTML radio input elements, using their checked property
 * to determine and set the text value of the selected radio element.
 * 
 * @module jivs-dom/Adapters/AbstractClasses/RadioButtonsTextValueAdapterBase
 */


import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { TextValueAdapterBase } from './TextValueAdapterBase';

/**
 * Adapter for a group of HTML radio input elements, using their checked property
 * to determine and set the text value of the selected radio element.
 */
export abstract class RadioButtonsTextValueAdapterBase extends TextValueAdapterBase<HTMLElement>
{

    /**
     * Constructor
     * @param element - the element where the value is found
     * @param anchor - the element that retains the IJivsDomElement structure.
     * It is usually the same as element. Pass null to declare element as its value.
     */
    public constructor(element: HTMLElement, anchor: IJivsDomElement | null = null)
    {
        super(element, anchor);
    }

    public readTextValue(): string | undefined
    {
        for (const radio of this.getRadios())
        {
            if (radio.checked)
            {
                return radio.value;
            }
        }

        return undefined;
    }

    public writeTextValue(textValue: string | undefined): void
    {
        let matched = false;

        for (const radio of this.getRadios())
        {
            const shouldCheck =
                !matched &&
                textValue !== undefined &&
                radio.value === textValue;

            radio.checked = shouldCheck;

            if (shouldCheck)
            {
                matched = true;
            }
        }
    }

    protected abstract getRadios(): HTMLInputElement[];
}