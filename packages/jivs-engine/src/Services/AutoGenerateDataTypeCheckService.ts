/**
 * @module Services/ConcreteClasses/AutoGenerateDataTypeCheckService
 */

import { DataTypeCheckConditionConfig } from "../Conditions/ConcreteConditions";
import { ConditionType } from "../Conditions/ConditionTypes";
import { ConditionConfig, ICondition } from "../Interfaces/Conditions";
import { IDataTypeCheckGenerator } from "../Interfaces/DataTypeCheckGenerator";
import { IAutoGenerateDataTypeCheckService } from "../Interfaces/AutoGenerateDataTypeCheckService";
import { assertNotNull } from "../Utilities/ErrorHandling";
import { DataTypeServiceBase } from "./DataTypeServiceBase";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { LogDetails, LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { valueForLog } from "../Utilities/Utilities";

/**
 * A service that supports automatic generation of 
 * Conditions for the Data Type Check
 * using {@link DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator | IDataTypeCheckGenerator} instances.
 * 
 * This class is available on {@link Services/ConcreteClasses/ValidationServices!ValidationServices#autoGenerateDataTypeCheckService | ValidationServices.autoGenerateDataTypeCheckService}.
 * This feature is specific to InputValueHosts as it utilizes both the Input Value and Native Value.
 */
export class AutoGenerateDataTypeCheckService extends DataTypeServiceBase<IDataTypeCheckGenerator>
    implements IAutoGenerateDataTypeCheckService
{
    protected indexOfExisting(item: IDataTypeCheckGenerator): number {
        return -1; // does not support replacing registered items
    }
    /**
     * When true, data type check conditions are auto generated if not 
     * supplied in the ValueHost's list of validators.
     * Defaults to true.
     */
    public get enabled(): boolean
    {
        return this._autoGenerateDataTypeConditionEnabled;
    }
    public set enabled(value: boolean)
    {
        this._autoGenerateDataTypeConditionEnabled = value;
    }
    private _autoGenerateDataTypeConditionEnabled: boolean = true;
    
    /**
     * {@inheritDoc Services/Types/IAutoGenerateDataTypeCheckService!IAutoGenerateDataTypeCheckService#autoGenerateDataTypeConditions }
     */    
    public autoGenerateDataTypeConditions(valueHost: IInputValueHost, dataTypeLookupKey: string): Array<ICondition>
    {
        let result: Array<ICondition> = [];
        try {
            assertNotNull(valueHost, 'valueHost');
            assertNotNull(dataTypeLookupKey, 'dataTypeLookupKey');
            let generator = this.find(dataTypeLookupKey);
            if (generator !== null) {
                this.logQuick(LoggingLevel.Debug, () => `Using ${valueForLog(generator)}`);
                result = generator.createConditions(valueHost, dataTypeLookupKey, this.services.conditionFactory); // may return null
                return result;
            }
            let config = this.createDefaultConditionConfig(valueHost);
            let condition = this.services.conditionFactory.create(config);
            result.push(condition);
            return result;
        }
        finally
        {
            this.log(LoggingLevel.Info, () => {
                let details: LogDetails = {
                    category: LoggingCategory.Result,
                    message: null!
                };
                if (result.length > 0)
                {
                    let conditionNames = result.map((c) => c.conditionType).join('; ');
                    details.message = `Auto generated: ${conditionNames}`;
                }
                else
                    details.message = 'Nothing to auto generate';
                return details;
            });            
        }
    }
    protected createDefaultConditionConfig(valueHost: IInputValueHost): ConditionConfig
    {
        return <DataTypeCheckConditionConfig> {
            conditionType: ConditionType.DataTypeCheck,
            valueHostName: valueHost.getName()
        };
    }

    /**
     * Finds the first {@link DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator | IDataTypeCheckGenerator}
     * that supports the value, or null if none are found.
     * Runs the lazyloader if setup and the first search fails.
     * @param dataTypeLookupKey 
     * @returns 
     */
    public find(dataTypeLookupKey: string): IDataTypeCheckGenerator | null {
        let result = this.getAll().find((dtg) => dtg.supportsValue(dataTypeLookupKey)) ?? null;
        if (result === null && this.ensureLazyLoaded())
            result = this.find(dataTypeLookupKey);
        return result;        
    }

}