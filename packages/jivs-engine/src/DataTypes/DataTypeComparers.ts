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

/**
 * Just the function for a DataTypeComparer that handles numbers and strings. 
 * Supports Equals, LessThan, and Greater using the native Javascript operators
 * of ===, <, >. If the two values are the same type, it can use LessThan/GreaterThan.
 * Otherwise, it returns NotEquals.
 * By the time this is called, dataTypeComparerService.compare() has handled out all other datatypes.
 * @param value1 
 * @param value2 
 */
export function defaultComparer(value1: any, value2: any): ComparersResult {
    assertPrimitive(value1);
    assertPrimitive(value2);
    if (value1 === value2)
        return ComparersResult.Equals;
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
 * so they have two comparable results, Equals and NotEquals.
 * This class will handle any time EITHER value of a comparison
 * is boolean.
 * It returns Equals when both are boolean and match their values.
 * It returns NotEquals when both are boolean and do not match,
 * or when one is boolean and the other is null (for nullable booleans).
 * The rest are Undetermined
 */
export class BooleanDataTypeComparer implements IDataTypeComparer
{
    public supportsValues(value1: any, value2: any): boolean {
        let isBool1 = typeof value1 === 'boolean';
        let isBool2 = typeof value2 === 'boolean';
        return isBool1 || isBool2;
    }
    public compare(value1: any, value2: any): ComparersResult {
        let isBool1 = typeof value1 === 'boolean';
        let isBool2 = typeof value2 === 'boolean';
    
        if (isBool1 && isBool2)
            return value1 === value2 ? ComparersResult.Equals : ComparersResult.NotEquals;
        if (value1 === null || value2 === null)
            return ComparersResult.NotEquals;
        return ComparersResult.Undetermined;
    }
}
