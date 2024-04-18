# Jivs - JavaScript Input Validation Service
*Jivs is a work-in-progress. This is a preview to get feedback from the community.
I'm looking for an assessment of the architecture. I've been tweaking and refactoring
it plenty in hopes it's easy to use and really delivers. Getting the API right early on
avoids the hassle of breaking changes later. --- Peter Blum*

*For the full API, go to [http://jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc)*

Back in the day (2002-2013), I created a successful suite of Web
Controls for ASP.NET WebForms which featured a complete replacement to
its built-in input validation. I really learned a lot about what website
developers wanted on-screen. In the 10+ years that followed, I've
learned much more in terms of OOP patterns programming, plus TypeScript
came out and JavaScript introduced Classes. Wonderful stuff that I now
use here, in **Jivs**.

Jivs is a suite of libraries, built around its core, **Jivs-engine** and is just the tooling to evaluate values and return a list of issues found. 
> That is the essence of validation! 

Even something sounding that simple can involve a lot of features and behaviors.
That's where Jivs starts to differentiate itself.

Jivs-engine is a "service",
doing that job well, and not trying to provide the actual UI. For that,
add or build companion libraries to match your environment,
such as working in the browser's DOM or React's components. Being a
UI-independent service, you can build your own UI around it, and it can
run both in the browser and NodeJS.

As of today, only Jivs-engine is available, and you can extend it as needed. I plan to introduce UI support libraries, and possibly libraries that incorporate third party
libraries of many types, including other schema validation services and internationalization.

> *Peter Blum, .net and web coder since 2002*

## Why Use Jivs?
### Prerequisites:
-	Your app uses JavaScript or TypeScript
-	Your app targets the browser and/or Node.js
-	Your app needs to validate values, whether for user input or Model properties.

### Setting Expectations

- **What Jivs Excels At:** Its forte is value validation. This distinct focus from UI concerns allows for flexible UI development on any framework, such as React, which requires a unique approach to HTML manipulation. We plan to support both standard DOM and React-specific libraries.
- **What Jivs Lacks:** As of this writing, only the core library Jivs-engine is offered. I hope to surround it with UI libraries, and support third party libraries that offer much of the tooling you use.
- **Not Just for Browsers:** Despite seeming browser-centric, server-side validation is critical to prevent tampered data and address server-specific validations. Jivs supports this on Node.js, enabling consistent validation rules across client and server.
- **Code Effort:** While using Jivs involves coding, it’s basically what you would have to write anyway. Some of your coding work with or without Jivs:
	- **Defining validation rules:** Jivs encourages business logic-driven validation, independent of UI. It has a large library of rules already, and makes it easy to add new ones through your code.
	- **Data conversion with a model:** Managing the conversion between model properties and UI representations, like converting a Date object in the model to a string for an \<input> field, is up to you. Jivs doesn't intrude here.
	- **Managing save attempts:** Jivs aids in handling errors, whether from UI or business logic, facilitating the delivery of additional messages and error handling
-  **Coding Style:** Jivs is built using modern OOP patterns. Expect single responsibility objects, dependency injection, and strong separation of concerns.
	- Benefits: 
		- Most aspects of Jivs is expandable due to use of interfaces and dependency injection.
		- Easy to extend the existing business rule objects ("Conditions") to work with special cases, like comparing two Date objects but only by their day of week.
		- UI development is mostly unaware of the validation rules supplied by business logic.
	- Weaknesses:
		- OOP APIs are more demanding on coding. If you want the smallest, tightest code, OOP APIs aren't ideal.
		- It's built using TypeScript and naturally supports your work in TypeScript. If you prefer JavaScript alone, you will not benefit from IDE support when creating objects.

### Features

-	Fields are independently configurable, allowing UI widgets to remain unaware of validation rules and error messages. Jivs notifies UI widgets with validation outcomes.
-	Provides "Condition" objects for a standardized approach to validation, alongside support for custom validation rules, including asynchronous ones. Supplied conditions include: Required, Regular Expression, Range, Compare Two Values, String Length, and Not Null.
-	Most validation rules come from business logic. The "Data Type Check" is different, a rule that comes from the decisions made about UI widgets. For example, a Date can be edited by a textbox or calendar. Jivs automatically applies an appropriate rule for these checks, keeping the UI code free from validation concerns.
-	Jivs enables complex validations by providing the All Match and Any Match Conditions. They provide Boolean logic to a list of other Conditions.
-	Business logic must also validate the Model before saving. Jivs incorporates business logic error messages alongside its own.
-	Error message features:
	- Embed tokens to reusable templates   
	`The {Label} must be between {Minimum} and {Maximum}.`
	- Tokens that can show live data   
	`The current value is {Value}.`
	- Token values are localizable
	- Token values can select a format   
	`The {Label:Uppercase} must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}.`
	- Message text itself is localizable
	- Validators have two error messages. The first message, designed for proximity to the UI widget, is succinct, focusing on the issue without field context. The second, intended for a Validation Summary displayed elsewhere on the screen, includes the field name for clarity.
	- You can setup default error messages, localized of course. This is particularly useful for Data Type Check validations, where distinct data types require specific guidance. For instance, use "Enter a date in the form MM/DD/YYYY" for dates, and "Enter a number using only digits" for numbers.
	- Jivs can provide every error associated with a field, not just the initial one, ensuring thorough feedback and guidance.
- Jivs provides built-in support for common data types—number, string, Boolean, and date—and accommodates unique usage scenarios through extensive customizability.
	- Formatter customization: Tailor how values are displayed to users, with localization. For instance, configure error messages to show dates in an abbreviated format rather than a short date format.
	- Converter customization: Adjust the data under validation to fit various contexts, such as interpreting a JavaScript Date object in multiple ways—anniversary, expiry, total days, date with time, or time alone.
	- Identifier customization: Integrate custom objects to be treated as standard data types, enabling complex comparisons. An object denoting "tomorrow" or "next month" can be identified as a Date for comparison purposes.
	- Comparer customization: Supports Conditions that compare two values so they can handler your non-standard data types. 

# Learning Jivs
[Jivs source code](https://github.com/plblum/jivs) is heavily and meaningfully commented, and it is all available in TypeDoc format at [jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc). Use this section for an orientation.

## Quick terminology overview
Here are a few terms used.
- **Validator** – Combines a single rule that must be validated along with the error message(s) it may return when an issue is found.
- **Input** - Refers to the editor, widget, component where the user edits the data. In HTML, \<input>, \<select>, and \<textarea> tags are examples.
- **ValueHost** – References to a Jivs object that you setup for each Input, and for any other values you want to expose to the validators. Any ValueHosts associated with an Input may have Validators. Other ValueHosts hold data like global values and fields from the Model/Entity/Class/Record that won't be edited.
	> In fact, you can use Jivs and its ValueHost as your form's **Single Source of Truth** as you convert between the Model/Entity and the UI.
- **Form** – A group of Inputs that is gathering data from the user. It often has buttons to submit the work when completed (but first, it should use validation!)
- **Summary** – A UI-specific area that shows error messages found throughout your form.
- **ValidationManager** – The main class you interact with in Jivs. It contains a complete configuration of your form's inputs through ValueHosts. You will use it to send data changes from your Inputs, to invoke validation before submitting the Form, to retrieve a list of issues for a single Input to display, and another list for a Summary to display.
- **Input Value** – The raw data from the Input. Often this is a string representing the actual data, but needs to be cleaned up or converted before it can be stored.
- **Native Value** – The actual data that you will store. Often you have conversion code to move between Native and Input Values. One classic validation error is when your conversion code finds fault in the Input Value and cannot generate the Native Value.
- **Service** – A class provides Jivs with dependency injection or a factory. Jivs has you create a master service object, ValidationServices, and connect individual services to it. 
- **Business Logic** – The code dedicated to describing your Model/Entity. It provides the validation rules for individual fields and to run before saving. It should be separate from the UI, and Jivs is designed for that approach.

## Quick API overview

You will be working with classes and interfaces. Here are the primary pieces to orient you to its API.

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="701px" height="514px" viewBox="-0.5 -0.5 701 514"><defs/><g><path d="M 45.13 63 L 45.1 159 L 45.42 248.63" fill="none" stroke="#cc0000" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 45.43 253.88 L 41.91 246.89 L 45.42 248.63 L 48.91 246.87 Z" fill="#cc0000" stroke="#cc0000" stroke-miterlimit="10" pointer-events="all"/><path d="M 350.5 63 L 350.5 88 L 175 88 L 175 106.63" fill="none" stroke="#660831" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 175 111.88 L 171.5 104.88 L 175 106.63 L 178.5 104.88 Z" fill="#660831" stroke="#660831" stroke-miterlimit="10" pointer-events="all"/><path d="M 350.5 63 L 350.5 88 L 407.5 88 L 407.5 106.63" fill="none" stroke="#660831" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 407.5 111.88 L 404 104.88 L 407.5 106.63 L 411 104.88 Z" fill="#660831" stroke="#660831" stroke-miterlimit="10" pointer-events="all"/><path d="M 350.5 63 L 350.5 88 L 517.5 88 L 517.5 106.63" fill="none" stroke="#660831" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 517.5 111.88 L 514 104.88 L 517.5 106.63 L 521 104.88 Z" fill="#660831" stroke="#660831" stroke-miterlimit="10" pointer-events="all"/><path d="M 350.5 63 L 350.5 88 L 638.5 88 L 638.5 106.63" fill="none" stroke="#660831" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 638.5 111.88 L 635 104.88 L 638.5 106.63 L 642 104.88 Z" fill="#660831" stroke="#660831" stroke-miterlimit="10" pointer-events="all"/><rect x="270" y="0" width="161" height="63" rx="9.45" ry="9.45" fill="#e1d5e7" stroke="#9673a6" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 159px; height: 1px; padding-top: 32px; margin-left: 271px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><b><font color="#5e4e4e">ValidationManager</font></b><br /><font face="Lucida Console">validate()<br />getIssuesFound()<br /></font></div></div></div></foreignObject><text x="351" y="35" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">ValidationManager...</text></switch></g><path d="M 159.88 32 L 215 32 L 263.63 31.56" fill="none" stroke="#cc0000" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 268.88 31.51 L 261.91 35.07 L 263.63 31.56 L 261.85 28.07 Z" fill="#cc0000" stroke="#cc0000" stroke-miterlimit="10" pointer-events="all"/><path d="M 83.38 63 L 83.4 178 L 123.63 178" fill="none" stroke="#cc0000" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 128.88 178 L 121.88 181.5 L 123.63 178 L 121.88 174.5 Z" fill="#cc0000" stroke="#cc0000" stroke-miterlimit="10" pointer-events="all"/><rect x="6.88" y="1" width="153" height="62" rx="9.3" ry="9.3" fill="#f8cecc" stroke="#b85450" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 151px; height: 1px; padding-top: 32px; margin-left: 8px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><b style="color: rgb(94, 78, 78);">ValidationServices</b><br />factories<br />services</div></div></div></foreignObject><text x="83" y="36" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">ValidationServices...</text></switch></g><rect x="473" y="143" width="89" height="70" rx="10.5" ry="10.5" fill="#cdeb8b" stroke="#006600" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 87px; height: 1px; padding-top: 178px; margin-left: 474px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">"<font color="#cc00cc">DiffInDays</font>"<br /><font face="Lucida Console">getValue()<br /></font>calcFn()<font face="Lucida Console"><br /></font></div></div></div></foreignObject><text x="518" y="182" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">"DiffInDays"...</text></switch></g><rect x="364" y="143" width="88" height="70" rx="10.5" ry="10.5" fill="#cdeb8b" stroke="#006600" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 86px; height: 1px; padding-top: 178px; margin-left: 365px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">"<font color="#cc00cc">EndDate</font>"<br /><font face="Lucida Console">validate()<br />getValue()<br />setValue()<br /></font></div></div></div></foreignObject><text x="408" y="182" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">"EndDate"...</text></switch></g><path d="M 0 136 L 0 113 L 350 113 L 350 136" fill-opacity="0.7" fill="rgb(255, 255, 255)" stroke="#97d077" stroke-opacity="0.7" stroke-miterlimit="10" pointer-events="all"/><path d="M 0 136 L 0 513 L 350 513 L 350 136" fill="none" stroke="#97d077" stroke-opacity="0.7" stroke-miterlimit="10" pointer-events="none"/><path d="M 0 136 L 350 136" fill="none" stroke="#97d077" stroke-opacity="0.7" stroke-miterlimit="10" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 348px; height: 1px; padding-top: 125px; margin-left: 1px;"><div data-drawio-colors="color: #006600; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 102, 0); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;"><font color="#5e4e4e">InputValueHost with 2 validators</font></div></div></div></foreignObject><text x="175" y="128" fill="#006600" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">InputValueHost with 2 validators</text></switch></g><path d="M 177 213 L 177 234 L 83.4 234 L 83.38 248.63" fill="none" stroke="#00994d" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 83.38 253.88 L 79.88 246.88 L 83.38 248.63 L 86.88 246.89 Z" fill="#00994d" stroke="#00994d" stroke-miterlimit="10" pointer-events="all"/><path d="M 177 213 L 177 234 L 254.1 234 L 254.12 248.64" fill="none" stroke="#00994d" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 254.13 253.89 L 250.62 246.89 L 254.12 248.64 L 257.62 246.88 Z" fill="#00994d" stroke="#00994d" stroke-miterlimit="10" pointer-events="all"/><rect x="130" y="143" width="94" height="70" rx="10.5" ry="10.5" fill="#cdeb8b" stroke="#006600" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 92px; height: 1px; padding-top: 178px; margin-left: 131px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">"<font color="#cc00cc">StartDate</font>"<br /><font face="Lucida Console">validate()<br />getValue()<br />setValue()<br /></font></div></div></div></foreignObject><text x="177" y="182" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">"StartDate"...</text></switch></g><path d="M 154.01 293.38 L 131.01 293.38 L 131.01 462.88 L 154.01 462.88" fill="rgb(255, 255, 255)" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,254.13,378.13)" pointer-events="all"/><path d="M 154.01 293.38 L 377.26 293.38 L 377.26 462.88 L 154.01 462.88" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,254.13,378.13)" pointer-events="none"/><path d="M 154.01 293.38 L 154.01 462.88" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,254.13,378.13)" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 168px; height: 1px; padding-top: 267px; margin-left: 170px;"><div data-drawio-colors="color: #5E4E4E; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(94, 78, 78); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;">InputValidator</div></div></div></foreignObject><text x="254" y="270" fill="#5E4E4E" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">InputValidator</text></switch></g><path d="M 355 136 L 355 113 L 460 113 L 460 136" fill="rgb(255, 255, 255)" stroke="#97d077" stroke-miterlimit="10" pointer-events="all"/><path d="M 355 136 L 355 233 L 460 233 L 460 136" fill="none" stroke="#97d077" stroke-miterlimit="10" pointer-events="none"/><path d="M 355 136 L 460 136" fill="none" stroke="#97d077" stroke-miterlimit="10" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 103px; height: 1px; padding-top: 125px; margin-left: 356px;"><div data-drawio-colors="color: #5E4E4E; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(94, 78, 78); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;"><font>InputValueHost</font></div></div></div></foreignObject><text x="408" y="128" fill="#5E4E4E" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">InputValueHost</text></switch></g><path d="M 465 136 L 465 113 L 570 113 L 570 136" fill="rgb(255, 255, 255)" stroke="#97d077" stroke-miterlimit="10" pointer-events="all"/><path d="M 465 136 L 465 233 L 570 233 L 570 136" fill="none" stroke="#97d077" stroke-miterlimit="10" pointer-events="none"/><path d="M 465 136 L 570 136" fill="none" stroke="#97d077" stroke-miterlimit="10" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 103px; height: 1px; padding-top: 125px; margin-left: 466px;"><div data-drawio-colors="color: #5E4E4E; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(94, 78, 78); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;">CalcValueHost</div></div></div></foreignObject><text x="518" y="128" fill="#5E4E4E" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">CalcValueHost</text></switch></g><path d="M 577 136 L 577 113 L 700 113 L 700 136" fill="rgb(255, 255, 255)" stroke="#97d077" stroke-miterlimit="10" pointer-events="all"/><path d="M 577 136 L 577 233 L 700 233 L 700 136" fill="none" stroke="#97d077" stroke-miterlimit="10" pointer-events="none"/><path d="M 577 136 L 700 136" fill="none" stroke="#97d077" stroke-miterlimit="10" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 121px; height: 1px; padding-top: 125px; margin-left: 578px;"><div data-drawio-colors="color: #5E4E4E; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(94, 78, 78); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;">NonInputValueHost</div></div></div></foreignObject><text x="639" y="128" fill="#5E4E4E" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">NonInputValueHost</text></switch></g><rect x="593" y="143" width="94" height="70" rx="10.5" ry="10.5" fill="#cdeb8b" stroke="#006600" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 92px; height: 1px; padding-top: 178px; margin-left: 594px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">"<font color="#cc00cc">TimeZone</font>"<br /><font face="Lucida Console">getValue()<br style="border-color: var(--border-color);" /></font><span style="font-family: &quot;Lucida Console&quot;;">setValue()</span></div></div></div></foreignObject><text x="640" y="182" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">"TimeZone"...</text></switch></g><path d="M -16.75 302.25 L -39.75 302.25 L -39.75 454 L -16.75 454" fill="rgb(255, 255, 255)" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,83.38,378.13)" pointer-events="all"/><path d="M -16.75 302.25 L 206.5 302.25 L 206.5 454 L -16.75 454" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,83.38,378.13)" pointer-events="none"/><path d="M -16.75 302.25 L -16.75 454" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,83.38,378.13)" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 150px; height: 1px; padding-top: 267px; margin-left: 9px;"><div data-drawio-colors="color: #5E4E4E; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(94, 78, 78); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;">InputValidator</div></div></div></foreignObject><text x="83" y="270" fill="#5E4E4E" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">InputValidator</text></switch></g><rect x="192.38" y="285.5" width="123.5" height="70" rx="10.5" ry="10.5" fill="#dae8fc" stroke="#6c8ebf" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 122px; height: 1px; padding-top: 321px; margin-left: 193px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font face="Lucida Console">validate()</font><br />error messages<br />severity</div></div></div></foreignObject><text x="254" y="324" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">validate()...</text></switch></g><path d="M 226.31 357.52 L 203.31 357.52 L 203.31 512.13 L 226.31 512.13" fill="rgb(255, 255, 255)" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,254.13,434.83)" pointer-events="all"/><path d="M 226.31 357.52 L 304.96 357.52 L 304.96 512.13 L 226.31 512.13" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,254.13,434.83)" pointer-events="none"/><path d="M 226.31 357.52 L 226.31 512.13" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,254.13,434.83)" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 153px; height: 1px; padding-top: 396px; margin-left: 178px;"><div data-drawio-colors="color: #5E4E4E; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(94, 78, 78); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;">LessThanOrEqualCondition</div></div></div></foreignObject><text x="254" y="399" fill="#5E4E4E" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">LessThanOrEqualCondition</text></switch></g><path d="M 254.13 355.5 L 254.13 377.63" fill="none" stroke="#007a7a" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 254.13 382.88 L 250.63 375.88 L 254.13 377.63 L 257.63 375.88 Z" fill="#007a7a" stroke="#007a7a" stroke-miterlimit="10" pointer-events="all"/><rect x="185.63" y="415.88" width="137" height="62.5" rx="9.38" ry="9.38" fill="#fad7ac" stroke="#b46504" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 135px; height: 1px; padding-top: 447px; margin-left: 187px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">DiffDate &lt;= 10<br /><font face="Lucida Console">evaluate()</font></div></div></div></foreignObject><text x="254" y="451" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">DiffDate &lt;= 10...</text></switch></g><rect x="21.63" y="285.5" width="123.5" height="70" rx="10.5" ry="10.5" fill="#dae8fc" stroke="#6c8ebf" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 122px; height: 1px; padding-top: 321px; margin-left: 23px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Verdana; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font face="Lucida Console">validate()</font><br />error messages<br />severity</div></div></div></foreignObject><text x="83" y="324" fill="rgb(0, 0, 0)" font-family="Verdana" font-size="12px" text-anchor="middle">validate()...</text></switch></g><path d="M 55.55 367.05 L 32.55 367.05 L 32.55 502.61 L 55.55 502.61" fill="rgb(255, 255, 255)" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,83.38,434.83)" pointer-events="all"/><path d="M 55.55 367.05 L 134.2 367.05 L 134.2 502.61 L 55.55 502.61" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,83.38,434.83)" pointer-events="none"/><path d="M 55.55 367.05 L 55.55 502.61" fill="none" stroke="#ccccff" stroke-miterlimit="10" transform="rotate(90,83.38,434.83)" pointer-events="none"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 134px; height: 1px; padding-top: 396px; margin-left: 17px;"><div data-drawio-colors="color: #5E4E4E; " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(94, 78, 78); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;">LessThanCondition</div></div></div></foreignObject><text x="83" y="399" fill="#5E4E4E" font-family="Helvetica" font-size="12px" text-anchor="middle" font-weight="bold">LessThanCondition</text></switch></g><path d="M 83.38 355.5 L 83.47 378.63" fill="none" stroke="#007a7a" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 83.5 383.88 L 79.97 376.9 L 83.47 378.63 L 86.97 376.87 Z" fill="#007a7a" stroke="#007a7a" stroke-miterlimit="10" pointer-events="all"/><rect x="22.88" y="415.88" width="121" height="62.5" rx="9.38" ry="9.38" fill="#fad7ac" stroke="#b46504" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 119px; height: 1px; padding-top: 447px; margin-left: 24px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">StartDate &lt; EndDate<br /><font face="Lucida Console">evaluate()</font></div></div></div></foreignObject><text x="83" y="451" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">StartDate &lt; EndDate...</text></switch></g></g></svg>

-   <a href="#valuehosts">`ValueHost classes`</a> – Identifies a single value to be validated
    and/or contributes data used by the validators. You get and set its value both from a Model and the Inputs (your editor widgets) in the UI.

	+ `InputValueHost class` – For your Inputs, a ValueHost with the power of validation. 
	+ `NonInputValueHost class` – For values that are not validated but contribute to validation. 
	
	>For example, a postal codes might be validated against a regular expression. But that expression depends on the country of delivery. So you would use a `NonInputValueHost` to pass in a country
	code your app is using, and let the validation internally select the right
	expression by retrieving the country code first.
	
	> If you are using a Model, you might also use NonInputValueHost for all remaining 	properties on that model. In this scenario, Jivs becomes a *Single Source of Truth* for the model's data while in the UI.
		
	+ `CalcValueHost class` – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days.

-   <a href="#validationmanager">`ValidationManager class`</a> – The "face" of this API. Your validation-related UI elements will need access to it to do their work. It's where you
    configure the `ValueHosts`, get access to a `ValueHost`, validate, and get the validation results.

-   <a href="#conditions">`Condition classes`</a> – Classes that evaluate value(s) against a rule
    to see if those values conform. `Condition classes` exist for each
    business rule pattern, such as *required* or *compare two values are
    not identical*. While there are many standard rules for which there
    are `Conditions` included in this library, you are often going to need
    to build your own.

-   <a href="#inputvalidators">`InputValidator class`</a> – Handle the validation process of a single rule and deliver a list of issues found to the ValidationManager, where your UI elements can consume it.

- <a href="#validationservices">`ValidationServices class` </a> – Provides dependency injection and configuration through a variety of services and factories. This is where much of customization occurs. Here are several interfaces supported by ValidationServices which empower Jivs.
	- `IDataTypeFormatter` – Provides localized strings for the tokens within error messages. For example, if validating a date against a range, your error message may look like this: "The value must be between {Minimum} and {Maximum}." With a Date-oriented DataTypeFormatter (supplied), those tokens will appear as localized date strings.
	- `IDataTypeConverter` – For these use cases:
		+ Changing an object value into something as simple as a string or number for Conditions that compare values. The JavaScript Date object is a good example, as you should use its getTime() function for comparisons.
		+ Changing a value to something else. Take the Date object again. Instead of working with its complete date and time, you may be interested only in the date, the time, or even parts like Month or Hours.
	- There are also `IDataTypeCheckGenerator`, `IDataTypeComparer`, and `IDataTypeIdentifier` to cover some special cases.
	- `ConditionFactory` – Creates the Condition objects used by business rules.
	


<a name="conditions"></a>
## Conditions - the validation rules
You need to build a class that adapts your validation rules to Jivs own types and classes. Jivs uses the classes that implement the `ICondition interface` to package up a validation rule, and `ConditionConfig type` to inform the `Condition` class how to configure itself. The class is a bridge between business logic and your UI. This section provides the details.

### Separation of concerns: Input Validation vs Business Logic validation

<details>
<summary>This topic should orient the developer on keeping validation logic separate from the UI.</summary>
Jivs wants the app to keep its validation rules in Business Logic separate from UI code. Business logic should have no knowledge of the UI. It operates based on an object called Model or Entity. As you know, properties of objects are completely disconnected from the UI input elements.

> Input Validation’s role is to ensure that the values you move into a Model conform to the business logic, without using existing business logic code that depends on the Model.

Business logic validation code still gets used, but only upon attempting to save into the Model. The user clicks a Save button. The button first checks if there are any remaining input validation errors. If none, you have code that populates a model from the Inputs. That’s when business logic does its own validation. It will save if no issues remain. It will report back issues if any are found. You’ll pass them along to `ValidationManager` to impact the user interface, like showing them in a ValidationSummary widget.

About all the UI developer should know is:
- The identity of the Model’s field, so it can move values between Model and UI.
- The data type of the field. Specifically the property’s data type, like a number, date, Boolean, or complex object. The developer uses that to determine the widget that will edit the value. They also use that to write the code that converts the value between the Model property’s data type and the widget’s data type.
- It is possible that there are validation rules. What they are doesn’t matter. The UI developer can build a widget that shows up when issues are found.
	- There is one case where the UI developer might introduce a validation rule: reporting an issue when their code to convert from widget to Model property fails. Even that is often resolved behinds the scenes in Jivs.
- Provide a common area on screen for consolidation of errors, including those reported by Business Logic. This is referred to as the ValidationSummary.

Someone will code all of those validation rules in a way that Jivs can apply them. Whether it’s done by the UI developer or not, this new code will be separate from the UI code. (And unit tested.) This will likely be the most code you need to write to work with Jivs (or any validation system).
</details>

### Configuring a validation rule in Jivs

You build validation rules using the `Condition` concept. A `Condition` simply packages a function to evaluate data together with a few other properties. Here is its interface:
```ts
interface ICondition {
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
    conditionType: string;
}
```
The `evaluate function` entirely handles the validation rule, and returns a result of `Match`, `NoMatch`, or `Undetermined`.
<details>
<summary>Expand for details on the results.</summary>

- `Match` – Data conformed to the rule
- `NoMatch` – Data violated the rule
- `Undetermined` – Data wasn’t appropriate for evaluation. Example: an empty textbox’s value isn’t ready for a “Compare the input’s date value to Today”. There needs to be text representing a date first.
</details>

Jivs provides numerous `Condition classes`. 
<details>
<summary>Expand to see just a few.</summary>

- `RequireTextCondition`, `NotNullCondition` – for required fields
- `DataTypeCheckCondition`, `RegExpCondition` – for checking the data conforms to the data type.
- `RangeCondition`, `EqualToCondition`, `GreaterThanCondition` – Comparing values
- `AllMatchCondition`, `AnyMatchCondition` - For creating complex logic by using multiple `Conditions`.
</details>

To use them, you need to populate their `ConditionConfig`, which has configuration properties specific to its class. 
> Like all Configs in Jivs, they only have properties, many of which are optional. They are not a classes either. You just create a plain old JavaScript object strongly typed with its interface.

We'll work with this example: Compare a date from the Input to today's date.

The `EqualToCondition` is the right Condition for the job.  You need to create a `EqualToConditionConfig` that Jivs will use later to prepare the `EqualToCondition`. Here's its `ConditionConfig`:
```ts
interface EqualToConditionConfig {
    type: string;
    valueHostName: null | string;
    secondValueHostName: null | string;
    secondValue?: any;
    conversionLookupKey?: null | string;
    secondConversionLookupKey?: null | string;
    category?: ConditionCategory;
}
```
>Where's the error message? A `Condition` is just part of a Validator. The `InputValidator class` connects your Condition to its error message.

Your new code should look like this, where `ValueHostName` is your identifier for a field on the Model that you call “SignedOnDate”. (More on <a href="#naming">`ValueHost Names`</a> later.)
```ts
{
    type: 'EqualTo';
    valueHostName: 'SignedOnDate';
    secondValue: ...date object representing Today...;
}
```
> A fluent syntax is also part of Jivs. It simplifies manual entry of building conditions and several other objects that will be [shown later](#Fluent-syntax). We'll look at it once you have the full picture using these Config objects.

<a name="bridge"></a>
## Bridging business logic and UI validation

We recommend that you create a Factory-style class that takes your business logic validation information in and returns the appropriate `ConditionConfig` already configured. Let’s suppose that your business logic has a class called BusinessLogicComparer that looks like this:
```ts
class BusinessLogicComparer {
    operator: ConditionOperators; // equals, notequals, etc
    compareTo?: ((date object representing Today));
}
```
Here’s a framework for your new Factory.
```ts
class Factory
{
  create(fieldRef: string, businessLogicRule: any): ConditionConfig
  {
    if (businessLogicRule instanceof BusinessLogicComparer)
      switch (businessLogicRule.operator)
      {
        case ConditionOperators.Equals:
          return <EqualTosConditionConfig>{
            type: 'EqualTo',
            valueHostName: fieldRef,
            secondValue: businessLogicRule.secondValue
          }
      }
  }
}
```
<a name="valuehosts"></a>
## ValueHosts
Every value that you expose to Jivs is kept in a ValueHost. There are several types:

- InputValueHost – The value may have validation rules applied. It actually keeps two values around when working with a UI: the value fully compatible with the model's property, and the value from within the editor.
- NonInputValueHost – The value may be used in validation or is a member of the Model that is retained when Jivs is the single-source of truth.
- CalcValueHost – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days. You supply it a function that returns a value, which can be based on other ValueHosts. 

These objects are added to the ValidationManager while configuring. Here is pseudocode representation of their interfaces (omitting many members).
```ts
interface IValueHost {
    getName(): string;
    getDataType(): null | string;
    getLabel(): string;
    setLabel(label, labell10n?): void;
    getValue(): any;
    setValue(value, options?): void; // value compatible with model's property
    setValueToUndefined(options?): void;
    
    isChanged: boolean;
    saveIntoState(key, value): void;
    getFromState(key): undefined | ValidTypesForStateStorage;
}
interface IInputValueHost extends IValueHost
{
    getInputValue(): any;
    setInputValue(value, options?): void;	// value from the UI's editor
    setValues(nativeValue, inputValue, options?): void;	// both values
    
    validate(options): ValidateResult;
    isValid: boolean;
    getIssueFound(conditionType): IssueFound | null;
    getIssuesFound(group?): IssueFound[];	
}
interface INonInputValueHost extends IValueHost
{
}
interface ICalcValueHost extends IValueHost
{
  convert(source, validationManager): number | Date | string | null | undefined;
}
```
<a name="naming"></a>
### Naming each ValueHost
Each ValueHost must have a unique name. Give names to every UI widget that correlates them to the fields of the Model.

In this example, our Model’s property names are used in the input tag’s name attribute.

| Model fields | HTML tag
| ----  | ----
| FirstName | `<input type="text" name="FirstName" />`
| LastName | `<input type="text" name="LastName" />`

Jivs wants those same names for basically the same purpose of correlating with fields in the Model.
<a name="configuringvaluehosts"></a>
#### Configuring
When we configure the above Model for Jivs, you can imagine something like this object:
```ts
[
  {
	name: 'FirstName',
	validators: [ condition configs ]
  },
  {
	name: 'LastName',
	validators: [ condition configs ]
  }
]
```
In fact, that’s about right, only with more properties. Those objects use the `InputValueHostConfig type`. 

> Like all Configs in Jivs, ValueHostConfig only has properties, many of which are optional. It is not a class either. You just create a plain old JavaScript object strongly typed with this interface.
```ts
interface ValueHostConfig
{
  type?: string;
  name: string;
  dataType?: string;
  label?: string;
  labell10n?: string | null;
  initialValue?: any;
}
interface InputValueHostConfig extends ValueHostConfig 
{
  type: 'Input',	// shown here for documentation purposes
  validatorConfigs: InputValidatorConfig[] | null;
  group?: string | Array<string> | null;
}
interface NonInputValueHostConfig extends ValueHostConfig 
{
  type: 'NonInput' // shown here for documentation purposes
}
interface CalcValueHostConfig extends ValueHostConfig 
{
  type: 'Calc', // shown here for documentation purposes
  calcFn: CalculationHandler // a function definition
}
```
Here’s how your configuration actually looks:
```ts
[
  {
    type: 'Input',
    name: 'FirstName',
    dataType: 'String',
    label: 'First name', // localized, of course!
    validatorConfigs: [ InputValidatorConfigs ]
  },
  {
    type: 'Input',
    name: 'LastName',
    dataType: 'String',
    label: 'Last name',
    validatorConfigs: [ InputValidatorConfigs ]
  }
]
```
> Use Jivs' <a href="#fluentsyntax">fluent syntax</a> to avoid typing in these configs.

The `ValueHost` names are also used to help a `Condition` retrieve a value from a `ValueHost`. Suppose that we use the `NotEqualToCondition` on FirstName to compare to LastName. You have to supply the `ValueHost Name` for the LastName field to the condition.
```ts
{
  name: 'FirstName',
  ...
  validatorConfigs: [
    {
      conditionConfig: 
      {
        type: 'NotEqualTo',
        valueHostName: null, // because owning ValueHost is provided automatically to the Condition.evaluate function.
        secondValueHostName: 'LastName'
      }      
      ... and properties covered later ...
    }

  ]
}
```
<a name="calcvaluehost"></a>
### Using CalcValueHost
See a practical example here: [https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/DifferenceBetweenDates.ts)

<a name="inputvalidators"></a>
## InputValidators: Connecting Conditions to Error Messages

Validation is really just a process that evaluates some rule and returns a result. If there was an error, the result involves an error message. 

The `InputValidator class` handles this work. Once again, we use a Config to configure it. 
> Like all Configs in Jivs, InputValidatorConfig only has properties, many of which are optional. It is not a class either. You just create a plain old JavaScript object strongly typed with this interface.
```ts
interface InputValidatorConfig {
    conditionConfig: null | ConditionConfig;
    conditionCreator?: ((requester) => null | ICondition);
    errorMessage: string | ((host) => string);
    summaryMessage?: null | string | ((host) => string);
    severity?: ValidationSeverity | ((host) => ValidationSeverity);
    enabled?: boolean | ((host) => boolean);
    enablerConfig?: null | ConditionConfig;
    enablerCreator?: ((requester) => null | ICondition);
}
```
> Use Jivs' <a href="#fluentsyntax">fluent syntax</a> to avoid typing in these configs.

Because this is so full of goodness, let’s go through each property.

-	`conditionConfig` – Already described above. It is not the only way to setup a Condition…
-	<a href="#customconditions">`conditionCreator`</a> – Alternative to creating a Condition by returning an implementation of ICondition. This choice gives you a lot of flexibility, especially when you have some complex logic that you feel you can code up in an evaluate method easier than using a bunch of Conditions.
-	`errorMessage` – A template for the message reporting an issue. Its intended location is nearby the Input, such that you can omit including the field’s label. “This field requires a value”. As a template, it provides tokens which can be replaced by live data. (Discussed later).
-	`summaryMessage` – Same idea as errorMessage except to be shown in a Validation Summary. It's normal to include the field label in this message, using the {Label} token: “{Label} requires a value”.
-	`severity` – Controls some validation behaviors with these three values.
	-	`Error` – Error but continue evaluating the remaining validation rules. The default when `severity` is omitted.
	-	`Severe` – Error and do not evaluate any more validation rules for this ValueHost.
	-	`Warning` – Want to give the user some direction, but not prevent saving the data.
-	`enabled` – A way to quickly disable the InputValidator.
-	`enablerConfig` and `enablerCreator` – The *Enabler* uses a `Condition` to determine if the `InputValidator` is enabled. Often validation rules depend on other information for that. For example, you have a checkbox associated with a text box. Any validation rule on the text box isn’t used unless the checkbox is marked. You would assign a `Condition` to evaluate the value of the checkbox to the Enabler.

Now let’s place an `InputValidatorConfig` into our previous example using a Model with FirstName and LastName.
```ts
[{
  type: 'Input',
  name: 'FirstName',
  dataType: 'String',
  label: 'First name',
  validatorConfigs: [{
    conditionConfig: {
      type: 'RequireText',
      valueHostName: null
    },
    errorMessage: 'This field requires a value',
    summaryMessage: '{Label} requires a value.',
  },
  {
    conditionConfig: {
      type: 'NotEqualTo',
      valueHostName: null,
      secondValueHostName: 'LastName'
    },
    errorMessage: 'Are you sure that your first and last names are the same?',
    summaryMessage: 'In {Label}, are you sure that your first and last names are the same?',
    severity: 'Warning'
  }]
},
{
  type: 'Input',
  name: 'LastName',
  dataType: 'String',
  label: 'Last name',
  validatorConfigs: [{
    conditionConfig: {
      type: 'RequireText',
      valueHostName: null
    },
    errorMessage: 'This field requires a value',
    summaryMessage: '{Label} requires a value.',
  }]
}]
```
<a name="validationmanager"></a>
## ValidationManager

With Jivs, the UI uses the `ValidationManager class` to manage the `ValueHosts`, run validation, and get any issues found. All of your UI widgets should have access to the `ValidationManager`, so they can take actions resulting from validation.

`ValidationManager` needs to be configured first. Much of that work was described in the previous sections that built `ValueHostConfigs`, `InputValidatorConfigs`, and `ConditionConfigs`. The configuration is contained in the `ValidationManagerConfig type`.

Here’s pseudocode for creating the `ValidationManager`.
```ts
let valueHostConfigs = ... copied from previous example ...
let config = <IValidationManagerConfig>{
  services: createValidationServices(),	// alert! Feature needs configuration
  valueHostConfigs: ValueHostConfigs
}
let validationManager = new ValidationManager(config);
// TODO: expose this validationManager to your widgets that need validation
```
Here’s `IValidationManagerConfig type`:
```ts
interface ValidationManagerConfig {
    services: IValidationServices;
    valueHostConfigs: ValueHostConfig[];
    savedState?: null | ValidationManagerState;
    savedValueHostStates?: null | ValueHostState[];
    onInputValueChanged?: null | InputValueChangedHandler;
    onStateChanged?: null | ValidationManagerStateChangedHandler;
    onValidated?: null | ValidationManagerValidatedHandler;
    onValueChanged?: null | ValueChangedHandler;
    onValueHostStateChanged?: null | ValueHostStateChangedHandler;
    onValueHostValidated?: null | ValueHostValidatedHandler;
}
```
Let’s go through this type.

-	`services` – Always takes a <a href="#validationservices">`ValidationServices object`</a>, which is rich with services for dependency injection and factories. You will need to do a bunch to configure this, but don’t worry, we have a code snippet to inject into your app to assist. (Described below.)
-	<a href="#configuringvaluehosts">`valueHostConfigs`</a> – Configures each InputValueHost associated with your Inputs and NonInputValueHost associated with additional values needed by validator rules.
-	`savedState` and `savedValueHostStates` – `ValidationManager` knows how to offload its stateful data to the application. If you want to retain state, you’ll capture the latest states using the `onStateChanged` and `onValueHostStateChanged` events, and pass the values back into these two Config properties when you recreate it.
-	`onStateChanged` and `onValueHostStateChanged` must be setup if you maintain the states. They supply a copy of the states for you to save.
-	`onValueChanged` notifies you when a `ValueHost` had its value changed.
-	`onInputValueChanged` notifies you when an `InputValueHost` had its Input Value changed.
-	`onValidated` and `onValueHostValidated` notifies you after a `validate function` completes, providing the results.
<a name="validationservices"></a>
## ValidationServices
The `ValidationServices class` supports the operations of Validation with services and factories, which of course means you can heavily customize Jivs through the power of interfaces and dependency injection.

`ValidationServices` is where we register new `Conditions` and classes to help work with all of the data types you might have in your Model. None of those classes are prepopulated (so that you are not stuck with classes that you won't use). So let’s get them setup.

Go to [https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts](https://github.com/plblum/jivs/blob/main/starter_code/create_services.ts)

Add the contents of this file to your project. You will likely need to regenerate the list of inputs as your project source may be NPM. It results in several new functions starting with this one.
```ts
export function createValidationServices(): ValidationServices {
…
}
// also many register() functions plus configureCultures() and createTextLocalizationService
```
Once it compiles, you can edit as needed, although initially leave most of the classes it registers alone, so you can start using the system.

Now that you have the `createValidationServices function`, use it during `ValidationManager` configuration.
```ts
let valueHostConfigs = ... array that configures ValueHosts ...
let config = <IValidationManagerConfig>{
  services: createValidationServices(),	// use it here
  valueHostConfigs: ValueHostConfigs
}
let validationManager = new ValidationManager(config);
```
<a name="fluentsyntax"></a>
## Fluent syntax
If you are typing in those Config objects, you are probably not happy. Config objects are meant for code that converts your business logic objects into them.

Jivs comes with a fluent syntax to simplify the manual configuration work.
Here's how the example with FirstName and LastName properties looks with this syntax.
```ts
let firstNameConfig = config().input('FirstName', 'String', { label: 'First Name' })
   .requireText(null, 'This field requires a value', { summaryMessage: '{Label} requires a value.')
   .notEqualTo('LastName', 'Are you sure...', { summaryMessage: 'In {Label}, are you sure...');
let lastNameConfig = config.input('LastName', 'String', { label: 'Last Name'})
   .requireText(null, 'This field requires a value', { summaryMessage: '{Label} requires a value.' );
   //NOTE: Error messages can be omitted if you set them up in the TextLocalizationService
   // or let the UI developer attach them later.
   
let config = <IValidationManagerConfig>{
  services: createValidationServices(),
  valueHostConfigs: [firstNameConfig, lastNameConfig]
}
let validationManager = new ValidationManager(config);   
```
You can also use the config() object to add NonInputValueHosts and a list of Conditions to these Conditions: All, Any, CountMatches.

```ts
let visibleConfig = config().nonInput('PersonVisible', 'Boolean');
let activeConfig = config().nonInput('PersonActive', 'Boolean');
let personName = config().input('Name').any(
     config().conditions()
     	.equalTo(true, { valueHostName: 'PersonVisible'})
        .equalTo(true, { valueHostName: 'PersonActive'}));
```
<a name="createconditions"></a>
## Creating your own Conditions
Jivs provides many `Condition classes`, covering typical cases. All classes implement the `ICondition interface`.
```ts
interface ICondition {
    evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
    category: ConditionCategory;
    conditionType: string;
}
```
As you can see, all require that you supply a **conditionType** value. That’s a unique name for you to specify.

There are several ways to add your conditions.
### Reusable classes
All Condition classes supplied within jivs-engine are registered with the ConditionFactory, which uses the ConditionConfig (describes rules specific to the condition) to know which class to create.

Once created, go to the `registerConditions() function` that is [part of the startup code](#validationservices) and add it like this:
```ts
export function registerConditions(cf: ConditionFactory): void
{
   ... existing conditions...
	cf.register<myConditionConfig>(
   		'MyConditionType', (config) => new MyCondition(config));
}

```
Here are two ways to start:
- Subclass from an existing `Condition class`. Choose when you want to make a minor modification or want to preconfigure [the existing class](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/Conditions/ConcreteConditions.ts).
	```ts
	export class MyCondition extends RegExpCondition 
	{
	   constructor(config: IRegExpConditionConfig)
	   {
	      super({ 
	         ...config, 
	         ...{ expressionAsString: '^\\d\\d\\d\\-\\d\\d\\d\\d$'} 
	      });
	   }
	   public get conditionType(): string { return 'MyConditionType'; }
	}
	```
- Subclass from an [abstract `Condition class`](https://github.com/plblum/jivs/tree/main/packages/jivs-engine/src/Conditions) designed for the type of `Condition` you need. The abstract classes provide some useful methods to take advantage of. They also require a `ConditionConfig interface`, which means you can get additional values from the user passed in.
	```ts
	export interface MyConditionConfig extends RegExConditionBaseConfig
	{
	   allowTwo?: boolean; // true means pattern is repeated with a comma separator
	}
	
	export class MyCondition extends RegExpConditionBase<MyConditionConfig>
	{
	   protected getRegExp(valueHostResolver: IValueHostResolver): RegExp
	   {
	      let base = @'\d\d\d\-\d\d\d\d';
	      if (this.config.allowTwo)
	         return new RegExp('^' + base + '(\,\s?' + base + ')?$');
	      return new RegExp('^' + base + '$');
	   }
	   public get conditionType(): string { return 'MyConditionType'; }
	}
	```
<a name="customconditions"></a>
### One-off conditions
Choose one of the methodologies below. When establishing the InputValueHost with your condition, it goes here:
```ts
{
  type: 'Input',
  name: ...,
  validatorConfigs: [{
    conditionCreator: (requester) => ...create your object here...
    errorMessage: ...,
  }]
}
```
The [fluent syntax](#fluentsyntax) for this is:
```ts
let fieldNameConfig = config().input('fieldname')
	.customRule(
		(requester)=> ...create your object here..., 
		'optional error message', 
		{ ...optional additional parameters });
```
- Create a plain JavaScript object that matches the `ICondition interface` contract. This is often used for one-off logic.
	```ts
	let myCondition = <ICondition>{
	   evaluate: (valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> =>
	   {
	   // evaluate the value(s) and return a ConditionEvaluateResult
	   },
	   category: 'Content';
	   conditionType: 'MyConditionType';
	}
	```
- Implement directly from `ICondition` as a class
	```ts
	export class MyCondition implements ICondition 
	{
	   public evaluate(valueHost, valueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>
	   {
	   // evaluate the value(s) and return a ConditionEvaluateResult
	   },
	   public get category(): string { return 'Content'; }
	   public get conditionType(): string { return 'MyConditionType'; }
	}
	```	

### Additional considerations
- Look here for source code to the concrete conditions we’ve supplied:
[https://github.com/plblum/jivs/blob/main/src/Conditions/ConcreteConditions.ts](https://github.com/plblum/jivs/blob/main/src/Conditions/ConcreteConditions.ts)
- Look here for source code to abstract conditions and the factory:
[https://github.com/plblum/jivs/tree/main/src/Conditions](https://github.com/plblum/jivs/tree/main/src/Conditions)
- Return `Undetermined` when unsupported data is found. For example, if you are evaluating only against a string, test `typeof value === 'string'` and return `Undetermined` when false.
- Always write unit tests.
- `conditionType` should be meaningful. Try to limit it to characters that work within JSON and code, such as letters, digits, underscore, space, and dash. Also try to keep it short and memorable as users will select your Condition by specifying its value in the Configs passed into the `ValidationManager`.
- `conditionType` values are case sensitive.
- You may be building replacements for the Condition classes supplied in Jivs especially if you prefer a third party's validation schema code. In that case, implement the `IConditionFactory interface` to expose your replacements. Always attach your factory to the `ValidationServices class` in the `createValidationServices function`.
<a name="lookupkeys"></a>
## Lookup Keys: Data Types and Companion Tools
To really do the job well, Jivs wants to know specific data types associated with each Model property. You've seen the property "dataType" when configuring a ValueHost.
```ts
interface ValueHostConfig
{
  name: string;
  dataType?: string;
	... other properties omitted ...
}

let firstNameConfig = <ValueHostConfig>{
  type: 'Input',
  name: 'FirstName',
  dataType: 'String',
  validatorConfigs: [ InputValidatorConfigs ]
  ... other properties omitted ...
};

```
You *must* assign dataType to the name of a data type when the data is not a string, boolean, number or Date, and *should* assign it for those types when you need to be more precise, such as an "EmailAddress" instead of just "String".

We use the term "Lookup Key" when specifying the name of a data type. Please [see this page](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html) for a detailed look at all supplied with Jivs and how they are used.

A Lookup Key is very powerful! It connects up with these behaviors:
- <a href="#datatypeidentifier">Identifiers</a>
- <a href="#datatypeconverter">Converters</a>
- <a href="#datatypeformatter">Formatters</a>
- <a href="#datatypecomparer">Comparers</a>
- <a href="#datatypecheckgenerator">DataTypeCheckGenerators</a>

Let's look at each.
<a name="datatypeidentifier"></a>
### Identifiers
You can leave the dataType property blank and Jivs will identify its name for you with implementations of `IDataTypeIdentifier`. These come preinstalled: "String", "Number", "Boolean", and "Date" (Date object using only the date part in UTC).

Add your own when you have a class representing some data. Check out an actual example [here](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts). In this example, we have a new class, RelativeDate. We've created a new Lookup Key name called "RelativeDate" and associated it with a new DataTypeIdentifier.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypeconverter"></a>
### Converters
Change the value supplied to Conditions with implementations of `IDataTypeConverter`.

Consider these *Use Cases*:
- Provide case insensitive string matching by converting to lowercase. We've included a Converter for that, with "CaseInsensitive" as its Lookup Key. In this case, the Lookup Key should not be assigned to the ValueHost because its limited to the Condition. Many ConditionConfigs have conversionLookupKey and secondConversionLookupKey properties where you assign the Lookup Key. 

	Here is the NotEqualToCondition configured with CaseInsensitive:
	```ts
	{
	  type: 'Input',
	  name: 'FirstName',
	  dataType: 'String',
	  label: 'First name',
	  validatorConfigs: [ 
	  	{
	  	  conditionConfig: 
	  	  {
	  	    type: 'NotEqual',
	  	    secondValueHostName: 'LastName',
	  	    conversionLookupKey: 'CaseInsensitive',
	  	    secondConversionLookupKey: 'CaseInsensitive'
	  	  }
	  	}
	  ]
	},
	```
- Changing a Date object into something other than a Date+Time. You may be interested only in the date, the time, or even parts like Month or Hours. 
	
	Jivs includes these converters: "Date" (UTC date only), "LocalDate" (local date only), "TimeOfDay" (omits seconds), "TimeOfDayHMS" (includes seconds).
	
	We also have examples that introduce Month/Year [here](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/MonthYearConverter.ts) and Month/Day [here](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/AnniversaryConverter.ts).
	
	These Lookup Keys are usually assigned to the dataType property on the ValueHost.
- Perhaps you want to compare the difference in days between two dates. For that you need to convert a Date object into a number – the number of days since some fixed point. 
	
	Jivs includes the "TotalDays" Lookup Key and converter. Use it on a ConditionConfig.
- Changing your own class (already setup with an Identifier) into something as simple as a string, number, or Date also requires a Converter. You will see how in [the RelativeDate class example](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/RelativeDate_class.ts) and also in an example built around [a TimeSpan class](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/TimeSpan_class.ts).
- Additional converters already supplied with these Lookup Keys: "Integer" (uses Math.round), "Uppercase", "Lowercase".
- Suppose that you have a class "FullName" with properties of FirstName and LastName. Create a converter to return a string that is both concatenated.
- Suppose that you have a class "StreetAddress" with properties of Street, City, Region, PostalCode. Create a converter to return just the postal code.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypeformatter"></a>
### Formatters
Formatters provide localized strings for the tokens within error messages with implementations of `IDataTypeFormatter`. For example, if validating a date against a range, your error message may look like this: 

`"The value must be between {Minimum} and {Maximum}."`

Formatters initially use the Lookup Key from the ValueHost.dataType. So if you assigned dataType="Date", expect the short date format. 

`"The value must be between 12/31/1999 and 12/31/2005."`

To override it, such as using the abbreviated date format, include the Lookup Key within the token like this:
	
`"The value must be between {Minimum:AbbrevDate} and {Maximum:AbbrevDate}."`

`"The value must be between Dec 31, 1999 and Dec 31, 2005."`

Jivs provides these formatters: "ShortDate", "AbbrevDate", "AbbrevDOWDate" (adds day of week), "LongDate", "LongDOWDate" (adds day of week), "TimeOfDay" (omits seconds), "TimeOfDayHMS", "Integer", "Currency", "Percentage" (where 1.0 = 100%), "Percentage100" (where 100 = 100%), "Uppercase", "Lowercase", "Boolean" (say "True" and "False" for boolean values) and "YesNoBoolean" (say "Yes" or "No" for boolean values).

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypecomparer"></a>
### Comparers
Staying with the "single responsibility pattern", Jivs recommends that you use its comparison Conditions (Range, Equal, NotEqual, LessThan, etc) for all data types. It already knows how to handle comparing strings, numbers, dates and booleans. It does so with implementations of IDataTypeComparer. It also uses the Converters to get a Date, number or string from the value. So its pretty unusual to need to provide your own Comparer class. But its here if you need it.

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)
<a name="datatypecheckgenerator"></a>
### DataTypeCheckGenerator
In Jivs, "Data Type Check" means a Condition that can determine if the data supplied is fully compatible with what the model property intended. 

Jivs provides the DataTypeCheckCondition, and it handles many cases simply by checking if the Input value (from the UI editor) was successfully converted to the native value. For example, converting a date string "31-May-2030" into a Date object. As a rule, when that conversion fails, Jivs expects you to call `ValueHost.setValueToUndefined()`. DataTypeCheckCondition reports an error only when Input value is assigned and native value is undefined.
	
DataTypeCheck doesn't work when no conversion is required. Strings are a great example of a native value that doesn't require conversion. Strings represent all kinds of data. For example, an email address or a phone number. For these cases, create a Lookup Key ("EmailAddress", "PhoneNumber") and implement a `IDataTypeCheckGenerator `that supplies a regular expression to validate the string.
	
Take a look at [this example for Email Address](https://github.com/plblum/jivs/blob/main/packages/jivs-examples/src/EmailAddressDataType.ts).

[See all Lookup Keys](http://jivs.peterblum.com/typedoc/enums/DataTypes_Types_LookupKey.LookupKey.html)

## Localization
Any text displayed to the user and any input supplied from them is subject to localization. Jivs is localization-ready with several tools. There are third party tools that may do the job more to your liking, and they can be swapped in by implementing the correct interfaces.

### Localizing strings
Here are a few places you provide user-facing strings into Jivs:
- ValueHostConfig.label
- InputValidatorConfig.errorMessage and summaryMessage

Each of those properties have a companion that ends in "l10n" (industry term for localization), such as labell10n. Use the l10n properties to supply a Localization Key that will be sent to Jivs `TextLocalizationService`. If that service has the appropriate data, it will be used instead of the usual property.

`TextLocalizationService` is available on `ValidationManager.services.textLocalizationService`. Add localization content within the `createTextLocalizerService() function` [that was added here](#validationservice).

To replace it with a third party text localization tool, implement `ITextLocalizationService` and assign it in the `createTextLocalizerService() function`.

#### Setup for a label
Let's suppose that you have a label "First Name" which you want in several languages.
1. Create a unique Localization Key for it. We'll use "FirstName".
2. Assign both label and labell10n properties during configuration.
	```ts
	{
	  type: 'Input',
	  name: 'FirstName',
	  label: 'First Name',
	  labell10n: 'FirstName'
	}
	... or using fluent syntax ...
	config().input('FirstName', null, { label: 'First Name', 'labell10n': 'FirstName' })
	```
3. Add an entry to the `createTextLocalizerService() function` like this:
	```ts
	export function createTextLocalizerService(): ITextLocalizerService
	{
	    let service = new TextLocalizerService();
	    ...
	    service.register('labell10n', {
	        '*': 'First Name', // fallback
	        'en': 'First Name',
	        'es': 'nombre de pila',
	        'fr': 'prénom'
	    });
	}
	```
	
#### Setup for errorMessage and summaryMessage properties
Jivs generates specific Localization Keys based on the ConditionType.
For error message, "EM-*ConditionType*-*DataTypeLookupKey*" and a fallback "EM-*ConditionType*". Example using RangeCondition for an Integer Lookup Key: "EM-Range-Integer" and "EM-Range".
For summary message, "SEM-*ConditionType*-*DataTypeLookupKey*" and a fallback "SEM-*ConditionType*".

When using the supplied TextLocalizerService, you won't need to know those Lookup Keys. Instead, you can call its `registerErrorMessage()` and `registerSummaryMessage()`.

The existing `createTextLocalizerService() function` already has numerous examples. For example:
```ts
    service.registerErrorMessage(ConditionType.RequireText, null, {
        '*': 'Requires a value.'
    });
    service.registerSummaryMessage(ConditionType.RequireText, null, {
        '*': '{Label} requires a value.'
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
    });        
```
So review and edit the `createTextLocalizerService() function`.

### Localizing error message tokens
Error messages use tokens to insert values at runtime. When the value is a number, date or boolean, those must be localized. Jivs already does this within its <a href="#datatypeformatter">DataTypeFormatter classes</a>.

The supplied classes use [JavaScript's own Intl class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) to handle dates, times, and numbers. It uses [toLocaleLowerCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase) and [toLocaleUpperCase](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) for those situations. These classes are adequate but you may prefer using a richer third party library.

To switch, you need to replace the specific DataTypeFormatter classes that are not ideal and register your replacements using the original Lookup Key. See the existing DataTypeFormatter classes [here](https://github.com/plblum/jivs/blob/main/packages/jivs-engine/src/DataTypes/DataTypeFormatters.ts).

For example, LongDateFormatter uses Intl to format with full month name. It's Lookup Key is "LongDate". Here is a framework to replace it.
```ts
export class MyLongDateFormatter extends DataTypeFormatterBase
{
  protected get expectedLookupKeys(): string | Array<string>
  {
    return LookupKey.LongDate;
  }
  protected supportsCulture(cultureId: string): boolean
  {
    return true; // only return false if you know the culture does not apply
  }
  public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string> {
    if (value instanceof Date)
    {
    // do the work
    	  let formatted: string = ... code to handle the localized formatted date...
      return { value: formatted };
    }
    return { errorMessage: 'Not a date' };
  }	
}
```
Then register it within registerDataTypeFormatters() where you added the <a href="#validationservices">`createValidationService() function`</a>, replacing the existing "LongDateFormatter" Lookup Key.
```ts
export function registerDataTypeFormatters(dtfs: DataTypeFormatterService): void
{
...
    dtfs.register(new MyLongDateFormatter()); 
...
}    
```