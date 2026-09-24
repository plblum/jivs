/**
 * Abstract base class for FieldDispatchers.
 * 
 * @module jivs-dom/Dispatchers/AbstractClasses/FieldDispatcherBase
 */

import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { DispatcherBase } from './DispatcherBase';

/**
 * Abstract base class for FieldDispatchers.
 * 
 * FieldDispatchers invoke all Field adapters and presenters associated with a specific field value host.
 * The ValueHostsManager callbacks are expected to provide the FieldValueHost involved.
 * 
 * The class needs to gather relevant elements associated with that specific field value host
 * typically for these roles: 'editor', 'label', 'error', 'aria-error', and 'container'.
 * 
 * For example, TextValueAdapters will be attached to the editor element associated 
 * with the field value host.
 * That element's IJivsDomElement.jivsTextValueAdapter property will hold 
 * the attached TextValueAdapter instance.
 * 
 * Concrete subclasses implement the `findElements` method to locate those elements in the DOM.
 */
export abstract class FieldDispatcherBase extends DispatcherBase
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
    }

    /**
     * Utility to enumerate relevant elements of a given field value host and perform an operation on each.
     * A relevant member is determined by the `findElements` method implemented by the subclass.
     * Always limits its search to a root element determined by ValueHostsManager's Container Identifier
     * or document.body if there is no Container Identifier.
     * 
     * @param valueHost The field value host whose elements are to be enumerated.
     * @param operation The operation to perform on each element.
     */
    protected forEachElement(valueHost: IFieldValueHost,
        operation: (element: IJivsDomElement) => void): HTMLElement | null
    {
        let root = this.domServices.resolveContainerElement(valueHost.valueHostsManager);
        const elements = this.findElements(root, valueHost);

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
                    element as HTMLElement, valueHost);
                // continue processing the remaining elements despite the error
            }
        }
        return root;
    }

    /**
     * Concrete implementation uses this to gather all elements for the given field value host.
     * Implementations can take several forms:
     * - perform a "screen scrape" of the DOM to locate elements. jivs-simpledom uses this approach.
     * - use a pre-defined mapping of value hosts to elements if available.
     * @param root 
     * @param valueHost 
     */
    protected abstract findElements(root: HTMLElement, valueHost: IFieldValueHost): Iterable<IJivsDomElement>;
}