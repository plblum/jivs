## @plblum/jivs-engine

*Jivs is a work-in-progress. This is a preview to get feedback from the community.
I'm looking for an assessment of the architecture. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later.*

*Please visit [Jivs Github Discussions board](https://github.com/plblum/jivs/discussions) to participate.*

Jivs -- JavaScript Input Validation Service -- is a suite of libraries that help answer this question: how do I deal with data validation in the UI and/or on the Model?
Jivs-engine -- this library -- is its core, with a powerful set of tools to adapt to
UIs and models.

Jivs' philosophy involves strong separation of concerns.
-   UI is strongly separated from the validation work
-   Business logic code is where your validation rules generally are
    found, not in the UI input forms.

The result is that the UI knows almost nothing about what needs to be
validated. The UI just posts its current values into Jivs-engine and asks: what
are the result of validation? It gets back a Validation Result, such as
"Valid", "Invalid", or even "Undetermined", and any issues found. An
issue found includes error messages, an id to the field associated with
the validation rule, and its severity.

The UI uses that information to change the visuals: show those errors in
some way and perhaps change the appearance of the input and its
surroundings. Jivs knows nothing about that stuff, although its
supporting libraries (pending) are well-informed on those matters.

Start here to better understand this library and determine if its right for you:
[Jivs Documentation](https://github.com/plblum/jivs)

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
