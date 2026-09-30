/**
 * Static Updater for validation summary widgets.
 * 
 * @module jivs-dom/Aria/ConcreteClasses/ValidationSummaryAriaStaticUpdater
 */
import { AriaStaticUpdaterBase } from './AriaStaticUpdaterBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';  

/**
 * Targets role='summary' to establish the standard aria features for a validation summary widget.
 * That includes:
 * - role='status' for individual validation messages within the summary.
 * - aria-atomic='true' to ensure that assistive technologies present the entire updated content of the summary.
 * - aria-live='polite' to notify assistive technologies of updates to the summary in a non-disruptive manner.
 */
export class ValidationSummaryAriaStaticUpdater extends AriaStaticUpdaterBase
{
    public applyStaticAttributes(element: IJivsDomElement, role: ElementRole | string,
        valueHost?: IFieldValueHost): void
    {
        if (role === ElementRole.summary)
        {
            let ariaHostElement = this.resolvingAriaHostElement(element);
            this.addAttribute(ariaHostElement, 'role', 'status');
            this.addAttribute(ariaHostElement, 'aria-atomic', 'true');
            this.addAttribute(ariaHostElement, 'aria-live', 'polite');
        }
    }
}
