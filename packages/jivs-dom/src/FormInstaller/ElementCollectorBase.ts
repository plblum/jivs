/**
 * Base class for element collectors that provides a common interface for collecting elements from the DOM.
 * 
 * @module jivs-dom/FormInstaller/AbstractClasses/ElementCollector
 */
import { IElementCollector } from '../Interfaces/ElementCollector';
import { IElementRegistry } from '../Interfaces/ElementRegistry';

/**
 * @inheritdoc jivs-dom/Types/ElementCollector!IElementCollector
 */
export abstract class ElementCollectorBase implements IElementCollector
{
    /**
     * Collects elements from the specified root element and registers them with the provided element registry.
     * 
     * Something like this:
     * ```ts
     * public collect(root: HTMLElement, registry: IElementRegistry): void {
     * // Editor element <input type='text' name='fieldName'>
     *     let element = root.querySelector('input[type="text"][name="fieldName"]');
     *     if (element) {
     *         registry.addEditor(element, 'fieldName');
     *     }
     * // Label element <label for='fieldName'>
     *     element = root.querySelector('label[for="fieldName"]');
     *     if (element) {
     *         registry.addField(element, 'fieldName', ElementRole.label);
     *     }
     * // Error display element <div class='errorDisplay' data-field='fieldName'>
     *     element= root.querySelector('div.errorDisplay[data-field="fieldName"]');
     *     if (element) {
     *         registry.addField(element, 'fieldName', ElementRole.error);
     *     }
     * }
     * ```
     * 
     * @param root The root element from which to start collecting elements.
     * @param registry The element registry where collected elements should be registered.
     */
    public abstract collect(root: HTMLElement, registry: IElementRegistry): void;
}