# Angular Library Major-Version Upgrade Runbook

Use this checklist when upgrading `jivs-angular` to a new Angular major version.

## Context

`jivs-angular` is an npm package containing Angular components. It is **not** an Angular CLI workspace and has no `angular.json`.

Therefore:

```text
Do not use ng update.

Upgrade through:
package.json
→ npm workspace resolution
→ compile
→ test
→ validate monorepo
```

## 1. Create an upgrade branch

From the monorepo root:

```powershell
cd C:\Code\Jivs-Suite\jivs
git checkout -b upgrade/angular-XX
```

## 2. Update the current Angular major first

Before changing majors, update the current Angular version to its latest patch and verify:

```powershell
cd C:\Code\Jivs-Suite\jivs\packages\jivs-angular
npm run compile
```

Start the major upgrade only from a working build.

## 3. Update `jivs-angular/package.json`

Angular runtime packages belong in `peerDependencies` because the consuming application supplies Angular.

They may also appear in `devDependencies` so `jivs-angular` can build and test locally.

Example when targeting Angular 19:

```json
{
  "peerDependencies": {
    "@angular/animations": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/router": "^19.0.0"
  },
  "devDependencies": {
    "@angular/animations": "19.2.25",
    "@angular/common": "19.2.25",
    "@angular/compiler": "19.2.25",
    "@angular/compiler-cli": "19.2.25",
    "@angular/core": "19.2.25",
    "@angular/forms": "19.2.25",
    "@angular/platform-browser": "19.2.25",
    "@angular/platform-browser-dynamic": "19.2.25",
    "@angular/router": "19.2.25",
    "ng-packagr": "^19",
    "jest-preset-angular": "^15"
  }
}
```

Upgrade the Angular packages, `ng-packagr`, and `jest-preset-angular` as one compatible set.

Do **not** install individual Angular packages one at a time.

## 4. Install from the monorepo root

After editing `package.json`:

```powershell
cd C:\Code\Jivs-Suite\jivs
npm install
```

Do not run the major-version install from inside `jivs-angular`.

## 5. If npm cannot resolve the old dependency graph

First try to keep `package-lock.json`.

If `npm install` continues producing conflicts from the previous Angular version, regenerate the lockfile:

```powershell
cd C:\Code\Jivs-Suite\jivs
Remove-Item package-lock.json
npm install
```

If necessary, perform a complete reset:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

Commit the regenerated lockfile as part of the upgrade.

## 6. Verify Angular dependency resolution

From the monorepo root:

```powershell
npm ls `
  @angular/core `
  @angular/common `
  @angular/compiler `
  @angular/compiler-cli `
  @angular/animations `
  @angular/forms `
  @angular/platform-browser `
  ng-packagr `
  jest-preset-angular
```

Verify that the `jivs-angular` dependency branch contains one consistent Angular version and compatible build/test tooling.

For the Angular 19 upgrade, the successful set was:

```text
Angular                19.2.25
ng-packagr             19.2.2
jest-preset-angular    15.0.3
```

## 7. Compile the Angular library

```powershell
cd C:\Code\Jivs-Suite\jivs\packages\jivs-angular
npm run compile
```

Do not continue until this succeeds.

## 8. Run the library tests

```powershell
npm test
```

If the package intentionally has no tests, Jest's:

```text
No tests found, exiting with code 1
```

does not indicate an Angular upgrade problem.

If desired:

```json
{
  "scripts": {
    "test": "jest --silent --passWithNoTests"
  }
}
```

## 9. Validate the complete monorepo

Return to the root:

```powershell
cd C:\Code\Jivs-Suite\jivs

npm test
npm dedupe
npm audit
```

Investigate any regressions before continuing.

## 10. Update TypeScript last

Only update TypeScript after Angular, `ng-packagr`, and the tests are working.

Determine the newest TypeScript release supported by the target Angular version and install that version from the monorepo root.

Example for Angular 19.2.x:

```powershell
npm install --save-dev typescript@5.8.3
```

Then verify:

```powershell
npm ls typescript
npx tsc --version
npm run compile
npm test
```

## Upgrade Checklist

```text
[ ] Create upgrade branch
[ ] Bring current Angular major to latest patch
[ ] Confirm existing build succeeds

[ ] Update Angular peerDependencies
[ ] Update Angular devDependencies
[ ] Update ng-packagr
[ ] Update jest-preset-angular

[ ] npm install from monorepo root
[ ] Regenerate lockfile only if necessary
[ ] Verify dependency tree with npm ls

[ ] Compile jivs-angular
[ ] Test jivs-angular
[ ] Test complete monorepo
[ ] npm dedupe
[ ] npm audit

[ ] Update TypeScript to newest Angular-supported version
[ ] Compile again
[ ] Test again
```

## Rule of Thumb

```text
packages/jivs-angular
    package definitions
    Angular library compilation

monorepo root
    npm install
    package-lock.json
    dependency resolution
    dedupe
    audit
    full test suite
```

For a non-CLI Angular component library, a major upgrade is primarily a **dependency-graph upgrade**, not an Angular workspace migration.
