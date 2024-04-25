/**
 * {@inheritDoc ValueHosts/Types/CalcValueHost}
 * @module ValueHosts/ConcreteClasses/CalcValueHost
 */
import { ICalcValueHost, CalcValueHostConfig, CalcValueHostInstanceState, CalculationHandlerResult } from '../Interfaces/CalcValueHost';
import { SetValueOptions, ValueHostConfig } from '../Interfaces/ValueHost';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { IValueHostsManager } from '../Interfaces/ValueHostResolver';
import { ValueHostBase, ValueHostBaseGenerator } from './ValueHostBase';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError } from '../Utilities/ErrorHandling';


/**
 * {@inheritDoc ValueHosts/Types/CalcValueHost} 
 */
export class CalcValueHost extends ValueHostBase<CalcValueHostConfig, CalcValueHostInstanceState>
    implements ICalcValueHost
{
    constructor(valueHostsManager: IValueHostsManager, config: CalcValueHostConfig, state: CalcValueHostInstanceState)
    {
        super(valueHostsManager, config, state);
    }

    /**
     * Provides conversion support against the original value using the DataTypeConverters
     * and DataTypeIdentifiers through services.dataTypeConverterService.convert()
     * @param value 
     * @param dataTypeLookupKey 
     */
    public convert(value: any, dataTypeLookupKey: string | null): CalculationHandlerResult
    {
        return this.valueHostsManager.services.dataTypeConverterService.convert(value, dataTypeLookupKey);
    }
    /**
     * Provides conversion support against the original value using the DataTypeConverters
     * and DataTypeIdentifiers through services.dataTypeConverterService.convert().
     * Attempts to convert it all the way down to a number, string or boolean.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * @param value 
     * @param dataTypeLookupKey - if not supplied, it will attempt to resolve it with
     * the DataTypeIdentifiers.
     */
    public convertToPrimitive(value: any, dataTypeLookupKey: string | null): CalculationHandlerResult
    {
        return this.valueHostsManager.services.dataTypeConverterService.convertToPrimitive(value, dataTypeLookupKey);
    }

    /**
     * Returns the calculated value or undefined if it could not calculate.
     * @returns 
     */
    public getValue(): CalculationHandlerResult {
        if (this._reentrantCount > 0)
            throw new CodingError('Recursive call from your Calculation function not allowed.');
        try {
            this._reentrantCount++;
            if (this.config.calcFn)
                return this.config.calcFn(this, this.valueHostsManager);
            this.services.loggerService.log('calcFn property not configured', LoggingLevel.Warn, LoggingCategory.Configuration, 'CalcValueHost');
            return undefined;
        }
        finally
        {
            this._reentrantCount--;
        }
    }
    /**
     * Used by getValue to ensure its never called from the function it calls.
     * If the user needs to call the same function recursively, they can directly call it recursively,
     * not use getValue.
     */
    private _reentrantCount = 0;

    /**
     * Does nothing. This change also impacts setValueToUndefined()
     * @param value 
     * @param options 
     */
    public setValue(value: any, options?: SetValueOptions | undefined): void {
        // does nothing
        this.valueHostsManager.services.loggerService.log('setValue does nothing', LoggingLevel.Warn, LoggingCategory.Configuration, 'CalcValueHost');
    }
}

/**
 * Supports CalcValueHost class. Used when the Config.valueHostType = ValueHostType.Calc
 */
export class CalcValueHostGenerator extends ValueHostBaseGenerator {

    public canCreate(config: ValueHostConfig): boolean {
        return config.valueHostType === ValueHostType.Calc;
    }
    public create(valueHostsManager: IValueHostsManager, config: CalcValueHostConfig, state: CalcValueHostInstanceState): ICalcValueHost {
        return new CalcValueHost(valueHostsManager, config, state);
    }

    public cleanupInstanceState(state: CalcValueHostInstanceState, config: CalcValueHostConfig): void {
        // nothing needed.
    }
}