# Installing Jivs

## Get the npm packages
Jivs is available as npm packages. It has a number of libraries.

Jivs-engine is the core and is needed by all other libraries. [Jivs-engine npm package](https://www.npmjs.com/package/@plblum/jivs-engine).
```
npm install --save @plblum/jivs-engine
```
## Add create_JivsServices.ts to your codebase
**For each application**, copy the `create_JivsServices.ts` starter file into your project.

  Get the file here: [https://github.com/plblum/jivs/blob/main/starter_code/create_JivsServices.ts](https://github.com/plblum/jivs/blob/main/starter_code/create_JivsServices.ts)

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