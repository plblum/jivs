/**
 * FieldPresentationFactory is responsible for managing the registration and creation of field presentations.
 * It allows for the registration of field presentation creators, setting default presentations for element roles,
 * and creating field presentations based on the role and presentation name.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FieldPresentationFactory
 */

import { IFieldPresentation } from '../Interfaces/FieldPresentations';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { PresentationFactoryBase } from '../Presentations_common/PresentationFactoryBase';

/**
 * Factory class for creating field presentations (implementations of IFieldPresentation)
 * All FieldPresentations are associated with a presentation name.
 * The factory handles registration and creation of field presentations based on their presentation names.
 * It also manages default presentation names for different element roles.
 * 
 * It is consumed by the FieldPresentationInstaller.
 */
export class FieldPresentationFactory extends PresentationFactoryBase<IFieldPresentation>
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }
}