import { ReaderBase } from '@plblum/jivs-engine/build/ReaderWriter/ReaderBase';
import { ReaderOptions } from '@plblum/jivs-engine/build/Interfaces/ReaderAndWriter';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IElementRegistry } from '../Interfaces/ElementRegistry';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ElementRole } from '../Interfaces/Types';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';

/**
 * A reader class that uses editors established by the ElementCollector, thus found in ElementRegistry.
 * Its "external data" is the actual ElementRegistry. 
 * Unlike many readers, it does not support the ValueAdapterService and rules found on FieldValueHostConfig.
 * It goes through FieldValueHosts, gets each EditorAdapterDefinition, and executes its sendValue() method,
 * much like event handlers do when responding to events.
 */
export class EditorReader extends ReaderBase<IElementRegistry>
{

    /**
     * Creates an instance of the EditorReader.
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param options - The reader options.
     */
    constructor(valueHostsManager: IValueHostsManager, options?: ReaderOptions)
    {
        super(valueHostsManager, valueHostsManager.services.domServices.getElementRegistry(valueHostsManager), options);
    }

    protected readOne(destination: IFieldValueHost): boolean
    {
        let elements = this.externalData.getElementsByRole(ElementRole.editor, destination.getElementIdentifier());
        if (elements.length === 0)
        {
            this.logger.message(LoggingLevel.Warn, ()=> `No editor elements found for element identifier: '${destination.getElementIdentifier()}'`);
            return false;
        }
        // even if there are multiple editor elements, we only consider the first one for reading because we can only use a single value
        let jivsElement = elements[0];
        let editorAdapterDefinition = jivsElement.jivsEditorAdapterDefinition;
        if (!editorAdapterDefinition)
        {
            this.logger.message(LoggingLevel.Warn, ()=> `No editor adapter definition found for element identifier: '${destination.getElementIdentifier()}'`);
            return false;
        }
        let editor = editorAdapterDefinition.identifyEditor(destination, jivsElement);
        editorAdapterDefinition.sendValue(destination, editor, jivsElement, false, false); // note: validation is handled by read() once all values are sent
        return true;
    }    
}    