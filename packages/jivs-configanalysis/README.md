# @plblum/jivs-configanalysis: Testing your configurations
`Jivs-ConfigAnalysis` is a tool to ensure that your configuration is as expected,
even before you create a ValueHostsManager object from it.

## Problem it solves
When you code with services and dependency injection, the code becomes very disconnected.
In classic programming, a ValueHost might have been setup like this:

```ts
let birthDateVH = new FieldValueHost('birthDate', LookupKey.Date);
birthDateVH.parser = new DateParser();
birthDateVH.formatter = new DateFormatter();
```
The parser and formatter were explicitly chosen knowing the data type is LookupKey.Date, and the code is side-by-side with the object they configure.

When services own the Parsers, Formatters, Conditions, etc, you no longer see the configuration going into the ValueHost side-by-side.

```ts
let birthDateVH = new FieldValueHost('birthDate', LookupKey.Date);
// when birthDate needs a parser, it asks JivsServices to get it one by LookupKey.Date.
// same for formatter.
```
Similar issues arise with regard to error messages, which are expected to be localized
and potentially looked up from a master list when not directly supplied.

The jivs-configanalysis tool attempts to reconnect the ValueHost to its configuration
through a report.

### Put it into your unit tests
Example unit test pattern.
```ts
test('Check MyValueHostRules against the services', () => {
    let services = createJivsServices();    // your production services 
    let rules = new MyValueHostRules(services);
    let config = rules.configure();

    let configAnalysisService = installConfigAnalysisService(services);
    let explorer = configAnalysisService.analyze(config, {});
    if (explorer.hasErrors())
    {
      // dump a report into the console before triggering the unit test error
      const includeValueHostResults = { severities: [CAIssueSeverity.error] };
      const includeLookupKeyResults = { severities: [CAIssueSeverity.error] };
      const includeCompleteResults = false;
      explorer.reportToConsole(
          includeValueHostResults,
          includeLookupKeyResults,
          includeCompleteResults, 2);      
    }
    expect(explorer.hasErrors()).toBeFalse(); // if it fails, you know to review your ValueHost rules against the jivsservices.
});
```
### Sample output: Conditions are not registered
The test calls `explorer.reportToConsole()`. It outputs json like this:
```json
{
  "valueHostQueryResults": [
      {
          "path": {
              "ValueHost": "StartDate",
              "Validator": "LessThan",
              "Condition": "LessThan"
          },
          "result": {
              "feature": "Condition",
              "conditionType": "LessThan",
              "config": {
                  "secondValueHostName": "EndDate",
                  "conditionType": "LessThan"
              },
              "properties": [],
              "severity": "error",
              "message": "ConditionType not registered: LessThan"
          }
      },
      {
          "path": {
              "ValueHost": "StartDate",
              "Validator": "NumOfDays",
              "Condition": "LessThanOrEqual"
          },
          "result": {
              "feature": "Condition",
              "conditionType": "LessThanOrEqual",
              "config": {
                  "valueHostName": "DiffDays",
                  "secondValueHostName": "NumOfDays",
                  "conditionType": "LessThanOrEqual"
              },
              "properties": [],
              "severity": "error",
              "message": "ConditionType not registered: LessThanOrEqual"
          }
      }
  ],
  "lookupKeyQueryResults": []
}
```
# Installing Jivs-ConfigAnalysis
```
npm install --save @plblum/jivs-configanalysis
```
[Documentation](../../docs/Testing/Testing_Configurations.md)

[Source code](https://github.com/plblum/jivs/packages/jivs-configanalysis)

# Features
`Jivs-ConfigAnalysis` does the following:
- Validates the properties throughout your `ValueHostConfig` objects, including:
  - Requested Lookup Keys have an associated class registered with the factories, taking cultures into account. (Lookup Keys are used to identify	data types, parsers, formatters, converters, and more.)
	> When using dependency injection, it is not immediately apparent if the object
	that you want is the one you get, especially because Jivs provides fallbacks for cultures and Lookup Keys.
  - Requested Condition Types are registered in the ConditionFactory.
  - Issues with tokens within error messages.
  - Required properties have values.
  
- Identifies each Lookup Key in use, along with the services that are needed by your ValueHostConfigs.
- For properties that support localization, it shows all cultural localizations of the text registered with the TextLocalizerService.
  > Localization has fallbacks. You may have a rule that lets all text fallback to your default language.
