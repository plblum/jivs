/**
 * Base class for form presentations that handles validation state application.
 * @module jivs-dom/FormPresentations/AbstractClasses/FormPresentationBase
 */
import type { ValidationState } from '@plblum/jivs-engine/build/interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/interfaces/ValueHostsManager';
import { groupsMatch } from '@plblum/jivs-engine/build/Utilities/Utilities';
import { PresentationBase } from '../Presentations_common/PresentationBase';
import { IAriaStaticUpdater } from '../Interfaces/AriaUpdaters';
import { IFormPresentation } from '../Interfaces/FormPresentations';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { PresentationBaseOptions } from '../Presentations_common/PresentationBase';

/**
 * Base class for form presentations that handles validation state application.
 * 
 * - implement init() when you need to perform initialization logic for the form presentation.
 * - implement apply() to update the form presentation based on the validation state.
 * - optionally override resolvePresentationElement() to customize the element that is the target of the presentation,
 *   such as the host of the CSS class names.
 * - optionally override getStaticAriaUpdater()
 *   to provide ARIA updates on another element than the presentation element.
 */
export abstract class FormPresentationBase<
    TOptions extends FormPresentationBaseOptions,
    TElement extends IJivsElement = IJivsElement>
    extends PresentationBase<TOptions, TElement>
    implements IFormPresentation
{

    public constructor(element: TElement, options?: TOptions, jivsElement?: IJivsElement)
    {
        super(element, options, jivsElement);
    }

    protected override getOptionDefaults(): Partial<TOptions>
    {
        return {
            respondToWildcardGroup: false
        } as Partial<TOptions>;
    }

    /**
     * Applies the validation state to the form presentation, 
     * taking into account the presentation's group and wildcard settings.
     * @param valueHostsManager 
     * @param state 
     * @returns 
     */
    public apply(valueHostsManager: IValueHostsManager, state: ValidationState): void
    {
        /*
          jivsFormPresentationGroup allows a form element to be dedicated to a specific validation group.
          When assigned and not '', '*', or null, the IFormPresentation should check this upon
          being called by the dispatcher. It will be supplied with the validation group in the ValidationState.group property.
         */

        const presentationGroup = this.element.jivsFormPresentationGroup;
        const presentationIsWildcard = this.isWildcardGroup(presentationGroup);
        const stateIsWildcard = this.isWildcardGroup(state.group);

        // Handle the case where the presentation group is not a wildcard but the state group is a wildcard.
        if (!presentationIsWildcard && stateIsWildcard)
        {
            if (!this.options.respondToWildcardGroup)
            {
                return;
            }

            this.applyCore(valueHostsManager,
                valueHostsManager.currentValidationState({
                    group: presentationGroup
                }));
            return;
        }

        if (presentationIsWildcard !== stateIsWildcard)
        {
            return;
        }

        if (!groupsMatch(presentationGroup, state.group))
        {
            return;
        }

        this.applyCore(valueHostsManager, state);
    }

    /**
     * Implement to provide the logic for applying the validation state to the form presentation.
     * @param valueHostsManager The manager responsible for handling value hosts.
     * @param state The current validation state to be applied.
     */
    protected abstract applyCore(valueHostsManager: IValueHostsManager, state: ValidationState): void;

    private isWildcardGroup(group: string | null | undefined): boolean
    {
        return group === null
            || group === undefined
            || group === ""
            || group === "*";
    }

    /**
     * Allows the FormPresentation to override the default Aria Static Updater.
     * Use when the target element for arias is not the presentation element.
     * 
     * NOTE: There is no similar ARIA validation state updater because
     * the ARIA attributes do not have any dynamic validation attributes at the form level.
     * 
     * @returns The static ARIA element updater, or null if not available,
     * which means use the default Aria Static Updater.
     */
    public getStaticAriaUpdater(): IAriaStaticUpdater | null
    {
        return null;
    }
}

export interface FormPresentationBaseOptions extends PresentationBaseOptions
{
    /**
     * Indicates whether the form presentation should respond to wildcard validation groups
     * when it has been configured for a specific validation group.
     * So it has two possible behaviors depending on this setting:
     * - just issues for the validation group
     * - all validation groups when validation without specifying a group occurs.
     */
    respondToWildcardGroup?: boolean;
}