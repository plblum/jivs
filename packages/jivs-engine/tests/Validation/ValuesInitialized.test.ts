import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { CalcValueHostConfig, ICalcValueHost } from "../../src/Interfaces/CalcValueHost";
import { FieldValueHostConfig } from "../../src/Interfaces/FieldValueHost";
import { LoggingLevel } from "../../src/Interfaces/LoggingService";
import { ValidateOptions, ValidationState } from "../../src/Interfaces/Validation";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { IValueHostsManager } from "../../src/Interfaces/ValueHostsManager";
import { SimpleValueType } from "../../src/Interfaces/DataTypeConverterService";
import { ModelReader } from "../../src/ReaderWriter/Reader_classes";
import { ValueAdapterService } from "../../src/Services/ValueAdapterService";
import { TestingLoggingService } from "../../src/Support/TestingLoggingService";
import { createJivsServicesForTesting } from "../../src/Support/createJivsServicesForTesting";
import { ValueHostName } from "../../src/DataTypes/BasicTypes";
import { ValueHostsManager } from "../../src/Validation/ValueHostsManager";

// Tests for ValueHostsManager.valuesInitialized() and for readers using it.
// ValueHosts: Source (Field) -> Calc (doubles Source) -> Display (Field whose calculation.sourceValueHostName='Calc').

/**
 * Records the calls that valuesInitialized() should make or avoid, in order.
 */
class RecordingValueHostsManager extends ValueHostsManager
{
    public events: Array<string> = [];
    public displayValueDuringValidate: any;
    public validateOptions: ValidateOptions | undefined;

    public override validate(options?: ValidateOptions): ValidationState
    {
        this.events.push('validate');
        this.validateOptions = options;
        this.displayValueDuringValidate = this.getValueHost('Display')?.getValue();
        return super.validate(options);
    }
    public override notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void
    {
        this.events.push('notify:' + valueHostIdThatChanged);
        super.notifyOtherValueHostsOfValueChange(valueHostIdThatChanged, revalidate);
    }
}

function doubleSource(calc: ICalcValueHost, vhm: IValueHostsManager): SimpleValueType
{
    let value = vhm.getValueHost('Source')?.getValue();
    return value === undefined ? undefined : value * 2;
}

function setupManager(): { vhm: RecordingValueHostsManager, logger: TestingLoggingService, displayValueChanges: number[] }
{
    let services = createJivsServicesForTesting({ registerFormatters: true });
    let logger = new TestingLoggingService();
    logger.minLevel = LoggingLevel.Info;
    services.loggingService = logger;
    services.valueAdapterService = new ValueAdapterService();
    let configs: ValueHostConfig[] = [
        <FieldValueHostConfig>{
            name: 'Source', valueHostType: ValueHostType.Field,
            dataType: LookupKey.Number, validatorConfigs: []
        },
        <CalcValueHostConfig>{
            name: 'Calc', valueHostType: ValueHostType.Calc,
            calcFn: doubleSource, dependencyValueHostNames: ['Source']
        },
        <FieldValueHostConfig>{
            name: 'Display', valueHostType: ValueHostType.Field,
            dataType: LookupKey.Number, formatterLookupKey: LookupKey.Number,
            calculation: { sourceValueHostName: 'Calc' }, validatorConfigs: []
        }
    ];
    let vhm = new RecordingValueHostsManager({ services: services, valueHostConfigs: configs });
    let displayValueChanges: number[] = [];
    vhm.onValueChanged = (vh) => { if (vh.getName() === 'Display') displayValueChanges.push(vh.getValue()); };
    return { vhm, logger, displayValueChanges };
}

// valuesInitialized() is the wrap-up after initial values are loaded:
// calculate every calculated field, then validate preliminarily.
describe('ValueHostsManager.valuesInitialized', () =>
{
    test('Calculates fields with a calculation, using the values already loaded', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        let display = setup.vhm.getFieldValueHost('Display')!;
        expect(display.getValue()).toBe(10);
        expect(display.getTextValue()).toBe('10');
        expect(setup.displayValueChanges).toEqual([10]);
    });
    test('Calculation happens before preliminary validation', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        expect(setup.vhm.displayValueDuringValidate).toBe(10);
        expect(setup.vhm.validateOptions).toEqual({ preliminary: true });
    });
    test('Calculation does not notify other ValueHosts of its change', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        expect(setup.vhm.events).toEqual(['validate']);
    });
    test('The calculated field is not considered changed (reset=true)', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        expect(setup.vhm.getFieldValueHost('Display')!.isChanged).toBe(false);
    });
    test('Does not change fields without a calculation', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        expect(setup.vhm.getFieldValueHost('Source')!.getValue()).toBe(5);
    });
    test('When the calculation result is undefined, the field stays undefined without error', () =>
    {
        let setup = setupManager();
        expect(() => setup.vhm.valuesInitialized()).not.toThrow();
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBeUndefined();
    });
    test('A disabled calculated field is not calculated, with a Warn log', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.getFieldValueHost('Display')!.setEnabled(false);
        setup.vhm.valuesInitialized();
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBeUndefined();
        expect(setup.logger.findMessage('ValueHost "Display" disabled.', LoggingLevel.Warn, null)).toBeTruthy();
    });
    test('Without calculated fields, still performs preliminary validation', () =>
    {
        let services = createJivsServicesForTesting();
        let vhm = new RecordingValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                name: 'Source', valueHostType: ValueHostType.Field,
                dataType: LookupKey.Number, validatorConfigs: []
            }]
        });
        vhm.valuesInitialized();
        expect(vhm.events).toEqual(['validate']);
        expect(vhm.validateOptions).toEqual({ preliminary: true });
    });
    // valuesInitialized calculates in the order the ValueHosts were configured and does not notify,
    // so a calculated field that consumes another calculated field depends on being configured after it.
    function createChain(displayOrder: 'consumerLast' | 'consumerFirst'): RecordingValueHostsManager
    {
        let services = createJivsServicesForTesting({ registerFormatters: true });
        let addOne = (calc: ICalcValueHost, vhm: IValueHostsManager): SimpleValueType =>
        {
            let v = vhm.getValueHost('Display1')?.getValue();
            return v === undefined ? undefined : v + 1;
        };
        let display1 = <FieldValueHostConfig>{
            name: 'Display1', valueHostType: ValueHostType.Field, dataType: LookupKey.Number,
            formatterLookupKey: LookupKey.Number, calculation: { sourceValueHostName: 'Calc' }, validatorConfigs: []
        };
        let display2 = <FieldValueHostConfig>{
            name: 'Display2', valueHostType: ValueHostType.Field, dataType: LookupKey.Number,
            formatterLookupKey: LookupKey.Number, calculation: { sourceValueHostName: 'Calc2' }, validatorConfigs: []
        };
        let configs: ValueHostConfig[] = [
            <FieldValueHostConfig>{ name: 'Source', valueHostType: ValueHostType.Field, dataType: LookupKey.Number, validatorConfigs: [] },
            <CalcValueHostConfig>{ name: 'Calc', valueHostType: ValueHostType.Calc, calcFn: doubleSource, dependencyValueHostNames: ['Source'] },
            <CalcValueHostConfig>{ name: 'Calc2', valueHostType: ValueHostType.Calc, calcFn: addOne, dependencyValueHostNames: ['Display1'] },
            ...(displayOrder === 'consumerLast' ? [display1, display2] : [display2, display1])
        ];
        return new RecordingValueHostsManager({ services: services, valueHostConfigs: configs });
    }
    test('A chain of calculated fields configured in dependency order is fully calculated', () =>
    {
        let vhm = createChain('consumerLast');
        vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        vhm.valuesInitialized();
        expect(vhm.getFieldValueHost('Display1')!.getValue()).toBe(10);
        expect(vhm.getFieldValueHost('Display2')!.getValue()).toBe(11);
    });
    test('A chain configured with the consumer first reports the ordering gap in the initial result', () =>
    {
        let vhm = createChain('consumerFirst');
        vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        vhm.valuesInitialized();
        expect(vhm.getFieldValueHost('Display1')!.getValue()).toBe(10);
        // Display2 was calculated before Display1 had its result
        expect(vhm.getFieldValueHost('Display2')!.getValue()).toBeUndefined();
    });
    test('Calling valuesInitialized twice gives the same result and but each call triggers value change callbacks', () =>
    {// internally valuesInitialized uses setValue({reset: true}) which forces value change callbacks even if the value hasn't actually changed
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        setup.vhm.valuesInitialized();
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBe(10);
        expect(setup.displayValueChanges).toEqual([10, 10]);
    });
    test('After valuesInitialized, a normal change to the source recalculates and notifies', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        setup.vhm.getFieldValueHost('Source')!.setValue(7);
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBe(14);
        expect(setup.displayValueChanges).toEqual([10, 14]);
        expect(setup.vhm.events).toContain('notify:Source');
    });
    test('Calling valuesInitialized after the source changes picks up the new value', () =>
    {
        let setup = setupManager();
        setup.vhm.getFieldValueHost('Source')!.setValue(5, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        setup.vhm.getFieldValueHost('Source')!.setValue(8, { suppressNotifications: true });
        setup.vhm.valuesInitialized();
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBe(16);
    });
});

// ReaderBase loads values with suppressNotifications=true and then calls valuesInitialized()
// so calculated fields get their initial result once, after all sources are loaded.
describe('ReaderBase with calculated fields', () =>
{
    test('read() loads sources without notifications, then valuesInitialized() calculates once', () =>
    {
        let setup = setupManager();
        let reader = new ModelReader(setup.vhm, { Source: 5 });
        reader.read();
        let display = setup.vhm.getFieldValueHost('Display')!;
        expect(setup.vhm.getFieldValueHost('Source')!.getValue()).toBe(5);
        expect(display.getValue()).toBe(10);
        expect(setup.displayValueChanges).toEqual([10]);
        expect(setup.vhm.events).toEqual(['validate']);
    });
    test('A model property matching the calculated field is rejected by the read-only field, logged at Info, and the calculated result wins', () =>
    {
        let setup = setupManager();
        let reader = new ModelReader(setup.vhm, { Source: 5, Display: 99 });
        reader.read();
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBe(10);
        expect(setup.logger.findMessage('ValueHost "Display" read-only.', LoggingLevel.Info, null)).toBeTruthy();
    });
    test('options.initializingValues=false skips valuesInitialized(), so no initial calculation occurs', () =>
    {
        let setup = setupManager();
        let reader = new ModelReader(setup.vhm, { Source: 5 }, { initializingValues: false });
        reader.read();
        expect(setup.vhm.getFieldValueHost('Source')!.getValue()).toBe(5);
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBeUndefined();
        expect(setup.vhm.events).toEqual([]);
    });
    test('Reading a second time recalculates from the new source values', () =>
    {
        let setup = setupManager();
        new ModelReader(setup.vhm, { Source: 5 }).read();
        new ModelReader(setup.vhm, { Source: 9 }).read();
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBe(18);
    });
    test('A model without the source property leaves the calculated field undefined', () =>
    {
        let setup = setupManager();
        new ModelReader(setup.vhm, {}).read();
        expect(setup.vhm.getFieldValueHost('Display')!.getValue()).toBeUndefined();
    });
});
