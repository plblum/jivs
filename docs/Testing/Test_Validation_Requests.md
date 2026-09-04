# Test Validation Requests
Ensure that code referencing Jivs is operating correctly. There are many aspects to this, but its centerpiece is validation. This section focuses on that.

The basic test will generally do this:
1. Create the `JivsServices object`, which may be identical to what you use in your app.
2. Create a `ValueHostRulesBase` subclass that describes a model for your test.
3. Create the `ValueHostsManager` from the result of the subclass's `configure()` method.
4. Set the values that will impact a validation test.
5. Invoke either form-wide or `ValueHost` specific validation, and capture the results.
6. Evaluate the results against expectations.

We recommend that steps 1 - 3 are encapsulated into a function. In these test examples, we'll have this function available to deliver a fully-built `ValueHostsManager`:
```ts

class DateRangeFormRules extends ValueHostRulesBase {
    protected override configureRules(
        builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions): void 
    {
        // create the start date ValueHost and its validators
        builder.field('StartDate', LookupKey.Date, { label: 'Start date' })
        .lessThan('EndDate', null, { label: 'End date' }, { severity: ValidationSeverity.Severe });

        // create the end date ValueHost
        builder.field('EndDate', LookupKey.Date, { label: 'End date' });
    }
}
function createValueHostsManager(): ValueHostsManager
{
    let services = createJivsServices('culture identifier');
    let rules = new DateRangeFormRules(services);
    return new ValueHostsManager(rules);
}
```
## Form-wide using ValueHostsManager.validate()
```ts
test('Start and End date are supplied empty strings and report isValid=false', ()=>
{
    // Arrange
    let vhm = createValueHostsManager();
    
    vhm.field('StartDate').setValues('', '');	// we'll test the require validator. Empty strings will be invalid
    vhm.field('EndDate').setValues('', '');
    
    // Act
    let validationState = vhm.validate();
    
    // Assert
    expect(validationState.isValid).toBe(false);
    expect(validationState.doNotSave).toBe(true);
    expect(validationState.asyncProcessing).toBe(false);	// only needed if this form has async conditions.
    expect(validationState.issuesFound).toHaveLength(2);
    
    let startDateResult = validationState.issuesFound[0];
    expect(startDateResult.valueHostName).toBe('StartDate');
    expect(startDateResult.errorCode).toBe(ConditionType.RequireText);
    expect(startDateResult.severity).toBe(ValidationSeverity.Severe);	// typical of required
    expect(startDateResult.errorMessage).toBe('the expected error message'); // or .toContain('part of error message')
    expect(startDateResult.summaryMessage).toBe('the expected summary message');
    
    let endDateResult = validationState.issuesFound[1];
    expect(endDateResult.valueHostName).toBe('EndDate');
    expect(endDateResult.errorCode).toBe(ConditionType.RequireText);
    expect(endDateResult.severity).toBe(ValidationSeverity.Severe);
    expect(endDateResult.errorMessage).toBe('the expected error message');
    expect(startDateResult.summaryMessage).toBe('the expected summary message');
});
```
The result of `ValueHostsManager.validate()` is a [ValidationState object](http://jivs.peterblum.com/typedoc/interfaces/Validation_Types.ValidationState.html) which looks like this:
```ts
interface ValidationState {
    isValid: boolean;
    doNotSave: boolean;
    issuesFound: null | IssueFound[];
    asyncProcessing: boolean;
}
```
Each [IssueFound object](http://jivs.peterblum.com/typedoc/interfaces/Validation_Types.IssueFound.html) is from a specific validator that was not valid. (There may be several for a single `ValueHost`).
```ts
interface IssueFound {
    valueHostName?: string;
    errorCode?: string;
    severity?: ValidationSeverity;
    errorMessage: string;
    summaryMessage?: string;
    doNotSave?: boolean;
}
```
## Individual ValueHosts using valueHost.validate()
If we want, we can test individual `ValueHosts` for more focused tests. The `ValueHost.validate() function` returns either [ValueHostValidationResult](http://jivs.peterblum.com/typedoc/interfaces/Validation_Types.ValueHostValidateResult.html) or null for no issue.
```ts
interface ValueHostValidateResult {
    status: ValidationStatus;
    issuesFound: null | IssueFound[];
    corrected?: boolean;
    pending?: null | Promise<ValidatorValidateResult>[];
}
```
It too has an `IssueFound object` for each validator. 

Let's redo the previous test to check the StartDate `ValueHost`.
```ts
test('StartDate is supplied empty strings and report status=Invalid', ()=>
{
    // Arrange  
    let vhm = createValueHostsManager();
    
    // even though we are only testing StartDate, it has validators
    // that need data from EndDate. So set both up.
    vhm.field('StartDate').setValues('', '');	
    vhm.field('EndDate').setValues('', '');
    
    // Act
    let validationResult = vhm.field('StartDate').validate();
    
    // Assert
    expect(validationResult.status).toBe(ValidationStatus.Invalid);
    expect(validationResult.doNotSave).toBe(true);
    expect(validationResult.asyncProcessing).toBeNull();	// only needed if this input has async conditions.
    expect(validationResult.issuesFound).toHaveLength(1);
    
    let requiredResult = validationResult.issuesFound[0];
    expect(requiredResult.valueHostName).toBe('StartDate');
    expect(requiredResult.errorCode).toBe(ConditionType.RequireText);
    expect(requiredResult.severity).toBe(ValidationSeverity.Severe);	// typical of required
    expect(requiredResult.errorMessage).toBe('the expected error message'); // or .toContain('part of error message')
    expect(requiredResult.summaryMessage).toBe('the expected summary message');
});
```