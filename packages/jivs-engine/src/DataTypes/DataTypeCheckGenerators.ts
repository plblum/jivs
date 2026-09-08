/**
 * {@inheritDoc jivs-engine/DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator:interface }
 * @module jivs-engine/DataTypes/ConcreteClasses/DataTypeCheckGenerators
 */
import { IConditionFactory, ICondition, ConditionCategory } from '../Interfaces/Conditions';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IDataTypeCheckGenerator } from '../Interfaces/DataTypeCheckGenerator';
import { LookupKey } from './LookupKeys';
import { DataTypeCheckConditionConfig } from '../Conditions/ConcreteConditions';
import { ConditionType } from '../Conditions/ConditionTypes';
import { assertNotNull } from '../Utilities/ErrorHandling';

/**
 * For dataTypeLookupKey=LookupKey.Integer
 * It adds DataTypeCheckCondition and IntegerCondition.
 */
export class IntegerDataTypeCheckGenerator implements IDataTypeCheckGenerator
{
    constructor(dataTypeLookupKey: string = LookupKey.Integer) {
        this._dataTypeLookupKey = dataTypeLookupKey;
    }
    private readonly _dataTypeLookupKey: string;

    public supportsValue(dataTypeLookupKey: string): boolean {
        return this._dataTypeLookupKey === dataTypeLookupKey;
    }
    public createConditions(valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): Array<ICondition> {
        const conditions: Array<ICondition> = [];
        conditions.push(conditionfactory.create(({
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: valueHost.getName(),
            category: ConditionCategory.DataTypeCheck
        } as DataTypeCheckConditionConfig)));
        conditions.push(conditionfactory.create(({
            conditionType: ConditionType.Integer,
            valueHostName: valueHost.getName(),
            category: ConditionCategory.DataTypeCheck
        } as DataTypeCheckConditionConfig)));        
        return conditions;
    }
}

/**
 * Creates a DataTypeCheck condition for strings supported by a regular expression.
 * Automatically created by DataTypeCheckGeneratorService.registerLookupKey(lookupKey, data).
 * Data can be:
 * - A RegExp instance, which will be used to create a RegExpCondition.
 * - An array of strings, which will be converted to a RegExp internally.
 *  Each will match the entire string case sensitively.
 * Results in a RegExpCondition with Category=DataTypeCheck and expression = regexp.
 */
export class RegExpDataTypeCheckGenerator implements IDataTypeCheckGenerator
{
    constructor(dataTypeLookupKey: string, data: RegExp | Array<string>)
    {
        assertNotNull(data, 'data');
        this._dataTypeLookupKey = dataTypeLookupKey;
        this._regexp = data instanceof RegExp ? data : this.toRegExp(data);
    }

    protected get dataTypeLookupKey(): string {
        return this._dataTypeLookupKey;
    }
    private readonly _dataTypeLookupKey: string;

    protected get RegExp(): RegExp {
        return this._regexp;
    }
    private readonly _regexp: RegExp;

    /**
     * Converts the strings into a RegExp instance that must entirely match 
     * any of the strings case insensitively.
     * Applies regex encoding to ensure the entire string is matched.
     * @param data The array of strings to be converted into a RegExp.
     * @returns A RegExp instance that matches any of the strings entirely and case sensitively.
     */
    private toRegExp(data: Array<string>): RegExp
    {
        let encodedData = data.map(str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

        return new RegExp('^'+encodedData.join('|')+'$');
    }

    public supportsValue(dataTypeLookupKey: string): boolean {
        return this._dataTypeLookupKey === dataTypeLookupKey;
    }
    public createConditions(valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): Array<ICondition> {
        const conditions: Array<ICondition> = [];
        conditions.push(conditionfactory.create(({
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: valueHost.getName(),
            category: ConditionCategory.DataTypeCheck
        } as DataTypeCheckConditionConfig)));        
        conditions.push(conditionfactory.create(({
            conditionType: ConditionType.RegExp,
            valueHostName: valueHost.getName(),
            category: ConditionCategory.DataTypeCheck,
            expression: this._regexp
        } as DataTypeCheckConditionConfig)));
        return conditions;
    }
}