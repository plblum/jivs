/** @jest-environment jsdom */
import type { FieldValueHostConfig, IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import type { TestingJivsServices } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { EditorWriter } from '../../src/Editors/EditorWriter';
import type { ITextValueAdapter, IValueAdapter } from '../../src/Interfaces/Adapters';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createJivsServicesForTesting } from '../TestSupport/CreateJivsServicesForTesting';
import { createFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

/** Hand-written fake that records what the writer sends to the editor as text. */
class RecordingTextAdapter implements ITextValueAdapter
{
    public written: Array<string | undefined> = [];
    public readTextValue(): string | undefined
    {
        return undefined;
    }
    public writeTextValue(textValue: string | undefined): void
    {
        this.written.push(textValue);
    }
}

/** Hand-written fake that records what the writer sends to the editor as a native value. */
class RecordingValueAdapter implements IValueAdapter
{
    public written: unknown[] = [];
    public readValue(): unknown
    {
        return undefined;
    }
    public writeValue(value: unknown): void
    {
        this.written.push(value);
    }
}

interface ITestSetup
{
    services: TestingJivsServices;
    valueHostsManager: ValueHostsManager;
    registry: IElementRegistry;
    field1: IFieldValueHost;
    field2: IFieldValueHost;
}

/**
 * Creates a real ValueHostsManager with two fields (Field1, Field2) and, optionally, a Static ValueHost.
 * The real ElementRegistry comes from the domServices.
 */
function setup(includeStatic: boolean = false): ITestSetup
{
    let services = createJivsServicesForTesting({ loggerLevel: LoggingLevel.Warn });
    let configs: Array<FieldValueHostConfig | { valueHostType: string, name: string }> = [
        createFieldValueHostConfig(1),
        createFieldValueHostConfig(2)
    ];
    if (includeStatic)
        configs.push({ valueHostType: ValueHostType.Static, name: 'Static1' });
    let valueHostsManager = new ValueHostsManager({
        services: services as any,   // build vs src copies of jivs-dom types are incompatible
        valueHostConfigs: configs as any
    });
    return {
        services,
        valueHostsManager,
        registry: services.domServices.getElementRegistry(valueHostsManager),
        field1: valueHostsManager.getFieldValueHost('Field1')!,
        field2: valueHostsManager.getFieldValueHost('Field2')!
    };
}

/** Adds an editor element to the registry for the field, with the adapters the installer would have assigned. */
function addEditor(registry: IElementRegistry, valueHost: IFieldValueHost,
    textAdapter: ITextValueAdapter | null, valueAdapter: IValueAdapter | null = null): IJivsElement
{
    let element = document.createElement('input') as IJivsElement;
    registry.addEditor(element, valueHost.getElementIdentifier());
    element.jivsTextValueAdapter = textAdapter;
    element.jivsValueAdapter = valueAdapter;
    return element;
}

/** The services also log unrelated configuration noise, so only entries from EditorWriter are considered. */
function writerLogs(services: TestingJivsServices): string[]
{
    return services.loggingService.captured
        .map((c) => c.message)
        .filter((m) => m.startsWith('No editor') || m.startsWith('No value adapter'));
}

// The writer's "external data" is the ElementRegistry passed in. Options are optional.
describe('EditorWriter constructor', () => {
    test('Does nothing until write() is called', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let adapter = new RecordingTextAdapter();
        addEditor(registry, field1, adapter);

        new EditorWriter(valueHostsManager);

        expect(adapter.written).toEqual([]);
    });

    test('Accepts options', () => {
        let { valueHostsManager, registry } = setup();

        expect(() => new EditorWriter(valueHostsManager, { filter: () => true })).not.toThrow();
    });
});

// write() sends each field's current value through the adapters that the editor's IJivsElement carries.
describe('EditorWriter.write sending values to editors', () => {
    test('Uses the text adapter with the ValueHost text value', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        let adapter1 = new RecordingTextAdapter();
        let adapter2 = new RecordingTextAdapter();
        addEditor(registry, field1, adapter1);
        addEditor(registry, field2, adapter2);
        field1.setTextValue('one', { validate: false });
        field2.setTextValue('two', { validate: false });

        new EditorWriter(valueHostsManager,).write();

        expect(adapter1.written).toEqual(['one']);
        expect(adapter2.written).toEqual(['two']);
        expect(writerLogs(services)).toEqual([]);
    });

    test('Writes an undefined text value as undefined and lets the adapter decide what to show', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let adapter = new RecordingTextAdapter();
        addEditor(registry, field1, adapter);

        new EditorWriter(valueHostsManager,).write();

        expect(adapter.written).toEqual([undefined]);
    });

    test('Without a text adapter, uses the native value adapter with the ValueHost value', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        let adapter = new RecordingValueAdapter();
        addEditor(registry, field1, null, adapter);
        addEditor(registry, field2, new RecordingTextAdapter());
        field1.setValue('native', { validate: false });

        new EditorWriter(valueHostsManager,).write();

        expect(adapter.written).toEqual(['native']);
        expect(writerLogs(services)).toEqual([]);
    });

    test('When both adapters exist, only the text adapter is used', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let textAdapter = new RecordingTextAdapter();
        let valueAdapter = new RecordingValueAdapter();
        addEditor(registry, field1, textAdapter, valueAdapter);
        field1.setValue('both', { validate: false });

        new EditorWriter(valueHostsManager,).write();

        expect(textAdapter.written.length).toBe(1);
        expect(valueAdapter.written).toEqual([]);
    });

    test('When a field has several editor elements, only the first is written', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let first = new RecordingTextAdapter();
        let second = new RecordingTextAdapter();
        addEditor(registry, field1, first);
        addEditor(registry, field1, second);
        field1.setTextValue('x', { validate: false });

        new EditorWriter(valueHostsManager,).write();

        expect(first.written).toEqual(['x']);
        expect(second.written).toEqual([]);
    });

    test('Calling write() again sends the values again, even when they have not changed', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let adapter = new RecordingTextAdapter();
        addEditor(registry, field1, adapter);
        field1.setTextValue('same', { validate: false });
        let testItem = new EditorWriter(valueHostsManager,);

        testItem.write();
        testItem.write();

        expect(adapter.written).toEqual(['same', 'same']);
    });

    test('ValueHosts that are not FieldValueHosts are ignored without logging', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup(true);
        let adapter = new RecordingTextAdapter();
        addEditor(registry, field1, adapter);
        addEditor(registry, field2, new RecordingTextAdapter());

        new EditorWriter(valueHostsManager,).write();

        expect(adapter.written.length).toBe(1);
        expect(writerLogs(services)).toEqual([]);
    });

    test('Does not change the ValueHosts', () => {
        let { valueHostsManager, registry, field1 } = setup();
        addEditor(registry, field1, new RecordingTextAdapter());
        field1.setTextValue('keep', { validate: false });

        new EditorWriter(valueHostsManager,).write();

        expect(field1.getTextValue()).toBe('keep');
    });
});

// Fields that cannot be written are skipped with a Warn log, and the remaining fields are still written.
describe('EditorWriter.write fields without a usable editor', () => {
    test('A field with no editor element logs a Warn and does not stop the other fields', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        let adapter = new RecordingTextAdapter();
        addEditor(registry, field2, adapter);

        new EditorWriter(valueHostsManager,).write();

        expect(adapter.written.length).toBe(1);
        let logs = writerLogs(services);
        expect(logs.length).toBe(1);
        expect(logs[0]).toContain(field1.getElementIdentifier());
    });

    test('An editor with neither adapter logs a Warn and does not stop the other fields', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        addEditor(registry, field1, null, null);
        let adapter = new RecordingTextAdapter();
        addEditor(registry, field2, adapter);

        new EditorWriter(valueHostsManager,).write();

        expect(adapter.written.length).toBe(1);
        let logs = writerLogs(services);
        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('No value adapter');
        expect(logs[0]).toContain(field1.getElementIdentifier());
    });

    test('Only editors count: an element of another role does not stand in for the editor', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        let label = document.createElement('label') as IJivsElement;
        label.jivsTextValueAdapter = new RecordingTextAdapter();
        registry.addField(label, field1.getElementIdentifier(), 'label');
        addEditor(registry, field2, new RecordingTextAdapter());

        new EditorWriter(valueHostsManager,).write();

        expect((label.jivsTextValueAdapter as RecordingTextAdapter).written).toEqual([]);
        expect(writerLogs(services).length).toBe(1);
    });
});

// options.filter selects which fields are written, such as only the replaced editors.
describe('EditorWriter filter', () => {
    test('Only fields the filter includes are written, and the filter receives each field ValueHost', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        let adapter1 = new RecordingTextAdapter();
        let adapter2 = new RecordingTextAdapter();
        addEditor(registry, field1, adapter1);
        addEditor(registry, field2, adapter2);
        field1.setTextValue('one', { validate: false });
        field2.setTextValue('two', { validate: false });
        let received: IFieldValueHost[] = [];

        new EditorWriter(valueHostsManager, {
            filter: (valueHost) =>
            {
                received.push(valueHost);
                return valueHost === field2;
            }
        }).write();

        expect(received).toEqual([field1, field2]);
        expect(adapter1.written).toEqual([]);
        expect(adapter2.written).toEqual(['two']);
        expect(writerLogs(services)).toEqual([]);
    });

    test('A field the filter excludes is not logged even when it has no editor', () => {
        let { services, valueHostsManager, registry, field2 } = setup();
        let adapter = new RecordingTextAdapter();
        addEditor(registry, field2, adapter);

        new EditorWriter(valueHostsManager, { filter: (valueHost) => valueHost === field2 }).write();

        expect(adapter.written.length).toBe(1);
        expect(writerLogs(services)).toEqual([]);
    });
});
