# Handling ValidationState Changes
Your user interface depends on knowing the state of validation. Has validation reported an error or not? 

As shown in [Validators](./Home.md), you wire up two callbacks on `ValueHostsManager` to send validation state changes along:
- `onValueHostValidationStateChanged` - Wired up to handle field-level changes.
- `onValidationStateChanged` - Wired up to handle form-level changes.

Let's look at the basics for these callbacks to work with your UI.
> Check out [Jivs SimpleDom](../../Learning_Jivs/Presentation/The_Jivs_SimpleDom_Approach.md) for a way to configure your HTML that makes connecting ValueHosts to UI elements easy.

> Please see these prerequisites for setting up your UI: [Jivs Presentation Prerequisites](../../Learning_Jivs/Presentation/Jivs_Presentation_Prerequisites.md).

## Setup onValueHostValidationStateChanged
1. The function has this declaration:
    ```ts
    type (valueHost: IValidatableValueHost, validationState: ValueHostValidationState) => void
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
    If you use [Jivs SimpleDom](../../Learning_Jivs/Presentation/The_Jivs_SimpleDom_Approach.md), here's how its done.
    ```ts
    let editor = document.querySelector('[data-field=' + fldId + '][data-jivs-role=editor]');    
    let errorHost = document.querySelector('[data-field=' + fldId + '][data-jivs-role=error]');   
    ```
4. Use the `ValueHostValidationState object` to adjust those elements. Use the `isValid` property to change a style sheet on the editor. Use the `issuesFound` property to determine if there are issues to show in an Error Display, and to get the error messages.    
    - See [ValueHostValidationState object](./Validation_State.md#valuehostvalidationstate)
    - See [IssueFound object](./Validation_State.md#issuefound)
    - See [Jivs Presentation Prerequisites](../../Learning_Jivs/Presentation/Jivs_Presentation_Prerequisites.md)
    - See [jivs-DOM_helpers.ts](../../../starter_code/jivs-DOM_helpers.ts) for our error message building helper: `buildErrorMessagesHtml()`.
    - We recommend using a style sheet class to hide a valid element with display:none instead of a class to show the invalid element.

```ts
config.onValueHostValidationStateChanged = fieldValidated;
let vhm = new ValueHostsManager(config);

function fieldValidated(valueHost: IValidatableValueHost, validationState: ValueHostValidationState): void
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
        /*
        .invalid
        {
            border-color: red;
        }
        */        
    }

    if (validationState.issuesFound?.length > 0)
    {
        errorHost.classList.remove('hideError');
        // this shows the basic idea. 
        // However, consider using buildErrorMessagesHtml() found in jivs-DOM_helpers.ts
        let ul = document.createElement('ul');
        for (let i = 0; i < validationState.issuesFound.length; i++)
        {
            let li = document.createElement('li');
            li.innerHtml = validationState.issuesFound[i].errorMessage; // errorMessage may have embedded HTML tags surrounding tokens
            ul.append(li);
        }
        errorHost.replaceChildren(ul);
/*
    // or
        errorHost.innerHtml = buildErrorMessagesHtml(validationState.issuesFound);
*/
    }
    else
    {
        errorHost.classList.add('hideError');
        /*
        .hideError
        {
            display: none;
        }
        */        

        errorHost.replaceChildren();
    }
}
```

## Setup onValidationStateChanged
1. The function has this declaration:
    ```ts
    type (valueHostsManager: IValueHostsManager, validationState: ValidationState) => void
    ```
2. Use DOM methods to retrieve the actual elements you modify. Often you need to configure your user interface with specific CSS classes and/or attributes of your choosing to make this work.
    ```ts
    let valSummary = document.querySelector('.validationSummary');
    ```
    If you use [Jivs SimpleDom](../../Learning_Jivs/Presentation/The_Jivs_SimpleDom_Approach.md), here's how it is done.
    ```ts
    let valSummary = document.querySelector('[data-jivs-role=summary]');   
    ```
3. Use the `ValidationState object` to adjust those elements. Always use the doNotSave property, not isValid, to prevent submitting. Use the `issuesFound` property to determine if there are issues to show in a Validation Summary, and to get the error messages.    
    - See [ValidationState object](./Validation_State.md#validationstate)
    - See [IssueFound object](./Validation_State.md#issuefound)
    - See [Jivs Presentation Prerequisites](../../Learning_Jivs/Presentation/Jivs_Presentation_Prerequisites.md)
    - See [jivs-DOM_helpers.ts](../../../starter_code/jivs-DOM_helpers.ts) for our error message building helper: `buildErrorMessagesHtml()`.
    - We recommend using a style sheet class to hide a valid element with display:none instead of a class to show the invalid element.
```ts
config.onValidationStateChanged = formValidated;
let vhm = new ValueHostsManager(config);

function formValidated(valueHostsManager: IValueHostsManager, validationState: ValidationState): void
{
    let valSummary = document.querySelector('.validationsummary');
    if (validationState.issuesFound?.length > 0)
    {
        valSummary.classList.remove('hideValidationSummary');    
        // this shows the basic idea. 
        // However, consider using buildErrorMessagesHtml() found in jivs-DOM_helpers.ts
        let ul = document.createElement('ul');
        for (let i = 0; i < validationState.issuesFound.length; i++)
        {
            let li = document.createElement('li');
            li.innerHtml = validationState.issuesFound[i].errorMessage; // errorMessage may have embedded HTML tags surrounding tokens
            ul.append(li);
        }
        valSummary.replaceChildren(ul);   
/*
    // or
        valSummary.innerHtml = buildErrorMessagesHtml(validationState.issuesFound, true);
*/               
    }
    else
    {
        valSummary.classList.add('hideValidationSummary');      
        /*
        .hideValidationSummary
        {
            display: none;
        }
        */
        valSummary.replaceChildren();    // discard existing child elements
    }
}
```

## Actions that change the validation state
All of these actions can change the validation state whether on `ValueHostsManager` or a `ValueHost`. However, you will only be notified through `onValidationStateChanged` and `onValueHostValidationStateChanged` if the state actually changed.
- `validate()`
- `clearValidation()`
- `addExternalIssuesFound()` and `addExternalIssueFound()`
- `clearExternalIssuesFound()`
- using any of these with the `{ validate: true }` option as a parameter: `setValue()`, `setValues()`, `setTextValue()`, `setValueToUndefined()`.
- An asynchronous Condition just finished

## API Reference
- [ValidationState type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validation_Types.ValidationState.html)
- [ValueHostValidationState type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_ValueHosts_Types_ValidatableValueHostBase.ValueHostValidationState.html)
- [IssueFound type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validation_Types.IssueFound.html)
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)

---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)