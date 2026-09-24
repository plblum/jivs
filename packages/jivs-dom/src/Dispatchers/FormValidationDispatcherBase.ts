/**
 * Abstract base class for form validation dispatchers in the DOM.
 * 
 * Subclasses are expected to implement the `findElements` method to locate 
 * the relevant DOM elements for a given form.
 * 
 * @module jivs-dom/Dispatchers/AbstractClasses/FormValidationDispatcherBase
 */
import type { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IFormValidationDispatcher } from '../Interfaces/Dispatchers';
import { FormDispatcherBase } from './FormDispatcherBase';


/**
 * @inheritdoc jivs-dom/Types/Dispatchers!IFormValidationDispatcher
 * 
 * Requires a concrete implementation of the `findElements` method to locate all relevant DOM elements 
 * for the given form.
 */
export abstract class FormValidationDispatcherBase extends FormDispatcherBase 
    implements IFormValidationDispatcher
{
    /**
     * Form.onValidationStateChanged callback invokes this method 
     * when the validation state of the form changes.
     * It targets all elements returned by findElements(), which is supplied by subclassing.
     * Executes an operation that retrieves IJivsDomElement.jivsFormPresentation 
     * and calls its apply function. If none is attached, the operation is skipped.
     * @param valueHostsManager - from onValidationStateChanged callback. findElements must limit 
     * the scope of elements to those relevant for this form.
     * @param state - from onValidationStateChanged callback. Contains the 
     * main data to evaluate.
     */
    public dispatch(valueHostsManager: IValueHostsManager, state: ValidationState): void
    {
        this.forEachElement(valueHostsManager, (element) => {
            const adapter = element.jivsFormPresentation;
            if (adapter) {
                adapter.apply(valueHostsManager, state);
            }
        });
    }
}