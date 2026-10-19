# Copilot instructions for Jivs

## Writing or modifying unit tests (any package)
Before writing, changing, or reviewing any unit test, read `planning/Testing_Approach.md` and follow it. It defines the owner's ground rules (one class at a time, `expect()` with Jest 30, near-full coverage with edge cases, mandatory logging assertions, teaching-oriented comments), the test layout, mocking style (hand-written fakes and `Publicify_` subclasses, not `jest.fn`), and a jsdom/event primer for jivs-dom.

Tests run with Jest; run jivs-dom tests from `packages/jivs-dom`. Packages import jivs-engine through `@plblum/jivs-engine/build/...`, so the repo must be compiled (`npm run compile` at the root) first.
