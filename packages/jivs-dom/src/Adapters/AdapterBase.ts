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

    public constructor(element: TElement, jivsElement: IJivsDomElement | null)
    {
        assertNotNull(element, 'element');
        this._element = element;
        this._jivsElement = jivsElement ?? (element as IJivsDomElement);
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
     * The element containing the Jivs-specific DOM element wrapper.
     * It is often the same as the element itself.
     */
    protected get jivsElement(): IJivsDomElement
    {
        return this._jivsElement;
    }
    private readonly _jivsElement: IJivsDomElement;
}