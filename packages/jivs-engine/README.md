## @plblum/jivs-engine

*Jivs is a work-in-progress. This is a preview to get feedback from the community.
I'm looking for an assessment of the architecture. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later.*

*Please visit [Jivs Github Discussions board](https://github.com/plblum/jivs/discussions) to participate.*

Jivs — JavaScript Input Validation Service — is a suite of libraries that help answer this question: how do I deal with <dfn title="Validating user input or externally supplied data to prevent saving invalid data">input validation</dfn> in the UI and/or the Model?

**Jivs offers a focused approach to input validation, respecting the boundaries between your business logic and user interface.** It’s ideal for projects where the <dfn title="A single condition that evaluates the incoming data and determines if it is valid or not.">validation rules</dfn> are considered the domain of the business logic, and for projects that use strong OOP patterns like separation of concerns and dependency injection.

With Jivs, the UI knows almost nothing about what needs to be validated. A form just posts input values into Jivs and asks for the validation results. It gets back the Validation State, such as
"Valid", "Invalid", or even "Undetermined", and any issues found.

The UI uses that information to change the visuals, like showing the error messages, and blocking data submission if necessary.

- **Business logic can dictate validation rules**: Validation rules are often defined in the business logic. Jivs allows the business logic team to deliver those rules, ensuring that validation logic is directly aligned with the business requirements and evolves alongside the application’s core functionality.

- **UI developers can make the adjustments they need**: Jivs gives UI developers the flexibility to tailor the user experience while maintaining the integrity of the validation rules. They can customize error messages, apply localization, and disable unnecessary validators, ensuring that they can achieve their goals. They can also incorporate UI-specific validators, such as for a string parsing error. 

- **For forms that are not business logic-driven**: Whether or not business logic drives validation, Jivs keeps validation rules separate from the form. It provides flexibility for apps without business logic-driven validation and for forms that don’t require it, ensuring consistency and maintainability.

- **Service-oriented architecture**: At the heart of Jivs is *Jivs-Engine*, with a service-oriented architecture built in TypeScript, so it works within browsers and Node.js. Jivs-Engine is designed to have an ecosystem of libraries that tackle UI frameworks, support models, and use various third-party libraries.

- **Built with modern OOP patterns**: Jivs is built on solid object-oriented programming (OOP) principles, such as Single Responsibility Objects, Services, Factories, and Dependency Injection. Many components within Jivs are replaceable, allowing you to use your preferred third-party libraries for tasks like formatting, localization, and logging. These patterns have also helped us build out our own unit tests, achieving almost 100% code coverage with meaningful tests.

- **Built from experience**: Jivs is the result of over 20 years of experience in building input validation software, addressing many nuances not found in most validation software but that solve real-world issues faced by developers. This depth of experience is embedded throughout the toolset. Take a look at the features to see how Jivs goes beyond the basics, offering a comprehensive solution to real-world validation challenges.

- **Open source and MIT License**: <a href="https://github.com/plblum/jivs" target="_blank">https://github.com/plblum/jivs</a>

Start here to better understand this library and determine if its right for you:
[Jivs Documentation](http://jivs.peterblum.com/typedoc)

### Selecting the right starting point
Jivs includes multiple libraries. This one -- **jivs-engine** -- handles the actual work of validation. It provides no user interface and is unaware of the shape of any Model. Its written with a strong sense of modern OOP patterns, where you build something with a strong separation of concerns: the UI is a separate world from evaluating data and returning a result.

When using Jivs, you are likely to install several other libraries that provide the tooling around UI and Models.

Install what you need. Jivs-engine is always a dependency of the rest. In fact, the only time you may explicitly use `npm install --save @plblum/jivs-engine` is to build a new library for it.

## Install
```
npm install --save @plblum/jivs-engine
```

## Usage
As this is a library that is behind other libraries, there are many ways to use Jivs.
So please use [Jivs Documentation](http://jivs.peterblum.com/typedoc) and the other Jivs libraries as a resource.

In addition, the [source code](https://github.com/plblum/jivs) includes a package called [jivs-examples](https://github.com/plblum/jivs/tree/main/packages/jivs-examples), dedicated to coding examples.
