import { ConditionFactory } from "../src/Conditions/ConditionFactory";
import { LoggingLevel } from "../src/Interfaces/LoggerService";
import { MessageTokenResolverService } from "../src/Services/MessageTokenResolverService";
import { ConditionBase } from "../src/Conditions/ConditionBase";
import { ConditionEvaluateResult, ConditionCategory } from "../src/Interfaces/Conditions";
import { ValidationResult } from "../src/Interfaces/Validation";
import { InputValueHostBase } from "../src/ValueHosts/InputValueHostBase";
import { registerConditions, registerDataTypeCheckGenerators, registerDataTypeComparers, registerDataTypeConverters, registerDataTypeFormatters, registerDataTypeIdentifiers } from "../starter_code/create_services";
import { registerStandardValueHostGenerators, ValueHostFactory } from "../src/ValueHosts/ValueHostFactory";
import { InputValidatorFactory } from "../src/ValueHosts/InputValidator";
import { TextLocalizerService } from "../src/Services/TextLocalizerService";
import { DataTypeIdentifierService } from "../src/Services/DataTypeIdentifierService";
import { AutoGenerateDataTypeCheckService } from "../src/Services/AutoGenerateDataTypeCheckService";
import { DataTypeComparerService } from "../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../src/Services/DataTypeConverterService";
import { DataTypeFormatterService } from "../src/Services/DataTypeFormatterService";
import { populateServicesWithManyCultures } from "./Services/DataTypeFormatterService.test";
import { toIInputValueHost } from "../src/ValueHosts/InputValueHost";
export function createMockValidationManagerForMessageTokenResolver(registerLookupKeys = true) {
    let services = new MockValidationServices(false, false);
    populateServicesWithManyCultures(services, 'en', registerLookupKeys);
    return new MockValidationManager(services);
}
export class MockValueHost {
    constructor(valueHostsManager, id, dataTypeLookupKey, label) {
        this._savedItems = {};
        this.isChanged = false;
        this._valueHostsManager = valueHostsManager;
        this._id = id;
        this._dataTypeLookupKey = dataTypeLookupKey;
        this._label = label !== null && label !== void 0 ? label : id;
        this._value = undefined;
    }
    get valueHostsManager() {
        return this._valueHostsManager;
    }
    getId() {
        return this._id;
    }
    getLabel() {
        return this._label;
    }
    getValue() {
        return this._value;
    }
    setValue(value, options) {
        this._value = value;
        if (options && options.reset)
            this.isChanged = false;
        else
            this.isChanged = true;
    }
    setValueToUndefined(options) {
        this.setValue(undefined, options);
    }
    getDataType() {
        return this._dataTypeLookupKey;
    }
    saveIntoState(key, value) {
        if (value !== undefined)
            this._savedItems[key] = value;
        else
            delete this._savedItems[key];
    }
    getFromState(key) {
        return this._savedItems[key];
    }
    setLabel(label, labell10n) {
        if (label !== null)
            this.saveIntoState('_label', label);
        if (labell10n !== null)
            this.saveIntoState('_labell10n', labell10n);
    }
}
export class MockInputValueHost extends MockValueHost {
    constructor() {
        super(...arguments);
        this._inputValue = undefined;
        this.isValid = false;
        this.validationResult = ValidationResult.NotAttempted;
        this.requiresInput = false;
    }
    setValue(value, options) {
        super.setValue(value, options);
        if (value === undefined && options && options.conversionErrorTokenValue)
            this._conversionErrorMessage = options.conversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;
    }
    getInputValue() {
        return this._inputValue;
    }
    setInputValue(value, options) {
        this._inputValue = value;
        this._conversionErrorMessage = undefined;
    }
    setValues(nativeValue, inputValue, options) {
        this.setValue(nativeValue);
        this.setInputValue(inputValue);
        if (nativeValue === undefined && options && options.conversionErrorTokenValue)
            this._conversionErrorMessage = options.conversionErrorTokenValue;
        else
            this._conversionErrorMessage = undefined;
    }
    validate(options) {
        throw new Error("Method not implemented.");
    }
    clearValidation() {
        throw new Error("Method not implemented.");
    }
    doNotSaveNativeValue() {
        throw new Error("Method not implemented.");
    }
    setBusinessLogicError(error) {
        throw new Error("Method not implemented.");
    }
    clearBusinessLogicErrors() {
        throw new Error("Method not implemented.");
    }
    getIssuesFound() {
        throw new Error("Method not implemented.");
    }
    getIssuesForInput() {
        throw new Error("Method not implemented.");
    }
    getIssuesForSummary(group) {
        throw new Error("Method not implemented.");
    }
    getConversionErrorMessage() {
        var _a;
        return (_a = this._conversionErrorMessage) !== null && _a !== void 0 ? _a : null;
    }
    otherValueHostChangedNotification(valueHostIdThatChanged, revalidate) {
        // do nothing
    }
    getValidator(conditionType) {
        throw new Error("Method not implemented.");
    }
    addValidator(descriptor) {
        throw new Error("Method not implemented.");
    }
    setGroup(group) {
        throw new Error("Method not implemented.");
    }
    changeEnabledOnValidator(conditionType, enabled) {
        throw new Error("Method not implemented.");
    }
}
/**
 * Flexible Mock ValidationServices with MockCapturingLogger.
 * Optionally populated with standard Conditions and data types.
 */
export class MockValidationServices {
    constructor(registerStandardConditions, registerStandardDataTypes) {
        this._activeCultureID = 'en';
        this._textLocalizerService = null;
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
            registerConditions(this.conditionFactory);
            registerTestingOnlyConditions(this.conditionFactory);
        }
        if (registerStandardDataTypes) {
            registerDataTypeIdentifiers(this.dataTypeIdentifierService);
            registerDataTypeFormatters(this.dataTypeFormatterService);
            registerDataTypeConverters(this.dataTypeConverterService);
            registerDataTypeComparers(this.dataTypeComparerService);
            registerDataTypeCheckGenerators(this.autoGenerateDataTypeCheckService);
        }
    }
    get activeCultureId() {
        return this._activeCultureID;
    }
    set activeCultureId(cultureID) {
        this._activeCultureID = cultureID;
    }
    get conditionFactory() {
        return this._conditionFactory;
    }
    get dataTypeFormatterService() {
        return this._dataTypeFormatterService;
    }
    set dataTypeFormatterService(service) {
        this._dataTypeFormatterService = service;
        service.services = this;
    }
    get dataTypeIdentifierService() {
        return this._dataTypeIdentifierService;
    }
    set dataTypeIdentifierService(service) {
        this._dataTypeIdentifierService = service;
    }
    get dataTypeConverterService() {
        return this._dataTypeConverterService;
    }
    set dataTypeConverterService(service) {
        this._dataTypeConverterService = service;
        service.services = this;
    }
    get dataTypeComparerService() {
        return this._dataTypeComparerService;
    }
    set dataTypeComparerService(service) {
        this._dataTypeComparerService = service;
        service.services = this;
    }
    get autoGenerateDataTypeCheckService() {
        return this._autoGenerateDataTypeCheckService;
    }
    set autoGenerateDataTypeCheckService(service) {
        this._autoGenerateDataTypeCheckService = service;
        service.services = this;
    }
    get textLocalizerService() {
        return this._textLocalizerService;
    }
    set textLocalizerService(service) {
        this._textLocalizerService = service;
    }
    get messageTokenResolverService() {
        return this._messageTokenResolverService;
    }
    get loggerService() {
        return this._loggerService;
    }
    get valueHostFactory() {
        return this._valueHostFactory;
    }
    set valueHostFactory(factory) {
        this._valueHostFactory = factory;
    }
    get inputValidatorFactory() {
        return this._inputValidatorFactory;
    }
    set inputValidatorFactory(factory) {
        this._inputValidatorFactory = factory;
    }
}
/**
 * MockValidationManager limited to implementing support for
 * child ValueHosts.
 */
export class MockValidationManager {
    constructor(services) {
        /**
         * ValueHosts for all ValueHostDescriptors.
         * Always replace a ValueHost when the associated Descriptor or State are changed.
         */
        this._valueHosts = new Map();
        this._hostStateChanges = [];
        this.onValueHostStateChangeHandler = (valueHost, stateToRetain) => {
            this._hostStateChanges.push(stateToRetain);
        };
        this.isValid = true;
        this._onStateChanged = null;
        this._onValidated = null;
        this._onValueHostStateChanged = null;
        this._onValueHostValidated = null;
        this._onValueChanged = null;
        this._onInputValueChanged = null;
        this._services = services;
        this.onValueHostStateChanged = this.onValueHostStateChangeHandler;
    }
    get services() {
        return this._services;
    }
    addValueHost(id, dataTypeLookupKey, label, value) {
        let vh = new MockValueHost(this, id, dataTypeLookupKey, label);
        this._valueHosts.set(id, vh);
        vh._value = value;
        return vh;
    }
    addInputValueHost(id, dataTypeLookupKey, label, inputValue, nativeValue) {
        let vh = new MockInputValueHost(this, id, dataTypeLookupKey, label);
        this._valueHosts.set(id, vh);
        vh._inputValue = inputValue;
        vh._value = nativeValue;
        return vh;
    }
    addInputValueHostWithDescriptor(descriptor, state) {
        if (!state)
            state = this.services.valueHostFactory.createState(descriptor);
        let vh = this.services.valueHostFactory.create(this, descriptor, state);
        this._valueHosts.set(descriptor.id, vh);
        //      vh.SetValues(nativeValue, inputValue);
        return vh;
    }
    getValueHost(valueHostId) {
        var _a;
        return (_a = this._valueHosts.get(valueHostId)) !== null && _a !== void 0 ? _a : null;
    }
    getInputValueHost(valueHostId) {
        return toIInputValueHost(this.getValueHost(valueHostId));
    }
    getHostStateChanges() {
        return this._hostStateChanges;
    }
    validate(options) {
        throw new Error("Method not implemented.");
    }
    clearValidation() {
        throw new Error("Method not implemented.");
    }
    doNotSaveNativeValue() {
        throw new Error("Method not implemented.");
    }
    notifyOtherValueHostsOfValueChange(valueHostIdThatChanged, revalidate) {
        this._valueHosts.forEach((vh, key) => {
            if (vh instanceof InputValueHostBase)
                vh.otherValueHostChangedNotification(valueHostIdThatChanged, revalidate);
        });
    }
    setBusinessLogicErrors(errors) {
        throw new Error("Method not implemented.");
    }
    getIssuesForInput(valueHostId) {
        throw new Error("Method not implemented.");
    }
    getIssuesForSummary(group) {
        throw new Error("Method not implemented.");
    }
    get onStateChanged() {
        return this._onStateChanged;
    }
    set onStateChanged(fn) {
        this._onStateChanged = fn;
    }
    get onValidated() {
        return this._onValidated;
    }
    set onValidated(fn) {
        this._onValidated = fn;
    }
    get onValueHostStateChanged() {
        return this._onValueHostStateChanged;
    }
    set onValueHostStateChanged(fn) {
        this._onValueHostStateChanged = fn;
    }
    get onValueHostValidated() {
        return this._onValueHostValidated;
    }
    set onValueHostValidated(fn) {
        this._onValueHostValidated = fn;
    }
    get onValueChanged() {
        return this._onValueChanged;
    }
    set onValueChanged(fn) {
        this._onValueChanged = fn;
    }
    get onInputValueChanged() {
        return this._onInputValueChanged;
    }
    set onInputValueChanged(fn) {
        this._onInputValueChanged = fn;
    }
}
export class MockCapturingLogger {
    constructor() {
        this.minLevel = LoggingLevel.Warn;
        this.captured = [];
    }
    log(message, level, category, source) {
        if (level >= this.minLevel)
            this.captured.push({
                message: message,
                level: level,
                category: category,
                source: source
            });
    }
    entryCount() {
        return this.captured.length;
    }
    getLatest() {
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
    findMessage(messageSegment, logLevel, category, sourceSegment) {
        let messageRE = messageSegment ? new RegExp(messageSegment, 'i') : null;
        let sourceRE = sourceSegment ? new RegExp(sourceSegment, 'i') : null;
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
// Custom Conditions designed for testing validation where the Condition has a predictable behavior
export const AlwaysMatchesConditionType = "AlwaysMatches";
export class AlwaysMatchesCondition extends ConditionBase {
    get DefaultConditionType() { return this.descriptor.type; }
    evaluate(valueHost, valueHostsResolver) {
        return ConditionEvaluateResult.Match;
    }
    get defaultCategory() {
        return ConditionCategory.Undetermined;
    }
    gatherValueHostIds(collection, valueHostsResolver) {
        // does nothing
    }
}
export const NeverMatchesConditionType = "NeverMatches";
export const NeverMatchesConditionType2 = "NeverMatches2"; // two type names for the same condition so we can test with 2 conditions without type naming conflicts
export class NeverMatchesCondition extends ConditionBase {
    get DefaultConditionType() { return this.descriptor.type; }
    evaluate(valueHost, valueHostsResolver) {
        return ConditionEvaluateResult.NoMatch;
    }
    get defaultCategory() {
        return ConditionCategory.Undetermined;
    }
    gatherValueHostIds(collection, valueHostsResolver) {
        // does nothing
    }
}
export const IsUndeterminedConditionType = "AlwaysUndetermined";
export class IsUndeterminedCondition extends ConditionBase {
    get DefaultConditionType() { return this.descriptor.type; }
    evaluate(valueHost, valueHostsResolver) {
        return ConditionEvaluateResult.Undetermined;
    }
    get defaultCategory() {
        return ConditionCategory.Undetermined;
    }
    gatherValueHostIds(collection, valueHostsResolver) {
        // does nothing
    }
}
export const ThrowsExceptionConditionType = "AlwaysThrows";
export class ThrowsExceptionCondition extends ConditionBase {
    get DefaultConditionType() { return this.descriptor.type; }
    evaluate(valueHost, valueHostsResolver) {
        throw new Error("Always Throws");
    }
    get defaultCategory() {
        return ConditionCategory.Undetermined;
    }
    gatherValueHostIds(collection, valueHostsResolver) {
        // does nothing
    }
}
export function registerTestingOnlyConditions(factory) {
    factory.register(AlwaysMatchesConditionType, (descriptor) => new AlwaysMatchesCondition(descriptor));
    factory.register(NeverMatchesConditionType, (descriptor) => new NeverMatchesCondition(descriptor));
    factory.register(IsUndeterminedConditionType, (descriptor) => new IsUndeterminedCondition(descriptor));
    factory.register(ThrowsExceptionConditionType, (descriptor) => new ThrowsExceptionCondition(descriptor));
    // yes, two conditions of the same class can be registered with different Type names.
    factory.register(NeverMatchesConditionType2, (descriptor) => new NeverMatchesCondition(descriptor));
}
//# sourceMappingURL=Mocks.js.map