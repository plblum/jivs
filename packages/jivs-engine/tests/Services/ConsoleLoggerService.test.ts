import { jest } from '@jest/globals';
import { LogDetails, LogErrorDetails, LogOptions, LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";

describe('ConsoleLoggerService constructor and supporting properties', () => {
    test('Default parameters', () => {
        let testItem = new ConsoleLoggerService();
        expect(testItem.minLevel).toBe(LoggingLevel.Warn);
        expect(testItem.mainLogger).toBeNull();
        expect(testItem.showStack).toBe(false);
        expect(testItem.serviceName).toBe('ConsoleLoggerService');
        expect(testItem.includeData).toBe(false);
    });

});
// log(message: string, level: LoggingLevel, category?: string, source?: string): void;

describe('ConsoleLoggerService.log', () => {
    function messageOnly(options?: LogOptions): LogDetails {
        return {
            message: 'Message'
        };
    }   
    test('Debug', () => {
        const logSpy = jest.spyOn(console, 'debug');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Debug, messageOnly)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({ message: 'Message' });
        logSpy.mockReset();
    });
    test('Info', () => {
        const logSpy = jest.spyOn(console, 'log');  // not console.info
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Info, messageOnly)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({ message: 'Message' });
        logSpy.mockReset();
    });    
    test('Warn', () => {
        const logSpy = jest.spyOn(console, 'warn');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Warn, messageOnly)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({ message: 'Message' });
        logSpy.mockReset();
    });    
    test('Error', () => {
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Error, messageOnly)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({ message: 'Message' });
        logSpy.mockReset();
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
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Error, handler)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({
            message: 'Message',
            type: 'TypeAsString',
            category: LoggingCategory.Configuration,
            feature: 'Feature',
            identity: 'Identity',
        });
        logSpy.mockReset();
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
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log(LoggingLevel.Error, handler)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({
            message: 'Message',
            type: 'TestClass',
            category: LoggingCategory.Configuration,
            feature: 'Feature',
            identity: 'Identity',
        });
        logSpy.mockReset();
    });                
});

describe('logError()', () => {

    test('Handler returns no additional info', () => {
        function handler(options?: LogOptions): LogErrorDetails {
            return {
            } as any;
        }           
        let error = new Error('Message');
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Error);
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({
            message: 'Message',
            category: LoggingCategory.Exception,
         });
        logSpy.mockReset();
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
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Error);
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({
            message: 'Message',
            category: LoggingCategory.Exception,
            feature: 'Feature',
            identity: 'Identity',
            type: 'TypeAsString',
        });
        logSpy.mockReset();
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
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Error);
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith({
            message: 'Message',
            category: LoggingCategory.Exception,
            feature: 'Feature',
            identity: 'Identity',
            type: 'TestClass',
        });
        logSpy.mockReset();
    });    
    test('Set showStack property to true includes the stack', () => {
        function handler(options?: LogOptions): LogErrorDetails {
            return {
            } as any;
        }           
        let error = new Error('Message');
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Error);
        testItem.showStack = true;
        expect(() => testItem.logError(error, handler)).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Message',
            category: LoggingCategory.Exception,
            stack: expect.anything()
         }));
        logSpy.mockReset();
    });

});
