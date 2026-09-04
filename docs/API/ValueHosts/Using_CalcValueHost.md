# Using CalcValueHost
The `CalcValueHost` if a `ValueHost` that calculates its value. 

You supply it with a function has this format during configuration:
```ts
(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => number | Date | string | null | boolean | undefined
```
Take advantage of the _findValueHosts_ parameter to request values from other ValueHosts: `findValueHosts.getValueHost('name').getValue()`. It also provides access to `JivsServices` on `findValueHosts.services`.

In this example, the function multiplies the value from the `FieldValueHost` 'Count' by a multiplier setup in a `StaticValueHost`.
```ts
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
## API References
- [CalcValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_CalcValueHost.CalcValueHost.html)
- [ValueHostsManagerConfigBuilder class](http://jivs.peterblum.com/TypeDoc/classes/jivs-builder_Builders_ConcreteClasses.ValueHostsManagerConfigBuilder.html)
---
Go to [ValueHost Home](./Home.md)

Go to [API Home](../Home.md)