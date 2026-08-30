# What Invokes Validation
Both the `ValueHostsManager` and `FieldValueHost` have a `validate()` function, as described in the next two sections.
## FieldValueHost.validate()
When a `FieldValueHosts`' value changed, call its `validate()` function or pass the `{ validate: true }` option into the `setTextValue()` function.

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    let valueHost = vhm.vh.field('FirstName');	// or vhm.getTextValueHost('FirstName')
    valueHost.setTextValue(textValue);
    valueHost.validate();
});	
firstNameFld.attachEventListener('oninput', (evt)=> {
    let valueHost = vhm.vh.field('FirstName');	// or vhm.getTextValueHost('FirstName')
    valueHost.setTextValue(evt.target.value);
    valueHost.validate({ duringEdit: true });
});
```
> If you handle parsing from text to native value outside of Jivs, you will likely call `valueHost.setValues(native, text)` and pass along an additional option. See [Injecting errors on demand](./Injecting_errors_on_demand.md).

`validate()` takes an optional parameter called options which is this type:
```ts
interface ValidateOptions {
    group?: string;
    preliminary?: boolean;
    duringEdit?: boolean;
    skipCallback?: boolean;
}
```
These properties are all related to `ValueHost` value changes:
- `duringEdit` - Set to true when handling oninput events, or any other validation that needs to happen as the user types. Only a few validators will respond, including `RequireTextCondition`, `RegExpCondition`, and `StringLengthCondition`. (`RegExpCondition` must have its `supportsDuringEdit` config property set to true.)
- `skipCallback` - Set to true if you have a reason to skip the `onValueHostValidationStateChanged callback` normally invoked by `validate()`.

The `setValue()`, `setValues()`, `setTextValue()`, and `setValueToUndefined()` functions all take an *options* parameter to invoke validation, saving a step:

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    vhm.vh.field('FirstName').setTextValue(textValue, { validate: true });
});	
firstNameFld.attachEventListener('oninput', (evt)=> {
    vhm.vh.field('FirstName').setTextValue(evt.target.value, { validate: true, duringEdit: true });
});
```
Here is the type for the *options* parameter:
```ts
interface SetValueOptions {
    validate?: boolean;
    duringEdit?: boolean;
    reset?: boolean;
    skipValueChangedCallback?: boolean;
    overrideDisabled?: boolean;
    ensureEnabled?: boolean; 
// FieldValueHosts add the following:
    injectedError?: InjectedError;
    disableParser?: boolean;
    disableFormatter?: boolean;
    skipIfUnchanged?: boolean;
}
```
These properties are all related to validation:
- `validate` - When true, invoke validation but only if the value changed. It defaults to true.
- `duringEdit` - described above
- `reset` - When true, change the state of the ValueHost to unchanged and validation has not been attempted. It defaults to false.
- `injectedError` - When you handle parsing, your parser may report an error that you want to display.
  Use this option to pass along the error. Jivs will display it. See [Injecting errors on demand](./Injecting_errors_on_demand.md).

### ValueHostsManager.validate()
Prior to submitting or any time you want to validate the entire form, use `validate()` on `ValueHostsManager`.
```ts
let status = vhm.validate(); // it will notify elements in your UI of validation changes
if (status.doNotSave)
    // Prevent saving. User has to fix things
else
    // Submit the page's data
```
`validate()` takes an optional parameter called options which is this type:
```ts
interface ValidateOptions {
    group?: string;
    preliminary?: boolean;
    duringEdit?: boolean;
    skipCallback?: boolean;
}
```
These properties are all related to `ValueHostsManager` validation:
- `group` - Group validation is a tool to group validatable `ValueHosts` with a specific submit command when validating. If used, it needs a name assigned here and on `ValueHosts` that it targets. See their `ValueHostConfig.group` property. The name matching is case insensitive.

  Use when there is more than one group of validatable `ValueHosts` to be validated together.
  
  For example, the `ValueHostsManager` handles two forms at once. Give the `ValueHostConfig.group` a name for each form. Then make their submit command
  pass in the same group name.
  
- `preliminary` - Set to true when running a validation prior to a submit activity.
Typically used just after loading the form to report any errors already present.
When set, the `RequireTextCondition` is not checked as the user doesn't need
the noise complaining about missing input when they haven't had a chance to address it.
- `skipCallback` - Set to true if you have a reason to skip the `onValidationStateChanged callback` normally invoked by `validate()`.
