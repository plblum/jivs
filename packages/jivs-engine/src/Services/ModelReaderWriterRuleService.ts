/**
 * @inheritdoc jivs-engine/Interfaces/ModelReaderAndWriter!IModelReaderWriterRuleService
 * @module jivs-engine/Services/ModelReaderWriterRuleService
 */

import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { LoggingLevel } from '../Interfaces/LoggerService';
import
    {
        IModelReaderWriterRuleService, ModelReaderWriterRule, ModelReaderWriterThenFunction,
        ModelReaderWriterWhenFunction
    } from '../Interfaces/ModelReaderAndWriter';
import { assertFunction, assertNotNull } from '../Utilities/ErrorHandling';
import { deepEquals } from '../Utilities/Utilities';
import { ServiceWithAccessorBase } from './ServiceWithAccessorBase';

/**
 * The ModelReaderWriterRuleService is responsible for the rules used by either ModelReader or ModelWriter
 * to detect when a value is considered invalid and needs to be replaced, and what to replace it with.
 * 
 * Its main function is the resolve() method, which takes an ModelReaderWriterRule and a value, and returns the result of applying the rule to the value.
 * It also provides methods for registering and retrieving the When and Then functions used by either ModelReader or ModelWriter.
 * 
 * There are two implementations: ModelReaderRuleService and ModelWriterRuleService. 
 * Each has its own set of pre-registered functions.
 * They are registered in JivsServices and can be accessed via 
 * jivsServices.modelReaderRuleService and jivsServices.modelWriterRuleService.
 * It supports case-insensitive name lookup.
 */
export abstract class ModelReaderWriterRuleServiceBase extends ServiceWithAccessorBase implements IModelReaderWriterRuleService
{
    constructor()
    {
        super();
    }
    protected get registeredWhen(): Map<string, ModelReaderWriterWhenFunction> | null
    {
        return this._registeredWhen;
    }
    private _registeredWhen: Map<string, ModelReaderWriterWhenFunction> | null = null;
    protected get registeredThen(): Map<string, ModelReaderWriterThenFunction> | null
    {
        return this._registeredThen;
    }
    private _registeredThen: Map<string, ModelReaderWriterThenFunction> | null = null;

    protected ensureBuiltIn(): void
    {
        if (!this._registeredWhen)
        {
            this._registeredWhen = new Map<string, ModelReaderWriterWhenFunction>();
            this.ensureWhenPopulated();
        }
        if (!this._registeredThen)
        {
            this._registeredThen = new Map<string, ModelReaderWriterThenFunction>();
            this.ensureThenPopulated();
        }
    }

    /**
     * Expects calls to registerWhenFunction() for all built-in When functions.
     */
    protected abstract ensureWhenPopulated(): void;

    /**
     * Expects calls to registerThenFunction() for all built-in Then functions.
     */
    protected abstract ensureThenPopulated(): void;

    /**
     * With a known model property name, value and rule, evaluate and return
     * either the original value, the adjusted value, or a skip flag indicating the value 
     * should not be assigned to the ValueHost.
     * @param modelPropertyName 
     * @param modelPropertyValue 
     * @param rule 
     * @param valueHost 
     * @returns An object with either skip: true, or adjustedValue: any. 
     * If skip is true, the value will be ignored.
     */
    public resolve(modelPropertyName: string, modelPropertyValue: any,
        rule: ModelReaderWriterRule, valueHost: IFieldValueHost, readerWriter: 'Reader'|'Writer'): { skip?: boolean, adjustedValue?: any; }
    {
        let adjustedValue: any = modelPropertyValue;
        let valueHostName = valueHost.getName();
        let whenFunc = this.getWhen(rule.when);
        if (whenFunc === undefined)
        {
            this.logger.message(LoggingLevel.Error, () => `FieldValueHostConfig.model${readerWriter}Rule.when '${ rule.when }' not registered in the Model${readerWriter}RuleService.`);
            return { skip: true };
        }
        if (whenFunc(modelPropertyValue))
        {
            let thenFunc = this.getThen(rule.then);
            if (thenFunc === undefined)
            {
                this.logger.message(LoggingLevel.Error, () => `FieldValueHostConfig.model${readerWriter}Rule.then '${ rule.then }' not registered in the Model${readerWriter}RuleService.`);
                return { skip: true };
            }
            let thenResult = thenFunc(modelPropertyValue);
            if (thenResult.omit)
            {
                this.logger.message(LoggingLevel.Debug, () => `Model property '${ modelPropertyName }' is omitted by the rule '${ rule.then}'.`);
                return { skip: true };
            }
            adjustedValue = thenResult.value;
            if (!deepEquals(adjustedValue, modelPropertyValue))
                this.logger.message(LoggingLevel.Debug, () => `Model property '${ modelPropertyName }' value adjusted by the rule '${rule.then}'.`);
        }

        return { skip: false, adjustedValue: adjustedValue };
    }    
    
    /**
     * Retrieves the When function by its name.
     * @param name The name of the When function to retrieve.
     * @returns The When function if found, otherwise undefined.
     */
    public getWhen(name: string): ModelReaderWriterWhenFunction | undefined
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
    public getThen(name: string): ModelReaderWriterThenFunction | undefined
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
    public then(name: string, value: any): { omit?: boolean; value?: any; } | undefined
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
    public registerWhenFunction(name: string, func: ModelReaderWriterWhenFunction): void
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
    public registerThenFunction(name: string, func: ModelReaderWriterThenFunction): void
    {
        assertNotNull(name, 'name');
        assertFunction(func);
        this.ensureBuiltIn();
        this._registeredThen!.set(name.toLowerCase(), func);
    }
}

/**
 * The ModelReaderRuleService is responsible for resolving the rules used by ModelReader 
 * to detect when a value is considered invalid and needs to be replaced, and what to replace it with.
 * 
 * It has numerous built-in When and Then functions, but users can register their own functions as well
 * through the registerWhenFunction() and registerThenFunction() methods.
 * It is registered in JivsServices and can be accessed via jivsServices.modelReaderRuleService.
 * It is prepopulated with the default When and Then functions, but users can register their own functions as well.
 * It supports case-insensitive name lookup.
 */
export class ModelReaderRuleService extends ModelReaderWriterRuleServiceBase
{
    constructor()
    {
        super();
    }

    protected override ensureWhenPopulated(): void
    {
        this.registerWhenFunction('undefined', whenUndefined);
        this.registerWhenFunction('nullorundefined', whenNullOrUndefined);
        this.registerWhenFunction('0', whenZero);
        this.registerWhenFunction('zero', whenZero);    // alias
        this.registerWhenFunction('0ornull', whenZeroOrNull);
        this.registerWhenFunction('zeroornull', whenZeroOrNull);    // alias
        this.registerWhenFunction('0nullorundefined', whenZeroNullOrUndefined);
        this.registerWhenFunction('zeronullorundefined', whenZeroNullOrUndefined);    // alias
        this.registerWhenFunction('', whenEmptyString);
        this.registerWhenFunction('emptystring', whenEmptyString);  // alias
        this.registerWhenFunction('emptystringornull', whenEmptyStringOrNull);
        this.registerWhenFunction('emptystringnullorundefined', whenEmptyStringNullOrUndefined);
    }

    protected override ensureThenPopulated(): void
    {
        this.registerThenFunction('keep', thenKeep);
        this.registerThenFunction('undefined', thenUndefined);
        this.registerThenFunction('unassigned', thenUndefined);   // alias (preferred for reader)
        this.registerThenFunction('null', thenNull);
    }
}

/**
 * The ModelWriterRuleService is responsible for registering and retrieving the When and Then functions used in the modelWriterRule.
 * It is registered in JivsServices and can be accessed via jivsServices.modelWriterRuleService.
 * It is prepopulated with the default When and Then functions, but users can register their own functions as well.
 * It supports case-insensitive name lookup.
 */
export class ModelWriterRuleService extends ModelReaderWriterRuleServiceBase
{
    constructor()
    {
        super();
    }

    protected override ensureWhenPopulated(): void
    {
        this.registerWhenFunction('undefined', whenUndefined);
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

    protected override ensureThenPopulated(): void
    {
        this.registerThenFunction('omit', thenOmit);
        this.registerThenFunction('keep', thenKeep);
        this.registerThenFunction('undefined', thenUndefined);
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
}

//#region predefined When functions
// All functions use type ModelReaderWriterWhenFunction = (value: any) => boolean;
// They return true to indicate that the value is considered invalid and needs to be replaced, false when the value is valid.

// name: 'undefined'
export function whenUndefined(value: any): boolean
{
    return value === undefined;
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
// All functions use type ModelReaderWriterThenFunction = (value: any) => { omit: boolean; value?: any; };
// name: 'omit'
export function thenOmit(value: any): { omit?: boolean; value?: any; }
{
    return { omit: true };
}
// name: 'keep'
export function thenKeep(value: any): { omit?: boolean; value?: any; }
{
    return { value: value };
}
// name: 'undefined'
export function thenUndefined(value: any): { omit?: boolean; value?: any; }
{
    return { value: undefined };
}
// name: 'null'
export function thenNull(value: any): { omit?: boolean; value?: any; }
{
    return { value: null };
}
// name: '0' or 'zero'
export function thenZero(value: any): { omit?: boolean; value?: any; }
{
    return { value: 0 };
}
// name: 'emptystring' or ''
export function thenEmptyString(value: any): { omit?: boolean; value?: any; }
{
    return { value: '' };
}
// name: 'false'
export function thenFalse(value: any): { omit?: boolean; value?: any; }
{
    return { value: false };
}
// name: 'true'
export function thenTrue(value: any): { omit?: boolean; value?: any; }
{
    return { value: true };
}
// name: '[]' or 'emptyarray'
export function thenEmptyArray(value: any): { omit?: boolean; value?: any; }
{
    return { value: [] };
}
// name: '{}' or 'emptyobject'
export function thenEmptyObject(value: any): { omit?: boolean; value?: any; }
{
    return { value: {} };
}
//#endregion predefined Then functions