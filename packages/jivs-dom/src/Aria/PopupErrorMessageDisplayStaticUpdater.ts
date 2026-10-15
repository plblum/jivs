import { IJivsElement } from '../Interfaces/IJivsElement';
import { ElementRole } from '../Interfaces/Types';
import { AriaStaticUpdaterBase } from './AriaStaticUpdaterBase';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * Ensures that the element has the appropriate ARIA role for a button that triggers 
 * popup error message content.
 * - role='button' (when no role)
 * - aria-label='localized message for "show validation errors"' when no aria-label or aria-labelledby
 * 
 * The aria-label needs a localized string. Both the default and the localization key 
 * are parameters of the constructor and will use the ErrorMessagesService for localization.
 */
export class PopupErrorMessageDisplayStaticUpdater extends AriaStaticUpdaterBase
{
    /**
     * Constructs a new instance of the PopupErrorMessageDisplayStaticUpdater.
     * @param ariaLabel the default text to speak, from options
     * of popupErrorMessagedisplayPresentation
     * @param ariaLabell10n the localization key for the aria-label text, from options of popupErrorMessagedisplayPresentation
     */
    constructor(ariaLabel?: string, ariaLabell10n?: string)
    {
        super();
        this._ariaLabel = ariaLabel ?? defaultAriaPopupShowsValidationErrors;
        this._ariaLabell10n = ariaLabell10n;
    }
    protected get ariaLabel(): string
    {
        return this._ariaLabel;
    }
    private _ariaLabel: string;

    protected get ariaLabell10n(): string | undefined
    {
        return this._ariaLabell10n;
    }
    private _ariaLabell10n?: string;

    public override applyStaticAttributes(element: IJivsElement, role: ElementRole | string, valueHost?: IFieldValueHost): void
    {
        this.addAttribute(element, 'role', 'button');

        if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby') && valueHost)
        {
            let text = this.resolveText(valueHost);
            if (text)
                element.setAttribute('aria-label', text);
        }
    }
    protected resolveText(valueHost: IFieldValueHost): string | null
    {
        let valueHostsManager = valueHost.valueHostsManager;
        let services = valueHostsManager.services;

        return services.errorMessagesService.localize(
            valueHostsManager.behaviors.activeCultureId!,
            this.ariaLabell10n ?? null, this.ariaLabel);
    }
}

export const defaultAriaPopupShowsValidationErrors = 'Show validation errors';