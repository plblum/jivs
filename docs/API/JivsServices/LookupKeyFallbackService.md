Use `LookupKeyFallbackService` when you introduce a new [Lookup Key](../Data_Type_Support/Home.md#lookup-keys). It creates a relationship between your Lookup Key and another that is the base data type it is built around.

For example, `LookupKey.Integer` uses a number as the base data type.
So it has a relationship with `LookupKey.Number`.

`DataTypeFormatterService` and `DataTypeParserService` consume this as they try to find the best fitting formatter or parser. If you use a Lookup Key to get a parser, formatter, and several other use cases, when
there is no support for that Lookup Key, it will fall back through Lookup Keys until it finds what it needs.

Jivs automatically registers its own built-in Lookup Keys like this:
```ts
let lkfs = vhm.lookupKeyFallbackService;
lkfs.register(LookupKey.Integer, LookupKey.Number);
lkfs.register(LookupKey.Currency, LookupKey.Number);
lkfs.register(LookupKey.Percentage, LookupKey.Number);
lkfs.register(LookupKey.Percentage100, LookupKey.Number);
lkfs.register(LookupKey.YesNoBoolean, LookupKey.Boolean);
lkfs.register(LookupKey.ShortDate, LookupKey.Date);
lkfs.register(LookupKey.AbbrevDate, LookupKey.Date);
lkfs.register(LookupKey.LongDate, LookupKey.Date);
lkfs.register(LookupKey.AbbrevDOWDate, LookupKey.AbbrevDate);
lkfs.register(LookupKey.LongDOWDate, LookupKey.LongDate);
lkfs.register(LookupKey.TimeOfDayHMS, LookupKey.TimeOfDay);
lkfs.register(LookupKey.Capitalize, LookupKey.String);
lkfs.register(LookupKey.Uppercase, LookupKey.String);
lkfs.register(LookupKey.Lowercase, LookupKey.String);
lkfs.register(LookupKey.CaseInsensitive, LookupKey.String);
```
## Updating the service
Within the `createJivsServices()` function, edit the `createLookupKeyFallbackService()` function.
```ts
export function createJivsServices(defaultCultureId: string): JivsServices {
    let vs = new JivsServices(defaultCultureId);
    
    createLookupKeyFallbackService(); 
}
export function createLookupKeyFallbackService(): ILookupKeyFallbackService
{
    let service = new LookupKeyFallbackService();

    service.register('Email', LookupKey.String);

    return service;
}
```
## API References
- [LookupKeyFallbackService](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_Services_ConcreteClasses_LookupKeyFallbackService.LookupKeyFallbackService.html)

---
Go to [JivsServices Home](./Home.md)

Go to [API Home](../Home.md)