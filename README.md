# Jivs - JavaScript Input Validation Service

Back in the day (2002-2013), I created a successful suite of Web
Controls for ASP.NET WebForms which featured a complete replacement to
its built-in input validation. I really learned a lot about what website
developers wanted on-screen. In the 10+ years that followed, I've
learned much more in terms of OOP patterns programming, plus TypeScript
came out and JavaScript introduced Classes. Wonderful stuff that I now
use here, in Jivs.

Jivs itself is just the tooling to evaluate values and return a list of
issues found. That is the essence of validation! Jivs is a "service",
doing that job well, and not trying to provide the actual UI. For that,
you will be able to add companion libraries to match your environment,
such as working in the browser's DOM or React's components. Being a
UI-independent service, you can build your own UI around it, and it can
run both in the browser and NodeJS.

Jivs philosophy involves strong separation of concerns.

-   UI is strongly separated from the validation work

-   Business logic code is where your validation rules generally are
    found, not in the UI input forms.

The result is that the UI knows almost nothing about what needs to be
validated. The UI just posts its current values into Jivs and asks: what
are the result of validation? It gets back a Validation Result, such as
"Valid", "Invalid", or even "Undetermined", and any issues found. An
issue found includes error messages, an id to the field associated with
the validation rule, and its severity.

The UI uses that information to change the visuals: show those errors in
some way and perhaps change the appearance of the input and its
surroundings. Jivs knows nothing about that stuff, although its
supporting libraries are well-informed on those matters.

As a service, you need to know about its API. The primary pieces for
building a UI are:

-   ValueHost classes -- Identifies a single value to be validated
    and/or contributes to the rules of your validation. It has a unique
    identifier that you use to match it to a specific input, such as the
    ID of the HTML input tag (\"TextBox1\"), or even better, a path
    where it is found in a Model (\"Customer/Address/Street\").

    -   ValueHost class -- For values that are not validated, such as a
        field from your Model that isn't editable, or a global value of
        your app, as both can contribute to your validation logic. Take
        a postal code as an example. You might use a regular expression
        to evaluate it. But that expression depends on the country of
        delivery. So you would use a ValueHost to pass in a country
        code, and let the validation internally select the right
        expression.

> Some members of this class are:

GetId

GetLabel

GetValue

SetValue

-   InputValueHost class - Think of these as a UI-independent form of
    your HTML input fields, just knowing the value of those controls.
    They own a list of Input Validators and know how to validate with
    them.

> Some members of this class are (in addition to the inherited from
> ValueHost):

GetInputValue

SetInputValue

Validate

IsValid

-   ValidationManager class -- The front-end of this API. Its where you
    configure the ValueHosts, get access to a ValueHost, validate the
    InputValueHosts it contains, and get the validation results.

Some members of this class are:

GetValueHost

Validate

SetBusinessLogicErrors

GetIssuesForInput

GetIssuesForSummary

-   Condition classes -- A class that evaluates value(s) against a rule
    to see if those values conform. Condition classes exist for each
    business rule pattern, such as required or compare two values are
    not identical. While there are many standard rules for which there
    are Conditions included in this library, you are often going to need
    to build your own.

Some members of these classes are:

Evaluate

ConditionCategory

-   InputValidator class -- Handles a single rule, by assigning it to a
    Condition. So it really doesn't know how to evaluate. Its job is to
    handle the validation process and deliver the error messages to the
    list of issues found.

Some members of this class are:

Validate

This documentation is unfinished. Plenty to write about:

-   How to configure, including how to work with your business logic

-   Each class and its members

-   How to create your own Conditions

-   Maintaining state

-   Supporting custom data types (your own classes that reflect a value,
    like how the JavaScript Date object handles a DateTime value)

-   Relating this to other input validation libraries
