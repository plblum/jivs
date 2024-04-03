import { ValidationServices } from "@plblum/jivs-engine/src/Services/ValidationServices";
import { TextLocalizerService } from '@plblum/jivs-engine/src/Services/TextLocalizerService';
import { DataTypeComparerService } from '@plblum/jivs-engine/src/Services/DataTypeComparerService';
import { DataTypeConverterService } from '@plblum/jivs-engine/src/Services/DataTypeConverterService';
import { DataTypeIdentifierService } from '@plblum/jivs-engine/src/Services/DataTypeIdentifierService';
import { DataTypeFormatterService } from '@plblum/jivs-engine/src/Services/DataTypeFormatterService';
import { AutoGenerateDataTypeCheckService } from '@plblum/jivs-engine/src/Services/AutoGenerateDataTypeCheckService';
import { ConditionFactory } from '@plblum/jivs-engine/src/Conditions/ConditionFactory';
import { LoggingLevel } from '@plblum/jivs-engine/src/Interfaces/LoggerService';
import { ConsoleLoggerService } from "@plblum/jivs-engine/src/Services/ConsoleLoggerService";
import { MessageTokenResolverService } from "@plblum/jivs-engine/src/Services/MessageTokenResolverService";

export function createMinimalValidationServices(): ValidationServices {
    let vs = new ValidationServices();

    vs.activeCultureId = 'en';

    vs.conditionFactory = new ConditionFactory();
    // no Conditions pre-installed

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

    let ag = new AutoGenerateDataTypeCheckService();
    vs.autoGenerateDataTypeCheckService = ag; 
    // no DataTypeCheckGenerators pre-installed

    vs.textLocalizerService = new TextLocalizerService();

    vs.loggerService = new ConsoleLoggerService(LoggingLevel.Error);

    vs.messageTokenResolverService = new MessageTokenResolverService();

    return vs;
}
