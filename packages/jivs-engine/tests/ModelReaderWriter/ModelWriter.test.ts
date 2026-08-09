import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { CalcValueHostConfig } from '../../src/Interfaces/CalcValueHost';
import { DataCleanupResolution, DataCleanupRule } from '../../src/Interfaces/DataCleanupService';
import { IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IJivsServices } from '../../src/Interfaces/JivsServices';
import { LoggingLevel } from '../../src/Interfaces/LoggerService';

import { StaticValueHostConfig } from '../../src/Interfaces/StaticValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { IValueHostsManager } from '../../src/Interfaces/ValueHostsManager';
import { ModelWriter } from '../../src/ModelReaderWriter/ModelWriter_classes';
import { DataCleanupService } from '../../src/Services/DataCleanupService';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { finishPartialFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
import { MockJivsServices, MockValueHostsManager } from '../TestSupport/mocks';

/**
 * This class is used to expose the protected members of ModelWriter for testing purposes.
 */
class PublicifyModelWriter extends ModelWriter<object>
{
    constructor(valueHostsManager: IValueHostsManager, model: object
    )
    {
        super(valueHostsManager, model);
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

    public get publicify_logger(): any
    {
        return super.logger;
    }


    // create 'publicify_name' versions of protected methods for testing
    public publicify_adjustValueByRule(
        modelPropertyValue: any, rule: DataCleanupRule, valueHost: IFieldValueHost): DataCleanupResolution
{
        return this.adjustValueByRule(modelPropertyValue, rule, valueHost);
    }

    public publicify_getRule(valueHost: IFieldValueHost): DataCleanupRule | undefined
    {
        return this.getRule(valueHost);
    }

    public publicify_setValueIntoModel(modelPropertyName: string, value: any, valueHost: IFieldValueHost): void
    {
        this.setValueIntoModel(modelPropertyName, value, valueHost);
    }
}

function setup(model: object, propertyName: string,
    whenRule: string, thenRule: string):
    {
        services: IJivsServices, logger: CapturingLogger,
        writer: PublicifyModelWriter,
        valueHostsManager: IValueHostsManager,
        valueHost: IFieldValueHost;
    }
{
    let services = new MockJivsServices(false, false);
    let logger = services.loggerService as CapturingLogger;
    logger.minLevel = LoggingLevel.Debug;
    services.dataCleanupService = new DataCleanupService(); // supplies the standard rules for when and then
    services.dataCleanupService.services = services;

    let valueHostsManager = new MockValueHostsManager(services);
    let valueHost = valueHostsManager.addValueHost(
        finishPartialFieldValueHostConfig({
            propertyName: propertyName,
            modelWriterRule: { when: whenRule, then: thenRule },
        }, 1), null) as IFieldValueHost;
    let writer = new PublicifyModelWriter(valueHostsManager, model);
    return { services, logger, writer, valueHostsManager, valueHost };
}

/**
 * Creates a FieldValueHost with a modelWriterRule and adds it to the valueHostsManager.
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
            modelWriterRule: {
                when: when,
                then: then
            },
        }, fieldIndex), null);
    return valueHost as IFieldValueHost;
}

describe('ModelWriter', () =>
{
    // mostly a concrete tester of ModelWriterBase, but also tests the ModelWriter class itself
    // Tests are setup similarly to FieldValueHost.test.ts and consume functions
    // from TestSupport/FieldValueHostTestFunctions.ts.
    // They can use the MockJivsServices and MockValueHostsManager

    describe('constructor', () =>
    {
        test('Create with valid parameters. Confirm properties are set correctly', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);

            let writer = new PublicifyModelWriter(valueHostsManager, model);
            expect(writer.publicify_valueHostsManager).toBe(valueHostsManager);
            expect(writer.publicify_model).toBe(model);
            expect(writer.publicify_services).toBe(services);
            expect(writer.publicify_logger).toBeDefined();
        });

        test('Create with null valueHostsManager. Expect error', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let valueHostsManager = null as unknown as IValueHostsManager;
            expect(() => new PublicifyModelWriter(valueHostsManager, model)).toThrow(/valueHostsManager/);

        });
        test('Create with null model. Expect error', () =>
        {
            let model = null as unknown as object;
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);
            expect(() => new PublicifyModelWriter(valueHostsManager, model)).toThrow(/model/);
        });
        test('confirm logger is created and has correct feature name', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            expect(writer.publicify_logger).toBeDefined();
            expect(writer.publicify_logger.feature).toBe('PublicifyModelWriter');
        });
        test('confirm 2 calls to logger return the same instance', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            let valueHostsManager = new MockValueHostsManager(services);
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            let logger1 = writer.publicify_logger;
            let logger2 = writer.publicify_logger;
            expect(logger1).toBe(logger2);
        });
    });

    describe('adjustValueByRule via publicify_', () =>
    {
        // most of the work is in DataCleanupService with full tests.
        // This just performs a few tests to confirm the ModelWriter is using the service correctly.
        // No logging is reviewed here.

        test('when lookup in factory fails:  when=unknown,then=known. Expect skip true and logged error', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHost, writer } = setup(model, 'prop1',
                'unknown', 'unassigned');

            let modelWriterRule = valueHost.getModelWriterRule();
            expect(modelWriterRule).toBeDefined();
            let result = writer.publicify_adjustValueByRule('value1', modelWriterRule!, valueHost);
            expect(result.skip).toBe(true);
            expect(result.value).toBeUndefined();
        });
        test('then lookup in factory fails: when=known, then=unknown. Expect skip true', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, writer } = setup(model, 'prop1', 'nullorundefined', 'unknown');
            let modelWriterRule = valueHost.getModelWriterRule();
            expect(modelWriterRule).toBeDefined();
            let result = writer.publicify_adjustValueByRule(model.prop1, modelWriterRule!, valueHost);
            expect(result.skip).toBe(true);
            expect(result.value).toBeUndefined();
        });
        // when function returns false, indicating the value is valid and does not need to be replaced. Expect skip true and no value.
        test('when function returns false, indicating the value is valid and does not need to be replaced. Expect skip false and value=originalValue.', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHost, writer } = setup(model, 'prop1', 'undefined', 'unassigned');
            let modelWriterRule = valueHost.getModelWriterRule();
            expect(modelWriterRule).toBeDefined();
            let result = writer.publicify_adjustValueByRule(model.prop1, modelWriterRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBe(model.prop1);
        });
        // the rest are for then rule
        test('when tests for null and finds null, then=null. Expect skip=false, value=null.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, writer } = setup(model, 'prop1', 'nullorundefined', 'null');
            let modelWriterRule = valueHost.getModelWriterRule();
            expect(modelWriterRule).toBeDefined();
            let result = writer.publicify_adjustValueByRule(model.prop1, modelWriterRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBe(null);
        });
        test('when tests for null and finds null, then=unassigned. Expect skip=false, value=undefined.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, writer } = setup(model, 'prop1', 'nullorundefined', 'unassigned');
            let modelWriterRule = valueHost.getModelWriterRule();
            expect(modelWriterRule).toBeDefined();
            let result = writer.publicify_adjustValueByRule(model.prop1, modelWriterRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBeUndefined();
        });
        test('when tests for null and finds null, then=keep. Expect skip=false, value=null.', () =>
        {
            let model = { prop1: null, prop2: 42 };
            let { valueHost, writer } = setup(model, 'prop1', 'nullorundefined', 'keep');
            let modelWriterRule = valueHost.getModelWriterRule();
            expect(modelWriterRule).toBeDefined();
            let result = writer.publicify_adjustValueByRule(model.prop1, modelWriterRule!, valueHost);
            expect(result.skip).toBe(false);
            expect(result.value).toBeNull();
        });
    });

    describe('getRule via publicify_', () =>
    {
        test('returns the rule for the given valueHost', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHostsManager, logger, valueHost, writer } = setup(model, 'prop1', 'undefined', 'unassigned');
            let rule = writer.publicify_getRule(valueHost);
            expect(rule).toBe(valueHost.getModelWriterRule());
        });
        test('returns undefined for a valueHost with no rule', () =>
        {
            let model = { prop1: 'value1', prop2: 42 };
            let services = new MockJivsServices(false, false);
            services.dataCleanupService = new DataCleanupService(); // supplies the standard rules for when and then
            let valueHostsManager = new MockValueHostsManager(services);
            // not modelWriterRule is set on this valueHost
            let valueHostNoRule = valueHostsManager.addValueHost(finishPartialFieldValueHostConfig({}), null) as IFieldValueHost;
            let writer = new PublicifyModelWriter(valueHostsManager, model);

            let rule = writer.publicify_getRule(valueHostNoRule);
            expect(rule).toBeUndefined();
        });
    });
    describe('setValueIntoModel via publicify_', () =>
    {
        test('sets the value into the model as a top-level property', () => 
        {
            let model = { prop1: 'value1', prop2: 42 };
            let { valueHostsManager, logger, valueHost, writer } = setup(model, 'prop1', 'undefined', 'unassigned');
            let value = 'newValue';
            let options = { disableFormatter: false, skipValueChangedCallback: false, validate: false, reset: true };
            writer.publicify_setValueIntoModel('prop1', value, valueHost);
            expect(model.prop1).toBe(value);
        });
        // as a child property
        test('sets the value into the model as a child property', () =>
        {
            let model = { prop1: { childProp: 'childValue' }, prop2: 42 };
            let { valueHostsManager, logger, valueHost, writer } = setup(model, 'prop1.childProp', 'undefined', 'unassigned');
            let value = 'newChildValue';
            writer.publicify_setValueIntoModel('prop1.childProp', value, valueHost);
            expect(model.prop1.childProp).toBe(value);
        });
        // an an array at the top level
        test('sets the value into the model as an array element where each array element has an object with a property of "ChildName"', () =>
        {
            let model = { prop1: [{ ChildName: 'childValue1' }, { ChildName: 'childValue2' }], prop2: 42 };
            let { valueHostsManager, logger, valueHost, writer } = setup(model, 'prop1[1].ChildName', 'undefined', 'unassigned');
            let value = 'newChildValue2';
            writer.publicify_setValueIntoModel('prop1[1].ChildName', value, valueHost);
            expect(model.prop1[1].ChildName).toBe(value);
        });

        // plain object will add a property that does not exist
        test('sets the value into the model as a new property on a plain object', () =>
        {
            let model = { prop1: { existingProp: 'existingValue' }, prop2: 42 };
            let { valueHostsManager, logger, valueHost, writer } = setup(model, 'prop1.newProp', 'undefined', 'unassigned');
            let value = 'newValue';
            writer.publicify_setValueIntoModel('prop1.newProp', value, valueHost);
            expect((model.prop1 as any)['newProp']).toBe(value);
            logger.findMessage(`Specified property 'newProp' does not exist in the model. It will be created.`, LoggingLevel.Info);
        });

        // class instance will not add a property that does not exist and logs an error
        test('sets the value into the model as a new property on a class instance. Expect error logged and property not added.', () =>
        {
            class MyClass
            {
                existingProp: string = 'existingValue';
            }
            let model = new MyClass();
            let { valueHostsManager, logger, valueHost, writer } = setup(model, 'newProp', 'undefined', 'unassigned');
            let value = 'newValue';
            writer.publicify_setValueIntoModel('newProp', value, valueHost);
            expect((model as any)['newProp']).toBeUndefined();
            expect(logger.findMessage(`Specified property 'newProp' does not exist in the model. It will not be set.`, LoggingLevel.Error)).toBeTruthy();
        });
    });

    describe('write with limited tests around the functions already tested above', () =>
    {
        test('modelWriterRule adjusts the value. Expect the adjusted value to be set into the model', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { logger, valueHost, writer } = setup(model, 'prop1', 'zero', 'null');
            valueHost.setValue(0);
            writer.writeToModel();
            expect(model.prop1).toBeNull();
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost.getName() }' to model property 'prop1'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value was assigned from ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`DataCleanupService Then rule 'null' has adjusted the source value.`, LoggingLevel.Debug)).toBeTruthy();

        });

        // same but specifically calling writeToProperty with the ValueHost for prop1
        test('modelWriterRule adjusts the value. Expect the adjusted value to be set into the model using writeToProperty', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { logger, valueHost, writer } = setup(model, 'prop1', 'zero', 'null');
            valueHost.setValue(0);
            writer.writeToProperty(valueHost);
            expect(model.prop1).toBeNull();
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost.getName() }' to model property 'prop1'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value was assigned from ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`DataCleanupService Then rule 'null' has adjusted the source value.`, LoggingLevel.Debug)).toBeTruthy();
        });
        // same but passes the model property name explicitly to writeToProperty
        test('modelWriterRule adjusts the value. Expect the adjusted value to be set into the model using writeToProperty with explicit model property name', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { logger, valueHost, writer } = setup(model, 'prop1', 'zero', 'null');
            valueHost.setValue(0);
            writer.writeToProperty(valueHost, 'prop1');
            expect(model.prop1).toBeNull();
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost.getName() }' to model property 'prop1'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value was assigned from ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`DataCleanupService Then rule 'null' has adjusted the source value.`, LoggingLevel.Debug)).toBeTruthy();
        });

        test('modelWriterRule does not adjust the value. Expect the original value to be set into the model', () =>
        {
            let model = { prop1: 5, prop2: 42 };
            let { logger, valueHost, writer } = setup(model, 'prop1', 'zero', 'null');
            valueHost.setValue(5);
            writer.writeToModel();
            expect(model.prop1).toBe(5);
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost.getName() }' to model property 'prop1'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value was assigned from ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`DataCleanupService When rule 'zero' has indicated the original value will be retained.`, LoggingLevel.Debug)).toBeTruthy();
        });

        test('modelWriterRule that has a rule that adjusts the value to unassigned. Expect the model property  to be set to undefined.', () =>
        {
            let model = { prop1: 0, prop2: 42 };
            let { logger, valueHost, writer } = setup(model, 'prop1', 'zero', 'unassigned');
            valueHost.setValue(0);
            writer.writeToModel();
            expect(model.prop1).toBeUndefined();
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost.getName() }' to model property 'prop1'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value was assigned from ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`DataCleanupService Then rule 'unassigned' has adjusted the source value.`, LoggingLevel.Debug)).toBeTruthy();
        });
        test('modelWriterRule that has a rule that adjusts the value to keep. Expect the model property to be set to null.', () =>
        {
            let model = { prop1: 1, prop2: 42 };
            let { logger, valueHost, writer } = setup(model, 'prop1', 'nullorundefined', 'keep');
            valueHost.setValue(null);
            writer.writeToModel();
            expect(model.prop1).toBeNull();
            logger.toConsole();
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost.getName() }' to model property 'prop1'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value was assigned from ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Info)).toBeTruthy();
        });
        // property not included on plain object model but comes from ValueHost gets added to the model
        test('ValueHost.propertyName specifies a property not found on a plain object model. Expect the model property to be set anyway.', () =>
        {
            let model = { prop2: 42 };
            let { valueHostsManager, logger, valueHost, writer } = setup(model, 'prop1', 'zero', 'null');
            valueHost.setValue(0);
            writer.writeToModel();
            expect((model as any).prop1).toBeNull();
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost.getName() }' to model property 'prop1'.`, LoggingLevel.Debug)).toBeTruthy();
            expect(logger.findMessage(`Model property 'prop1' value was assigned from ValueHost '${ valueHost.getName() }'.`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`DataCleanupService Then rule 'null' has adjusted the source value.`, LoggingLevel.Debug)).toBeTruthy();
        });

        // ValueHosts for all properties on the model and no adjustments (best happy path test)
        // Will require creating all the valueHosts for the model properties and adding them to the valueHostsManager.
        test('write with valueHosts for all properties on the model and no adjustments. Expect the model properties to be set to the model values.', () =>
        {
            // using matching name and propertyname, Field1, Field2, etc.
            let services = new MockJivsServices(false, false);
            services.dataCleanupService = new DataCleanupService(); // supplies the standard rules for when and then
            services.dataCleanupService.services = services;
            let logger = services.loggerService as CapturingLogger;
            logger.minLevel = LoggingLevel.Debug;
            let valueHostsManager = new MockValueHostsManager(services);
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'undefined', 'unassigned', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'undefined', 'unassigned', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'undefined', 'unassigned', 3);
            let propName1 = valueHost1.getPropertyName();
            let propName2 = valueHost2.getPropertyName();
            let propName3 = valueHost3.getPropertyName();
            valueHost1.setValue('value1-changed');
            valueHost2.setValue(2); 
            valueHost3.setValue(false);
            let model = {};
            (model as any)[propName1] = 'value1';
            (model as any)[propName2] = 42;
            (model as any)[propName3] = true;
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            writer.writeToModel();
            expect((model as any)[propName1]).toBe('value1-changed');
            expect((model as any)[propName2]).toBe(2);
            expect((model as any)[propName3]).toBe(false);
        });
        // tests with multiple valuehosts where one source value is replaced by null
        test('write with multiple valueHosts where first has rule that applies and adjusts', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 3);
            let propName1 = valueHost1.getPropertyName();
            let propName2 = valueHost2.getPropertyName();
            let propName3 = valueHost3.getPropertyName();
            valueHost1.setValue(0); // this will be adjusted to null
            valueHost2.setValue(4);
            valueHost3.setValue('hello-changed');
            let model = {};
            (model as any)[propName1] = 0; // this will be adjusted to null
            (model as any)[propName2] = 42;
            (model as any)[propName3] = 'hello';
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            writer.writeToModel();
            expect((model as any)[propName1]).toBeNull();
            expect((model as any)[propName2]).toBe(4);
            expect((model as any)[propName3]).toBe('hello-changed');
        });
        // same but last of the 3 valuehosts has a rule that applies and adjusts
        test('write with multiple valueHosts where last has rule that applies and adjusts', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 3);
            let propName1 = valueHost1.getPropertyName();
            let propName2 = valueHost2.getPropertyName();
            let propName3 = valueHost3.getPropertyName();
            valueHost1.setValue('value1-changed');
            valueHost2.setValue(4);
            valueHost3.setValue(0);  // this will be adjusted to null
            let model = {};
            (model as any)[propName1] = 'value1';
            (model as any)[propName2] = 42;
            (model as any)[propName3] = 0;  // this will be adjusted to null
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            writer.writeToModel();
            expect((model as any)[propName1]).toBe('value1-changed');
            expect((model as any)[propName2]).toBe(4);
            expect((model as any)[propName3]).toBeNull();
        });
        test('write with multiple valueHosts where one has a model property that does not exist. Since the model is a plain object, it will be assigned the missing property with the correct value', () =>
        {
            let valueHostsManager = new MockValueHostsManager(new MockJivsServices(false, false));
            let valueHost1 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 1);
            let valueHost2 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 2);
            let valueHost3 = createFieldValueHostWithRule(valueHostsManager, 'zero', 'null', 3);
            let logger = valueHostsManager.services.loggerService as CapturingLogger;
            logger.minLevel = LoggingLevel.Debug;
            let propName1 = valueHost1.getPropertyName();
            let propName2 = valueHost2.getPropertyName();
            let propName3 = valueHost3.getPropertyName();
            valueHost1.setValue('value1-changed');
            valueHost2.setValue(4);
            valueHost3.setValue('hello-changed');
            let model = {};
            (model as any)[propName1] = 'value1';
            (model as any)[propName2] = 42;
            // valueHost3 does not have a corresponding property in the model
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            writer.writeToModel();
            expect((model as any)[propName1]).toBe('value1-changed');
            expect((model as any)[propName2]).toBe(4);
            expect((model as any)[propName3]).toBe('hello-changed');
            // see logs indicating the final result of all 3
            expect(logger.findMessage(`Model property '${ propName1 }' value was assigned from ValueHost`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`Model property '${ propName2 }' value was assigned from ValueHost`, LoggingLevel.Info)).toBeTruthy();
            expect(logger.findMessage(`Specified property '${ propName3 }' does not exist in the model. It will be created.`, LoggingLevel.Info)).toBeTruthy();
        });
        // special case: Mixed ValueHost types. Only FieldValueHosts are supposed to be used with ModelWriter, but  we'll test that the ModelWriter ignores non-FieldValueHosts and does not throw an error.
        test('write with mixed ValueHost types including StaticValueHost. Expect the ModelWriter to ignore non-FieldValueHosts and not throw an error.', () =>
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
            // our model will have properties for all 3 valueHosts, but the ModelWriter should ignore the static valueHost and not throw an error.
            let propName1 = valueHost1.getPropertyName();
            let propName2 = valueHost2.getPropertyName();
            let propName3 = valueHost3.getName(); // valueHost3 does not have getPropertyName
            valueHost1.setValue(10);
            valueHost2.setValue(20);
            let model = {};
            (model as any)[propName1] = 0;
            (model as any)[propName2] = 42;
            (model as any)[propName3] = 100;
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            writer.writeToModel();
            expect((model as any)[propName1]).toBe(10);
            expect((model as any)[propName2]).toBe(20);
            expect((model as any)[propName3]).toBe(100);    // not changed to 10 like the static valueHost would have done if it was processed by ModelWriter
            
            // static valueHost should not be changed by ModelWriter
            // make sure there is no log message indicating that the static valueHost was processed
            let logger = valueHostsManager.services.loggerService as CapturingLogger;
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost3.getName() }' to model property '${ propName3 }'.`, LoggingLevel.Debug)).toBeFalsy();
        });
        // same using CalcValueHost
        test('write with mixed ValueHost types including CalcValueHost. Expect the ModelWriter to ignore non-FieldValueHosts and not throw an error.', () =>
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
            let propName1 = valueHost1.getPropertyName();
            let propName2 = valueHost2.getPropertyName();
            let propName3 = valueHost3.getName(); // valueHost3 does not have getPropertyName
            valueHost1.setValue(10);
            valueHost2.setValue(20);

            // our model will have properties for all 3 valueHosts, but the ModelWriter should ignore the calc valueHost and not throw an error.
            let model = {};
            (model as any)[propName1] = 0;
            (model as any)[propName2] = 42;
            (model as any)[propName3] = 100;
            let writer = new PublicifyModelWriter(valueHostsManager, model);
            writer.writeToModel();
            expect((model as any)[propName1]).toBe(10);
            expect((model as any)[propName2]).toBe(20);
            expect((model as any)[propName3]).toBe(100);    // not changed to 20 like the calc valueHost would have done if it was processed by ModelWriter
            let logger = valueHostsManager.services.loggerService as CapturingLogger;
            expect(logger.findMessage(`Preparing to move value from ValueHost '${ valueHost3.getName() }' to model property '${ propName3 }'.`, LoggingLevel.Debug)).toBeFalsy();

        });
    });
});