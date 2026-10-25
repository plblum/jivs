/** @jest-environment jsdom */
import type { FieldValueHostConfig, IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { SetValueOptions } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import type { TestingJivsServices } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { EditorReader } from '../../src/Editors/EditorReader';
import type { ITextValueAdapter, IValueAdapter } from '../../src/Interfaces/Adapters';
import type { IEditorAdapterDefinition } from '../../src/Interfaces/EditorAdapterDefinitions';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createJivsServicesForTesting } from '../TestSupport/CreateJivsServicesForTesting';
import { createFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

interface ISendValueCall
{
    valueHost: IFieldValueHost;
    editor: HTMLElement;
    jivsElement: IJivsElement;
    setValueOptions: SetValueOptions;
}

/**
 * Definition fake. sendValue records its arguments and, like the real definitions with validate false,
 * stores a text value into the ValueHost without validating it.
 * identifyEditor returns resolvedEditor when supplied, otherwise the jivsElement.
 */
class RecordingDefinition implements IEditorAdapterDefinition
{
    public readonly adapterKey = 'recording';
    public readonly priority = 10;
    public recommendedFieldPresentationName: string | null | undefined = null;
    public domServices!: IJivsDomServices;
    public sendValueCalls: ISendValueCall[] = [];
    public identifyEditorCalls: Array<{ valueHost: IFieldValueHost, jivsElement: IJivsElement }> = [];
    public resolvedEditor: HTMLElement | null = null;

    constructor(public textToSend: string = 'text')
    {
    }
    public sendValue(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement,
        options: SetValueOptions): void
    {
        this.sendValueCalls.push({ valueHost, editor, jivsElement, setValueOptions: options });
        valueHost.setTextValue(this.textToSend, { validate: false });
    }
    public identifyEditor(valueHost: IFieldValueHost, jivsElement: IJivsElement): HTMLElement
    {
        this.identifyEditorCalls.push({ valueHost, jivsElement });
        return this.resolvedEditor ?? jivsElement;
    }
    public matches(_valueHost: IFieldValueHost, _element: HTMLElement): boolean
    {
        return true;
    }
    public identifyJivsElement(_valueHost: IFieldValueHost, element: HTMLElement): IJivsElement
    {
        return element as IJivsElement;
    }
    public attachToSendValues(_valueHost: IFieldValueHost, _editor: HTMLElement,
        _jivsElement: IJivsElement, _options: EditorInstallOptions): void
    {
    }
    public attachEventHandler(_jivsElement: IJivsElement, _valueHost: IFieldValueHost,
        _eventName: string, _handler: EventListener): void
    {
    }
    public createTextValueAdapter(): ITextValueAdapter | null
    {
        return null;
    }
    public createValueAdapter(): IValueAdapter | null
    {
        return null;
    }
    public getStaticAriaUpdater(): null
    {
        return null;
    }
    public getAriaValidationStateUpdater(): null
    {
        return null;
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
 * The real ElementRegistry comes from the domServices, the same way EditorReader finds it.
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

/**
 * Adds an editor element to the registry for the field. When a definition is supplied,
 * it is assigned to the element the way EditorInstaller does after installing.
 */
function addEditor(registry: IElementRegistry, valueHost: IFieldValueHost,
    definition: IEditorAdapterDefinition | null): IJivsElement
{
    let element = document.createElement('input') as IJivsElement;
    registry.addEditor(element, valueHost.getElementIdentifier());
    if (definition)
        element.jivsEditorAdapterDefinition = definition;
    return element;
}

/**
 * The services also log unrelated configuration noise (such as a missing DataTypeCheck message),
 * so only entries from EditorReader are considered.
 */
function readerLogs(services: TestingJivsServices): string[]
{
    return services.loggingService.captured
        .map((c) => c.message)
        .filter((m) => m.startsWith('No editor'));
}

// The constructor takes its "external data" from the domServices' ElementRegistry for the manager.
describe('EditorReader constructor', () => {
    test('Uses the ElementRegistry that domServices provides for the ValueHostsManager', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let definition = new RecordingDefinition();
        let element = addEditor(registry, field1, definition);

        new EditorReader(valueHostsManager).read();

        expect(definition.sendValueCalls.map((c) => c.jivsElement)).toEqual([element]);
    });

    test('Accepts options and does nothing until read() is called', () => {
        let { services, valueHostsManager, registry, field1 } = setup();
        let definition = new RecordingDefinition();
        addEditor(registry, field1, definition);

        new EditorReader(valueHostsManager, { preliminaryValidation: false });

        expect(definition.sendValueCalls).toEqual([]);
        expect(readerLogs(services).length).toBe(0);
    });
});

// read() calls each field's EditorAdapterDefinition.sendValue() without validation, as event handlers would.
describe('EditorReader.read sending values', () => {
    test('Calls sendValue for each field with duringEdit false and validate false, in field order', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        let definition1 = new RecordingDefinition('one');
        let definition2 = new RecordingDefinition('two');
        let element1 = addEditor(registry, field1, definition1);
        let element2 = addEditor(registry, field2, definition2);

        new EditorReader(valueHostsManager).read();

        expect(definition1.sendValueCalls).toMatchObject([
            { valueHost: field1, editor: element1, jivsElement: element1, setValueOptions: { validate: false } }]);
        expect(definition2.sendValueCalls).toMatchObject([
            { valueHost: field2, editor: element2, jivsElement: element2, setValueOptions: { validate: false } }]);
        expect(field1.getTextValue()).toBe('one');
        expect(field2.getTextValue()).toBe('two');
        expect(readerLogs(services)).toEqual([]);
    });

    test('Passes the result of identifyEditor as the editor, such as the inner editor of a wrapper', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let definition = new RecordingDefinition();
        let inner = document.createElement('input');
        definition.resolvedEditor = inner;
        let wrapper = addEditor(registry, field1, definition);

        new EditorReader(valueHostsManager).read();

        expect(definition.identifyEditorCalls).toEqual([{ valueHost: field1, jivsElement: wrapper }]);
        expect(definition.sendValueCalls.length).toBe(1);
        expect(definition.sendValueCalls[0].editor).toBe(inner);
        expect(definition.sendValueCalls[0].jivsElement).toBe(wrapper);
    });

    test('When a field has several editor elements, only the first is used', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let definition1 = new RecordingDefinition('first');
        let definition2 = new RecordingDefinition('second');
        addEditor(registry, field1, definition1);
        addEditor(registry, field1, definition2);

        new EditorReader(valueHostsManager).read();

        expect(definition1.sendValueCalls.length).toBe(1);
        expect(definition2.sendValueCalls).toEqual([]);
        expect(field1.getTextValue()).toBe('first');
    });

    test('Calling read() again sends the values again', () => {
        let { valueHostsManager, registry, field1 } = setup();
        let definition = new RecordingDefinition();
        addEditor(registry, field1, definition);
        let testItem = new EditorReader(valueHostsManager);

        testItem.read();
        testItem.read();

        expect(definition.sendValueCalls.length).toBe(2);
    });

    test('ValueHosts that are not FieldValueHosts are ignored without logging', () => {
        let { services, valueHostsManager, registry, field1 } = setup(true);
        let definition = new RecordingDefinition();
        addEditor(registry, field1, definition);

        new EditorReader(valueHostsManager).read();

        expect(definition.sendValueCalls.length).toBe(1);
        expect(readerLogs(services).length).toBe(1);   // only Field2 has no editor
    });
});

// Fields that cannot be read are skipped with a Warn log, and the remaining fields are still read.
describe('EditorReader.read fields without an installed editor', () => {
    test('A field with no editor element logs a Warn and does not stop the other fields', () => {
        let { services, valueHostsManager, registry, field2 } = setup();
        let definition = new RecordingDefinition();
        addEditor(registry, field2, definition);

        new EditorReader(valueHostsManager).read();

        expect(definition.sendValueCalls.length).toBe(1);
        expect(readerLogs(services).length).toBe(1);
        expect(services.loggingService.containsLog(
            `No editor elements found for element identifier: 'Field1'`, LoggingLevel.Warn)).toBe(true);
    });

    test('An editor element without an installed definition logs a Warn and does not stop the other fields', () => {
        let { services, valueHostsManager, registry, field1, field2 } = setup();
        let definition = new RecordingDefinition();
        addEditor(registry, field1, null);   // EditorInstaller has not run on it
        addEditor(registry, field2, definition);

        new EditorReader(valueHostsManager).read();

        expect(definition.sendValueCalls.length).toBe(1);
        expect(field1.getTextValue()).toBeUndefined();
        expect(readerLogs(services).length).toBe(1);
        expect(services.loggingService.containsLog(
            `No editor adapter definition found for element identifier: 'Field1'`, LoggingLevel.Warn)).toBe(true);
    });

    test('An empty registry logs one Warn per field', () => {
        let { services, valueHostsManager } = setup();

        new EditorReader(valueHostsManager).read();

        expect(readerLogs(services).length).toBe(2);
        expect(services.loggingService.containsLog(
            `No editor elements found for element identifier: 'Field1'`, LoggingLevel.Warn)).toBe(true);
        expect(services.loggingService.containsLog(
            `No editor elements found for element identifier: 'Field2'`, LoggingLevel.Warn)).toBe(true);
    });
});

// ReaderBase validates with preliminary: true after all values are sent, unless options.preliminaryValidation is false.
describe('EditorReader.read preliminary validation', () => {
    test('By default, validation runs after the values are sent, leaving no field in NeedsValidation', () => {
        let { valueHostsManager, registry, field1, field2 } = setup();
        addEditor(registry, field1, new RecordingDefinition());
        addEditor(registry, field2, new RecordingDefinition());

        new EditorReader(valueHostsManager).read();

        expect(field1.validationStatus).not.toBe(ValidationStatus.NeedsValidation);
        expect(field2.validationStatus).not.toBe(ValidationStatus.NeedsValidation);
    });

    test('preliminaryValidation true behaves the same as the default', () => {
        let { valueHostsManager, registry, field1 } = setup();
        addEditor(registry, field1, new RecordingDefinition());

        new EditorReader(valueHostsManager, { preliminaryValidation: true }).read();

        expect(field1.validationStatus).not.toBe(ValidationStatus.NeedsValidation);
    });

    test('preliminaryValidation false leaves the fields in NeedsValidation', () => {
        let { valueHostsManager, registry, field1, field2 } = setup();
        addEditor(registry, field1, new RecordingDefinition());
        addEditor(registry, field2, new RecordingDefinition());

        new EditorReader(valueHostsManager, { preliminaryValidation: false }).read();

        expect(field1.validationStatus).toBe(ValidationStatus.NeedsValidation);
        expect(field2.validationStatus).toBe(ValidationStatus.NeedsValidation);
    });
});
