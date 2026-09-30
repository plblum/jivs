/**
 * Static Updater for required indicator widgets.
 * 
 * @module jivs-dom/Aria/ConcreteClasses/RequiredIndicatorAriaStaticUpdater
 */
import { AriaStaticUpdaterBase } from './AriaStaticUpdaterBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';  

/**
 * The editor role will establish the ARIA features for a required field.
 * Thus the required indicator itself should be hidden from assistive technologies to avoid redundancy.
 * Targets role='required'.
 * That includes:
 * - aria-hidden='true' to hide the indicator from assistive technologies.
 */
export class RequiredIndicatorAriaStaticUpdater extends AriaStaticUpdaterBase
{
    public applyStaticAttributes(element: IJivsDomElement, role: ElementRole | string,
        valueHost?: IFieldValueHost): void
    {
        if (role === ElementRole.required)
        {
            let ariaHostElement = this.resolvingAriaHostElement(element);
            this.addAttribute(ariaHostElement, 'aria-hidden', 'true');
        }
    }
}