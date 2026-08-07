import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { FieldValueHostConfig, IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IJivsServices } from '../../src/Interfaces/JivsServices';
import { StaticValueHostConfig } from '../../src/Interfaces/StaticValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { ValueHostsManager } from '../../src/Validation/ValueHostsManager';
import { IValueHostsManager, ValueHostsManagerConfig } from './../../src/Interfaces/ValueHostsManager';
import { createJivsServicesForTesting } from './../../src/Support/createJivsServicesForTesting';
import { ModelReader } from './../../src/ModelReaderWriter/ModelReader_classes';
import { ModelWriter } from './../../src/ModelReaderWriter/ModelWriter_classes';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { LoggingLevel } from '../../src/Interfaces/LoggerService';
// Tests that use ModelReader and ModelWriter.
// Model->ModelReader->ValueHostsManager->set new values->ModelWriter->Model

describe('ModelReader and ModelWriter round trip tests', () =>
{
    class TestModel1
    {
        public name?: string;
        public birthDate?: Date;
        public isActive?: boolean;
        public score?: number;

        public extra1?: string; // we won't have a ValueHost for this, but we will see that it is preserved in the round trip
    }
    function setupValueHostsManagerForTestModel1(model: TestModel1,
        nameConfig: Partial<FieldValueHostConfig> | null,
        birthDateConfig: Partial<FieldValueHostConfig> | null,
        isActiveConfig: Partial<FieldValueHostConfig> | null,
        scoreConfig: Partial<FieldValueHostConfig> | null,
    ):
        {
            valueHostsManager: IValueHostsManager,
            services: IJivsServices,
            vhName: IFieldValueHost,
            vhBirthDate: IFieldValueHost,
            vhIsActive: IFieldValueHost,
            vhScore: IFieldValueHost,
            logger: CapturingLogger;
        }
    {
        let services = createJivsServicesForTesting({ logger: 'capturing' });
        let logger = services.loggerService as CapturingLogger;
        logger.minLevel = LoggingLevel.Debug;
        // provide a default for birthDate being undefined.
        services.dataCleanupService.registerThenFunction('twoThousand', (value: any) => { return { value: new Date('2000-01-01') }; });
        let valueHostsManagerConfig: ValueHostsManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        function finishConfig(config: Partial<FieldValueHostConfig> | null, defaultName: string, defaultDataType: LookupKey): FieldValueHostConfig
        {
            if (!config) config = {};
            config = { ...{ name: defaultName, propertyName: defaultName, dataType: defaultDataType, valueHostType: ValueHostType.Field }, ...config } as FieldValueHostConfig;
            return config as FieldValueHostConfig;
        }

        let finalNameConfig = finishConfig(nameConfig, 'name', LookupKey.String);
        let finalBirthDateConfig = finishConfig(birthDateConfig, 'birthDate', LookupKey.Date);
        let finalIsActiveConfig = finishConfig(isActiveConfig, 'isActive', LookupKey.Boolean);
        let finalScoreConfig = finishConfig(scoreConfig, 'score', LookupKey.Number);
        // the names above are exact matches to the property name on the TestModel1.
        // If we want the ValueHostName to be different than the property name, supply is in the config object { name: 'differentName' }
        // Do not change the property name unless you are testing for invalid naming issues.
        valueHostsManagerConfig.valueHostConfigs.push(finalNameConfig);
        valueHostsManagerConfig.valueHostConfigs.push(finalBirthDateConfig);
        valueHostsManagerConfig.valueHostConfigs.push(finalIsActiveConfig);
        valueHostsManagerConfig.valueHostConfigs.push(finalScoreConfig);
        
        valueHostsManagerConfig.valueHostConfigs.push(<StaticValueHostConfig> { // something that does not result in a field on the model, just to test that it is preserved in the round trip
            name: 'Temperature', dataType: LookupKey.Number,
            valueHostType: ValueHostType.Static, initialValue: 25
        });

        const valueHostsManager = new ValueHostsManager(valueHostsManagerConfig);

        return {
            services, valueHostsManager,
            vhName: valueHostsManager.getFieldValueHost(finalNameConfig.name)!,
            vhBirthDate: valueHostsManager.getFieldValueHost(finalBirthDateConfig.name)!,
            vhIsActive: valueHostsManager.getFieldValueHost(finalIsActiveConfig.name)!,
            vhScore: valueHostsManager.getFieldValueHost(finalScoreConfig.name)!,
            logger: logger
        };
    }

    test('Happy path where all fields move through unchanged. No rules exist. No undefined values. No attempt to setValue on ValueHostManager in the middle', () =>
    {
        let model1 = new TestModel1();
        model1.name = 'John Doe';
        model1.birthDate = new Date('1990-01-01');
        model1.isActive = true;
        model1.score = 42;
        let { logger, valueHostsManager, vhName, vhBirthDate, vhIsActive, vhScore } = setupValueHostsManagerForTestModel1(model1, null, null, null, null);
        // Read the model into the ValueHostsManager
        const modelReader = new ModelReader(valueHostsManager, model1);
        modelReader.read();

        // valuehosts should now have the values from the model
        expect(vhName.getValue()).toBe('John Doe');
        expect(vhBirthDate.getValue()).toEqual(new Date('1990-01-01'));
        expect(vhIsActive.getValue()).toBe(true);
        expect(vhScore.getValue()).toBe(42);
        expect(valueHostsManager.getValueHost('Temperature')!.getValue()).toBe(25);

        // Now write the values back into a new model
        let model2 = new TestModel1();
        let modelWriter = new ModelWriter(valueHostsManager, model2);
        modelWriter.write();
        // The new model should have the same values as the original model
        expect(model2.name).toBe('John Doe');
        expect(model2.birthDate).toEqual(new Date('1990-01-01'));
        expect(model2.isActive).toBe(true);
        expect(model2.score).toBe(42);
    });
    // same but setValue used on each ValueHost to change the values before writing back to the model
    test('SetValue used on each ValueHost to change the values before writing back to the model', () =>
    {
        let model1 = new TestModel1();
        model1.name = 'John Doe';
        model1.birthDate = new Date('1990-01-01');
        model1.isActive = true;
        model1.score = 42;
        let { logger, valueHostsManager, vhName, vhBirthDate, vhIsActive, vhScore } = setupValueHostsManagerForTestModel1(model1, null, null, null, null);
        // Change the values using setValue
        vhName.setValue('Jane Smith');
        vhBirthDate.setValue(new Date('1985-05-15'));
        vhIsActive.setValue(false);
        vhScore.setValue(99);
        // Now write the values back into a new model
        let model2 = new TestModel1();
        let modelWriter = new ModelWriter(valueHostsManager, model2);
        modelWriter.write();
        // The new model should have the updated values
        expect(model2.name).toBe('Jane Smith');
        expect(model2.birthDate).toEqual(new Date('1985-05-15'));
        expect(model2.isActive).toBe(false);
        expect(model2.score).toBe(99);
    });

    // original has only undefined values. Rules exist on FieldValueHostConfig.modelReaderRule to set default values. No attempt to setValue on ValueHostManager in the middle
    test('Original model has only undefined values. Rules exist on FieldValueHostConfig.modelReaderRule to set default values. No attempt to setValue on ValueHostManager in the middle', () =>
    {
        let model1 = new TestModel1();
        // all properties are undefined
        let { logger, valueHostsManager, vhName, vhBirthDate, vhIsActive, vhScore } = setupValueHostsManagerForTestModel1(model1,
            { modelReaderRule: { when: 'undefined', then: 'emptystring' } },
            { modelReaderRule: { when: 'undefined', then: 'twoThousand' } },   // we created a rule for this in the setup function
            { modelReaderRule: { when: 'undefined', then: 'true' } },
            { modelReaderRule: { when: 'undefined', then: '0' } }
        );
        
        // Read the model into the ValueHostsManager
        const modelReader = new ModelReader(valueHostsManager, model1);
        modelReader.read();
        // check that the values have been set according to the rules
        expect(vhName.getValue()).toBe('');
        expect(vhBirthDate.getValue()).toEqual(new Date('2000-01-01'));
        expect(vhIsActive.getValue()).toBe(true);
        expect(vhScore.getValue()).toBe(0);
        // write them back into a new model
        let model2 = new TestModel1();
        let modelWriter = new ModelWriter(valueHostsManager, model2);
        modelWriter.write();
        // The new model should have the values set by the rules
        expect(model2.name).toBe('');
        expect(model2.birthDate).toEqual(new Date('2000-01-01'));
        expect(model2.isActive).toBe(true);
        expect(model2.score).toBe(0);
    });

    // similar but the original will have extra1 assigned and then we'll write back to it
    test('Original model has only undefined values. Rules exist on FieldValueHostConfig.modelReaderRule to set default values. Original model has extra1 assigned and then we write back to it', () =>
    {
        let model1 = new TestModel1();
        model1.extra1 = 'Extra value preserved';
        // all other properties are undefined
        let { logger, valueHostsManager, vhName, vhBirthDate, vhIsActive, vhScore } = setupValueHostsManagerForTestModel1(model1,
            { modelReaderRule: { when: 'undefined', then: 'emptystring' } },
            { modelReaderRule: { when: 'undefined', then: 'twoThousand' } },   // we created a rule for this in the setup function
            { modelReaderRule: { when: 'undefined', then: 'true' } },
            { modelReaderRule: { when: 'undefined', then: '0' } }
        );
        // Read the model into the ValueHostsManager
        const modelReader = new ModelReader(valueHostsManager, model1);
        modelReader.read();
        // check that the values have been set according to the rules
        expect(vhName.getValue()).toBe('');
        expect(vhBirthDate.getValue()).toEqual(new Date('2000-01-01'));
        expect(vhIsActive.getValue()).toBe(true);
        expect(vhScore.getValue()).toBe(0);
        // write them back into the original model
        let modelWriter = new ModelWriter(valueHostsManager, model1);
        modelWriter.write();
        // The original model should have the values set by the rules and extra1 preserved
        expect(model1.name).toBe('');
        expect(model1.birthDate).toEqual(new Date('2000-01-01'));
        expect(model1.isActive).toBe(true);
        expect(model1.score).toBe(0);
        expect(model1.extra1).toBe('Extra value preserved');
    });
});