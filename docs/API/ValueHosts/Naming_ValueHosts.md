# Naming each ValueHost
Each `ValueHost` must have a unique name within the `ValueHostsManager`. `FieldValueHosts` may have up to 3 names, because they share their value with three consumers:

- `ValueHostsManager`
- Property on a model
- Element in the UI

Its possible that all 3 can be the same, or that you don't need mapping with the model or UI elements. However, Jivs should not dictate the naming of model properties or how to locate an element in the UI.

The name used by `ValueHostsManager` is the **ValueHost name**.
Here's how to assign it:
```ts
builder.field('name', datatype);
builder.static('name', datatype, value);
builder.calc('name', datatype, calcFn);
```
Here's a `FieldValueHost` named 'FirstName' but using alternative names for property and UI elements:
```ts
builder.field('FirstName', LookupKey.String, {
    propertyName: 'firstName',
    elementIdentifier: 'first_name'
});
```
## Getting a FieldValueHost by any of its names
Use these functions on `ValueHostsManager` to get a `FieldValueHost`:

|function|name used|Not found|
|--------|-------|-----|
|vhm.getFieldValueHost(name)|value host name|Returns null|
|vhm.vh.field(name)|value host name|Throws error|
|vhm.getFieldByPropertyName(name)|property name|Returns null|
|vhm.getFieldByElementIdentifier(name)|element identifier|Returns null|

See [Getting ValueHosts](./Getting_a_ValueHost.md) for getting any type of `ValueHost`.

See [Using the Element Identifier](../../Learning_Jivs/Server_Pages/Home.md#using-the-element-identifier) for more.

## Using the Element Identifier
Client code can use the **Element Identifier** when querying the DOM. It could be the value assigned to the element's `id` or `name` attribute. However, its value is often used as a basis for several specific elements, all tied together by a common field name. So we recommend creating a custom attribute to connect them.

_Example: Using data-field attribute_

```html
<div data-field="first-name" data-role="container">
    <input type="text" name="firstName"
        data-field="first-name" data-role="editor" >
<!-- Error Display -->
    <div data-field="first-name" data-role="error" >
        <!-- error messages injected here -->
    </div>
</div>
```
In this example, we have tied together 3 elements: input, error display and its container with a common name, 'first-name', associated with the `data-field` custom attribute.

Here's how its configured:
```ts
builder.field('FirstName', LookupKey.String, {
    elementIdentifier: 'first-name'
});
```

Client code can retrieve that Element Identifier and use it to locate the editor:

```ts
const firstNameId =
    vhm.vh.field('FirstName').getElementIdentifier();

const firstNameElement = document.querySelector(
    `[data-field="${CSS.escape(firstNameId)}"]` +
    '[data-role="editor"]'
);
```
## API References
- [ValueHostBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_AbstractClasses_ValueHostBase.ValueHostBase.html)
- [FieldValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_FieldValueHost.FieldValueHost.html)
- [StaticValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_StaticValueHost.StaticValueHost.html)
- [CalcValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_CalcValueHost.CalcValueHost.html)
- [ValueHostsManagerConfigBuilder class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.ValueHostsManagerConfigBuilder.html)
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)

---
Go to [ValueHost Home](./Home.md)

Go to [API Home](../Home.md)