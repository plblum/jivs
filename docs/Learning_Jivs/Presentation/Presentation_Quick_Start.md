# Presentation Quick Start

Use this as a way to get the big picture or to dive right in.

### 1. Add the Jivs SimpleDom Files

Add these files to your application:

- [`jivs-simpledom.ts`](../../../starter_code/jivs-simpledom.ts)
- [`jivs-simpledom.css`](../../../starter_code/jivs-simpledom.css)

> If needed, you can locate them in the Jivs repo here: [starter\_code](https://github.com/plblum/jivs/tree/main/starter_code)

Import the TypeScript exports and load the stylesheet using your application's normal mechanisms.

- [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md) for the conventions and implementation supplied by these files

### 2. Disable Native Browser Validation

Add `novalidate` to the form so native browser validation does not compete with Jivs:

```html
<form id="person-form" novalidate>
    ...
</form>
```

- [Disable Native Browser Validation](Jivs_Presentation_Prerequisites.md#disable-native-browser-validation)

### 3. Protect Error Messages from XSS

Replace the default `messageTokenResolverService` before creating the `ValueHostsManager`:

```ts
services.messageTokenResolverService =
    new HtmlMessageTokenResolverService();
```

- [Protect Error Messages from XSS](Jivs_Presentation_Prerequisites.md#protect-error-messages-from-xss)
- [Generate Error Messages](From_Jivs_Validation_State_to_Client_Presentation.md#generating-error-messages-from-issuefound-objects)

### 4. Tag Each Editor

Add the field identifier, editor role, and default editor presentation:

```html
<input
    id="first-name"
    data-field="first-name"
    data-jivs-role="editor"
    data-jivs-presentation="invalidEditor">
```

The `data-field` value must match the field's Jivs element identifier. Configure `elementIdentifier` on the `FieldValueHost` when it differs from the ValueHost name.

- [Connect the FieldValueHost to the Field Identifier](The_Jivs_SimpleDom_Approach.md#connect-the-fieldvaluehost-to-the-field-identifier) for the Jivs SimpleDom convention
- [Finding the UI Element for a FieldValueHost](../Using_the_ValueHostsManager_within_the_Client.md#finding-the-ui-element-for-a-fieldvaluehost) for the underlying Jivs connection

### 5. Tag Each Label You Want Styled

Labels are optional validation consumers. To have a label respond when its field is invalid, add:

```html
<label
    for="first-name"
    data-field="first-name"
    data-jivs-role="label"
    data-jivs-presentation="invalidLabel">
    First name
</label>
```

- [Field Markup](The_Jivs_SimpleDom_Approach.md#field-markup) for the Jivs SimpleDom syntax
- [Presentation for a Label](Field_Presentation_of_Jivs_Validation.md#presentation-for-a-label)

### 6. Add a Field Error Display

Add the default inline Field Error Display for each field:

```html
<div
    data-field="first-name"
    data-jivs-role="error"
    data-jivs-presentation="inlineError">
</div>
```

- [Field Markup](The_Jivs_SimpleDom_Approach.md#field-markup) for the Jivs SimpleDom syntax
- [Field Presentation: Field Error Displays](Field_Presentation_Field_Error_Displays.md)
- [Generate Error Messages](From_Jivs_Validation_State_to_Client_Presentation.md#generating-error-messages-from-issuefound-objects)
- [Field Error Display Accessibility](Accessible_Client_Validation_UI.md#field-error-display-accessibility)

### 7. Add a Required Indicator If Desired

A Required Indicator does not need a Presentation name:

```html
<span
    data-field="first-name"
    data-jivs-role="required">
    *
</span>
```

The supplied initialization code reads `FieldValueHost.required` to determine whether the indicator should appear.

- [Field Markup](The_Jivs_SimpleDom_Approach.md#field-markup) for its place within the complete field
- [Initialize Required Indicators](Field_Presentation_of_Jivs_Validation.md#initialize-required-indicators)
- [Required Indicator Accessibility](Accessible_Client_Validation_UI.md#required-indicator-accessibility)

### 8. Add a Validation Summary If Desired

Place the Validation Summary within the form:

```html
<div
    data-jivs-role="summary"
    data-jivs-presentation="validationSummary">
</div>
```

- [Form Markup](The_Jivs_SimpleDom_Approach.md#form-markup) for the Jivs SimpleDom syntax
- [Presentation for a Validation Summary](Form_Presentation_of_Jivs_Validation.md#presentation-for-a-validation-summary)
- [Validation Summary Accessibility](Accessible_Client_Validation_UI.md#validation-summary-accessibility)

### 9. Tag the Submit Button If Desired

To have form validation control the Submit button, add:

```html
<button
    type="submit"
    data-jivs-role="submit"
    data-jivs-presentation="disableSubmit">
    Save
</button>
```

- [Form Markup](The_Jivs_SimpleDom_Approach.md#form-markup) for the Jivs SimpleDom syntax
- [Presentation for a Submit / Save Control](Form_Presentation_of_Jivs_Validation.md#presentation-for-a-submit-save-control)
- [Submit / Save Control Accessibility](Accessible_Client_Validation_UI.md#submit-save-control-accessibility)
- [Submitting the Client Form](../Submitting_the_Client_Form.md)

### 10. Wire Field and Form Validation

Use the supplied Dispatcher Functions as the `ValueHostsManager` callbacks:

```ts
config.onValueHostValidationStateChanged =
    fieldValidated;

config.onValidationStateChanged =
    formValidated;
```

- [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md) for the Jivs SimpleDom conventions
- [From Jivs Validation State to Client Presentation](From_Jivs_Validation_State_to_Client_Presentation.md)
- [The Field Dispatcher Function](Field_Presentation_of_Jivs_Validation.md#the-field-dispatcher-function)
- [The Form Dispatcher Function](Form_Presentation_of_Jivs_Validation.md#the-form-dispatcher-function)

### 11. Initialize the Presentation

After the `ValueHostsManager` has been created and the form's HTML is available, attach the selected Presentation Functions and initialize the Required Indicators:

```ts
attachFieldPresentations();
attachFormPresentations();
initializeRequiredIndicators(vhm); // vhm = ValueHostsManager
```

The default field and form presentations are now connected to Jivs.

- [The Jivs SimpleDom Approach](The_Jivs_SimpleDom_Approach.md) for the Jivs SimpleDom conventions
- [Initialize Field Presentation Functions](Field_Presentation_of_Jivs_Validation.md#initialize-field-presentation-functions)
- [Initialize Form Presentation Functions](Form_Presentation_of_Jivs_Validation.md#initialize-form-presentation-functions)

---

Continue to the next section of the Jivs Presentation Learning Guide: [Jivs Presentation Prerequisites](Jivs_Presentation_Prerequisites.md).

Return to [Learning Jivs TOC](../Home.md).