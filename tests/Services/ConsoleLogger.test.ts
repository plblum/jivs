import { ILogger, LoggingLevel } from "../../src/Interfaces/Logger";
import { ConsoleLogger } from "../../src/Services/ConsoleLogger";
import { MockCapturingLogger } from "../Mocks";



describe('ConsoleLogger constructor and supporting properties', () => {
    test('Default parameters', () => {
        let testItem = new ConsoleLogger();
        expect(testItem.minLevel).toBe(LoggingLevel.Warn);
        expect(testItem.mainLogger).toBeNull();
    });
    test('All parameters supplied', () => {
        let altLogger: ILogger = {
            log: (message: string, level: LoggingLevel, category?: string, source?: string) => void
                {
                    
                },
            minLevel: LoggingLevel.Debug

        };
        let testItem = new ConsoleLogger(LoggingLevel.Info, altLogger);
        expect(testItem.minLevel).toBe(LoggingLevel.Info);
        expect(testItem.mainLogger).toBe(altLogger);
    });    
    test('Change minLevel', () => {
        let testItem = new ConsoleLogger();
        testItem.minLevel = LoggingLevel.Debug;
        expect(testItem.minLevel).toBe(LoggingLevel.Debug);
        expect(testItem.mainLogger).toBeNull();
    });    
});
// log(message: string, level: LoggingLevel, category?: string, source?: string): void;
describe('ConsoleLogger.log', () => {
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


describe('ConsoleLogger.log without output when LoggingLevel is too low', () => {
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

describe('ConsoleLogger.log using MainLogger to also capture content', () => {
    test('Debug', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Debug);
    });
    test('Info', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Info)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Info);
    });    
    test('Warn', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Warn);
    });    
    test('Error', () => {
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLogger(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Error)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect(mainLogger.getLatest()?.level).toBe(LoggingLevel.Error);
    });
});