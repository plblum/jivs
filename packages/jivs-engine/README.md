## @plblum/jivs-engine

Jivs -- JavaScript Input Validation Service -- is a suite of libraries that help answer this question: how do I deal with data validation in the UI and/or on the Model?

Start here to better understand this library and determine if its right for you:
[Jivs Documentation](http://jivs.peterblum.com/typedoc)

I don't want to repeat the same content in two places. So the document you are reading assumes you're familiar with it's core ideas.

*Jivs is a work-in-progress. This is a preview to get feedback from the community.
I'm looking for an assessment of the architecture. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later.*

*Please visit [Jivs Github Discussions board](https://github.com/plblum/jivs/discussions) to participate.*

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
