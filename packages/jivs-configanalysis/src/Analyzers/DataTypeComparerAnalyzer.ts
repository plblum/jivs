/**
 * 
 * @module Analyzers/Classes/LookupKeys
 */

import { defaultComparer } from "@plblum/jivs-engine/build/DataTypes/DataTypeComparers";
import { ConditionCategory, ConditionConfig } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { ComparersResult } from "@plblum/jivs-engine/build/Interfaces/DataTypeComparerService";
import { ServiceName } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostsServices } from "@plblum/jivs-engine/build/Interfaces/ValueHostsServices";
import { InvalidTypeError } from "@plblum/jivs-engine/build/Utilities/ErrorHandling";
import { cleanString } from "@plblum/jivs-engine/build/Utilities/Utilities";
import { AnalysisResultsHelper } from "./AnalysisResultsHelper";
import { IDataTypeComparerAnalyzer } from "../Types/Analyzers";
import { ComparerServiceCAResult, CAFeature, CAIssueSeverity } from "../Types/Results";

/**
 * Handles IDataTypeComparer objects through the DataTypeComparerService.
 * There are no lookupKeys that select a IDataTypeComparer.
 * Instead, each DataTypeComparer evaluates two data values and determines if it supports
 * them.
 *
 * Our task is to take all LookupKeys registered in Results.lookupKeyResults
 * and report on the viability of comparison.
 * 
 * All of that happens in the ConfigAnalysisService.checkForComparers function.
 * 
 * Comparison is done by specific Conditions. We don't even bother if after evaluating
 * all ValueHostConfigs, we've found no evidence needing a comparer.
 * To qualify, the ConditionConfig must have a category of "Comparison" or
 * the Condition object created from the ConditionConfig must have a category of "Comparison".
 * 
 * When there is a result, it is the ComparerServiceCAResult object.
 * When the class is found:
 * ```ts
 * {  // ComparerServiceCAResult
 *      feature: CAFeature.comparer, // = ServiceName.comparer
 *      classFound: 'MyComparer',
 *      instance: comparerInstance,
 *      dataExamples: [sampleValue]
 * }
 * ```
 * When the defaultComparer function is used:
 * ```ts
 * {  // ComparerServiceCAResult
 *      feature: CAFeature.comparer, // = ServiceName.comparer
 *      classFound: 'defaultComparer',
 *      dataExamples: [sampleValue]
 * }
 * ```
 * When there is an error or warning:
 * ```ts
 * {  // ComparerServiceCAResult
 *      feature: CAFeature.comparer, // = ServiceName.comparer
 *      message: 'error message',
 *      severity: 'error' | 'warning'
 * }
 * ```
 * When the comparer is not found:
 * ```ts
 * {  // ComparerServiceCAResult
 *      feature: CAFeature.comparer, // = ServiceName.comparer
 *      message: 'error message',
 *      severity: 'warning',
 *      notFound: true
 * }
 * ```
 */

export class DataTypeComparerAnalyzer<TServices extends IValueHostsServices>
    implements IDataTypeComparerAnalyzer {
    constructor(helper: AnalysisResultsHelper<TServices>) {
        this._helper = helper;
    }

    /**
     * Supplies helper methods
     */
    protected get helper(): AnalysisResultsHelper<TServices> {
        return this._helper;
    }
    private _helper: AnalysisResultsHelper<TServices>;

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
     * ComparerServiceCAResult object that was added to the lookupKeyResults.services array.
     */
    public checkConditionConfig(conditionConfig: ConditionConfig, valueHostConfig: ValueHostConfig):
        ComparerServiceCAResult | null {
// anything to disqualify this condition from the check?
        let cleanCT = cleanString(conditionConfig.conditionType);
        if (!cleanCT)
            return null;
        let lookupKey = this.identifyLookupKey(conditionConfig, valueHostConfig);
        if (!lookupKey)
            return null;
        if (!this.conditionUsesComparer(conditionConfig))
            return null;

        let lookupKeyResults = this.helper.results.lookupKeyResults;        

        let realInfo = this.helper.checkForRealLookupKeyName(lookupKey);
        lookupKey = realInfo.resolvedLookupKey;
        let lookupKeyResult = lookupKeyResults.find(lki => lki.lookupKey === lookupKey);
        if (!lookupKeyResult)
        {
            let srkResult = this.helper.registerServiceLookupKey(lookupKey, null, valueHostConfig);
            // istanbul ignore next // defensive. We should always find the lookup key.
            if (!srkResult)
                return null;
            lookupKey = srkResult.lookupKeyResult.lookupKey;
            lookupKeyResult = lookupKeyResults.find(lki => lki.lookupKey === lookupKey)!;
        }
        let serviceInfo = lookupKeyResult.serviceResults.find(si => si.feature === ServiceName.comparer) as ComparerServiceCAResult;
        // if we have already found a comparer, we don't need to do anything.
        if (serviceInfo)
            return serviceInfo;
        let results: ComparerServiceCAResult = {
            feature: CAFeature.comparer
        };
        // we'll add the remaining fields in the remaining code
        lookupKeyResult.serviceResults.push(results);

        // we need to find a comparer. We'll use the sample values to try to find one.
        // The compare() function needs two values. We'll pass it the same value twice.
        let sampleValue = this.helper.getSampleValue(lookupKey, valueHostConfig);
        if (sampleValue === undefined)
        {
            results.message = `No sample value found for Lookup Key ${lookupKey} in condition ${cleanCT}. Cannot determine a comparer.`;
            results.severity = CAIssueSeverity.warning; 
            return results;
        }
        // find a matching Comparer. Its likely there isn't one, and we'll progress onto using the default Comparer against the sample values.
        let dtcs = this.helper.services.dataTypeComparerService;
        let comparer = dtcs.find(sampleValue, sampleValue, lookupKey, lookupKey);
        if (comparer) {
            results.classFound = comparer.constructor.name;
            results.instance = comparer;
            results.dataExamples = [sampleValue];
            return results;
        }
        // like with DataTypeComparerService, we'll try the lookup key fallbacks to find a comparer.
        let lkfs = this.helper.services.lookupKeyFallbackService;
        let lookupKeyFallback = lkfs.fallbackToDeepestMatch(lookupKey) ?? lookupKey;
        if (lookupKeyFallback !== lookupKey) {
            comparer = dtcs.find(sampleValue, sampleValue, lookupKeyFallback, lookupKeyFallback);
            if (comparer) {
                results.classFound = comparer.constructor.name;
                results.instance = comparer;
                results.dataExamples = [sampleValue];
                return results;
            }
        }

        try {
            let compareResult = defaultComparer(sampleValue, sampleValue);  // this will only handle number and string, reporting Undetermined for all others.
            if (compareResult !== ComparersResult.Undetermined) {
                results.classFound = 'defaultComparer'; // intentionally camelcase as its the function name
                results.dataExamples = [sampleValue];
                return results;
            }
        }
        catch (e)
        {
            // defaultComparer throws InvalidTypeError(value) for any non-primitive  
            // istanbul ignore next // defensive. Currently only get InvalidTypeErrors
            if (!(e instanceof InvalidTypeError))
            {
                results.message = (e as Error).message;
                results.severity = CAIssueSeverity.error;
                return results;
            }
        }
        // none found. We'll report an warning.
        results.message = `Cannot check the comparer used with Lookup Key ${lookupKey} in condition ${cleanCT}. Be sure to either supply one in DataTypeComparerService or setup the conversionLookupKey property to convert to a supported Lookup Key.`;
        results.severity = CAIssueSeverity.warning;
        results.notFound = true;
        return results;
    }

    /**
     * Checks if the given condition configuration uses a comparer.
     * It looks at the ConditionCategory for "Comparison". There are two sources for that value:
     * - The ConditionConfig.category property.
     * - The Condition object created from the ConditionConfig, which has a category property.
     * So it may have to create the Condition object, potentially throwing an error when doing that.
     * For any error, we just return false. Exceptions like that are usually reported elsewhere.
     * @param conditionConfig - The condition configuration to check.
     * @returns A boolean indicating whether the condition uses a comparer.
     */
    public conditionUsesComparer(conditionConfig: ConditionConfig): boolean {
        let cleanCT = cleanString(conditionConfig.conditionType);
        if (!cleanCT) {
            return false;
        }
        if (conditionConfig.category === ConditionCategory.Comparison)
            return true;

        try {
            let basicConfig: ConditionConfig = {
                conditionType: cleanCT!
            }
            let condition = this.helper.services.conditionFactory.create(basicConfig);
            return condition.category === ConditionCategory.Comparison;
        }
        catch (e) {
            // all errors are caught and ignored. We just return false.
        }
        return false;
    }

    /**
     * Identifies the lookup key based on the condition's properties that have conversion lookup keys,
     * and valueHostConfig.dataType.
     * @param conditionConfig - The condition configuration.
     * @param valueHostConfig - The value host configuration.
     * @returns The lookup key or null if not found.
     */
    protected identifyLookupKey(conditionConfig: ConditionConfig, valueHostConfig: ValueHostConfig): string | null
    {
        let lookupKey = cleanString(valueHostConfig.dataType);
        // let conversionLookupKey or secondConversionLookupKey override the lookupKey, even if they are different from each other.
        // These actions are blind to the source config. We only need to know if the property name is there.
        let conlk = cleanString((conditionConfig as any)['conversionLookupKey']);
        if (conlk) {
            lookupKey = conlk;
        }
        else {
            let sconlk = cleanString((conditionConfig as any)['secondConversionLookupKey']);
            if (sconlk) {
                lookupKey = sconlk;
            }
        }
        return lookupKey ?? null;
    }

}