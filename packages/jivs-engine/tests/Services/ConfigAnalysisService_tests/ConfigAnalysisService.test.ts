import { ConditionCategoryPropertyAnalyzer, ConditionTypeConfigPropertyAnalyzer, ConditionWithConversionLookupKeyPropertyAnalyzer, ConditionWithSecondValueHostNamePropertyAnalyzer, ConditionWithValueHostNamePropertyAnalyzer } from './../../../src/Services/ConfigAnalysisService/ConditionConfigPropertyAnalyzerClasses';
import { LookupKey } from "../../../src/DataTypes/LookupKeys";
import {
    AnalysisArgs, ConfigAnalysisServiceOptions, CAIssueSeverity, PropertyCAResult,
    IAnalysisResultsHelper, IConditionConfigPropertyAnalyzer,
    IConfigAnalysisResults, IConfigAnalysisResultsExplorer, IValidatorConfigPropertyAnalyzer, IValueHostConfigPropertyAnalyzer, ServiceWithLookupKeyCAResultBase, ValidatorConfigCAResult, ValueHostConfigCAResult, converterServiceFeature, identifierServiceFeature, lookupKeyFeature, valueHostFeature
} from "../../../src/Interfaces/ConfigAnalysisService";
import { IDataTypeIdentifier } from "../../../src/Interfaces/DataTypeIdentifier";
import { IValidationServices, ServiceName } from "../../../src/Interfaces/ValidationServices";
import { ValueHostConfig } from "../../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../../src/Interfaces/ValueHostFactory";
import { ValueHostsManagerConfig } from "../../../src/Interfaces/ValueHostsManager";
import { IValueHostsServices } from "../../../src/Interfaces/ValueHostsServices";
import { AnalysisResultsHelper } from "../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper";
import { ConfigAnalysisServiceBase, ValidationManagerConfigAnalysisService, ValueHostsManagerConfigAnalysisService } from "../../../src/Services/ConfigAnalysisService/ConfigAnalysisService";
import { SampleValues } from "../../../src/Services/ConfigAnalysisService/SampleValues";
import { ValueHostConfigAnalyzer } from "../../../src/Services/ConfigAnalysisService/ValueHostConfigAnalyzer";
import { MockAnalyzer, checkLookupKeyResults, checkLookupKeyResultsForNoService, checkLookupKeyResultsForService, createServices } from "./support";
import { DataTypePropertyAnalyzer, ParserLookupKeyPropertyAnalyzer, ValueHostConfigPropertyAnalyzerBase, ValueHostNamePropertyAnalyzer, ValueHostTypePropertyAnalyzer } from "../../../src/Services/ConfigAnalysisService/ValueHostConfigPropertyAnalyzerClasses";
import { ValidatorConfig } from "../../../src/Interfaces/Validator";
import { ValueHostsManagerConfigBuilder } from "../../../src/ValueHosts/ValueHostsManagerConfigBuilder";
import { ValidationManagerConfigBuilder } from "../../../src/Validation/ValidationManagerConfigBuilder";
import { NumberParser } from "../../../src/DataTypes/DataTypeParsers";
import { AllMessagePropertiesConfigPropertyAnalyzer, ConditionCreatorConfigPropertyAnalyzer } from "../../../src/Services/ConfigAnalysisService/ValidatorConfigPropertyAnalyzerClasses";
import { NumericStringToNumberConverter } from '../../../src/DataTypes/DataTypeConverters';
import { ConditionType } from '../../../src/Conditions/ConditionTypes';
import { ValidationManagerConfig } from '../../../src/Interfaces/ValidationManager';
import { DataTypeComparerAnalyzer } from '../../../src/Services/ConfigAnalysisService/DataTypeComparerAnalyzer';
import { registerAllConditions } from '../../TestSupport/createValidationServices';

describe('ConfigAnalysisServiceBase class', () => {
    class Publicify_ConfigAnalysisServiceBase extends ConfigAnalysisServiceBase<ValueHostsManagerConfig, IValueHostsServices> {
        protected createHelper(args: AnalysisArgs<IValueHostsServices>): AnalysisResultsHelper<IValueHostsServices> {
            let helper = new AnalysisResultsHelper(args);
            this._helper = helper;
            helper.registerLookupKeyAnalyzer(ServiceName.converter, new MockAnalyzer(ServiceName.converter, {} as ServiceWithLookupKeyCAResultBase));
            helper.registerLookupKeyAnalyzer(ServiceName.identifier, new MockAnalyzer(ServiceName.identifier, {} as ServiceWithLookupKeyCAResultBase));
            helper.registerLookupKeyAnalyzer(ServiceName.comparer, new MockAnalyzer(ServiceName.comparer, {} as ServiceWithLookupKeyCAResultBase));
            return helper;
        }
        /**
         * Expose the helper for testing
         */
        public get publicify_helper(): AnalysisResultsHelper<IValueHostsServices> | undefined {
            return this._helper;
        }
        private _helper: AnalysisResultsHelper<IValueHostsServices> | undefined = undefined;

        public get publicify_options(): ConfigAnalysisServiceOptions | null | undefined {
            return this._options;
        }
        private _options: ConfigAnalysisServiceOptions | null | undefined = undefined;
        public publicify_getServices(): IValueHostsServices {
            return this.services;
        }
        public publicify_getValueHostNames(config: ValueHostsManagerConfig): string[] {
            return this.getValueHostNames(config);
        }
        public publicify_gatherDataTypeIdentifierLookupKeys(helper: AnalysisResultsHelper<IValueHostsServices>): void {
            this.gatherDataTypeIdentifierLookupKeys(helper);
        }
        public get publicify_valueHostConfigPropertyAnalyzers(): Array<IValueHostConfigPropertyAnalyzer> {
            return this.valueHostConfigPropertyAnalyzers;
        }
        public get publicify_validatorConfigPropertyAnalyzers(): Array<IValidatorConfigPropertyAnalyzer> {
            return this.validatorConfigPropertyAnalyzers;
        }
        public get publicify_conditionConfigPropertyAnalyzers(): Array<IConditionConfigPropertyAnalyzer> {
            return this.conditionConfigPropertyAnalyzers;
        }
        public publicify_createConfigAnalysisResults(config: ValueHostsManagerConfig): IConfigAnalysisResults {
            return this.createConfigAnalysisResults(config);
        }
        public publicify_createAnalysisArgs(config: ValueHostsManagerConfig,
            results: IConfigAnalysisResults, options: ConfigAnalysisServiceOptions): AnalysisArgs<IValueHostsServices> {
            return this.createAnalysisArgs(config, results, options);
        }
        public publicify_resolveConfigAnalyzers(analysisArgs: AnalysisArgs<IValueHostsServices>, helper: AnalysisResultsHelper<IValueHostsServices>): void {
            this.resolveConfigAnalyzers(analysisArgs, helper);

        }
        public publicify_createHelper(args: AnalysisArgs<IValueHostsServices>): AnalysisResultsHelper<IValueHostsServices> {
            return this.createHelper(args);
        }
        // just to expose options
        protected createAnalysisArgs(config: ValueHostsManagerConfig, results: IConfigAnalysisResults, options: ConfigAnalysisServiceOptions): AnalysisArgs<IValueHostsServices> {
            this._options = options;
            return super.createAnalysisArgs(config, results, options);

        }
    }
    /**
     * Creates as many ValueHostConfig objects as there are expectedDataTypes.
     * Each will have a name of 'testValueHost' + (index + 1)
     * and the dataType property assigned to the corresponding expectedDataTypes entry.
     * All will default to valueHostType=Static and leave all remaining properties for the caller.
     * @param expectedDataTypes 
     */
    function createValueHostConfigs(expectedDataTypes: Array<string | null>): Array<ValueHostConfig> {
        return expectedDataTypes.map((dataType, index) => {
            return <ValueHostConfig>{
                name: 'testValueHost' + (index + 1),
                dataType: dataType,
                valueHostType: ValueHostType.Static
            };
        });
    }
    function setupForTheseTests(expectedDataTypes: Array<string | null>, addCultures: Array<string> = ['en']): {
        testItem: Publicify_ConfigAnalysisServiceBase,
        services: IValueHostsServices,
        helper: AnalysisResultsHelper<IValueHostsServices>,
        analysisArgs: AnalysisArgs<IValueHostsServices>,
        results: IConfigAnalysisResults,
    } {
        let services = createServices(addCultures);
        let valueHostManagerConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: createValueHostConfigs(expectedDataTypes)
        };
        let testItem = new Publicify_ConfigAnalysisServiceBase();
        testItem.services = services;
        let results = testItem.publicify_createConfigAnalysisResults(valueHostManagerConfig);
        let options: ConfigAnalysisServiceOptions = {};
        let analysisArgs = testItem.publicify_createAnalysisArgs(valueHostManagerConfig, results, options);
        let helper = testItem.publicify_createHelper(analysisArgs);

        return { testItem, services, helper: helper, analysisArgs, results };
    }
    describe('createConfigAnalysisResults()', () => {
        test('Creates a new results object with the config and feature set', () => {
            let services = createServices(['en', 'fr']);
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: createValueHostConfigs([null, null])
            };

            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            let results = testItem.publicify_createConfigAnalysisResults(valueHostManagerConfig);
            expect(results).toEqual(<IConfigAnalysisResults>{
                cultureIds: ['en', 'fr'],
                valueHostNames: ['testValueHost1', 'testValueHost2'],
                lookupKeyResults: [],
                lookupKeysIssues: [],
                valueHostResults: []
            });
        });
        // same with 0 valueHostConfigs
        test('Creates a new results object with the config and feature set with 0 valueHostConfigs', () => {
            let services = createServices(['en', 'fr']);
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: []
            };

            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            let results = testItem.publicify_createConfigAnalysisResults(valueHostManagerConfig);
            expect(results).toEqual(<IConfigAnalysisResults>{
                cultureIds: ['en', 'fr'],
                valueHostNames: [],
                lookupKeyResults: [],
                lookupKeysIssues: [],
                valueHostResults: []
            });
        });
    });
    describe('createAnalysisArgs()', () => {
        test('Creates a new AnalysisArgs object with the config, results, and options set', () => {
            let services = createServices(['en', 'fr']);
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: createValueHostConfigs([null, null])
            };

            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            let results = testItem.publicify_createConfigAnalysisResults(valueHostManagerConfig);
            let options: ConfigAnalysisServiceOptions = {};
            let analysisArgs = testItem.publicify_createAnalysisArgs(valueHostManagerConfig, results, options);
            expect(analysisArgs).toBeDefined();
            expect(analysisArgs.valueHostConfigs).toEqual(valueHostManagerConfig.valueHostConfigs);
            expect(analysisArgs.results).toEqual(results);
            expect(analysisArgs.services).toBe(services);
            expect(analysisArgs.options).toBe(options);
            expect(analysisArgs.sampleValues).toBeInstanceOf(SampleValues);
            expect(analysisArgs.conditionConfigAnalyzer).toBeUndefined();
            expect(analysisArgs.validatorConfigAnalyzer).toBeUndefined();
            expect(analysisArgs.valueHostConfigAnalyzer).toBeUndefined();
            expect(analysisArgs.comparerAnalyzer).toBeUndefined();

        });
    });
    describe('resolveConfigAnalyzers()', () => {
        test('Resolves the config analyzers for each ValueHostConfig', () => {
            let services = createServices(['en', 'fr']);
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: createValueHostConfigs([null, null])
            };

            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            let results = testItem.publicify_createConfigAnalysisResults(valueHostManagerConfig);
            let options: ConfigAnalysisServiceOptions = {};
            let analysisArgs = testItem.publicify_createAnalysisArgs(valueHostManagerConfig, results, options);
            testItem.publicify_resolveConfigAnalyzers(analysisArgs, testItem.publicify_helper!);
            // Base class only registers for ValueHostConfig.
            expect(analysisArgs.valueHostConfigAnalyzer).toBeInstanceOf(ValueHostConfigAnalyzer);
            expect(analysisArgs.comparerAnalyzer).toBeInstanceOf(DataTypeComparerAnalyzer);
            expect(analysisArgs.conditionConfigAnalyzer).toBeDefined();
            expect(analysisArgs.validatorConfigAnalyzer).toBeUndefined();
        });

    });
    describe('getValueHostNames()', () => {
        test('Returns the names of all ValueHostConfigs', () => {
            let services = createServices(['en', 'fr']);
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: createValueHostConfigs([null, null])
            };
            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            let names = testItem.publicify_getValueHostNames(valueHostManagerConfig);
            expect(names).toEqual(['testValueHost1', 'testValueHost2']);
        });
    });

    describe('gatherDataTypeIdentifierLookupKeys', () => {


        test('No previously registered lookup keys means no ServiceName.identifier entries', () => {
            let setup = setupForTheseTests([null, null]);

            setup.testItem.publicify_gatherDataTypeIdentifierLookupKeys(setup.helper);
            expect(setup.results.lookupKeyResults).toHaveLength(0);

        });
        // add LookupKey.Number as comparer means there is also an entry for ServiceName.identifier on LookupKey.Number
        test('LookupKey.Number as a converter means there is also an entry for ServiceName.identifier', () => {
            let setup = setupForTheseTests([null, null]);

            setup.helper.registerLookupKey(LookupKey.Number, ServiceName.converter, { name: 'testValueHost' });
            setup.testItem.publicify_gatherDataTypeIdentifierLookupKeys(setup.helper);
            expect(setup.results.lookupKeyResults).toEqual([
                {
                    feature: lookupKeyFeature,
                    lookupKey: LookupKey.Number,
                    usedAsDataType: true,
                    serviceResults: [
                        { feature: converterServiceFeature, message: 'testConverter', counter: 0 } as any,
                        { feature: identifierServiceFeature, message: 'testIdentifier', counter: 0 } as any,
                    ]
                }
            ]);
        });
        // with DataTypeIdentifiers containing a lookup key for 'testKey', it is added to the result even though its not referenced elsewhere
        test('DataTypeIdentifiers containing a lookup key means it is added to the results', () => {
            const testLookupKey = 'testKey';
            class TestDataTypeIdentifier implements IDataTypeIdentifier {
                dataTypeLookupKey: string = testLookupKey;
                supportsValue(value: any): boolean {
                    return true;
                }
                sampleValue() {
                    return 'testValue';
                }

            }
            let setup = setupForTheseTests([null, null]);
            setup.services.dataTypeIdentifierService.register(new TestDataTypeIdentifier());
            setup.testItem.publicify_gatherDataTypeIdentifierLookupKeys(setup.helper);
            expect(setup.results.lookupKeyResults).toEqual([
                {
                    feature: lookupKeyFeature,
                    lookupKey: 'testKey',
                    usedAsDataType: true,
                    serviceResults: [
                        { feature: identifierServiceFeature, message: 'testIdentifier', counter: 0 } as any,
                    ]
                }
            ]);
        });
    });

    describe('registerValueHostConfigPropertyAnalyzers and valueHostConfigPropertyAnalyzers', () => {
        // populate through registerValueHostConfigPropertyAnalyzers
        // and demonstrate they matchin valueHostConfigPropertyAnalyzers
        class Test1ValueHostConfigPropertyAnalyzerBase extends ValueHostConfigPropertyAnalyzerBase {
            public analyze(config: ValueHostConfig, results: ValueHostConfigCAResult, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
                throw new Error("Method not implemented.");
            }
        }
        class Test2ValueHostConfigPropertyAnalyzerBase extends ValueHostConfigPropertyAnalyzerBase {
            public analyze(config: ValueHostConfig, results: ValueHostConfigCAResult, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
                throw new Error("Method not implemented.");
            }
        }
        test('registerValueHostConfigPropertyAnalyzers and valueHostConfigPropertyAnalyzers match', () => {
            let setup = setupForTheseTests([null, null]);
            let test1 = new Test1ValueHostConfigPropertyAnalyzerBase();
            let test2 = new Test2ValueHostConfigPropertyAnalyzerBase();
            setup.testItem.registerValueHostConfigPropertyAnalyzers(() => [test1, test2]);
            expect(setup.testItem.publicify_valueHostConfigPropertyAnalyzers).toEqual([test1, test2]);
        });
    });
    // same for ValidatorConfigPropertyAnalyzers
    describe('registerValidatorConfigPropertyAnalyzers and validatorConfigPropertyAnalyzers', () => {
        // populate through registerValidatorConfigPropertyAnalyzers
        // and demonstrate they matchin validatorConfigPropertyAnalyzers
        class Test1ValidatorConfigPropertyAnalyzerBase implements IValidatorConfigPropertyAnalyzer {
            analyze(config: ValidatorConfig, results: ValidatorConfigCAResult, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
                throw new Error("Method not implemented.");
            }

        }
        class Test2ValidatorConfigPropertyAnalyzerBase implements IValidatorConfigPropertyAnalyzer {
            analyze(config: ValidatorConfig, results: ValidatorConfigCAResult, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
                throw new Error("Method not implemented.");
            }

        }
        test('registerValidatorConfigPropertyAnalyzers and validatorConfigPropertyAnalyzers match', () => {
            let setup = setupForTheseTests([null, null]);
            let test1 = new Test1ValidatorConfigPropertyAnalyzerBase();
            let test2 = new Test2ValidatorConfigPropertyAnalyzerBase();
            setup.testItem.registerValidatorConfigPropertyAnalyzers(() => [test1, test2]);
            expect(setup.testItem.publicify_validatorConfigPropertyAnalyzers).toEqual([test1, test2]);
        });
    });
    // same for ConditionConfigPropertyAnalyzers
    describe('registerConditionConfigPropertyAnalyzers and conditionConfigPropertyAnalyzers', () => {
        // populate through registerConditionConfigPropertyAnalyzers
        // and demonstrate they matchin conditionConfigPropertyAnalyzers
        class Test1ConditionConfigPropertyAnalyzerBase implements IConditionConfigPropertyAnalyzer {
            analyze(config: any, results: any, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
                throw new Error("Method not implemented.");
            }

        }
        class Test2ConditionConfigPropertyAnalyzerBase implements IConditionConfigPropertyAnalyzer {
            analyze(config: any, results: any, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
                throw new Error("Method not implemented.");
            }

        }
        test('registerConditionConfigPropertyAnalyzers and conditionConfigPropertyAnalyzers match', () => {
            let setup = setupForTheseTests([null, null]);
            let test1 = new Test1ConditionConfigPropertyAnalyzerBase();
            let test2 = new Test2ConditionConfigPropertyAnalyzerBase();
            setup.testItem.registerConditionConfigPropertyAnalyzers(() => [test1, test2]);
            expect(setup.testItem.publicify_conditionConfigPropertyAnalyzers).toEqual([test1, test2]);
        });
    });
    describe('analyze()', () => {
        // this function integrates most of the other functions.
        // It needs a few broad tests where services and config differ.

        // with no valueHostConfigs, the results should be empty
        test('With no valueHostConfigs, the results should be empty', () => {
            let services = createServices();
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: []
            };
            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
            expect(() => analysisOutput = testItem.analyze(valueHostManagerConfig, {})).not.toThrow();
            expect(analysisOutput).toBeDefined();
            expect(analysisOutput!.results).toBeDefined();
            let results = analysisOutput!.results!;
            expect(results.cultureIds).toEqual(['en']);
            expect(results.valueHostNames).toHaveLength(0);
            expect(results.lookupKeyResults).toHaveLength(0);
            expect(results.lookupKeysIssues).toHaveLength(0);
            expect(results.valueHostResults).toHaveLength(0);
            expect(testItem.publicify_helper).toBeDefined();
            expect(testItem.publicify_getServices()).toBe(services);
        });
        // just one valueHostConfig with a dataType of LookupKey.Number
        // should create a lookup key info entry for LookupKey.Number
        test('With one valueHostConfig with a dataType of LookupKey.Number and just the DataTypePropertyAnalyzer, there should be a lookup key info entry for LookupKey.Number and one entry in valueHostResults', () => {
            let services = createServices();
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: createValueHostConfigs([LookupKey.Number])
            };
            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            testItem.registerValueHostConfigPropertyAnalyzers(() => [
                new DataTypePropertyAnalyzer()
            ]);
            let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
            expect(() => analysisOutput = testItem.analyze(valueHostManagerConfig, {})).not.toThrow();
            expect(analysisOutput).toBeDefined();
            expect(analysisOutput!.results).toBeDefined();
            let results = analysisOutput!.results!;
            expect(results.cultureIds).toEqual(['en']);
            expect(results.valueHostNames).toEqual(['testValueHost1']);
            expect(results.lookupKeyResults).toEqual([
                {
                    feature: lookupKeyFeature,
                    lookupKey: LookupKey.Number,
                    usedAsDataType: true,
                    serviceResults: [
                        { feature: identifierServiceFeature, message: 'testIdentifier', counter: 0 } as any,
                    ]
                }
            ]);
            expect(results.lookupKeysIssues).toHaveLength(0);
            expect(results.valueHostResults).toHaveLength(1);
            expect(results.valueHostResults[0]).toEqual({
                feature: valueHostFeature,
                valueHostName: 'testValueHost1',
                properties: [],
                config: {
                    name: 'testValueHost1',
                    dataType: LookupKey.Number,
                    valueHostType: ValueHostType.Static
                }
            });
            expect(testItem.publicify_helper).toBeDefined();
            expect(testItem.publicify_getServices()).toBe(services);
            expect(testItem.publicify_options).toEqual({});
        });
        // same basic idea but we are focused on options. We'll supply undefined for options and expect {} in publicify_options.
        // no testing anything else after calling analyze
        test('Confirm that when options = undefined, it internally becomes {}', () => {
            let services = createServices();
            let valueHostManagerConfig: ValueHostsManagerConfig = {
                services: services,
                valueHostConfigs: createValueHostConfigs([LookupKey.Number])
            };
            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            testItem.registerValueHostConfigPropertyAnalyzers(() => [
                new DataTypePropertyAnalyzer()
            ]);
            let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
            expect(() => analysisOutput = testItem.analyze(valueHostManagerConfig, undefined)).not.toThrow();
            expect(testItem.publicify_options).toEqual({});
        });
        // use a ManagerConfigBuilder as the source of configuration and parameter to analyze()
        // It should be configured with a single valueHostConfig with a dataType of LookupKey.Number
        // effectively matching an earlier test
        test('With a ManagerConfigBuilder as the source of configuration, there should be a lookup key info entry for LookupKey.Number and one entry in valueHostResults', () => {
            let services = createServices();
            let builder = new ValueHostsManagerConfigBuilder(services);
            builder.static('testValueHost1', LookupKey.Number);
            let testItem = new Publicify_ConfigAnalysisServiceBase();
            testItem.services = services;
            testItem.registerValueHostConfigPropertyAnalyzers(() => [
                new DataTypePropertyAnalyzer()
            ]);
            let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
            expect(() => analysisOutput = testItem.analyze(builder, {})).not.toThrow();
            expect(analysisOutput).toBeDefined();
            expect(analysisOutput!.results).toBeDefined();
            let results = analysisOutput!.results!;
            expect(results.cultureIds).toEqual(['en']);
            expect(results.valueHostNames).toEqual(['testValueHost1']);
            expect(results.lookupKeyResults).toEqual([
                {
                    feature: lookupKeyFeature,
                    lookupKey: LookupKey.Number,
                    usedAsDataType: true,
                    serviceResults: [
                        { feature: identifierServiceFeature, message: 'testIdentifier', counter: 0 } as any,
                    ]
                }
            ]);
            expect(results.lookupKeysIssues).toHaveLength(0);
            expect(results.valueHostResults).toHaveLength(1);
            expect(results.valueHostResults[0]).toEqual({
                feature: valueHostFeature,
                valueHostName: 'testValueHost1',
                properties: [],
                config: {
                    name: 'testValueHost1',
                    dataType: LookupKey.Number,
                    valueHostType: ValueHostType.Static
                }
            });
            expect(testItem.publicify_helper).toBeDefined();
            expect(testItem.publicify_getServices()).toBe(services);
            expect(testItem.publicify_options).toEqual({});
        });

    });
});
describe('ValueHostsManagerConfigAnalysisService', () => {
    class Publicify_ValueHostsManagerConfigAnalysisService extends ValueHostsManagerConfigAnalysisService {
        protected createHelper(args: AnalysisArgs<IValueHostsServices>): AnalysisResultsHelper<IValueHostsServices> {
            let helper = super.createHelper(args);
            this._helper = helper;
            return helper;
        }
        public get publicify_helper(): AnalysisResultsHelper<IValueHostsServices> | undefined {
            return this._helper;
        }
        private _helper: AnalysisResultsHelper<IValueHostsServices> | undefined = undefined;

        protected createAnalysisArgs(config: ValueHostsManagerConfig, results: IConfigAnalysisResults, options: ConfigAnalysisServiceOptions): AnalysisArgs<IValueHostsServices> {
            this._analysisArgs = super.createAnalysisArgs(config, results, options);
            return this._analysisArgs;
        }
        public get publicify_AnalysisArgs(): AnalysisArgs<IValueHostsServices> | undefined {

            return this._analysisArgs;
        }
        private _analysisArgs: AnalysisArgs<IValueHostsServices> | undefined = undefined;
    }

    // test a very simple configuration of 1 valueHostConfig
    // call analyze does that it is able to call createHelper and createAnalysisArgs
    // Check the publicified helper member for registered
    // LookupKeyAnalyzers to match the expected list of converter, comparer, and identifier.
    // Check the publicify AnalysisArgs for the expected ConfigAnalyzers
    // of ValueHostConfigAnalyzer only, with the other two undefined.
    test('Check the predefined LookupKeyAnalyzers and ConfigAnalyzers to ensure they have the expected values', () => {
        let services = createServices();
        let builder = new ValueHostsManagerConfigBuilder(services);
        builder.static('testValueHost1');
        let testItem = new Publicify_ValueHostsManagerConfigAnalysisService();
        testItem.services = services;

        let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
        expect(() => analysisOutput = testItem.analyze(builder, {})).not.toThrow();
        expect(analysisOutput).toBeDefined();
        
        expect(testItem.publicify_AnalysisArgs).toBeDefined();
        let args = testItem.publicify_AnalysisArgs!;
        expect(args.comparerAnalyzer).toBeDefined();
        expect(args.valueHostConfigAnalyzer).toBeDefined();
        expect(args.conditionConfigAnalyzer).toBeDefined();
        expect(args.validatorConfigAnalyzer).toBeUndefined();

        expect(testItem.publicify_helper).toBeDefined();
        let helper = testItem.publicify_helper!;
        expect(helper.hasLookupKeyAnalyzer(ServiceName.converter)).toBe(true);
        expect(helper.hasLookupKeyAnalyzer(ServiceName.comparer)).toBe(false);  // yes, false
        expect(helper.hasLookupKeyAnalyzer(ServiceName.identifier)).toBe(true);
        // check a few more to ensure they are false
        expect(helper.hasLookupKeyAnalyzer(ServiceName.formatter)).toBe(false);
        expect(helper.hasLookupKeyAnalyzer(ServiceName.parser)).toBe(false);

    });

    // time for a complex configuration that has no errors to report.
    // We'll use the Builder again. Since it uses ValueHostsManagerConfig,
    // it will have no validators nor ValueHostTypes other than Static and Calc.
    // 2 ValueHostConfigs,
    // 1st is ValueHostType=Static with a dataType of LookupKey.Number
    //
    // 2nd has a dataType of LookupKey.String

    test('With a complex configuration, there should be a lookup key info entry for LookupKey.Number and LookupKey.String and 2 entries in valueHostResults', () => {
        let services = createServices();
        registerAllConditions(services.conditionFactory);
        let builder = new ValueHostsManagerConfigBuilder(services);
        builder.static('testValueHost1', LookupKey.Number);
        builder.static('testValueHost2', LookupKey.String);
        let testItem = new ValueHostsManagerConfigAnalysisService();
        testItem.services = services;
        testItem.registerValueHostConfigPropertyAnalyzers(() => [
            new ValueHostTypePropertyAnalyzer(),
            new ValueHostNamePropertyAnalyzer(),
            new DataTypePropertyAnalyzer()
        ]);
        let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
        expect(() => analysisOutput = testItem.analyze(builder, {})).not.toThrow();
        expect(analysisOutput).toBeDefined();
        expect(analysisOutput!.results).toBeDefined();
        let results = analysisOutput!.results!;
        expect(results.cultureIds).toEqual(['en']);
        expect(results.valueHostNames).toEqual(['testValueHost1', 'testValueHost2']);
        expect(results.lookupKeyResults).toHaveLength(2);
        checkLookupKeyResults(results.lookupKeyResults, LookupKey.Number);
        checkLookupKeyResults(results.lookupKeyResults, LookupKey.String);
        checkLookupKeyResultsForService(results.lookupKeyResults, LookupKey.Number, ServiceName.identifier);
        checkLookupKeyResultsForService(results.lookupKeyResults, LookupKey.String, ServiceName.identifier);
        expect(results.valueHostResults).toHaveLength(2);
        let vhcConfigResults1 = results.valueHostResults[0] as ValueHostConfigCAResult;
        let vhcConfigResults2 = results.valueHostResults[1] as ValueHostConfigCAResult;
        expect(vhcConfigResults1).toBeDefined();
        expect(vhcConfigResults2).toBeDefined();
        expect(vhcConfigResults1.valueHostName).toEqual('testValueHost1');
        expect(vhcConfigResults1.severity).toBeUndefined();
        expect(vhcConfigResults1.properties).toHaveLength(0);
        expect(vhcConfigResults1.config).toEqual({
            name: 'testValueHost1',
            dataType: LookupKey.Number,
            valueHostType: ValueHostType.Static
        });
        expect(vhcConfigResults2.valueHostName).toEqual('testValueHost2');
        expect(vhcConfigResults2.severity).toBeUndefined();
        expect(vhcConfigResults2.properties).toHaveLength(0);
        expect(vhcConfigResults2.config).toEqual({
            name: 'testValueHost2',
            dataType: LookupKey.String,
            valueHostType: ValueHostType.Static
        });

    });

});
describe('ValidationManagerConfigAnalysisService', () => {
    class Publicify_ValidationManagerConfigAnalysisService extends ValidationManagerConfigAnalysisService {
        protected createHelper(args: AnalysisArgs<IValidationServices>): AnalysisResultsHelper<IValidationServices> {
            let helper = super.createHelper(args);
            this._helper = helper;
            return helper;
        }
        public get publicify_helper(): AnalysisResultsHelper<IValidationServices> | undefined {
            return this._helper;
        }
        private _helper: AnalysisResultsHelper<IValidationServices> | undefined = undefined;

        protected createAnalysisArgs(config: ValidationManagerConfig, results: IConfigAnalysisResults, options: ConfigAnalysisServiceOptions): AnalysisArgs<IValidationServices> {
            this._analysisArgs = super.createAnalysisArgs(config, results, options);
            return this._analysisArgs;
        }
        public get publicify_AnalysisArgs(): AnalysisArgs<IValidationServices> | undefined {

            return this._analysisArgs;
        }
        private _analysisArgs: AnalysisArgs<IValidationServices> | undefined = undefined;
    }

    // test a very simple configuration of 1 valueHostConfig
    // call analyze does that it is able to call createHelper and createAnalysisArgs
    // Check the publicified helper member for registered
    // LookupKeyAnalyzers to match the expected list of 
    // converter, comparer, identifier, parser, and formatter.
    // Check the publicify AnalysisArgs for the expected ConfigAnalyzers
    // of ValueHostConfigAnalyzer, ValidatorConfigAnalyzer, and ConditionConfigAnalyzer.
    test('Check the predefined LookupKeyAnalyzers and ConfigAnalyzers to ensure they have the expected values', () => {
        let services = createServices();
        let builder = new ValidationManagerConfigBuilder(services);
        builder.static('testValueHost1');
        let testItem = new Publicify_ValidationManagerConfigAnalysisService();
        testItem.services = services;

        let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
        expect(() => analysisOutput = testItem.analyze(builder, {})).not.toThrow();
        expect(analysisOutput).toBeDefined();
        
        expect(testItem.publicify_AnalysisArgs).toBeDefined();
        let args = testItem.publicify_AnalysisArgs!;
        expect(args.valueHostConfigAnalyzer).toBeDefined();
        expect(args.conditionConfigAnalyzer).toBeDefined();
        expect(args.validatorConfigAnalyzer).toBeDefined();
        expect(args.comparerAnalyzer).toBeDefined();

        expect(testItem.publicify_helper).toBeDefined();
        let helper = testItem.publicify_helper!;
        expect(helper.hasLookupKeyAnalyzer(ServiceName.converter)).toBe(true);
        expect(helper.hasLookupKeyAnalyzer(ServiceName.comparer)).toBe(false);  // yes, false
        expect(helper.hasLookupKeyAnalyzer(ServiceName.identifier)).toBe(true);
        expect(helper.hasLookupKeyAnalyzer(ServiceName.formatter)).toBe(true);
        expect(helper.hasLookupKeyAnalyzer(ServiceName.parser)).toBe(true);

    });    
    // time for a complex configuration that has no errors to report. 
    // We'll use the Builder again.
    // 2 ValueHostConfigs, each for ValueHostType="Input".
    // 1st has a dataType of LookupKey.Number,
    //   a parserKey of LookupKey.Number,
    //   and 2 ValidatorConfigs each with a ConditionConfig: 
    //   1st: conditionType = ConditionType.Require
    //   2nd: conditionType = ConditionType.LessThan, 
    //        secondValueHostName = 'testValueHost2'
    //        secondConversionLookupKey = LookupKey.Number
    //
    // 2nd has a dataType of LookupKey.String, and 
    //   1 ValidatorConfig with a ConditionConfig of conditionType = 
    //   ConditionType.RegExp and ConditionConfig.expression of /^\d+$/.
    // It will need parsers and converters to handle 1st.
    // So services must have NumberParser and NumberConverter registered.
    // Because we are using ValueHostType.Input and validators,
    // we'll use IValidationServices and ValidationManagerConfigBuilder.
    // Our helper must have registered the DataTypeParserLookupKeyAnalyzer added.
    // Write that test.
    test('With a complex configuration, there should be a lookup key info entry for LookupKey.Number and LookupKey.String and 2 entries in valueHostResults', () => {
        let services = createServices();
        registerAllConditions(services.conditionFactory);
        services.dataTypeParserService.register(new NumberParser(['en'], {
            decimalSeparator: '.',
            negativeSymbol: '-',
        }));
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());

        let builder = new ValidationManagerConfigBuilder(services);
        builder.input('testValueHost1', LookupKey.String, {
            parserLookupKey: LookupKey.Number,
        }).requireText().lessThan('testValueHost2', {
            secondConversionLookupKey: LookupKey.Number,
        });
        builder.input('testValueHost2', LookupKey.String).regExp(/^\d+$/);

        let testItem = new ValidationManagerConfigAnalysisService();    // preconfigures ConfigAnalyzers for ValueHosts, Validator, and Condition
        testItem.services = services;
        testItem.registerValueHostConfigPropertyAnalyzers(() => [
            new ValueHostTypePropertyAnalyzer(),
            new ValueHostNamePropertyAnalyzer(),
            new DataTypePropertyAnalyzer(),
            new ParserLookupKeyPropertyAnalyzer()
        ]);
        testItem.registerValidatorConfigPropertyAnalyzers(() => [
            new AllMessagePropertiesConfigPropertyAnalyzer(),
            new ConditionCreatorConfigPropertyAnalyzer(),
        ]);
        testItem.registerConditionConfigPropertyAnalyzers(() => [
            new ConditionCategoryPropertyAnalyzer(),
            new ConditionTypeConfigPropertyAnalyzer(),
            new ConditionWithConversionLookupKeyPropertyAnalyzer(),
            new ConditionWithValueHostNamePropertyAnalyzer(),
            new ConditionWithSecondValueHostNamePropertyAnalyzer()
        ]);

        let analysisOutput: IConfigAnalysisResultsExplorer | null = null;
        expect(() => analysisOutput = testItem.analyze(builder, {})).not.toThrow();
        expect(analysisOutput).toBeDefined();
        expect(analysisOutput!.results).toBeDefined();
        let results = analysisOutput!.results!;
        expect(results.cultureIds).toEqual(['en']);
        expect(results.valueHostNames).toEqual(['testValueHost1', 'testValueHost2']);
        expect(results.lookupKeyResults).toHaveLength(2);
        checkLookupKeyResults(results.lookupKeyResults, LookupKey.Number);
        checkLookupKeyResults(results.lookupKeyResults, LookupKey.String);
        checkLookupKeyResultsForService(results.lookupKeyResults, LookupKey.Number,
            ServiceName.converter);
        checkLookupKeyResultsForService(results.lookupKeyResults, LookupKey.Number,
            ServiceName.parser);
        checkLookupKeyResultsForService(results.lookupKeyResults, LookupKey.Number, ServiceName.identifier);
        checkLookupKeyResultsForNoService(results.lookupKeyResults, LookupKey.String, ServiceName.converter);
        checkLookupKeyResultsForService(results.lookupKeyResults, LookupKey.String, ServiceName.identifier);
        checkLookupKeyResultsForNoService(results.lookupKeyResults, LookupKey.String, ServiceName.parser);

        expect(results.valueHostResults).toHaveLength(2);
        let vhcConfigResults1 = results.valueHostResults[0] as ValueHostConfigCAResult;
        let vhcConfigResults2 = results.valueHostResults[1] as ValueHostConfigCAResult;
        expect(vhcConfigResults1).toBeDefined();
        expect(vhcConfigResults2).toBeDefined();
        // focus on the first ValueHostConfig.
        // It should have 2 ValidatorConfigs
        expect(vhcConfigResults1.valueHostName).toEqual('testValueHost1');
        expect(vhcConfigResults1.severity).toBeUndefined();
        expect(vhcConfigResults1.validatorResults).toHaveLength(2);
        let validatorConfigResults1 = vhcConfigResults1.validatorResults![0];
        let validatorConfigResults2 = vhcConfigResults1.validatorResults![1];
        expect(validatorConfigResults1).toBeDefined();
        expect(validatorConfigResults2).toBeDefined();
        expect(validatorConfigResults1.errorCode).toBe(ConditionType.RequireText);
        expect(validatorConfigResults2.errorCode).toBe(ConditionType.LessThan);
        expect(validatorConfigResults1.conditionResult).toBeDefined();
        expect(validatorConfigResults2.conditionResult).toBeDefined();
        expect(validatorConfigResults1.conditionResult!.conditionType).toEqual(ConditionType.RequireText);
        expect(validatorConfigResults2.conditionResult!.conditionType).toEqual(ConditionType.LessThan);

        expect(validatorConfigResults1.properties).toHaveLength(1); // info message about using ConditionType for ErrorCode
        expect(validatorConfigResults2.properties).toHaveLength(1); // info message about using ConditionType for ErrorCode
        let prop1 = validatorConfigResults1.properties[0] as PropertyCAResult;
        let prop2 = validatorConfigResults2.properties[0] as PropertyCAResult;
        expect(prop1.severity).toBe(CAIssueSeverity.info);
        expect(prop2.severity).toBe(CAIssueSeverity.info);
        expect(prop1.message).toMatch(/conditionType/);
        expect(prop2.message).toMatch(/conditionType/);
        expect(prop1.propertyName).toEqual('errorCode');
        expect(prop2.propertyName).toEqual('errorCode');

        // focus on the second ValueHostConfig.
        // It should have 1 ValidatorConfig
        expect(vhcConfigResults2.valueHostName).toEqual('testValueHost2');
        expect(vhcConfigResults2.severity).toBeUndefined();
        expect(vhcConfigResults2.validatorResults).toHaveLength(1);
        let validatorConfigResults3 = vhcConfigResults2.validatorResults![0];
        expect(validatorConfigResults3).toBeDefined();
        expect(validatorConfigResults3.errorCode).toBe(ConditionType.RegExp);
        expect(validatorConfigResults3.conditionResult).toBeDefined();
        expect(validatorConfigResults3.conditionResult!.conditionType).toEqual(ConditionType.RegExp);
        expect(validatorConfigResults3.properties).toHaveLength(1); // info message about using ConditionType for ErrorCode
        let prop3 = validatorConfigResults3.properties[0] as PropertyCAResult;
        expect(prop3.severity).toBe(CAIssueSeverity.info);
        expect(prop3.message).toMatch(/conditionType/);
        expect(prop3.propertyName).toEqual('errorCode');

        expect(results.lookupKeysIssues).toHaveLength(0);
    });
});
