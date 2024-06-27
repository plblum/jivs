/**
 * {@inheritDoc ValueHosts/Types/CalcValueHost}
 * @module ValueHosts/ConcreteClasses/CalcValueHost
 */
import { ICalcValueHost, CalcValueHostConfig, CalcValueHostInstanceState } from '../Interfaces/CalcValueHost';
import { IValueHost, SetValueOptions, ValueHostConfig, toIValueHost } from '../Interfaces/ValueHost';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ValueHostBase, ValueHostBaseGenerator } from './ValueHostBase';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError } from '../Utilities/ErrorHandling';
import { SimpleValueType } from '../Interfaces/DataTypeConverterService';


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
    public convert(value: any, dataTypeLookupKey: string | null): SimpleValueType
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
    public convertToPrimitive(value: any, dataTypeLookupKey: string | null): SimpleValueType
    {
        return this.valueHostsManager.services.dataTypeConverterService.convertToPrimitive(value, dataTypeLookupKey);
    }

    /**
     * Returns the calculated value or undefined if it could not calculate.
     * @returns 
     */
    public getValue(): SimpleValueType {
        if (this._reentrantCount > 0)
            throw new CodingError('Recursive call from your Calculation function not allowed.');
        try {
            this._reentrantCount++;
            if (this.config.calcFn)
                return this.config.calcFn(this, this.valueHostsManager);
            this.log('calcFn property not configured', LoggingLevel.Warn, LoggingCategory.Configuration);
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
        this.log('setValue does nothing', LoggingLevel.Warn);
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

/**
 * Determines if the object implements ICalcValueHost.
 * @param source 
 * @returns source typecasted to ICalcValueHost if appropriate or null if not.
 */
export function toICalcValueHost(source: any): ICalcValueHost | null {
    if (source instanceof CalcValueHost)
        return source as ICalcValueHost;
    if (toIValueHost(source) && hasICalcValueHostSpecificMembers(source))
        return source as ICalcValueHost;
    return null;
}

/**
 * Returns true when it finds members introduced on ICalcValueHost.
 * @param source 
 * @returns 
 */
export function hasICalcValueHostSpecificMembers(source: IValueHost): boolean
{
    let test = source as ICalcValueHost;
    // members introduced on ICalcValueHost
    return (test.convert !== undefined &&
        test.convertToPrimitive !== undefined);    
}