# @plblum/jivs-builder: Build your configurations

Most applications should start with [`@plblum/jivs`](https://www.npmjs.com/package/@plblum/jivs),
which installs the Builder API along with the Jivs engine. This README covers
the Builder package for focused use.

jivs-builder is a normal part of the Jivs ecosystem and is included when
installing the umbrella package.

```bash
npm i @plblum/jivs-builder
```

It provides the classes referred to as "Builder" and "Builder API", which include the ValueHost rules and syntaxes like this:

```ts
builder.field('FirstName', LookupKeys.String).requireText().stringLength(50);
```
[Documentation](../../docs/ValueHostsManager_Configuration_Guide.md)

[Source code](https://github.com/plblum/jivs/tree/main/packages/jivs-builder)

> `jivs-builder` happens to be a separate module because if you are determined to reduce the footprint in production, you can capture the output of the builder - the `ValueHostsManagerConfig object tree` - on the server and the client can request that instead of explicitly using ValueHost rules or Builder features directly. But initially, please use Builder until you have stabilized your implementation.