# Building a Popup Mechanism for Jivs-DOM

*A guide for developers integrating a popup library or a custom popup implementation*

## 1. The problem this integration solves

Jivs is a validation library. Its DOM package, **Jivs-DOM**, connects validation results to HTML elements and displays messages to users. One presentation style shows validation messages **in a popup**, typically opened from a small indicator next to a field.

For example, imagine a registration form with an invalid email address. Jivs-DOM knows the field has a validation issue and can generate a message such as “Enter a valid email address.” A small error indicator appears by the field. Clicking it opens a popup containing that message. The user may dismiss the popup by clicking the indicator again, pressing Escape, clicking outside, or using other interactions supported by the popup implementation.

The challenge is that **Jivs-DOM should not be tied to a particular popup library**. An application might use a native browser popover, Tippy.js, a Bootstrap component, or its own popup framework. These systems create and position popups differently and have different ways of handling user interactions.

`IPopupMechanism` is the adapter interface that connects one of those popup technologies to Jivs-DOM. Implementing it lets Jivs-DOM use your popup technology without knowing its implementation details.

This guide assumes familiarity with TypeScript and browser DOM programming, **not** with Jivs-DOM's internal class hierarchy.

## 2. What Jivs-DOM already does—and what you build

Jivs-DOM has a **popup error-message presentation** associated with an HTML element (the *presentation element*, commonly the error indicator). It takes care of:

- Determining whether a field has validation issues and producing the HTML content of its error message.
- Installing triggers on the presentation element, including click-to-toggle and optionally mouseover/mouseout.
- Deciding when to request opening or closing, including configured delays.
- Tracking whether the presentation is opening, open, closing, or closed.
- Coordinating triggered displays associated with the same validation manager so another one can be closed before a new one opens.
- Updating its own CSS state classes, including `jivs-open` and `jivs-popup-open`.

**Your `IPopupMechanism` implements the actual popup.** It must:

- Create or initialize the popup using your chosen technology.
- Put the already-generated message element inside it.
- Position the popup relative to the designated HTML anchor.
- Make it visible, then hide or close it when requested.
- Notify Jivs-DOM when the popup closes for a reason *outside* Jivs-DOM's own close request.
- Release any DOM, event handlers, observers, or library objects it creates.

You **do not** create validation messages, inspect field validation rules, install the presentation's click trigger, or modify Jivs-DOM's validation state.

### Three separate elements

Understanding these elements prevents several integration mistakes:

| Element | Who supplies it? | What is it for? |
|---|---|---|
| **Presentation element** | Application / Jivs-DOM | The indicator or other element that users interact with to request the popup. Your mechanism usually does not manage it. |
| **Anchor element** | Jivs-DOM passes it to you | The HTML element used to *position* the popup. Often the presentation element, but it may be another editor or an element elsewhere on the page. |
| **Message-frame content** | Jivs-DOM passes it to you | An actual `HTMLElement` containing formatted validation messages. Insert this element into your popup. |

Your mechanism usually creates a **fourth element**: its own popup container or wrapper. That wrapper belongs to your implementation. It is *not* exposed by the shared interface.

## 3. How an opening happens

This is the sequence from your adapter's perspective:

```text
A field has validation issues
          │
          ▼
Jivs-DOM displays its error indicator
          │
          ▼
User clicks indicator (or another trigger fires)
          │
          ▼
Jivs-DOM asks the configured IPopupMechanism to create a context
          │
          ▼
Jivs-DOM supplies the positioning anchor and rendered message HTML
          │
          ▼
Jivs-DOM calls mechanism.open(context)
          │
          ▼
Your mechanism creates, positions, and displays the popup
          │
          ▼
Jivs-DOM tracks the successful open state
```

Closing can originate from either side:

1. **Jivs-DOM requests closure**, such as when the indicator is clicked again or another error popup is opened. It calls your `close(context)` method.
2. **Your popup library closes independently**, such as after Escape or clicking outside. You notify Jivs-DOM that closure *has already happened* by calling `context.controller?.closed()`.

That second direction is essential. Otherwise Jivs-DOM would think the popup remained open and could retain outdated CSS classes and resources.

When validation changes while a popup is open, Jivs-DOM closes and opens again with **freshly generated message HTML and a new popup context**. Your adapter does not need a special content-refresh operation.

## 4. The public interfaces

The relevant interfaces are exported by Jivs-DOM from its `PopupErrorMessageDisplays` interface module.

```ts
export interface IPopupMechanism {
    createContext(options?: object): IPopupContext;
    open(context: IPopupContext): boolean;
    close(context: IPopupContext): boolean;
    dispose(): void;
}

export interface IPopupContext {
    messageFrameContent: HTMLElement | null;
    anchorElement: HTMLElement | null;
    controller: IErrorMessageDisplayController | null;
    domServices: IJivsDomServices | null;
    dispose(): void;
}
```

Jivs-DOM also supplies `PopupContext`, a simple implementation of `IPopupContext` that starts those four properties at `null` and clears them in `dispose()`.

### Understanding the context

A **popup context** represents *one popup opening*, not the whole form and not the lifetime of the presentation. Your `createContext()` returns it; Jivs-DOM fills its shared properties and retains it until that popup closes.

| Property | What you can expect |
|---|---|
| `anchorElement` | The positioning target, set before `open()` |
| `messageFrameContent` | An HTML element already populated with validation messages, set before `open()` |
| `controller` | An object you can notify when your popup closes independently; it also supports `cancelDelayedClose()` |
| `domServices` | Jivs-DOM services, available if an integration needs them (for example, logging) |

The nullable types are intentional because these properties have not been filled when `createContext()` runs, and they are cleared during disposal. Your `open()` implementation may validate that the elements it requires are present.

There is **no `popupElement` property**. Keep your actual wrapper or vendor instance inside your own context subtype.

## 5. Choose a popup technology and define its options

First decide how you will build and control a popup. A positioning-only library will require more of your own DOM and interaction management; a complete popover component may supply most dismissal behavior.

Decide which behaviors your integration supports:

- Preferred placement and fallback when the popup would run off screen.
- Repositioning on scroll or resize, if applicable.
- Escape, outside click, close button, focus changes, or other dismissal mechanisms.
- Whether a user can move the pointer from the indicator to the popup and interact with its content.
- Any library-specific appearance or animation settings.

These are **your mechanism's options**, not universal Jivs-DOM settings. Define a TypeScript options interface appropriate to the technology. Applications pass those options through `popupOptions` on their popup presentation configuration.

No particular set of dismissal features is mandatory. Document the choices your implementation actually supports.

## 6. Implement a context for your popup library

The supplied `PopupContext` provides the shared fields. Extend it when you need to retain a vendor popup instance, wrapper, subscriptions, or positioning cleanup functions.

The following is illustrative, **not a complete popup implementation**:

```ts
import { PopupContext } from '@plblum/jivs-dom'; // use your installed package's actual export path

export interface MyPopupOptions {
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

export class MyPopupContext extends PopupContext {
    constructor(public readonly options: MyPopupOptions = {}) {
        super();
    }

    popupWrapper: HTMLElement | null = null;
    // Add vendor-specific popup instance, handler, or cleanup references here.

    override dispose(): void {
        // Destroy your popup instance and release any per-popup resources.
        // Avoid triggering a new Jivs-DOM closure notification during teardown.
        this.popupWrapper = null;
        super.dispose();
    }
}
```

**Resource ownership matters:** Jivs-DOM calls `context.dispose()` when the popup is finished. You implement the extra cleanup for your vendor-specific resources, but **do not call `context.dispose()` yourself in `open()` or `close()`**.

Base `PopupContext.dispose()` only clears references; it does not destroy a vendor popup or remove its wrapper from the document. Those are your responsibilities.

## 7. Implement the four IPopupMechanism methods

### `createContext(options?: object): IPopupContext`

Create a **fresh context for each opening** and store or normalize your mechanism's options.

```ts
createContext(options?: object): IPopupContext {
    return new MyPopupContext((options ?? {}) as MyPopupOptions);
}
```

Do not expect the anchor or message content to exist yet. Defer DOM-dependent initialization until `open()`.

The shared `IPopupMechanism` deliberately isn't generic. Your implementation can still publish a strongly typed options interface for consumers.

### `open(context: IPopupContext): boolean`

By the time this method is called, Jivs-DOM has populated the context. Your implementation should:

1. Obtain the positioning anchor and supplied content element.
2. Create or initialize a popup using your selected library.
3. **Insert the supplied `messageFrameContent` node** into the popup's content region. Do not reformat the messages or create independent replacements.
4. Position the popup relative to `anchorElement`.
5. Connect the popup-library events needed for independent dismissal and, optionally, pointer interaction.
6. Display the popup and return `true` on success.

The contract is synchronous. Return `false` if the popup cannot be opened. Catch errors from your own popup integration, remove partial popup resources, and return `false` instead of leaving a half-open popup behind.

Jivs-DOM subsequently handles the presentation's open-state classes and retains the context. You do not need to set those classes yourself.

### `close(context: IPopupContext): boolean`

Hide or close the **specific popup represented by that context**. Return `true` on success or `false` on failure; contain errors arising from your popup technology. Do not dispose the context. Jivs-DOM finishes its own close lifecycle and disposes the context after successful closure.

Your popup library may emit a closed event *inside* your `close()` call. It is acceptable for that callback to notify Jivs-DOM; its controller is designed to avoid duplicate close finalization. You don't need to inspect Jivs-DOM's internal state to distinguish programmatic closure from vendor closure.

If close fails, Jivs-DOM may retain the context for another attempt. Avoid prematurely destroying its resources when reporting failure.

### `dispose(): void`

This method runs when the configured mechanism service is disposed. Release shared library resources, global listeners, shared subscriptions, and any mechanism-owned resources left after failed closures.

It is required even if your implementation has no shared resources and the body is empty. It does **not** replace per-popup `context.dispose()` and should not require access to Jivs-DOM's popup coordination service.

## 8. The most important callback: when your library closes the popup

Popup libraries can dismiss themselves—for example, when the user presses Escape, clicks outside the popup, or uses a library-provided close control.

**After the popup has actually closed**, call:

```ts
context.controller?.closed();
```

This means “the popup is now closed,” **not** “please close it.” Do not instead call `controller.close(...)` from a library event that reports completed dismissal. That could request closing the popup a second time.

There is a critical lifetime rule: **after calling `controller.closed()`, do not access that context again**. The notification can immediately cause Jivs-DOM to dispose it, clearing the references your callback might otherwise try to use. This rule also applies if the library reports closure synchronously during `open()` or `close()`.

### Pointer movement between indicator and popup

Jivs-DOM can delay closing when the pointer leaves the indicator. If your mechanism allows the user to move into an interactive popup, the popup's pointer-entry behavior can call:

```ts
context.controller?.cancelDelayedClose();
```

That cancels the presentation's pending delayed close. Any later dismissal on leaving the popup is your integration's responsibility if you choose to support it. Popup-hover dismissal is optional.

The context's controller also coordinates the presentation's normal opening and closing; it is not a vendor-specific popup object.

## 9. How applications use your mechanism

A consuming application configures the implementation **once** on its Jivs-DOM services:

```ts
// Illustrative registration; adapt to the application's service setup.
domServices.popupMechanism = new MyPopupMechanism();
```

The application then registers or creates a `PopupErrorMessageDisplayPresentation<MyPopupOptions>` through Jivs-DOM's presentation factory, using an options object with a `popupOptions` property. The presentation may also specify an `anchorSelector` and mouseover/mouseout behavior. Those presentation-level settings are separate from your mechanism's placement and dismissal options.

The adapter receives one call to `createContext()` per actual popup opening. It may serve **many presentations** and **multiple validation managers** over its lifetime. It must not store the active popup in a single global field unless its design explicitly supports the consequences; keep per-opening vendor state on its context.

Jivs-DOM coordinates triggered presentations through a per-validation-manager popup service. Your mechanism does not need to implement that coordination.

## 10. Behavior and cleanup checklist

Before shipping your implementation, confirm:

- [ ] `createContext()` returns a fresh context without requiring an anchor or message content yet.
- [ ] `open()` uses the **provided HTML content node** and positions it against the provided anchor.
- [ ] `open()` and `close()` return synchronous booleans and contain vendor-specific errors.
- [ ] Failure during opening removes partially created popup objects and DOM.
- [ ] Every vendor-initiated completed dismissal calls `controller.closed()`.
- [ ] No code accesses the context after notifying `closed()`.
- [ ] Normal Jivs-DOM closure through `close()` works even if the library fires its own synchronous closed callback.
- [ ] Per-popup handlers, observers, wrappers, and instances are released by context disposal.
- [ ] Shared resources and failed-closure leftovers are released by mechanism disposal.
- [ ] Opening a new popup after a validation refresh accepts a **new** context and new message content.
- [ ] Supported positioning and dismissal behavior is documented for users of your mechanism.

Useful tests include: opening and closing normally; closing by Escape/outside click; opening with missing required context elements; an opening failure; a closing failure; rapid open/close; dismissal during a `close()` callback; pointer transfer (if supported); and disposal while resource handles still exist.

## 11. Architectural boundary, in one sentence

**Jivs-DOM decides *what message to show and when to request a popup*; your `IPopupMechanism` decides *how that popup is constructed, positioned, displayed, dismissed, and cleaned up*.**

Keep that boundary intact, and your popup implementation can be used interchangeably with other mechanisms without changing how applications validate their forms.
