import { IValueAdapterService } from '../../src/Interfaces/ValueAdapterService';
import { IJivsServices } from '../../src/Interfaces/JivsServices';
import { LoggingLevel } from '../../src/Interfaces/LoggerService';
import
    {
        ValueAdapterService, thenEmptyArray, thenEmptyObject, thenEmptyString,
        thenFalse, thenKeep, thenNull, thenSkip, thenTrue,
        thenUndefined, thenZero, whenEmptyString, whenEmptyStringNullOrUndefined,
        whenEmptyStringOrNull, whenNull, whenNullOrUndefined, whenUndefined, whenZero,
        whenZeroNullOrUndefined, whenZeroOrNull
    } from '../../src/Services/ValueAdapterService';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { createJivsServicesForTesting } from '../../src/Support/createJivsServicesForTesting';

class TestValueAdapterService extends ValueAdapterService
{
    protected override ensureWhenPopulated(): void
    {
        this.registerWhenFunction('testWhen', (value) => value === 'test');
    }
    protected override ensureThenPopulated(): void
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
 * Get the correct ValueAdapterService for the test from services returned.
 * @param model 
 * @param propertyName 
 * @param rule 
 * @returns 
 */
function setup():
    {
        services: IJivsServices,
        logger: CapturingLogger,
        valueAdapterService: IValueAdapterService
    }
{
    let services = createJivsServicesForTesting({ logger: 'capturing'});
    // will already have default valueAdapterService and valueAdapterService. So the caller should 
    // use the right one for the test.
    let logger = services.loggerService as CapturingLogger;
    logger.minLevel = LoggingLevel.Debug;

    return { services, logger, valueAdapterService: services.valueAdapterService as IValueAdapterService };
}

describe('ValueAdapterService', () =>
{

    test('confirm lazy load has not run until getWhen is called', () =>
    {
        const dcService = new TestValueAdapterService();
        expect(dcService.getRegisteredWhen()).toBeNull();
        expect(dcService.getRegisteredThen()).toBeNull();
        dcService.getWhen('testWhen');
        expect(dcService.getRegisteredWhen()).not.toBeNull();
        expect(dcService.getRegisteredThen()).not.toBeNull();
    });
    test('confirm lazy load has not run until getThen is called', () =>
    {
        const dcService = new TestValueAdapterService();
        expect(dcService.getRegisteredWhen()).toBeNull();
        expect(dcService.getRegisteredThen()).toBeNull();
        dcService.getThen('testThen');
        expect(dcService.getRegisteredWhen()).not.toBeNull();
        expect(dcService.getRegisteredThen()).not.toBeNull();
    });
    test('confirm lazy load has not run until when is called', () =>
    {
        const dcService = new TestValueAdapterService();
        expect(dcService.getRegisteredWhen()).toBeNull();
        expect(dcService.getRegisteredThen()).toBeNull();
        dcService.when('testWhen', 'test');
        expect(dcService.getRegisteredWhen()).not.toBeNull();
        expect(dcService.getRegisteredThen()).not.toBeNull();
    });
    test('confirm lazy load has not run until then is called', () =>
    {
        const dcService = new TestValueAdapterService();
        expect(dcService.getRegisteredWhen()).toBeNull();
        expect(dcService.getRegisteredThen()).toBeNull();
        dcService.then('testThen', 'test');
        expect(dcService.getRegisteredWhen()).not.toBeNull();
        expect(dcService.getRegisteredThen()).not.toBeNull();
    });
    test('registerWhenFunction, including confirming lazy load check', () =>
    {
        const dcService = new TestValueAdapterService();
        expect(dcService.getRegisteredWhen()).toBeNull();
        dcService.registerWhenFunction('test', (value) => value === 'test');
        expect(dcService.getRegisteredWhen()).not.toBeNull();
        const whenFunction = dcService.getWhen('test');
        expect(whenFunction).toBeDefined();
        expect(whenFunction!('test')).toBe(true);
        expect(whenFunction!('not test')).toBe(false);
    });
    test('registerThenFunction, including confirming lazy load check', () =>
    {
        const dcService = new TestValueAdapterService();
        expect(dcService.getRegisteredThen()).toBeNull();
        dcService.registerThenFunction('test', (value) => ({ value: value }));
        expect(dcService.getRegisteredThen()).not.toBeNull();
        const thenFunction = dcService.getThen('test');
        expect(thenFunction).toBeDefined();
        const result = thenFunction!('test value');
        expect(result).toEqual({ value: 'test value' });
    });

    describe('getWhen', () =>
    {
        test('should return the correct When function for a registered name', () =>
        {
            const dcService = new TestValueAdapterService();
            const whenFunction = (value: any) => value === 'test';
            dcService.registerWhenFunction('test', whenFunction);
            const retrievedFunction = dcService.getWhen('test');
            expect(retrievedFunction).toBe(whenFunction);
        });

        test('should return undefined for an unregistered When name', () =>
        {
            const dcService = new TestValueAdapterService();
            const retrievedFunction = dcService.getWhen('unregistered');
            expect(retrievedFunction).toBeUndefined();
        });
    });
    describe('getThen', () =>
    {
        test('should return the correct Then function for a registered name', () =>
        {
            const dcService = new TestValueAdapterService();
            const thenFunction = (value: any) => ({ value: value });
            dcService.registerThenFunction('test', thenFunction);
            const retrievedFunction = dcService.getThen('test');
            expect(retrievedFunction).toBe(thenFunction);
        });
        test('should return undefined for an unregistered Then name', () =>
        {
            const dcService = new TestValueAdapterService();
            const retrievedFunction = dcService.getThen('unregistered');
            expect(retrievedFunction).toBeUndefined();
        });
        // test all register Then names to match to the correct function

    });
    describe('resolve()', () =>
    {
        let _services: IJivsServices | null = null;
        let _logger: CapturingLogger | null = null;
        let _valueAdapterService: IValueAdapterService | null = null;

        beforeEach(() =>
        {
            let setupResult = setup();
            _services = setupResult.services;
            _logger = setupResult.logger;
            _valueAdapterService = setupResult.valueAdapterService;
        });

        test('when lookup in dcService fails:  when=unknown,then=known. Expect skip true and logged error', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let rule = { when: 'unknown', then: 'skip' };
            expect(rule).toBeDefined();
            let result = _valueAdapterService!.resolve('value1', rule!);
            expect(result.skip).toBe(true);
            expect(result.value).toBeUndefined();

            expect(_logger!.findMessage(`ValueAdapterService When rule '${ rule.when }' is not registered in the ValueAdapterService.`, LoggingLevel.Error)).toBeTruthy();
        });
        // just with Writer especially with log entries to confirm "Writer"

        test('then lookup in dcService fails: when=known, then=unknown. Expect skip true and logged error', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let rule = { when: 'nullorundefined', then: 'unknown' };
            expect(rule).toBeDefined();
            let result = _valueAdapterService!.resolve(model.prop1, rule!);
            expect(result.skip).toBe(true);
            expect(result.value).toBeUndefined();
            expect(_logger!.findMessage(`ValueAdapterService Then rule '${ rule.then }' is not registered in the ValueAdapterService.`, LoggingLevel.Error)).toBeTruthy();
        });
        // when function returns false, indicating the value is valid and does not need to be replaced. Expect skip true and no value.
        test('when function returns false, indicating the value is valid and does not need to be replaced. Expect skip false and value=originalValue.', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let rule = { when: 'undefined', then: 'keep' };
            expect(rule).toBeDefined();
            let result = _valueAdapterService!.resolve(model.prop1, rule!);
            expect(result.skip).toBe(false);
            expect(result.value).toBe(model.prop1);
        });
        // the rest are for then rule
        test('when tests for null and finds null, then=null. Expect skip=false, value=null.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let rule = { when: 'nullorundefined', then: 'null' };
            expect(rule).toBeDefined();
            let result = _valueAdapterService!.resolve(model.prop1, rule!);
            expect(result.skip).toBe(false);
            expect(result.value).toBe(null);
        });
        test('when tests for null and finds null, then=undefined. Expect skip=false, value=undefined.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let rule = { when: 'nullorundefined', then: 'undefined' };
            expect(rule).toBeDefined();
            let result = _valueAdapterService!.resolve(model.prop1, rule!);
            expect(result.skip).toBe(false);
            expect(result.value).toBeUndefined();
            expect(_logger!.findMessage(`ValueAdapterService Then rule '${ rule.then }' has adjusted the source value.`, LoggingLevel.Debug)).toBeTruthy();
        });
        test('when tests for null and finds null, then=keep. Expect skip=false, value=null.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let rule = { when: 'nullorundefined', then: 'keep' };
            expect(rule).toBeDefined();
            let result = _valueAdapterService!.resolve(model.prop1, rule!);
            expect(result.skip).toBe(false);
            expect(result.value).toBeNull();
            // Expect no log message about value adjusted by the rule, since the value is already null and does not need to be changed.
            expect(_logger!.findMessage(`has adjusted the source value`, LoggingLevel.Debug)).toBeFalsy();
        });
   
    });
    test('should return the correct When function for all predefined names', () =>
    {
        const dcService = new ValueAdapterService();
        const predefinedWhenNames = new Map<string, any>();
        predefinedWhenNames.set('undefined', whenUndefined);
        predefinedWhenNames.set('null', whenNull);
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
            const retrievedFunction = dcService.getWhen(name);
            expect(retrievedFunction).toBe(func);
        }
    });
    test('should return the correct Then function for all predefined names', () =>
    {
        const dcService = new ValueAdapterService();
        const predefinedThenNames = new Map<string, any>();
        predefinedThenNames.set('skip', thenSkip);
        predefinedThenNames.set('omit', thenSkip);
        predefinedThenNames.set('keep', thenKeep);
        predefinedThenNames.set('nochange', thenKeep);
        predefinedThenNames.set('undefined', thenUndefined);
        predefinedThenNames.set('unassigned', thenUndefined);
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
            const retrievedFunction = dcService.getThen(name);
            expect(retrievedFunction).toBe(func);
        }
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
    test('whenNull should return true for null', () =>
    {
        expect(whenNull(null)).toBe(true);
        expect(whenNull(undefined)).toBe(false);
        expect(whenNull('')).toBe(false);
        expect(whenNull(0)).toBe(false);
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
    test('thenSkip should return { skip: true }', () =>
    {
        expect(thenSkip('anything')).toEqual({ skip: true });
        expect(thenSkip(undefined)).toEqual({ skip: true });
        expect(thenSkip(null)).toEqual({ skip: true });
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