# Jivs Umbrella Package and Installation

## Purpose

Create `@plblum/jivs` as the normal starting package for a Jivs application,
while preserving the existing packages for focused use and direct development.
Update the installation documentation and package READMEs so GitHub and npm
serve different purposes without contradicting one another.

## Decisions

- The root workspace package is `@plblum/jivs-repository` and remains private.
- The public umbrella package is `@plblum/jivs` in `packages/jivs/`.
- `@plblum/jivs` is initially a meta-package only. It does not re-export APIs.
- `@plblum/jivs` depends on `@plblum/jivs-engine` and `@plblum/jivs-builder`.
- Published sibling dependencies use caret ranges, matching the current npm
  packages, such as `^0.22.1`.
- `@plblum/jivs-configanalysis` remains a separate development-only install.
- The initial application setup is:

  ```text
  npm install @plblum/jivs
  npm install --save-dev @plblum/jivs-configanalysis
  ```

- The starter file is included in the umbrella package at:

  ```text
  @plblum/jivs/starter_code/create_JivsServices.ts
  ```

- The repository-level `starter_code/create_JivsServices.ts` file is the single
  source of truth. A package `prepack` script copies it into the umbrella
  package immediately before npm creates the packed artifact.
- `create_JivsServices.ts` continues to import directly from
  `@plblum/jivs-engine` and `@plblum/jivs-builder`.
- Documentation links to the GitHub `main` branch using `blob` URLs for the
  starter file. It does not use version-specific URLs.
- The existing engine, builder, and ConfigAnalysis packages remain published
  with their own npm README pages. Each specialized README points general
  application users to `@plblum/jivs`.
- DOM, Angular, and React package relationships remain deferred until those
  packages are ready for design decisions.

## Package layout

Add a publishable package with the existing Lerna package layout:

```text
packages/
  jivs/
    package.json
    README.md
    scripts/
      copy-starter-file.mjs
    .gitignore
    starter_code/
      create_JivsServices.ts
```

The root workspace remains responsible for repository-wide scripts, workspaces,
development dependencies, compilation, tests, TypeDoc, versioning, and npm
publishing. It must not become the public umbrella package.

The umbrella package should have its own package metadata, including:

- `name: "@plblum/jivs"`
- an initial `version` matching the fixed Lerna version, such as `0.22.1`
- the current repository and license metadata
- `publishConfig.access: "public"`
- dependencies on engine and builder using published caret ranges
- an explicit `files` list that includes `README.md` and `starter_code/`
- package contents that include `starter_code/create_JivsServices.ts`
- an npm-focused README

The starter file must be included in the packed artifact, not merely present in
the repository. Keep the repository-level
`starter_code/create_JivsServices.ts` file as the only editable source. Add a
Node-based `prepack` script for `packages/jivs` that copies it into the package
staging path:

```text
root/starter_code/create_JivsServices.ts
   -> packages/jivs/starter_code/create_JivsServices.ts
   -> npm pack / npm publish
```

The generated package-local file must not become a second source to edit. The
`prepack` script runs before npm creates the tarball, both for local packaging
and when Lerna publishes the package. Verify the generated file with
`npm pack --dry-run` and do not publish if the starter file is missing or stale.

Add a `postpack` cleanup step to remove the generated package-local starter
file after npm creates the artifact. Also add `packages/jivs/.gitignore` as a
fallback for files accidentally left behind:

```gitignore
starter_code/create_JivsServices.ts
*.tgz
```

The package must define an explicit `files` list containing `README.md` and
`starter_code/`. This ensures the generated starter file is included in the
npm artifact even though Git ignores the generated working-tree copy. The
`.gitignore` is only a fallback; cleanup and package-content validation remain
the primary safeguards.

Create `packages/jivs/scripts/copy-starter-file.mjs` as part of this work. It
must copy:

```text
../../../starter_code/create_JivsServices.ts
```

to:

```text
../starter_code/create_JivsServices.ts
```

using paths resolved from the script location, so the process works regardless
of the caller's current directory. It should create the destination directory
if needed and fail with a nonzero exit code when the source file is missing.

## Documentation design

### Root GitHub README

Keep the root `README.md` as the GitHub project landing page. It should retain
a concise installation section, but change the normal application install from
`@plblum/jivs-engine` to:

```text
npm install @plblum/jivs
npm install --save-dev @plblum/jivs-configanalysis
```

Explain briefly that the umbrella installs the engine and Builder API, while
ConfigAnalysis is the development diagnostic tool. Link to the detailed
installation guide and the GitHub starter file.

### Detailed installation guide

Keep `docs/Installing_Jivs.md` as the canonical detailed installation guide.
Update it to:

- install `@plblum/jivs`;
- install `@plblum/jivs-configanalysis` as a development dependency;
- explain that the umbrella includes engine and builder;
- explain that the starter file is available in the installed package's
  `starter_code` folder and on GitHub;
- preserve the established guidance that references to
  `create_JivsServices.ts` mean the user's copy in their application;
- show `createJivsServices()` only as the function defined by that file;
- link to `JivsServices` for later configuration details.

Do not introduce UI package installation yet.

### Umbrella npm README

Create `packages/jivs/README.md` for npm consumers. Do not treat it as a copy
of the root GitHub README. Use the existing `packages/jivs-engine/README.md`
as the primary source for the general Jivs introduction and marketing content;
it was already written for an npm package audience. Adapt that content to the
umbrella package, then make the installation and first-use guidance specific to
`@plblum/jivs`.

It should be short and task-oriented:

1. Identify `@plblum/jivs` as the normal Jivs application starting point.
2. Show the two installation commands.
3. Explain the roles of the umbrella and ConfigAnalysis packages.
4. Tell the reader to copy `starter_code/create_JivsServices.ts` from the
   installed package or use the GitHub `blob/main` link.
5. Link to the repository documentation and JivsServices guidance.
6. Mention the specialized engine, builder, and ConfigAnalysis packages only
   as focused alternatives, not as the normal first install.

The general content to adapt from the engine README includes:

- what Jivs is and the input-validation problem it addresses;
- separation between business validation rules and the UI;
- support for browser and Node.js usage;
- the service-oriented and dependency-injection architecture;
- the reason Jivs is composed of multiple libraries.

Do not carry over engine-specific claims or instructions without review. In
particular, replace the engine README's direct-install guidance, explain the
umbrella package as the normal application entry point, and keep engine's
UI-independent role in the specialized engine README.

Because npm renders this README outside the repository, links to repository
documentation must use absolute GitHub URLs rather than repository-relative
paths. The starter-file link should remain the GitHub `blob/main` link.

### Specialized npm READMEs

Keep the existing package pages. Add a prominent link near the beginning of
`jivs-engine`, `jivs-builder`, and `jivs-configanalysis` READMEs directing
application users to `@plblum/jivs`. Retain package-specific installation and
usage information for users who intentionally arrived at that package.

The engine README should describe engine as the UI-independent core and explain
that direct installation is mainly for extension authors or users who need the
core package directly.

## Publishing and versioning

Lerna already discovers publishable packages below `packages/`, excludes
packages marked private, bumps versions, creates release tags by default, and
publishes packages from the workflow in:

```text
.github/workflows/github-action-publish-to-npm.yml
```

The workflow uses `lerna version --no-private --yes` followed by
`lerna publish from-package --no-private --yes`. Keep the root package private
so it remains excluded from npm publication. Configure the new umbrella package
with the same public publishing metadata as the existing packages.

The existing local workspace dependencies may continue to use `file:../...`
references. The current published ConfigAnalysis package demonstrates that the
publish process produces npm dependencies with caret ranges, such as
`@plblum/jivs-engine: ^0.22.1`. Verify the new umbrella package with a dry-run
pack or publish inspection before releasing it.

Do not change documentation links to version tags. Continue using the
maintained GitHub `main` starter-file link even though release tags are created.

Because the root package is private repository tooling, its sibling Jivs package
dependencies should be treated as development dependencies for the workspace,
not as the runtime dependencies of a published product. Resolve this during
implementation by moving the root's direct Jivs package dependencies to
`devDependencies` if they are only present to support repository tooling. The
new umbrella package's `dependencies` are the authoritative consumer-facing
runtime dependencies.

## Implementation sequence

1. Confirm the current root package is private and remains the repository
   workspace manifest.
2. Add `packages/jivs/package.json` with umbrella metadata and engine/builder
   dependencies.
3. Create `packages/jivs/scripts/copy-starter-file.mjs` and add the umbrella
  package `prepack` script, using the repository-level starter file as its
  single source of truth.
4. Add the umbrella npm README.
5. Update `README.md` and `docs/Installing_Jivs.md` to use the umbrella install
   and separate ConfigAnalysis dev install.
6. Update the documentation library index if needed and add links from the
   specialized package READMEs.
7. Refresh `package-lock.json` using the repository's normal npm workflow.
8. Run package compilation and tests.
9. Run `npm pack --dry-run` for `packages/jivs` and verify the starter file and
   README are present.
10. Run a real `npm pack` for `packages/jivs`, inspect the generated tarball,
  and remove the tarball after verification.
11. Run Lerna package discovery and inspect the generated package dependency
  metadata without publishing.
12. Install the packed umbrella tarball into a clean temporary consumer project
  and verify that engine and builder resolve, the starter file can be copied,
  and its imports resolve. Install ConfigAnalysis separately as a development
  dependency in that test when validating the recommended setup.

## Validation checklist

- The root package remains private and is not listed as a publishable package.
- `@plblum/jivs` is discovered by Lerna.
- `@plblum/jivs` has no API re-exports.
- `@plblum/jivs` installs engine and builder.
- ConfigAnalysis is not a runtime dependency of the umbrella package.
- The packed umbrella artifact contains `starter_code/create_JivsServices.ts`.
- The package `prepack` script copies the current repository-level starter file
  before packaging.
- The package `postpack` script removes the generated working-tree copy.
- The packed artifact contains only the intended package files and does not
  expose packaging scripts unintentionally.
- The starter file still resolves imports from engine and builder.
- README links resolve from their respective locations.
- Existing packages compile and tests remain green.
- A clean consumer can install the umbrella package and use its dependencies.
- No version-specific GitHub URLs are introduced.

## Deferred decisions

These are intentionally outside the first umbrella-package implementation:

- Designing root exports or changing the import strategy.
- Deciding whether future DOM support belongs in the umbrella.
- Choosing dependency relationships for Angular and React packages.
- Choosing the installation model for future UI packages.
- Deciding whether the eventual DOM package is bundled or only separately
  published.
