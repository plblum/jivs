# @plblum/jivs

*Jivs is a work-in-progress. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later. Work is ongoing. [Reach out](https://github.com/plblum/jivs/discussions) if you are interested in using it. - Peter Blum 2026-09-07*

Jivs — JavaScript Input Validation Service — is a suite of libraries that help answer this question: how do I deal with input validation in the UI and/or the Model?

**Jivs offers a focused approach to input validation, respecting the boundaries between your business logic and user interface.** It’s ideal for projects where the validation rules are considered the domain of the business logic, and for projects that use strong OOP patterns like separation of concerns and dependency injection.

With Jivs, the UI knows almost nothing about what needs to be validated. A form just posts its values into Jivs and asks for the validation results. The form uses that information to change the visuals, like showing the error messages, and blocking data submission if necessary.

<img src="http://jivs.peterblum.com/images/jivs-high-level-diagram.svg"></img>

## Benefits
- **Jivs supports two approaches to input validation**
    - **Business logic-driven validation**: Rules belong to the business logic for a model
    - **Form-specific validation**: Rules are defined specifically for a form

- **Adapts the form to work with business logic-driven validation**: The form can change UI specifics like error messages without breaking the underlying validation rules.

- **Built with modern OOP patterns**: Jivs is built on solid object-oriented programming (OOP) principles, such as Single Responsibility Objects, Services, Factories, and Dependency Injection.

- **Emphasis on tests**: Separating validation rules from the UI makes them easier to unit test. Jivs itself has nearly 100% test coverage, with meaningful tests.

- **Built from experience**: Jivs is the result of over 20 years of experience in building input validation software, addressing many nuances not found in most validation libraries but that cover real-world issues faced by developers.

- **Open source and MIT licensed**: <a href="https://github.com/plblum/jivs" target="_blank">https://github.com/plblum/jivs</a>

Start here to better understand this library and determine if it's right for you:
[Jivs Documentation Library](https://github.com/plblum/jivs/blob/main/docs/Home.md).

## Install

Install the standard Jivs application package:

```text
npm install @plblum/jivs
```

During development, install the configuration analysis tool as well:

```text
npm install --save-dev @plblum/jivs-configanalysis
```

`@plblum/jivs` installs the Jivs engine and Builder API. ConfigAnalysis is a
separate development tool that helps identify configuration problems early.

## Add the Jivs services setup

Copy `starter_code/create_JivsServices.ts` from `node_modules/@plblum/jivs/starter_code/create_JivsServices.ts`
or from the [starter file on GitHub](https://github.com/plblum/jivs/blob/main/starter_code/create_JivsServices.ts).

For the full installation guidance, see the [Jivs installation documentation](https://github.com/plblum/jivs/blob/main/docs/Installing_Jivs.md).


## Your turn!
Start building with Jivs: [Jivs Documentation Library](https://github.com/plblum/jivs/blob/main/docs/Home.md).