# Starter_Code folder
This folder provides several TypeScript and CSS files for you to add to your application.

- create_services.ts - Provides the createJivsServices() function. See below.
- jivs-DOM_helpers.ts - Sources for your web app to get you started.
- jivs-simpleDom.ts and jivs-simpleDom.css - Jivs SimpleDom is a framework for the presentation of validation issues.

Each of these files has specific instructions.

## Creating JivsServices
Add the code of the **create_services.ts file** to your app. It provides the `createJivsServices() function` that you will need in order to create a ValueHostsManager. See [Configuring JivsServices](../README.md#configuring-jivsservices).

`createJivsServices()` creates and configures the `JivsServices object`, which has extensive configuration options. Many have defaults.
Jivs is designed to be flexible and extensible, and much of that is done within the `JivsServices object`. You may add your own classes or replace existing ones
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