/**
 * Abstract base class for text value dispatchers in the DOM.
  * 
 * Subclasses are expected to implement the `findElements` method to locate 
 * the relevant DOM elements for a given field value host.
 * 
 * @module jivs-dom/Dispatchers/AbstractClasses/TextValueDispatcherBase
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ITextValueDispatcher } from '../Interfaces/Dispatchers';
import { FieldDispatcherBase } from './FieldDispatcherBase';


/**
 * @inheritdoc jivs-dom/Types/Dispatchers!ITextValueDispatcher
 * 
 * Requires a concrete implementation of the `findElements` method to locate all relevant DOM elements 
 * for the given field value host.
 */
export abstract class TextValueDispatcherBase extends FieldDispatcherBase 
    implements ITextValueDispatcher
{
    /**
     * ValueHostsManager.onTextValueChanged callback invokes this method 
     * when the text value of the field changes.
     * It targets all elements returned by findElements(), which is supplied by subclassing.
     * Executes an operation that retrieves IJivsDomElement.jivsTextValueAdapter 
     * and calls its apply function. If none is attached, the operation is skipped.
     * @param valueHost - from onTextValueChanged callback. findElements must limit 
     * the scope of elements to those relevant for this value host.
     * @param oldTextValue - from onTextValueChanged callback. Its value is ignored.
     */
    public dispatch(valueHost: IFieldValueHost, oldTextValue: string | undefined): void
    {
        let newValue = valueHost.getTextValue();
        this.forEachElement(valueHost, (element) => {
            const adapter = element.jivsTextValueAdapter;
            if (adapter) {
                adapter.writeTextValue(newValue);
            }
        });
    }
}