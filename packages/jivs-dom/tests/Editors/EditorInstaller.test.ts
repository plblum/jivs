/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { TestingLoggingService } from '@plblum/jivs-engine/build/Support/TestingLoggingService';
import { EditorInstaller } from '../../src/Editors/EditorInstaller';
import { InputTextValueAdapter } from '../../src/Adapters/InputTextValueAdapter';
import { InputAdapterDefinition } from '../../src/EditorAdapterDefinitions/InputAdapterDefinition';
import { TextInputPresentation } from '../../src/FieldPresentations/TextInputPresentation';
import { JivsDomServices } from '../../src/Services/JivsDomServices';
import type { ITextValueAdapter, IValueAdapter } from '../../src/Interfaces/Adapters';
import type {
    IEditorAdapterDefinition,
    IEditorAdapterDefinitionFactory
} from '../../src/Interfaces/EditorAdapterDefinitions';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { ElementRole } from '../../src/Interfaces/Types';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

interface IDefinitionCall
{
    method: string;
    valueHost?: IFieldValueHost;
    element?: HTMLElement;
    editor?: HTMLElement;
    jivsElement?: IJivsElement;
    options?: EditorInstallOptions;
}

/**
 * Definition fake that records installer calls and supplies configurable resolved elements and adapters.
 */
class RecordingDefinition implements IEditorAdapterDefinition
{
    public readonly adapterKey = 'recording';
    public readonly priority = 10;
    public recommendedFieldPresentationName: string | null | undefined = 'Recommended';
    public domServices!: IJivsDomServices;
    public calls: IDefinitionCall[] = [];
    public resolvedJivsElement: IJivsElement | undefined;
    public resolvedEditor: HTMLElement | undefined;
    public textAdapter: ITextValueAdapter | null = null;
    public valueAdapter: IValueAdapter | null = null;

    constructor(private readonly eventOrder: string[] = [])
    {
    }
    public sendValue(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement, duringEdit?: boolean, validate?: boolean): void
    {
        throw new Error('Method not implemented.');
    }

    public matches(_valueHost: IFieldValueHost, _candidateElement: HTMLElement): boolean
    {
        this.calls.push({ method: 'matches' });
        return true;
    }
    public identifyJivsElement(valueHost: IFieldValueHost, element: HTMLElement): IJivsElement
    {
        this.eventOrder.push('identifyJivsElement');
        this.calls.push({ method: 'identifyJivsElement', valueHost, element });
        return this.resolvedJivsElement ?? element as IJivsElement;
    }
    public identifyEditor(valueHost: IFieldValueHost, jivsElement: IJivsElement): HTMLElement
    {
        this.eventOrder.push('identifyEditor');
        this.calls.push({ method: 'identifyEditor', valueHost, jivsElement });
        return this.resolvedEditor ?? jivsElement;
    }
    public attachToSendValues(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement, options: EditorInstallOptions): void
    {
        this.eventOrder.push('attachToSendValues');
        this.calls.push({ method: 'attachToSendValues', valueHost, editor, jivsElement, options });
    }
    
    public attachEventHandler(_jivsElement: IJivsElement, _valueHost: IFieldValueHost,
        _eventName: string, _handler: EventListener): void
    {
    }
    public createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement | null): ITextValueAdapter | null
    {
        this.eventOrder.push('createTextValueAdapter');
        this.calls.push({ method: 'createTextValueAdapter', valueHost, editor, jivsElement: jivsElement ?? undefined });
        return this.textAdapter;
    }
    public createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement | null): IValueAdapter | null
    {
        this.eventOrder.push('createValueAdapter');
        this.calls.push({ method: 'createValueAdapter', valueHost, editor, jivsElement: jivsElement ?? undefined });
        return this.valueAdapter;
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
    testItem: EditorInstaller;
    domServices: IJivsDomServices;
    definition: RecordingDefinition;
    factory: IEditorAdapterDefinitionFactory;
    loggingService: RecordingLoggingService;
    valueHost: IFieldValueHost;
    suppliedElement: IJivsElement;
    jivsElement: IJivsElement;
    editor: HTMLElement;
    presentationCalls: Array<{
        valueHost: IFieldValueHost;
        element: IJivsElement;
        role: ElementRole | string;
        options?: { presentationName?: string | null };
    }>;
    eventOrder: string[];
}

/**
 * Creates the installer with a recording definition factory and presentation installer.
 */
function setup(): ITestSetup
{
    let eventOrder: string[] = [];
    let definition = new RecordingDefinition(eventOrder);
    let factory: IEditorAdapterDefinitionFactory = {
        register: (_definition) => { throw new Error('Unexpected register call'); },
        lazyRegistration: (_registrationFunction) => { throw new Error('Unexpected lazyRegistration call'); },
        getDefinition: (_adapterKey) => {
            eventOrder.push('getDefinition');
            return definition;
        },
        findDefinition: (_valueHost, _element) => {
            eventOrder.push('findDefinition');
            return definition;
        }
    };
    let presentationCalls: ITestSetup['presentationCalls'] = [];
    let loggingService = new RecordingLoggingService();
    let domServices = createMockJivsDomServices({
        editorAdapterDefinitionFactory: factory,
        fieldPresentationInstaller: {
            install: (valueHost, element, role, options) => {
                eventOrder.push('presentation');
                presentationCalls.push({ valueHost, element, role, options });
                return null;
            }
        },
        services: { loggingService } as unknown as IJivsServices
    });
    let testItem = new EditorInstaller(domServices);
    let valueHost = createStubFieldValueHost('Field1', 'field-one');
    let suppliedElement = document.createElement('div') as IJivsElement;
    let jivsElement = document.createElement('section') as IJivsElement;
    let editor = document.createElement('input');
    definition.resolvedJivsElement = jivsElement;
    definition.resolvedEditor = editor;

    return {
        testItem, domServices, definition, factory, loggingService, valueHost,
        suppliedElement, jivsElement, editor, presentationCalls, eventOrder
    };
}

// EditorInstaller requires shared DOM services and uses the configured definition factory for resolution.
describe('EditorInstaller constructor and definition resolution', () => {
    test('Rejects null or undefined DOM services', () => {
        expect(() => new EditorInstaller(null!)).toThrow(/domServices/);
        expect(() => new EditorInstaller(undefined!)).toThrow(/domServices/);
    });

    test('Uses an adapter key for explicit lookup and forwards the original installation context', () => {
        let { testItem, definition, eventOrder, suppliedElement, valueHost } = setup();

        let result = testItem.install(valueHost, suppliedElement, { adapterKey: 'recording' });

        expect(eventOrder[0]).toBe('getDefinition');
        expect(eventOrder).not.toContain('findDefinition');
        expect(definition.calls[0]).toMatchObject({
            method: 'identifyJivsElement',
            valueHost,
            element: suppliedElement
        });
        expect(result).toBe(definition.resolvedJivsElement);
    });

    test('Uses automatic matching when the adapter key is omitted, null, or empty', () => {
        for (let options of [undefined, { adapterKey: null }, { adapterKey: '' }, null]) {
            let { testItem, eventOrder, suppliedElement, valueHost } = setup();

            testItem.install(valueHost, suppliedElement, options!);

            expect(eventOrder[0]).toBe('findDefinition');
            expect(eventOrder).not.toContain('getDefinition');
        }
    });

    test('Logs and throws when an explicitly requested key is not found', () => {
        let { testItem, domServices, loggingService, suppliedElement, valueHost } = setup();
        domServices.editorAdapterDefinitionFactory.getDefinition = () => null;

        expect(() => testItem.install(valueHost, suppliedElement, { adapterKey: 'missing' }))
            .toThrow('Editor adapter definition not found for key: missing');

        expect(loggingService.calls).toHaveLength(1);
        expect(loggingService.calls[0].level).toBe(LoggingLevel.Error);
        expect(loggingService.calls[0].details).toMatchObject({
            message: 'Editor adapter definition not found for key: missing',
            feature: 'Dom',
            data: { idAttribute: 'field-one', valueHostName: 'Field1' }
        });
        expect(loggingService.calls[0].details!.type).toBe(testItem);
    });

    test('Logs and throws when automatic matching finds no definition', () => {
        let { testItem, domServices, loggingService, suppliedElement, valueHost } = setup();
        domServices.editorAdapterDefinitionFactory.findDefinition = () => null;

        expect(() => testItem.install(valueHost, suppliedElement))
            .toThrow('Editor adapter definition not found for the given element and value host.');

        expect(loggingService.calls).toHaveLength(1);
        expect(loggingService.calls[0].level).toBe(LoggingLevel.Error);
        expect(loggingService.calls[0].details).toMatchObject({
            message: 'Editor adapter definition not found for the given element and value host.',
            feature: 'Dom',
            data: { idAttribute: 'field-one', valueHostName: 'Field1' }
        });
        expect(loggingService.calls[0].details!.type).toBe(testItem);
    });

    test('Still throws a lookup error when the logging service is absent', () => {
        let domServices = createMockJivsDomServices({
            editorAdapterDefinitionFactory: {
                getDefinition: (_adapterKey: string) => null,
                findDefinition: (_valueHost: IFieldValueHost, _element: HTMLElement) => null
            } as IEditorAdapterDefinitionFactory,
            services: { loggingService: null } as unknown as IJivsServices
        });
        let testItem = new EditorInstaller(domServices);

        expect(() => testItem.install(createStubFieldValueHost('Field1'), document.createElement('input') as IJivsElement,
            { adapterKey: 'missing' })).toThrow('Editor adapter definition not found for key: missing');
    });
});

// A new installation resolves both elements, installs capabilities and handlers, then records completion.
describe('EditorInstaller.install', () => {
    test('Installs on the resolved JivsElement and passes the resolved editor through the ordered operations', () => {
        let {
            testItem, definition, valueHost, suppliedElement, jivsElement, editor,
            presentationCalls, eventOrder
        } = setup();
        let options: EditorInstallOptions = { presentationName: 'Special', duringEdit: true };
        let textAdapter = { readTextValue: () => 'text', writeTextValue: (_value?: string) => undefined };
        let valueAdapter = { readValue: () => 'value', writeValue: (_value: unknown) => undefined };
        definition.textAdapter = textAdapter;
        definition.valueAdapter = valueAdapter;

        let result = testItem.install(valueHost, suppliedElement, options);

        expect(result).toBe(jivsElement);
        expect(jivsElement.jivsElementRole).toBe(ElementRole.editor);
        expect(jivsElement.jivsTextValueAdapter).toBe(textAdapter);
        expect(jivsElement.jivsValueAdapter).toBe(valueAdapter);
        expect(jivsElement.jivsEditorAdapterDefinition).toBe(definition);
        expect(definition.calls.find(call => call.method === 'attachToSendValues')).toMatchObject({
            valueHost, editor, jivsElement, options
        });
        expect(presentationCalls).toEqual([{
            valueHost,
            element: jivsElement,
            role: ElementRole.editor,
            options: { presentationName: 'Special' }
        }]);
        expect(eventOrder).toEqual([
            'findDefinition', 'identifyJivsElement', 'identifyEditor',
            'createTextValueAdapter', 'createValueAdapter', 'attachToSendValues', 'presentation'
        ]);
    });

    test('Passes null presentationName through to the definition recommendation', () => {
        let { testItem, definition, valueHost, suppliedElement, presentationCalls } = setup();
        testItem.install(valueHost, suppliedElement, { presentationName: null });

        expect(presentationCalls[0].options).toEqual({ presentationName: 'Recommended' });

        definition.recommendedFieldPresentationName = null;
        let nextSetup = setup();
        nextSetup.definition.recommendedFieldPresentationName = null;
        nextSetup.testItem.install(nextSetup.valueHost, nextSetup.suppliedElement, { presentationName: null });
        expect(nextSetup.presentationCalls[0].options).toEqual({ presentationName: null });
    });

    test('Uses an explicit presentation name and leaves an omitted name for the role default', () => {
        let explicitSetup = setup();
        explicitSetup.testItem.install(explicitSetup.valueHost, explicitSetup.suppliedElement,
            { presentationName: 'Custom' });
        expect(explicitSetup.presentationCalls[0].options).toEqual({ presentationName: 'Custom' });

        let omittedSetup = setup();
        omittedSetup.testItem.install(omittedSetup.valueHost, omittedSetup.suppliedElement);
        expect(omittedSetup.presentationCalls[0].options).toEqual({ presentationName: undefined });
    });

    test('Stores null when a definition does not provide either adapter capability', () => {
        let { testItem, valueHost, suppliedElement, jivsElement } = setup();

        testItem.install(valueHost, suppliedElement);

        expect(jivsElement.jivsTextValueAdapter).toBeNull();
        expect(jivsElement.jivsValueAdapter).toBeNull();
    });

    test('Returns an already installed resolved JivsElement without reinstalling its behavior', () => {
        let { testItem, definition, valueHost, suppliedElement, jivsElement, presentationCalls } = setup();
        let installedDefinition = new RecordingDefinition();
        jivsElement.jivsEditorAdapterDefinition = installedDefinition;
        jivsElement.jivsElementRole = 'authored-role';
        let existingTextAdapter = { readTextValue: () => 'existing', writeTextValue: (_value?: string) => undefined };
        jivsElement.jivsTextValueAdapter = existingTextAdapter;

        let result = testItem.install(valueHost, suppliedElement);

        expect(result).toBe(jivsElement);
        expect(jivsElement.jivsEditorAdapterDefinition).toBe(installedDefinition);
        expect(jivsElement.jivsElementRole).toBe('authored-role');
        expect(jivsElement.jivsTextValueAdapter).toBe(existingTextAdapter);
        expect(definition.calls.map(call => call.method)).toEqual(['identifyJivsElement', 'identifyEditor']);
        expect(presentationCalls).toHaveLength(0);
    });

    test('Does not mark installation complete when the presentation installer throws', () => {
        let { testItem, domServices, valueHost, suppliedElement, jivsElement } = setup();
        domServices.fieldPresentationInstaller.install = () => { throw new Error('presentation failure'); };

        expect(() => testItem.install(valueHost, suppliedElement)).toThrow('presentation failure');
        expect(jivsElement.jivsEditorAdapterDefinition).toBeUndefined();
    });

    test('Stops before resolving the editor when JivsElement identification throws', () => {
        let { testItem, definition, valueHost, suppliedElement, jivsElement, presentationCalls } = setup();
        definition.identifyJivsElement = () => { throw new Error('element resolution failure'); };

        expect(() => testItem.install(valueHost, suppliedElement)).toThrow('element resolution failure');
        expect(definition.calls.map(call => call.method)).toEqual([]);
        expect(jivsElement.jivsEditorAdapterDefinition).toBeUndefined();
        expect(presentationCalls).toHaveLength(0);
    });

    test('Stops before creating adapters when editor identification throws', () => {
        let { testItem, definition, valueHost, suppliedElement, jivsElement, presentationCalls } = setup();
        definition.identifyEditor = () => { throw new Error('editor resolution failure'); };

        expect(() => testItem.install(valueHost, suppliedElement)).toThrow('editor resolution failure');
        expect(definition.calls.map(call => call.method)).toEqual(['identifyJivsElement']);
        expect(jivsElement.jivsEditorAdapterDefinition).toBeUndefined();
        expect(presentationCalls).toHaveLength(0);
    });
});

// The default service graph combines real definitions, adapters, field presentations, and a real FieldValueHost.
describe('EditorInstaller integration with real jivs-dom and engine services', () => {
    test('Installs the default text editor and transfers a change event to the real FieldValueHost', () => {
        let setup = setupFieldValueHostForTesting();
        setup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let domServices = new JivsDomServices();
        setup.services.domServices = domServices as any; //setService('domServices', domServices);
        let input = document.createElement('input');
        input.type = 'text';
        input.id = 'field-one';
        let jivsInput = input as HTMLInputElement & IJivsElement;

        let result = domServices.editorInstaller.install(setup.valueHost, jivsInput);

        expect(result).toBe(input);
        expect(jivsInput.jivsElementRole).toBe(ElementRole.editor);
        expect(jivsInput.jivsEditorAdapterDefinition).toBeDefined();
        expect(jivsInput.jivsTextValueAdapter).toBeInstanceOf(InputTextValueAdapter);
        expect(jivsInput.jivsValueAdapter).toBeNull();
        expect(jivsInput.jivsFieldPresentation).toBeInstanceOf(TextInputPresentation);
        expect(input.classList.contains('jivs-editor-input')).toBe(true);

        input.value = 'changed';
        input.dispatchEvent(new Event('change'));

        expect(setup.valueHost.getTextValue()).toBe('changed');
    });

    test('Enables intermediate text updates only when duringEdit is true', () => {
        let normalSetup = setupFieldValueHostForTesting();
        normalSetup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let normalDomServices = new JivsDomServices();
        normalSetup.services.domServices = normalDomServices as any; //setService('domServices', normalDomServices);
        let normalInput = document.createElement('input');
        normalInput.type = 'text';
        normalDomServices.editorInstaller.install(normalSetup.valueHost, normalInput as IJivsElement);

        normalInput.value = 'not yet submitted';
        normalInput.dispatchEvent(new Event('input'));
        expect(normalSetup.valueHost.getTextValue()).toBeUndefined();

        let duringEditSetup = setupFieldValueHostForTesting();
        duringEditSetup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let duringEditDomServices = new JivsDomServices();
        duringEditSetup.services.domServices = duringEditDomServices as any; //setService('domServices', duringEditDomServices);
        let duringEditInput = document.createElement('input');
        duringEditInput.type = 'text';
        duringEditDomServices.editorInstaller.install(duringEditSetup.valueHost,
            duringEditInput as IJivsElement, { duringEdit: true });

        duringEditInput.value = 'updated during edit';
        duringEditInput.dispatchEvent(new Event('input'));
        expect(duringEditSetup.valueHost.getTextValue()).toBe('updated during edit');
    });

    test('Uses the role default when both the option and definition recommendation are null', () => {
        let setup = setupFieldValueHostForTesting();
        setup.services.loggingService = new TestingLoggingService(LoggingLevel.Debug);
        let domServices = new JivsDomServices();
        setup.services.domServices = domServices as any; //setService('domServices', domServices);
        let factory = domServices.editorAdapterDefinitionFactory;
        factory.register(new InputAdapterDefinition('text', 'input:text', 80, null));
        let input = document.createElement('input');
        input.type = 'text';
        let jivsInput = input as HTMLInputElement & IJivsElement;

        domServices.editorInstaller.install(setup.valueHost, jivsInput, { presentationName: null });

        expect(jivsInput.jivsFieldPresentation).toBeInstanceOf(TextInputPresentation);
    });
});
