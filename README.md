# Jivs - JavaScript Input Validation Service
*Jivs is a work-in-progress. This is a preview to get feedback from the community.
I'm looking for an assessment of the architecture. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later. --- Peter Blum*

*For the full API, go to [http://jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc)*

Back in the day (2002-2013), I created a successful suite of Web
Controls for ASP.NET WebForms which featured a complete replacement to
its built-in input validation. I really learned a lot about what website
developers wanted on-screen. In the 10+ years that followed, I've
learned much more in terms of OOP patterns programming, plus TypeScript
came out and JavaScript introduced Classes. Wonderful stuff that I now
use here, in **Jivs**.

Jivs is a suite of libraries, built around its core, **Jivs-engine** and is just the tooling to evaluate values and return a list of issues found. 
> That is the essence of validation! 

Even something sounding that simple can involve a lot of features and behaviors.
That's where Jivs starts to differentiate itself.

Jivs-engine is a "service",
doing that job well, and not trying to provide the actual UI. For that,
add or build companion libraries to match your environment,
such as working in the browser's DOM or React's components. Being a
UI-independent service, you can build your own UI around it, and it can
run both in the browser and Node.js.

As of today, only Jivs-engine is available, and you can extend it as needed. I plan to introduce UI support libraries, and possibly libraries that incorporate third party
libraries of many types, including other schema validation services and internationalization.

> *Peter Blum, .net and web coder since 2002*

## Why Use Jivs?
### Prerequisites:
-	Your app uses JavaScript or TypeScript
-	Your app targets the browser and/or Node.js
-	Your app needs to validate values, whether for user input or Model properties.

### Setting Expectations

- **What Jivs Excels At:** Its forte is value validation. This distinct focus from UI concerns allows for flexible UI development on any framework, such as React, which requires a unique approach to HTML manipulation. We plan to support both standard DOM and React-specific libraries.
- **What Jivs Lacks:** As of this writing, only the core library Jivs-engine is offered. I hope to surround it with UI libraries, and support third party libraries that offer much of the tooling you use.
- **Not Just for Browsers:** Despite seeming browser-centric, server-side validation is critical to prevent tampered data and address server-specific validations. Jivs supports this on Node.js, enabling consistent validation rules across client and server.
- **Code Effort:** While using Jivs involves coding, it’s basically what you would have to write anyway. Some of your coding work with or without Jivs:
	- **Defining validation rules:** Jivs encourages business logic-driven validation, independent of UI. It has a large library of rules already, and makes it easy to add new ones through your code.
	- **Data conversion with a model:** Managing the conversion between model properties and UI representations, like converting a Date object in the model to a string for an \<input> field, is up to you. Jivs doesn't intrude here.
	- **Managing save attempts:** Jivs aids in handling errors, whether from UI or business logic, facilitating the delivery of additional messages and error handling
-  **Coding Style:** Jivs is built using modern OOP patterns. Expect single responsibility objects, dependency injection, and strong separation of concerns.
	- Benefits: 
		- Most aspects of Jivs is expandable due to use of interfaces and dependency injection.
		- Easy to extend the existing business rule objects ("Conditions") to work with special cases, like comparing two Date objects but only by their day of week.
		- UI development is mostly unaware of the validation rules supplied by business logic.
	- Weaknesses:
		- OOP APIs are more demanding on coding. If you want the smallest, tightest code, OOP APIs aren't ideal.
		- It's built using TypeScript and naturally supports your work in TypeScript. If you prefer JavaScript alone, you will not benefit from IDE support when creating objects.

### Features

- Validation rule features:
	-	Validation rules are configurable in the business logic layer, allowing UI widgets to remain unaware of validation rules, but still supply suitable error messages. Jivs notifies UI widgets with validation outcomes.
	-	The UI may introduce its own validation rules too, either to compliment those from business logic or as an alternative to having business logic supply them.
	-	Provides "Condition" objects for a standardized approach to validation, alongside support for custom validation rules, including asynchronous ones. Supplied conditions include: Require, Regular Expression, Range, Compare Two Values, String Length, and Not Null.
	-	Build complex validation rules with the All Match and Any Match Conditions.
	-	Most validation rules come from business logic. The "Data Type Check" is different, a rule that comes from the decisions made about UI widgets. For example, a Date is often entered as a string within a textbox. Jivs automatically applies suitable validation, keeping the UI code free remembering to set it up.
-	Error message features:
	- Localizable
	- Validators have two error messages. The first message, designed for proximity to the UI widget, is succinct, focusing on the issue without field context. The second, intended for a Validation Summary displayed elsewhere on the screen, includes the field name for clarity.
	- You can setup default error message templates, localized of course. This is particularly useful for Data Type Check validations, where distinct data types require specific guidance. For instance, use "Enter a date in the form MM/DD/YYYY" for dates, and "Enter a number using only digits" for numbers.
	- Error messages can contain tokens:
	
		`The {Label} must be between {Minimum} and {Maximum}.`
		- Tokens can show live data.   
		`The current value is {Value}.`
		- Token values are localizable.
		- Token values can select a format.   
		`The {Label:Uppercase} must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}.`
- To help the user experience:
	- Jivs can provide every error message, not just the first one found, ensuring thorough feedback and guidance.
	- When an error has been corrected, Jivs lets you know so the UI can indicate the fix was accepted.
	- When you ask it to validate, there are times that some validators should get skipped for better user experience.
		+ Run form validation after the form is setup can skip the required validators, as it does not make sense to call out errors when the user hasn't had a chance to edit those fields.
		+ Run field validation as the user types. Only these validators make sense to interactively update error messages: Required, regular expression, and string length.
		+ Validators have the "Enabler" feature which is a way to turn themselves off when they no longer need to participate. For example, unless a checkbox is marked, an associated text box will not report errors.
		+ If the user has edited a field and it has yet to be validated, the form reports "do not save", helping prevent form submission without validation.
- Handling submitting data:
	-	The "do not save" feature provides a clear way to write code that prevents unvalidated and invalid data from being submitted.
	-	Business logic must also validate the Model before saving, covering other *use cases*:
		+	Validation must occur on the server side to prevent hacked data coming through the UI. If your server side is run within Node.js, you can include the same code as used on the client.
		+	Any errors found on the server side are expected to be passed up to the client, and Jivs will apply them into the UI. The UI can supply appropriate replacements for any error messages from the server.
		+	Similarly, business logic errors found on the client-side can be passed into Jivs for display in the UI.
- Jivs provides built-in support for common data types—number, string, Boolean, and date—and accommodates unique usage scenarios through extensive customizability:
	- Formatter customization: Tailor how values are displayed to users, with localization. For instance, configure error messages to show dates in an abbreviated format rather than a short date format.
	- Converter customization: Adjust the data under validation to fit various contexts, such as interpreting a JavaScript Date object in multiple ways—anniversary, expiry, total days, date with time, or time alone.
	- Identifier customization: Integrate custom objects to be treated as standard data types, enabling complex comparisons. An object denoting "tomorrow" or "next month" can be identified as a Date for comparison purposes.
	- Comparer customization: Supports Conditions that compare two values so they can handler your non-standard data types. 
- Jivs includes a logging object to help you diagnose issues.
- Almost all objects are based upon interfaces, allowing you to replace them. 
	- Consider switching to your preferred logging, localization, and value-to-string formatting libraries. 
	- Introduce new classes by registering them with factories.
	- Services and factories injected into Jivs classes are replaceable too.

# Learning Jivs
[Jivs source code](https://github.com/plblum/jivs) is heavily and meaningfully commented, and it is all available in TypeDoc format at [jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc). Use this section for an orientation.

## Quick terminology overview
Here are a few terms used.
- **Model** - Industry term for an object that represents a specific piece of data. It often has parallels to what you store in a database as a table. In terms of validation, your app will usually collect all of the data from the user and stick it into a Model. Then the Model is run against business logic to ensure its completely valid before it is stored. Related terms: Entity, Record, and Data Transfer Object (DTO).
- **Property** - A named piece of data found on the Model. Validation is often applied to Properties.
- **Form** – A group of Inputs that is gathering data from the user. It often has buttons to submit the work when completed (but first, it should use validation!). When using the HTML \<form>, your client side does not intend to gather that data into a Model; instead it posts the form contents to the server for Model formation and validation.
- **Input** - Refers to the editor, widget, component where the user edits the data. In HTML, \<input>, \<select>, and \<textarea> tags are examples. Validation is often applied to Inputs.
- **Business Logic** – The code dedicated to describing and maintaining your Model. It provides the validation rules for individual properties and to run before saving. It should be separate from the UI, and Jivs favors that approach.
- **Validator** – Combines a single rule that must be validated along with the error message(s) it may return when an issue is found. Some Validators are specific to an Input or Property; those are the domain of Jivs. Business logic may have Validators that work with the entire Model.
- **ValueHost** – A type of Jivs object that knows the name and value of some data available to the validation system. InputValueHost and PropertyValueHost represent two types that support validation of their values. However, not all values need actual validation. Some hold data like global values and fields from the Model that won't be edited.
	> In fact, you can use Jivs and its ValueHost as your form's **Single Source of Truth** as you convert between the Model/Entity and the UI.

- **Validation Summary** – A UI-specific area that shows error messages found throughout your form.
- **ValidationManager** – A Jivs object; it is main class you interact with. You configure it to know about your form or Model, where ValueHosts are created for each value in the form or Model. 
You will use it to supply data from your Inputs and Properties, to invoke validation, to retrieve a list of issues to display, and to report additional errors determined by your business logic.
- **Input Value** – The raw data from the Input. Often this is a string representing the actual data, but needs to be cleaned up or converted before it can be stored.
- **Native Value** – The actual data that you will store in the Model. Often you have conversion code to move between Native and Input Values. One classic validation error is when your conversion code finds fault in the Input Value and cannot generate the Native Value. This error is what Jivs calls a "Data Type Check".
- **Service** – A class that provides Jivs with dependency injection or a factory. Jivs has you create a master service object, ValidationServices, and connect individual services to it. 

<img src="http://jivs.peterblum.com/images/Class_overview.svg"></img>

## Where you want to use validation

### As focus leaves an Input and its value changed
* Use the onchange event to tell the ValidationManager about the data change and run validation. 
	* You will need to have two values, the raw value from the Input (called the "Input Value") and the resulting value that is compatible with the property on your Model ("Native Value").
	* Use `validationManager.vh.input('name').setValues(native, input, { validate: true});`
* The ValidationManager will notify you about a validation state change through its `onValueHostValidationStateChanged callback`. Implement that callback to update your user interface.

Suppose that you have this HTML:
```ts
<form>
  <input type='text' name='FirstName' id='FirstName' />
     <span class='errorHost' data-for='FirstName'></span>
  <input type='text' name='LastName' id='LastName' />
     <span class='errorHost' data-for='LastName'></span>  
  <button>Submit</button>
</form>
```
This code initializes a ValidationManager and sets up the `onValueHostValidationStateChanged callback`. It should be invoked once and the ValidationManager instance should be accessible to the rest of this form's code.

```ts
let vmConfig: ValidationManagerConfig = {
  services: createValidationServices(),
  valueHostConfigs: ... your configuration for each Input ...
  onValueHostValidationStateChanged: fieldValidated
};
let vm = new ValidationManager(vmConfig);

// Direct validation changes to the HTML elements
// of a specific field, so they can update their appearance
function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
  let fldId = valueHost.getName();
  let editor = document.getElementById(fldId);
  let errorHost = document.querySelector('.errorHost[data-for=' + fldId + ']');
  if (validationState.isValid)
  {
    editor.classList.remove('invalid');
    errorHost.classList.remove('invalid');      
  }
  else
  {
    editor.classList.add('invalid');
    errorHost.classList.add('invalid');      
  }
// remove the current contents then if there are errors to shown, add them
  errorHost.innerHtml = '';
  if (validationState.issuesFound)
  {
    let ul = document.createElement('ul');
    for (let i = 0; i < validationState.issuesFound.length; i++)
    {
      let li = document.createElement('li');
      li.textContent = validationState.issuesFound[i].errorMessage;
      ul.append(li);
    }
    errorHost.append(ul);
  }
}
```
This code sets up the onchange event.
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=>{
  let inputValue = evt.target.value;
  let nativeValue = YourConvertToNativeCode(inputValue);  // return undefined if cannot convert
  vm.vh.input('FirstName').setValues(nativeValue, inputValue, { validate: true });
});
```

### While the user types
Show or hide the error state as the user types. This is limited to Validators that evaluate the raw string, like RequireText, RegExp, and StringLength. Always setup the onchange event (described above) to get all Validators involved.

* Use the oninput event to tell the ValidationManager about the data change and run validation, with its "duringEdit" option set to true.
* The ValidationManager will notify you about a validation state change through its `onValueHostValidationStateChanged callback`.

All of the prior setup still applies. Here we add the oninput event handler:
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('oninput', (evt)=>{
  vm.vm.input('FirstName').setInputValue(evt.target.value, { validate: true, duringEdit: true });
});
```
### When the user submits the data
The ValidationManager should already have all changed values captured due to onchange events on your Inputs. 

Run validation and proceed with submission if data is valid.
```ts
let status = vm.validate(); // it will notify elements in your UI of validation changes
if (status.doNotSave)
  // Prevent saving. User has to fix things
else
  // Submit the page's data
```
### Server side with data submitted from an HTML \<form>
The HTML form data starts as strings. Ultimately, its values should populate a Model, but that requires converting the strings to data types expected by properties on the Model. 

> If your server is Node.js, you can use Jivs to do most of the work.

* Convert each form element into its native value. 
	* Capture all conversion errors. They indicate validation failure, but go through all of the fields first.
	* For any successful conversions, assign them to a Model that you are preparing to save.
* Validate the Model with your business logic. Capture any errors it finds.
* If there are no errors, save the Model.
* With errors, do not save. Instead, supply the captured errors to the client-side to report to the user through Jivs.
* Back on the client-side, gather the errors and create `BusinessLogicError objects` from them. Then call `ValidationManager.setBusinessLogicErrors()`.
```ts
let errors = myServerSideErrors();	// your code
let blErrors: Array<BusinessLogicError> = [];
for (let i = 0; i < errors.length; i++)
{
  let error = errors[i];
  let blError: BusinessLogicError = {
    errorMessage: error.myErrorMessage,
    errorCode: myMapToErrorCode(error), // optional. Try to match up to a known client-side error code or Condition Type to get the UI's error messages
    associatedValueHostName: myMapToValueHostName(error)  // optional. Jivs will update the actual field, not just the ValidationSummary
  };
  blErrors.push(blError);
}

vm.setBusinessLogicErrors(blErrors);	// will notify the UI's validation elements
```
### Server side with data submitted in a Model via API call
Similar to the HTML \<form> except that your Model is already formed with native values, eliminating any of the conversion errors. However, all of the business logic validation rules must still be checked against the native values.

Jump to the previous section and follow the instructions after the conversion steps.

### Showing all errors in a ValidationSummary
The term "ValidationSummary" refers to a location in the UI that offers a consolidated view of all error messages. Aside from how its presented, it is very similar to showing errors specific to one field, except it shows all errors and updates upon any ValueHost's validation.

You need these tools to setup your ValidationSummary:
* An HTML element to host the ValidationSummary.
* A function that responds to the `onValidationStateChanged callback` on the ValidationManager. This function will gather the data and update the ValidationSummary.
* Use the `getIssuesFound()` function on ValidationManager to retrieve those issues.

We've modified the original example to provide a \<div> used for the ValidationSummary. It is shown outside of the \<form> but can be inside, and can be offered in multiple locations too:
```ts
<div class="validationsummary"></div>
<form>
  <input type='text' name='FirstName' id='FirstName' />
     <span class='errorHost' data-for='FirstName'></span>
  <input type='text' name='LastName' id='LastName' />
     <span class='errorHost' data-for='LastName'></span>  
  <button>Submit</button>
</form>
```
This code initializes a ValidationManager and sets up the `onValidationStateChanged callback`. It should be invoked once and the ValidationManager instance should be accessible to the rest of this form's code.

```ts
let vmConfig: ValidationManagerConfig = {
  services: createValidationServices(),
  valueHostConfigs: ... your configuration for each Input ...
  onValueHostValidationStateChanged: fieldValidated,
  onValidationStateChanged: formValidated
};
let vm = new ValidationManager(vmConfig);

function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
  ... shown earlier ...
}
function formValidated(validationManager: IValidationManager, validationState: ValidationState): void
{
  let valSummary = document.querySelector('.validationsummary');
  if (validationState.isValid)
  {
    valSummary.classList.remove('invalid');      
  }
  else
  {
    valSummary.classList.add('invalid');      
  }
// remove the current contents then if there are errors to shown, add them
  valSummary.innerHtml = '';
  if (validationState.issuesFound)
  {
    let ul = document.createElement('ul');
    for (let i = 0; i < validationState.issuesFound.length; i++)
    {
      let li = document.createElement('li');
      li.textContent = validationState.issuesFound[i].errorMessage;
      ul.append(li);
    }
    valSummary.append(ul);
  }

}
```
## Configuring the ValidationManager
Jivs takes this approach to populating the ValidationManager: Create objects that configure each of the pieces into the ValidationManagerConfig object. Then create the ValidationManager with it. Jivs creates all of the actual objects from those simple objects.

Whenever you see "Config" in a type name, it is one of these configuration objects. (ValueHostConfig, ValidationConfig, ConditionConfig, etc.)

<img src="http://jivs.peterblum.com/images/Config_example.svg"></img>

There are a couple of approaches to configuration, based on whether you want to let your business layer define the input and validator rules.

### When starting with business logic
1. UI creates the ValidationManagerConfig object including the services
2. Business logic populates vmConfig.valueHostConfigs. See <a href="#configuringvalidationmanager">"Configuring ValidationManager".</a>
3. With the Builder, UI replaces error messages and labels. 
4. With the Builder, UI adds additional ValueHosts and Validators. 
5. Create the ValidationManager

```ts
let vmConfig: ValidationManagerConfig = {
  services: createValidationServices(),
  valueHostConfigs: []	
};

... business logic code that populates vmConfig.valueHostConfigs goes here ...
// Let the UI update vmConfig with its own textual values and validation rules
let builder = build(vmConfig);
builder.favorUIMessages();
builder.updateInput('StartDate', { label: 'Start date'});
builder.updateValidator('StartDate', ConditionType.LessThan, {
  errorMessage: 'The two dates must be less than {CompareTo} days apart.',
  summaryMessage: 'The Start and End dates must be less than {CompareTo} days apart.'
});

builder.addValidator('EndDate').requireText();
let vm = new ValidationManager(vmConfig);
```
### When UI creates everything (not business logic driven)
1. UI creates the ValidationManagerConfig object including the services
2. With the Builder object, use <a href="#fluentsyntax">fluent syntax</a> to create all ValueHosts and their validators.  
3. Create the ValidationManager

```ts
let vmConfig: ValidationManagerConfig = {
  services: createValidationServices(),
  valueHostConfigs: []	
};

let builder = build(vmConfig);
builder.input('StartDate', LookupKey.Date, { label: 'Start date'} )
  .lessThan('EndDate', null, null, { severity: ValidationSeverity.Severe })
  .lessThan('NumOfDays', { valueHostName: 'DiffDays' }, 'The two dates must be less than {CompareTo} days apart.', 
  { 
    errorCode: 'NumOfDays',
    summaryMessage: 'The Start and End dates must be less than {CompareTo} days apart.'
  });
builder.input('EndDate', LookupKey.Date, { label: 'End date'} ).requireText();

let vm = new ValidationManager(vmConfig);

// if you want to modify the configuration after creation, there are plenty of tools
// for example, add another validator:
vm.vh.input('EndDate').addValidator(fluent().conditions().greaterThanOrEqualValue(new Date()); // must be greater than today
// add another input:
vm.build().input('TimeZone', LookupKey.String).requireText();
```
# Jivs Classes: the API
<a name="apioverview"></a>
## Quick API overview

You will be working with classes and interfaces. Here are the primary pieces to orient you to its API.

-   <a href="#valuehosts">`ValueHost classes`</a> – Identifies a single value to be validated
    and/or contributes data used by the validators. You get and set its value both from a Model and the Inputs (your editor widgets) in the UI.

	+ `InputValueHost class` – For your Inputs, a ValueHost with the power of validation. 
	+ `PropertyValueHost class` – For properties of a Model, a ValueHost with the power of validation. 
	+ `StaticValueHost class` – For values that do not need validating, but support validation rules of InputValueHosts. 
	
	>For example, a postal codes might be validated against a regular expression. But that expression depends on the country of delivery. So you would use a `StaticValueHost` to pass in a country
	code your app is using, and let the validation internally select the right
	expression by retrieving the country code first.
	
	> If you are using a Model, you might also use StaticValueHost for all remaining 	properties on that model. In this scenario, Jivs becomes a *Single Source of Truth* for the model's data while in the UI.
		
	+ `CalcValueHost class` – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days.

-   <a href="#validationmanager">`ValidationManager class`</a> – The "face" of this API. Your validation-related UI elements will need access to it to do their work. It's where you
    configure the `ValueHosts`, get access to a `ValueHost`, validate, and get the validation results.

-   <a href="#conditions">`Condition classes`</a> – Classes that evaluate value(s) against a rule
    to see if those values conform. `Condition classes` exist for each
    business rule pattern, such as *required* or *compare two values are
    not identical*. While there are many standard rules for which there
    are `Conditions` included in this library, you are often going to need
    to build your own.

-   <a href="#validators">`Validator class`</a> – Handle the validation process of a single rule and deliver a list of issues found to the ValidationManager, where your UI elements can consume it.

- <a href="#validationservices">`ValidationServices class` </a> – Provides dependency injection and configuration through a variety of services and factories. This is where much of customization occurs. Here are several interfaces supported by ValidationServices which empower Jivs.
	- `IDataTypeFormatter` – Provides localized strings for the tokens within error messages. For example, if validating a date against a range, your error message may look like this: "The value must be between {Minimum} and {Maximum}." With a Date-oriented DataTypeFormatter (supplied), those tokens will appear as localized date strings.
	- `IDataTypeConverter` – For these use cases:
		+ Changing an object value into something as simple as a string or number for Conditions that compare values. The JavaScript Date object is a good example, as you should use its getTime() function for comparisons.
		+ Changing a value to something else. Take the Date object again. Instead of working with its complete date and time, you may be interested only in the date, the time, or even parts like Month or Hours.
	- There are also `IDataTypeCheckGenerator`, `IDataTypeComparer`, and `IDataTypeIdentifier` to cover some special cases.
	- `ConditionFactory` – Creates the Condition objects used by business rules.

<img src="http://jivs.peterblum.com/images/Class_overview.svg"></img>

Topics:
- <a href="#conditions">Conditions</a>
- <a href="#valuehosts">ValueHosts</a>
- <a href="#validators">Validators</a>
- <a href="#validationmanager">ValidationManager</a>
- <a href="#validationservices">ValidationServices</a>
- <a href="#fluentsyntax">Fluent Syntax</a>
- <a href="#createconditions">Creating your own Conditions</a>
- <a href="#lookupkeys">Lookup Keys: DataTypes and Companion tools</a>
- <a href="#localization">Localization</a>
- <a href="#validationdeepdive">Validation Deep Dive</a>
- <a href="#handlingvalues">Setting and Getting Values</a>

<a name="conditions"></a>
## Conditions - the validation rules
You need to build a class that adapts your validation rules to Jivs own types and classes. Jivs uses the classes that implement the `ICondition interface` to package up a validation rule, and `ConditionConfig type` to inform the `Condition` class how to configure itself. The class is a bridge between business logic and your UI. This section provides the details.

### Separation of concerns: Input Validation vs Business Logic validation

<details>
<summary>This topic should orient the developer on keeping validation logic separate from the UI.</summary>
Jivs wants the app to keep its validation rules in Business Logic separate from UI code. Business logic should have no knowledge of the UI. It operates based on an object called Model or Entity. As you know, properties of objects are completely disconnected from the UI input elements.

> Input Validation’s role is to ensure that the values you move into a Model conform to the business logic, without using existing business logic code that depends on the Model.

Business logic validation code still gets used, but only upon attempting to save into the Model. The user clicks a Save button. The button first checks if there are any remaining input validation errors. If none, you have code that populates a model from the Inputs. That’s when business logic does its own validation. It will save if no issues remain. It will report back issues if any are found. You’ll pass them along to `ValidationManager` to impact the user interface, like showing them in a ValidationSummary widget.

About all the UI developer should know is:
- The identity of the Model’s field, so it can move values between Model and UI.
- The data type of the field. Specifically the property’s data type, like a number, date, Boolean, or complex object. The developer uses that to determine the widget that will edit the value. They also use that to write the code that converts the value between the Model property’s data type and the widget’s data type.
- It is possible that there are validation rules. What they are doesn’t matter. The UI developer can build a widget that shows up when issues are found.
	- There is one case where the UI developer might introduce a validation rule: reporting an issue when their code to convert from widget to Model property fails. Even that is often resolved behinds the scenes in Jivs.
- Provide a common area on screen for consolidation of errors, including those reported by Business Logic. This is referred to as the ValidationSummary.

Someone will code all of those validation rules in a way that Jivs can apply them. Whether it’s done by the UI developer or not, this new code will be separate from the UI code. (And unit tested.) This will likely be the most code you need to write to work with Jivs (or any validation system).
</details>

<a name="configuringconditions"></a>
### Configuring a validation rule in Jivs

You build validation rules using the `Condition` concept. A `Condition` simply packages a function to evaluate data together with a few other properties. Here is its interface:
```ts
interface ICondition {
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
    conditionType: string;
}
```
The `evaluate function` entirely handles the validation rule, and returns a result of `Match`, `NoMatch`, or `Undetermined`.
<details>
<summary>Expand for details on the results.</summary>

- `Match` – Data conformed to the rule
- `NoMatch` – Data violated the rule
- `Undetermined` – Data wasn’t appropriate for evaluation. Example: an empty textbox’s value isn’t ready for a “Compare the input’s date value to Today”. There needs to be text representing a date first.
</details>

Jivs provides numerous `Condition classes`. 
<details>
<summary>Expand to see just a few.</summary>

- `RequireTextCondition`, `NotNullCondition` – for required fields
- `DataTypeCheckCondition`, `RegExpCondition` – for checking the data conforms to the data type.
- `RangeCondition`, `EqualToCondition`, `GreaterThanCondition` – Comparing values
- `AllMatchCondition`, `AnyMatchCondition` - For creating complex logic by using multiple `Conditions`.
</details>

To use them, you need to populate their `ConditionConfig`, which has configuration properties specific to its class. 
> Like all Configs in Jivs, they only have properties, many of which are optional. They are not a classes either. You just create a plain old JavaScript object strongly typed with its interface.

We'll work with this example: Compare a date from the Input to today's date.

The `EqualToCondition` is the right Condition for the job.  You need to create a `EqualToConditionConfig` that Jivs will use later to prepare the `EqualToCondition`. Here's its `ConditionConfig`:
```ts
interface EqualToConditionConfig {
    conditionType: string;
    valueHostName: null | string;
    secondValueHostName: null | string;
    secondValue?: any;
    conversionLookupKey?: null | string;
    secondConversionLookupKey?: null | string;
    category?: ConditionCategory;
}
```
>Where's the error message? A `Condition` is just part of a Validator. The `Validator class` connects your Condition to its error message.

Your new code should look like this, where `ValueHostName` is your identifier for a field on the Model that you call “SignedOnDate”. (More on <a href="#naming">`ValueHost Names`</a> later.)
```ts
{
    conditionType: 'EqualTo';
    valueHostName: 'SignedOnDate';
    secondValue: ...date object representing Today...;
}
```
> A fluent syntax is also part of Jivs. It simplifies manual entry of building conditions and several other objects that will be <a href="#fluentsyntax">shown later</a>. We'll look at it once you have the full picture using these Config objects.

**See also: <a href="#createconditions">Creating your own Conditions</a>**

<a name="bridge"></a>
## Bridging business logic and UI validation

We recommend that you create a Factory-style class that takes your business logic validation information in and returns the appropriate `ConditionConfig` already configured. Let’s suppose that your business logic has a class called BusinessLogicComparer that looks like this:
```ts
class BusinessLogicComparer {
    operator: ConditionOperators; // equals, notequals, etc
    compareTo?: ((date object representing Today));
}
```
Here’s a framework for your new Factory.
```ts
class Factory
{
  create(fieldRef: string, businessLogicRule: any): ConditionConfig
  {
    if (businessLogicRule instanceof BusinessLogicComparer)
      switch (businessLogicRule.operator)
      {
        case ConditionOperators.Equals:
          return <EqualTosConditionConfig>{
            conditionType: 'EqualTo',
            valueHostName: fieldRef,
            secondValue: businessLogicRule.secondValue
          }
      }
  }
}
```
<a name="valuehosts"></a>
## ValueHosts
Every value that you expose to Jivs is kept in a ValueHost. There are several types:

- InputValueHost – For user input. The value may have validation rules applied. It actually keeps two values around when working with a UI: the value fully compatible with the model's property, and the value from within the editor.
- PropertyValueHost – For a property on the Model. The value may have validation rules applied.
- StaticValueHost – The value that is not validated itself, but its value is used in an InputValueHost's validation rule or is a member of the Model that is retained when Jivs is the single-source of truth.
- CalcValueHost – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days. You supply it a function that returns a value, which can be based on other ValueHosts. 

These objects are added to the ValidationManager while configuring. Here is pseudo-code representation of their interfaces (omitting many members).
```ts
interface IValueHost {
    getName(): string;
    getDataType(): null | string;
    getLabel(): string;
    setLabel(label, labell10n?): void;
    getValue(): any;
    setValue(value, options?): void; // value compatible with model's property
    setValueToUndefined(options?): void;
    
    isChanged: boolean;
    saveIntoInstanceState(key, value): void;
    getFromInstanceState(key): undefined | ValidTypesForInstanceStateStorage;
}
interface IInputValueHost extends IValueHost
{
    getInputValue(): any;
    setInputValue(value, options?): void;	// value from the UI's editor
    setValues(nativeValue, inputValue, options?): void;	// both values
    
    validate(options): ValueHostValidateResult;
    isValid: boolean;
    getIssueFound(errorCode): IssueFound | null;
    getIssuesFound(group?): IssueFound[];	
}
interface IPropertyValueHost extends IValueHost
{
    getPropertyName(): string;
    validate(options): ValueHostValidateResult;
    isValid: boolean;
    getIssueFound(errorCode): IssueFound | null;
    getIssuesFound(group?): IssueFound[];	
}
interface IStaticValueHost extends IValueHost
{
}
interface ICalcValueHost extends IValueHost
{
  convert(source, validationManager): number | Date | string | null | undefined;
}
```
<a name="naming"></a>
### Naming each ValueHost
Each ValueHost must have a unique name. Give names to every UI widget that correlates them to the fields of the Model.

In this example, our Model’s property names are used in the input tag’s name attribute.

| Model fields | HTML tag
| ----  | ----
| FirstName | `<input type="text" name="FirstName" />`
| LastName | `<input type="text" name="LastName" />`

Jivs wants those same names for basically the same purpose of correlating with fields in the Model.
<a name="configuringvaluehosts"></a>
### Configuring ValueHosts
When we configure the above Model for Jivs, you can imagine something like this object:
```ts
[
  {
	name: 'FirstName',
	validators: [ condition configs ]
  },
  {
	name: 'LastName',
	validators: [ condition configs ]
  }
]
```
In fact, that’s about right, only with more properties. Those objects are associated with InputValueHosts and the `InputValueHostConfig type` for configuration. 

> Like all Configs in Jivs, ValueHostConfig only has properties, many of which are optional. It is not a class either. You just create a plain old JavaScript object strongly typed with this interface.
```ts
interface ValueHostConfig
{
  valueHostType?: string;
  name: string;
  dataType?: string;
  label?: string;
  labell10n?: string | null;
  initialValue?: any;
}
interface InputValueHostConfig extends ValueHostConfig 
{
  valueHostType: 'Input',	// shown here for documentation purposes
  validatorConfigs: ValidatorConfig[] | null;
  group?: string | Array<string> | null;
}
}
interface PropertyValueHostConfig extends ValueHostConfig 
{
  valueHostType: 'Property',	// shown here for documentation purposes
  validatorConfigs: ValidatorConfig[] | null;
  propertyName?: string
}
interface StaticValueHostConfig extends ValueHostConfig 
{
  valueHostType: 'Static' // shown here for documentation purposes
}
interface CalcValueHostConfig extends ValueHostConfig 
{
  valueHostType: 'Calc', // shown here for documentation purposes
  calcFn: CalculationHandler // a function definition
}
```
Here’s how your configuration actually looks:
```ts
[
  {
    valueHostType: 'Input',
    name: 'FirstName',
    dataType: 'String',
    label: 'First name', // localized, of course!
    validatorConfigs: [ ValidatorConfigs ]
  },
  {
    valueHostType: 'Input',
    name: 'LastName',
    dataType: 'String',
    label: 'Last name',
    validatorConfigs: [ ValidatorConfigs ]
  }
]
```
> Use Jivs' <a href="#fluentsyntax">fluent syntax</a> to avoid typing in these objects.

The `ValueHost` names are also used to help a `Condition` retrieve a value from a `ValueHost`. Suppose that we use the `NotEqualToCondition` on FirstName to compare to LastName. You have to supply the `ValueHost Name` for the LastName field to the condition.
```ts
{
  name: 'FirstName',
  ...
  validatorConfigs: [
    {
      conditionConfig: 
      {
        conditionType: 'NotEqualTo',
        valueHostName: null, // because owning ValueHost is provided automatically to the Condition.evaluate function.
        secondValueHostName: 'LastName'
      }      
      ... and properties covered later ...
    }

  ]
}
```
<a name="gettingvaluehost"></a>
### Getting a ValueHost
Start with a ValidationManager instance. It should already be configured with ValueHosts. Supposing *vm* has that ValidationManager, do this to get a ValueHost:

|Code|Notes|Not found|
|----|-----|---------|
|vm.getValueHost('name')|Base to all ValueHosts|Returns null|
|vm.getValidatorsValueHost('name')|Base to Validatable ValueHosts|Returns null|
|vm.getInputValueHost('name')|InputValueHost|Returns null|
|vm.getPropertyValueHost('name')|PropertyValueHost|Returns null|
|vm.getStaticValueHost('name')|StaticValueHost|Returns null|
|vm.getCalcValueHost('name')|CalcValueHost|Returns null|
|vm.vh.input('name')|InputValueHost|Throws error|
|vm.vh.power('name')|PropertyValueHost|Throws error|
|vm.vh.static('name')|StaticValueHost|Throws error|
|vm.vh.calc('name')|CalcValueHost|Throws error|
|vm.vh.any('name')|Base to all ValueHosts|Throws error|
|vm.vh.validators('name')|Base to all ValueHosts that use the Validator class (InputValueHost and PropertyValueHost)|Throws error|

<a name="calcvaluehost"></a>
### Using CalcValueHost
See a practical example here: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts)

<a name="validators"></a>
## Validators: Connecting Conditions to Error Messages

Validation is really just a process that evaluates some rule and returns a result. If there was an error, the result includes an error message. The `Validator class` handles this work. Here is pseudo-code representation of its interface (omitting many members).
```ts
interface IValidator {
  condition: ICondition;
  errorCode: string;
  conditionType: string;
  validate(options): ValidatorValidateResult | Promise<ValidatorValidateResult>;
  setEnabled(enabled): void;
  setErrorMessage(errorMessage, errorMessagel10n?): void;
  setSummaryMessage(summaryMessage, summaryMessagel10n?): void;
  setSeverity(severity): void;
}
```
<a name="configuringvalidators"></a>
### Configuring Validators
Once again, we use a Config to configure it. 
> Like all Configs in Jivs, ValidatorConfig only has properties, many of which are optional. It is not a class either. You just create a plain old JavaScript object strongly typed with this interface.
```ts
interface ValidatorConfig {
    conditionConfig: null | ConditionConfig;
    conditionCreator?: ((requester) => null | ICondition);
    errorMessage: string | ((host) => string);
    summaryMessage?: null | string | ((host) => string);
    severity?: ValidationSeverity | ((host) => ValidationSeverity);
    enabled?: boolean | ((host) => boolean);
    enablerConfig?: null | ConditionConfig;
    enablerCreator?: ((requester) => null | ICondition);
}
```
> Use Jivs' <a href="#fluentsyntax">fluent syntax</a> to avoid typing in these objects.

Because this is so full of goodness, let’s go through each property.

-	`conditionConfig` – Already described above. See <a href="#configuringconditions">"Configuring Conditions"</a>. 

	It is not the only way to setup a Condition…
-	<a href="#customconditions">`conditionCreator`</a> – Create a Condition by returning an implementation of ICondition. This choice gives you a lot of flexibility, especially when you have some complex logic that you feel you can code up in an evaluate method easier than using a bunch of Conditions.
-	`errorMessage` – A template for the message reporting an issue. Its intended location is nearby the Input, such that you can omit including the field’s label. “This field requires a value”. As a template, it provides tokens which can be replaced by live data. (Discussed later).
-	`summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary. It's normal to include the field label in this message, using the {Label} token: “{Label} requires a value”.
-	`severity` – Controls some validation behaviors with these three values.
	-	`Error` – Error but continue evaluating the remaining validation rules. The default when `severity` is omitted.
	-	`Severe` – Error and do not evaluate any more validation rules for this ValueHost.
	-	`Warning` – Want to give the user some direction, but not prevent saving the data.
-	`enabled` – A way to quickly disable the Validator.
-	`enablerConfig` and `enablerCreator` – The *Enabler* determines if the `Validator` is enabled, using a <a name="#conditions">`Condition`</a>.  Often validation rules depend on other information for that. For example, you have a checkbox associated with a text box. Any validation rule on the text box isn’t used unless the checkbox is marked. You would assign a `Condition` to evaluate the value of the checkbox to the Enabler.

Now let’s place a `ValidatorConfig` into our previous example using a Model with FirstName and LastName.
```ts
[{
  valueHostType: 'Input',
  name: 'FirstName',
  dataType: 'String',
  label: 'First name',
  validatorConfigs: [{
    conditionConfig: {
      conditionType: 'RequireText',
      valueHostName: null
    },
    errorMessage: 'This field requires a value',
    summaryMessage: '{Label} requires a value.',
  },
  {
    conditionConfig: {
      conditionType: 'NotEqualTo',
      valueHostName: null,
      secondValueHostName: 'LastName'
    },
    errorMessage: 'Are you sure that your first and last names are the same?',
    summaryMessage: 'In {Label}, are you sure that your first and last names are the same?',
    severity: 'Warning'
  }]
},
{
  valueHostType: 'Input',
  name: 'LastName',
  dataType: 'String',
  label: 'Last name',
  validatorConfigs: [{
    conditionConfig: {
      conditionType: 'RequireText',
      valueHostName: null
    },
    errorMessage: 'This field requires a value',
    summaryMessage: '{Label} requires a value.',
  }]
}]
```
<a name="validationmanager"></a>
## ValidationManager

With Jivs, the UI uses the `ValidationManager class` to manage the `ValueHosts`, run validation, and get any issues found. All of your UI widgets should have access to the `ValidationManager`, so they can take actions resulting from validation.

Here is pseudo-code representation of its interface (omitting some members).
```ts
interface IValidationManager {
    services: IValidationServices;
    
    getValueHost(valueHostName): null | IValueHost;
    getValidatorsValueHost(valueHostName): null | IValidatableValueHostBase;
    getInputValueHost(valueHostName): null | IInputValueHost;
    vh: ValueHostAccessor;

    validate(options?): ValidationState;
    clearValidation(options?): boolean;
    setBusinessLogicErrors(errors, options?): boolean;
        
    isValid: boolean;
    doNotSave: boolean;
    asyncProcessing?: boolean;
    getIssuesForInput(valueHostName): null | IssueFound[];
    getIssuesFound(group?): null | IssueFound[];
}
```

<a name="configuringvalidationmanager"></a>
### Configuring the ValidationManager
`ValidationManager` needs to be configured first. Much of that work was described in the previous sections that built `ValueHostConfigs`, `ValidatorConfigs`, and `ConditionConfigs`. The configuration is contained in the `ValidationManagerConfig type`.

Here’s pseudo-code for creating the `ValidationManager`.
```ts
let valueHostConfigs = ... copied from previous example ...
let config = <IValidationManagerConfig>{
  services: createValidationServices(),	// alert! Feature needs configuration
  valueHostConfigs: ValueHostConfigs
}
let validationManager = new ValidationManager(config);
// TODO: expose this validationManager to your widgets that need validation
```
Here’s `IValidationManagerConfig type`:
```ts
interface ValidationManagerConfig {
    services: IValidationServices;
    valueHostConfigs: ValueHostConfig[];
    savedInstanceState?: null | ValidationManagerInstanceState;
    savedValueHostInstanceStates?: null | ValueHostInstanceState[];
    onInstanceStateChanged?: null | ValidationManagerInstanceStateChangedHandler;
    onValidationStateChanged?: null | ValidationStateChangedHandler;
    onValueChanged?: null | ValueChangedHandler;
    onInputValueChanged?: null | InputValueChangedHandler;
    onValueHostInstanceStateChanged?: null | ValueHostInstanceStateChangedHandler;
    onValueHostValidationStateChanged?: null | ValueHostValidationStateChangedHandler;
}
```
Let’s go through this type.

-	`services` – Always takes a <a href="#validationservices">`ValidationServices object`</a>, which is rich with services for dependency injection and factories. You will need to do a bunch to configure this, but don’t worry, we have a code snippet to inject into your app to assist. (Described below.)
-	`valueHostConfigs` – Configures each ValueHost. This is where a majority of the setup work goes. See <a href="#configuringvaluehosts">"Configuring ValueHosts"</a>.
-	`savedInstanceState` and `savedValueHostInstanceStates` – `ValidationManager` knows how to offload its stateful data to the application. If you want to retain state, you’ll capture the latest states using the `onInstanceStateChanged` and `onValueHostInstanceStateChanged` events, and pass the values back into these two Config properties when you recreate it.
-	`onInstanceStateChanged` and `onValueHostInstanceStateChanged` must be setup if you maintain the states. They supply a copy of the states for you to save.
-	`onValueChanged` notifies you when a `ValueHost` had its value changed.
-	`onInputValueChanged` notifies you when an `InputValueHost` had its Input Value changed.
-	`onValidationStateChanged` and `onValueHostValidationStateChanged` notifies you after a `validate function` completes, providing the results.
<a name="validationservices"></a>
## ValidationServices
The `ValidationServices class` supports the operations of Validation with services and factories, which of course means you can heavily customize Jivs through the power of interfaces and dependency injection.

`ValidationServices` is where we register new `Conditions` and classes to help work with all of the data types you might have in your Model. None of those classes are prepopulated (so that you are not stuck with classes that you won't use). So let’s get them setup.

Go to [https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts](https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts)

Add the contents of this file to your project. You will likely need to regenerate the list of inputs as your project source may be NPM. It results in several new functions starting with this one.
```ts
export function createValidationServices(): ValidationServices {
…
}
// also many register() functions plus configureCultures() and createTextLocalizationService
```
Once it compiles, you can edit as needed, although initially leave most of the classes it registers alone, so you can start using the system.

Now that you have the `createValidationServices function`, use it during `ValidationManager` configuration.
```ts
let valueHostConfigs = ... array that configures ValueHosts ...
let config = <IValidationManagerConfig>{
  services: createValidationServices(),	// use it here
  valueHostConfigs: ValueHostConfigs
}
let validationManager = new ValidationManager(config);
```
<a name="fluentsyntax"></a>
## Fluent syntax
If you are typing in those Config objects, you are probably not happy. Config objects are meant for code that transcribes your business logic rules into them.

Jivs comes with a fluent syntax to simplify the manual configuration work.
Here's how the example with FirstName and LastName properties looks with this syntax.
```ts
let vmConfig = <IValidationManagerConfig>{
  services: createValidationServices(),
  valueHostConfigs: []
}
let builder = build(vmConfig);
builder().input('FirstName', 'String', { label: 'First Name' })
   .requireText(null, 'This field requires a value', { summaryMessage: '{Label} requires a value.')
   .notEqualTo('LastName', 'Are you sure...', { summaryMessage: 'In {Label}, are you sure...');
builder.input('LastName', 'String', { label: 'Last Name'})
   .requireText(null, 'This field requires a value', { summaryMessage: '{Label} requires a value.' );
   //NOTE: Error messages can be omitted if you set them up in the TextLocalizationService
   // or let the UI developer attach them later.
   
let validationManager = new ValidationManager(vmConfig);   
```
You can also use the builder object to add PropertyValueHosts, StaticValueHosts, CalcValueHosts, and a list of Conditions to these Conditions: All, Any, CountMatches.

```ts
builder.static('PersonVisible', 'Boolean');
builder.static('PersonActive', 'Boolean');
builder.property('Name').any(
     builder.conditions()
     	.equalTo(true, { valueHostName: 'PersonVisible'})
        .equalTo(true, { valueHostName: 'PersonActive'}));
builder.calc('DiffInDays', 'Integer', diffInDaysFunctionCallback);        
```
If you already have a validationManager instance, the builder is available on its build() method.
```ts
validationManager.build().static('PersonVisible', 'Boolean');
validationManager.build().static('PersonActive', 'Boolean');
validationManager.build().property('Name').any(
     builder.conditions()
     	.equalTo(true, { valueHostName: 'PersonVisible'})
        .equalTo(true, { valueHostName: 'PersonActive'}));
validationManager.build().calc('DiffInDays', 'Integer', diffInDaysFunctionCallback);         
```
<a name="lookupkeys"></a>
## Lookup Keys: Data Types and Companion Tools
To really do the job well, Jivs wants to know specific data types associated with each Model property. You've seen the property "dataType" when configuring a ValueHost.
```ts
interface ValueHostConfig
{
  name: string;
  dataType?: string;
	... other properties omitted ...
}

let firstNameConfig = <ValueHostConfig>{
  valueHostType: 'Input',
  name: 'FirstName',
  dataType: 'String',
  validatorConfigs: [ ValidatorConfigs ]
  ... other properties omitted ...
};

```
You *must* assign dataType to the name of a data type when the data is not a string, boolean, number or Date, and *should* assign it for those types when you need to be more precise, such as an "EmailAddress" instead of just "String".

We use the term "Lookup Key" when specifying the name of a data type. Please [see this page](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html) for a detailed look at all supplied with Jivs and how they are used.

A Lookup Key is very powerful! It connects up with these behaviors:
- <a href="#datatypeidentifier">Identifiers</a>
- <a href="#datatypeconverter">Converters</a>
- <a href="#datatypeformatter">Formatters</a>
- <a href="#datatypecomparer">Comparers</a>
- <a href="#datatypecheckgenerator">DataTypeCheckGenerators</a>

Let's look at each.
<a name="datatypeidentifier"></a>
### Identifiers
You can leave the dataType property blank and Jivs will identify its name for you with implementations of `IDataTypeIdentifier`. These come preinstalled: "String", "Number", "Boolean", and "Date" (Date object using only the date part in UTC).

Add your own when you have a class representing some data. Check out an actual example [here](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts). In this example, we have a new class, RelativeDate. We've created a new Lookup Key name called "RelativeDate" and associated it with a new DataTypeIdentifier.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypeconverter"></a>
### Converters
Change the value supplied to Conditions with implementations of `IDataTypeConverter`.

Consider these *Use Cases*:
- Provide case insensitive string matching by converting to lowercase. We've included a Converter for that, with "CaseInsensitive" as its Lookup Key. In this case, the Lookup Key should not be assigned to the ValueHost because its limited to the Condition. Many ConditionConfigs have conversionLookupKey and secondConversionLookupKey properties where you assign the Lookup Key. 

	Here is the NotEqualToCondition configured with CaseInsensitive:
	```ts
	{
	  valueHostType: 'Input',
	  name: 'FirstName',
	  dataType: 'String',
	  label: 'First name',
	  validatorConfigs: [ 
	  	{
	  	  conditionConfig: 
	  	  {
	  	    conditionType: 'NotEqual',
	  	    secondValueHostName: 'LastName',
	  	    conversionLookupKey: 'CaseInsensitive',
	  	    secondConversionLookupKey: 'CaseInsensitive'
	  	  }
	  	}
	  ]
	},
	```
- Changing a Date object into something other than a Date+Time. You may be interested only in the date, the time, or even parts like Month or Hours. 
	
	Jivs includes these converters: "Date" (UTC date only), "LocalDate" (local date only), "TimeOfDay" (omits seconds), "TimeOfDayHMS" (includes seconds).
	
	We also have examples that introduce Month/Year [here](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/MonthYearConverter.ts) and Month/Day [here](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/AnniversaryConverter.ts).
	
	These Lookup Keys are usually assigned to the dataType property on the ValueHost.
- Perhaps you want to compare the difference in days between two dates. For that you need to convert a Date object into a number – the number of days since some fixed point. 
	
	Jivs includes the "TotalDays" Lookup Key and converter. Use it on a ConditionConfig.
- Changing your own class (already setup with an Identifier) into something as simple as a string, number, or Date also requires a Converter. You will see how in [the RelativeDate class example](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts) and also in an example built around [a TimeSpan class](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts).
- Additional converters already supplied with these Lookup Keys: "Integer" (uses Math.round), "Uppercase", "Lowercase".
- Suppose that you have a class "FullName" with properties of FirstName and LastName. Create a converter to return a string that is both concatenated.
- Suppose that you have a class "StreetAddress" with properties of Street, City, Region, PostalCode. Create a converter to return just the postal code.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypeformatter"></a>
### Formatters
Formatters provide localized strings for the tokens within error messages with implementations of `IDataTypeFormatter`. For example, if validating a date against a range, your error message may look like this: 

`"The value must be between {Minimum} and {Maximum}."`

Formatters initially use the Lookup Key from the ValueHost.dataType. So if you assigned dataType="Date", expect the short date format. 

`"The value must be between 12/31/1999 and 12/31/2005."`

To override it, such as using the abbreviated date format, include the Lookup Key within the token like this:
	
`"The value must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}."`

`"The value must be between Dec 31, 1999 and Dec 31, 2005."`

Jivs provides these formatters: "ShortDate", "AbbrevDate", "AbbrevDOWDate" (adds day of week), "LongDate", "LongDOWDate" (adds day of week), "TimeOfDay" (omits seconds), "TimeOfDayHMS", "Integer", "Currency", "Percentage" (where 1.0 = 100%), "Percentage100" (where 100 = 100%), "Uppercase", "Lowercase", "Boolean" (say "True" and "False" for boolean values) and "YesNoBoolean" (say "Yes" or "No" for boolean values).

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypecomparer"></a>
### Comparers
Staying with the "single responsibility pattern", Jivs recommends that you use its comparison Conditions (Range, Equal, NotEqual, LessThan, etc) for all data types. It already knows how to handle comparing strings, numbers, dates and booleans. It does so with implementations of IDataTypeComparer. It also uses the Converters to get a Date, number or string from the value. So its pretty unusual to need to provide your own Comparer class. But its here if you need it.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypecheckgenerator"></a>
### DataTypeCheckGenerator
In Jivs, "Data Type Check" means a Condition that can determine if the data supplied is fully compatible with what the model property intended. 

Jivs provides the DataTypeCheckCondition, and it handles many cases simply by checking if the Input value (from the UI editor) was successfully converted to the native value. For example, converting a date string "31-May-2030" into a Date object. As a rule, when that conversion fails, Jivs expects you to call `ValueHost.setValueToUndefined()`. DataTypeCheckCondition reports an error only when Input value is assigned and native value is undefined.
	
DataTypeCheckCondition doesn't apply when no conversion is required. Strings are a great example of a native value that doesn't require conversion. Strings represent all kinds of data. For example, an email address or a phone number. For these cases, create a Lookup Key ("EmailAddress", "PhoneNumber") and implement a `IDataTypeCheckGenerator `that supplies a regular expression to validate the string.
	
Take a look at [this example for Email Address](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts).

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="createconditions"></a>
## Creating your own Conditions
Jivs provides many `Condition classes`, covering typical cases. All classes implement the `ICondition interface`.
```ts
interface ICondition {
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
    conditionType: string;
}
```
As you can see, all require that you supply a **conditionType** value. That’s a unique name for you to specify.

There are several ways to add your conditions.
### Reusable classes
All Condition classes supplied within jivs-engine are registered with the ConditionFactory, which uses the ConditionConfig (describes rules specific to the condition) to know which class to create.

Once created, go to the `registerConditions() function` that is [part of the startup code](#validationservices) and add it like this:
```ts
export function registerConditions(cf: ConditionFactory): void
{
   ... existing conditions...
	cf.register<myConditionConfig>(
   		'MyConditionType', (config) => new MyCondition(config));
}

```
You can also extend the fluent syntax to support it.


Here are two ways to start:
- Subclass from an existing `Condition class`. Choose when you want to make a minor modification or want to preconfigure [the existing class](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/Conditions/ConcreteConditions.ts).
	```ts
	export class MyCondition extends RegExpCondition 
	{
	   constructor(config: IRegExpConditionConfig)
	   {
	      super({ 
	         ...config, 
	         ...{ expressionAsString: '^\\d\\d\\d\\-\\d\\d\\d\\d$'} 
	      });
	   }
	   public get conditionType(): string { return 'MyConditionType'; }
	}
	```
See this sample code for more: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts)
- Subclass from an [abstract `Condition class`](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Conditions) designed for the type of `Condition` you need. The abstract classes provide some useful methods to take advantage of. They also require a `ConditionConfig interface`, which means you can get additional values from the user passed in.
	```ts
	export interface MyConditionConfig extends RegExConditionBaseConfig
	{
	   allowTwo?: boolean; // true means pattern is repeated with a comma separator
	}
	
	export class MyCondition extends RegExpConditionBase<MyConditionConfig>
	{
	   protected getRegExp(valueHostResolver: IValueHostResolver): RegExp
	   {
	      const base = @'\d\d\d\-\d\d\d\d';
	      if (this.config.allowTwo)
	         return new RegExp('^' + base + '(\,\s?' + base + ')?$');
	      return new RegExp('^' + base + '$');
	   }
	   public get conditionType(): string { return 'MyConditionType'; }
	}
	```
See this sample code for more: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/PositiveNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/PositiveNumberCondition.ts)
<a name="customconditions"></a>
### One-off conditions
Choose one of the methodologies below. When establishing the InputValueHost with your condition, it goes here:
```ts
{
  valueHostType: 'Input',
  name: ...,
  validatorConfigs: [{
    conditionCreator: (requester) => ...create your object here...
    errorMessage: ...,
  }]
}
```
The [fluent syntax](#fluentsyntax) for this is:
```ts
let fieldNameConfig = config().input('fieldname')
	.customRule(
		(requester)=> ...create your object here..., 
		'optional error message', 
		{ ...optional additional parameters });
```
- Create a plain JavaScript object that matches the `ICondition interface` contract. This is often used for one-off logic.
	```ts
	let myCondition = <ICondition>{
	   evaluate: (valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> =>
	   {
	   // evaluate the value(s) and return a ConditionEvaluateResult
	   },
	   category: 'Content';
	   conditionType: 'MyConditionType';
	}
	```
- Implement directly from `ICondition` as a class
	```ts
	export class MyCondition implements ICondition 
	{
	   public evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>
	   {
	   // evaluate the value(s) and return a ConditionEvaluateResult
	   },
	   public get category(): string { return 'Content'; }
	   public get conditionType(): string { return 'MyConditionType'; }
	}
	```	

### Additional considerations
- Look here for source code to the concrete conditions we’ve supplied:
[https://github.com/plblum/jivs/blob/main/src/Conditions/ConcreteConditions.ts](https://github.com/plblum/jivs/blob/main/src/Conditions/ConcreteConditions.ts)
- Look here for source code to abstract conditions and the factory:
[https://github.com/plblum/jivs/tree/main/src/Conditions](https://github.com/plblum/jivs/tree/main/src/Conditions)
- Return `Undetermined` when unsupported data is found. For example, if you are evaluating only against a string, test `typeof value === 'string'` and return `Undetermined` when false.
- Always write unit tests.
- `conditionType` should be meaningful. Try to limit it to characters that work within JSON and code, such as letters, digits, underscore, space, and dash. Also try to keep it short and memorable as users will select your Condition by specifying its value in the Configs passed into the `ValidationManager`.
- `conditionType` values are case sensitive.
- You may be building replacements for the Condition classes supplied in Jivs especially if you prefer a third party's validation schema code. In that case, implement the `IConditionFactory interface` to expose your replacements. Always attach your factory to the `ValidationServices class` in the `createValidationServices function`.

### Adding your new Condition class to fluent syntax
See this example: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/PositiveNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/PositiveNumberCondition.ts)

## Localization
Any text displayed to the user and any input supplied from them is subject to localization. Jivs is localization-ready with several tools. There are third party tools that may do the job more to your liking, and they can be swapped in by implementing the correct interfaces.

### Localizing strings
Here are a few places you provide user-facing strings into Jivs:
- ValueHostConfig.label
- ValidatorConfig.errorMessage and summaryMessage

Each of those properties have a companion that ends in "l10n" (industry term for localization), such as labell10n. Use the l10n properties to supply a Localization Key that will be sent to Jivs `TextLocalizationService`. If that service has the appropriate data, it will be used instead of the usual property.

`TextLocalizationService` is available on `ValidationManager.services.textLocalizationService`. Add localization content within the `createTextLocalizerService() function` [that was added here](#validationservice).

To replace it with a third party text localization tool, implement `ITextLocalizationService` and assign it in the `createTextLocalizerService() function`.

#### Setup for a label
Let's suppose that you have a label "First Name" which you want in several languages.
1. Create a unique Localization Key for it. We'll use "FirstName".
2. Assign both label and labell10n properties during configuration.
	```ts
	{
	  valueHostType: 'Input',
	  name: 'FirstName',
	  label: 'First Name',
	  labell10n: 'FirstName'
	}
	... or using fluent syntax ...
	config().input('FirstName', null, { label: 'First Name', 'labell10n': 'FirstName' })
	```
3. Add an entry to the `createTextLocalizerService() function` like this:
	```ts
	export function createTextLocalizerService(): ITextLocalizerService
	{
	    let service = new TextLocalizerService();
	    ...
	    service.register('labell10n', {
	        '*': 'First Name', // fallback
	        'en': 'First Name',
	        'es': 'nombre de pila',
	        'fr': 'prénom'
	    });
	}
	```
	
#### Setup for errorMessage and summaryMessage properties
Jivs generates specific Localization Keys based on the ConditionType.
For error message, "EM-*ConditionType*-*DataTypeLookupKey*" and a fallback "EM-*ConditionType*". Example using RangeCondition for an Integer Lookup Key: "EM-Range-Integer" and "EM-Range".
For summary message, "SEM-*ConditionType*-*DataTypeLookupKey*" and a fallback "SEM-*ConditionType*".

When using the supplied TextLocalizerService, you won't need to know those Lookup Keys. Instead, you can call its `registerErrorMessage()` and `registerSummaryMessage()`.

The existing `createTextLocalizerService() function` already has numerous examples. For example:
```ts
    service.registerErrorMessage(ConditionType.RequireText, null, {
        '*': 'Requires a value.'
    });
    service.registerSummaryMessage(ConditionType.RequireText, null, {
        '*': '{Label} requires a value.'
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
    });        
```
So review and edit the `createTextLocalizerService() function`.

### Localizing error message tokens
Error messages use tokens to insert values at runtime. When the value is a number, date or boolean, those must be localized. Jivs already does this within its <a href="#datatypeformatter">DataTypeFormatter classes</a>.

The supplied classes use [JavaScript's own Intl class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) to handle dates, times, and numbers. It uses [toLocaleLowerCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase) and [toLocaleUpperCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) for those situations. These classes are adequate but you may prefer using a richer third party library.

To switch, you need to replace the specific DataTypeFormatter classes that are not ideal and register your replacements using the original Lookup Key. See the existing DataTypeFormatter classes [here](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts).

For example, LongDateFormatter uses Intl to format with full month name. It's Lookup Key is "LongDate". Here is a framework to replace it.
```ts
export class MyLongDateFormatter extends DataTypeFormatterBase
{
  protected get expectedLookupKeys(): string | Array<string>
  {
    return LookupKey.LongDate;
  }
  protected supportsCulture(cultureId: string): boolean
  {
    return true; // only return false if you know the culture does not apply
  }
  public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
    if (value instanceof Date)
    {
    // do the work
    	  let formatted: string = ... code to handle the localized formatted date...
      return { value: formatted };
    }
    return { errorMessage: 'Not a date' };
  }	
}
```
Then register it within registerDataTypeFormatters() where you added the <a href="#validationservices">`createValidationService() function`</a>, replacing the existing "LongDateFormatter" Lookup Key.
```ts
export function registerDataTypeFormatters(dtfs: DataTypeFormatterService): void
{
...
    dtfs.register(new MyLongDateFormatter()); 
...
}    
```
<a name="validationdeepdive"></a>
## Validation Deep Dive
### What invokes validation
Both the ValidationManager and validatable ValueHosts have a `validate()` function, as described in the next two sections.
#### ValueHost.validate()
When a ValueHosts' value changed, call its `validate()` function or pass the `{ validate: true }` option into the `setValue()` (and related) function.

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchanged', (evt)=>{
  let inputValue = evt.target.value;
  let nativeValue = YourConvertToNativeCode(inputValue);  // return undefined if cannot convert
  let valueHost = vm.vh.input('FirstName');	// or vm.getInputValueHost('FirstName')
  valueHost.setValues(nativeValue, inputValue);
  valueHost.validate();
});	
firstNameFld.attachEventListener('oninput', (evt)=>{
  let valueHost = vm.vh.input('FirstName');	// or vm.getInputValueHost('FirstName')
  valueHost.setInputValue(evt.target.value);
  valueHost.validate({ duringEdit: true });
});
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
These properties are all related to ValueHost value changes:
- duringEdit - Set to true when handling oninput events, or any other validation that needs to happen as the user types. Only a few validators will respond, including RequireTextCondition, RegExpCondition, and StringLengthCondition.
- skipCallback - Set to true if you have a reason to skip the `onValueHostValidationStateChanged callback` normally invoked by `validate()`.

The `setValue()`, `setValues()`, `setInputValue()`, and `setValueToUndefined()` functions all take an *options* parameter to include validation, saving a step:

```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchanged', (evt)=>{
  let inputValue = evt.target.value;
  let nativeValue = YourConvertToNativeCode(inputValue);  // return undefined if cannot convert
  vm.vh.input('FirstName').setValues(nativeValue, inputValue, { validate: true });
});	
firstNameFld.attachEventListener('oninput', (evt)=>{
  vm.vh.input('FirstName').setInputValue(evt.target.value, { validate: true, duringEdit: true });
});
```
Here is the type for the *options* parameter:
```ts
interface SetValueOptions {
    validate?: boolean;
    duringEdit?: boolean;
    reset?: boolean;
    conversionErrorTokenValue?: string;
    skipValueChangedCallback?: boolean;
}
```
These properties are all related to validation:
- validate - When true, invoke validation but only if the value changed.
- reset - When true, change the state of the ValueHost to unchanged and validation has not been attempted. 
- conversionErrorTokenValue - Provide an error message related to parsing from the Input Value into native value. This message can be shown when using DataTypeCheckCondition, by using the {ConversionError} token in its error message:
	```ts
	let firstNameFld = document.getElementById('FirstName');
	firstNameFld.attachEventListener('onchanged', (evt)=>{
	  let inputValue = evt.target.value;
	  let [nativeValue, errorMessage] = YourConvertToNativeCode(inputValue);  
	  vm.vh.input('FirstName').setValues(nativeValue, inputValue, { validate: true, conversionErrorTokenValue: errorMessage });
	});	
	
	// set up the DataTypeCheckCondition's error message (local to this form)
	let original = vm.services.textLocalizationService as TextLocalizationService;
	let tls = new TextLocalizerService();
    tls.fallbackService = original.textLocalizerService;
    vm.services.textLocalizerService = tls;
	
	tls.service.registerErrorMessage(ConditionType.DataTypeCheck, null, {
      '*': 'Input error: {ConversionError}.' 
    });
    tls.registerSummaryMessage(ConditionType.DataTypeCheck, null, {
      '*': '{Label} has this error: {ConversionError}.'
    });    
	```

#### ValidationManager.validate()
Prior to submitting or any time you want to validate the entire form, use `validate()` on ValidationManager.
```ts
let status = vm.validate(); // it will notify elements in your UI of validation changes
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
These properties are all related to ValidationManager validation:
- group - Group validation is a tool to group validatable ValueHosts with a specific submit command when validating. If used, it needs a name assigned here and on ValueHosts that it targets. See their ValueHostConfig.group property. The name matching is case insensitive.

	Use when there is more than one group of validatable ValueHosts to be validated together.
	
	For example, the ValidationManager handles two forms at once. Give the ValueHostConfig.group a name for each form. Then make their submit command
	pass in the same group name.
	
- preliminary - Set to true when running a validation prior to a submit activity.
Typically used just after loading the form to report any errors already present.
When set, the RequireTextCondition is not checked as the user doesn't need
the noise complaining about missing input when they haven't had a chance to address it.
- skipCallback - Set to true if you have a reason to skip the `onValidationStateChanged callback` normally invoked by `validate()`.


### Current validation state on valuehost
Your user interface depends on knowing the state of validation. Has validation reported an error or not? Each validatable ValueHost has is own state that is found amongst several of its properties and functions.
- `isValid`
- `doNotSave`
- `status`
- `getIssuesFound()`
- `asyncProcessing`

*See the details of ValueHostValidationState below for more on these.*

However, its usually better to setup the `onValueHostValidationStateChanged callback` (on ValidationManagerConfig) and let it pass you this informative object:
```ts
interface ValueHostValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
    status: ValidationStatus;
}
```
Here is an example of using `onValueHostValidationStateChanged callback`.
```ts
let vmConfig: ValidationManagerConfig = {
  services: createValidationServices(),
  valueHostConfigs: ... your configuration for each Input ...
  onValueHostValidationStateChanged: fieldValidated
};
let vm = new ValidationManager(vmConfig);

// Direct validation changes to the HTML elements
// of a specific field, so they can update their appearance
function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
  let fldId = valueHost.getName();
  let editor = document.getElementById(fldId);
  let errorHost = document.querySelector('.errorHost[data-for=' + fldId + ']');
  if (validationState.isValid)
  {
    editor.classList.remove('invalid');
    errorHost.classList.remove('invalid');      
  }
  else
  {
    editor.classList.add('invalid');
    errorHost.classList.add('invalid');      
  }
// remove the current contents then if there are errors to shown, add them
  errorHost.innerHtml = '';
  if (validationState.issuesFound)
  {
    let ul = document.createElement('ul');
    for (let i = 0; i < validationState.issuesFound.length; i++)
    {
      let li = document.createElement('li');
      li.textContent = validationState.issuesFound[i].errorMessage;
      ul.append(li);
    }
    errorHost.append(ul);
  }
}
```

Let's go through `ValueHostValidationState` properties:
- status - Each ValueHost has status codes related to validation. Several reflect the state before validation is even attempted.
	+ NotAttempted - So far, the value has not been changed and validation has not occurred.
	+ NeedsValidation - The value has been changed and needs validation.
	+ Undetermined - Validation occurred but the Condition could not make a determination of Match or NoMatch. 
	
	> Neither `isValid` nor `doNotSave` deal with a status of Undetermined. Undetermined indicates that the validators are incorrectly setup, such as you have a validator that expects a date, but are supplying a number. So this status should be addressed while in development.
	+ Invalid - Validation occurred and the Condition reported NoMatch. Thus the value is invalid.
	+ Valid - Validation occurred and the Condition reported Match. Thus the value is valid.
- isValid - When true, the data appears to be valid. However, `isValid` is only false when there was an explicit `status` of *Invalid*. Statuses like *Undetermined* and *NotAttempted* are true as far as `isValid` is concerned. As a result, it's better to check `doNotSave` to know if you can submit the data.
- doNotSave - Determines if a validator doesn't consider the ValueHost's value ready to save. It is true when `status` is *Invalid* or *NeedsValidation*. It is also true when `asyncProcessing` is true.
- issuesFound - An array of all issues found or null when there are no issues found. See below for more on the `IssueFound type`.
- asyncProcessing - When evaluating an asynchronous Condition, validation will return before it is done, with the results from the rest of the Conditions. `asyncProcessing` is true at this moment, and until all asynchronous Conditions are finished. Expect `onValueHostValidationStateChange callbacks` after the validation runs, and after each async Condition finishes, giving you the latest validation state.

<a name="issuefound"></a>
Here is the `IssueFound type`, which is supplied in the issuesFound array above:
```ts
interface IssueFound {
    valueHostName: string;
    errorCode: string;
    severity: ValidationSeverity;
    errorMessage: string;
    summaryMessage?: string;
}
```
Going through its properties:
- valueHostName - The name of the ValueHost supplying this IssueFound.
- errorCode - The error code from the Validator supplying this IssueFound. Error codes default to the ConditionType value used to select the Condition, but can be supplied as you configure the Validator in ValidatorConfig.errorCode.
- severity - The severity: Severe, Error, or Warning. When Warning, the value is considered valid, but you wanted to show the user some message anyway.
- errorMessage - The error message, fully localized and prepared to display.
- summaryMessage - The error message that targets the ValidationSummary. 


### Current validation state on ValidationManager
The ValidationManager has similar functions to those on validatable ValueHosts, only it is a consolidated represention from the ValueHosts. The validation state is used prior to submitting the data and by the ValidationSummary as the state changes.

ValidationManager's validation state is found amongst several of its properties and functions.
- `isValid`
- `doNotSave`
- `asyncProcessing`
- `getIssuesFound()`

*See the details of ValidationState below for more on these.*

When you need notifications as it changes, its setup the `onValidationStateChanged callback` (on ValidationManagerConfig) and let it pass you this informative object:
```ts
interface ValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
}
```
Here is an example of using `onValidationStateChanged callback`.
```ts
let vmConfig: ValidationManagerConfig = {
  services: createValidationServices(),
  valueHostConfigs: ... your configuration for each Input ...
  onValueHostValidationStateChanged: fieldValidated,
  onValidationStateChanged: formValidated
};
let vm = new ValidationManager(vmConfig);

function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
  ... shown earlier ...
}
function formValidated(validationManager: IValidationManager, validationState: ValidationState): void
{
  let valSummary = document.querySelector('.validationsummary');
  if (validationState.isValid)
  {
    valSummary.classList.remove('invalid');      
  }
  else
  {
    valSummary.classList.add('invalid');      
  }
// remove the current contents then if there are errors to shown, add them
  valSummary.innerHtml = '';
  if (validationState.issuesFound)
  {
    let ul = document.createElement('ul');
    for (let i = 0; i < validationState.issuesFound.length; i++)
    {
      let li = document.createElement('li');
      li.textContent = validationState.issuesFound[i].errorMessage;
      ul.append(li);
    }
    valSummary.append(ul);
  }

}
```

Let's go through ValidationState properties:
- isValid - When true, the value appears to be valid. However, it's only false when there was an explicit `status` of *Invalid* within at least one ValueHost. It's better to check `doNotSave` to know if you can submit the data.
- doNotSave - Determines if any ValueHost doesn't consider its value ready to save. It is true when the ValueHost validation `status` is *Invalid* or *NeedsValidation*. It is also true when `asyncProcessing` is true.
- issuesFound - An array of all issues found or null when there are no issues found. See the <a href="issuefound">previous section</a> for details on the IssueFound type that populates this array.
- asyncProcessing - When evaluating an asynchronous Condition, validation will return before it is done, with the results from the rest of the Conditions. `asyncProcessing` is true at this moment, and until all asynchronous Conditions are finished. Expect `onValueHostValidationStateChange callbacks` after the validation runs, and after each async Condition finishes, giving you the latest validation state.

### Actions that change the validation state
All of these actions can change the validation state whether on ValidationManager or a ValueHost. However, you will only be notified through `onValidationStateChanged` and `onValueHostValidationStateChanged` if the state actually changed.
- `validate()`
- `clearValidation()`
- `setBusinessLogicError()`
- `clearBusinessLogicErrors()`
- using any of these with the { validate: true} option as a parameter: `setValue()`, `setValues()`, `setInputValue()`, `setValueToUndefined()`.
- An asynchronous Condition just finished

<a name="handlingvalues"></a>
## Setting and getting values
Validation rules work against the inputs from the user, the properties from the model, and other sources of data. The ValueHost classes are built for each of those approaches (InputValueHost, PropertyValueHost, StaticValueHost, etc).

Without the actual values, you cannot validate. This section covers ways to supply values to Jivs and to retrieve them when needed.

### Setting values
You will set values as you initialize the ValidationManager and as the values are changed. Most of the time, you will use `valueHost.setValue()` and `valueHost.setValueToUndefined()`. 
```ts
setValue(value: any, options?: SetValueOptions): void;
setValueToUndefined(options?: SetValueOptions): void;
```
Use `setValueToUndefined()` (or call `setValue(undefined)`) to indicate that the value cannot be determined. For example, the user's input could not be converted into its native data type.

In this example, *vm* is the ValidationManager.
```ts
let lastNameVH = vm.getValueHost("LastName");
lastNameVH.setValue("MyValue");
// or
vm.vh.any("LastName").setValue("MyValue");
```
> See <a href="#gettingvaluehost">"Getting a ValueHost"</a> for using `getValueHost()` and `vm.vh`.

When called, the ValueHost will consider the value "changed" and its `status` becomes *NeedsValidation*. When initializing the value, modify the code as shown here to avoid changing the status:
```ts
let lastNameVH = vm.getValueHost("LastName");
lastNameVH.setValue("MyValue", {reset: true});
// or
vm.vh.any("LastName").setValue("MyValue", {reset: true});
```
When initializing the ValidationManager, you supply a ValueHostConfig for each ValueHost. That type includes an *initialValue* property where you can send in the same value.
```ts
let lastNameConfig: InputValueHostConfig = {
  valueHostType: ValueHostType.Input,
  name: 'LastName',
  dataType: LookupKey.String,
  initialValue: 'MyValue'
};
let vmConfig: ValidationManagerConfig = {
  services: createValidationServices(),
  valueHostConfigs: [ lastNameConfig ]
};
let vm = new ValidationManager(vmConfig);
```
Both functions have an options parameter. Here is its type:
```ts
interface SetValueOptions {
    validate?: boolean;
    reset?: boolean;
    conversionErrorTokenValue?: string;
    skipValueChangedCallback?: boolean;
    duringEdit?: boolean;
}
```
These properties are all related to validation:
- validate - When true, invoke validation but only if the value changed. Only supported by validatable ValueHosts.
- reset - When true, change the state of the ValueHost to unchanged and validation has not been attempted. Consider setting this to true when using `setValue()` to initialize.
- skipValueChangedCallback - When true, the onValueChanged and onInputValueChanged callbacks will not be invoked.
- The other two are special cases covered elsewhere.

### Setting values on InputValueHosts
InputValueHosts have two values: the raw value from the Input (called the "Input Value") and the resulting value that is compatible with the property on your Model ("Native Value").
As a result, there are additional functions. `setValue()` still works, only with the native value alone. You will mostly use `setValues()` and `setInputValue()`.
```ts
setValues(nativeValue: any, inputValue: any, options?: SetValueOptions): void;
setInputValue(value: any, options?: SetValueOptions): void;
```

Use `setValues()` when initializing the value and as either value has changed. If you cannot determine one of the values, pass in undefined.
```ts
let lastNameVH = vm.getValueHost("Age");
lastNameVH.setValues(25, "25");
// or
vm.vh.input("Age").setValues(25, "25");
```
Both functions have an options parameter. See the previous section for its definition.
### Getting the value
Use `getValue()` to get the value from any ValueHost. For an InputValueHost, it returns the native value. The `evaluate()` function of Conditions use this to gather data. If you are reassembling a Model from the ValidationManager, use it there too.
```ts
getValue(): any;
```
When it returns undefined, it indicates the value is undetermined.
```ts
let lastNameVH = vm.getValueHost("LastName");
let nativeValue = lastNameVH.getValue();
// or
let nativeValue = vm.vh.any("LastName").getValue();
```
### Getting the Input value on InputValueHosts
InputValueHosts have two values, native and input. The `getValue()` function gets its native value. The `getInputValue()` function gets its input value.
```ts
getInputValue(): any;
```
```ts
let lastNameVH = vm.getValueHost("LastName");
let inputValue = lastNameVH.getInputValue();
// or
let  inputValue = vm.vh.any("LastName").getInputValue();
```
