# Workflow Decisions

## Purpose

Identify the decisions developers make while building validation workflows and determine which of those decisions should be emphasized within future Jivs documentation.

The focus is not implementation details.

The focus is understanding the choices available within a validation workflow and showing where Jivs may participate.

---

# Questions and Responses

## Q09

### Question

Should we explicitly present all major decisions users can make, such as:

- Parsing
- Formatting
- Model mapping
- State management

or present only a curated subset?

### Response

A curated subset.

The documentation should focus on decisions that developers consciously make while building validation workflows.

Important decisions include:

- Parsing
- Formatting
- Model transfer / model mapping

State management should generally not be presented as a workflow decision.

State management is primarily an internal aspect of Jivs and is not something most developers actively evaluate when designing validation workflows.

### Notes

Among these topics, parsing appears to be the most significant decision point.

Developers naturally understand that values move between forms and models.

However:

```text
Text Value
    ->
Parser
    ->
Native Value
```

is often where the complexity of validation workflows begins.

This is also where Jivs provides substantial value.

---

## Q10

### Question

What decisions are important enough to deserve their own section?

### Response

Undetermined.

This question is likely premature.

The sections should emerge from workflow analysis rather than being imposed before the workflow content exists.

### Notes

At a minimum, the major workflow decisions should be discussed:

- Parsing
- Formatting
- Model transfer

Whether they become independent sections or appear within larger workflow discussions remains an editorial decision to be made later.

The content should drive the structure.

Not the other way around.

---

## Q11

### Question

Which decisions are important enough to deserve their own diagram?

### Response

The primary focus should be workflow diagrams rather than decision diagrams.

Both ordinary validation workflows and Jivs-based workflows should be represented visually.

### Notes

Diagrams are expected to play a major role in communication.

Future documentation should likely compare:

```text
Traditional Workflow
```

with:

```text
Jivs Workflow
```

Examples:

### Form Initialization

```text
Model
    ->
Formatter
    ->
Input
```

### Edit Workflow

```text
Input
    ->
Parser
    ->
Validation
    ->
Error Displays
``