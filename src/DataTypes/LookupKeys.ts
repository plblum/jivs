/**
 * Lookup keys that identify data types and associated formatters.
 * These are used throughout the system such as:
 * - ValueHostDescriptor.DataType property is a Lookup Key to best identify the data type.
 *   By "best", think of a string data type. While you can use a Lookup Key of "String" (StringLookupKey const),
 *   it may actually be a phone number or email address. These are in fact data types.
 *   So you might want to create Lookup Keys for them, and where appropriate, provide a supporting
 *   IDataTypeLocalizedFormatter, IDataTypeConverter, and/or IDataTypeComparer.
 * - DataTypeServices is a class that manages all things about data types and Lookup Keys.
 *   It is where you register any IDataTypeIdentifier, IDataTypeLocalizedFormatter, IDataTypeConverter, and/or IDataTypeComparer
 *   for your custom data types and Lookup Keys.
 * - Error message tokens, like "{Value}" and "{Minimum}", get native values replaced by formatted and localized strings.
 *   By default, they select a IDataTypeLocalizedFormatter from the ValueHostDescriptor.DataType property
 *   or the native data type itself. However, you may want different formatting.
 *   That comes from specifying a Lookup Key as part of the token like this: "{Value:AbbrevDate}" and "{Minimum:Uppercase}"
 * - Most Conditions have a ConversionLookupKey property to override any default conversion. 
 *   Example: comparing two strings case insensitively using "CaseInsensitive" lookup key.
 * @module DataTypes/LookupKeys
 */

/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'string'
 * | Lookup Key                     | "String"
 * | IDataTypeIdentifier            | StringDataTypeIdentifier
 * | IDataTypeLocalizedFormatter    | StringLocalizedFormatter
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * 
 * @Group Native Data Type
 * @remarks
 * This is used when no Lookup Key is supplied.
 */
export const StringLookupKey = 'String';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'number'
 * | Lookup Key                     | "Number"
 * | IDataTypeIdentifier            | NumberDataTypeIdentifier
 * | IDataTypeLocalizedFormatter    | NumberLocalizedFormatter
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * @Group Native Data Type
 * @remarks
 * This is used when no Lookup Key is supplied.
 */
export const NumberLookupKey = 'Number'; // Number data type
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'boolean'
 * | Lookup Key                     | "Boolean"
 * | IDataTypeIdentifier            | BooleanDataTypeIdentifier
 * | IDataTypeLocalizedFormatter    | BooleanLocalizedFormatter
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | BooleanComparer, returns only Equals and NotEquals
 * @Group Native Data Type
 * @remarks
 * This is used when no Lookup Key is supplied.
 * If used, BooleanLocalizedFormatter needs your configuration to know the supported 
 * cultures associated values for "true" and "false"
 */
export const BooleanLookupKey = 'Boolean';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "Date"
 * | IDataTypeIdentifier            | DateDataTypeIdentifier
 * | IDataTypeLocalizedFormatter    | DateLocalizedFormatter
 * | IDataTypeConverter             | UTCDateOnlyConverter
 * | IDataTypeComparer              | default
 * @Group Native Data Type
 * @remarks
 * Just the date part of a Date object. Assumes UTC. 
 * This is used when no Lookup Key is supplied because its a much more common case to use just dates.
 */
export const DateLookupKey = 'Date';

/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "DateTime"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | DateTimeLocalizedFormatter
 * | IDataTypeConverter             | DateTimeConverter
 * | IDataTypeComparer              | default
 * @Group Native Data Type
 */            
export const DateTimeLookupKey = 'DateTime'; 
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "LocalDate"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | DateLocalizedFormatter
 * | IDataTypeConverter             | LocalDateOnlyConverter
 * | IDataTypeComparer              | default
 * @Group Native Data Type
 * @remarks
 * For when the Date is not in UTC.
 */
export const LocalDateLookupKey = "LocalDate";

/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'string'
 * | Lookup Key                     | "Capitalize"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | CapitalizeStringLocalizedFormatter
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * 
 * @Group Formatter
 * @remarks
 * First letter of a string is converted to uppercase.
 */
export const CapitalizeStringLookupKey = 'Capitalize';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'string'
 * | Lookup Key                     | "Uppercase"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | UppercaseStringLocalizedFormatter
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * 
 * @Group Formatter
 * @remarks
 * String is converted to uppercase.
 */
export const UppercaseStringLookupKey = 'Uppercase';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'string'
 * | Lookup Key                     | "Lowercase"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | LowercaseStringLocalizedFormatter
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * 
 * @Group Formatter
 * @remarks
 * String is converted to Lowercase.
 */
export const LowercaseStringLookupKey = 'Lowercase'; 
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'string'
 * | Lookup Key                     | "Integer"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | IntegerLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | IntegerConverter, uses Math.round()
 * | IDataTypeComparer              | default
 * @Group Formatter
 * @remarks
 * When number is a whole number
 */
export const IntegerLookupKey = 'Integer';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'number'
 * | Lookup Key                     | "Currency"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | CurrencyLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * @Group Formatter
 * @remarks
 * CurrencyLocalizedFormatter needs your configuration to know the app's supported cultures
 * and associated currency codes (like USD, EUR).
 */
export const CurrencyLookupKey = 'Currency';    // number with currency formatting, including negatives.
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'number'
 * | Lookup Key                     | "Percentage"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | PercentageLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * @Group Formatter
 * @remarks
 * When number is a percentage, where 1.0 = 100%.
 */
export const PercentageLookupKey = 'Percentage';    // number treated as a percentage where 1.0 = 100%, with optional Percent formatting, including negatives.
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'number'
 * | Lookup Key                     | "Percentage100"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | Percentage100LocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | none
 * | IDataTypeComparer              | default
 * @Group Formatter
 * @remarks
 * When number is a percentage, where 100 = 100%.
 */
export const Percentage100LookupKey = 'Percentage100';  // number treated as a percentage where 100=100%, with optional Percent formatting, including negatives.

/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "ShortDate"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | DateLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | n/a
 * | IDataTypeComparer              | n/a
 * @Group Formatter
 * @remarks
 * Localized short date pattern, 1 or 2 digit month and day, 4 digit year.
 */
export const ShortDateLookupKey = 'ShortDate';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "AbbrevDate"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | AbbrevDateLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | n/a
 * | IDataTypeComparer              | n/a
 * @Group Formatter
 * @remarks
 * Localized abbreviated date pattern, month name to 3 letters.
 */
export const AbbrevDateLookupKey = 'AbbrevDate'; 
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "LongDate"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | LongDateLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | n/a
 * | IDataTypeComparer              | n/a
 * @Group Formatter
 * @remarks
 * Localized long date pattern, with complete month names.
 */
export const LongDateLookupKey = 'LongDate';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "AbbrevDOWDate"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | AbbrevDOWDateLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | n/a
 * | IDataTypeComparer              | n/a
 * @Group Formatter
 * @remarks
 * Localized abbreviated date pattern and the day of week, month and DOW name to 3 letters.
 */
export const AbbrevDOWDateLookupKey = 'AbbrevDOWDate';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "LongDOWDate"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | LongDOWDateLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | n/a
 * | IDataTypeComparer              | n/a
 * @Group Formatter
 * @remarks
 * Localized Strings in an long date pattern and the day of week, complete month and DOW names.
 */
export const LongDOWDateLookupKey = 'LongDOWDate';
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "TimeOfDay"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | TimeOfDayLocalizedFormatter, uses Intl API
 * | IDataTypeConverter             | TimeOfDayOnlyConverter, as total minutes
 * | IDataTypeComparer              | n/a
 * @Group Formatter
 * @remarks
 * Localized time of day part of date without seconds
 */
export const TimeOfDayLookupKey = 'TimeOfDay'; 
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "TimeOfDayHMS"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | TimeOfDayHMSLocalizedFormatter, uses
 * | IDataTypeConverter             | TimeOfDayHMSOnlyConverter, as total seconds
 * | IDataTypeComparer              | n/a
 * @Group Formatter
 * @remarks
 * Localized time of day part of date with seconds
 */
export const TimeOfDayHMSLookupKey = 'TimeOfDayHMS';    // For time of day part of date with seconds

/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'boolean'
 * | Lookup Key                     | "YesNoBoolean"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | YesNoBooleanLocalizedFormatter
 * | IDataTypeConverter             | n/a
 * | IDataTypeComparer              | BooleanComparer, returns Equals and NotEquals
 * @Group Formatter
 * @remarks
 * Converts boolean into "yes" and "no".
 * This LookupKey is a model for the user to create more language specific boolean values.
 * If used, YesNoBooleanLocalizedFormatter needs your configuration to know the supported 
 * cultures associated values for "yes" and "no"
 */
export const YesNoBooleanLookupKey = 'YesNoBoolean';

/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | value instanceof Date
 * | Lookup Key                     | "TotalDays"
 * | IDataTypeIdentifier            | none
 * | IDataTypeLocalizedFormatter    | n/a
 * | IDataTypeConverter             | TotalDaysConverter
 * | IDataTypeComparer              | default
 * @Group Converter
 * @remarks
 * For converting the Date into a number of days since Jan 1 1970.
 * Helps with comparing the difference between two dates. 
 */
export const TotalDaysLookupKey = 'TotalDays'; 
/**
 * | Label                          | Value
 * | ------                         | ------
 * | Native value                   | typeof value === 'string'
 * | Lookup Key                     | "CaseInsensitive"
 * | IDataTypeIdentifier            | n/a
 * | IDataTypeLocalizedFormatter    | n/a
 * | IDataTypeConverter             | CaseInsensitiveConverter
 * | IDataTypeComparer              | default
 * 
 * @Group Converter
 * @remarks
 * For case insensitive string comparisons. Generally set this on the ConditionDescriptor's
 * ConversionLookupKey and SecondConversionLookupKey properties.
 */
export const CaseInsensitiveStringLookupKey = 'CaseInsensitive';
