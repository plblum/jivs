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
