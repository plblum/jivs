/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { TestingLoggingService } from '@plblum/jivs-engine/build/Support/TestingLoggingService';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { ElementCollectorBase } from '../../src/FormInstaller/ElementCollectorBase';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import type {
    ElementRegistryRecord,
    IEditorElementRegistryRecord,
    IElementRegistry
} from '../../src/Interfaces/ElementRegistry';
import type { IElementCollector } from '../../src/Interfaces/ElementCollector';
import type { IEditorInstaller } from '../../src/Interfaces/EditorInstaller';
import type { IFieldPresentationInstaller } from '../../src/Interfaces/FieldPresentations';
import type { IFormPresentationInstaller } from '../../src/Interfaces/FormPresentations';
import type { IAriaService } from '../../src/Interfaces/AriaService';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { ElementRole } from '../../src/Interfaces/Types';
import { JivsDomServices } from '../../src/Services/JivsDomServices';
import { InputTextValueAdapter } from '../../src/Adapters/InputTextValueAdapter';
import { CheckboxTextValueAdapter } from '../../src/Adapters/CheckboxTextValueAdapter';
import { TextAreaTextValueAdapter } from '../../src/Adapters/TextAreaTextValueAdapter';
import { SelectTextValueAdapter } from '../../src/Adapters/SelectTextValueAdapter';
import {
    defaultTextInputPresentationName,
    TextInputPresentation
} from '../../src/FieldPresentations/TextInputPresentation';
import {
    defaultCheckboxPresentationName,
    CheckboxPresentation
} from '../../src/FieldPresentations/CheckboxPresentation';
import {
    defaultTextAreaPresentationName,
    TextAreaPresentation
} from '../../src/FieldPresentations/TextAreaPresentation';
import {
    defaultSelectPresentationName,
    SelectPresentation
} from '../../src/FieldPresentations/SelectPresentation';
import { LabelPresentation } from '../../src/FieldPresentations/LabelPresentation';
import { RequiredIndicatorPresentation } from '../../src/FieldPresentations/RequiredIndicatorPresentation';
import { FieldContainerPresentation } from '../../src/FieldPresentations/FieldContainerPresentation';
import { ValidationSummaryPresentation } from '../../src/FormPresentations/ValidationSummaryPresentation';
import { MessageFrame } from '../../src/Presentations_common/MessageFrame';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';
import { createStubFieldValueHost as createBaseStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

interface IRecordingFieldValueHost extends IFieldValueHost
{
    enabledCalls: boolean[];
}

/**
 * The shared stub plus setEnabled(), which FormInstaller calls on fields that have no editor.
 * enabledCalls records each value passed to setEnabled().
 */
function createStubFieldValueHost(name: string, elementIdentifier?: string): IRecordingFieldValueHost
{
    let enabledCalls: boolean[] = [];
    return Object.assign(createBaseStubFieldValueHost(name, elementIdentifier), {
        enabledCalls,
        setEnabled: (enabled: boolean) => { enabledCalls.push(enabled); }
    }) as IRecordingFieldValueHost;
}
import { InputAdapterDefinition } from '../../src/EditorAdapterDefinitions/InputAdapterDefinition';
import { CheckboxAdapterDefinition } from '../../src/EditorAdapterDefinitions/CheckboxAdapterDefinition';
import { TextAreaAdapterDefinition } from '../../src/EditorAdapterDefinitions/TextAreaAdapterDefinition';
import { SelectAdapterDefinition } from '../../src/EditorAdapterDefinitions/SelectAdapterDefinition';

type RegistryEntryAction = (registry: IElementRegistry) => void;

/**
 * Test-only collector that inserts its configured records into the supplied registry.
 */
class TestElementCollector extends ElementCollectorBase
{
    public calls: Array<{ root: HTMLElement; registry: IElementRegistry }> = [];

    constructor(private readonly addRecords: RegistryEntryAction)
    {
        super();
    }

    public override collect(root: HTMLElement, registry: IElementRegistry): void
    {
        this.calls.push({ root, registry });
        this.addRecords(registry);
    }
}

/**
 * Real registry with small observation hooks for clear, iteration, and editor-anchor recording.
 */
class RecordingElementRegistry extends ElementRegistry
{
    public clearCalls = 0;
    public iterationCalls = 0;
    public editorAnchors: Array<{ record: IEditorElementRegistryRecord; jivsElement: IJivsElement }> = [];

    public override clear(): void
    {
        this.clearCalls++;
        super.clear();
    }

    public override [Symbol.iterator](): Iterator<ElementRegistryRecord>
    {
        this.iterationCalls++;
        return super[Symbol.iterator]();
    }

    public override setEditorJivsElement(record: IEditorElementRegistryRecord, jivsElement: IJivsElement): void
    {
        this.editorAnchors.push({ record, jivsElement });
        super.setEditorJivsElement(record, jivsElement);
    }
}

interface IInstallTrace
{
    testItem: FormInstaller;
    valueHostsManager: IValueHostsManager;
    domServices: IJivsDomServices;
    collector: TestElementCollector;
    registry: RecordingElementRegistry;
    root: HTMLElement;
    logger: RecordingLoggingService;
    eventOrder: string[];
    editorCalls: Array<{ valueHost: IFieldValueHost; element: IJivsElement; options: object }>;
    fieldCalls: Array<{ valueHost: IFieldValueHost; element: IJivsElement; role: string; options: object }>;
    formCalls: Array<{ manager: IValueHostsManager; element: IJivsElement; role: string; options: object }>;
    ariaCalls: IElementRegistry[];
    counter: { increments: number; incrementsWhenRegistryRequested: number | null };
}

/**
 * Creates a real ElementRegistry and controlled service collaborators around a manager fake.
 */
function setup(
    addRecords: RegistryEntryAction = (_registry) => undefined,
    options: { fields?: Record<string, IFieldValueHost>; ariaService?: IAriaService | null } = {}
): IInstallTrace
{
    let eventOrder: string[] = [];
    let fields = options.fields ?? {};
    let domServices!: IJivsDomServices;
    let manager = {
        get services(): IJivsServices {
            return { domServices } as unknown as IJivsServices;
        },
        getFieldByElementIdentifier: (identifier: string): IFieldValueHost | null =>
            fields[identifier.toLowerCase()] ?? null,
        // The real manager applies the filter (FieldValueHost instances). This fake supplies only field stubs.
        enumerateValueHosts: function* () { yield* Object.values(fields); }
    } as unknown as IValueHostsManager;
    let registry = new RecordingElementRegistry(manager);
    let root = document.createElement('main');
    let logger = new RecordingLoggingService();
    let editorCalls: IInstallTrace['editorCalls'] = [];
    let fieldCalls: IInstallTrace['fieldCalls'] = [];
    let formCalls: IInstallTrace['formCalls'] = [];
    let ariaCalls: IElementRegistry[] = [];
    let counter: IInstallTrace['counter'] = { increments: 0, incrementsWhenRegistryRequested: null };
    domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices,
        incrementInstallCounter: (valueHostsManager) => {
            expect(valueHostsManager).toBe(manager);
            counter.increments++;
        },
        getElementRegistry: (valueHostsManager) => {
            eventOrder.push('getElementRegistry');
            counter.incrementsWhenRegistryRequested ??= counter.increments;
            expect(valueHostsManager).toBe(manager);
            return registry;
        },
        resolveContainerElement: (valueHostsManager) => {
            eventOrder.push('resolveContainerElement');
            expect(valueHostsManager).toBe(manager);
            return root;
        },
        editorInstaller: {
            install: (valueHost, element, options) => {
                eventOrder.push('editor');
                editorCalls.push({ valueHost, element, options: options ?? {} });
                return document.createElement('section') as IJivsElement;
            }
        } as IEditorInstaller,
        fieldPresentationInstaller: {
            install: (valueHost, element, role, options) => {
                eventOrder.push('field');
                fieldCalls.push({ valueHost, element, role, options: options ?? {} });
                return null;
            }
        } as IFieldPresentationInstaller,
        formPresentationInstaller: {
            install: (valueHostsManager, element, role, options) => {
                eventOrder.push('form');
                formCalls.push({ manager: valueHostsManager, element, role, options: options ?? {} });
                return null;
            }
        } as IFormPresentationInstaller,
        ariaService: options.ariaService ?? null
    });
    let collector = new TestElementCollector(registry => {
        eventOrder.push('collect');
        addRecords(registry);
    });
    let testItem = new FormInstaller(manager, collector);
    return {
        testItem, valueHostsManager: manager, domServices, collector, registry, root, logger,
        eventOrder, editorCalls, fieldCalls, formCalls, ariaCalls, counter
    };
}

function addDefaultMixedRecords(registry: IElementRegistry, identifier: string = 'email'): {
    editor: IJivsElement;
    label: IJivsElement;
    form: IJivsElement;
}
{
    let editor = document.createElement('input') as IJivsElement;
    editor.id = `${identifier}-editor`;
    let label = document.createElement('label') as IJivsElement;
    label.id = `${identifier}-label`;
    let form = document.createElement('form') as IJivsElement;
    form.id = 'summary';
    registry.addEditor(editor, identifier, { adapterKey: 'custom', duringEdit: true });
    registry.addField(label, identifier, ElementRole.label, { presentationName: 'myLabel' });
    registry.addForm(form, ElementRole.summary, { presentationName: 'mySummary', group: 'main' });
    return { editor, label, form };
}

function createAriaService(install: (registry: IElementRegistry) => void): IAriaService
{
    return {
        registerStaticUpdater: (_role, _updater) => undefined,
        registerValidationStateUpdater: (_role, _updater) => undefined,
        install,
        resolveValidationStateUpdater: (_element) => null,
        applyStaticAttributes: (_element, _valueHost) => null,
        applyValidationState: (_element, _valueHost, _state) => null
    };
}

// FormInstaller validates its constructor dependencies before retaining a collector or manager.
describe('FormInstaller constructor', () => {
    test('Rejects null or undefined manager and collector dependencies', () => {
        let collector = new TestElementCollector(() => undefined);

        expect(() => new FormInstaller(null!, collector)).toThrow(/valueHostsManager/);
        expect(() => new FormInstaller(undefined!, collector)).toThrow(/valueHostsManager/);
        expect(() => new FormInstaller({} as IValueHostsManager, null!)).toThrow(/collector/);
        expect(() => new FormInstaller({} as IValueHostsManager, undefined!)).toThrow(/collector/);
    });
});

// Installation clears stale records, collects from the resolved root, installs entries in order, and runs ARIA last.
describe('FormInstaller.install', () => {
    test('Disables fields that have no editor, and leaves fields with an editor alone', () => {
        let withEditor = createStubFieldValueHost('Email', 'email');
        let withoutEditor = createStubFieldValueHost('Phone', 'phone');
        let labelOnly = createStubFieldValueHost('Notes', 'notes');
        let trace = setup(registry => {
            addDefaultMixedRecords(registry, 'email');
            // A label for a field is not an editor, so Notes still counts as having none.
            registry.addField(document.createElement('label') as IJivsElement, 'notes', ElementRole.label);
        }, { fields: { email: withEditor, phone: withoutEditor, notes: labelOnly } });

        trace.testItem.install();

        expect(withEditor.enabledCalls).toEqual([]);
        expect(withoutEditor.enabledCalls).toEqual([false]);
        expect(labelOnly.enabledCalls).toEqual([false]);
    });

    test('Disables the field again on each install while it has no editor', () => {
        let withoutEditor = createStubFieldValueHost('Phone', 'phone');
        let trace = setup(() => undefined, { fields: { phone: withoutEditor } });

        trace.testItem.install();
        trace.testItem.install();

        expect(withoutEditor.enabledCalls).toEqual([false, false]);
    });

    test('Increments the installer counter once per install, before the registry is requested', () => {
        let trace = setup();

        trace.testItem.install();
        expect(trace.counter.increments).toBe(1);
        expect(trace.counter.incrementsWhenRegistryRequested).toBe(1);

        trace.testItem.install();
        expect(trace.counter.increments).toBe(2);
    });

    test('Clears stale records, collects once, installs each role, records editor anchors, and installs ARIA last', () => {
        let field = createStubFieldValueHost('Email', 'email');
        let trace = setup(registry => addDefaultMixedRecords(registry), {
            fields: { email: field },
            ariaService: createAriaService(registry => {
                trace.eventOrder.push('aria');
                trace.ariaCalls.push(registry);
            })
        });
        trace.registry.addForm(document.createElement('form') as IJivsElement, ElementRole.summary);

        trace.testItem.install();
        let installIterationCalls = trace.registry.iterationCalls;

        expect(trace.registry.clearCalls).toBe(1);
        expect(trace.collector.calls).toEqual([{ root: trace.root, registry: trace.registry }]);
        expect(trace.eventOrder).toEqual([
            'getElementRegistry', 'resolveContainerElement', 'collect', 'editor', 'field', 'form', 'aria'
        ]);
        expect(installIterationCalls).toBe(1);
        expect(trace.editorCalls).toHaveLength(1);
        expect(trace.editorCalls[0]).toMatchObject({
            valueHost: field,
            options: { adapterKey: 'custom', duringEdit: true }
        });
        expect(trace.fieldCalls).toHaveLength(1);
        expect(trace.fieldCalls[0]).toMatchObject({
            valueHost: field,
            role: ElementRole.label,
            options: { presentationName: 'myLabel' }
        });
        expect(trace.formCalls).toHaveLength(1);
        expect(trace.formCalls[0]).toMatchObject({
            manager: trace.valueHostsManager,
            role: ElementRole.summary,
            options: { presentationName: 'mySummary', group: 'main' }
        });
        expect(trace.registry.editorAnchors).toHaveLength(1);
        expect(trace.registry.editorAnchors[0].jivsElement).not.toBe(trace.editorCalls[0].element);
        expect(trace.registry.editorAnchors[0].jivsElement.tagName).toBe('SECTION');
        expect(trace.ariaCalls).toEqual([trace.registry]);
    });

    test('Uses the document body fallback supplied by DOM services and skips ARIA when disabled', () => {
        let trace = setup(registry => addDefaultMixedRecords(registry), {
            fields: { email: createStubFieldValueHost('Email', 'email') }
        });
        trace.domServices.resolveContainerElement = () => document.body;

        trace.testItem.install();

        expect(trace.collector.calls[0].root).toBe(document.body);
        expect(trace.ariaCalls).toHaveLength(0);
        expect(trace.eventOrder[trace.eventOrder.length - 1]).toBe('form');
    });

    test('Assigns the collected role only when an element does not already have one', () => {
        let field = createStubFieldValueHost('Email', 'email');
        let elements = addDefaultMixedRecords;
        let trace = setup(registry => {
            let { editor, label, form } = elements(registry);
            editor.jivsElementRole = 'custom-editor';
            label.jivsElementRole = '';
            form.jivsElementRole = 'custom-summary';
        }, { fields: { email: field } });

        trace.testItem.install();

        let [editorRecord, labelRecord, formRecord] = Array.from(trace.registry);
        expect(editorRecord.element.jivsElementRole).toBe('custom-editor');
        expect(labelRecord.element.jivsElementRole).toBe(ElementRole.label);
        expect(formRecord.element.jivsElementRole).toBe('custom-summary');
    });

    test('Warns and continues when an editor has no FieldValueHost', () => {
        let editor = document.createElement('input') as IJivsElement;
        editor.id = 'missing-editor';
        let trace = setup(registry => registry.addEditor(editor, 'unknown'));

        trace.testItem.install();

        expect(trace.editorCalls).toHaveLength(0);
        expect(trace.fieldCalls).toHaveLength(0);
        expect(trace.formCalls).toHaveLength(0);
        expect(trace.logger.calls).toHaveLength(1);
        expect(trace.logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(trace.logger.calls[0].details).toMatchObject({
            message: "Editor element for 'unknown' is missing a fieldValueHost.",
            feature: 'Dom',
            type: 'FormInstaller',
            data: { idAttribute: 'missing-editor' }
        });
    });

    test('Warns and continues when a field presentation record has no FieldValueHost', () => {
        let element = document.createElement('span') as IJivsElement;
        element.id = 'orphan-error';
        let trace = setup(registry => {
            registry.addField(element, 'unknown', ElementRole.error);
            registry.addForm(document.createElement('form') as IJivsElement, ElementRole.summary);
        });

        trace.testItem.install();

        expect(trace.fieldCalls).toHaveLength(0);
        expect(trace.logger.calls).toHaveLength(1);
        expect(trace.logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(trace.logger.calls[0].details).toMatchObject({
            message: "Element with identifier 'unknown' and role 'error' is missing a fieldValueHost.",
            feature: 'Dom',
            type: 'FormInstaller',
            data: { idAttribute: 'orphan-error' }
        });
        expect(trace.formCalls).toHaveLength(1);
    });

    test('Uses empty installation options when collected records omit options', () => {
        let field = createStubFieldValueHost('Email', 'email');
        let trace = setup(registry => {
            registry.addEditor(document.createElement('input') as IJivsElement, 'email');
            registry.addField(document.createElement('label') as IJivsElement, 'email', ElementRole.label);
            registry.addForm(document.createElement('form') as IJivsElement, ElementRole.summary);
        }, { fields: { email: field } });

        trace.testItem.install();

        expect(trace.editorCalls[0].options).toEqual({});
        expect(trace.fieldCalls[0].options).toEqual({});
        expect(trace.formCalls[0].options).toEqual({});
    });

    test('Does not clear the registry again when collection throws', () => {
        let failure = new Error('collector failure');
        let trace = setup(() => { throw failure; });

        expect(() => trace.testItem.install()).toThrow(failure);
        expect(trace.registry.clearCalls).toBe(1);
        expect(trace.eventOrder).toEqual(['getElementRegistry', 'resolveContainerElement', 'collect']);
    });

    test('Continues warning-path processing when the engine logger is not configured', () => {
        let trace = setup(registry => registry.addEditor(document.createElement('input') as IJivsElement, 'unknown'));
        trace.domServices.services.loggingService = null!;

        expect(() => trace.testItem.install()).not.toThrow();
        expect(trace.editorCalls).toHaveLength(0);
    });

    test('Propagates an ARIA installation error after completing collection and element installation', () => {
        let field = createStubFieldValueHost('Email', 'email');
        let failure = new Error('aria failure');
        let trace = setup(registry => addDefaultMixedRecords(registry), {
            fields: { email: field },
            ariaService: createAriaService(() => { throw failure; })
        });

        expect(() => trace.testItem.install()).toThrow(failure);
        expect(trace.editorCalls).toHaveLength(1);
        expect(trace.fieldCalls).toHaveLength(1);
        expect(trace.formCalls).toHaveLength(1);
        expect(trace.registry.clearCalls).toBe(1);
    });

    test('Recollects and reinstalls on repeated install calls', () => {
        let field = createStubFieldValueHost('Email', 'email');
        let trace = setup(registry => addDefaultMixedRecords(registry), { fields: { email: field } });

        trace.testItem.install();
        trace.testItem.install();

        expect(trace.registry.clearCalls).toBe(2);
        expect(trace.collector.calls).toHaveLength(2);
        expect(trace.editorCalls).toHaveLength(2);
        expect(trace.fieldCalls).toHaveLength(2);
        expect(trace.formCalls).toHaveLength(2);
    });
});

// Static installation attaches dispatchers only after all element installation work succeeds.
describe('FormInstaller.install static convenience', () => {
    test('Uses text-value defaults and attaches after instance installation', () => {
        let setup = setupFieldValueHostForTesting();
        let logger = new TestingLoggingService(LoggingLevel.Debug);
        setup.services.loggingService = logger;
        let domServices = new JivsDomServices();
        setup.services.setService('domServices', domServices);
        let eventOrder: string[] = [];
        let root = document.createElement('form');
        let collector = new TestElementCollector(registry => {
            eventOrder.push('collect');
            let input = document.createElement('input');
            input.type = 'text';
            registry.addEditor(input as IJivsElement, setup.config.name);
        });
        domServices.resolveContainerElement = () => root;
        let originalAttach = domServices.dispatchers.attach.bind(domServices.dispatchers);
        domServices.dispatchers.attach = (manager, useTextValue, useNativeValue) => {
            eventOrder.push('attach');
            expect(manager).toBe(setup.valueHostsManager);
            expect(useTextValue).toBe(true);
            expect(useNativeValue).toBe(false);
            originalAttach(manager, useTextValue, useNativeValue);
        };

        FormInstaller.install(setup.valueHostsManager, collector);

        expect(eventOrder).toEqual(['collect', 'attach']);
        expect(Array.from(domServices.getElementRegistry(setup.valueHostsManager))).toHaveLength(1);
    });

    test('Forwards explicit dispatcher flags', () => {
        let setup = setupFieldValueHostForTesting();
        setup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let domServices = new JivsDomServices();
        setup.services.setService('domServices', domServices);
        let attachCalls: boolean[][] = [];
        domServices.dispatchers.attach = (_manager, useTextValue, useNativeValue) => {
            attachCalls.push([useTextValue ?? false, useNativeValue ?? false]);
        };
        let collector = new TestElementCollector(() => undefined);

        FormInstaller.install(setup.valueHostsManager, collector, false, true);

        expect(attachCalls).toEqual([[false, true]]);
    });

    test('Does not attach dispatchers when element installation fails', () => {
        let setup = setupFieldValueHostForTesting();
        setup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let domServices = new JivsDomServices();
        setup.services.setService('domServices', domServices);
        let attachCalls = 0;
        domServices.dispatchers.attach = () => { attachCalls++; };
        let collector = new TestElementCollector(registry => {
            registry.addEditor(document.createElement('input') as IJivsElement, setup.config.name);
        });
        domServices.editorInstaller.install = () => { throw new Error('editor failure'); };

        expect(() => FormInstaller.install(setup.valueHostsManager, collector))
            .toThrow('editor failure');
        expect(attachCalls).toBe(0);
    });
});

// The default service graph installs a real editor adapter and presentation through a supporting concrete collector.
describe('FormInstaller integration with real DOM and engine services', () => {
    test('Collects and installs a text input whose change event updates its FieldValueHost', () => {
        let setup = setupFieldValueHostForTesting();
        setup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let domServices = new JivsDomServices();
        setup.services.setService('domServices', domServices);
        let root = document.createElement('form');
        let input = document.createElement('input');
        input.type = 'text';
        root.appendChild(input);
        domServices.resolveContainerElement = () => root;
        let collector = new TestElementCollector((registry) => {
            for (let element of Array.from(root.querySelectorAll('input[type="text"]'))) {
                registry.addEditor(element as IJivsElement, setup.config.name);
            }
        });
        let jivsInput = input as HTMLInputElement & IJivsElement;

        new FormInstaller(setup.valueHostsManager, collector).install();

        expect(jivsInput.jivsElementRole).toBe(ElementRole.editor);
        expect(jivsInput.jivsEditorAdapterDefinition).toBeDefined();
        expect(jivsInput.jivsTextValueAdapter).toBeDefined();
        expect(jivsInput.jivsFieldPresentation).toBeDefined();
        input.value = 'collected value';
        input.dispatchEvent(new Event('change'));
        expect(setup.valueHost.getTextValue()).toBe('collected value');
    });

    test('Installs multiple editor types and field/form roles and records the resolved elements', () => {
        let setup = setupFieldValueHostForTesting();
        setup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let domServices = new JivsDomServices();
        setup.services.setService('domServices', domServices);

        let root = document.createElement('form');
        let textInput = document.createElement('input');
        textInput.type = 'text';
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        let textArea = document.createElement('textarea');
        let select = document.createElement('select');
        let option = document.createElement('option');
        option.value = 'first';
        option.textContent = 'First';
        select.appendChild(option);
        let label = document.createElement('label');
        let requiredIndicator = document.createElement('span');
        let fieldContainer = document.createElement('div');
        let summary = document.createElement('div');
        let editors = [textInput, checkbox, textArea, select];
        let otherElements = [label, requiredIndicator, fieldContainer, summary];
        for (let element of [...editors, ...otherElements])
            root.appendChild(element);
        domServices.resolveContainerElement = () => root;

        domServices.formPresentationFactory.register('test-summary',
            element => new ValidationSummaryPresentation(element, new MessageFrame(), {}));

        let collector = new TestElementCollector(registry => {
            registry.addEditor(textInput as IJivsElement, setup.config.name, {
                presentationName: defaultTextInputPresentationName
            });
            registry.addEditor(checkbox as IJivsElement, setup.config.name, {
                presentationName: defaultCheckboxPresentationName
            });
            registry.addEditor(textArea as IJivsElement, setup.config.name, {
                presentationName: defaultTextAreaPresentationName
            });
            registry.addEditor(select as IJivsElement, setup.config.name, {
                presentationName: defaultSelectPresentationName
            });
            registry.addField(label as IJivsElement, setup.config.name, ElementRole.label);
            registry.addField(requiredIndicator as IJivsElement, setup.config.name, ElementRole.required);
            registry.addField(fieldContainer as IJivsElement, setup.config.name, ElementRole.container);
            registry.addForm(summary as IJivsElement, ElementRole.summary, {
                presentationName: 'test-summary',
                group: 'main'
            });
        });

        new FormInstaller(setup.valueHostsManager, collector).install();

        let jivsEditors = editors as Array<HTMLElement & IJivsElement>;
        let jivsLabel = label as HTMLElement & IJivsElement;
        let jivsRequiredIndicator = requiredIndicator as HTMLElement & IJivsElement;
        let jivsFieldContainer = fieldContainer as HTMLElement & IJivsElement;
        let jivsSummary = summary as HTMLElement & IJivsElement;
        expect(jivsEditors.map(element => element.jivsElementRole))
            .toEqual([ElementRole.editor, ElementRole.editor, ElementRole.editor, ElementRole.editor]);
        expect(jivsEditors.map(element => element.jivsEditorAdapterDefinition?.adapterKey))
            .toEqual(['input:text', 'input:checkbox', 'textarea', 'select']);
        // checks all properties of IJivsElement
        expect(jivsEditors[0].jivsTextValueAdapter).toBeInstanceOf(InputTextValueAdapter);
        expect(jivsEditors[0].jivsValueAdapter).toBeNull();
        expect(jivsEditors[0].jivsFieldPresentation).toBeInstanceOf(TextInputPresentation);
        expect(jivsEditors[0].jivsEditorAdapterDefinition).toBeInstanceOf(InputAdapterDefinition);
        expect(jivsEditors[0].jivsEditorAdapterDefinition?.adapterKey).toBe('input:text');
        expect(jivsEditors[0].jivsAriaValidationStateUpdater).toBeUndefined();
        expect(jivsEditors[0].jivsErrorMessageId).toBeUndefined();
        expect(jivsEditors[0].jivsFormPresentation).toBeUndefined();
        expect(jivsEditors[0].jivsElementRole).toBe(ElementRole.editor);
        expect(jivsEditors[0].jivsFormPresentationGroup).toBeUndefined();
  
        expect(jivsEditors[1].jivsTextValueAdapter).toBeInstanceOf(CheckboxTextValueAdapter);
        expect(jivsEditors[1].jivsValueAdapter).toBeNull();
        expect(jivsEditors[1].jivsFieldPresentation).toBeInstanceOf(CheckboxPresentation);
        expect(jivsEditors[1].jivsEditorAdapterDefinition).toBeInstanceOf(CheckboxAdapterDefinition);
        expect(jivsEditors[1].jivsEditorAdapterDefinition?.adapterKey).toBe('input:checkbox');
        expect(jivsEditors[1].jivsAriaValidationStateUpdater).toBeUndefined();
        expect(jivsEditors[1].jivsErrorMessageId).toBeUndefined();
        expect(jivsEditors[1].jivsFormPresentation).toBeUndefined();
        expect(jivsEditors[1].jivsElementRole).toBe(ElementRole.editor);
        expect(jivsEditors[1].jivsFormPresentationGroup).toBeUndefined();


        expect(jivsEditors[2].jivsTextValueAdapter).toBeInstanceOf(TextAreaTextValueAdapter);
        expect(jivsEditors[2].jivsValueAdapter).toBeNull();
        expect(jivsEditors[2].jivsFieldPresentation).toBeInstanceOf(TextAreaPresentation);
        expect(jivsEditors[2].jivsEditorAdapterDefinition).toBeInstanceOf(TextAreaAdapterDefinition);
        expect(jivsEditors[2].jivsEditorAdapterDefinition?.adapterKey).toBe('textarea');
        expect(jivsEditors[2].jivsAriaValidationStateUpdater).toBeUndefined();
        expect(jivsEditors[2].jivsErrorMessageId).toBeUndefined();
        expect(jivsEditors[2].jivsFormPresentation).toBeUndefined();
        expect(jivsEditors[2].jivsElementRole).toBe(ElementRole.editor);
        expect(jivsEditors[2].jivsFormPresentationGroup).toBeUndefined();

        expect(jivsEditors[3].jivsTextValueAdapter).toBeInstanceOf(SelectTextValueAdapter);
        expect(jivsEditors[3].jivsValueAdapter).toBeNull();
        expect(jivsEditors[3].jivsFieldPresentation).toBeInstanceOf(SelectPresentation);
        expect(jivsEditors[3].jivsEditorAdapterDefinition).toBeInstanceOf(SelectAdapterDefinition);
        expect(jivsEditors[3].jivsEditorAdapterDefinition?.adapterKey).toBe('select');
        expect(jivsEditors[3].jivsAriaValidationStateUpdater).toBeUndefined();
        expect(jivsEditors[3].jivsErrorMessageId).toBeUndefined();
        expect(jivsEditors[3].jivsFormPresentation).toBeUndefined();
        expect(jivsEditors[3].jivsElementRole).toBe(ElementRole.editor);
        expect(jivsEditors[3].jivsFormPresentationGroup).toBeUndefined();
        expect(jivsEditors.map(element => element.jivsAriaValidationStateUpdater))
            .toEqual([undefined, undefined, undefined, undefined]);

        // These don't need to check IJivsElement properties related to editors...
        expect(jivsLabel.jivsElementRole).toBe(ElementRole.label);
        expect(jivsLabel.jivsFieldPresentation).toBeInstanceOf(LabelPresentation);
        expect(jivsLabel.jivsFormPresentation).toBeUndefined();
        expect(jivsLabel.jivsFormPresentationGroup).toBeUndefined();
        expect(jivsLabel.jivsAriaValidationStateUpdater).toBeUndefined();

        expect(jivsRequiredIndicator.jivsElementRole).toBe(ElementRole.required);
        expect(jivsRequiredIndicator.jivsFieldPresentation).toBeInstanceOf(RequiredIndicatorPresentation);
        expect(jivsRequiredIndicator.jivsFormPresentation).toBeUndefined();
        expect(jivsRequiredIndicator.jivsFormPresentationGroup).toBeUndefined();
        expect(jivsRequiredIndicator.jivsAriaValidationStateUpdater).toBeUndefined();
        expect(jivsFieldContainer.jivsElementRole).toBe(ElementRole.container);
        expect(jivsFieldContainer.jivsFieldPresentation).toBeInstanceOf(FieldContainerPresentation);
        expect(jivsFieldContainer.jivsFormPresentation).toBeUndefined();
        expect(jivsFieldContainer.jivsFormPresentationGroup).toBeUndefined();
        expect(jivsFieldContainer.jivsAriaValidationStateUpdater).toBeUndefined();
        expect(jivsSummary.jivsElementRole).toBe(ElementRole.summary);
        expect(jivsSummary.jivsFormPresentation).toBeInstanceOf(ValidationSummaryPresentation);
        expect(jivsSummary.jivsFormPresentationGroup).toBe('main');
        expect(jivsSummary.jivsAriaValidationStateUpdater).toBeUndefined();
        expect(jivsSummary.jivsFieldPresentation).toBeUndefined();

        let registry = domServices.getElementRegistry(setup.valueHostsManager);
        let records = Array.from(registry);
        expect(records).toHaveLength(8);
        expect(records.map(record => [record.kind, record.role, record.element]))
            .toEqual([
                ['field', ElementRole.editor, textInput],
                ['field', ElementRole.editor, checkbox],
                ['field', ElementRole.editor, textArea],
                ['field', ElementRole.editor, select],
                ['field', ElementRole.label, label],
                ['field', ElementRole.required, requiredIndicator],
                ['field', ElementRole.container, fieldContainer],
                ['form', ElementRole.summary, summary]
            ]);
        expect(records.slice(0, 7).map(record => record.fieldValueHost))
            .toEqual(Array(7).fill(setup.valueHost));
        expect(records.slice(0, 4).map(record =>
            (record as IEditorElementRegistryRecord).jivsElement))
            .toEqual(editors);
        expect(registry.getTextValueAdapterElements(setup.config.name))
            .toEqual(editors);
        expect(registry.getFieldPresentationElements(setup.config.name))
            .toEqual([...editors, label, requiredIndicator, fieldContainer]);
        expect(registry.getFormPresentationElements()).toEqual([summary]);
    });
});
