import { ConditionFactory } from "../Conditions/ConditionFactory";
import { DataTypeServices } from "../DataTypes/DataTypeServices";
import { InputValidatorFactory } from "../ValueHosts/InputValidator";
import { ConsoleLogger } from "./ConsoleLogger";
import { MessageTokenResolver } from "../ValueHosts/MessageTokenResolver";
import { AssertNotNull } from "../Utilities/ErrorHandling";
import { ValueHostFactory, RegisterStandardValueHostGenerators } from "../ValueHosts/ValueHostFactory";
import type { IInputValidatorFactory, IMessageTokenResolver } from "../Interfaces/InputValidator";
import type { ILogger } from "../Interfaces/Logger";
import type { IDataTypeServices } from "../Interfaces/DataTypes";
import type { IValueHostFactory } from "../Interfaces/ValueHostFactory";
import { IConditionFactory } from "../Interfaces/Conditions";


/**
 * This system has several globals designed to let you initialize factories
 * and services with your prefered classes.
 * All of them are in this class, and it is assigned to the global
 * variable valGlobals.
 * Part of this strategy is to make it easy for testing to reset the globals.
 */
export class ValidationGlobals
{
/**
 * The DataTypeServices gets configured in its constructure, which needs to know of
 * one or more CultureIds (like 'en' or 'en-GB') that its localization supports.
 * This global is used when DataTypeServices does not get those parameters.
 * Its own default is 'en'.
 */    
    public get DefaultCultureId(): string
    {
        return this._defaultCultureId;
    }
    public set DefaultCultureId(cultureId: string)
    {
        AssertNotNull(cultureId, 'cultureId');
        this._defaultCultureId = cultureId;
    }
    private _defaultCultureId = 'en';

/**
 * If you need to format a number as a currency in an error message,
 * this provides a default currency code to the built-in
 * CurrencyLocalizedFormatter which does the actual work.
 * CurrencyLocalizedFormatter uses the Intl library, which doesn't
 * know how to map a culture to a currency code.
 * This is intended to bridge that gap, along with the constructor
 * to CurrencyLocalizedFormatter.
 */    
    public get DefaultCurrencyCode(): string
    {
        return this._defaultCurrencyCode
    }
    public set DefaultCurrencyCode(code: string)
    {
        this._defaultCurrencyCode = code;
    }
    private _defaultCurrencyCode: string = 'USD';
//#region ValueHostFactory
    /**
     * The ValueHostFactory to use. It is NOT associated with the ValidationServices.
     * Its value is system-wide
     */
    private _valueHostFactory: IValueHostFactory | null = null;
    public SetValueHostFactory(factory: IValueHostFactory): void {
        AssertNotNull(factory, 'factory');
        this._valueHostFactory = factory;
    }
    public GetValueHostFactory(): IValueHostFactory {
        if (!this._valueHostFactory) {
            let factory = new ValueHostFactory();
            RegisterStandardValueHostGenerators(factory);
            this._valueHostFactory = factory;
        }
        return this._valueHostFactory;
    }    
    //#endregion ValueHostFactory
    
//#region InputValidatorFactory    
    /**
     * The InputValidatorFactory to use. It is NOT associated with the ValidationServices.
     * Its value is system-wide
     */
    private _inputValidatorFactory: IInputValidatorFactory | null = null;
    public SetInputValidatorFactory(factory: InputValidatorFactory): void {
        AssertNotNull(factory, 'factory');
        this._inputValidatorFactory = factory;
    }
    public  GetInputValidatorFactory(): IInputValidatorFactory {
        if (!this._inputValidatorFactory)
            this._inputValidatorFactory = new InputValidatorFactory();
        return this._inputValidatorFactory;
    }
//#endregion InputValidatorFactory    

//#region ConditionFactory
/**
 * The ConditionFactory that is used by default with each ValidationServices.
 * Most of time, you only need one factory and set it here.
 */
    private _defaultConditionFactory: IConditionFactory | null = null;
    public SetDefaultConditionFactory(conditionFactory: IConditionFactory): void
    {
        AssertNotNull(conditionFactory, 'conditionFactory');
        this._defaultConditionFactory = conditionFactory;
    }
    public GetDefaultConditionFactory(): IConditionFactory
    {
        if (!this._defaultConditionFactory)
        {
            this._defaultConditionFactory = new ConditionFactory();
        }
        return this._defaultConditionFactory;
    }
    //#endregion ConditionFactory

    //#region DataTypeServices
    /**
     * The default DataTypeServices on ValidationServices. 
     * If you don't set it, it uses DataTypeServices without any DataTypeLocalizations
     * or registered data.
     * Generally used to register IDataTypeLocalization implementations and additional rules 
     * on a singleton so that it isn't done each time a services is created.
     */
    private _defaultDataTypeServices: IDataTypeServices | null = null;
    public SetDefaultDataTypeServices(dts: IDataTypeServices): void
    {
        AssertNotNull(dts, 'dts');
        this._defaultDataTypeServices = dts;
    }
    public GetDefaultDataTypeServices() : IDataTypeServices
    {
        if (!this._defaultDataTypeServices) {
            let dts = new DataTypeServices('en');
            this._defaultDataTypeServices = dts;
        }
        return this._defaultDataTypeServices;
    }    
    //#endregion DataTypeServices
    //#region MessageTokenResolver
    /**
     * The MessageTokenResolver that is used by default with each ValidationServices
     * in MessageTokenResolverService.
     * Most of time, you only need one factory and set it here.
     */
    private _defaultMessageTokenResolver: IMessageTokenResolver | null = null;
    public SetDefaultMessageTokenResolver(mtr: IMessageTokenResolver): void
    {
        AssertNotNull(mtr, 'mtr');
        this._defaultMessageTokenResolver = mtr;
    }
    public GetDefaultMessageTokenResolver(): IMessageTokenResolver
    {
        if (!this._defaultMessageTokenResolver)
            this._defaultMessageTokenResolver = new MessageTokenResolver();
        return this._defaultMessageTokenResolver;
    }
    //#endregion MessageTokenResolver
    
    //#region Default ILogger
    /**
     * The default for LoggingService on ValidationServices.
     * If you don't set it, it uses ConsoleLogger.
     * Most of time, you only need one factory and set it here.
     */
    private _defaultLogger: ILogger | null = null;
    public SetDefaultLogger(logger: ILogger): void
    {
        AssertNotNull(logger, 'logger');
        this._defaultLogger = logger;
    }
    public GetDefaultLogger(): ILogger
    {
        if (!this._defaultLogger)
            this._defaultLogger = new ConsoleLogger();
        return this._defaultLogger;
    }    
    //#endregion Default ILogger    
}

/**
 * Access to the ValidationGlobals, so you can get and set
 * its contents.
 * Intentially var, not const, to allow testing to reset these.
 */
export var valGlobals: ValidationGlobals = new ValidationGlobals();

export function ResetValGlobals()
{
    valGlobals = new ValidationGlobals();
}

