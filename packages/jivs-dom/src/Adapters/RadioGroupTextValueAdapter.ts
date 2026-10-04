//!!MAY BE OBSOLETE - ContainerRadioButtonsAdapterDefinition will use
// RadioButtonsAdapterDefinition as the child, and it may work.
// THis had targeted an earlier idea where we only had a container around radio buttons,
// not around other types of input elements.
/**
 * Adapter for a group of HTML radio input elements under a containing tag, using their checked property
 * to determine and set the text value of the selected radio element.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/RadioGroupTextValueAdapter
 */


import { ITextValueAdapter } from '../Interfaces/Adapters';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { RadioButtonsTextValueAdapterBase } from './RadioButtonsTextValueAdapterBase';

/**
 * Adapter for a group of HTML radio input elements under a containing tag, using their checked property
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
 * Exposed by RadioGroupAdapterDefinition.
 */
export class RadioGroupTextValueAdapter extends RadioButtonsTextValueAdapterBase
    implements ITextValueAdapter
{

    /**
     * Constructor
     * @param containerElement - the element where the value is found
     * @param jivsElement - the element that retains the IJivsDomElement structure.
     * It is usually the same as containerElement. Pass null to declare containerElement as its value.
     */
    public constructor(containerElement: HTMLElement, jivsElement: IJivsDomElement | null = null)
    {
        super(containerElement, jivsElement);
    }

    protected getRadios(): HTMLInputElement[]
    {
        return Array.from(
            this.element.querySelectorAll<HTMLInputElement>(
                'input[type="radio"]'
            )
        );
    }
}