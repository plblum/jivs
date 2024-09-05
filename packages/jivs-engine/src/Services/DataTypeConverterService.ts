/**
  * {@inheritDoc Services/ConcreteClasses/DataTypeConverterService!DataTypeConverterService:class}
  * @module Services/ConcreteClasses/DataTypeConverterService
 */

import { LoggingLevel, LoggingCategory, LogDetails } from "../Interfaces/LoggerService";
import { ConversionResult, IDataTypeConverterService } from "../Interfaces/DataTypeConverterService";
import { IDataTypeConverter } from "../Interfaces/DataTypeConverters";
import { DataTypeConverterServiceBase } from "./DataTypeConverterServiceBase";
import { CodingError, ensureError } from "../Utilities/ErrorHandling";
import { valueForLog } from "../Utilities/Utilities";

/**
 * A service for changing the original value into 
 * something that you want a condition to evaluate
 * using {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter} instances.
 * 
 * This is essential for comparison Conditions. Comparison works automatically
 * with string, number, and boolean native types. Converters exist to take a Date
 * or user defined class to a string, number, or boolean.
 * They are built on {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter}.
 */
export class DataTypeConverterService extends DataTypeConverterServiceBase<IDataTypeConverter>
    implements IDataTypeConverterService {

    protected indexOfExisting(item: IDataTypeConverter): number {
        return -1; // does not support replacements
    }

    /**
     * {@inheritDoc Services/Types/IDataTypeConverterService!IDataTypeConverterService#convert }
     */
    public convert(valueToConvert: any, sourceLookupKey: string | null, resultLookupKey: string): ConversionResult {

        let result: ConversionResult = { sourceLookupKey: sourceLookupKey, resultLookupKey: resultLookupKey};
        if (valueToConvert == null) // null or undefined
        {   
            result.value = valueToConvert;
            result.resolvedValue = true;
            this.logValueNull(result);
            return result;
        }
        try {
            let dtc = this.find(valueToConvert, sourceLookupKey, resultLookupKey);

            if (dtc) {
                result.converter = valueForLog(dtc);    // before convert, in case it throws
                this.logConverterFound(dtc, sourceLookupKey, resultLookupKey);
                result.value = dtc.convert(valueToConvert, sourceLookupKey, resultLookupKey);
                result.resolvedValue = true;
                if (result.value !== undefined) {
                    this.logSuccess(result);
                }
                else {
                    this.logInvalidValue(result);
                }
                return result;
            }

            this.logNoConverter(result, valueToConvert);
        }
        catch (e) {
            result.error = ensureError(e);
            this.logErrorResult(result); // will throw if SevereErrorBase
        }
        return result;
    }

    /**
     * Applies a converter specific to the value based on the desired result lookup key.
     * If the result is an object (like Date or custom),
     * it repeats with the new value, hopefully resulting in a primitive value for use by the 
     * DefaultComparer.
     * Date -> number using UTCDateConverter
     * RelativeDate class with getDate(): Date property -> Date -> number using RelativeDateConverter and UTCDateConverter.
     * @param valueToConvert - The value to be converted. Check its type and possibly its content.
     * @param sourceLookupKey - The value can represent several other values, such as a Date 
     * represents date, time, etc. Use this when you need to distinguish between them.
     * If null or '', evaluate the value itself,
     * such as checking its class (using 'instanceof') or for properties of an interface
     * that you are using.
     * This is often the dataType property of the ValueHost.
     * @resultLookupKey - The lookup key that the result should be. When handling conditions,
     * this is usually from conditionConfig.conversionLookupKey or secondConversionLookupKey.
     * @returns An object identifying the converter used and the converted value. Its 
     * value parameter is undefined when the value was not converted.
     * Its converterUsed parameter is undefined when no DataTypeConverter could be found 
     * to try the conversion. Note that DataTypeConverter.convert() can return undefined,
     * allowing for value=undefined and converterUsed=assigned.
     */
    public convertUntilResult(valueToConvert: any, sourceLookupKey: string | null, resultLookupKey: string): ConversionResult {
        let result: ConversionResult = { sourceLookupKey: sourceLookupKey, resultLookupKey: resultLookupKey};
        if (valueToConvert == null) // null or undefined
        {
            result.value = valueToConvert;
            result.resolvedValue = true;
            this.logValueNull(result);
            return result;
        }    
        try {
            let iResult = this.convertRecursively(valueToConvert, sourceLookupKey, resultLookupKey, null, new Set<string>());
            if (iResult.resolvedValue) {   
                // found a value. Update 'result'
                if (!iResult.earlierResult) {
                // handled the complete task and represents the solution
                    result = iResult;
                }
                else {
                    // the intermediates are retained and each has its own value and converter
                    // 'result' is does not get a converter, but it gets the final value.
                    result.earlierResult = iResult;
                     // go through iResult.existingResult to find the last one
                    let last = iResult;
                    while (last.earlierResult != null) { // null or undefined
                        last = last.earlierResult;
                    }
                    result.value = last.value;
                    result.resolvedValue = true;

                    // CURRENT PROBLEM:
                    // We may have earlierResults from dead end paths.
                    // In DataTypeConverterService.test.ts, we have tests that show it.
                    // Look for 'Test y-r'. It shows:
                    // y -> n -> x -> a -> y -> q -> r
                    // It should have abandon the first 4 earlierResults
                    // as those are on a deadend path.
                    // The correct path should be: y -> q -> r
                    // This problem does not impact the results, but it impacts performance just a bit
                }
            }
            
            if (result.value !== undefined)
                this.logSuccess(result);
            else if (result.resolvedValue)
                // when there are earlierResults, result.converter does not get set
                // result.earlierResult set to a object or null means a converter
                // determined result.value = undefined, which means conversion failed.
                this.logInvalidValue(result);
            else {
                this.logNoConverter(result, valueToConvert);
            }
            return result;
        }
        catch (e) {
            result.error = ensureError(e);
            if (result.error instanceof Error)
                result.converter = (result.error as any).converter;
            this.logErrorResult(result); // will throw if SevereErrorBase
        }
        return result;
    }

    /**
     * This function attempts to convert a given value to a target lookup key specified by resultLookupKey,
     * potentially through multiple intermediate conversion steps. It operates recursively, attempting
     * to find a chain of converters that collectively can transform the input value into the desired
     * output format. 
     * 
     * Each converter is capable of converting values to one or more output lookup keys,
     * identified by DataTypeConverter.supportsResultLookupKeys. 
     * 
     * The function starts with the initial value and a sourceLookupKey
     * (if applicable), trying to apply a converter that can handle this input. If successful, it checks
     * if the output format matches the desired resultLookupKey. If not, it recursively attempts to find
     * and apply a subsequent converter that can take this intermediate result closer to the target lookup key.
     * This process repeats until either the target lookup key is achieved, or no suitable converter can be found.
     * 
     * A DataTypeConverter can return values with these use cases:
     * - undefined - The converter was the correct choice to use, but it could not 
     *   convert the value. This is a valid result. It stops conversion
     *   when on the final step (resultLookupKey) and the value is undefined.
     *   Otherwise, it continues to try other converters.
     * - null - The converter was the correct choice to use, and it successfully
     *   converted the value to null. This is a valid result. It stops conversion
     *   with this as a result. A null value can be returned by an intermediate step
     *   and still cause the result to be null. Supposed that you have 3 steps
     *   and on step 2, you get a null value. We have enough information to know
     *   that the final result will be null. We don't need to continue to step 3.
     * - a value - The converter was the correct choice to use, and it successfully
     *   converted the value. This is a valid result. It stops conversion.
     * 
     * A ConversionResult object is created and updated throughout this process to track the progress of
     * the conversion, including any intermediate results obtained. If at any point a converter successfully
     * processes the value, the ConversionResult.earlierResult property is updated, signaling that a valid
     * conversion path exists up to that point. This property is used by callers of this function to determine
     * whether a successful conversion chain has been established, and they should join in the chain.
     * 
     * Exception handling for the conversion process is managed by the caller, specifically by the
     * convertUntilResult function, to centralize error management and streamline the recursive logic.
     * We want a failure deep in the recursion to bubble up to the top level, where it can be logged.
     * We also want to retain the converter that failed. So we modify the Error object to include it
     * in a property called 'converter'.
     * 
     * Design note: This function travels deep first, going down a path until its
     * either the right one or proven wrong. It then backtracks to try another path.
     * In a multithreaded language, this would be better implemented as a breadth-first search.
     * using threads.
     * 
     * @param valueToConvert The value to be converted.
     * @param sourceLookupKey The lookup key of the source format, or null if not applicable.
     * @param resultLookupKey The lookup key of the target format to achieve through conversion.
     * @param intermediateResultLK Intermediate lookup key used in recursive calls to track progress.
     * @param alreadyCheckedResultLK Lookup keys already checked, to avoid redundant conversions.
     * @returns A ConversionResult object detailing the outcome of the conversion attempt.
     */
    protected convertRecursively(valueToConvert: any,
        sourceLookupKey: string | null, resultLookupKey: string,
        intermediateResultLK: string | null,
        alreadyCheckedResultLK: Set<string>): ConversionResult {
        
        let tryingLookupKey = intermediateResultLK ?? resultLookupKey;
        let result: ConversionResult = { sourceLookupKey: sourceLookupKey, resultLookupKey: tryingLookupKey }; 

        // NOTE: Did not use dataTypeConverterService.convert() directly
        // because we want to take a different action if no DataTypeConverter is found
        let dtc = this.find(valueToConvert, sourceLookupKey, tryingLookupKey);
        if (dtc) {
            this.logConverterFound(dtc, sourceLookupKey, tryingLookupKey);
            try {
                // This converter is a possible completed intermediate step or the final step
                // It always returns a value, even if it is undefined.
                // Retain 'result' with all of the details.
                // If this is the final step, return it.
                let newValue = dtc.convert(valueToConvert, sourceLookupKey, tryingLookupKey);
                result.converter = valueForLog(dtc); // only when we plan to use the result
                result.value = newValue;       
                result.resolvedValue = true;
                // value is expected to be either a match to resultLookupKey, null, or undefined
                // Null is a valid result, but we need to stop the conversion process as null is 
                // not convertable to anything else.
                if (tryingLookupKey === resultLookupKey ||
                    newValue === null
                ) {
                    result.earlierResult = null;    // this activates it as completed step. Should be undefined otherwise                
                    return result;  // found the actual endpoint!
                }


                // if we got a new value, try to convert it to the resultLookupKey
                // If value === undefined, we will abandon this branch
                if (newValue !== undefined) {
                    result.earlierResult = null;    // this activates it as completed step. Should be undefined otherwise                
                    // now that we have a new value, try to convert it to the resultLookupKey
                    let iResult = this.convertRecursively(newValue, tryingLookupKey, resultLookupKey, null, alreadyCheckedResultLK);
                    if (iResult.resolvedValue) {
                        // we found resultLookupKey amongst the children. Need to insert our value after it
                        // and return it.
                        result.earlierResult = iResult;
                    }
                    // we need to discard the current result to let the
                    // caller know this branch failed.
                    else 
                        result = { sourceLookupKey: sourceLookupKey, resultLookupKey: tryingLookupKey };
                    return result;
                }
            }
            catch (e) {
                if (e instanceof Error)
                {  // on error, we want to report the converter involved
                    (e as any).converter = valueForLog(dtc);
                }
                throw e;
            }
        }
        else // if (tryingLookupKey !== resultLookupKey)
        {
            // try to work toward resultLookupKey through intermediate DTCs.
            // This is a tree search, using the supportedResultLookupKeys as the branches.
            let intermediateConverters = this.compatibleSources(valueToConvert, sourceLookupKey);
            for (let intermediate of intermediateConverters) {
                for (let intermediateResultLK of intermediate.supportedResultLookupKeys()) {
                    // not the right lookup key. Try to drill down this branch.
                    if (!alreadyCheckedResultLK.has(intermediateResultLK)) {
                        alreadyCheckedResultLK.add(intermediateResultLK);
                        let iResult = this.convertRecursively(valueToConvert, sourceLookupKey, resultLookupKey, intermediateResultLK, alreadyCheckedResultLK);  //!!! recursion
                        if (iResult.resolvedValue) {    // some converter was successful, even if it set value to undefined
                            return iResult;
                        }
                        // continue our search
                    }

                }
            }
        }
        // not found
        return result;
    }    

    /**
     * Gets the first {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter}
     *  that supports the value, or null if none are found.
     * Runs the lazyloader if setup and the first search fails.
     * @param value 
     * @param sourceLookupKey 
     * @returns 
     */
    public find(value: any, sourceLookupKey: string | null, resultLookupKey: string): IDataTypeConverter | null {
        let result = this.getAll().find((dtc) => dtc.canConvert(value, sourceLookupKey, resultLookupKey)) ?? null;
        if (result === null && this.ensureLazyLoaded())
            result = this.find(value, sourceLookupKey, resultLookupKey);
        return result;        
    }

    /**
     * Finds all that support both the value and the sourceLookupKey parameter.
     * The caller can then use the supportedResultLookupKeys to build an exact match
     * test for the find() function.
     * @param value 
     * @param sourceLookupKey 
     */
    public compatibleSources(value: any, sourceLookupKey: string | null): Array<IDataTypeConverter>
    {
        let result = this.getAll().filter((dtc) => dtc.sourceIsCompatible(value, sourceLookupKey));
        if (result.length === 0 && this.ensureLazyLoaded())
            result = this.compatibleSources(value, sourceLookupKey);
        return result;        

    }

    /**
     * Logs the conversion result for a successful conversion.
     * @param result - The conversion result to log.
     */
    protected logSuccess(result: ConversionResult): void {
        this.logger.log(LoggingLevel.Info, (options) => {
            let logDetails = <LogDetails>{
                message: result.value === null ? 'Converted to null' :
                    `Converted to type "${result.resultLookupKey}"`,
                category: LoggingCategory.Result
            }
            if (options?.includeData) {
                this.addPath(result);
                logDetails.data = result;
            }
            return logDetails;
        });
    }

    /**
     * Logs a conversion that resulted in undefined, meaning the converter
     * was valid but the input value was not.
     * @param result - The conversion result containing information about the failed conversion.
     */
    protected logInvalidValue(result: ConversionResult): void {
        this.logger.log(LoggingLevel.Warn, (options) => {
            let converterName = result.converter;
            let current = result.earlierResult;
            while (current?.earlierResult != null)  // null or undefined
                current = current!.earlierResult;
            if (current)
                converterName = current.converter;

            let logDetails = <LogDetails>{
                message: `Converter "${converterName}" failed to convert the value to "${result.resultLookupKey}"`,
                category: LoggingCategory.Result
            }
            if (options?.includeData) {
                this.addPath(result);
                logDetails.data = result;
                
            }
            return logDetails;
        });
    }    
    /**
     * Adds a path property to result with all valid steps followed
     * but only if there was more than one step.
     * @param result 
     */
    protected addPath(result: ConversionResult): void {
        if (result.earlierResult !== undefined)
        {
            let path = result.sourceLookupKey ?? 'Unassigned';
            if (result.earlierResult) {
                let current: ConversionResult | null | undefined = result.earlierResult;

                while (current) {

                    path += ` -> ${current.resultLookupKey}`;
                    current = current.earlierResult;
                }
            }
            else
                path += ` -> ${result.resultLookupKey}`;
            (result as any).path = path;
        }
    }
    /**
    * Logs a warning message when a DataTypeConverter is needed but not found.
    * 
    * @param result - The ConversionResult object.
    * @param sourceValue - The source value that needs to be converted.
    */
    protected logNoConverter(result: ConversionResult, sourceValue: any): void {
        this.logger.log(LoggingLevel.Warn, (options) => {
            let sourceLookupKeyMsg = '';
            let sourceLookupKey = result.sourceLookupKey;
            if (!sourceLookupKey)
                sourceLookupKey = this.resolveLookupKey(sourceValue, null, 'DataTypeConverterService.convert');
            if (sourceLookupKey)
                sourceLookupKeyMsg = ` from "${sourceLookupKey}"`;
            let msg = `Need a DataTypeConverter to convert${sourceLookupKeyMsg} into "${result.resultLookupKey}"`;

            let logDetails = <LogDetails>{
                message: msg,
                category: LoggingCategory.Result
            }
            if (options?.includeData) {
                logDetails.data = result;
        
            }
            return logDetails;
        });        
    }    
    /**
     * Logs a message indicating that there is nothing to convert because the value is null or undefined.
     * @param result - The ConversionResult object.
     */
    protected logValueNull(result: ConversionResult): void {
        this.logger.log(LoggingLevel.Info, (options) => {
            let logDetails = <LogDetails>{
                message: `Nothing to convert. The value is null or undefined.`,
                category: LoggingCategory.Result
            }
            if (options?.includeData) {
                logDetails.data = result;
        
            }
            return logDetails;
        });
    }        

    /**
     * Logs the error result.
     * @param result - The conversion result.
     * @throws {CodingError} - Throws a CodingError if the result does not have an error.
     */
    protected logErrorResult(result: ConversionResult): void {
        if (!result.error)  // istanbul ignore next // defensive programming
            throw new CodingError('logWithError called without an error');
        this.logger.error(result.error, (options) => {
            let logDetails = <LogDetails>{
            }
            if (options?.includeData) {
                logDetails.data = result;
            }
            return logDetails;
        });
    }

    protected logConverterFound(instance: any, sourceLookupKey: string | null, resultLookupKey: string): void {
        this.logger.message(LoggingLevel.Debug, () => `Using ${valueForLog(instance)} to convert from "${sourceLookupKey ?? 'unassigned'}" to "${resultLookupKey}".`);
    }

}
