import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { createMinimalJivsServices } from '@plblum/jivs-engine/build/Support/createMinimalJivsServices';
import { FieldValueHostConfig, IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LogDetails, LoggingCategory, LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { TestingLoggingService } from '@plblum/jivs-engine/build/Support/TestingLoggingService';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';
import { createElement } from '../TestSupport/utilities';

/**
 * Exposes the protected jivsServices property so the constructor's effect can be verified.
 */
class Publicify_DomLoggingFacade extends DomLoggingFacade
{
    public get publicify_jivsServices(): IJivsServices
    {
        return this.jivsServices;
    }
}

/**
 * Creates a facade whose logging service is a RecordingLoggingService.
 * The tests isolate DomLoggingFacade: they verify what it asks the logging service to do,
 * not how a real logging service filters or stores entries (that is tested in jivs-engine).
 * The last describe in this file combines the facade with the engine's real logger.
 * @param callGatherFn - Passed to RecordingLoggingService.
 */
function setup(callGatherFn: boolean = true): {
    services: IJivsServices,
    logger: RecordingLoggingService,
    facade: DomLoggingFacade
}
{
    let services = createMinimalJivsServices('en');
    let logger = new RecordingLoggingService(callGatherFn);
    services.loggingService = logger; 
    return {
        services: services,
        logger: logger,
        facade: new DomLoggingFacade(services)
    };
}

/**
 * Creates a real FieldValueHost through the engine's ValueHostsManager.
 */
function createRealFieldValueHost(services: IJivsServices, name: string, elementIdentifier?: string): IFieldValueHost
{
    return new ValueHostsManager({
        services: services,
        valueHostConfigs: [<FieldValueHostConfig>{
            valueHostType: ValueHostType.Field,
            name: name,
            dataType: LookupKey.String,
            elementIdentifier: elementIdentifier
        }]
    }).getFieldValueHost(name)!;
}

describe('DomLoggingFacade constructor', () => {
    test('Stores the IJivsServices passed in', () => {
        let services = createJivsServicesForTesting();
        let testItem = new Publicify_DomLoggingFacade(services);

        expect(testItem.publicify_jivsServices).toBe(services);
    });
});

describe('DomLoggingFacade.log delegates to IJivsServices.loggingService', () => {
    test('Passes the level and the LogDetails returned by gatherFn to the loggingService', () => {
        let { logger, facade } = setup();
        let details: LogDetails = {
            message: 'Something failed',
            category: LoggingCategory.Exception,
            feature: 'Dom',
            type: 'MyClass',
            identity: 'Field1'
        };
        facade.log(LoggingLevel.Error, () => details);

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toBe(details);
    });
    test('Each call to log() makes one call to the loggingService', () => {
        let { logger, facade } = setup();
        facade.log(LoggingLevel.Debug, () => ({ message: 'First' }));
        facade.log(LoggingLevel.Warn, () => ({ message: 'Second' }));

        expect(logger.calls.map((call) => [call.level, call.details?.message])).toEqual([
            [LoggingLevel.Debug, 'First'],
            [LoggingLevel.Warn, 'Second']
        ]);
    });
    // The facade documents that gatherFn runs only when the logger requires it.
    // So the facade itself must not call gatherFn.
    test('Does not call gatherFn itself: the loggingService decides whether to', () => {
        let { logger, facade } = setup(false);
        let gatherCount = 0;
        facade.log(LoggingLevel.Debug, () => {
            gatherCount++;
            return { message: 'Unused' };
        });

        expect(logger.calls).toHaveLength(1);
        expect(gatherCount).toBe(0);
    });
    test('gatherFn receives the same facade instance so it can call prepareLogDetails', () => {
        let { logger, facade } = setup();
        let received: DomLoggingFacade | null = null;
        facade.log(LoggingLevel.Info, (f) => {
            received = f;
            return f.prepareLogDetails('Prepared using {element}', createElement({ id: 'Input1' }));
        });

        expect(received).toBe(facade);
        expect(logger.calls[0].details).toMatchObject({
            message: 'Prepared using Input1',
            feature: 'Dom',
            data: { idAttribute: 'Input1' }
        });
    });
    test('Looks up the loggingService on each call, so replacing it after construction is honored', () => {
        let { services, facade } = setup();
        let replacement = new RecordingLoggingService();
        services.loggingService = replacement;
        facade.log(LoggingLevel.Info, () => ({ message: 'To the replacement' }));

        expect(replacement.calls).toHaveLength(1);
        expect(replacement.calls[0].details?.message).toBe('To the replacement');
    });
    test('No loggingService available does nothing and does not call gatherFn', () => {
        let noLoggerServices = { loggingService: undefined } as unknown as IJivsServices;
        let testItem = new DomLoggingFacade(noLoggerServices);
        let gatherCount = 0;

        expect(() => testItem.log(LoggingLevel.Error, (): LogDetails => {
            gatherCount++;
            return { message: 'Unused' };
        })).not.toThrow();
        expect(gatherCount).toBe(0);
    });
});

describe('DomLoggingFacade.prepareLogDetails', () => {
    describe('Basic structure', () => {
        test('Message only returns the message, feature "Dom", and an empty data object', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Just a message', null);

            expect(result).toEqual({
                message: 'Just a message',
                feature: 'Dom',
                data: {}
            });
        });
        test('Type and identity are omitted when not supplied', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null);

            expect(result).not.toHaveProperty('type');
            expect(result).not.toHaveProperty('identity');
        });
        test('Type as string is passed through unchanged', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null, null, 'MyType');

            expect(result.type).toBe('MyType');
        });
        test('Type as object is passed through as the same object (the logging service converts it)', () => {
            let { facade } = setup();
            let source = { name: 'source' };
            let result = facade.prepareLogDetails('Message', null, null, source);

            expect(result.type).toBe(source);
        });
        test('Type as class (Function) is passed through unchanged', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null, null, DomLoggingFacade);

            expect(result.type).toBe(DomLoggingFacade);
        });
        test('Identity as string is included', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null, null, null, 'Code1');

            expect(result.identity).toBe('Code1');
        });
        test('Identity as array is included as the same array', () => {
            let { facade } = setup();
            let identity = ['Field1', 'Code1'];
            let result = facade.prepareLogDetails('Message', null, null, null, identity);

            expect(result.identity).toBe(identity);
        });
        test('Null type and identity are treated like not supplied', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null, null, null, null);

            expect(result).not.toHaveProperty('type');
            expect(result).not.toHaveProperty('identity');
        });
    });

    describe('Identifying the element (data.idAttribute)', () => {
        test('Element with id attribute reports it', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement({ id: 'Input1' }));

            expect(result.data).toEqual({ idAttribute: 'Input1' });
        });
        test('Element without id but with name attribute reports the name', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement({ name: 'Input1Name' }));

            expect(result.data).toEqual({ idAttribute: 'Input1Name' });
        });
        test('Element with both id and name prefers the id', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement({ id: 'Input1', name: 'Input1Name' }));

            expect(result.data).toEqual({ idAttribute: 'Input1' });
        });
        test('Element with neither id nor name, and no valueHost, reports no idAttribute', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement());

            expect(result.data).toEqual({});
        });
        test('Null element and no valueHost reports no idAttribute', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null);

            expect(result.data).toEqual({});
        });
        test('Works with elements other than inputs', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement({ id: 'Container1' }, 'div'));

            expect(result.data).toEqual({ idAttribute: 'Container1' });
        });
    });

    describe('Identifying the valueHost (data.valueHostName)', () => {
        test('ValueHost reports its name, and its element identifier as idAttribute when there is no element', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null, createStubFieldValueHost('Field1'));

            expect(result.data).toEqual({ idAttribute: 'Field1', valueHostName: 'Field1' });
        });
        test('ValueHost with an elementIdentifier uses it for idAttribute when there is no element', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', null, createStubFieldValueHost('Field1', 'input-field1'));

            expect(result.data).toEqual({ idAttribute: 'input-field1', valueHostName: 'Field1' });
        });
        test('Element id takes priority over the valueHost elementIdentifier for idAttribute', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement({ id: 'Input1' }),
                createStubFieldValueHost('Field1', 'input-field1'));

            expect(result.data).toEqual({ idAttribute: 'Input1', valueHostName: 'Field1' });
        });
        test('Element without id or name falls back to the valueHost elementIdentifier', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement(),
                createStubFieldValueHost('Field1', 'input-field1'));

            expect(result.data).toEqual({ idAttribute: 'input-field1', valueHostName: 'Field1' });
        });
        test('Null valueHost reports no valueHostName', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Message', createElement({ id: 'Input1' }), null);

            expect(result.data).toEqual({ idAttribute: 'Input1' });
        });
    });

    describe('Message placeholders {element} and {valuehost}', () => {
        test('{element} is replaced with the element id', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Problem with {element}.', createElement({ id: 'Input1' }));

            expect(result.message).toBe('Problem with Input1.');
        });
        test('{valuehost} is replaced with the valueHost name', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Problem with {valuehost}.', null, createStubFieldValueHost('Field1'));

            expect(result.message).toBe('Problem with Field1.');
        });
        test('Both placeholders are replaced in the same message', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Element {element} for {valuehost}', createElement({ id: 'Input1' }),
                createStubFieldValueHost('Field1'));

            expect(result.message).toBe('Element Input1 for Field1');
        });
        test('Each occurrence of a repeated placeholder is replaced', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('{element} and {element} again', createElement({ id: 'Input1' }));

            expect(result.message).toBe('Input1 and Input1 again');
        });
        test('{element} uses the same value reported in data.idAttribute, including the valueHost fallback', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('Element is {element}', null, createStubFieldValueHost('Field1', 'input-field1'));

            expect(result.message).toBe('Element is input-field1');
            expect((result.data as Record<string, unknown>)['idAttribute']).toBe('input-field1');
        });
        test('Placeholders are replaced with an empty string when there is no element or valueHost', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('[{element}][{valuehost}]', null);

            expect(result.message).toBe('[][]');
        });
        test('Message without placeholders is unchanged', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('No placeholders here', createElement({ id: 'Input1' }));

            expect(result.message).toBe('No placeholders here');
        });
        test('Empty message stays empty', () => {
            let { facade } = setup();
            let result = facade.prepareLogDetails('', null);

            expect(result.message).toBe('');
        });
    });
});

// Integration: DomLoggingFacade with the engine's real TestingLoggingService and a real FieldValueHost.
// The tests above use fakes for both. Here we prove the facade works with the real ones.
describe('DomLoggingFacade integrated with jivs-engine services', () => {
    test('An entry built with prepareLogDetails is captured by TestingLoggingService with all its details', () => {
        let services = createJivsServicesForTesting({ loggerLevel: LoggingLevel.Debug });
        let logger = services.loggingService as TestingLoggingService;
        let facade = new DomLoggingFacade(services);
        let valueHost = createRealFieldValueHost(services, 'Field1');
        let element = createElement({ id: 'Input1' });
        logger.clearAll();   // ignore entries the engine logged while creating the valueHost
        facade.log(LoggingLevel.Warn, (f) => ({
            ...f.prepareLogDetails('{element} is not supported for {valuehost}', element, valueHost,
                'EditorInstaller', ['Field1', 'NotSupported']),
            category: LoggingCategory.Configuration
        }));

        expect(logger.entryCount).toBe(1);
        expect(logger.captured[0]).toMatchObject({
            level: LoggingLevel.Warn,
            category: LoggingCategory.Configuration,
            message: 'Input1 is not supported for Field1',
            feature: 'Dom',
            typeAsString: 'EditorInstaller',
            identity: ['Field1', 'NotSupported'],
            data: { idAttribute: 'Input1', valueHostName: 'Field1' }
        });
    });
    test('A real FieldValueHost supplies its elementIdentifier as idAttribute when there is no element', () => {
        let services = createJivsServicesForTesting();
        let facade = new DomLoggingFacade(services);
        let valueHost = createRealFieldValueHost(services, 'Field1', 'input-field1');

        let result = facade.prepareLogDetails('Message', null, valueHost);

        expect(result.data).toEqual({ idAttribute: 'input-field1', valueHostName: 'Field1' });
    });
    test('A real FieldValueHost without an elementIdentifier supplies its name as idAttribute', () => {
        let services = createJivsServicesForTesting();
        let facade = new DomLoggingFacade(services);
        let valueHost = createRealFieldValueHost(services, 'Field1');

        let result = facade.prepareLogDetails('Message', null, valueHost);

        expect(result.data).toEqual({ idAttribute: 'Field1', valueHostName: 'Field1' });
    });
});
