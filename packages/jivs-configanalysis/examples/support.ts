import { BuildersFactoryInstaller } from '@plblum/jivs-builder/build/Services/BuildersFactoryInstaller';
import { DataTypeCheckCondition, DataTypeCheckConditionConfig } from "@plblum/jivs-engine/build/Conditions/ConcreteConditions";
import { ConditionFactory } from '@plblum/jivs-engine/build/Conditions/ConditionFactory';
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { DataTypeCheckGeneratorService } from '@plblum/jivs-engine/build/Services/DataTypeCheckGeneratorService';
import { ValidatorConfigMergeService, ValueHostConfigMergeService } from '@plblum/jivs-engine/build/Services/ConfigMergeService';
import { ConsoleLoggingService } from "@plblum/jivs-engine/build/Services/ConsoleLoggingService";
import { DataTypeComparerService } from '@plblum/jivs-engine/build/Services/DataTypeComparerService';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { DataTypeFormatterService } from '@plblum/jivs-engine/build/Services/DataTypeFormatterService';
import { DataTypeIdentifierService } from '@plblum/jivs-engine/build/Services/DataTypeIdentifierService';
import { DataTypeParserService } from '@plblum/jivs-engine/build/Services/DataTypeParserService';
import { MessageTokenResolverService } from "@plblum/jivs-engine/build/Services/MessageTokenResolverService";
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import { JivsServices } from "@plblum/jivs-engine/build/Services/JivsServices";

new BuildersFactoryInstaller();  // this will install buildersFactory on JivsServices.prototype



export function createMinimalJivsServices(defaultCultureId: string): JivsServices {
    let vs = new JivsServices(defaultCultureId);

    vs.conditionFactory = new ConditionFactory();
    // no Conditions pre-installed except DataTypecheck because
    // we are leaving on autogenerate (dataTypeCheckGeneratorService.enabled = true)
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

    let ag = new DataTypeCheckGeneratorService();
    vs.dataTypeCheckGeneratorService = ag; 
    // no DataTypeCheckGenerators pre-installed

    vs.errorMessagesService = new ErrorMessagesService();

    vs.loggingService = new ConsoleLoggingService(LoggingLevel.Error);

    vs.messageTokenResolverService = new MessageTokenResolverService();

    vs.valueHostConfigMergeService = new ValueHostConfigMergeService();
    vs.validatorConfigMergeService = new ValidatorConfigMergeService();

    return vs;
}
