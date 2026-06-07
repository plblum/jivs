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


## 🔨 Compile

### Entire Workspace
No single command - compile packages individually as needed

### Individual Package
```bash
cd packages/<package-name>
npm run compile
```

## 🧪 Test

### Entire Workspace (from root)
```bash
npm run test           # All tests with output
npm run consoletest    # Silent tests, no console output
```

### Individual Package
```bash
cd packages/<package-name>
npm run test           # Tests with output
npm run consoletest    # Silent tests
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

## 📦 Publish (from root only)

```bash
npm run bumpversion        # Bump version across all packages (uses lerna)
npm run publish_library    # Publish to npm (uses lerna)
npm run retry_publish      # Retry if publish fails
```

## 📚 Documentation (from root only)

```bash
npm run typedoc           # Generate API documentation
```

## 📝 Notes

- This is a Lerna monorepo with packages in `packages/*`
- All packages depend on `@plblum/jivs-engine`
- Packages: jivs-engine, jivs-angular, jivs-configanalysis, jivs-examples
- TypeScript compilation uses `tsc` command
- Tests use Jest

