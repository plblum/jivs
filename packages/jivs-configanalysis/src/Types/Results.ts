/**
 * Interfaces and types used by Analyzers to represent the results.
 * @module Results/Types
 */

import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { ConditionConfig } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { ServiceName } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { ValidatorConfig } from "@plblum/jivs-engine/build/Interfaces/Validator";

/**
 * Represents the analysis results of a configuration.
 */
export interface IConfigAnalysisResults {

    /**
     * The list of all cultureIds found in the configuration.
     * All of these will be used in tests to ensure the services are installed.
     */
    cultureIds: Array<string>;

    /**
     * A list of all valid ValueHostNames found.
     */
    valueHostNames: Array<string>; 

    /**
     * A list of all lookup keys used, including how they are used,
     * such as as a DataType, for a parser, for a converter, etc.
     * Identifies the Class that was successfully identified in a service's registry
     * or reports an error if not found.
     */
    lookupKeyResults: Array<LookupKeyCAResult>;

    /**
     * A list of all issues found in the ValueHostConfig objects, such as missing properties,
     * and their ValidatorConfigs and ConditionConfigs.
     */
    valueHostResults: Array<ValueHostConfigCAResult>;
}


/**
 * Represents a result of evaluating a single ConfigAnalysisResult object.
 * It basically holds the ConfigAnalysisResult and the path to it.
 * The idea is to flatten the results which are a tree into a single array.
 */
export interface CAPathedResult<T extends CAResultBase> {
    /**
     * Each CAResultExplorer supplies its feature() and identifer() values
     * to create one entry here. The object key is the feature and the value is the identifier.
     * However, it is possible to have duplicate feature entries, especially
     * when conditions have their own child conditions. In that case, the feature
     * is repeated with a number appended to it after the first. For example, "Condition2", "Condition3".
     */
    path: CAResultPath;
    result: T;
}

export type CAResultPath = {[feature: string]: string | null};

/**
 * Values supported by CAResultBase.feature and 
 */
export enum CAFeature{
    valueHost = 'ValueHost',
    validator = 'Validator',
    condition = 'Condition',
    lookupKey = 'LookupKey',
    identifier = ServiceName.identifier,
    converter = ServiceName.converter,
    comparer = ServiceName.comparer,
    parser = ServiceName.parser,
    parsersByCulture = 'ParsersByCulture',
    parserFound = 'ParserFound',
    formatter = ServiceName.formatter,
    formattersByCulture = 'FormattersByCulture',
    property = 'Property',
    l10nProperty = 'l10nProperty',
    error = 'Error',
}

/**
 * Represents the base structure for a configuration analysis result.
 */
export interface CAResultBase {
    /**
     * Identifies the feature of the configuration analysis result.
     */
    feature: CAFeature | string;
}



/**
 * To extend CAResultBase to support an issue.
 * Issues include a message and severity (CAIssueSeverity).
 * Its severity determines how to handle the message.
 * Intended to be added to other interfaces, not used on its own.
 */
export interface IssueForCAResultBase {
    severity?: CAIssueSeverity;
    message?: string;    
}

/**
 * Represents the severity level of a configuration issue that implements IssueForCAResultBase.
 */
export enum CAIssueSeverity {
    info = 'info',
    warning = 'warning',
    error = 'error'
}
/**
 * For interfaces that are the top level of results for a single config object.
 * It includes the results of the analysis of the properties of the config object.
 * It also includes the config object itself.
 * If there are valiability errors, they are reported in its own message and severity properties.
 * @typedef TConfig - The type of the configuration object:
 */
export interface ConfigObjectCAResultsBase<TConfig> extends CAResultBase, IssueForCAResultBase
{
    /**
     * errors or warnings found amongst the properties of the TConfig object
     * expect properties that hold Config objects themselves.
     */    
    properties: Array<PropertyCAResult|ErrorCAResult>;
    /**
     * The configuration object analyzed.
     */
    config: TConfig;
}

/**
 * Represents the analysis results for a ValueHostConfig object.
 * If it has validators, their results are in the validatorResults array.
 * If it has an enablerCondition, its results are in the enablerConditionResult.
 */
export interface ValueHostConfigCAResult extends ConfigObjectCAResultsBase<ValueHostConfig> { 
    feature: CAFeature.valueHost;
    /**
     * From valueHostConfig.name.
     * If config.name is unassigned, empty string or whitespace, expect a string like "[Missing]"
     */
    valueHostName: string;
    /**
     * If the valueHostType supports validatorConfigs, any 
     * ValidatorsValueHostConfig has will generate its own results
     * using the ValidatorConfigAnalyzer for each.
     */
    validatorResults?: Array<ValidatorConfigCAResult>;
    /**
     * If the condition.enablerConfig is setup, this is its analysis.
     */
    enablerConditionResult?: ConditionConfigCAResult;
}

/**
 * Issues found around the validatorConfig, such as invalid error messages and problem
 * with the condition.
 */
export interface ValidatorConfigCAResult extends ConfigObjectCAResultsBase<ValidatorConfig> {
    feature: CAFeature.validator;
    /**
     * The errorCode of the validator, which is from either ValidatorConfig.errorCode
     * or ValidatorConfig.conditionConfig.conditionType.
     * If the errorCode could not be resolved, expect a string like "[Missing]".
     */
    errorCode: string;

    /**
     * If the conditionConfig property is specified, it will be analyzed
     * and its results are here.
     */
    conditionResult?: ConditionConfigCAResult;
}

/**
 * Issues found with the condition itself.
 */
export interface ConditionConfigCAResult extends ConfigObjectCAResultsBase<ConditionConfig>, ClassRetrieval {
    feature: CAFeature.condition;
    /**
     * From conditionConfig.conditionType. If unassigned, empty string or whitespace, expect a string like "[Missing]".
     */
    conditionType: string;

    /**
     * For ConditionWithChildrenBase and ConditionWithOneChildBase
     * to gather their child ConditionConfig results.
     */
    childrenResults?: Array<ConditionConfigCAResult>;
}

/**
 * Each Lookup Key found gets one of these objects in the results.
 * It encapsulates all the services that use the lookup key.
 * Invalid lookup keys are reported here with severity of 'error' and 
 * an appropriate message.
 */
export interface LookupKeyCAResult extends CAResultBase, IssueForCAResultBase {
    feature: CAFeature.lookupKey
    lookupKey: string;
    /**
     * When true, the lookup key is used as a DataType.
     */
    usedAsDataType: boolean;
    /**
     * Services in use associated with the lookup key like parser, formatter, etc.
     */
    serviceResults: Array<ServiceWithLookupKeyCAResultBase>;
}

/**
 * For all services that use a lookup key, this is the base class for the LookupKeyCAResult.services array.
 * Features are 'DataType' or any ServiceName that supports a lookup key.
 * 'DataType' is used when the lookup key is just a data type (ValueHostConfig.dataType property).
 */
export interface ServiceWithLookupKeyCAResultBase extends CAResultBase
{
    /**
     * Tell caller to use the LookupKeyFallbackService to find a fallback lookup key.
     * This is true when there is no match for the lookup key.
     */
    tryFallback?: boolean;
}

/**
 * For services that retrieve a class, so they can report that class and any issues.
 */
export interface ClassRetrieval // extends IssueForCAResultBase
{ 
    /**
     * The class Type found to handle the request, such as "BooleanParser", 
     * "IntegerFormatter", etc.
     */
    classFound?: string;
    /**
     * A live instance of the class found. Not sure if we want to use this
     * as the class may need to be setup with a specific configuration each time.
     */
    instance?: any;    

    /**
     * Examples of the data associated with the class, such as the formatter's
     * string output or the parser's string input.
     */
    dataExamples?: Array<string>;
}

/**
 * For CAResultBase objects where the class may not be found.
 * Use this to extend CAResult interfaces that may fail to find a class.
 */
export interface ClassNotFound extends IssueForCAResultBase { 
    /**
     * When true, the class was not found.
     */
    notFound?: boolean;
}
/**
 * For services that return a single class to handle the request.
 * It describes the class found or the error when not found.
 */
export interface OneClassRetrieval extends
    ServiceWithLookupKeyCAResultBase,
    ClassRetrieval,
    ClassNotFound { 
} 

/**
 * For services that have child result classes, this is a base class
 * that offers ClassRetrieval and IssueForCAResultBase for building those child result classes.
 */
export interface ServiceChildResultBase extends
    ClassRetrieval,
    CAResultBase,
    IssueForCAResultBase {
}

/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeIdenfierService.
 */
export interface IdentifierServiceCAResult extends OneClassRetrieval {
    feature: CAFeature.identifier;
}


/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeConverterService.
 */
export interface ConverterServiceCAResult extends OneClassRetrieval {
    feature: CAFeature.converter;
}


/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeComparerService.
 */
export interface ComparerServiceCAResult extends OneClassRetrieval {
    feature: CAFeature.comparer; 
}


/**
 * For services that may return multiple classes to handle the request.
 * Parser and Formatter both do, where each culture may have its own Parser or Formatter class.
 * This class does not implement ClassRetrieval. A deeper class does that.
 * This class can handle issues and the "not found" state.
 */
export interface MultiClassRetrieval extends ServiceWithLookupKeyCAResultBase, ClassNotFound {
    results: Array<CAResultBase>;
}
/**
 * For services that return a class to handle the request, but have to support cultures.
 * Allows for each culture to identify its own class, albeit the same class may be 
 * used by multiple cultures.
 */
export interface CultureSpecificClassRetrieval extends ServiceChildResultBase   {

    /**
     * When cultureId is used to find the service, this is the requested cultureId.
     * This is assigned even when there is an error.
     */
    requestedCultureId: string;
    /**
     * When cultureId is used to find the service, this is the actual cultureId found.
     * Unassigned when there was an error.
     */
    actualCultureId?: string;

}

/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeParserService.
 * It's results array holds the results of the analysis for each cultureId,
 * using the ParsersByCultureCAResult object. Deeper down in 
 * ParsersByCultureCAResult.parserResults is the actual class retrieval.
 */
export interface ParserServiceCAResult extends MultiClassRetrieval {
    feature: CAFeature.parser;

    results: Array<ParsersByCultureCAResult>;
}

/**
 * Parsers may have multiple DataTypeParser objects for a single lookup key and cultureId.
 * This reflects the list for a single lookup key and cultureId.
 * It is retained by ParserServiceCAResult.results.
 * It holds a list of found parsers in its parserResults array.
 */
export interface ParsersByCultureCAResult extends
    CAResultBase,
    IssueForCAResultBase,
    ClassNotFound {
    feature: CAFeature.parsersByCulture;
    cultureId: string;
    parserResults: Array<ParserFoundCAResult>;
}

/**
 * For the individual parser classes found for a single lookup key.
 * These are retained by ParsersByCultureCAResult.parsers.
 * Therefore they are not descendants of ServiceWithLookupKeyCAResultBase.
 * They are not used to report an error or "not found".
 * That's reserved for the ParsersByCultureCAResult object.
 */
export interface ParserFoundCAResult
    extends ServiceChildResultBase {
    feature: CAFeature.parserFound;
}


/**
 * The ServiceWithLookupKeyCAResultBase object for the DataTypeFormatterService.
 * Its requestResults array holds the results of the analysis for each cultureId,
 * using the FormattersByCultureCAResult object.
 */
export interface FormatterServiceCAResult extends MultiClassRetrieval {
    feature: CAFeature.formatter;
    results: Array<FormattersByCultureCAResult>;
}

/**
 * Formatters may have multiple DataTypeFormatter objects for a single lookup key and cultureID.
 * These are retained by FormatterServiceCAResult.requestResults.
 * They can hold a class retrieval, message/severity, or not found.
 */
export interface FormattersByCultureCAResult
    extends CultureSpecificClassRetrieval, ClassNotFound {
    feature: CAFeature.formattersByCulture;
}


/**
 * Documents the results of the analysis of a specific property of
 * a Config object.
 * Most properties only report warnings and errors. Some, like 
 * localization, may report info messages describing the results of the analysis.
 */
export interface PropertyCAResult extends CAResultBase, IssueForCAResultBase {
    feature: CAFeature.property | CAFeature.l10nProperty; 
    /**
     * May be more than one property as several may be analyzed together.
     */
    propertyName: string; 
}
/**
 * For a pair of properties related to localization, such as "label" and "labell10n".
 */
export interface LocalizedPropertyCAResult extends PropertyCAResult {
    feature: CAFeature.l10nProperty;
    /**
     * The localization key passed to TextLocalizerService.
     */
    l10nKey: string;
    /**
     * The localization property name, such as "labell10n".
     */
    l10nPropertyName: string;
    /**
     * The results of localization for each culture including
     * the actual text found or an error message.
     */
    cultureText: { [cultureId: string]: LocalizedTextResult };
}
export interface LocalizedTextResult extends IssueForCAResultBase
{
    /**
     * The result of the localization when successful.
     * If omitted, expect an error message.
     */
    text?: string;
}

/**
 * Use when an error is throw. It can identify its source and message.
 */
export interface ErrorCAResult extends CAResultBase, IssueForCAResultBase {
    feature: CAFeature.error;
    severity: CAIssueSeverity.error;
    analyzerClassName: string;
}

