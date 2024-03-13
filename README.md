# Jivs - JavaScript Input Validation Service

Back in the day (2002-2013), I created a successful suite of Web
Controls for ASP.NET WebForms which featured a complete replacement to
its built-in input validation. I really learned a lot about what website
developers wanted on-screen. In the 10+ years that followed, I've
learned much more in terms of OOP patterns programming, plus TypeScript
came out and JavaScript introduced Classes. Wonderful stuff that I now
use here, in **Jivs**.

Jivs itself is just the tooling to evaluate values and return a list of
issues found. 
> That is the essence of validation! 

Jivs is a "service",
doing that job well, and not trying to provide the actual UI. For that,
you will be able to add companion libraries to match your environment,
such as working in the browser's DOM or React's components. Being a
UI-independent service, you can build your own UI around it, and it can
run both in the browser and NodeJS.

Jivs' philosophy involves strong separation of concerns.
-   UI is strongly separated from the validation work
-   Business logic code is where your validation rules generally are
    found, not in the UI input forms.

The result is that the UI knows almost nothing about what needs to be
validated. The UI just posts its current values into Jivs and asks: what
are the result of validation? It gets back a Validation Result, such as
"Valid", "Invalid", or even "Undetermined", and any issues found. An
issue found includes error messages, an id to the field associated with
the validation rule, and its severity.

The UI uses that information to change the visuals: show those errors in
some way and perhaps change the appearance of the input and its
surroundings. Jivs knows nothing about that stuff, although its
supporting libraries (pending) are well-informed on those matters.
## Quick terminology overview
Here are a few terms used.
- **Validator** - Combines a single rule that must be validated along with the error message(s) it may return when an issue is found.
- **Input** - Refers to the editor, widget, component where the user edits the data. In HTML, \<input>, \<select>, and \<textarea> tags are examples.
- **ValueHost** - References to a Jivs object that you setup for each Input, and for any other values you want to expose to the validators. Any ValueHosts associated with an Input may have Validators. Other ValueHosts hold data like global values and fields from the Model/Entity/Class/Record that won't be edited.
	> In fact, you can use Jivs and its ValueHost as your form's **Single Source of Truth** as you convert between the Model/Entity and the UI.
- **Form** - A group of Inputs that is gathering data from the user. It often has buttons to submit the work when completed (but first, it should use validation!)
- **Summary** - A UI-specific area that shows error messages found throughout your form.
- **ValidationManager** - The main class you interact with in Jivs. It contains a complete configuration of your form's inputs through ValueHosts. You will use it to send data changes from your Inputs, to invoke validation before submitting the Form, to retrieve a list of issues for a single Input to display, and another list for a Summary to display.
- **Input Value** - The raw data from the Input. Often this is a string representing the actual data, but needs to be cleaned up or converted before it can be stored.
- **Native Value** - The actual data that you will store. Often you have conversion code to move between Native and Input Values. One classic validation error is when your conversion code finds fault in the Input Value and cannot generate the Native Value.
- **Business Logic** - The code dedicated to describing your Model/Entity. It provides the validation rules for individual fields and to run before saving. It should be separate from the UI, and Jivs is designed for that approach.

## Quick API overview

As a service, you need to know about its API. The primary pieces for
building a UI are:

-   `ValueHost` classes -- Identifies a single value to be validated
    and/or contributes data into the rules of your validation. Each has a unique
    identifier that you use to match it to a specific input, such as the
    ID of the HTML input tag (\"TextBox1\"), or even better, a path
    where it is found in a Model (\"Customer/Address/Street\").

    -   `NonInputValueHost` class -- For values that are not validated, such as a
        field from your Model that isn't editable, or a global value of
        your app, as both can contribute to your validation logic. 
        
        >Take a postal code as an example. You might use a regular expression
        to evaluate it. But that expression depends on the country of
        delivery. So you would use a ValueHost to pass in a country
        code, and let the validation internally select the right
        expression.
        
        Some members of this class are:
		```
		GetId
		GetLabel
		GetValue
		SetValue
		```

	- `InputValueHost` class - For Input values optionally with validators. In fact, they have all of the features of NonInputValueHost, just validation capability and know of a second value from the input.		

		Some members of this class are (in addition to the inherited from NonInputValueHost):
		```
		GetInputValue
		SetInputValue
		Validate
		IsValid
		```
-   `ValidationManager` class -- The front-end of this API. It's where you
    configure the ValueHosts, get access to a ValueHost, validate, and get the validation results.

	Some members of this class are:
	```
	GetValueHost
	Validate
	SetBusinessLogicErrors
	GetIssuesForInput
	GetIssuesForSummary
	```
-   `Condition` classes -- Classes that evaluate value(s) against a rule
    to see if those values conform. Condition classes exist for each
    business rule pattern, such as *required* or *compare two values are
    not identical*. While there are many standard rules for which there
    are Conditions included in this library, you are often going to need
    to build your own.
    >In fact, you can substitute your own business logic code, so long as you wrap it in a Condition class.

	Some members of these classes are:
	```
	Evaluate
	ConditionCategory
	```

-   `InputValidator` class -- Handles a single rule, by assigning it to a
    Condition. The Condition does the actual evaluation of the rule. InputValidator's job is to handle the validation process and deliver the error messages to the
    list of issues found.

	Some members of this class are:
	```
	Validate
	```
## Bridging business logic and UI validation
You need to build a class that adapts your validation rules to Jivs own types and classes. Jivs uses the classes that implement the ICondition interface to package up a validation rule, and ConditionDescriptor type to inform the Condition class how to configure itself. The class is a bridge between business logic and your UI. This section provides the details.

### Separation of concerns: Input Validation vs Business Logic validation

<details>
<summary>This topic should orient the developer on keeping validation logic separate from the UI.</summary>
Jivs wants the app to keep its validation rules in Business Logic separate from UI code. Business logic should have no knowledge of the UI. It operates based on an object called Model or Entity. As you know, properties of objects are completely disconnected from the UI input elements.

> Input Validation’s role is to ensure that the values you move into a Model conform to the business logic, without using existing business logic code that depends on the Model.

Business logic validation code still gets used, but only upon attempting to save into the Model. The user clicks a Save button. The button first checks if there are any remaining Input Validation errors. If none, you have code that populates a model from the Inputs. That’s when business logic does its own validation. It will save if no issues remain. It will report back issues if any are found. You’ll pass them along to ValidationManager to impact the user interface, like showing them in a ValidationSummary widget.

About all the UI developer should know is:
- The identity of the Model’s field, so it can move values between Model and UI.
- The data type of the field. Specifically the property’s data type, like a number, date, Boolean, or complex object. The developer uses that to determine the widget that will edit the value. They also use that to write the code that converts the value between the Model property’s data type and the widget’s data type.
- It is possible that there are validation rules. What they are doesn’t matter. The UI developer can build a widget that shows up when issues are found.
	- There is one case where the UI developer might introduce a validation rule: reporting an issue when their code to convert from widget to Model property fails. Even that is often resolved behinds the scenes in Jivs.
- Provide a common area on screen for consolidation of errors, including those reported by Business Logic. This is referred to as the ValidationSummary.

Someone will code all of those validation rules in a way that Jivs can apply them. Whether it’s done by the UI developer or not, this new code will be separate from the UI code. (And unit tested.) This will likely be the most code you need to write to work with Jivs (or any validation system).
</details>

### Configuring a validation rule in Jivs

You build validation rules using the Condition concept. A Condition simply packages a function to evaluate data together with a few other properties. Here is its interface:
```ts
interface ICondition {
    Evaluate(valueHost, valueHostResolver): ConditionEvaluateResult;
    Category: ConditionCategory;
    ConditionType: string;
}
```
The Evaluate function entirely handles the validation rule, and returns a result of Match, NoMatch, or Undetermined.
<details>
<summary>Expand for details on the results.</summary>

- Match – Data conformed to the rule
- NoMatch -Data violated the rule
- Undetermined – Data wasn’t appropriate for evaluation. Example: an empty textbox’s value isn’t ready for a “Compare the input’s date value to Today”. There needs to be text representing a date first.
</details>

Jivs provides numerous Condition classes. 
<details>
<summary>Expand to see just a few.</summary>

- RequiredTextCondition, RequiredIndexCondition - for required fields
- DataTypeCheckCondition, RegExpCondition - for checking the data conforms to the data type.
- RangeCondition, ValuesEqualCondition, ValueGTSecondValueCondition - Comparing values
- AndCondition, OrCondition - For creating boolean logic with other Conditions.
</details>

To use them, you need to populate their ConditionDescriptor type, which has configuration properties specific to the Condition class. 
We'll work with this example.
Here's the rule we want to implement: Compare a date from the Input to today's date.

The ValuesEqualCondition is the right Condition for the job.  You need to create a ValuesEqualConditionDescriptor that Jivs will use later to prepare the ValuesEqualCondition. Here's that ConditionDescriptor:
```ts
interface IValuesEqualConditionDescriptor {
    Type: string;
    ValueHostId: null | string;
    SecondValueHostId: null | string;
    SecondValue?: any;
    ConversionLookupKey?: null | string;
    SecondConversionLookupKey?: null | string;
    Category?: ConditionCategory;
}
```
>Where's the error message? A Condition is just part of a Validator. The InputValidator class connects your Condition to its error message.

Your new code should look like this, where ValueHostId is your identifier for a field on the Model that you call “SignedOnDate”. (More on ValueHostIds later.)
```ts
{
    Type: 'ValuesEqual';
    ValueHostId: 'SignedOnDate';
    SecondValue: date object representing Today;
}
```
We recommend that you create a Factory-style class that takes your business logic validation information in and returns the appropriate ConditionDescriptor already configured. Let’s suppose that your business logic has a class called BusinessLogicComparer that looks like this:
```ts
class BusinessLogicComparer {
    operator: ConditionOperators; // equals, notequals, etc
    CompareTo?: ((date object representing Today));
}
```
Here’s a framework for your new Factory.
```ts
class Factory
{
  Create(fieldRef: string, businessLogicRule: any): IConditionDescriptor
  {
    if (businessLogicRule instanceof BusinessLogicComparer)
      switch (businessLogicRule.operator)
      {
        case ConditionOperators.Equals:
          return <IValuesEqualsConditionDescriptor>{
            Type: 'ValuesEqual',
            ValueHostId: fieldRef,
            SecondValue: businessLogicRule.SecondValue
          }
      }
  }
}
```
Use your Factory as you assemble the ValidationManagerConfig object. Its just one part of the work to configure the ValidationManager.

### ValueHosts and their IDs

Next task is to give names to every UI widget that correlates them to the fields of the Model.

In this example, our Model’s property names are used in the input tag’s name attribute.

| Model fields | HTML tag
| ----  | ----
| FirstName | `<input type="text" name="FirstName" />`
| LastName | `<input type="text" name="LastName" />`

Jivs wants those same names for basically the same purpose of correlating with fields in the Model. Instead of an HTML tag, Jivs uses the ValueHost class.
When we configure the above Model for Jivs, you can imagine something like this object:
```ts
[
  {
	Id: 'FirstName',
	Validators: [ condition descriptors ]
  },
  {
	Id: 'LastName',
	Validators: [ condition descriptors ]
  }
]
```
In fact, that’s about right, only with more properties. Those objects use the InputValueHostDescriptor type.
```ts
interface IInputValueHostDescriptor {
  Type?: string;
  Id: string;
  Label: string;
  DataType?: string;
  InitialValue?: any;
  ValidatorDescriptors: null | IInputValidatorDescriptor[];
}
```
Here’s how your configuration actually looks:
```ts
[
  {
    Type: 'Input',
    Id: 'FirstName',
    Label: 'First name', // localized, of course!
    DataType: 'String',
    ValidatorDescriptors: [ InputValidatorDescriptors ]
  },
  {
    Type: 'Input',
    Id: 'LastName',
    Label: 'Last name',
    DataType: 'String',
    ValidatorDescriptors: [ InputValidatorDescriptors ]
  }
]
```
The ValueHost Ids are also used to help a Condition retrieve a value from a ValueHost. Suppose that we use the ValuesNotEqualCondition on FirstName to compare to LastName. You have to supply the ValueHostId for the LastName field to the condition.
```ts
{
  Id: 'FirstName',
  ...
  Validators: [
    {
      ConditionDescriptor: 
      {
        Type: 'ValuesNotEqual',
        ValueHostId: null, // because owning ValueHost is provided automatically to the Condition.Evaluate function.
        SecondValueHostId: 'LastName'
      }      
      ... and properties of IInputValidatorDescriptor that we've yet to cover ...
    }

  ]
}
```
	
---
__This documentation is unfinished.__ Plenty still to write about:

-   How to configure, including how to work with your business logic

-   Each class and its members

-   How to create your own Conditions

-   Maintaining state

-   Supporting custom data types (your own classes that reflect a value,
    like how the JavaScript Date object handles a DateTime value)

-   Relating this to other input validation libraries
