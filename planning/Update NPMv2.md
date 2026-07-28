# NPM Package Update Plan v2

## Goal

Fix bugs and weaknesses in existing NPM packages across the monorepo. This is not an Angular upgrade project. Angular stays at 18 unless a specific bug requires moving it.

## Current baseline (as of this branch)

| Package | Current version | Location |
|---|---|---|
| typescript | ~5.5.0 | root |
| jest | ^29.7.0 | root |
| ts-jest | ^29.1.2 | root |
| jest-preset-angular | ^14.2.4 | root |
| eslint | ^8.57.0 | root |
| eslint-plugin-typescript | ^0.14.0 | root |
| @typescript-eslint/eslint-plugin | ^7.16.1 | root |
| typescript-eslint | ^7.3.1 | root |
| ng-packagr | ^18.2.1 | root (wrong location) |
| @angular/* | ^18.2.x | root (wrong location) |
| lerna | ^8.1.2 | root |
| typedoc | ^0.28.20 | root |
| gulp | ^4.0.2 | root |

## Prerequisite: Inventory what is actually outdated

Before changing anything, record the full outdated list:

```bash
npm outdated --workspaces --include-workspace-root
```

Save or screenshot the output. This is the authoritative list of what needs attention and the reference point for verifying progress.

---

## Phase 1: Wire jivs-angular to ng-packagr

**Why this comes first:** `jivs-angular` is a distributable Angular component library. It currently compiles with plain `tsc`, which produces raw TypeScript output. Angular consumers expect libraries to be compiled in *partial-Ivy* mode (Angular Package Format). The tool that produces that format is `ng-packagr`. Without this fix, any tarball produced by this package will be broken for consumers regardless of which Angular version is installed.

This is a pure build-mechanism change. No packages move, nothing is installed or removed.

### What needs to change

**1. Create `packages/jivs-angular/ng-package.json`**

This file tells ng-packagr where the entry point is and where to write output:

```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "src/public-api.ts"
  },
  "dest": "build"
}
```

**2. Create `packages/jivs-angular/tsconfig.lib.json`**

ng-packagr uses this for compilation (separate from test compilation):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declarationDir": "./build",
    "outDir": "./build",
    "inlineSources": true
  },
  "angularCompilerOptions": {
    "compilationMode": "partial"
  },
  "exclude": [
    "src/test.ts",
    "**/*.spec.ts",
    "tests/**"
  ]
}
```

**3. Update `packages/jivs-angular/package.json` build script**

Change:
```json
"compile": "tsc"
```
To:
```json
"compile": "ng-packagr -p ng-package.json",
"build": "ng-packagr -p ng-package.json"
```

ng-packagr is already in the root `node_modules` (declared in the root `package.json`). npm workspaces hoisting makes it reachable from `jivs-angular` without any install step here.

### Validation for Phase 1

```bash
# Build with ng-packagr
npm run compile --workspace packages/jivs-angular

# Inspect output — should contain .mjs files and a partial-Ivy compiled structure
dir packages/jivs-angular/build

# Dry-run pack to verify packaging
npm pack --dry-run --workspace packages/jivs-angular

# All other packages still compile
npm run compile --workspace packages/jivs-engine
npm run compile --workspace packages/jivs-builder
npm run compile --workspace packages/jivs-configanalysis
```

**Commit after Phase 1 is green.**

### Completion info
Phase 1 is complete. Here's a summary of everything that was done and why:

Files created:

- ng-package.json — tells ng-packagr the entry point and output folder
- tsconfig.lib.json — used by ng-packagr; carries forward all valid Angular compiler options from tsconfig.json and adds "compilationMode": "partial" (partial-Ivy); drops the two deprecated options (annotateForClosureCompiler, skipTemplateCodegen)

Files modified:

- package.json — compile now runs ng-packagr; added build alias; moved @plblum/jivs-engine from dependencies to peerDependencies (ng-packagr requires this); corrected types field to index.d.ts; removed stale main field
- .npmignore — added Planning to fix pre-existing leak of design docs into the tarball
- workproduct.ts — added InjectionToken + Inject to the Angular import; exported FIVASE_FORM_TOKEN; added @Inject(FIVASE_FORM_TOKEN) to the three concrete directive constructors that were injecting IFivaseForm by interface type (a real bug that plain tsc was masking)

Result: ng-packagr builds successfully, produces proper partial-Ivy ESM output, and the tarball is clean.
---

## Phase 2: Move Angular dependencies to jivs-angular

**Why this is separate from Phase 1:** In an npm workspaces monorepo, packages declared anywhere in the tree are hoisted to the root `node_modules`. Angular packages declared in the root are fully accessible to `jivs-angular` during build and test — so Phase 1 works correctly without moving anything. This phase is about *correctness of the published manifest*, not about making builds work.

When `jivs-angular` is packed and published, its `package.json` is what consumers see. Any Angular devDependencies that only exist in the root won't appear in the published package manifest. Moving them ensures the published package accurately declares its requirements.

**Will a local node_modules appear in jivs-angular?** Almost certainly no. npm workspaces only creates a local `node_modules` inside a workspace package when there is a version conflict that prevents hoisting. Since the versions being moved are the same ones already in the root, they stay hoisted at the root after the move.

### What needs to change

**Remove from root `package.json`:**
- `dependencies`: `@angular/forms`, `@angular/router`
- `devDependencies`: `@angular-devkit/build-angular`, `@angular/animations`, `@angular/compiler`, `@angular/compiler-cli`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `ng-packagr`, `jest-preset-angular`
- `peerDependencies`: `@angular/common`, `@angular/core`

**Add to `packages/jivs-angular/package.json` via workspace install:**
```bash
npm install --save-dev \
  @angular/common@^18.2.5 \
  @angular/compiler@^18.2.5 \
  @angular/compiler-cli@^18.2.5 \
  @angular/core@^18.2.5 \
  @angular/forms@^18.2.5 \
  @angular/platform-browser@^18.2.5 \
  ng-packagr@^18.2.1 \
  jest-preset-angular@^14.2.4 \
  --workspace packages/jivs-angular
```

`jivs-angular/package.json` already declares `@angular/common` and `@angular/core` as `peerDependencies` — that entry stays and does not need to be added.

### Validation for Phase 2

```bash
# Verify no local node_modules was created
Test-Path packages/jivs-angular/node_modules

# Angular library still builds
npm run compile --workspace packages/jivs-angular

# Pack still works
npm pack --dry-run --workspace packages/jivs-angular

# All other packages still compile (confirm root removal didn't break anything)
npm run compile --workspace packages/jivs-engine
npm run compile --workspace packages/jivs-builder
npm run compile --workspace packages/jivs-configanalysis
```

**Commit after Phase 2 is green.**

### Completion info
Phase 2 is complete. Summary of changes:

Root package.json:

- dependencies: removed @angular/forms, @angular/router (unused — not imported anywhere in jivs-angular source)
- devDependencies: removed @angular-devkit/build-angular, @angular/animations, @angular/compiler, @angular/compiler-cli, @angular/platform-browser, @angular/platform-browser-dynamic, ng-packagr, jest-preset-angular
- peerDependencies: removed entire section (the root package is not published)

jivs-angular/package.json:

- Added devDependencies: @angular/common, @angular/compiler, @angular/compiler-cli, @angular/core, jest-preset-angular, ng-packagr

Result: 526 transitive packages cleaned from node_modules (from the removed Angular packages that were never needed), no local node_modules conflict in jivs-angular, build and pack still clean.

---

## Phase 3: TypeScript patch update

TypeScript 5.5 is the current baseline. A meaningful version bump (5.6+) is blocked by Angular 18's `@angular/compiler-cli`, which caps TypeScript at ~5.5. Because TypeScript is installed at the root and hoisted to a single `node_modules`, all packages — including jivs-angular's ng-packagr build — share the same TypeScript binary. Installing a newer TypeScript for only the non-Angular packages would require creating a version conflict and a local `node_modules` in jivs-angular, which is fragile and not worth it here.

The scope of this phase is limited to applying the latest 5.5.x patch release:

```bash
npm update typescript
```

The existing `~5.5.0` constraint in the root `package.json` already restricts this to patch-level updates within 5.5.x, so no version specifier change is needed. Confirm the installed version afterward:

```bash
npm ls typescript
```

A full TypeScript version upgrade (5.6+) is deferred to the Angular upgrade project described at the end of this document. Each Angular major step will include a coordinated TypeScript bump within that Angular major's supported range.

### Validation for Phase 3

```bash
# All packages compile
tsc -p packages/jivs-engine/tsconfig.json
tsc -p packages/jivs-engine/tsconfig_with_tests.json
tsc -p packages/jivs-builder/tsconfig.json
tsc -p packages/jivs-configanalysis/tsconfig.json

# Angular library still builds
npm run compile --workspace packages/jivs-angular
```

**Commit after Phase 3 is green.**

---

## Phase 4: ESLint and typescript-eslint upgrade

### Remove `eslint-plugin-typescript` immediately

```bash
npm uninstall eslint-plugin-typescript
```

This package (v0.14.0) is abandoned and has been superseded by `@typescript-eslint/eslint-plugin` for years. It should not appear in the install at all. Verify nothing in `eslintrc.js` or any package's `eslintConfig` references it before removing.

### ESLint 8 → 9 consideration

ESLint 9 switched to a flat config format (`eslint.config.js` instead of `.eslintrc.*`). ESLint 8 reached end-of-life in 2024. The migration involves:

1. Converting `eslintrc.js` at the root to `eslint.config.js`
2. Verifying `@typescript-eslint` v8 is used (v7 supports both config formats)

The `typescript-eslint` package at the root (`^7.3.1`) vs `@typescript-eslint/eslint-plugin` (`^7.16.1`) is a redundancy — `typescript-eslint` is the unified modern package. After removing `eslint-plugin-typescript`, align on one of them based on what `eslintrc.js` actually uses.

### Suggested upgrade targets

```bash
npm install --save-dev eslint@latest typescript-eslint@latest
```

Do not attempt ESLint config migration and Angular build fixes at the same time. ESLint changes only need to green-light the lint pass, not affect tsc or Jest.

### Validation for Phase 4

```bash
npx eslint packages/jivs-engine/src --ext .ts
npx eslint packages/jivs-angular/src --ext .ts
```

**Commit after Phase 4 is green.**

---

## Phase 5: Jest and ts-jest upgrade

### Known compatibility constraint

The repo uses `"type": "module"` at the root, so Jest runs in ESM mode. This is already configured in `jest.config.json` with `useESM: true`. Any Jest version change must preserve ESM support.

Key compatibility pairing to verify before upgrading:

| jest | ts-jest | Notes |
|---|---|---|
| 29.x | 29.x | Current, known working |
| 30.x | 29.x | ts-jest 29 claims Jest 30 support as of ts-jest 29.4+ |

Do not change jest and ts-jest independently. Treat them as one unit.

`jest-preset-angular` is Angular-specific and is now in `jivs-angular` after Phase 2. The root `jest.config.json` does not use it, so the root test run is unaffected.

### Upgrade steps

```bash
# Root-level jest upgrade (non-Angular packages)
npm install --save-dev jest@latest ts-jest@latest @types/jest@latest jest-environment-jsdom@latest

# Separately, update jest-preset-angular in jivs-angular after confirming jest version
npm install --save-dev jest-preset-angular@latest --workspace packages/jivs-angular
```

Check the `jest-preset-angular` changelog to confirm it supports the chosen Jest version.

### Validation for Phase 5

```bash
# Non-Angular tests
npm test --workspace packages/jivs-engine
npm test --workspace packages/jivs-builder
npm test --workspace packages/jivs-configanalysis

# Angular tests separately
npm test --workspace packages/jivs-angular
```

**Commit after Phase 5 is green.**

---

## Phase 6: Remaining toolchain packages

Once the above phases are stable, update remaining packages with fewer interdependencies:

- **lerna**: `npm install --save-dev lerna@latest` — check changelog for breaking lerna.json schema changes
- **typedoc** and its plugins: update together since they version-lock to each other
- **gulp**: v4 → v5 has breaking API changes in task syntax; inspect `gulpfile.mjs` at root and in each package before upgrading
- **prettier** / **prettier-eslint**: low risk, update together

### Validation for Phase 6

```bash
# Typedoc
npm run typedoc

# Gulp (for each package that uses it)
npx gulp clean --prefix packages/jivs-engine

# Lerna orchestration
npx lerna run compile
```

---

## Phase 7: Root script cleanup (optional, low priority)

The root `package.json` scripts use manual `npm --prefix` chains:

```json
"prebumpversion": "npm --prefix ./packages/jivs-engine run compile && npm --prefix ./packages/jivs-builder run compile && ..."
```

This is fragile — adding or removing a package requires manual edits to every pre-script. Replace with Lerna-orchestrated equivalents. Lerna already knows the dependency graph (jivs-builder depends on jivs-engine, etc.) and can order tasks correctly automatically.

Proposed root scripts:

```json
{
  "scripts": {
    "compile": "lerna run compile",
    "test": "lerna run test",
    "clean": "lerna run clean",
    "bumpversion": "lerna version --no-private",
    "publish_library": "lerna publish --no-private",
    "retry_publish": "lerna publish from-package"
  }
}
```

Each package already has its own `compile`, `test`, and `clean` scripts. The pre-script hooks become unnecessary once Lerna handles ordering via its dependency graph.

This is a housekeeping step with no functional impact on the upgrade goal. Do it last.

---

## Angular version ceiling note and future upgrade project

**Angular 18 is end-of-life.** As of mid-2026, only Angular v20 (LTS), v21 (LTS), and v22 (Active) receive security patches and bug fixes. Angular 18 and 19 are no longer supported. Staying on Angular 18 means the Angular packages themselves receive no fixes.

This also constrains TypeScript: Angular 18 caps TypeScript at ~5.5, which blocks Phase 3 from being a meaningful upgrade. A real TypeScript jump (5.6+) requires upgrading Angular first.

Angular upgrade is a separate follow-on project, to begin after this document's phases are complete and committed. It should not be mixed into the current work.

### Angular upgrade path

Angular requires stepping one major at a time. Each step must be committed before the next:

```
Step 1: Angular 19  (TypeScript ~5.5–5.7, ng-packagr 19)
Step 2: Angular 20  (TypeScript ~5.7–5.8, ng-packagr 20)  ← minimum to reach LTS
Step 3: Angular 21  (TypeScript ~5.8+,    ng-packagr 21)
Step 4: Angular 22  (TypeScript ~5.8+,    ng-packagr 22)  ← current active
```

For each step:
1. Update every `@angular/*` devDependency in `jivs-angular/package.json` to the target major.
2. Update `ng-packagr` to match the Angular major.
3. Update `typescript` at the root to a version within that Angular major's supported range.
4. Build the library: `npm run compile --workspace packages/jivs-angular`
5. Run all tests.
6. Commit before the next step.

Angular 20 is the minimum viable target (oldest LTS). Angular 22 gives the most runway before the next EOL cycle.

This repo does not use Angular CLI, so `ng update` does not apply. Each step is a manual coordinated install.
