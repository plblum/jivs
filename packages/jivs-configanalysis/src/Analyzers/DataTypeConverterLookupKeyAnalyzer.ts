/**
 * @module jivs-configanalysis/Analyzers/ConcreteClasses/LookupKeys
 */

import { IDataTypeConverter } from '@plblum/jivs-engine/build/Interfaces/DataTypeConverters';
import { ValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { OneClassPerLookupKeyAnalyzer } from './LookupKeyAnalyzerClasses';
import { ServiceWithLookupKeyCAResultBase, ConverterServiceCAResult, CAFeature } from '../Types/ConfigAnalysisResults';
import { AnalysisArgs } from '../Types/ConfigAnalysis';

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
 * - Creates a ConverterServiceCAResult for feature='converter'.
 * - Needs to get a sample value from the SampleValues class based on the 
 *   lookup key and ValueHostConfig. If it cannot find a sample value, it will 
 *   report a warning and return an error message.
 * - If it finds a matching converter in the DataTypeConverterService,
 *   it will be in LookupKeyServiceInfo.classFound and LookupKeyServiceInfo.instance.
 * - If the converter is not found, it will report an error and provide an error message.
 * 
 */
export class DataTypeConverterLookupKeyAnalyzer extends OneClassPerLookupKeyAnalyzer<IDataTypeConverter, IJivsServices> {
    constructor(args: AnalysisArgs<IJivsServices>) {
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
    public analyze(key: string, valueHostConfig: ValueHostConfig): ServiceWithLookupKeyCAResultBase {
        const result: ConverterServiceCAResult = {
            feature: CAFeature.converter

        };
        const sampleValue = this.analysisArgs.sampleValues.getSampleValue(
            valueHostConfig.dataType ?? '', valueHostConfig);
        if (sampleValue === undefined) {
            this.noSampleValue(result, valueHostConfig, key);
            return result;
        }
        result.dataExamples = [sampleValue];
        const dtc = this.services.dataTypeConverterService.find(sampleValue, valueHostConfig.dataType ?? null, key);
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

