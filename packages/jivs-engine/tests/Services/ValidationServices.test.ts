import { ValidationServices } from "../../src/Services/ValidationServices";
import { ValidatorFactory } from "../../src/Validation/Validator";
import { AutoGenerateDataTypeCheckService } from "../../src/Services/AutoGenerateDataTypeCheckService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { DataTypeParserService } from "../../src/Services/DataTypeParserService";
import { ValidatorConfigMergeService } from "../../src/Services/ConfigMergeService";
import { ValidationManagerConfigBuilderFactory } from "../../src/Services/ManagerConfigBuilderFactory";
import { ValidationManagerConfigModifierFactory } from "../../src/Services/ManagerConfigModifierFactory";
import { ValidationManagerConfigAnalysisService } from "../../src/Services/ConfigAnalysisService/ConfigAnalysisService";

describe('constructor and initial properties, many taken from ValGlobals', () => {
    test('Has parameters', () => {
// NOTE: Ignores services that were covered by ValueHostsServices
        let testItem = new ValidationServices();
      
        let x: any;
        expect(() => x = testItem.dataTypeFormatterService).toThrow(/dataTypeFormatterService/);
        expect(() => x = testItem.dataTypeParserService).toThrow(/dataTypeParserService/);
        expect(() => x = testItem.autoGenerateDataTypeCheckService).toThrow(/autoGenerateDataTypeCheckService/);
        expect(() => x = testItem.messageTokenResolverService).toThrow(/MessageTokenResolverService/);       
        expect(testItem.validatorFactory).toBeInstanceOf(ValidatorFactory);
        expect(testItem.configAnalysisService).toBeInstanceOf(ValidationManagerConfigAnalysisService);
        expect(testItem.validatorConfigMergeService).toBeInstanceOf(ValidatorConfigMergeService);
        expect(testItem.managerConfigBuilderFactory).toBeInstanceOf(ValidationManagerConfigBuilderFactory);
        expect(testItem.managerConfigModifierFactory).toBeInstanceOf(ValidationManagerConfigModifierFactory);  

    });
});
describe('Replace factories and services', () => {
// NOTE: Ignores services that were covered by ValueHostsServices
    test('Replace dataTypeFormatterService', () => {
        let replacement = new DataTypeFormatterService();
        let testItem = new ValidationServices();
        testItem.dataTypeFormatterService = replacement;
        expect(testItem.dataTypeFormatterService).toBe(replacement);
    });
    test('Replace dataTypeParserService', () => {
        let replacement = new DataTypeParserService();
        let testItem = new ValidationServices();
        testItem.dataTypeParserService = replacement;
        expect(testItem.dataTypeParserService).toBe(replacement);
    });    
    test('Replace autoGenerateDataTypeCheckService', () => {
        let replacement = new AutoGenerateDataTypeCheckService();
        let testItem = new ValidationServices();
        testItem.autoGenerateDataTypeCheckService = replacement;
        expect(testItem.autoGenerateDataTypeCheckService).toBe(replacement);
    });    
    test('Replace messageTokenResolverService', () => {
        let replacement = new MessageTokenResolverService();

        let testItem = new ValidationServices();
        testItem.messageTokenResolverService = replacement;
        expect(testItem.messageTokenResolverService).toBe(replacement);
    });
    test('Replace validatorConfigMergeService', () => {
        let replacement = new ValidatorConfigMergeService();

        let testItem = new ValidationServices();
        testItem.validatorConfigMergeService = replacement;
        expect(testItem.validatorConfigMergeService).toBe(replacement);
    });    
    test('Replace validatorFactory', () => {
        let replacement = new ValidatorFactory();
        let testItem = new ValidationServices();
        testItem.validatorFactory = replacement;
        expect(testItem.validatorFactory).toBe(replacement);
    });    

});

describe('validatorFactory property', () => {
    test('Set and Get', () => {
        let testItem = new ValidationServices();
        let factory = new ValidatorFactory();
        testItem.validatorFactory = factory;
        expect(testItem.validatorFactory).toBe(factory);
        expect(() => testItem.validatorFactory = null!).toThrow();
    });
    test('Get without Set throws', () => {
        let testItem = new ValidationServices();
        let x: any;
        expect(() => x = testItem.validatorFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValidatorFactory);
    });
  
});

describe('dispose', () => {
// NOTE: Ignores services that were covered by ValueHostsServices
    
    test('accessing any service after dispose throws a TypeError', () => {
        let testItem = new ValidationServices();
        testItem.autoGenerateDataTypeCheckService = new AutoGenerateDataTypeCheckService();
        testItem.dataTypeFormatterService = new DataTypeFormatterService();
        testItem.dataTypeParserService = new DataTypeParserService();
        testItem.messageTokenResolverService = new MessageTokenResolverService();
        testItem.validatorConfigMergeService = new ValidatorConfigMergeService();
        testItem.validatorFactory = new ValidatorFactory();
        testItem.dispose();
        expect(() => testItem.autoGenerateDataTypeCheckService).toThrow(TypeError);
        expect(() => testItem.dataTypeFormatterService).toThrow(TypeError);
        expect(() => testItem.dataTypeParserService).toThrow(TypeError);
        expect(() => testItem.messageTokenResolverService).toThrow(TypeError);
        expect(() => testItem.validatorConfigMergeService).toThrow(TypeError);
        expect(() => testItem.validatorFactory).toThrow(TypeError);

    });
});