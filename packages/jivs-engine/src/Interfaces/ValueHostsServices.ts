/**
 * Services that are needed by ValueHostsManager
 * @module Services/Types/IValueHostsServices
 */

import { IValueHostFactory } from './ValueHost';
import { IServices } from './Services';
import { ILoggerService } from './LoggerService';
import { ICultureService } from './CultureService';
import { ITextLocalizerService } from './TextLocalizerService';
import { ILookupKeyFallbackService } from './LookupKeyFallbackService';
import { IDataTypeConverterService } from './DataTypeConverterService';
import { IDataTypeIdentifierService } from './DataTypeIdentifierService';
import { IDataTypeComparerService } from './DataTypeComparerService';
import { IConditionFactory } from './Conditions';
import { IValueHostConfigMergeService } from './ConfigMergeService';

/**
 * Services that are needed by ValueHostsManager
 */
export interface IValueHostsServices extends IServices
{

    /**
     * Service to get the ILogger instance that replaces
     * tokens in messages.
     * Defaults to using the global defaultLoggerService
     */
    loggerService: ILoggerService;    


    /**
     * Factory for generating classes that implement IValueHost that use ValueHostConfig.
     */
    valueHostFactory: IValueHostFactory;    

    /**
     * Service for identifying cultures that you will use in the app,
     * by their CultureID  ('en', 'en-US', 'en-GB', etc), and provides
     * fallbacks for when a requested CultureID is not found.
     */
    cultureService: ICultureService;


    /**
     * Factory to create Condition objects.
     */
    conditionFactory: IConditionFactory;

    /**
     * Service for identifing the Data Type Lookup Key associated with a data type
     * using {@link DataTypes/Types/IDataTypeIdentifier!IDataTypeIdentifier | IDataTypeIdentifier} instances.
     */
    dataTypeIdentifierService: IDataTypeIdentifierService;
    
    /**
     * Service for changing the original value into 
     * something that you want a condition to evaluate
     * using {@link DataTypes/Types/IDataTypeConverter!IDataTypeConverter | IDataTypeConverter} instances.
     */
    dataTypeConverterService: IDataTypeConverterService;
    
    /**
     * Service for changing the comparing two values
     * using {@link DataTypes/Types/IDataTypeComparer!IDataTypeComparer | IDataTypeComparer} instances.
     */
    dataTypeComparerService: IDataTypeComparerService;
    
    /**
     * Service to text localization specific, effectively mapping
     * a text key to a language specific version of that text.
     * Error messages and IDataTypeFormatters use this.
     */
    textLocalizerService: ITextLocalizerService;

    /**
     * Service for creating a relationship between a lookup key and another
     * that is the base data type it is built around.
     * For example, LookupKey.Integer uses a number as the base data type.
     * So it has a relationship with LookupKey.Number.
     * This service keeps these relationships. The DataTypeFormatterService and DataTypeParserService
     * consume this as they try to find the best fitting Formatter or Parser.
     * So go ahead and assign your ValueHost.datatype to LookupKey.Integer.
     * If there is no IntegerParser (there isn't), expect to be using the NumberParser.
     */
    lookupKeyFallbackService: ILookupKeyFallbackService;

    /**
     * Service to get the IValueHostConfigMergeService instance that 
     * determines how to merge ValueHost configurations from business logic and UI.
     */
    valueHostConfigMergeService: IValueHostConfigMergeService;
}
