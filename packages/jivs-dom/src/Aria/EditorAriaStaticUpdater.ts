/**
 * Static Updater for editor widgets.
 * 
 * @module jivs-dom/Aria/ConcreteClasses/EditorAriaStaticUpdater
 */
import { AriaStaticUpdaterBase } from './AriaStaticUpdaterBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';  

/**
 * Targets role='editor' to establish the standard ARIA features for an editor widget.
 * That includes:
 * - aria-required='true' if the editor is a required field. FieldValueHost.required = true
 * indicates that the editor is a required field.
 */
export class EditorAriaStaticUpdater extends AriaStaticUpdaterBase
{
    public applyStaticAttributes(element: IJivsDomElement, role: ElementRole | string,
        valueHost?: IFieldValueHost): void
    {
        if (role === ElementRole.editor)
        {
            if (valueHost?.required)
            {
                let ariaHostElement = this.resolvingAriaHostElement(element);
                this.addAttribute(ariaHostElement, 'aria-required', 'true');
            }
        }
    }
}