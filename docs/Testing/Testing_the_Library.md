# Testing the library
As you write code for Jivs itself, or create new Conditions, DataTypeParsers, DataTypeFormatters, etc, create unit tests with Jest.

You can see how we do it in our extensive tests here: [Jivs-engine Unit Tests](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/tests).

We also provide you with several tools found in the Jivs-engine [Support folder](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Support).

We recommend you use the following:
- Log with our `TestingLoggingService` so you can see entries your class submits. See [TestingLoggingService](../API//JivsServices/Logging.md#testingloggingservice-class).
- Generate `JivsServices` with a much more simplistic profile than found in your runtime `createJivsServices()` code. Use [the createJivsServicesForTesting() function](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/Support/createJivsServicesForTesting.ts)

```ts
import { createJivsServicesForTesting } from "@plblum/jivs-engine/build/Support/createJivsServicesForTesting";

test('My test case', ()=> {
    let services = createJivsServicesForTesting({ options });
    // services.logger is already strongly typecasted to TestingLoggingService

    expect(logger.containsLog('My string to find')).toBe(true);
});
```