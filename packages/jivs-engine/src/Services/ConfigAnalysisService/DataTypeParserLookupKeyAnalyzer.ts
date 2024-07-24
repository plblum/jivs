/**
 * Support the DataTypeParserService and its IDataTypeParser objects.
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */
import { LookupKeyServiceInfoBase, MultiClassRetrieval, CultureSpecificClassRetrieval, OneClassRetrieval } from "../../Interfaces/ConfigAnalysisService";
import { IDataTypeParser } from "../../Interfaces/DataTypeParsers";
import { IValidationServices, ServiceName } from "../../Interfaces/ValidationServices";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { ensureError, CodingError } from "../../Utilities/ErrorHandling";
import { AnalysisArgs } from "../../Interfaces/ConfigAnalysisService";
import { ParserClassRetrieval } from '../../Interfaces/ConfigAnalysisService';
import { MultipleClassesPerLookupKeyAnalyzer } from "./LookupKeyAnalyzerClasses";

/**
 * Handles IDataTypeParser objects through the DataTypeParserService.
 * The requested key is the lookup key for the parser, from InputValueHostConfig.parserLookupKey.
 * The ValueHostConfig.dataType will be used if the parser key is not supplied.
 * The analysis is based on DataTypeParserService.format function,
 * although it does not use the LookupKeyFallbackService to continue its search.
 * Failing to find, it will report an error and provide any lookup key supplied
 * by LookupKeyFallbackService so the caller to try that lookup key next.
 * 
 * The results are:
 * - Creates the MultiClassRetrieval with the key and feature = 'parser'.
 * - Runs the same process for each CultureID in results.cultureIds.
 *   Each will add ParserClassRetrieval to MultiClassRetrieval.requests,
 *   reporting all of its info, which may include an error message.
 * - If it finds matching parsers in the DataTypeParserService, 
 *   ParserClassRetrieval will have these properties set:
 *   cultureId and matches which will have OneClassRetrieval
 * - If no parser is found, ParserClassRetrieval
 *   will have these properties set: message, error, cultureId.
 *   ```ts
 *   {  // MultiClassRetrieval
 *      feature: ServiceName.parser,
 *      requests: [ // ParserClassRetrieval objects
 *      {
 *          feature: ServiceName.parser,
 *          cultureId: 'en-US',
 *    // when found
 *          matches: [ // OneClassRetrieval objects for each found
 *          {
 *              feature: ServiceName.parser,
 *              classFound: 'MyParser',
 *              instance: parserInstance,
 *          } // and more if multiple matches
 *          ]
 *    // or when no matches
 *          matches: [],
 *          severity: 'error',
 *          message: 'error message',   
 *      } // and more for each cultureId
 *      ]
 *   }
 *   ```
 */
export class DataTypeParserLookupKeyAnalyzer extends MultipleClassesPerLookupKeyAnalyzer<IDataTypeParser<any>, IValidationServices> {
    constructor(args: AnalysisArgs<IValidationServices>) {
        super(args);
    }
    protected get classGeneralName(): string {
        return 'DataTypeParser';
    }

    public analyze(key: string, container: ValueHostConfig): LookupKeyServiceInfoBase {

        let info: MultiClassRetrieval = {
            feature: ServiceName.parser,
            requests: []
        };
        let lookupKey = key ?? container.dataType;
        if (lookupKey) {
            info.tryFallback = true;
            this.results.cultureIds.forEach(cultureId => {
                try {
                    let analysis = this.analyzeForCulture(lookupKey, cultureId);
                    info.requests.push(analysis);
                    if (analysis.matches.length > 0)
                        info.tryFallback = false;
                }
                catch (e) {
                    info.tryFallback = false;
                    let errorInfo: CultureSpecificClassRetrieval = {
                        feature: ServiceName.parser,
                        requestedCultureId: cultureId,
                        notFound: true
                    }
                    info.requests.push(errorInfo);
                    this.errorThrown(errorInfo, ensureError(e));                    
                }
            });
        }
        // currently not an issue to report if there is no lookup key

        return info;
    }

    /**
     * Variation of DataTypeParserService.parser function.
     * @param lookupKey - The key to find a parser for. This may not be the actual lookupKey 
     * used, but in this analysis, it is the endpoint.
     * @param startingCultureId - The first culture to try.
     * @returns 
     */
    public analyzeForCulture(lookupKey: string, startingCultureId: string): ParserClassRetrieval {
        let info: ParserClassRetrieval = {
            feature: ServiceName.parser,
            cultureId: startingCultureId,
            matches: []
        };

        let parsersFound = this.services.dataTypeParserService.compatible(lookupKey, startingCultureId);
        if (parsersFound) {
            parsersFound.forEach(parser => {
                let sci: OneClassRetrieval = {
                    classFound: parser.constructor.name,
                    instance: parser,
                    feature: ServiceName.parser,
                    //!!FUTURE                    dataExamples: []
                };
                info.matches.push(sci);
            });
        }
        else {
            this.notFound(info, lookupKey, startingCultureId);
        }

        return info;
    }

}

