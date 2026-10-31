/**
 * Transfers values from editors to FieldValueHosts.
 * 
 * @module jivs-dom/Editors/ConcreteClasses/EditorReader
 */

import { ReaderBase } from '@plblum/jivs-engine/build/ReaderWriter/ReaderBase';
import { ReaderOptions } from '@plblum/jivs-engine/build/Interfaces/ReaderAndWriter';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IElementRegistry } from '../Interfaces/ElementRegistry';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ElementRole } from '../Interfaces/Types';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { FieldValueHostSetValueOptions } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * Transfers values from editors to FieldValueHosts after the DOM has changed
 * while the ValueHostsManager survived. Typical cases are the page replacing some elements
 * through FormInstaller, or the initial load, where the editors hold the server's values.
 *
 * It uses editors established by the ElementCollector, thus found in ElementRegistry.
 * Its "external data" is the actual ElementRegistry.
 * Unlike many readers, it does not use the ValueAdapterService or rules on FieldValueHostConfig.
 * For each FieldValueHost it takes the first editor element, gets its EditorAdapterDefinition,
 * and calls sendValue(), much like event handlers do when responding to events.
 * A field with no editor element, or whose element has no EditorAdapterDefinition, is skipped
 * with a warning in the logger.
 *
 * read() does this:
 * - Each editor's text is sent with setTextValue using the options below.
 * - A field whose text is unchanged is skipped (skipIfUnchanged). It keeps its value, validation state
 *   and issues. Becoming enabled counts as a change.
 * - A field whose text changed is reset to NotAttempted (reset), because its prior validation no longer
 *   describes the new value.
 * - Then preliminary validation runs (ReaderOptions.preliminaryValidation, default true).
 *   It only considers fields that are NotAttempted or NeedsValidation, so it
 *   validates the reset fields and leaves skipped fields alone.
 * It does not call broadcastState. Presentation is updated only for fields that
 * validation changed.
 *
 * When only some editors were replaced, use ReaderOptions.filter = onlyReplacedEditors.
 * It limits the transfer to editors installed in the latest FormInstaller pass,
 * leaving the other FieldValueHosts alone.
 *
 * When the server regenerated the whole page and the ValueHostsManager was rebuilt from
 * config.capturedState, use ServerPageValuesReader instead. It adds the broadcast
 * that draws the restored state.
 *
 * Options sent to FieldValueHost.setTextValue:
 * - skipIfUnchanged = true
 * - skipValueChangedCallback = true
 * - disableFormatter = true (we may change this to allow reformatTextValue. TBD)
 * - validate = false (validation is done once by read(), after all values are sent)
 * - reset = true (has no effect on skipped fields)
 */
export class EditorReader extends ReaderBase<IElementRegistry>
{
    /**
     * Creates an instance of the EditorReader.
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param options - The reader options.
     * When the DOM is changed, we recommend using options.filter = onlyReplacedEditors to limit the transfer to newly installed editors.
     */
    constructor(valueHostsManager: IValueHostsManager, options?: ReaderOptions)
    {
        super(valueHostsManager, valueHostsManager.services.domServices.getElementRegistry(valueHostsManager), options);
    }

    protected readOne(destination: IFieldValueHost): boolean
    {
        let elementId = destination.getElementIdentifier();
        let elements = this.externalData.getElementsByRole(ElementRole.editor, elementId);
        if (elements.length === 0)
        {
            if (destination.isEnabled())
                this.logger.message(LoggingLevel.Warn, () => `No editor elements found for element identifier: '${ elementId}'`);
            return false;
        }
        // even if there are multiple editor elements, we only consider the first one for reading because we can only use a single value
        let jivsElement = elements[0];
        let editorAdapterDefinition = jivsElement.jivsEditorAdapterDefinition;
        if (!editorAdapterDefinition)
        {
            this.logger.message(LoggingLevel.Warn, () => `No editor adapter definition found for element identifier: '${ elementId}'`);
            return false;
        }
        let editor = editorAdapterDefinition.identifyEditor(destination, jivsElement);
        editorAdapterDefinition.sendValue(destination, editor, jivsElement, this.getSetValueOptions());
        return true;
    }    
    protected override getSetValueOptions(): FieldValueHostSetValueOptions
    {
        return {
            skipValueChangedCallback: true,
            disableFormatter: true,
            validate: false, // note: validation is handled by read() once all values are sent
            skipIfUnchanged: true,
            reset: true // will not impact skipped fields
        };
    }
}    