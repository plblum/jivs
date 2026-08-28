# Understanding Conditions within Validators
A validator is the combination of two classes: 
1. The *Condition* which is the rule that evaluates the data, determining validity.
2. The *Validator* which hosts the error messages and one Condition object. It contains the `validate()` function
that uses the `Condition` to determine validity and interacts with the containing `ValueHost` and `ValueHostsManager`, who deliver the results to the UI.

To emphasize this separation, let's see how our configuration objects look:
```ts
let compareVal: ValidatorConfig = {
    errorMessage: 'Error message',
    summaryMessage: 'Summary message',
    severity: ValidationSeverity.Error,
    conditionConfig: <EqualToConditionConfig>{
        conditionType: ConditionType.EqualTo,
        secondValue: 20
    }
}
```
Use the **Builder API** syntax to better convey what you are trying to do.
```ts
builder.field('FieldName1').equalTo(2, 'Error message', 'Summary message');
```
The Builder flattens the validator and condition, as the parameters for equalTo are a combination of condition (_secondValue_) and validator (_errorMessage_ and _summaryMessage_).

## Intro to configuring Validators
Each validator has these two syntaxes within the Builder API.

```ts
builder.field('field').conditionName(required parameters, errorMessage?, summaryMessage? );
builder.field('field').conditionName(required parameters, { validator parameters } );
```
- The *validator parameters* argument depends on the condition. All have these properties:
  ```ts
  {
      // note: 'null' is used to remove the value from an earlier version of the config
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
  }
  ```
  Any condition with optional properties will have those added to its own version of _validator parameters_. For example:
  ```ts
  {
        errorMessage?: null | string | ((host) => string);
        errorMessagel10n?: null | string;
        summaryMessage?: null | string | ((host) => string);
        summaryMessagel10n?: null | string;
        
        severity?: ValidationSeverity | ((host) => ValidationSeverity);
        errorCode?: string; 
        enabled?: boolean | ((host) => boolean);
        // condition properties for RequireText:
        trim?: boolean; 
        nullValueResult?: ConditionEvaluateResult;         
  }
  ```

For details, see [Configuring Validators](#configuring-validators).