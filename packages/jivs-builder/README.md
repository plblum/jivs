# @plblum/jivs-builder: Build your configurations

jivs-builder module is a normal part of the Jivs ecosystem and should be installed when gathering the jivs-suite.

```bash
npm i @plblum/jivs-builder
```

It provides the classes referred to as "Builder" and "Builder API", which include the ValueHost rules and syntaxes like this:

```ts
builder.field('FirstName', LookupKeys.String).requireText().stringLength(50);
```
[Documentation](../../docs/Configuring.md)

[Source code](https://github.com/plblum/jivs/tree/main/packages/jivs-builder)

> `jivs-builder` happens to be a separate module because if you are determined to reduce the footprint in production, you can capture the output of the builder - the `ValueHostsManagerConfig object tree` - on the server and the client can request that instead of explicitly using ValueHost rules or Builder features directly. But initially, please use Builder until you have stabilized your implementation.