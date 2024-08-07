/**
 * Support the DataTypeFormatterService and its IDataTypeFormatter objects.
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */
import {
    ServiceWithLookupKeyCAResultBase, FormattersByCultureCAResult, FormatterServiceCAResult,
    CAFeature
} from "../Interfaces/ConfigAnalysisService";
import { IDataTypeFormatter } from "../Interfaces/DataTypeFormatters";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValueHostConfig } from "../Interfaces/ValueHost";
import { ensureError, CodingError } from "../Utilities/ErrorHandling";
import { AnalysisArgs } from "../Interfaces/ConfigAnalysisService";
import { MultipleClassesPerLookupKeyAnalyzer } from "./LookupKeyAnalyzerClasses";

/**
 * Handles IDataTypeFormatter objects through the DataTypeFormatterService.
 * The requested key is the lookup key for the formatter.
 * The ValueHostConfig.dataType will be used if the formatter key is not supplied.
 * The analysis is based on DataTypeFormatterService.format function,
 * although it does not use the LookupKeyFallbackService to continue its search.
 * Failing to find, it will report an error and provide any lookup key supplied
 * by LookupKeyFallbackService so the caller to try that lookup key next.
 * 
 * The results are:
 * - Creates the FormatterServiceCAResult with the key and feature = 'formatter'.
 * - Runs the same process for each CultureId in IConfigAnalysisResults.cultureIds.
 *   Each will add FormattersByCultureCAResult to FormatterServiceCAResult.requestResults,
 *   reporting all of its info, which may include an error message.
 * - If it finds a matching formatter in the DataTypeFormatterService, 
 *   FormattersByCultureCAResult will have these properties set:
 *   classFound, instance, requestedCultureId, actualCultureId.
 * - If the formatter is not found, FormattersByCultureCAResult
 *   will have these properties set: message, error, requestedCultureId.
  *   ```ts
 *   {  // FormatterServiceCAResult
 *      feature: formatterServiceFormatter,
 *      results: [ // FormattersByCultureCAResult objects
 *      {
 *          feature: CAFeature.formattersByCulture,
 *          requestedCultureId: 'en-US',
 *     // when found
 *          classFound: 'MyFormatter',
 *          instance: formatterInstance,
 *          actualCultureId: 'en-US',
  *    // or when not found
 *          severity: 'error',
 *          message: 'error message',   
 *      }
 *      ]
 *   }
 *   ```
 */
export class DataTypeFormatterLookupKeyAnalyzer extends MultipleClassesPerLookupKeyAnalyzer<IDataTypeFormatter, IValidationServices> {
    constructor(args: AnalysisArgs<IValidationServices>) {
        super(args);
    }

    protected get classGeneralName(): string {
        return 'DataTypeFormatter';
    }

    public analyze(key: string, container: ValueHostConfig): ServiceWithLookupKeyCAResultBase {

        let info: FormatterServiceCAResult = {
            feature: CAFeature.formatter,
            results: []
        };
        let lookupKey = key ?? container.dataType;
        if (lookupKey) {
            info.tryFallback = true;
            this.results.cultureIds.forEach(cultureId => {
                try {
                    let analysis = this.analyzeForCulture(lookupKey, cultureId);
                    info.results.push(analysis);
                    if (analysis.classFound)
                        info.tryFallback = false;
                }
                    // istanbul ignore next - currently no way for analyzeForCulture to throw an error
                catch (e) {
                    // istanbul ignore next
                    info.tryFallback = false;
                    // istanbul ignore next
                    let errorInfo: FormattersByCultureCAResult = {
                        feature: CAFeature.formattersByCulture,
                        requestedCultureId: cultureId,
                        notFound: true
                    }
// istanbul ignore next
                    info.results.push(errorInfo);
// istanbul ignore next                    
                    this.errorThrown(errorInfo, ensureError(e));
                }
            });
            if (info.tryFallback)
                info.notFound = true;
        }
        // currently not an issue to report if there is no lookup key

        return info;
    }

    /**
     * Variation of DataTypeFormatterService.format function.
     * Will update the results object with the lookup key and the service used.
     * Follows these format functions rules:
     * - it tries the startingCultureId first and if no formatter,
     *   it uses the CultureService to get a fallback and repeats the process
     *   until it finds a match or has run out of fallbacks.
     * - If it has none after that point, tries the LookupKeyFallbackService
     *   to get a new lookupKey that is supposed to be compatible with the original.
     *   Instead of trying to find with that key, it returns FormattersByCultureCAResult
     *   with a message about using another lookupKey, and the caller should try 
     *   to handle the new lookupKey.
     * @param lookupKey - The key to find a formatter for. This may not be the actual lookupKey 
     * used, but in this analysis, it is the endpoint.
     * @param startingCultureId - The first culture to try.
     * @returns 
     */
    public analyzeForCulture(lookupKey: string, startingCultureId: string): FormattersByCultureCAResult {
        let info: FormattersByCultureCAResult = {
            feature: CAFeature.formattersByCulture,
            requestedCultureId: startingCultureId
        };
        this.analyzeForCultureRecursive(info, lookupKey, startingCultureId);
        return info;
    }
    protected analyzeForCultureRecursive(info: FormattersByCultureCAResult,
        lookupKey: string, startingCultureId: string): void {

        let cultureId: string | null = startingCultureId;
        while (cultureId) {
            let cc = this.services.cultureService.find(cultureId);
            /* istanbul ignore next */ // this error is defensive, but currently find will never return null for an activeCultureID
            if (!cc)
                throw new CodingError(`Must add CultureID ${cultureId} in to CultureServices.`);

            let dtlf = this.services.dataTypeFormatterService.find(lookupKey, cultureId);
            if (dtlf) {
                // found it.
                info.classFound = dtlf.constructor.name;
                info.instance = dtlf;
                info.actualCultureId = cultureId;
                return;
            }

            cultureId = cc.fallbackCultureId ?? null;
        }

        this.notFound(info, lookupKey, startingCultureId);
    }
}

