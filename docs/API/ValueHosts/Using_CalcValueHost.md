# Using CalcValueHost
The `CalcValueHost` is a `ValueHost` that calculates its value. It supports these use cases:
- For a calculated value needed by a validator.
- For a calculated value that needs to be validated.
- For a calculated value that needs to appear in the UI.

In the last two, you will use it together with a `FieldValueHost`, as described below.

You supply it with a function has this format during configuration:
```ts
(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => number | Date | string | null | boolean | undefined
```
Take advantage of the _findValueHosts_ parameter to request values from other ValueHosts: `findValueHosts.getValueHost('name').getValue()`. It also provides access to `JivsServices` on `findValueHosts.services`.

In this example, the function multiplies the value from the `FieldValueHost` 'Count' by a multiplier setup in a `StaticValueHost`. The PurchaseLimit field has a validator that reports an error unless the value is lessThan the result of the calculation.
```ts
builder.field('PurchaseLimit', LookupKey.Integer).lessThan(valueHost('TimesTen'))
builder.field('Count', LookupKey.Integer);
builder.static('Multiplier', LookupKey.Number, {
    initialValue: 10
});
builder.calc('TimesTen', LookupKey.Integer, 
   (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => {
      let count = findValueHosts.getValueHost('Count').getValue() as number;
      let multiplier = findValueHosts.getValueHost('Multiplier').getValue() as number;
      if (!isNaN(count) && !isNaN(multiplier))
          return count * multiplier;
      return undefined;
   });
```

See a practical example here: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts)

### Pairing a CalcValueHost with a FieldValueHost
A `CalcValueHost` can provide a calculated value for other value hosts, but it does not provide field-level validation or UI display on its own. To validate the calculated result or display it in the UI, pair it with a `FieldValueHost`.

Configure the `FieldValueHost` with the `calculation` property in `FieldValueHostConfig`. The field host keeps its value synchronized with the `CalcValueHost`, and can format and validate that value.

_Example:_

_DiffDaysDisplay_ is paired with _DiffDays_ using `calculation.sourceValueHostName`. The _DiffDaysDisplay_ displays the calculated number of days and applies a validation rule.

```ts
builder.field('StartDate', LookupKey.Date);
builder.field('EndDate', LookupKey.Date);
builder.calc('DiffDays', LookupKey.Integer, differenceBetweenDates,
    ['StartDate', 'EndDate']);  // recalculate when these fields change
builder.field('DiffDaysDisplay', LookupKey.Integer, {
    label: 'Days apart',
    calculation: {
        sourceValueHostName: 'DiffDays', // pairs to the CalcValueHost here
        textForUndefined: 'Dates needed',   // when the calculation is unresolved
        textForUndefinedl10n: 'DiffDays.DatesNeeded'
    },
    writerRule: { when: 'always', then: 'skip' }    // Writer won't attempt to write it
})
.lessThanOrEqual(30);   // validation
```
This example shows how to:
- Pair the hosts by setting `calculation.sourceValueHostName` to the name of the `CalcValueHost`.
    ```ts
    builder.field('DiffDaysDisplay', LookupKey.Integer, {
        calculation: {
            sourceValueHostName: 'DiffDays', 
        },
     })    
    ```
- List the calculation’s dependencies in `CalcValueHostConfig.dependencyValueHostNames`. The calculation is then reevaluated when any of those value hosts change.
    ```ts
    builder.calc('DiffDays', LookupKey.Integer, differenceBetweenDates
        ['StartDate', 'EndDate']);
    // or
    builder.calc({
        name: 'DiffDays',
        dataType: LookupKey.Integer,
        calcFn: differenceBetweenDates,
        dependencyValueHostNames: ['StartDate', 'EndDate']
    });
    ```
- Apply the `.lessThanOrEqual()` validator to _DiffDaysDisplay_.
- Prevent a `Writer` from writing _DiffDaysDisplay_ by setting `writerRule` to `{ when: 'always', then: 'skip' }`. Use this when the field does not correspond to data in the destination.
    ```ts
    builder.field('DiffDaysDisplay', LookupKey.Integer, {
        writerRule: { when: 'always', then: 'skip' }  
    })
    ```
- Provide text for an unresolved calculation with `textForUndefined` and `textForUndefinedl10n`. When the calculation result is undefined, the `ValueHostsManager.onTextValueChanged` callback can use this text for the UI. `FieldValueHost.textForUndefinedCalculationValue()` returns the configured text, or an empty string if no text is configured.
    ```ts
    builder.field('DiffDaysDisplay', LookupKey.Integer, {
        calculation: {
            textForUndefined: 'Dates needed', 
            textForUndefinedl10n: 'DiffDays.DatesNeeded'
        }
    })
    ```
## API References
- [CalcValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_CalcValueHost.CalcValueHost.html)
- [ValueHostsManagerConfigBuilder class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.ValueHostsManagerConfigBuilder.html)
---
Go to [ValueHost Home](./Home.md)

Go to [API Home](../Home.md)