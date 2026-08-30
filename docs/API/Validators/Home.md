# Validators
Validation is really just a process that evaluates some rule and returns a result. If there was an error, the result includes an error message. The `Validator class` handles this work. It defers the "evaluates a rule" part to a [Condition](../Conditions/Home.md). 

There are several aspects to validation:
- Configuration, which happens when you setup the `ValueHostsManager`. It uses the `ValidatorConfig object`, which contains:
    - a `ConditionConfig object` describing the condition to use
    - two error messages, with one targetting a ValidationSummary. Plus localization properties.
    - an optional errorCode
    - an optional severity
- Validation process, which happens when you call the `ValueHostsManager.validate()` function.
- The results of validation
    - `ValidationState object` from the `ValueHostsManager`. Returned by `ValueHostsManager.validate()` and passed into its `onValidationStateChanged` callback, which your UI uses.
    - `ValueHostValidationState object` from individual `FieldValueHosts`. Passed through `ValueHostsManager`.`onValueHostValidationStateChanged` callback, which field specific UI error displays use.
    - `IssueFound object` describes a single issue (or error if you like) found. Contained within both ValidationState and `ValueHostValidationState`.

For example:
```ts
// configuration for a model
export class PersonModelRules extends ValueHostRulesBase {
    protected override configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions
    ): void {
        builder.field('FirstName', LookupKey.String, {
            propertyName: 'firstName'
        })
            .requireText()
            .stringLength(50);

        builder.field('LastName', LookupKey.String, {
            propertyName: 'lastName'
        })
            .requireText()
            .stringLength(50);
    }
}

// create the ValueHostsManager
const services = createJivsServices('en-US');
const rules = new PersonModelRules(services);
const config = rules.configure();

config.onValueHostsValidationStateChanged = fieldValidated; // your function
config.onValidationStateChanged = formValidated; // your function

const vhm = new ValueHostsManager(config);
// user submits the form
vhm.validate(); // will invoke both callbacks, which is how the UI knows to show Validation State

function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
    // use valueHost to identify the specific field whose UI needs to change
    // use validationState to know if there were any errors, and to show those errors
}
function formValidated(valueHostsManager: IValueHostsManager, validationState: ValidationState): void
{
    // use validation state to know if there were any errors and to show those errors, 
    // usually in a Validation Summary widget.
}

```






