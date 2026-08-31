# Injecting errors on demand
When you handle parsing outside of Jivs, your parser may report an error. You need to supply the original
text and that error message to Jivs. Upon receipt of an error like this, Jivs knows to create a validator for it.

The `FieldValueHost` functions `setValue()`, `setValues()`, `setTextValue()`, and `setValueToUndefined()` can take in your error message like this:

```ts
vhm.getFieldValueHost('field1').setTextValue(
    undefined, // indicates the native value was unresolved
    text, // value prior to parsing
    { injectedError: { errorMessage: 'message'}});  // error resulting from the parser
```
You can also supply it separately:
```ts
vhm.getFieldValueHost('field1').setInjectedError({ errorMessage: 'message'});
```
Its state remains until the next call to `setValue()` and its peers, `clearValidation()`, and ondemand with this:
```ts
vhm.getFieldValueHost('field1').clearInjectedError();
```
## InjectedError type
The `InjectedError` object is designed to support localization:
```ts
interface InjectedError
{
    errorMessage: string;   // the only value that is required
    errorMessagel10n?: string;  // a localization key
    summaryMessage?: string;  
    summaryMessagel10n?: string;
    errorCode?: string;     // helps setup discrete localized error messages by using different error codes
}    
```
### Example
```ts
let firstNameFld = document.getElementById('FirstName');
firstNameFld.attachEventListener('onchange', (evt)=> {
    let textValue = evt.target.value;
    let { nativeValue, parserError } = YourConvertToNativeCode(textValue);  
    let injectedError: InjectedError | undefined = undefined;
    if (parserError)
    {
        injectedError = { 
            errorMessage : parserError,
            errorCode: 'MyParserErrorCode'  // see below
        };
        nativeValue = undefined;    // indicates native value is not available
    }
    vhm.vh.field('FirstName').setValues(nativeValue, textValue, { 
        injectedError: injectedError
    });
});	
```
## Localizing your injected error
Setup all localization in the `createJivsService()` function, with code associated
with `TextLocalizerService`. See [Localization](../JivsServices/Localization.md) for more.

Like with validator error messages, any value you directly supply can be overridden by 
the `TextLocalizerService`. When you do not supply a value to `injectedError.errorMessagel10n`,
it will internally get setup with the correct l10n key to match `TextLocalizerService.registerErrorMessage()`.
Same for `injectedError.summaryMessagel10n`. Simply by using `registerErrorMessage()`
and `registerSummaryMessage()`, your original text is overridden.

Here is an example to setup the messages when you don't supply the error code.
```ts
import { InjectedErrorValidatorErrorCode } from "@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase";
let tls = vhm.services.textLocalizerService;    
tls.registerErrorMessage(InjectedErrorValidatorErrorCode, null, {
        '*': 'Invalid input' 
    });
tls.registerSummaryMessage(InjectedErrorValidatorErrorCode, null, {
    '*': '{Label} has this invalid input.'
});    
```
Now using your own supplied errorcode (InjectedError.errorCode = 'MyParserErrorCode'):
```ts
let tls = vhm.services.textLocalizerService;    
tls.registerErrorMessage('MyParserErrorCode', null, {
        '*': 'Invalid input' 
    });
tls.registerSummaryMessage('MyParserErrorCode', null, {
    '*': '{Label} has this invalid input.'
});    
```
