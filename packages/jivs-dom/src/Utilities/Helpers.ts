/**
 * Converts html to plain text.
 */
export function htmlToText(html: string): string
{
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.textContent ?? '';
}