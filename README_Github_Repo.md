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
- All pushes result in running the unit tests through the github action: github-action-tests.yml
- PR into `main` refreshes the TypeDoc documentation located at [http://jivs.peterblum.com/typedoc](http://jivs.peterblum.com/typedoc) with these actions:
    + github-action-typedoc.yml
    + github-action-images.yml
- Currently NPM publish is invoked manually using this github action: github-action-publish-to-npm.yml
    + Only run against the main branch
    + The Github action prompts to select the version bump: major, minor, patch.

## Versioning strategy
All projects share a common version number. They are in the format: major.minor.patch, like 20.10.5.

- major: breaking change or significant revision
- minor: non-breaking change introducing something new
- patch: anything else    

> During the prerelease work, we are not bumping the major version. We expect that upon release, the first version number will be 1.0.0. Prior work will be 0.minor.patch.

## Access Tokens
Both Github and NPM require short-lived tokens to publish to them. Once changed, their new value must be applied to [Actions Secrets and Variables](https://github.com/plblum/jivs/settings/secrets/actions) in Github.

### Github tokens
One token is used and it _expires each year_. It is a Fine Grained access token and supported by 2FA.

Currently only Peter Blum has admin rights to refresh the tokens. I am looking for others to take on this responsibility.

1. https://github.com/settings/personal-access-tokens
2. Edit `Jivs-Repo`
3. Click **Regenerate Token**
4. Update the jivs repo's Security Token in [Actions Secrets and Variables](https://github.com/plblum/jivs/settings/secrets/actions). The repo secret is named:
    ```
    PERSONAL_ACCESS_TOKEN
    ```

### NPN tokens
One token is used an it _expires in 90 days_. It is supported by 2FA.

Currently only Peter Blum has admin rights to refresh the tokens. I am looking for others to take on this responsibility.
1. https://www.npmjs.com/settings/plblum/tokens
2. Generate new token. 
3. Update the jivs repo's Security Token in [Actions Secrets and Variables](https://github.com/plblum/jivs/settings/secrets/actions). The repo secret is named:
    ```
    NPM_ACCESS_TOKEN
    ```

## Github Actions
The repo is supported by these github actions, which are in the repo at: \jivs\.github\workflows.

- github-action-tests.yml - Run all unit tests. Runs on any push to any branch. Failing test will prevent a PR from merging.
- github-action-pr-into-main.yml - Ensures that PRs to `main` only start from the `develop` branch.
- github-action-publish-to-npm.yml - Updates the NPM site with all publishable packages. Bumps the version number as part of the process. Manually run and should only be run against the `main` branch.
- github-action-typedoc.yml - Generete the Typedoc content and deploy to jivs.peterblum.com/typedoc. Run automatically on a push to `main`.
- github-action-images.yml - Deploys the content from \jivs\docs\images to jivs.peterblum.com/images for use by both the typedoc and markdown files shown in github. Run automatically on a push to `main`.
