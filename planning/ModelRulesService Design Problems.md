# Model Rules Design Problems

**Version:** 0.1
**Status:** Working Draft
**Scope:** Problem statement and planning notes for reworking `ModelRulesService Design.md` into separate configuration-side and validation-side design documents.

---

## 1. Purpose

This document captures the main problems discovered while working through the original `ModelRulesService Design.md`.

It exists to guide future design work.

It is not intended to be the final design document.

Its job is to record:

* what we learned from the earlier design attempt
* where the earlier design mixed too many concerns together
* why the work is being split into separate documents
* what the next detailed documents need to solve

This document should be read together with the Overview document.

The Overview establishes cross-cutting architecture and use cases.

This Problems document explains why the earlier single-document design is being reworked.

---

## 2. Current Planning Direction

The earlier `ModelRulesService Design.md` attempted to describe both:

* configuration
* validation and save workflow

inside one main abstraction.

That has proven too compressed.

The current planning direction is to split that work into separate design documents.

At minimum, those new documents are expected to cover:

* configuration
* validation and save workflow

The expectation is that the original `ModelRulesService Design.md` will be reworked into those new documents rather than simply extended in place.

---

## 3. Core Problem Discovered

The original design tried to make one service abstraction carry too much responsibility.

It attempted to package:

* configuration through Builder
* `ValidationManager` creation
* Jivs validation orchestration
* additional business validation work
* business-error application
* final validation-state retrieval

That sounds attractive at first, but the deeper use cases show that configuration and validation workflow are not the same kind of problem.

Configuration has a strong shared-code story.

Validation and save workflow depends much more on environment and phase.

That mismatch is the main reason the earlier design now needs to be split.

---

## 4. Why Configuration and Validation Cannot Be Treated as One Thing

### 4.1 Configuration has a strong Single Source of Truth story

Configuration is the part most likely to be authored once and reused.

Examples:

* Business-owned ValueHosts
* Business-owned validators
* Cross-field rules
* Shared configuration variants
* UI extension of shared configuration
* Client-authored formal model rules when no business-owned source exists

This is the area where shared code across client and server makes the most architectural sense.

### 4.2 Validation workflow is environment-specific

Validation workflow is not one single portable activity.

It includes multiple phases that may run in different environments.

Examples:

* Client-side Jivs validation
* Client-side auxiliary checks
* Server-side Jivs validation
* Server-side hidden security checks
* Server-side pre-save business checks
* Post-save failure handling
* Returning server errors to the client
* Reapplying returned errors into `ValidationManager`

These are related, but they are not the same kind of work.

That is why a single “validate everything” method is not a good fit for the whole workflow.

---

## 5. What Was Wrong with the Earlier Validation-Side Design

A major discovery was that the earlier `validate()` story was wrong in more than one way.

### 5.1 It compressed too many phases into one method

The earlier design centered too much on a service method that would:

* run Jivs validation
* possibly run additional business validation
* apply business errors
* return final validation state

That makes the workflow look simpler than it really is.

In practice, the full system includes:

* client-side Jivs validation
* optional client-side augmentation checks
* server-side Jivs validation
* server-side security checks
* server-side pre-save business checks
* save-time failure handling
* server response handling back on the client

Those should not all be treated as one validation phase.

### 5.2 It treated server-only checks as if they belonged in a portable shared object

The earlier design placed too much emphasis on `validateBusinessRules()` inside the same service abstraction that was also intended to be shared with the client.

That breaks down once server-only logic is considered.

Examples of server-only logic:

* Injection attack detection
* Hidden security checks
* Database duplicate checks
* Repository lookups
* External service checks

Those are not safe or appropriate to expose to the client.

So the earlier design made the service too tied to server-only behavior to remain fully portable.

### 5.3 It blurred pre-save checks and post-save failures

Some errors happen before save.

Some errors happen during or after save.

The earlier design did not keep those phases separate enough.

That matters because save failures are not simply another kind of validator result.

They are their own part of the workflow and often arrive back at the client as `BusinessLogicErrors`.

---

## 6. Important Workflow Conclusions

The current planning assumes the following workflow conclusions.

### 6.1 Client-side Jivs validation remains central

On the client, `ValidationManager.validate()` remains the main Jivs validation step after editing is complete.

That produces:

* `ValidationState`
* `IssuesFound`

### 6.2 Server-side Jivs validation is also central

On the server, `ValidationManager.validate()` must also run against the applicable model rules.

The server cannot trust the client.

That server-side Jivs validation also produces:

* `ValidationState`
* `IssuesFound`

Those `IssuesFound` may be part of the server response.

### 6.3 A server response may contain either or both error types

The client may receive:

* `IssuesFound`
* `BusinessLogicErrors`
* or both

That is a normal outcome, not an edge case.

### 6.4 Returned server errors must fit back into the Jivs-driven UI story

After save is attempted, returned errors may need to be pushed back into `ValidationManager` so Jivs-connected UI components update consistently.

That means the design must treat server-response error application as a first-class workflow concern.

---

## 7. What Was Wrong with the Earlier Configuration Story

The earlier design also exposed problems on the configuration side.

### 7.1 The fallback `AnyModelRulesService` story was not sufficient

The earlier design used a fallback idea for unknown model identifiers.

That approach was abandoned.

The current direction is that unknown identifiers should be treated as errors rather than silently mapped to a default fallback service.

### 7.2 UI-only configuration still needs a strong story

UI-only validation targets are real and important.

Examples:

* Login
* Search
* Filter
* Wizard step

Those screens may still need reusable, testable model-rules code.

They are not just ad hoc page code.

### 7.3 UI extension of shared business-authored rules must be first-class

One of the most important use cases is:

* business logic defines shared model rules
* the server uses those rules authoritatively
* the client uses those same rules unchanged or extends them

The UI needs a way to extend those shared rules without editing the business-owned source directly.

That requirement must drive the configuration-side design.

---

## 8. Split Being Considered

The planning direction discussed earlier was to split the earlier service concept so that configuration and validation do not live in one object.

At a high level, the idea is:

* a configuration-side abstraction
* a separate validation/workflow-side abstraction

This document does not finalize names or interfaces.

It only records that the split is the current planning direction because the earlier single-service design was mixing responsibilities that do not belong together.

---

## 9. What the Configuration Document Will Need to Solve

The future configuration-side design document will likely need to answer questions such as:

* What is the configuration-side abstraction?
* How is shared business-authored configuration represented?
* How does the client use that shared configuration unchanged?
* How does the UI extend shared business-authored configuration?
* How do client-authored model rules fit when no business-owned source exists?
* How should factories resolve the correct configuration object or class?
* How should model identity and form/presentation identity relate?
* How should config analysis integrate without coupling `jivs-engine` to `jivs-configanalysis`?

---

## 10. What the Validation Document Will Need to Solve

The future validation-side design document will likely need to answer questions such as:

* What exactly counts as Jivs validation versus non-Jivs validation work?
* Which validation phases run on the client?
* Which validation phases run on the server?
* How should hidden security checks be represented?
* How should pre-save business checks be represented?
* How should save failures be represented?
* How should `IssuesFound` and `BusinessLogicErrors` move from server to client?
* What helper APIs, if any, should exist for pushing returned server errors back into `ValidationManager`?

---

## 11. Relationship to the Overview Document

The Overview document is the cross-cutting guardrail document.

It describes:

* the use cases
* the major workflow parts
* the client/server responsibilities
* the difference between `IssuesFound` and `BusinessLogicError`
* the difference between shared configuration and environment-specific execution

This Problems document is narrower.

It explains why the original unified `ModelRulesService Design.md` is being broken apart into more focused design documents.

---

## 12. Planning Guardrails for Future Chats

Until later detailed documents settle the implementation, future work should keep the following planning guardrails in mind.

* Do not recombine shared configuration and the full validation/save lifecycle into one abstraction too casually.
* Do not assume that server-only security checks belong in a client-shared model-rules object.
* Do not assume that post-save failures are just another validator result.
* Do not weaken the shared-configuration story just because the validation workflow has to be split.
* Do preserve the central role of `ValidationManager.validate()` on both client and server.
* Do preserve the possibility of returning either or both `IssuesFound` and `BusinessLogicErrors` from the server.
* Do preserve support for shared business-authored rules, UI extension of those rules, and client-authored model rules.

---

## 13. Summary

This document records the current planning state:

* the earlier `ModelRulesService Design.md` mixed configuration and validation workflow too tightly
* configuration still has a strong shared-code and Single Source of Truth story
* validation and save workflow is phase-based and environment-specific
* server-side Jivs validation remains central and may return `IssuesFound`
* server-only checks and save failures should not be forced into the same portable object as shared configuration
* the design work is being split into separate configuration-side and validation-side documents

This document should help future chats start from the current planning state instead of rediscovering these problems.
