import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { MockCapturingLogger } from "../Mocks";
describe('ConsoleLoggerService constructor and supporting properties', () => {
    test('Default parameters', () => {
        let testItem = new ConsoleLoggerService();
        expect(testItem.minLevel).toBe(LoggingLevel.Warn);
        expect(testItem.mainLogger).toBeNull();
    });
    test('All parameters supplied', () => {
        let altLogger = {
            log: (message, level, category, source) => void {},
            minLevel: LoggingLevel.Debug
        };
        let testItem = new ConsoleLoggerService(LoggingLevel.Info, altLogger);
        expect(testItem.minLevel).toBe(LoggingLevel.Info);
        expect(testItem.mainLogger).toBe(altLogger);
    });
    test('Change minLevel', () => {
        let testItem = new ConsoleLoggerService();
        testItem.minLevel = LoggingLevel.Debug;
        expect(testItem.minLevel).toBe(LoggingLevel.Debug);
        expect(testItem.mainLogger).toBeNull();
    });
});
// log(message: string, level: LoggingLevel, category?: string, source?: string): void;
describe('ConsoleLoggerService.log', () => {
    test('Debug', () => {
        const logSpy = jest.spyOn(console, 'debug');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Info', () => {
        const logSpy = jest.spyOn(console, 'log'); // not console.info
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Info)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Warn', () => {
        const logSpy = jest.spyOn(console, 'warn');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Error', () => {
        const logSpy = jest.spyOn(console, 'error');
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug);
        expect(() => testItem.log('Message', LoggingLevel.Error)).not.toThrow();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockReset();
    });
});
describe('ConsoleLoggerService.log without output when LoggingLevel is too low', () => {
    test('Debug', () => {
        const logSpy = jest.spyOn(console, 'debug');
        let testItem = new ConsoleLoggerService(LoggingLevel.Info);
        expect(() => testItem.log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Info', () => {
        const logSpy = jest.spyOn(console, 'log'); // not console.info
        let testItem = new ConsoleLoggerService(LoggingLevel.Warn);
        expect(() => testItem.log('Message', LoggingLevel.Info)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });
    test('Warn', () => {
        const logSpy = jest.spyOn(console, 'warn');
        let testItem = new ConsoleLoggerService(LoggingLevel.Error);
        expect(() => testItem.log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockReset();
    });
});
describe('ConsoleLoggerService.log using MainLogger to also capture content', () => {
    test('Debug', () => {
        var _a;
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Debug)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect((_a = mainLogger.getLatest()) === null || _a === void 0 ? void 0 : _a.level).toBe(LoggingLevel.Debug);
    });
    test('Info', () => {
        var _a;
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Info)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect((_a = mainLogger.getLatest()) === null || _a === void 0 ? void 0 : _a.level).toBe(LoggingLevel.Info);
    });
    test('Warn', () => {
        var _a;
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Warn)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect((_a = mainLogger.getLatest()) === null || _a === void 0 ? void 0 : _a.level).toBe(LoggingLevel.Warn);
    });
    test('Error', () => {
        var _a;
        let mainLogger = new MockCapturingLogger();
        mainLogger.minLevel = LoggingLevel.Debug;
        let testItem = new ConsoleLoggerService(LoggingLevel.Debug, mainLogger);
        expect(() => testItem.log('Message', LoggingLevel.Error)).not.toThrow();
        expect(mainLogger.entryCount()).toBeGreaterThan(0);
        expect((_a = mainLogger.getLatest()) === null || _a === void 0 ? void 0 : _a.level).toBe(LoggingLevel.Error);
    });
});
//# sourceMappingURL=ConsoleLoggerService.test.js.map