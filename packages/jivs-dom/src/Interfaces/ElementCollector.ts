/**
 * Defines the interface for an element collector, which is responsible for collecting elements
 * from the DOM and registering them with an element registry.
 * 
 * @module jivs-dom/Types/ElementCollector
 */

import { IElementRegistry } from './ElementRegistry';

/**
 * Represents an object that can collect elements from the DOM and register them with an element registry.
 * 
 * The web developer must have one implementation of this interface to collect elements from the DOM.
 * When using jivs-simpledom, it is the SimpleDomElementCollector implementation from that module.
 * 
 * Otherwise, they must take one of these approaches:
 * - Define a way to build a "screen scrape" that will find those elements through their
 *   attributes and types. They must be able to determined:
 *   1. Role - see ElementRole type
 *   2. Element Identifier - the field name and it must match the Element Identifier assigned 
 *      to the FieldValueHost. Only used with field elements, not form elements.
 *   3. Optional values for the options parameter on Element Registry records:
 *      - Adapter Key - Specific to editors. Optionally provide the key of the Adapter Definition
 *        when the registered adapter definitions cannot recognize the element in their match function,
 *        or when an override is needed.
 *      - DuringEdit - Specific to editors. Flag indicating it should support validation as the user types.
 *      - Presentation name - optionally provide the name of the presentation associated with the element.
 * - Implement one for each form, overriding the collect method to add all elements into the registry.
 * 
 * This is used together with ElementRegistry like this:
 * ```ts
 * const collector: IElementCollector = new SimpleDomElementCollector();
 * const registry: IElementRegistry = new ElementRegistry();
 * collector.collect(document.body, registry);
 * ```
 * The FormInstaller automatically supplies the Element Registry, identifies the root element 
 * from the ValueHostsManager, and calls the collect() method.
 * ```ts
 * const collector = new MyElementCollector();
 * const installer = new FormInstaller(valueHostsManager, collector);
 * installer.install();
 * ```
 */
export interface IElementCollector
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
    collect(root: HTMLElement, registry: IElementRegistry): void;
}