# Validators
Validation is really just a process that evaluates some rule and returns a result. If there was an error, the result includes an error message. The `Validator class` handles this work. It defers the "evaluates a rule" part to a [Condition](../Conditions/Home.md). 

There are several aspects to validation:
- [Configuration](./Configuration.md), which happens when you setup the `ValueHostsManager`. It uses the `ValidatorConfig object`, which contains:
    - a `ConditionConfig object` describing the condition to use
    - [two error messages](./Error_Messages.md), with one targetting a ValidationSummary
    - an optional [errorCode](./ErrorCodes.md)
    - an optional severity
- [Invoking the validation process](./Invoking_Validation.md).
- [The results of validation](./Handling_ValidationState_Changes.md)
    - [`ValidationState object`](./Validation_State.md#validationstate) from the `ValueHostsManager`. Returned by `ValueHostsManager.validate()` and passed into its `onValidationStateChanged` callback, which your UI uses.
    - [`ValueHostValidationState object`](./Validation_State.md#valuehostvalidationstate) from individual `FieldValueHosts`. Passed through `ValueHostsManager`.`onValueHostValidationStateChanged` callback, which field specific UI error displays use.
    - [`IssueFound object`](./Validation_State.md#issuefound) describes a single issue (or error if you like) found. Contained within both ValidationState and `ValueHostValidationState`.
- [Injecting errors on demand](./Injecting_errors_on_demand.md), where you receive an error outside of normal scope such as a parser failure.

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

function fieldValidated(valueHost: IValidatorsValueHost, validationState: ValueHostValidationState): void
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
## API References
- [Validator class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Validator_ConcreteClasses.Validator.html)
- [ValidatorConfig type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validator_Types.ValidatorConfig.html)
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)
- [ConditionConfig type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Conditions_Types.ConditionConfig.html)
- [ValidationState type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validation_Types.ValidationState.html)
- [ValueHostValidationState type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_ValueHosts_Types_ValidatableValueHostBase.ValueHostValidationState.html)
- [IssueFound type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validation_Types.IssueFound.html)

---
Go to [API Home](../Home.md)