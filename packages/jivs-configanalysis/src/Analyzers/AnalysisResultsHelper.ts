/**
 * @module Analyzers/Classes
 */

import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ServiceName } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { ValidatorConfig, IValidator } from "@plblum/jivs-engine/build/Interfaces/Validator";
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostsServices } from "@plblum/jivs-engine/build/Interfaces/ValueHostsServices";
import { CodingError } from "@plblum/jivs-engine/build/Utilities/ErrorHandling";
import { findCaseInsensitiveValueInStringEnum } from "@plblum/jivs-engine/build/Utilities/Utilities";
import { IAnalysisResultsHelper, ILookupKeyAnalyzer } from "../Types/Analyzers";
import { AnalysisArgs } from "../Types/ConfigAnalysis";
import { IConfigAnalysisResults, LookupKeyCAResult, ServiceWithLookupKeyCAResultBase, CAFeature, CAIssueSeverity, PropertyCAResult, ErrorCAResult, ClassNotFound, LocalizedPropertyCAResult, LocalizedTextResult } from "../Types/Results";

/**
 * Provides helper methods that collect the results data.
 * It has specialized functions to handle lookup keys and localization.
 * The implementation is supplied to the IConfigAnalyzer and IConfigPropertyAnalyzer
 * instances, as they will utilitize its methods.
 */
export class AnalysisResultsHelper<TServices extends IValueHostsServices>
    implements IAnalysisResultsHelper<TServices> {
    constructor(args: AnalysisArgs<TServices>) {
        this._args = args;
    }
    public get analysisArgs(): AnalysisArgs<TServices> {
        return this._args;
    }
    private _args: AnalysisArgs<TServices>;

    public get services(): TServices {
        return this.analysisArgs.services;
    }
    public get results(): IConfigAnalysisResults {
        return this.analysisArgs.results;
    }
    
    /**
     * Add support for a specific service to analyze lookup keys.
     * @param serviceName 
     * @param analyzer 
     */
    public registerLookupKeyAnalyzer(serviceName: ServiceName, analyzer: ILookupKeyAnalyzer): void {
        this._lookupKeyAnalyzers.set(serviceName, analyzer);
    }
    protected get lookupKeyAnalyzers(): Map<string, ILookupKeyAnalyzer> {
        return this._lookupKeyAnalyzers;
    }
    private _lookupKeyAnalyzers: Map<string, ILookupKeyAnalyzer> = new Map();

    public hasLookupKeyAnalyzer(serviceName: ServiceName): boolean {
        return this.lookupKeyAnalyzers.has(serviceName);
    }

    //#region helper methods 
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
    public getSampleValue(lookupKey: string | null, valueHostConfig: ValueHostConfig | null): any
    {
        return this.analysisArgs.sampleValues.getSampleValue(lookupKey, valueHostConfig);
    }

    /**
     * Registers a lookup key as a LookupKeyCAResult object into results.lookupKeyResults.
     * If a service is supplied, it attempts to analyze it and attach it to the 
     * LookupKeyCAResult.serviceResults array.
     * Uses LookupKeyAnalyzers to analyze service specific lookup keys against
     * their factories, services, and business rules.
     * 
     * The Lookup Key is cleaned up using checkForRealLookupKeyName and that value
     * is used as the lookup key in the LookupKeyCAResult object.
     * Its the value the caller should also use for further analysis.
     * 
     * @param lookupKey - The lookup key to add.
     * @param serviceName - The name of the service associated with the lookup key.
     * If null, it means registering just the dataType, which uses ServiceName.identifier.
     * @param valueHostConfig - The configuration for the value host.
     * NOTE: Services often use its dataType property as the LookupKey fallback.
     * It is often undefined, where the DataTypeIdentifier service resolves it at runtime.
     * In this case, ConfigAnalysisService has emulated the DataTypeIdentifier service
     * using the SampleValues system together with the DataTypeIdentifier in hopes
     * that the dataType is now assigned. Yet, expect that the dataType is still undefined.
     * @returns The objects that were created or found. lookupKeyResult.lookupKey is 
     * the corrected lookup key name.
     */
    public registerServiceLookupKey(lookupKey: string | null | undefined,
        serviceName: ServiceName | null, valueHostConfig: ValueHostConfig | null): {
            lookupKeyResult: LookupKeyCAResult,
            serviceResult: ServiceWithLookupKeyCAResultBase | null
        } | null {

        let lk = this.registerLookupKey(lookupKey, !serviceName || serviceName === ServiceName.identifier);
        if (!lk)
            return null;

        let result: { lookupKeyResult: LookupKeyCAResult, serviceResult: ServiceWithLookupKeyCAResultBase | null } = {
            lookupKeyResult: lk,
            serviceResult: null
        };
        let resolvedLookupKey = lk.lookupKey;
        if (serviceName) {
            result.serviceResult = this.registerServiceWithLookupKey(serviceName, lk, resolvedLookupKey, valueHostConfig!);
        }
        return result;
    }

    /**
     * Validates a lookup key and registers it in the LookupKeyCAResult object.
     * If that object already exists, it will be retained.
     * 
     * The lookup key anticipates being a mismatched case or whitespace error.
     * It will try to find the correct lookup key name, and use it if found.
     * Always check result's lookupKey property for the correct lookup key name.
     * @param lookupKey - The lookup key to validate.
     * @param usedAsDataType - If true, the lookup key is used as a data type.
     * Generally this is set to true when registering the ValueHostConfig.dataType property.
     * @returns The LookupKeyCAResult object that contains the lookup key or null
     * if the lookup key is null or an empty string.
     */
    public registerLookupKey(lookupKey: string | null | undefined, usedAsDataType: boolean): LookupKeyCAResult | null {
        if (!lookupKey) return null;
        // we accept whitespace errors here and will report them at their source
        if (lookupKey.trim().length === 0) return null;  // ignore empty strings

        let realInfo = this.checkForRealLookupKeyName(lookupKey);  // lookupKey is not trimmed here as we want to capture mismatches
        lookupKey = realInfo.resolvedLookupKey;
        
        let lk = this.results.lookupKeyResults.find(lk => lk.lookupKey === lookupKey);
        if (!lk) {
            // try a case insensitive match, and use the first one found, even if its not the same case as the user intended
            lk = this.results.lookupKeyResults.find(lk => lk.lookupKey.toLowerCase() === lookupKey.toLowerCase());
            if (!lk) {
                lk = <LookupKeyCAResult>{
                    feature: CAFeature.lookupKey,
                    lookupKey: lookupKey,
                    usedAsDataType: usedAsDataType,
                    serviceResults: []
                };
                if (realInfo.severity !== undefined)
                    lk.severity = realInfo.severity;
                if (realInfo.message)
                    lk.message = realInfo.message;
                this.results.lookupKeyResults.push(lk);
            }
        };
        return lk;
    }

    /**
     * Attach a service to a lookup key. If the service is not found, it will be added.
     * 
     * The lookup key is analyzed by the service's LookupKeyAnalyzer, which takes
     * the value in analyzeThisLookupKey or the lookupKey from lookupKeyResult.
     * @param serviceName - The name of the service to add to the lookup key.
     * @param lookupKeyResult - The LookupKeyCAResult object to add the service to.
     * @param analyzeThisLookupKey
     * This is the lookup key to be analyzed by the service's LookupKeyAnalyzer.
     * Since the analyzer often is passed lookupKeyResult.lookupKey, this is a convenience parameter
     * and can be left null to use lookupKeyResult.lookupKey.
     * It is assumed that this value has already been cleaned up of whitespace and case errors
     * by calling checkForRealLookupKeyName or registerLookupKey.
     * @param valueHostConfig - The ValueHostConfig that contains the analyzeThisLookupKey
     * within itself or its children.
     * @returns The ServiceWithLookupKeyCAResultBase object specific to that service.
     */
    public registerServiceWithLookupKey(serviceName: ServiceName, lookupKeyResult: LookupKeyCAResult, 
        analyzeThisLookupKey: string | null, valueHostConfig: ValueHostConfig): ServiceWithLookupKeyCAResultBase {
        let lookupKey = analyzeThisLookupKey ?? lookupKeyResult.lookupKey;
        let si = lookupKeyResult.serviceResults.find(si => si.feature === serviceName);
        if (!si) {
            let analyzer = this.lookupKeyAnalyzers.get(serviceName);
            if (analyzer) {
                si = analyzer.analyze(lookupKey, valueHostConfig);
                lookupKeyResult.serviceResults.push(si);

                if (si.tryFallback) {
                    let fallbackLookupKey = this.services.lookupKeyFallbackService.find(lookupKey);
                    if (fallbackLookupKey) {
                        this.registerServiceLookupKey(fallbackLookupKey, serviceName, valueHostConfig); // RECURSION
                    }
                }
            }
            else
                throw new CodingError(`No analyzer found for service "${serviceName}"`);
        }
        if (serviceName === ServiceName.identifier) 
            lookupKeyResult.usedAsDataType = true;
        return si;
    }
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
    public checkForRealLookupKeyName(lookupKey: string): {
        resolvedLookupKey: string,
        severity?: CAIssueSeverity,
        message?: string
    } {
        let trimmedLK = lookupKey.trim(); // don't report trimming errors here. They are reported with the property that supplied them
        let temp = findCaseInsensitiveValueInStringEnum(trimmedLK, LookupKey) ?? null;  // case insensitive match finds the actual match
        if (temp) {
            return { resolvedLookupKey: temp }; // no error for trimming or case insensitive match. Leave that to caller
        }
        // prove that we at least know this lookup key
        temp = this.services.lookupKeyFallbackService.find(lookupKey);
        //!!! future support looking up case insensitive matches in LookupKeyFallbackService
        if (temp)
            return { resolvedLookupKey: trimmedLK };

        let identifier = this.services.dataTypeIdentifierService.findByLookupKey(trimmedLK, true);
        if (identifier) {
            return { resolvedLookupKey: identifier.dataTypeLookupKey };
        }
        return {
            resolvedLookupKey: trimmedLK,
            severity: CAIssueSeverity.warning,
            message: `Lookup key "${trimmedLK}" not already known. It may be fine, or may have typo. If valid, register it in LookupKeyFallbackService or IdentifierService`
         };

    }
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
 * - LookupKey is not found and not registered in DataTypeIdentifierService or even the LookupKey enum,
 *   reports an info message. "Lookup key "[lookupKey]" is unknown."
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
    public checkLookupKeyProperty(propertyName: string, lookupKey: string | null | undefined,
        serviceName: ServiceName | null, containingValueHostConfig: ValueHostConfig,
        properties: Array<PropertyCAResult | ErrorCAResult>,
        className?: string, servicePropertyName?: string): void {
        let originalLK = lookupKey;
        let slkResult = this.registerServiceLookupKey(lookupKey, serviceName, containingValueHostConfig);
        if (!slkResult) return;
        
        lookupKey = slkResult.lookupKeyResult?.lookupKey; // register has trimmed it and possibly changed the case

        let knownLK = false;
        let inLookupKeyEnum = findCaseInsensitiveValueInStringEnum(lookupKey, LookupKey) ?? null;  // case insensitive match finds the actual match
        if (inLookupKeyEnum) {
            lookupKey = inLookupKeyEnum;
            knownLK = true;
        }
        else {
            let dti = this.services.dataTypeIdentifierService.findByLookupKey(lookupKey, true);
            if (dti) {
                lookupKey = dti.dataTypeLookupKey;
                knownLK = true;
            }
        }
        if (lookupKey !== originalLK) {
            this.addPropertyCAResult(propertyName, CAIssueSeverity.error,
                `Value is not an exact match to the expected value of "${lookupKey}". Fix it.`, properties);

            return;
        }
        let notFound = false;

        if (slkResult.serviceResult) {
            if (slkResult.serviceResult.tryFallback) {
                let fallbackLookupKey = this.services.lookupKeyFallbackService.find(lookupKey);
                if (fallbackLookupKey)
                    this.addPropertyCAResult(propertyName, CAIssueSeverity.warning,
                        `Lookup key "${lookupKey}" does not have a ${className} registered but it will also try the Lookup Key "${fallbackLookupKey}".`, properties);
                else
                    notFound = true;
            }
            else if ((slkResult.serviceResult as ClassNotFound).notFound)
                notFound = true;
        }
        else {
            if (!knownLK)
                this.addPropertyCAResult(propertyName, CAIssueSeverity.info,
                    `Lookup key "${lookupKey}" is unknown. That may be OK, but consider whether it should be registered in the LookupKeyFallbackService or DataTypeIdentifierService.`, properties);
            return;            
        }
        if (notFound)
            this.addPropertyCAResult(propertyName, CAIssueSeverity.error,
                `Not found. Please register a ${className} to ${servicePropertyName}.`, properties);         
    }

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
    public checkLocalization(propertyNamePrefix: string, l10nKey: string | null | undefined,
        fallbackText: string | null | undefined,
        properties: Array<PropertyCAResult | ErrorCAResult>): void {
        if (l10nKey) {
            let info: LocalizedPropertyCAResult = {
                feature: CAFeature.l10nProperty,
                propertyName: propertyNamePrefix,
                l10nPropertyName: propertyNamePrefix + 'l10n',
                l10nKey: l10nKey,
                cultureText: {}
            };
            properties.push(info);            
            for (let cultureId of this.results.cultureIds) {
                let cultureResult: LocalizedTextResult = { };
                info.cultureText[cultureId] = cultureResult;

                let msg = `${propertyNamePrefix} localization not declared in TextLocalizerService for culture "${cultureId}".`;
             
                let details = this.services.textLocalizerService.localizeWithDetails(cultureId, l10nKey, fallbackText ?? null);
                switch (details.result) {
                    case 'localized':
                        cultureResult.text = details.text;
                        cultureResult.severity = CAIssueSeverity.info;
                        if (details.actualCultureId !== cultureId)
                            cultureResult.message = `Localized text was found using culture "${details.actualCultureId}".`;
                        break;
                    case 'fallback':
                        cultureResult.message = msg + ` It will use "${fallbackText}" found in the ${propertyNamePrefix} property.`;
                        cultureResult.severity = CAIssueSeverity.warning;
                        break;
                    case 'notFound':
                        cultureResult.message = msg + ` No text will be used because the ${propertyNamePrefix} property is unassigned.`;
                        cultureResult.severity = CAIssueSeverity.error;
                        break;
                }
            }
        }

    }    

    /**
     * Uses similar parser to MessageTokenResolverService to find tokens in the message.
     * However, it cannot use MessageTokenResolverService because it only works
     * with live instances of ValidatorValueHostBase and Validator.
     * Here we only look for syntax errors and validate the formatterKeys
     * in tokens like "text {token:formatterKey} more text".
     * @param properties if there are errors, they are added to this array.
     */
    public checkMessageTokens(message: string | null | undefined | ((validator: IValidator) => string),
        vc: ValidatorConfig, vhc: ValueHostConfig,
        propertyName: string,
        properties: Array<PropertyCAResult | ErrorCAResult>): void {
        if (message == null)
            return;
        if (typeof message === 'function')
            return;
        let matches = message.match(this._possibleTokensInMessageRegEx);
        if (!matches)
            return;
        for (let match of matches) {
            let validToken = this.validateToken(match);
            if (validToken) {
                let parts = match.split(':');
                if (parts.length > 1) {
                    let formatterKey = parts[1].substring(0, parts[1].length - 1);  // remove the closing }
                    this.registerServiceLookupKey(formatterKey, ServiceName.formatter, vhc);  // uses DataTypeFormatterLookupKeyAnalyzer
                }
            }
            else {
                this.addPropertyCAResult(propertyName, CAIssueSeverity.error,
                    `Syntax error in: ${message}. Token "${match}" is not valid.`, properties);
            }

        }
    }
    /**
     * Validates a token.
     * @param token - The token to validate.
     * @returns `true` if the token is valid, `false` otherwise.
     */
    protected validateToken(token: string): boolean {
        return this._validTokensInMessageRegEx.test(token);
    }

    /**
     * Regular expression used to validate tokens in a message.
     * Tokens are enclosed in curly braces and can have an optional type specifier.
     * 
     * Valid token examples:
     * - {token}
     * - {token:type}
     * - {token1}
     * - {token1:type1}
     * Invalid examples:
     * - {token:}
     * - {token:type:}
     * - {token: type1}
     * - {token :type1}
     * - {token!:type1}
     * - {token:type1!}
     * - {token:type1
     * - {token
     * 
     * @remarks
     * The regular expression pattern is: /\{[a-z]\w*(:[a-z]\w*)?\}/i
     */
    private readonly _validTokensInMessageRegEx = /\{[a-z]\w*(:[a-z]\w*)?\}/i;

    // look for the pattern { any text } in the message
    // We'll apply the result to _validTokensInMessageRegEx to see if is actually valid
    // it will also take a starting { without an ending one
    private readonly _possibleTokensInMessageRegEx = /\{([^\}]*)(\}|$)/ig;

    /**
     * Check that the value in valueHostName is an exact match to one
     * in the results.valueHostNames array, or its an error.
     * No error if null, empty string, or undefined.
     * Use other helper functions to check for these conditions.
     * 
     * Report issues with not a string, case insensitive match and whitespace.
     * @param valueHostName 
     * @param propertyName 
     * @param properties 
     * @returns 
     */
    public checkValueHostNameExists(valueHostName: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>): void {
        if (valueHostName == null)  // null or undefined. Use other helper functions prior to calling this one
            return;
        
        if (!this.checkIsString(valueHostName, propertyName, properties)) {
            return;
        }
        let trimmedVHN = valueHostName.trim();  // done before checkNeedsTrimming to escape if length=0
        if (trimmedVHN.length === 0)
            return;
        if (!this.checkNeedsTrimming(valueHostName, propertyName, properties))
            return;
        
        if (!this.analysisArgs.results.valueHostNames.includes(trimmedVHN)) {
            let msg = '';
            let found = this.analysisArgs.results.valueHostNames.find((vhn) => vhn.toLowerCase() === trimmedVHN.toLowerCase());

            if (found) { 
                msg = `Change to "${found}".`;
            }
            else
                msg = 'ValueHostName does not exist';
            this.addPropertyCAResult(propertyName, CAIssueSeverity.error, msg, properties);
        }
    }


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
    public checkValuePropertyContents(value: any, propertyName: string,
        valueLookupKey: string | null | undefined,
        conversionLookupKey: string | null | undefined, 
        properties: Array<PropertyCAResult | ErrorCAResult>): void {

        if (value == null)  // null or undefined - use other helper functions to report errors on these
            return;
        if (typeof value === 'string') {
            if (value.trim().length === 0)  // empty string does not report an issue
                return;
            this.checkNeedsTrimming(value, propertyName, properties, CAIssueSeverity.warning);
            // continues with warning established
        }

        if (!valueLookupKey) {
            let dtlk = this.services.dataTypeIdentifierService.identify(value);
            if (dtlk) {
                valueLookupKey = dtlk;
            }
        }

        if (conversionLookupKey && conversionLookupKey !== valueLookupKey) {
            let dtcResult = this.services.dataTypeConverterService.convertUntilResult(
                value, valueLookupKey ?? null, conversionLookupKey);
            if (!dtcResult.resolvedValue) {
                this.addPropertyCAResult(propertyName, CAIssueSeverity.error,
                    `Value cannot be converted to Lookup Key "${conversionLookupKey}"`, properties);
            }
        }
        else if (!valueLookupKey) {
            this.addPropertyCAResult(propertyName, CAIssueSeverity.info,
                'Value could not be validated', properties);
        }
    }

    /**
     * Creates a prepared PropertyCAResult object with the given parameters.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     */
    public createPropertyCAResult(propertyName: string, severity: CAIssueSeverity,
        errorMessage: string): PropertyCAResult {
        return {
            feature: CAFeature.property,
            propertyName: propertyName,
            severity: severity,
            message: errorMessage
        };
    }
    /**
     * Creates a prepared ErrorCAResult object with the given parameters
     * and adds it to properties.
     * @param propertyName 
     * @param severity 
     * @param errorMessage 
     * @param properties 
     */
    public addPropertyCAResult(propertyName: string, severity: CAIssueSeverity,
        errorMessage: string, properties: Array<PropertyCAResult | ErrorCAResult>): void {
        properties.push(this.createPropertyCAResult(propertyName, severity, errorMessage));
    }
    /**
     * Reports a 'Value must be defined.' error when the value is undefined.
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
    public checkIsNotUndefined(value: any, propertyName: string,
        properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity = CAIssueSeverity.error): boolean
    {
        if (value === undefined) {
            properties.push(this.createPropertyCAResult(propertyName, severity, 'Value must be defined.'));
            return false;
        }
        return true;
    }

    /**
     * Reports an error ("Value must not be null") or warning 
     * ("Value should not be null") when the value is null.
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
    public checkIsNotNull(value: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity = CAIssueSeverity.error): boolean
    {
        if (value === null) {
            let result = severity === CAIssueSeverity.error ?
                this.createPropertyCAResult(propertyName, severity, 'Value must not be null.') :
                this.createPropertyCAResult(propertyName, severity, 'Value should not be null.');
            properties.push(result);
            return false;
        }
        return true;
    }
    
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
    public checkIsString(value: any, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity = CAIssueSeverity.error): boolean
    {
        if (typeof value !== 'string') {
            properties.push(this.createPropertyCAResult(propertyName, severity, 'Must be a string.'));
            return false;
        }
        return true;
    }
    
    /**
    * Reports an error ("Value must not be empty string") or 
    * warning ("Value should not be an empty string") when the value is an empty string, after trimming.
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
    public checkIsNotEmptyString(value: string, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity = CAIssueSeverity.error): boolean
    {
        if (value.trim().length === 0) {
            let result = severity === CAIssueSeverity.error ?
                this.createPropertyCAResult(propertyName, severity, 'Value must not be empty string.') :
                this.createPropertyCAResult(propertyName, severity, 'Value should not be empty string.');
            properties.push(result);
            return false;
        }
        return true
    }
    
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
    public checkNeedsTrimming(value: string, propertyName: string, properties: Array<PropertyCAResult | ErrorCAResult>,
        severity: CAIssueSeverity = CAIssueSeverity.error): boolean
    {
        if (value.trim() !== value) {
            properties.push(this.createPropertyCAResult(propertyName, severity, 'Remove whitespace.'));
            return false;
        }
        return true;
    }

    //#endregion helper methods
    
}


