# @plblum/jivs-dom-tippy
Popup Error Message Displays require a third party library to implement the popup visuals and popdown handling.

So before you use the `PopupErrorMessageDisplayPresentation`, ensure you have assigned `jivsDomServices.popupMechanism` to an implementation of `IPopupMechanism`.

This is an implementation that uses the Tippy.js library. Include it in your project unless you are already using a different popup library that you prefer, especially for consistency with your existing UI.

```bash
npm install @plblum/jivs-dom-tippy @plblum/jivs-dom tippy.js
```

Import Tippy's stylesheet in your application and register the mechanism during Jivs-DOM setup:

```ts
import 'tippy.js/dist/tippy.css';
import { TippyPopupMechanism } from '@plblum/jivs-dom-tippy';
import type { TippyPopupOptions } from '@plblum/jivs-dom-tippy';
// this is setup in your copy of the configureJivsDom() function...
domServices.popupMechanism = new TippyPopupMechanism();
```

Use `TippyPopupOptions` as the presentation's options type argument to get
type-checked Tippy properties:

```ts
new PopupErrorMessageDisplayPresentation<TippyPopupOptions>(
    indicatorElement,
    indicatorContent,
    messageFrame,
    {
        placement: 'right',
        hideOnClick: true,
        theme: 'jivs-validation'
    }
);
```
You will set this code up in the `configureJivsDom()` function code:
```ts
const popupMechanismOptions = {
    // update this, and make it strongly typed:
    // const popupMechanismOptions: TippyPopupOptions { }
};

factory.register('PopupError',
    (element) => new PopupErrorMessageDisplayPresentation(
        element,
        new ColumnarErrorIndicatorContent(columnarEICIconOnly),
        new MessageFrame(),
        popupMechanismOptions,
        popupEMDOptions));
```                

The presentation owns the events that open and close its popup. The mechanism
uses Tippy's manual trigger and supplies the presentation's anchor and generated
message element as Tippy's reference and content. Do not set `content`, `trigger`,
`triggerTarget`, `showOnCreate`, `onShow`, or `onHide`; these properties are
reserved by the mechanism. A supplied `onHidden` callback is composed with the
notification Jivs-DOM needs when Tippy closes the popup independently.

Other supported Tippy properties, including `hideOnClick`, remain configurable.
The adapter does not add a close button or custom dismissal behavior. See the
[Tippy.js props documentation](https://atomiks.github.io/tippyjs/v6/all-props/)
for styling, placement, and dismissal options.
