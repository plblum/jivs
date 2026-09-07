# @plblum/jivs

*Jivs is a work-in-progress. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later. Work is ongoing - Peter Blum 2026-09-07*

Jivs — JavaScript Input Validation Service — is a suite of libraries that help answer this question: how do I deal with <dfn title="Validating user input or externally supplied data to prevent saving invalid data">input validation</dfn> in the UI and/or the Model?

**Jivs offers a focused approach to input validation, respecting the boundaries between your business logic and user interface.** It’s ideal for projects where the <dfn title="A single condition that evaluates the incoming data and determines if it is valid or not.">validation rules</dfn> are considered the domain of the business logic, and for projects that use strong OOP patterns like separation of concerns and dependency injection.

With Jivs, the UI knows almost nothing about what needs to be validated. A form just posts its values into Jivs and asks for the validation results. The form uses that information to change the visuals, like showing the error messages, and blocking data submission if necessary.

<img src="http://jivs.peterblum.com/images/jivs-high-level-diagram.svg"></img>

## Benefits
- There are two _use cases_ associated with input validation:
    - Business rules and the model own validation rules
    - Form is built without a model or formal business logic
    
    Both are available with Jivs.

- When working with business logic and a model, its code must not prevent the UI from giving the user a suitable experience. Jivs provides a two phase setup for form input using models.
    - The model definition phase, strictly built against business rules
    - The form adapts those to its needs, such as changing an error message

- **Built with modern OOP patterns**: Jivs is built on solid object-oriented programming (OOP) principles, such as Single Responsibility Objects, Services, Factories, and Dependency Injection.

- **Emphasis on tests**: With your validation rules separated from the UI itself, its now easy to write unit tests against them. With our own emphasis on OOP patterns, the Jivs code base itself achieves nearly 100% test coverage with meaningful tests.

- **Built from experience**: Jivs is the result of over 20 years of experience in building input validation software, addressing many nuances not found in most validation libraries but that cover real-world issues faced by developers.

- **Open source and MIT License**: <a href="https://github.com/plblum/jivs" target="_blank">https://github.com/plblum/jivs</a>

Start here to better understand this library and determine if its right for you:
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