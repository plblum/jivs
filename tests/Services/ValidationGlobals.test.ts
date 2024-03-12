import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { DataTypeServices } from "../../src/DataTypes/DataTypeServices";
import { InputValidatorFactory } from "../../src/ValueHosts/InputValidator";
import { ConsoleLogger } from "../../src/Services/ConsoleLogger";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { ResetValGlobals, valGlobals } from "../../src/Services/ValidationGlobals";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { LoggingLevel } from "../../src/Interfaces/Logger";


describe('DefaultCultureId', () => {
    test('Get with default as en', () => {
        expect(valGlobals.DefaultCultureId).toBe('en');
    });
    test('Set then get an alternative', () => {
        ResetValGlobals();
        expect(() => valGlobals.DefaultCultureId = 'fr-FR').not.toThrow();
        expect(valGlobals.DefaultCultureId).toBe('fr-FR');
    });
});

describe('DefaultCurrencyCode', () => {
    test('Get with default as USD', () => {
        expect(valGlobals.DefaultCurrencyCode).toBe('USD');
    });
    test('Set then get an alternative', () => {
        ResetValGlobals();
        expect(() => valGlobals.DefaultCurrencyCode = 'EUR').not.toThrow();
        expect(valGlobals.DefaultCurrencyCode).toBe('EUR');
    });
});
describe('Global Defaults for ValueHostFactory', () => {
    test('_valueHostFactory global', () => {
        ResetValGlobals();
        let testItem = new ValueHostFactory();
        valGlobals.SetValueHostFactory(testItem);
        expect(valGlobals.GetValueHostFactory()).toBe(testItem);
        expect(() => valGlobals.SetValueHostFactory(null!)).toThrow();
    });
    test('_valueHostFactory global null gets a default', () => {
        ResetValGlobals();
        let testItem = valGlobals.GetValueHostFactory();
        expect(testItem).not.toBeNull();
        expect(testItem).toBeInstanceOf(ValueHostFactory);
    });
  
});
describe('Global Defaults for InputValidatorFactory', () => {
    test('_inputValidatorFactory global', () => {
        ResetValGlobals();
        let testItem = new InputValidatorFactory();
        valGlobals.SetInputValidatorFactory(testItem);
        expect(valGlobals.GetInputValidatorFactory()).toBe(testItem);
        expect(() => valGlobals.SetInputValidatorFactory(null!)).toThrow();
    });
    test('_inputValidatorFactory global null gets a default', () => {
        ResetValGlobals();
        let testItem = valGlobals.GetInputValidatorFactory();
        expect(testItem).not.toBeNull();
        expect(testItem).toBeInstanceOf(InputValidatorFactory);
    });
  
});
describe('Global Defaults for ConditionFactory', () => {
    test('_defaultConditionFactory global', () => {
        ResetValGlobals();
        let testItem = new ConditionFactory();
        valGlobals.SetDefaultConditionFactory(testItem);
        expect(valGlobals.GetDefaultConditionFactory()).toBe(testItem);
        expect(() => valGlobals.SetDefaultConditionFactory(null!)).toThrow();
    });
    test('_defaultConditionFactory global null gets a default', () => {
        ResetValGlobals();
        let dts = valGlobals.GetDefaultConditionFactory();
        expect(dts).not.toBeNull();
        expect(dts).toBeInstanceOf(ConditionFactory);
    });
  
});
describe('Global Defaults for DataTypeServices', () => {
    test('DefaultDataTypeServices global', () => {
        ResetValGlobals();
        let testItem = new DataTypeServices();
        valGlobals.SetDefaultDataTypeServices(testItem);
        expect(valGlobals.GetDefaultDataTypeServices()).toBe(testItem);
        expect(() => valGlobals.SetDefaultDataTypeServices(null!)).toThrow();
    });
    test('DefaultDataTypeServices global null gets a default', () => {
        ResetValGlobals();
        let dts = valGlobals.GetDefaultDataTypeServices();
        expect(dts).not.toBeNull();
        expect(dts).toBeInstanceOf(DataTypeServices);
        expect((dts as DataTypeServices).ActiveCultureID).toBe('en');
    });
});

describe('Global Defaults for MessageTokenResolver', () => {
    test('DefaultMessageTokenResolver global', () => {
        ResetValGlobals();
        let testItem = new MessageTokenResolver();
        valGlobals.SetDefaultMessageTokenResolver(testItem);
        expect(valGlobals.GetDefaultMessageTokenResolver()).toBe(testItem);
        expect(() => valGlobals.SetDefaultMessageTokenResolver(null!)).toThrow();
    });
    test('DefaultDataTypeServices global null gets a default', () => {
        ResetValGlobals();
        let dts = valGlobals.GetDefaultMessageTokenResolver();
        expect(dts).not.toBeNull();
        expect(dts).toBeInstanceOf(MessageTokenResolver);
    });
  
});


describe('Default Logger', () => {
    test('DefaultLogger global', () => {
        ResetValGlobals();
        let testItem = new ConsoleLogger();
        valGlobals.SetDefaultLogger(testItem);
        expect(valGlobals.GetDefaultLogger()).toBe(testItem);
        expect(() => valGlobals.SetDefaultLogger(null!)).toThrow();
    });
    test('DefaultLogger global null gets a default', () => {
        ResetValGlobals();
        let testItem = valGlobals.GetDefaultLogger();
        expect(testItem).not.toBeNull();
        expect(testItem).toBeInstanceOf(ConsoleLogger);
        expect((testItem as ConsoleLogger).MinLevel).toBe(LoggingLevel.Warn);
    });
});
