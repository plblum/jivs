# Examples of using and extending Jivs
The following examples are found here, with separate files for source code and unit tests.
## Configuration
- Config_with_BusinessLogic_using_Builder - Using the Builder API to create a ValidationManager configuration from business logic.
- Config_with_BusinessLogic_using_code_generator - Using a code generator to convert business logic validation rules into Jivs validation rules
- Config_entirely_in_UI_Layer - Using the Builder API to create a ValidationManager configuration entirely in the UI Layer.
## Conditions
- EvenNumberCondition - Create a new Condition that will require even numbers.
  Introduces a ConditionType ("EvenNumber"), a Condition class, and support within the Builder object.
## Custom data types with new Lookup Keys
- EmailAddressDataType - Create a new data type, "EmailAddress", which uses a string and a regular expression pattern.
  It introduces a LookupKey, Condition that implements the regular expression, and DataTypeCheckGenerator
  to automatically generator your condition when the ValueHost.DataType is "EmailAddress".
- EnumByNumberDataTypes - Demonstrates how to make Jivs recognized your enumerated types.
  It introduces a LookupKey ("PhoneType") with supporting Formatter and Parser.
  Use its EnumByNumberFormatter and EnumByNumberParser classes for your own enumerated types.
- AnniversaryConverter - Create a new data type, "Anniversary", which is the month and day parts from a Date object.
  It introduces a LookupKey and DataTypeConverter.
- MonthYearConverter - Create a new data type, "MonthYear", which is the month and year parts from a Date object.
  It introduces a LookupKey and DataTypeConverter.

- RelativeDate_class - You have a class called RelativeDate that you use to return 
  a Date object based on rules relative to today, such as "yesterday" or "1 month ago".
  You want Jivs to see it as if it was a Date object in validation rules.
  It introduces a LookupKey ("RelativeDate"), DataTypeIdentifier, and DataTypeConverter.
- TimeSpan_class - You have a class called TimeSpan that you use to represent
  a value of hours, minutes, and seconds.
  You want it to be available in conditions as if its a single number, either a number of 
  hours or number of seconds.
  It introduces a LookupKey ("TimeSpan"), DataTypeIdentifier, and two DataTypeConverters.  

## CalcValueHosts  
- DifferenceBetweenDates - Demonstrates the use of a CalcValueHost to help build a condition
  that compares two values, one is the difference in days between StartDate and EndDate,
  the other is the number of days. It uses the LessThan condition, with the number of days set to 10.
