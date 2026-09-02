# Logging
Like a typical service, Jivs has the ability to log what happens while it executes. It has a built-in logger class that writes to the console object.

The logger is configured within the `JivsServices object`, as it is a service.
1. It is setup in the [`createJivsServices() function`](#configuring-jivsservices).
    ```ts
    // --- Logger Service -----------------------------------    
    // If you want both the ConsoleLoggerService and another, create the other
    // and pass it as the second parameter of ConsoleLoggerService.
    vs.loggerService = new ConsoleLoggerService(LoggingLevel.Error);
    ```
2. You can modify it as needed just by getting the services object and using its `loggerService property`.

    ```ts
    services.loggerService.minLevel = LoggingLevel.Debug;
    ```
There are several actions you might want to take when using logging described in upcoming sections.
- Set the minimum logging level
- Varying the minLevel based on what is being logged
- Change to another `LoggerService` object
 
## Set the minimum logging level
Jivs has logging levels of Debug, Info, Warn, and Error. The logging object has a `minLevel property` which defaults to Error, which means omit the rest. You can set and change the minLevel as shown above.

The `LoggingLevel` enum:
```ts
export enum LoggingLevel
{
    Debug = 0,
    Info = 2,
    Warn = 3,
    Error = 4
}
```
### Logging content example using Debug level
This jest unit test shows the logging for just calling ValueHost.setValues("", "", {validate:true}) with Debug level. 
```ts
test('setValue with validate=true, onValueHostValidationStateChanged called', () => {
    let onValidateResult: ValueHostValidationState | null = null;
    let config: ValueHostsManagerConfig = {
        services: createJivsServices(),
        valueHostConfigs: [],
        onValueHostValidationStateChanged: (vh, vr) => {
            onValidateResult = vr;
        }        
    };
    config.services.loggingService = new ConsoleLoggingService(LoggingLevel.Debug);
    let builder = new ValueHostsManagerConfigBuilder(config);    
    let builder = createBuilder({
        onValueHostValidationStateChanged: (vh, vr) => {
            onValidateResult = vr;
        }
    });
    builder.field('Field1').requireText('error');
    let vhm = new ValueHostsManager(builder);
    let vh = vhm.vh.field('Field1');
    vh.setValues('', '', { validate: true });   // empty is invalid

    expect(onValidateResult).toEqual(<ValueHostValidationState>{
        isValid: false,
        issuesFound: [{
            errorCode: ConditionType.RequireText,
            valueHostName: 'Field1',
            severity: ValidationSeverity.Severe,
            errorMessage: 'error',
            summaryMessage: 'error'
        } ],
        doNotSave: true,
        asyncProcessing: false,
        status: ValidationStatus.Invalid,
        corrected: false
    });
});        
```
You are looking at the output in VSCode's Terminal. Jivs has called the console class's functions with the logged object. Each entry starts with the console's function, which in this case is either debug or log  (which is used for Info level). If there were warnings, you would see them as console.warn and errors as console.error.
```text
console.debug
  {
  message: 'addValueHost(Field1)',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
console.debug
  {
  message: 'setValues("", "")',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'Validating ValueHost "Field1"',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'Starting Validation for errorcode "RequireText"',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Condition RequireText evaluated as NoMatch',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Validation errorcode "RequireText" found this issue: {"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'onValueHostValidationStateChanged',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
console.log
  {
  message: 'onValueHostValidationStateChanged',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
console.log
  {
  message: 'Validation result: Invalid Issues found:[{"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}]',
  category: 'Result',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'notifyOtherValueHostsOfValueChange on Field1',
  feature: 'Manager',
  type: 'ValueHostsManager'
  }
```

## Varying the minLevel based on what is being logged
If you want to use the Debug or Info levels, expect to get a lot of content (example below). Often you are trying to diagnose a problem through the logs. Jivs lets you selectively log everything that meets a specific criteria, even though its below the minLevel.

> If you use a custom logger, it must have been subclassed from LoggerServiceBase to get this feature.

> If possible, use this technique in tests, not in your regular code, because while active, a logger's "lazy" execution feature is disabled and that impacts performance.

1. Set the initial minLevel to Debug.
2. Run your code.
3. Review the log to identify characteristics you want to keep.
4. Create one or more `OverrideMinLevelWhenRule objects` with those characteristics. [Documentation](http://jivs.peterblum.com/typedoc/interfaces/Services_AbstractClasses_LoggerServiceBase.OverrideMinLevelWhenRule.html)
5. Call the `LoggerService.overrideMinLevelWhen function` with each. [Documentation](http://jivs.peterblum.com/typedoc/classes/Services_AbstractClasses_LoggerServiceBase.LoggerServiceBase.html#overrideMinLevelWhen)
6. Restore the minLevel to your normal setting.

### Logging content example with overrideMinLevelWhen
This is the same as the previous example, except the default log level is Error. If you look through the other example, there are no entries for 'error', so this would generate no console output.

I want to only log calls with these values lifted from the earlier log.
```ts
feature: 'ValueHost',
identity: 'Field1'
```
Or
```ts
category: 'Result'
```

This jest unit test shows the logging for just calling ValueHost.setValues("", "", {validate:true}) with Debug level. 
```ts
...
    let logger = new ConsoleLoggingService(LoggingLevel.Error);	// was Debug
    config.services.loggingService = logger;
    logger.overrideMinLevelWhen({
        feature: 'ValueHost',
        identity: 'Field1'
    });
    logger.overrideMinLevelWhen({
        category: LoggingCategory.Result,
    });
... 
```
Again, you are looking at the output in VSCode's Terminal. Compare the output to the earlier example:
```text
console.debug
  {
  message: 'setValues("", "")',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.debug
  {
  message: 'Validating ValueHost "Field1"',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }
console.log
  {
  message: 'Condition RequireText evaluated as NoMatch',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Validation errorcode "RequireText" found this issue: {"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}',
  category: 'Result',
  feature: 'Validator',
  type: 'Validator',
  identity: [ 'Field1', 'RequireText' ]
  }
console.log
  {
  message: 'Validation result: Invalid Issues found:[{"valueHostName":"Field1","errorCode":"RequireText","severity":2,"errorMessage":"error","summaryMessage":"error"}]',
  category: 'Result',
  feature: 'ValueHost',
  type: 'FieldValueHost',
  identity: 'Field1'
  }

```
## Change to another LoggerService object
You can replace the `ConsoleLoggerService` with your preferred logging library, either by implementing the `ILoggerService` interface or subclassing from the feature-rich `LoggerServiceBase`.

- [ILoggerService documentation](http://jivs.peterblum.com/typedoc/interfaces/Services_Types_ILoggerService.ILoggerService.html)
- [LoggerServiceBase documentation](http://jivs.peterblum.com/typedoc/classes/Services_AbstractClasses_LoggerServiceBase.LoggerServiceBase.html)

You can also chain loggers, so several can receive the log content. Do that in its constructor:
```ts
let chainedLogger = new ConsoleLoggerService(LoggingLevel.Error)
vs.loggerService = new MyLoggerService(LoggingLevel.Error, chainedLogger);
```
> Note that a chained logger will act as if it has LoggingLevel.Debug, knowing that the top-level logging service will only call it if its own minLevel is met.
---
Go to [JivsServices Home](./Home.md)

Go to [API Home](../Home.md)