# Validation-Side Planning Notes Part 2

See also Part 1

## Server-side developer guidance: transferring source data into ValueHosts

This is a cross-workflow guidance topic for cases where the server uses Jivs.

It applies to Workflow A, Workflow B, and Workflow C.

### Source data shapes

Server-side code may need to transfer data into `ValueHosts` from sources such as:

* HTTP form fields
* typed objects
* untyped objects created from JSON
* dictionaries or other name/value sources

### Server-side code owns the transfer step

Jivs does not automatically move source data into `ValueHosts`.

Server-side code must perform that transfer.

At a high level, that means:

* identify the source value for a given `ValueHost`
* choose the correct Jivs API for assigning that value
* ensure any required parsing/conversion is available before validation runs

A helper may later support transferring values from an object or dictionary by matching `ValueHost` names to source members.

### When parsers matter

Parsers matter whenever the incoming source value is not already in the native form needed by validation.

Common examples include:

* HTTP form fields, which are strings
* untyped JSON objects whose values still need conversion
* string values that should become numbers, dates, Booleans, or other native forms

This is especially important for cases such as a JSON string containing a date that must become a JavaScript `Date` before validation can work correctly.

A strongly typed object may already have the needed conversion applied.

Even then, parser-based assignment may still be supported when appropriate.

### Use `setInputValue()` when the source value should be treated as input text or other input-form data

`ValueHost.setInputValue(inputValue)` is the Jivs-specific path that automatically runs a supplied parser to convert the input value into the native value stored for validation.

This is the natural fit when the source data is still in its input form, especially string-based input such as:

* HTTP form fields
* string values from JSON that still need parsing
* other incoming values that should be processed through Jivs parsing rules

`setInputValue()` will get the parser from the Validation configuration specific to the data type lookup key. The ValueHost.setInputValue() also supports options that can supply parser-related behavior there.

### Use other assignment paths when the native value is already available

When server-side code already has the native value in the form needed for validation, it may assign that value without relying on parser-based conversion. It should use ValueHost.setValue() instead of ValueHost.setInputValue().

That case is more likely with:

* strongly typed objects
* earlier server-side conversion code
* source pipelines that already produced native values

### Parsers prepare data for the ValueHost; they do not update the source object

Parsers are used to prepare values for the `ValueHost`.

They do not mutate the original source object or source collection.

That distinction matters when server-side code is transferring values from an incoming model, form collection, or deserialized JSON structure.

### Server-side developer guidance must call out parser configuration

Because string and untyped inputs are common on the server, documentation and later design work should explicitly advise the server-side developer to configure Jivs parsers correctly.

That guidance is especially important for:

* form-field handling
* untyped JSON input
* string-to-date conversion
* any input whose validation depends on native-type conversion before rules can run

---

## Workflow views

## Workflow A: Same-instance / SPA-style save failure flow

1. Client already has a configured `ValidationManager` and assigned values to the ValueHosts
2. User invokes the action, such as submit
3. Client runs local validation for that action
4. Client callbacks/hooks update visuals and messages to reflect the validation results
5. Client decides whether the action can proceed

   * If validation blocks the action, the workflow stops here.
   * If one or more errored fields are in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors.
   * The user revises the values shown with errors in the UI, and the client may revalidate as needed.
   * If validation does not block the action, the workflow continues.
6. Client runs any non-Jivs validation if needed

   * If those checks need a model object, the developer may create it here.
   * If non-Jivs checks report errors that should participate in the Jivs UI flow, client-side code converts them into `BusinessLogicErrors` and applies them through `ValidationManager.setBusinessLogicErrors()`.
   * If those errors block the action, the workflow stops.
7. (Client) If save logic needs a model object and one has not yet been created, set it up
8. Client submits to server
9. Server performs early security screening on hostile or suspicious input

   * If security screening stops the workflow outside the normal Jivs returned-error flow, the workflow ends here.
   * The developer can instead convert that outcome into a `BusinessLogicError`, continue, and include it in the returned list later.
10. Server prepares the Jivs validation runtime

    * Server-side code selects the correct model rules and creates/configures the `ValidationManager`.
    * Server-side code transfers incoming source values into the appropriate `ValueHosts`.
    * Source values may come from HTTP form fields, typed objects, or untyped objects created from JSON.
    * A helper may later support transferring values from an object or dictionary by matching `ValueHost` names to source members.
    * When incoming values are strings or otherwise need conversion before validation, parsers may be used to prepare native values for the `ValueHosts`.
    * `ValueHost.setInputValue()` already supports parser-driven conversion from input value to native value. Parsers prepare values for the `ValueHost`; they do not update the original source object.
11. Server runs Jivs validation

    * Developer chooses whether to stop now when Jivs `IssuesFound` exist, or continue into later non-Jivs checks.
    * If the developer stops here, save is blocked and the workflow moves to packaging and delivery.
12. (Server) If non-Jivs checks code needs a model object, set it up.
13. Server runs other non-Jivs checks when the workflow continues
14. Server code converts native app errors from those checks to `BusinessLogicErrors`
15. If no server-side errors exist, the server attempts save.

    * If save logic needs a model object and one has not yet been created, set it up
    * Run save process
    * If save succeeds, the error-reporting workflow ends.
    * If save fails, server code converts save-time native app errors to `BusinessLogicErrors`.
16. Returned errors are packaged and reported to the client

    * Jivs packager packages `IssuesFound` and `BusinessLogicErrors`
    * App/server delivers packaged content in the response
    * App/client retrieves and deserializes the broader response, then gets `issuesFound` / `businessLogicErrors`
    * App/framework code applies the returned `issuesFound` / `businessLogicErrors` to the existing `ValidationManager`
    * Client callbacks/hooks update visuals

      * If one or more returned errors are associated with fields in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors

## Workflow B: Reload / server-rendered round-trip failure flow

1. Client creates/configures `ValidationManager` and assigned values to the ValueHosts
2. User invokes the action, such as submit
3. Client runs local validation for that action
4. Client callbacks/hooks update visuals and messages to reflect the validation results
5. Client decides whether the action can proceed

   * If validation blocks the action, the workflow stops here.
   * If one or more errored fields are in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors.
   * The user revises the values shown with errors in the UI, and the client may revalidate as needed.
   * If validation does not block the action, the workflow continues.
6. Client runs any non-Jivs validation if needed

   * If those checks need a model object, the developer may create it here.
   * If non-Jivs checks report errors that should participate in the Jivs UI flow, client-side code converts them into `BusinessLogicErrors` and applies them through `ValidationManager.setBusinessLogicErrors()`.
   * If those errors block the action, the workflow stops.
7. (Client) If save logic needs a model object and one has not yet been created, set it up
8. Client submits data to server
9. Server performs early security screening on hostile or suspicious input

   * If security screening stops the workflow outside the normal Jivs returned-error flow, the workflow ends here.
   * The developer can instead convert that outcome into a `BusinessLogicError`, continue, and include it in the returned list later.
10. Server prepares the Jivs validation runtime

* Server-side code selects the correct model rules and creates/configures the `ValidationManager`.
* Server-side code transfers incoming source values into the appropriate `ValueHosts`.
* Source values may come from HTTP form fields, typed objects, or untyped objects created from JSON.
* A helper may later support transferring values from an object or dictionary by matching `ValueHost` names to source members.
* When incoming values are strings or otherwise need conversion before validation, parsers may be used to prepare native values for the `ValueHosts`.
* `ValueHost.setInputValue()` already supports parser-driven conversion from input value to native value. Parsers prepare values for the `ValueHost`; they do not update the original source object.

11. Server runs Jivs validation

* Developer chooses whether to stop now when Jivs `IssuesFound` exist, or continue into later non-Jivs checks.
* If the developer stops here, save is blocked and the workflow moves to packaging and delivery.

12. (Server) If non-Jivs checks code needs a model object, set it up.
13. Server runs other non-Jivs checks when the workflow continues
14. Server code converts native app errors from those checks to `BusinessLogicErrors`
15. If no server-side errors exist, the server attempts save.

* If save logic needs a model object and one has not yet been created, set it up
* Run save process
* If save succeeds, the error-reporting workflow ends.
* If save fails, server code converts save-time native app errors to `BusinessLogicErrors`.

16. Returned errors are packaged and reported to the client

* Jivs packager packages `IssuesFound` and `BusinessLogicErrors`
* App/server injects packaged content into the returned page data
* New page loads
* App/client retrieves and deserializes the returned page data, then gets `issuesFound` / `businessLogicErrors`
* Client calls `ModelRules.configure()` with `issuesFound` / `businessLogicErrors` in `ModelRulesConfigureOptions`
* `configure()` creates the new `ValidationManager` and reapplies the returned errors
* Client callbacks/hooks update visuals

  * If one or more returned errors are associated with fields in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors

## Workflow C: API / unknown-consumer model validation flow

1. A consumer submits model data to the server through an API or other service boundary
2. Server performs early security screening on hostile or suspicious input

   * If security screening stops the workflow outside the normal Jivs returned-error flow, the workflow ends here.
   * The developer can instead convert that outcome into a `BusinessLogicError`, continue, and include it in the returned list later.
3. Server prepares the Jivs validation runtime

   * Server-side code selects the correct model rules and creates/configures the `ValidationManager`.
   * Server-side code transfers incoming source values into the appropriate `ValueHosts`.
   * Source values may come from HTTP form fields, typed objects, or untyped objects created from JSON.
   * A helper may later support transferring values from an object or dictionary by matching `ValueHost` names to source members.
   * When incoming values are strings or otherwise need conversion before validation, parsers may be used to prepare native values for the `ValueHosts`.
   * `ValueHost.setInputValue()` already supports parser-driven conversion from input value to native value. Parsers prepare values for the `ValueHost`; they do not update the original source object.
4. Server runs Jivs validation

   * Developer chooses whether to stop now when Jivs `IssuesFound` exist, or continue into later non-Jivs checks.
   * If the developer stops here, save is blocked and the workflow moves to packaging and response reporting.
5. (Server) If non-Jivs checks code needs a model object, set it up.
6. Server runs other non-Jivs checks
7. Server code converts native app errors from those checks to `BusinessLogicErrors`
8. If no server-side errors exist, the server attempts save or completes the requested operation.

   * If save or operation logic needs a model object and one has not yet been created, set it up
   * Run save process or complete the requested operation
   * If the operation succeeds, the error-reporting workflow ends.
   * If the operation fails, server code converts save-time or operation-time native app errors to `BusinessLogicErrors`.
9. Returned errors are packaged and reported in the server response

   * Jivs packager packages `IssuesFound` and `BusinessLogicErrors`
   * App/server delivers the response in its API or service-specific format
   * The consumer may inspect, map, or otherwise consume the returned Jivs content
   * No client-side Jivs `ValidationManager` restoration step is assumed

## Workflow D: Client-side Jivs with non-Jivs server errors

1. Client creates/configures `ValidationManager` and assigned values to the ValueHosts
2. User invokes the action, such as submit
3. Client runs local validation for that action
4. Client callbacks/hooks update visuals and messages to reflect the validation results
5. Client decides whether the action can proceed

   * If validation blocks the action, the workflow stops here.
   * If one or more errored fields are in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors.
   * The user revises the values shown with errors in the UI, and the client may revalidate as needed.
   * If validation does not block the action, the workflow continues.
6. Client runs any non-Jivs validation if needed

   * If those checks need a model object, the developer may create it here.
   * If non-Jivs checks report errors that should participate in the Jivs UI flow, client-side code converts them into `BusinessLogicErrors` and applies them through `ValidationManager.setBusinessLogicErrors()`.
   * If those errors block the action, the workflow stops.
7. (Client) If submit logic needs a model object and one has not yet been created, set it up
8. Client submits data to a server or API that does not use Jivs
9. Server or API validates and reports errors in its own format

   * *The response format is owned by that server/API, not by Jivs.*
10. App/client retrieves and deserializes the returned response
11. Client-side code converts the returned server/API errors into `BusinessLogicErrors`
12. Client-side Jivs applies the converted `BusinessLogicErrors` to the existing `ValidationManager`
13. Client callbacks/hooks update visuals

    * If one or more returned errors are associated with fields in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors

## Workflow E: Client-side validation stop-before-action flow

1. Client already has a configured `ValidationManager` and assigned values to the ValueHosts
2. User invokes the action, such as submit
3. Client runs local validation for that action
4. Client callbacks/hooks update visuals and messages to reflect the validation results
5. Client decides whether the action can proceed

   * If validation blocks the action, the workflow stops here.
   * If one or more errored fields are in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors.
   * The user revises the values shown with errors in the UI, and the client may revalidate as needed.
   * If validation does not block the action, the workflow continues.
6. Client runs any non-Jivs validation if needed

   * If those checks need a model object, the developer may create it here.
   * If non-Jivs checks report errors that should participate in the Jivs UI flow, client-side code converts them into `BusinessLogicErrors` and applies them through `ValidationManager.setBusinessLogicErrors()`.
   * If those errors block the action, the workflow stops.
7. (Client) If the intended next step needs a model object and one has not yet been created, set it up
8. App/client code performs the intended next step

   * The next step may be navigation, local save, local processing, or some other application-defined action.
   * That next step is outside this workflow.

## Workflow F: Validation-group switch or handoff flow

1. Client already has a configured `ValidationManager` and setup validation group names to the appropriate valuehosts.
2. User invokes the action to switch tabs, advance to the next step, or otherwise hand off from the current step/group
3. Client runs local validation for the current validation group by calling `ValidationManager.validate(group)`
4. Client callbacks/hooks update visuals and messages to reflect the validation results for that group
5. Client decides whether the group switch or handoff can proceed

   * If validation blocks the group switch or handoff, the workflow stops here.

     * The current tab/step remains active.

     * The user revises the values shown with errors in the UI, and the client may revalidate that group as needed.
   * If validation does not block the group switch or handoff, the workflow continues.
6. App/client code performs the tab switch, step advance, or other group handoff

   * A later final action, such as submit, uses the normal client-facing submit workflow without a validation group.
   * That later final action is outside this workflow.

---

## Provisional boundaries

### Likely Jivs-engine-owned or Jivs-engine-facing

* `ValidationManager.validate()` usage in the Jivs story
* `IssuesFound`
* `BusinessLogicErrors`
* packaging Jivs-facing returned content
* applying/restoring Jivs-facing returned content into `ValidationManager`
* state preservation/restoration hooks where already supported by engine

### Possible companion-library or framework-integration territory

These are areas that may vary by React, Angular, DOM, server-rendered pages, or other app models, but may still be helped by Jivs libraries outside core engine.

Examples:

* wiring returned content into framework/page lifecycle timing
* conventions for retrieving packaged content from page bootstrapping data
* restore/apply timing relative to page or component setup
* initial value synchronization helpers
* framework-specific payload retrieval/application helpers

### Likely application-developer-owned

* transport mechanics
* HTTP handling
* how a response is returned
* where packaged content is stored on a returned page or response
* how non-Jivs response content is shaped
* conversion from app-native error types into `BusinessLogicErrors`
* save orchestration and business workflow decisions

### Possible thin adapter boundary

A narrow packaging/application helper concept may be appropriate.

One helper could package the Jivs-facing returned content.

Another helper, or a small set of helpers, could support applying or restoring that content within the appropriate app or framework flow.

This boundary should avoid expanding into:

* save orchestration
* transport abstraction
* framework lifecycle abstraction

---

## Questions this planner should help answer later

* Which workflow phases need formal helper APIs, and which should remain documented patterns?
* Should packaging/application support be separate services, one small service family, or just helper functions?
* How should initial value synchronization be described for server-rendered HTML vs client-rendered UI?
* Which parts belong in `jivs-engine` vs companion libraries or documentation examples?
* How should the planner later connect to a separate write-up on general ValidationManager state preservation/restoration, without folding that topic into the returned-error workflow?

---

## Current planning emphasis

The current emphasis should be:

1. understand the real use cases
2. show the workflow steps clearly
3. identify the true Jivs boundary objects and phases
4. avoid premature commitment to final class/interface design

This document should evolve before any formal validation-side API design is written.

---

## Perspective-case workflows

### `C-ACTN` Client action-start validation workflow

Use this workflow when the client invokes an action, such as submit or executing the process, and the client must validate before allowing that action to proceed.

1. Client already has or creates/configures `ValidationManager` and assigned values to the ValueHosts

2. User invokes the action, such as submit or executing the process

3. Client runs local validation for that action

4. Client callbacks/hooks update visuals and messages to reflect the validation results

5. Client decides whether the action can proceed

   * If validation blocks the action, the workflow stops here.
   * The user revises the values shown with errors in the UI, and the client may revalidate as needed.
   * If validation does not block the action, the workflow continues.

6. Client runs any non-Jivs validation if needed

   * If those checks need a model object, the developer may create it here.
   * If non-Jivs checks report errors that should participate in the Jivs UI flow, client-side code converts them into `BusinessLogicErrors` and applies them through `ValidationManager.setBusinessLogicErrors()`.
   * If those errors block the action, the workflow stops.

7. If the next step for that action needs a model object and one has not yet been created, set it up

8. Client invokes the next step for that action

   * The next step may be submit to server
   * The next step may be submit data to a server or API that does not use Jivs
   * The next step may be navigation, local save, local processing, or some other application-defined action

#### Derived from

This is the common client template drawn from the shared top section of:

* Workflow A
* Workflow B
* Workflow D
* Workflow E

#### Notes

This is intentionally the menu template, not a replacement for those workflows.

The workflow-specific variants begin at step 8:

* Workflow A variant: client submits to server
* Workflow B variant: client submits data to server
* Workflow D variant: client submits data to a server or API that does not use Jivs
* Workflow E variant: app/client code performs the intended next step

### `C-APLY` Client same-instance returned-error application workflow

Use this workflow when the client receives returned Jivs-facing errors and applies them to the existing `ValidationManager`.

1. `C-RETR` App/client retrieves and deserializes the broader response, then gets `issuesFound` / `businessLogicErrors`
2. `C-AERR` App/framework code applies the returned `issuesFound` / `businessLogicErrors` to the existing `ValidationManager`
3. `C-VISL` Client callbacks/hooks update visuals

   * If one or more returned errors are associated with fields in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors

#### Derived from

This is drawn from the client-side portion of:

* Workflow A

#### Notes

This is the same-instance returned-error path.

It is the client-side template used when the original `ValidationManager` is still alive after the server response is received.

### `C-RSTR` Client recreated-instance returned-error restoration workflow

Use this workflow when the client receives returned Jivs-facing errors and restores them while creating/configuring a new `ValidationManager`.

1. `C-RETR` App/client retrieves and deserializes the returned page data, then gets `issuesFound` / `businessLogicErrors`
2. Client calls `ModelRules.configure()` with `issuesFound` / `businessLogicErrors` in `ModelRulesConfigureOptions`
3. `configure()` creates the new `ValidationManager` and reapplies the returned errors
4. `C-VISL` Client callbacks/hooks update visuals

   * If one or more returned errors are associated with fields in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors

#### Derived from

This is drawn from the client-side portion of:

* Workflow B

#### Notes

This is the recreated-instance returned-error path.

It is the client-side template used when the earlier client instance no longer exists and the returned errors must be restored during creation of the new `ValidationManager`.

### `C-ADPT` Client non-Jivs returned-error adaptation workflow

Use this workflow when the client receives returned errors from a server or API that does not use Jivs, and client-side code must convert those returned errors into `BusinessLogicErrors`.

1. App/client retrieves and deserializes the returned response
2. Client-side code converts the returned server/API errors into `BusinessLogicErrors`
3. `C-AERR` Client-side Jivs applies the converted `BusinessLogicErrors` to the existing `ValidationManager`
4. `C-VISL` Client callbacks/hooks update visuals

   * If one or more returned errors are associated with fields in hidden or inactive UI regions, app/client code may reveal, activate, expand, or navigate to those regions so the user can find and correct the errors

#### Derived from

This is drawn from the client-side portion of:

* Workflow D

#### Notes

This is the client-side returned-error path used when the server or API does not use Jivs.

Step 1 intentionally does not use `C-RETR`, because this is a different retrieval case than the Jivs-facing returned-content retrieval used by `C-APLY` and `C-RSTR`.

Step 3 uses `C-AERR`, which can also be applied to step 2 of `C-APLY`, since the underlying code may be one function that accepts both `issuesFound` and `businessLogicErrors`, with `issuesFound` passed as `null` in `C-ADPT`.

### `C-GRUP` Client validation-group handoff workflow

Use this workflow when the client invokes the action to switch tabs, advance to the next step, or otherwise hand off from the current step/group, and the client must validate the current validation group before allowing that action to proceed.

1. Client already has a configured `ValidationManager` and setup validation group names to the appropriate ValueHosts.

2. User invokes the action to switch tabs, advance to the next step, or otherwise hand off from the current step/group

3. Client runs local validation for the current validation group by calling `ValidationManager.validate(group)`

4. Client callbacks/hooks update visuals and messages to reflect the validation results for that group

5. Client decides whether the group switch or handoff can proceed

   * If validation blocks the group switch or handoff, the workflow stops here.
   * The current tab/step remains active.
   * The user revises the values shown with errors in the UI, and the client may revalidate that group as needed.
   * If validation does not block the group switch or handoff, the workflow continues.

6. App/client code performs the tab switch, step advance, or other group handoff

   * A later final action, such as submit, uses the normal client-facing submit workflow without a validation group.
   * That later final action is outside this workflow.

#### Derived from

This is drawn from:

* Workflow F

#### Notes

This is the client-side workflow for validation-group-based handoff.

It is separate from `C-ACTN` because the action being gated is a tab/step/group handoff, not the final submit or process action.

### `S-JMGR` Jivs-managed server validation workflow

Use this workflow when the server uses Jivs to perform server-side validation and server-side error preparation.

1. Server receives submitted data

2. Server performs early security screening on hostile or suspicious input

   * If security screening stops the workflow outside the normal Jivs returned-error flow, the workflow ends here.
   * The developer can instead convert that outcome into a `BusinessLogicError`, continue, and include it in the returned list later.

3. Server prepares the Jivs validation runtime

   * Server-side code selects the correct model rules and creates/configures the `ValidationManager`.
   * Server-side code transfers incoming source values into the appropriate `ValueHosts`.
   * Source values may come from HTTP form fields, typed objects, or untyped objects created from JSON.
   * A helper may later support transferring values from an object or dictionary by matching `ValueHost` names to source members.
   * When incoming values are strings or otherwise need conversion before validation, parsers may be used to prepare native values for the `ValueHosts`.
   * `ValueHost.setInputValue()` already supports parser-driven conversion from input value to native value. Parsers prepare values for the `ValueHost`; they do not update the original source object.

4. Server runs Jivs validation

   * Developer chooses whether to stop now when Jivs `IssuesFound` exist, or continue into later non-Jivs checks.
   * If the developer stops here, the workflow moves to server packaging selection.

5. If non-Jivs checks code needs a model object, set it up

6. Server runs other non-Jivs checks when the workflow continues

7. Server code converts native app errors from those checks to `BusinessLogicErrors`

8. If no server-side errors exist, the server attempts save or completes the requested operation.

   * If save or operation logic needs a model object and one has not yet been created, set it up
   * Run save process or complete the requested operation
   * If the operation succeeds, the error-reporting workflow ends.
   * If the operation fails, server code converts save-time or operation-time native app errors to `BusinessLogicErrors`.

9. Server resolves the packaging strategy for the selected response path

   * Server-side code determines the packaging identifier supplied by the caller when available.
   * Server-side code applies a default packaging identifier when the caller does not supply one.
   * A factory or resolver returns the packaging implementation associated with that identifier.

10. Server invokes the selected packaging workflow

#### Derived from

This is the common server template drawn from:

* Workflow A
* Workflow B
* Workflow C

#### Notes

This is the shared Jivs-managed server workflow.

It stops at the point where Jivs-facing returned errors are ready for packaging and the packaging strategy has been selected.

Packaging and delivery are handled by the packaging workflows.

### `S-RSPN` Server response-payload packaging workflow

Use this workflow when returned Jivs-facing errors are packaged and delivered in the response.

1. `S-JPKG` Jivs packager packages `IssuesFound` and `BusinessLogicErrors`
2. App/server delivers packaged content in the response

#### Derived from

This is drawn from the packaging/reporting portion of:

* Workflow A

#### Notes

This is the response-payload server packaging path.

This workflow may be selected by a caller-supplied packaging identifier or by the default packaging selection.

It stops at delivery of the packaged content in the response.

### `S-PAGE` Server returned-page-data packaging workflow

Use this workflow when returned Jivs-facing errors are packaged and injected into the returned page data.

1. `S-JPKG` Jivs packager packages `IssuesFound` and `BusinessLogicErrors`
2. App/server injects packaged content into the returned page data

#### Derived from

This is drawn from the packaging/reporting portion of:

* Workflow B

#### Notes

This is the returned-page-data server packaging path.

This workflow may be selected by a caller-supplied packaging identifier or by the default packaging selection.

It stops at injection of the packaged content into the returned page data.

### `S-APIR` Server API/service-response packaging workflow

Use this workflow when returned Jivs-facing errors are packaged and delivered in an API or service-specific response format.

1. `S-JPKG` Jivs packager packages `IssuesFound` and `BusinessLogicErrors`
2. App/server delivers the response in its API or service-specific format

#### Derived from

This is drawn from the packaging/reporting portion of:

* Workflow C

#### Notes

This is the API/service-response server packaging path.

This workflow may be selected by a caller-supplied packaging identifier or by the default packaging selection.

It stops at delivery of the packaged content through the API or service response format.

### Packaging selection direction

The current direction is that the server should not be permanently bound to one client or consumer shape.

Instead, packaging selection should be available through a selectable strategy model.

That likely implies:

* an interface for packaging and delivery behavior
* multiple packaging implementations
* a factory or resolver that returns the implementation based on an identifier
* an identifier supplied by the caller when available
* a fallback default when the caller does not supply an identifier

The identifier should describe the target packaging contract rather than the client technology name.

# Handoff: Where we left the discussion on Packaging

### Packaging is not just formatting; it is a selected integration strategy

We initially treated packaging as a final workflow branch, but we refined that. The more accurate direction is that the server may need to support multiple packaging/integration approaches because it may serve different consumer contracts:

* same-instance browser/Jivs consumer
* recreated-instance/browser page-data consumer
* API/service consumer
* potentially non-Jivs consumers

So packaging is not merely “how do we format errors?” It is “how do we integrate Jivs-facing returned content into the broader response contract required by this caller?” This is why we split the shared server validation flow from the packaging/delivery flows. Part 2 already distinguishes a common server validation flow from separate packaging/delivery paths, and the provisional boundaries now describe packaging/application support as a possible thin adapter/helper family rather than core save orchestration or transport abstraction.

## The key packaging conclusions we reached

### 1. Packaging is a helper, not a response owner

The packager should be treated as a helper that the developer may choose to use. When not used, the documentation should describe how to apply the right use case manually. Jivs should not own the entire response or page payload. The likely thin-adapter boundary in Part 2 already supports this direction.

### 2. The packager architecture matters more than the internal payload shape right now

We decided not to prematurely engineer the exact internal shape of every packaging implementation. The current priority is the **consumption architecture**:

1. a factory
2. an identifier that tells the factory which packager to return
3. a packager API, likely a small interface with a single method designed to inject Jivs-facing returned content into a developer-owned containing object

Possible internal companion interfaces may still emerge later, but they are implementation details of particular packagers, not the center of the architecture.

### 3. The selected packaging strategy should be caller-driven when possible

The current direction is:

* the caller may supply an identifier indicating the desired packaging contract
* the server applies a default when the caller does not supply one
* a factory/resolver returns the appropriate packaging implementation

The important point is that the identifier should describe the **target packaging contract**, not a client technology name. Part 2 now reflects this packaging-selection direction and treats `S-RSPN`, `S-PAGE`, and `S-APIR` as selectable packaging paths rather than one hard-coded final branch.

### 4. Packaging implies corresponding unpackaging

We explicitly recognized that server-side packaging only makes sense if the receiving side has a corresponding retrieval/unpackaging path. That was already partly implicit in Part 1’s later use cases:

* app/client retrieves packaged content
* then reapplies it into `ValidationManager`
* either same-instance or recreated-instance depending on the workflow

The new packaging architecture should continue to assume that pairing.

### 5. “No Jivs-facing returned errors” must be treated as a supported outcome

The packaging story cannot assume that the server always has errors to send back. The packaging/use-case outcomes must support:

* no Jivs-facing returned errors
* `IssuesFound` only
* `BusinessLogicErrors` only
* both

That is important because the broader response may still contain other application-defined content even when the Jivs-facing portion is empty.

## Where we intentionally deferred decisions

We deliberately deferred these:

* final interface/class names
* exact internal shape of every packaging implementation
* the best names for any returned-error payload properties
* whether every app-native error should be adapted into `BusinessLogicErrors`
* the final factory API and packager method signatures

That is still consistent with the original planning goal: understand the use cases, show the real workflow steps, identify the true Jivs boundary objects/phases, and avoid premature commitment to final class/interface design.

## What the next chat should focus on

The next discussion should stay tightly focused on the **packaging architecture**, not the full validation story again.

The open questions to resolve next are:

1. **What is the packager API?**
   Most likely a very small interface with one method that injects Jivs-facing returned content into a developer-owned containing object.
2. **What does the factory look like?**
   How the developer asks for a packager, and whether the factory is engine-owned, companion-library-owned, or app-wired.
3. **What is the identifier model?**
   What the packaging-selection identifier represents, how it is supplied by the caller, and what the default behavior is.
4. **What are the first supported packaging strategies?**
   Likely the current three:

   * response payload
   * returned page data
   * API/service response
5. **What is the boundary between Jivs-facing returned content and the broader response object?**
   This should remain explicit so the packager helps integrate content without taking over unrelated response fields.
6. **What is the matching unpackaging story?**
   For each selected packaging strategy, what is the corresponding receiving-side retrieval/unpackaging path?
