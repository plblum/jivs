import { ElementRole } from '../Interfaces/Types';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { WriterBase } from '@plblum/jivs-engine/build/ReaderWriter/WriterBase';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IElementRegistry } from '../Interfaces/ElementRegistry';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { WriterOptions } from '@plblum/jivs-engine/build/Interfaces/ReaderAndWriter';
/**
 * Transfers the current values of the FieldValueHosts into the editors.
 * 
 * We recommend using options.filter = onlyReplacedEditors when you replace editors
 * that were previously initialized. It will ensure those editors that were replaced
 * have their values updated, while leaving the rest of the editors alone.
 */
export class EditorWriter<TOptions extends WriterOptions = WriterOptions>
    extends WriterBase<IElementRegistry, TOptions>
{

    constructor(valueHostsManager: IValueHostsManager, options?: TOptions)
    {
        super(valueHostsManager, valueHostsManager.services.domServices.getElementRegistry(valueHostsManager), options);
    }

    /**
     * Locates the destination editor in the IElementRegistry using IFieldValueHost.getElementIdentifier().
     * Uses its IJivsElement.jivsTextValueAdapter or jivsValueAdapter to transfer the value.
     * @param source 
     */
    protected override writeOne(source: IFieldValueHost): boolean
    {
        let elementId = source.getElementIdentifier();
        let elements = this.externalData.getElementsByRole(ElementRole.editor, elementId);
        if (elements.length === 0)
        {
            this.logger.message(LoggingLevel.Warn, () => `No editor elements found for element identifier: '${ elementId}'`);
            return false;
        }
        // even if there are multiple editor elements, we only consider the first one for writing because we can only use a single value
        let jivsElement = elements[0];

        if (jivsElement.jivsTextValueAdapter)
            jivsElement.jivsTextValueAdapter.writeTextValue(source.getTextValue());
        else if (jivsElement.jivsValueAdapter)
            jivsElement.jivsValueAdapter.writeValue(source.getValue());
        else
        {
            this.logger.message(LoggingLevel.Warn, () => `No value adapter found for element identifier: '${ elementId}'`);
            return false;
        }
        return true;
    }
}