# Jivs - JavaScript Input Validation Service

*For full documentation, go to [http://jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc)*

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

## Why Use Jivs?
### Prerequisites:
-	Your app uses JavaScript or TypeScript
-	Your app targets the browser and/or Node.js
-	Your app needs to validate values, whether for user input or Model properties.

### Setting Expectations

- **What Jivs Isn’t:** It doesn't come with UI widgets for displaying error messages or applying stylesheet changes. However, we're developing additional libraries to complement Jivs with these UI capabilities—stay tuned.
- **What Jivs Excels At:** Its forte is value validation. This distinct focus from UI concerns allows for flexible UI development on any framework, such as React, which requires a unique approach to HTML manipulation. We plan to support both standard DOM and React-specific libraries.
- **Not Just for Browsers:** Despite seeming browser-centric, server-side validation is critical to prevent tampered data and address server-specific validations. Jivs supports this on Node.js, enabling consistent validation rules across client and server.
- **Code Effort:** While using Jivs involves coding, it’s basically what you would have to write anyway. Some of your coding work with or without Jivs:
	- **Defining validation rules:** Jivs encourages business logic-driven validation, independent of UI.
	- **Data Conversion:** Managing the conversion between model properties and UI representations, like converting a Date object in the model to a string for an \<input> field, is up to you. Jivs doesn't intrude here.
	- **Managing save attempts:** Jivs aids in handling errors, whether from UI or business logic, facilitating the delivery of additional messages and error handling

### Features

-	Fields are independently configurable, allowing UI widgets to remain unaware of validation rules and error messages. Jivs notifies UI widgets with validation outcomes.
-	Provides "Condition" objects for a standardized approach to validation, alongside support for custom validation rules, including asynchronous ones. Supplied conditions include: Required, Regular Expression, Range, Compare Two Matches, String Length, All Match, Any Match.
-	Most validation rules come from business logic. The "Data Type Check" is different, a rule that comes from the decisions made about UI widgets. For example, a Date can be edited by a textbox or calendar. Jivs automatically applies an appropriate rule for these checks, keeping the UI code free from validation concerns.
-	Jivs enables complex validations by providing the All Match and Any Match Conditions. They provide Boolean logic to a list of other Conditions.
-	Business logic must also validate the Model before saving. Jivs incorporates business logic error messages alongside its own.
-	Error message features:
	- Embed tokens to reusable templates   
	`The {Label} must be between {Minimum} and {Maximum}.`
	- Tokens that can show live data   
	`The current value is {Value}.`
	- Token values are localizable
	- Token values can select a format   
	`The {Label:Uppercase} must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}.`
	- Message text itself is localizable
	- Validators have two error messages. The first message, designed for proximity to the UI widget, is succinct, focusing on the issue without field context. The second, intended for a Validation Summary displayed elsewhere on the screen, includes the field name for clarity.
	- You can setup default error messages, localized of course. This is particularly useful for Data Type Check validations, where distinct data types require specific guidance. For instance, use "Enter a date in the form MM/DD/YYYY" for dates, and "Enter a number using only digits" for numbers.
	- Jivs can provide every error associated with a field, not just the initial one, ensuring thorough feedback and guidance.
- Jivs provides built-in support for common data types—number, string, Boolean, and date—and accommodates unique usage scenarios through extensive customizability.
	- Formatter customization: Tailor how values are displayed to users, with localization. For instance, configure error messages to show dates in an abbreviated format rather than a short date format.
	- Converter customization: Adjust the data under validation to fit various contexts, such as interpreting a JavaScript Date object in multiple ways—anniversary, expiry, total days, date with time, or time alone.
	- Identifier customization: Integrate custom objects to be treated as standard data types, enabling complex comparisons. An object denoting "tomorrow" or "next month" can be identified as a Date for comparison purposes.
	- Comparer customization: Supports Conditions that compare two values so they can handler your non-standard data types. 


## Learning Jivs
[Jivs source code](https://github.com/plblum/jivs) is heavily and meaningfully commented, and its all available in TypeDoc format at [jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc). Use this section for an orientation.

### Quick terminology overview
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

### Quick API overview

As a service, you need to know about its API. The primary pieces for
building a UI are:

-   `ValueHost classes` -- Identifies a single value to be validated
    and/or contributes data used by the validators. Each has a unique
    identifier that you use to match it to a specific input, such as the
    ID of the HTML input tag (\"TextBox1\"), or even better, a path
    where it is found in a Model (\"Customer/Address/Street\").

    -   `NonInputValueHost class` -- For values that are not validated, such as a
        field from your Model that isn't editable, or a global value of
        your app, as both can contribute to your validation logic. 
        
        >Take a postal code as an example. You might use a regular expression
        to evaluate it. But that expression depends on the country of
        delivery. So you would use a `ValueHost` to pass in a country
        code, and let the validation internally select the right
        expression.
        
        Some members of this class are:
		```
		getId
		getLabel
		getValue
		setValue
		descriptor // contains the configuration
		```

	- `InputValueHost` class - For Input values optionally with validators. In fact, they have all of the features of `NonInputValueHost`, just validation capability and know of a second value from the input.		

		Some members of this class are (in addition to the inherited from NonInputValueHost):
		```
		getInputValue
		setInputValue
		validate
		isValid
		```
-   `ValidationManager class` -- The front-end of this API. It's where you
    configure the `ValueHosts`, get access to a `ValueHost`, validate, and get the validation results.

	Some members of this class are:
	```
	getValueHost
	validate
	setBusinessLogicErrors
	getIssuesForInput
	getIssuesForSummary
	```
-   `Condition classes` -- Classes that evaluate value(s) against a rule
    to see if those values conform. `Condition classes` exist for each
    business rule pattern, such as *required* or *compare two values are
    not identical*. While there are many standard rules for which there
    are `Conditions` included in this library, you are often going to need
    to build your own.

	Some members of these classes are:
	```
	evaluate
	conditionCategory
	descriptor // contains the configuration
	```

-   `InputValidator` class -- Handle the validation process of a single rule and deliver the error messages to the `InputValueHost's` list of issues found. It contains one `Condition`, an error message, a second error message to be used in the Summary, and logic to determine if the validator will even run.

	Some members of this class are:
	```
	validate
	descriptor // contains the configuration including error messages and condition.
	```
### Conditions - the validation rules
You need to build a class that adapts your validation rules to Jivs own types and classes. Jivs uses the classes that implement the `ICondition interface` to package up a validation rule, and `ConditionDescriptor type` to inform the `Condition` class how to configure itself. The class is a bridge between business logic and your UI. This section provides the details.

#### Separation of concerns: Input Validation vs Business Logic validation

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

#### Configuring a validation rule in Jivs

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
- `NoMatch` -Data violated the rule
- `Undetermined` – Data wasn’t appropriate for evaluation. Example: an empty textbox’s value isn’t ready for a “Compare the input’s date value to Today”. There needs to be text representing a date first.
</details>

Jivs provides numerous `Condition classes`. 
<details>
<summary>Expand to see just a few.</summary>

- `RequiredTextCondition`, `RequiredIndexCondition` - for required fields
- `DataTypeCheckCondition`, `RegExpCondition` - for checking the data conforms to the data type.
- `RangeCondition`, `EqualToCondition`, `GreaterThanCondition` - Comparing values
- `AllMatchCondition`, `AnyMatchCondition` - For creating complex logic by using multiple `Conditions`.
</details>

To use them, you need to populate their `ConditionDescriptor type`, which has configuration properties specific to its class. 

We'll work with this example. Here's the rule we want to implement: Compare a date from the Input to today's date.

The `EqualToCondition` is the right Condition for the job.  You need to create a `EqualToConditionDescriptor` that Jivs will use later to prepare the `EqualToCondition`. Here's that `ConditionDescriptor`:
```ts
interface EqualToConditionDescriptor {
    type: string;
    valueHostId: null | string;
    secondValueHostId: null | string;
    secondValue?: any;
    conversionLookupKey?: null | string;
    secondConversionLookupKey?: null | string;
    category?: ConditionCategory;
}
```
>Where's the error message? A `Condition` is just part of a Validator. The `InputValidator class` connects your Condition to its error message.

Your new code should look like this, where `ValueHostId` is your identifier for a field on the Model that you call “SignedOnDate”. (More on `ValueHost Ids` later.)
```ts
{
    type: 'EqualTo';
    valueHostId: 'SignedOnDate';
    secondValue: date object representing Today;
}
```
#### Bridging business logic and UI validation

We recommend that you create a Factory-style class that takes your business logic validation information in and returns the appropriate `ConditionDescriptor` already configured. Let’s suppose that your business logic has a class called BusinessLogicComparer that looks like this:
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
  create(fieldRef: string, businessLogicRule: any): ConditionDescriptor
  {
    if (businessLogicRule instanceof BusinessLogicComparer)
      switch (businessLogicRule.operator)
      {
        case ConditionOperators.Equals:
          return <EqualTosConditionDescriptor>{
            type: 'EqualTo',
            valueHostId: fieldRef,
            secondValue: businessLogicRule.secondValue
          }
      }
  }
}
```
Use your Factory as you assemble the `ValidationManagerConfig object`. Its just one part of the work to configure the `ValidationManager`.

### ValueHosts and their IDs

Next task is to give names to every UI widget that correlates them to the fields of the Model.

In this example, our Model’s property names are used in the input tag’s name attribute.

| Model fields | HTML tag
| ----  | ----
| FirstName | `<input type="text" name="FirstName" />`
| LastName | `<input type="text" name="LastName" />`

Jivs wants those same names for basically the same purpose of correlating with fields in the Model. Instead of an HTML tag, Jivs uses the `ValueHost class`.
When we configure the above Model for Jivs, you can imagine something like this object:
```ts
[
  {
	id: 'FirstName',
	validators: [ condition descriptors ]
  },
  {
	id: 'LastName',
	validators: [ condition descriptors ]
  }
]
```
In fact, that’s about right, only with more properties. Those objects use the `InputValueHostDescriptor type`.
```ts
interface InputValueHostDescriptor {
  type?: string;
  id: string;
  label: string;
  dataType?: string;
  initialValue?: any;
  validatorDescriptors: null | InputValidatorDescriptor[];
  group?: undefined | null | string | Array<string>;
}
```
Here’s how your configuration actually looks:
```ts
[
  {
    type: 'Input',
    id: 'FirstName',
    label: 'First name', // localized, of course!
    dataType: 'String',
    validatorDescriptors: [ InputValidatorDescriptors ]
  },
  {
    type: 'Input',
    id: 'LastName',
    label: 'Last name',
    dataType: 'String',
    validatorDescriptors: [ InputValidatorDescriptors ]
  }
]
```
The `ValueHost` Ids are also used to help a `Condition` retrieve a value from a `ValueHost`. Suppose that we use the `NotEqualToCondition` on FirstName to compare to LastName. You have to supply the `ValueHost Id` for the LastName field to the condition.
```ts
{
  id: 'FirstName',
  ...
  validatorDescriptors: [
    {
      conditionDescriptor: 
      {
        type: 'NotEqualTo',
        valueHostId: null, // because owning ValueHost is provided automatically to the Condition.evaluate function.
        secondValueHostId: 'LastName'
      }      
      ... and properties of InputValidatorDescriptor that we've yet to cover ...
    }

  ]
}
```
### InputValidators: Connecting Conditions to Error messages

Validation is really just a process that evaluates some rule and returns a result. If there was an error, the result involves an error message. The `InputValidator class` handles this work. Once again, we use a Descriptor to configure it. Here’s the `InputValidatorDescriptor type`:
```ts
interface InputValidatorDescriptor {
    conditionDescriptor: null | ConditionDescriptor;
    conditionCreator?: ((requester) => null | ICondition);
    errorMessage: string | ((host) => string);
    summaryMessage?: null | string | ((host) => string);
    severity?: ValidationSeverity | ((host) => ValidationSeverity);
    enabled?: boolean | ((host) => boolean);
    enablerDescriptor?: null | ConditionDescriptor;
    enablerCreator?: ((requester) => null | ICondition);
}
```
Because this is so full of goodness, let’s go through each property.

-	`conditionDescriptor` – Already described above. It is not the only way to setup a Condition…
-	`conditionCreator` – Alternative to creating a Condition by returning an implementation of ICondition. This choice gives you a lot of flexibility, especially when you have some complex logic that you feel you can code up in an evaluate method easier than using a bunch of Conditions.
-	`errorMessage` – A template for the message reporting an issue. Its intended location is nearby the Input, such that you can omit including the field’s label. “This field requires a value”. As a template, it provides tokens which can be replaced by live data. (Discussed later).
-	`summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary. Its normal to include the field label in this message, using the {Label} token: “{Label} requires a value”.
-	`severity` – Controls some validation behaviors with these three values.
	-	`Error` – normal error and the default when this field is omitted.
	-	`Severe` – If there are more validation rules, skip them. Severity=Error continues to evaluate the remaining validation rules.
	-	`Warning` – Want to give the user some direction, but not prevent saving the data.
-	`enabled` – A way to quickly disable the InputValidator.
-	`enablerDescriptor` and `EnablerCreator` – The *Enabler* uses a `Condition` to determine if the `InputValidator` can validate. Often validation rules depend on other information for that. For example, you have a checkbox associated with a text box. Any validation rule on the text box isn’t used unless the checkbox is marked. You would assign a `Condition` to evaluate the value of the checkbox to the Enabler.

Now let’s place the `InputValidatorDescriptor` into our previous example using a Model with FirstName and LastName.
```ts
[{
  type: 'Input',
  id: 'FirstName',
  label: 'First name',
  dataType: 'String',
  validatorDescriptors: [{
    conditionDescriptor: {
      type: 'Required',
      valueHostId: null
    },
    errorMessage: 'This field requires a value',
    summaryMessage: '{Label} requires a value.',
  },
  {
    conditionDescriptor: {
      type: 'NotEqualTo',
      valueHostId: null,
      secondValueHostId: 'LastName'
    },
    errorMessage: 'Are you sure that your first and last names are the same?',
    summaryMessage: 'In {Label}, are you sure that your first and last names are the same?',
    severity: 'Warning'
  }]
},
{
  type: 'Input',
  id: 'LastName',
  label: 'Last name',
  dataType: 'String',
  validatorDescriptors: [{
    conditionDescriptor: {
      type: Required,
      valueHostId: null
    },
    errorMessage: 'This field requires a value',
    summaryMessage: '{Label} requires a value.',
  }]
}]
```

### Configuring the ValidationManager

With Jivs, the UI uses the `ValidationManager class` to manage the `ValueHosts`, run validation, and get any issues found. All of your UI widgets should have access to the `ValidationManager`, so they can take actions resulting from validation.

`ValidationManager` needs to be configured first. Much of that work was described in the previous sections that built `ValueHostDescriptors`, `InputValidatorDescriptors`, and `ConditionDescriptors`. The configuration is contained in the `ValidationManagerConfig type`.

Here’s pseudocode for creating the `ValidationManager`.
```ts
let valueHostDescriptors = ... copied from previous example ...
let services = new ValidationServices();	// alert! We are going to replace this
let config = <IValidationManagerConfig>{
  services: services,
  valueHostDescriptors: ValueHostDescriptors
}
let validationManager = new ValidationManager(config);
// TODO: expose this validationManager to your widgets that need validation
```
Here’s `IValidationManagerConfig type`:
```ts
interface ValidationManagerConfig {
    services: IValidationServices;
    valueHostDescriptors: ValueHostDescriptor[];
    savedState?: null | ValidationManagerState;
    savedValueHostStates?: null | ValueHostState[];
    onInputValueChanged?: null | InputValueChangedHandler;
    onStateChanged?: null | ValidationManagerStateChangedHandler;
    onValidated?: null | ValidationManagerValidatedHandler;
    onValueChanged?: null | ValueChangedHandler;
    onValueHostStateChanged?: null | ValueHostStateChangedHandler;
    onValueHostValidated?: null | ValueHostValidatedHandler;
}
```
Let’s go through this type.

-	`services` – Always takes a `ValidationServices object`, which is rich with services for dependency injection and factories. You will need to do a bunch to configure this, but don’t worry, we’ve got a code snippet to inject into your app to assist. (Described later.)
-	`valueHostDescriptors` – Already previously described. However, we haven’t mentioned including `NonInputValueHost classes` for data that isn’t associated with an Input field. `ValueHosts` expose values to validation, and some of those values may not come from editable elements. One use-case is taking value from a property on the Model that is used for comparisons. There are several other use-cases described later.
-	`savedState` and `SavedValueHostStates` – `ValidationManager` is stateless, or at least it knows how to offload its stateful data to the application. If you want to retain state, you’ll capture the latest states using the `OnStateChanged` and `OnValueHostStateChanged` events, and pass the values back into these two Config properties.
-	`onStateChanged` and `onValueHostStateChanged` must be setup if you maintain the states. They supply a copy of the states for you to save.
-	`onValueChanged` notifies you when a `ValueHost` had its value changed.
-	`onInputValueChanged` notifies you when an `InputValueHost` had its Input Value changed.
-	`onValidated` and `onValueHostValidated` notifies you after a `validate function` completes, providing the results.

### Configuring the ValidationServices
The `ValidationServices class` supports the operations of Validation with services and factories, which of course means you can heavily customize Jivs through the power of interfaces and dependency injection.

`ValidationServices` is where we register new `Conditions` and classes to help work with all of the data types you might have in your Model. None of those classes are prepopulated. So let’s get them setup.

Go to [https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts](https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts)

Add the contents of this file to your project. You will likely need to regenerate the list of inputs as your project source may be NPM. It results in this new function.
```ts
export function createValidationServices(): ValidationServices {
…
}
```
Once it compiles, you can edit as needed, although initially leave most of the classes it registers alone, so you can start using the system.

Now that you have the `createValidationServices function`, let’s modify your earlier configuration code for `ValidationManager` by using it.

```ts
let valueHostDescriptors = ... copied from previous example ...
let services = createValidationServices();	// replaced
let config = <IValidationManagerConfig>{
  services: services,
  valueHostDescriptors: ValueHostDescriptors
}
let validationManager = new ValidationManager(config);
// TODO: expose this validationManager to your widgets that need validation
```
### Creating your own Conditions
Jivs provides many `Condition classes`, covering typical cases. All classes implement the `ICondition interface`.
```ts
interface ICondition {
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
    conditionType: string;
}
```
When you want your own logic, there are several ways approach it.
- Create a plain JavaScript object that matches the `ICondition interface` contract. This is often used for one-off logic.
	```ts
	let myCondition = <ICondition>{
	   evaluate: (valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> =>
	   {
	   // evaluate the value(s) and return a ConditionEvaluateResult
	   },
	   category: 'Content';
	   conditionType: 'MyCondition';
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
	   public get conditionType(): string { return 'MyCondition'; }
	}
	```
- Subclass from an existing `Condition class`. Choose when you want to make a minor modification or want to preconfigure the existing class.
	```ts
	export class MyCondition extends RegExpCondition 
	{
	   constructor(descriptor: IRegExpConditionDescriptor)
	   {
	      super({ 
	         ...descriptor, 
	         ...{ expressionAsString: '^\\d\\d\\d\\-\\d\\d\\d\\d$'} 
	      });
	   }
	   public get conditionType(): string { return 'MyCondition'; }
	}
	```
- Subclass from an abstract `Condition class` designed for the type of `Condition` you need. The abstract classes provide some useful methods to take advantage of. They also require a `ConditionDescriptor interface`, which means you can get additional values from the user passed in.
	```ts
	export interface MyConditionDescriptor extends RegExConditionBaseDescriptor
	{
	   allowTwo?: boolean; // true means pattern is repeated with a comma separator
	}
	
	export class MyCondition extends RegExpConditionBase<MyConditionDescriptor>
	{
	   protected getRegExp(valueHostResolver: IValueHostResolver): RegExp
	   {
	      let base = @'\d\d\d\-\d\d\d\d';
	      if (this.descriptor.allowTwo)
	         return new RegExp('^' + base + '(\,\s?' + base + ')?$');
	      return new RegExp('^' + base + '$');
	   }
	   public get conditionType(): string { return 'MyCondition'; }
	}
	```
As you can see, all require that you supply a **conditionType** value. That’s a unique name for you to specify. It is used by the `ConditionFactory` to create your instance as the `Type` property on the `ConditionDescriptor`, and within Jivs to distinguish each validation rule.

#### Additional considerations
- Look here for source code to the concrete conditions we’ve supplied:
[https://github.com/plblum/jivs/blob/main/src/Conditions/ConcreteConditions.ts](https://github.com/plblum/jivs/blob/main/src/Conditions/ConcreteConditions.ts)
- Look here for source code to abstract conditions and the factory:
[https://github.com/plblum/jivs/tree/main/src/Conditions](https://github.com/plblum/jivs/tree/main/src/Conditions)
- Return `Undetermined` when unsupported data is found. For example, if you are evaluating against a string, test `typeof value === 'string'` and return `Undetermined` when false.
- Always write unit tests.
- `conditionType` should be meaningful. Try to limit it to characters that work within JSON and code, such as letters, digits, underscore, space, and dash. Also try to keep it short and memorable as users will select your Condition by specifying its value in the Descriptors passed into the `ValidationManager`.
- `conditionType` values are case sensitive.
- So long as it inherits from any supplied concrete or abstract class, register it with the `ConditionFactory`. The factory is on the `ValidationServices class`. You will likely register it with the rest already supplied in the `RegisterConditions function` that you already set up.
	```ts
	cf.Register<MyConditionDescriptor>(
	        'MyCondition', (descriptor) => new MyCondition(descriptor));
	```
- If your class does not conform to the existing `ConditionFactory`, subclass it or implement the `IConditionFactory interface`. Always attach your factory to the `ValidationServices class` in the `createValidationServices function`.
- If you have a one-off, ignore the `ConditionFactory`. Instead, create it using the `InputValidatorDescriptor.conditionCreator`. This property takes a function and returns either an instance of an `ICondition object` or null if there was nothing to setup.
	```ts
	[{
	   type: 'Input',
	   id: 'FirstName',
	   label: 'First name',
	   dataType: 'String',
	   validatorDescriptors: [{
	      conditionCreator: (requester: InputValidatorDescriptor) : ICondition | null =>
	      {
	         return new MyCondition();
	      },
	      errorMessage: 'This field requires a value',
	      summaryMessage: '{Label} requires a value.',
	   }],
	}]
	```
---
__This documentation is unfinished.__ Plenty still to write about:

-   Each class and its members

-   Maintaining state

-   Supporting custom data types (your own classes that reflect a value,
    like how the JavaScript Date object handles a DateTime value)
    
- Localization

-   Relating this to other input validation libraries


