import { IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IJivsServices } from '../../src/Interfaces/JivsServices';
import { LoggingLevel } from '../../src/Interfaces/LoggerService';
import { IModelReaderWriterRuleService, ModelReaderWriterRule } from '../../src/Interfaces/ModelReaderAndWriter';
import {  } from '../../src/Services/ModelReaderWriterRuleService';
import
{
    ModelReaderRuleService, ModelReaderWriterRuleServiceBase,
        ModelWriterRuleService, thenEmptyArray, thenEmptyObject, thenEmptyString,
        thenFalse, thenKeep, thenNull, thenOmit, thenTrue,
        thenUndefined, thenZero, whenEmptyString, whenEmptyStringNullOrUndefined,
        whenEmptyStringOrNull, whenNullOrUndefined, whenUndefined, whenZero,
        whenZeroNullOrUndefined, whenZeroOrNull
    } from '../../src/Services/ModelReaderWriterRuleService';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { createJivsServicesForTesting } from '../../src/Support/createJivsServicesForTesting';
import { finishPartialFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
import { MockJivsServices, MockValueHostsManager } from '../TestSupport/mocks';

class TestModelReaderWriterRuleService extends ModelReaderWriterRuleServiceBase
{
    protected ensureWhenPopulated(): void
    {
        this.registerWhenFunction('testWhen', (value) => value === 'test');
    }
    protected ensureThenPopulated(): void
    {
        this.registerThenFunction('testThen', (value) => ({ value: value }));
    }

    public getRegisteredWhen(): Map<string, any> | null
    {
        return super.registeredWhen;
    }
    public getRegisteredThen(): Map<string, any> | null
    {
        return super.registeredThen;
    }    
}

/**
 * Simple non-mock versions of services with one FieldValueHost named "Field1".
 * Get the correct ModelReaderWriterRuleService for the test from services returned.
 * @param model 
 * @param propertyName 
 * @param rule 
 * @returns 
 */
function setup(model: object, propertyName: string,
    modelReaderRule: ModelReaderWriterRule | undefined, modelWriterRule: ModelReaderWriterRule | undefined):
    {
        services: IJivsServices,
        logger: CapturingLogger,
        valueHost: IFieldValueHost
    }
{
    let services = createJivsServicesForTesting({ logger: 'capturing'});
    // will already have default modelReaderRuleService and modelWriterRuleService. So the caller should 
    // use the right one for the test.
    let logger = services.loggerService as CapturingLogger;
    logger.minLevel = LoggingLevel.Debug;
    let modelRuleService = new TestModelReaderWriterRuleService(); // supplies the standard rules for when and then
    let valueHostsManager = new MockValueHostsManager(services);
    let valueHost = valueHostsManager.addValueHost(
        finishPartialFieldValueHostConfig({
            propertyName: propertyName,
            modelReaderRule: modelReaderRule,
            modelWriterRule: modelWriterRule,
        }, 1), null) as IFieldValueHost;

    return { services, logger, valueHost };
}

describe('ModelReaderWriterRuleServiceBase', () =>
{

    test('confirm lazy load has not run until getWhen is called', () =>
    {
        const factory = new TestModelReaderWriterRuleService();
        expect(factory.getRegisteredWhen()).toBeNull();
        expect(factory.getRegisteredThen()).toBeNull();
        factory.getWhen('testWhen');
        expect(factory.getRegisteredWhen()).not.toBeNull();
        expect(factory.getRegisteredThen()).not.toBeNull();
    });
    test('confirm lazy load has not run until getThen is called', () =>
    {
        const factory = new TestModelReaderWriterRuleService();
        expect(factory.getRegisteredWhen()).toBeNull();
        expect(factory.getRegisteredThen()).toBeNull();
        factory.getThen('testThen');
        expect(factory.getRegisteredWhen()).not.toBeNull();
        expect(factory.getRegisteredThen()).not.toBeNull();
    });
    test('confirm lazy load has not run until when is called', () =>
    {
        const factory = new TestModelReaderWriterRuleService();
        expect(factory.getRegisteredWhen()).toBeNull();
        expect(factory.getRegisteredThen()).toBeNull();
        factory.when('testWhen', 'test');
        expect(factory.getRegisteredWhen()).not.toBeNull();
        expect(factory.getRegisteredThen()).not.toBeNull();
    });
    test('confirm lazy load has not run until then is called', () =>
    {
        const factory = new TestModelReaderWriterRuleService();
        expect(factory.getRegisteredWhen()).toBeNull();
        expect(factory.getRegisteredThen()).toBeNull();
        factory.then('testThen', 'test');
        expect(factory.getRegisteredWhen()).not.toBeNull();
        expect(factory.getRegisteredThen()).not.toBeNull();
    });
    test('registerWhenFunction, including confirming lazy load check', () =>
    {
        const factory = new TestModelReaderWriterRuleService();
        expect(factory.getRegisteredWhen()).toBeNull();
        factory.registerWhenFunction('test', (value) => value === 'test');
        expect(factory.getRegisteredWhen()).not.toBeNull();
        const whenFunction = factory.getWhen('test');
        expect(whenFunction).toBeDefined();
        expect(whenFunction!('test')).toBe(true);
        expect(whenFunction!('not test')).toBe(false);
    });
    test('registerThenFunction, including confirming lazy load check', () =>
    {
        const factory = new TestModelReaderWriterRuleService();
        expect(factory.getRegisteredThen()).toBeNull();
        factory.registerThenFunction('test', (value) => ({ value: value }));
        expect(factory.getRegisteredThen()).not.toBeNull();
        const thenFunction = factory.getThen('test');
        expect(thenFunction).toBeDefined();
        const result = thenFunction!('test value');
        expect(result).toEqual({ value: 'test value' });
    });

    describe('getWhen', () =>
    {
        test('should return the correct When function for a registered name', () =>
        {
            const factory = new ModelWriterRuleService();
            const whenFunction = (value: any) => value === 'test';
            factory.registerWhenFunction('test', whenFunction);
            const retrievedFunction = factory.getWhen('test');
            expect(retrievedFunction).toBe(whenFunction);
        });

        test('should return undefined for an unregistered When name', () =>
        {
            const factory = new ModelWriterRuleService();
            const retrievedFunction = factory.getWhen('unregistered');
            expect(retrievedFunction).toBeUndefined();
        });
    });
    describe('getThen', () =>
    {
        test('should return the correct Then function for a registered name', () =>
        {
            const factory = new ModelWriterRuleService();
            const thenFunction = (value: any) => ({ value: value });
            factory.registerThenFunction('test', thenFunction);
            const retrievedFunction = factory.getThen('test');
            expect(retrievedFunction).toBe(thenFunction);
        });
        test('should return undefined for an unregistered Then name', () =>
        {
            const factory = new ModelWriterRuleService();
            const retrievedFunction = factory.getThen('unregistered');
            expect(retrievedFunction).toBeUndefined();
        });
        // test all register Then names to match to the correct function

    });
    describe('resolve()', () =>
    {
        describe('with Reader', () =>
        {
            test('when lookup in factory fails:  when=unknown,then=known. Expect skip true and logged error', () =>
            {
                let model = { prop1: 'value1', prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', { when: 'unknown', then: 'unassigned' }, undefined);

                let modelReaderRuleService = services.modelReaderRuleService;
                let modelReaderRule = valueHost.getModelReaderRule();
                expect(modelReaderRule).toBeDefined();
                let result = modelReaderRuleService.resolve('prop1', 'value1', modelReaderRule!, valueHost, 'Reader');
                expect(result.skip).toBe(true);
                expect(result.adjustedValue).toBeUndefined();

                expect(logger.findMessage(`FieldValueHostConfig.modelReaderRule.when '${ modelReaderRule!.when }' not registered in the ModelReaderRuleService.`, LoggingLevel.Error)).toBeTruthy();
            });
            // just with Writer especially with log entries to confirm "Writer"

            test('then lookup in factory fails: when=known, then=unknown. Expect skip true and logged error', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', { when: 'nullorundefined', then: 'unknown' }, undefined);
                let modelReaderRule = valueHost.getModelReaderRule();
                expect(modelReaderRule).toBeDefined();
                let result = services.modelReaderRuleService.resolve('prop1', model.prop1, modelReaderRule!, valueHost, 'Reader');
                expect(result.skip).toBe(true);
                expect(result.adjustedValue).toBeUndefined();
                expect(logger.findMessage(`FieldValueHostConfig.modelReaderRule.then '${ modelReaderRule!.then }' not registered in the ModelReaderRuleService.`, LoggingLevel.Error)).toBeTruthy();
            });
            // when function returns false, indicating the value is valid and does not need to be replaced. Expect skip true and no adjustedValue.
            test('when function returns false, indicating the value is valid and does not need to be replaced. Expect skip false and adjustedValue=originalValue.', () =>
            {
                let model = { prop1: 'value1', prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', { when: 'undefined', then: 'unassigned' }, undefined);
                let modelReaderRule = valueHost.getModelReaderRule();
                expect(modelReaderRule).toBeDefined();
                let result = services.modelReaderRuleService.resolve('prop1', model.prop1, modelReaderRule!, valueHost, 'Reader');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBe(model.prop1);
            });
            // the rest are for then rule
            test('when tests for null and finds null, then=null. Expect skip=false, adjustedValue=null.', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', { when: 'nullorundefined', then: 'null' }, undefined);
                let modelReaderRule = valueHost.getModelReaderRule();
                expect(modelReaderRule).toBeDefined();
                let result = services.modelReaderRuleService.resolve('prop1', model.prop1, modelReaderRule!, valueHost, 'Reader');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBe(null);
            });
            test('when tests for null and finds null, then=unassigned. Expect skip=false, adjustedValue=undefined.', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', { when: 'nullorundefined', then: 'unassigned' }, undefined);
                let modelReaderRule = valueHost.getModelReaderRule();
                expect(modelReaderRule).toBeDefined();
                let result = services.modelReaderRuleService.resolve('prop1', model.prop1, modelReaderRule!, valueHost, 'Reader');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBeUndefined();
                expect(logger.findMessage(`value adjusted by the rule '${ modelReaderRule!.then }'`, LoggingLevel.Debug)).toBeTruthy();
            });
            test('when tests for null and finds null, then=keep. Expect skip=false, adjustedValue=null.', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', { when: 'nullorundefined', then: 'keep' }, undefined);
                let modelReaderRule = valueHost.getModelReaderRule();
                expect(modelReaderRule).toBeDefined();
                let result = services.modelReaderRuleService.resolve('prop1', model.prop1, modelReaderRule!, valueHost, 'Reader');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBeNull();
                // Expect no log message about value adjusted by the rule, since the value is already null and does not need to be changed.
                expect(logger.findMessage(`value adjusted by the rule`, LoggingLevel.Debug)).toBeFalsy();
            });
        });

        describe('with Writer', () =>
        {
            test('when lookup in factory fails:  when=unknown,then=known. Expect skip true and logged error', () =>
            {
                let model = { prop1: 'value1', prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', undefined, { when: 'unknown', then: 'omit' });

                let modelWriterRuleService = services.modelWriterRuleService;
                let modelWriterRule = valueHost.getModelWriterRule();
                expect(modelWriterRule).toBeDefined();
                let result = modelWriterRuleService.resolve('prop1', 'value1', modelWriterRule!, valueHost, 'Writer');
                expect(result.skip).toBe(true);
                expect(result.adjustedValue).toBeUndefined();

                expect(logger.findMessage(`FieldValueHostConfig.modelWriterRule.when '${ modelWriterRule!.when }' not registered in the ModelWriterRuleService.`, LoggingLevel.Error)).toBeTruthy();
            });
            // just with Writer especially with log entries to confirm "Writer"

            test('then lookup in factory fails: when=known, then=unknown. Expect skip true and logged error', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', undefined, { when: 'nullorundefined', then: 'unknown' });
                let modelWriterRule = valueHost.getModelWriterRule();
                expect(modelWriterRule).toBeDefined();
                let result = services.modelWriterRuleService.resolve('prop1', model.prop1, modelWriterRule!, valueHost, 'Writer');
                expect(result.skip).toBe(true);
                expect(result.adjustedValue).toBeUndefined();
                expect(logger.findMessage(`FieldValueHostConfig.modelWriterRule.then '${ modelWriterRule!.then }' not registered in the ModelWriterRuleService.`, LoggingLevel.Error)).toBeTruthy();
            });
            // when function returns false, indicating the value is valid and does not need to be replaced. Expect skip true and no adjustedValue.
            test('when function returns false, indicating the value is valid and does not need to be replaced. Expect skip false and adjustedValue=originalValue.', () =>
            {
                let model = { prop1: 'value1', prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', undefined, { when: 'undefined', then: 'keep' });
                let modelWriterRule = valueHost.getModelWriterRule();
                expect(modelWriterRule).toBeDefined();
                let result = services.modelWriterRuleService.resolve('prop1', model.prop1, modelWriterRule!, valueHost, 'Writer');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBe(model.prop1);
            });
            // the rest are for then rule
            test('when tests for null and finds null, then=null. Expect skip=false, adjustedValue=null.', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', undefined, { when: 'nullorundefined', then: 'null' });
                let modelWriterRule = valueHost.getModelWriterRule();
                expect(modelWriterRule).toBeDefined();
                let result = services.modelWriterRuleService.resolve('prop1', model.prop1, modelWriterRule!, valueHost, 'Writer');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBe(null);
            });
            test('when tests for null and finds null, then=undefined. Expect skip=false, adjustedValue=undefined.', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', undefined, { when: 'nullorundefined', then: 'undefined' });
                let modelWriterRule = valueHost.getModelWriterRule();
                expect(modelWriterRule).toBeDefined();
                let result = services.modelWriterRuleService.resolve('prop1', model.prop1, modelWriterRule!, valueHost, 'Writer');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBeUndefined();
                expect(logger.findMessage(`value adjusted by the rule '${ modelWriterRule!.then }'`, LoggingLevel.Debug)).toBeTruthy();
            });
            test('when tests for null and finds null, then=keep. Expect skip=false, adjustedValue=null.', () =>
            {
                let model = { prop1: null, prop2: 42 };
                let { services, logger, valueHost } =
                    setup(model, 'prop1', undefined, { when: 'nullorundefined', then: 'keep' });
                let modelWriterRule = valueHost.getModelWriterRule();
                expect(modelWriterRule).toBeDefined();
                let result = services.modelWriterRuleService.resolve('prop1', model.prop1, modelWriterRule!, valueHost, 'Writer');
                expect(result.skip).toBe(false);
                expect(result.adjustedValue).toBeNull();
                // Expect no log message about value adjusted by the rule, since the value is already null and does not need to be changed.
                expect(logger.findMessage(`value adjusted by the rule`, LoggingLevel.Debug)).toBeFalsy();
            });
        });        
    });

});
describe('ModelReaderRuleService', () =>
{

    test('should return the correct When function for all predefined names', () =>
    {
        const factory = new ModelReaderRuleService();
        const predefinedWhenNames = new Map<string, any>();
        predefinedWhenNames.set('undefined', whenUndefined);
        predefinedWhenNames.set('nullOrUndefined', whenNullOrUndefined);
        predefinedWhenNames.set('0', whenZero);
        predefinedWhenNames.set('zero', whenZero);
        predefinedWhenNames.set('0ornull', whenZeroOrNull);
        predefinedWhenNames.set('zeroornull', whenZeroOrNull);
        predefinedWhenNames.set('0nullorundefined', whenZeroNullOrUndefined);
        predefinedWhenNames.set('zeronullorundefined', whenZeroNullOrUndefined);
        predefinedWhenNames.set('', whenEmptyString);
        predefinedWhenNames.set('emptystring', whenEmptyString);
        predefinedWhenNames.set('emptystringornull', whenEmptyStringOrNull);
        predefinedWhenNames.set('emptystringnullorundefined', whenEmptyStringNullOrUndefined);
        for (const [name, func] of predefinedWhenNames)
        {
            const retrievedFunction = factory.getWhen(name);
            expect(retrievedFunction).toBe(func);
        }
    });
    test('should return the correct Then function for all predefined names', () =>
    {
        const factory = new ModelReaderRuleService();
        const predefinedThenNames = new Map<string, any>();
        predefinedThenNames.set('keep', thenKeep);
        predefinedThenNames.set('null', thenNull);
        predefinedThenNames.set('undefined', thenUndefined);
        predefinedThenNames.set('unassigned', thenUndefined);
        for (const [name, func] of predefinedThenNames)
        {
            const retrievedFunction = factory.getThen(name);
            expect(retrievedFunction).toBe(func);
        }

        expect(factory.getThen('omit')).toBeUndefined();
    });
});
describe('ModelWriterRuleService', () =>
{
    
    test('should return the correct When function for all predefined names', () =>
    {
        const factory = new ModelWriterRuleService();
        const predefinedWhenNames = new Map<string, any>();
        predefinedWhenNames.set('undefined', whenUndefined);
        predefinedWhenNames.set('nullOrUndefined', whenNullOrUndefined);
        predefinedWhenNames.set('0', whenZero);
        predefinedWhenNames.set('zero', whenZero);
        predefinedWhenNames.set('0ornull', whenZeroOrNull);
        predefinedWhenNames.set('zeroornull', whenZeroOrNull);
        predefinedWhenNames.set('0nullorundefined', whenZeroNullOrUndefined);
        predefinedWhenNames.set('zeronullorundefined', whenZeroNullOrUndefined);
        predefinedWhenNames.set('', whenEmptyString);
        predefinedWhenNames.set('emptystring', whenEmptyString);
        predefinedWhenNames.set('emptystringornull', whenEmptyStringOrNull);
        predefinedWhenNames.set('emptystringnullorundefined', whenEmptyStringNullOrUndefined);
        for (const [name, func] of predefinedWhenNames)
        {
            const retrievedFunction = factory.getWhen(name);
            expect(retrievedFunction).toBe(func);
        }
    });        
    test('should return the correct Then function for all predefined names', () =>
    {
        const factory = new ModelWriterRuleService();
        const predefinedThenNames = new Map<string, any>();
        predefinedThenNames.set('omit', thenOmit);
        predefinedThenNames.set('keep', thenKeep);
        predefinedThenNames.set('undefined', thenUndefined);
        predefinedThenNames.set('null', thenNull);
        predefinedThenNames.set('0', thenZero);
        predefinedThenNames.set('zero', thenZero);
        predefinedThenNames.set('', thenEmptyString);
        predefinedThenNames.set('emptystring', thenEmptyString);
        predefinedThenNames.set('false', thenFalse);
        predefinedThenNames.set('true', thenTrue);
        predefinedThenNames.set('[]', thenEmptyArray);
        predefinedThenNames.set('emptyarray', thenEmptyArray);
        predefinedThenNames.set('{}', thenEmptyObject);
        predefinedThenNames.set('emptyobject', thenEmptyObject);
        for (const [name, func] of predefinedThenNames)
        {
            const retrievedFunction = factory.getThen(name);
            expect(retrievedFunction).toBe(func);
        }

        expect(factory.getThen('unassigned')).toBeUndefined();
    });        
});

describe('test actual when functions', () =>
{
    test('whenUndefined should return true for undefined', () =>
    {
        expect(whenUndefined(undefined)).toBe(true);
        expect(whenUndefined(null)).toBe(false);
        expect(whenUndefined('')).toBe(false);
        expect(whenUndefined(0)).toBe(false);
    });
    test('whenNullOrUndefined should return true for null or undefined', () =>
    {
        expect(whenNullOrUndefined(undefined)).toBe(true);
        expect(whenNullOrUndefined(null)).toBe(true);
        expect(whenNullOrUndefined('')).toBe(false);
        expect(whenNullOrUndefined(0)).toBe(false);
    });
    test('whenZero should return true for 0', () =>
    {
        expect(whenZero(0)).toBe(true);
        expect(whenZero(undefined)).toBe(false);
        expect(whenZero(null)).toBe(false);
        expect(whenZero('')).toBe(false);
    });
    test('whenZeroOrNull should return true for 0 or null', () =>
    {
        expect(whenZeroOrNull(0)).toBe(true);
        expect(whenZeroOrNull(null)).toBe(true);
        expect(whenZeroOrNull(undefined)).toBe(false);
        expect(whenZeroOrNull('')).toBe(false);
    });
    test('whenZeroNullOrUndefined should return true for 0, null or undefined', () =>
    {
        expect(whenZeroNullOrUndefined(0)).toBe(true);
        expect(whenZeroNullOrUndefined(null)).toBe(true);

        expect(whenZeroNullOrUndefined(undefined)).toBe(true);
        expect(whenZeroNullOrUndefined('')).toBe(false);
    });
    test('whenEmptyString should return true for empty string', () =>
    {
        expect(whenEmptyString('')).toBe(true);
        expect(whenEmptyString('not empty')).toBe(false);
        expect(whenEmptyString(' ')).toBe(false);
        expect(whenEmptyString(null)).toBe(false);
        expect(whenEmptyString(undefined)).toBe(false);
        expect(whenEmptyString(0)).toBe(false);
    });
    test('whenEmptyStringOrNull should return true for empty string or null', () =>
    {
        expect(whenEmptyStringOrNull('')).toBe(true);
        expect(whenEmptyStringOrNull('not empty')).toBe(false);
        expect(whenEmptyStringOrNull(' ')).toBe(false);
        expect(whenEmptyStringOrNull(null)).toBe(true);
        expect(whenEmptyStringOrNull(undefined)).toBe(false);
        expect(whenEmptyStringOrNull(0)).toBe(false);
    });
    test('whenEmptyStringNullOrUndefined should return true for empty string, null or undefined', () =>
    {
        expect(whenEmptyStringNullOrUndefined('')).toBe(true);
        expect(whenEmptyStringNullOrUndefined('not empty')).toBe(false);
        expect(whenEmptyStringNullOrUndefined(' ')).toBe(false);
        expect(whenEmptyStringNullOrUndefined(null)).toBe(true);
        expect(whenEmptyStringNullOrUndefined(undefined)).toBe(true);
        expect(whenEmptyStringNullOrUndefined(0)).toBe(false);
    });
});


describe('test actual then functions', () =>
{
    test('thenOmit should return { omit: true }', () =>
    {
        expect(thenOmit('anything')).toEqual({ omit: true });
        expect(thenOmit(undefined)).toEqual({ omit: true });
        expect(thenOmit(null)).toEqual({ omit: true });
    });
    test('thenKeep should return { value: value }', () =>
    {
        expect(thenKeep('anything')).toEqual({ value: 'anything' });
        expect(thenKeep(undefined)).toEqual({ value: undefined });
        expect(thenKeep(null)).toEqual({ value: null });
    });
    test('thenNull should return { value: null }', () =>
    {
        expect(thenNull('anything')).toEqual({ value: null });
        expect(thenNull(undefined)).toEqual({ value: null });
        expect(thenNull(null)).toEqual({ value: null });
    });
    test('thenZero should return { value: 0 }', () =>
    {
        expect(thenZero('anything')).toEqual({ value: 0 });
        expect(thenZero(undefined)).toEqual({ value: 0 });
        expect(thenZero(null)).toEqual({ value: 0 });
    });
    test('thenEmptyString should return { value: "" }', () =>
    {
        expect(thenEmptyString('anything')).toEqual({ value: '' });
        expect(thenEmptyString(undefined)).toEqual({ value: '' });
        expect(thenEmptyString(null)).toEqual({ value: '' });
    });
    test('thenFalse should return { value: false }', () =>
    {
        expect(thenFalse('anything')).toEqual({ value: false });
        expect(thenFalse(undefined)).toEqual({ value: false });
        expect(thenFalse(null)).toEqual({ value: false });
    });
    test('thenTrue should return { value: true }', () =>
    {
        expect(thenTrue('anything')).toEqual({ value: true });
        expect(thenTrue(undefined)).toEqual({ value: true });
        expect(thenTrue(null)).toEqual({ value: true });
    }); 
    test('thenEmptyArray should return { value: [] }', () =>
    {
        expect(thenEmptyArray('anything')).toEqual({ value: [] });
        expect(thenEmptyArray(undefined)).toEqual({ value: [] });
        expect(thenEmptyArray(null)).toEqual({ value: [] });
    });
    test('thenEmptyObject should return { value: {} }', () =>
    {
        expect(thenEmptyObject('anything')).toEqual({ value: {} });
        expect(thenEmptyObject(undefined)).toEqual({ value: {} });
        expect(thenEmptyObject(null)).toEqual({ value: {} });
    });
});