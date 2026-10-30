/**
 * @inheritdoc jivs-engine/ReaderWriter/Types
 * @module jivs-engine/ReaderWriter/ConcreteClasses
 */

import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { WriterOptions } from '../Interfaces/ReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ValueRulesWriterBase, WriterBase } from './WriterBase';

/**
 * ModelWriter concrete implementation.
 * 
 * @typeParam TExternalData - The type of the external data object that the ModelWriter will manage.
 */
export class ModelWriter<TExternalData extends object, TOptions extends WriterOptions = WriterOptions>
    extends ValueRulesWriterBase<TExternalData, TOptions>
{
    constructor(valueHostsManager: IValueHostsManager, externalData: TExternalData, options?: TOptions)
    {
        super(valueHostsManager, externalData, options);
    }
}