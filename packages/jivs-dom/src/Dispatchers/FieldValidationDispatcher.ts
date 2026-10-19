/**
 * Field validation dispatcher implementation for handling field validation updates in the DOM.
 * 
 * @module jivs-dom/Dispatchers/ConcreteClasses/FieldValidationDispatcher
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { IFieldValidationDispatcher } from '../Interfaces/Dispatchers';
import type { IJivsElement } from '../Interfaces/IJivsElement';
import { FieldDispatcherBase } from './FieldDispatcherBase';


/**
 * @inheritdoc jivs-dom/Types/Dispatchers!IFieldValidationDispatcher
 */
export class FieldValidationDispatcher extends FieldDispatcherBase 
    implements IFieldValidationDispatcher
{
    /**
     * ValueHostsManager.onValueHostValidationStateChanged callback invokes this method 
     * when the validation state of the field changes.
     * It targets all field elements returned by the associated ElementRegistry.
     * Executes an operation that retrieves IJivsElement.jivsFieldPresentation 
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
            this.domServices.ariaService?.applyValidationState(
                element, valueHost, state);
        });
    }

    protected override findElements(root: HTMLElement, valueHost: IFieldValueHost): Iterable<IJivsElement>
    {
        return this.domServices.getElementRegistry(valueHost.valueHostsManager)
            .getFieldPresentationElements(valueHost.getElementIdentifier());
    }
}