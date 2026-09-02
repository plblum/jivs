# Custom Rule: You create the condition on demand
If you want to create the actual condition object and drop it into the Builder, use `customRule()`.
It takes a function where you return the condition instance.
```ts
 (requestor: ValidatorConfig)=> ICondition | null
``` 

> Its often better to create a Condition class, so it can be reused, tested, and work itself into the Builder syntax. See [Creating your own Conditions](./Creating_Your_Own.md)
> Configurations can be cached. However, using callback functions
```ts
customRule(requestHandler);
customRule(requestHandler,
    errorMessage?, summaryMessage?);
customRule(requestHandler,
    { // these are the validator parameters
        errorMessage?: null | string;
        errorMessagel10n?: null | string;
        summaryMessage?: null | string;
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity;
        errorCode?: string; 
        enabled?: boolean;
    });
```
Error message tokens: `{Label}`

Choose one of the methodologies below. Then attach it using the Builder API with the `customRule()` function:

```ts
builder.field('fieldname')
    .customRule(
        (requester)=> ...create your object here..., 
        'optional error message', 
        { ...optional additional parameters });
```
- Create a plain JavaScript object that matches the `ICondition interface` contract. This is often used for one-off logic.
    ```ts
    let myCondition = <ICondition>{
        evaluate: (valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> =>
        {
        // evaluate the value(s) and return a ConditionEvaluateResult
        },
        category: 'Content';
        conditionType: 'MyConditionType';
    }
    ```
- Implement directly from [`ICondition`](ICondition_Interface.md) as a class
    ```ts
    export class MyCondition implements ICondition 
    {
        public evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>
        {
        // evaluate the value(s) and return a ConditionEvaluateResult
        },
        public get category(): string { return 'Content'; }
        public get conditionType(): string { return 'MyConditionType'; }
    }
    ```	

**Examples**
```ts
builder.field('fieldname').customRule((requestor)=> {    
    return new RegExpCondition({ expression: /^\d{7}$/ });
});
```
---
Go to [Conditions Home](./Home.md)

Go to [API Home](../Home.md)