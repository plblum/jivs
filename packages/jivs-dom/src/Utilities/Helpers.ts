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