# Creating ValidationServices
Add the code of the **create_services.ts file** to your app. It provides the `createValidationServices() function` that you will need in order to create a ValidationManager. See [Configuring Jivs](../README.md#configuring-jivs).


`createValidationServices()` creates and configures the `ValidationServices object`, which has extensive configuration options. Many have defaults.
Jivs is designed to be flexible and extensible, and much of that is done within the `ValidationServices object`. You may add your own classes or replace existing ones
that are registered with factory services.

However some configuration is always your responsibility:
- Cultures: You must register the cultures you will support and their fallbacks.
- TextLocalizerService: You must provide text for error messages. This supplies both default and localized text.

The most common customizations are:
- Conditions: You may add your own conditions, which are used as validation rules.
- New data types take a Lookup Key and objects that may implement IDataTypeIdentifier, IDataTypeFormatter,
  IDataTypeConverter, IDataTypeComparer, and IDataTypeParser.
  See the [jivs-examples folder](..\packages\jivs-examples) for numerous examples of custom data types.
- LoggerService: Like any good service, Jivs outputs to logs. It defaults to using the Console, only showing errors. 