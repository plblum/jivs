import { RequireTextConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionEvaluateResult, ConditionCategory } from "../../src/Interfaces/Conditions";
import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { CapturingLogger } from "../../src/Support/CapturingLogger";
import {
    registerTestingOnlyConditions, NeverMatchesConditionType, AlwaysMatchesConditionType, EvaluatesAsPromiseConditionType,
    resultTypeToConditionType, makeDisposable,
    DisposableConditionType
} from "../../src/Support/conditionsForTesting";
import { WhenCondition, WhenConditionConfig } from "../../src/Conditions/WhenCondition";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";
import { CodingError } from "../../src/Utilities/ErrorHandling";

describe('WhenCondition', () => {
    test('DefaultConditionType', () => {
        expect(WhenCondition.DefaultConditionType).toBe(ConditionType.When);
    });    
    function testEvaluateWithEnabler(enablerResult: ConditionEvaluateResult, childResult: ConditionEvaluateResult,
        expectedResult: ConditionEvaluateResult, logContent?: string) {

        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let enablerConfig: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: resultTypeToConditionType(enablerResult) },
            childConditionConfig: { conditionType: resultTypeToConditionType(childResult) }
        };

        let testItem = new WhenCondition(enablerConfig);
        
        expect(testItem.evaluate(null, vm)).toBe(expectedResult);
        expect(testItem.evaluate(vh, vm)).toBe(expectedResult);
        if (logContent) {
            expect(logger.findMessage(logContent, LoggingLevel.Info, null)).toBeTruthy();
        }
    }
    test('evaluate with enabler always returning Match results in condition evaluate and returning its own value', () => {
        testEvaluateWithEnabler(ConditionEvaluateResult.Match, ConditionEvaluateResult.Match, ConditionEvaluateResult.Match);
        testEvaluateWithEnabler(ConditionEvaluateResult.Match, ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.NoMatch);
        testEvaluateWithEnabler(ConditionEvaluateResult.Match, ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.Undetermined);
    });
    test('evaluate with enabler always returning NoMatch results in condition evaluate and returning Undetermined', () => {
        testEvaluateWithEnabler(ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.Match, ConditionEvaluateResult.Undetermined, 'did not match');
        testEvaluateWithEnabler(ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.Undetermined, 'did not match');
        testEvaluateWithEnabler(ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.Undetermined, 'did not match');
    });
    test('evaluate with enabler always returning Undetermined results in condition evaluate and returning Undetermined', () => {
        testEvaluateWithEnabler(ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.Match, ConditionEvaluateResult.Undetermined, 'did not match');
        testEvaluateWithEnabler(ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.NoMatch, ConditionEvaluateResult.Undetermined, 'did not match');
        testEvaluateWithEnabler(ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.Undetermined, ConditionEvaluateResult.Undetermined, 'did not match');
    });

    test('with invalid childconfig but valid enabler that returns Match, logs error and evaluate returns undetermined', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: { conditionType: 'UnknownType' }
        };

        let testItem = new WhenCondition(config);
        
        expect(()=> testItem.evaluate(null, vm)).toThrow(CodingError);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('ConditionType not registered', LoggingLevel.Error, null)).toBeTruthy();

    });
    test('with null childconfig but valid enabler that returns Match, logs error and evaluate returns undetermined', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: null!
        };

        let testItem = new WhenCondition(config);
        
        expect(()=> testItem.evaluate(null, vm)).toThrow(CodingError);
        expect(logger.findMessage('childConditionConfig: must be assigned to a Condition', LoggingLevel.Error, null)).toBeTruthy();

    });    
    test('with invalid enablerConfig, logs error and evaluate returns undetermined', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: 'UnknownType' },
            childConditionConfig: { conditionType: AlwaysMatchesConditionType }
        };

        let testItem = new WhenCondition(config);
        
        expect(()=> testItem.evaluate(null, vm)).toThrow(/ConditionType/);
        expect(logger.findMessage('ConditionType not registered', LoggingLevel.Error, null)).toBeTruthy();

    });        
    test('with null enablerConfig, logs error and evaluate returns undetermined', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: null!,
            childConditionConfig: { conditionType: AlwaysMatchesConditionType }
        };

        let testItem = new WhenCondition(config);
        
        expect(testItem.evaluate(null, vm)).toBe(ConditionEvaluateResult.Undetermined);
        expect(logger.findMessage('enablerConfig: must be assigned to a Condition', LoggingLevel.Warn, LoggingCategory.Configuration)).toBeTruthy();

    });    

    test('with evaluate returning a promise in child condition, throws', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: {
                conditionType: EvaluatesAsPromiseConditionType
            }
        };

        let testItem = new WhenCondition(config);
        
        expect(() => testItem.evaluate(null, vm)).toThrow();

    });    

    test('extractConditions()', () => {
        let services = new MockValidationServices(false, false);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };

        let testItem = new WhenCondition(config);
        let result = testItem.extractConditions(vm);
        expect(result.enabler.conditionType).toBe(AlwaysMatchesConditionType);
        expect(result.child.conditionType).toBe(NeverMatchesConditionType);
    });

    test('conditionType is child condition value', () => {
        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };
        let testItem = new WhenCondition(config);
        expect(testItem.conditionType).toBe(NeverMatchesConditionType);
    });

    test('category is Children', () => {
        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };
        let testItem = new WhenCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: { conditionType: NeverMatchesConditionType },
            category: ConditionCategory.Contents
        };
        let testItem = new WhenCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames where child and enabler each have a different ValueHostName. Expect both ValueHostNames', () => {
        let services = new MockValidationServices(true, true);
        
        let vm = new MockValidationManager(services);

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig:   <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            },
            childConditionConfig: 
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
        };
        let condition = new WhenCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(2);
        expect(testItem.has('Field1')).toBe(true);
        expect(testItem.has('Field2')).toBe(true);
    });        
    test('gatherValueHostNames where child and enabler each have the same ValueHostName. Expect one ValueHostName', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig:   <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field1'
            },
            childConditionConfig: 
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
        };
        let condition = new WhenCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Field1')).toBe(true);
    });        
    test('gatherValueHostNames where enabler does not support it. Expect one ValueHostName', () => {
        let services = new MockValidationServices(true, true);
        
        let vm = new MockValidationManager(services);

        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig:   { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: 
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
        };
        let condition = new WhenCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Field1')).toBe(true);
    });        
    test('dispose', () => {
        let services = new MockValidationServices(false, false);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };
        let testItem = new WhenCondition(config);
        testItem.evaluate(null, vm);    // ensures conditions are created
        testItem.dispose();
        expect(()=> testItem.evaluate(null, vm)).toThrow(TypeError);
    });    
    test('dispose with IDisposable condition in enabler', () => {
        let services = new MockValidationServices(false, false);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: DisposableConditionType },
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };
        let testItem = new WhenCondition(config);
        testItem.evaluate(null, vm);    // ensures conditions are created
        testItem.dispose();
        expect(()=> testItem.evaluate(null, vm)).toThrow(TypeError);
    });    
    test('dispose with IDisposable condition in childconfig', () => {

        let services = new MockValidationServices(false, false);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: WhenConditionConfig = {
            conditionType: ConditionType.When,
            enablerConfig: { conditionType: AlwaysMatchesConditionType },
            childConditionConfig: { conditionType: DisposableConditionType }
        };
        let testItem = new WhenCondition(config);
        testItem.evaluate(null, vm);    // ensures conditions are created
        testItem.dispose();
        expect(()=> testItem.evaluate(null, vm)).toThrow(TypeError);
    });            
});
