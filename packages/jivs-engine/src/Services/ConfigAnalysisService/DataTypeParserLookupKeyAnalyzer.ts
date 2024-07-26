/**
 * Support the DataTypeParserService and its IDataTypeParser objects.
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */
import { ServiceWithLookupKeyCAResultBase, ParserServiceByLookupKey, CultureSpecificClassRetrieval, OneClassRetrieval, parserServiceFeature, parserForCultureFeature, ParserServiceClassRetrieval, parserServiceClassRetrievalFeature } from "../../Interfaces/ConfigAnalysisService";
import { IDataTypeParser } from "../../Interfaces/DataTypeParsers";
import { IValidationServices, ServiceName } from "../../Interfaces/ValidationServices";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { ensureError, CodingError } from "../../Utilities/ErrorHandling";
import { AnalysisArgs } from "../../Interfaces/ConfigAnalysisService";
import { ParserForCultureClassRetrieval } from '../../Interfaces/ConfigAnalysisService';
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
 * - Creates the ParserServiceByLookupKey with the key and feature = 'Parser'.
 * - Runs the same process for each CultureID in results.cultureIds.
 *   Each will add ParserForCultureClassRetrieval to ParserServiceByLookupKey.requests,
 *   reporting all of its info, which may include an error message.
 * - If it finds matching parsers in the DataTypeParserService, 
 *   ParserForCultureClassRetrieval will have these properties set:
 *   cultureId and matches which will have ParserServiceClassRetrieval
 * - If no parser is found, ParserForCultureClassRetrieval
 *   will have these properties set: message, error, cultureId.
 *   ```ts
 *   {  // ParserServiceByLookupKey
 *      feature: parserServiceFeature,
 *      requests: [ // ParserForCultureClassRetrieval objects
 *      {
 *          feature: parserServiceFeature,
 *          cultureId: 'en-US',
 *    // when found
 *          matches: [ // ParserServiceClassRetrieval objects for each found
 *          {
 *              feature: parserServiceFeature,
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

    public analyze(key: string, container: ValueHostConfig): ServiceWithLookupKeyCAResultBase {

        let info: ParserServiceByLookupKey = {
            feature: parserServiceFeature,
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
                    let errorInfo: ParserForCultureClassRetrieval = {
                        feature: parserForCultureFeature,
                        cultureId: cultureId,
                        notFound: true,
                        matches: []
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
    public analyzeForCulture(lookupKey: string, startingCultureId: string): ParserForCultureClassRetrieval {
        let info: ParserForCultureClassRetrieval = {
            feature: parserForCultureFeature,
            cultureId: startingCultureId,
            matches: []
        };

        let parsersFound = this.services.dataTypeParserService.compatible(lookupKey, startingCultureId);
        if (parsersFound) {
            parsersFound.forEach(parser => {
                let sci: ParserServiceClassRetrieval = {
                    classFound: parser.constructor.name,
                    instance: parser,
                    feature: parserServiceClassRetrievalFeature,
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

