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

    public publicify_matchToOverrides(logLevel: LoggingLevel, logDetails: LogDetails): boolean {
        return this.matchToOverrides(logLevel, logDetails);
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

describe('TestLoggerServiceBase.log using chainedLogger to also capture content', () => {
    function messageOnly(options?: LogOptions): LogDetails {
        return {
            message: 'Message'
        };
    }
    test('Debug', () => {
        let chainedLogger = new CapturingLogger();
        chainedLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, chainedLogger);
        expect(() => testItem.log(LoggingLevel.Debug, messageOnly)).not.toThrow();
        expect(chainedLogger.findMessage('Message', LoggingLevel.Debug, null)).toBeTruthy();
    });
    test('Info', () => {
        let chainedLogger = new CapturingLogger();
        chainedLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, chainedLogger);
        expect(() => testItem.log(LoggingLevel.Info, messageOnly)).not.toThrow();
        expect(chainedLogger.findMessage('Message', LoggingLevel.Info, null)).toBeTruthy();
    });
    test('Warn', () => {
        let chainedLogger = new CapturingLogger();
        chainedLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, chainedLogger);
        expect(() => testItem.log(LoggingLevel.Warn, messageOnly)).not.toThrow();
        expect(chainedLogger.findMessage('Message', LoggingLevel.Warn, null)).toBeTruthy();
    });
    test('Error', () => {
        let chainedLogger = new CapturingLogger();
        chainedLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, chainedLogger);
        expect(() => testItem.log(LoggingLevel.Error, messageOnly)).not.toThrow();
        expect(chainedLogger.findMessage('Message', LoggingLevel.Error, null)).toBeTruthy();
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
    test('Using chainedLogger', () => {
        function handler(options?: LogOptions): LogErrorDetails {
            return {
            } as any;
        }

        let chainedLogger = new CapturingLogger();
        chainedLogger.minLevel = LoggingLevel.Debug;
        let testItem = new TestLoggerServiceBase(LoggingLevel.Debug, chainedLogger);
        let error = new Error('Message');
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(testItem.lastLogDetails).toEqual(
            {
                message: 'Message',
                category: LoggingCategory.Exception,

            });
        expect(testItem.lastLevel).toBe(LoggingLevel.Error);
        expect(chainedLogger.findMessage('Message', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();

    });

});
describe('OverrideMinLevelWhen features', () => {
    let logger: TestLoggerServiceBase;

    beforeEach(() => {
        logger = new TestLoggerServiceBase();
    });

    describe('matchToOverrides', () => {
        it('should return true when there are no overrides', () => {
            const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'test' });
            expect(result).toBe(true);
        });

        describe('message parameter', () => {
            it('should find a message by partial string match', () => {
                logger.overrideMinLevelWhen({ level: LoggingLevel.Info, message: 'test message' });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'This is a test message', });
                expect(result).toBe(true);
            });

            it('should reject when the log data lacks the message', () => {
                logger.overrideMinLevelWhen({ level: LoggingLevel.Info, message: 'test message' });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, {  } as any);
                expect(result).toBe(false);
            });            
            // case insensitive string match
            it('should find a message by partial string match, case insensitive', () => {
                logger.overrideMinLevelWhen({ level: LoggingLevel.Info, message: 'TEST MESSAGE' });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'This is a test message' });
                expect(result).toBe(true);
            });
            it('should find a message by RegExp', () => {
                logger.overrideMinLevelWhen({ message: /RegExp match/ });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'RegExp match test' } );
                expect(result).toBe(true);
            });            
            // case insensitive regexp match
            it('should find a message by RegExp, case insensitive', () => {
                logger.overrideMinLevelWhen({ message: /regexp match/i });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'RegExp match test' });
                expect(result).toBe(true);
            });

            // case sensitive exact match regexp
            it('should find a message by RegExp, case sensitive', () => {
                logger.overrideMinLevelWhen({ message: /RegExp match/i });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'RegExp match test' });
                expect(result).toBe(true);
            });

            it('should return false if no message matches the criteria', () => {
                logger.overrideMinLevelWhen({ message: 'nonexistent message' });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, {  message: 'This will not match' });
                expect(result).toBe(false);
            });
    
            it('should handle complex RegExp searches', () => {
                logger.overrideMinLevelWhen({ message: /Complex RegExp search \d+/ });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'Complex RegExp search 123' });
                expect(result).toBe(true);
            });
    
            it('should return false when searching with a RegExp that does not match', () => {
                logger.overrideMinLevelWhen({ message: /RegExp that does not match/ });
                const result = logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'No match for this RegExp' });
                expect(result).toBe(false);
            });
            // with several messages, should return the first match
            it('should support multiple overrides', () => {
                logger.overrideMinLevelWhen({ message: 'match' });
                logger.overrideMinLevelWhen({ message: 'Sec' });
                logger.overrideMinLevelWhen({ message: 'Third' });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'First match' })).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'second match' })).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'THIRD' })).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { message: 'nope' })).toBe(false);

            });

        });
        describe('level parameter', () => {
            it('should return true when matches and false when does not', () => {
                logger.overrideMinLevelWhen({ level: LoggingLevel.Info });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {} as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Debug, { } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Warn, { } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, { } as any)).toBe(false);

            });
            it('should support multiple overrides', () => {
                logger.overrideMinLevelWhen({ level: LoggingLevel.Info });
                logger.overrideMinLevelWhen({ level: LoggingLevel.Error });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {} as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Debug, { } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Warn, { } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, { } as any)).toBe(true);
            });
            
        });

        describe('category parameter', () => {
            it('should return true when matches and false when does not', () => {
                logger.overrideMinLevelWhen({ category: LoggingCategory.Configuration });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { category: LoggingCategory.Configuration } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { category: LoggingCategory.Exception } as any)).toBe(false);
            });            
            it('should support multiple overrides', () => {
                logger.overrideMinLevelWhen({ category: LoggingCategory.Configuration });
                logger.overrideMinLevelWhen({ category: LoggingCategory.TypeMismatch });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { category: LoggingCategory.Configuration} as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { category: LoggingCategory.None } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { category: LoggingCategory.TypeMismatch } as any)).toBe(true);
            });
        });

        describe('type parameter', () => {
            it('should return true when matches and false when does not', () => {
                logger.overrideMinLevelWhen({ type: 'Type1' });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'Type1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'type1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'Type2' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {  } as any)).toBe(false);
            });

            it('should return true when matches and false when does not when the value is a Class type. Always case sensitive with class type', () => {
                class TestClass { }
                logger.overrideMinLevelWhen({ type: TestClass });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'TestClass' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'testclass' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'Type2' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {  } as any)).toBe(false);
            });


            // type is a regexp 
            it('should return true when matches and false when does not when the value is a RegExp', () => {
                logger.overrideMinLevelWhen({ type: /Type/i });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'Type1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'Type2' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'type3' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'NO Match' } as any)).toBe(false);
            });
            it('should support multiple overrides with type as string, regexp, and Class', () => {
                class TestClass { }
                logger.overrideMinLevelWhen({ type: /Type/i });
                logger.overrideMinLevelWhen({ type: 'Type1' });
                logger.overrideMinLevelWhen({ type: TestClass });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'Type1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'Type2' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'type3' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'NO Match' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { type: 'TestClass' } as any)).toBe(true);
            });

        });
        describe('feature parameter', () => {
            it('should return true when matches and false when does not', () => {
                logger.overrideMinLevelWhen({ feature: 'Feature1' });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'Feature1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'feature1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'Feature2' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { } as any)).toBe(false);
            });

            // feature is a regexp 
            it('should return true when matches and false when does not using RegExp', () => {
                logger.overrideMinLevelWhen({ feature: /Feature/i });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'Feature1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'feature2' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'No match' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {  } as any)).toBe(false);
            });
            // feature is a regexp that does not match
            it('should support multiple overrides', () => {
                logger.overrideMinLevelWhen({ feature: /Feature/i });
                logger.overrideMinLevelWhen({ feature: 'Feature1' });
                logger.overrideMinLevelWhen({ feature: 'Feature2' });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'Feature1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'feature2' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { feature: 'No match' } as any)).toBe(false);
            });
        });
        describe('identity parameter', () => {
            it('should return true when matches and false when does not', () => {
                logger.overrideMinLevelWhen({ identity: 'Identity1' });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'Identity1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'identity1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'Identity2' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { } as any)).toBe(false);
            });

            // identity is a regexp 
            it('should return true when matches and false when does not with a regexp', () => {
                logger.overrideMinLevelWhen({ identity: /Identity/i });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'Identity1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'identity2' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'No match' } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {  } as any)).toBe(false);
            });

            it('should support multiple overrides', () => {
                logger.overrideMinLevelWhen({ identity: /Identity/i });
                logger.overrideMinLevelWhen({ identity: 'Identity1' });
                logger.overrideMinLevelWhen({ identity: 'Identity2' });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'Identity1' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'identity2' } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { identity: 'No match' } as any)).toBe(false);
            });
        });
        describe('hasData parameter', () => {
            it('should return false with no data and true when there is data if hasData parameter is true', () => {
                logger.overrideMinLevelWhen({
                    hasData: true
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value1' } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {} as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: null } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: {different: 100} } as any)).toBe(true);
            });
            it('should return false with data and true when there is not data if hasData parameter is false', () => {
                logger.overrideMinLevelWhen({
                    hasData: false
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value1' } } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {} as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: null } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: {different: 100} } as any)).toBe(false);
            });
            // multiple overrides
            it('should support multiple overrides covering both true and false cases will match everything', () => {
                logger.overrideMinLevelWhen({
                    hasData: true
                });
                logger.overrideMinLevelWhen({
                    hasData: false
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value1' } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {} as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: null } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: {different: 100} } as any)).toBe(true);
            });

            // hasData is ignored when the FindMoreCapturedLogDetails object also has data property setup
            it('should ignore hasData parameter when data parameter is also set', () => {
                logger.overrideMinLevelWhen({
                    hasData: false,
                    data: { key: 'value1' }
                });
                logger.overrideMinLevelWhen({
                    hasData: false,
                    data: { }
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value1' } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value2' } } as any)).toBe(true);
            });
        });

        describe('data parameter', () => {
            it('should return true when matches and false when does not where value is string', () => {
                logger.overrideMinLevelWhen({
                    data: { key: 'value1' }
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value1' } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value2' } } as any)).toBe(false);
            });
            it('should return true when matches and false when does not where value is number', () => {
                logger.overrideMinLevelWhen({
                    data: { key: 100 }
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 100 } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 200 } } as any)).toBe(false);
            });
            it('should return true when matches and false when does not where value is boolean', () => {
                logger.overrideMinLevelWhen({
                    data: { key: true }
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: true } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: false } } as any)).toBe(false);
            });
            it('should return true when matches and false when does not where value is object', () => {
                logger.overrideMinLevelWhen({
                    data: { key: { subkey: 'value' } }
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: { subkey: 'value' } } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: { subkey: 'no match' } } } as any)).toBe(false);
            });
            it('should return true when matches and false when does not where value is array', () => {
                logger.overrideMinLevelWhen({
                    data: { key: ['value1', 'value2'] }
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: ['value1', 'value2'] } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: ['value1', 'no match'] } } as any)).toBe(false);
            });
            // multiple overrides covering different keys and data types
            it('should support multiple overrides covering different keys and data types', () => {
                logger.overrideMinLevelWhen({
                    data: { key: 'value1' }
                });
                logger.overrideMinLevelWhen({
                    data: { key: 100 }
                });
                logger.overrideMinLevelWhen({
                    data: { key: true }
                });
                logger.overrideMinLevelWhen({
                    data: { key: { subkey: 'value' } }
                });
                logger.overrideMinLevelWhen({
                    data: { key: ['value1', 'value2'] }
                });
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'value1' } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 100 } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: true } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: { subkey: 'value' } } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: ['value1', 'value2'] } } as any)).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 'no match' } } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: 200 } } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: false } } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: { subkey: 'no match' } } } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key: ['value1', 'no match'] } } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: {  } } as any)).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, { data: { key2: 'value1' } } as any)).toBe(false);
            });
        });

        describe('combined parameters', () => {
            function addData(): void
            {
                logger.overrideMinLevelWhen({
                    level: LoggingLevel.Info, message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                // change parameters, omit data
                logger.overrideMinLevelWhen({
                    level: LoggingLevel.Error, message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2',
                    feature: 'Feature2', identity: 'Identity2'
                });

            }
            // write tests for all possible combinations of parameters
            it('should return true when all parameters match to Message1 override', () => {
                addData();
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {
                    message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1', feature: 'Feature1',
                    identity: 'Identity1', data: { key: 'value1' }
                })).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {
                    message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1', feature: 'Feature1',
                    identity: 'Identity1', data: { key: 'value2' }
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {
                    message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1', feature: 'Feature1',
                    identity: 'Identity1'
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {
                    message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1', feature: 'Feature1',
                    identity: 'Identity2', data: { key: 'value1' }
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {
                    message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1', feature: 'Feature2',
                    identity: 'Identity1', data: { key: 'value1' }
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {
                    message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature1',
                    identity: 'Identity1', data: { key: 'value1' }
                })).toBe(false);    
                expect(logger.publicify_matchToOverrides(LoggingLevel.Debug, {
                    message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1', feature: 'Feature1',
                    identity: 'Identity1', data: { key: 'value1' }
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Info, {
                    message: 'Message1',
                    category: LoggingCategory.TypeMismatch, type: 'Type1', feature: 'Feature1',
                    identity: 'Identity1'
                })).toBe(false);
            });
            it('should return true when all parameters match to Message2 override', () => {
                addData();
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature2',
                    identity: 'Identity2'
                })).toBe(true);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature2',
                    identity: 'Identity2', data: null!
                })).toBe(true); // override does not look for data
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature2',
                    identity: 'Identity2', data: { key: 'value1' }
                })).toBe(true); // override does not look for data
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature2',
                    identity: 'Identity2', data: { key: 'value2' }
                })).toBe(true); // override does not look for data
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type3', feature: 'Feature2',
                    identity: 'Identity2', data: { key: 'value1' }
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature2',
                    identity: 'Identity3', data: { key: 'value1' }
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature3',
                    identity: 'Identity2', data: { key: 'value1' }
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Debug, {
                    message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type2', feature: 'Feature2',
                    identity: 'Identity2'
                })).toBe(false);
                expect(logger.publicify_matchToOverrides(LoggingLevel.Error, {
                    message: 'Message2',
                    category: LoggingCategory.TypeMismatch, type: 'Type2', feature: 'Feature2',
                    identity: 'Identity2'
                })).toBe(false);
            });


        });

    });
});