/**
 * Adapter for a group of HTML radio input elements, using their checked property
 * to determine and set the text value of the selected radio element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/InputRadioGroupTextValueAdapter
 */


import { IDomTextValueAdapter } from '../Interfaces/Adapters';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
/**
 * Adapter for a group of HTML radio input elements, using their checked property
 * to determine and set the text value of the selected radio element.
 * 
 * This implementation REQUIRES that all input type='radio' tags are contained
 * within the same container element, and that container is passed to its constructor.
 * It also REQUIRES that the name attribute of all radio inputs within the group is the same.
 * It never checks the name when determining which radio is selected.
 * 
 * It resolves the input element to read or write by querying for all radio input elements within the container,
 * at any depth below.
 * 
 * Exposed by InputRadioGroupAdapterDefinition.
 */
export class InputRadioGroupTextValueAdapter
    implements IDomTextValueAdapter
{

    public constructor(private readonly anchor: IJivsDomElement
    )
    {
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

    private getRadios(): HTMLInputElement[]
    {

        return Array.from(
            this.anchor.querySelectorAll<HTMLInputElement>(
                'input[type="radio"]'
            )
        );
    }
}