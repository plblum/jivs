# Examples of classes that extend Jivs
The following examples are found here, with separate files for source code and unit tests.
- AnniversaryConverter - Create a new data type, "Anniversary", which is the month and day parts from a Date object.
  It introduces a LookupKey and DataTypeConverter.
- MonthYearConverter - Create a new data type, "MonthYear", which is the month and year parts from a Date object.
  It introduces a LookupKey and DataTypeConverter.
- EmailAddressDataType - Create a new data type, "EmailAddress", which uses a string and a regular expression pattern.
  It introduces a LookupKey, Condition that implements the regular expression, and DataTypeCheckGenerator
  to automatically generator your condition when the ValueHost.DataType is "EmailAddress".
- RelativeDate_class - You have a data type called RelativeDate, a class that you use to return 
  a Date object based on rules relative to today, such as "yesterday" or "1 month ago".
  You want Jivs to see it as if it was a Date object in validation rules.
  It introduces a LookupKey ("RelativeDate"), DataTypeIdentifier, and DataTypeConverter.
- TimeSpan_class - You have a data type called TimeSpan, a class that you use to represent
  a value of hours, minutes, and seconds.
  You want it to be available in conditions as if its a single number, either a number of 
  hours or number of seconds.
  It introduces a LookupKey ("TimeSpan"), DataTypeIdentifier, and two DataTypeConverters.  