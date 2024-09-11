/**
 * @module Analyzers/Classes/LookupKeys
 */

import { IDataTypeIdentifier } from "@plblum/jivs-engine/build/Interfaces/DataTypeIdentifier";
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostsServices } from "@plblum/jivs-engine/build/Interfaces/ValueHostsServices";
import { AnalysisArgs } from "@plblum/jivs-engine/build/Interfaces/ConfigAnalysisService";
import { OneClassPerLookupKeyAnalyzer } from "./LookupKeyAnalyzerClasses";
import { ServiceWithLookupKeyCAResultBase, IdentifierServiceCAResult, CAFeature } from "../Types/Results";

/**
 * Handles IDataTypeIdentifier objects through the DataTypeIdentifierService.
 * There are no lookupKeys that select a DataTypeIdentifier. 
 * Instead, the data value supplied to its supportsValue() function 
 * will determine if it can SUPPLY a lookup key.
 * Our task is to take all registered DataTypeIdentifiers and add them
 * to the LookupKeyCAResult.services specific to their data type.
 * All of that happens in the ConfigAnalysisService.gatherDataTypeIdentifierLookupKeys function.
 * When that calls tryAdd, it will use this to create the LookupKeyServiceInfo.
 * As a result, this will never be called for a missing lookupKey and need
 * to report an error. It has been coded to support the error case anyway.
 * 
 * Expected results:
 * - Creates an IdentifierServiceCAResult for feature='identifier'.
 * 
 * When found:
 * ```ts
 * {  // IdentifierServiceCAResult
 *      feature: CAFeature.identifier,
 *      classFound: 'MyIdentifier',
 *      instance: identifierInstance,
 * }
 * ```
 * When not found:
 * ```ts
 * {  // IdentifierServiceCAResult
 *      feature: CAFeature.identifier,
 *      severity: 'error',
 *      message: 'error message',
 *      notFound: true,
 * }
 * ```
 */
export class DataTypeIdentifierLookupKeyAnalyzer extends OneClassPerLookupKeyAnalyzer<IDataTypeIdentifier, IValueHostsServices> {
    constructor(args: AnalysisArgs<IValueHostsServices>) {
        super(args);
    }

    protected get classGeneralName(): string {
        return 'DataTypeIdentifier';
    }

    public analyze(key: string, container: ValueHostConfig): ServiceWithLookupKeyCAResultBase {
        let info: IdentifierServiceCAResult = {
            feature: CAFeature.identifier
        };

        let dti = this.services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === key);
        if (dti) {
            info.classFound = dti.constructor.name;
            info.instance = dti;
        }
        else
            this.notFound(info, key);

        return info;
    }
}
