import { RequireTextConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { NotCondition, NotConditionConfig } from "../../src/Conditions/NotCondition";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ConditionEvaluateResult, ConditionCategory } from "../../src/Interfaces/Conditions";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { registerTestingOnlyConditions, NeverMatchesConditionType, AlwaysMatchesConditionType, IsUndeterminedConditionType, EvaluatesAsPromiseConditionType, makeDisposable, DisposableConditionType } from "../TestSupport/conditionsForTesting";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";

describe('NotCondition', () => {
    test('DefaultConditionType', () => {
        expect(NotCondition.DefaultConditionType).toBe(ConditionType.Not);
    });    
    test('evaluate with valid child. Result of Match due to child NoMatch', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };

        let testItem = new NotCondition(config);
        
        expect(testItem.evaluate(null, vm)).toBe(ConditionEvaluateResult.Match);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);
    });
    test('evaluate with valid child. Result of NoMatch due to child Match', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: AlwaysMatchesConditionType }
        };

        let testItem = new NotCondition(config);
        
        expect(testItem.evaluate(null, vm)).toBe(ConditionEvaluateResult.NoMatch);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    });    
    test('evaluate with valid child. Result of Undetermined due to child Undetermined', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: IsUndeterminedConditionType }
        };

        let testItem = new NotCondition(config);
        
        expect(testItem.evaluate(null, vm)).toBe(ConditionEvaluateResult.Undetermined);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('with invalid childconfig, logs error and evaluate returns undetermined', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: 'UnknownType' }
        };

        let testItem = new NotCondition(config);
        
        expect(testItem.evaluate(null, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('Error creating condition', LoggingLevel.Error, null, null)).toBeTruthy();

    });
    test('with null childconfig, logs error and evaluate returns undetermined', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: null!
        };

        let testItem = new NotCondition(config);
        
        expect(testItem.evaluate(null, vm)).toBe(ConditionEvaluateResult.Undetermined);
        let logger = services.loggerService as CapturingLogger;
        expect(logger.findMessage('childConditionConfig', LoggingLevel.Error, null, null)).toBeTruthy();

    });    
    test('with evaluate returning a promise in child condition, throws', () => {
        let services = new MockValidationServices(false, true);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: {
                conditionType: EvaluatesAsPromiseConditionType
            }
        };

        let testItem = new NotCondition(config);
        
        expect(() => testItem.evaluate(null, vm)).toThrow();

    });    

    test('category is Children', () => {
        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };
        let testItem = new NotCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Children);
    });
    test('category is overridden', () => {
        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: NeverMatchesConditionType },
            category: ConditionCategory.Contents
        };
        let testItem = new NotCondition(config);
        expect(testItem.category).toBe(ConditionCategory.Contents);
    });
    test('gatherValueHostNames where child has a ValueHostName. Expect the one ValueHostName', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: 
                <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field1'
                }
        };
        let condition = new NotCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(1);
        expect(testItem.has('Field1')).toBe(true);
    });        
    test('gatherValueHostNames where child does not implement gatherValueHostsNames. Expect the none', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);

        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: AlwaysMatchesConditionType }
        };
        let condition = new NotCondition(config);
        let testItem = new Set<ValueHostName>();
        expect(() => condition.gatherValueHostNames(testItem, vm)).not.toThrow();
        expect(testItem.size).toBe(0);
    });        

    test('dispose', () => {
        let services = new MockValidationServices(false, false);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: NeverMatchesConditionType }
        };
        let testItem = new NotCondition(config);
        testItem.dispose();
        expect(()=> testItem.evaluate(null, vm)).toThrow(TypeError);
    });    
    test('dispose with IDisposable config in childconfig', () => {

        let services = new MockValidationServices(false, false);
        registerTestingOnlyConditions(services.conditionFactory as ConditionFactory);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost(
            'Property1', LookupKey.String, 'Label');
        let config: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: { conditionType: DisposableConditionType}
        };
        let testItem = new NotCondition(config);
        testItem.evaluate(null, vm);    // Ensure child is created
        testItem.dispose();
        expect(()=> testItem.evaluate(null, vm)).toThrow(TypeError);
    });                
});
