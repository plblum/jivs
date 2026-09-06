/**
 * @module jivs-engine/Services/ConcreteClasses/MessageTokenResolverService
 */

import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { MessageTokenResolverService } from './MessageTokenResolverService';

/**
 * This version of `MessageTokenResolverService` HTML-encodes replacement values to prevent XSS.
 * It is required when the client is a browser environment to ensure that any user input echoed in error messages is safely encoded.
 * 
 * It is automatically selected within the createJivsServices() function unless you expressly use createJivsServices('isocode', 'server');
 * 
 * Error messages contain tokens, some of which can echo back user input. For example, "You entered {value}." 
 * Because these token values may originate from untrusted user input, 
 * they must be HTML-encoded before being inserted into the final message to prevent XSS.
 */
export class HtmlMessageTokenResolverService
    extends MessageTokenResolverService
{

    /**
     * Finalizes one message-token replacement as safe HTML.
     *
     * @see [Protect Error Messages from XSS](docs/Learning_Jivs/Home.md#protect-error-messages-from-xss)
     */
    protected override finalizeReplacement(
        replacement: string,
        tav: TokenLabelAndValue
    ): string
    {
        const encodedValue =
            encodeHtml(replacement);

        const purposeClass =
            tav.purpose
                ? ` ${ tav.purpose }`
                : '';

        return (
            `<span class="token${ purposeClass }">` +
            encodedValue +
            '</span>'
        );
    }
}

/**
 * Basic HTML encoding function to prevent XSS.
 * @param value 
 * @returns 
 */
export function encodeHtml(
    value: string
): string
{
    const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return value.replace(
        /[&<>"']/g,
        character => entities[character]
    );
}
