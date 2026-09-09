# Installing Jivs

## Get the npm packages
Jivs is available as npm packages. For a standard application, install the
umbrella package and the development-only configuration analysis tool.

```text
npm install @plblum/jivs
npm install --save-dev @plblum/jivs-configanalysis
```

`@plblum/jivs` installs the Jivs engine and Builder API. ConfigAnalysis helps
identify configuration problems during development.

## Add create_JivsServices.ts to your codebase
**For each application**, copy the `create_JivsServices.ts` starter file into your project.

Get the file from `node_modules/@plblum/jivs/starter_code/create_JivsServices.ts`
or from the [starter file on GitHub](https://github.com/plblum/jivs/blob/main/starter_code/create_JivsServices.ts).

> The documentation will frequently refer to `create_JivsServices.ts file`. That will always mean your copy of this file in your project.

### Intro to the createJivsServices() function

The `create_JivsServices.ts` file defines the `createJivsServices()` function.
It creates and configures the [`JivsServices`](./API/JivsServices/Home.md)
object, which is Jivs's dependency-injection and service-configuration point.

You will use this pattern as you work with Jivs:
```ts
const services = createJivsServices('en-US');
const rules = new YourRules(services);
const config = rules.configure();
const vhm = new ValueHostsManager(config);
```
Initially, you can leave its configuration unchanged. Customize the file
later as described in the documentation.

---
Go to: [Jivs Documentation Library](Home.md).