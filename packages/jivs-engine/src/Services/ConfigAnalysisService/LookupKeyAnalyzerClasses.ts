/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { ServiceWithLookupKeyCAResultBase, ILookupKeyAnalyzer, IssueForCAResultBase, CAIssueSeverity, AnalysisArgs, IConfigAnalysisResults, ClassNotFound } from "../../Interfaces/ConfigAnalysisService";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";

/**
 * Each service that has registered data associated with a key --- lookup key, condition type, etc ---
 * has a child of this class registered with the CodeAnalysisService.
 * Each provides a way to take that key and retrieve the matching object, or report an error when not found.
 */
export abstract class LookupKeyAnalyzerBase<TData, TServices extends IValueHostsServices>
    implements ILookupKeyAnalyzer {

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
     * The name of the general class of object this service retrieves
     * such as "DataTypeFormatter" and "DataTypeParser".
     * Used in messages.
     */
    protected abstract get classGeneralName(): string;
    /**
     * Analyzes the key, creating an entry in the results describing it and reports any issues found.
     * If the object depends on cultures too, internally should use results.cultureIds.
     * Implementation should expect to catch errors and write them to results.lookupKeysIssues.
     * @param key 
     * @param valueHostConfig
     * @returns A new LookupKeyServiceInfo object with the results of the analysis.
     * Add it to the LookupKeyCAResult.services array.
     */
    public abstract analyze(key: string, valueHostConfig: ValueHostConfig | null): ServiceWithLookupKeyCAResultBase;

    protected notFound(info: ClassNotFound, lookupKey: string, cultureId?: string): void {
        info.notFound = true;
        info.severity = CAIssueSeverity.error;
        if (cultureId)
            info.message = `No ${this.classGeneralName} for LookupKey "${lookupKey}" with culture "${cultureId}"`;
        else
            info.message = `No ${this.classGeneralName} for LookupKey "${lookupKey}"`;
    }

    protected noSampleValue(info: IssueForCAResultBase, valueHostConfig: ValueHostConfig, lookupKey: string): void {
        info.severity = CAIssueSeverity.warning;
        info.message = `No sample value found for ValueHost name "${valueHostConfig.name}" and lookup key "${lookupKey}". Cannot verify the ${this.classGeneralName}. Consider adding an entry to options.valueHostsSampleValues or options.lookupKeysSampleValues`;

    }

    protected errorThrown(info: IssueForCAResultBase, e: Error): void {
        info.severity = CAIssueSeverity.error;
        info.message = e.message;
    }
}

/**
 * For services that have a single object to report on per key.
 * Adds OneClassRetrieval to LookupKeyCAResult.services.
 */
export abstract class OneClassPerLookupKeyAnalyzer<TData, TServices extends IValueHostsServices>
    extends LookupKeyAnalyzerBase<TData, TServices> 
{

}

/**
 * For services that may have multiple objects to report on per key,
 * such as on for each cultureId.
 * Adds MultiClassRetrieval to LookupKeyCAResult.services.
 */
export abstract class MultipleClassesPerLookupKeyAnalyzer<TData, TServices extends IValueHostsServices> extends
    LookupKeyAnalyzerBase<TData, TServices> {
}
