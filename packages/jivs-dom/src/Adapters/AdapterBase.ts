/**
 * Base class for any adapter
 * 
 * @module jivs-dom/Adapters/AbstractClasses/AdapterBase
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';

/**
 * Base class for any adapter. 
 * 
 * This class ensures that the element is exposed to the derived adapter classes and can be safely accessed.
 */
export abstract class AdapterBase<TElement extends HTMLElement = HTMLElement>
{

    /**
     * Initializes a new instance of the adapter with the specified DOM element and its associated IJivsDomElement wrapper.
     * @param element The DOM element that this adapter is associated with.
     * @param anchor The element containing the IJivsDomElement wrapper.
     * It is often the same as the element itself.
     */
    public constructor(element: TElement, anchor: IJivsDomElement | null)
    {
        assertNotNull(element, 'element');
        this._element = element;
        this._anchor = anchor ?? (element as IJivsDomElement);
    }

    /**
     * The DOM element that this adapter is associated with.
     * HTML operations are usually performed directly on this element.
     */
    protected get element(): TElement
    {
        return this._element;
    }
    private _element: TElement;

    /**
     * The element containing the IJivsDomElement wrapper.
     * It is often the same as the element itself.
     */
    protected get anchor(): IJivsDomElement
    {
        return this._anchor;
    }
    private _anchor: IJivsDomElement;

    /**
     * Allows for release of resources and nulling properties to facilitate garbage collection.
     * WARNING: Currently (v0.22) nothing calls this.
     * Each Adapter class is on IJivsDomElement which means its properties are directly on HTMLElement.
     * If it was easy to get an event upon detachment of the element from the DOM, this method could be called to release adapters automatically.
     * Fortunately, dispose is mostly to speed up garbage collection.
     */
    public dispose(): void
    {
        this._element = undefined as any;
        this._anchor = undefined as any;
    }    
}