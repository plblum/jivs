/**
 * Support the DataTypeParserService and its IDataTypeParser objects.
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */
import {
    ServiceWithLookupKeyCAResultBase, ParserServiceCAResult, CAFeature, ParserFoundCAResult
} from "../../Interfaces/ConfigAnalysisService";
import { IDataTypeParser } from "../../Interfaces/DataTypeParsers";
import { IValidationServices } from "../../Interfaces/ValidationServices";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { ensureError } from "../../Utilities/ErrorHandling";
import { AnalysisArgs } from "../../Interfaces/ConfigAnalysisService";
import { ParsersByCultureCAResult } from '../../Interfaces/ConfigAnalysisService';
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
 * - Creates the ParserServiceCAResult with the key and feature = 'Parser'.
 * - Runs the same process for each CultureID in results.cultureIds.
 *   Each will add ParsersByCultureCAResult to ParserServiceCAResult.requests,
 *   reporting all of its info, which may include an error message.
 * - If it finds matching parsers in the DataTypeParserService, 
 *   ParsersByCultureCAResult will have these properties set:
 *   cultureId and parserResults which will have ParserFoundCAResult
 * - If no parser is found, ParsersByCultureCAResult
 *   will have these properties set: message, error, cultureId.
 *   ```ts
 *   {  // ParserServiceCAResult
 *      feature: CAFeature.parser,
 *      requests: [ // ParsersByCultureCAResult objects
 *      {
 *          feature: CAFeature.parser,
 *          cultureId: 'en-US',
 *    // when found
 *          parserResults: [ // ParserFoundCAResult objects for each found
 *          {
 *              feature: CAFeature.parser,
 *              classFound: 'MyParser',
 *              instance: parserInstance,
 *          } // and more if multiple matches
 *          ]
 *    // or when no matches
 *          parserResults: [],
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

        let info: ParserServiceCAResult = {
            feature: CAFeature.parser,
            results: []
        };
        let lookupKey = key ?? container.dataType;
        if (lookupKey) {
            info.tryFallback = true;
            this.results.cultureIds.forEach(cultureId => {
                try {
                    let analysis = this.analyzeForCulture(lookupKey, cultureId);
                    info.results.push(analysis);
                    if (analysis.parserResults.length > 0)
                        info.tryFallback = false;
                }
                catch (e) {
                    info.tryFallback = false;
                    let errorInfo: ParsersByCultureCAResult = {
                        feature: CAFeature.parsersByCulture,
                        cultureId: cultureId,
                        notFound: true,
                        parserResults: []
                    }
                    info.results.push(errorInfo);
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
    public analyzeForCulture(lookupKey: string, startingCultureId: string): ParsersByCultureCAResult {
        let info: ParsersByCultureCAResult = {
            feature: CAFeature.parsersByCulture,
            cultureId: startingCultureId,
            parserResults: []
        };

        let parsersFound = this.services.dataTypeParserService.compatible(lookupKey, startingCultureId);
        if (parsersFound) {
            parsersFound.forEach(parser => {
                let sci: ParserFoundCAResult = {
                    classFound: parser.constructor.name,
                    instance: parser,
                    feature: CAFeature.parserFound,
                    //!!FUTURE                    dataExamples: []
                };
                info.parserResults.push(sci);
            });
        }
        else {
            this.notFound(info, lookupKey, startingCultureId);
        }

        return info;
    }

}

