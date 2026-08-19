# Jivs Presentation Prerequisites

Before choosing how Jivs validation should appear in the client, prepare two behaviors that apply to every validation presentation:

- disable native browser validation so it does not compete with Jivs
- protect Error Messages from XSS attacks

These requirements apply whether the application uses Jivs SimpleDom, a framework-specific Jivs integration, or another UI architecture.

## Disable Native Browser Validation

Browsers provide their own form validation for attributes such as `required`, input types, and other constraints.

When Jivs is responsible for validation, disable native browser form validation so browser-generated validation behavior does not compete with Jivs.

Use `novalidate` on the form:

```html
<form id="person-form" novalidate>
    ...
</form>
```

The examples in the Jivs Presentation Learning Guide use `novalidate`.

Also avoid depending on native validation attributes such as `required` to define Jivs validation rules. Jivs validation state should remain the source used by the validation UI.

## Protect Error Messages from XSS

Error messages contain tokens, some of which can echo back user input. For example, "You entered {value}." Because these token values may originate from untrusted user input, they must be HTML-encoded before being inserted into the final message to prevent XSS.

The default `MessageTokenResolverService` does not encode replacement values. The implementation below is available in the companion [`jivs-simpledom.ts`](../../starter_code/jivs-simpledom.ts) file. You can use it from that file instead of copying it from this section.

```ts
export function encodeHtml(
    value: string
): string {
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

export class HtmlMessageTokenResolverService
    extends MessageTokenResolverService {

    protected override finalizeReplacement(
        replacement: string,
        tav: TokenLabelAndValue
    ): string {
        const encodedValue =
            encodeHtml(replacement);

        const purposeClass =
            tav.purpose
                ? ` ${tav.purpose}`
                : '';

        return (
            `<span class="token${purposeClass}">` +
            encodedValue +
            '</span>'
        );
    }
}
```

The resulting markup identifies the replacement as a token and includes its purpose when supplied:

```html
<span class="token label">First name</span>
```

Install the subclass on the `JivsServices` instance before creating the `ValueHostsManager`:

```ts
const services =
    createJivsServices('en-US');

services.messageTokenResolverService =
    new HtmlMessageTokenResolverService();
```

All user-controlled data included in an Error Message should be supplied through message tokens so this service can encode it.

---

Continue to the next section of the Jivs Presentation Learning Guide: [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md).

Return to [Learning Jivs TOC](./Learning_Jivs_Home.md).