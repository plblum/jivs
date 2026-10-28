import { IJivsElement } from '../Interfaces/IJivsElement';
import { ElementRole } from '../Interfaces/Types';
import { AriaStaticUpdaterBase } from './AriaStaticUpdaterBase';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * Ensures the element with role='aria-error' has the 'jivs-visually-hidden' class applied, 
 * making it accessible to assistive technologies while remaining visually hidden.
 * That class is included in jivs-dom.css.
 * There is a constructor parameter that can replace its value.
 */
export class HiddenErrorMessagesAriaStaticUpdater extends AriaStaticUpdaterBase
{
    constructor(visualHiddenClass: string = 'jivs-visually-hidden') {
        super();
        this._visualHiddenClass = visualHiddenClass;
    }   
    private _visualHiddenClass: string;

    override applyStaticAttributes(element: IJivsElement, role: ElementRole | string, valueHost?: IFieldValueHost): void
    {
        if (role === 'aria-error') {
            element.classList.add(this._visualHiddenClass);
        }
    }

}