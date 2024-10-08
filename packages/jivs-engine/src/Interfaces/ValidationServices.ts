/**
 * Provides a dependency injection approach to this library.
 * @module Services/Types/IValidationServices
 */

import { IAutoGenerateDataTypeCheckService } from './AutoGenerateDataTypeCheckService';
import { IDataTypeFormatterService } from './DataTypeFormatterService';
import { IValidatorFactory } from './Validator';
import { IMessageTokenResolverService } from './MessageTokenResolverService';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';
import { IDataTypeParserService } from './DataTypeParserService';
import { IValidatorConfigMergeService } from './ConfigMergeService';

/**
 * Full interface representation of ValidationServices.
 */
export interface IValidationServices extends IValueHostsServices {


    /**
     * Service for formatting data types used within tokens of error messages
    *  using {@link DataTypes/Types/IDataTypeFormatter!IDataTypeFormatter | IDataTypeFormatter} instances.
     */
    dataTypeFormatterService: IDataTypeFormatterService;


    /**
     * Service for parsing strings into the native data type
     */
    dataTypeParserService: IDataTypeParserService;

    /**
     * Service that supports automatic generation of Conditions for the Data Type Check
     * using {@link DataTypes/Types/IDataTypeCheckGenerator!IDataTypeCheckGenerator | IDataTypeCheckGenerator} instances.
     */
    autoGenerateDataTypeCheckService: IAutoGenerateDataTypeCheckService;

    /**
     * Service to get the IMessageTokenResolver instance that replaces
     * tokens in messages.
     */
    messageTokenResolverService: IMessageTokenResolverService;
    
    /**
     * Service to get the IValidatorConfigMergeService instance that 
     * determines how to merge Validator configurations from business logic and UI.
     */
    validatorConfigMergeService: IValidatorConfigMergeService;

    /**
     * Factory for generating Validator.
     */
    validatorFactory: IValidatorFactory;

}

/**
 * Names for services supported by IValidationServices.getService.
 * Users can add other services to IValidationService simply by providing
 * a unique name. It doesn't have to be in this type.
 */
export enum ServiceName {
    /**
     * IDataTypeFormatterService
     */
    formatter = 'Formatter',
    /**
     * IDataTypeConverterService
     */    
    converter = 'Converter',
    /**
     * IDataTypeComparerService
     */    
    comparer = 'Comparer',
    /**
     * IDataTypeIdentifierService
     */    
    identifier = 'Identifier',
    /**
     * IAutoGenerateDataTypeCheckService
     */    
    autoGenerator = 'AutoGenerator',
    /**
     * IDataTypeParserService
     */
    parser = 'Parser',

    /**
     * ICultureService
     */
    culture = 'Culture',
    /**
     * ILoggerService
     */    
    logger = 'Logger',
    /**
     * IConditionsFactory
     */    
    conditionFactory = 'ConditionFactory',

    /**
     * ILookupKeyFallbackService
     */
    lookupKeyFallback = 'LookupKeyFallback',
    /**
     * ITextLocalizerService
     */
    textLocalizer = 'TextLocalizer',
     /**
     * IMessageTokenResolver
     */
    messageTokenResolver = 'MessageTokenResolver',

    /**
     * IValueHostConfigMergeService
     */
    valueHostConfigMerge = 'valueHostConfigMerge',

    /**
     * IValidatorConfigMergeService
     */
    validatorConfigMerge = 'validatorConfigMerge',    
    /**
     * IValueHostFactory
     */
    valueHostFactory = 'ValueHostFactory',
    /**
     * IValidatorFactory
     */
    validatorFactory = 'ValidatorFactory',

    /**
     * IManagerConfigBuilderFactory
     */
    managerConfigBuilder = 'managerConfigBuilder',

    /**
     * IManagerConfigModifierFactory
     */
    managerConfigModifier = 'managerConfigModifier',

    /**
     * IModelToValuesFactory - in jivs-model
     */
    modelToValuesFactory = 'ModelToValuesFactory',
    /**
     * IValuesToModelFactory - in jivs-ssot
     */
    valuesToModelFactory = 'ValuesToModelFactory'

}
