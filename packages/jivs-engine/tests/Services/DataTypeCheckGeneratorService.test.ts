import { DataTypeCheckCondition, IntegerCondition, PositiveCondition, RegExpCondition, RegExpConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionConfig, ICondition, IConditionFactory } from "../../src/Interfaces/Conditions";
import { IDataTypeCheckGenerator } from "../../src/Interfaces/DataTypeCheckGenerator";
import { IFieldValueHost } from "../../src/Interfaces/FieldValueHost";
import { LoggingLevel } from "../../src/Interfaces/LoggingService";
import { DataTypeCheckGeneratorService } from "../../src/Services/DataTypeCheckGeneratorService";
import { TestingLoggingService } from "../../src/Support/TestingLoggingService";
import type { TestingJivsServices } from "../../src/Support/createJivsServicesForTesting";
import { MockJivsServices, MockValueHostsManager } from "../TestSupport/mocks";
import { createJivsServicesForTesting } from "../../src/Support/createJivsServicesForTesting";
import { finishPartialFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
import { ListOfConditionsDataTypeCheckGenerator, RegExpDataTypeCheckGenerator } from '../../src/DataTypes/DataTypeCheckGenerators';

class TestCheckGenerator implements IDataTypeCheckGenerator {
    constructor(dataTypeLookupKey: string, returns: Array<ICondition>) {
        this.dataTypeLookupKey = dataTypeLookupKey;
        this.returns = returns;
    }
    dataTypeLookupKey: string;
    returns: Array<ICondition>;
    supportsValue(dataTypeLookupKey: string): boolean {
        return this.dataTypeLookupKey === dataTypeLookupKey;
    }
    createConditions(valueHost: IFieldValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): Array<ICondition> {
        return this.returns;
    }
}

function setupTestItem(dataTypeLookupKey: string):
    {
        vhm: MockValueHostsManager,
        vh: IFieldValueHost,
        testItem: DataTypeCheckGeneratorService,
        logger: TestingLoggingService,
        services: TestingJivsServices,
    }
{
    let services = createJivsServicesForTesting({
        registerConditions: 'all',
        loggerLevel: LoggingLevel.Debug
    });

    let testItem = new DataTypeCheckGeneratorService();
    services.dataTypeCheckGeneratorService = testItem;

    let vhm = new MockValueHostsManager(services);
    let vh = vhm.addValueHost(
        finishPartialFieldValueHostConfig({
            name: 'Field1',
            dataType: dataTypeLookupKey
        }, 1), null) as IFieldValueHost;

    return {
        vhm,
        vh,
        testItem,
        logger: services.loggingService,
        services: services
    };
}

describe('register', () => {
    test('Invalid parameters', () => {
        let testItem = new DataTypeCheckGeneratorService();
        expect(() => testItem.register(null!)).toThrow(/item/);
    });
    test('Register successful', () => {
        const knownLookupKey = 'ABC';
        let testItem = new DataTypeCheckGeneratorService();
        expect(() => testItem.register(new TestCheckGenerator(knownLookupKey, []))).not.toThrow();
        expect(testItem.find(knownLookupKey)).not.toBeNull();
        expect(testItem.find('unknown')).toBeNull();
    });
});
describe('registerLookupKey', () =>
{
    test('Invalid lookup key', () => {
        let testItem = new DataTypeCheckGeneratorService();
        expect(() => testItem.registerLookupKey(null!, /^ABC$/)).toThrow(/lookupKey/);
    });
    // data parameter is invalid
    test('Invalid data parameter', () => {
        let testItem = new DataTypeCheckGeneratorService();
        const knownLookupKey = 'TEST';
        expect(() => testItem.registerLookupKey(knownLookupKey, 123 as any)).toThrow(/Unsupported data type/);
        // several cases
        expect(() => testItem.registerLookupKey(knownLookupKey, null as any)).toThrow(/data/);
        expect(() => testItem.registerLookupKey(knownLookupKey, undefined as any)).toThrow(/data/);
    });
    test('Using a regexp', () => {
        let testItem = new DataTypeCheckGeneratorService();
        const knownLookupKey = 'TEST';
        testItem.registerLookupKey(knownLookupKey, /^ABC$/);
        let result = testItem.find(knownLookupKey);
        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(RegExpDataTypeCheckGenerator);
        expect(result?.supportsValue('TEST')).toBe(true);
    });
    test('Using a string pattern', () => {
        let testItem = new DataTypeCheckGeneratorService();
        const knownLookupKey = 'TEST';
        testItem.registerLookupKey(knownLookupKey, ['ABC', 'DEF']);
        let result = testItem.find(knownLookupKey);
        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(RegExpDataTypeCheckGenerator);
        expect(result?.supportsValue('TEST')).toBe(true);
    });
    test('Using 1 ConditionConfig', () => {
        let testItem = new DataTypeCheckGeneratorService();
        const knownLookupKey = 'TEST';
        const conditionConfig: ConditionConfig = {
            conditionType: ConditionType.RegExp,
            valueHostName: 'Field1',
            expressionAsString: 'ABC'
        } as RegExpConditionConfig;
        testItem.registerLookupKey(knownLookupKey, [conditionConfig]);
        let result = testItem.find(knownLookupKey);
        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(ListOfConditionsDataTypeCheckGenerator);
    });
});
describe('autoGenerateDataTypeCondition', ()=> {
    test('Not registered lookupKey returns DataTypeCheckCondition', () => {
        let { vhm, vh, testItem, logger, services } = setupTestItem(LookupKey.String);
  
        let conditions: Array<ICondition> = [];

        expect(() => conditions = testItem.autoGenerateDataTypeConditions(vh, 'ANYTHING')).not.toThrow();
        expect(conditions.length).toBe(1);
        expect(conditions[0]).toBeInstanceOf(DataTypeCheckCondition);
        // really should test for the Config.valueHostName to be 'Field1'
        // and Type to be DataTypeCheck, but Config is protected.
        expect(logger.findMessage('DataTypeCheck', LoggingLevel.Info)).toBeTruthy();

    });
    test('Registered with a class that returns a condition. Returns an instance of that condition for the same ValueHostName', () => {
        let { vhm, vh, testItem, logger, services } = setupTestItem(LookupKey.String);

        (services.conditionFactory as ConditionFactory).register<RegExpConditionConfig>(
            ConditionType.RegExp, (config) => new RegExpCondition(config));        

        let condition: ICondition | null = new RegExpCondition({
            conditionType: ConditionType.RegExp,
            expressionAsString: 'test',
            valueHostName: vh.getName()
        });
        testItem.register(new TestCheckGenerator('ABC', [condition]));
        let result: Array<ICondition> = [];

        expect(() => result = testItem.autoGenerateDataTypeConditions(vh, 'ABC')).not.toThrow();
        expect(result.length).toBe(1);
        expect(result[0]).toBeInstanceOf(RegExpCondition);
        expect(logger.findMessage('Using TestCheckGenerator', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('RegExp', LoggingLevel.Info)).toBeTruthy();
    });    
    test('Registered with a class that returns []. Returns []', () =>
    {
        let { vhm, vh, testItem, logger, services } = setupTestItem(LookupKey.String);
        testItem.register(new TestCheckGenerator('ABC', []));

        let result: Array<ICondition> = [];
        expect(() => result = testItem.autoGenerateDataTypeConditions(vh, 'ABC')).not.toThrow();
        expect(result).toEqual([]);

        expect(logger.findMessage('Using TestCheckGenerator', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('Nothing to auto generate', LoggingLevel.Info)).toBeTruthy();
    });     
    test('Registered class is configured to emulate PositiveInteger returning DataTypeCheck, Positive, and Integer conditions.', () => {
        let { vhm, vh, testItem, logger, services } = setupTestItem(LookupKey.String);

        let condition: ICondition | null = new RegExpCondition({
            conditionType: ConditionType.RegExp,
            expressionAsString: 'test',
            valueHostName: vh.getName()
        });
        testItem.register(new TestCheckGenerator('ABC', [
            new DataTypeCheckCondition({ conditionType: ConditionType.DataTypeCheck, valueHostName: vh.getName() }),
            new PositiveCondition({ conditionType: ConditionType.Positive, valueHostName: vh.getName() }),
            new IntegerCondition({ conditionType: ConditionType.Integer, valueHostName: vh.getName()}),        
        ]));
        let result: Array<ICondition> = [];
    
        expect(() => result = testItem.autoGenerateDataTypeConditions(vh, 'ABC')).not.toThrow();
        expect(result.length).toBe(3);
        expect(result[0]).toBeInstanceOf(DataTypeCheckCondition);
        expect(result[1]).toBeInstanceOf(PositiveCondition);
        expect(result[2]).toBeInstanceOf(IntegerCondition);    
        expect(logger.findMessage('Using TestCheckGenerator', LoggingLevel.Debug)).toBeTruthy();
        expect(logger.findMessage('DataTypeCheck', LoggingLevel.Info)).toBeTruthy();
        expect(logger.findMessage('Positive', LoggingLevel.Info)).toBeTruthy();
        expect(logger.findMessage('Integer', LoggingLevel.Info)).toBeTruthy();
    });        
});
describe('lazyLoad', () => {
    class NormalCheckGenerator implements IDataTypeCheckGenerator
    {
        supportsValue(dataTypeLookupKey: string): boolean {
            return dataTypeLookupKey === 'Normal'
        }
        createConditions(valueHost: IFieldValueHost, dataTypeLookupKey: string, conditionFactory: IConditionFactory): ICondition[] {
            throw new Error("Method not implemented.");
        }
    }
    class LazyLoadCheckGenerator implements IDataTypeCheckGenerator
    {
        supportsValue(dataTypeLookupKey: string): boolean {
            return dataTypeLookupKey === 'LazyLoad'
        }
        createConditions(valueHost: IFieldValueHost, dataTypeLookupKey: string, conditionFactory: IConditionFactory): ICondition[] {
            throw new Error("Method not implemented.");
        }
    }
    test('Call to register does not lazy load', () => {
        let testItem = new DataTypeCheckGeneratorService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadCheckGenerator());
            loaded = true;
        };
        testItem.register(new NormalCheckGenerator());
        expect(loaded).toBe(false);
    });
    test('Call to find for already registered does not lazy load', () => {
        let testItem = new DataTypeCheckGeneratorService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadCheckGenerator());
            loaded = true;
        };
        testItem.register(new NormalCheckGenerator());
        expect(loaded).toBe(false);
        expect(testItem.find('Normal')).toBeInstanceOf(NormalCheckGenerator);  // looks for NumberCheckGenerator
        expect(loaded).toBe(false);
 
    });
    test('Call to find for unregistered does load but later find does not load for unregistered', () => {
        let testItem = new DataTypeCheckGeneratorService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadCheckGenerator());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find('LazyLoad')).toBeInstanceOf(LazyLoadCheckGenerator);
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find('Normal')).toBeNull();      // Number support not registered
        expect(loaded).toBe(false);
    });
    test('Call to find for unregistered does load but fails to load what it needs but has loaded one we use later', () => {
        let testItem = new DataTypeCheckGeneratorService();
        let loaded = false;
        testItem.lazyLoad = (service) => {
            service.register(new LazyLoadCheckGenerator());
            loaded = true;
        };

        expect(loaded).toBe(false);
        expect(testItem.find('Normal')).toBeNull();      // Number support not registered
        expect(loaded).toBe(true);
        // at this point, lazyLoad should be discarded. So another request should not load
        loaded = false;
        expect(testItem.find('LazyLoad')).toBeInstanceOf(LazyLoadCheckGenerator);
        expect(loaded).toBe(false);
    });    
});