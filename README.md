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
- **Code Effort:** While using Jivs involves coding, it covers many cases that you normally have to write.

    Here are some facets of building validation and how Jivs participates:
	- **Defining validation rules:** Jivs has a large library of rules already, and makes it easy to add new ones through your code.
	- **Business logic driven validation:** Using your business logic code to establish fields and their validation rules. Jivs needs you to write a conversion class to translate your rules into Jivs format. This is likely the biggest coding task. (You don't have to use business logic code for rules, but its best practice.)
    - **Error messages:** Validation works best with meaningful and relevant error messages. Jivs has this covered in many ways: localization, library for each validation rule's message, in-message tokens that will be replaced by live data using localized formatting rules.
    - **Converting input values:** Jivs provides parsers to convert the textual input into the native value needed by the model. 
	- **Managing save attempts:** Jivs aids in handling errors, whether from UI or business logic, facilitating the delivery of additional messages and error handling
-  **Coding Style:** Jivs is built using modern OOP patterns. Expect TypeScript interfaces, single responsibility objects, dependency injection, and strong separation of concerns.
	- Most aspects of Jivs are expandable due to use of interfaces and dependency injection.
	- Easy to extend the existing business rule objects ("Conditions") to work with special cases, like comparing two Date objects but only by their day of week.
	- UI development is mostly unaware of the validation rules supplied by business logic. It just knows that it is managing a field that may be validated, and provides the UI for the elements that report validation. Jivs supplies it with the validation status and error messages.


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
		+ Validators can be wrapped in the WhenCondition to disable themselves based on a rule. For example, unless a checkbox is marked, an associated text box will not report errors. Also the containing field can be configured to disable all of its validators based on a rule.
		+ If the user has edited a field and it has yet to be validated, the form reports "do not save", helping prevent form submission without validation.
- Handling submitting data:
	- When submitting HTML form data, the server gets strings representing the data that need to be converted into their native values (like a string with a date into a Date object). Jivs provides parsers to handle this.
	-	The "do not save" feature provides a clear way to write code that prevents unvalidated and invalid data from being submitted.
	-	Business logic must also validate the Model before saving, covering other *use cases*:
		+	Validation must occur on the server side to prevent hacked data coming through the UI. If your server side is run within Node.js, you can include the same code as used on the client.
		+	Any errors found on the server side are expected to be passed up to the client, and Jivs will apply them into the UI. The UI can supply appropriate replacements for any error messages from the server.
		+	Similarly, business logic errors found on the client-side can be passed into Jivs for display in the UI.
- Jivs provides built-in support for common data types—number, string, Boolean, and date—and accommodates unique usage scenarios through extensive customizability:
	- Formatter customization: Tailor how values are displayed to users, with localization. For instance, configure error messages to show dates in an abbreviated format rather than a short date format.
	- Converter customization: Adjust the data under validation to fit various contexts, such as interpreting a JavaScript Date object in multiple ways—anniversary, expiry, total days, date with time, or time alone.
	- Parser customization: Transform the strings from your inputs and form data into their native types in your own way, with localization. 
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
- **ValidationManager** – A Jivs object; it is the main class you interact with. You configure it to know about your form or Model, where ValueHosts are created for each value in the form or Model. 
You will use it to supply data from your Inputs and Properties, to invoke validation, to retrieve a list of issues to display, and to report additional errors determined by your business logic.
- **Input Value** – The raw data from the Input. Often this is a string representing the actual data, but needs to be cleaned up or converted before it can be stored.
- **Native Value** – The actual data that you will store in the Model. Often you have conversion code to move between Native and Input Values. One classic validation error is when your conversion code finds fault in the Input Value and cannot generate the Native Value. This error is what Jivs calls a "Data Type Check".
- **Service** – A class that provides Jivs with dependency injection or a factory. Jivs has you create a master service object, ValidationServices, and connect individual services to it. 
- **Builder API** - Tooling to configure the ValueHosts and their Validators used by ValidationManager.
- **Builder object** - An object supplying the Builder API that is used to configure prior to creating the ValidationManager.
- **Modifier object** - An object supplying the Builder API that is used to configure after creating the ValidationManager.
- **Parser** - Code that converts of the Input Value from a string into its Native Value.
- **Formatter** - Code that converts the Native Value into a localized, user friendly string for display within an error message.
- **Converter** - Code that converts a Native Value into another value, such as converting a date into the day offset from the start of the year, or making a string all lowercase characters.

<img src="http://jivs.peterblum.com/images/Class_overview.svg"></img>

<a name="wheretousevalidation"></a>
## Where you want to use validation
<a name="focusleavesinput"></a>
### As focus leaves an Input and its value changed
* Use the onchange event to tell the ValidationManager about the data change and run validation. 
	* You will need to have two values, the raw value from the Input (called the "Input Value") and the resulting value that is compatible with the property on your Model ("Native Value").
	* Jivs lets you assign a parser to each InputValueHost. Just use: `validationManager.vh.input('name').setInputValue(inputValue, { validate: true });`
	* If you want to handle parsing elsewhere, use: `validationManager.vh.input('name').setValues(nativeValue, inputValue, { validate: true });`
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
let builder = build(createValidationServices('en-US'));
builder.onValueHostValidationStateChanged = fieldValidated;
... work with builder to add ValueHosts and their Validators ...

let vm = new ValidationManager(builder);

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
This code sets up the onchange event with built-in parsing:
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=>{
  let inputValue = evt.target.value;
  vm.vh.input('FirstName').setInputValue(inputValue, { validate: true });
});
```
This code sets up the onchange event with your own parsing:
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=>{
  let inputValue = evt.target.value;
  let { nativeValue, errorMessage } = myParser(inputValue);	// return nativeValue=undefined when there is an error
  vm.vh.input('FirstName').setValues(nativeValue, inputValue, { validate: true, conversionErrorTokenValue: errorMessage });
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
  vm.vh.input('FirstName').setInputValue(evt.target.value, { validate: true, duringEdit: true });
});
```
### When the user submits the data - client side handling
The ValidationManager should already have all changed values captured due to onchange events on your Inputs. 

Run validation and proceed with submission if data is valid.
```ts
let status = vm.validate(); // it will notify elements in your UI of validation changes
if (status.doNotSave)
  // Prevent saving. User has to fix things
else
  // Submit the page's data
```
### Submit data to the server
There are several implementations for handling data submission, but all require validating all data before saving. (Otherwise hackers can push data to your server easily.)

The overall steps are:

1. Validate the data, gathering issues found.
2. If there were no issues, save the data.
3. If there were issues, do not save. Instead, pass the issues back to the client so Jivs can show them.

**Step 1** is where we find different implementations.
- Data is from an HTML \<form> - Form data is all strings. They need to be parsed to the native values that you save. Parsing may identify errors. If no errors are found, then apply validation. Parsing errors themselves represent a kind of validation response, and will be sent back to Jivs.
- Data is from JSON - A JSON string parser can convert some data to its native values. Where it cannot, provide a parser. 
- Data is from another source - As you may have picked up, the key concept is to ensure that everything not in its native form has a parser or conversion code.

Jivs can assist when you have Node.js on the server. Otherwise, the work is up to you.

**Step 2** is up to you.

<a name="submitstep3"></a>
**Step 3** has a server and client side implementation.

On the server side, create a JSON representation of the business logic errors found. If you use Jivs own `BusinessLogicError interface`, you will reduce the work on the client side.
```ts
interface BusinessLogicError {
    errorMessage: string;
    associatedValueHostName?: string;
    severity?: ValidationSeverity;
    errorCode?: string;
}
```
If you use Jivs on the server side, also create JSON from the results of `ValidationManager.getIssuesFound()`. This is an array of IssueFound objects.

Let's suppose you generated the following script for the client side:
```ts
var businessLogicErrors = [
  { ... error 1 ... },
  { ... error 2 ... }
];
var jivsIssuesFound = [
  { ... issue 1 ... },
  { ... issue 2 ... }
];
```
On the client side, convert *businessLogicErrors* into an array of BusinessLogicError objects as shown here.
```ts
// this converts from a different data format into BusinessLogicError objects
let blErrors: Array<BusinessLogicError> = [];
for (let i = 0; i < businessLogicErrors.length; i++)
{
  let error = businessLogicErrors[i];
  let blError: BusinessLogicError = {
    errorMessage: error.myErrorMessage,
    errorCode: myMapToErrorCode(error), // optional. Try to match up to a known client-side error code or Condition Type to get the UI's error messages
    associatedValueHostName: myMapToValueHostName(error)  // optional. Jivs will update the actual field, not just the ValidationSummary
   };
   blErrors.push(blError);
}
```
Finally call `ValidationManager.setBusinessLogicErrors()` with the business logic errors array and `ValidationManager.setIssuesFound()` with the Jivs issues found.
```ts
vm.setBusinessLogicErrors(blErrors);	// will notify the UI's validation elements
vm.setIssuesFound(jivsIssuesFound);		// also will notify UI's validation elements
```
> `setIssuesFound()` has an optional second parameter. Suppose your server side code actually has a validator not setup on the client, and it is part of Issues Found. Use the second parameter to determine whether to keep it or omit it. By default, it is kept.

<a name="nodejsserver"></a>
### Using Jivs on a Node.js server
#### Data is from an HTML \<form>
The HTML form data starts as strings. Convert each form element into its native value.

- Using built-in parsing:
  * Ensure you have setup appropriate DataTypeParser objects in the services. See <a href="#validationservices">Setup services</a>.
  * Ensure that each ValueHost is an InputValueHost and has its InputValueHostConfig.dataType property assigned. dataType will serve to lookup the DataTypeParser. However, if the parser uses a different Lookup Key, set it on the InputValueHostConfig.parserLookupKey property.
  * Pass the string value from the form data into the InputValueHost: 
	  ```ts
	  vm.vh.input('FirstName').setInputValue(formValue);
	  ```
- Using your own parsing:
  * Ensure that each ValueHost is an InputValueHost and has its InputValueHostConfig.dataType property assigned.
  * Parse - for you to implement. Just need to get back either the native value or an error message.
	```ts
	let { nativeValue, errorMessage } = myParser(text); 
	```

  * If there are no errors, pass both the input value and native value into the InputValueHost:
	```ts
	vm.vh.input('FirstName').setValues(nativeValue, inputValue);
	```
  * If there are errors, pass *undefined* for the native value, the input value, and the error message into the InputValueHost: 
	```ts
	vm.vh.input('FirstName').setValues(undefined, inputValue, { conversionErrorTokenValue: errorMessage });
	```
	
Continue below <a href="#nodejsvalidate">"Validation and either save or handle errors"</a>.
#### Data is in JSON
Upon converting a JSON string into an object, you can pass along each property to the associated ValueHost.
We recommend using InputValueHost over PropertyValueHost in case there are strings that need parsing.
```ts
vm.vh.input('FirstName').setValue(nativeValue);
```

There remain several cases that involve parsing, and for those, use the instructions in the previous section.
- You know the field's value is incompatible with the native value without running a parser on it. For example, you know the JSON property contains a string representation of the number you need.
- The field's value is a string, but it must be cleaned up through parsing, before its value is allowed to be saved.

<a name="nodejsvalidate"></a>
#### Validate and either save or handle errors
* Validate using `validationManager.validate()`. Capture any errors it finds from `validationManager.getIssuesFound()`.
* Also run your business logic validation against the model for cases not covered by input level validators. Capture any errors it finds.
* If there are no errors, save the data.
* With errors, do not save. Instead, supply the captured errors to the client-side to report to the user through Jivs. See <a href="#submitstep3">above, step 3</a>.
```ts
let status = vm.validate();
let businessLogicErrors = myBusinessLogicValidation();	// you write this.
if (status.doNotSave || businessLogicErrors) {
  // Gather the issues found and deliver them to the client-side
  // This should send back up to 2 lists: IssuesFound from Jivs and those from your code.
  // On the client-side, we'll each list into Jivs differently, keep the lists separate.
  sendErrorsBack(vm.getIssuesFound(), businessLogicErrors); // you write sendErrorsBack()
}
else {
  // Data can be saved.
  // If you don't already have a populated model, 
  // you might create Model and transfer values from each ValueHost like this:
  let model = new PersonModel();
  model.FirstName = vm.vh.input('FirstName').getValue();
  model.LastName = vm.vh.input('LastName').getValue();
  
  // Save the data.
  repository.update(model);	// your code
}
```

### Showing all errors in a ValidationSummary
The term "ValidationSummary" refers to a location in the UI that offers a consolidated view of all error messages. Aside from how its presented, it is very similar to showing errors specific to one field, except it shows all errors and updates upon any ValueHost's validation.

You need these tools to setup your ValidationSummary:
* An HTML element to host the ValidationSummary.
* A function that responds to the `onValidationStateChanged callback` on the ValidationManager. This function will gather the data and update the ValidationSummary.
* Use the `getIssuesFound()` function on ValidationManager to retrieve those issues. 
>You will get issues generated by your business logic too with `ValidationManager.setBusinessLogicErrors()`.

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
let builder = build(createValidationServices('en-US'));
builder.onValueHostValidationStateChanged = fieldValidated;
builder.onValidationStateChanged = formValidated;
... work with builder to add ValueHosts and their Validators ...

let vm = new ValidationManager(builder);

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
<a name="configuringjivs"></a>
## Configuring Jivs
The `ValidationManager object` is the central tool used to interact with the ValueHosts and perform validation. It is supported by `ValidationServices object` to provide services and factories.

When you instantiate ValidationManager, you pass in the configuration -- all ValueHosts and their Validators. So you need to build that configuration first. To do that, you will use the **Builder API**. Create a `Builder object` then use the Builder API on it. After ValidationManager is created, you can still modify the configuration using the `Modifier object`. It also has the Builder API.

Here is a high level view of this:
```ts
let builder = build(createValidationServices('en'));
... use the Builder API on builder ...
let vm = new ValidationManager(builder);
... later when changes are needed ...
let modifier = vm.startModifying();
... use the Builder API on modifier ...
modifier.apply();
```

Here are the key objects associated with configuring ValidationManager:
* <a href="#validationservices">ValidationServices class</a> - provides services and factories to ValidationManager and all of the objects it contains. This comes from the createValidationServices() function, which you will prepare to meet your needs. See <a href="#configuringvalidationservices">Configuring ValidationServices</a> for details.
* <a href="#builder_and_vmconfig">ValidationManagerConfigBuilder class</a>, also known as **Builder object** - used to define the configuration of your form's fields (as ValueHost objects) and their validators. Once configured, pass it into the ValidationManager's constructor.
* <a href="#builder_and_vmconfig">ValidationManagerConfigModifier class</a>, also known as **Modifier object** - used to change the configuration of the ValidationManager after its been created.
* <a href="#builder_and_vmconfig">ValidationManagerConfig</a> - the underlying object created by the Builder API. If you write a code generator to translate your business logic into Jivs data, you often create and work with it directly. Each ValueHost has its own underlying configuration object, like InputValueHostConfig and StaticValueHostConfig. Each Validator has its own underlying object too, ValidatorConfig. Same for Conditions, ConditionConfig.

Here's what the Config data looks like once setup. 
<img src="http://jivs.peterblum.com/images/Config_example.svg"></img>

There are a couple of approaches to configuration, based on whether you want to let your business layer define the input and validator rules, which is best practice.

### When starting with business logic
1. UI creates the <a href="#validationservices">`Services object`</a> and passes it along to the business logic's code.
2. Business logic provides its configuration.
	+ using a code generator to translate your business logic into Jivs data.
	+ using the <a href="#builder_and_vmconfig">`Builder object`</a>.
3. UI uses the `Builder object` to 
	+ replace error messages and labels.
	+ add additional ValueHosts and Validators. 
	+ attach callbacks.
4. UI creates the `ValidationManager object` passing in the `Builder object`.

#### Business logic using a code generator
```ts
let vmConfig = applyMyBusinessLogic(createValidationServices('en-US'));	// code that you write, that returns ValidationManagerConfig
let builder = builder(vmConfig);
```
See [jivs-examples/src/Config_with_BusinessLogic_using_code_generator.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/Config_with_BusinessLogic_using_code_generator.ts)
#### Business logic using the Builder object
```ts
let builder = builder(createValidationServices('en-US'));
applyMyBusinessLogic(builder);	// code that you write, that uses the builder
```
See [jivs-examples/src/Config_with_BusinessLogic_using_Builder.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/Config_with_BusinessLogic_using_Builder.ts)
#### UI layer taking the configuration from the business logic
```ts
... continuing from the business logic code...
 // all further changes are applied by merging carefully with business logic's work
builder.startUILayerConfig();

// apply label to Start Date ValueHost
// update the lessThan validator created by business logic
// add the lessThenOrEqual validator for comparing the number of days between the dates
builder.input('StartDate', null, { label: 'Start date'}).lessThan(
  null, null, null, {
  severity: ValidationSeverity.Severe
}).lessThanOrEqual(
  null, null, 'The two dates must be less than {CompareTo} days apart.', {
  errorCode: 'NumOfDays',
  summaryMessage: 'The Start and End dates must be less than {CompareTo} days apart.'
});

// apply label to end Date
builder.input('EndDate', null, { label: 'End date'});

// attach any callbacks
builder.onValidationStateChanged = myValidationStateChangedFn;
builder.onValueHostValidationStateChanged = myValueHostValidationStateChangedFn;

let vm = new ValidationManager(builder);
```

### When UI creates everything (not business logic driven)
1. UI creates the <a href="#builder_and_vmconfig">`Builder object`</a> along with the <a href="#validationservices">`Services object`</a>.
2. Use `Builder object` to create all ValueHosts and their validators.
3. Attach any callbacks.
4. Create the `ValidationManager object`, passing in the Builder object.

```ts
let builder = build(createValidationServices('en-US'));
// create the start Date Value Host and its validators
builder.input('StartDate', LookupKey.Date, { label: 'Start date'} )
  .lessThan('EndDate', null, { label: 'End date' }, { severity: ValidationSeverity.Severe })
  .lessThanOrEqual('NumOfDays', { valueHostName: 'DiffDays' }, 'The two dates must be less than {CompareTo} days apart.', 
  { 
    errorCode: 'NumOfDays',
    summaryMessage: 'The Start and End dates must be less than {CompareTo} days apart.'
  });
// create the end Date Value Host
builder.input('EndDate', LookupKey.Date, { label: 'End date'} );

// attach any callbacks
builder.onValidationStateChanged = myValidationStateChangedFn;
builder.onValueHostValidationStateChanged = myValueHostValidationStateChangedFn;

let vm = new ValidationManager(builder);
```
For more extensive examples, see this code file:

[jivs-examples/src/Config_entirely_in_UI_Layer.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/Config_entirely_in_UI_Layer.ts)
<a name="usingmodifierapi"></a>
### Changing the configuration after creating ValidationManager with the Modifier object
Sometimes its necessary to change the configuration, perhaps just a property on a Validator or even add a ValueHost or Validator.
> If you want to add a ValueHost or Validator, consider adding them during initial configuration and use their enabled property to disable them. Later the configuration change is just changing the enabled property.

You will use the `Modifier object`, which is very similar to the `Builder object`, except it expects to merge your changes with the existing configuration. The `Modifier object` supports the Builder API with a few additions.

1. Call `startModifying()` on the ValidationManager to get the `Modifier object`.
2. Use the same functions as on build, like `input()`, `static()` and validators attached to `input()`.
3. Call the `apply()` function on the `Modifier object`.

In this example, *vm* is the ValidationManager instance.
```ts
let modifier = vm.startModifying();
modifier.input('Start Date').lessThan(null, null, 'some new error message', {
  summaryMessage: 'some new error message for {Label}'
});
modifier.apply();
```
> Don't use the `Modifier object` to change the data value of a ValueHost. The data value is stateful information, not configuration.

In the previous example, that code will either add or update an existing InputValueHost and its lessThan validator. If you wanted to change only the error messages, here is another syntax with a focus only on changing validator parameters like error messages.

```ts
let modifier = vm.startModifying();
modifier.updateValidator('Start Date', ConditionType.LessThan, { 
  errorMessage: 'some new error message', 
  summaryMessage: 'some new error message for {Label}'
});
modifier.apply();
```
You must be careful not to disable the validation rules supplied by the business logic layer without good reason. Yet the UI often has to augment them or replace them with an improved rule. The Builder API includes two functions designed to make any changes transparent: `combineWithRule()` and `replaceRule()`. When combining, the business logic Condition is retained, with the UI adding a second condition. Both become children of either the `AllMatchCondition`, `AnyMatchCondition`, or `WhenCondition`.
> These functions are available on the `Builder object` too.

Here we elect to combine a new condition with the `RegExpCondition` supplied by business object layer with a `StringLengthCondition` by placing them under an `AllMatchCondition`.
```ts
let builder = build(createValidationServices('en-US'));
builder.input('Key', LookupKey.String, { label: 'Start date'} ).regExp(/^[\d[ABCD_]+$/);

let vm = new ValidationManager(builder);

let modifier = vm.startModifying();
modifier.combineWithRule('Key', ConditionType.RegExp, CombiningUsingCondition.All,
	(combiningBuilder)=> combiningBuilder.stringLength(10));
modifier.apply();
```
The result would be the same as if business logic had initially done this:
```ts
builder.input('Key', LookupKey.String, { label: 'Start date'} ).all(
	(childrenBuilder)=> childrenBuilder.regExp(/^[\d[ABCD_]+$/).stringLength(10));
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
    configure the `ValueHosts`, get access to a `ValueHost`, validate, and get the validation results. It is supported by these types:
    + <a href="#builder_and_vmconfig">`ValidationManagerConfig type`</a> – An object that describes all ValueHosts and their Validators.
    + <a href="#builder_and_vmconfig">`ValidationManagerConfigBuilder class`</a> – Also known as the Builder object, use it to configure the ValidationManager class. Internally, it prepares the `ValidationManagerConfig type`.
    + <a href="#builder_and_vmconfig">`ValidationManagerConfigModifier class`</a> – Also known as the Modifier object, use it to change the configuration once the ValidationManager has been created. Internally, it modifies the `ValidationManagerConfig type`.

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
	- `IDataTypeParser` – For converting the input value into a native value, ready for validation. A parser can detect an error and report it for a validator to show. Parsers are localizable.
	- There are also `IDataTypeCheckGenerator`, `IDataTypeComparer`, and `IDataTypeIdentifier` to cover some special cases.
	- `ConditionFactory` – Creates the Condition objects used by business rules.

<img src="http://jivs.peterblum.com/images/Class_overview.svg"></img>

Topics:
- <a href="#conditions">Conditions</a>
- <a href="#valuehosts">ValueHosts</a>
- <a href="#validators">Validators</a>
- <a href="#validationmanager">ValidationManager</a>
- <a href="#validationservices">ValidationServices</a>
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

The UI developer provides these UI-specific elements:
- A widget that shows issues that are found.
- A widget that shows a consolidation of issues found, including those reported by Business Logic. This is referred to as the ValidationSummary.
- Any additional validation rules that support the UI elements. Typical use case: reporting an issue when  converting the value of the widget into the value needed by the Model.
- More appropriate error messages for the UI than business logic supplied.
- Field labels that will appear in error messages, as the property name is often a poor choice for a field label.

Someone will code all of those business logic validation rules in a way that Jivs can consume them. Whether it’s done by the UI developer or not, this new code should be separate from the UI code. (And unit tested.) This will likely be the most code you need to write to work with Jivs (or any validation system).
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
The `evaluate() function` entirely handles the validation rule, and returns a result of `Match`, `NoMatch`, or `Undetermined`.
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

To use them, you need to provide a configuration with properties specific to its class. 
> Configuration must be setup when <a href="#configuringvalidationmanger">configuring the ValidationManager</a> or <a href="#usingmodifierapi">using the Modifier object</a> after it was created.

We'll work with this example: Compare a date from the Input to today's date.

The `EqualToValueCondition` is the right Condition for the job.  Here are the properties available for configuration:
```ts
interface EqualToValueConditionConfig {
    conditionType: string;	// get this value from the ConditionType type: ConditionType.EqualToValue
    valueHostName: null | string;
    secondValue?: any;
    conversionLookupKey?: null | string;
    secondConversionLookupKey?: null | string;
    category?: ConditionCategory;
}
```
>Where's an error message property? A `Condition` is just part of a Validator. The `Validator class` connects your Condition to its error message.

We'll use the <a href="#builder_and_vmconfig">`Builder object`</a> to deliver its properties as it is easier, and allows us to setup the error message too:
```ts
builder.input('SignedOnDate').equalToValue(new Date(), "Enter today's date", { conversionLookupKey: LookupKey.Date });
```
The Builder API assigns conditionType, category, and secondValue (to new Date()). We're using the conversionLookupKey here to ensure that the value of new Date() is just the date part.

<a name="allconditionconfigurations"></a>
#### All Condition configurations
Let's cover all of the Condition-building functions of the <a href="#builder_and_vmconfig">`Builder API`</a>. Before listing them, be aware of these elements of the Builder API syntax.

```ts
builder.input('field').conditionName(required parameters, { condition properties }?, errorMessage?, { validator properties}? );
modifier.input('field').conditionName(required parameters, { condition properties }?);
```
- The *condition properties* argument is an object with any properties offered by the Condition's configuration that are not elsewher. It is omitted if the rest of the function parameters cover those properties. Each function below shows its condition properties object.
- The *validator properties* argument that takes this object:
	```ts
	{
	    errorCode?: string;
	    
	    // note: 'null' is used to remove the value from an earlier version of the config
	    errorMessage?: null | string | ((host) => string);
	    errorMessagel10n?: null | string;
	    summaryMessage?: null | string | ((host) => string);
	    summaryMessagel10n?: null | string;
	    
	    severity?: ValidationSeverity | ((host) => ValidationSeverity);
	    enabled?: boolean | ((host) => boolean);
	}
	```
  For details, see <a href="#configuringvalidators">Configuring Validators</a>.

Here are the Condition-building functions of the Builder API:
- dataTypeCheck(errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').dataTypeCheck();
  ```
- requireText({*condition properties*}?, errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').requireText();
  builder.input('fieldname').requireText({ nullValueResult: ConditionEvaluateResult.Undetermined });	
  ```
  
  ```ts
  { // condition parameters
     trim?: boolean;
     nullValueResult?: ConditionEvaluateResult;
     valueHostName: null | string;
  }
  ```
- notNull(errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').notNull();
  ```
	
- regExp(expression, ignoreCase?, {*condition properties*}?, errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').regExp(/^\w*$/i);
  ```
  ```ts
  { // condition parameters
     multiline?: boolean;
     trim?: boolean;
     valueHostName: null | string;
     supportsDuringEdit?: boolean;
  }
  ```

- range(minimum, maximum, errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').range(5, 100);
  ```
- when(*enabler builder function*, *child builder function*, errorMessage?, {*validator properties*}?)

  For both *enabler builder function* and *child builder function*, pass a function that uses its one parameter to attach the child condition.
 
  ```ts
  builder.input('fieldname').when(
     (enablerBuilder) => enablerBuilder.equalTo(true, null, 'anotherFieldName'),
     (childBuilder) => childBuilder.regExp(/[ABC]/);
  builder.input('fieldname').when(
     (enablerBuilder) => enablerBuilder.equalTo(true, null, 'anotherFieldName'),
     (childBuilder) => childBuilder.regExp(/[ABC]/, 
        'Omit these letters: ABC', { severity: ValidatorSeverity.Severe });
  ```
  For more, see <a href="#whencondition">Using the WhenCondition</a>.

- not(*child builder function*, errorMessage?, {*validator properties*}?)

  For *child builder function*, pass a function that uses its one parameter to attach the child condition.
 
  ```ts
  builder.input('fieldname').not(
     (childBuilder) => childBuilder.regExp(/[ABC]/);
  builder.input('fieldname').not(
     (childBuilder) => childBuilder.regExp(/[ABC]/, 
        'Omit these letters: ABC', { severity: ValidatorSeverity.Severe });
  ```
  For more, see <a href="#notcondition">Using the NotCondition</a>.
- equalToValue(secondValue, {*condition properties*}?, errorMessage?, {*validator properties*}?)
	- same for `notEqualToValue`, `lessThanValue`, `lessThanOrEqualValue`, `greaterThanValue`, `greaterThanOrEqualValue`
	- also can use these aliases: `ltValue`, `lteValue`, `gtValue`, `gteValue`
  ```ts
  builder.input('fieldname').equalToValue(10);
  builder.input('fieldname').lessThanValue(10);
  builder.input('fieldname').ltValue(10);
  ```
  ```ts
  { // condition parameters
     valueHostName: null | string;
     conversionLookupKey?: null | string; // for first valuehost
     secondValue?: any;
     secondConversionLookupKey?: null | string;
  }
  ```
- equalTo(secondValueHostName, {*condition properties*}?, errorMessage?, {*validator properties*}?)
	- same for `notEqualTo`, `lessThan`, `lessThanOrEqual`, `greaterThan`, `greaterThanOrEqual`
	- also can use these aliases: `lt`, `lte`, `gt`, `gte`
  ```ts
  builder.input('fieldname').equalTo('fieldname2');
  builder.input('fieldname').lessThan('fieldname2');
  builder.input('fieldname').lt('fieldname2');
  ```
  ```ts
  { // condition parameters
     valueHostName: null | string;
     conversionLookupKey?: null | string; // for first valuehost
     secondConversionLookupKey?: null | string;
  }
  ```
- stringLength(maximum, {*condition properties*}?, errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').stringLength(100);
  builder.input('fieldname').stringLength(100, { minimum: 2 });
  ```
  ```ts
  { // condition parameters
     minimum?: null | number;
     trim?: boolean;
     valueHostName: null | string;
     supportsDuringEdit?: boolean;
  }
  ```
- all(*children builder function*, errorMessage?, {*validator properties*}?)

  For *children builder function*, pass a function that uses its one parameter to chain the child conditions, usually specifying the valueHostName property as these children may reference other value hosts to evaluate.
 
  ```ts
  builder.input('fieldname').all(
     (childrenBuilder) => childrenBuilder
       .requireText(null, 'fieldname2')
       .requireText(null, 'fieldname3'));
  builder.input('fieldname').all(
     (childrenBuilder) => childrenBuilder
        .requireText(null, 'fieldname2')
        .requireText(null, 'fieldname3'), 
        'At least one is required', { severity: ValidatorSeverity.Severe });
  ```
- any(*children builder function*, errorMessage?, {*validator properties*}?)

  For *children builder function*, pass a function that uses its one parameter to chain the child conditions, usually specifying the valueHostName property as these children may reference other value hosts to evaluate.
 
  ```ts
  builder.input('fieldname').any(
     (childrenBuilder) => childrenBuilder
       .requireText(null, 'fieldname2')
       .requireText(null, 'fieldname3'));
  builder.input('fieldname').any(
     (childrenBuilder) => childrenBuilder
        .requireText(null, 'fieldname2')
        .requireText(null, 'fieldname3'), 
        'At least one is required', { severity: ValidatorSeverity.Severe });
  ```

- countMatches(minimum, maximum, *children builder function*, errorMessage?, {*validator properties*}?)

  For *children builder function*, pass a function that uses its one parameter to chain the child conditions, usually specifying the valueHostName property as these children may reference other value hosts to evaluate.
  ```ts
  builder.input('fieldname').countMatches(
      1, 2, 
      (childrenBuilder) => childrenBuilder
         .requireText(null, 'fieldname2')
         .requireText(null, 'fieldname3')
         .requireText(null, 'fieldname4'));
  builder.input('fieldname').any(
      2, 4, 
      (childrenBuilder) => childrenBuilder
         .requireText(null, 'fieldname2')
         .requireText(null, 'fieldname3')
         .requireText(null, 'fieldname4')
         .requireText(null, 'fieldname5')
         .requireText(null, 'fieldname6'), 
         'Between 2 and 4 are required.', { severity: ValidatorSeverity.Severe });
  ```

- positive(errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').positive();
  ```
 
- integer(errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').integer();
  ```
  
- maxDecimals(maxDecimals, errorMessage?, {*validator properties*}?)
  ```ts
  builder.input('fieldname').maxDecimals(2);
  ```

- customRule(conditionCreator, errorMessage?, {*validator properties*}?)

  Use this to supply a function that will return a Condition in the conditionCreator parameter. It has the syntax:
 `(requestor: ValidatorConfig)=> ICondition | null`
  ```ts
  builder.input('fieldname').customRule((requestor)=> {    
      return new RegExpCondition({ expression: /^\d{7}$/ });
  });
  ```
 
 For more on customRule, see <a href="#customconditions">Custom conditions</a>.

**See also: <a href="#createconditions">Creating your own Conditions</a>**
<a name="whencondition"></a>
### Using the WhenCondition to enable another condition
The WhenCondition makes a decision on whether another condition can evaluate or not. Use it to enable or disable a condition based on a condition.

Example: RequireText is only enabled if 'CheckBox1' has a value
```ts
<input type='checkbox' name='CheckBox1' value='marked' />
<input type='text' name='TextBox1' />
...
builder.input('CheckBox1', LookupKey.String);
builder.input('TextBox1', LookupKey.String)
   .when((enablerBuilder)=>enablerBuilder.requireText(null, 'CheckBox1'),
         (childBuilder)=>childBuilder.requireText());
```
Example: Regular expression for postal code depends on culture ID
```ts
builder.static('countryCode', LookupKey.String, { initialValue: 'US' });
builder.input('PostalCode')
   .when((enablerBuilder)=> enablerBuilder.equalTo('US'), (childBuilder)=>childBuilder.regExp(/^\d{5}(\s\d{4})?$/))
   .when((enablerBuilder)=> enablerBuilder.equalTo('CA'), (childBuilder)=>childBuilder.regExp(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/))
   .when((enablerBuilder)=> enablerBuilder.equalTo('MX'), (childBuilder)=>childBuilder.regExp(/^\d{5}$/));

```
<a name="notcondition"></a>
### Using the NotCondition to reverse the result of another condition
The NotCondition hosts another condition and reverses its evaluation result, from Match to NoMatch and NoMatch to Match. If the child condition results in Undetermined, so does NotCondition.

Example: Illegal characters in a string using RegExpCondition
```ts
builder.input('password').not((childBuilder)=> childBuilder.regExp(/[:|'_]/));
```

<a name="valuehosts"></a>
## ValueHosts
Every value that you expose to Jivs is kept in a ValueHost. There are several types:

- InputValueHost – For user input. The value may have validation rules applied. It actually keeps two values around when working with a UI: the value fully compatible with the model's property, and the value from within the editor.
- PropertyValueHost – For a property on the Model. The value may have validation rules applied.
- StaticValueHost – The value that is not validated itself, but its value is used in an InputValueHost's validation rule or is a member of the Model that is retained when Jivs is the single-source of truth.
- CalcValueHost – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days. You supply it a function that returns a value, which can be based on other ValueHosts. 

These objects are created by the ValidationManager for you, as a result of configuring it. Here is pseudo-code representation of their interfaces (omitting many members).
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
  convert(source, validationManager): SimpleValueType;
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
ValueHosts have underlying objects that host the configuration: InputValueHostConfig, PropertyValueHostConfig, StaticValueHostConfig, and CalcValueHostConfig. You generally use the <a href="#builder_and_vmconfig">Builder API</a> to assist setting them up.

> Configuration must be setup when <a href="#configuringvalidationmanager">configuring the ValidationManager</a> or <a href="#usingmodifierapi">using the Modifier API</a> after it was created.

#### Example configuration using Builder API
```ts
let builder = build(createValidationServices('en-US'));
// create the First Name ValueHost and its validators
builder.input('FirstName', LookupKey.String, { label: 'First name'} )
  .requireText()
  .notEqualTo('LastName', null, null, 
  { 
    errorCode: 'NumOfDays',
    severity: ValidationSeverity.Warning
  });
// create the Last Name ValueHost
builder.input('LastName', LookupKey.String, { label: 'Last name'} );

let vm = new ValidationManager(builder);
```
<a name="valuehostbuilderapi"></a>
#### Configuring ValueHosts with the Builder API
The <a href="#builder_and_vmconfig">`Builder object`</a> (`ValidationManagerConfigBuilder class`) has these functions to add ValueHosts by their type. (There are other functions in the <a href="#builder_and_vmconfig">Builder API</a>.)
- `input()` adds or modifies an InputValueHost configuration. You can chain validator functions like requireText() and regExp() to it.
   
   input(valueHostName, dataType?, *parameters*?): FluentValidatorBuilder
   
   input(valueHostName, *parameters*?): FluentValidatorBuilder
   ```ts
   builder.input('fieldname', LookupKey.Date);
   builder.input('fieldname', LookupKey.Integer, { label: 'Field name', labell10n: 'FNKey'});
   builder.input('fieldname').requireText();
   ```
   ```ts
   {  // parameters
      label?: string;
      labell10n?: null | string;
      initialValue?: any;   
      initialEnabled?: boolean;
      parserLookupKey?: null | string;
      parserCreator?: ((valueHost) => null | IDataTypeParser<any>);
      group?: null | string | string[];
   }
   ```
   input(*config*): FluentValidatorBuilder
   ```ts
   builder.input({ valueHostName: 'fieldname', dataType: LookupKey.Date,
      label: 'Field name', labell10n: 'FNKey' }).requireText();
   ```
   ```ts
   {  // config: this plus the above parameters
      name: string;
      dataType?: string;
   }
   ```
 > All members of parameters, config, and arguments are <a href="#valuehostmembers">discussed below</a>.

- `property()` adds or modifies a PropertyValueHost configuration. You can chain validator functions like requireText() and regExp() to it.
   
   property(valueHostName, dataType?, *parameters*?): FluentValidatorBuilder
   
   property(valueHostName, *parameters*?): FluentValidatorBuilder
   ```ts
   builder.property('fieldname', LookupKey.Date);
   builder.property('fieldname', LookupKey.Integer, { label: 'Field name', labell10n: 'FNKey'});
   builder.property('fieldname').requireText();
   ```
   ```ts
   {  // parameters
      label?: string;
      labell10n?: null | string;
      initialValue?: any;   
      initialEnabled?: boolean;
      group?: null | string | string[];
   }
   ```
   property(*config*): FluentValidatorBuilder
   ```ts
   builder.property({ valueHostName: 'fieldname', dataType: LookupKey.Date,
      label: 'Field name', labell10n: 'FNKey' }).requireText();
   ```
   ```ts
   {  // config: this plus the above parameters
      name: string;
      dataType?: string;
   }
   ```
 > All members of parameters, config, and arguments are <a href="#valuehostmembers">discussed below</a>.

- `static()` adds or modifies a StaticValueHost configuration. It does not support validators, but it can be chained with other ValueHosts.
   
   static(valueHostName, dataType?, *parameters*?): ValidationManagerConfigBuilder
   
   static(valueHostName, *parameters*?): ValidationManagerConfigBuilder
   ```ts
   builder.static('fieldname', LookupKey.Date);
   builder.static('fieldname', LookupKey.Integer, { label: 'Field name', labell10n: 'FNKey'});
   builder.static('fieldname');
   ```
   ```ts
   {  // parameters
      label?: string;
      labell10n?: null | string;
      initialValue?: any;   
      initialEnabled?: boolean;
   }
   ```
   static(*config*): ValidationManagerConfigBuilder
   ```ts
   builder.static({ valueHostName: 'fieldname', dataType: LookupKey.Date,
      label: 'Field name', labell10n: 'FNKey' });
   ```
   ```ts
   {  // config: this plus the above parameters
      name: string;
      dataType?: string;
   }
   ```
 > All members of parameters, config, and arguments are <a href="#valuehostmembers">discussed below</a>.


- `calc()` adds or modifies a CalcValueHost configuration. It does not support validators, but it can be chained with other ValueHosts. See <a href="#calcvaluehost">Using CalcValueHost</a> for more.
   
   calc(valueHostName, dataType, calcFn): ValidationManagerConfigBuilder

   ```ts
   builder.calc('fieldname', LookupKey.Date, myCalcFunction);
   ```
   calc(*config*): ValidationManagerConfigBuilder
   ```ts
   builder.calc({ valueHostName: 'fieldname', dataType: LookupKey.Date,
      calcFn: myCalcFunction });
   ```
   ```ts
   {  // config
      name: string;
      dataType?: string;
      calcFn: CalculationHandler;
      initialEnabled?: boolean;
   }
   ```
 > All members of parameters, config, and arguments are <a href="#valuehostmembers">discussed below</a>.

<a name="valuehostmembers"></a>
Here are the arguments, parameters, and config members for all ValueHost functions of the <a href="#builder_and_vmconfig">Builder API</a>.
- name – The ValueHost name. Required. See <a href="#naming">Naming each ValueHost</a>. If you repeat the same name after calling `builder.startUILayerConfig()`, you want to modify that ValueHost configuration.
- dataType – The data type. Generally recommended to be setup, although the actual value provided by ValueHost.setValue() can be used to infer the data type. See <a href="#lookupkeys">Lookup Keys: Data Types and Companion Tools</a>.
- label – The text to show in the {Label} and {SecondLabel} tokens of an error message.
- labell10n – Localization key to get the label from the <a href="#textlocalizerservice">TextLocalizerService</a>.
- initialValue – An initial native value for the ValueHost. If not assigned, it is initially undefined.
- initialEnabled - ValueHosts have an enabled state. When it is false, validation and setting their value is blocked, plus attempts to get the validation state report no error, except to say the ValidationStatus is Disabled. Use initialValue=false to configure the ValueHost as disabled. If omitted, the state is initially true. See <a href="#disablevaluehost">Disabling a ValueHost</a> for more.
- calcFn – Assign the function used by CalcValueHost to determine its value. See <a href="#calcvaluehost">CalcValueHost</a>.
- group – Group validation is a tool to group ValueHosts with a specific submit command when validating. If used, create a name for the group and use it on all ValueHosts and calls to validate() that share the group. The name matching is case insensitive.
- parserLookupKey – When you have <a href="#datatypeparser">configured parsing</a> for InputValueHosts, this overrides the default parser. Specify a lookupKey to match one that you have registered with the DataTypeParserService.
- parserCreator – An alternative to parserLookupKey that provides a function callback to create the parser object. The function has this definition: `(valueHost: IInputValueHost) => IDataTypeParser | null;`

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
The CalcValueHost takes a function used to calculate its value. The function has this format.
```ts
(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => number | Date | string | null | boolean | undefined
```
Take advantage of the findValueHosts parameter to request values from other ValueHosts: `findValueHosts.getValueHost('name').getValue()`. It also provides access to the ValidationServices on `findValueHosts.services`.

In this example, the function multiplies the value from the InputValueHost 'Count' by 10.
```ts
builder.input('Count', LookupKey.Integer);
builder.calc('TimesTen', LookupKey.Integer, 
   (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => {
      let count = findValueHosts.getValueHost('Count') as number;
      if (!isNaN(count))
      	  return count * 10;
      return undefined;
   });
```

See a practical example here: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts)

<a name="disablevaluehost"></a>
### Disabling a ValueHost
ValueHosts can be disabled. Here are their behavior changes when disabled:
- Validation will not run
- Validation State is similar to having no error. You will still get some messages through the onValueHostValidationStateChanged callback. Expect the ValidationState object to look like this:
  ```ts
  {
    isValid: true,
    status: ValidationStatus.Disabled,
    doNotSave: false,
    issuesFound: null,
  }
  ```
- Calls to `setValue()`, `setInputValue()`, and `setValues()` will not make any changes to the values. Use the overrideDisabled option to override this behavior: 
  ```ts
   vh.setValue(value, { overrideDisable: true });
  ```

- Explicitly setting it to false using the setEnabled() function clears the validation state.

#### How to disable and enable the ValueHost
There are two ways to set and change it: using the 'enabled' state, which is a boolean that you change on demand, and using the **Enabler Condition**, where the Condition determines whether it is true or false.

- If you want to disable it as part of initial configuration, set the initialEnabled property to false in the ValueHostConfig object or as shown here using Builder API.
  ```ts
  builder.input('name', LookupKey.String, { initialEnabled: false });
  ```
- To change it on demand, call the setEnabled() function on the ValueHost object.
  ```ts
  vm.getValueHost('name').setEnabled(false);
  ```
 
  >When setting it to true, also be sure to call validate() if you want to restore the validation state. 
  
- To use the Enabler Condition, select the appropriate Condition class and use the Builder API like this:
  ```ts
  builder.input('field1').validators go here
  builder.enabler('field1', (enablerBuilder)=> enablerBuilder.condition(parameters));
  
  // example
  builder.input('field1').requireText();
  builder.enabler('field1', (enablerBuilder)=> enablerBuilder.equalToValue('YES', 'Field2'));
  ```
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
}
```
<a name="configuringvalidators"></a>
### Configuring Validators
Validators have an underlying object, ValidatorConfig, that hosts the configuration. You generally use the <a href="#builder_and_vmconfig">Builder API</a> to assist setting it up.
> Configuration must be setup when <a href="#configuringvalidationmanager">configuring the ValidationManager</a> or <a href="#usingmodifierapi">using the Modifier object</a> after it was created.
```ts
interface ValidatorConfig {
    errorCode?: string;
    conditionConfig: null | ConditionConfig;
    conditionCreator?: ConditionCreatorHandler;
    
    // note: 'null' is used to remove the value from an earlier version of the config
    errorMessage?: null | string | ((host) => string);
    errorMessagel10n?: null | string;
    summaryMessage?: null | string | ((host) => string);
    summaryMessagel10n?: null | string;
    
    severity?: ValidationSeverity | ((host) => ValidationSeverity);
    
    enabled?: boolean | ((host) => boolean);
}
```

Let’s go through each property.
- `errorCode` – Each validator must have a unique error code within a ValueHost to identify it. By default, it uses the value from `conditionConfig.conditionType` or the condition created by `conditionCreator` (below). 
	+ It is used by these features:
		+ Lookup the localized error message with the <a href="#textlocalizerservice">`TextLocalizerService`</a>.
		+ It is included in the `IssueFound object` that is passed to the UI along with the error message to allow your UI to recognize it. IssueFound is passed to your UI in these ValidationManager callbacks: `onValidationStateChanged` and `onValueHostValidationStateChanged`.
		+ When the Builder or Modifier object has to merge validators using the `ValidatorConfigMergeService`.
		+ When business logic provides errors, if its own error code matches this property, this validator reports an error, making it easy to ensure error messages are consistent and UI friendly.
	+ Set it directly in these cases:
		+ The same condition type is used more than once.
		+ To clarify the purpose of the error.
		+ To associate it with a business logic error code.
		+ To provide multiple localized error messages for the same condition type.
	
- `conditionConfig` – Describes the condition itself. When using the <a href="#builder_and_vmconfig">Builder API</a>, you don't set this property directly. See <a href="#configuringconditions">"Configuring Conditions"</a>. 

	It is not the only way to setup a Condition…
-	<a href="#customconditions">`conditionCreator`</a> – Create a Condition by returning an implementation of ICondition. This choice gives you a lot of flexibility, especially when you have some complex logic that you feel you can code up in an `evaluate() function` easier than using a bunch of Conditions.
    
    Its function has this format:
    ```ts
    (requester: ValidatorConfig) => ICondition | null;
    ```
    When using the Builder API, use the <a href="#customconditions">`customRule()`</a> function instead of conditionCreator.
- `errorMessage` – A template for the message reporting an issue. Its intended location is nearby the Input, such that you can omit including the field’s label. “This field requires a value”. As a template, it provides tokens which can be replaced by live data. (Discussed later).
- `errorMessagel10n` – Localization key for the error message, used with the <a href="#textlocalizerservice">TextLocalizerService</a>.
- `summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary. It's normal to include the field label in this message, using the {Label} token: “{Label} requires a value”.
- `summaryMessagel10n` – Localization key for the summary message, used with the <a href="#textlocalizerservice">TextLocalizerService</a>.
- `severity` – Controls some validation behaviors with these three values.
	- `Error` – Error but continue evaluating the remaining validation rules. The default when `severity` is omitted.
	- `Severe` – Error and do not evaluate any more validation rules for this ValueHost until the error is fixed.
	- `Warning` – Want to give the user some direction, but not prevent saving the data.
- `enabled` – A way to quickly disable the Validator. Alternatively use the WhenCondition to control the enabled state based on a condition. See <a href="#whencondition">Using the WhenCondition</a>.

#### Example with inline error messages
Now let’s add validators to our previous example using a Model with FirstName and LastName.
```ts
builder.input('FirstName', LookupKey.String, { label: 'First name'} )
   .requireText(null, 'This field requires a value', { summaryMessage:'{Label} requires a value.'})
   .notEqualTo('LastName', null, null, {
        errorCode: 'SameNameWarning',
        errorMessage: 'Are you sure that your first and last names are the same?',
        summaryMessage: 'In {Label}, are you sure that your first and last names are the same?',
        severity: 'Warning'   
   });
builder.input('LastName', LookupKey.String, { label: 'Last name' })
   .requireText(null, 'This field requires a value', { summaryMessage:'{Label} requires a value.'});
```

#### Example with error messages in the TextLocalizerService
Error messages shown here are often delegated to the <a href="#textlocalizerservice">TextLocalizerService</a>.
TextLocalizerService is setup when creating the Validation Services. Here's a relevant snippet.

```ts
service.registerErrorMessage(ConditionType.RequireText, null, {
    '*': 'This field requires a value.'
});
service.registerSummaryMessage(ConditionType.RequireText, null, {
    '*': '{Label} requires a value.'
});    
service.registerErrorMessage('SameNameWarning', null, {
    '*': 'Are you sure that your first and last names are the same?'
});
service.registerSummaryMessage('SameNameWarning', null, {
    '*': 'In {Label}, are you sure that your first and last names are the same?'
});    
```
Here's the <a href="#builder_and_vmconfig">Builder API</a> using those delegated error messages.
```ts
builder.input('FirstName', LookupKey.String, { label: 'First name' } )
   .requireText()
   .notEqualTo('LastName', null, null, {
        errorCode: 'SameNameWarning',
        severity: 'Warning'   
   });
builder.input('LastName', LookupKey.String, { label: 'Last name' }).requireText();
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
<a name="configuringvalidationmanger"></a><a name="builder_and_vmconfig"></a>
### Configuring the Validation Manager: The Builder API
> Please visit "<a href="#configuringjivs">Configuring Jivs</a>" for an overview of the process.

The ValidationManager is configured by passing the `Builder object` (`ValidationManagerConfigBuilder class`) or `ValidationManagerConfig object` into its constructor. Ultimately, the ValidationManager uses the ValidationManagerConfig object. The `Builder object` gives you the **Builder API**, which helps prepare a ValidationManagerConfig object in an easier syntax.

Let's look an example using both techniques. First directly modifying ValidationManagerConfig.
```ts
let vmConfig = <IValidationManagerConfig>{
  services: createValidationServices('en-US'),
  valueHostConfigs: []
};
let firstNameConfig: InputValueHostConfig = {
   valueHostType: ValueHostType.Input,
   name: 'FirstName',
   dataType: LookupKey.String,
   label: 'First name',
   validatorConfigs: [
     {
       conditionConfig: { conditionType: ConditionType.RequireText },
       errorMessage: 'Requires a value'
     }
   ]
};
vmConfig.valueHostConfigs.push(firstNameConfig);

let validationManager = new ValidationManager(vmConfig);
```
Now the same using the `Builder object`.
```ts
let builder = build(createValidationServices('en-US'));
builder.input('FirstName', LookupKey.String, { label: 'First name'})
	.requireText(null, 'Requires a value');
let vm = new ValidationManager(builder);
```
#### ValidationManagerConfig and Builder object
Because the `Builder object` (`ValidationManagerConfigBuilder class`) is a tool to build a ValidationManagerConfig object, the two have much overlap.

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
    onConfigChanged?: null: ValueHostsManagerConfigChangedHandler;
    notifyValidationStateChangedDelay?: number;
}
```
Here's the `Builder object`:
```ts
class ValidationManagerConfigBuilder {
// this group are wrappers around the same in ValidationManagerConfig
    savedInstanceState?: null | ValidationManagerInstanceState;
    savedValueHostInstanceStates?: null | ValueHostInstanceState[];
    onInstanceStateChanged?: null | ValidationManagerInstanceStateChangedHandler;
    onValidationStateChanged?: null | ValidationStateChangedHandler;
    onValueChanged?: null | ValueChangedHandler;
    onInputValueChanged?: null | InputValueChangedHandler;
    onValueHostInstanceStateChanged?: null | ValueHostInstanceStateChangedHandler;
    onValueHostValidationStateChanged?: null | ValueHostValidationStateChangedHandler;
    onConfigChanged?: null: ValueHostsManagerConfigChangedHandler;
    notifyValidationStateChangedDelay?: number;
    
// some of the functions to configure ValueHosts
    input(valueHostName, dataType?, partial config?): FluentValidatorBuilder;
    input(valueHostName, partial config?): FluentValidatorBuilder;
    input(partial config?): FluentValidatorBuilder;
    property(valueHostName, dataType?, partial config?): FluentValidatorBuilder;
    property(valueHostName, partial config?): FluentValidatorBuilder;
    property(partial config?): FluentValidatorBuilder;
    static(valueHostName, dataType?, partial config?): ValidationManagerConfigBuilder;
    static(valueHostName, partial config?): ValidationManagerConfigBuilder;
    static(partial config?): ValidationManagerConfigBuilder;
    calc(valueHostName, dataType, calcFn): ValidationManagerConfigBuilder;      
    
 // additional functions
    startUILayerConfig(options?): void;    
    combineWithRule(valueHostName, errorCode, CombineUsingCondition parameter, builderFn): ValidationManagerConfigModifier;
    combineWithRule(valueHostName, errorCode, builderFn): ValidationManagerConfigModifier;  
    replaceRule(valueHostName, errorCode, builderFn):   ValidationManagerConfigModifier;      
    enabler(valueHostName, builderFn): ValidationManagerConfigModifier;
    enabler(valueHostName, conditionConfig): ValidationManagerConfigModifier;
}
```
Let’s go through these types.

- `services` – Always takes a <a href="#validationservices">`ValidationServices object`</a>, which is rich with services for dependency injection and factories. You will need to do a bunch to configure this, but don’t worry, we have a code snippet to inject into your app to assist. (Described below.)
- `valueHostConfigs` – Configures each ValueHost. This is where a majority of the setup work goes. See <a href="#configuringvaluehosts">"Configuring ValueHosts"</a>.
- `savedInstanceState` and `savedValueHostInstanceStates` – `ValidationManager` knows how to offload its stateful data to the application. If you want to retain state, you’ll capture the latest states using the `onInstanceStateChanged` and `onValueHostInstanceStateChanged` events, and pass the values back into these two Config properties when you recreate it.
- `onInstanceStateChanged` and `onValueHostInstanceStateChanged` must be setup if you maintain the states. They supply a copy of the states for you to save.
- `onValueChanged` notifies you when a `ValueHost` had its value changed.
- `onInputValueChanged` notifies you when an `InputValueHost` had its Input Value changed.
- `onValidationStateChanged` and `onValueHostValidationStateChanged` notifies you after a `validate function` completes, providing the results.
-   `onConfigChanged` lets you capture the configuration for caching it to use in a later creation of ValueHostsManager.

- `input()` adds or modifies an <a href="#valuehosts">InputValueHost</a> configuration. You can chain validator functions like requireText() and regExp() to it. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.
- `property()` adds or modifies a <a href="#valuehosts">PropertyValueHost</a> configuration. You can chain validator functions like requireText() and regExp() to it. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.
- `static()` adds or modifies a <a href="#valuehosts">StaticValueHost</a> configuration. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.
- `calc()` adds or modifies a <a href="#valuehosts">CalcValueHost</a> configuration. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.

- `startUILayerConfig(options)` is used when business logic first configures the ValueHosts and their validators.
	Once done, its time for the UI to make extensions and modifications. First call startUILayerConfig(). It prepares the Builder API to merge the UI's changes and takes these actions based on the options object:
	+ favorUIMessages - When true or undefined, remove all error messages supplied by the business logic so long as there is an error message for the same error code registered in the TextLocalizerService. This ensures that TextLocalizerService messages are used, as any error message directly assigned to a validator overrides the TextLocalizerService.
	+ convertPropertyToInput - When true or undefined, PropertyValueHosts that were created by business logic are upgraded to InputValueHosts. Business logic can use PropertyValueHosts for validating models in Jivs. This option allows the same configuration to work with both model and UI validation.
- `combineWithRule()` allows the UI to change a validation rule for a specific valuehost+errorCode. The UI incorporates the business logic's rule with its own condition by using both within a WhenCondition, AllMatchCondition, or AnyMatchCondition. Alternatively, supply a function that determines another way.
- `replaceRule()` allows the UI to replace a validation rule for a specific valuehost+errorCode. Be careful that your replacement still confirms to the business logic's validation rule.
- `enabler()` attaches a Condition to the ValueHost that determines if it is enabled or not. See <a href="#disablevaluehost">Disabling a ValueHost</a>.

#### Chaining Validators using the Builder API
The `builder.input()` and `builder.property()` functions allow appending validators. Just use the name of the validator without the "Condition" suffix, and in camelCase.
```ts
builder.input('StartDate').requireText().regExp(/expression/);
```
> The same chaining applies to the `Modifier object`.

With the `Builder object`, all chained functions have parameters to supply key validator values like error message, error code and severity. Those that need it have parameters for configuring the Conditions too. Most parameters are optional, and many take `null` if you don't want to set them.
```ts
builder.input('StartDate').requireText({condition parameters}, errorMessage, {validator parameters});
builder.input('StartDate').regExp(expression, ignoreCase, {condition parameters}, errorMessage, {validator parameters}): FluentValidatorBuilder
```
For details on all validators using the Builder API, see <a href="#allconditionconfigurations">All condition configurations</a>.
<a name="modifierapi"></a>
#### Modifying the configuration with the Modifier object
Once the ValidationManager has been created, use the Builder API to make changes to its configuration by creating a `Modifier object` (`ValidationManagerConfigModifier class`).

For an overview of using the Modifier object, see <a href="#usingmodifierapi">Changing the configuration after creating ValidationManager with the `Modifier object`</a>.

Here's the Builder API on the `Modifier object`:
```ts
class ValidationManagerConfigModifier {
    input(valueHostName, dataType?, partial config?): FluentValidatorBuilder;
    input(valueHostName, partial config?): FluentValidatorBuilder;
    input(partial config?): FluentValidatorBuilder;
    property(valueHostName, dataType?, partial config?): FluentValidatorBuilder;
    property(valueHostName, partial config?): FluentValidatorBuilder;
    property(partial config?): FluentValidatorBuilder;
    static(valueHostName, dataType?, partial config?): ValidationManagerConfigBuilder;
    static(valueHostName, partial config?): ValidationManagerConfigBuilder;
    static(partial config?): ValidationManagerConfigBuilder;
    calc(valueHostName, dataType, calcFn): ValidationManagerConfigBuilder;    
    
    updateValidator(valueHostName, errorCode, { *validator properties* }): ValidationManagerConfigModifier;
    addValidatorsTo(valueHostName): FluentValidatorBuilder;
    combineWithRule(valueHostName, errorCode, CombineUsingCondition parameter, builderFn): ValidationManagerConfigModifier;
    combineWithRule(valueHostName, errorCode, builderFn): ValidationManagerConfigModifier;  
    replaceRule(valueHostName, errorCode, builderFn):   ValidationManagerConfigModifier;  
}
```
Let's go through these members:
- `input()` adds or modifies an <a href="#valuehosts">InputValueHost</a> configuration. You can chain validator functions like requireText() and regExp() to it. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.
- `property()` adds or modifies a <a href="#valuehosts">PropertyValueHost</a> configuration. You can chain validator functions like requireText() and regExp() to it. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.
- `static()` adds or modifies a <a href="#valuehosts">StaticValueHost</a> configuration. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.
- `calc()` adds or modifies a <a href="#valuehosts">CalcValueHost</a> configuration. See <a href="#valuehostbuilderapi">Configuring ValueHosts with Builder API</a>.
- `updateValidator()` is a simplified way to modify properties on a validator, including error message. For the *validator properties* argument, see <a href="#configuringvalidators">Configuring Validators</a>.

	`updateValidator('fieldname', ConditionType.RegExp, { errorMessage: 'new message' })` is effectively the same as writing: `input('fieldname').regExp(null, null, 'new message')`.
- `addValidatorsTo()` is a simplified way to add a validator without first figuring out the valueHost type. Use it like this: `addValidatorsTo('fieldname').regExp(parameters)`
- `combineWithRule()` allows the UI to change a validation rule for a specific valuehost+errorCode. The UI incorporates the business logic's rule with its own condition by using both within a WhenCondition, AllMatchCondition, or AnyMatchCondition. Alternatively, supply a function that determines another way.
- `replaceRule()` allows the UI to replace a validation rule for a specific valuehost+errorCode. Be careful that your replacement still confirms to the business logic's validation rule.

<a name="validationservices"></a>
## ValidationServices
The `ValidationServices class` supports the operations of Validation with services and factories, which of course means you can heavily customize Jivs through the power of interfaces and dependency injection.

`ValidationServices` is where we register new `Conditions` and classes to help work with all of the data types you might have in your Model. None of those classes are prepopulated (so that you are not stuck with classes that you won't use). So let’s get them setup.
<a name="configuringvalidationservices"></a>
### Configuring ValidationServices
Go to [https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts](https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts)

Add the contents of this file to your project. It results in several new functions starting with this one.
```ts
export function createValidationServices(... parameters ...): ValidationServices {
…
}
// also many register() functions plus configureCultures() and createTextLocalizerService
```
Once it transpiles, you can edit as needed, although initially leave most of the classes it registers alone, so you can start using the system.

Now that you have the `createValidationServices function`, use it during `ValidationManager` configuration.
```ts
let builder = build(createValidationServices('en-US'));
... use builder to add or modify ValueHost and Validator configurations ...
let validationManager = new ValidationManager(builder);
```
Or
```ts
let valueHostConfigs = ... array that configures ValueHosts ...
let vmConfig = <ValidationManagerConfig>{
  services: createValidationServices('en-US'),
  valueHostConfigs: ValueHostConfigs
}
let validationManager = new ValidationManager(vmConfig);
```
### Customizing factories and services
There are many services. Most code that instantiates an object is found in services and factories, not in the ValidationManager, ValueHosts, and Validators. That allows for extensive ability to customize.

Here is the ValidationServices type:
```ts
interface IValidationServices {
// general API where you can add your own services!
    getService<T>(serviceName): null | T;
    setService(serviceName, service): void;
    
// These services often have settings changes
    cultureService: ICultureService;
    loggerService: ILoggerService;
    textLocalizerService: ITextLocalizerService;

// these are all factories where you may register objects  
    conditionFactory: IConditionFactory;    
    dataTypeFormatterService: IDataTypeFormatterService;
    dataTypeConverterService: IDataTypeConverterService;
    dataTypeParserService: IDataTypeParserService;
    // less frequently modified factories
    dataTypeIdentifierService: IDataTypeIdentifierService;
    dataTypeComparerService: IDataTypeComparerService;
    autoGenerateDataTypeCheckService: IAutoGenerateDataTypeCheckService;
    
// these are customized in special cases
    valueHostFactory: IValueHostFactory;
    validatorFactory: IValidatorFactory;
    valueHostConfigMergeService: IValueHostConfigMergeService;
    validatorConfigMergeService: IValidatorConfigMergeService;    
    managerConfigBuilderFactory: IManagerConfigBuilderFactory;
    managerConfigModifierFactory: IManagerConfigModifierFactory;
    lookupKeyFallbackService: ILookupKeyFallbackService;
    messageTokenResolverService: IMessageTokenResolverService;    
}
```
Use the source code and TypeDoc output to better understand these services and factories.

See this folder: [https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Services](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Services)

<a name="lookupkeys"></a>
## Lookup Keys: Data Types and Companion Tools
To really do the job well, Jivs wants to know specific data types associated with each Model property. Each ValueHost has a dataType property for this purpose.

```ts
builder.static('name', 'String');
```
You *must* assign dataType to the name of a data type when the data is not a string, boolean, number or Date, and *should* assign it for those types when you need to be more precise, such as an "EmailAddress" instead of just "String".

We use the term "Lookup Key" when specifying the name of a data type. Please [see this page](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html) for a detailed look at all supplied with Jivs and how they are used.

We recommend using the LookupKey enumerated type instead of strings for lookup key parameters.
```ts
builder.static('name', LookupKey.String);
```

A Lookup Key is very powerful! It connects up with these behaviors:
- <a href="#datatypeidentifier">Identifiers</a>
- <a href="#datatypeconverter">Converters</a>
- <a href="#datatypeformatter">Formatters</a>
- <a href="#datatypecomparer">Comparers</a>
- <a href="#datatypeparser">Parsers</a>
- <a href="#datatypecheckgenerator">DataTypeCheckGenerators</a>

Let's look at each.
<a name="datatypeidentifier"></a>
### Identifiers
You can leave the dataType property blank and Jivs will identify its name for you with implementations of `IDataTypeIdentifier`. These come preinstalled: "String", "Number", "Boolean", and "Date" (Date object using only the date part in UTC).

Add your own when you have a class representing some data. Check out an actual example here: [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts). In this example, we have a new class, RelativeDate. We've created a new Lookup Key name called "RelativeDate" and associated it with a new DataTypeIdentifier.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypeconverter"></a>
### Converters
Change the value supplied to Conditions with implementations of `IDataTypeConverter`.

Consider these *Use Cases*:
- Provide case insensitive string matching by converting to lowercase. We've included a Converter for that, with "CaseInsensitive" as its Lookup Key. In this case, the Lookup Key should not be assigned to the ValueHost because its limited to the Condition. Many ConditionConfigs have conversionLookupKey and secondConversionLookupKey properties where you assign the Lookup Key. 

	Here is the NotEqualToCondition configured with CaseInsensitive:
	```ts
    builder.input('FirstName', LookupKey.String, { label: 'First name'})
       .notEqual('LastName', {
            secondValueHostName: 'LastName',
            conversionLookupKey: 'CaseInsensitive',
            secondConversionLookupKey: 'CaseInsensitive'	   
        });
	```
- Changing a Date object into something other than a Date+Time. You may be interested only in the date, the time, or even parts like Month or Hours. 
	
	Jivs includes these converters: "Date" (UTC date only), "LocalDate" (local date only), "TimeOfDay" (omits seconds), "TimeOfDayHMS" (includes seconds). You can use their Lookup Key for the ValueHost data type instead of the Condition's conversionLookup Key to use all associated tooling.
	```ts
    builder.input('MomentOfBirth', LookupKey.TimeOfDay, { label: 'Time of birth'});
	```
	We also have examples that introduce Month/Year [jivs-examples/src/MonthYearConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/MonthYearConverter.ts) and Month/Day [jivs-examples/src/AnniversaryConverter.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/AnniversaryConverter.ts).
	```ts
    builder.input('Expiry', 'MonthYear', { label: 'Expiration date'});
    builder.input('MarriageDate', 'Anniversary', { label: 'Marriage date'});
	```

- Perhaps you want to compare the difference in days between two dates. For that you need to convert a Date object into a number – the number of days since some fixed point. 
	
  Jivs includes the "TotalDays" Lookup Key and converter.
  
  See an example here: [jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts).
	
- Changing your own class (already setup with an Identifier) into something as simple as a string, number, or Date also requires a Converter. You will see how in the RelativeDate class example [jivs-examples/src/RelativeDate_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts) and a TimeSpan class example [jivs-examples/src/TimeSpan_class.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts).
- Additional converters already supplied with these Lookup Keys: "Integer" (uses Math.trunc), "Uppercase", "Lowercase".
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

#### Building your own
See [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts).

Also [jivs-engine/src/DataTypes/DataTypeFormatters.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts).

<a name="datatypeparser"></a>
### Parsers
Convert from the input value into the native value with implementations of `IDataTypeParser`. They can report problems with the input value, and their error can be shown in a validation error message.

Parsers are used:
* only on InputValueHosts, when calling `InputValueHost.setInputValue()`. 
	* In the client-side in response to the onchange event of a form \<input>.
	* In the node.js server that uses Jivs to validate. See <a href="#nodejsserver">Validation in Node.Js</a>.
* when the input value is a string (even if the native value is also a string).
* automatically, so long as a `IDataTypeParser` is setup for the lookup key assigned to InputValueHostConfig.dataType or InputValueHostConfig.parserLookupKey. Alternatively, pass a function to create the parser in InputValueHostConfig.parserCreator.

#### Error reporting
Jivs has been designed so that you have a parser do very limited error reporting, leaving most cases to validators. Suppose that your native value is expected to be a positive integer. Our NumberParser will convert the input into a number, including negatives and floating point. You add two Validators with these conditions: PositiveCondition and IntegerCondition. This lets you supply specific error messages to the user.

Number parser may report "Expecting a number" if it encounters "ABC". It converts "1.0", "-2", "3,201.40" and others that have the culture's currency and percent symbols. So your native value is 1, -2, or 3201.4.
The PositiveCondition's error message might say "Negative numbers are not allowed."
The IntegerCondition's error message might say "Must be an integer."

#### String clean up 
When the native type is a string, the input value may need to be changed if it's what you intend to save. Trimming lead and trailing whitespace is almost always used on Inputs. As a result, our CleanUpStringParser is already registered to trim all ValueHosts with a data type lookup key of LookupKey.String.

A phone number often has culture specific formatting, but in the end, you intend to store it in a fixed format, such as +\[country code] \[all digits of the phone number without formatting]. Use a Parser to deliver this, only reporting an error when the input is severely inappropriate.

"(800)204-9000" -> "+1 8002049000"

"+44 7911 123456" -> "+44 7911123456"

"ABC" -> error message

The CleanUpStringParser has numerous configuration options that together may deliver the desired format. 

#### Building your own
See [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts).

Also [jivs-engine/src/DataTypes/DataTypeParserBase.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeParserBase.ts) and [/jivs-engine/src/DataTypes/DataTypeParsers.ts](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/DataTypes/DataTypeParsers.ts).
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

### Creating your own Lookup Keys
The LookupKey enumerated type doesn't cover everything.
Here are some use cases for creating your own Lookup Key:
- Enumerated types, where the user sees text but the value is stored as a number. Check out [jivs-examples/src/EnumByNumberDataTypes.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EnumByNumberDataTypes.ts) to get supporting code and see how to use it.
	+ Parsing, from string to number
	+ Formatting, from number to string in an error message
- String values that have a strong pattern, like a phone number.
	+ Parsing, to clean up the user's input into the text that you want to store
	+ Formatting, to format the text you have stored
	+ Validating, using a Regular Expression. 
	+ Auto generating data type check validators
- Extracting some data from the native value, like the day of week from a Date object.
	+ Converting, to get the Date.day property.
- A class that you store as a single entity, like class NumberWithUnits { value: number, units: string }
	+ Identifing, to recognize your class
	+ Converting, to get a value you can use in comparing, such as the NumberWithUnits.value.
	+ Comparing, to compare two instances of the same class
	+ Formatting, to show the current value in an error message
	+ Parsing, to convert user input into your class.

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
You can also extend the Builder API to support it.

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
See this sample code for more: [jivs-examples/src/EmailAddressDataType.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts)
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
See this sample code for more: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts)
<a name="customconditions"></a>
### One-off conditions
Choose one of the methodologies below. Then attach it using the Builder API with the customRule() function:

```ts
builder.input('fieldname')
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
[jivs-engine/src/Conditions/ConcreteConditions.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/Conditions/ConcreteConditions.ts)
- Look here for source code to abstract conditions and the factory:
[jivs-engine/src/Conditions](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Conditions)
- Return `Undetermined` when unsupported data is found. For example, if you are evaluating only against a string, test `typeof value === 'string'` and return `Undetermined` when false.
- Always write unit tests.
- `conditionType` should be meaningful. Try to limit it to characters that work within JSON and code, such as letters, digits, underscore, space, and dash. Also try to keep it short and memorable as users will select your Condition by specifying its value in the Configs passed into the `ValidationManager`.
- `conditionType` values are case sensitive.
- You may be building replacements for the Condition classes supplied in Jivs especially if you prefer a third party's validation schema code. In that case, implement the `IConditionFactory interface` to expose your replacements. Always attach your factory to the `ValidationServices class` in the `createValidationServices function`.

### Adding your new Condition class to the Builder API
See this example: [jivs-examples/src/EvenNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts)

## Localization
Any text displayed to the user and any input supplied from them is subject to localization. Jivs is localization-ready with several tools. There are third party tools that may do the job more to your liking, and they can be swapped in by implementing the correct interfaces.
<a name="textlocalizerservice"></a>
### Localizing strings
Here are a few places you provide user-facing strings into Jivs:
- ValueHostConfig.label for {Label} and {SecondLabel} tokens
- ValidatorConfig.errorMessage and summaryMessage
- ValueHostConfig.dataType for {DataType} token

Each of those properties have a companion that ends in "l10n" (industry term for localization), such as labell10n. Use the l10n properties to supply a Localization Key that will be sent to Jivs `TextLocalizerService`. If that service has the appropriate data, it will be used instead of the usual property.

`TextLocalizerService` is available on `ValidationManager.services.textLocalizerService`. Add localization content within the `createTextLocalizerService() function` [that was added here](#validationservice).

To replace it with a third party text localization tool, implement `ITextLocalizerService` and assign it in the `createTextLocalizerService() function`.

#### Setup for ValueHostConfig.label
Let's suppose that you have a label "First Name" which you want in several languages.
1. Create a unique Localization Key for it. We'll use "FirstName".
2. Assign both label and labell10n properties during configuration, shown here using the <a href="#builder_and_vmconfig">`Builder object`</a>:
	```ts
	builder.input('FirstName', null, { label: 'First Name', 'labell10n': 'FirstName' });
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

#### Setup for ValidatorConfig.errorMessage and summaryMessage properties
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
#### Setup for ValueHostConfig.dataType
The {DataType} token is useful in making the error message for a Data Type Check validator cover multiple data types. Instead of "Enter a date." and "Enter a number.", one error message can say "Enter a {DataType}.".
1. Assign the dataType property during configuration shown here using the <a href="#builder_and_vmconfig">`Builder object`</a>:
	```ts
	builder.input('Age', LookupKey.Integer);
	```
2. Add an entry to the `createTextLocalizerService() function` like this:
	```ts
	export function createTextLocalizerService(): ITextLocalizerService
	{
	    let service = new TextLocalizerService();
	    ...
	    service.registerDataTypeLabel(LookupKey.Integer, {
	        '*': 'an integer number', // fallback
	        'en': 'an integer number',
	        'es': 'un número entero',
	        'fr': 'un nombre entier'
	    });
	}
	```

### Localizing error message "value" tokens
Error messages use tokens to insert values at runtime. {Value}, {SecondValue}, {Minimum}, {Maximum}, and {CompareTo} are all examples.

`Enter a value between {Minimum} and {Maximum}.`

When the value is a number, date or boolean, those must be localized. Jivs already does this within its <a href="#datatypeformatter">DataTypeFormatter classes</a>.

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
firstNameFld.attachEventListener('onchange', (evt)=>{
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
firstNameFld.attachEventListener('onchange', (evt)=>{
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
    overrideDisabled?: boolean;
}
```
These properties are all related to validation:
- validate - When true, invoke validation but only if the value changed.
- reset - When true, change the state of the ValueHost to unchanged and validation has not been attempted. 
- conversionErrorTokenValue - Provide an error message related to parsing from the Input Value into native value. This message can be shown when using DataTypeCheckCondition, by using the {ConversionError} token in its error message:
	```ts
	let firstNameFld = document.getElementById('FirstName');
	firstNameFld.attachEventListener('onchange', (evt)=>{
	  let inputValue = evt.target.value;
	  let [nativeValue, errorMessage] = YourConvertToNativeCode(inputValue);  
	  vm.vh.input('FirstName').setValues(nativeValue, inputValue, { validate: true, conversionErrorTokenValue: errorMessage });
	});	
	
	// set up the DataTypeCheckCondition's error message (local to this form)
	let original = vm.services.textLocalizerService as TextLocalizerService;
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
let builder = build(createValidationServices('en-US'));
... use the Builder object to create your ValueHosts and validators ...
builder.onValueHostValidationStateChanged = fieldValidated;
let vm = new ValidationManager(builder);

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
let builder = build(createValidationServices('en-US'));
... use the Builder object to create your ValueHosts and validators ...
builder.onValueHostValidationStateChanged = fieldValidated;
builder.onValidationStateChanged = formValidated;
let vm = new ValidationManager(builder);

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
builder.input('LastName', LookupKey.String, { initialValue: 'MyValue' } );
```
Both functions have an options parameter. Here is its type:
```ts
interface SetValueOptions {
    validate?: boolean;
    reset?: boolean;
    overrideDisabled?: boolean;    
    skipValueChangedCallback?: boolean;
    duringEdit?: boolean;
    conversionErrorTokenValue?: string;

}
```
These properties are all related to validation:
- validate - When true, invoke validation but only if the value changed. Only supported by validatable ValueHosts.
- reset - When true, change the state of the ValueHost to unchanged and validation has not been attempted. Consider setting this to true when using `setValue()` to initialize.
- skipValueChangedCallback - When true, the onValueChanged and onInputValueChanged callbacks will not be invoked.
- overrideDisabled - When true, it forces the change to the value even when the ValueHost is disabled.
ValueHost is disabled when `isEnabled()` returns false.
Use case: You may want to initialize a ValueHost with a value that is disabled. See <a href="#disablevaluehost">Disabling a ValueHost</a>.
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
Use `setInputValue()` when you have parsers setup, as they will convert and save the native value for you. See <a href="#wheretousevalidation">Where you want to use validation</a>.

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
