/**
 * Provides a centralized way to create form presentation instances based on the current DOM services context.
 * @module jivs-dom/FormPresentations/ConcreteClasses/FormPresentationFactory
 */

import { IFormPresentation } from '../Interfaces/FormPresentations';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { PresentationFactoryBase } from '../Presentations_common/PresentationFactoryBase';

/**
 * Factory class responsible for creating instances of IFormPresentation implementations.
 * It is exposed by IJivsDomServices.formPresentationFactory to create form presentation instances.
 */
export class FormPresentationFactory extends PresentationFactoryBase<IFormPresentation>
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }
}