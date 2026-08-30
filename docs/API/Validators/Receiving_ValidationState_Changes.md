# Receiving ValidationState Changes
Your user interface depends on knowing the state of validation. Has validation reported an error or not? 

As shown in [Validators](./Home.md), you wire up two callbacks on `ValueHostsManager` to send validation state changes along:
- `onValueHostValidationStateChanged` - Wired up to handle field-level changes.
- `onValidationStateChanged` - Wired up to handle form-level changes.

Let's look at the basics for these callbacks to work with your UI.
> Check out [Jivs SimpleDom](../../Learning_Jivs/Presentation/The_Jivs_SimpleDom_Approach.md) for a way to configure your HTML that makes connecting ValueHosts to UI elements easy.

## Setup onValueHostValidationStateChanged
1. The function has this declaration:
    ```ts
    type (valueHost: IValueHost, validationState: ValueHostValidationState) => void
    ```
2. Use the ValueHost to identify some name that you can use to find the corresponding element. It greatly helps to configure the [Element Identifier](../../Learning_Jivs/Server_Pages/Home.md#using-the-element-identifier) on the `ValueHost`.
    ```ts
    let fldId = valueHost.getElementIdentifier(); // setup during configuration
    ```
3. Use DOM methods to retrieve the actual elements you modify. Often you need to configure your user interface with specific CSS classes and/or attributes of your choosing to make this work.
    ```ts
    let editor = document.getElementById(fldId);
    let errorHost = document.querySelector('.errorHost[data-for=' + fldId + ']');    
    ```
    If you use [Jivs SimpleDom](../../Learning_Jivs/Presentation/The_Jivs_SimpleDom_Approach.md), we encourage using specific custom attributes like 'data-field' and 'data-jivs-role'.
    ```ts
    let editor = document.querySelector('[data-field=' + fldId + '][data-jivs-role=editor]');    
    let errorHost = document.querySelector('[data-field=' + fldId + '][data-jivs-role=error]');   
    ```
4. Use the `ValueHostValidationState object` to adjust those elements. You might use the isValid property to change a style sheet on the editor, the issuesFound object to determine if there are issues to show in an Error Display, and issuesFound to get the error messages.    
    - See [ValueHostValidationState object](./Validation_State.md#valuehostvalidationstate)
    - See [IssueFound object](./Validation_State.md#issuefound)
    - See [jivs-DOM_helpers.ts](../../../starter_code/jivs-DOM_helpers.ts) for a great error message building function: `buildErrorMessagesHtml()`.

```ts
config.onValueHostValidationStateChanged = fieldValidated;
let vhm = new ValueHostsManager(config);

// Direct validation changes to the HTML elements
// of a specific field, so they can update their appearance
function fieldValidated(valueHost: IValueHost, validationState: ValueHostValidationState): void
{
    let fldId = valueHost.getElementIdentifier();
    let editor = document.getElementById(fldId);
    let errorHost = document.querySelector('.errorHost[data-for=' + fldId + ']');
    if (validationState.isValid)
    {
        editor.classList.remove('invalid');
    }
    else
    {
        editor.classList.add('invalid'); 
    }

    if (validationState.issuesFound)
    {
        errorHost.classList.add('showError');
        // this shows the basic idea. However, consider using buildErrorMessagesHtml()
        // found in jivs-DOM_helpers.ts
        let ul = document.createElement('ul');
        for (let i = 0; i < validationState.issuesFound.length; i++)
        {
            let li = document.createElement('li');
            li.innerHtml = validationState.issuesFound[i].errorMessage; // errorMessage may have embedded HTML tags surrounding tokens
            ul.append(li);
        }
        errorHost.replaceChildren(ul);

    }
    else
    {
        errorHost.classList.remove('showError');
        errorHost.replaceChildren();
    }
}
```

## Current validation state on ValueHostsManager
The `ValueHostsManager` has similar functions to those on validatable `ValueHosts`, only it is a consolidated represention from the `ValueHosts`. The validation state is used prior to submitting the data and by the ValidationSummary as the state changes.

`ValueHostsManager's` validation state is found amongst several of its properties and functions.
- `isValid`
- `doNotSave`
- `asyncProcessing`
- `getIssuesFound()`

*See the details of ValidationState below for more on these.*

When you need notifications as it changes, its setup the `onValidationStateChanged callback` (on `ValueHostsManagerConfig`) and let it pass you this informative object:
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
let services = createJivsServices('en-US');
let rules = new PersonModelRules();// subclass of ValueHostRulesBase for your PersonModel class
let config = rules.configure();
config.onValueHostValidationStateChanged = fieldValidated;
builder.onValidationStateChanged = formValidated;
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

Let's go through `ValidationState` properties:
- `isValid` - When true, the value appears to be valid. However, it's only false when there was an explicit `status` of *Invalid* within at least one ValueHost. It's better to check `doNotSave` to know if you can submit the data.
- `doNotSave` - Determines if any `ValueHost` doesn't consider its value ready to save. It is true when the `ValueHost` validation `status` is *Invalid* or *NeedsValidation*. It is also true when `asyncProcessing` is true.
- `issuesFound` - An array of all issues found or null when there are no issues found. See the previous section for details on the IssueFound type that populates this array.
- `asyncProcessing` - When evaluating an asynchronous Condition, validation will return before it is done, with the results from the rest of the Conditions. `asyncProcessing` is true at this moment, and until all asynchronous Conditions are finished. Expect `onValueHostValidationStateChange callbacks` after the validation runs, and after each async Condition finishes, giving you the latest validation state.

## Actions that change the validation state
All of these actions can change the validation state whether on `ValueHostsManager` or a `ValueHost`. However, you will only be notified through `onValidationStateChanged` and `onValueHostValidationStateChanged` if the state actually changed.
- `validate()`
- `clearValidation()`
- `addExternalIssuesFound()` and `addExternalIssueFound()`
- `clearExternalIssuesFound()`
- using any of these with the { validate: true} option as a parameter: `setValue()`, `setValues()`, `setTextValue()`, `setValueToUndefined()`.
- An asynchronous Condition just finished
