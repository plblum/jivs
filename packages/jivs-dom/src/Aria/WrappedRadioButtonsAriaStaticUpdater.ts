/**
 * Static Updater for radio group widgets specific to InputRadioGroupAdapterDefinition.
 * 
 * @module jivs-dom/Aria/ConcreteClasses/WrappedRadioButtonsAriaStaticUpdater
 */
import { AriaStaticUpdaterBase } from './AriaStaticUpdaterBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';  

/**
 * Is only delivered by WrappedRadioButtonsAdapterDefinition to support its radio group approach
 * where one element is a wrapper with the role of radio group and contains individual radio buttons as its children.
 * - role='radiogroup' is applied to the wrapper element to indicate it is a radio group.
 */
export class WrappedRadioButtonsAriaStaticUpdater extends AriaStaticUpdaterBase
{
    public applyStaticAttributes(element: IJivsDomElement, role: ElementRole | string,
        valueHost?: IFieldValueHost): void
    {
        if (role === ElementRole.editor)
        {
            let ariaHostElement = this.resolvingAriaHostElement(element);
            this.addAttribute(ariaHostElement, 'role', 'radiogroup')
        }
    }
}