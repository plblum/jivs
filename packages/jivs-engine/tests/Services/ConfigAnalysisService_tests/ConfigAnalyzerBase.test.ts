import { CAIssueSeverity, ConfigResults, IConfigPropertyAnalyzer, propertyNameFeature } from "../../../src/Interfaces/ConfigAnalysisService";
import { IValidationServices } from "../../../src/Interfaces/ValidationServices";
import { ValueHostConfig } from "../../../src/Interfaces/ValueHost";
import { AnalysisResultsHelper } from "../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper";
import { ConfigAnalyzerBase } from "../../../src/Services/ConfigAnalysisService/ConfigAnalyzerBase";
import { createServices, checkConfigPropertyResultsFromArray, createAnalysisArgs, setupHelper } from "./support";

// generate a Publicify_ConfigAnalyzerBase class from ConfigAnalyzerBase
class Publicify_ConfigAnalyzerBase extends ConfigAnalyzerBase<TestConfig, TestConfigResults, IValidationServices> {

    constructor(helper: AnalysisResultsHelper<IValidationServices>,
        propertyAnalyzers: Array<TestConfigPropertyAnalyzer>
    ) {
        super(helper, propertyAnalyzers);
    }
    
    protected initResults(config: TestConfig): TestConfigResults {
        return {
            feature: 'Test',
            config: config,
            properties: []
        };
    }
    protected checkForValiability(config: TestConfig, results: TestConfigResults): boolean {
        return true;
    }    
    protected checkForDuplicates(config: TestConfig, results: TestConfigResults, existingResults: TestConfigResults[]): void {
        let lc = results.config.name.toLowerCase();
        let duplicate = existingResults.find(vhc => vhc.config.name.toLowerCase() === lc);
        if (duplicate) {
            results.properties.push({
                feature: propertyNameFeature,
                propertyName: 'name',
                severity: CAIssueSeverity.error,
                message: 'Must be unique.'
            });
        }
    }
    protected checkChildConfigs(config: TestConfig, valueHostConfig: ValueHostConfig | null, results: TestConfigResults): void {
        this.ranCheckChildConfigs = true;
    }
    public ranCheckChildConfigs = false;

    public publicify_initResults(config: TestConfig): TestConfigResults {
        return this.initResults(config);
    }
    public publicify_checkForDuplicates(config: TestConfig, results: TestConfigResults, existingResults: TestConfigResults[]): void {
        this.checkForDuplicates(config, results, existingResults);
    }
    public publicify_checkChildConfigs(config: TestConfig, valueHostConfig: ValueHostConfig | null, results: TestConfigResults): void {
        this.checkChildConfigs(config, valueHostConfig, results);
    }

}
interface TestConfig {
    name: string;
    type: string;
    count: number;
}
interface TestConfigResults extends ConfigResults<TestConfig> {
    feature: 'Test';
}

class TestConfigPropertyAnalyzer implements IConfigPropertyAnalyzer<TestConfig, TestConfigResults> {
    public analyze(config: TestConfig, results: TestConfigResults): void {
        this.ranCount++;
    }
    public ranCount: number = 0;
}

function ranCountOfPropertyAnalyzers(propertyAnalyzers: Array<TestConfigPropertyAnalyzer>): number {
    let ranCount = 0;
    propertyAnalyzers.forEach(pa => ranCount += pa.ranCount);
    return ranCount;
}   
// Example test cases
describe('Publicify_ConfigAnalyzerBase', () => {
    // with 1 property analyzer, 1 test config, the test config results should be initialized correctly
    test('With 1 property analyzer, 1 test config, the test config results should be initialized correctly and there are no property results', () => {
        const testConfig = { name: 'Test', type: 'Type', count: 1 };
        let helper = setupHelper(createServices());
        let propertyAnalyzers = [new TestConfigPropertyAnalyzer()];
        const analyzer = new Publicify_ConfigAnalyzerBase(helper, propertyAnalyzers);
        let results = analyzer.analyze(testConfig, null, []);
        expect(results.properties).toHaveLength(0);
        expect(results.config).toBe(testConfig);
        expect(results.feature).toBe('Test');
        expect(analyzer.ranCheckChildConfigs).toBe(true);
        expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(1);
    });
    // with 0 property analyzers, 1 test config, the test config results should be initialized correctly and there are no property results
    test('With 0 property analyzers, 1 test config, the test config results should be initialized correctly and there are no property results', () => {
        const testConfig = { name: 'Test', type: 'Type', count: 1 };
        let helper = setupHelper(createServices());
        let propertyAnalyzers: Array<TestConfigPropertyAnalyzer> = [];
        const analyzer = new Publicify_ConfigAnalyzerBase(helper, propertyAnalyzers);
        let results = analyzer.analyze(testConfig, null, []);
        expect(results.properties).toHaveLength(0);
        expect(results.config).toBe(testConfig);
        expect(results.feature).toBe('Test');
        expect(analyzer.ranCheckChildConfigs).toBe(true);
        expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
    });
    // with 1 property analyzer, 2 test configs with the same name, the test config results should have a property result reflecting a duplicate error
    test('With 1 property analyzer, 2 test configs with the same name, the test config results should have a property result reflecting a duplicate error', () => {
        const testConfig1 = { name: 'Test', type: 'Type', count: 1 };
        const testConfig2 = { name: 'Test', type: 'AltType', count: 2 };
        let helper = setupHelper(createServices());
        let propertyAnalyzers = [new TestConfigPropertyAnalyzer()];
        const analyzer = new Publicify_ConfigAnalyzerBase(helper, propertyAnalyzers);
        let cummulativeResults: Array<TestConfigResults> = [];
        let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
        cummulativeResults.push(results1);
        let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
        expect(results2.properties).toHaveLength(1);
        checkConfigPropertyResultsFromArray(results2.properties, 0,
            'name', 'Must be unique.', CAIssueSeverity.error);

        expect(results2.config).toBe(testConfig2);
        expect(results2.feature).toBe('Test');
        expect(analyzer.ranCheckChildConfigs).toBe(true);
        expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(2);
    });

    // when a ConfigAnalyzer throws an error, it is caught and a ConfigErrorResult is added to the results
    test('When a ConfigAnalyzer throws an error, it is caught and a ConfigErrorResult is added to the results', () => {
        class ExceptionConfigPropertyAnalyzer implements IConfigPropertyAnalyzer<TestConfig, TestConfigResults> {
            public analyze(config: TestConfig, results: TestConfigResults): void {
                throw new Error('TEST ERROR');
            }
            public ranCount: number = 0;
        }        
        const testConfig = { name: 'Test', type: 'Type', count: 1 };
        let helper = setupHelper(createServices());
        let propertyAnalyzers = [new ExceptionConfigPropertyAnalyzer()];
        const analyzer = new Publicify_ConfigAnalyzerBase(helper, propertyAnalyzers);
        let results = analyzer.analyze(testConfig, null, []);

        expect(results.config).toBe(testConfig);
        expect(results.feature).toBe('Test');
        expect(analyzer.ranCheckChildConfigs).toBe(true);

        expect(results.properties).toHaveLength(1);
        let propResult = results.properties[0];
        expect(propResult.feature).toBe('Error');
        expect(propResult.severity).toBe(CAIssueSeverity.error);
        expect(propResult.message).toBe('TEST ERROR');

    });
});