# Jivs Terminology
You may want to create a link to this topic to assist as you delve into the documentation.
- **Business Logic** – The code dedicated to describing and maintaining your Model. It provides the validation rules for individual properties and to run before saving. Jivs proposes that you code these rules separately from the UI.
- **Model** - Industry term for an object that represents a specific piece of data. It often has parallels to what you store in a database as a table. In terms of validation, your app will usually collect all of the data from the user and stick it into a Model. Then the Model is run against business logic to ensure its completely valid before it is stored. Related terms: Entity, Record, and Data Transfer Object (DTO).
- **Property** - A named piece of data found on the Model. Validation is often applied to Properties.
- **Input** - Refers to the editor, widget, component where the user edits the data. In HTML, \<input>, \<select>, and \<textarea> tags are examples. Validation is often applied to Inputs.- 
- **Field** - Properties and Inputs are basically the same concept at a high level. They hold a field value. **Field** refers to this concept.
- **Form** – A user interface construction that holds a group of Inputs. It often has buttons to submit the work when completed (but first, it should use validation!). When using the HTML \<form>, your client side does not intend to gather that data into a Model; instead it posts the form contents to the server for Model formation and validation.
- **Condition** - A class that evaluates value(s) against a rule
to see if those values conform. One or more of these classes are used within a validation rule and other use cases.
- **Validation rule** - A validator's use of condition classes to evaluate the values and determine validity. There may be several distinct rules on a single input, such as "requires a value", "must be a date", etc.
- **Validator** – Combines a validation rule with the error message(s) it may return when an issue is found. Some Validators are specific to an Input or Property; those are the domain of Jivs. Business logic may also have Validators that work with the entire Model.
- **Input Value** – The raw string data from the Input. It is a string representing the actual data, but needs to be cleaned up or converted before it can be stored.
- **Native Value** – The actual data that you will store in the Model. Often you have conversion code to move between Native and Input Values. One classic validation error is when your conversion code finds fault in the Input Value and cannot generate the Native Value. This error is what Jivs calls a "Data Type Check".
- **ValueHost** – A type of Jivs object that knows the name and value of some data available to the validation system. `FieldValueHost` is associated with Fields, supporting validation as they change. However, not all values need actual validation. `StaticValueHost` holds static data like global values and fields from the Model that won't be edited. `CalcValueHost` determines its value from a calculation.
- **ValidationManager** – A Jivs object; it is the main class you interact with. You configure it to know about your form or Model, where ValueHosts are created for each value in the form or Model. 
You will use it to supply data from your Inputs and Properties, to invoke validation, to retrieve a list of issues to display, and to report additional errors determined by your business logic.
- **Model Rules** - Model rules describes the business logic rules for validation specific to a Model. They are used to configure a ValidationManager. You encapsolate those rules in a subclass of `ModelRulesBase`. If you don't have a model, subclass from `FormRulesBase` instead.
- **Validation Summary** – A UI-specific area that shows error messages found throughout your form.
- **Service** – A class that provides Jivs with dependency injection or a factory. Jivs has you create a master service object, `ValidationServices`, and connect individual services to it. 
- **Builder API** - Tooling to configure the `ValueHosts` and their `Validators` used by `ValidationManager`.
- **Parser** - Code that converts of the Input Value from a string into its Native Value.
- **Formatter** - Code that converts the Native Value into a localized, user friendly string for display within an error message.
- **Converter** - Code that converts a Native Value into another value, such as converting a date into the day offset from the start of the year, or making a string all lowercase characters.
