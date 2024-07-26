/**
 * Support the DataTypeConverterService and its IDataTypeConverter objects.
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { LookupKeyServiceInfoBase, ConverterServiceClassRetrieval } from "../../Interfaces/ConfigAnalysisService";
import { IDataTypeConverter } from "../../Interfaces/DataTypeConverters";
import { ServiceName } from "../../Interfaces/ValidationServices";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { IValueHostsServices } from "../../Interfaces/ValueHostsServices";
import { AnalysisArgs } from "../../Interfaces/ConfigAnalysisService";
import { OneClassPerLookupKeyAnalyzer } from "./LookupKeyAnalyzerClasses";

/**
 * Handles IDataTypeConverter objects through the DataTypeConverterService.
 * Two lookup keys are needed.
 * - The value to convert is determined by the SampleValues object
 *   by using options.valueHostsSampleValues or the dataType property on 
 *   ValueHostConfig if supplied. If neither are setup, it will return an error.
 * - The data type lookup key for the result is passed into analyze as the key parameter.
 * 
 * 
 * Expected results:
 * - Creates a ConverterServiceClassRetrieval for feature='converter'.
 * - Needs to get a sample value from the SampleValues class based on the 
 *   lookup key and ValueHostConfig. If it cannot find a sample value, it will 
 *   report a warning and return an error message.
 * - If it finds a matching converter in the DataTypeConverterService,
 *   it will be in LookupKeyServiceInfo.classFound and LookupKeyServiceInfo.instance.
 * - If the converter is not found, it will report an error and provide an error message.
 * 
 */
export class DataTypeConverterLookupKeyAnalyzer extends OneClassPerLookupKeyAnalyzer<IDataTypeConverter, IValueHostsServices> {
    constructor(args: AnalysisArgs<IValueHostsServices>) {
        super(args);
    }

    protected get classGeneralName(): string {
        return 'DataTypeConverter';
    }
    /**
     *  Analyze the key and valueHostConfig to find a converter in the DataTypeConverterService.
     * 
     * @param key - The lookup key for the data type of the result.
     * @param valueHostConfig - Identifies the source data type in ValueHostConfig.dataType
     * to use with SampleValues. Identifiers the value host name to use in SampleValues
     * with the option valueHostsSampleValues.
     * @returns 
     */
    public analyze(key: string, valueHostConfig: ValueHostConfig): LookupKeyServiceInfoBase {
        let result: ConverterServiceClassRetrieval = {
            feature: ServiceName.converter,

        };
        let sampleValue = this.analysisArgs.sampleValues.getSampleValue(
            valueHostConfig.dataType ?? '', valueHostConfig);
        if (sampleValue === undefined) {
            this.noSampleValue(result, valueHostConfig, key);
            return result;
        }
        result.dataExamples = [sampleValue];
        let dtc = this.services.dataTypeConverterService.find(sampleValue, valueHostConfig.dataType ?? null, key);
        if (dtc) {
            result.classFound = dtc.constructor.name;
            result.instance = dtc;
        }
        else {
            this.notFound(result, key);
        }
        return result;
    }
}

