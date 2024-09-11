import { InputValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/InputValueHost';
import { ValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { ValidationManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { ValueHostsManagerConfigBuilder } from '@plblum/jivs-engine/build/ValueHosts/ValueHostsManagerConfigBuilder';
import { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { createServices } from './TestSupport/support';
import { analyze, analyzeLite } from '../src/Runner';
import { ConfigAnalysisOptions } from '../src/Types/ConfigAnalysis';
import { ConfigAnalysisResultsExplorer } from '../src/Explorer/ConfigAnalysisResultsExplorer';

describe('ValidationManager focused', () => {

    test('analyze with a Builder object', () => {
        const services = createServices();
        const builder = new ValidationManagerConfigBuilder(services);
        builder.input('Field1').requireText();

        const options: ConfigAnalysisOptions = {};

        const result = analyze(builder, options);
        expect(result).toBeInstanceOf(ConfigAnalysisResultsExplorer);
    });

    test('analyze with a Configuration object', () => {
        const services = createServices();
        const config: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: [
                <InputValueHostConfig>{
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
        const result = analyze(config, options);
        expect(result).toBeInstanceOf(ConfigAnalysisResultsExplorer);
    });
    test('Analyze with null throws an error', () => {
        const options: ConfigAnalysisOptions = {};
        expect(() => analyze(null!, options)).toThrow('Invalid argument type');
    });
});

describe('ValueHostsManager focused', () => {

    test('analyzeLite with a Builder object', () => {
        const services = createServices();
        const builder = new ValueHostsManagerConfigBuilder(services);
        builder.static('Field1');

        const options: ConfigAnalysisOptions = {};

        const result = analyzeLite(builder, options);
        expect(result).toBeInstanceOf(ConfigAnalysisResultsExplorer);
    });

    test('analyzeLite with a Configuration object', () => {
        const services = createServices();
        const config: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: [
                {
                    name: 'Field1',
                    valueHostType: 'static'
                }
            ]
        };

        const options: ConfigAnalysisOptions = {};
        const result = analyzeLite(config, options);
        expect(result).toBeInstanceOf(ConfigAnalysisResultsExplorer);
    });
    test('Analyze with null throws an error', () => {
        const options: ConfigAnalysisOptions = {};
        expect(() => analyzeLite(null!, options)).toThrow('Invalid argument type');
    });
});