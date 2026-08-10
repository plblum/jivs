# About the Jivs Github repo
Location: [https://github.com/plblum/jivs](https://github.com/plblum/jivs)

Currently owned by Peter Blum, plblum@peterblum.com.

## Branching strategy
Predefined branches:
- `main`
- `develop`

```
feature → develop → main
bugfix  → develop → main
(other) → develop → main
```

- Always PR from your work branch into `develop` first. `main` branch will reject PRs from anything other than `develop`.
- Pushes to feature branches and PRs to `develop`/`main` trigger unit tests via github-action-tests.yml. Direct pushes to `main` or `develop` do not.
- PR into `main` refreshes the TypeDoc documentation located at [http://jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc) with these actions:
    + github-action-typedoc.yml
    + github-action-images.yml
- NPM publish is invoked manually using this github action: github-action-publish-to-npm.yml
    + Must only be run against the `main` branch
    + Prompts to select the version bump: `major`, `minor`, `patch`, or `unchanged`
    + Use `unchanged` to retry a failed publish without bumping the version again
    + After running, pull from `main` locally to sync the version bump commit

## Versioning strategy
All projects share a common version number. They are in the format: major.minor.patch, like 20.10.5.

- major: breaking change or significant revision
- minor: non-breaking change introducing something new
- patch: anything else    

> During the prerelease work, we are not bumping the major version. We expect that upon release, the first version number will be 1.0.0. Prior work will be 0.minor.patch.

## Access Tokens

### Github token
One Fine Grained PAT is used and it _expires each year_. It is supported by 2FA.

Currently only Peter Blum has admin rights to refresh the token. I am looking for others to take on this responsibility.

1. https://github.com/settings/personal-access-tokens
2. Edit `Jivs-Repo`
3. Click **Regenerate Token**
4. Update the repo secret in [Actions Secrets and Variables](https://github.com/plblum/jivs/settings/secrets/actions):
    ```
    PERSONAL_ACCESS_TOKEN
    ```

The token requires these repository permissions:
- **Code** — Read and write (push commits, including lerna version bumps)
- **Actions** — Read and write
- **Workflows** — Read and write (required to push changes to `.github/workflows/` files locally)

### NPM publishing — Trusted Publishing (OIDC)
NPM publishing uses [npm Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements) via GitHub Actions OIDC. No stored npm token is required.

Each published package is configured on npmjs.com to trust this repo's publish workflow:
- Package page → **Settings** → **Publishing access** → **Add a publisher**
- GitHub Actions, owner: `plblum`, repo: `jivs`, workflow: `github-action-publish-to-npm.yml`

The `NPM_ACCESS_TOKEN` secret in GitHub Actions is no longer used and can be removed.

## Github Actions
The repo is supported by these github actions, which are in the repo at: `\jivs\.github\workflows`.

- **github-action-tests.yml** — Run all unit tests. Triggered on pushes to feature branches and on PRs to `develop`/`main`. Failing tests will prevent a PR from merging.
- **github-action-pr-into-main.yml** — Ensures that PRs to `main` only start from the `develop` branch.
- **github-action-publish-to-npm.yml** — Bumps the version and publishes all publishable packages to npm. Manually triggered; must only be run against the `main` branch. Uses npm Trusted Publishing (OIDC) — no npm token needed.
- **github-action-typedoc.yml** — Generates TypeDoc content and deploys to jivs.peterblum.com/typedoc. Runs automatically on push to `main`.
- **github-action-images.yml** — Deploys content from `\jivs\docs\images` to jivs.peterblum.com/images. Runs automatically on push to `main`.

## Troubleshooting publish failures

If the version bump step succeeds but the publish step fails, the repo may be in a partially updated state:

1. Pull from `main` and check `lerna.json` to confirm the current version.
2. A dangling git tag may exist on the remote. Delete it before retrying:
    ```bash
    git push origin --delete vX.Y.Z
    ```
3. Fix the underlying issue, commit, and push to `main`.
4. Re-run the publish workflow selecting **`unchanged`** for the bump to publish the already-bumped version without incrementing again.

## Adding a publishable package

When a package is ready to be published to npm (e.g. `jivs-angular`):

1. In the package's `package.json`:
    - Add `"publishConfig": { "access": "public" }` (required for scoped `@plblum/*` packages)
    - Add a `repository` field — required for npm provenance:
        ```json
        "repository": {
          "type": "git",
          "url": "git+https://github.com/plblum/jivs.git"
        }
        ```
    - Remove `"private": true` if present
    - If the package declares `peerDependencies` on sibling workspace packages, use `">=X.Y.Z"` range instead of `"^0.X.Y"` — the caret range blocks minor version bumps at zero-major versions
2. Configure Trusted Publisher on npmjs.com for the new package (same steps as existing packages).
3. Run `npm install` locally and commit the updated `package-lock.json`.

## Maintaining package-lock.json

The CI workflow uses `npm ci`, which installs from the lockfile without modifying it. Whenever you add or change a dependency in any `package.json`, run `npm install` locally and commit the updated `package-lock.json` before pushing. A stale lockfile will cause the version bump step to fail with an "uncommitted changes" error.
