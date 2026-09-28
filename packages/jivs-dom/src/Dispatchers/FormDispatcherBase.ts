/**
 * Abstract base class for FormDispatchers.
 * 
 * @module jivs-dom/Dispatchers/AbstractClasses/FormDispatcherBase
 */

import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { DispatcherBase } from './DispatcherBase';

/**
 * Abstract base class for FormDispatchers.
 * 
 * FormDispatchers invoke all Form adapters and presenters associated with a ValueHostsManager.
 * 
 * The class needs to gather relevant form-level elements.
 * In particular, they are associated with roles of 'summary' and 'submit'.
 * 
 * For example, FormPresenters will be attached to the Validation Summary widget.
 * That element's IJivsDomElement.jivsFormPresenter property will hold the attached FormPresenter instance.
 * 
 * Uses the ElementRegistry to locate and manage the relevant DOM elements for each form-level component.
 */
export abstract class FormDispatcherBase extends DispatcherBase
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }

    /**
     * Utility to enumerate relevant elements of a given ValueHostsManager and perform an operation on each.
     * A relevant member is determined by the `findElements` method implemented by the subclass.
     * Always limits its search to a root element determined by ValueHostsManager's Container Identifier
     * or document.body if there is no Container Identifier.
     * 
     * @param valueHostsManager The value hosts manager associated with the relevant form-level elements.
     * @param operation The operation to perform on each element.
     */
    protected forEachElement(valueHostsManager: IValueHostsManager,
        operation: (element: IJivsDomElement) => void): HTMLElement | null
    {
        let root = this.domServices.resolveContainerElement(valueHostsManager);
        const elements = this.findElements(root, valueHostsManager);

        for (const element of elements)
        {
            try
            {
                operation(element);
            }
            catch (error)
            {
                this.log(LoggingLevel.Error,
                    `Error processing element '{element}': ${(error as Error).message}`,
                    element as HTMLElement, null);
                // continue processing the remaining elements despite the error
            }
        }
        return root;
    }

    /**
     * Uses the ElementRegistry to locate all relevant DOM elements for the given ValueHostsManager.
     * @param root 
     * @param valueHostsManager 
     */
    protected findElements(root: HTMLElement, valueHostsManager: IValueHostsManager): Iterable<IJivsDomElement>
    {
        throw new Error('Not implemented');
    }
}