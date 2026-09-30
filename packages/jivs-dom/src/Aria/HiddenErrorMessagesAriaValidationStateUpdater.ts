/**
 * Validation State Updater for Error Messages element that is only 
 * visible to aria.
 */

import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { AriaValidationStateUpdaterBase } from './AriaValidationStateUpdaterBase';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';

/**
 * Targets role='aria-error'.
 * This is a special element designed to host the plain text of the list of error messages
 * in its content while remaining hidden from the visual layout.
 * This Updater provides the content for the hidden error messages element.
 * It expects the element to be the container of the plain text content.
 * 
 * It is customizable through the separator and limit properties, which are
 * supplied in the constructor. They default to '; ' for the separator and null for the limit.
 * - separator: The string used to separate error messages. Defaults to '; '.
 * - limit: The maximum number of error messages to display. Defaults to null, which means no limit.
 */
export class HiddenErrorMessagesAriaValidationStateUpdater extends AriaValidationStateUpdaterBase
{
    constructor(separator: string = '; ', limit: number | null = null)
    {
        super();
        this._separator = separator;
        this._limit = limit;
    }

    /**
     * Gets or sets the separator used between error messages in the hidden error messages element.
     * It defaults to '; '
     */
    protected get separator(): string
    {
        return this._separator;
    }
    private _separator: string = '; ';

    /**
     * Gets or sets the maximum number of error messages to display in the hidden error messages element.
     * It defaults to null, which means no limit.
     */
    protected get limit(): number| null
    {
        return this._limit;
    }
    private _limit: number | null = null;
    
    public override applyValidationState(element: IJivsDomElement, valueHost: IFieldValueHost,
        state: ValueHostValidationState, errorMessageId?: string): void
    {
        if (element.jivsElementRole === 'aria-error')
        {
            let ariaHostElement = this.resolvingAriaHostElement(element);
            if (state.issuesFound && state.issuesFound.length > 0)
            {
                let domServices = valueHost.valueHostsManager.services.domServices;
                ariaHostElement.textContent = domServices.issuesFoundFormatterService.buildAsText(
                    valueHost.valueHostsManager, state.issuesFound, false, this.separator, this.limit ?? undefined);
            }
            else
            {
                ariaHostElement.textContent = '';
            }
        }
    }
    
}