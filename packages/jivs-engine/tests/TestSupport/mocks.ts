import { ConditionFactory } from "../../src/Conditions/ConditionFactory";

import { type ILoggerService, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { MessageTokenResolverService  } from "../../src/Services/MessageTokenResolverService";
import type { IValidationServices } from "../../src/Interfaces/ValidationServices";
import type { IValueHost, SetValueOptions, ValueHostState, IValueHostFactory, ValueHostDescriptor, ValueChangedHandler, ValueHostStateChangedHandler } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver, IValueHostsManager } from "../../src/Interfaces/ValueHostResolver";
import { ConditionDescriptor, ConditionEvaluateResult, ConditionCategory, IConditionFactory, IEvaluateConditionDuringEdits, IConditionCore } from "../../src/Interfaces/Conditions";
import { IInputValueHost, InputValueHostState } from "../../src/Interfaces/InputValueHost";
import { ValidateOptions, ValidateResult, ValidationResult, BusinessLogicError, IssueFound } from "../../src/Interfaces/Validation";
import { ValidatableValueHostBase } from "../../src/ValueHosts/ValidatableValueHostBase";
import { IInputValidator, IInputValidatorFactory, InputValidatorDescriptor } from "../../src/Interfaces/InputValidator";
import { IValidationManager, IValidationManagerCallbacks, ValidationManagerStateChangedHandler, ValidationManagerValidatedHandler } from "../../src/Interfaces/ValidationManager";
import { registerStandardValueHostGenerators, ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { InputValidatorFactory } from "../../src/ValueHosts/InputValidator";
import { ITextLocalizerService } from "../../src/Interfaces/TextLocalizerService";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import { IDataTypeFormatterService } from "../../src/Interfaces/DataTypeFormatterService";
import { IAutoGenerateDataTypeCheckService } from "../../src/Interfaces/AutoGenerateDataTypeCheckService";
import { IDataTypeComparerService } from "../../src/Interfaces/DataTypeComparerService";
import { IDataTypeConverterService } from "../../src/Interfaces/DataTypeConverterService";
import { IDataTypeIdentifierService } from "../../src/Interfaces/DataTypeIdentifierService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { AutoGenerateDataTypeCheckService } from "../../src/Services/AutoGenerateDataTypeCheckService";
import { DataTypeComparerService } from "../../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { toIInputValueHost } from "../../src/ValueHosts/InputValueHost";
import { IMessageTokenResolverService } from "../../src/Interfaces/MessageTokenResolverService";
import { registerAllConditions, registerDataTypeCheckGenerators, registerDataTypeComparers, registerDataTypeConverters, registerDataTypeFormatters, registerDataTypeIdentifiers } from "./createValidationServices";
import { ValueHostValidatedHandler, InputValueChangedHandler } from "../../src/Interfaces/ValidatableValueHostBase";
import { populateServicesWithManyCultures } from "./utilities";
import { registerTestingOnlyConditions } from "./conditionsForTesting";


export function createMockValidationManagerForMessageTokenResolver(registerLookupKeys: boolean = true): IValidationManager
{
    let services = new MockValidationServices(false, false);
    populateServicesWithManyCultures(services, 'en', registerLookupKeys);
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

    public get valueHostsManager(): IValueHostsManager {
        return this._valueHostsManager;
    }
    getId(): string {
        return this._id;
    }
    getLabel(): string {
        return this._label;
    }
    getValue() {
        return this._value;
    }
    setValue(value: any, options?: SetValueOptions | undefined): void {
        this._value = value;
        if (options && options.reset)
            this.isChanged = false;
        else
            this.isChanged = true;
    }
    setValueToUndefined(options?: SetValueOptions | undefined): void {
        this.setValue(undefined, options);
    }
    getDataType(): string | null {
        return this._dataTypeLookupKey;
    }

    saveIntoState(key: string, value: any): void
    {
        if (value !== undefined)
            this._savedItems[key] = value;
        else
            delete this._savedItems[key];
    }

    getFromState(key: string): any | undefined
    {
        return this._savedItems[key];
    }
    _savedItems: {
        [key: string]: any
    } = {};

    isChanged: boolean = false;

    setLabel(label: string | null | undefined, labell10n?: string | null | undefined): void
    {
        if (label !== null)
            this.saveIntoState('_label', label);
        if (labell10n !== null)
            this.saveIntoState('_labell10n', labell10n);
    }
}


export class MockInputValueHost extends MockValueHost
    implements IInputValueHost
{

    _inputValue: any = undefined;
    _conversionErrorMessage: string | undefined;

    public override setValue(value: any, options?: SetValueOptions | undefined): void {
        super.setValue(value, options);
        if (value === undefined && options && options.conversionErrorTokenValue)
            this._conversionErrorMessage = options.conversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;        
    }

    public getInputValue() {
        return this._inputValue;
    }
    setInputValue(value: any, options?: SetValueOptions | undefined): void {
        this._inputValue = value;
        this._conversionErrorMessage = undefined;
    }
    setValues(nativeValue: any, inputValue: any, options?: SetValueOptions | undefined): void {
        this.setValue(nativeValue);
        this.setInputValue(inputValue);
        if (nativeValue === undefined && options && options.conversionErrorTokenValue)
            this._conversionErrorMessage = options.conversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;
    }
    validate(options?: ValidateOptions): ValidateResult {
        throw new Error("Method not implemented.");
    }
    clearValidation(): void {
        throw new Error("Method not implemented.");
    }
    isValid: boolean = false;

    doNotSaveNativeValue(): boolean
    {
        throw new Error("Method not implemented.");
    }

    validationResult: ValidationResult = ValidationResult.NotAttempted;
    
    setBusinessLogicError(error: BusinessLogicError): void {
        throw new Error("Method not implemented.");
    }
    clearBusinessLogicErrors(): void {
        throw new Error("Method not implemented.");
    }

    getIssueFound(conditionType: string): IssueFound | null
    {
        throw new Error("Method not implemented."); 
    }
    
    getIssuesFound(group?: string | undefined): IssueFound[] {
        throw new Error("Method not implemented.");
    }    

    public getConversionErrorMessage(): string | null
    {
        return this._conversionErrorMessage ?? null;
    }

    requiresInput: boolean = false;
    
    otherValueHostChangedNotification(valueHostIdThatChanged: string, revalidate: boolean): void {
        // do nothing
    }
    
    getValidator(conditionType: string): IInputValidator | null {
        throw new Error("Method not implemented.");
    }
    addValidator(descriptor: InputValidatorDescriptor): void
    {
        throw new Error("Method not implemented.");
    }
    setGroup(group: string): void
    {
        throw new Error("Method not implemented.");
    }    
    changeEnabledOnValidator(conditionType: string, enabled: boolean): void
    {
        throw new Error("Method not implemented.");
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
        registerStandardValueHostGenerators(factory);
        this._valueHostFactory = factory;
        this._inputValidatorFactory = new InputValidatorFactory();

        this.activeCultureId = 'en';
        this._conditionFactory = new ConditionFactory();
        this.dataTypeFormatterService = new DataTypeFormatterService();
        this.dataTypeComparerService = new DataTypeComparerService();
        this.dataTypeConverterService = new DataTypeConverterService();
        this.dataTypeIdentifierService = new DataTypeIdentifierService();
        this.autoGenerateDataTypeCheckService = new AutoGenerateDataTypeCheckService();
        // don't let a condition slip in unwelcome
        // If the test needs it, it can set it explicitly
        this.autoGenerateDataTypeCheckService.enabled = false;

        this.textLocalizerService = new TextLocalizerService();
        this._messageTokenResolverService = new MessageTokenResolverService();
        this._loggerService = new MockCapturingLogger();

        if (registerStandardConditions) {
            registerAllConditions(this.conditionFactory as ConditionFactory);
            registerTestingOnlyConditions(this.conditionFactory as ConditionFactory);
        }
        if (registerStandardDataTypes)
        {
            registerDataTypeIdentifiers(this.dataTypeIdentifierService as DataTypeIdentifierService);
            registerDataTypeFormatters(this.dataTypeFormatterService as DataTypeFormatterService);
            registerDataTypeConverters(this.dataTypeConverterService as DataTypeConverterService);
            registerDataTypeComparers(this.dataTypeComparerService as DataTypeComparerService);
            registerDataTypeCheckGenerators(this.autoGenerateDataTypeCheckService as AutoGenerateDataTypeCheckService);
        }
    }
    public get activeCultureId(): string {
        return this._activeCultureID;
    }
    public set activeCultureId(cultureID: string) {
        this._activeCultureID = cultureID;
    }
    private _activeCultureID: string = 'en';

    public get conditionFactory(): IConditionFactory
    {
        return this._conditionFactory;
    }
    private _conditionFactory!: IConditionFactory;

    public get dataTypeFormatterService(): IDataTypeFormatterService {
        return this._dataTypeFormatterService;
    }
    public set dataTypeFormatterService(service: IDataTypeFormatterService)
    {
        this._dataTypeFormatterService = service;
        service.services = this;
    }
    private _dataTypeFormatterService!: IDataTypeFormatterService;

    public get dataTypeIdentifierService(): IDataTypeIdentifierService {
        return this._dataTypeIdentifierService;
    }
    public set dataTypeIdentifierService(service: IDataTypeIdentifierService)
    {
        this._dataTypeIdentifierService = service;
    }
    private _dataTypeIdentifierService!: IDataTypeIdentifierService;
    public get dataTypeConverterService(): IDataTypeConverterService {
        return this._dataTypeConverterService;
    }
    public set dataTypeConverterService(service: IDataTypeConverterService)
    {
        this._dataTypeConverterService = service;
        service.services = this;
    }
    private _dataTypeConverterService!: IDataTypeConverterService;
    public get dataTypeComparerService(): IDataTypeComparerService {
        return this._dataTypeComparerService;
    }
    public set dataTypeComparerService(service: IDataTypeComparerService)
    {
        this._dataTypeComparerService = service;
        service.services = this;
    }
    private _dataTypeComparerService!: IDataTypeComparerService;
    
    public get autoGenerateDataTypeCheckService(): IAutoGenerateDataTypeCheckService {
        return this._autoGenerateDataTypeCheckService;
    }
    public set autoGenerateDataTypeCheckService(service: IAutoGenerateDataTypeCheckService)
    {
        this._autoGenerateDataTypeCheckService = service;
        service.services = this;
    }
    private _autoGenerateDataTypeCheckService!: IAutoGenerateDataTypeCheckService;

    public get textLocalizerService(): ITextLocalizerService
    {
        return this._textLocalizerService!;
    }
    public set textLocalizerService(service: ITextLocalizerService)
    {
        this._textLocalizerService = service;
    }
    private _textLocalizerService: ITextLocalizerService | null = null;     

    public get messageTokenResolverService(): IMessageTokenResolverService {
        return this._messageTokenResolverService;
    }
    private _messageTokenResolverService!: IMessageTokenResolverService;

    public get loggerService(): ILoggerService {
        return this._loggerService;
    }
    private _loggerService!: ILoggerService;

    public get valueHostFactory(): IValueHostFactory
    {
        return this._valueHostFactory;
    }
    public set valueHostFactory(factory: IValueHostFactory)
    {
        this._valueHostFactory = factory;
    }
    private _valueHostFactory: IValueHostFactory;
    public get inputValidatorFactory(): IInputValidatorFactory
    {
        return this._inputValidatorFactory;
    }
    public set inputValidatorFactory(factory: IInputValidatorFactory)
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
        this.onValueHostStateChanged = this.onValueHostStateChangeHandler;
    }

    public get services(): IValidationServices
    {
        return this._services;
    }
    private _services: IValidationServices;
/**
 * ValueHosts for all ValueHostDescriptors.
 * Always replace a ValueHost when the associated Descriptor or State are changed.
 */    
    private _valueHosts: Map<string, IValueHost> = new Map<string, IValueHost>();  
    
    public addValueHost(id: string, dataTypeLookupKey: string, label: string, value?: any): MockValueHost
    {
        let vh = new MockValueHost(this, id, dataTypeLookupKey, label);
        this._valueHosts.set(id, vh);
        vh._value = value;
        return vh;
    }

    public addInputValueHost(id: string, dataTypeLookupKey: string, label: string, inputValue?: any, nativeValue?: any): MockInputValueHost
    {
        let vh = new MockInputValueHost(this, id, dataTypeLookupKey, label);
        this._valueHosts.set(id, vh);
        vh._inputValue = inputValue;
        vh._value = nativeValue;
        return vh;
    }
    public addInputValueHostWithDescriptor(descriptor: ValueHostDescriptor,
        state: InputValueHostState | null): IInputValueHost
    {
        if (!state)
            state = this.services.valueHostFactory.createState(descriptor) as InputValueHostState;
        let vh = this.services.valueHostFactory.create(this, descriptor, state) as IInputValueHost;
        this._valueHosts.set(descriptor.id, vh);    
  //      vh.SetValues(nativeValue, inputValue);
        return vh;
    }

    public getValueHost(valueHostId: string): IValueHost | null {
        return this._valueHosts.get(valueHostId) ?? null;
    }    
    public getInputValueHost(valueHostId: string): IInputValueHost | null {
        return toIInputValueHost(this.getValueHost(valueHostId));
    }    
    private _hostStateChanges: Array<ValueHostState> = [];
    public onValueHostStateChangeHandler: ValueHostStateChangedHandler = (valueHost, stateToRetain) => {
        this._hostStateChanges.push(stateToRetain);  
    };
    public getHostStateChanges(): Array<ValueHostState>
    {
        return this._hostStateChanges;
    }    

    validate(options?: ValidateOptions): Array<ValidateResult> {
        throw new Error("Method not implemented.");
    }
    clearValidation(): void {
        throw new Error("Method not implemented.");
    }

    isValid: boolean = true;        

    doNotSaveNativeValue(): boolean {
        throw new Error("Method not implemented.");
    }
    notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: string, revalidate: boolean): void {
        this._valueHosts.forEach((vh, key) => {
            if (vh instanceof ValidatableValueHostBase)
                vh.otherValueHostChangedNotification(valueHostIdThatChanged, revalidate);
        });
    }    
    public setBusinessLogicErrors(errors: Array<BusinessLogicError> | null): void
    {
        throw new Error("Method not implemented.");        
    }        
    getIssuesForInput(valueHostId: string): IssueFound[] {
        throw new Error("Method not implemented.");
    }
    getIssuesFound(group?: string | undefined): IssueFound[] {
        throw new Error("Method not implemented.");
    }

    public get onStateChanged(): ValidationManagerStateChangedHandler | null {
        return this._onStateChanged;
    }
    public set onStateChanged(fn: ValidationManagerStateChangedHandler) {
        this._onStateChanged = fn;
    }
    private _onStateChanged: ValidationManagerStateChangedHandler | null = null;

    public get onValidated(): ValidationManagerValidatedHandler | null {
        return this._onValidated;
    }
    public set onValidated(fn: ValidationManagerValidatedHandler) {
        this._onValidated = fn;
    }
    private _onValidated: ValidationManagerValidatedHandler | null = null;

    public get onValueHostStateChanged(): ValueHostStateChangedHandler | null {
        return this._onValueHostStateChanged;
    }
    public set onValueHostStateChanged(fn: ValueHostStateChangedHandler) {
        this._onValueHostStateChanged = fn;
    }
    private _onValueHostStateChanged: ValueHostStateChangedHandler | null = null;

    public get onValueHostValidated(): ValueHostValidatedHandler | null {
        return this._onValueHostValidated;
    }
    public set onValueHostValidated(fn: ValueHostValidatedHandler) {
        this._onValueHostValidated = fn;
    }
    private _onValueHostValidated: ValueHostValidatedHandler | null = null;

    public get onValueChanged(): ValueChangedHandler | null {
        return this._onValueChanged;
    }
    public set onValueChanged(fn: ValueChangedHandler) {
        this._onValueChanged = fn;
    }
    private _onValueChanged: ValueChangedHandler | null = null;

    public get onInputValueChanged(): InputValueChangedHandler | null {
        return this._onInputValueChanged;
    }    
    public set onInputValueChanged(fn: InputValueChangedHandler) {
        this._onInputValueChanged = fn;
    }    
    private _onInputValueChanged: InputValueChangedHandler | null = null;
}

export class MockCapturingLogger implements ILoggerService
{
    public minLevel: LoggingLevel = LoggingLevel.Warn;
    
    public captured: Array<MockCapturedLog> = [];
    public log(message: string, level: LoggingLevel, category?: string | undefined, source?: string | undefined): void {
        if (level >= this.minLevel)
            this.captured.push({
                message: message,
                level: level,
                category: category,
                source : source
            });
    }
    public entryCount(): Number
    {
        return this.captured.length;
    }
    public getLatest(): MockCapturedLog | null
    {
        if (this.captured.length)
            return this.captured[this.captured.length - 1];
        return null;
    }

    /**
     * Looks through all captures in order found. If any contain all matching values, it is returned.
     * messageSegment and sourceSegment allow a partial match (case insensitive).
     * Null parameters are not used for searching.
     * @param messageSegment 
     */
    public findMessage(messageSegment: string | null, logLevel : LoggingLevel | null, category: string | null, sourceSegment: string | null): MockCapturedLog | null
    {
        let messageRE: RegExp | null = messageSegment ? new RegExp(messageSegment, 'i') : null;
        let sourceRE : RegExp | null = sourceSegment ? new RegExp(sourceSegment, 'i') : null;        
        for (let capture of this.captured) {
            if ((logLevel !== null) && (capture.level !== logLevel))
                continue;
            if ((category !== null) && (capture.category !== category))
                continue;
            if (messageRE && !messageRE.test(capture.message))
                continue;
            if (sourceRE && capture.source && !sourceRE.test(capture.source))
                continue;
            return capture;
        }
        return null;
    }
}
export interface MockCapturedLog
{
    message: string,
    level: LoggingLevel,
    category: string | undefined,
    source: string | undefined
}