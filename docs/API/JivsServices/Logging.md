# Logging
Like a typical service, Jivs has the ability to log what happens while it executes. It has rich communication with its logs, supported by log levels of Debug, Info, Warn, and Error.

There are two use cases, each supported by a different logger:
- Runtime, using `ConsoleLoggerService`. This logger writes to the Console. It is setup in the `createJivsServices()` function, where you also supply its minimum logging level.
    ```ts
    // --- Logger Service -----------------------------------    
    // If you want both the ConsoleLoggerService and another, create the other
    // and pass it as the second parameter of ConsoleLoggerService.
    services.loggerService = new ConsoleLoggerService(LoggingLevel.Error);
    ```
- Testing, using `CapturingLogger`. This logger captures each log entry and provides an API to check for those entries as part of confirming your test worked correctly.
    ```ts
    import { CapturingLogger } from "@plblum/jivs-engine/build/Support/CapturingLogger";
    let services = new JivsServices();
    services.loggerService = new CapturingLogger(LoggingLevel.Error);
    // or combined with console output:
    services.loggerService = new CapturingLogger(LoggingLevel.Error, new ConsoleLoggerService(LoggingLevel.Error));
    ```
    We provide the `createJivsServicesForTesting.ts` file with its `createJivsServicesForTesting()` function for testing. It also sets up CapturingLogger + console output.
    ```ts
    import { CapturingLogger } from "@plblum/jivs-engine/build/Support/CapturingLogger";
    let services = createJivsServicesForTesting();
    services.loggerService = new CapturingLogger(LoggingLevel.Error);
    // or combined with console output:
    services.loggerService = new CapturingLogger(LoggingLevel.Error, new ConsoleLoggerService(LoggingLevel.Error));
    ```

## CapturingLogger class
`CapturingLogger` is a LoggerService that captures log entries and provides functions to query the results. It targets testing code.
```ts
import { CapturingLogger } from "@plblum/jivs-engine/build/Support/CapturingLogger";
let services = new JivsServices();
services.loggerService = new CapturingLogger(LoggingLevel.Error);
let logger = services.loggerService as CapturingLogger;
// use logger methods.
```
- `entryCount` - Count of entries captured
- `containsLog()` - Returns true if it finds an log entry matching all supplied criteria.
    ```ts
    containsLog(messageSegment: RegExp | string | null, 
        logLevel?: LoggingLevel | null, 
        category?: string | null, 
        more?: FindMoreCapturedLogDetails): boolean {}
    ```
- `findMessage()` - Returns the Log entry matching all supplied criteria.
    ```ts
    findMessage(messageSegment: RegExp | string | null, 
        logLevel?: LoggingLevel | null, 
        category?: string | null, 
        more?: FindMoreCapturedLogDetails): CapturedLogDetails | null
    ```
## Varying the minLevel based on what is being logged
If you want to use the Debug or Info levels, expect to get a lot of content (example below). Often you are trying to diagnose a problem through the logs. Jivs lets you selectively log everything that meets a specific criteria, even though its below the minLevel.

1. Set the initial minLevel to Debug.
2. Run your code.
3. Review the log to identify characteristics you want to keep.
4. Create one or more `OverrideMinLevelWhenRule objects` with those characteristics. [Documentation](http://jivs.peterblum.com/typedoc/interfaces/jivs-engine_Services_AbstractClasses_LoggerServiceBase.OverrideMinLevelWhenRule.html)
5. Call the `LoggerService.overrideMinLevelWhen function` with each. [Documentation](http://jivs.peterblum.com/typedoc/classes/jivs-engine_Services_AbstractClasses_LoggerServiceBase.OverrideMinLevelWhenRule.html)
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
    let logger = new CapturingLogger(LoggingLevel.Error);	// was Debug
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
## API References
- [LoggerServiceBase class](http://jivs.peterblum.com/typedoc/classes/jivs-engine_Services_AbstractClasses_LoggerServiceBase.LoggerServiceBase.html)
- [ConsoleLoggerService class](http://jivs.peterblum.com/typedoc/classes/jivs-engine_Services_ConcreteClasses_LoggerService.ConsoleLoggerService.html)
- [CapturingLogger class](http://jivs.peterblum.com/typedoc/classes/jivs-engine_Support_CapturingLogger.CapturingLogger.html)
---
Go to [JivsServices Home](./Home.md)

Go to [API Home](../Home.md)