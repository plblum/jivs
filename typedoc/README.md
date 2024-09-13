TypeDoc output is generated upon merging with the main branch and deployed to [jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc/).

> Github action used: .github\workflows\github-action-typedoc.yml

To manually build:
1. In a terminal that can run npm, go to the jivs root folder.
2. Run `npx typedoc`
3. Output is in the typedoc-output folder. This folder is temporary and never stored in the repo.
4. Open the index.html file to view.