/**
 * Abstract base class for text value dispatchers in the DOM.
  * 
 * Subclasses are expected to implement the `findElements` method to locate 
 * the relevant DOM elements for a given field value host.
 * 
 * @module jivs-dom/Dispatchers/AbstractClasses/FieldValidationDispatcherBase
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IFieldValidationDispatcher } from '../Interfaces/Dispatchers';
import { FieldDispatcherBase } from './FieldDispatcherBase';


/**
 * @inheritdoc jivs-dom/Types/Dispatchers!IFieldValidationDispatcher
 * 
 * Requires a concrete implementation of the `findElements` method to locate all relevant DOM elements 
 * for the given field value host.
 */
export abstract class FieldValidationDispatcherBase extends FieldDispatcherBase 
    implements IFieldValidationDispatcher
{
    /**
     * ValueHostsManager.onValueHostValidationStateChanged callback invokes this method 
     * when the validation state of the field changes.
     * It targets all elements returned by findElements(), which is supplied by subclassing.
     * Executes an operation that retrieves IJivsDomElement.jivsFieldPresentation 
     * and calls its apply function. If none is attached, the operation is skipped.
     * 
     * Additionally, it updates aria attributes if the ariaService is available.
     * @param valueHost - from onValueHostValidationStateChanged callback. findElements must limit 
     * the scope of elements to those relevant for this value host.
     * @param state - from onValueHostValidationStateChanged callback. Contains the main data to evaluate.
     */
    public dispatch(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        this.forEachElement(valueHost, (element) => {
            const adapter = element.jivsFieldPresentation;
            if (adapter) {
                adapter.apply(valueHost, state);
            }
        });
        let root = this.domServices.resolveContainerElement(valueHost.valueHostsManager);
        this.domServices.ariaService?.applyValidationState(root, valueHost, state);
    }
}