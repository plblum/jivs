**Alert**: Due to this software being actively developed to finalize the architecture, please expect breaking changes along the way.
The intent is to deliver a production release that will limit breaking changes, and communicate them within the versioning
by bumping the major version number. [here].0.0.

## 0.23.0
- **Breaking API change** - Replaced state management. Callbacks have been replaced by ValueHostsManager.getCapturedState()
and ValueHostsManagerConfig.capturedState. This simplifies the work needed for server generated pages to retain state during
a round trip.
- **Breaking API change** - Consolidated the comparison conditions and their builder references. Previously we had
EqualTo() for valuehost lookups and EqualToValue() for other values. Now we have EqualTo() alone, handling both
sources of values. In the builder, to specify a valuehost, use builder.field('name').equalTo(valueHost('field2')).
This applies to all comparison conditions.

## 0.22.0 
Same as 0.21.0

## 0.21.0
- **Breaking API change** - With a goal of establishing clearer terminology and usage patterns, major types have been renamed.
  + ValidationServices -> JivsServices
  + ValidationManager -> ValueHostsManager
  + ModelRules -> ValueHostRules. RulesBase, ModelRulesBase, and FormRulesBase have been consolidated into ValueHostRulesBase.
- **Breaking API change** -  DataTypeResolution type returned by DataTypeFormatters and DataTypeParsers handles errors differently.
Instead of supplying just an errorMessage, it has an object with errorMessage, localization, error code, etc.
- **Breaking API change** - InjectedErrors feature introduced, replacing options.conversionErrorTokenValue, to let your parsers supply much better information
  and have it appear upon validation, without even setting up a validator. The DataTypeCheckCondition no longer handles this task,
  nor offers the {ConversionError} token in error messages. InjectedErrors supports localization and error codes.
- **New Feature** - FieldValueHost.setValue() now can format the native value and assign the result to the text value. It uses the existing DataTypeFormatter system.
- **New Feature** - FieldValueHost.setTextValue() can now reformat the text value based on the associated parser and formatter, notifying your UI through
the ValueHostsManager.onTextValueChanged callback if you like.
- **Breaking API change** - Removed these two properties on FieldValueHostConfig: parserCreator and formatterCreator. Trying to reduce complexity.
User can still create the same code as an actual DataTypeParser or DataTypeFormatter.
- Behaviors feature introduced. This object let you configure behaviors of the ValueHostsManager. Set it up on builder.behaviors. Change on demand on ValueHostsManager.behaviors.
It offers activeCultureId, disableParserOnValueChange, and disableFormatterOnValueChange.
- **Breaking API change** - CultureService.activeCultureId is no longer used to set the active culture used for localization. Its property is readonly and named defaultCultureId.
Instead, use the Behaviors.activeCultureId to change the default CultureID. This avoids services changing state. The result is JivsService constructor now optionally
takes the value for CultureService.defaultCultureId.
- **Major New Feature** - Use the ModelReader to assign the properties from the model to the associated ValueHosts. Use the ModelWriter to do the reverse.

## 0.20.0
- **Breaking API change** - The Builder features are in a separate module, jivs-builder.
- **Major feature** - Introduce IRules, ModelRulesBase, and FormRulesBase, which are the new way to configure the ValidationManager. It still uses the builder API,
but by having you subclass ModelRulesBase, you can package your configuration in a reusable and testable way.
- **Breaking API change** - We've merged InputValueHost and PropertyValueHost into a single one called FieldValueHost. Input and Property were very similar
and with pending work on the server side story, PropertyValueHost needed to support both text and native values like InputValueHost.
For the most part, you should be able to rename these builder properties: builder.input() and builder.property() to builder.field().
- Provide a way for Jivs on the server side to supply its validation IssuesFound to the client. See ValidationManager.fromValidationPayload and toValidationPayload.
- Revise how external errors are handled. REPLACED setBusinessLogicErrors and its ExternalIssueFound class with addExternalIssuesFound that takes IssueFound.

## 0.19.0
- Introduce a new library, jivs-configanalysis, that is part of the overall source code [here](https://github.com/plblum/jivs). It focuses on testing that your configuration is going to deliver as expected when you create a ValidationManager from it.
- jivs-engine contains numerous minor changes to support jivs-configanalysis.
- Introduce logger property on many base classes that provides standard ways to log. Its a facade around LoggerService. 
- The ValidationManager now has more logging.
- DataTypeComparerService uses fallbackLookupKeyService instead of converters to resolve values being compared using the Default Comparer.

## 0.18.1
- ValueHosts now has an enable property that lets you disable them, blocking their validation and ability to set their value (although there is an override in the options).
  - Use ValueHost.setEnabled() for on demand disabling
  - Use ValueHostConfig.enablerConfig to define a Condition that automatically determines the state. Build API: builder.enabler(valueHostName, (builder)=>builder.condition(parameters));
  - Use ValueHost.isEnabled() to determine the current state.
  - Overhauled the logging API in preparation for a better testing story.
  - Refactored the DataTypeComparerService and related classes to limit its role in conversion,
    putting the onus on the Condition classes to call the Converter service.
## 0.18.0
- **Breaking API changes and Major feature** - Redesigned how you configure Jivs, favoring the fluent syntax over config objects.
This is a major reworking, reflected in the documentation. Quick summary:
   - "Builder API" is the new name of the tooling.
   - "Builder object" is the primary class, ValidationManagerConfigBuilder. It replaces ValidatorManagerBuilder.
   - "Modifier object" is the primary class used to modify the configuration after the ValidationManager is created.
   - There can be up to 3 phases to configuration: business logic, ui layer, changes after ValidationManager is created.
   - Overriding business logic validation rules remain protected from the ui layer, but changes are allowed
     by explicitly stating which validation rule to modify and making it easy to combine business logic's condition with the UI's.
     See combineWithRule() and replaceRule() functions in the Builder API.
     These replace the setConditionConflictRule feature of ConfigMergeService.
   - Fluent syntax for All, Any, and CountMatches conditions reworked to use a callback to supply their child ConditionConfigs.
     The callback passes a Builder object: `builder.input('field').all((childrenBuilder)=>childrenBuilder.requireText(null, 'F1').requireText(null, 'F2'))`
   - Extensive examples for configuration are now in jivs-examples.
- New condition, NotCondition. Inverts the result of a child condition. input('field').not((child)=> child.regExp(/\d*/));
- New condition, WhenCondition. Replacement for the Enabler feature on ValidatorConfig. Has two conditions: enabler and the condition to enable. The child condition is executed only when the enabler condition matches the condition. input('field').when((enabler)=>enabler.regExp(/\d*/, null, null, 'otherValueHostName'), (child)=>child.requireText())
- **Breaking API change** Removed the enablerConfig and enablerCreator properties on ValidatorConfig. Use the WhenCondition instead.
- Fluent syntax for building conditions now has conditionConfig() function, which adds any fully created ConditionConfig to the chain.
  As a result, builder.conditions() function has been removed.

## 0.17.1
- Added setIssuesFound() method on ValidationManager and ValidatableValueHostBase. Simplifies how to send Jivs errors found by the server and sent up to the client.
- Added {DataType} token to error messages, with localization using TextLocalizerService.
- Added lazy loading for many services
## 0.17.0
- **Major feature** Added a parser feature to convert from input value to native value on calls to InputValueHost.setInputValue. It includes a service (DataTypeParserService), interface (IDataTypeParser), and classes to cover a few common cases.
Aside from using it with the client-side, this will help when posting back form data, to convert the strings sent from the client into native values ready to be validated.
## 0.16.2
- Introduce IDisposable interface to allow more direct control over releasing ValidationManager and ValidationServices.
- Introduce these Conditions all evaluating numbers: PositiveCondition, IntegerCondition, MaxDecimalsCondition
- **Breaking API change** - IDataTypeCheckGenerator and AutoGenerateDataTypeCheckService return an array of conditions instead of 1.
## 0.16.1
- New service: LookupKeyFallbackService, to allow formatter service and parser service (future) fall back to another lookup key when searching for the object they will use.
- Refactored services to all implement IService and be based on ServiceBase. 
- Improved logging information coming from services.
- Refactored IValidationServices to have ancestors: IServices -> IValueHostServices -> IValidationServices.
  As a result, now InputValueHost and PropertyValueHost can only be associated with IValidationService,
  while the rest can be used with IValueHostServices.
## 0.16.0
- **Breaking API change** - refactor of DataTypeFormatterService to create a stand-alone CultureService.

## 0.15.7
- ValidationManager offers enumerateValueHosts as a way to enumerate through existing ValueHosts
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