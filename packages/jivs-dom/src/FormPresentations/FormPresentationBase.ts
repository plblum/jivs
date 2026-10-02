/**
 * Base class for form presentations that handles validation state application.
 * @module jivs-dom/FormPresentations/AbstractClasses/FormPresentationBase
 */
import type { ValidationState } from '@plblum/jivs-engine/build/interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/interfaces/ValueHostsManager';
import { groupsMatch } from '@plblum/jivs-engine/build/Utilities/Utilities';
import { AdapterBase } from '../Adapters/AdapterBase';
import { IAriaStaticUpdater } from '../Interfaces/AriaUpdaters';
import { IFormPresentation } from '../Interfaces/FormPresentations';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';

/**
 * Base class for form presentations that handles validation state application.
 * 
 * - implement init() when you need to perform initialization logic for the form presentation.
 * - implement apply() to update the form presentation based on the validation state.
 * - optionally override resolvePresentationElement() to customize the element that is the target of the presentation,
 *   such as the host of the CSS class names.
 * - optionally override getStaticAriaElementUpdater()
 *   to provide ARIA updates on another element than the anchor.
 */
export abstract class FormPresentationBase<TElement extends IJivsDomElement = IJivsDomElement>
    extends AdapterBase<TElement>
    implements IFormPresentation
{
    private _respondToWildcardGroup: boolean = false;

    public get respondToWildcardGroup(): boolean
    {
        return this._respondToWildcardGroup;
    }

    public constructor(element: TElement, jivsElement: IJivsDomElement | null, respondToWildcardGroup: boolean = false)
    {
        super(element, jivsElement);
        this._respondToWildcardGroup = respondToWildcardGroup;
    }

    /**
     * The element property may not always represent the actual presentation element.
     * Use this property to access the element that should be used for presentation purposes.
     * Designed to allow the element to be switched as the widget may discard and rebuild itself.
     */
    protected get presentationElement(): TElement
    {
        return this.resolvePresentationElement(this.element);
    }

    /**
     * Resolves the actual presentation element for the field presentation.
     * @param element The element to resolve as the presentation element.
     * @returns The resolved presentation element.
     * The default implementation returns the element itself.
     */
    protected resolvePresentationElement(element: TElement): TElement
    {
        return element;
    }

    public init(): void
    {
        // nothing in the base
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
            if (!this.respondToWildcardGroup)
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
     * Use when the target element for arias is not the anchor element.
     * 
     * NOTE: There is no similar ARIA validation state updater because
     * the ARIA attributes do not have any dynamic validation attributes at the form level.
     * 
     * @returns The static ARIA element updater, or null if not available,
     * which means use the default Aria Static Updater.
     */
    public getStaticAriaElementUpdater(): IAriaStaticUpdater | null
    {
        return null;
    }
}