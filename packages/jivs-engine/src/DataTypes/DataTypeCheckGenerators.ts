/**
 * Concrete implementations of IDataTypeCheckGenerator.
 * 
 * {@inheritDoc DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator:interface }
 * @module DataTypes/ConcreteClasses/DataTypeCheckGenerators
 */
import { IConditionFactory, ICondition } from '../Interfaces/Conditions';
import { IInputValueHost } from '../Interfaces/InputValueHost';
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
    private _dataTypeLookupKey: string;

    public supportsValue(dataTypeLookupKey: string): boolean {
        return this._dataTypeLookupKey === dataTypeLookupKey;
    }
    public createConditions(valueHost: IInputValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): Array<ICondition> {
        let conditions: Array<ICondition> = [];
        conditions.push(conditionfactory.create(<DataTypeCheckConditionConfig>{
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: valueHost.getName()
        }));
        conditions.push(conditionfactory.create(<DataTypeCheckConditionConfig>{
            conditionType: ConditionType.Integer,
            valueHostName: valueHost.getName()
        }));        
        return conditions;
    }
}