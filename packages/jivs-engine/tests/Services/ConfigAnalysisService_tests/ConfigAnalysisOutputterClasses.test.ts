import { jest } from '@jest/globals';
import { IConfigAnalysisResultsExplorer, CAPathedResult, IConfigAnalysisOutputFormatter } from "../../../src/Interfaces/ConfigAnalysisService";
import { CleanedObjectConfigAnalysisOutputFormatter, JsonConfigAnalysisOutputFormatter } from "../../../src/Services/ConfigAnalysisService/ConfigAnalysisOutputFormatterClasses";
import { ConfigAnalysisOutputterBase, ConsoleConfigAnalysisOutputter, LoggerConfigAnalysisOutputter, NullConfigAnalysisOutputter } from "../../../src/Services/ConfigAnalysisService/ConfigAnalysisOutputterClasses";
import { ConfigAnalysisResultsExplorer, ConfigAnalysisResultsExplorerFactory } from "../../../src/Services/ConfigAnalysisService/ConfigAnalysisResultsExplorer";
import { MockValidationServices } from "../../TestSupport/mocks";
import { createBasicConfigAnalysisResults } from "./support";
import { ILoggerService, LogDetails, LoggingCategory, LoggingLevel, logGatheringErrorHandler, logGatheringHandler } from '../../../src/Interfaces/LoggerService';
import { ConsoleLoggerService } from '../../../src/Services/ConsoleLoggerService';

describe('IConfigAnalysisOutputter implementations', () => {
    let factory = new ConfigAnalysisResultsExplorerFactory();
    let services = new MockValidationServices(false, false);

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

            protected format(valueHostQueryResults: CAPathedResult<any>[] | null, lookupKeyQueryResults: CAPathedResult<any>[] | null, explorer: IConfigAnalysisResultsExplorer) {
                this.formatCount++;

                return super.format(valueHostQueryResults, lookupKeyQueryResults, explorer);
            }

            protected output(content: any): void {
                this.outputCount++;
            }
        }
        class NullFormater implements IConfigAnalysisOutputFormatter {
            format(valueHostQueryResults: CAPathedResult<any>[] | null, lookupKeyQueryResults: CAPathedResult<any>[] | null, explorer: IConfigAnalysisResultsExplorer): any {
                return null;
            }
        }   

        function executeSend(valueHostQueryResults: CAPathedResult<any>[] | null, lookupKeyQueryResults: CAPathedResult<any>[] | null) {
            let formatter = new NullFormater();
            let analysisResults = createBasicConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);

            let outputter = new Publicify_ConfigAnalysisOutputter(formatter);
            outputter.send(valueHostQueryResults, lookupKeyQueryResults, explorer);
            return outputter;
        }
    
        test('ConfigAnalysisOutputterBase.send(null, null) calls ConfigAnalysisOutputterBase.format() and ConfigAnalysisOutputterBase.output()', () => {
            let outputter = executeSend(null, null);
            expect(outputter.formatCount).toBe(1);
            expect(outputter.outputCount).toBe(1);
        });
        test('ConfigAnalysisOutputterBase.send([], []) calls ConfigAnalysisOutputterBase.format() and ConfigAnalysisOutputterBase.output()', () => {
            let outputter = executeSend([], []);
            expect(outputter.formatCount).toBe(1);
            expect(outputter.outputCount).toBe(1);
        });
    });
    describe('ConsoleConfigAnalysisOutputter', () => {
        // Use real data and spy on console.log
        function executeSend(valueHostQueryResults: CAPathedResult<any>[] | null,
            lookupKeyQueryResults: CAPathedResult<any>[] | null,
            formatter: IConfigAnalysisOutputFormatter) {

            let analysisResults = createBasicConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);

            let outputter = new ConsoleConfigAnalysisOutputter(formatter);
            outputter.send(valueHostQueryResults, lookupKeyQueryResults, explorer);
            expect(outputter.formatter).toBe(formatter);
        }
    
        test('Using JsonConfigAnalysisOutputFormatter results in JSON of the data supplied sent to console.log', () => {
            let logSpy = jest.spyOn(console, 'log');
            let formatter = new JsonConfigAnalysisOutputFormatter(false);
            let valueHostQueryResults: Array<CAPathedResult<any>> = [];
            let lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
            executeSend(valueHostQueryResults, lookupKeyQueryResults, formatter);
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(expect.any(String));
            logSpy.mockReset();
        });
        // same using CleanedObjectConfigAnalysisOutputFormatter, which expects an object sent to console.log
        test('Using CleanedObjectConfigAnalysisOutputFormatter results in an object of the data supplied sent to console.log', () => {
            let logSpy = jest.spyOn(console, 'log');
            let formatter = new CleanedObjectConfigAnalysisOutputFormatter(false);
            let valueHostQueryResults: Array<CAPathedResult<any>> = [];
            let lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
            executeSend(valueHostQueryResults, lookupKeyQueryResults, formatter);
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
                valueHostQueryResults: expect.any(Array),
                lookupKeyQueryResults: expect.any(Array)
            }));
            logSpy.mockReset();
        });
    });

    describe('LoggerConfigAnalysisOutputter', () => {
        // We'll use the ConsoleLoggerService for this test
        // It internally directs to console.log with the LogDetails object (not a string)
        // so we'll spy on console.log

        test('constructor throws with null loggerService', () => {
            expect(() => new LoggerConfigAnalysisOutputter(new JsonConfigAnalysisOutputFormatter(false), null!)).toThrow();
        }); 
        test('With JsonConfigAnalysisOutputFormatter, data supplied sent to loggerService.log', () => {
            let logSpy = jest.spyOn(console, 'log');
            let loggerService = new ConsoleLoggerService(LoggingLevel.Error);   // ensures that it writes even at Error level            
            let formatter = new JsonConfigAnalysisOutputFormatter(false);
            let valueHostQueryResults: Array<CAPathedResult<any>> = [];
            let lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
            let analysisResults = createBasicConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);

            let outputter = new LoggerConfigAnalysisOutputter(formatter, loggerService);
            let result = outputter.send(valueHostQueryResults, lookupKeyQueryResults, explorer) as LogDetails;
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(expect.any(Object));
            // result should be LogDetails object like this:
            /*
            {
                feature: 'ConfigAnalysisService',
                category: LoggingCategory.Configuration,
                message: content,
                type: 'ConfigAnalysisService',
                data: { valueHostQueryResults, lookupKeyQueryResults, results: explorer.results }
            }
            */
            // The content should be a string that contains the property names of both arrays
            expect(result).toBeDefined();
            expect(typeof result === 'object').toBeTruthy();
            expect(result.feature).toBe('ConfigAnalysisService');
            expect(result.category).toBe(LoggingCategory.Configuration);
            expect(result.type).toBe('ConfigAnalysisService');
            expect(result.data).toBeDefined();
            expect(result.data).toHaveProperty('valueHostQueryResults');
            expect(result.data).toHaveProperty('lookupKeyQueryResults');
            expect(result.data).toHaveProperty('results');
            expect(result.message).toContain('valueHostQueryResults');
            expect(result.message).toContain('lookupKeyQueryResults');
            expect(result.message).not.toContain('results');
            expect(loggerService.minLevel).toBe(LoggingLevel.Error);    // ensure that the minLevel was restored
            expect(outputter.formatter).toBe(formatter);
            logSpy.mockReset();
        });
        // when using CleanedObjectConfigAnalysisOutputFormatter, expect send to throw because not supported
        test('With CleanedObjectConfigAnalysisOutputFormatter, send throws because not supported', () => {
            let loggerService = new ConsoleLoggerService(LoggingLevel.Error);
            let formatter = new CleanedObjectConfigAnalysisOutputFormatter(false);
            let valueHostQueryResults: Array<CAPathedResult<any>> = [];
            let lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
            let analysisResults = createBasicConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);
            let outputter = new LoggerConfigAnalysisOutputter(formatter, loggerService);
            expect(() => outputter.send(valueHostQueryResults, lookupKeyQueryResults, explorer)).toThrow(/requires content to be a string/);
        });
        
    });
    describe('NullConfigAnalysisOutputter class', () => {
        // This has no output. The formatter still runs
        // and is the result of send.
        // We'll spy on NullConfigAnalysisOutputter.output to ensure it is called.
        
        test('send() calls output()', () => {
            let formatter = new JsonConfigAnalysisOutputFormatter(false);
            let outputter = new NullConfigAnalysisOutputter(formatter);
            let outputSpy = jest.spyOn(outputter as any, 'output');
            outputter.send([], [], new ConfigAnalysisResultsExplorer(createBasicConfigAnalysisResults(), factory, services));
            expect(outputSpy).toHaveBeenCalledTimes(1);
            expect(outputter.formatter).toBe(formatter);
            outputSpy.mockReset();
        });

    });
});