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
        expect(testItem.ActiveCultureId).toBe('en');        
        let x: any;
        expect(() => x = testItem.ConditionFactory).toThrow(/ConditionFactory/);
        expect(() => x = testItem.DataTypeServices).toThrow(/DataTypeServices/);
        expect(() => x = testItem.MessageTokenResolverService).toThrow(/MessageTokenResolverService/);
        expect(testItem.LoggerService).toBeInstanceOf(ConsoleLogger);
        expect(testItem.ValueHostFactory).toBeInstanceOf(ValueHostFactory);
        expect(testItem.InputValidatorFactory).toBeInstanceOf(InputValidatorFactory);
        expect(testItem.TextLocalizerService).toBeInstanceOf(TextLocalizerService);
    });
});
describe('Replace factories and services', () => {
    test('Replace ConditionFactory', () => {
        let replacement = new ConditionFactory();

        let testItem = new ValidationServices();
        testItem.ConditionFactory = replacement;
        expect(testItem.ConditionFactory).toBe(replacement);
    });
    test('Replace DataTypeServices', () => {
        let replacement = new DataTypeServices();
        let testItem = new ValidationServices();
        testItem.DataTypeServices = replacement;
        expect(testItem.DataTypeServices).toBe(replacement);
    });
    test('Replace TextLocalizerService', () => {
        let replacement = new TextLocalizerService();

        let testItem = new ValidationServices();
        testItem.TextLocalizerService = replacement;
        expect(testItem.TextLocalizerService).toBe(replacement);
    });    
    test('Replace MessageTokenResolverService', () => {
        let replacement = new MessageTokenResolver();

        let testItem = new ValidationServices();
        testItem.MessageTokenResolverService = replacement;
        expect(testItem.MessageTokenResolverService).toBe(replacement);
    });
    test('Replace LoggerService', () => {
        let replacement = new MockCapturingLogger();
        let testItem = new ValidationServices();
        testItem.LoggerService = replacement;
        expect(testItem.LoggerService).toBe(replacement);
    });    
    test('Replace ValueHostFactory', () => {
        let replacement = new ValueHostFactory();
        let testItem = new ValidationServices();
        testItem.ValueHostFactory = replacement;
        expect(testItem.ValueHostFactory).toBe(replacement);
    });    
    test('Replace InputValidatorFactory', () => {
        let replacement = new InputValidatorFactory();
        let testItem = new ValidationServices();
        testItem.InputValidatorFactory = replacement;
        expect(testItem.InputValidatorFactory).toBe(replacement);
    });    
    test('Replace ActiveCultureID', () => {
        let replacement = 'fr';
        let testItem = new ValidationServices();
        testItem.ActiveCultureId = replacement;
        expect(testItem.ActiveCultureId).toBe(replacement);
    });    
});
describe('ValueHostFactory', () => {
    test('Set and Get', () => {
        let testItem = new ValidationServices();
        let factory = new ValueHostFactory();
        testItem.ValueHostFactory = factory;
        expect(testItem.ValueHostFactory).toBe(factory);
        expect(() => testItem.ValueHostFactory = null!).toThrow();
    });
    test('Get without Set returns a default ValueHostFactory', () => {
        let testItem = new ValidationServices();
        let x: any;
        expect(() => x = testItem.ValueHostFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValueHostFactory);
    });
  
});
describe('InputValidatorFactory', () => {
    test('Set and Get', () => {
        let testItem = new ValidationServices();
        let factory = new InputValidatorFactory();
        testItem.InputValidatorFactory = factory;
        expect(testItem.InputValidatorFactory).toBe(factory);
        expect(() => testItem.InputValidatorFactory = null!).toThrow();
    });
    test('Get without Set throws', () => {
        let testItem = new ValidationServices();
        let x: any;
        expect(() => x = testItem.InputValidatorFactory).not.toThrow();
        expect(x).toBeInstanceOf(InputValidatorFactory);
    });
  
});
