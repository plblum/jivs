import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { LoggingFacade } from '@plblum/jivs-engine/build/Utilities/LoggingFacade';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { DomServiceBase } from '../../src/Services/DomServiceBase';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Exposes DomServiceBase's protected dependencies while allowing service identity to be customized.
 */
class TestDomService extends DomServiceBase
{
    public get publicify_domServices(): IJivsDomServices
    {
        return this.domServices;
    }

    public get publicify_logger(): LoggingFacade
    {
        return this.logger();
    }

    public writeLog(level: LoggingLevel, message: string): void
    {
        this.logger().message(level, () => message);
    }
}

class TestDomServiceWithCustomIdentity extends TestDomService
{
    protected override get serviceIdentity(): string
    {
        return 'CustomServiceIdentity';
    }
}

/**
 * Creates a DOM service with an injected recording engine logger.
 */
function setup(): {
    domServices: IJivsDomServices,
    logger: RecordingLoggingService,
    testItem: TestDomService
}
{
    let logger = new RecordingLoggingService();
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    return {
        domServices: domServices,
        logger: logger,
        testItem: new TestDomService(domServices)
    };
}

// DomServiceBase rejects a missing DOM service container and retains a valid one for subclasses.
describe('DomServiceBase constructor', () => {
    test('Retains the supplied IJivsDomServices instance', () => {
        let { domServices, testItem } = setup();

        expect(testItem.publicify_domServices).toBe(domServices);
    });

    test('Rejects null or undefined IJivsDomServices', () => {
        expect(() => new TestDomService(null as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
        expect(() => new TestDomService(undefined as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
    });
});

// The base class creates one LoggingFacade lazily and configures it for the DOM feature and service identity.
describe('DomServiceBase.logger', () => {
    test('Lazily creates and caches a LoggingFacade', () => {
        let { testItem } = setup();

        let logger = testItem.publicify_logger;

        expect(logger).toBeInstanceOf(LoggingFacade);
        expect(testItem.publicify_logger).toBe(logger);
    });

    test('Logs with the DOM feature, service class, and default class-name identity', () => {
        let { logger, testItem } = setup();

        testItem.writeLog(LoggingLevel.Info, 'Service is ready');

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Info);
        expect(logger.calls[0].details).toMatchObject({
            message: 'Service is ready',
            feature: 'Dom',
            type: testItem,
            identity: 'TestDomService'
        });
    });

    test('Uses an overridden service identity', () => {
        let logger = new RecordingLoggingService();
        let domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let testItem = new TestDomServiceWithCustomIdentity(domServices);

        testItem.writeLog(LoggingLevel.Warn, 'Custom identity');

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].details).toMatchObject({
            feature: 'Dom',
            type: testItem,
            identity: 'CustomServiceIdentity'
        });
    });

    test('Allows logging when the engine logging service is absent', () => {
        let domServices = createMockJivsDomServices({
            services: { loggingService: null } as unknown as IJivsServices
        });
        let testItem = new TestDomService(domServices);

        expect(() => testItem.writeLog(LoggingLevel.Info, 'No logger configured')).not.toThrow();
        expect(testItem.publicify_logger).toBeInstanceOf(LoggingFacade);
    });
});
