This worksheet will be transformed into ideas for the Jivs-dom module.

# Brain dump
- Jivs-dom is a stand-alone package that focuses on using Jivs within a DOM user interface.
- It expands upon the Jivs-SimpleDOM work in /starter_code/jivs-simpledom.ts and documented in /docs/LearningJivs
- We may migrate these files from starter_code into jivs-dom package: jivs-DOM_Helpers.ts, jivs-simpledom.ts, jivs-simpledom.css (also requires updating the LearningJivs doc references)
- Needs at least two actual "packages": the npm package jivs-dom and a website that demonstrates it in operation. jest testing for jivs-dom is part of the jivs-dom package. The website is designed for end-user exploration and learning.
- It is possible that we actually have jivs-dom and jivs-simpledom separate. jivs-dom starts from jivs-DOM_Helpers.ts and is code that can be used even when building a UI without jivs-simpleDOM approach. Not sure. Both projects could be very light and harmless to keep together.
- We should explore that workproduct.ts file of jivs-angular. It attempted to do the same for Angular. It likely will be overhauled, both to update to recent Angular and to consume jivs-dom for some of its work. That is out of scope for this planning. The point is workproduct.ts should give some ideas to what features we'll offer in jivs-simpledom.
- Note that jivs-simpleDom will change. It will be formalized. Up to now, we needed it to offer training via Learning Jivs. Yet its likely a sustainable pattern. We may radically alter it too. Nobody is using this codebase yet.