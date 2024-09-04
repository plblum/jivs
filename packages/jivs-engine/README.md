## @plblum/jivs-engine

*Jivs is a work-in-progress. This is a preview to get feedback from the community.
I'm looking for an assessment of the architecture. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later.*

*Please visit [Jivs Github Discussions board](https://github.com/plblum/jivs/discussions) to participate.*

Jivs -- JavaScript Input Validation Service -- is a suite of libraries that help answer this question: how do I deal with <dfn title="Validating user input or externally supplied data to prevent saving invalid data">input validation</dfn> in the UI and/or the Model?

**Jivs offers a focused approach to input validation, respecting the boundaries between your business logic and user interface.** It’s ideal for projects where the validation rules are considered the domain of the business logic.

An input form in the UI knows almost nothing about what needs to be validated. It just posts input values into Jivs and asks for the validation results. It gets back the Validation State, such as
"Valid", "Invalid", or even "Undetermined", and any issues found.

The UI uses that information to change the visuals, like showing the error messages, and blocking data submission if necessary.

- **Business logic can dictate validation rules**: Validation rules are often defined in the business logic. Jivs allows the business logic team to deliver those rules, ensuring that validation logic is directly aligned with the business requirements and evolves alongside the application’s core functionality.

- **Empowering UI Developers with Flexibility**: Jivs gives UI developers the flexibility to tailor the user experience while maintaining the integrity of the validation rules. They can customize error messages, apply localization, and disable unnecessary validators, ensuring that they can achieve their goals. They can also incorporate UI-specific validators, such as for a string parsing error. For UI-only forms, they can define their own validation rules with Jivs, ensuring a consistent approach across the application. In fact, Jivs works just fine in apps that don't have business logic dictating validation rules. The benefit is the separation of validation rules from the UI.

- **Service-Oriented Architecture**: At the heart of Jivs is *Jivs-Engine*, with a service-oriented architecture built in TypeScript, so it works within browsers and Node.js. Jivs-Engine is designed to have an ecosystem of libraries that tackle UI frameworks, support models, and use various third-party libraries.

- **Built with Modern OOP Patterns**: Jivs is built on solid object-oriented programming (OOP) principles, such as Single Responsibility Objects, Services, Factories, and Interfaces. Many components within Jivs are replaceable, allowing you to use your preferred third-party libraries for tasks like formatting, localization, and logging. These patterns have also helped us build out our own unit tests, achieving almost 100% code coverage with meaningful tests.

- **Built from Experience**: Jivs is the result of over 20 years of experience in building input validation software, addressing many nuances not found in most validation software but that solve real-world issues faced by developers. This depth of experience is embedded throughout the toolset. Take a look at the features to see how Jivs goes beyond the basics, offering a comprehensive solution to real-world validation challenges.

- **Open source and MIT License**

Start here to better understand this library and determine if its right for you:
[Jivs Documentation](https://github.com/plblum/jivs/blob/main/README.md)

For the open source project: [https://github.com/plblum/jivs](https://github.com/plblum/jivs)

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
