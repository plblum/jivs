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

    public constructor(element: TElement)
    {
        assertNotNull(element, 'element');
        this._element = element;
    }

    /**
     * The DOM element that this adapter is associated with.
     * The element has a IJivsDomElement shape, available with the JivsElement wrapper.
     */
    protected get element(): TElement
    {
        return this._element;
    }
    private readonly _element: TElement = this.element;

    protected get jivsElement(): IJivsDomElement
    {
        return this._element as IJivsDomElement;
    }
}