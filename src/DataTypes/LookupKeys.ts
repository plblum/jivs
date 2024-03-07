
/**
 * Predefined lookup keys that identify data types and associated formatters.
 * These are the basics.
 */
export const StringLookupKey = 'String'; // string as is.
export const CaseInsensitiveStringLookupKey = 'CaseInsensitive'; // string compares using lowercase
export const NumberLookupKey = 'Number'; // Number data type
export const BooleanLookupKey = 'Boolean'; // Boolean data type. Compares with Equals and NotEquals
export const DateLookupKey = 'Date';   // Just the date part of a Date object. Assumes UTC. This is the default for when no LookupKey is supplied
            // because its a much more common case to use just dates.
export const DateTimeLookupKey = 'DateTime';    // The date and time parts of the Date object.
export const MonthYearLookupKey = 'MonthYear'; // "expiry" when using a Date object and only need month and year. Assumes UTC
export const AnniversaryLookupKey = 'Anniversary';  // when using a Date object for same day and month each year. Assumes UTC
export const LocalDateLookupKey = "LocalDate";  // Just the date part of the Date object. Assumes Local time.
/**
 * Formatters for data types.
 */
export const CapitalizeStringLookupKey = 'Capitalize';  // string with first letter uppercase
export const UppercaseStringLookupKey = 'Uppercase';    // string with all letters uppercase
export const LowercaseStringLookupKey = 'Lowercase';    // string with all letters lowercase

export const IntegerLookupKey = 'Integer';  // integer only. negative, thousands separator supported
export const CurrencyLookupKey = 'Currency';    // number with currency formatting, including negatives.
export const PercentageLookupKey = 'Percentage';    // number treated as a percentage, with optional Percent formatting, including negatives.
// Flexible conversion from strings.
// When converting to a string, it uses the short date pattern.
export const ShortDateLookupKey = 'ShortDate'; // Strings in short date pattern, 1 or 2 digit month and day, 4 digit year.
export const AbbrevDateLookupKey = 'AbbrevDate';    // Strings in an abbreviated date pattern, month name to 3 letters.
export const LongDateLookupKey = 'LongDate';    // Strings in an full date pattern, complete month names.
export const AbbrevDOWDateLookupKey = 'AbbrevDOWDate';    // Strings in an abbreviated date pattern 
// and the day of week, month and DOW name to 3 letters.
export const LongDOWDateLookupKey = 'LongDOWDate';    // Strings in an full date pattern
// and the day of week, complete month and DOW names.
export const TimeOfDayLookupKey = 'TimeOfDay';  // For time of day part of date without seconds
export const TimeOfDayHMSLookupKey = 'TimeOfDayHMS';    // For time of day part of date with seconds

export const YesNoBooleanLookupKey = 'YesNoBoolean';    // From string, supports "yes" and "no"
// To string, always "yes" and "no" with localization applied.
// This LookupKey is a model for the user to create more language specific boolean values.

/**
     * Intended as a parameter for RegisterBuiltInLookupKeyFunctions
     * and includes all builtin lookup key functions.
     */
export const allBuiltInToStringLookupKeys = [
    StringLookupKey,
    CaseInsensitiveStringLookupKey,
    UppercaseStringLookupKey,
    LowercaseStringLookupKey,
    CapitalizeStringLookupKey,
    NumberLookupKey,
    IntegerLookupKey,
    CurrencyLookupKey,
    PercentageLookupKey,
    BooleanLookupKey,
    YesNoBooleanLookupKey,
    DateTimeLookupKey,
    DateLookupKey,
    AbbrevDateLookupKey,
    AbbrevDOWDateLookupKey,
    LongDateLookupKey,
    LongDOWDateLookupKey,
    TimeOfDayLookupKey,
    TimeOfDayHMSLookupKey
];
/**
 * Intended as a parameter for RegisterBuiltInLookupKeyFunctions
 * and includes a set of builtin lookup key functions that are common
 * to typical applications:
 * String, Number, Integer, Date.
 */
export const commonBuiltInToStringLookupKeys = [
    StringLookupKey,
    NumberLookupKey,
    IntegerLookupKey,
    DateLookupKey
];
