import { ConditionFactory } from "../../src/Conditions/ConditionFactory";

import { type ILoggerService } from "../../src/Interfaces/LoggerService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { type IValidationServices } from "../../src/Interfaces/ValidationServices";
import type { IValueHost, SetValueOptions, ValueHostInstanceState, IValueHostFactory, ValueHostConfig, ValueChangedHandler, ValueHostInstanceStateChangedHandler } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { IConditionFactory } from "../../src/Interfaces/Conditions";
import { IInputValueHost, InputValueChangedHandler, InputValueHostConfig, InputValueHostInstanceState } from "../../src/Interfaces/InputValueHost";
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, BusinessLogicError, IssueFound, ValidationState, SetIssuesFoundErrorCodeMissingBehavior } from "../../src/Interfaces/Validation";
import { ValidatableValueHostBase } from "../../src/ValueHosts/ValidatableValueHostBase";
import { IValidator, IValidatorFactory, ValidatorConfig } from "../../src/Interfaces/Validator";
import { IValidationManager, IValidationManagerCallbacks, ValidationManagerConfig, ValidationManagerInstanceState, ValidationStateChangedHandler } from "../../src/Interfaces/ValidationManager";
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
import { InputValueHost, toIInputValueHost } from "../../src/ValueHosts/InputValueHost";
import { IMessageTokenResolverService } from "../../src/Interfaces/MessageTokenResolverService";
import { registerAllConditions, registerDataTypeCheckGenerators, registerDataTypeComparers, registerDataTypeConverters, registerDataTypeFormatters, registerDataTypeIdentifiers } from "./createValidationServices";
import { ValueHostValidationStateChangedHandler } from "../../src/Interfaces/ValidatableValueHostBase";
import { populateServicesWithManyCultures } from "./utilities";
import { registerTestingOnlyConditions } from "./conditionsForTesting";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import { FluentValidatorCollector } from "../../src/ValueHosts/Fluent";
import { IValueHostsManager, ValueHostsManagerConfig, ValueHostsManagerConfigChangedHandler, ValueHostsManagerInstanceStateChangedHandler } from "../../src/Interfaces/ValueHostsManager";
import { CapturingLogger } from "./CapturingLogger";

import { IValueHostAccessor } from "../../src/Interfaces/ValueHostAccessor";
import { ValueHostAccessor } from "../../src/ValueHosts/ValueHostAccessor";
import { ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { IStaticValueHost } from "../../src/Interfaces/StaticValueHost";
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from "../../src/Interfaces/ValidatorsValueHostBase";
import { toICalcValueHost } from "../../src/ValueHosts/CalcValueHost";
import { toIStaticValueHost } from "../../src/ValueHosts/StaticValueHost";
import { PropertyValueHostInstanceState, IPropertyValueHost } from "../../src/Interfaces/PropertyValueHost";
import { PropertyValueHost, toIPropertyValueHost } from "../../src/ValueHosts/PropertyValueHost";
import { ICultureService } from "../../src/Interfaces/CultureService";
import { CultureService } from "../../src/Services/CultureService";
import { ILookupKeyFallbackService } from "../../src/Interfaces/LookupKeyFallbackService";
import { LookupKeyFallbackService } from "../../src/Services/LookupKeyFallbackService";
import { toIServicesAccessor } from "../../src/Interfaces/Services";
import { IDataTypeParserService } from "../../src/Interfaces/DataTypeParserService";
import { DataTypeParserService } from "../../src/Services/DataTypeParserService";
import { IValueHostConfigMergeService, IValidatorConfigMergeService } from "../../src/Interfaces/ConfigMergeService";
import { ValidatorConfigMergeService, ValueHostConfigMergeService } from "../../src/Services/ConfigMergeService";
import { ValueHostsManagerConfigModifier } from "../../src/ValueHosts/ValueHostsManagerConfigModifier";
import { ValueHostsManager } from "../../src/ValueHosts/ValueHostsManager";
import { ValidatorsValueHostBase } from "../../src/ValueHosts/ValidatorsValueHostBase";
import { ValidationManagerConfigModifier } from "../../src/Validation/ValidationManagerConfigModifier";
import { IManagerConfigBuilderFactory } from "../../src/Interfaces/ManagerConfigBuilderFactory";
import { IManagerConfigModifierFactory } from "../../src/Interfaces/ManagerConfigModifierFactory";
import { ManagerConfigBuilderFactory } from "../../src/Services/ManagerConfigBuilderFactory";
import { ManagerConfigModifierFactory } from "../../src/Services/ManagerConfigModifierFactory";


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
    dispose(): void {}
    _valueHostsManager: IValueHostsManager;
    _name: string;
    _label: string;
    _value: any;
    _dataTypeLookupKey: string;

    public get config(): ValueHostConfig
    {
        return {
            name: this.getName(),
            dataType: this.getDataType() ?? undefined,
            label: this.getLabel(),
            valueHostType: 'MockValueHost'
        }
    }

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
    getDataTypeLabel(): string {
        return this.getDataType() ?? ''; 
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

}


export class MockInputValueHost extends MockValueHost
    implements IInputValueHost
{

    _inputValue: any = undefined;
    _conversionErrorMessage: string | undefined;
    _parserLookupKey: string | null | undefined;

    public get config(): InputValueHostConfig
    {
        return {
            ...super.config,
            valueHostType: 'MockInputValueHost',
            validatorConfigs: []
        };
    }    

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
    corrected: boolean = false;
    
    get doNotSave(): boolean
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
    setIssuesFound(issuesFound: Array<IssueFound>, behavior: SetIssuesFoundErrorCodeMissingBehavior): boolean
    {
        throw new Error("Method not implemented.");
    }
    public getConversionErrorMessage(): string | null
    {
        return this._conversionErrorMessage ?? null;
    }
    public getParserLookupKey(): string | null | undefined
    {
        return this._parserLookupKey;
    }
    requiresInput: boolean = false;
    
    otherValueHostChangedNotification(valueHostNameThatChanged: string, revalidate: boolean): void {
        // do nothing
    }
    
    getValidator(conditionType: string): IValidator | null {
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
 * Flexible Mock ValidationServices with CapturingLogger.
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

        this._cultureService = new CultureService();
        this.cultureService.activeCultureId = 'en';
        this._conditionFactory = new ConditionFactory();
        this.dataTypeFormatterService = new DataTypeFormatterService();
        this.dataTypeParserService = new DataTypeParserService();
        this.dataTypeComparerService = new DataTypeComparerService();
        this.dataTypeConverterService = new DataTypeConverterService();
        this.dataTypeIdentifierService = new DataTypeIdentifierService();
        this.autoGenerateDataTypeCheckService = new AutoGenerateDataTypeCheckService();
        this.lookupKeyFallbackService = new LookupKeyFallbackService();
        // don't let a condition slip in unwelcome
        // If the test needs it, it can set it explicitly
        this.autoGenerateDataTypeCheckService.enabled = false;

        this.textLocalizerService = new TextLocalizerService();
        this.messageTokenResolverService = new MessageTokenResolverService();
        this.valueHostConfigMergeService = new ValueHostConfigMergeService();
        this.validatorConfigMergeService = new ValidatorConfigMergeService();
        this.managerConfigBuilderFactory = new ManagerConfigBuilderFactory();
        this.managerConfigModifierFactory = new ManagerConfigModifierFactory();

        this.loggerService = new CapturingLogger();

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
    

    public get cultureService(): ICultureService {
        return this._cultureService;
    }
    public set cultureService(service: ICultureService)
    {
        this._cultureService = service;
    }
    private _cultureService!: ICultureService;    

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

    public get dataTypeParserService(): IDataTypeParserService {
        return this._dataTypeParserService;
    }
    public set dataTypeParserService(service: IDataTypeParserService)
    {
        this._dataTypeParserService = service;
        service.services = this;
    }
    private _dataTypeParserService!: IDataTypeParserService;
    public get dataTypeIdentifierService(): IDataTypeIdentifierService {
        return this._dataTypeIdentifierService;
    }
    public set dataTypeIdentifierService(service: IDataTypeIdentifierService)
    {
        this._dataTypeIdentifierService = service;
        service.services = this;
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

    public get lookupKeyFallbackService(): ILookupKeyFallbackService {
        return this._lookupKeyFallbackservice;
    }
    public set lookupKeyFallbackService(service: ILookupKeyFallbackService)
    {
        this._lookupKeyFallbackservice = service;
    }
    private _lookupKeyFallbackservice!: ILookupKeyFallbackService;

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
    public set messageTokenResolverService(service: IMessageTokenResolverService)
    {
        this._messageTokenResolverService = service;
        service.services = this;
    }    
    private _messageTokenResolverService!: IMessageTokenResolverService;
    public get valueHostConfigMergeService(): IValueHostConfigMergeService
    {
        return this._valueHostConfigMergeService
    }        
    public set valueHostConfigMergeService(service: IValueHostConfigMergeService)
    {
        this._valueHostConfigMergeService = service;
        service.services = this;
    }    
    private _valueHostConfigMergeService!: IValueHostConfigMergeService;
    public get validatorConfigMergeService(): IValidatorConfigMergeService
    {
        return this._validatorConfigMergeService;
    }    
    public set validatorConfigMergeService(service: IValidatorConfigMergeService)
    {
        this._validatorConfigMergeService = service;
        service.services = this;
    }    
    private _validatorConfigMergeService!: IValidatorConfigMergeService;    

    public get loggerService(): ILoggerService {
        return this._loggerService;
    }
    public set loggerService(service: ILoggerService) {
        this._loggerService = service;
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

    public get managerConfigBuilderFactory(): IManagerConfigBuilderFactory
    {
        return this._managerConfigBuilderFactory;
    }
    public set managerConfigBuilderFactory(factory: IManagerConfigBuilderFactory)
    {
        this._managerConfigBuilderFactory = factory;
        factory.services = this;
    }
    private _managerConfigBuilderFactory!: IManagerConfigBuilderFactory; 
    
    public get managerConfigModifierFactory(): IManagerConfigModifierFactory
    {
        return this._managerConfigModifierFactory;
    }
    public set managerConfigModifierFactory(factory: IManagerConfigModifierFactory)
    {
        this._managerConfigModifierFactory = factory;
        factory.services = this;
    }
    private _managerConfigModifierFactory!: IManagerConfigModifierFactory;
}

/**
 * MockValidationManager limited to implementing support for 
 * child ValueHosts.
 */
export class MockValidationManager extends ValueHostsManager<ValidationManagerInstanceState>
    implements IValidationManager, IValidationManagerCallbacks
{
    constructor(services: IValidationServices)
    {
        super({ services: services, valueHostConfigs: [] });
        this.config.onValueHostInstanceStateChanged = this.onValueHostInstanceStateChangeHandler;
    }

    public get config(): ValidationManagerConfig
    {
        return super.config as ValidationManagerConfig;
    }

    public get services(): IValidationServices {
        return super.services as IValidationServices;
    }

    public startModifying(): ValidationManagerConfigModifier {
        return this.services.managerConfigModifierFactory.create(this, this.valueHostConfigs) as ValidationManagerConfigModifier
    }

    public getValidatorsValueHost(valueHostName: string): IValidatorsValueHostBase | null {
        let vh = this.getValueHost(valueHostName);
        if (vh instanceof ValidatorsValueHostBase)
            return vh;
        return null;
    }
    getInputValueHost(valueHostName: string): IInputValueHost | null {
        let vh = this.getValueHost(valueHostName);
        if (vh instanceof InputValueHost)
            return vh;
        return null;
    }
    getPropertyValueHost(valueHostName: string): IPropertyValueHost | null {
        let vh = this.getValueHost(valueHostName);
        if (vh instanceof PropertyValueHost)
            return vh;
        return null;
    }
    asyncProcessing?: boolean | undefined;

    public addMockValueHost(name: ValueHostName, dataTypeLookupKey: string, label: string, value?: any): MockValueHost
    {
        let vh = new MockValueHost(this, name, dataTypeLookupKey, label);
        this.valueHosts.set(name, vh);
        this.valueHostConfigs.set(name, vh.config);
        vh._value = value;
        return vh;
    }

    public addMockInputValueHost(name: ValueHostName, dataTypeLookupKey: string, label: string, inputValue?: any, nativeValue?: any): MockInputValueHost
    {
        let vh = new MockInputValueHost(this, name, dataTypeLookupKey, label);
        this.valueHosts.set(name, vh);
        this.valueHostConfigs.set(name, vh.config);
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
        this.valueHosts.set(config.name, vh);  
        this.valueHostConfigs.set(config.name, config);        
        return vh;
    }

    public addPropertyValueHostWithConfig(config: ValueHostConfig,
        state: PropertyValueHostInstanceState | null): IPropertyValueHost
    {
        if (!state)
            state = this.services.valueHostFactory.createInstanceState(config) as PropertyValueHostInstanceState;
        let vh = this.services.valueHostFactory.create(this, config, state) as IPropertyValueHost;
        this.valueHosts.set(config.name, vh);  
        this.valueHostConfigs.set(config.name, config);         
        return vh;
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

    doNotSave: boolean = false;

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
    setIssuesFound(issuesFound: Array<IssueFound>, behavior: SetIssuesFoundErrorCodeMissingBehavior): boolean
    {
        throw new Error("Method not implemented.");        
    }
    notifyValidationStateChanged(validationState: ValidationState | null, options?: ValidateOptions, force?: boolean): void
    {

    }
    
    public get onConfigChanged(): ValueHostsManagerConfigChangedHandler | null {
        return this.config.onConfigChanged ?? null;
    }


    public get onInstanceStateChanged(): ValueHostsManagerInstanceStateChangedHandler | null {
        return this.config.onInstanceStateChanged ?? null;
    }
    public set onInstanceStateChanged(fn: ValueHostsManagerInstanceStateChangedHandler) {
        this.config.onInstanceStateChanged = fn;
    }


    public get onValidationStateChanged(): ValidationStateChangedHandler | null {
        return this.config.onValidationStateChanged ?? null;
    }
    public set onValidationStateChanged(fn: ValidationStateChangedHandler) {
        this.config.onValidationStateChanged = fn;
    }


    public get onValueHostValidationStateChanged(): ValueHostValidationStateChangedHandler | null {
        return this.config.onValueHostValidationStateChanged ?? null;
    }
    public set onValueHostValidationStateChanged(fn: ValueHostValidationStateChangedHandler) {
        this.config.onValueHostValidationStateChanged = fn;
    }

    
    public get onValueHostInstanceStateChanged(): ValueHostInstanceStateChangedHandler | null {
        return this.config.onValueHostInstanceStateChanged ?? null;
    }
    public set onValueHostInstanceStateChanged(fn: ValueHostInstanceStateChangedHandler) {
        this.config.onValueHostInstanceStateChanged = fn;
    }

    public get onValueChanged(): ValueChangedHandler | null {
        return this.config.onValueChanged ?? null;
    }
    public set onValueChanged(fn: ValueChangedHandler) {
        this.config.onValueChanged = fn;
    }


    public get onInputValueChanged(): InputValueChangedHandler | null {
        return this.config.onInputValueChanged ?? null;
    }    
    public set onInputValueChanged(fn: InputValueChangedHandler) {
        this.config.onInputValueChanged = fn;
    }    
}
