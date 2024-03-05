import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { DataTypeResolver } from "../../src/DataTypes/DataTypeResolver";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { valGlobals } from "../../src/Services/ValidationGlobals";
import { MockCapturingLogger } from "../Mocks";

describe('constructor and initial properties, many taken from ValGlobals', () => {
    test('Has parameters', () => {

        let testItem = new ValidationServices();
        // check defaults for factories and services
        expect(testItem.ConditionFactory).toBe(valGlobals.GetDefaultConditionFactory());
        expect(testItem.DataTypeResolverService).toBe(valGlobals.GetDefaultDataTypeResolver());
        expect(testItem.MessageTokenResolverService).toBe(valGlobals.GetDefaultMessageTokenResolver());
        expect(testItem.LoggerService).toBe(valGlobals.GetDefaultLogger());
    });
});
describe('Replace factories and services', () => {
    test('Replace ConditionFactory', () => {
        let replacement = new ConditionFactory();

        let testItem = new ValidationServices();
        testItem.ConditionFactory = replacement;
        expect(testItem.ConditionFactory).toBe(replacement);
    });
    test('Replace DataTypeResolverService', () => {
        let replacement = new DataTypeResolver();
        let testItem = new ValidationServices();
        testItem.DataTypeResolverService = replacement;
        expect(testItem.DataTypeResolverService).toBe(replacement);
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
});