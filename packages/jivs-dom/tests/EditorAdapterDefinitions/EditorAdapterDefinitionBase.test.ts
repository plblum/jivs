/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig, IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import type { TestingLoggingService } from '@plblum/jivs-engine/build/Support/TestingLoggingService';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { EditorAriaStaticUpdater } from '../../src/Aria/EditorAriaStaticUpdater';
import { EditorAriaValidationStateUpdater } from '../../src/Aria/EditorAriaValidationStateUpdater';
import { EditorAdapterDefinitionBase } from '../../src/EditorAdapterDefinitions/EditorAdapterDefinitionBase';
import type { ITextValueAdapter, IValueAdapter } from '../../src/Interfaces/Adapters';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

interface IAttachCall
{
    valueHost: IFieldValueHost;
    editor: HTMLElement;
    jivsElement: IJivsElement;
    options: EditorInstallOptions;
}

/**
 * Minimal concrete subclass. It records attachToSendValuesCore calls, and exposes
 * the protected members (sendTextValue, sendNativeValue).
 */
class Publicify_EditorAdapterDefinition extends EditorAdapterDefinitionBase
{
    constructor(adapterKey: string, priority: number, recommendedName?: string | null)
    {
        super(adapterKey, priority, recommendedName);
    }
    public attachCalls: IAttachCall[] = [];

    protected defaultFieldPresentationName(): string | null
    {
        return 'DefaultPresentation';
    }
    public matches(): boolean
    {
        return true;
    }
    protected attachToSendValuesCore(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement, options: EditorInstallOptions): void
    {
        this.sendValue(valueHost, editor, jivsElement, options.duringEdit);
    }

    override sendValue(valueHost: IFieldValueHost, editor: HTMLElement, jivsElement: IJivsElement, duringEdit?: boolean, validate?: boolean): void
    {
        this.attachCalls.push({ valueHost: valueHost, editor: editor, jivsElement: jivsElement, options: { duringEdit: duringEdit ?? false } });
    }
    public createTextValueAdapter(): ITextValueAdapter | null
    {
        return null;
    }
    public createValueAdapter(): IValueAdapter | null
    {
        return null;
    }
    public publicify_sendTextValue(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement, duringEdit?: boolean): void
    {
        this.sendTextValue(valueHost, editor, jivsElement, duringEdit);
    }
    public publicify_sendNativeValue(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement): void
    {
        this.sendNativeValue(valueHost, editor, jivsElement);
    }
}

/**
 * A subclass whose editor is a child of the jivs element, like a wrapped editor.
 */
class ChildEditorDefinition extends Publicify_EditorAdapterDefinition
{
    constructor()
    {
        super('child', 10);
    }
    public override identifyEditor(valueHost: IFieldValueHost, jivsElement: IJivsElement): HTMLElement
    {
        return jivsElement.querySelector('input')!;
    }
}

interface IRecordingValueHost extends IFieldValueHost
{
    textCalls: any[];
    valueCalls: any[];
}

function createRecordingValueHost(): IRecordingValueHost
{
    let host = createStubFieldValueHost('Field1', 'fieldId') as any;
    host.textCalls = [];
    host.valueCalls = [];
    host.setTextValue = (value: string, options: any) => { host.textCalls.push({ value: value, options: options }); };
    host.setValue = (value: unknown, options: any) => { host.valueCalls.push({ value: value, options: options }); };
    return host as IRecordingValueHost;
}

// The logger is the real DomLoggingFacade (created by createMockJivsDomServices) over a recording logging service.
function setup(definition?: Publicify_EditorAdapterDefinition)
{
    let logger = new RecordingLoggingService();
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    let testItem = definition ?? new Publicify_EditorAdapterDefinition('input:text', 20);
    testItem.domServices = domServices;
    let editor = document.createElement('input');
    editor.id = 'editorId';
    return {
        testItem: testItem,
        logger: logger,
        domServices: domServices,
        editor: editor,
        jivsElement: editor as unknown as IJivsElement,
        valueHost: createRecordingValueHost()
    };
}

// The constructor validates the key and resolves the recommended presentation name.
describe('EditorAdapterDefinitionBase constructor and properties', () => {
    test('Stores adapterKey and priority', () => {
        let testItem = new Publicify_EditorAdapterDefinition('input:text', 42);

        expect(testItem.adapterKey).toBe('input:text');
        expect(testItem.priority).toBe(42);
    });

    test('Rejects a null or undefined adapterKey', () => {
        expect(() => new Publicify_EditorAdapterDefinition(null as unknown as string, 1))
            .toThrow(new CodingError('adapterKey required'));
        expect(() => new Publicify_EditorAdapterDefinition(undefined as unknown as string, 1))
            .toThrow(new CodingError('adapterKey required'));
    });

    test('Accepts priority 0 and an empty-string adapterKey', () => {
        let testItem = new Publicify_EditorAdapterDefinition('', 0);

        expect(testItem.adapterKey).toBe('');
        expect(testItem.priority).toBe(0);
    });

    test('recommendedFieldPresentationName uses defaultFieldPresentationName when omitted or undefined', () => {
        expect(new Publicify_EditorAdapterDefinition('a', 1).recommendedFieldPresentationName)
            .toBe('DefaultPresentation');
        expect(new Publicify_EditorAdapterDefinition('a', 1, undefined).recommendedFieldPresentationName)
            .toBe('DefaultPresentation');
    });

    test('recommendedFieldPresentationName uses the constructor value, including null', () => {
        expect(new Publicify_EditorAdapterDefinition('a', 1, 'Custom').recommendedFieldPresentationName)
            .toBe('Custom');
        expect(new Publicify_EditorAdapterDefinition('a', 1, null).recommendedFieldPresentationName)
            .toBeNull();
        expect(new Publicify_EditorAdapterDefinition('a', 1, '').recommendedFieldPresentationName)
            .toBe('');
    });

    test('domServices returns what was assigned', () => {
        let testItem = new Publicify_EditorAdapterDefinition('a', 1);
        let domServices = createMockJivsDomServices();

        testItem.domServices = domServices;

        expect(testItem.domServices).toBe(domServices);
    });
});

// The base class assumes the element supplied is the jivs element and the editor.
describe('EditorAdapterDefinitionBase identification defaults', () => {
    test('identifyJivsElement and identifyEditor return the element they are given', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();

        expect(testItem.identifyJivsElement(valueHost, editor)).toBe(editor);
        expect(testItem.identifyEditor(valueHost, jivsElement)).toBe(editor);
    });
});

// attachToSendValues defaults options, calls the subclass hook, then logs at Debug.
describe('EditorAdapterDefinitionBase.attachToSendValues', () => {
    test('Passes supplied options to attachToSendValuesCore and logs once', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();
        let options: EditorInstallOptions = { };

        testItem.attachToSendValues(valueHost, editor, jivsElement, options);

        expect(testItem.attachCalls.length).toBe(1);
        expect(testItem.attachCalls[0].valueHost).toBe(valueHost);
        expect(testItem.attachCalls[0].editor).toBe(editor);
        expect(testItem.attachCalls[0].jivsElement).toBe(jivsElement);
        expect(testItem.attachCalls[0].options).toEqual({duringEdit: false});
        expect(logger.calls.length).toBe(1);
    });

    test('Supplies an empty options object when options is omitted', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();

        testItem.attachToSendValues(valueHost, editor, jivsElement);

        expect(testItem.attachCalls[0].options).toEqual({duringEdit: false});
    });

    test('Logs a Debug message with element id, value host name, type and identity', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();

        testItem.attachToSendValues(valueHost, editor, jivsElement);

        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Debug);
        expect(logger.calls[0].details).toEqual({
            message: `Attaching editor to send values for element 'editorId' and value host 'Field1'.`,
            feature: 'Dom',
            type: testItem,
            identity: 'input:text',
            data: { idAttribute: 'editorId', valueHostName: 'Field1' }
        });
    });

    test('Does not log if attachToSendValuesCore throws', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();
        (testItem as any).attachToSendValuesCore = () => { throw new Error('core failed'); };

        expect(() => testItem.attachToSendValues(valueHost, editor, jivsElement)).toThrow('core failed');
        expect(logger.calls).toEqual([]);
    });
});

// attachEventHandler attaches to the element identified by identifyEditor.
describe('EditorAdapterDefinitionBase.attachEventHandler', () => {
    test('Adds the listener to the jivs element by default', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();
        let received: Event[] = [];

        testItem.attachEventHandler(jivsElement, valueHost, 'change', (e) => received.push(e));
        editor.dispatchEvent(new Event('change'));
        editor.dispatchEvent(new Event('input'));

        expect(received.length).toBe(1);
        expect(received[0].type).toBe('change');
    });

    test('Adds the listener to the element returned by an overridden identifyEditor', () => {
        let { testItem, valueHost } = setup(new ChildEditorDefinition());
        let wrapper = document.createElement('div');
        let input = document.createElement('input');
        wrapper.appendChild(input);
        let received: Event[] = [];

        testItem.attachEventHandler(wrapper as unknown as IJivsElement, valueHost, 'click', (e) => received.push(e));
        wrapper.dispatchEvent(new Event('click'));
        expect(received.length).toBe(0);
        input.dispatchEvent(new Event('click'));

        expect(received.length).toBe(1);
    });
});

// The default aria updaters are new instances of the editor updaters each time.
describe('EditorAdapterDefinitionBase aria updaters', () => {
    test('getStaticAriaUpdater returns a new EditorAriaStaticUpdater each call', () => {
        let { testItem } = setup();

        let first = testItem.getStaticAriaUpdater();
        let second = testItem.getStaticAriaUpdater();

        expect(first).toBeInstanceOf(EditorAriaStaticUpdater);
        expect(second).toBeInstanceOf(EditorAriaStaticUpdater);
        expect(second).not.toBe(first);
    });

    test('getAriaValidationStateUpdater returns a new EditorAriaValidationStateUpdater each call', () => {
        let { testItem } = setup();

        let first = testItem.getAriaValidationStateUpdater();
        let second = testItem.getAriaValidationStateUpdater();

        expect(first).toBeInstanceOf(EditorAriaValidationStateUpdater);
        expect(second).toBeInstanceOf(EditorAriaValidationStateUpdater);
        expect(second).not.toBe(first);
    });
});

// sendTextValue reads from jivsTextValueAdapter and always asks for validation.
describe('EditorAdapterDefinitionBase.sendTextValue', () => {
    test('Sends the adapter text to setTextValue with validate true', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = { readTextValue: () => 'abc' } as ITextValueAdapter;

        testItem.publicify_sendTextValue(valueHost, editor, jivsElement);

        expect(valueHost.textCalls).toEqual([{ value: 'abc', options: { validate: true, duringEdit: false } }]);
        expect(logger.calls).toEqual([]);
    });

    test('Passes duringEdit true and false through', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = { readTextValue: () => '' } as ITextValueAdapter;

        testItem.publicify_sendTextValue(valueHost, editor, jivsElement, true);
        testItem.publicify_sendTextValue(valueHost, editor, jivsElement, false);

        expect(valueHost.textCalls).toEqual([
            { value: '', options: { validate: true, duringEdit: true } },
            { value: '', options: { validate: true, duringEdit: false } }
        ]);
    });

    test('Logs a Warn and sends nothing when there is no text value adapter', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();

        testItem.publicify_sendTextValue(valueHost, editor, jivsElement);

        expect(valueHost.textCalls).toEqual([]);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details).toEqual({
            message: `No text value adapter found on the element 'editorId' associated with ValueHost 'Field1'.`,
            feature: 'Dom',
            type: testItem,
            identity: 'input:text',
            data: { idAttribute: 'editorId', valueHostName: 'Field1' }
        });
    });
});

// sendNativeValue reads from jivsValueAdapter and always asks for validation.
describe('EditorAdapterDefinitionBase.sendNativeValue', () => {
    test('Sends the adapter native value to setValue with validate true', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsValueAdapter = { readValue: () => 42 } as IValueAdapter;

        testItem.publicify_sendNativeValue(valueHost, editor, jivsElement);

        expect(valueHost.valueCalls).toEqual([{ value: 42, options: { validate: true } }]);
        expect(logger.calls).toEqual([]);
    });

    test('Sends a null native value as is', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsValueAdapter = { readValue: () => null } as IValueAdapter;

        testItem.publicify_sendNativeValue(valueHost, editor, jivsElement);

        expect(valueHost.valueCalls).toEqual([{ value: null, options: { validate: true } }]);
    });

    test('Logs a Warn and sends nothing when there is no value adapter', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();

        testItem.publicify_sendNativeValue(valueHost, editor, jivsElement);

        expect(valueHost.valueCalls).toEqual([]);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details).toEqual({
            message: `No native value adapter found on the element 'editorId' associated with ValueHost 'Field1'.`,
            feature: 'Dom',
            type: testItem,
            identity: 'input:text',
            data: { idAttribute: 'editorId', valueHostName: 'Field1' }
        });
    });
});

// Additional edge cases for the log token substitution, adapter lookup and error handling.
describe('EditorAdapterDefinitionBase additional cases', () => {
    test('Log message falls back to the name attribute, then to the value host element identifier', () => {
        let { testItem, logger, jivsElement, valueHost } = setup();
        let named = document.createElement('input');
        named.setAttribute('name', 'byName');
        let anonymous = document.createElement('input');

        testItem.attachToSendValues(valueHost, named, jivsElement);
        testItem.attachToSendValues(valueHost, anonymous, jivsElement);

        expect(logger.calls[0].details!.message).toBe(
            `Attaching editor to send values for element 'byName' and value host 'Field1'.`);
        expect(logger.calls[0].details!.data).toEqual({ idAttribute: 'byName', valueHostName: 'Field1' });
        expect(logger.calls[1].details!.message).toBe(
            `Attaching editor to send values for element 'fieldId' and value host 'Field1'.`);
        expect(logger.calls[1].details!.data).toEqual({ idAttribute: 'fieldId', valueHostName: 'Field1' });
    });

    test('A logging service that rejects the level never builds the details', () => {
        let logger = new RecordingLoggingService(false);
        let testItem = new Publicify_EditorAdapterDefinition('input:text', 20);
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let editor = document.createElement('input');

        testItem.attachToSendValues(createRecordingValueHost(), editor, editor as unknown as IJivsElement);

        expect(logger.calls).toEqual([{ level: LoggingLevel.Debug, details: undefined }]);
    });

    test('attachEventHandler supports several events and the handler can be removed with the same function', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();
        let received: string[] = [];
        let handler = (e: Event) => { received.push(e.type); };

        testItem.attachEventHandler(jivsElement, valueHost, 'change', handler);
        testItem.attachEventHandler(jivsElement, valueHost, 'blur', handler);
        editor.dispatchEvent(new Event('change'));
        editor.dispatchEvent(new Event('blur'));
        editor.removeEventListener('change', handler);
        editor.dispatchEvent(new Event('change'));

        expect(received).toEqual(['change', 'blur']);
    });

    test('Adapters are read from the jivs element, not from the editor element', () => {
        let { testItem, logger, valueHost } = setup(new ChildEditorDefinition());
        let wrapper = document.createElement('div') as unknown as IJivsElement;
        let input = document.createElement('input');
        wrapper.appendChild(input);
        wrapper.jivsTextValueAdapter = { readTextValue: () => 'from wrapper' } as ITextValueAdapter;

        testItem.publicify_sendTextValue(valueHost, input, wrapper);

        expect(valueHost.textCalls[0].value).toBe('from wrapper');
        expect(logger.calls).toEqual([]);
    });

    test('sendNativeValue ignores a text adapter and sendTextValue ignores a native adapter', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = { readTextValue: () => 'text' } as ITextValueAdapter;

        testItem.publicify_sendNativeValue(valueHost, editor, jivsElement);

        expect(valueHost.valueCalls).toEqual([]);
        expect(logger.calls.length).toBe(1);

        jivsElement.jivsTextValueAdapter = undefined;
        jivsElement.jivsValueAdapter = { readValue: () => 1 } as IValueAdapter;
        testItem.publicify_sendTextValue(valueHost, editor, jivsElement);

        expect(valueHost.textCalls).toEqual([]);
        expect(logger.calls.length).toBe(2);
    });

    test('An adapter that throws propagates and nothing is sent', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = { readTextValue: () => { throw new Error('read failed'); } } as unknown as ITextValueAdapter;
        jivsElement.jivsValueAdapter = { readValue: () => { throw new Error('read failed'); } } as unknown as IValueAdapter;

        expect(() => testItem.publicify_sendTextValue(valueHost, editor, jivsElement)).toThrow('read failed');
        expect(() => testItem.publicify_sendNativeValue(valueHost, editor, jivsElement)).toThrow('read failed');
        expect(valueHost.textCalls).toEqual([]);
        expect(valueHost.valueCalls).toEqual([]);
    });

    test('Logging before domServices is assigned fails because the facade is missing', () => {
        let testItem = new Publicify_EditorAdapterDefinition('a', 1);
        let editor = document.createElement('input');

        expect(() => testItem.attachToSendValues(createRecordingValueHost(), editor, editor as unknown as IJivsElement))
            .toThrow(TypeError);
    });
});

// Integration: the real engine FieldValueHost and logging service replace the fakes.
describe('EditorAdapterDefinitionBase integration with real FieldValueHost and logging', () => {
    function createRealSetup()
    {
        let services = createJivsServicesForTesting();
        let logger = services.loggingService as TestingLoggingService;
        logger.minLevel = LoggingLevel.Debug;
        let valueHost = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new Publicify_EditorAdapterDefinition('input:text', 20);
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let editor = document.createElement('input');
        editor.id = 'editorId';
        return { testItem, logger, valueHost, editor, jivsElement: editor as unknown as IJivsElement };
    }

    test('sendTextValue updates the real value host text and value', () => {
        let { testItem, valueHost, editor, jivsElement } = createRealSetup();
        jivsElement.jivsTextValueAdapter = { readTextValue: () => 'hello' } as ITextValueAdapter;

        testItem.publicify_sendTextValue(valueHost, editor, jivsElement);

        expect(valueHost.getTextValue()).toBe('hello');
    });

    test('sendNativeValue updates the real value host value', () => {
        let { testItem, valueHost, editor, jivsElement } = createRealSetup();
        jivsElement.jivsValueAdapter = { readValue: () => 'native' } as IValueAdapter;

        testItem.publicify_sendNativeValue(valueHost, editor, jivsElement);

        expect(valueHost.getValue()).toBe('native');
    });

    test('Debug and Warn entries reach the real logging service with the Dom feature', () => {
        let { testItem, logger, valueHost, editor, jivsElement } = createRealSetup();

        testItem.attachToSendValues(valueHost, editor, jivsElement);
        testItem.publicify_sendTextValue(valueHost, editor, jivsElement);

        let debugEntry = logger.findMessage('Attaching editor', LoggingLevel.Debug);
        let warnEntry = logger.findMessage('No text value adapter', LoggingLevel.Warn);
        expect(debugEntry!.message).toBe(
            `Attaching editor to send values for element 'editorId' and value host 'Field1'.`);
        expect(debugEntry!.feature).toBe('Dom');
        expect(warnEntry!.message).toBe(
            `No text value adapter found on the element 'editorId' associated with ValueHost 'Field1'.`);
    });
});
