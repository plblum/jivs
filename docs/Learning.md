# Learning Jivs
[Jivs source code](https://github.com/plblum/jivs) is heavily and meaningfully commented, and it is all available in TypeDoc format at [jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc). Use this section for an orientation.

## Where you want to use validation

### As focus leaves an Input and its value changed
* Use the onchange event to tell the `ValidationManager` about the data change and run validation. 
  * You will need to have two values, the raw value from the Input (called the "Input Value") and the resulting value that is compatible with the property on your Model ("Native Value").
  * Jivs lets you assign a parser to each FieldValueHost. Just use: `validationManager.vh.field('name').setTextValue(inputValue, { validate: true });`
  * If you want to handle parsing elsewhere, use: `validationManager.vh.field('name').setValues(nativeValue, inputValue, { validate: true });`
* The `ValidationManager` will notify you about a validation state change through its `onValueHostValidationStateChanged callback`. Implement that callback to update your user interface.

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
This code initializes a `ValidationManager` and sets up the `onValueHostValidationStateChanged callback`. It should be invoked once and the `ValidationManager` instance should be accessible to the rest of this form's code.

```ts
let services = createValidationServices('en-US');
let rules = new PersonModelRules(services);  // subclass of ModelRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
let vm = new ValidationManager(config);

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
    vm.vh.field('FirstName').setTextValue(inputValue, { validate: true });
});
```
This code sets up the onchange event with your own parsing:
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=>{
    let inputValue = evt.target.value;
    let { nativeValue, errorMessage } = myParser(inputValue);	// return nativeValue=undefined when there is an error
    vm.vh.field('FirstName').setValues(nativeValue, inputValue, { 
        validate: true, 
        conversionErrorTokenValue: errorMessage 
    });
});
```

### While the user types
Show or hide the error state as the user types. This is limited to Validators that evaluate the raw string, like RequireText, RegExp, and StringLength. Always setup the onchange event (described above) to get all Validators involved.

* Use the oninput event to tell the `ValidationManager` about the data change and run validation, with its "duringEdit" option set to true.
* The `ValidationManager` will notify you about a validation state change through its `onValueHostValidationStateChanged callback`.

All of the prior setup still applies. Here we add the oninput event handler:
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('oninput', (evt)=>{
    vm.vh.field('FirstName').setTextValue(evt.target.value, { 
        validate: true, 
        duringEdit: true 
    });
});
```
### When the browser submits data to the server

Overview of the steps:

1. Validate the data, gathering issues found. If there are issues found, stop.
2. Send the data to the server to be saved.
3. Process the server's response. If there were errors, route them into the `ValidationManager` for display.

**Step 1**
- 1a. Call `ValidationManager.validate()`. Its result is ValidationState. When `ValidationState.doNotSave` is true, 
do not attempt step 2.
- 1b. If you have other processes prior to saving, execute them. They may result in errors too. They should be converted into an `IssueFound` object
and submitted as `Array<IssueFound>` to `ValidationManager.addExternalIssuesFound(array)`. They will appear in the UI supported by Jivs. Do not attempt step 2.

**Step 2** 
- 2a. Package up your data and send it to the server
- 2b. Server does its thing: server-side validation, actual saving, and returning the result: success or a list of errors.
- 2c. Evaluate the response from the server. 
    - If successful, you are done.
**Step 3**

- 3a. Retrieve the errors and supply them to Jivs through either `ValidationManager.addExternalIssuesFound(errors, true)` or `ValidationManager.fromValidationPayload(validationPayload)`.
    - `addExternalIssuesFound` targets a server side where you dictate the format of errors. 
    - `fromValidationPayload` targets Jivs running node.js on the server side.

#### Client side submission workflow

```ts
// we already have the ValidationManager instance fully configured in the variable vm
// step 1a
let validationState = vm.validate();  // any validation errors will be sent to the UI via onValidationStateChanged callback
if (!validationState.doNotSave)
{
  // step 1b
    let issuesFound: Array<IssueFound> = [];
    // your code for evaluating errors here.
    // Suppose that you convert your data into a Model object
    // and run some of your own validation on that object.

    let modelResult = convertToModel(); // again, your code
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
            vm.addExternalIssuesFound(issuesFound, false); // false = issues were found elsewhere. 
            // These will update the UI via onValidationStateChanged callback

        });
    }
    else
    {
        // Step 1b continued
        // Provide your errors to jivs to show in the UI
        vm.addExternalIssuesFound(issuesFound, true); // true = issues were found locally. 
        // These will update the UI via onValidationStateChanged callback
    }
}

// Here is the reject function if you are using jivs on the server side.
// You have already passed a string generated by ValidationManager.toValidationPayload()
// through the response and retrieved that string into validationPayload...

    // Promise reject function hooked up within your save() function
    (validationPayload) => {
      // Step 3 -- when using Jivs on the server...
      
      // Provide your errors to jivs to show in the UI
      vm.fromValidationPayload(validationPayload);
      // These will update the UI via onValidationStateChanged callback

    });
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
3. Configure and create a ValidationManager instance for that model.
4. Distribute fields from the model into Jivs through one of these:
    * `ValidationManager.getValueHost(fieldname).setValue(property value)`
    * If your data comes from a raw string, and not its native value in the model, run it through a parser.
    See the next topic.
5. Call ValidationManager.validate(). It returns a ValidationStatus object
    * If `ValidationStatus.doNotSave` is true, there are errors that must be sent back to the client.
    * Call `ValidationManager.toValidationPayload()` and include its result (a string) with your response to the client.
6. Execute additional pre-save actions such as: duplicate check, complex logic against the overall model, etc.
    * If there were errors, build `Array<IssueFound>` from them.
    * Call `ValidationManager.addExternalIssuesFound(your array)`.
    * Call `ValidationManager.toValidationPayload()` and include its result (a string) with your response to the client.
7. Save.
    * If there were errors, build `Array<IssueFound>` from them.
    * Call `ValidationManager.addExternalIssuesFound(your array)`.
    * Call `ValidationManager.toValidationPayload()` and include its result (a string) with your response to the client.
8. (No errors occurred). Send your "success" response.

##### Parsing raw strings to native values
The HTML form data starts as strings. Other formats may also supply strings. In this case, you use a parser
to translate the string into its native value.

```ts
let { nativeValue, errorMessage } = myParser(text); 
```
Then you report both values to Jivs like this:

```ts
ValidationManager.getValueHost('FirstName').setValues(nativeValue, raw string);
```
When parsing fails, you report the error along with the raw string like this:
```ts
ValidationManager.getValueHost('FirstName').setValues(undefined, inputValue, { conversionErrorTokenValue: errorMessage });
```

### Showing all errors in a ValidationSummary
The term "ValidationSummary" refers to a location in the UI that offers a consolidated view of all error messages. Aside from how its presented, it is very similar to showing errors specific to one field, except it shows all errors and updates upon any ValueHost's validation.

You need these tools to setup your ValidationSummary:
* An HTML element to host the ValidationSummary.
* A function that responds to the `onValidationStateChanged callback` on the ValidationManager. This function will gather the data and update the ValidationSummary.
* Use the `getIssuesFound()` function on ValidationManager to retrieve those issues. 
>You will get issues generated by your business logic too with `ValidationManager.addExternalIssuesFound()`.

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
let services = createValidationServices('en-US');
let rules = new PersonModelRules(services); // subclass of ModelRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
config.onValidationStateChanged = formValidated;
let vm = new ValidationManager(config);

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
