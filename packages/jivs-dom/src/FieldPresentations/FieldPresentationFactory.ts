/**
 * FieldPresentationFactory is responsible for managing the registration and creation of field presentations.
 * It allows for the registration of field presentation creators, setting default presentations for element roles,
 * and creating field presentations based on the role and presentation name.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FieldPresentationFactory
 */

import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { LoggingFacade } from '@plblum/jivs-engine/build/Utilities/LoggingFacade';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { FieldPresentationCreator, IFieldPresentation, IFieldPresentationFactory } from '../Interfaces/FieldPresentations';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { ElementRole } from '../Interfaces/Types';
import { DomServiceBase } from '../Services/DomServiceBase';

/**
 * Factory class for creating field presentations (implementations of IFieldPresentation)
 * All FieldPresentations are associated with a presentation name.
 * The factory handles registration and creation of field presentations based on their presentation names.
 * It also manages default presentation names for different element roles.
 * 
 * It is consumed by the FieldPresentationInstaller.
 */
export class FieldPresentationFactory extends DomServiceBase
    implements IFieldPresentationFactory
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }

    protected get registry(): Map<string, FieldPresentationCreator>
    {
        return this._registry;
    }
    private _registry: Map<string, FieldPresentationCreator> = new Map<string, FieldPresentationCreator>();

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
    public register(presentationName: string, creator: FieldPresentationCreator): void
    {
        assertNotNull(presentationName, 'presentationName');
        assertNotNull(creator, 'creator');
        presentationName = FieldPresentationFactory.normalizePresentationName(presentationName);
        this.registry.set(presentationName, creator);
    }
    /**
     * Adds or replaces a mapping between role and presentation name.
     * These are the default presentations for different element roles, only 
     * when other sources of presentation names have not supplied a value.
     * Sources for editors:
     * options.presentationName -> EditorAdapterDefinition.defaultPresentationName -> factory.
     * Sources for other roles:
     * options.presentationName -> factory.
     * 
     * @param role The element role for which to set the default presentation name.
     * @param presentationName The default presentation name to associate with the role.
     */
    public setDefaultPresentationName(role: ElementRole | string, presentationName: string): void
    {
        assertNotNull(role, 'role');
        assertNotNull(presentationName, 'presentationName');
        presentationName = FieldPresentationFactory.normalizePresentationName(presentationName);
        this._defaultPresentations.set(role, presentationName);
    }

    /**
     * Creates a IFieldPresentation implementation to attach to the supplied anchor element.
     * It requires both a role and a presentation name for lookup in our registry.
     * If the presentation name is not provided, the factory will use the default presentation for the role.
     * 
     * @param element The DOM element for which to create the field presentation.
     * @param role The element role for which to create the field presentation.
     * @param presentationName The specific presentation name to use, if any.
     */
    public create(element: IJivsDomElement, role: ElementRole | string, presentationName?: string | null): IFieldPresentation
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
        presentationName = FieldPresentationFactory.normalizePresentationName(presentationName);
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