## 0.15.3
- Change paths into @plblum/jivs-engine to use @plblum/jivs-engine/build instead of @plblum/jivs-engine/src
## 0.15.2
- **NPM Blocking Issue** - "services" property not found on IValidationManager. https://github.com/plblum/jivs/issues/52
## 0.15.1
- **Major feature** - PropertyValueHost handles property values on a Model.
## 0.15.0
- **Breaking API changes** - Refactoring and renaming.
- build() method added to ValidationManager to support adding value hosts with fluent syntax.
- vm property added to ValidationManager to support simpler syntax for getting strongly typed ValueHosts.
- onValidationStateChange callback debounced
## 0.14.0
- **Breaking API changes** - Major refactoring and renaming.
## 0.13.0
- **Major feature** - Rework how users configure the ValidationManagerConfig object by
  introducing ValueHostsBuilder. This "builder" class takes the Config object and
  supplies fluent syntax methods to modify it.
- InputValidator now has an errorcode whose value inherits from Condition.ConditionType
  unless the user assigns it to InputValidatorConfig. Fixes a problem where you want
  to use the same condition several times in the same InputValueHost.
- **Breaking API change** - Renamed InputValidator to Validator.
- **Breaking API change** - Renamed NonInputValueHost to StaticValueHost.
- **Breaking API change** - Renamed "type" on ValueHostConfig to "valueHostType" to avoid associating it with "data type"
- **Breaking API change** - Renamed "type" on ConditionConfig to "conditionType"
- **Breaking API change** - IssuesFound.conditionType property renamed to errorCode.
- Introduce config().calc() to the fluent syntax for CalcValueHost.
- TextLocalizerService now can have fallbacks, allowing you to have a base service definition
  and specific uses can introduce a second TextLocalizerService to extend the original.
- **Breaking API change** - Comparison conditions (EqualTo, NotEqualTo, etc) covered two sources
  of values, from a second ValueHost and from the ConditionConfig.secondValue property.
  Now there are seperate conditions. EqualTo and EqualToValue; NotEqualTo and NotEqualToValue; etc.
- **Breaking API change** - ValidationManager.validate() function has a different result type.
- ValidationManager's onValidate callback called from setBusinessLogicError and clearValidation.
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