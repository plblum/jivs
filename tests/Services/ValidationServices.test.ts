import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { DataTypeServices } from "../../src/DataTypes/DataTypeServices";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { MockCapturingLogger } from "../Mocks";
import { InputValidatorFactory } from "../../src/ValueHosts/InputValidator";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { ConsoleLogger } from "../../src/Services/ConsoleLogger";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";

describe('constructor and initial properties, many taken from ValGlobals', () => {
    test('Has parameters', () => {

        let testItem = new ValidationServices();
        // check defaults for factories and services
        expect(testItem.activeCultureId).toBe('en');        
        let x: any;
        expect(() => x = testItem.conditionFactory).toThrow(/ConditionFactory/);
        expect(() => x = testItem.dataTypeServices).toThrow(/DataTypeServices/);
        expect(() => x = testItem.messageTokenResolverService).toThrow(/MessageTokenResolverService/);
        expect(testItem.loggerService).toBeInstanceOf(ConsoleLogger);
        expect(testItem.valueHostFactory).toBeInstanceOf(ValueHostFactory);
        expect(testItem.inputValidatorFactory).toBeInstanceOf(InputValidatorFactory);
        expect(testItem.textLocalizerService).toBeInstanceOf(TextLocalizerService);
    });
});
describe('Replace factories and services', () => {
    test('Replace conditionFactory', () => {
        let replacement = new ConditionFactory();

        let testItem = new ValidationServices();
        testItem.conditionFactory = replacement;
        expect(testItem.conditionFactory).toBe(replacement);
    });
    test('Replace dataTypeServices', () => {
        let replacement = new DataTypeServices();
        let testItem = new ValidationServices();
        testItem.dataTypeServices = replacement;
        expect(testItem.dataTypeServices).toBe(replacement);
    });
    test('Replace textLocalizerService', () => {
        let replacement = new TextLocalizerService();

        let testItem = new ValidationServices();
        testItem.textLocalizerService = replacement;
        expect(testItem.textLocalizerService).toBe(replacement);
    });    
    test('Replace messageTokenResolverService', () => {
        let replacement = new MessageTokenResolver();

        let testItem = new ValidationServices();
        testItem.messageTokenResolverService = replacement;
        expect(testItem.messageTokenResolverService).toBe(replacement);
    });
    test('Replace loggerService', () => {
        let replacement = new MockCapturingLogger();
        let testItem = new ValidationServices();
        testItem.loggerService = replacement;
        expect(testItem.loggerService).toBe(replacement);
    });    
    test('Replace valueHostFactory', () => {
        let replacement = new ValueHostFactory();
        let testItem = new ValidationServices();
        testItem.valueHostFactory = replacement;
        expect(testItem.valueHostFactory).toBe(replacement);
    });    
    test('Replace inputValidatorFactory', () => {
        let replacement = new InputValidatorFactory();
        let testItem = new ValidationServices();
        testItem.inputValidatorFactory = replacement;
        expect(testItem.inputValidatorFactory).toBe(replacement);
    });    
    test('Replace activeCultureID', () => {
        let replacement = 'fr';
        let testItem = new ValidationServices();
        testItem.activeCultureId = replacement;
        expect(testItem.activeCultureId).toBe(replacement);
    });    
});
describe('valueHostFactory property', () => {
    test('Set and Get', () => {
        let testItem = new ValidationServices();
        let factory = new ValueHostFactory();
        testItem.valueHostFactory = factory;
        expect(testItem.valueHostFactory).toBe(factory);
        expect(() => testItem.valueHostFactory = null!).toThrow();
    });
    test('Get without Set returns a default ValueHostFactory', () => {
        let testItem = new ValidationServices();
        let x: any;
        expect(() => x = testItem.valueHostFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValueHostFactory);
    });
  
});
describe('inputValidatorFactory property', () => {
    test('Set and Get', () => {
        let testItem = new ValidationServices();
        let factory = new InputValidatorFactory();
        testItem.inputValidatorFactory = factory;
        expect(testItem.inputValidatorFactory).toBe(factory);
        expect(() => testItem.inputValidatorFactory = null!).toThrow();
    });
    test('Get without Set throws', () => {
        let testItem = new ValidationServices();
        let x: any;
        expect(() => x = testItem.inputValidatorFactory).not.toThrow();
        expect(x).toBeInstanceOf(InputValidatorFactory);
    });
  
});
