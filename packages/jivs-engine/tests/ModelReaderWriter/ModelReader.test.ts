import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { CalcValueHostConfig } from '../../src/Interfaces/CalcValueHost';
import { ValueAdapterResolution, ValueAdapterRule } from '../../src/Interfaces/ValueAdapterService';
import { IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IJivsServices } from '../../src/Interfaces/JivsServices';
import { LoggingLevel } from '../../src/Interfaces/LoggerService';
import { StaticValueHostConfig } from '../../src/Interfaces/StaticValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { ModelReader } from '../../src/ModelReaderWriter/ModelReader_classes';
import { ValueAdapterService } from '../../src/Services/ValueAdapterService';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { finishPartialFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
import { MockJivsServices, MockValueHostsManager } from '../TestSupport/mocks';

/**
 * This class is used to expose the protected members of ModelReader for testing purposes.
 */
class PublicifyModelReader extends ModelReader<object>
{
    constructor(valueHostsManager: IValueHostsManager, model: object,
        disableFormatter: boolean = false,
        skipValueChangedCallback: boolean = false
    )
    {
        super(valueHostsManager, model, disableFormatter, skipValueChangedCallback);
    }

    public get publicify_valueHostsManager(): IValueHostsManager
    {
        return super.valueHostsManager;
    }

    public get publicify_model(): object
    {
        return super.model;
    }
    public get publicify_services(): IJivsServices
    {
        return super.services;
    }
    public get publicify_disableFormatter(): boolean
    {
        return super.disableFormatter;
    }
    public get publicify_skipValueChangedCallback(): boolean
    {
        return super.skipValueChangedCallback;
    }
    public get publicify_logger(): any
    {
        return super.logger;
    }

    // create 'publicify_name' versions of protected methods for testing
    public publicify_adjustValueByRule(
        modelPropertyValue: any, rule: ValueAdapterRule, valueHost: IFieldValueHost): ValueAdapterResolution
        
    {
        return this.adjustValueByRule(modelPropertyValue, rule, valueHost);
    }

    public publicify_tryGetValueFromModel(modelPropertyName: string, valueHost: IFieldValueHost):
        {
            skip?: boolean,
            value?: any
        }
    {
        return super.tryGetValueFromModel(modelPropertyName, valueHost);
    }

    public publicify_setValueIntoValueHost(valueHost: IFieldValueHost, value: any, options: { skipValueChangedCallback?: boolean; }): void
    {
        this.setValueIntoValueHost(valueHost, value, options);
    }

    public publicify_getRule(valueHost: IFieldValueHost): ValueAdapterRule | undefined
    {
        return this.getRule(valueHost);
    }

}

function setup(model: object, propertyName: string,
    whenRule: string, thenRule: string,
    disableFormatter: boolean = false, skipValueChangedCallback: boolean = false):
    {
        services: IJivsServices, logger: CapturingLogger,
        reader: PublicifyModelReader,
        valueHostsManager: IValueHostsManager,
        valueHost: IFieldValueHost
    }
{
    let services = new MockJivsServices(false, false);
    let logger = services.loggerService as CapturingLogger;
    logger.minLevel = LoggingLevel.Debug;
    services.valueAdapterService = new ValueAdapterService(); // supplies the standard rules for when and then
    let valueHostsManager = new MockValueHostsManager(services);
    let valueHost = valueHostsManager.addValueHost(
        finishPartialFieldValueHostConfig({
            propertyName: propertyName,
            modelReaderRule: { when: whenRule, then: thenRule },
        }, 1), null) as IFieldValueHost;
    let reader = new PublicifyModelReader(valueHostsManager, model, disableFormatter, skipValueChangedCallback);
    return { services, logger, reader, valueHostsManager, valueHost };
}

/**
 * Creates a FieldValueHost with a modelReaderRule and adds it to the valueHostsManager.
 * @param valueHostsManager 
 * @param when 
 * @param then 
 * @param fieldIndex 
 * @returns 
 */
function createFieldValueHostWithRule(valueHostsManager: IValueHostsManager,
    when: string, then: string, fieldIndex: number = 1): IFieldValueHost
{
    let valueHost = valueHostsManager.addValueHost(
        finishPartialFieldValueHostConfig({
            modelReaderRule: {
                when: when,
                then: then
            },
        }, fieldIndex), null);
    return valueHost as IFieldValueHost;
}

describe('ModelReader', () =>
{
    // mostly a concrete tester of ModelReaderBase, but also tests the ModelReader class itself
    // Tests are setup similarly to FieldValueHost.test.ts and consume functions
    // from TestSupport/FieldValueHostTestFunctions.ts.
    // They can use the MockJivsServices and MockValueHostsManager

    describe('constructor', () =>
    {
        test('Create with first 2 parameters. Confirm properties are set correctly', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);

            let reader = new PublicifyModelReader(valueHostsManager, model);
            expect(reader.publicify_valueHostsManager).toBe(valueHostsManager);
            expect(reader.publicify_model).toBe(model);
            expect(reader.publicify_services).toBe(services);
            expect(reader.publicify_disableFormatter).toBe(false);
            expect(reader.publicify_skipValueChangedCallback).toBe(false);
            expect(reader.publicify_logger).toBeDefined();
        });
        test('Create with all parameters. Confirm properties are set correctly', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);
            let disableFormatter = true;
            let skipValueChangedCallback = true;

            let reader = new PublicifyModelReader(valueHostsManager, model, disableFormatter, skipValueChangedCallback);
            expect(reader.publicify_valueHostsManager).toBe(valueHostsManager);
            expect(reader.publicify_model).toBe(model);
            expect(reader.publicify_services).toBe(services);
            expect(reader.publicify_disableFormatter).toBe(disableFormatter);
            expect(reader.publicify_skipValueChangedCallback).toBe(skipValueChangedCallback);
        });
        test('Create with null valueHostsManager. Expect error', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let valueHostsManager = null as unknown as IValueHostsManager;
            expect(() => new PublicifyModelReader(valueHostsManager, model)).toThrow(/valueHostsManager/);

        });
        test('Create with null model. Expect error', () =>
        {
            let model = null as unknown as object;
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);
            expect(() => new PublicifyModelReader(valueHostsManager, model)).toThrow(/model/);
        });
        test('confirm logger is created and has correct feature name', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);
            let reader = new PublicifyModelReader(valueHostsManager, model);
            expect(reader.publicify_logger).toBeDefined();
            expect(reader.publicify_logger.feature).toBe('PublicifyModelReader');
        });
        test('confirm 2 calls to logger return the same instance', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);
            let reader = new PublicifyModelReader(valueHostsManager, model);
            let logger1 = reader.publicify_logger;
            let logger2 = reader.publicify_logger;
            expect(logger1).toBe(logger2);
        });
    });

    describe('adjustValueByRule via publicify_', () =>
    {
        // most of the work is in ValueAdapterService with full tests.
        // This just performs a few tests to confirm the ModelReader is using the service correctly.
        // No logging is reviewed here.

        test('when lookup in factory fails:  when=unknown,then=known. Expect skip true and logged error', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHost, reader } = setup(model, 'prop1',
                'unknown', 'unassigned');
            
            let modelReaderRule = valueHost.getModelReaderRule();
            expect(modelReaderRule).toBeDefined();
            let result = reader.publicify_adjustValueByRule('value1', modelReaderRule!, valueHost);
            expect(result.skip).toBe(true);
            expect(result.value).toBeUndefined();
        });
        test('then lookup in factory fails: when=known, then=unknown. Expect skip true', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, reader } = setup(model, 'prop1', 'nullorundefined', 'unknown');
            let modelReaderRule = valueHost.getModelReaderRule();
            expect(modelReaderRule).toBeDefined();
            let result = reader.publicify_adjustValueByRule(model.prop1, modelReaderRule!, valueHost);
            expect(result.skip).toBe(true);
            expect(result.value).toBeUndefined();
        });
        // when function returns false, indicating the value is valid and does not need to be replaced. Expect skip true and no value.
        test('when function returns false, indicating the value is valid and does not need to be replaced. Expect skip false and value=originalValue.', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHost, reader } = setup(model, 'prop1', 'undefined', 'unassigned');
            let modelReaderRule = valueHost.getModelReaderRule();
            expect(modelReaderRule).toBeDefined();
            let result = reader.publicify_adjustValueByRule(model.prop1, modelReaderRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBe(model.prop1);
        });
        // the rest are for then rule
        test('when tests for null and finds null, then=null. Expect skip=false, value=null.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, reader } = setup(model, 'prop1', 'nullorundefined', 'null');
            let modelReaderRule = valueHost.getModelReaderRule();
            expect(modelReaderRule).toBeDefined();
            let result = reader.publicify_adjustValueByRule(model.prop1, modelReaderRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBe(null);
        });
        test('when tests for null and finds null, then=unassigned. Expect skip=false, value=undefined.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, reader } = setup(model, 'prop1', 'nullorundefined', 'unassigned');
            let modelReaderRule = valueHost.getModelReaderRule();
            expect(modelReaderRule).toBeDefined();
            let result = reader.publicify_adjustValueByRule(model.prop1, modelReaderRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBeUndefined();
        });
        test('when tests for null and finds null, then=keep. Expect skip=false, value=null.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, reader } = setup(model, 'prop1', 'nullorundefined', 'keep');
            let modelReaderRule = valueHost.getModelReaderRule();
            expect(modelReaderRule).toBeDefined();
            let result = reader.publicify_adjustValueByRule(model.prop1, modelReaderRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBeNull();
        });
    });
    describe('publicify_tryGetValueFromModel via publicify_', () =>
    {
        test('returns the value from the model for the given property name', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHost, reader } = setup(model, 'prop1', 'undefined', 'unassigned');
            let result = reader.publicify_tryGetValueFromModel('prop1', valueHost);
            expect(result.value).toBe('value1');
            expect(result.skip).toBe(false);
        });
        test('returns undefined for a property name that does not exist in the model. Log shows warning', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'undefined', 'unassigned');
            let result = reader.publicify_tryGetValueFromModel('nonexistentProp', valueHost);
            expect(result.value).toBeUndefined();
            expect(result.skip).toBe(true);
            expect(logger.findMessage(`property 'nonexistentProp' does not exist`, LoggingLevel.Warn)).toBeTruthy();
        });
        test('When model is a real class instance, returns the value from the model for the given property name', () =>
        {
            class MyModel
            {
                public prop1: string = 'value1';
                public prop2: number = 42;
            }
            let model = new MyModel();
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'undefined', 'unassigned');
            let result = reader.publicify_tryGetValueFromModel('prop1', valueHost);
            expect(result.value).toBe('value1');
            expect(result.skip).toBe(false);
        });
        test('When model is a real class instance, returns undefined for a property name that does not exist in the model. Log shows warning', () =>
        {
            class MyModel
            {
                public prop1: string = 'value1';
                public prop2: number = 42;
            }
            let model = new MyModel();
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'undefined', 'unassigned');
            let result = reader.publicify_tryGetValueFromModel('nonexistentProp', valueHost);
            expect(result.value).toBeUndefined();
            expect(result.skip).toBe(true);
            expect(logger.findMessage(`property 'nonexistentProp' does not exist`, LoggingLevel.Warn)).toBeTruthy();
        });
        // test a few happy path cases using ObjectFinder's syntax for nested properties and arrays
        test('When model has nested properties, returns the value from the model for the given property name using dot notation', () =>
        {
            let model = { prop1: { nestedProp: 'nestedValue' }, prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1.nestedProp', 'undefined', 'unassigned');
            let result = reader.publicify_tryGetValueFromModel('prop1.nestedProp', valueHost);
            expect(result.value).toBe('nestedValue');
            expect(result.skip).toBe(false);
        });
        test('When model has nested properties, returns the value from the model for the given property name using bracket notation', () =>
        {
            let model = { prop1: [{ nestedProp: 'nestedValue', prop2: 42}] };
            let { valueHost, reader } = setup(model, 'prop1[0].nestedProp', 'undefined', 'unassigned');
            let result = reader.publicify_tryGetValueFromModel('prop1[0].nestedProp', valueHost);
            expect(result.value).toBe('nestedValue');
            expect(result.skip).toBe(false);
        });
        
    });
    describe('getRule via publicify_', () =>
    {
        test('returns the rule for the given valueHost', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'undefined', 'unassigned');
            let rule = reader.publicify_getRule(valueHost);
            expect(rule).toBe(valueHost.getModelReaderRule());
        });
        test('returns undefined for a valueHost with no rule', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            services.valueAdapterService = new ValueAdapterService(); // supplies the standard rules for when and then
            let valueHostsManager = new MockValueHostsManager(services);
            // not modelReaderRule is set on this valueHost
            let valueHostNoRule = valueHostsManager.addValueHost(finishPartialFieldValueHostConfig({}), null) as IFieldValueHost;
            let reader = new PublicifyModelReader(valueHostsManager, model);

            let rule = reader.publicify_getRule(valueHostNoRule);
            expect(rule).toBeUndefined();
        });
    });
    describe('setValueIntoValueHost via publicify_', () =>
    {
        test('sets the value into the valueHost', () => 
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'undefined', 'unassigned');
            let value = 'newValue';
            let options = { disableFormatter: false, skipValueChangedCallback: false, validate: false, reset: true };
            reader.publicify_setValueIntoValueHost(valueHost, value, options);
            expect(valueHost.getValue()).toBe(value);
        });
    });

    describe('read with limited tests around the functions already tested above', () =>
    {
        test('read with a valueHost that has a rule that adjusts the value. Expect the adjusted value to be set into the valueHost', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'zero', 'null');
            reader.readFromModel();
            expect(valueHost.getValue()).toBeNull();
            expect(logger.findMessage(`Reading model property 'prop1' for ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value assigned to`, LoggingLevel.Info)).toBeTruthy();
        });
        // same using readFromProperty(valueHost) on prop1
        test('readFromProperty with a valueHost that has a rule that adjusts the value. Expect the adjusted value to be set into the valueHost', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'zero', 'null');
            reader.readFromProperty(valueHost);
            expect(valueHost.getValue()).toBeNull();
            expect(logger.findMessage(`Reading model property 'prop1' for ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value assigned to`, LoggingLevel.Info)).toBeTruthy();
        });
        // same using readFromProperty('prop1', valueHost)
        test('readFromProperty with a model property name and valueHost that has a rule that adjusts the value. Expect the adjusted value to be set into the valueHost', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'zero', 'null');
            reader.readFromProperty('prop1', valueHost);
            expect(valueHost.getValue()).toBeNull();
            expect(logger.findMessage(`Reading model property 'prop1' for ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value assigned to`, LoggingLevel.Info)).toBeTruthy();
        });

        test('read with a valueHost that has a rule that does not adjust the value. Expect the original value to be set into the valueHost', () =>
        {
            let model = { prop1: 5, prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'zero', 'null');
            reader.readFromModel();
            expect(valueHost.getValue()).toBe(5);
            expect(logger.findMessage(`Reading model property 'prop1' for ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value assigned to`, LoggingLevel.Info)).toBeTruthy();
        });

        test('read with a valueHost that has a rule that adjusts the value to unassigned. Expect the valueHost to be set to undefined.', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'zero', 'unassigned');
            reader.readFromModel();
            expect(valueHost.getValue()).toBeUndefined();
            expect(logger.findMessage(`Reading model property 'prop1' for ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value of undefined`, LoggingLevel.Info)).toBeTruthy();
        });
        test('read with a valueHost that has a rule that adjusts the value to keep. Expect the valueHost to be set to null.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'nullorundefined', 'keep');
            reader.readFromModel();
            expect(valueHost.getValue()).toBeNull();
            expect(logger.findMessage(`Reading model property 'prop1' for ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value assigned to`, LoggingLevel.Info)).toBeTruthy();

        });
        // property not included on model
        test('read with a valueHost that has a model property that does not exist. Expect the valueHost to be set to undefined and a warning logged.', () =>
        {
            let model = { prop2: 42 };
            let { valueHostsManager, logger, valueHost, reader } = setup(model, 'prop1', 'zero', 'null');
            reader.readFromModel();
            expect(valueHost.getValue()).toBeUndefined();
            expect(logger.findMessage(`Reading model property 'prop1' for ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' does not exist in the model.`, LoggingLevel.Warn)).toBeTruthy();
        });
        // valuehostname = FieldValueHostConfig.propertyName
        test('read with a valueHost that has a propertyName that does not exist on the model. Expect the valueHost to be set to undefined and a warning logged.', () =>
        {
            let services = new MockJivsServices(false, false);
            services.valueAdapterService = new ValueAdapterService();
            let valueHostsManager = new MockValueHostsManager(services);
            let valueHost = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let model = {}; // propertyName is field1, same as generated name for valueHost
            (model as any)[valueHost.getName()] = 'someValue'; // add a property with the same name as the valueHost, but not the propertyName

            let reader = new PublicifyModelReader(valueHostsManager, model);
            reader.readFromModel();
            expect(valueHost.getValue()).toBe('someValue'); // the valueHost name matches a property on the model, so it will be set to that value
        });
        // ValueHosts for all properties on the model and no adjustments (best happy path test)
        // Will require creating all the valueHosts for the model properties and adding them to the valueHostsManager.
        test('read with valueHosts for all properties on the model and no adjustments. Expect the valueHosts to be set to the model values.', () =>
        {
            // using matching name and propertyname, Field1, Field2, etc.
            let services = new MockJivsServices(false, false);
            services.valueAdapterService = new ValueAdapterService(); // supplies the standard rules for when and then
            let logger = services.loggerService as CapturingLogger;
            logger.minLevel = LoggingLevel.Debug;
            let valueHostsManager = new MockValueHostsManager(services);
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'undefined', 'unassigned', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'undefined', 'unassigned', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'undefined', 'unassigned', 3);
            let model = {};
            (model as any)[valueHost1.getName()] = 'value1';
            (model as any)[valueHost2.getName()] = 42;
            (model as any)[valueHost3.getName()] = true;
            let reader = new PublicifyModelReader(valueHostsManager, model);
            reader.readFromModel();
            logger.toConsole();
            expect(valueHost1.getValue()).toBe('value1');
            expect(valueHost2.getValue()).toBe(42);
            expect(valueHost3.getValue()).toBe(true);
        });
        // tests with multiple valuehosts where one source value is replaced by null
        test('read with multiple valueHosts where first has rule that applies and adjusts', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 3);
            let model = {};
            (model as any)[valueHost1.getName()] = 0;
            (model as any)[valueHost2.getName()] = 42;
            (model as any)[valueHost3.getName()] = 'hello';            
            let reader = new PublicifyModelReader(valueHostsManager, model);
            reader.readFromModel();
            expect(valueHost1.getValue()).toBeNull();
            expect(valueHost2.getValue()).toBe(42);
            expect(valueHost3.getValue()).toBe('hello');
        });
        // same but last of the 3 valuehosts has a rule that applies and adjusts
        test('read with multiple valueHosts where last has rule that applies and adjusts', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 3);
            let model = {};
            (model as any)[valueHost1.getName()] = 'value1';
            (model as any)[valueHost2.getName()] = 42;
            (model as any)[valueHost3.getName()] = 0;
            let reader = new PublicifyModelReader(valueHostsManager, model);
            reader.readFromModel();
            expect(valueHost1.getValue()).toBe('value1');
            expect(valueHost2.getValue()).toBe(42);
            expect(valueHost3.getValue()).toBeNull();   
        });
        // multiple where model does not have a property for one of the valueHosts. Expect that valueHost to be set to undefined and a warning logged.
        test('read with multiple valueHosts where one has a model property that does not exist. Expect that valueHost to be set to undefined and a warning logged.', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 3);
            let logger = valueHostsManager.services.loggerService as CapturingLogger;
            logger.minLevel = LoggingLevel.Debug;
            let model = {};
            (model as any)[valueHost1.getName()] = 'value1';
            (model as any)[valueHost2.getName()] = 42;
            // valueHost3 does not have a corresponding property in the model
            let reader = new PublicifyModelReader(valueHostsManager, model);
            reader.readFromModel();
            expect(valueHost1.getValue()).toBe('value1');
            expect(valueHost2.getValue()).toBe(42);
            expect(valueHost3.getValue()).toBeUndefined();
            // see logs indicating the final result of all 3
            expect(logger.findMessage(`Model property '${ valueHost1.getName() }' value assigned to`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`Model property '${ valueHost2.getName() }' value assigned to`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`Model property '${ valueHost3.getName() }' does not exist in the model.`, LoggingLevel.Warn)).toBeTruthy();
        });
        // special case: Mixed ValueHost types. Only FieldValueHosts are supposed to be used with ModelReader, but  we'll test that the ModelReader ignores non-FieldValueHosts and does not throw an error.
        test('read with mixed ValueHost types. Expect the ModelReader to ignore non-FieldValueHosts and not throw an error.', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = valueHostsManager.addValueHost(<StaticValueHostConfig> {
                valueHostType: ValueHostType.Static,
                name: 'Field3',
                initialValue: 10,
                dataType: LookupKey.Number
            }, null);
            // our model will have properties for all 3 valueHosts, but the ModelReader should ignore the static valueHost and not throw an error.
            let model = {};
            (model as any)[valueHost1.getName()] = 0;
            (model as any)[valueHost2.getName()] = 42;
            (model as any)[valueHost3.getName()] = 100;
            let reader = new PublicifyModelReader(valueHostsManager, model);
            reader.readFromModel();
            expect(valueHost1.getValue()).toBeNull();
            expect(valueHost2.getValue()).toBe(42);
            expect(valueHost3.getValue()).toBe(10); // static valueHost should not be changed by ModelReader
            // make sure there is no log message indicating that the static valueHost was processed
            let logger = valueHostsManager.services.loggerService as CapturingLogger;
            expect(logger.findMessage(`Reading model property '${ valueHost3.getName() }' for ValueHost '${ valueHost3.getName() }'.`, LoggingLevel.Debug)).toBeFalsy();
        });
        // same using CalcValueHost
        test('read with mixed ValueHost types including CalcValueHost. Expect the ModelReader to ignore non-FieldValueHosts and not throw an error.', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = valueHostsManager.addValueHost(<CalcValueHostConfig> {
                valueHostType: ValueHostType.Calc,
                name: 'Field3',
                initialValue: 10,
                dataType: LookupKey.Number,
                calcFn: (valueHost) => 20
            }, null);
            // our model will have properties for all 3 valueHosts, but the ModelReader should ignore the calc valueHost and not throw an error.
            let model = {};
            (model as any)[valueHost1.getName()] = 0;
            (model as any)[valueHost2.getName()] = 42;
            (model as any)[valueHost3.getName()] = 100;
            let reader = new PublicifyModelReader(valueHostsManager, model);
            reader.readFromModel();
            expect(valueHost1.getValue()).toBeNull();
            expect(valueHost2.getValue()).toBe(42);
            expect(valueHost3.getValue()).toBe(20);
            // make sure there is no log message indicating that the calc valueHost was processed
            let logger = valueHostsManager.services.loggerService as CapturingLogger;
            expect(logger.findMessage(`Reading model property '${ valueHost3.getName() }' for ValueHost '${ valueHost3.getName() }'.`, LoggingLevel.Debug)).toBeFalsy();
        });
    });
});