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

See [Injecting errors on demand](../Validators/Injecting_errors_on_demand.md) for more.
