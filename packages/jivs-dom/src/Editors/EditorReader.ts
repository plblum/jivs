import { ReaderBase } from '@plblum/jivs-engine/build/ReaderWriter/ReaderBase';
import { ReaderOptions } from '@plblum/jivs-engine/build/Interfaces/ReaderAndWriter';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IElementRegistry } from '../Interfaces/ElementRegistry';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ElementRole } from '../Interfaces/Types';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { FieldValueHostSetValueOptions } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * A reader class that uses editors established by the ElementCollector, thus found in ElementRegistry.
 * Its "external data" is the actual ElementRegistry. 
 * Unlike many readers, it does not support the ValueAdapterService and rules found on FieldValueHostConfig.
 * It goes through FieldValueHosts, gets each EditorAdapterDefinition, and executes its sendValue() method,
 * much like event handlers do when responding to events.
 * 
 * By design, will use these FieldValueHostSetValueOptions:
 * - skipIfChanged = true
 * - skipValueChangedCallback = true
 * - disableFormatter = true (but we may change this to allow for reformatTextValue. TDB)
 * - validate = false
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
        editorAdapterDefinition.sendValue(destination, editor, jivsElement, this.getSetValueOptions());
        return true;
    }    
    protected getSetValueOptions(): FieldValueHostSetValueOptions
    {
        return {
            skipValueChangedCallback: true,
            disableFormatter: true,
            validate: false, // note: validation is handled by read() once all values are sent
            skipIfUnchanged: true
        };
    }
}    