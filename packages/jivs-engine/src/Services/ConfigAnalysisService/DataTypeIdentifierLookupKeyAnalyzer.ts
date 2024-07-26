/**
 * Support the DataTypeIdentifierService and its IDataTypeIdentifierobjects.
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { ServiceWithLookupKeyCAResultBase, IdentifierServiceCAResult, identifierServiceFeature } from "../../Interfaces/ConfigAnalysisService";
import { IDataTypeIdentifier } from "../../Interfaces/DataTypeIdentifier";
import { ServiceName } from "../../Interfaces/ValidationServices";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";
import { AnalysisArgs } from "../../Interfaces/ConfigAnalysisService";
import { OneClassPerLookupKeyAnalyzer } from "./LookupKeyAnalyzerClasses";

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
 *      feature: identifierServiceFeature,
 *      classFound: 'MyIdentifier',
 *      instance: identifierInstance,
 * }
 * ```
 * When not found:
 * ```ts
 * {  // IdentifierServiceCAResult
 *      feature: identifierServiceFeature,
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
            feature: identifierServiceFeature
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
