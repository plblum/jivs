import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { DispatcherBase } from '../../src/Dispatchers/DispatcherBase';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Exposes the protected service accessor and logging wrapper for focused DispatcherBase tests.
 */
class TestDispatcher extends DispatcherBase
{
    public get publicify_domServices(): IJivsDomServices
    {
        return this.domServices;
    }

    public emitLog(level: LoggingLevel, message: string,
        targetElement: HTMLElement | null, valueHost: IFieldValueHost | null): void
    {
        this.log(level, message, targetElement, valueHost);
    }
}

/**
 * Creates DispatcherBase with a real DomLoggingFacade and a recording engine logger.
 * @param callGatherFn - Whether the logger evaluates lazy log-detail preparation.
 */
function setup(callGatherFn: boolean = true): {
    domServices: IJivsDomServices,
    logger: RecordingLoggingService,
    testItem: TestDispatcher
}
{
    let logger = new RecordingLoggingService(callGatherFn);
    let jivsServices = { loggingService: logger } as unknown as IJivsServices;
    let domServices = {
        loggingFacade: new DomLoggingFacade(jivsServices)
    } as unknown as IJivsDomServices;
    return {
        domServices: domServices,
        logger: logger,
        testItem: new TestDispatcher(domServices)
    };
}

// DispatcherBase requires its shared DOM services dependency and retains the exact instance supplied.
describe('DispatcherBase constructor', () => {
    test('Stores the IJivsDomServices instance for subclasses to use', () => {
        let { domServices, testItem } = setup();

        expect(testItem.publicify_domServices).toBe(domServices);
    });
    test('Rejects a null IJivsDomServices argument', () => {
        expect(() => new TestDispatcher(null as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
    });
    test('Rejects an undefined IJivsDomServices argument', () => {
        expect(() => new TestDispatcher(undefined as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
    });
});

// DispatcherBase prepares context-aware details through the configured facade and submits them at the requested level.
describe('DispatcherBase.log', () => {
    test('Logs the token-expanded message, element and value-host context, and dispatcher source', () => {
        let { logger, testItem } = setup();
        let element = document.createElement('input');
        element.id = 'email-input';
        let valueHost = createStubFieldValueHost('Email', 'email');

        testItem.emitLog(LoggingLevel.Warn, 'Element {element} belongs to {valuehost}', element, valueHost);

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details).toMatchObject({
            message: 'Element email-input belongs to Email',
            feature: 'Dom',
            type: testItem,
            data: {
                idAttribute: 'email-input',
                valueHostName: 'Email'
            }
        });
    });
    test('Supports missing element and value-host context in the log message', () => {
        let { logger, testItem } = setup();

        testItem.emitLog(LoggingLevel.Info, 'Element={element}; field={valuehost}', null, null);

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].details).toMatchObject({
            message: 'Element=; field=',
            feature: 'Dom',
            type: testItem,
            data: {}
        });
    });
    test('Delegates lazy detail preparation to the logger', () => {
        let { logger, testItem } = setup(false);

        testItem.emitLog(LoggingLevel.Debug, 'Not gathered', null, null);

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Debug);
        expect(logger.calls[0].details).toBeUndefined();
    });
});
