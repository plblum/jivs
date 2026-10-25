/**
 * @inheritdoc jivs-engine/ModelReaderWriter/Types
 * @module jivs-engine/ModelReaderWriter/ConcreteClasses
 */

import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { WriterBase } from './WriterBase';

/**
 * ModelWriter concrete implementation.
 * 
 * @typeParam TExternalData - The type of the external data object that the ModelWriter will manage.
 */
export class ModelWriter<TExternalData extends object> extends WriterBase<TExternalData>
{
    constructor(valueHostsManager: IValueHostsManager, externalData: TExternalData)
    {
        super(valueHostsManager, externalData);
    }
}