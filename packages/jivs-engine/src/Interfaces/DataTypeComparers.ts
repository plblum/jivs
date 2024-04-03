/**
 * {@inheritDoc DataTypes/Types/IDataTypeComparer!IDataTypeComparer:interface }
 * @module DataTypes/Types/IDataTypeComparer
 */

import { ComparersResult } from "./DataTypeComparerService";

/**
 * Class that compares two values to determine equality, less than, greater than.
 * Create classes for each data type that doesn't support the
 * ==, !=, <, > operators the desired way.
 * However, first consider using an IDataTypeConverter to convert
 * your data type into an integer, string, or date. Those will
 * be supported by the default comparer.
 * 
 * Register your implementation with ValidationServices.dataTypeComparerService.
 */
export interface IDataTypeComparer
{
    supportsValues(value1: any, value2: any): boolean;

    compare(value1: any, value2: any): ComparersResult;
}
