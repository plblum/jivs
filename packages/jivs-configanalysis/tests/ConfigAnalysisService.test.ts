import { CONFIG_ANALYSIS_SERVICE_NAME } from '@plblum/jivs-engine/build/Interfaces/ModelRules';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { ValidationManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { createServices } from './TestSupport/support';
import { ConfigAnalysisOptions, IConfigAnalysis } from '../src/Types/ConfigAnalysis';
import { installConfigAnalysisService, getConfigAnalysisService, ConfigAnalysisService } from '../src/ConfigAnalysisService';
import { ConfigAnalysisResultsExplorer } from '../src/Explorer/ConfigAnalysisResultsExplorer';
import type { IValidationServices } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { IConditionConfigPropertyAnalyzer, IValidatorConfigPropertyAnalyzer, IValueHostConfigPropertyAnalyzer } from '../src/Types/Analyzers';
import { ValueHostNamePropertyAnalyzer, ValueHostTypePropertyAnalyzer } from '../src/Analyzers/ValueHostConfigPropertyAnalyzerClasses';
import { AllMessagePropertiesConfigPropertyAnalyzer, ConditionCreatorConfigPropertyAnalyzer } from '../src/Analyzers/ValidatorConfigPropertyAnalyzerClasses';
import { ConditionTypeConfigPropertyAnalyzer, ConditionWithConversionLookupKeyPropertyAnalyzer } from '../src/Analyzers/ConditionConfigPropertyAnalyzerClasses';
import { ValidationManagerConfigAnalysis } from '../src/ConfigAnalysis';
import { IConfigAnalysisResultsExplorer } from '../src/Types/Explorer';

describe('install and getConfigAnalysisService', () => {
    // not installed initially
    test('getConfigAnalysisService throws error when not installed', () => {
        const services = createServices();
        const service = services.getService('ConfigAnalysisService');
        expect(service).toBeNull();
    });
    // same but direct call to getService(CONFIG_ANALYSIS_SERVICE_NAME)
    test('getConfigAnalysisService throws error when not installed', () => {
        const services = createServices();
        let service = services.getService(CONFIG_ANALYSIS_SERVICE_NAME);
        expect(service).toBeNull();
    });

    test('installConfigAnalysisService installs the service and getConfigAnalysisService retrieves it', () => {
        const services = createServices();
        const installedService = installConfigAnalysisService(services);
        expect(installedService).toBeDefined();
        const retrievedService = getConfigAnalysisService(services);
        expect(retrievedService).toBe(installedService);

    });
});

describe('Create from ValidationManagerConfig object', () => {
    test('analyze with a Builder object', () => {
        const services = createServices();
        installConfigAnalysisService(services);
        const builder = new ValidationManagerConfigBuilder(services);
        builder.field('Field1').requireText();
        let cas = getConfigAnalysisService(services);

        const options: ConfigAnalysisOptions = {};
        const result = cas.analyze(builder, options);
        expect(result).toBeInstanceOf(ConfigAnalysisResultsExplorer);
    });
    
    test('analyze with a Configuration object', () => {
        const services = createServices();
        installConfigAnalysisService(services);
        const config: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [
                <FieldValueHostConfig>{
                    name: 'Field1',
                    validatorConfigs: [
                        {
                            conditionConfig: { conditionType: ConditionType.RequireText }
                        }
                    ]
                }
            ]
        };
        const options: ConfigAnalysisOptions = {};
        let cas = getConfigAnalysisService(services);
        const result = cas.analyze(config, options);
        expect(result).toBeInstanceOf(ConfigAnalysisResultsExplorer);

    });
});

// Subclass ValidationManagerConfigAnalysis to expose protected methods for testing
class TestConfigAnalysis extends ValidationManagerConfigAnalysis {

    public initializeAnalyzers(config: ValidationManagerConfig): void {
        let results = super.createConfigAnalysisResults(config);
        let analysisArgs = this.createAnalysisArgs(config, results, {});
        let helper = this.createHelper(analysisArgs);
        this.resolveConfigAnalyzers(analysisArgs, helper);
    }
}

// Subclass ConfigAnalysisService to expose protected methods for testing
// Uses TestConfigAnalysis to create a ConfigAnalysis object
class TestConfigAnalysisService extends ConfigAnalysisService {
    constructor(services: IValidationServices) {
        super(services);
    }
    public testAttachAnalyzers(cas: IConfigAnalysis): void {
        super.attachAnalyzers(cas);
    }
    public testCreateConfigAnalysis(): TestConfigAnalysis {
        return new TestConfigAnalysis();
    }        
    public get testValueHostAnalyzers(): IValueHostConfigPropertyAnalyzer[] {
        return this.valueHostAnalyzers;
    }
    public get testValidatorAnalyzers(): IValidatorConfigPropertyAnalyzer[] {
        return this.validatorAnalyzers;
    }
    public get testConditionAnalyzers(): IConditionConfigPropertyAnalyzer[] {
        return this.conditionAnalyzers;
    }
    public get testServices(): IValidationServices {
        return this.services;
    }

    public testReportResults(
        explorer: IConfigAnalysisResultsExplorer,
        options?: ConfigAnalysisOptions,
    ): void {
        super.reportResults(explorer, options);
    }    
}
describe('Check analyzers using a subclass of ConfigAnalysisService', () => {
    function setupConfigAnalysisService(): { testService: TestConfigAnalysisService, cas: TestConfigAnalysis, config: ValidationManagerConfig } {
        const services = createServices();
        const testService = new TestConfigAnalysisService(services);
        const cas = testService.testCreateConfigAnalysis() as TestConfigAnalysis;
        testService.testAttachAnalyzers(cas);
        let config: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        cas.initializeAnalyzers(config);
        return { testService, cas, config };
    }
    test('Check that analyzers are registered correctly', () => {
        const { testService, cas, config } = setupConfigAnalysisService();

        expect(testService.testValueHostAnalyzers.length).toBeGreaterThan(0);
        expect(testService.testValidatorAnalyzers.length).toBeGreaterThan(0);
        expect(testService.testConditionAnalyzers.length).toBeGreaterThan(0);
    });
    // individual tests for each valueHostAnalyzer can be added here if needed
    test('Check default valueHostAnalyzers', () => {
        const { testService, cas, config } = setupConfigAnalysisService();

        const analyzers = testService.testValueHostAnalyzers;
        const analyzerTypes = analyzers.map(analyzer => analyzer.constructor.name);

//        console.log(analyzerTypes);

        expect(analyzerTypes).toContain('ValueHostTypePropertyAnalyzer');
        expect(analyzerTypes).toContain('ValueHostNamePropertyAnalyzer');
        expect(analyzerTypes).toContain('DataTypePropertyAnalyzer');
        expect(analyzerTypes).toContain('LabelPropertiesAnalyzer');
        expect(analyzerTypes).toContain('ParserLookupKeyPropertyAnalyzer');
        expect(analyzerTypes).toContain('CalcFnPropertyAnalyzer');
    });
    test('Check default validatorAnalyzers', () => {
        const { testService, cas, config } = setupConfigAnalysisService();
        const analyzers = testService.testValidatorAnalyzers;
        const analyzerTypes = analyzers.map(analyzer => analyzer.constructor.name);
//        console.log(analyzerTypes);

        expect(analyzerTypes).toContain('AllMessagePropertiesConfigPropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionCreatorConfigPropertyAnalyzer');
    });
    test('Check default conditionAnalyzers', () => {
        const { testService, cas, config } = setupConfigAnalysisService();
        const analyzers = testService.testConditionAnalyzers;
        const analyzerTypes = analyzers.map(analyzer => analyzer.constructor.name);
//        console.log(analyzerTypes);

        expect(analyzerTypes).toContain('ConditionTypeConfigPropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionWithConversionLookupKeyPropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionCategoryPropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionWithChildrenPropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionWithOneChildPropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionWithValueHostNamePropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionWithSecondValueHostNamePropertyAnalyzer');
        expect(analyzerTypes).toContain('ConditionWithSecondValuePropertyAnalyzer');
    });  

    test('registerValueHostPropertyAnalyzer adds 2 analyzers without clobbering', () => {
        const { testService, cas, config } = setupConfigAnalysisService();
        const initialCount = testService.testValueHostAnalyzers.length;
        testService.registerValueHostPropertyAnalyzer(new ValueHostTypePropertyAnalyzer());
        testService.registerValueHostPropertyAnalyzer(new ValueHostNamePropertyAnalyzer());
        expect(testService.testValueHostAnalyzers.length).toBe(initialCount + 2);
    });
    test('registerValidatorPropertyAnalyzer adds 2 analyzers without clobbering', () => {
        const { testService, cas, config } = setupConfigAnalysisService();
        const initialCount = testService.testValidatorAnalyzers.length;
        testService.registerValidatorPropertyAnalyzer(new AllMessagePropertiesConfigPropertyAnalyzer());
        testService.registerValidatorPropertyAnalyzer(new ConditionCreatorConfigPropertyAnalyzer());
        expect(testService.testValidatorAnalyzers.length).toBe(initialCount + 2);
    });
    test('registerConditionPropertyAnalyzer adds 2 analyzers without clobbering', () => {
        const { testService, cas, config } = setupConfigAnalysisService();
        const initialCount = testService.testConditionAnalyzers.length;
        testService.registerConditionPropertyAnalyzer(new ConditionTypeConfigPropertyAnalyzer());
        testService.registerConditionPropertyAnalyzer(new ConditionWithConversionLookupKeyPropertyAnalyzer());
        expect(testService.testConditionAnalyzers.length).toBe(initialCount + 2);
    });
});
