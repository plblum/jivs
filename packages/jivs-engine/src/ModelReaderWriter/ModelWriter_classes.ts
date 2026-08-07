/**
 * @inheritdoc jivs-engine/ModelReaderWriter/Types
 * @module jivs-engine/ModelReaderWriter/ConcreteClasses
 */

import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ModelWriterBase } from './ModelWriterBase';

/**
 * ModelWriter designed for objects
 */
export class ModelWriter<T extends object> extends ModelWriterBase<T>
{
    constructor(valueHostsManager: IValueHostsManager, model: T)
    {
        super(valueHostsManager, model);
    }
}