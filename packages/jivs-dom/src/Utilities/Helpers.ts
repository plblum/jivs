/**
 * Converts html to plain text.
 */
export function htmlToText(html: string): string
{
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.textContent ?? '';
}

/**
 * Escapes text so it is safe to place in a CSS selector as an identifier or inside a quoted attribute value.
 * Uses CSS.escape when the environment has it, and otherwise (such as jsdom) applies the same rules.
 */
export function escapeCssIdentifier(value: string): string
{
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function')
        return CSS.escape(value);

    let result = '';
    for (let i = 0; i < value.length; i++)
    {
        const char = value[i];
        const code = value.charCodeAt(i);
        if (code === 0)
            result += '\uFFFD';
        else if ((code >= 0x1 && code <= 0x1f) || code === 0x7f ||
            (i === 0 && code >= 0x30 && code <= 0x39) ||
            (i === 1 && code >= 0x30 && code <= 0x39 && value[0] === '-'))
            result += `\\${ code.toString(16) } `;
        else if (i === 0 && char === '-' && value.length === 1)
            result += '\\-';
        else if (code >= 0x80 || /[A-Za-z0-9_-]/.test(char))
            result += char;
        else
            result += `\\${ char }`;
    }
    return result;
}

/**
 * Resolves a field-specific selector within the form container, then the document body.
 * The {FieldName} token is escaped before it is substituted into the selector.
 */
export function resolveElementBySelector(
    selector: string,
    fieldName: string,
    containerElement: HTMLElement
): HTMLElement | null
{
    const resolvedSelector = selector.split('{FieldName}').join(escapeCssIdentifier(fieldName));
    let element = containerElement.querySelector(resolvedSelector);
    if (element instanceof HTMLElement)
        return element;

    if (containerElement !== document.body)
    {
        element = document.body.querySelector(resolvedSelector);
        if (element instanceof HTMLElement)
            return element;
    }

    return null;
}

/**
 * Provides a way to show an error involving an element to the user.
 * Lets the user have enough info to connect this string to content in the page.
 * Shows the tag and all attributes including class, but not the content or closing tag.
 * Always orders attributes with ID, then class, then the rest.
 * @param element 
 */
export function revealElementToUser(element: HTMLElement): string
{
    let forUser = `<${ element.tagName.toLowerCase()}`;
    const attrs = Array.from(element.attributes);
    attrs.sort((a, b) => {
        if (a.name === 'id') return -1;
        if (b.name === 'id') return 1;
        if (a.name === 'class') return -1;
        if (b.name === 'class') return 1;
        return 0;
    });
    for (const attr of attrs) {
        forUser += ` ${ attr.name }="${ attr.value }"`;
    }
    forUser += '>';
    return forUser;
}