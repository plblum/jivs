import { ConditionFactory } from "../src/Conditions/ConditionFactory";
import { DataTypeServices } from "../src/DataTypes/DataTypeServices";

import { type ILogger, LoggingLevel } from "../src/Interfaces/Logger";
import { MessageTokenResolver  } from "../src/ValueHosts/MessageTokenResolver";
import type { IValidationServices } from "../src/Interfaces/ValidationServices";
import type { IValidationManagerCallbacks, ValidationManagerStateChangedHandler, ValidationManagerValidatedHandler } from "../src/ValueHosts/ValidationManager";
import type { IValueHost, SetValueOptions, ValueHostState, IValueHostFactory, ValueHostDescriptor } from "../src/Interfaces/ValueHost";
import { IValueHostResolver, IValueHostsManager } from "../src/Interfaces/ValueHostResolver";
import { ValueChangedHandler, ValueHostStateChangedHandler } from "../src/ValueHosts/ValueHostBase";
import { ConditionBase } from "../src/Conditions/ConditionBase";
import { ConditionDescriptor, ConditionEvaluateResult, ConditionCategory, IConditionFactory } from "../src/Interfaces/Conditions";
import { IInputValueHost, InputValueHostState } from "../src/Interfaces/InputValueHost";
import { ValidateOptions, ValidateResult, ValidationResult, BusinessLogicError, IssueFound, IssueSnapshot } from "../src/Interfaces/Validation";
import { InputValueHostBase, ValueHostValidatedHandler, InputValueChangedHandler } from "../src/ValueHosts/InputValueHostBase";
import { IInputValidatorFactory, IMessageTokenResolver } from "../src/Interfaces/InputValidator";
import { IDataTypeServices } from "../src/Interfaces/DataTypes";
import { IValidationManager } from "../src/Interfaces/ValidationManager";
import { CreateDataTypeServicesWithManyCultures } from "./DataTypes/DataTypeServices.test";
import { RegisterConditions, PopulateDataTypeServices } from "../starter_code/create_services";
import { RegisterStandardValueHostGenerators, ValueHostFactory } from "../src/ValueHosts/ValueHostFactory";
import { InputValidatorFactory } from "../src/ValueHosts/InputValidator";
import { ITextLocalizerService } from "../src/Interfaces/TextLocalizerService";
import { TextLocalizerService } from "../src/Services/TextLocalizerService";


export function CreateMockValidationManagerForMessageTokenResolver(registerLookupKeys: boolean = true): IValidationManager
{
    let services = new MockValidationServices(false, false);
    services.DataTypeServices = CreateDataTypeServicesWithManyCultures('en', registerLookupKeys);
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
    SetValue(value: any, options?: SetValueOptions | undefined): void {
        this._value = value;
        if (options && options.Reset)
            this.IsChanged = false;
        else
            this.IsChanged = true;
    }
    SetValueToUndefined(options?: SetValueOptions | undefined): void {
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

    public override SetValue(value: any, options?: SetValueOptions | undefined): void {
        super.SetValue(value, options);
        if (value === undefined && options && options.ConversionErrorTokenValue)
            this._conversionErrorMessage = options.ConversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;        
    }

    public GetInputValue() {
        return this._inputValue;
    }
    SetInputValue(value: any, options?: SetValueOptions | undefined): void {
        this._inputValue = value;
        this._conversionErrorMessage = undefined;
    }
    SetValues(nativeValue: any, inputValue: any, options?: SetValueOptions | undefined): void {
        this.SetValue(nativeValue);
        this.SetInputValue(inputValue);
        if (nativeValue === undefined && options && options.ConversionErrorTokenValue)
            this._conversionErrorMessage = options.ConversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;
    }
    Validate(options?: ValidateOptions): ValidateResult {
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
    
    SetBusinessLogicError(error: BusinessLogicError): void {
        throw new Error("Method not implemented.");
    }
    ClearBusinessLogicErrors(): void {
        throw new Error("Method not implemented.");
    }
    
    GetIssuesFound(): Array<IssueFound> | null {
        throw new Error("Method not implemented.");
    }    
    GetIssuesForInput(): IssueSnapshot[] {
        throw new Error("Method not implemented.");
    }
    GetIssuesForSummary(group?: string | undefined): IssueSnapshot[] {
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
 */
export class MockValidationServices implements IValidationServices
{
    constructor(registerStandardConditions: boolean,
        registerStandardDataTypes: boolean)
    {
        let factory = new ValueHostFactory();
        RegisterStandardValueHostGenerators(factory);
        this._valueHostFactory = factory;
        this._inputValidatorFactory = new InputValidatorFactory();

        this.ActiveCultureId = 'en';
        this._conditionFactory = new ConditionFactory();
        this.DataTypeServices = new DataTypeServices();
        // don't let a condition slip in unwelcome
        // If the test needs it, it can set it explicitly
        this.DataTypeServices.AutoGenerateDataTypeConditionEnabled = false;
        this.TextLocalizerService = new TextLocalizerService();
        this._messageTokenResolverService = new MessageTokenResolver();
        this._loggerService = new MockCapturingLogger();

        if (registerStandardConditions) {
            RegisterConditions(this._conditionFactory as ConditionFactory);
            RegisterTestingOnlyConditions(this._conditionFactory as ConditionFactory);
        }
        if (registerStandardDataTypes)
            PopulateDataTypeServices(this._dataTypeServices as DataTypeServices);
    }
    public get ActiveCultureId(): string {
        return this._activeCultureID;
    }
    public set ActiveCultureId(cultureID: string) {
        this._activeCultureID = cultureID;
    }
    private _activeCultureID: string = 'en';

    public get ConditionFactory(): IConditionFactory
    {
        return this._conditionFactory;
    }
    private _conditionFactory!: IConditionFactory;

    public get DataTypeServices(): IDataTypeServices {
        return this._dataTypeServices;
    }
    public set DataTypeServices(service: IDataTypeServices)
    {
        this._dataTypeServices = service;
        service.Services = this;
    }
    private _dataTypeServices!: IDataTypeServices;

    public get TextLocalizerService(): ITextLocalizerService
    {
        return this._textLocalizerService!;
    }
    public set TextLocalizerService(service: ITextLocalizerService)
    {
        this._textLocalizerService = service;
    }
    private _textLocalizerService: ITextLocalizerService | null = null;     

    public get MessageTokenResolverService(): IMessageTokenResolver {
        return this._messageTokenResolverService;
    }
    private _messageTokenResolverService!: IMessageTokenResolver;

    public get LoggerService(): ILogger {
        return this._loggerService;
    }
    private _loggerService!: ILogger;

    public get ValueHostFactory(): IValueHostFactory
    {
        return this._valueHostFactory;
    }
    public set ValueHostFactory(factory: IValueHostFactory)
    {
        this._valueHostFactory = factory;
    }
    private _valueHostFactory: IValueHostFactory;
    public get InputValidatorFactory(): IInputValidatorFactory
    {
        return this._inputValidatorFactory;
    }
    public set InputValidatorFactory(factory: IInputValidatorFactory)
    {
        this._inputValidatorFactory = factory;
    }
    private _inputValidatorFactory: IInputValidatorFactory;
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
    public AddInputValueHostWithDescriptor(descriptor: ValueHostDescriptor,
        state: InputValueHostState | null): IInputValueHost
    {
        if (!state)
            state = this.Services.ValueHostFactory.CreateState(descriptor) as InputValueHostState;
        let vh = this.Services.ValueHostFactory.Create(this, descriptor, state) as IInputValueHost;
        this._valueHosts.set(descriptor.Id, vh);    
  //      vh.SetValues(nativeValue, inputValue);
        return vh;
    }

    public GetValueHost(valueHostId: string): IValueHost | null {
        return this._valueHosts.get(valueHostId) ?? null;
    }    

    private _hostStateChanges: Array<ValueHostState> = [];
    public OnValueHostStateChangeHandler: ValueHostStateChangedHandler = (valueHost, stateToRetain) => {
        this._hostStateChanges.push(stateToRetain);  
    };
    public GetHostStateChanges(): Array<ValueHostState>
    {
        return this._hostStateChanges;
    }    

    Validate(options?: ValidateOptions): Array<ValidateResult> {
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
    public SetBusinessLogicErrors(errors: Array<BusinessLogicError> | null): void
    {
        throw new Error("Method not implemented.");        
    }        
    GetIssuesForInput(valueHostId: string): IssueSnapshot[] {
        throw new Error("Method not implemented.");
    }
    GetIssuesForSummary(group?: string | undefined): IssueSnapshot[] {
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
    
    public Captured: Array<MockCapturedLog> = [];
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
    public GetLatest(): MockCapturedLog | null
    {
        if (this.Captured.length)
            return this.Captured[this.Captured.length - 1];
        return null;
    }

    /**
     * Looks through all captures in order found. If any contain the message sent
     * (case insensitive), it is returned. If none match, returns null.
     * @param messageSegment 
     */
    public FindMessage(messageSegment: string): MockCapturedLog | null
    {
        let re = new RegExp(messageSegment, 'i');
        for (let capture of this.Captured)
            if (re.test(capture.Message))
                return capture;
        return null;
    }
}
export interface MockCapturedLog
{
    Message: string,
    Level: LoggingLevel,
    Category: string | undefined,
    Source: string | undefined
}

// Custom Conditions designed for testing validation where the Condition has a predictable behavior

export const AlwaysMatchesConditionType = "AlwaysMatches";

export class AlwaysMatchesCondition extends ConditionBase<ConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }    
    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
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

export class NeverMatchesCondition extends ConditionBase<ConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }

    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
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

export class IsUndeterminedCondition extends ConditionBase<ConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }
    
    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
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

export class ThrowsExceptionCondition extends ConditionBase<ConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.Descriptor.Type; }    
    public Evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        throw new Error("Always Throws");
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Undetermined;
    }    
    public GatherValueHostIds(collection: Set<string>, valueHostsResolver: IValueHostResolver): void {
        // does nothing
    }    
}
export function RegisterTestingOnlyConditions(factory: ConditionFactory): void
{
    factory.Register(AlwaysMatchesConditionType, (descriptor) => new AlwaysMatchesCondition(descriptor));
    factory.Register(NeverMatchesConditionType, (descriptor) => new NeverMatchesCondition(descriptor));
    factory.Register(IsUndeterminedConditionType, (descriptor) => new IsUndeterminedCondition(descriptor));
    factory.Register(ThrowsExceptionConditionType, (descriptor) => new ThrowsExceptionCondition(descriptor));
    // yes, two conditions of the same class can be registered with different Type names.
    factory.Register(NeverMatchesConditionType2, (descriptor) => new NeverMatchesCondition(descriptor));
}