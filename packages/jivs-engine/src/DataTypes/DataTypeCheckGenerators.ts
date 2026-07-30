/**
 * {@inheritDoc jivs-engine/DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator:interface }
 * @module jivs-engine/DataTypes/ConcreteClasses/DataTypeCheckGenerators
 */
import { IConditionFactory, ICondition } from '../Interfaces/Conditions';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IDataTypeCheckGenerator } from '../Interfaces/DataTypeCheckGenerator';
import { LookupKey } from './LookupKeys';
import { DataTypeCheckConditionConfig } from '../Conditions/ConcreteConditions';
import { ConditionType } from '../Conditions/ConditionTypes';

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
            valueHostName: valueHost.getName()
        } as DataTypeCheckConditionConfig)));
        conditions.push(conditionfactory.create(({
            conditionType: ConditionType.Integer,
            valueHostName: valueHost.getName()
        } as DataTypeCheckConditionConfig)));        
        return conditions;
    }
}