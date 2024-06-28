import { jest } from '@jest/globals';
import { ILoggerService, LogDetails, LogErrorDetails, LogOptions, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from "../../src/Interfaces/LoggerService";

import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { LoggerServiceBase } from '../../src/Services/LoggerServiceBase';

class TestLoggerServiceBase extends LoggerServiceBase {

    public get serviceName(): string {
        return this._serviceName;
    }
    public set serviceName(value: string) {
        this._serviceName = value;
    }
    private _serviceName: string = 'TestLoggerServiceBase';

    protected writeLog(level: LoggingLevel, logDetails: LogDetails): void {
        this.lastLevel = level;
        this.lastLogDetails = logDetails;
    }
    public lastLogDetails: LogDetails | LogErrorDetails | null = null;
    public lastLevel: LoggingLevel | null = null;
    protected getLogOptions(): LogOptions | undefined {
        return undefined;
    }    
}

describe('TestLoggerServiceBase.log', () => {
    function messageOnly(options?: LogOptions): LogDetails {
        return {
            message: 'Message'
        };
    }
    test('Debug', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Debug, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual({ message: 'Message' });
        expect(testItem.lastLevel).toBe(LoggingLevel.Debug);
    });
    test('Info', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Info, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual({ message: 'Message' });
        expect(testItem.lastLevel).toBe(LoggingLevel.Info);
    });
    test('Warn', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Warn, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual({ message: 'Message' });
        expect(testItem.lastLevel).toBe(LoggingLevel.Warn);
    });
    test('Error', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Error, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual({ message: 'Message' });
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
    });
    test('Error with all parameters, where type is a string', () => {
        function handler(options?: LogOptions): LogDetails {
            return {
                message: 'Message',
                type: 'TypeAsString',
                category: LoggingCategory.Configuration,
                feature: 'Feature',
                identity: 'Identity',
            };
        }
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual({
            message: 'Message',
            type: 'TypeAsString',
            category: LoggingCategory.Configuration,
            feature: 'Feature',
            identity: 'Identity',
        }

        );
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);

    });
    test('Error with all parameters, where type is a class instance', () => {
        function handler(options?: LogOptions): LogDetails {
            let testClass = new TestClass();
            return {
                message: 'Message',
                type: testClass,
                category: LoggingCategory.Configuration,
                feature: 'Feature',
                identity: 'Identity',
            };
        }
        class TestClass {

        }

        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual(
            {
                message: 'Message',
                type: 'TestClass',
                category: LoggingCategory.Configuration,
                feature: 'Feature',
                identity: 'Identity',
            }
        );
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
    });
});


describe('TestLoggerServiceBase.log without output when LoggingLevel is too low', () => {
    function messageOnly(options?: LogOptions): LogDetails {
        return {
            message: 'Message'
        };
    }

    test('Debug', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Info);
        expect(() => testItem.log(LoggingLevel.Debug, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).toBeNull();
        expect(testItem.lastLevel).toBeNull();
    });
    test('Info', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Warn);
        expect(() => testItem.log(LoggingLevel.Info, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).toBeNull();
        expect(testItem.lastLevel).toBeNull();
    });
    test('Warn', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Error);
        expect(() => testItem.log(LoggingLevel.Warn, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).toBeNull();
        expect(testItem.lastLevel).toBeNull();
    });
    test('Error is always output', () => {
        let testItem = new TestLoggerServiceBase(LoggingLevel.Error);
        expect(() => testItem.log(LoggingLevel.Error, messageOnly)).not.toThrow();
        expect(testItem.lastLogDetails).not.toBeNull();
        expect(testItem.lastLevel).not.toBeNull();
    });
});

describe('TestLoggerServiceBase.log using MainLogger to also capture content', () => {
    function messageOnly(options?: LogOptions): LogDetails {
        return {
            message: 'Message'
        };
    }
    test('Debug', () => {
        let mainLogger = new CapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log(LoggingLevel.Debug, messageOnly)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Debug);
    });
    test('Info', () => {
        let mainLogger = new CapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log(LoggingLevel.Info, messageOnly)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Info);
    });
    test('Warn', () => {
        let mainLogger = new CapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log(LoggingLevel.Warn, messageOnly)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Warn);
    });
    test('Error', () => {
        let mainLogger = new CapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log(LoggingLevel.Error, messageOnly)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Error);
    });
});

describe('logError()', () => {

    test('Handler returns no additional info', () => {
        function handler(options?: LogOptions): LogErrorDetails {
            return {
            } as any;
        }
        let error = new Error('Message');
        let testItem = new TestLoggerServiceBase(LoggingLevel.Error);
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual(
            {
                message: 'Message',
                category: LoggingCategory.Exception,

            });
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
    });
    test('Handler returns all additional info where type is a string', () => {
        function handler(options?: LogOptions): LogErrorDetails {
            return {
                feature: 'Feature',
                identity: 'Identity',
                type: 'TypeAsString',
            };
        }
        let error = new Error('Message');
        let testItem = new TestLoggerServiceBase(LoggingLevel.Error);
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual(
            {
                message: 'Message',
                category: LoggingCategory.Exception,
                feature: 'Feature',
                identity: 'Identity',
                type: 'TypeAsString',
            });
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
    });

    test('Handler returns all additional info where type is a class', () => {
        class TestClass {

        }
        function handler(options?: LogOptions): LogErrorDetails {
            return {
                feature: 'Feature',
                identity: 'Identity',
                type: new TestClass(),
            };
        }
        let error = new Error('Message');
        let testItem = new TestLoggerServiceBase(LoggingLevel.Error);
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual(
            {
                message: 'Message',
                category: LoggingCategory.Exception,
                feature: 'Feature',
                identity: 'Identity',
                type: 'TestClass',

            });
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
    });
    test('Set showStack property to true includes the stack', () => {
        function handler(options?: LogOptions): LogErrorDetails {
            return {
            } as any;
        }
        let error = new Error('Message');
        let testItem = new TestLoggerServiceBase(LoggingLevel.Error);
        testItem.showStack = true;
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual(expect.objectContaining(
            {
                message: 'Message',
                category: LoggingCategory.Exception,
                stack: expect.anything()
            }));
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
    });
    test('Using mainLogger', () => {
        function handler(options?: LogOptions): LogErrorDetails {
            return {
            } as any;
        }

        let mainLogger = new CapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, mainLogger);
        let error = new Error('Message');
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual(
            {
                message: 'Message',
                category: LoggingCategory.Exception,

            });
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Error);

    });

});
