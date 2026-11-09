# Examples and add-ins
The following examples are found here, with separate files for source code and unit tests.

This project group provides:
- Examples to learn how to code some of the parts of Jivs
- Add in code to cover some use cases that are not frequently enough used to go directly into jivs-engine.

Please copy any of these files into your app if they fit your use case.

## Configuration
- Config_with_a_model.ts - Create a subclass of ValueHostRulesBase to configure your model's 
business logic rules.
- Config_without_a_model.ts - Create a subclass of ValueHostRulesBase to configure fields
on a form when you don't have a model.

## Custom data types
Each file introduces a new data type. Data types often introduce:
- DataTypeCheck condition + validator
- `DataTypeParser` and `DataTypeFormatter` to move between the native type and its localized textual representation
- `DataTypeConverter` to represent the native value as a comparable value, like a number or string
- `DataTypeIdentifier` to recognize the native value when its a custom object

### EmailAddressDataType.ts, LookupKey="EmailAddress"
_Add to your app and use as a learning tool._

Once added to your app, use `builder.field('name', 'EmailAddress')` and you will automatically get a DataTypeCheck validator for email address.
- `EmailAddressCondition` - Plus wiring for the builder to use: `builder.field('name').emailAddress()`
- Automatic DataTypeCheck + validator added to `DataTypeCheckGeneratorService`.

### EnumByNumberDataTypes.ts, for enumerated data types
_Add to your app and use as a learning tool._

Provides classes to add new data types that are associated with enumerated types whose key is an integer.
- `EnumByNumberFormatter` - Convert emum whose key is an integer to a string representation.
- `EnumByNumberParser` - Convert from string back to the integer used in an enumerated type.
- LookupKey="PhoneType" - Example that adds a new data type, "PhoneType".

### CreditCardNumberDataType.ts, LookupKey="CreditCardNumber"
_Add to your app and use as a learning tool._

Once added to your app, use `builder.field('name', 'CreditCardNumber')` and you will automatically get a DataTypeCheck validator for email address.
- `CreditCardNumberCondition` - Plus wiring for the builder to use: `builder.field('name').creditCardNumber()`
- `CreditCardNumberParser` - Convert a string into a valid credit card number pattern, with only digits remaining. Considers digits, hyphens, and spaces valid. Reports errors for any other character.
- Automatic DataTypeCheck + validator added to `DataTypeCheckGeneratorService`.
- LookupKey="CreditCardNumber"

### ExpiryDataType.ts, LookupKey="Expiry"
_Add to your app and use as a learning tool._

Once added to your app, use `builder.field('name', 'Expiry')`

Provides classes to support date entered with just month and year, such as for a credit card expiry value.
- `ExpiryParser` - Convert from month year string into a Date object
- `StringPatternedExpiryParser` - Convert from month year string into a string with a specific pattern.
- `ExpiryConverter` - For comparing two month-year values.
- Automatic DataTypeCheck + validator added to `DataTypeCheckGeneratorService`.
- LookupKey="Expiry"

### AnniversaryDataType.ts, LookupKey="Anniversary"
_Add to your app and use as a learning tool._

Once added to your app, use `builder.field('name', 'Anniversary')`

Provides classes to support date entered with just month and day, such as for an anniversary.
- `AnniversaryParser` - Convert from month/day string into a Date object
- `AnniversaryConverter` - For comparing two month-day values.
- Automatic DataTypeCheck + validator added to `DataTypeCheckGeneratorService`.
- LookupKey="Anniversary"

## More Examples
- RelativeDate_class.ts - You have a class called RelativeDate that you use to return 
  a Date object based on rules relative to today, such as "yesterday" or "1 month ago".
  You want Jivs to see it as if it was a Date object in validation rules.
  It introduces a LookupKey ("RelativeDate"), `DataTypeIdentifier`, and `DataTypeConverter`.
- TimeSpan_class.ts - You have a class called TimeSpan that you use to represent
  a value of hours, minutes, and seconds.
  You want it to be available in conditions as if its a single number, either a number of 
  hours or number of seconds.
  It introduces a LookupKey ("TimeSpan"), `DataTypeIdentifier`, and two `DataTypeConverters`.  
- EvenNumberCondition.ts - For learning how to build a condition, create a new Condition that will require even numbers.
  Introduces a ConditionType ("EvenNumber"), a Condition class, and support within the Builder object.
- DifferenceBetweenDates.ts - Demonstrates the use of a `CalcValueHost` to help build a condition
  that compares two values, one is the difference in days between StartDate and EndDate,
  the other is the number of days. It uses the LessThan condition, with the number of days set to 10.
