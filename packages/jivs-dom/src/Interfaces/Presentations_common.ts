import { IJivsDomElement } from './IJivsDomElement';
import { ElementRole } from './Types';

/**
 * Used by PresentationFactories to create their presentation instances.
 */
export type PresentationCreator<TResult> = (element: IJivsDomElement) => TResult;

/**
 * Factory that registers and creates Presentation instances.
 * Every registration connects a Presentation Name to an instance.
 * The same instance can be registered under multiple presentation names.
 * That name is used in lookups, either as an option parameter, 
 * or from a supplied default presentation name.
 * 
 * The factory is only used during the initialization phase.
 */
export interface IPresentationFactory<TResult>
{
    /**
     * Registers a presentation creator function under the specified presentation name.
     * Replaces any previously registered creator function for the same presentation name.
     * 
     * @param presentationName The name of the presentation to register.
     * @param creator The function that creates a presentation instance for the given element.
     */
    register(presentationName: string, creator: PresentationCreator<TResult>): void;

    /**
     * Sets the default presentation name for a given role.
     * 
     * @param role The role for which to set the default presentation name.
     * @param presentationName The default presentation name to associate with the role.
     */
    setDefaultPresentationName(role: ElementRole | string, presentationName: string): void;

    /**
     * Creates a presentation instance for the given element, role, and optional presentation name.
     * 
     * @param element The DOM element for which to create the presentation.
     * @param role The role of the element for which to create the presentation.
     * @param presentationName The optional presentation name to use for creating the presentation.
     * When supplied, it overrides the default presentation name set for the role.
     */
    create(element: IJivsDomElement, role: ElementRole | string, presentationName?: string | null): TResult;
}
