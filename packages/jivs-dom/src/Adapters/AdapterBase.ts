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
    private readonly _element: TElement;

    /**
     * The element containing the IJivsDomElement wrapper.
     * It is often the same as the element itself.
     */
    protected get anchor(): IJivsDomElement
    {
        return this._anchor;
    }
    private readonly _anchor: IJivsDomElement;
}