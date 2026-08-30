# CultureService
Jivs is localizable, especially when it comes to parsers and formatters. `CultureService` is a class that identifies the cultures your app will support. By "Culture", we mean the classic ISO language-region stuff, like 'en-US' (US English), 'de-DE' (Germany German), etc.

Actual localization rules are found within the parsers and formatters, but they get the culture from `CultureService`.

As a result, you must ensure `CultureService` is correctly configured with suitable ISO language-region names.

Within the `createJivsServices()` function, you will see an initial setup like this:

```ts
export function createJivsServices(defaultCultureId: string): JivsServices {
    let vs = new JivsServices(defaultCultureId);
    
    // --- CultureServices ----------------------------
    registerCultures(vs.cultureService);    // define cultures that you support and their fallbacks
}
export function registerCultures(cs: ICultureService): void
{
   let cultures: Array<CultureIdWithFallback> = [
            {
                cultureId: 'en',
                fallbackCultureId: null    // when this is the default culture,
            },
            {
                cultureId: 'en-US',
                fallbackCultureId: 'en'
            },
            {
                cultureId: 'es',
                fallbackCultureId: 'en'
            },
            {
                cultureId: 'es-MX',
                fallbackCultureId: 'es'
            }
    ];
    cultures.forEach((culture) => cs.register(culture));
}
```
- The `createJivsServices()` function itself lets you pass your default culture in. While it shows 'en' above, you are in control of this function. Modify it as it serves you best.
- In registerCultures(), update the array to reflect your cultures. They can be specific to a region ('es-MX') or just to a language ('es').
- Cultures have fallbacks, not just 'es-MX' to 'es', but sometimes to another language entirely, like 'es' to 'en' shown above. This mostly serves parsers and formatters that may not have localization to a desired culture, but can still localize in some fashion.

## Selecting the culture used by ValueHostsManager
Each time its created, ValueHostsManager inherits the default culture from the CultureService.

Use this to override that default:
```ts
let vhm = new ValueHostsManager(config);
vhm.behaviors.activeCultureId = 'es-MX';
```
You can change that value on demand. However, don't setup ValueHostManager to be shared by multiple page requests if you allow for changes because your on demand change will impact all threads.