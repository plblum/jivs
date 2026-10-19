/**
 * Shared helpers for jivs-dom tests that build DOM elements.
 */

/**
 * Creates a detached element with the attributes supplied.
 * It is not attached to the document. Attach it to document.body in tests that depend on
 * focus, document-level event bubbling, or document.getElementById().
 * @param tagName - Defaults to 'input'.
 * @param attributes - Name/value pairs applied with setAttribute. An empty string is
 * assigned as an empty attribute value.
 */
export function createElement<K extends keyof HTMLElementTagNameMap = 'input'>(
    attributes: Record<string, string> = {},
    tagName: K = 'input' as K): HTMLElementTagNameMap[K]
{
    let element = document.createElement(tagName);
    for (let name in attributes)
        element.setAttribute(name, attributes[name]);
    return element;
}
