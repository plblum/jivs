# About Adapters
An Adapter connects a general `ValueHostsManager` callback request to a specific UI widget.
It is part of a two step redirect from the callback.
```
ValueHostsManager.onTextValueChanged -> ITextValueDispatcher -> ITextValueAdapters
ValueHostsManager.onValueChanged -> IValueDispatcher -> IValueAdapters
ValueHostsManager.onValidationStateChanged -> IFormDispatcher -> IFormPresentations
ValueHostsManager.onValueHostValidationStateChanged -> IFieldDispatcher -> IFieldPresentations
```
> While they don't use "Adapter" in their names, IFieldPresentation and IFormPresentation are Adapters too.

The callback first communicates with a Dispatcher which identifies the destination DOM element.
The DOM element must have the Adapter instance already attached using the IJivsElement interface.
- IJivsElement.jivsTextValueAdapter
- IJivsElement.jivsValueAdapter
- IJivsElement.jivsFieldPresentation
- IJivsElement.jivsFormPresentation

The Dispatcher takes no action when the required property is undefined/null.

## Installation
The goal is to ensure IJivsElement properties are assigned during the initialization phase
of all elements. This occurs in three places:
- EditorInstaller - handles jivsTextValueAdapter, jivsValueAdapter and calls upon FieldPresenationInstaller.
- FieldPresentationInstaller - handles jivsFieldPresentation
- FormPresentationInstaller - handles jivsFormPresentation
