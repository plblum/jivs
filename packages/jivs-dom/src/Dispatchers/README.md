# About Dispatchers
A Dispatcher is directly connected to the ValueHostManager callbacks, and redirects those messages
to a list of elements targetted by the callback. Each element it selects must have an Adapter
already installed on its IJivsDomElement interface properties.
```
ValueHostsManager.onTextValueChanged -> ITextValueDispatcher -> each element's IJivsDomElement.jivsTextValueAdapter
ValueHostsManager.onValueChanged -> IValueDispatcher -> each element's IJivsDomElement.jivsValueAdapter
ValueHostsManager.onValueHostValidationStateChanged -> IFieldValidationDispatcher -> each element's IJivsDomElement.jivsFieldPresentation
ValueHostsManager.onValidationStateChanged -> IFormValidationDispatcher -> each element's IJivsDomElement.jivsFieldPresentation
```

## Strategies for selecting elements
Dispatchers need to know the exact list of DOM elements that are targetted by Element Roles ('editor', 'label', etc).
They provide the findElements function, which may be implemented in several ways.
- Create an IElementCollector class specific to the form to add the entire list of elements
  and their characteristics. IElementCollector is passed around through all installers
  so that you only have to build it once per lifecycle. jivs-simpledom actually
  populates one with the results of screen scraping.
  The default Dispatchers all use this class to search for elements.
- You can create one Dispatcher per form, each providing form-specific list of elements
  through the dispatcher's findElements function.
