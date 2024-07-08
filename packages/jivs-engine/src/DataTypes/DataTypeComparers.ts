/**
 * Concrete implementations of IDataTypeComparer.
 * 
 * See IDataTypeConverter for more.
 * 
 * Comparison is handled by the dataTypeComparerService.compare() function.
 * If you register a class there, it will be checked against values supplied.
 * If none of the registered classes support those values, the values
 * are first converted via any IDataTypeConverters register. Once
 * again, the IDataTypeComparer will be checked. Again if none are supported,
 * the default comparison rule is applied. 
 * Default comparison is the DefaultComparer function below.
 * 
 * Expectation: Dates are handled by IDataTypeConverters. Thus no Comparer exists here.
 * @module DataTypes/ConcreteClasses/DataTypeComparers
 */

import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { IDataTypeComparer } from '../Interfaces/DataTypeComparers';
import { InvalidTypeError } from '../Utilities/ErrorHandling';
import { LookupKey } from './LookupKeys';

/**
 * Just the function for a DataTypeComparer that handles numbers and strings. 
 * Supports Equals, LessThan, and Greater using the native Javascript operators
 * of ===, <, >. If the two values are the same data type, it can use LessThan/GreaterThan.
 * Otherwise, it returns NotEqual.
 * By the time this is called, dataTypeComparerService.compare() has handled out all other datatypes.
 * @param value1 
 * @param value2 
 */
export function defaultComparer(value1: any, value2: any): ComparersResult {
    assertPrimitive(value1);
    assertPrimitive(value2);
    if (value1 === value2)
        return ComparersResult.Equal;
    if (typeof value1 === typeof value2) {
        if (value1 < value2)
            return ComparersResult.LessThan;
        return ComparersResult.GreaterThan;
    }
    return ComparersResult.Undetermined;
}

function assertPrimitive(value: any): void {
    if ((value != null) &&
        (typeof value === 'object' || Array.isArray(value)))
        throw new InvalidTypeError(value);
}

/**
 * IDataTypeComparer for booleans. Booleans have two states,
 * so they have two comparable results, Equal and NotEqual.
 * This class expects both values to be booleans.
 * Without any lookup key specified, it only checks the value types.
 * Otherwise, the LookupKeys must be LookupKey.Boolean.
 */
export class BooleanDataTypeComparer implements IDataTypeComparer
{
    public supportsValues(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): boolean {
        let isBool1 = typeof value1 === 'boolean';
        let isBool2 = typeof value2 === 'boolean';
        if (isBool1 && (lookupKey1 && lookupKey1 !== LookupKey.Boolean))
            return false;
        if (isBool2 && (lookupKey2 && lookupKey2 !== LookupKey.Boolean))
            return false;
        return isBool1 && isBool2;
    }
    public compare(value1: any, value2: any, lookupKey1: string | null, lookupKey2: string | null): ComparersResult {
        return value1 === value2 ? ComparersResult.Equal : ComparersResult.NotEqual;

    }
}
