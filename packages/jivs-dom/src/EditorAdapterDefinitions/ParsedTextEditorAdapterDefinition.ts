/**
 * Provides an abstract base class for editor adapters that parse text input into native values before sending them to the value host.
 * 
 * This class is intended to be subclassed by concrete implementations that define specific parsing logic.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/AbstractClasses/ParsedTextEditorAdapterDefinition
 */

import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { InjectedError } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { EditorAdapterDefinitionBase } from './EditorAdapterDefinitionBase';

/**
 * Supports Applications that parse editor text into its native value prior to
 * calling FieldValueHost.setValues().
 * The parser is part of the work setup by the attachToSendValuesCore work.
 * The user must build and register concrete implementations of EditorAdapterDefinitionBase
 * to cover each parser.
 * 
 * Use this to get started by building your parser within the parseTextValue method.
 * 
 * Your attachToSendValuesCore implementation can make use of the 
 * sendParsedTextValue utility function fully realize the parsing and sending process.
* ```ts
* let self = this;
* element.addEventListener('change', () => {
*     self.sendParsedTextValue(valueHost, anchor, false);
* });
* ```
 */
export abstract class ParsedTextEditorAdapterDefinition
    extends EditorAdapterDefinitionBase
{

    /**
     * Implement your parser here. It should take in the text value,
     * and attempt to convert it to the native value.
     * There are two outcomes: either a native value is successfully parsed, or an error occurs.
     * The result provides for both, where the error should be wrapped in an InjectedError object
     * which provides more guidance to Jivs than just an error message.
     * @param textValue - The text value to be parsed.
     * @param valueHost - The value host that will receive the parsed native value.
     * @param anchor - The DOM element associated with the value host.
     * @returns An object containing the parsed native value or an injected error if parsing failed.
     * Assign one of the properties to undefined depending on the outcome of the parsing.
     */
    protected abstract parseTextValue(textValue: string | undefined,
        valueHost: IFieldValueHost, anchor: IJivsDomElement):
            {
                nativeValue: unknown | undefined;
                injectedError?: InjectedError;
            };

    /**
     * Utility function to use when implementing attachToSendValuesCore.
     * Wire up the event listener to trigger this function.
     * ```ts
     * let self = this;
     * element.addEventListener('change', () => {
     *     self.sendParsedTextValue(valueHost, anchor, false);
     * });
     * ```
     * @param valueHost - The value host that will receive the parsed native value.
     * @param anchor - The DOM element associated with the value host.
     * @param duringEdit - Indicates if the value is being sent during an edit operation.
     * @returns void
     */
    protected sendParsedTextValue(valueHost: IFieldValueHost,
        anchor: IJivsDomElement, duringEdit?: boolean): void
    {
        if (!anchor.jivsTextValueAdapter)
        {
            this.logMessage(
                LoggingLevel.Warn,
                `No TextValueAdapter found on the element '{element}' associated with ValueHost '{valuehost}'.`,
                anchor as HTMLElement,
                valueHost
            );
            return;
        }
        let textValue = anchor.jivsTextValueAdapter.readTextValue();
        let result = this.parseTextValue(textValue, valueHost, anchor);

        valueHost.setValues(result.nativeValue, textValue, { 
            validate: true,
            duringEdit: duringEdit,
            injectedError: result.injectedError,
        });
    }
}