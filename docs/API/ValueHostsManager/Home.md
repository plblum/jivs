# ValueHostsManager
With Jivs, the UI uses the `ValueHostsManager class` to manage the `ValueHosts`, run validation, and get any issues found. All of your UI widgets should have access to the `ValueHostsManager`, so they can take actions resulting from validation.

Here is pseudo-code representation of its interface (omitting some members).
```ts
interface IValueHostsManager {
    getValueHost(valueHostName: string): null | IValueHost;
    getFieldValueHost(valueHostName: string): null | IFieldValueHost;
    getCalcValueHost(valueHostName: string): null | ICalcValueHost;
    getStaticValueHost(valueHostName: string): null | IStaticValueHost;
    vh: ValueHostAccessor;
    getFieldByElementIdentifier(elementIdentifier: string): null | IFieldValueHost;
    getFieldByPropertyName(propertyname: string): null | IFieldValueHost;

    validate(options?): ValidationState;
    clearValidation(options?): boolean;
    addExternalIssuesFound(issuesFound, developedLocally, options?): boolean;
    addExternalIssueFound(error: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean;
        
    isValid: boolean;
    doNotSave: boolean;
    asyncProcessing?: boolean;
    getIssuesForInput(valueHostName): null | IssueFound[];
    getIssuesFound(group?): null | IssueFound[];

    toValidationPayload(externalIssues: Array<IssueFound> | null): string;
    fromValidationPayload(payload: string, encode?: null|((text: string)=>string)): boolean; 
    getCapturedState(): string;
    broadcastState(): void;
}
```
## Getting ValueHosts Members
- `getValueHost(valueHostName)` - Returns any `ValueHost` type, but weakly typed to the base class.
- `getFieldValueHost(valueHostName)` - Returns the `FieldValueHost` or null
- `getCalcValueHost(valueHostName)` - Returns the `CalcValueHost` or null
- `getStaticValueHost(valueHostName)` - Returns the `StaticValueHost` or null
- `vh` - Another syntax for getting to a value that is similar to the builder. Each of these throw an exception if the `ValueHost` is not found or not a match to the type:
    - `vh.field(valueHostName) : IFieldValueHost`
    - `vh.calc(valueHostName) : ICalcValueHost`
    - `vh.static(valueHostName) : IStaticValueHost`
    - `vh.any(valueHostName): IValueHost`
- `getFieldByElementIdentifier(elementIdentifier)` - Pass in an Element Identifier to match to the configured elementIdentifier property.
    ```ts
    build.field('name', LookupKey.String, {
        elementIdentifier: 'element identifier'
    });
    ```
- `getFieldByPropertyName(propertyName)` - Pass in a property name to match the configured propertyName property.
    ```ts
    build.field('name', LookupKey.String, {
        propertyName: 'property_name'
    });
    ```
## Validation Members
- `validate(options)` - Runs validation against all qualified validatable ValueHosts. Returns the [`ValidationState object`](#validation-state-and-issues-found).
    Its options are this object:
    ```ts
    interface ValidateOptions
    {
        group?: string;
        preliminary?: boolean;
        duringEdit?: boolean;
        skipCallback?: boolean;
    }    
    ```
    - `group` - If assigned, only match to FieldValueHosts that are configured with the same group name.
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
        HTMLInputElement.oninput event.
        This will involve only validators that make sense during such an edit.
        When undefined, it is the same as false.
    - `skipCallback` - If you have setup a `onValidationStateChanged` or `onValueHostValidationStateChanged` callback,
        you may not want it to fire when you expressly call validate().
        In that case, set this to true.

- `clearValidation(options)` - Resets all qualified `FieldValueHosts` to their `NotAttempted` status, as if the 
    user has not yet interacted with the form.

### ValidationState Members
Learn about `IssueFound objects` [here](#issuefound).
- `addExternalIssuesFound(IssueFound[])` - Supply a list of `IssuesFound` that are generated outside of Jivs, such as during business logic validation at the model level. Through callbacks, they will notify your error display elements (field and ValidationSummary) as if they are part of Jivs. 
- `addExternalIssueFound(IssueFound)` - Handles a single `IssueFound` that is generated outside of Jivs.
- `isValid` - Any IssuesFound that has its `isValid` property set to false makes this false. Always use `doNotSave` to prevent saving/submitting.
- `doNotSave` - Any `IssueFound` that has its `doNotSave` property set ot true makes this true. Use this to determine if you can save or submit.
- `asyncProcessing` - Any `IssueFound` that has its asyncProcessing property set to true makes this true. `doNotSave` will also be true to ensure you don't submit while an async process is running.
- `getIssuesForInput(valueHostName)` - Get the list of `IssueFound objects` currently on the FieldValueHost.
- `getIssuesFound(group)` - Get the list of `IssueFound objects` across all qualified FieldValueHosts.

### Transfer Between Client and Server Members
- `toValidationPayload(IssueFound[])` - Used on the server side when Jivs is executing on the server to return the value to pass back to the client for use in `fromValidationPayload()`.
- `fromValidationPayload(payload)` - The client-side handling of the payload supplied by `toValidationPayload()` on the server side.
- `getCapturedState()` - Use together with server generated pages, which may replace the entire content of the page and force instanciating a new `ValueHostsManager`. It returns a string to send to the server. The server is expected to return it back unchanged. When configuring the `ValueHostsManager`, assign the result to the `ValueHostsManagerConfig.capturedState` property.
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

## Configuring the ValueHostsManager
> Please visit "[Configuring Jivs](#configuring-jivs)" for an overview of the process.

The `ValueHostsManager` is configured by passing the  `ValueHostsManagerConfig object tree` into its constructor. The object tree is complex and difficult to maintain, so we provide the **Builder API** to greatly simplify it. (See [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class).)

Typically you encapsolate the business rules in a class that inherits from [`ValueHostRulesBase`](#valuehost-rules), overriding the `configureRules()` method where you describe each field and its validators with the Builder API.

### Example
Each `field()` adds or modifies a `ValueHost` of type _FieldValueHost_. The method's parameters
assign properties to the `ValueHost`. The fluent syntax that follows it are validation rules.

```ts
export class PersonModel {
    firstName: string,
    lastName: string
}
export class PersonModelRules extends ValueHostRulesBase {
    protected configureRules(builder: IValueHostsManagerConfigBuilder, 
        options?: ValueHostRulesOptions): void {

        // create the First Name ValueHost and its validators
        builder.field('FirstName', LookupKey.String, { label: 'First name'} )
            .requireText()
            .notEqualTo('LastName', null, null, 
            { 
                errorMessage: 'You entered the same value in First Name. Double-check your work.',
                severity: ValidationSeverity.Warning
            });
        // create the Last Name ValueHost
        builder.field('LastName', LookupKey.String, { label: 'Last name'} );
    }
}
// consume to build your ValueHostsManager
let services = createJivsServices('en-US'); // see "Installing Jivs"
let rules = new PersonModelRules(services);
let config = rules.configure();
let vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation
```
