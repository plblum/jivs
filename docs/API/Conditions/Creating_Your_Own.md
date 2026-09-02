# Creating your own Conditions
Jivs provides many `Condition classes`, covering typical cases. Often your condition needs will be solved by using them. Consider:
- [`RegExpCondition`](./Conditions_Included_with_Jivs.md#regexp) is your go-to for string patterns. If you need help with Regular Expressions, we recommend [regex101.com](https://regex101.com/)
- When complex logic is involved, it is often built using AND and OR operators upon simpler types. Use `AllMatchCondition` or `AnyMatchCondition`.
- When the comparison conditions (EqualTo, LessThan, etc) look ideal except your data is not supported, create a `DataTypeComparer` to establish support.
- For the one-off use cases, wire up the `customRule()` function on the Builder. 

## Pick your starting point
- Subclass from [`RegExpCondition`](./Conditions_Included_with_Jivs.md#regexp) especially when you create a new data type.
    ```ts
    export class LicenseNumberCondition extends RegExpCondition 
    {
        constructor(config: IRegExpConditionConfig)
        {
        super({ 
            ...config, 
            ...{ expressionAsString: '^\\d\\d\\d\\-\\d\\d\\d\\d$'} 
        });
        }
        public get conditionType(): string { return 'LicenseNumber'; }
    }
    ```
    See this sample code for more: [jivs-examples/src/EmailAddressDataType.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts).
- Subclass from [`RegExpConditionBase`](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Conditions_AbstractClasses_RegExpConditionBase.html) to develop a regular expression condition that has its own configuration settings.
    ```ts
    export interface LicenseNumberConditionConfig extends RegExpConditionBaseConfig
    {
        allowTwo?: boolean; // true means pattern is repeated with a comma separator
    }
    
    export class LicenseNumberCondition extends RegExpConditionBase<LicenseNumberConditionConfig>
    {
        protected getRegExp(valueHostResolver: IValueHostResolver): RegExp
        {
            const base = @'\d\d\d\-\d\d\d\d';
            if (this.config.allowTwo)
                return new RegExp('^' + base + '(\,\s?' + base + ')?$');
            return new RegExp('^' + base + '$');
        }
        public get conditionType(): string { return 'LicenseNumber'; }
    }
    ```    
- Subclass from [`ConditionBase`]((http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Conditions_AbstractClasses_ConditionBase.html)) to start at the most abstract class. 
    Create a configuration object by extending [`ConditionConfig`](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Conditions_Types_ConditionConfig.html).
    ```ts
    interface MyConditionConfig extends ConditionConfig
    {
        configOption: string;
    }
    class MyCondition extends ConditionBase<MyConditionConfig>
    {
        public get conditionType(): string {return 'MyConditionType';}
        public get category(): ConditionCategory { return ConditionCategory.Undetermined; }
        public evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>
        {
            let value = valueHost.getValue() as string;
            if (this.config.configOption === 'A')
            {
                if (value === null)
                    return ConditionEvaluateResult.Undetermined;
                if (value.length > 10)
                    return ConditionEvaluateResult.NoMatch;
                return ConditionEvaluateResult.Match;
            }
            if (value === null)
                return ConditionEvaluateResult.NoMatch;
            return ConditionEvaluateResult.Match;
        }
    }
    ```
- Subclass [`OneValueConditionBase`](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Conditions_AbstractClasses_OneValueConditionBase.html) to start with a slightly richer starting point that knows how to convert a null valueHost parameter into the primary valuehost. See this example: [jivs-examples/src/EvenNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts)
- Implement the [`ICondition`](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Conditions_Types.ICondition.html) interface to create the class.

### Additional Guidance
- Look here for source code to the concrete and abstract Conditions classes within Jivs:
[jivs-engine/src/Conditions](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Conditions)
- Return `Undetermined` when unsupported data is found. For example, if you are evaluating only against a string, test `typeof value === 'string'` and return `Undetermined` when false.
- Always write unit tests.
- `conditionType` should be meaningful. Try to limit it to characters that work within JSON and code, such as letters, digits, underscore, space, and dash. Also try to keep it short and memorable as users will select your `Condition` by specifying its value in the Configs passed into the `ValueHostsManager`.
- `conditionType` values are case sensitive.

## Add your Condition Class to the factory
Once created, go to the `registerConditions() function` that is [part of the startup code](../JivsServices/Home.md#configuring-jivsservices) and add it like this:
```ts
export function registerConditions(cf: ConditionFactory): void
{
    ... existing conditions...
    cf.register<myConditionConfig>(
        'MyConditionType', (config) => new MyCondition(config));
}
```
You can also extend the Builder API to support it.

See this example: [jivs-examples/src/EvenNumberCondition.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EvenNumberCondition.ts)
---
Go to [Conditions Home](./Home.md)

Go to [API Home](../Home.md)