/**
 * Creates the ValidationServices object with all service objects, but very few pre-installed
 * objects added to the factories. It targets examples where we want to show specific objects
 * being added. It uses ConsoleLoggerService with LoggingLevel.Error.
 * 
 * Remember that once you get the result of the createMinimalValidationServices() function, you can
 * replace the services with your own objects, and populate the factories.
 * @module Support/CreateMinimalValidationServices
 */

import { DataTypeCheckConditionConfig, DataTypeCheckCondition } from "../Conditions/ConcreteConditions";
import { ConditionFactory } from "../Conditions/ConditionFactory";
import { ConditionType } from "../Conditions/ConditionTypes";
import { LoggingLevel } from "../Interfaces/LoggerService";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { AutoGenerateDataTypeCheckService } from "../Services/AutoGenerateDataTypeCheckService";
import { ValueHostConfigMergeService, ValidatorConfigMergeService } from "../Services/ConfigMergeService";
import { ConsoleLoggerService } from "../Services/ConsoleLoggerService";
import { DataTypeComparerService } from "../Services/DataTypeComparerService";
import { DataTypeConverterService } from "../Services/DataTypeConverterService";
import { DataTypeFormatterService } from "../Services/DataTypeFormatterService";
import { DataTypeIdentifierService } from "../Services/DataTypeIdentifierService";
import { DataTypeParserService } from "../Services/DataTypeParserService";
import { MessageTokenResolverService } from "../Services/MessageTokenResolverService";
import { TextLocalizerService } from "../Services/TextLocalizerService";
import { ValidationServices } from "../Services/ValidationServices";


/**
 * Creates the ValidationServices object with all service objects, but very few pre-installed
 * objects added to the factories. It targets examples where we want to show specific objects
 * being added. It uses ConsoleLoggerService with LoggingLevel.Error.
 * 
 * Remember that once you get the result of the createMinimalValidationServices() function, you can
 * replace the services with your own objects, and populate the factories.
 * @param activeCultureId 
 * @returns 
 */
export function createMinimalValidationServices(activeCultureId: string): IValidationServices {
    let vs = new ValidationServices();

    vs.loggerService = new ConsoleLoggerService(LoggingLevel.Error);

    // --- CultureServices ----------------------------
    vs.cultureService.activeCultureId = activeCultureId; // set this to your default culture

    vs.conditionFactory = new ConditionFactory();
    // no Conditions pre-installed except DataTypecheck because
    // we are leaving on autogenerate (autoGenerateDataTypeCheckService.enabled = true)
    (vs.conditionFactory as ConditionFactory).register<DataTypeCheckConditionConfig>(
        ConditionType.DataTypeCheck, (config) => new DataTypeCheckCondition(config));

    let dtis = new DataTypeIdentifierService();
    vs.dataTypeIdentifierService = dtis; 
    // Number, String, Boolean and Date are preinstalled

    let dtfs = new DataTypeFormatterService();
    vs.dataTypeFormatterService = dtfs;
    // no Formatters pre-installed

    let dtcs = new DataTypeConverterService();
    vs.dataTypeConverterService = dtcs;
    // no Converters pre-installed
    
    let dtcmps = new DataTypeComparerService();
    vs.dataTypeComparerService = dtcmps;  
    // no Comparers pre-installed

    let dtps = new DataTypeParserService();
    vs.dataTypeParserService = dtps;  
    // no Parsers pre-installed    

    let ag = new AutoGenerateDataTypeCheckService();
    vs.autoGenerateDataTypeCheckService = ag; 
    // no DataTypeCheckGenerators pre-installed

    vs.textLocalizerService = new TextLocalizerService();

    vs.messageTokenResolverService = new MessageTokenResolverService();

    vs.valueHostConfigMergeService = new ValueHostConfigMergeService();
    vs.validatorConfigMergeService = new ValidatorConfigMergeService();

    return vs;
}
