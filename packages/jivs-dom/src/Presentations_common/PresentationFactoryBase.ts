/**
 * @module jivs-dom/Presentations/AbstractClasses/PresentationFactoryBase
 */
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { ElementRole } from '../Interfaces/Types';
import { DomServiceBase } from '../Services/DomServiceBase';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IPresentationFactory, PresentationCreator } from '../Interfaces/Presentations_common';

export abstract class PresentationFactoryBase<TResult> extends DomServiceBase
    implements IPresentationFactory<TResult>
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }
    protected get registry(): Map<string, PresentationCreator<TResult>>
    {
        return this._registry;
    }
    private _registry: Map<string, PresentationCreator<TResult>> = new Map<string, PresentationCreator<TResult>>();

    protected get defaultPresentations(): Map<ElementRole | string, string>
    {
        return this._defaultPresentations;
    }
    private _defaultPresentations: Map<ElementRole | string, string> = new Map<ElementRole | string, string>();
    /**
     * Add or replace a field presentation creator for the specified presentation name.
     * @param presentationName The name of the presentation to register the creator for.
     * It is handled case insensitively.
     * @param creator The creator function for the field presentation.
     */
    public register(presentationName: string, creator: PresentationCreator<TResult>): void
    {
        assertNotNull(presentationName, 'presentationName');
        assertNotNull(creator, 'creator');
        presentationName = PresentationFactoryBase.normalizePresentationName(presentationName);
        this.registry.set(presentationName, creator);
    }
    /**
     * Adds or replaces a mapping between role and presentation name.
     * These are the default presentations for different element roles, only 
     * when other sources of presentation names have not supplied a value.
     * options.presentationName -> factory.
     * 
     * @param role The element role for which to set the default presentation name.
     * @param presentationName The default presentation name to associate with the role.
     */
    public setDefaultPresentationName(role: ElementRole | string, presentationName: string): void
    {
        assertNotNull(role, 'role');
        assertNotNull(presentationName, 'presentationName');
        presentationName = PresentationFactoryBase.normalizePresentationName(presentationName);
        this._defaultPresentations.set(role, presentationName);
    }

    /**
     * Creates a IFormPresentation implementation to attach to the supplied anchor element.
     * It requires both a role and a presentation name for lookup in our registry.
     * If the presentation name is not provided, the factory will use the default presentation for the role.
     * 
     * @param element The DOM element for which to create the field presentation.
     * @param role The element role for which to create the field presentation.
     * @param presentationName The specific presentation name to use, if any.
     */
    public create(element: IJivsDomElement, role: ElementRole | string, presentationName?: string | null): TResult
    {
        if (!presentationName)
        {
            presentationName = this._defaultPresentations.get(role);
            if (!presentationName)
            {
                let message = `No default presentation registered for role: ${ role }`;
                this.logger().message(LoggingLevel.Error, ()=> message);
                throw new Error(message);
            }
        }
        presentationName = PresentationFactoryBase.normalizePresentationName(presentationName);
        const creator = this.registry.get(presentationName);
        if (!creator)
        {
            let message = `No field presentation registered for name: ${presentationName}`;
            this.logger().message(LoggingLevel.Error, ()=> message);
            throw new Error(message);
        }
        return creator(element);
    }    

    public static normalizePresentationName(presentationName: string): string
    {
        return presentationName.toLowerCase();
    }
}