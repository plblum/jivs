/**
 * Interfaces and types for Analyzers.
 * @module Analyzers/Types
 */

import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostsServices } from "@plblum/jivs-engine/build/Interfaces/ValueHostsServices";
import { ConditionConfig } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { ServiceName } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { IValidator, ValidatorConfig } from "@plblum/jivs-engine/build/Interfaces/Validator";
import { IValidationServices } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { AnalysisArgs } from "./ConfigAnalysis";
import {
    ServiceWithLookupKeyCAResultBase, OneClassRetrieval, IConfigAnalysisResults,
    LookupKeyCAResult, PropertyCAResult, ErrorCAResult, CAIssueSeverity, ConfigObjectCAResultsBase,
    ValueHostConfigCAResult, ValidatorConfigCAResult, ConditionConfigCAResult
} from "./Results";

/**
 * Each service that has registered data associated with a key --- lookup key, condition type, etc ---
 * has a child of this class registered with the CodeAnalysisService.
 * Each provides a way to take that key and retrieve the matching object, or report an error when not found.
 */
export interface ILookupKeyAnalyzer {
    /**
     * Analyzes the key, creating an entry in the results describing it and reports any issues found.
     * If the object depends on cultures too, internally should use results.cultureIds.
     * Implementation should expect to catch errors and write them to the appropriate
     * result object's severity and message properties.
     * @param key 
     * @param valueHostConfig
     * @returns A new LookupKeyServiceInfo object with the results of the analysis.
     * Add it to the LookupKeyCAResult.services array.
     */
    analyze(key: string, valueHostConfig: ValueHostConfig | null): ServiceWithLookupKeyCAResultBase;
}

/**
 * Represents an interface for a data type comparer analyzer.
 * This interface provides methods to check condition configurations for the need of a comparer
 * and to register additional condition types that require a comparer.
 * 
 * @typeparam TServices - The type of value host services.
 */
export interface IDataTypeComparerAnalyzer {
     /**
     * All ConditionConfigs are passed to this method. They will be evaluated
     * for the need of a comparer. If so, try to determine the data type lookup key 
     * from ValueHostConfig.dataType and ConditionConfig.conversionLookupKey/secondConversionLookupKey.
     * We'll work with those that have such a lookup key. Using the SampleValue class, we'll get
     * sample values to try to find a comparer. Whatever teh results, they'll be added to the lookupKeyResults.services
     * as a ServiceName.comparer. Future calls with the same lookup key will not need to re-analyze.
     * 
     * When there is an issue, its typically a warning or info, not an error. 'error' is reserved for 
     * telling the user that something must be fixed. With comparers, that's rare.
     * 
     * @param conditionConfig 
     * @returns When null, no reason to evaluate for the comparer. Otherwise, the same
     * OneClassRetrieval object that was added to the lookupKeyResults.services array.
     */
    checkConditionConfig(conditionConfig: ConditionConfig, valueHostConfig: ValueHostConfig): OneClassRetrieval | null;
}


/**
 * Provides helper methods that collect the results data.
 * It has specialized functions to handle lookup keys and localization.
 * The implementation is supplied to the IConfigAnalyzer and IConfigPropertyAnalyzer
 * instances, as they will utilitize its methods.
 */
export interface IAnalysisResultsHelper<TServices extends IValueHostsServices> {

    analysisArgs: AnalysisArgs<TServices>;

    services: TServices;

    results: IConfigAnalysisResults; 

    // addlookupKeysIssue(feature: string, lookupKey: string, severity: CAIssueSeverity, message: string): void;

    /**
     * Add support for a specific service to analyze lookup keys.
     * @param serviceName 
     * @param analyzer 
     */
    registerLookupKeyAnalyzer(serviceName: ServiceName, analyzer: ILookupKeyAnalyzer): void;

    hasLookupKeyAnalyzer(serviceName: ServiceName): boolean;

    /**
     * Tries to get a sample value for the lookup key or valueHost.
     * If it is not found, returns undefined.
     * ValueHost data is supplied by the user through options.valueHostsSampleValues.
     * LookupKey data can be supplied by the user through options.lookupKeysSampleValues.
     * If not found, it will try to identify the lookup key through DataTypeIdentifiers.
     * @param lookupKey 
     * @param valueHostConfig
     * @returns if undefined, there was no sample value found.
     * Otherwise the value (including null) is a sample value.
     */
    getSampleValue(lookupKey: string | null, valueHostConfig: ValueHostConfig | null): any;

    /**
     * Tries to add a lookup key and adds the associated service as a LookupKeyCAResult object
     * into results.lookupKeyResults.
     * Validates the lookup key string.
     * Uses LookupKeyAnalyzers to analyze service specific lookup keys against
     * their factories, services, and business rules.
     * 
     * @param lookupKey - The lookup key to add.
     * @param serviceName - The name of the service associated with the lookup key.
     * @param valueHostConfig - The configuration for the value host.
     * @returns The lookup key added to the LookupKeyCAResult object.
     * This value may have been updated from the original lookupKey, if the original
     * needed trimming or a case sensitive match.
     * If there was no lookup key, returns null.
     */
    registerServiceLookupKey(lookupKey: string | null | undefined, serviceName: ServiceName | null, valueHostConfig: ValueHostConfig | null): {
        lookupKeyResult: LookupKeyCAResult,
        serviceResult: ServiceWithLookupKeyCAResultBase | null
    } | null;

/**
 * For any property that can hold a lookup key, check if the lookup key is valid.
 * It also uses registerServiceLookupKey to add the lookup key to the LookupKeyCAResult object if needed.
 * Cases:
 * - LookupKey is untrimmed empty string, null or undefined. Ignore. No results.
 * - LookupKey syntax is problematic like whitespace. Report an error and continue checking
 *   using the result from checkForRealLookupKeyName. Report the correct lookup key name
 *   if it was fixed.
 * - LookupKey is found in LookupKeyCAResult. Continue checking.
 * - LookupKey is not found in LookupKeyCAResult. Error. "Not found. Please add to [servicename]."
 * - With a service name, Error. "Not found. Please add to [servicename]."
 * 
 * All errors are added into the PropertyCAResult object that is added to the properties parameter.
 * 
 * @param propertyName - The name of the property being checked.
 * @param lookupKey - The lookup key to be checked.
 * @param serviceName - The service name to be checked. Use nullfor a dataType LookupKey.
 * @param properties - Add the PropertyCAResult object to this array.
 * @param containingValueHostConfig - The ValueHostConfig that contains the property being checked.
 * The property may be found on a child config object like ValidatorConfig or ConditionConfig.
 * @param className - The name of the class that is registered with the service to handle the lookup key,
 * such as "DataTypeFormatter" or "DataTypeConverter".
 * @param servicePropertyName - The name of the property in the service that the class is registered with.
 */
    checkLookupKeyProperty(propertyName: string, lookupKey: string | null | undefined,
        serviceName: ServiceName | null, containingValueHostConfig: ValueHostConfig,
        properties: Array<PropertyCAResult | ErrorCAResult>,
        className?: string, servicePropertyName?: string): void;
    
    
    /**
     * We want to discover the actual lookup key name, even if it is a case insensitive match.
     * There are several places to look for a case insensitive match:
     * - LookupKey enum itself
     * - LookupKeyFallbackService
     * - IdentifierService
     * @param lookupKey - whitespace will be trimmed before testing
     * @returns The correct lookup key name, if found. Otherwise, the original lookup key.
     * It can report an error for the caller to assign to its Result.severity and Result.message properties.
     */
    checkForRealLookupKeyName(lookupKey: string): {
        resolvedLookupKey: string,
        severity?: CAIssueSeverity,
        errorMessage?: string
    };
    /**
     * Using the two properties for localization, check if the localization property (l10n) 
     * is declared in the TextLocalizerService for all cultures. 
     * If so, show the localized text specific to each culture. 
     * If not, show a warning when the fallback text is used and an error when there is nothing to use.
     * @param propertyNamePrefix - The prefix of the property name. This is the property
     * that does not end in "l10n".
     * @param l10nKey - The value from the l10n property used in the TextLocalizerService to lookup the localized text.
     * @param fallbackText - The value from the property that does not end in "l10n".
     * @param properties - Adds a LocalizedPropertyIssue to this array so long as 
     * l10nKey is supplied.
     */
    checkLocalization(propertyNamePrefix: string, l10nKey: string | null | undefined,
        fallbackText: string | null | undefined,
        properties: Array<PropertyCAResult | ErrorCAResult>): void;
    
    /**
     * Uses similar parser to MessageTokenResolverService to find tokens in the message.
     * However, it cannot use MessageTokenResolverService because it only works
     * with live instances of ValidatorValueHostBase and Validator.
     * Here we only look for syntax errors and validate the formatterKeys
     * in tokens like "text {token:formatterKey} more text".
     * 
     * @param properties if there are errors, they are added to this array.
     */
    checkMessageTokens(message: string | null | undefined | ((validator: IValidator) => string),
        vc: ValidatorConfig, vhc: ValueHostConfig,
        propertyName: string,
        properties: Array<PropertyCAResult | ErrorCAResult>): void;

    /**
     * Check that the value in valueHostName is an exact match to one
     * in the results.valueHostNames array, or its an error.
     * No error if null, empty string, or undefined.
     * Report issues with not a string, case insensitive match and whitespace.
     * @param valueHostName 
     * @param propertyName 
     * @param properties 
     * @returns 
     */
    checkValueHostNameExists(valueHostName: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>): void;
    
    /**
     * Evaluates the value and adds any issues to the properties array
     * as a PropertyCAResult object.
     * Takes no action when undefined, null, or a trimmed empty string.
     * Call other helper functions to check for these conditions.
     * 
     * Otherwise, the value should be validated. It should either be
     * compatible with valueLookupKey or convertable using conversionLookupKey.
     * This is similar to ConditionBase.tryConversion.
     * 1. If valueLookupKey is null/undefined, try DataTypeIdentifiers 
     * against the value to get a valueLookupKey. If that does not work,
     * no further validation is possible and an info message is added.
     * If there is an identifier match, use its dataTypeLookupKey
     * for valueLookupKey.
     * 2. If conversionLookupKey is assigned, use it to find a DataTypeConverter
     * and try to convert the value. If it fails, add an error message.

     * @param value 
     * @param propertyName 
     * @param valueLookupKey - Provide ValueHostConfig.dataType
     * @param conversionLookupKey - provide conversionLookupKey, secondConversionLookupKey
     * @param properties 
     */
    checkValuePropertyContents(value: any, propertyName: string,
        valueLookupKey: string | null | undefined,
        conversionLookupKey: string | null | undefined,
        properties: Array<PropertyCAResult | ErrorCAResult>): void;
    
    /**
     * Creates a prepared PropertyCAResult object with the given parameters.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     */
    createPropertyCAResult(propertyName: string, severity: CAIssueSeverity,
        errorMessage: string): PropertyCAResult;
    
    /**
     * Creates a prepared ErrorCAResult object with the given parameters
     * and adds it to properties.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     * @param properties 
     */
    addPropertyCAResult(propertyName: string, severity: CAIssueSeverity,
        errorMessage: string, properties: Array<PropertyCAResult | ErrorCAResult>): void;

    /**
     * Reports an error when the value is undefined.
     * Helper to use within PropertyAnalyzers. Call before using the value 
     * in a function that fails if value is undefined.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was undefined.
     */
    checkIsNotUndefined(value: any, propertyName: string,
        properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;

    /**
     * Reports an error when the value is null.
     * Helper to use within PropertyAnalyzers. Call before using the value 
     * in a function that fails if value is null.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was null.
     */
    checkIsNotNull(value: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
    
    /**
     * Reports an error when the value is not a string.
     * Helper to use within PropertyAnalyzers. Call before using the value
     * in a function that fails if value is not a string.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value
     * @param propertyName
     * @param properties
     * @param severity
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was not a string.
     */
    checkIsString(value: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
    
    /**
    * Reports an error when the value is an empty string, after trimming.
    * Helper to use within PropertyAnalyzers. Call before using the value
    * in a function that fails if value is an empty string.
    * Will add a PropertyCAResult object to the properties array
    * if an issue is found.
    * @param value
    * @param propertyName
    * @param properties
    * @param severity
    * @returns when true, continue execution. The value can be further analyzed.
    * When false, stop execution. The value was an empty string.
    */
    checkIsNotEmptyString(value: string, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
    
    /**
     * Reports an error when the value is a string that has enclosing whitespace.
     * Helper to use within PropertyAnalyzers. Call before using the value
     * in a function that fails if value has enclosing whitespace.
     * Will add a PropertyCAResult object to the properties array
     * if an issue is found.
     * @param value 
     * @param propertyName 
     * @param properties 
     * @param severity 
     * @returns when true, continue execution. The value can be further analyzed.
     * When false, stop execution. The value was a string with enclosing whitespace.
     */
    checkNeedsTrimming(value: string, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity): boolean;
}


/**
 * Represents the base interface for a configuration analyzer.
 *
 * @template TConfig - The type of the configuration object: 
 * ValueHostConfig, ValidatorConfig, ConditionConfig.
 * @template TResults - The type of the analysis results.
 */
export interface IConfigAnalyzer<TConfig, TResults extends ConfigObjectCAResultsBase<TConfig>,
    TServices extends IValueHostsServices> {
    /**
     * Analyzes the given configuration object and returns the analysis results.
     *
     * @param config - The configuration object to analyze.
     * @param valueHostConfig - The value host configuration.
     * @param existingResults The existing results to check for duplicates if needed.
     * @returns The analysis results. The caller should add this object 
     * into its own results array.
     */
    analyze(config: TConfig, valueHostConfig: ValueHostConfig | null, existingResults: Array<TResults>): TResults;
}

/**
 * Represents an interface for analyzing ValueHostConfig objects,
 * creating a ValueHostConfigCAResult object for each VHC.
 */
export interface IValueHostConfigAnalyzer<TServices extends IValueHostsServices>
    extends IConfigAnalyzer<ValueHostConfig, ValueHostConfigCAResult, TServices> {
}

/**
 * Represents an interface for analyzing ValidatorConfig objects,
 * creating a ValidatorConfigCAResult object for each VC.
 */
export interface IValidatorConfigAnalyzer
    extends IConfigAnalyzer<ValidatorConfig, ValidatorConfigCAResult, IValidationServices> {
}


/**
 * Analyzes a ConditionConfig object, creating a ConditionResults object.
 */
export interface IConditionConfigAnalyzer<TServices extends IValueHostsServices> extends
    IConfigAnalyzer<ConditionConfig, ConditionConfigCAResult, TServices> {
}

/**
 * Create instances for each property or group of properties in a TConfig object.
 * Register those instances when setting up the ConfigAnalysis.
 * 
 * The task is to update TResults.properties array with the results of the analysis if needed.
 * Create a ConditionPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 */
export interface IConfigPropertyAnalyzer<TConfig, TResults extends ConfigObjectCAResultsBase<TConfig>> {
    /**
     * Analyzes the properties of the given configuration object and returns the analysis results.
     * If there are any issues, add them to results.properties.
     * Optionally if you have an info level message. But don't add if the data is in good shape
     * and the user doesn't need additional instructions.
     * @param config - The configuration object where to find the properties to analyze.
     * @param results - Add the results of the analysis to results.properties.
     * @param valueHostConfig - The value host configuration.
     */
    analyze(config: TConfig, results: TResults, valueHostConfig: ValueHostConfig | null,
        helper: IAnalysisResultsHelper<any>): void;

}

/**
 * Instances created for each property or group of properties in a ValueHostConfig object
 * or subclass. They are registered with ConfigAnalysis.registerValueHostConfigPropertyAnalyzer()
 * from where you create the service itself.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ValueHostPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 * 
 * Expected Result class to add to results.properties: ValueHostPropertyResult
 * or LocalizedPropertyCAResult.
 */
export interface IValueHostConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ValueHostConfig, ValueHostConfigCAResult> {

}

/**
 * Instances created for each property or group of properties in a ValidatorConfig object
 * or subclass. They are registered with ConfigAnalysis.registerValidatorConfigPropertyAnalyzer()
 * from where you create the service itself.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ValidatorPropertyResults object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 * 
 * Expected Result class to add to results.properties: ValidatorPropertyResults
 * or LocalizedPropertyCAResult.
 */
export interface IValidatorConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ValidatorConfig, ValidatorConfigCAResult> {

}

/**
 * Instances created for each property or group of properties in a ConditionConfig object
 * or subclass. They are registered with ConfigAnalysis.registerConditionConfigPropertyAnalyzer()
 * from where you create the service itself.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ConditionPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 * 
 * Expected Result class to add to results.properties: ConditionPropertyResult
 * or LocalizedPropertyCAResult.
 */
export interface IConditionConfigPropertyAnalyzer
    extends IConfigPropertyAnalyzer<ConditionConfig, ConditionConfigCAResult> {

}