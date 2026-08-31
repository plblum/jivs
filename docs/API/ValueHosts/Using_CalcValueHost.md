# Using CalcValueHost
The `CalcValueHost` takes a function used to calculate its value. The function has this format.
```ts
(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => number | Date | string | null | boolean | undefined
```
Take advantage of the _findValueHosts_ parameter to request values from other ValueHosts: `findValueHosts.getValueHost('name').getValue()`. It also provides access to `JivsServices` on `findValueHosts.services`.

In this example, the function multiplies the value from the `FieldValueHost` 'Count' by 10.
```ts
builder.field('Count', LookupKey.Integer);
builder.calc('TimesTen', LookupKey.Integer, 
   (callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager) => {
      let count = findValueHosts.getValueHost('Count') as number;
      if (!isNaN(count))
          return count * 10;
      return undefined;
   });
```

See a practical example here: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts)
