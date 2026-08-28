# Testing Your Configurations
Use the `Jivs-ConfigAnalysis` module to ensure that your configuration is as expected,
even before you create a `ValueHostsManager` object from it.

`Jivs-ConfigAnalysis` is a separate library, available within npm. Go to [Jivs-ConfigAnalysis npm page](https://www.npmjs.com/package/@plblum/jivs-configanalysis).

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

## Features
`Jivs-ConfigAnalysis` does the following:
- Validates the properties throughout your ValueHostConfig objects, including:
  - Requested Lookup Keys have an associated class registered with the factories, taking cultures into account. (Lookup Keys are used to identify	data types, parsers, formatters, converters, and more.)
	> When using dependency injection, it is not immediately apparent if the object
	that you want is the one you get, especially because Jivs provides fallbacks for cultures and Lookup Keys.
  - Requested Condition Types are registered in the ConditionFactory.
  - Issues with tokens within error messages.
  - Required properties have values.
  
- Identifies each Lookup Key in use, along with the services that are needed by your ValueHostConfigs.
- For properties that support localization, it shows all cultural localizations of the text registered with the TextLocalizerService.
  > Localization has fallbacks. You may have a rule that lets all text fallback to your default language.

## Adding to app
> `Jivs-ConfigAnalysis` is a separate library, available within npm. Go to [Jivs-ConfigAnalysis npm page](https://www.npmjs.com/package/@plblum/jivs-configanalysis).

Consider adding it directly into your normal execution process, although doing so has the following considerations:
- Run it only when not in production. The same below includes a isAppRunningInDeveloper(), which is up to you to create.
- It means that deployment will include the jivs-configanalysis package. If you limit working with it to unit tests, then you can omit jivs-configanalysis within the main codebase.
```ts
// this is the normal setup for any ValueHost Rules used to configure...
let services = createJivsServices('en-US');
let rules = new MyValueHostRules();
let config = rules.configure();

// now insert the jivs-configanalysis tool
 if (isAppRunningInDevelopment())  // this line depends on your app
 {
    let configAnalysisService = installConfigAnalysisService(services);
    let explorer = configAnalysisService.analyze(config, {});
    explorer.throwOnErrors(false, new ConsoleConfigAnalysisOutputter());  // injects a report into the console and throws
 }
 // back to normal
 let vhm = new ValueHostsManager(config);
```
## Adding to a unit test
We recommend that you create unit tests for each ValueHostRulesBase subclass
that uses your production version of `JivsServices`.
```ts
test('Check ValueHostRules against the services', () => {
    let services = createJivsServices('en-US');    // your production services 
    let rules = new ValueHostRules(services);
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
    expect(explorer.hasErrors()).toBeFalse(); // if it fails, you know to review your ValueHost Rules against the jivsservices.
});
```
## Sample output: Conditions are not registered
```ts
explorer.reportToConsole(
    { severities: [CAIssueSeverity.error] }, 
    { severities: [CAIssueSeverity.error] }, 
    false, 2);
```
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
## Sample output: Missing the parser
```ts
explorer.reportToConsole(
    { severities: [CAIssueSeverity.error] }, 
    { severities: [CAIssueSeverity.error] }, 
    false, 2);
```
```json
{
  "valueHostQueryResults": [
    {
      "path": {
        "ValueHost": "NewField",
        "Property": "parserLookupKey"
      },
      "result": {
        "feature": "Property",
        "propertyName": "parserLookupKey",
        "severity": "error",
        "message": "Not found. Please register a DataTypeParser to dataTypeParserService."
      }
    }
  ],
  "lookupKeyQueryResults": [
    {
      "path": {
        "LookupKey": "Date",
        "Parser": null,
        "ParsersByCulture": "en"
      },
      "result": {
        "feature": "ParsersByCulture",
        "cultureId": "en",
        "parserResults": [],
        "notFound": true,
        "severity": "error",
        "message": "No DataTypeParser for LookupKey \"Date\" with culture \"en\""
      }
    }
  ]
}
```
## Sample output: Localized error messages that will be used
```ts
explorer.reportToConsole(
    { features: [CAFeature.l10nProperty] }, 
    false, 
    false, 2);
```
```json
{
  "valueHostQueryResults": [
    {
      "path": {
        "ValueHost": "Field1",
        "Validator": "RequireText",
        "l10nProperty": "errorMessagel10n"
      },
      "result": {
        "feature": "l10nProperty",
        "propertyName": "errorMessage",
        "l10nPropertyName": "errorMessagel10n",
        "l10nKey": "RequiredEM",
        "cultureText": {
          "en": {
            "text": "This field is required.",
            "severity": "info"
          },
          "es": {
            "text": "Este campo es obligatorio.",
            "severity": "info"
          }
        }
      }
    }
  ]
}
```
# Installing Jivs-ConfigAnalysis
Jivs-ConfigAnalysis is available on npm: [Jivs-ConfigAnalysis npm package](https://www.npmjs.com/package/@plblum/jivs-configanalysis).
```
npm install --save @plblum/jivs-configanalysis
```
[Source code](https://github.com/plblum/jivs/packages/jivs-configanalysis) is open source on GitHub.

# Using Jivs-ConfigAnalysis
Call the `analyze() function` on `ConfigAnalysisServices` after configuring, but before creating
the `ValueHostsManager`.

```ts
import { installConfigAnalysisService } from "@plblum/jivs-configanalysis/build/ConfigAnalysisService";
let services = createJivsServices('en');
let rules = new MyValueHostRules();
let config = rules.configure();

let configAnalysisService = installConfigAnalysisService(services);
let explorer = configAnalysisService.analyze(config);
... test against the explorer object ...
let vhm = new ValueHostsManager(config);
```
## explorer: ConfigAnalysisResultsExplorer
*explorer* is a `ConfigAnalysisResultsExplorer object`, with the complete results of the analysis in its `results property`. It is a tree with some depth, so it's not easy to manually navigate. So `ConfigAnalysisResultsExplorer` includes a number of helper functions to focus on specific information.
Those functions are especially useful within unit tests. It generates a report from that tree, outputting it to the console or other tools.

```ts
interface IConfigAnalysisResultsExplorer {
  results: IConfigAnalysisResults;

// just tell me if there are errors
  hasErrors(): boolean;
  throwOnErrors(includeAnalysisResults?, outputter?): void;
  
// I have a query against ValueHostConfig results (results.valueHostResults)
  hasMatchInConfigResults(criteria): boolean;
  countConfigResults(criteria): number;
  queryValueHostResults(criteria): CAPathedResult<any>[];  
  
// I have query against Lookup Key results (results.lookupKeyResults)
  hasMatchInLookupKeyResults(criteria): boolean;
  countLookupKeyResults(criteria): number;
  queryLookupKeyResults(criteria): CAPathedResult<any>[];

// For specific results from query functions
  getByResultPath(path, foundResults): null | CAResultBase;  
  
// Output the results with optional criteria as a "report"  
  reportIntoJson(valueHostCriteria, lookupKeyCriteria, includeCompleteResults, space?): string;
  reportToConsole(valueHostCriteria, lookupKeyCriteria, includeCompleteResults, space?): void;
  report(valueHostCriteria, lookupKeyCriteria, includeCompleteResults, outputter): any;
}
```
- `results` - The raw results, where `valueHostResults` and `lookupKeyResults` each have a tree of their own.
	```ts
	interface IConfigAnalysisResults {
	  cultureIds: string[];
	  valueHostNames: string[];
	  valueHostResults: ValueHostConfigCAResult[];
	  lookupKeyResults: LookupKeyCAResult[];
	}
	```
  This data is optionally included in the 3 _report_ functions, when `includeCompleteResults` is true. Use the reports and query functions to search `valueHostResults` and `lookupKeyResults`.
- `hasErrors` - When true, at least one error was found. While there may also be warnings and info level data, they are ignored here.
	```ts
	if (explorer.hasErrors())
	{
	   // Do something with the errors such as report to the console:
	   explorer.reportToConsole(
        { severities: [CAIssueSeverity.error] }, 
        { severities: [CAIssueSeverity.error] });
	}
	```
- `throwOnErrors` - Throws an error and optionally writes to the console if at least one error was found. 
	```ts
	// exception will contain a JSON object with the errors
	explorer.throwOnErrors();
	// if you want to write to console as well
	explorer.throwOnErrors(false, new ConsoleConfigAnalysisOutputter());
	// That outputter parameter allows you to write to anything that implements IConfigAnalysisOutputter
	```
- `hasMatchInConfigResults` - Returns true if your query has at least one match within `results.valueHostResults`. See ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
- `countConfigResults` - Returns a count of matches to your query within `results.valueHostResults`. See ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
- `queryValueHostResults` - Returns an array of matches or null if none. The array is a flattened version of `results.valueHostResults`. See ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
- `hasMatchInLookupKeyResults` - Returns true if your query has at least one match within `results.lookupKeyResults`. See ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
- `countLookupKeyResults` - Returns a count of matches to your query within `results.lookupKeyResults`. See ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
- `queryLookupKeyResults` - Returns an array of matches or null if none. The array is a flattened version of `results.lookupKeyResults`. See ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
- `reportIntoJson` - Outputs data in JSON format. Parameters are:
	+ `valueHostCriteria` - To include all valueHostResults, supply true. To omit valueHostResults, supply false or null. To supply a query, see ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
	+ `lookupKeyCriteria` - To include all lookupKeyResults, supply true. To omit lookupKeyResults, supply false or null. To supply a query, see ["Supplying criteria"](#supplying-criteria-to-query-the-explorer) below.
	+ `includeCompleteResults` - When true, include the complete explorer.results object.
	
- `reportToConsole` - Outputs data to console. See `reportIntoJson()` for parameters. In addition:
	+ `space` - When a number or string, it is passed to JSON.stringify() to specify indentation. When null or undefined, it is sent to console in object form, allowing the browser to provide a drill down UI.
- `report` - Both `reportIntoJson()` and `reportToConsole()` use this, and supply a specific value to its outputter parameter. If you want to chose a different format or destination, use this function with a suitable outputter object. See `reportIntoJson()` for parameters. In addition:
	+ `outputter` - An implementation of `IConfigAnalysisOutputter` that takes the report data, formats it and sends it to the destination. Here are classes already included with Jivs:
		* `ConsoleConfigAnalysisOutputter` - Use the supplied formatter and send the result to the console.
		* `LoggerConfigAnalsysOutputter` - Use the supplied formatter and send the result to the LoggerService.
		* `NullConfigAnalysisOutputter` - The `report()` function returns the formatted result. If you don't want to output it but intend to capture the function result, use this and supply a formatter.
		* `JsonConfigAnalysisOutputFormatter` - A formatter object that converts the report data into JSON.
		* `CleanedObjectConfigAnalysisOutputFormatter` - A formatter object that creates a variation of the report data object, without some internal properties. Generally use this if you want to return the report data as an object from the `report()` function.
		
### Supplying criteria to query the explorer
Many functions on `ConfigAnalysisResultsExplorer` query the results, and depend on you to supply criteria.

#### Example
Let's suppose that you wanted to see all errors, and one was found, where you had requested a parser that was not registered.
```ts
class MyValueHostRules extends ValueHostRulesBase
{
  constructor(services: IJivsServices) {
      super(services);
  }
  protected override configureRules(builder: IValueHostsManagerConfigBuilder, options?: ValueHostRulesOptions | undefined): void {
    builder.input('NewField', LookupKey.Date, 
    {
      parserLookupKey: LookupKey.Date,    // wants a parser, which should be ShortDatePatternParser
    });
  }

}
let services = createJivsServices('en-US');
let rules = new MyValueHostRules(services);
let config = rules.configure();

let configAnalysisService = installConfigAnalysisService(services);
let explorer = configAnalysisService.analyze(config);	

let valHostCriteria: IConfigAnalysisSearchCriteria = { 
  severities: [CAIssueSeverity.error], 
  skipChildrenIfParentMismatch: false };
let lookupKeyCriteria: IConfigAnalysisSearchCriteria = { 
  severities: [CAIssueSeverity.error], 
  skipChildrenIfParentMismatch: false };
explorer.reportToConsole(valHostCriteria, lookupKeyCriteria, false);
```
Console output:
```json
{
  "valueHostQueryResults": [
    {
      "path": {
        "ValueHost": "NewField",
        "Property": "parserLookupKey"
      },
      "result": {
        "feature": "Property",
        "propertyName": "parserLookupKey",
        "severity": "error",
        "message": "Not found. Please register a DataTypeParser to dataTypeParserService."
      }
    }
  ],
  "lookupKeyQueryResults": [
    {
      "path": {
        "LookupKey": "Date",
        "Parser": null,
        "ParsersByCulture": "en"
      },
      "result": {
        "feature": "ParsersByCulture",
        "cultureId": "en",
        "parserResults": [],
        "notFound": true,
        "severity": "error",
        "message": "No DataTypeParser for LookupKey \"Date\" with culture \"en\""
      }
    }
  ]
}
```
#### Understanding the criteria: IConfigAnalysisSearchCriteria
This is the criteria structure, `IConfigAnalysisSearchCriteria`. Aside from the first, each property is named to match a property on results. So if you wanted to narrow to a culture ID, use the cultureIds property.
```ts
interface IConfigAnalysisSearchCriteria {
  skipChildrenIfParentMismatch?: boolean;
  
  features?: string[];
  severities?: (null | CAIssueSeverity)[];
  propertyNames?: string[];

  valueHostNames?: string[];
  errorCodes?: string[];
  conditionTypes?: string[];
  
  lookupKeys?: string[];
  serviceNames?: string[];	  
  cultureIds?: string[];
}
```
When you use two or more (except skipChildrenIfParentMismatch), they must all be matched to be included in the results. 
```ts
{ features: ['Identifier'], severities: [CAIssueSeverity.error] } => Identifier AND error
```
If any array has two or more, any must be matched.
```ts
{ severities: [CAIssueSeverity.error, CSIssueSeverity.warning] } => error or warning
```
- `skipChildrenIfParentMismatch` - When true, if a parent does not match, don't check its children for matches. When false, still check the children. When omitted, it defaults to true.
- `features` - Each result has a property called 'feature' which has these possible values: `ValueHost`, `Validator`, `Condition`, `LookupKey`, `Identifier`, `Converter`, `Comparer`, `Parser`, `ParsersByCulture`, `ParserFound`, `Formatter`, `FormattersByCulture`, `Property`, `l10nProperty`, `Error`
- `severities` - Use when looking at the severity property. Specify `error`, `warning`, `info` or add use null to match when there is no severity assigned.
	```ts
	{ severities: [CAIssueSeverity.info, null] } => info or no severity assigned
	```
- `propertyNames` - Use when matching to the `propertyName` property.
- `valueHostNames` - Use when matching to `valueHostName` property, which is only found in `ValueHost` features.
- `errorCodes` - Use when matching to the `errorCode` property, which is only found in `Validator` features.
- `conditionTypes` - Use when matching to the `conditionType` property, which is only found on `Condition` features.
- `lookupKeys` - Use when matching to the `lookupKey` property, which is only found in `LookupKey` features.
- `serviceNames` - Use when matching to the `serviceName` property, which is only found service-oriented feature.
- `cultureIds` - Use when matching to the culture related properties, found in some services.
### Structure of each result
Queries return a reference to a node in the `explorer.results.valueHostResults` or `explorer.results.lookupKeyResults` tree. The provide a path to the node, and an object describing the result.
```ts
interface CAPathedResult<T> {
  path: CAResultPath; // path within the tree where the result was found
  result: T; // object describing a single result
}
```
In the earlier example, there were two results with these paths:
```json
"path": {
  "ValueHost": "NewField",
  "Property": "parserLookupKey"
},

```
ValueHost="NewField" contains Property="parserLookupKey"
```json
"path": {
  "LookupKey": "Date",
  "Parser": null,
  "ParsersByCulture": "en"
},

```
LookupKey="Date with a Parser service where the culture of the service = "en"
```json
"path": {
  "LookupKey": "Date",
  "Parser": null,
  "ParsersByCulture": "en"
},
```