# Client Presentation of Jivs Validation

Jivs determines validation state. The application decides how that state should appear in the UI.

Client presentation of that validation state commonly includes:

- Field Error Displays
- Required Indicators
- styling that responds to field validation
- Validation Summaries
- Submit / Save Controls

The client presentation topic has multiple documents which together we call the **Jivs Presentation Learning Guide**.

## Introducing Jivs SimpleDom

Jivs reports validation state, but application code still needs to connect that state to the UI and decide how each element should respond. Applications can implement that presentation in many ways. The Learning Guide provides a working approach called **Jivs SimpleDom**.

Jivs SimpleDom combines a small set of conventions with supplied TypeScript and CSS. It provides one architecture for the client presentation of Jivs validation, but Jivs does not require applications to use it. At its core, Jivs remains independent of the UI.

The Jivs SimpleDom source code and examples cover:

- an architectural strategy for delivering Jivs validation state to the UI
- HTML and custom attributes for identifying fields and validation presentation elements
- CSS for presenting validation state
- TypeScript for connecting the HTML to Jivs
- Presentation Functions for editors, labels, Field Error Displays, Validation Summaries, and Submit controls, plus initialization for Required Indicators

Readers who want a working client presentation can use Jivs SimpleDom as a starting point. Readers building another integration can use its implementation to understand the responsibilities their own presentation must provide.

### Align Your HTML with Jivs SimpleDom

Jivs SimpleDom connects HTML elements to Jivs validation through a small set of custom attributes. Add the attributes that apply to each element that participates in validation presentation.

For example, identify an editor like this:

```html
<input
    id="first-name"
    data-field="first-name"
    data-jivs-role="editor"
    data-jivs-presentation="invalidEditor">
```

Jivs SimpleDom uses three custom attributes:

- `data-field` connects related elements to the same field.
- `data-jivs-role` identifies what an element does in the presentation. Roles include `editor`, `label`, `container`, `error`, `required`, `summary`, and `submit`.
- `data-jivs-presentation` names the Presentation Function an element uses.

Jivs SimpleDom supplies default Presentation Functions for common UI elements. Start with the defaults and replace only the presentations your application needs.

### Get the Jivs SimpleDom Files

The reusable TypeScript and CSS used throughout the Jivs Presentation Learning Guide are available in these files:

- [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts)
- [`jivs-simpledom.css`](../../../starter_code/jivs-simpledom.css)

> If needed, you can locate them in the Jivs repo here: [starter\_code](https://github.com/plblum/jivs/tree/main/starter_code)

Add these files to your application as a starting point instead of assembling their contents from the individual snippets. The focused documents retain those snippets to explain the code and identify the parts you are likely to customize.

## How to Use the Jivs Presentation Learning Guide

The Jivs Presentation Learning Guide explains the client presentation of Jivs validation and provides a working implementation using **Jivs SimpleDom**.

Use the sections and documents that apply to what you need:

- [Get the Jivs SimpleDom Files](#get-the-jivs-simpledom-files) identifies the supplied TypeScript and CSS files.
- [Presentation Quick Start](Presentation_Quick_Start.md) provides the big picture and a direct path to a working presentation.
- [Jivs Presentation Prerequisites](Jivs_Presentation_Prerequisites.md) covers the browser and security requirements that apply before presenting Jivs validation.
- [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md) explains the CSS and HTML conventions used by Jivs SimpleDom.
- [From Jivs Validation State to Client Presentation](From_Jivs_Validation_State_to_Client_Presentation.md) explains the state received from Jivs, generates Error Messages, and delivers validation changes to the UI.
- [Field Presentation of Jivs Validation](Field_Presentation_of_Jivs_Validation.md) connects field validation to editors and labels and initializes Required Indicators.
- [Field Presentation: Field Error Displays](Field_Presentation_Field_Error_Displays.md) presents field Error Messages inline, through icons and tooltips, or through UI-library components.
- [Form Presentation of Jivs Validation](Form_Presentation_of_Jivs_Validation.md) connects form validation to Validation Summaries and Submit / Save Controls.
- [Accessible Client Validation UI](Accessible_Client_Validation_UI.md) adds the accessibility behavior needed by client validation presentation.

---

To get the big picture or dive right in, continue to [Presentation Quick Start](Presentation_Quick_Start.md).

To begin the detailed guide, continue to [Jivs Presentation Prerequisites](Jivs_Presentation_Prerequisites.md).

Return to [Learning Jivs TOC](../Learning_Jivs_Home.md).