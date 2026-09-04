# ErrorCodes
Each `Validator` has an error code that is used to align it with the [TextLocalizerService](../JivsServices/TextLocalizerService.md) and other features. Its value is setup in the Validator's `errorCode` configuration property, but is usually omitted due to it taking on a default.
```ts
builder.field('FirstName', LookupKey.String, { label: 'First name'} )
   .requiredText()  // errorCode defaults to ConditionType.RequireText
   .notEqualTo('LastName', {
        errorCode: 'SameNameWarning',
   });
```
The error code is used like this:
- To lookup the error message with the [`TextLocalizerService`](../JivsServices/TextLocalizerService.md).
- It is included in the `IssueFound object` that is passed to the UI along with the error message to allow your UI to recognize it.
- When business logic provides errors, they can supply their own error code. You have to convert your error info into an `IssueFound object` and call `ValueHostsManager.addExternalIssueFound()` for it to appear in Jivs. At that time, map it to the ConditionType or errorCode found on an individual Jivs validator. Your business logic error now activates the same validator, using the error message supplied for that validator.

Assign the `errorCode` property in these cases:
- When using any of these conditions if you need to align it with error message lookup:
    - `WhenCondition`
    - `NotCondition`
    - `AllMatchCondition`
    - `AnyMatchCondition`
    - `CountMatchesCondition`
- The same condition type is used more than once.
- To clarify the purpose of the error.
- To conform with a business logic error code.
- To provide multiple localized error messages for the same condition type.

## API References
- [Validator class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Validator_ConcreteClasses.Validator.html)
- [ValidatorConfig type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validator_Types.ValidatorConfig.html)
- [IssueFound type](http://jivs.peterblum.com/TypeDoc/interfaces/jivs-engine_Validation_Types.IssueFound.html)
- [TextLocalizerService class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_TextLocalizerService.TextLocalizerService.html)

---
Go to [Validators Home](./Home.md)

Go to [API Home](../Home.md)