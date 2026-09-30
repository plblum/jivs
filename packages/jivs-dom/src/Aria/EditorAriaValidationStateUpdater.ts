import { AriaValidationStateUpdaterBase } from './AriaValidationStateUpdaterBase';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';

/**
 * Targets role='editor' elements. The editor will have ARIA attributes applied to the supplied element.
 * Subclass if your editor needs it elsewhere, overriding resolvingAriaHostElement()
 * Applies:
 * - aria-invalid='true' when the editor has a validation error. When it does not, it removes the attribute.
 * - aria-errormessage pointing to the error message element by the ID supplied in the errorMessageId parameter.
 * 
 * NOTE: uses ValueHostValidationState.isValid == false, not issuesFound.length > 0 
 * because issuesFound includes warnings and we are not considering warnings as validation errors.
 * This differs from the error display widgets that show when issuesFound has content, including warnings.
 */
export class EditorAriaValidationStateUpdater extends AriaValidationStateUpdaterBase
{
    public constructor()
    {
        super();
    }

    public applyValidationState(element: IJivsDomElement, valueHost: IFieldValueHost,
        state: ValueHostValidationState, errorMessageId?: string): void
    {
        if (element.jivsElementRole === ElementRole.editor)
        {
            let ariaHostElement = this.resolvingAriaHostElement(element);
            // NOTE: uses isValid, not issuesFound.length > 0 
            // because issuesFound includes warnings and we are not considering warnings as validation errors.
            if (!state.isValid)
            {
                ariaHostElement.setAttribute('aria-invalid', 'true');
                if (errorMessageId)
                {
                    ariaHostElement.setAttribute('aria-errormessage', errorMessageId);
                }
            }
            else
            {
                ariaHostElement.removeAttribute('aria-invalid');
                ariaHostElement.removeAttribute('aria-errormessage');
            }
        }
    }
}

