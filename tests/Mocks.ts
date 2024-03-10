import { ConditionFactory, RegisterStandardConditions } from "../src/Conditions/ConditionFactory";
import { DataTypeResolver } from "../src/DataTypes/DataTypeResolver";
import { IntlLocalizationAdapter } from "../src/DataTypes/DataTypeLocalizedFormatters";

import { type ILogger, LoggingLevel } from "../src/Interfaces/Logger";
import { MessageTokenResolver  } from "../src/ValueHosts/MessageTokenResolver";
import type { IValidationServices } from "../src/Interfaces/ValidationServices";
import type { IValidationManagerCallbacks, ValidationManagerStateChangedHandler, ValidationManagerValidatedHandler } from "../src/ValueHosts/ValidationManager";
import type { IValueHost, ISetValueOptions, IValueHostState } from "../src/Interfaces/ValueHost";
import { CreateDataTypeResolverWithManyLAs } from "./DataTypes/DataTypeResolver.test";
import { commonBuiltInFormatLookupKeys } from "../src/DataTypes/LookupKeys";
import { IValueHostResolver, IValueHostsManager } from "../src/Interfaces/ValueHostResolver";
import { ValueChangedHandler, ValueHostStateChangedHandler } from "../src/ValueHosts/ValueHostBase";
import { ConditionBase } from "../src/Conditions/ConditionBase";
import { IConditionDescriptor, ConditionEvaluateResult, ConditionCategory, IConditionFactory } from "../src/Interfaces/Conditions";
import { IInputValueHost } from "../src/Interfaces/InputValueHost";
import { IValidateOptions, IValidateResult, ValidationResult, IBusinessLogicError, IIssueFound, IIssueSnapshot } from "../src/Interfaces/Validation";
import { InputValueHostBase, ValueHostValidatedHandler, InputValueChangedHandler } from "../src/ValueHosts/InputValueHostBase";
import { IMessageTokenResolver } from "../src/Interfaces/InputValidator";
import { IDataTypeResolver } from "../src/Interfaces/DataTypes";
import { IValidationManager } from "../src/Interfaces/ValidationManager";


export function CreateMockValidationManagerForMessageTokenResolver(registerLookupKeys: boolean = true): IValidationManager
{
    let services = new MockValidationServices(false, false);
    services.DataTypeResolverService = CreateDataTypeResolverWithManyLAs(registerLookupKeys);
    return new MockValidationManager(services);
}

export class MockValueHost implements IValueHost
{
    constructor(valueHostsManager: IValueHostsManager, id: string, dataTypeLookupKey: string, label?: string)
    {
        this._valueHostsManager = valueHostsManager;
        this._id = id;
        this._dataTypeLookupKey = dataTypeLookupKey;
        this._label = label ?? id;
        this._value = undefined;
    }
    _valueHostsManager: IValueHostsManager;
    _id: string;
    _label: string;
    _value: any;
    _dataTypeLookupKey: string;

    public get ValueHostsManager(): IValueHostsManager {
        return this._valueHostsManager;
    }
    GetId(): string {
        return this._id;
    }
    GetLabel(): string {
        return this._label;
    }
    GetValue() {
        return this._value;
    }
    SetValue(value: any, options?: ISetValueOptions | undefined): void {
        this._value = value;
        if (options && options.Reset)
            this.IsChanged = false;
        else
            this.IsChanged = true;
    }
    SetValueToUndefined(options?: ISetValueOptions | undefined): void {
        this.SetValue(undefined, options);
    }
    GetDataType(): string | null {
        return this._dataTypeLookupKey;
    }

    SaveIntoState(key: string, value: any): void
    {
        if (value !== undefined)
            this._savedItems[key] = value;
        else
            delete this._savedItems[key];
    }

    GetFromState(key: string): any | undefined
    {
        return this._savedItems[key];
    }
    _savedItems: {
        [key: string]: any
    } = {};

    IsChanged: boolean = false;
    
}


export class MockInputValueHost extends MockValueHost
    implements IInputValueHost
{
    _inputValue: any = undefined;
    _conversionErrorMessage: string | undefined;

    public override SetValue(value: any, options?: ISetValueOptions | undefined): void {
        super.SetValue(value, options);
        if (value === undefined && options && options.ConversionErrorTokenValue)
            this._conversionErrorMessage = options.ConversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;        
    }

    public GetInputValue() {
        return this._inputValue;
    }
    SetInputValue(value: any, options?: ISetValueOptions | undefined): void {
        this._inputValue = value;
        this._conversionErrorMessage = undefined;
    }
    SetValues(nativeValue: any, inputValue: any, options?: ISetValueOptions | undefined): void {
        this.SetValue(nativeValue);
        this.SetInputValue(inputValue);
        if (nativeValue === undefined && options && options.ConversionErrorTokenValue)
            this._conversionErrorMessage = options.ConversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;
    }
    Validate(options?: IValidateOptions): IValidateResult {
        throw new Error("Method not implemented.");
    }
    ClearValidation(): void {
        throw new Error("Method not implemented.");
    }
    IsValid: boolean = false;

    DoNotSaveNativeValue(): boolean
    {
        throw new Error("Method not implemented.");
    }

    ValidationResult: ValidationResult = ValidationResult.NotAttempted;
    
    SetBusinessLogicError(error: IBusinessLogicError): void {
        throw new Error("Method not implemented.");
    }
    ClearBusinessLogicErrors(): void {
        throw new Error("Method not implemented.");
    }
    
    GetIssuesFound(): Array<IIssueFound> | null {
        throw new Error("Method not implemented.");
    }    
    GetIssuesForInput(): IIssueSnapshot[] {
        throw new Error("Method not implemented.");
    }
    GetIssuesForSummary(group?: string | undefined): IIssueSnapshot[] {
        throw new Error("Method not implemented.");
    }    

    public GetConversionErrorMessage(): string | null
    {
        return this._conversionErrorMessage ?? null;
    }

    RequiresInput: boolean = false;
    
    OtherValueHostChangedNotification(valueHostIdThatChanged: string, revalidate: boolean): void {
        // do nothing
    }
}

/**
 * Flexible Mock ValidationServices with MockCapturingLogger.
 * Optionally populated with standard Conditions and data types.
 * Call its RegisterMoreCultures to support more than just 'en' culture.
 */
export class MockValidationServices implements IValidationServices
{
    constructor(registerStandardConditions: boolean,
        registerStandardDataTypes: boolean)
    {
        this._conditionFactory = new ConditionFactory();
        this._dataTypeResolverService = new DataTypeResolver();
        this._messageTokenResolverService = new MessageTokenResolver();
        this._loggerService = new MockCapturingLogger();

        if (registerStandardConditions) {
            RegisterStandardConditions(this._conditionFactory as ConditionFactory);
            RegisterPredictableConditions(this._conditionFactory as ConditionFactory);
        }
        if (registerStandardDataTypes &&
            this._dataTypeResolverService instanceof DataTypeResolver) {    // used as a typecast
            let la = new IntlLocalizationAdapter('en');
            la.RegisterBuiltInLookupKeyFunctions(commonBuiltInFormatLookupKeys);
            this._dataTypeResolverService.RegisterLocalizationAdapter(
                la
            );
        }

    }

    public RegisterMoreCultures(dataTypeResolver: DataTypeResolver): void
    {
        function RegisterLookupKeys(la: IntlLocalizationAdapter): IntlLocalizationAdapter
        {
            la.RegisterBuiltInLookupKeyFunctions(commonBuiltInFormatLookupKeys);
            return la;
        }

        if (!dataTypeResolver.HasLocalizationFor('en'))
            dataTypeResolver.RegisterLocalizationAdapter(RegisterLookupKeys(
                new IntlLocalizationAdapter('en')));
        dataTypeResolver.RegisterLocalizationAdapter(RegisterLookupKeys(
            new IntlLocalizationAdapter('fr', 'en', 'EUR')));
        dataTypeResolver.RegisterLocalizationAdapter(RegisterLookupKeys(
            new IntlLocalizationAdapter('en-GB', 'en-US', 'GBP')));
        dataTypeResolver.RegisterLocalizationAdapter(RegisterLookupKeys(
            new IntlLocalizationAdapter('en-US', 'en', 'USD')));
        dataTypeResolver.RegisterLocalizationAdapter(RegisterLookupKeys(
            new IntlLocalizationAdapter('fr-FR', 'fr', 'EUR')));

    }

    public get ConditionFactory(): IConditionFactory
    {
        return this._conditionFactory;
    }
    private _conditionFactory!: IConditionFactory;

    public get DataTypeResolverService(): IDataTypeResolver {
        return this._dataTypeResolverService;
    }
    public set DataTypeResolverService(service: IDataTypeResolver)
    {
        this._dataTypeResolverService = service;
    }
    private _dataTypeResolverService!: IDataTypeResolver;

    public get MessageTokenResolverService(): IMessageTokenResolver {
        return this._messageTokenResolverService;
    }
    private _messageTokenResolverService!: IMessageTokenResolver;

    public get LoggerService(): ILogger {
        return this._loggerService;
    }
    private _loggerService!: ILogger;

}

/**
 * MockValidationManager limited to implementing support for 
 * child ValueHosts.
 */
export class MockValidationManager implements IValidationManager, IValidationManagerCallbacks
{
    constructor(services: IValidationServices)
    {
        this._services = services;
        this.OnValueHostStateChanged = this.OnValueHostStateChangeHandler;
    }

    public get Services(): IValidationServices
    {
        return this._services;
    }
    private _services: IValidationServices;
/**
 * ValueHosts for all ValueHostDescriptors.
 * Always replace a ValueHost when the associated Descriptor or State are changed.
 */    
    private _valueHosts: Map<string, IValueHost> = new Map<string, IValueHost>();  
    
    public AddValueHost(id: string, dataTypeLookupKey: string, label: string, value?: any): MockValueHost
    {
        let vh = new MockValueHost(this, id, dataTypeLookupKey, label);
        this._valueHosts.set(id, vh);
        vh._value = value;
        return vh;
    }

    public AddInputValueHost(id: string, dataTypeLookupKey: string, label: string, inputValue?: any, nativeValue?: any): MockInputValueHost
    {
        let vh = new MockInputValueHost(this, id, dataTypeLookupKey, label);
        this._valueHosts.set(id, vh);
        vh._inputValue = inputValue;
        vh._value = nativeValue;
        return vh;
    }

    public GetValueHost(valueHostId: string): IValueHost | null {
        return this._valueHosts.get(valueHostId) ?? null;
    }    

    private _hostStateChanges: Array<IValueHostState> = [];
    public OnValueHostStateChangeHandler: ValueHostStateChangedHandler = (valueHost, stateToRetain) => {
        this._hostStateChanges.push(stateToRetain);  
    };
    public GetHostStateChanges(): Array<IValueHostState>
    {
        return this._hostStateChanges;
    }    

    Validate(options?: IValidateOptions): Array<IValidateResult> {
        throw new Error("Method not implemented.");
    }
    ClearValidation(): void {
        throw new Error("Method not implemented.");
    }

    IsValid: boolean = true;        

    DoNotSaveNativeValue(): boolean {
        throw new Error("Method not implemented.");
    }
    NotifyOtherValueHostsOfValueChange(valueHostIdThatChanged: string, revalidate: boolean): void {
        this._valueHosts.forEach((vh, key) => {
            if (vh instanceof InputValueHostBase)
                vh.OtherValueHostChangedNotification(valueHostIdThatChanged, revalidate);
        });
    }    
    public SetBusinessLogicErrors(errors: Array<IBusinessLogicError> | null): void
    {
        throw new Error("Method not implemented.");        
    }        
    GetIssuesForInput(valueHostId: string): IIssueSnapshot[] {
        throw new Error("Method not implemented.");
    }
    GetIssuesForSummary(group?: string | undefined): IIssueSnapshot[] {
        throw new Error("Method not implemented.");
    }

    public get OnStateChanged(): ValidationManagerStateChangedHandler | null {
        return this._onStateChanged;
    }
    public set OnStateChanged(fn: ValidationManagerStateChangedHandler) {
        this._onStateChanged = fn;
    }
    private _onStateChanged: ValidationManagerStateChangedHandler | null = null;

    public get OnValidated(): ValidationManagerValidatedHandler | null {
        return this._onValidated;
    }
    public set OnValidated(fn: ValidationManagerValidatedHandler) {
        this._onValidated = fn;
    }
    private _onValidated: ValidationManagerValidatedHandler | null = null;

    public get OnValueHostStateChanged(): ValueHostStateChangedHandler | null {
        return this._onValueHostStateChanged;
    }
    public set OnValueHostStateChanged(fn: ValueHostStateChangedHandler) {
        this._onValueHostStateChanged = fn;
    }
    private _onValueHostStateChanged: ValueHostStateChangedHandler | null = null;

    public get OnValueHostValidated(): ValueHostValidatedHandler | null {
        return this._onValueHostValidated;
    }
    public set OnValueHostValidated(fn: ValueHostValidatedHandler) {
        this._onValueHostValidated = fn;
    }
    private _onValueHostValidated: ValueHostValidatedHandler | null = null;

    public get OnValueChanged(): ValueChangedHandler | null {
        return this._onValueChanged;
    }
    public set OnValueChanged(fn: ValueChangedHandler) {
        this._onValueChanged = fn;
    }
    private _onValueChanged: ValueChangedHandler | null = null;

    public get OnInputValueChanged(): InputValueChangedHandler | null {
        return this._onInputValueChanged;
    }    
    public set OnInputValueChanged(fn: InputValueChangedHandler) {
        this._onInputValueChanged = fn;
    }    
    private _onInputValueChanged: InputValueChangedHandler | null = null;
}

export class MockCapturingLogger implements ILogger
{
    public MinLevel: LoggingLevel = LoggingLevel.Warn;
    
    public Captured: Array<IMockCapturedLog> = [];
    public Log(message: string, level: LoggingLevel, category?: string | undefined, source?: string | undefined): void {
        if (level >= this.MinLevel)
            this.Captured.push({
                Message: message,
                Level: level,
                Category: category,
                Source : source
            });
    }
    public EntryCount(): Number
    {
        return this.Captured.length;
    }
    public GetLatest(): IMockCapturedLog | null
    {
        if (this.Captured.length)
            return this.Captured[this.Captured.length - 1];
        return null;
    }
}
export interface IMockCapturedLog
{
    Message: string,
    Level: LoggingLevel,
    Category: string | undefined,
    Source: string | undefined
}

// Custom Conditions designed for testing validation where the Condition has a predictable behavior

export const AlwaysMatchesConditionType = "AlwaysMatches";

export class AlwaysMatchesCondition extends ConditionBase<IConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }    
    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult {
        return ConditionEvaluateResult.Match;
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Undetermined;
    }    
    public GatherValueHostIds(collection: Set<string>, valueHostsResolver: IValueHostResolver): void {
        // does nothing
    }
}

export const NeverMatchesConditionType = "NeverMatches";
export const NeverMatchesConditionType2 = "NeverMatches2"; // two type names for the same condition so we can test with 2 conditions without type naming conflicts

export class NeverMatchesCondition extends ConditionBase<IConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }

    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult {
        return ConditionEvaluateResult.NoMatch;
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Undetermined;
    }
    public GatherValueHostIds(collection: Set<string>, valueHostsResolver: IValueHostResolver): void {
        // does nothing
    }    
}

export const IsUndeterminedConditionType = "AlwaysUndetermined";

export class IsUndeterminedCondition extends ConditionBase<IConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }
    
    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult {
        return ConditionEvaluateResult.Undetermined;
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Undetermined;
    }    
    public GatherValueHostIds(collection: Set<string>, valueHostsResolver: IValueHostResolver): void {
        // does nothing
    }    
}

export const ThrowsExceptionConditionType = "AlwaysThrows";

export class ThrowsExceptionCondition extends ConditionBase<IConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }    
    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult {
        throw new Error("Always Throws");
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Undetermined;
    }    
    public GatherValueHostIds(collection: Set<string>, valueHostsResolver: IValueHostResolver): void {
        // does nothing
    }    
}
export function RegisterPredictableConditions(factory: ConditionFactory): void
{
    factory.Register(AlwaysMatchesConditionType, (descriptor) => new AlwaysMatchesCondition(descriptor));
    factory.Register(NeverMatchesConditionType, (descriptor) => new NeverMatchesCondition(descriptor));
    factory.Register(IsUndeterminedConditionType, (descriptor) => new IsUndeterminedCondition(descriptor));
    factory.Register(ThrowsExceptionConditionType, (descriptor) => new ThrowsExceptionCondition(descriptor));
    // yes, two conditions of the same class can be registered with different Type names.
    factory.Register(NeverMatchesConditionType2, (descriptor) => new NeverMatchesCondition(descriptor));
}