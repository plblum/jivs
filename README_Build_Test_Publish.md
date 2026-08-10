# Jivs Build & Publish Quick Reference

Starting within Terminal at the workspace root ('jivs').

* Switch to Jivs-engine: 
    ```bash
    cd packages/jivs-engine
    cd ../../packages/jivs-engine
    ```
* Switch to Jivs-angular: 
    ```bash
    cd packages/jivs-angular
    cd ../../packages/jivs-angular
    ```
* Switch to Jivs-react: 
    ```bash
    cd packages/jivs-react
    cd ../../packages/jivs-react
    ```
* Switch to Jivs-configanalysis: 
    ```bash
    cd packages/jivs-configanalysis
    cd ../../packages/jivs-configanalysis
    ```
* Switch to Jivs-builder: 
    ```bash
    cd packages/jivs-builder
    cd ../../packages/jivs-builder
    ```

## 🔨 Compile

### Entire Workspace
```bash
cd /<root>
npm run compile
```

### Individual Package
```bash
cd packages/<package-name>
npm run compile
```

### Also compile tests but not run
```bash
tsc -p tsconfig_with_tests.json
```

## 🧪 Test
Tests can be run locally and during the github push and PR process.

### Locally

#### Entire Workspace (from root)
```bash
npm run test           # All tests with output
npm run consoletest    # Silent tests, no console output
```

#### Individual Package
```bash
cd packages/<package-name>
npm run test           # Tests with output
npm run consoletest    # Silent tests
```

### On Git Push and PR
Pushes and PRs will run this github action to completely test:
```
github-action-tests.yml
```
## 🧹 Clean

### Entire Workspace (from root)
```bash
npm run clean          # or: gulp clean
```

### Individual Package
```bash
cd packages/<package-name>
npm run clean          # or: gulp clean
```

## 📦 Publish to NPM
NPM is not updated from github merges. You must run it manually.
The resulting libraries are published here: https://www.npmjs.com/settings/plblum/packages

This can be done both from github actions and locally. 
In either case, it is run manually.

### On Github
- Recommend only publishing from the main branch
- Recommend updating CHANGELOG.md and determining the next version in this document first.
- Go to Actions. Run this workflow:
    ```
    github-action-publish-to-npm.yml
    ```
    You will be prompted to select the next version number by selecting major, minor, or patch.
- After publishing, the main branch will have a fresh commit containing the bumped version info.
  Be sure to merge it into the working branch.
    
### Locally    
```bash
cd /<root>
npm run bumpversion        # Bump version across all packages (uses lerna)
npm run publish_library    # Publish to npm (uses lerna)
npm run retry_publish      # Retry if publish fails
```

### Updating access tokens
Granular access tokens are currently managed under the plblum account.
They must be read/write and currently expire after 90 days.

1. Create and capture the token here: [https://www.npmjs.com/settings/plblum/tokens/]
2. Save the token like this:
    ```bash
    npm set //registry.npmjs.org/:_authToken=<YOUR_TOKEN>
    ```

## 📚 TypeDoc Documentation
Documentation can be generated locally and automatically from a github action.
Documentation is deployed to [http://jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc) when merging a PR into Master.

### Locally - use to review content
Note that the content is never part of your repository. The github action creates a fresh copy
and deploys to http://jivs.peterblum.com/typedoc. 

```bash
cd /<root>
npm run typedoc           # Generate API documentation
```

### In Github
The github action is:
```
github-action-typedoc.yml
```
It builds the content and sends it to http://jivs.peterblum.com/typedoc.

## 📝 Notes

- This is a Lerna monorepo with packages in `packages/*`
- All packages depend on `@plblum/jivs-engine`
- Packages: jivs-engine, jivs-builder, jivs-configanalysis, jivs-examples, jivs-angular, jivs-react
- TypeScript compilation uses `tsc` command
- Tests use Jest


## TypeScript circular dependencies
We use the npm package madge to call out circular dependencies.
```bash
npx madge --circular --extensions ts ./src
```