/**
 * Implementation for form validation dispatchers.
 * 
 * @module jivs-dom/Dispatchers/ConcreteClasses/FormValidationDispatcher
 */
import type { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IFormValidationDispatcher } from '../Interfaces/Dispatchers';
import { FormDispatcherBase } from './FormDispatcherBase';

/**
 * @inheritdoc jivs-dom/Types/Dispatchers!IFormValidationDispatcher
 */
export class FormValidationDispatcher extends FormDispatcherBase 
    implements IFormValidationDispatcher
{
    /**
     * Form.onValidationStateChanged callback invokes this method 
     * when the validation state of the form changes.
     * It targets all elements returned by findElements().
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