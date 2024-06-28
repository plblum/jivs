import { LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from '../../src/Interfaces/LoggerService';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { createValidationServicesForTesting } from '../TestSupport/createValidationServices';
import { ServiceWithAccessorBase } from '../../src/Services/ServiceWithAccessorBase';
import { TestLogCallsLoggingService } from '../TestSupport/TestLogCallsLoggingService';

function createServices(): { logger: TestLogCallsLoggingService, services: IValidationServices } {
    let services = createValidationServicesForTesting();    // has both resolvers created
    return { logger: setupTestLogCallsLogger(services, LoggingLevel.Error), services: services };
}
function setupTestLogCallsLogger(services: IValidationServices, level: LoggingLevel): TestLogCallsLoggingService {
    let logger = new TestLogCallsLoggingService();
    services.loggerService = logger;
    return logger;
}
class Publicify_ServiceWithAccessorBase extends ServiceWithAccessorBase {
    constructor() {
        super();
    }

    public publicify_log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
        super.log(level, gatherFn);
    }

    public publicify_logQuick(level: LoggingLevel, messageFn: () => string): void {
        super.logQuick(level, messageFn);

    }
    public publicify_logError(error: Error, gatherFn?: logGatheringErrorHandler): void {
        super.logError(error, gatherFn);
    }

    public publicify_hasServices(): boolean {
        return super.hasServices();
    }
}


describe('ConfigMergeServiceBase using a subclass to expose protected members', () => {


    describe('constructor', () => {
        test('create, attach services, and dispose ', () => {
            let testItem = new Publicify_ServiceWithAccessorBase();
            expect(testItem.publicify_hasServices()).toBe(false);
            let services = createValidationServicesForTesting();
            expect(() => testItem.services = services).not.toThrow();
            expect(testItem.publicify_hasServices()).toBe(true);
            expect(() => testItem.dispose()).not.toThrow();
            expect(testItem.publicify_hasServices()).toBe(false);

        });
    });

});

describe('logError', () => {
    test('No services, does nothing even with an error thrown', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        const error = new Error('Test error');
        expect(() => testItem.publicify_logError(error)).not.toThrow();
    });
    test('With services, logs the error correctly', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        let setup = createServices();
        testItem.services = setup.services;
        const error = new Error('Test error');
        testItem.publicify_logError(error);
        expect(setup.logger.lastLogDetails).toEqual({
            message: 'Test error',
            category: LoggingCategory.Exception,
            feature: 'service',
            type: 'Publicify_ServiceWithAccessorBase',
            identity: testItem.serviceName
        });
    });
    test('Gather function is called and additional data is logged', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        let setup = createServices();
        testItem.services = setup.services;
        const error = new Error('Test error with additional data');
        let gatherCalled = false;
        const gatherFn: logGatheringErrorHandler = (options) => {
            gatherCalled = true;
            return { data: { additionalData: 'Extra info' } };
        };
        testItem.publicify_logError(error, gatherFn);
        expect(gatherCalled).toBe(true);
        expect(setup.logger.lastLogDetails).toEqual({
            message: 'Test error with additional data',
            category: LoggingCategory.Exception,
            data: { additionalData: 'Extra info' },
            feature: 'service',
            type: 'Publicify_ServiceWithAccessorBase',
            identity: testItem.serviceName
        });
    });
    test('Error logged without gather function still captures basic error information', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        let setup = createServices();
        testItem.services = setup.services;
        const error = new Error('Basic error information');
        testItem.publicify_logError(error);
        expect(setup.logger.lastLogDetails).toEqual({
            message: 'Basic error information',
            category: LoggingCategory.Exception,
            feature: 'service',
            type: 'Publicify_ServiceWithAccessorBase',
            identity: testItem.serviceName
        });
    });
});

describe('log()', () => {
    test('log function does not throw when no services are set', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        expect(() => testItem.publicify_log(LoggingLevel.Info, () => {
            return { message: 'Test message with no services' };
        })).not.toThrow();
    });

    test('log function correctly logs a message with services set', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        let setup = createServices();
        testItem.services = setup.services;
        testItem.publicify_log(LoggingLevel.Info, () => {
            return { message: 'Test message with no services' };
        });
        expect(setup.logger.lastLogDetails).toEqual({
            message: 'Test message with no services',
            feature: 'service',
            type: 'Publicify_ServiceWithAccessorBase',
            identity: testItem.serviceName
        });
    });


    test('log function gathers and logs detailed information when provided a gather function', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        let setup = createServices();
        testItem.services = setup.services;
        let gatherCalled = false;
        const gatherFn: logGatheringHandler = (options) => {
            gatherCalled = true;
            return { message: 'TestMessage', category: LoggingCategory.Result, data: { key: 'value' } };
        };
        testItem.publicify_log(LoggingLevel.Info, gatherFn);
        expect(gatherCalled).toBe(true);
        expect(setup.logger.lastLogDetails).toEqual({
            message: 'TestMessage',
            category: LoggingCategory.Result,
            data: { key: 'value' },
            feature: 'service',
            type: 'Publicify_ServiceWithAccessorBase',
            identity: testItem.serviceName
        });
    });
});
describe('logQuick()', () => {

    test('logQuick function logs simple messages without needing a gather function', () => {
        let testItem = new Publicify_ServiceWithAccessorBase();
        let setup = createServices();
        testItem.services = setup.services;
        testItem.publicify_logQuick(LoggingLevel.Info, () => 'Quick log message');
        expect(setup.logger.lastLogDetails).toEqual({
            message: 'Quick log message',
            feature: 'service',
            type: 'Publicify_ServiceWithAccessorBase',
            identity: testItem.serviceName
        });        
    });

});