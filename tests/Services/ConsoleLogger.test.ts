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
            Log: (message: string, level: LoggingLevel, category?: string, source?: string) => void
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
        expect(() => testItem.Log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Info', () => {
        const logSpy = jest.spyOn(console, 'log');  // not console.info
        let testItem = new ConsoleLogger(LoggingLevel.Debug);
        expect(() => testItem.Log('Message', LoggingLevel.Info)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });    
    test('Warn', () => {
        const logSpy = jest.spyOn(console, 'warn');
        let testItem = new ConsoleLogger(LoggingLevel.Debug);
        expect(() => testItem.Log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });    
    test('Error', () => {
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLogger(LoggingLevel.Debug);
        expect(() => testItem.Log('Message', LoggingLevel.Error)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });        
});


describe('ConsoleLogger.Log without output when LoggingLevel is too low', () => {
    test('Debug', () => {
        const logSpy = jest.spyOn(console, 'debug');
        let testItem = new ConsoleLogger(LoggingLevel.Info);
        expect(() => testItem.Log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Info', () => {
        const logSpy = jest.spyOn(console, 'log');  // not console.info
        let testItem = new ConsoleLogger(LoggingLevel.Warn);
        expect(() => testItem.Log('Message', LoggingLevel.Info)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });    
    test('Warn', () => {
        const logSpy = jest.spyOn(console, 'warn');
        let testItem = new ConsoleLogger(LoggingLevel.Error);
        expect(() => testItem.Log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });    
});

describe('ConsoleLogger.Log using MainLogger to also capture content', () => {
    test('Debug', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.Log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(mainLogger.EntryCount()).toBeGreaterThan(0);
        expect(mainLogger.GetLatest()?.Level).toBe(LoggingLevel.Debug);
    });
    test('Info', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.Log('Message', LoggingLevel.Info)).not.toThrow();
        expect(mainLogger.EntryCount()).toBeGreaterThan(0);
        expect(mainLogger.GetLatest()?.Level).toBe(LoggingLevel.Info);
    });    
    test('Warn', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.Log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(mainLogger.EntryCount()).toBeGreaterThan(0);
        expect(mainLogger.GetLatest()?.Level).toBe(LoggingLevel.Warn);
    });    
    test('Error', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.MinLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.Log('Message', LoggingLevel.Error)).not.toThrow();
        expect(mainLogger.EntryCount()).toBeGreaterThan(0);
        expect(mainLogger.GetLatest()?.Level).toBe(LoggingLevel.Error);
    });
});