# ValueHostsManager
The `ValueHostsManager` is the central object you use in Jivs. It has an extensive configuration process, although Jivs tries to make it look easy.

```ts
let services = createJivsServices(); 
let rules = new PersonModelRules(services);
let config = rules.configure();
// apply optional callbacks to config here
let vhm = new ValueHostsManager(config);
```
All of these actions are covered in the [ValueHostsManager Configuration Guide](../../ValueHostsManager_Configuration_Guide.md). This document will introduce the members of `ValueHostsManager`.

## The ValueHostsManager type
Here is pseudo-code representation of its interface (omitting some members).
```ts
class ValueHostsManager {
    services: IJivsServices;
    behaviors: Behaviors;

    // getting ValueHosts
    getValueHost(valueHostName: string): null | IValueHost;
    getFieldValueHost(valueHostName: string): null | IFieldValueHost;
    getCalcValueHost(valueHostName: string): null | ICalcValueHost;
    getStaticValueHost(valueHostName: string): null | IStaticValueHost;
    vh: ValueHostAccessor;
    getFieldByElementIdentifier(elementIdentifier: string): null | IFieldValueHost;
    getFieldByPropertyName(propertyname: string): null | IFieldValueHost;
    enumerateValueHosts(filter ?: (valueHost: IValueHost) => boolean): Generator<IValueHost>;

// validation activities
    validate(options?): ValidationState;
    clearValidation(options?): boolean;
        
// current validation state        
    isValid: boolean;   // use doNotSave, not this if you are checking if the data can be saved
    doNotSave: boolean;
    asyncProcessing: boolean;
    getIssuesForField(valueHostName): null | IssueFound[];
    getIssuesFound(group?): null | IssueFound[];
    addExternalIssuesFound(issuesFound: IssueFound[], developedLocally: boolean, options?: ValidateOptions): boolean;
    addExternalIssueFound(error: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean;

// Transfer state between client and server
    toValidationPayload(externalIssues: Array<IssueFound> | null): string;
    fromValidationPayload(payload: string, encode?: null|((text: string)=>string)): boolean; 
    getCapturedState(): string;
    broadcastState(): void;
}
```
### Unclassified members
- `services` - Exposes the `JivsServices` object. See [JivsServices](../JivsServices/Home.md).
- `behaviors` - Behavioral settings for how `ValueHostsManager` should operate. Supplied by either the `ValueHostsManagerConfig.behaviors` or `Builder.behaviors` property. They can be changed once the `ValueHostsManager` is created using this property.
    Here are its options with their default values:
    - `activeCultureID` - the current Culture (ISO language/region) code used for localization. Default is from `CultureService.defaultCultureId`.
    - `disableFormattingOnValueChange` - turns off formatting when `setValue()` is used. When disabled, the native value is not converted to a text value. Alternative, use 
    `setValue(value, { disableFormatter: true });` to selectively turn off formatting. Defaults to false.
    - `disableParsingOnValueChange` turns off parsing when `setTextValue()` is used. Alternative, use 
    `setTextValue(value, { disableParser: true });` to selectively turn off parsing. Defaults to false.
    ```ts
    config.activeCultureID = 'de-DE';
    let vhm = new ValueHostsManager(config);
    ```
### Getting ValueHosts
See [Naming ValueHosts](../ValueHosts/Naming_ValueHosts.md) to understand the parameters `valueHostName`, `elementIdentifier`, and `propertyName`.
- `getValueHost(valueHostName)` - Returns any `ValueHost` type, but weakly typed to the `ValueHostBase` class.
- `getFieldValueHost(valueHostName)` - Returns the `FieldValueHost` or null
- `getCalcValueHost(valueHostName)` - Returns the `CalcValueHost` or null
- `getStaticValueHost(valueHostName)` - Returns the `StaticValueHost` or null
- `vh` - Another syntax for getting to a value that is similar to the builder. Each of these throw an exception if the `ValueHost` is not found or not a match to the type:
    - `vh.field(valueHostName) : IFieldValueHost`
    - `vh.calc(valueHostName) : ICalcValueHost`
    - `vh.static(valueHostName) : IStaticValueHost`
    - `vh.any(valueHostName): IValueHost`
- `getFieldByElementIdentifier(elementIdentifier)` - Pass in an Element Identifier to match to the configured `elementIdentifier` property.
    ```ts
    build.field('name', LookupKey.String, {
        elementIdentifier: 'element identifier'
    });
    ```
- `getFieldByPropertyName(propertyName)` - Pass in a property name to match the configured `propertyName` property.
    ```ts
    build.field('name', LookupKey.String, {
        propertyName: 'property_name'
    });
    ```
- `enumerateValueHosts(filter)` - loop through all or select `ValueHosts` based on the filter.
    ```ts
    // only FieldValueHosts
    const valueHosts = valueHostsManager.enumerateValueHosts(
        (valueHost) => valueHost instanceof FieldValueHost);

    for (const valueHost of valueHosts)
    {
        const fieldValueHost = valueHost as IFieldValueHost;
        // do something with fieldValueHost
    }   
    // only enabled
    const valueHosts = valueHostsManager.enumerateValueHosts(
        (valueHost) => valueHost.isEnabled());

    for (const valueHost of valueHosts)
    {
        // do something with valueHost
    }    
    ```
## Validation Activities
See [Validators](../Validators/Home.md) for details.
- `validate(options)` - Runs validation against the `ValueHosts`. See [Invoking Validation](../Validators/Invoking_Validation.md). It returns the [`ValidationState object`](../Validators/Validation_State.md).
- `clearValidation(options)` - Resets the `FieldValueHosts` to their `NotAttempted` status, as if the 
    user has not yet interacted with the form.

### ValidationState Members
Learn about [`IssueFound objects` here](../Validators/Validation_State.md#issuefound) and [ValidationState here](../Validators/Validation_State.md#validationstate).
- `isValid` - Any `IssuesFound` that has its `isValid` property set to false makes this false. The same value is provided in the `ValidationState.isValid` property passed in the `onValidationStateChanged` callback.
    > Always use `doNotSave` to prevent saving/submitting.
- `doNotSave` - Any `IssueFound` that has its `doNotSave` property set ot true makes this true. Use this to determine if you can save or submit. The same value is provided in the `ValidationState.doNotSave` property passed in the `onValidationStateChanged` callback.
- `asyncProcessing` - Any `IssueFound` that has its `asyncProcessing` property set to true makes this true. `doNotSave` will also be true to ensure you don't submit while an async process is running. The same value is provided in the `ValidationState.asyncProcessing` property passed in the `onValidationStateChanged` callback.
- `getIssuesForField(valueHostName)` - Get the list of `IssueFound objects` currently on the specified `FieldValueHost`. If there are none, it returns null.
- `getIssuesFound(groupName)` - Get the list of `IssueFound objects` across FieldValueHosts. If there are none, it returns null. Use the `groupName` parameter when using validation groups to limit to those within the group.
    ```ts
    build.field('name', LookupKey.String, {
        group: 'groupName'
    })
    ```
- `addExternalIssuesFound(IssueFound[], local)` - Adds a list of `IssuesFound` that are generated outside of Jivs, such as during business logic validation at the model level. They will merge with those generated within Jivs. Through callbacks, they will notify your error display elements (field and ValidationSummary) as if they are part of Jivs. See [Submitting the Client Form](../../Learning_Jivs/Submitting_the_Client_Form.md).
    The `local` parameter determines if the UI updates with these immediately or not. Normally calls made from UI processes will use true and data coming back from the server side submission process will use false.

    Merging rules:
    Goal is to try to activate the same validator that is configured in the FieldValueHost. If that does not happen, the validator will appear on its own, always in the global list ("Validation Summary") and potentially with the field's list.
    - To replace the same validator: `IssueFound` must have a matching `valueHostName` and `errorCode`.
    - To extend the field's list: `IssueFound` must have a matching `valueHostName`.
    - All `IssuesFound` will still appear in the global list.

- `addExternalIssueFound(IssueFound)` - Handles a single `IssueFound` that is generated outside of Jivs.

### Transfer Between Client and Server Members
- `toValidationPayload(IssueFound[])` - Used on the server side when Jivs is executing on the server to return the value to pass back to the client for use in `fromValidationPayload()`. See [Using Jivs for Server-Side Validation](../../Learning_Jivs/Using_Jivs_for_Server_Side_Validation.md).
- `fromValidationPayload(payload)` - The client-side handling of the payload supplied by `toValidationPayload()` on the server side. See [Submitting the Client Form](../../Learning_Jivs/Submitting_the_Client_Form.md).
- `getCapturedState()` - Use together with server generated pages, which may replace the entire content of the page and force instanciating a new `ValueHostsManager`. It returns a string to send to the server. The server is expected to return it back unchanged. When configuring the `ValueHostsManager`, assign the result to the `ValueHostsManagerConfig.capturedState` property. See [Using server generated pages](../../Learning_Jivs/Server_Pages/Home.md).
    ```ts
    config.capturedState = retrievedfromServer;
    let vhm = new ValueHostsManager(config);
    ... when finished with setup ...
    vhm.broadcastState();
    ```
- `broadcastState()` - Invokes these callbacks on demand: `onTextValueChanged`, `onValidationStateChanged`, `onValueHostValidationStateChanged`.
    Targets the capturedState process, as shown in the prior example. Those callbacks are used by the UI to update itself
    and are normally called automatically. However, after recreating `ValueHostsManager` with the captured state, they are not called.
    Call this to complete the `ValueHostManager` setup.

## ValidationOptions object
This object is a parameter to any function that can change the validation state.
```ts
interface ValidateOptions
{
    group?: string;
    preliminary?: boolean;
    duringEdit?: boolean;
    skipCallback?: boolean;
}    
```
- `group` - If assigned, only match to `FieldValueHosts` that are configured with the same group name.
    ```ts
    build.field('name', LookupKey.String, {
        group: 'groupName'
    })
    ```
- `preliminary` - Set to true when running a validation prior to a submit activity.
    Typically set to true just after loading the form to report any errors already present.
    During this phase, Validators setup with Category=Require are not checked as the user doesn't need
    the noise complaining about missing input when they haven't had a chance to address it.
    When undefined, it is the same as false.
- `duringEdit` - Set to true when handling an intermediate change activity, such as a keystroke
    changed a textbox but the user remains in the textbox. For example, on the 
    `HTMLInputElement.oninput` event.

    This will involve only validators that make sense during such an edit.
    When undefined, it is the same as false.
- `skipCallback` - If you have setup a `onValidationStateChanged` or `onValueHostValidationStateChanged` callback,
    you may not want it to fire when you expressly call `validate()`.
    In that case, set this to true.

## Callbacks
Callbacks are how Jivs lets the UI know to take an action. They are an essential part of working with an UI. If you are working on server side validation, they are not often used.

All callbacks must be setup on the `builder` or `config` object prior to creating `ValueHostsManager`. 
- `onValueChanged` notifies you when a `ValueHost` had its value changed. On a `FieldValueHost`, this is the native value, not the text value.
    ```ts
    type ValueChangedHandler = (valueHost: IValueHost, oldValue: any) => void;
    ```
    ```ts
    config.onValueChanged = (valueHost: IValueHost, oldValue: any) => {
        // take some action on valueHost.getValue()
        // if desired, check the new against the old using oldValue
    }
    ```

- `onTextValueChanged` notifies you when an `FieldValueHost` had its text value changed.

    It has numerous use cases, but all target updating the UI element with the latest text value.
    - When initializing values from the model.
        > If you are initializing values by scraping them from the HTML form controls, you will want to avoid this. Use the `skipValueChangedCallback` option in `FieldValueHost.setTextValue(text, { skipValueChangedCallback: true })`. `ModelReader` and `FormReader` have similar options.
    - When using `FieldValueHost.setValue()` and it updates the text value (using a formatter).
    - When using `FieldValueHost.setTextValue()` with its reformatting feature to revise the element with the reformatted value

    ```ts
    type TextValueChangedHandler = 
        (valueHost: IValidatableValueHost, oldValue?: string | null) => void;
    ```
    ```ts
    config.onTextValueChanged = 
        (valueHost: IValidatableValueHost, oldValue?: string | null) => {
        // take some action on valueHost.getTextValue()
        // if desired, check the new against the old using oldValue
        // Do not check against oldValue when oldValue = undefined.
    }
    ```
- `onValidationStateChanged` notifies you after the `ValueHostsManager.validate()` function completes, supplying the function with the new [`ValidationState`](../Validators/Validation_State.md#validationstate).
    ```ts
    type ValidationStateChangedHandler = 
        (valueHostsManager: IValueHostsManager, validationState: ValidationState) => void;
    ```
    ```ts
    config.onValidationStateChanged = 
        (valueHostsManager: IValueHostsManager, validationState: ValidationState) => {
        // Use the validationState extensively.
        // Its doNotSave should be used to block submitting/saving
        // Its IssuesFound array contains all error messages to display in a Validation Summary widget
    }
    ```
- `onValueHostValidationStateChanged` notifies you a FieldValueHost's validate() function completes, supplying the function with the new [`ValueHostsValidationState`](../Validators/Validation_State.md#valuehostvalidationstate).
    ```ts
    type ValueHostValidationStateChangedHandler = 
        (valueHost: IValidatableValueHost, validationState: ValueHostValidationState) => void;
    ```
    ```ts
    config.onValueHostValidationStateChanged = 
        (valueHost: IValidatableValueHost, validationState: ValueHostValidationState) {
        // Use the validationState extensively.
        // Its isValid property is not always ideal, because it can be true when IssuesFound has an entry.
        // Often its better to check IssuesFound?.length > 0.
        // Its IssuesFound array contains all error messages to display in a Field Error Display widget
    }
    ```
- `notifyValidationStateChangedDelay` - _This property can only be found on the ValueHostsManagerConfig object. Set it prior to creating ValueHostsManager._
    Adjusts a debounce delay for `onValidationStateChanged` notifications. The delay is in milliseconds. The default is 100 ms. Set to 0 to disable the debounce.

    `onValidationStateChanged` runs after each `valueHost.validate()` call, even though `onValueHostValidationStateChanged` also runs.
    A call by `ValueHostsManager.validate()` will invoke validation on multiple FieldValueHosts
    resulting in numerous calls to onValidationStateChanged.
    This debounces them so `ValueHostsManager.validate()` generally results in one call.
    ```ts
    config.notifyValidationStateChangedDelay = 500;
    ```    
## API References
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)
- [ValueHostsManagerConfigBuilder class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.ValueHostsManagerConfigBuilder.html)
- [ValidationState type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validation_Types.ValidationState.html)
- [ValueHostValidationState type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_ValueHosts_Types_ValidatableValueHostBase.ValueHostValidationState.html)
- [IssueFound type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validation_Types.IssueFound.html)
- [JivsServices](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_JivsServices.JivsServices.html)

---
Go to [API Home](../Home.md)