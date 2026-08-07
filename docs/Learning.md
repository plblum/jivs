# Learning Jivs
[Jivs source code](https://github.com/plblum/jivs) is heavily and meaningfully commented, and it is all available in TypeDoc format at [jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc). Use this section for an orientation.

## Initial concepts
- All values from forms or models are stored in types known as **ValueHosts**. Learn this term because its used throughout.
    + `ValueHost` - the overall concept. Its class retains a name, data type, label, and other metadata.
    + `FieldValueHost` - ValueHost to handle data from inputs and models. It adds validation support.
    + `StaticValueHost` - ValueHost to hold a value that will not be validated, but can be used in comparison validators.
    + `CalcValueHost` - ValueHost to calculate a value. It will not be validated, but can be used for comparison validators.
- Your form or model has multiple `ValueHosts`. They are gathered together in the **ValueHostsManager**, which is the central object 
you use with a form or model. It contains the list of `ValueHosts`, callback hooks, and more. Use it to get and set values, validate, retrieve validation results, 
and report additional errors determined by your business logic.
- We keep user interface separate from validation operations. Values from your inputs and model properties must be passed into the `ValueHostsManager`.
    + In the past, you might have had your validation code retrieve individual values from the fields. Jivs is not going to read from the UI.
    + This means you must supply the initial value of your inputs into Jivs _before_ allowing the user to edit.
        + Use the `ModelReader` class to prepopulate with an entire model at once.
        + Use `FieldValueHost.setValue()` otherwise.
- Each `FieldValueHost` may have two representations of its value:
    + Native value - The value that will actually be stored in the model or table.
    + Text value - The value as represented by the input. 
- In HTML, data is represented as strings and needs conversion between text and native values. 
Same for most API calls, because it uses HTTP which is a textual format. These actions need parsers and formatters. 
    + Input element value changes: 
        ```
        get the text value → parse to its native value → retain both text and native values for various validation use cases.
        ```
    + Input element needs its initial value: 
        ```
        get the native value → format to its text value → assign to the input element.
        ```
- You need to make a decision for where the parsing and formatting is coded. _Jivs supplies them_ and builds them into its `setValue()` and `setTextValue()` functions, but you can use your own, especially with existing apps that only need validation.
- `ValueHostsManager` needs to be configured to express each ValueHost, including its validators. We have you create a class to wrap up all `ValueHost` configurations used by the `ValueHostsManager`, such as _PersonModelRules_. Within it, you will describe each `ValueHost` using a syntax called **Builder API**.
    ```ts
    class PersonModelRules extends ValueHostRulesBase {
        protected override configureRules(
            builder: IValueHostsManagerConfigBuilder,
            options?: ValueHostRulesOptions
        ): void {
            builder.field('FirstName', LookupKey.String)
                .requireText()
                .stringLength(50);

            builder.field('LastName', LookupKey.String)
                .requireText()
                .stringLength(50);

            builder.field('BirthDate', LookupKey.Date)
                .notNull();
            builder.field('Prefix', LookupKey.String);
            builder.field('Suffix', LookupKey.String);
        }
    }
    ```
- Due to separation of UI from business logic, when the form wants to use the Model's configuration, it likely will need to make adjustments. such as changing labels and error messages. The form is expected to subclass the Model's configuration and use the `IAdaptModelRulesToForm` interface.
    ```ts
    class PersonFormRules
        extends PersonModelRules
        implements IAdaptModelRulesToForm
    {
        public adaptToForm(
            adapter: IFormConfigAdapter,
            options?: ValueHostRulesOptions
        ): void {
            adapter.useOnlyTheseModelFields(['FirstName', 'LastName']); // any other field (birthdate, prefix, suffix) will be disabled
            // let's change some text on the model's FirstName and LastName ValueHosts
            adapter.modify('FirstName', { label: 'First name' })
                .validator(ConditionType.StringLength, 
                    'No more than {maximum} characters. You entered {length}.');
            // using the alternative syntax which supports many more properties...
            adapter.modify('LastName', { label: 'Last name' })
                .validator(ConditionType.StringLength, { 
                    errorMessage: 'No more than {maximum} characters. You entered {length}.'
                });
        }
    }
    ```
- Everything is supported by a service oriented architecture. Create an instance of `JivsServices` and supply it to `ValueHostsManager`. It supplies dependency injection for most of the features within Jivs. Make sure your app has a copy of the [`create_services.ts file`](../starter_code/create_services.ts) first. It gives you the `createJivsServices()` function that returns `JivsServices` and is where you customize those services. 

    Each time services are needed, just call that function:
    ```ts
    let services = createJivsServices('en-US'); // parameter identifies the culture
    ```

### Putting it all together: client side
Suppose that you have a form configured by PersonFormRules above. In this example, we create a model and send
it through a server API call.

```ts
const services = createJivsServices('en-US'); // see "Installing Jivs"
const rules = new DateFormRules(services);
const config = rules.configure();

// typical callbacks for browser-based code
// You can write them if you do not use one of the Jivs modules built for the UI
config.onValidationStateChanged = myValidationStateChangedFn;
config.onValueHostValidationStateChanged = myValueHostValidationStateChangedFn;
config.onTextValueChanged = myTextValueChangedFn;

const vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation

// Assign the initial values to each ValueHost to be available for validation.
// There are many ways to do this. We are showing assigning the native value from the model here.
// It assumes each ValueHost has been configured with a formatter.
vhm.vh('FirstName').setValue(person.firstName, { validate: false, reset: true });
vhm.vh('LastName').setValue(person.lastName, { validate: false, reset: true });
... and so forth ...
/* Or use the ModelReader class to copy values from model to all valuehosts together.
let modelReader = new ModelReader(vhm, person);
modelReader.read(); // ValueHosts are now updated!
*/

// Wire up your submit handler to use ValuesHostManager
function submitTheForm(vhm: ValueHostsManager): void
{
    let status = vhm.validate(); // it will notify elements in your UI of validation changes
    if (status.doNotSave)
    {
        // Prevent saving. User has to fix things
    }
    else
    {
        let model = fromFormToModel(vhm);  // your code to convert form data into a model
        // if you like, you can build the model from the ValueHostsManager because it actually
        // has all of the field values!
        /*
        function fromFormToModel(vhm: ValueHostsManager): Person
        {
            let person = new Person();
            person.firstName = vhm.vh('FirstName').getValue();
            person.lastName = vhm.vh('LastName').getValue();
            ... and the rest ...
            // or use our ModelWriter class
            let person = new Person();
            let modelWriter = new ModelWriter(vhm, person);
            modelWriter.write(); // now person is updated!
            return person;
        }
        */

        // Perform additional verification that Jivs lacks
        // If there are errors, provide them to Jivs like this:
        let issuesFound: Array<IssueFound> = myFinalErrorCheck(model);
        if (issuesFound && issuesFound.length > 0)
        {
            // Provide your errors to jivs to show in the UI
            vhm.addExternalIssuesFound(issuesFound, true); // true = issues were found locally. 
            // These will update the UI via onValidationStateChanged callback            
            return;
        }

        // Submit the page's data
        // "save" function is pseudocode: suppose you call your server and get back a promise<ModelType>
        // save(model, resolvecallback, rejectcallback)
        save(
            model, 
        // Promise resolve function hooked up within your save() function
            (model) => {
                // success - take next steps
            },
            // Promise reject function hooked up within your save() function
            () => {
                // You have already passed a string generated by ValueHostsManager.toValidationPayload()
                // through the response. Retrieve it
                let validationPayload = request.httpHeaders.get('jivserrors');  // pseudocode
                vhm.fromValidationPayload(validationPayload);
         // These will update the UI via onValidationStateChanged callback
            }
        );        
    }
}
```

### Putting it all together: server side
Suppose that you have a model configured by PersonModelRules above and are using Node.js.

```ts
const services = createJivsServices('en-US'); // see "Installing Jivs"
const rules = new PersonModelRules(services);
const config = rules.configure();

const vhm = new ValueHostsManager(config);   // 'vhm' will be used to handle validation

// Assign the initial values to each ValueHost to be available for validation.
// There are many ways to do this. We are showing assigning the native value from the model here.
// It assumes the model was captured prior to this step.
vhm.vh('FirstName').setValue(person.firstName, { validate: false });
vhm.vh('LastName').setValue(person.lastName, { validate: false });
... and so forth ...
/* Or use the ModelReader class to copy values from model to all valuehosts together.
let modelReader = new ModelReader(vhm, person);
modelReader.read(); // ValueHosts are now updated!
*/


// execute validation
let status = vhm.validate(); // it will notify elements in your UI of validation changes
if (status.doNotSave)
{
    // Prevent saving. User has to fix things. Report errors back to the client
    let toPassBack = vhm.toValidationPayload();
    // provide the content within toPassBack to the response however you see fit.
    response.httpHeader.add('jivserrors', toPassBack);  // this is pseudocode
}
else
    // Do post-validation work including saving and returning a success response

```

## Where you want to use validation

### As focus leaves an Input and its value changed
* Use the onchange event to tell the `ValueHostsManager` about the data change and run validation. 
  * You will need to have two values, the raw value from the Input (called the "Input Value") and the resulting value that is compatible with the property on your Model ("Native Value").
  * Jivs lets you assign a parser to each FieldValueHost. Just use: `valueHostsManager.vh.field('name').setTextValue(textValue, { validate: true });`
  * If you want to handle parsing elsewhere, use: `valueHostsManager.vh.field('name').setValues(nativeValue, textValue, { validate: true });`
* The `ValueHostsManager` will notify you about a validation state change through its `onValueHostValidationStateChanged callback`. Implement that callback to update your user interface.

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
This code initializes a `ValueHostsManager` and sets up the `onValueHostValidationStateChanged callback`. It should be invoked once and the `ValueHostsManager` instance should be accessible to the rest of this form's code.

```ts
let services = createJivsServices('en-US');
let rules = new PersonModelRules(services);  // subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
let vhm = new ValueHostsManager(config);

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
    let textValue = evt.target.value;
    vhm.vh.field('FirstName').setTextValue(textValue, { validate: true });
});
```
This code sets up the onchange event with your own parsing:
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=>{
    let textValue = evt.target.value;
    let { nativeValue, errorMessage } = myParser(textValue);	// return nativeValue=undefined when there is an error
    vhm.vh.field('FirstName').setValues(nativeValue, textValue, { 
        validate: true, 
        injectedError: errorMessage ? { errorMessage: errorMessage } : undefined
    });
});
```
See [Injecting errors on demand](#injecting-errors-on-demand) for more on the injectingErrors parameter.

### While the user types
Show or hide the error state as the user types. This is limited to Validators that evaluate the raw string, like RequireText, RegExp, and StringLength. Always setup the onchange event (described above) to get all Validators involved.

* Use the oninput event to tell the `ValueHostsManager` about the data change and run validation, with its "duringEdit" option set to true.
* The `ValueHostsManager` will notify you about a validation state change through its `onValueHostValidationStateChanged callback`.

All of the prior setup still applies. Here we add the oninput event handler:
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('oninput', (evt)=>{
    vhm.vh.field('FirstName').setTextValue(evt.target.value, { 
        validate: true, 
        duringEdit: true 
    });
});
```
### When the browser submits data to the server

Overview of the steps:

1. Validate the data, gathering issues found. If there are issues found, stop.
2. Send the data to the server to be saved.
3. Process the server's response. If there were errors, route them into the `ValueHostsManager` for display.

**Step 1**
- 1a. Call `ValueHostsManager.validate()`. Its result is ValidationState. When `ValidationState.doNotSave` is true, 
do not attempt step 2.
- 1b. If you have other processes prior to saving, execute them. They may result in errors too. They should be converted into an `IssueFound` object
and submitted as `Array<IssueFound>` to `ValueHostsManager.addExternalIssuesFound(array)`. They will appear in the UI supported by Jivs. Do not attempt step 2.

**Step 2** 
- 2a. Package up your data and send it to the server
- 2b. Server does its thing: server-side validation, actual saving, and returning the result: success or a list of errors.
- 2c. Evaluate the response from the server. 
    - If successful, you are done.
**Step 3**

- 3a. Retrieve the errors and supply them to Jivs through either `ValueHostsManager.addExternalIssuesFound(errors, true)` or `ValueHostsManager.fromValidationPayload(validationPayload)`.
    - `addExternalIssuesFound` targets a server side where you dictate the format of errors. 
    - `fromValidationPayload` targets Jivs running node.js on the server side.

#### Client side submission workflow

```ts
// we already have the ValueHostsManager instance fully configured in the variable vhm
// step 1a
let validationState = vhm.validate();  // any validation errors will be sent to the UI via onValidationStateChanged callback
if (!validationState.doNotSave)
{
  // step 1b
    let issuesFound: Array<IssueFound> = [];
    // your code for evaluating errors here.
    // Suppose that you convert your data into a Model object
    // and run some of your own validation on that object.

    let modelResult = convertToModel(); // again, your code or use our ModelWriter class
    // modelResult = { model: object | null, errormessage: string | null, errorCode: number }
    if (modelResult.errorMessage)
        issuesFound.push({
            errorMessage: modelResult.errorMessage,
            errorCode: `${modelResult.errorCode}`;
        });

    if (issuesFound.length === 0)
    {
        // step 2 
        // suppose you call your server and get back a promise<ModelType>
        save(modelResult.model, 
        // Promise resolve function hooked up within your save() function
        (model: ModelType) => {
            // Step 2c. success - take next steps
            // up to you!
        },
        // Promise reject function hooked up within your save() function
        (errorInfo)=>{
            // Step 3a -- when not using Jivs on the server...

            // Here we have some error data your save function understands inside of errorInfo.
            // Lets suppose it is Array<{ errorMessage: string, errorCode: number}>
            // Convert into array<IssueFound>
            issuesFound = []; // reusing it
            for (let error of errorInfo)
            {
            issuesFound.push({
                errorMessage: error.errorMessage,
                errorCode: `${error.errorCode}`;
            });
            }
            // Provide your errors to jivs to show in the UI
            vhm.addExternalIssuesFound(issuesFound, false); // false = issues were found elsewhere. 
            // These will update the UI via onValidationStateChanged callback

        });
    }
    else
    {
        // Step 1b continued
        // Provide your errors to jivs to show in the UI
        vhm.addExternalIssuesFound(issuesFound, true); // true = issues were found locally. 
        // These will update the UI via onValidationStateChanged callback
    }
}

// Here is the reject function if you are using jivs on the server side.
// You have already passed a string generated by ValueHostsManager.toValidationPayload()
// through the response and retrieved that string into validationPayload...

    // Promise reject function hooked up within your save() function
    (validationPayload) => {
      // Step 3 -- when using Jivs on the server...
      
      // Provide your errors to jivs to show in the UI
      vhm.fromValidationPayload(validationPayload);
      // These will update the UI via onValidationStateChanged callback

    };
```

### Server-side saving data

#### Server side overview
1. You first ensure that there are no hacking attempts like SQL Injection attacks. This happens on the raw data.
2. Run server side validation against all properties of the model. \*\*
    - Gather errors and return them to the client.
3. Run any additional validation or business logic.
    - Gather errors and return them to the client.
4. Save the data.
    - Gather errors and return them to the client.
5. (No errors at this point) Return a success notification to the client.

\*\* **Deep dive: server-side validation** 
- Server side validation is required because hackers can submit malicious data. 
- When your APIs use the same code to save the model, they supplied model can have invalid values.
- Jivs can assist here if you use node.js. You can use the same business logic to handle server-side validation of the inputs. But you are responsible for gathering other errors.

#### Using Jivs on a Node.js server

1. Review the submitted request for attacks (for example, SQL Injection) and stop if found.
2. Retrieve the submitted model. 
3. Configure and create a `ValueHostsManager` instance for that model.
4. Distribute fields from the model into Jivs through one of these:
    * `ValueHostsManager.getValueHost(fieldname).setValue(property value)`
    * If your data comes from a raw string, and not its native value in the model, run it through a parser.
    See the next topic.
5. Call ValueHostsManager.validate(). It returns a ValidationStatus object
    * If `ValidationStatus.doNotSave` is true, there are errors that must be sent back to the client.
    * Call `ValueHostsManager.toValidationPayload()` and include its result (a string) with your response to the client.
6. Execute additional pre-save actions such as: duplicate check, complex logic against the overall model, etc.
    * If there were errors, build `Array<IssueFound>` from them.
    * Call `ValueHostsManager.addExternalIssuesFound(your array)`.
    * Call `ValueHostsManager.toValidationPayload()` and include its result (a string) with your response to the client.
7. Save.
    * If there were errors, build `Array<IssueFound>` from them.
    * Call `ValueHostsManager.addExternalIssuesFound(your array)`.
    * Call `ValueHostsManager.toValidationPayload()` and include its result (a string) with your response to the client.
8. (No errors occurred). Send your "success" response.

##### Parsing raw strings to native values
The HTML form data starts as strings. Other formats may also supply strings. In this case, you use a parser
to translate the string into its native value.

```ts
let { nativeValue, errorMessage } = myParser(text); 
```
Then you report both values to Jivs like this:

```ts
ValueHostsManager.getValueHost('FirstName').setValues(nativeValue, raw string);
```
When parsing fails, you report the error along with the raw string like this:
```ts
ValueHostsManager.getValueHost('FirstName').setValues(undefined, textValue, { 
    injectedError: {
        errorMessage:  errorMessage 
        // other properties include errorCode, errorMessagel10n, summaryMessage, and summaryMessagel10n.
    }
});
```
See [Injecting errors on demand](./Jivs_API.md#injecting-errors-on-demand) for more.

### Showing all errors in a ValidationSummary
The term "ValidationSummary" refers to a location in the UI that offers a consolidated view of all error messages. Aside from how its presented, it is very similar to showing errors specific to one field, except it shows all errors and updates upon any ValueHost's validation.

You need these tools to setup your ValidationSummary:
* An HTML element to host the ValidationSummary.
* A function that responds to the `onValidationStateChanged callback` on the `ValueHostsManager`. This function will gather the data and update the ValidationSummary.
* Use the `getIssuesFound()` function on `ValueHostsManager` to retrieve those issues. 
>You will get issues generated by your business logic too with `ValueHostsManager.addExternalIssuesFound()`.

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
This code initializes a `ValueHostsManager` and sets up the `onValidationStateChanged callback`. It should be invoked once and the `ValueHostsManager` instance should be accessible to the rest of this form's code.

```ts
let services = createJivsServices('en-US');
let rules = new PersonModelRules(services); // subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
config.onValidationStateChanged = formValidated;
let vhm = new ValueHostsManager(config);

function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
  ... shown earlier ...
}
function formValidated(valueHostsManager: IValueHostsManager, validationState: ValidationState): void
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
