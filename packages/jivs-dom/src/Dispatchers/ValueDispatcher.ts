/**
 * Implementation for native value dispatchers.
 * 
 * @module jivs-dom/Dispatchers/ConcreteClasses/ValueDispatcher
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IValueDispatcher } from '../Interfaces/Dispatchers';
import { FieldDispatcherBase } from './FieldDispatcherBase';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * @inheritdoc jivs-dom/Types/Dispatchers!IValueDispatcher
 */
export class ValueDispatcher extends FieldDispatcherBase 
    implements IValueDispatcher
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }
    /**
     * ValueHostsManager.onValueChanged callback invokes this method 
     * when the native value of the field changes.
     * It targets all elements returned by findElements().
     * Executes an operation that retrieves IJivsDomElement.jivsValueAdapter 
     * and calls its apply function. If none is attached, the operation is skipped.
     * @param valueHost - from onValueChanged callback. findElements must limit 
     * the scope of elements to those relevant for this value host.
     * @param oldValue - from onValueChanged callback. Its value is ignored.
     */
    public dispatch(valueHost: IFieldValueHost, oldValue: unknown): void
    {
        let newValue = valueHost.getValue();
        this.forEachElement(valueHost, (element) => {
            const adapter = element.jivsValueAdapter;
            if (adapter) {
                adapter.writeValue(newValue);
            }
        });
    }
}