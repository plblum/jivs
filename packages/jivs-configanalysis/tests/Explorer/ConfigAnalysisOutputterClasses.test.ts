import { jest } from '@jest/globals';
import { LoggingCategory, LoggingLevel, LogDetails } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { ConsoleLoggerService } from '@plblum/jivs-engine/build/Services/ConsoleLoggerService';
import { ConfigAnalysisResultsExplorerFactory } from '../../src/Explorer/ConfigAnalysisResultsExplorer';
import { JsonConfigAnalysisOutputFormatter, CleanedObjectConfigAnalysisOutputFormatter } from '../../src/Explorer/Formatters/ConfigAnalysisOutputFormatterClasses';
import { ConfigAnalysisOutputterBase, ConsoleConfigAnalysisOutputter, JsonConsoleConfigAnalysisOutputter, LoggerConfigAnalysisOutputter, NullConfigAnalysisOutputter } from '../../src/Explorer/Outputters/ConfigAnalysisOutputterClasses';
import { IConfigAnalysisOutputFormatter, ConfigAnalysisOutputReportData } from '../../src/Types/Explorer';
import { createServices } from '../TestSupport/support';


describe('IConfigAnalysisOutputter implementations', () => {
    let factory = new ConfigAnalysisResultsExplorerFactory();
    let services = createServices();

    describe('ConfigAnalysisOutputterBase', () => {
        // use a subclass to test the abstract class
        class Publicify_ConfigAnalysisOutputter extends ConfigAnalysisOutputterBase {

            constructor(formatter: IConfigAnalysisOutputFormatter) {
                super(formatter);

            }
            public formatCount: number = 0;
            public outputCount: number = 0;
            public get publicify_formatter(): IConfigAnalysisOutputFormatter {
                return super.formatter;
            }
            protected format(reportData: ConfigAnalysisOutputReportData): any {
                this.formatCount++;
                return super.format(reportData);
            }


            protected output(content: any): void {
                this.outputCount++;
            }
        }
        class NullFormater implements IConfigAnalysisOutputFormatter {
            format(valueHostQureportData: ConfigAnalysisOutputReportData): any {
                return null;
            }
        }   

        function executeSend(reportData: ConfigAnalysisOutputReportData) {
            let formatter = new NullFormater();
            let outputter = new Publicify_ConfigAnalysisOutputter(formatter);
            outputter.send(reportData);
            return outputter;
        }
    
        test('ConfigAnalysisOutputterBase.send({}) calls ConfigAnalysisOutputterBase.format() and ConfigAnalysisOutputterBase.output()', () => {
            let outputter = executeSend({});
            expect(outputter.formatCount).toBe(1);
            expect(outputter.outputCount).toBe(1);
        });
        test('ConfigAnalysisOutputterBase.send([], []) calls ConfigAnalysisOutputterBase.format() and ConfigAnalysisOutputterBase.output()', () => {
            let outputter = executeSend({
                valueHostQueryResults: [],
                lookupKeyQueryResults: [],
                completeResults: {} as any
            });
            expect(outputter.formatCount).toBe(1);
            expect(outputter.outputCount).toBe(1);
        });
    });
    describe('ConsoleConfigAnalysisOutputter', () => {
        // Use real data and spy on console.log
        function executeSend(reportData: ConfigAnalysisOutputReportData,
            formatter: IConfigAnalysisOutputFormatter | null,
            calledWith: any) {

            let logSpy = jest.spyOn(console, 'log');
            let outputter = new ConsoleConfigAnalysisOutputter(formatter);
            outputter.send(reportData);
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(calledWith);
            logSpy.mockReset();
        }
    
        test('Using JsonConfigAnalysisOutputFormatter results in JSON of the data supplied sent to console.log', () => {
            let formatter = new JsonConfigAnalysisOutputFormatter();
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: []
            };
            executeSend(reportData, formatter, expect.any(String));

        });
        // same using CleanedObjectConfigAnalysisOutputFormatter, which expects an object sent to console.log
        test('Using CleanedObjectConfigAnalysisOutputFormatter results in an object of the data supplied sent to console.log', () => {
            let formatter = new CleanedObjectConfigAnalysisOutputFormatter();
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: []
            };
            executeSend(reportData, formatter, expect.objectContaining({
                valueHostQueryResults: expect.any(Array),
                lookupKeyQueryResults: expect.any(Array)
            }));
        });
        // using null formatter, expect it uses JsonConfigAnalysisOutputFormatter
        test('Using null formatter results in CleanedObjectConfigAnalysisOutputFormatter being used', () => {
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: []
            };
            executeSend(reportData, null, expect.objectContaining({
                valueHostQueryResults: expect.any(Array),
                lookupKeyQueryResults: expect.any(Array)
            }));
        });
        test('Using JsonConsoleConfigAnalysisOutputter results in JSON of the data supplied sent to console.log', () => {
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: []
            };
            let logSpy = jest.spyOn(console, 'log');
            let outputter = new JsonConsoleConfigAnalysisOutputter();
            expect(outputter.formatter).toBeInstanceOf(JsonConfigAnalysisOutputFormatter);
            expect((outputter.formatter as JsonConfigAnalysisOutputFormatter).space).toBe(4);
            outputter.send(reportData);
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(expect.any(String));
            logSpy.mockReset();
        });
        // same using space=2
        test('Using JsonConsoleConfigAnalysisOutputter with space=2 results in JSON of the data supplied sent to console.log', () => {
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: []
            };
            let logSpy = jest.spyOn(console, 'log');
            let outputter = new JsonConsoleConfigAnalysisOutputter(2);
            expect(outputter.formatter).toBeInstanceOf(JsonConfigAnalysisOutputFormatter);
            expect((outputter.formatter as JsonConfigAnalysisOutputFormatter).space).toBe(2);
            outputter.send(reportData);
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(expect.any(String));
            logSpy.mockReset();
        });
    });

    describe('LoggerConfigAnalysisOutputter', () => {
        // We'll use the ConsoleLoggerService for this test
        // It internally directs to console.log with the LogDetails object (not a string)
        // so we'll spy on console.log

        function executeSend(reportData: ConfigAnalysisOutputReportData, 
            formatter: IConfigAnalysisOutputFormatter | null)
        {
            let logSpy = jest.spyOn(console, 'log');
            let loggerService = new ConsoleLoggerService(LoggingLevel.Error);   // ensures that it writes even at Error level
            let outputter = new LoggerConfigAnalysisOutputter(formatter, loggerService);
            let result = outputter.send(reportData) as LogDetails;
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(expect.any(Object));
            // result should be LogDetails object like this:
            /*
            {
                feature: 'ConfigAnalysis',
                category: LoggingCategory.Configuration,
                message: content,
                type: 'ConfigAnalysis',
                data: { valueHostQueryResults, lookupKeyQueryResults, results: explorer.results }
            }
            */
            // The content should be a string that contains the property names of both arrays
            expect(result).toBeDefined();
            expect(typeof result === 'object').toBeTruthy();
            expect(result.feature).toBe('ConfigAnalysis');
            expect(result.category).toBe(LoggingCategory.Configuration);
            expect(result.type).toBe('ConfigAnalysis');
            expect(result.data).toBeDefined();
            expect(result.data).toHaveProperty('valueHostQueryResults');
            expect(result.data).toHaveProperty('lookupKeyQueryResults');
            expect(result.data).toHaveProperty('completeResults');
            expect(result.message).toContain('valueHostQueryResults');
            expect(result.message).toContain('lookupKeyQueryResults');
            expect(result.message).toContain('completeResults');
            expect(loggerService.minLevel).toBe(LoggingLevel.Error);    // ensure that the minLevel was restored
            logSpy.mockReset();
        }


        test('constructor throws with null loggerService', () => {
            expect(() => new LoggerConfigAnalysisOutputter(new JsonConfigAnalysisOutputFormatter(), null!)).toThrow();
        }); 
        test('With JsonConfigAnalysisOutputFormatter, data supplied sent to loggerService.log', () => {
            let formatter = new JsonConfigAnalysisOutputFormatter();
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: [],
                completeResults: {} as any
            };
            executeSend(reportData, formatter);
        });
        // when using CleanedObjectConfigAnalysisOutputFormatter, expect send to throw because not supported
        test('With CleanedObjectConfigAnalysisOutputFormatter, send throws because not supported', () => {
            let loggerService = new ConsoleLoggerService(LoggingLevel.Error);
            let formatter = new CleanedObjectConfigAnalysisOutputFormatter();
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: [],
                completeResults: {} as any
            };
            let outputter = new LoggerConfigAnalysisOutputter(formatter, loggerService);
            expect(() => outputter.send(reportData)).toThrow(/requires content to be a string/);
        });
        test('With null formatter, JsonConfigAnalysisOutputFormatter is used', () => {
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: [],
                completeResults: {} as any
            };
            executeSend(reportData, null);
        });
        
    });
    describe('NullConfigAnalysisOutputter class', () => {
        // This has no output. The formatter still runs
        // and is the result of send.
        // We'll spy on NullConfigAnalysisOutputter.output to ensure it is called.
        
        test('send() calls output()', () => {
            let formatter = new JsonConfigAnalysisOutputFormatter();
            let outputter = new NullConfigAnalysisOutputter(formatter);
            let outputSpy = jest.spyOn(outputter as any, 'output');
            let reportData: ConfigAnalysisOutputReportData = {
                valueHostQueryResults: [],
                lookupKeyQueryResults: []
            };
            outputter.send(reportData);
            expect(outputSpy).toHaveBeenCalledTimes(1);
            expect(outputter.formatter).toBe(formatter);
            outputSpy.mockReset();
        });

    });
});