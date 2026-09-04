# Jivs - JavaScript Input Validation Service
*Jivs is a work-in-progress. This is a preview to get feedback from the community.
I'm looking for an assessment of the architecture. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later. --- Peter Blum*

## What is Jivs?
<details open>
Jivs — JavaScript Input Validation Service — is a suite of libraries that help answer this question: how do I deal with <dfn title="Validating user input or externally supplied data to prevent saving invalid data">input validation</dfn> in the UI and/or the Model?

**Jivs offers a focused approach to input validation, respecting the boundaries between your business logic and user interface.** It’s ideal for projects where the <dfn title="A single condition that evaluates the incoming data and determines if it is valid or not.">validation rules</dfn> are considered the domain of the business logic, and for projects that use strong OOP patterns like separation of concerns and dependency injection.

With Jivs, the UI knows almost nothing about what needs to be validated. A form just posts input values into Jivs and asks for the validation results. It gets back the Validation State, such as
"Valid", "Invalid", or even "Undetermined", and any issues found.

The UI uses that information to change the visuals, like showing the error messages, and blocking data submission if necessary.

<img src="http://jivs.peterblum.com/images/jivs-high-level-diagram.svg"></img>

- **Business logic can dictate validation rules**: Validation rules are often defined in the business logic. Jivs allows the business logic team to deliver those rules, ensuring that validation logic is directly aligned with the business requirements and evolves alongside the application’s core functionality.

- **UI developers can make the adjustments they need**: Jivs gives UI developers the flexibility to tailor the user experience while maintaining the integrity of the validation rules. They can customize error messages, apply localization, and disable unnecessary validators, ensuring that they can achieve their goals. They can also incorporate UI-specific validators, such as for a string parsing error. 

- **For forms that are not business logic-driven**: Whether or not business logic drives validation, Jivs keeps validation rules separate from the form. It provides flexibility for apps without business logic-driven validation and for forms that don’t require it, ensuring consistency and maintainability.

- **Service-oriented architecture**: At the heart of Jivs is *Jivs-Engine*, with a service-oriented architecture built in TypeScript, so it works within browsers and Node.js. Jivs-Engine is designed to have an ecosystem of libraries that tackle UI frameworks, support models, and use various third-party libraries.

- **Built with modern OOP patterns**: Jivs is built on solid object-oriented programming (OOP) principles, such as Single Responsibility Objects, Services, Factories, and Dependency Injection. Many components within Jivs are replaceable, allowing you to use your preferred third-party libraries for tasks like formatting, localization, and logging. These patterns have also helped us build out our own unit tests, achieving almost 100% code coverage with meaningful tests.

- **Built from experience**: Jivs is the result of over 20 years of experience in building input validation software, addressing many nuances not found in most validation software but that solve real-world issues faced by developers. This depth of experience is embedded throughout the toolset. Take a look at the features to see how Jivs goes beyond the basics, offering a comprehensive solution to real-world validation challenges.

- **Open source and MIT License**: [https://github.com/plblum/jivs](https://github.com/plblum/jivs)
</details>

## When to use Jivs?
<details>
- Your app needs to validate values, whether from user input or Model properties.
- Your app uses JavaScript or TypeScript
- Your app targets the browser and/or Node.js
</details>

## What features does Jivs offer?
<details>

Start with reading [What is Jivs](#what-is-jivs) to learn about:
- Input validation rules kept separate from UI
- Strong server side validation story
- Service-oriented architecture and strong use of modern OOP patterns

Some of what follows expands on those topics.

### Validation rule features
A validation rule is a single _condition_ that evaluates the incoming data and determines if it is valid or not. There may be several distinct rules on a single input, such as "requires a value", "must be a date", etc. It is the heart of input validation.

- Validation rules can be configured by the business logic layer, allowing UI widgets to remain unaware of validation rules, but still supply suitable error messages. Jivs notifies UI widgets with validation outcomes.
    ```ts
    export class PersonModelRules extends ValueHostRulesBase {
      protected configureRules(builder: IValueHostsManagerConfigBuilder, options?: ValueHostRulesOptions): void {
        builder.field('firstName').requireText().regExp('^[\\w\\s''\\-']*$');
        builder.field('lastName').requireText().regExp('^[\\w\\s''\\-]*$');
      }
    }
    ```
- The UI may introduce its own validation rules too, either to compliment those from business logic or as an alternative to having business logic supply them.
    ```ts
    export class PersonFormEditorRules 
        extends PersonModelRules 
        implements IAdaptModelRulesToForm {
        protected adaptToForm(adapter: IFormConfigAdapter, options?: ValueHostRulesOptions): void {
          // apply some properties to the fields and validators
          adapter.modify('firstName', {label: 'First Name'}).validator(ConditionType.RequireText, '{Label} is required.');
          adapter.modify('lastName', {label: 'Last Name'}).whenToEnable((whenBuilder) =>
            whenBuilder.fieldValue('checkbox1').equalTo(true));
          // the UI adds its own field that is used in the previous line.
          adapter.field('checkbox1', LookupKey.Boolean);
        }
      }
    ```
    > The most important concept here is that business logic owns the rules, and the UI owns the appearance.
    So you cannot modify the rules.
- Provides "Condition" objects to define the validation rules.
    - Some of the supplied conditions are: Require, Regular Expression, Range, Compare Two Values, String Length, Not Null, All Match and Any Match. Use All and Any Match to build complex validation rules. [See a complete list.](./docs/API/Conditions/Conditions_Included_with_Jivs.md)
    - Create your own validation rules by defining your own Condition objects. Conditions support asynchronous evaluate, as often the server has the info needed to validate.

- Most validation rules come from business logic. The UI's inputs are often textboxes, where a string representing the native value is entered. So the UI is responsible for adding validation for when the parser fails. Jivs automatically injects the "Data Type Check" validation rule to handle this.
- Sometimes the UI must selectively enable a rule from business logic. It can wrap the validation rule in a "WhenCondition" to handle this.

- Taking a single responsibility pattern approach, comparison Conditions (equals, greater than, range, etc) offload data type-specific operations to other classes. That means you don't have to write another comparison validator when introducing a new data type. Instead, you write a few objects that support your data type and register them with the appropriate factories. The existing Conditions will continue to work.
  
- You can supply values into the validation rules from several sources:
    - Fields - Your UI inputs, model properties, or anything else that allows change
  and needs validation.
    - Static - Static values, like Today's date, or the current culture identifier.
    - Calculated - Runs a calculation function whose result is its value.
  
    Within the validation rule, just assign the name of a "value host" and you can expect its value to be used in validation.

    In this example, the lessThanOrEqual validator gets its value from NumOfDays, a static value, and DiffDays, a calculated value.
    ```ts
    builder.field('StartDate', LookupKey.Date)
    .lessThan('EndDate')
    .lessThanOrEqual('NumOfDays', null, 'DiffDays',
        'The two dates must be less than {CompareTo} days apart.');
    builder.field('EndDate', LookupKey.Date, { label: 'End date' });

    // provide a calculation for StartDate <= NumOfDays
    builder.calc('DiffDays', LookupKey.Number, this.differenceBetweenDates);

    // provide a constant for the number of days used in the calculation
    builder.static('NumOfDays', LookupKey.Number);
    ```  
### Error message features
The error message guides the user into understanding what is invalid and often suggests how to correct it. For example "Enter a date in the form MM/DD/YYYY". A poorly written error message will not be helpful. So Jivs has a lot of depth in its error message support.

- Localizable. Interface driven allowing you to substitute your preferred localization libraries.
- Error messages can contain tokens. Let's look at this one which represents a range validation rule evaluating a date input:

    `The {Label} must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}. You entered {Value:AbbrevDate}.`

  - Tokens can show the configuration of the validation rule. Here is gets the field's name in {Label} and being a Range validation rule, its minimum and maximum.
  - The {Value} token will show the current input value.
  - Values may not already be strings. A formatter is used to convert a native value (like a Date object) into a localized string. If written as {Minimum}, it would use a default formatter (short date pattern). But here the user wants the abbreviated date pattern, so the token allows for {tokenName:formatter}.

  Resulting in:
  
    `The Event Date must be between Jan 1, 2025 and Mar 30, 2025. You entered Jun 6, 2025.`
  
- Validators have two error messages. The first message, designed for proximity to the UI widget, is succinct, focusing on the issue without field context.  

  `Requires a value.`

  The second, intended for a Validation Summary displayed elsewhere on the screen, includes the field name for clarity. 
  
  `First name requires a value.`
  
- You can setup default error message templates, localized of course. This is particularly useful for Data Type Check validations, where distinct data types require specific guidance. For instance, use "Enter a date in the form MM/DD/YYYY" for dates, and "Enter a number using only digits" for numbers.


### User experience features
- Validation feedback is immediate. Whether you ask for it as the field is exited or as you type, Jivs will notify the UI elements to update themselves.
- Jivs can provide every error on a field, not just the first one found, to the UI ensuring thorough feedback and guidance.
- When an error has been corrected, Jivs notifies the UI, which may show a checkmark to indicate the fix was accepted.
- When you ask Jivs to validate, there are times that some validators should get skipped for better user experience.
    - Run form validation after the form is setup can skip the required validators, as it does not make sense to call out errors when the user hasn't had a chance to edit those fields.
    - Run field validation as the user types. Only these validators make sense to interactively update error messages: Required, regular expression, and string length.
    - Validators can be wrapped in the WhenCondition to disable themselves based on a rule. For example, unless a checkbox is marked, an associated text box will not report errors. Also the containing field can be configured to disable all of its validators based on a rule.
    - If the user has edited a field and it has yet to be validated, the form reports "do not save", helping prevent form submission without validation.

### Data submission features
Data submission has 3 phases to ensure nothing illegal gets through:
- Start by having Jivs validate the entire form. It must report back that the form is valid before allowing submission.
- Upon receiving the form's data, the server again must validate that data. This is key to protect against hackers attempts to bypass the client-side validation. If your server is using Node.js, Jivs can handle this using the same configuration you created for the client-side.

  The server's business logic may run additional validation rules that may fail or the act of saving itself fails.
- If the server finds any issues preventing saving, it can package up the errors to send back to the client, where Jivs will update the form accordingly.

### Deep support for data types
You know that a number can represent a unit of measurement, currency value, percentage and much more. Strings can represent phone numbers, names, product codes, etc. Dates can represent expiry (month/year), date only (omit time), time of day (omit date), etc.

Jivs wants you to tell it about your usages, not just of built-in primitives, but also of any data types you introduce. 

It uses "Lookup Keys", strings that identifies the data type more precisely. [See a list of those supplied](http://jivs.peterblum.com/typedoc/enums/jivs-engine_DataTypes_Types_LookupKey.LookupKey.html). When configuring a field, specify its Lookup Key to establish the data type. You will immediately get benefits around that data type like formatting error message tokens, parsing text, and validation specific to that data type.

In this example, we immediately get the benefits for a validator to confirm the text is a date and to parse from text to a Date object.
```ts
builder.field('birthDate', LookupKey.Date)
```
We encourage you to add to our list. For example, add a lookup key for "EmailAddress" and attach a regular expression validation rule to it.
    
### Customization
Jivs is designed around the services and factory patterns. Most of its types, whether focused classes or full services are built using interfaces, allowing extension and replacement.

Jivs accommodates unique usage scenarios through extensive customizability:
- Parsers: Transform the strings from your inputs into their native types.
- Formatters: Convert values into the strings shown in error message tokens. For instance, configure error messages to show dates in an abbreviated format rather than a short date format using third party localization library.
- Converters: During validation, often a supplied value needs to be converted before actually validating it.
  
### Logging and diagnostics
- Jivs includes a logging object to help you diagnose issues.
- Logging only works well if the code base uses it - and avoids overusing it causing inefficiencies. We've used it quite a bit for debugging/diagnostics level cases, but all logging is "lazy", only requesting the logging data when the logging level permits.
- The Logging base class has a filtering model that allows you to selectively use a lower logging level based on what you want to focus on. So you can keep logging all errors, and only get info or debug level content from the validation process. 

### Testing
Elsewhere we've mentioned that Jivs unit tests have nearly 100% code coverage. Your code should be able to write effective tests covering validation too. To that end:
- By being a service and by using dependency injection throughout, you can write those tests without having HTML involved. Your focus can be "given this input value, what is the validation result?"
- Your tests can use logging at a debugging level to further expose what happened when a test fails.
- Dependency injection involves separating configuration from executing code. Often its not obvious what DI resolves, or if there are configuration errors until its consumed. Jivs provides a tool — the **Config Analysis Service** — to help. Activate it during development and testing to get a report of errors in the configuration. It also can reveal the final configuration of each Lookup Key: I want my "EmailAddress" Lookup Key to use X, Y, and Z. Did that actually happen?

### Single Source of Truth
Single Source of Truth — SSOT — is a popular buzzword, but is also a great pattern. Jivs can be the SSOT of your model in a form!
> Using Jivs for SSOT is entirely optional. It just fits well in the role.

When using Jivs, each Model property keeps its value in two places in the UI:
- The UI editor widget
- Jivs own ValueHostsManager

The value stored in ValueHostsManager is already converted from the editor's string to the native type required by the Model property. So why not use it when reading to or writing from the Model?
```mermaid
flowchart LR
    MODEL["Model"] --> VHM["ValueHostsManager"]
    VHM --> INPUT["Editor Elements"]
```
```mermaid
flowchart LR
    INPUT["Editor Elements"] --> VHM["ValueHostsManager"]
    VHM --> MODEL["Model"] 
``` 
If you do this, Jivs will handle the parsers and formatters you normally write for converting between native value and the editor's value. That will reduce those scope of your coding, and use Jivs' well-tested parsers and formatters.

</details>


## What inspired Jivs?
<details>

I am Peter Blum, originator of Jivs. Back in the day (2002-2013), I created a successful suite of Web
Controls for ASP.NET WebForms which featured a complete replacement to
its built-in input validation. I really learned a lot about what website
developers wanted on-screen. The result was a library that delivered business logic driven validation rules for the UI for ASP.NET WebForms. Unfortunately at the time, ASP.NET WebForms was no longer popular, so neither was my library.

In the 10+ years that followed, I've
learned much more in terms of OOP patterns programming, plus TypeScript
came out and JavaScript introduced Classes. Wonderful stuff that I now
use here, in **Jivs**.

I continue to look at UI frameworks that include input validation tools, and am always amazed how much they lack. They may not offer the flexibility to address your needs. Good OOP design demands separation of concerns which is often lacking. When they fall short, you have a lot more to write. So use Jivs as a replacement and take control over the input validation portion of your app. 

> *Peter Blum, .net and web coder since 2002*
</details>

# Installing Jivs

Jivs is available as npm packages. It has a number of libraries.

Jivs-engine is the core and is needed by all other libraries. [Jivs-engine npm package](https://www.npmjs.com/package/@plblum/jivs-engine).
```
npm install --save @plblum/jivs-engine
```
[Jivs source code](https://github.com/plblum/jivs) is open source on GitHub.

**For each application**, go to [https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts](https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts)

Add the contents of the `create_services.ts` file to your project. It results in several new functions starting with this one.
```ts
export function createJivsServices(... parameters ...): IJivsServices {
…
}
// plus numerous other functions
```
Edit as needed, although initially leave most of the classes it registers alone, so you can start using the system.
For more, see [JivsServices](./docs/API/JivsServices/Home.md).

# Digging in
Please use these documents:

- [Learning Jivs](./docs/Learning_Jivs/Home.md)
- [Terminology](./docs/Terminology.md)
- [ValueHostsManager Configuration Guide](./docs/ValueHostsManager_Configuration_Guide.md)
- [The API](./docs/API/Home.md)
  - [ValueHostsManager](./docs/API/ValueHostsManager/Home.md)
  - [ValueHosts](./docs/API/ValueHosts/Home.md)
  - [Validators](./docs/API/Validators/Home.md)
  - [Conditions](./docs/API/Conditions/Home.md)
  - [JivsServices](./docs/API/JivsServices/Home.md)
  - [ValueHost Rules](./docs/API/ValueHost_Rules/Home.md)
  - [Builder API](../docs/API/ValueHostsManager_Configuration_Guide.md)
  - [ModelReader and ModelWriter](./docs/API/ModelReader_and_ModelWriter/Home.md)
  - [ValidationState and IssueFound](./docs/API/Validators/Validation_State.md)

## Additional topics
- [Understanding Conditions within Validators](./docs/API/Conditions/Understanding_Conditions_within_Validators.md)
- [Invoking Validation](./docs/API/Validators/Invoking_Validation.md)
- [Handling ValidationState Changes](./docs/API/Validators/Handling_ValidationState_Changes.md)
- [Data Types and Companion Services](./docs/API/Data_Type_Support/Home.md)
- [Localization](./docs/Localization.md)
- [Logging](./docs/API/JivsServices/Logging.md)
- [Testing your work](./docs/Testing/Home.md)