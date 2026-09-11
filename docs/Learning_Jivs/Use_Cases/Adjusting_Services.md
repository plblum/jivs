# Adjusting services
Focus on the most used `JivsServices` as an introduction to making changes to the createJivsservices function.

The [`JivsServices`](../../API/JivsServices/Home.md) object provides customization through a dependency injection approach. It has many more services than you will likely customize, and several services you are very likely to customize. This document focuses on those.

## Where do I customize the services?
[You added a code file called creating_JivsServices.ts](../../API/JivsServices/Home.md#configuring-jivsservices) to your project during Jivs installation. You will be working in this file. It contains the createJivsServices() function that explicitly establishes all services, and is loaded with inline documentation to help you out.

## When should I create JivsServices?
`JivsServices` is stateless. You can create a single instance for your entire multi-threaded app as it starts up if you like. Our code examples show on-demand creation. But that can be switched to exposing it as a singleton through a global variable or dependency injection services of your app.

## Establishing the ISO language-region codes used in localization
If you intend to support multiple languages or regional variations, identify and add their ISO language-region codes to the `CultureServices` object. See [CultureServices](../../API/JivsServices/CultureServices.md).

Even if you have a common language used in several countries, it is common to declare each region. That allows you to offer error messages showing the region specific date formats, currency formats, etc.
```ts
services.errorMessagesService.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, {
    '*': 'Invalid value. Enter a date.',
    'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
    'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
});
```
## Localizing your error messages
Use the `ErrorMessagesService` object to host your language and region specific variations of your error messages. See [ErrorMessagesService](../../API/JivsServices/ErrorMessagesService.md).

Error messages can include tokens that are replaced by strings you may want to localize. Those include {Label}, {SecondLabel} and {DataType}. Each of these is also setup in the `ErrorMessagesService`.

## Add new data types
While Jivs supports common data types, you will benefit from creating your own names for data types. Those names are the [Lookup Keys](../../API/Data_Type_Support/Home.md#lookup-keys) assigned to the ValueHost `dataType` configuration property.

For example, create a Lookup Key for Email address and use it instead of `LookupKey.String`.

Each Lookup Key is connected to many tools that are automatically applied when you specify the Lookup Key.
- [DataTypeParser](./DataTypeParsers_Service.md) - parsing from text value to native value
- [DataTypeFormatter](./DataTypeFormatters_Service.md) - formatting from native value to text value
- [DataTypeConverter](./DataTypeConverters_Service.md) - converting between data types
- [DataTypeCheckGenerator](./DataTypeCheckGenerator_Service.md) - Attaching a Validators that confirm the native type matches your Lookup Key.
- [ErrorMessageService](../../API/JivsServices/ErrorMessagesService.md) - Uses the Lookup Key to find the right localization.

You don't often have to write new parsers, formatters, etc. In fact, if your Lookup Key is a refinement of an existing one, like Email is a specific use of String and Currency is a specific use of Number, you can register a fallback Lookup Key with the `LookupKeyFallbackService`. See [LookupKeyFallbackService](../../API/JivsServices/Logging.md).

## Moving values between external sources and Jivs
Your stored data needs to work within Jivs, and those native values may not exactly match what Jivs expects. So we provide the `ValueAdapterService` to transistion values between two systems. Its used by the `ModelReader` and `ModelWriter`. See [ValueAdapterService](../../API/ModelReader_and_ModelWriter/Home.md#value-adapter-rules).

## Logging
Our `LoggingService` is an excellent way to diagnose issues. It is actively logging at whatever minimum logging level you request: Debug, Info, Warning, Error. Without taking any further action, it logs only Errors.

Here are several way to use the `LoggingService`:
- Change the minimum level
- Capture to Console - this is the default using the ConsoleLoggingService.
- Capture for testing to review - uses the TestingLoggingService
- Impose filtering to reduce the noise of log entries outside of scope

See [LoggingService](../../API/JivsServices/Logging.md) for details.


---
Return to [Use Cases](./Home.md).

Return to [Learning Jivs](../Home.md).
