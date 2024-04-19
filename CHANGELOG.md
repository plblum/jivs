## 0.13.0
- InputValidator now has an errorcode whose value inherits from Condition.ConditionType
  unless the user assigns it to InputValidatorConfig. Fixes a problem where you want
  to use the same condition several times in the same InputValueHost.
- **Breaking API change** - IssuesFound.conditionType property renamed to errorCode.
- Introduce config().calc() to the fluent syntax for CalcValueHost.
## 0.12.0
- **Major feature**. CalcValueHost is used for calculating values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days.
- **Breaking API change.** Renamed "Descriptor" to "Config" throughout. I felt that the descriptor objects
were better described as configuration objects.
- **Breaking API change.** Renamed "RequiredTextCondition" to "RequireTextCondition" throughout.
- **Breaking API change.** Removed "StringNotEmptyCondition" and expect users to use RequireTextCondition instead.
- **Breaking API change.** Reworked Fluent syntax. configInput() -> config().input(); configNonInput() -> config().nonInput();
configChildren() -> config().conditions().
## 0.11.0
- **Breaking API change.** Renamed LessThanOrEqualTo and GreaterThanOrEqualTo to 
LessThanOrEqual and GreaterThanOrEqual.
- **Major feature.** Fluent syntax available for configuring ValueHosts and their validators.
  `configInput("FieldName").requiredText().regExp("expression", {}, "error message")`
  Expecting users to build ValidationManagerConfig using configInput() and configNonInput()
  to simplify the work (when its not handled by business logic).
  InputValueHost.configValidators() provides the fluent syntax to add validators to 
  the InputValueHost.
## 0.9.8
- **Breaking API change.** ValueHosts use "name" instead of "id" to provide their identifier, in preparation for supporting paths (hierarchy of ValueHosts).
  IValueHost.getId() -> IValueHost.getName()
  ValueHostDescriptor.id -> ValueHostDescriptor.name
- IValidatorServices now implements IServices, allowing additional libraries to install their own services using setService()
  and consume them using getService().
  `IValidatorServices.getService<typecast>("name")`
  `IValidatorServices.setService("name", service)`