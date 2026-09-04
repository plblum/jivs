# Disabling a ValueHost
`ValueHosts` can be disabled. Here are their behavior changes when disabled:
- Validation will not run
- Validation State is similar to having no error. You will still get some messages through the `onValueHostValidationStateChanged` callback. Expect the `ValueHostValidationState object` to look like this:
    ```ts
    {
        isValid: true,
        status: ValidationStatus.Disabled,
        doNotSave: false,
        issuesFound: null,
    }
    ```
- Calls to `setValue()`, `setTextValue()`, and `setValues()` will not make any changes to the values without specific override options, described below.

## How to disable and enable the ValueHost
There are two features available to set the enabled state: 
- Using the **Enabled Setting**, which is a boolean that you change on demand
- Using the **Enabler Condition**, where the Condition determines whether it is true or false.

### Changing the Enabled Setting
- To change it on demand, call the `setEnabled()` function on the `ValueHost` object.
    ```ts
    vhm.vm.field('name').setEnabled(false);
    ```
  > When setting it to true, also be sure to call `validate()` if you want to restore the validation state.
  > Setting it to false clears the validation state. 
  
- If you want to disable it as part of initial configuration, set the `initialEnabled` property to false.
    ```ts
    builder.field('name', LookupKey.String, { initialEnabled: false });
    ```

- Calls to `setValue()`, `setTextValue()`, and `setValues()` will not make any changes to the values by default. Use the `overrideDisabled` option to override this behavior: 
    ```ts
    vhm.vm.field('name').setValue(value, { overrideDisable: true });
    // value will be changed. Enabled setting will be unchanged
    ```
    Alternatively, you can ensure that the `ValueHost` changes its enabled setting to true like this:
    ```ts
    vhm.vm.field('name').setValue(value, { ensureEnabled: true });
    // value will be changed and enabled setting will be true
    ```
### Using the Enabler Condition
It is common to have a field that is only enabled based on something else. If that "something else" is a value in the `ValueHostsManager`, you can setup a Condition object to describe the rule and attach it to the ValueHost's Enabler feature.

_Syntax:_
```ts
builder.field('field1', parameters); // don't set up the enabler here
// attach the Enabler after the ValueHost is configured
builder.enabler('field1', (enablerBuilder)=> 
    enablerBuilder.fieldValue('field2').condition(parameters));
```

_Example:_
```ts
builder.field('field1', LookupKey.String).requireText();
builder.field('field2', LookupKey.Boolean);   // suppose its attached to a checkbox
builder.enabler('field1', (enablerBuilder)=> 
    enablerBuilder.fieldValue('field2').equalTo(true));
```
The _enablerBuilder_ has these functions:
- `fieldValue(valueHostName)` - Starts building a condition that uses the `valueHostName` supplied for the condition that follows. When used, follow it with the desired condition.
- `all()`, `any()`, `countMatches()` - Build logic involving two or more Conditions. See [Any, All, and CountMatches](../Conditions/Conditions_Included_with_Jivs.md#all-any-and-countmatches-conditions)
- `not()` employs the `NotCondition` to invert the result of the child's evaluation. Match→NoMatch or NoMatch→Match. See [NotCondition](../Conditions/Conditions_Included_with_Jivs.md#not-negate-the-result).

## API References
- [ValueHostBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_AbstractClasses_ValueHostBase.ValueHostBase.html)
- [ValueHostsManagerConfigBuilder class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.ValueHostsManagerConfigBuilder.html)
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)


---
Go to [ValueHost Home](./Home.md)

Go to [API Home](../Home.md)