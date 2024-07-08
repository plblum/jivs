/**
 * Lookup keys that identify data types and associated formatters.
 * These are used throughout the system such as:
 * - ValueHostConfig.dataType property is a Lookup Key to best identify the data type.
 *   By "best", think of a string data type. While you can use a Lookup Key of "String" (LookupKey.String const),
 *   it may actually be a phone number or email address. These are in fact data types.
 *   So you might want to create Lookup Keys for them, and where appropriate, provide a supporting
 *   IDataTypeIdentifier, IDataTypeFormatter, IDataTypeConverter, and/or IDataTypeComparer.
 * - ValidationServices.dataTypeIdentifierService to work with IDataTypeIdentifiers.
 * - ValidationServices.dataTypeFormatterService to work with IDataTypeFormatters.
 * - ValidationServices.dataTypeConverterService to work with IDataTypeConverters.
 * - ValidationServices.dataTypeComparerService to work with IDataTypeComparers.
 * - Error message tokens, like "{Value}" and "{Minimum}", get native values replaced by formatted and localized strings.
 *   By default, they select a IDataTypeFormatter from the ValueHostConfig.dataType property
 *   or the native data type itself. However, you may want different formatting.
 *   That comes from specifying a Lookup Key as part of the token like this: "{Value:AbbrevDate}" and "{Minimum:Uppercase}"
 * - Conditions that compare two values have a ConversionLookupKey property to override any default conversion. 
 *   Example: comparing two strings case insensitively using "CaseInsensitive" lookup key.
 * @module DataTypes/Types/LookupKey
 */

export enum LookupKey {
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'string'
     * | Lookup Key                     | "String"
     * | IDataTypeIdentifier            | StringDataTypeIdentifier
     * | IDataTypeFormatter    | StringFormatter
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * 
     * @Group Native Data Type
     * @remarks
     * This is used when no Lookup Key is supplied.
     */
    String = 'String',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'number'
     * | Lookup Key                     | "Number"
     * | IDataTypeIdentifier            | NumberDataTypeIdentifier
     * | IDataTypeFormatter    | NumberFormatter
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * @Group Native Data Type
     * @remarks
     * This is used when no Lookup Key is supplied.
     */
    Number = 'Number', // Number data type
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'boolean'
     * | Lookup Key                     | "Boolean"
     * | IDataTypeIdentifier            | BooleanDataTypeIdentifier
     * | IDataTypeFormatter    | BooleanFormatter
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | BooleanDataTypeComparer, returns only Equal and NotEqual
     * @Group Native Data Type
     * @remarks
     * This is used when no Lookup Key is supplied.
     * If used, BooleanFormatter needs your configuration to know the supported 
     * cultures associated values for "true" and "false"
     */
    Boolean = 'Boolean',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "Date"
     * | IDataTypeIdentifier            | DateDataTypeIdentifier
     * | IDataTypeFormatter             | DateFormatter
     * | IDataTypeConverter             | UTCDateOnlyConverter
     * | IDataTypeComparer              | default
     * @Group Native Data Type
     * @remarks
     * Just the date part of a Date object. Assumes UTC. 
     * This is used when no Lookup Key is supplied because its a much more common case to use just dates.
     */
    Date = 'Date',

    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "DateTime"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | DateTimeFormatter
     * | IDataTypeConverter             | DateTimeConverter
     * | IDataTypeComparer              | default
     * @Group Native Data Type
     */
    DateTime = 'DateTime',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "LocalDate"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | DateFormatter
     * | IDataTypeConverter             | LocalDateOnlyConverter
     * | IDataTypeComparer              | default
     * @Group Native Data Type
     * @remarks
     * For when the Date is not in UTC.
     */
    LocalDate = 'LocalDate',

    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'string'
     * | Lookup Key                     | "Capitalize"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | CapitalizeStringFormatter
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * 
     * @Group Formatter
     * @remarks
     * First letter of a string is converted to uppercase.
     */
    Capitalize = 'Capitalize',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'string'
     * | Lookup Key                     | "Uppercase"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | UppercaseStringFormatter
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * 
     * @Group Formatter
     * @remarks
     * String is converted to uppercase.
     */
    Uppercase = 'Uppercase',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'string'
     * | Lookup Key                     | "Lowercase"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | LowercaseStringFormatter
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * 
     * @Group Formatter
     * @remarks
     * String is converted to Lowercase.
     */
    Lowercase = 'Lowercase',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'string'
     * | Lookup Key                     | "Integer"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | IntegerFormatter, uses Intl API
     * | IDataTypeConverter             | IntegerConverter, uses Math.trunc()
     * | IDataTypeComparer              | default
     * @Group Formatter
     * @remarks
     * When number is a whole number
     */
    Integer = 'Integer',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'number'
     * | Lookup Key                     | "Currency"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | CurrencyFormatter, uses Intl API
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * @Group Formatter
     * @remarks
     * CurrencyFormatter needs your configuration to know the app's supported cultures
     * and associated currency codes (like USD, EUR).
     */
    Currency = 'Currency',    // number with currency formatting, including negatives.
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'number'
     * | Lookup Key                     | "Percentage"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | PercentageFormatter, uses Intl API
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * @Group Formatter
     * @remarks
     * When number is a percentage, where 1.0 = 100%.
     */
    Percentage = 'Percentage',    // number treated as a percentage where 1.0 = 100%, with optional Percent formatting, including negatives.
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'number'
     * | Lookup Key                     | "Percentage100"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter             | Percentage100Formatter, uses Intl API
     * | IDataTypeConverter             | none
     * | IDataTypeComparer              | default
     * @Group Formatter
     * @remarks
     * When number is a percentage, where 100 = 100%.
     */
    Percentage100 = 'Percentage100',  // number treated as a percentage where 100=100%, with optional Percent formatting, including negatives.

    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "ShortDate"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | DateFormatter, uses Intl API
     * | IDataTypeConverter             | n/a
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Localized short date pattern, 1 or 2 digit month and day, 4 digit year.
     */
    ShortDate = 'ShortDate',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "AbbrevDate"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | AbbrevDateFormatter, uses Intl API
     * | IDataTypeConverter             | n/a
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Localized abbreviated date pattern, month name to 3 letters.
     */
    AbbrevDate = 'AbbrevDate',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "LongDate"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | LongDateFormatter, uses Intl API
     * | IDataTypeConverter             | n/a
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Localized long date pattern, with complete month names.
     */
    LongDate = 'LongDate',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "AbbrevDOWDate"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | AbbrevDOWDateFormatter, uses Intl API
     * | IDataTypeConverter             | n/a
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Localized abbreviated date pattern and the day of week, month and DOW name to 3 letters.
     */
    AbbrevDOWDate = 'AbbrevDOWDate',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "LongDOWDate"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | LongDOWDateFormatter, uses Intl API
     * | IDataTypeConverter             | n/a
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Localized Strings in an long date pattern and the day of week, complete month and DOW names.
     */
    LongDOWDate = 'LongDOWDate',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "TimeOfDay"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | TimeOfDayFormatter, uses Intl API
     * | IDataTypeConverter             | TimeOfDayOnlyConverter, as total minutes
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Localized time of day part of date without seconds
     */
    TimeOfDay = 'TimeOfDay',
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "TimeOfDayHMS"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | TimeOfDayHMSFormatter, uses
     * | IDataTypeConverter             | TimeOfDayHMSOnlyConverter, as total seconds
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Localized time of day part of date with seconds
     */
    TimeOfDayHMS = 'TimeOfDayHMS',    // For time of day part of date with seconds

    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'boolean'
     * | Lookup Key                     | "YesNoBoolean"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter             | YesNoBooleanFormatter
     * | IDataTypeConverter             | n/a
     * | IDataTypeComparer              | n/a
     * @Group Formatter
     * @remarks
     * Converts boolean into "yes" and "no".
     * This LookupKey is a model for the user to create more language specific boolean values.
     * If used, YesNoBooleanFormatter needs your configuration to know the supported 
     * cultures associated values for "yes" and "no"
     */
    YesNoBoolean = 'YesNoBoolean',

    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "TotalDays"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter    | n/a
     * | IDataTypeConverter             | TotalDaysConverter
     * | IDataTypeComparer              | default
     * @Group Converter
     * @remarks
     * For converting the Date into a number of days since Jan 1 1970.
     * Helps with comparing the difference between two dates. 
     */
    TotalDays = 'TotalDays',

    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "Milliseconds"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter    | n/a
     * | IDataTypeConverter             | DateTimeConverter
     * | IDataTypeComparer              | default
     * @Group Converter
     * @remarks
     * For converting the Date into a number of milliseconds since Jan 1 1970
     * (basically calling getTime() on the Date object)
     * Helps with comparing the difference between two dates. 
     */
    Milliseconds = 'Milliseconds',    
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "Seconds"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter    | n/a
     * | IDataTypeConverter             | TimeOfDayHMSOnlyDateTimeConverter
     * | IDataTypeComparer              | default
     * @Group Converter
     * @remarks
     * For converting the Date into a number of seconds since Jan 1 1970
     * Helps with comparing the difference between two dates. 
     */
    Seconds = 'Seconds',
        /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | value instanceof Date
     * | Lookup Key                     | "Minutes"
     * | IDataTypeIdentifier            | none
     * | IDataTypeFormatter    | n/a
     * | IDataTypeConverter             | TimeOfDayOnlyConverter
     * | IDataTypeComparer              | default
     * @Group Converter
     * @remarks
     * For converting the Date into a number of minutes since Jan 1 1970
     * Helps with comparing the difference between two dates. 
     */
    Minutes = 'Minutes',
    
    /**
     * | Label                          | Value
     * | ------                         | ------
     * | Native value                   | typeof value === 'string'
     * | Lookup Key                     | "CaseInsensitive"
     * | IDataTypeIdentifier            | n/a
     * | IDataTypeFormatter    | n/a
     * | IDataTypeConverter             | CaseInsensitiveConverter
     * | IDataTypeComparer              | default
     * 
     * @Group Converter
     * @remarks
     * For case insensitive string comparisons. Generally set this on the ConditionConfig's
     * ConversionLookupKey and SecondConversionLookupKey properties.
     */
    CaseInsensitive = 'CaseInsensitive'
}