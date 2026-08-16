# Learning Diagram Specifications

This document records the intent behind diagrams used in the learning documentation. It is authoring material and is not intended for end users.

The end-user Markdown document owns the current Mermaid source. This document owns the purpose, meaning, and constraints needed to recreate or revise each diagram.

# Understanding_Value_Management.md

## UVM Diagram 1 — Client-Side Validation Flow

### Used in

`Understanding_Value_Management.md` — **Value Management in Context**

### Purpose

Introduce the Value Manager at a very high level on the client side.

Show that the Value Manager participates between incoming/editable data and final data suitable for saving, while errors take a separate path to the UI.

This diagram establishes context. It does not explain what happens inside the Value Manager.

### Participants

* Initial Data
* Input Controls
* Value Manager
* Final Data
* Display Error Messages
* Save

### Relationships

* Initial Data supplies the Input Controls.
* Initial Data also supplies the Value Manager.
* Input Controls and the Value Manager exchange values in both directions.
* The Value Manager produces Final Data.
* The Value Manager provides Error Messages for display.
* Final Data proceeds to Save.

### Emphasis

* Keep the data terminology deliberately generic at this level.
* Use **Initial Data** and **Final Data**, not Model, Dictionary, or another data shape.
* The Value Manager performs the central gatekeeping function before data becomes suitable for saving.
* Client-side value management participates throughout editing, which is why communication with Input Controls is bidirectional.
* Displaying Error Messages is outside the Value Manager.
* Saving is outside the Value Manager.
* Do not expose internal Value Manager responsibilities yet.
* Do not introduce Jivs classes or implementation details.

### Reader takeaway

Client-side values pass through a Value Manager before becoming final data suitable for saving, while Error Messages are sent elsewhere for presentation.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UVM Diagram 2 — Server-Side Validation Flow

### Used in

`Understanding_Value_Management.md` — **Value Management in Context**

### Purpose

Introduce the Value Manager at a very high level on the server side and present it as a peer to the client-side Value Manager.

Show the same central gatekeeping function: Request Data either becomes usable Final Data or results in Error Messages.

### Participants

* Request Data
* Value Manager
* Final Data
* Error Message(s)
* Save Data and OK Response
* Error Response

### Relationships

* Request Data enters the Value Manager.
* The Value Manager can produce Final Data.
* Final Data proceeds to Save Data and OK Response.
* The Value Manager can produce Error Message(s).
* Error Message(s) proceed to an Error Response.

### Emphasis

* Client and server diagrams should be shown together.
* Neither side is the primary or canonical Value Manager.
* Both rely on substantially the same value-management capabilities.
* Request Data is deliberately generic.
* Do not require a particular data shape.
* A user-facing web client may submit text-oriented form data.
* A published API may provide JSON that has already been deserialized into an object.
* These boundary mechanisms are outside the Value Manager.
* Error Messages may be returned differently for a web client and an API consumer.
* Response construction is outside the Value Manager.
* Saving is outside the Value Manager.
* Do not expose internal Value Manager responsibilities yet.
* Do not introduce Jivs terminology.

### Reader takeaway

Server-side value management performs the same fundamental gatekeeping job as client-side value management even though its surrounding input and response mechanisms differ.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UVM Diagram 3 — Inside the Value Manager

### Used in

`Understanding_Value_Management.md` — **Inside the Value Manager**

### Purpose

Open the Value Manager box and give the reader a quick inventory of the generic responsibilities involved in a validation system.

This is a parts diagram, not a workflow diagram.

### Participants

Contained within a Value Manager boundary:

* Obtaining Values
* Parsing
* Formatting
* Validating
* Communicating Errors

### Relationships

No processing sequence is implied.

The five responsibilities are peer capabilities that may participate in value management.

### Emphasis

* Show responsibilities, not implementation objects.
* Use action-oriented names rather than nouns such as Parser, Formatter, or Validator.
* Do not imply that every implementation must use every responsibility.
* Do not distinguish client and server usage in this diagram.
* Formatting remains part of the generic toolset even though it is rarely needed on the server.
* Obtaining Values means bringing required values into the Value Manager.
* Obtaining Values must not imply storage or ownership of those values.
* Model transfer is outside the Value Manager.
* UI interaction is outside the Value Manager.
* HTTP processing is outside the Value Manager.
* Do not introduce Jivs classes.

### Reader takeaway

A generic Value Manager can be understood in terms of five responsibilities: obtaining values, parsing, formatting, validating, and communicating errors.

### Current representation

Mermaid flowchart containing five peer boxes within a `Value Manager` subgraph.

Orientation: top-to-bottom.

No arrows between the five responsibilities.

---

## UVM Diagram 4 — Parsing Workflow

### Used in

`Understanding_Value_Management.md` — **Parsing and Formatting**

### Purpose

Show the common client-side path from text supplied by an input element through parsing and into validation.

Demonstrate why both **Text Value** and **Native Value** are useful concepts.

### Participants

* Input Element
* Text Value
* Parse
* Native Value
* Validate

### Relationships

* Input Element provides a Text Value.
* Text Value is sent to Parse.
* Parse produces a Native Value.
* Native Value proceeds to Validate.

### Emphasis

* Use the action labels **Parse** and **Validate** in this workflow.
* Parsing converts a Text Value to a Native Value.
* End the diagram at Validate rather than stopping at Native Value.
* Do not show a parser class or other implementation object.
* Do not introduce Jivs classes.

### Reader takeaway

Text from an input is parsed into a Native Value before native-value validation can run.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UVM Diagram 5 — Formatting for the Input Element

### Used in

`Understanding_Value_Management.md` — **Parsing and Formatting**

### Purpose

Show the simple formatting path used when a Native Value needs to become text suitable for an input element.

### Participants

* Native Value
* Format
* Text Value
* Input Element

### Relationships

* Native Value is sent to Format.
* Format produces a Text Value.
* Text Value can be assigned to the Input Element.

### Emphasis

* Use the action label **Format**.
* Formatting is the complementary operation to parsing.
* The Input Element is outside the formatting operation.
* Assignment to the Input Element is optional in the surrounding prose even though it is shown as the destination.
* Do not add validation to this diagram.
* Do not introduce Jivs classes.

### Reader takeaway

Formatting converts a Native Value into a Text Value that can be used by an input element.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UVM Diagram 6 — Parsing and Formatting Together

### Used in

`Understanding_Value_Management.md` — **Parsing and Formatting**

### Purpose

Show the special case where parsing and formatting work together after user input.

Text entered by the user is parsed into a Native Value and then formatted back into a new Text Value for the input element.

### Participants

* Input Element
* Text Value
* Parse
* Native Value
* Format
* Text Value
* Input Element

### Relationships

* Input Element supplies the original Text Value.
* Text Value is sent to Parse.
* Parse produces a Native Value.
* Native Value is sent to Format.
* Format produces a new Text Value.
* The new Text Value is sent back to the same Input Element.

### Emphasis

* Use the action labels **Parse** and **Format**.
* The first and last Input Element represent the same logical element.
* The first and second Text Values represent different stages of the value.
* Show the complete round trip.
* Do not use the term `normalization`.
* Do not add validation to this diagram.
* The purpose is specifically to connect parsing and formatting in one useful workflow.
* Do not introduce Jivs classes.

### Reader takeaway

Parsing and formatting can work together so that user-entered text is converted to a Native Value and then reformatted back into the input's latest Text Value.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UVM Diagram 7 — Validating

### Used in

`Understanding_Value_Management.md` — **Validating**

### Purpose

Provide the simplest useful mental model of validation.

A validator receives one or more values and produces either success or an Error Message.

### Participants

* Value(s)
* Validator
* Valid
* Error Message

### Relationships

* Value(s) are supplied to the Validator.
* Validator can produce Valid.
* Validator can produce an Error Message.

### Emphasis

* Keep this diagram intentionally simple.
* Use **Value(s)** rather than Value.
* `Validator` is generic here and must not imply a Jivs Validator class.
* Error Message is the tangible generic representation of a validation failure.
* Do not use the Jivs-specific term `Validation Issue`.
* The values may be Text Values, Native Values, related values, or values interpreted with application-specific conditions; explain that in prose rather than expanding the diagram.

### Reader takeaway

Validation consumes one or more values and determines either that they are valid or that an Error Message should be produced.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UVM Diagram 8 — Communicating Errors on the Client

### Used in

`Understanding_Value_Management.md` — **Communicating Errors**

### Purpose

Show how an Error Message produced through value management can be consumed by client-side UI components.

Reinforce that displaying errors is outside the Value Manager.

### Participants

* Value Manager
* Error Message
* Field Error
* Validation Summary

### Relationships

* Value Manager makes an Error Message available.
* The Error Message can be used by a Field Error.
* The same Error Message can be used by a Validation Summary.

### Emphasis

* Field Error and Validation Summary are separate onscreen consumers of the same validation information.
* The Value Manager does not render either component.
* Do not distinguish the Value Manager as a special `Client Value Manager`; the same conceptual Value Manager is being used in a client environment.
* Use **Error Message**, not `Validation Issue`.
* Keep UI implementation details outside the diagram.
* Do not introduce Jivs callbacks or classes yet.

### Reader takeaway

On the client, the Value Manager communicates an Error Message outward and UI code decides where and how that message is displayed.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UVM Diagram 9 — Communicating Errors on the Server

### Used in

`Understanding_Value_Management.md` — **Communicating Errors**

### Purpose

Show how one or more Error Messages produced through value management become data for a server error response.

Reinforce that response construction and transport are outside the Value Manager.

### Participants

* Value Manager
* Error Message(s)
* Error Response Data

### Relationships

* Value Manager makes Error Message(s) available.
* Error Message(s) become Error Response Data.

### Emphasis

* Use **Error Message(s)** because a server response may contain multiple errors.
* Do not distinguish the Value Manager as a special `Server Value Manager`; the same conceptual Value Manager is being used in a server environment.
* Error Response Data is outside the Value Manager.
* Do not prescribe JSON, HTTP status codes, serialization, or another transport format.
* A web form and a published API may shape and return their errors differently.
* Do not introduce the Jivs-specific term `Validation Issue`.
* Do not introduce Jivs classes yet.

### Reader takeaway

On the server, the Value Manager communicates Error Messages outward as data that application infrastructure can include in an error response.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

# Understanding_Jivs.md

## UJ Diagram 1 — Jivs and the UI/Application

### Used in

`Understanding_Jivs.md` — **What Jivs Is Trying to Do**

### Purpose

Show the basic separation between Jivs and the surrounding UI/application before introducing Jivs-specific classes.

Connect the earlier Value Manager concept to Jivs while keeping the interaction intentionally high-level.

### Participants

* UI / Application
* Jivs

### Relationships

* UI / Application supplies Values to Jivs.
* Jivs returns Validation State and Error Messages to the UI / Application.

### Emphasis

* Keep the diagram extremely simple.
* Jivs does not know or manipulate the UI.
* Values flow into Jivs.
* Validation information flows back to application code.
* Do not introduce callbacks yet.
* Do not introduce `ValueHost`, `FieldValueHost`, or `ValueHostsManager` in this diagram.
* Use **Validation State** as the Jivs term.
* Use **Error Messages** as the tangible representation of validation problems.
* The diagram should reinforce separation of concerns without exposing implementation mechanics.

### Reader takeaway

The application supplies values to Jivs, and Jivs supplies validation information back without knowing anything about the application's UI.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## UJ Diagram 2 — Core Jivs Concepts

### Used in

`Understanding_Jivs.md` — **The Core Jivs Concepts**

### Purpose

Give the reader a simple visual relationship between the four Jivs concepts introduced immediately before the diagram:

* `ValueHost`
* `FieldValueHost`
* `ValueHostsManager`
* `JivsServices`

### Participants

* ValueHostsManager
* FieldValueHost
* ValueHost
* ValueHost
* JivsServices

### Relationships

* `ValueHostsManager` visually contains a collection of ValueHosts.
* One contained item is explicitly shown as a `FieldValueHost`.
* Other contained items are shown generically as `ValueHost`.
* `ValueHostsManager` uses `JivsServices`.
* One representative `FieldValueHost` uses `JivsServices`.

### Emphasis

* Use containment to represent the collection of ValueHosts inside the `ValueHostsManager`.
* Do not add a separate label such as "ValueHosts" to the collection; the preceding text already explains it.
* Showing one `FieldValueHost` among generic ValueHosts reinforces that it is a kind of ValueHost without requiring an inheritance diagram.
* The arrows toward `JivsServices` mean that these objects consume its services.
* Do not imply that `JivsServices` owns or creates the objects merely because it is required.
* A single representative ValueHost-to-`JivsServices` arrow is sufficient; do not draw an arrow from every ValueHost.
* Do not introduce validators, Conditions, Builder configuration, callbacks, or other implementation details.

### Reader takeaway

A `ValueHostsManager` coordinates a collection of ValueHosts, `FieldValueHost` is an important kind of ValueHost, and both the manager and its ValueHosts can use the required `JivsServices`.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

`ValueHostsManager` is represented as a subgraph containing three representative ValueHosts.

---

# Intro_to_Creating_a_ValueHostsManager.md

## CVHM Diagram 1 — Creating a ValueHostsManager

### Used in

`Intro_to_Creating_a_ValueHostsManager.md` — opening section

### Purpose

Introduce the conceptual construction path before showing the recurring TypeScript creation pattern.

Prepare the reader to understand the relationship between a rules class, the Builder API, configuration, `ValueHostsManager`, and `JivsServices`.

### Participants

* Rules
* Builder
* Configuration
* ValueHostsManager
* JivsServices

### Relationships

* Rules use the Builder.
* Builder produces Configuration.
* Configuration is used to create the ValueHostsManager.
* JivsServices supports the ValueHostsManager.

### Emphasis

* This is intentionally a simplified construction picture.
* `Rules → Builder → Configuration` is conceptual; in actual code the rules class uses a Builder supplied during configuration.
* The diagram should not explain `configureRules()` or other method mechanics.
* The Builder should be visible because it is an important concept used throughout the document.
* `configure()` itself is introduced later in the code-based creation pattern, not in the diagram explanation.
* `JivsServices` is required.
* Do not expand `JivsServices` into its parsers, formatters, Conditions, or other services here.
* Do not show callbacks or UI integration.
* The endpoint is construction of a configured `ValueHostsManager`.

### Reader takeaway

Rules use the Builder to produce the configuration from which a `ValueHostsManager` is created, with `JivsServices` supplying required infrastructure.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

# Using_the_ValueHostsManager_within_the_Client.md

## Client Diagram 1 — Two-Way Client Interaction

### Used in

`Using_the_ValueHostsManager_within_the_Client.md` — opening section

### Purpose

Establish the basic interactive relationship between UI components and an already-configured `ValueHostsManager`.

Reinforce the separation-of-concerns concept introduced in `Understanding_Jivs.md`, now using the concrete Jivs manager.

### Participants

* UI Components
* ValueHostsManager

### Relationships

* UI Components supply Values to the ValueHostsManager.
* ValueHostsManager reports Changes and Validation back toward the UI Components.

### Emphasis

* Keep this diagram high-level.
* The training remains UI-framework agnostic.
* Do not show callbacks yet; they are introduced later in the document.
* Do not imply that the ValueHostsManager knows or manipulates UI components.
* The arrows describe the application's interactive exchange, with application glue omitted at this level.
* Framework-specific modules may later show how actual framework components participate.

### Reader takeaway

Client interaction is two-way: the UI supplies values to the `ValueHostsManager`, while Jivs reports value and validation changes that application code can reflect in the UI.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## Client Diagram 2 — Sending User Input to Jivs

### Used in

`Using_the_ValueHostsManager_within_the_Client.md` — **Sending User Input to Jivs**

### Purpose

Show the simple path from an edited input through a `FieldValueHost` and into parsing and validation.

Connect the generic parsing workflow from `Understanding_Value_Management.md` to the Jivs-specific `FieldValueHost`.

### Participants

* Input Element
* FieldValueHost
* Validation

### Relationships

* Input Element supplies a Text Value to the FieldValueHost.
* The FieldValueHost parses and validates the supplied value.
* The result participates in Validation.

### Emphasis

* Label the first arrow **Text Value**.
* Label the second arrow **Parse and Validate**.
* Keep event details out of the diagram; `change`, `input`, and `duringEdit` are explained by the nearby code.
* `setTextValue()` automatically triggers validation for the FieldValueHost.
* Do not expand parsers or validators into separate objects here.
* The purpose is to show the Jivs-specific equivalent of the earlier generic workflow.

### Reader takeaway

Client code supplies an input's Text Value to its `FieldValueHost`, which handles the Jivs parsing and field-validation process.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## Client Diagram 3 — Field Validation Callback

### Used in

`Using_the_ValueHostsManager_within_the_Client.md` — **When a Field's Validation Changes**

### Purpose

Show the separation between a `FieldValueHost` reporting a validation change and application code deciding how to represent that change as a Field Error.

### Participants

* FieldValueHost
* Application Code
* Field Error

### Relationships

* FieldValueHost invokes a validation callback.
* Application Code responds to the callback.
* Application Code updates the Field Error.

### Emphasis

* Keep the UI implementation outside Jivs.
* The diagram should pair with the nearby HTML showing an input and its companion Field Error holder.
* The application code may use `ElementIdentifier` and `getElement(valueHost, '{0}-error')` to locate that companion element, but do not put that lookup detail in the diagram.
* The callback example is lightweight glue, not a prescribed presentation.
* Framework-specific modules may provide richer presentation patterns.
* Do not imply that Jivs renders the Field Error.

### Reader takeaway

A field-level validation change comes from the `FieldValueHost`; application code receives the callback and decides how the corresponding Field Error should be updated.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## Client Diagram 4 — Overall Validation Callback

### Used in

`Using_the_ValueHostsManager_within_the_Client.md` — **When Overall Validation Changes**

### Purpose

Show how a validation-state change for the entire `ValueHostsManager` can be communicated to application code and then to a Validation Summary.

### Participants

* ValueHostsManager
* Application Code
* Validation Summary

### Relationships

* ValueHostsManager invokes a validation callback.
* Application Code responds to the callback.
* Application Code updates the Validation Summary.

### Emphasis

* This is the manager-level counterpart to the field-level callback diagram.
* The `ValueHostsManager` reports the change; it does not know about or render the Validation Summary.
* Keep callback signatures and error enumeration out of the diagram.
* The Validation Summary is one possible consumer of overall validation state.
* Application code may also use overall Validation State for other decisions, such as whether an action remains available.
* Keep presentation framework agnostic.

### Reader takeaway

The `ValueHostsManager` reports overall validation changes, and application code decides how those changes are represented to the user, such as through a Validation Summary.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## Client Diagram 5 — The Interactive Connection

### Used in

`Using_the_ValueHostsManager_within_the_Client.md` — **The Interactive Connection**

### Purpose

Summarize the interactive client-side connection after the reader has learned how values enter Jivs and how callbacks communicate changes outward.

Bring the document's major concepts together before transitioning to form initialization and submission.

### Participants

* UI Input
* FieldValueHost
* ValueHostsManager
* UI

### Relationships

* UI Input supplies a Text Value to the FieldValueHost.
* FieldValueHost participates in the ValueHostsManager.
* ValueHostsManager reports validation callbacks toward the UI.
* FieldValueHost reports value and field callbacks toward the UI.

### Emphasis

* This is a summary diagram, not a detailed implementation diagram.
* Values enter through a `FieldValueHost`.
* Manager-level validation callbacks originate with the `ValueHostsManager`.
* Value- and field-specific callbacks originate with the `FieldValueHost`.
* The arrows terminating at UI represent application code reacting to callbacks; they must not imply that Jivs directly manipulates the UI.
* The UI framework remains outside Jivs.
* Keep initialization and submission outside this diagram; those belong in `Managing_the_Client_Form_Lifecycle.md`.
* This diagram closes the interactive-connection portion of the learning sequence.

### Reader takeaway

The Client supplies values through `FieldValueHost`s, while field-level and manager-level callbacks provide the information application code needs to keep the UI synchronized with Jivs.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.
# Submitting_the_Client_Form.md

## Submit Diagram 1 — Submission Stages

### Used in

`Submitting_the_Client_Form.md` — opening section

### Purpose

Orient the reader to the major stages a client submission can pass through before showing the more detailed submission workflow.

Establish that Jivs validation is one stage in a broader process that can also include business logic validation and server validation.

### Participants

* Jivs Validation
* Additional Business Logic Validation
* Submit
* Success or Show Errors

### Relationships

* Jivs Validation precedes Additional Business Logic Validation.
* Additional Business Logic Validation precedes Submit.
* Submit produces either successful completion or errors that must be shown.

### Emphasis

* Keep this diagram deliberately high-level.
* This is an orientation diagram, not the complete control flow.
* Jivs validation runs before the completed Model is submitted.
* Business logic validation is a separate concern and may run after Jivs validation.
* Server validation is represented within the broad Submit/result portion here rather than expanded.
* Any validation stage may ultimately prevent successful submission.
* Do not expose `ModelWriter`, `IssueFound`, payloads, HTTP handling, or other implementation mechanics.
* The next diagram provides the more detailed workflow.

### Reader takeaway

Submitting a form may involve several validation stages: Jivs validation, additional business logic validation, and validation associated with submission to the server.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

---

## Submit Diagram 2 — Complete Submission Flow

### Used in

`Submitting_the_Client_Form.md` — opening section

### Purpose

Show the complete decision path from an attempt to submit through client validation, Model construction, business logic validation, server submission, and either successful completion or refreshed error displays.

Make clear that validation problems from several stages converge on the same client-side correction cycle.

### Participants

* Attempt Submit
* Jivs Validation
* Build Model
* Business Logic Validation
* Send to Server
* Submission Complete
* Refresh Error Displays and Stop

### Relationships

* Attempt Submit starts Jivs Validation.
* Successful Jivs Validation proceeds to Build Model.
* A built Model proceeds to Business Logic Validation.
* Successful Business Logic Validation proceeds to Send to Server.
* Server success proceeds to Submission Complete.
* Issues from Jivs Validation stop submission and refresh Error Displays.
* Issues from Business Logic Validation stop submission and refresh Error Displays.
* Issues returned by the server stop submission and refresh Error Displays.

### Emphasis

* Validation issues from all three validation locations converge on the same error-presentation path.
* Building the Model occurs only after Jivs validation permits submission.
* Business logic validation runs against the completed Model.
* The server remains responsible for validating submitted data.
* Refreshing Error Displays represents the validation UI already connected to the `ValueHostsManager`.
* Do not treat request/transport failures as validation issues in this diagram.
* Operational failures are handled separately in the document.
* Do not prescribe whether the server itself uses Jivs.
* Both Jivs and non-Jivs server validation can ultimately provide issues to the client.
* Successful submission is the only path that reaches Submission Complete.

### Reader takeaway

Submission advances only while each validation stage succeeds; issues found by Jivs, business logic, or the server stop the process and return the user to the same validation UI.

### Current representation

Mermaid flowchart.

Orientation: top-to-bottom.

Issue paths converge on a shared **Refresh Error Displays and Stop** node.

---

# Building_Client_Validation_UI.md

## Validation UI Diagram 1 — Validation State Delivery

### Used in

`Building_Client_Validation_UI.md` — **Putting It Together**

### Purpose

Summarize the separation of responsibilities established throughout the document.

Show how a Jivs validation notification reaches UI presentation without implying that Jivs directly manipulates the DOM or owns UI behavior.

### Participants

* Jivs Validation Callback
* Dispatcher Function
* UI Consumer
* Presentation Function
* DOM / CSS / ARIA

### Relationships

* a Jivs Validation Callback invokes application integration code.
* the Dispatcher Function locates interested UI Consumers.
* a UI Consumer exposes its Presentation Function.
* the Presentation Function applies that consumer's presentation through DOM, CSS, ARIA, or equivalent UI mechanisms.

### Emphasis

* Keep Jivs separate from presentation.
* The Dispatcher Function distributes validation state; it does not render widgets.
* Each UI Consumer owns its Presentation Function.
* Presentation Functions may update DOM content, expose CSS state, manage visibility, or update accessibility attributes.
* The diagram represents the plain-DOM implementation taught by this document.
* Framework integrations may replace DOM lookup and element callbacks with framework-native subscriptions, components, props, hooks, directives, services, or equivalent mechanisms.
* Do not imply that the Dispatcher Function must know the behavior of individual UI widgets.
* Do not imply that CSS or ARIA belongs inside Jivs.
* Field-level and form-level flows are instances of this same architecture.
* This is a summary architecture diagram, not a detailed event sequence.

### Reader takeaway

Jivs reports validation state, application integration code dispatches that state to interested UI Consumers, and each consumer owns how the state is presented.

### Current representation

Mermaid flowchart.

Orientation: left-to-right.

The diagram forms a single chain from **Jivs Validation Callback** through **DOM / CSS / ARIA**.