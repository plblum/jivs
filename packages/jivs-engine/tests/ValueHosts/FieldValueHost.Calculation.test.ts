import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { CalcValueHostConfig, ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { FieldValueHostConfig, IFieldValueHost } from "../../src/Interfaces/FieldValueHost";
import { LoggingLevel } from "../../src/Interfaces/LoggingService";
import { ValidationStatus } from "../../src/Interfaces/Validation";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";
import { TestingLoggingService } from "../../src/Support/TestingLoggingService";
import { AlwaysMatchesConditionType, NeverMatchesConditionType } from "../../src/Support/conditionsForTesting";
import { createJivsServicesForTesting } from "../../src/Support/createJivsServicesForTesting";
import { ValueHostsManager } from "../../src/Validation/ValueHostsManager";
import { finishPartialValidatorConfigs } from '../TestSupport/FieldValueHostTestFunctions';

// Tests for the calculation feature of FieldValueHost (FieldValueHostConfig.calculation).
// They use a real ValueHostsManager with three ValueHosts:
//   Source (Field, Number) -> Calc (CalcValueHost, doubles Source) -> Display (Field with calculation.sourceValueHostName='Calc')
// Setting Source's value notifies Display, which asks Calc for its result and applies it to itself.

function doubleSource(calc: ICalcValueHost, vhm: IValueHostsManager): SimpleValueType
{
    let value = vhm.getValueHost('Source')?.getValue();
    return value === undefined ? undefined : value * 2;
}

interface ICalcSetup
{
    vhm: ValueHostsManager;
    logger: TestingLoggingService;
    source: IFieldValueHost;
    display: IFieldValueHost;
    valueChanges: number;
    textChanges: number;
}

/**
 * @param dependencyValueHostNames - Pass null for no dependency list.
 */
function setupCalculatedField(
    dependencyValueHostNames: string[] | null = ['Source'],
    calcFn: (calc: ICalcValueHost, vhm: IValueHostsManager) => SimpleValueType = doubleSource,
    displayConfig?: Partial<FieldValueHostConfig>): ICalcSetup
{
    let services = createJivsServicesForTesting({ registerFormatters: true });
    let logger = new TestingLoggingService();
    logger.minLevel = LoggingLevel.Info;
    services.loggingService = logger;
    let configs: ValueHostConfig[] = [
        <FieldValueHostConfig>{
            name: 'Source', valueHostType: ValueHostType.Field,
            dataType: LookupKey.Number, validatorConfigs: []
        },
        <CalcValueHostConfig>{
            name: 'Calc', valueHostType: ValueHostType.Calc,
            calcFn: calcFn,             dependencyValueHostNames: dependencyValueHostNames ?? undefined
        },
        <FieldValueHostConfig>{
            name: 'Display', valueHostType: ValueHostType.Field,
            dataType: LookupKey.Number, formatterLookupKey: LookupKey.Number,
            calculation: { sourceValueHostName: 'Calc' },
            validatorConfigs: [],
            ...displayConfig
        }
    ];
    let vhm = new ValueHostsManager({ services: services, valueHostConfigs: configs });
    let result: ICalcSetup = {
        vhm: vhm,
        logger: logger,
        source: vhm.getFieldValueHost('Source')!,
        display: vhm.getFieldValueHost('Display')!,
        valueChanges: 0,
        textChanges: 0
    };
    vhm.onValueChanged = (vh) => { if (vh.getName() === 'Display') result.valueChanges++; };
    vhm.onTextValueChanged = (vh) => { if (vh.getName() === 'Display') result.textChanges++; };
    return result;
}

// calculate() is the single entry point that runs the CalcValueHost and applies its result.
describe('FieldValueHost.calculate', () =>
{
    test('Returns false and takes no action when the field has no calculation configured', () =>
    {
        let setup = setupCalculatedField();
        let testItem = setup.vhm.getFieldValueHost('Source')!;
        expect(testItem.isCalculated).toBe(false);
        expect(testItem.calculate({})).toBe(false);
        expect(testItem.getValue()).toBeUndefined();
    });
    test('Without valueHostIdThatChanged, applies the calculated value, formats it, and invokes both callbacks', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        expect(setup.display.calculate({})).toBe(true);
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.getTextValue()).toBe('10');
        expect(setup.display.isChanged).toBe(true);
        expect(setup.valueChanges).toBe(1);
        expect(setup.textChanges).toBe(1);
    });
    test('A calculated field is read-only, so external setValue, setTextValue and setValues take no action and log at Info level', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({});
        setup.display.setValue(99);
        setup.display.setTextValue('99');
        setup.display.setValues(99, '99');
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.getTextValue()).toBe('10');
        expect(setup.valueChanges).toBe(1);
        expect(setup.logger.findMessage('ValueHost "Display" read-only.', LoggingLevel.Info, null)).toBeTruthy();
    });
    test('valueHostIdThatChanged in the dependency list calculates', () =>
    {
        let setup = setupCalculatedField(['Source', 'Other']);
        setup.source.setValue(5, { suppressNotifications: true });
        expect(setup.display.calculate({}, 'Other')).toBe(true);
        expect(setup.display.getValue()).toBe(10);
    });
    test('valueHostIdThatChanged is matched case sensitively', () =>
    {
        let setup = setupCalculatedField(['Source']);
        setup.source.setValue(5, { suppressNotifications: true });
        expect(setup.display.calculate({}, 'source')).toBe(true);
        expect(setup.display.getValue()).toBeUndefined();
    });
    test('valueHostIdThatChanged not in the dependency list does not calculate but still returns true', () =>
    {
        let setup = setupCalculatedField(['Source']);
        setup.source.setValue(5, { suppressNotifications: true });
        expect(setup.display.calculate({}, 'Unrelated')).toBe(true);
        expect(setup.display.getValue()).toBeUndefined();
        expect(setup.valueChanges).toBe(0);
    });
    test('valueHostIdThatChanged with no dependency list does not calculate', () =>
    {
        let setup = setupCalculatedField(null);
        setup.source.setValue(5, { suppressNotifications: true });
        expect(setup.display.calculate({}, 'Source')).toBe(true);
        expect(setup.display.getValue()).toBeUndefined();
    });
    test('No dependency list but no valueHostIdThatChanged still calculates', () =>
    {
        let setup = setupCalculatedField(null);
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({});
        expect(setup.display.getValue()).toBe(10);
    });
    test('Same result again does not report a change', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({});
        setup.display.calculate({});
        expect(setup.valueChanges).toBe(1);
        expect(setup.textChanges).toBe(1);
    });
    test('A result of undefined replaces a previous native value and invokes onValueChanged', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({});
        setup.source.setValue(undefined, { suppressNotifications: true });
        setup.display.calculate({});
        expect(setup.display.getValue()).toBeUndefined();
        expect(setup.valueChanges).toBe(2);
    });
    test('Missing source CalcValueHost logs an Error, leaves the value unchanged, and returns true', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource,
            { calculation: { sourceValueHostName: 'Missing' } });
        expect(setup.display.calculate({})).toBe(true);
        expect(setup.display.getValue()).toBeUndefined();
        expect(setup.logger.findMessage("Source value host 'Missing' not found", LoggingLevel.Error, null)).toBeTruthy();
    });
    test('Source name that is not a CalcValueHost is reported as not found', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource,
            { calculation: { sourceValueHostName: 'Source' } });
        expect(setup.display.calculate({})).toBe(true);
        expect(setup.display.getValue()).toBeUndefined();
        expect(setup.logger.findMessage("Source value host 'Source' not found", LoggingLevel.Error, null)).toBeTruthy();
    });
    test('When disabled, calculation is abandoned with a Warn log, leaving the previous value', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({});
        setup.display.setEnabled(false);
        setup.source.setValue(7, { suppressNotifications: true });
        expect(setup.display.calculate({})).toBe(true);
        expect(setup.display.getValue()).toBe(10);
        expect(setup.logger.findMessage('ValueHost "Display" disabled.', LoggingLevel.Warn, null)).toBeTruthy();
    });
    test('When disabled, the calcFn is not invoked', () =>
    {
        let calls = 0;
        let setup = setupCalculatedField(['Source'], (calc, vhm) => { calls++; return 1; });
        setup.display.setEnabled(false);
        setup.display.calculate({});
        expect(calls).toBe(0);
    });
    test('When disabled and options.ensureEnabled=true, the field is enabled and calculated', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.setEnabled(false);
        setup.display.calculate({ ensureEnabled: true });
        expect(setup.display.isEnabled()).toBe(true);
        expect(setup.display.getValue()).toBe(10);
    });
    test('When disabled and options.overrideDisabled=true, the field is calculated and stays disabled', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.setEnabled(false);
        setup.display.calculate({ overrideDisabled: true });
        expect(setup.display.isEnabled()).toBe(false);
        expect(setup.display.getValue()).toBe(10);
        expect(setup.logger.findMessage('overrideDisabled', LoggingLevel.Info, null)).toBeTruthy();
    });
    test('options.skipValueChangedCallback=true suppresses the callbacks', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({ skipValueChangedCallback: true });
        expect(setup.display.getValue()).toBe(10);
        expect(setup.valueChanges).toBe(0);
        expect(setup.textChanges).toBe(0);
    });
    test('options.validate=true validates the calculated result', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource, {
            validatorConfigs: finishPartialValidatorConfigs([
                { conditionConfig: { conditionType: NeverMatchesConditionType } }])
        });
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({ validate: true });
        expect(setup.display.validationStatus).toBe(ValidationStatus.Invalid);
    });
    test('options.validate omitted leaves the field needing validation', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({});
        expect(setup.display.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });
    test('A calcFn that throws is logged by the CalcValueHost, the exception bubbles up, and the field value is unchanged', () =>
    {
        let setup = setupCalculatedField(['Source'], () => { throw new Error('boom'); });
        expect(() => setup.display.calculate({})).toThrow('boom');
        expect(setup.display.getValue()).toBeUndefined();
        expect(setup.logger.findMessage('boom', LoggingLevel.Error, null)).toBeTruthy();
    });
});

// When any ValueHost changes, ValueHostsManager notifies every validatable ValueHost.
// FieldValueHost overrides otherValueHostChangedNotification to calculate first, then validate.
describe('FieldValueHost.otherValueHostChangedNotification with a calculation', () =>
{
    test('Changing a dependency recalculates, even though validation never ran on the calculated field', () =>
    {
        let setup = setupCalculatedField();
        expect(setup.display.validationStatus).toBe(ValidationStatus.NotAttempted);
        setup.source.setValue(5);
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.getTextValue()).toBe('10');
        expect(setup.valueChanges).toBe(1);
        expect(setup.textChanges).toBe(1);
        setup.source.setValue(6);
        expect(setup.display.getValue()).toBe(12);
        expect(setup.valueChanges).toBe(2);
    });
    test('Changing a ValueHost that is not a dependency does not recalculate', () =>
    {
        let setup = setupCalculatedField(['Other']);
        setup.source.setValue(5);
        expect(setup.display.getValue()).toBeUndefined();
        expect(setup.valueChanges).toBe(0);
    });
    test('Changing the calculated field itself does not loop back into another calculation', () =>
    {
        let calls = 0;
        let setup = setupCalculatedField(['Source', 'Display'], (calc, vhm) =>
        {
            calls++;
            return vhm.getValueHost('Source')?.getValue();
        });
        setup.source.setValue(5);
        expect(setup.display.getValue()).toBe(5);
        expect(calls).toBe(1);
    });
    test('suppressNotifications=true on the source prevents the calculation', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        expect(setup.display.getValue()).toBeUndefined();
    });
    test('When the source validates with validate=true, the calculated field is calculated and validated using the new result', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource, {
            validatorConfigs: finishPartialValidatorConfigs([
                { conditionConfig: { conditionType: NeverMatchesConditionType } }])
        });
        // validation must have run once for the revalidate behavior to apply
        setup.display.validate();
        setup.source.setValue(5, { validate: true });
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.validationStatus).toBe(ValidationStatus.Invalid);
    });
    test('When the source changes without validate, a previously validated calculated field is recalculated and needs validation', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource, {
            validatorConfigs: finishPartialValidatorConfigs([
                { conditionConfig: { conditionType: AlwaysMatchesConditionType } }])
        });
        setup.display.validate();
        expect(setup.display.validationStatus).toBe(ValidationStatus.Valid);
        setup.source.setValue(5);
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });
    test('A disabled calculated field keeps its value when a dependency changes and logs a Warn', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5);
        setup.display.setEnabled(false);
        setup.source.setValue(6);
        expect(setup.display.getValue()).toBe(10);
        expect(setup.logger.findMessage('ValueHost "Display" disabled.', LoggingLevel.Warn, null)).toBeTruthy();
    });
    test('A calcFn that throws bubbles through the source setValue after the source stored its value', () =>
    {
        let setup = setupCalculatedField(['Source'], () => { throw new Error('boom'); });
        expect(() => setup.source.setValue(5)).toThrow('boom');
        expect(setup.source.getValue()).toBe(5);
        expect(setup.display.getValue()).toBeUndefined();
    });
});

// Additional scenarios: which source setters trigger, multiple dependencies and consumers,
// calculation chains, and formatter/config edge cases.
describe('FieldValueHost calculation: more scenarios', () =>
{
    function sumOfTwo(calc: ICalcValueHost, vhm: IValueHostsManager): SimpleValueType
    {
        let a = vhm.getValueHost('A')?.getValue();
        let b = vhm.getValueHost('B')?.getValue();
        return (a ?? 0) + (b ?? 0);
    }
    function numberField(name: string, extra?: Partial<FieldValueHostConfig>): FieldValueHostConfig
    {
        return <FieldValueHostConfig>{
            name: name, valueHostType: ValueHostType.Field, dataType: LookupKey.Number,
            formatterLookupKey: LookupKey.Number, validatorConfigs: [], ...extra
        };
    }
    function createManager(configs: ValueHostConfig[]): ValueHostsManager
    {
        let services = createJivsServicesForTesting({ registerFormatters: true });
        let logger = new TestingLoggingService();
        logger.minLevel = LoggingLevel.Info;
        services.loggingService = logger;
        return new ValueHostsManager({ services: services, valueHostConfigs: configs });
    }

    test('Source setValues, setValueToUndefined and setTextValue each notify; undefined recalculates to undefined', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValues(5, '5');
        expect(setup.display.getValue()).toBe(10);
        setup.source.setValueToUndefined();
        expect(setup.display.getValue()).toBeUndefined();
        // setTextValue without a parser leaves the native value undefined, so the result stays undefined
        setup.source.setTextValue('7');
        expect(setup.display.getValue()).toBeUndefined();
    });
    test('A calculation with two dependencies recalculates when either changes', () =>
    {
        let vhm = createManager([
            numberField('A'), numberField('B'),
            <CalcValueHostConfig>{ name: 'Sum', valueHostType: ValueHostType.Calc, calcFn: sumOfTwo, dependencyValueHostNames: ['A', 'B'] },
            numberField('Display', { calculation: { sourceValueHostName: 'Sum' } })
        ]);
        let display = vhm.getFieldValueHost('Display')!;
        vhm.getFieldValueHost('A')!.setValue(1);
        expect(display.getValue()).toBe(1);
        vhm.getFieldValueHost('B')!.setValue(2);
        expect(display.getValue()).toBe(3);
    });
    test('Two calculated fields using the same CalcValueHost both update', () =>
    {
        let vhm = createManager([
            numberField('Source'),
            <CalcValueHostConfig>{ name: 'Calc', valueHostType: ValueHostType.Calc, calcFn: doubleSource, dependencyValueHostNames: ['Source'] },
            numberField('Display1', { calculation: { sourceValueHostName: 'Calc' } }),
            numberField('Display2', { calculation: { sourceValueHostName: 'Calc' } })
        ]);
        vhm.getFieldValueHost('Source')!.setValue(4);
        expect(vhm.getFieldValueHost('Display1')!.getValue()).toBe(8);
        expect(vhm.getFieldValueHost('Display2')!.getValue()).toBe(8);
    });
    test('A calculation chain: a calc that depends on another calculated field updates after it', () =>
    {
        let addOne = (calc: ICalcValueHost, vhm: IValueHostsManager): SimpleValueType =>
        {
            let v = vhm.getValueHost('Display1')?.getValue();
            return v === undefined ? undefined : v + 1;
        };
        let vhm = createManager([
            numberField('Source'),
            <CalcValueHostConfig>{ name: 'Calc1', valueHostType: ValueHostType.Calc, calcFn: doubleSource, dependencyValueHostNames: ['Source'] },
            numberField('Display1', { calculation: { sourceValueHostName: 'Calc1' } }),
            <CalcValueHostConfig>{ name: 'Calc2', valueHostType: ValueHostType.Calc, calcFn: addOne, dependencyValueHostNames: ['Display1'] },
            numberField('Display2', { calculation: { sourceValueHostName: 'Calc2' } })
        ]);
        vhm.getFieldValueHost('Source')!.setValue(5);
        expect(vhm.getFieldValueHost('Display1')!.getValue()).toBe(10);
        expect(vhm.getFieldValueHost('Display2')!.getValue()).toBe(11);
    });
    test('options.disableFormatter=true applies the native value without changing the text', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({ disableFormatter: true });
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.getTextValue()).toBeUndefined();
        expect(setup.textChanges).toBe(0);
    });
    test('Without a formatter the native value changes and no text notification occurs', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource, { formatterLookupKey: null, dataType: LookupKey.Number });
        setup.source.setValue(5);
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.getTextValue()).toBeUndefined();
        expect(setup.textChanges).toBe(0);
        expect(setup.valueChanges).toBe(1);
    });
    test('calculation: null is the same as no calculation', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource, { calculation: null });
        expect(setup.display.isCalculated).toBe(false);
        expect(setup.display.readOnly).toBe(false);
        expect(setup.display.calculate({})).toBe(false);
        setup.source.setValue(5);
        expect(setup.display.getValue()).toBeUndefined();
        setup.display.setValue(3);
        expect(setup.display.getValue()).toBe(3);
    });
    test('calculation with an empty sourceValueHostName is not calculated', () =>
    {
        let setup = setupCalculatedField(['Source'], doubleSource, { calculation: { sourceValueHostName: '' } });
        expect(setup.display.isCalculated).toBe(false);
        expect(setup.display.calculate({})).toBe(false);
    });
    test('options.reset=true clears validation state and change tracking after the calculation', () =>
    {
        let setup = setupCalculatedField();
        setup.source.setValue(5, { suppressNotifications: true });
        setup.display.calculate({ reset: true });
        expect(setup.display.getValue()).toBe(10);
        expect(setup.display.isChanged).toBe(false);
    });
    test('The onValueChanged callback receives the field and its previous native value', () =>
    {
        let setup = setupCalculatedField();
        let displayOldValues: any[] = [];
        setup.vhm.onValueChanged = (vh, oldValue) =>
        {
            if (vh.getName() === 'Display')
                displayOldValues.push(oldValue);
        };
        setup.source.setValue(5);
        setup.source.setValue(6);
        expect(displayOldValues).toEqual([undefined, 10]);
    });
    test('A calculation can be applied again after an exception once the calcFn works', () =>
    {
        let fail = true;
        let setup = setupCalculatedField(['Source'], (calc, vhm) => { if (fail) throw new Error('boom'); return 3; });
        expect(() => setup.display.calculate({})).toThrow('boom');
        fail = false;
        setup.display.calculate({});
        expect(setup.display.getValue()).toBe(3);
    });
});
