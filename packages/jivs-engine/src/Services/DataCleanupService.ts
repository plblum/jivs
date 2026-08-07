/**
 * @inheritdoc jivs-engine/Types/DataCleanupService
 * @module jivs-engine/Services/DataCleanupService
 */

import
    {
        DataCleanupResolution,
        DataCleanupRule, DataCleanupThenFunction,
        DataCleanupWhenFunction,
        IDataCleanupService
    } from '../Interfaces/DataCleanupService';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { assertFunction, assertNotNull } from '../Utilities/ErrorHandling';
import { deepEquals } from '../Utilities/Utilities';
import { ServiceWithAccessorBase } from './ServiceWithAccessorBase';

/**
 * @inheritdoc jivs-engine/Types/DataCleanupService|IDataCleanupService
 */
export class DataCleanupService
    extends ServiceWithAccessorBase
    implements IDataCleanupService
{
    constructor()
    {
        super();
    }
    protected get registeredWhen(): Map<string, DataCleanupWhenFunction> | null
    {
        return this._registeredWhen;
    }
    private _registeredWhen: Map<string, DataCleanupWhenFunction> | null = null;
    protected get registeredThen(): Map<string, DataCleanupThenFunction> | null
    {
        return this._registeredThen;
    }
    private _registeredThen: Map<string, DataCleanupThenFunction> | null = null;

    protected ensureBuiltIn(): void
    {
        if (!this._registeredWhen)
        {
            this._registeredWhen = new Map<string, DataCleanupWhenFunction>();
            this.ensureWhenPopulated();
        }
        if (!this._registeredThen)
        {
            this._registeredThen = new Map<string, DataCleanupThenFunction>();
            this.ensureThenPopulated();
        }
    }

    /**
     * Prepopulates the When functions with the built-in functions. Can be overridden in derived classes to add more functions.
     */
    protected ensureWhenPopulated(): void
    {
        this.registerWhenFunction('undefined', whenUndefined);
        this.registerWhenFunction('null', whenNull);   // alias
        this.registerWhenFunction('nullorundefined', whenNullOrUndefined);
        this.registerWhenFunction('0', whenZero);
        this.registerWhenFunction('zero', whenZero);    // alias
        this.registerWhenFunction('0ornull', whenZeroOrNull);
        this.registerWhenFunction('zeroornull', whenZeroOrNull);    // alias
        this.registerWhenFunction('0nullorundefined', whenZeroNullOrUndefined);
        this.registerWhenFunction('zeronullorundefined', whenZeroNullOrUndefined);    // alias
        this.registerWhenFunction('', whenEmptyString);
        this.registerWhenFunction('emptystring', whenEmptyString);
        this.registerWhenFunction('emptystringornull', whenEmptyStringOrNull);
        this.registerWhenFunction('emptystringnullorundefined', whenEmptyStringNullOrUndefined);
    }

    protected ensureThenPopulated(): void
    {
        this.registerThenFunction('skip', thenSkip);
        this.registerThenFunction('omit', thenSkip);    // alias
        this.registerThenFunction('keep', thenKeep);
        this.registerThenFunction('nochange', thenKeep);   // alias
        this.registerThenFunction('undefined', thenUndefined);
        this.registerThenFunction('unassigned', thenUndefined);   // alias (preferred for reader)
        this.registerThenFunction('null', thenNull);
        this.registerThenFunction('0', thenZero);
        this.registerThenFunction('zero', thenZero);    // alias
        this.registerThenFunction('', thenEmptyString);
        this.registerThenFunction('emptystring', thenEmptyString);   // alias
        this.registerThenFunction('false', thenFalse);
        this.registerThenFunction('true', thenTrue);
        this.registerThenFunction('[]', thenEmptyArray);
        this.registerThenFunction('emptyarray', thenEmptyArray);   // alias
        this.registerThenFunction('{}', thenEmptyObject);
        this.registerThenFunction('emptyobject', thenEmptyObject);   // alias
    }

    /**
     * Evaluate the original value and using When and Then rules, return the DataCleanupResolution
     * where you use its value or take no action if skip is true.
     * The Then function only executes if the When function returns true, indicating the value is invalid 
     * and needs to be replaced.
     * The result value is often the original, only adjusted based on the Then function.
     * @param originalValue 
     * @param rule 
     * @returns An object with either skip: true, or value: any. 
     * If skip is true, the value will be ignored.
     * If skip is false, the value will be used. It can be undefined as a valid value to write.
     */
    public resolve(originalValue: any, rule: DataCleanupRule): DataCleanupResolution
    {
        let adjustedValue: any = originalValue;
        let whenFunc = this.getWhen(rule.when);
        if (whenFunc === undefined)
        {
            this.logger.message(LoggingLevel.Error, () => `DataCleanupService When rule '${ rule.when }' is not registered in the DataCleanupService.`);
            return { skip: true };
        }
        if (whenFunc(originalValue))
        {
            let thenFunc = this.getThen(rule.then);
            if (thenFunc === undefined)
            {
                this.logger.message(LoggingLevel.Error, () => `DataCleanupService Then rule '${ rule.then }' is not registered in the DataCleanupService.`);
                return { skip: true };
            }
            let thenResult = thenFunc(originalValue);
            if (thenResult.skip)
            {
                this.logger.message(LoggingLevel.Debug, () => `DataCleanupService Then rule '${ rule.then }' has indicated to skip the source value.`);
                return { skip: true };
            }
            adjustedValue = thenResult.value;
            if (!deepEquals(adjustedValue, originalValue))
                this.logger.message(LoggingLevel.Debug, () => `DataCleanupService Then rule '${ rule.then }' has adjusted the source value.`);
        }
        else
        {
            this.logger.message(LoggingLevel.Debug, () => `DataCleanupService When rule '${ rule.when }' has indicated the original value will be retained.`);
        }

        return { skip: false, value: adjustedValue };
    }    
    
    /**
     * Retrieves the When function by its name.
     * @param name The name of the When function to retrieve.
     * @returns The When function if found, otherwise undefined.
     */
    public getWhen(name: string): DataCleanupWhenFunction | undefined
    {
        assertNotNull(name, 'name');
        this.ensureBuiltIn();
        return this._registeredWhen!.get(name.toLowerCase());
    }
    /**
     * Executes the When function by its name with the provided value.
     * @param name The name of the When function to execute.
     * @param value The value to pass to the When function.
     * @returns True when the value is considered invalid and needs to be replaced, false when the value is valid.
     * Undefined if the function is not found in a case-insensitive lookup.
     */
    public when(name: string, value: any): boolean | undefined
    {
        assertNotNull(name, 'name');
        this.ensureBuiltIn();
        const func = this._registeredWhen!.get(name.toLowerCase());
        return func ? func(value) : undefined;
    }

    /**
     * Retrieves the Then function by its name.
     * @param name The name of the Then function to retrieve.
     * @returns The Then function if found, otherwise undefined.
     */
    public getThen(name: string): DataCleanupThenFunction | undefined
    {
        assertNotNull(name, 'name');
        this.ensureBuiltIn();
        return this._registeredThen!.get(name.toLowerCase());
    }
    /**
     * Executes the Then function by its name with the provided value.
     * @param name The name of the Then function to execute.
     * @param value The value to pass to the Then function.
     * @returns The result of the Then function if found, otherwise undefined.
     */
    public then(name: string, value: any): DataCleanupResolution | undefined
    {
        assertNotNull(name, 'name');
        this.ensureBuiltIn();
        const func = this._registeredThen!.get(name.toLowerCase());
        return func ? func(value) : undefined;
    }

    /**
     * Registers a When function with the given name.
     * Will overwrite any existing function with the same name (case-insensitive).
     * @param name The name of the When function to register.
     * @param func The When function to register.
     */
    public registerWhenFunction(name: string, func: DataCleanupWhenFunction): void
    {
        assertNotNull(name, 'name');
        assertFunction(func);
        this.ensureBuiltIn();
        this._registeredWhen!.set(name.toLowerCase(), func);
    }

    /**
     * Registers a Then function with the given name.
     * Will overwrite any existing function with the same name (case-insensitive).
     * @param name The name of the Then function to register.
     * @param func The Then function to register.
     */
    public registerThenFunction(name: string, func: DataCleanupThenFunction): void
    {
        assertNotNull(name, 'name');
        assertFunction(func);
        this.ensureBuiltIn();
        this._registeredThen!.set(name.toLowerCase(), func);
    }
}

//#region predefined When functions
// All functions use type DataCleanupWhenFunction = (value: any) => boolean;
// They return true to indicate that the value is considered invalid and needs to be replaced, false when the value is valid.

// name: 'undefined'
export function whenUndefined(value: any): boolean
{
    return value === undefined;
}
// name: 'null'
export function whenNull(value: any): boolean
{
    return value === null;
}
// name: 'nullorundefined'
export function whenNullOrUndefined(value: any): boolean
{
    return value === null || value === undefined;
}
// name: '0' or 'zero'
export function whenZero(value: any): boolean
{
    return value === 0;
}
// name: '0ornull' or 'zeroornull'
export function whenZeroOrNull(value: any): boolean
{
    return value === null || value === 0;
}
// name: '0nullorundefined' or 'zeronullorundefined'
export function whenZeroNullOrUndefined(value: any): boolean
{
    return value === null || value === 0 || value === undefined;
}
// name: '' or 'emptystring'
export function whenEmptyString(value: any): boolean
{
    return value === '';
}
// name: 'emptystringornull'
export function whenEmptyStringOrNull(value: any): boolean
{
    return value === null || value === '';
}
// name: 'emptystringnullorundefined'
export function whenEmptyStringNullOrUndefined(value: any): boolean
{
    return value === null || value === '' || value === undefined;
}

//#endregion predefined When functions

//#region predefined Then functions
// All functions use type DataCleanupThenFunction = (value: any) => DataCleanupResolution;
// name: 'skip' or'omit'
export function thenSkip(value: any): DataCleanupResolution
{
    return { skip: true };
}
// name: 'keep' or 'nochange'
export function thenKeep(value: any): DataCleanupResolution
{
    return { value: value };
}
// name: 'undefined'
export function thenUndefined(value: any): DataCleanupResolution
{
    return { value: undefined };
}
// name: 'null'
export function thenNull(value: any): DataCleanupResolution
{
    return { value: null };
}
// name: '0' or 'zero'
export function thenZero(value: any): DataCleanupResolution
{
    return { value: 0 };
}
// name: 'emptystring' or ''
export function thenEmptyString(value: any): DataCleanupResolution
{
    return { value: '' };
}
// name: 'false'
export function thenFalse(value: any): DataCleanupResolution
{
    return { value: false };
}
// name: 'true'
export function thenTrue(value: any): DataCleanupResolution
{
    return { value: true };
}
// name: '[]' or 'emptyarray'
export function thenEmptyArray(value: any): DataCleanupResolution
{
    return { value: [] };
}
// name: '{}' or 'emptyobject'
export function thenEmptyObject(value: any): DataCleanupResolution
{
    return { value: {} };
}
//#endregion predefined Then functions