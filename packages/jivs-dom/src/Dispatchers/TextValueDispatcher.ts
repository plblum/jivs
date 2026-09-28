/**
 * Implementation for text value dispatchers.
 * 
 * @module jivs-dom/Dispatchers/ConcreteClasses/TextValueDispatcher
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ITextValueDispatcher } from '../Interfaces/Dispatchers';
import { FieldDispatcherBase } from './FieldDispatcherBase';
    

/**
 * @inheritdoc jivs-dom/Types/Dispatchers!ITextValueDispatcher
 */
export class TextValueDispatcher extends FieldDispatcherBase 
    implements ITextValueDispatcher
{
    /**
     * ValueHostsManager.onTextValueChanged callback invokes this method 
     * when the text value of the field changes.
     * It targets all elements returned by findElements().
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