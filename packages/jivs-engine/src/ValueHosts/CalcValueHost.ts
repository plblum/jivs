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
import { LookupKey } from '../DataTypes/LookupKeys';


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
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be.
     * @returns The converted value. If the value is not convertable, return undefined.
     */
    public convert(value: any, sourceLookupKey: string | null, resultLookupKey: string): SimpleValueType
    {
        let result = this.valueHostsManager.services.dataTypeConverterService.convert(value, sourceLookupKey, resultLookupKey);
        return result.value;
    }
    /**
     * Provides conversion support against the original value using the DataTypeConverters
     * and DataTypeIdentifiers through services.dataTypeConverterService.convert().
     * Attempts to convert it all the way down to a number, string or boolean.
     * Return null if the value represents null.
     * Return undefined if the value was unconvertable.
     * @param value - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be. When handling conditions,
     * this is usually from conditionConfig.conversionLookupKey or secondConversionLookupKey.
     * @returns The converted value. If the value is not convertable, return undefined.
     */
    public convertToPrimitive(value: any, sourceLookupKey: string | null, resultLookupKey: LookupKey.Number | LookupKey.String | LookupKey.Boolean): SimpleValueType
    {
        let result = this.valueHostsManager.services.dataTypeConverterService.convertUntilResult(value, sourceLookupKey, resultLookupKey);
        return result.value;
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

            this.logger.log(LoggingLevel.Warn, (options) => {
                return {
                    message: 'calcFn property not configured',
                    category: LoggingCategory.Configuration,
                };
            });
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
        this.logger.message(LoggingLevel.Warn, () => 'setValue does nothing');        
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