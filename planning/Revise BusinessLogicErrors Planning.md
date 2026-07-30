# Revise BusinessLogicErrors Planning

## Overview
Refactor the BusinessLogicError concept to support:
1. Model-level validators (validation rules not tied to specific fields)
2. Simplified server→client validation transfer
3. Clearer distinction between blocking/non-blocking errors
4. Better naming that reflects actual use cases

## Key Problems Solved

### Problem 1: Submit Button Disabled Trap
**Current:** BusinessLogicErrors with severity Error/Severe set validationStatus=Invalid, making doNotSave=true, which can disable submit buttons. User cannot click submit to re-validate and clear the errors.

**Solution:** Add `displayOnly` flag to ExternalIssueFound. Server-sourced issues don't contribute to doNotSave calculation, allowing submit button to remain enabled.

### Problem 2: No Model-Level Validation
**Current:** BusinessLogicErrorsValueHost holds errors but cannot run validators. Model-level rules (e.g., "That username already exists. Try another.") must be implemented externally.

**Solution:** Rename to ModelValidatorsValueHost, extend to support validators. Validators on '*' require explicit valueHostName assignment to reference fields.

### Problem 3: Dual-List Server→Client Transfer
**Current:** Server developers must manage two separate lists (IssueFound[] and BusinessLogicError[]) and clients must call two methods (setIssuesFound + setBusinessLogicErrors).

**Solution:** ValidationPayload type bundles both. Single method calls on each side.

### Problem 4: Confusing Names
- "BusinessLogicError" implies business logic origin, but used for any external error
- "BusinessLogicErrorsValueHost" doesn't indicate it's model-level scope

**Solution:** 
- BusinessLogicError → **ExternalIssueFound**
- BusinessLogicErrorsValueHost → **ModelValidatorsValueHost**

## Terminology

### ExternalIssueFound
User-supplied validation issue (input format). Fields:
- `errorMessage: string` - fully realized message (no tokens). Not HTML encoded because it may be used elsewhere like in logs. Need to encode in setValidationPayload where the caller knows it needs
- `errorCode?: string` - optional identifier for swap matching
- `associatedValueHostName?: string` - field association (omit for model-level)
- `severity?: ValidationSeverity` - visual emphasis only (Error=red, Warning=yellow)
- `displayOnly?: boolean` - when true, doesn't block save (set by setValidationPayload)

### ValidationPayload
Package for transferring validation state between server and client:
```typescript
interface IValidationPayload {
    issuesFound: Array<IssueFound>;
    externalIssues: Array<ExternalIssueFound>;
}
```

### ModelValidatorsValueHost
ValueHost with name='*' that:
- Holds model-level ExternalIssueFound (no associated field)
- Supports validators for model-level rules
- Validators must specify valueHostName to reference fields

### Validator Swap
When ExternalIssueFound.errorCode matches an existing validator:
- Validator generates IssueFound using its error message template
- Uses validator's severity
- Discards ExternalIssueFound.errorMessage
- IssueFound goes into validator state (contributes to doNotSave)
- Original ExternalIssueFound remains in businessLogicErrors array

## Architectural Changes

### Class Hierarchy Refactor (Phase 2)

**Current:**
```
ValidatableValueHostBase
└── ValidatorsValueHostBase (validators + field-level features)
    ├── TextValueHost
    ├── PropertyValueHost
    └── BusinessLogicErrorsValueHost (no validators, just errors)
```

**New:**
```
ValidatableValueHostBase
└── ValidatorsValueHostBase (NEW - validators only)
    ├── FieldValidatorsValueHostBase (RENAMED - field-level features)
    │   ├── TextValueHost
    │   └── PropertyValueHost
    └── ModelValidatorsValueHost (RENAMED - model-level + validators)
```

### doNotSave Calculation (TBD Implementation)

Must distinguish between:
- Validator-generated IssuesFound (always block)
- Client-generated ExternalIssueFound (block unless displayOnly=true)
- Server-generated ExternalIssueFound (never block, displayOnly=true)

**Logic location:** ValidatableValueHostBase.doNotSave getter

**Approach:** Check if Invalid status is only due to displayOnly ExternalIssueFound. If so, return false (don't block).

## API Changes

### Renamed
- `BusinessLogicError` → `ExternalIssueFound`
- `BusinessLogicErrorsValueHost` → `ModelValidatorsValueHost`
- `BusinessLogicErrorsValueHostType` → `ModelValidatorsValueHostType`
- All references to "businessLogicError" in method params, variables

### New Methods - ValidationManager

```typescript
/**
 * Server-side: Package validation results for transfer to client.
 * Combines validator-generated IssuesFound with user-supplied ExternalIssueFound.
 * @param externalIssues - Errors from business logic, external validators, etc.
 * @returns Package ready for HTTP/API response
 */
getValidationPayload(externalIssues: Array<ExternalIssueFound> | null): ValidationPayload

/**
 * Client-side: Restore validation state from server payload.
 * Sets displayOnly=true on all externalIssues to prevent blocking.
 * Attempts validator swap for better error messages.
 * @param payload - Validation data from server
 * @param encode - Targets HTML encoding. When supplied, the function takes the 
 original errorMessage and returns a revised one. We will supply a function
 called htmlEncoder(string): string so the user just drops that name in as the parameter.
 * @returns true if state changed
 */
setValidationPayload(payload: ValidationPayload, encode?: null|(text: string)=>string): boolean
```

### Modified Methods

```typescript
/**
 * Client-side: Set validation errors from local business logic.
 * These errors WILL block save (displayOnly is not set).
 * Use for client-side validation that already has correct error messages.
 * Any error here is expected to be discarded and replaced upon the next
 * attempt to validate from local business logic. This entirely
 * abandons previous ExternalIssuesFound.
 * @param errors - Errors to add/replace. Pass null when prior use setup
 * ExternalIssuesFound. If you have business logic validation, we recommend
 * always calling this, to ensure you replace the state each time.
 * @returns true if state changed
 */
setExternalIssuesFound(errors: Array<ExternalIssueFound> | null): boolean
// Note: Renamed from setBusinessLogicErrors
```

### Builder API

```typescript
builder.model() // Returns ModelValidatorsValueHostBuilder
    .custom((valueHost, validationManager) => {
        // Custom validator logic
        // Must specify valueHostName when referencing fields
    })
    .requireText('fieldName', { /*config*/ })
    // etc - all standard validator builders available
```

### ModelValidatorsValueHost Discovery

```typescript
/**
 * Protected helper on ValidationManager.
 * Gets existing ModelValidatorsValueHost or creates if missing.
 * Used by setBusinessLogicErrors, setValidationPayload, builder.model()
 */
protected getOrCreateModelValueHost(): IModelValidatorsValueHost
```

## Implementation Phases

### Phase 1: Rename BusinessLogicError → ExternalIssueFound
**Goal:** Simple rename, no behavior changes

**Tasks:**
0. Rename BusinessLogicErrorsValueHost to ModelValidatorsValueHost
1. Rename interface BusinessLogicError → ExternalIssueFound
2. Update all type references throughout codebase
3. Update method parameter names (error → externalIssue, etc.)
4. Update comments/documentation
5. Run full test suite (should pass without changes)

**Files affected:** Validation.ts (interface), all files referencing BusinessLogicError

### Phase 2: Split ValidatorsValueHostBase
**Goal:** Create clean inheritance for model-level validators

**Tasks:**
1. Create new ValidatorsValueHostBase (validators only)
   - Extract validator array management
   - Extract validate() logic
   - Extract validator-related methods
2. Rename old ValidatorsValueHostBase → FieldValidatorsValueHostBase
   - Keep field-specific features
   - Extend new ValidatorsValueHostBase
3. Update TextValueHost, PropertyValueHost to extend FieldValidatorsValueHostBase
4. Run full test suite

**Files affected:**
- ValidatorsValueHostBase.ts (split into two files)
- TextValueHost.ts, PropertyValueHost.ts (update extends)
- All related interfaces

### Phase 3: Rename & Enhance BusinessLogicErrorsValueHost
**Goal:** Model-level validators support

**Tasks:**
1. Rename BusinessLogicErrorsValueHost → ModelValidatorsValueHost (already happened)
2. Update to extend new ValidatorsValueHostBase
3. Add validatorConfigs support to config
4. Update validate() to run validators
5. Update builder to support model() method
6. Implement getOrCreateModelValueHost() on ValidationManager
7. Update tests

**Files affected:**
- BusinessLogicErrorsValueHost.ts → ModelValidatorsValueHost.ts
- ValidationManager.ts
- Builder classes

### Phase 4: Add displayOnly Flag & doNotSave Logic
**Goal:** Prevent server errors from blocking client submit

**Tasks:**
1. Add displayOnly?: boolean to ExternalIssueFound interface
2. Update doNotSave getter logic to check displayOnly
3. Implement helper to distinguish Invalid sources
4. Update tests for blocking behavior
5. Document "don't disable submit button with doNotSave"

**Files affected:**
- Validation.ts (interface)
- ValidatableValueHostBase.ts (doNotSave)
- Tests

### Phase 5: Add ValidationPayload & Methods
**Goal:** Simplified server→client transfer

**Tasks:**
1. Create ValidationPayload interface
2. Implement getValidationPayload() on ValidationManager
3. Implement setValidationPayload() on ValidationManager
   - Sets displayOnly=true on all externalIssues
   - Calls existing setIssuesFound + setBusinessLogicErrors internally
4. Add documentation and examples
5. Update tests

**Files affected:**
- ValidationManager.ts (interface + implementation)
- Validation.ts (new interface)
- Tests

## Open Questions / TBD

1. **doNotSave implementation details** (Phase 4)
   - Helper method signature for checking Invalid source
   - Edge cases with mixed validator + ExternalIssueFound errors

2. **Severity handling in swap**
   - Currently uses validator's severity
   - Should ExternalIssueFound.severity be considered? No.

3. **ExternalIssueFound without errorCode**
   - Can't swap, goes to businessLogicErrors array
   - Always treated as informational (like Warning)?

4. **ModelValidatorsValueHost auto-creation**
   - When should it be created? (lazy vs eager)
   - Should it appear in valueHosts list if no validators/errors? No. Lazy

5. **Migration guide for existing users**
   - API changes are mostly renames
   - Need clear upgrade path documentation

## Key Reminders

- **Submit buttons should NOT use doNotSave for disabled state** - it's for post-validation save gating only
- **ExternalIssueFound persists across validate() cycles** - only cleared by clearValidation() or explicit clear
- **Validator swap discards user's errorMessage** - by design, to use consistent UI messages
- **Model validators require explicit valueHostName** - unlike field validators where it's implied

## Success Criteria

- [ ] Clean class hierarchy (validators separate from field-specific features)
- [ ] Model-level validators fully supported
- [ ] Single-method server→client transfer
- [ ] Server errors don't block client submission
- [ ] All existing tests pass
- [ ] New tests cover all new features
- [ ] Documentation updated
- [ ] Clear names throughout
