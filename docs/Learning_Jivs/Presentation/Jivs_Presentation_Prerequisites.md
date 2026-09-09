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

We supply a service to handle those tokens. Within the `createJivsServices()` function of your `create_JivsServices.ts` file, we install its HTML oriented version, HtmlMessageTokenResolverService, to encode any user input.

Double-check this is setup in your `createJivsServices()` function:
```ts
// --- MessageTokenResolverService ----------------------
vs.messageTokenResolverService = usage === 'server' ?
    new MessageTokenResolverService() :
    new HtmlMessageTokenResolverService();  // always use in HTML environments to prevent XSS
```

---

Continue to the next section of the Jivs Presentation Learning Guide: [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md).

Return to [Learning Jivs TOC](../Home.md).