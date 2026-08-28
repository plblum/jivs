# Jivs Classes: the API

## Quick API overview

You will be working with classes and interfaces. Here are the primary pieces to orient you to its API.

- [ValueHost rules](#valuehost-rules) – Classes used to configure each ValueHost.
    + `ValueHostRulesBase class` – Create a subclass for each configuration representing a model or form.
    + `IAdaptModelRulesToForm interface` – Implement on a form-specific subclass when adapting rules from an existing model's ValueHost rules.
-   [`ValueHost classes`](#valuehosts) – Identifies a single value to be validated
    and/or contributes data used by the validators. You get and set its value both from a Model and the Inputs (your editor widgets) in the UI.

    + `FieldValueHost class` – Use with fields (both Inputs from the UI and properties from a model), to provide validation as the value changes. 
    + `CalcValueHost class` – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days.
    + `StaticValueHost class` – For values that do not need validating, but support validation rules of FieldValueHosts. 
  
    >For example, a postal codes might be validated against a regular expression. But that expression depends on the country of delivery. So you would use a `StaticValueHost` to pass in a country
    code your app is using, and let the validation internally select the right
    expression by retrieving the country code first.
    
    > If you are using a Model, you might also use `StaticValueHost` for all remaining properties on that model. In this scenario, Jivs becomes a *Single Source of Truth* for the model's data while in the UI.

-   [`ValueHostsManager class`](#valuehostsmanager) – The "face" of this API. It represents the fields of your form or model to Jivs through its `ValueHosts`. Your validation-related UI elements will need access to it to do their work. Use it to validate, retrieve validation results, and report additional errors determined by your business logic. It is supported by these types:
    + `ValueHostsManagerConfig object tree` – An object tree that describes all aspects of configuring the ValueHostsManager, including services, ValueHosts, Validators, and callbacks. 
    + [`ValueHostsManagerConfigBuilder class`](#the-valuehostsmanagerconfigbuilder-class) – Provides a fluent syntax to create the `ValueHostsManagerConfig object tree`.
    + [`FormConfigAdapter class`](#the-form-configuration-adapter) – Also known as the **Form Configuration Adapter**, use it to configure the `ValueHostsManager` from within the `IAdaptModelRulesToForm.adaptToForm()` method. Internally, it prepares the `ValueHostsManagerConfig object tree`.

-   [`Condition classes`](#conditions-the-validation-rules) – Classes that evaluate value(s) against a rule
    to see if those values conform. `Condition classes` exist for each
    business rule pattern, such as *required* or *compare two values are
    not identical*. While there are many standard rules for which there
    are `Conditions` included in this library, you are often going to need
    to build your own.

-   [`Validator class`](#validators-connecting-conditions-to-error-messages) – Handle the validation process of a single rule and deliver a list of issues found to the ValueHostsManager, where your UI elements can consume it.

- [`JivsServices class`](#jivsservices) – Provides dependency injection and configuration through a variety of services and factories. This is where much of customization occurs. Here are several interfaces supported by JivsServices which empower Jivs.
    - `IDataTypeFormatter` – Two use cases:
        + `FieldValueHost` can convert the native value into its text value when using `ValueHost.setValue()`.
        + Provides localized strings for the tokens within error messages. For example, if validating a date against a range, your error message may look like this: "The value must be between {Minimum} and {Maximum}." With a Date-oriented DataTypeFormatter (supplied), those tokens will appear as localized date strings.
    - `IDataTypeConverter` – For these use cases:
        + Changing an object value into something as simple as a string or number for Conditions that compare values. The JavaScript `Date object` is a good example, as you should use its `getTime()` function for comparisons.
        + Changing a value to something else. Take the `Date object` again. Instead of working with its complete date and time, you may be interested only in the date, the time, or even parts like Month or Hours.
    - `IDataTypeParser` – For converting the input value into a native value, ready for validation. A parser can detect an error and report it for a validator to show. Parsers are localizable.
    - There are also `IDataTypeCheckGenerator`, `IDataTypeComparer`, and `IDataTypeIdentifier` to cover some special cases.
    - `ConditionFactory` – Creates the Condition objects used by business rules.

<img src="http://jivs.peterblum.com/images/Class_overview.svg"></img>

**Topics**
- [Conditions - the validation rules](#conditions--the-validation-rules)
- [ValueHosts](#valuehosts)
- [Validators](#validators-connecting-conditions-to-error-messages)
- [ValueHostsManager](#valuehostsmanager)
- [Rules](#valuehost-rules)
- [JivsServices](#jivsservices)
- [ModelReader and ModelWriter](#modelreader-and-modelwriter)

**Additional topics**
- [Creating your own Conditions](#creating-your-own-conditions)
- [Lookup Keys: DataTypes and Companion tools](#lookup-keys-data-types-and-companion-tools)
- [Localization](#localization)
- [Validation Deep Dive](#validation-deep-dive)
- [Logging](#logging)
- [Testing your work](#testing-your-work)
