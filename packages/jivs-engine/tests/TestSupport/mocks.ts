import { ConditionFactory } from "../../src/Conditions/ConditionFactory";

import { type ILoggerService, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { toIServicesAccessor, type IValidationServices } from "../../src/Interfaces/ValidationServices";
import type { IValueHost, SetValueOptions, ValueHostInstanceState, IValueHostFactory, ValueHostConfig, ValueChangedHandler, ValueHostInstanceStateChangedHandler } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver, IValueHostsManager } from "../../src/Interfaces/ValueHostResolver";
import { IConditionFactory } from "../../src/Interfaces/Conditions";
import { IInputValueHost, InputValueChangedHandler, InputValueHostInstanceState } from "../../src/Interfaces/InputValueHost";
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, BusinessLogicError, IssueFound, ValidationState } from "../../src/Interfaces/Validation";
import { ValidatableValueHostBase } from "../../src/ValueHosts/ValidatableValueHostBase";
import { IValidator, IValidatorFactory, ValidatorConfig } from "../../src/Interfaces/Validator";
import { IValidationManager, IValidationManagerCallbacks, ValidationManagerInstanceStateChangedHandler, ValidationManagerValidatedHandler } from "../../src/Interfaces/ValidationManager";
import { registerStandardValueHostGenerators, ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { ValidatorFactory } from "../../src/Validation/Validator";
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
import { ValueHostValidatedHandler } from "../../src/Interfaces/ValidatableValueHostBase";
import { populateServicesWithManyCultures } from "./utilities";
import { registerTestingOnlyConditions } from "./conditionsForTesting";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import { FluentValidatorCollector } from "../../src/ValueHosts/Fluent";


export function createMockValidationManagerForMessageTokenResolver(registerLookupKeys: boolean = true): IValidationManager
{
    let services = new MockValidationServices(false, false);
    populateServicesWithManyCultures(services, 'en', registerLookupKeys);
    return new MockValidationManager(services);
}

export class MockValueHost implements IValueHost
{
    constructor(valueHostsManager: IValueHostsManager, name: string, dataTypeLookupKey: string, label?: string)
    {
        this._valueHostsManager = valueHostsManager;
        this._name = name;
        this._dataTypeLookupKey = dataTypeLookupKey;
        this._label = label ?? name;
        this._value = undefined;
    }
    _valueHostsManager: IValueHostsManager;
    _name: string;
    _label: string;
    _value: any;
    _dataTypeLookupKey: string;

    public get valueHostsManager(): IValueHostsManager {
        return this._valueHostsManager;
    }
    getName(): string {
        return this._name;
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

    saveIntoInstanceState(key: string, value: any): void
    {
        if (value !== undefined)
            this._savedItems[key] = value;
        else
            delete this._savedItems[key];
    }

    getFromInstanceState(key: string): any | undefined
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
            this.saveIntoInstanceState('_label', label);
        if (labell10n !== null)
            this.saveIntoInstanceState('_labell10n', labell10n);
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
    validate(options?: ValidateOptions): ValueHostValidateResult {
        throw new Error("Method not implemented.");
    }
    clearValidation(): boolean {
        throw new Error("Method not implemented.");
    }
    isValid: boolean = false;
    asyncProcessing: boolean = false;
    
    doNotSaveNativeValue(): boolean
    {
        throw new Error("Method not implemented.");
    }

    validationStatus: ValidationStatus = ValidationStatus.NotAttempted;
    
    setBusinessLogicError(error: BusinessLogicError): boolean {
        throw new Error("Method not implemented.");
    }
    clearBusinessLogicErrors(): boolean {
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
    
    otherValueHostChangedNotification(valueHostNameThatChanged: string, revalidate: boolean): void {
        // do nothing
    }
    
    getValidator(conditionType: string): IValidator | null {
        throw new Error("Method not implemented.");
    }
    addValidator(config: ValidatorConfig): void
    {
        throw new Error("Method not implemented.");
    }
    configValidators(): FluentValidatorCollector {
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
    gatherValueHostNames(collection: Set<string>, valueHostResolver: IValueHostResolver): void {
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
        this._validatorFactory = new ValidatorFactory();

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
    public getService<T>(serviceName: string): T | null
    {
        serviceName = serviceName.toLowerCase();
        return this._services[serviceName] ?? null;
    }

    /**
     * Adds or replaces a service.
     * If the supplied service implements IServicesAccessor, its own
     * services property is assigned to this ValidationServices instance.
     * @param serviceName - name that identifies this service and
     * will be used in getService().
     * @param service - the service. It can be a class, object, or primitive.
     * Will be a case insensitive match
     */    
    public setService(serviceName: string, service: any): void
    {
        serviceName = serviceName.toLowerCase();
        this._services[serviceName] = service;
        let sa = toIServicesAccessor(service);
        if (sa)
            sa.services = this;
    }

    private _services: { [serviceName: string]: any } = {};
    
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
    public get validatorFactory(): IValidatorFactory
    {
        return this._validatorFactory;
    }
    public set validatorFactory(factory: IValidatorFactory)
    {
        this._validatorFactory = factory;
    }
    private _validatorFactory: IValidatorFactory;
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
        this.onValueHostInstanceStateChanged = this.onValueHostInstanceStateChangeHandler;
    }

    public get services(): IValidationServices
    {
        return this._services;
    }
    private _services: IValidationServices;
/**
 * ValueHosts for all ValueHostConfigs.
 * Always replace a ValueHost when the associated Config or InstanceState are changed.
 */    
    private _valueHosts: Map<string, IValueHost> = new Map<string, IValueHost>();  
    
    public addValueHost(name: ValueHostName, dataTypeLookupKey: string, label: string, value?: any): MockValueHost
    {
        let vh = new MockValueHost(this, name, dataTypeLookupKey, label);
        this._valueHosts.set(name, vh);
        vh._value = value;
        return vh;
    }

    public addInputValueHost(name: ValueHostName, dataTypeLookupKey: string, label: string, inputValue?: any, nativeValue?: any): MockInputValueHost
    {
        let vh = new MockInputValueHost(this, name, dataTypeLookupKey, label);
        this._valueHosts.set(name, vh);
        vh._inputValue = inputValue;
        vh._value = nativeValue;
        return vh;
    }
    public addInputValueHostWithConfig(config: ValueHostConfig,
        state: InputValueHostInstanceState | null): IInputValueHost
    {
        if (!state)
            state = this.services.valueHostFactory.createInstanceState(config) as InputValueHostInstanceState;
        let vh = this.services.valueHostFactory.create(this, config, state) as IInputValueHost;
        this._valueHosts.set(config.name, vh);    
  //      vh.SetValues(nativeValue, inputValue);
        return vh;
    }

    public getValueHost(valueHostName: ValueHostName): IValueHost | null {
        return this._valueHosts.get(valueHostName) ?? null;
    }    
    public getInputValueHost(valueHostName: ValueHostName): IInputValueHost | null {
        return toIInputValueHost(this.getValueHost(valueHostName));
    }    
    private _hostInstanceStateChanges: Array<ValueHostInstanceState> = [];
    public onValueHostInstanceStateChangeHandler: ValueHostInstanceStateChangedHandler = (valueHost, stateToRetain) => {
        this._hostInstanceStateChanges.push(stateToRetain);  
    };
    public getHostStateChanges(): Array<ValueHostInstanceState>
    {
        return this._hostInstanceStateChanges;
    }    

    validate(options?: ValidateOptions): ValidationState {
        throw new Error("Method not implemented.");
    }
    clearValidation(options?: ValidateOptions): boolean {
        throw new Error("Method not implemented.");
    }

    isValid: boolean = true;        

    doNotSaveNativeValues(): boolean {
        throw new Error("Method not implemented.");
    }
    notifyOtherValueHostsOfValueChange(valueHostNameThatChanged: string, revalidate: boolean): void {
        this._valueHosts.forEach((vh, key) => {
            if (vh instanceof ValidatableValueHostBase)
                vh.otherValueHostChangedNotification(valueHostNameThatChanged, revalidate);
        });
    }    
    public setBusinessLogicErrors(errors: Array<BusinessLogicError> | null): boolean
    {
        throw new Error("Method not implemented.");        
    }        
    getIssuesForInput(valueHostName: string): IssueFound[] {
        throw new Error("Method not implemented.");
    }
    getIssuesFound(group?: string | undefined): IssueFound[] {
        throw new Error("Method not implemented.");
    }

    public get onInstanceStateChanged(): ValidationManagerInstanceStateChangedHandler | null {
        return this._onInstanceStateChanged;
    }
    public set onInstanceStateChanged(fn: ValidationManagerInstanceStateChangedHandler) {
        this._onInstanceStateChanged = fn;
    }
    private _onInstanceStateChanged: ValidationManagerInstanceStateChangedHandler | null = null;

    public get onValidated(): ValidationManagerValidatedHandler | null {
        return this._onValidated;
    }
    public set onValidated(fn: ValidationManagerValidatedHandler) {
        this._onValidated = fn;
    }
    private _onValidated: ValidationManagerValidatedHandler | null = null;

    public get onValueHostInstanceStateChanged(): ValueHostInstanceStateChangedHandler | null {
        return this._onValueHostInstanceStateChanged;
    }
    public set onValueHostInstanceStateChanged(fn: ValueHostInstanceStateChangedHandler) {
        this._onValueHostInstanceStateChanged = fn;
    }
    private _onValueHostInstanceStateChanged: ValueHostInstanceStateChangedHandler | null = null;

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
