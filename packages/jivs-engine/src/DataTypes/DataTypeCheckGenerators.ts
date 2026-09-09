/**
 * {@inheritDoc jivs-engine/DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator:interface }
 * @module jivs-engine/DataTypes/ConcreteClasses/DataTypeCheckGenerators
 */
import { IConditionFactory, ICondition, ConditionCategory, ConditionConfig } from '../Interfaces/Conditions';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IDataTypeCheckGenerator } from '../Interfaces/DataTypeCheckGenerator';
import { LookupKey } from './LookupKeys';
import { DataTypeCheckConditionConfig } from '../Conditions/ConcreteConditions';
import { ConditionType } from '../Conditions/ConditionTypes';
import { assertNotNull, CodingError } from '../Utilities/ErrorHandling';

/**
 * Base class implementation of IDataTypeCheckGenerator that is designed to handle
 * a specific data type identified by a lookup key.
 * It optionally adds a DataTypeCheckCondition in addition to those you add in 
 * additionalConditions()
 */
export abstract class DataTypeCheckGeneratorBase implements IDataTypeCheckGenerator
{
    constructor(dataTypeLookupKey: string, addDataTypeCheckCondition: boolean = true)
    {
        assertNotNull(dataTypeLookupKey, 'dataTypeLookupKey');
        this._dataTypeLookupKey = dataTypeLookupKey;
        this._addDataTypeCheckCondition = addDataTypeCheckCondition;
    }
    protected get dataTypeLookupKey(): string
    {
        return this._dataTypeLookupKey;
    }
    private readonly _dataTypeLookupKey: string;

    public supportsValue(dataTypeLookupKey: string): boolean
    {
        return this._dataTypeLookupKey === dataTypeLookupKey;
    }

    /**
     * When true, DataTypeCheckCondition is added. Defaults to true.
     */
    protected get addDataTypeCheckCondition(): boolean
    {
        return this._addDataTypeCheckCondition;
    }
    private _addDataTypeCheckCondition: boolean;

    public createConditions(valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): Array<ICondition>
    {
        const conditions: Array<ICondition> = [];
        if (this.addDataTypeCheckCondition)
        {
            conditions.push(conditionfactory.create(({
                conditionType: ConditionType.DataTypeCheck,
                valueHostName: valueHost.getName(),
                category: ConditionCategory.DataTypeCheck
            } as DataTypeCheckConditionConfig)));
        }

        this.addConditions(conditions, valueHost, dataTypeLookupKey, conditionfactory);
        return conditions;
    }
    protected abstract addConditions(conditions: Array<ICondition>,
        valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): void
    
}


/**
 * Provides an easy way to build a mapping between a Lookup Key and a list of Conditions
 * that will form the auto-generated validators.
 */
export class ListOfConditionsDataTypeCheckGenerator extends DataTypeCheckGeneratorBase
{
    constructor(dataTypeLookupKey: string, conditionConfigs: Array<ConditionConfig>, addDataTypeCheck: boolean = true)
    {
        super(dataTypeLookupKey, addDataTypeCheck);
        assertNotNull(conditionConfigs, 'conditionConfigs');
        if (conditionConfigs.length === 0)
        {
            throw new CodingError('conditionConfigs cannot be empty.');
        }
        this._conditionConfigs = conditionConfigs;
        for (let i = 0; i < conditionConfigs.length; i++)
            conditionConfigs[i].category = ConditionCategory.DataTypeCheck;
    }

    protected override addConditions(conditions: Array<ICondition>,
        valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): void
    {
        for (const conditionConfig of this._conditionConfigs)
        {
            conditions.push(conditionfactory.create(conditionConfig));
        }
    }


    protected get conditionConfigs(): Array<ConditionConfig>
    {
        return this._conditionConfigs;
    }
    private readonly _conditionConfigs: Array<ConditionConfig>;
}


/**
 * For dataTypeLookupKey=LookupKey.Integer
 * It adds DataTypeCheckCondition and IntegerCondition.
 */
export class IntegerDataTypeCheckGenerator extends DataTypeCheckGeneratorBase
{
    constructor(dataTypeLookupKey: string = LookupKey.Integer, addDataTypeCheck: boolean = true) {
        super(dataTypeLookupKey, addDataTypeCheck);
    }
    override addConditions(conditions: Array<ICondition>,
        valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): void {
        conditions.push(conditionfactory.create(({
            conditionType: ConditionType.Integer,
            valueHostName: valueHost.getName(),
            category: ConditionCategory.DataTypeCheck
        } as DataTypeCheckConditionConfig)));        
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
export class RegExpDataTypeCheckGenerator extends DataTypeCheckGeneratorBase
{
    constructor(dataTypeLookupKey: string, data: RegExp | Array<string>, addDataTypeCheck: boolean = true)
    {
        super(dataTypeLookupKey, addDataTypeCheck);
        assertNotNull(data, 'data');
        this._regexp = data instanceof RegExp ? data : this.toRegExp(data);
    }

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

    public addConditions(conditions: Array<ICondition>, valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): void {
        conditions.push(conditionfactory.create(({
            conditionType: ConditionType.RegExp,
            valueHostName: valueHost.getName(),
            category: ConditionCategory.DataTypeCheck,
            expression: this._regexp
        } as DataTypeCheckConditionConfig)));

    }
}