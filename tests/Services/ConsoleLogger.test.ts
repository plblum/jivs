import { ILogger, LoggingLevel } from "../../src/Interfaces/Logger";
import { ConsoleLogger } from "../../src/Services/ConsoleLogger";
import { MockCapturingLogger } from "../Mocks";



describe('ConsoleLogger constructor and supporting properties', () => {
    test('Default parameters', () => {
        let testItem = new ConsoleLogger();
        expect(testItem.MinLevel).toBe(LoggingLevel.Warn);
        expect(testItem.MainLogger).toBeNull();
    });
    test('All parameters supplied', () => {
        let altLogger: ILogger = {
            log: (message: string, level: LoggingLevel, category?: string, source?: string) => void
                {
                    
                },
            MinLevel: LoggingLevel.Debug

        };
        let testItem = new ConsoleLogger(LoggingLevel.Info, altLogger);
        expect(testItem.MinLevel).toBe(LoggingLevel.Info);
        expect(testItem.MainLogger).toBe(altLogger);
    });    
    test('Change MinLevel', () => {
        let testItem = new ConsoleLogger();
        testItem.MinLevel = LoggingLevel.Debug;
        expect(testItem.MinLevel).toBe(LoggingLevel.Debug);
        expect(testItem.MainLogger).toBeNull();
    });    
});
// Log(message: string, level: LoggingLevel, category?: string, source?: string): void;
describe('ConsoleLogger.Log', () => {
    test('Debug', () => {
        const logSpy = jest.spyOn(console, 'debug');
        let testItem = new ConsoleLogger(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Info', () => {
        const logSpy = jest.spyOn(console, 'log');  // not console.info
        let testItem = new ConsoleLogger(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Info)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });    
    test('Warn', () => {
        const logSpy = jest.spyOn(console, 'warn');
        let testItem = new ConsoleLogger(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });    
    test('Error', () => {
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLogger(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Error)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });        
});


describe('ConsoleLogger.Log without output when LoggingLevel is too low', () => {
    test('Debug', () => {
        const logSpy = jest.spyOn(console, 'debug');
        let testItem = new ConsoleLogger(LoggingLevel.Info);
        expect(() => testItem.log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Info', () => {
        const logSpy = jest.spyOn(console, 'log');  // not console.info
        let testItem = new ConsoleLogger(LoggingLevel.Warn);
        expect(() => testItem.log('Message', LoggingLevel.Info)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });    
    test('Warn', () => {
        const logSpy = jest.spyOn(console, 'warn');
        let testItem = new ConsoleLogger(LoggingLevel.Error);
        expect(() => testItem.log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });    
});

describe('ConsoleLogger.Log using MainLogger to also capture content', () => {
    test('Debug', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.Level).toBe(LoggingLevel.Debug);
    });
    test('Info', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Info)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.Level).toBe(LoggingLevel.Info);
    });    
    test('Warn', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.Level).toBe(LoggingLevel.Warn);
    });    
    test('Error', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Error)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.Level).toBe(LoggingLevel.Error);
    });
});