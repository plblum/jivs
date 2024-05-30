/**
 * {@inheritDoc Services/ConcreteClasses/DataTypeParserService!DataTypeParserService:class}
 * @module Services/ConcreteClasses/DataTypeParserService
 */

import { valueForLog } from '../Utilities/Utilities';
import { IDataTypeParserService } from '../Interfaces/DataTypeParserService';
import { IDataTypeParser } from '../Interfaces/DataTypeParsers';
import { DataTypeResolution } from '../Interfaces/DataTypes';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError, SevereErrorBase, assertNotEmptyString, assertNotNull, ensureError } from '../Utilities/ErrorHandling';
import { DataTypeServiceBase } from './DataTypeServiceBase';
import { LookupKeyFallbackService } from './LookupKeyFallbackService';

/**
 * A service for parsing strings into the native data type
 * using {@link DataTypes/Types/IDataTypeParser!IDataTypeParser | IDataTypeParser} instances.
 * 
 * This class is available on {@link Services/ConcreteClasses/ValidationServices!ValidationServices.dataTypeParserService | ValidationServices.dataTypeParserService}.
 */
export class DataTypeParserService extends DataTypeServiceBase<IDataTypeParser<any>>
    implements IDataTypeParserService {
    protected indexOfExisting(item: IDataTypeParser<any>): number {
        return -1;  // register does not replace existing
    }
    /**
     * Parse the text supplied, attempting to create another value from it that will be returned.
     * The new value may be a different data type, 
     * whether primitive or an object that you have registered with DataTypeIdentifier.
     * If parsing fails, return an error message instead of a value.
     * If the text is the empty string, it is up to the parser to determine what to do
     * (return the empty string, null, a default value of the expected type, or an error message.)
     * The implementation should not throw an exception for a parsing error. Exceptions are permitted
     * for configuration errors, such as a missing culture.
     * If no parser was available, it returns an error in DataTypeResolution.
     * @param text 
     * @param lookupKey - A lookup key that identifies the desired parser.
     * This is expected to come from the valueHost.parserLookupKey or if null,
     * valueHost.dataType.
     * If no parser is found for this, the LookupKeyFallbackService is used to find another to try.
     * @param cultureId - Such as 'en-US' and 'en'
     */
    public parse<T>(text: string, lookupKey: string, cultureId: string): DataTypeResolution<T> {
        return this.parseRecursive(text, lookupKey, cultureId, new Set<string>());
    }
    protected parseRecursive<T>(text: string, lookupKey: string, cultureId: string, alreadyChecked: Set<string>): DataTypeResolution<T> {
        assertNotEmptyString(lookupKey, 'lookupKey');
        try {
            LookupKeyFallbackService.ensureRecursionSafe(lookupKey, alreadyChecked);

            let parser = this.find(lookupKey, cultureId, text);

            if (parser) {
                // log info level the parser selected
                this.log(() => `Parser selected: ${valueForLog(parser)}`, LoggingLevel.Debug);
                let result = parser!.parse(text, lookupKey!, cultureId);
                if (result.value)
                    this.log(() => `Parsed "${lookupKey}" with culture "${cultureId}"`, LoggingLevel.Info);
                return result;
            }

            let fallbackLookupKey = this.services.lookupKeyFallbackService.find(lookupKey);
            if (fallbackLookupKey) {
                this.log(() => `Trying fallback: ${fallbackLookupKey}`, LoggingLevel.Debug);
                return this.parseRecursive(text, fallbackLookupKey, cultureId, alreadyChecked);
            }
            throw new CodingError(`No DataTypeParser for LookupKey "${lookupKey}" with culture "${cultureId}"`);
        }
        catch (e) {
            let err = ensureError(e);
            this.log(err.message, LoggingLevel.Error);
            if (err instanceof SevereErrorBase)
                throw err;
            return { errorMessage: err.message };
        }

    }

    /**
     * Return a matching DataTypeParser or null.
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    public find(lookupKey: string, cultureId: string, text: string): IDataTypeParser<any> | null {
        return this.getAll().find((dtp) => dtp.supports(lookupKey, cultureId, text)) ?? null;
    }

}
