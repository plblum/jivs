/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig, IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { InjectedError } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { ParsedTextEditorAdapterDefinitionBase } from '../../src/EditorAdapterDefinitions/ParsedTextEditorAdapterDefinitionBase';
import type { ITextValueAdapter, IValueAdapter } from '../../src/Interfaces/Adapters';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

interface IParseCall
{
    textValue: string | undefined;
    valueHost: IFieldValueHost;
    editor: HTMLElement;
    jivsElement: IJivsElement;
}

interface IParseResult
{
    nativeValue: unknown | undefined;
    injectedError?: InjectedError;
}

/**
 * Concrete subclass that records parseTextValue calls and returns a configurable result.
 * Its attachToSendValuesCore follows the pattern documented on the base class.
 */
class Publicify_ParsedTextDefinition extends ParsedTextEditorAdapterDefinitionBase
{
    constructor()
    {
        super('parsed', 50, 'ParsedPresentation');
    }
    public parseCalls: IParseCall[] = [];
    public parseResult: IParseResult = { nativeValue: undefined };
    public parseThrows = false;

    protected defaultFieldPresentationName(): string | null
    {
        return null;
    }
    public matches(): boolean
    {
        return true;
    }
    public createTextValueAdapter(): ITextValueAdapter | null
    {
        return null;
    }
    public createValueAdapter(): IValueAdapter | null
    {
        return null;
    }
    protected attachToSendValuesCore(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement, options: EditorInstallOptions): void
    {
        editor.addEventListener('change', () => this.sendParsedTextValue(valueHost, editor, jivsElement, false));
        if (options.duringEdit)
            editor.addEventListener('input', () => this.sendParsedTextValue(valueHost, editor, jivsElement, true));
    }
    protected parseTextValue(textValue: string | undefined, valueHost: IFieldValueHost,
        editor: HTMLElement, jivsElement: IJivsElement): IParseResult
    {
        this.parseCalls.push({ textValue, valueHost, editor, jivsElement });
        if (this.parseThrows)
            throw new Error('parse failed');
        return this.parseResult;
    }
    public publicify_sendParsedTextValue(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement, duringEdit?: boolean): void
    {
        this.sendParsedTextValue(valueHost, editor, jivsElement, duringEdit);
    }
}

function createRecordingValueHost(): any
{
    let host = createStubFieldValueHost('Field1', 'fieldId') as any;
    host.setValuesCalls = [];
    host.setValues = (nativeValue: unknown, text: string | undefined, options: any) => {
        host.setValuesCalls.push({ nativeValue, text, options });
    };
    return host;
}

function setup(textValue: string | undefined = '12/25/2024')
{
    let testItem = new Publicify_ParsedTextDefinition();
    let logger = new RecordingLoggingService();
    testItem.domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    let editor = document.createElement('input');
    editor.id = 'editorId';
    let jivsElement = editor as unknown as IJivsElement;
    jivsElement.jivsTextValueAdapter = {
        readTextValue: () => textValue,
        writeTextValue: () => { }
    } as unknown as ITextValueAdapter;
    return { testItem, logger, editor, jivsElement, valueHost: createRecordingValueHost() };
}

// sendParsedTextValue reads text, calls the parser, and sends both values with validation requested.
describe('ParsedTextEditorAdapterDefinitionBase.sendParsedTextValue', () => {
    test('Passes the adapter text, value host, editor and jivs element to parseTextValue', () => {
        let { testItem, editor, jivsElement, valueHost } = setup('abc');

        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement);

        expect(testItem.parseCalls.length).toBe(1);
        expect(testItem.parseCalls[0].textValue).toBe('abc');
        expect(testItem.parseCalls[0].valueHost).toBe(valueHost);
        expect(testItem.parseCalls[0].editor).toBe(editor);
        expect(testItem.parseCalls[0].jivsElement).toBe(jivsElement);
    });

    test('A successful parse sends the native value and text with validate true', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup('12/25/2024');
        let date = new Date(2024, 11, 25);
        testItem.parseResult = { nativeValue: date };

        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement);

        expect(valueHost.setValuesCalls).toEqual([{
            nativeValue: date,
            text: '12/25/2024',
            options: { validate: true, duringEdit: undefined, injectedError: undefined }
        }]);
        expect(logger.calls).toEqual([]);
    });

    test('A failed parse sends undefined with the injected error', () => {
        let { testItem, editor, jivsElement, valueHost } = setup('bad');
        let injectedError: InjectedError = { errorMessage: 'Not a date' } as InjectedError;
        testItem.parseResult = { nativeValue: undefined, injectedError: injectedError };

        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement, false);

        expect(valueHost.setValuesCalls).toEqual([{
            nativeValue: undefined,
            text: 'bad',
            options: { validate: true, duringEdit: false, injectedError: injectedError }
        }]);
    });

    test('Passes duringEdit true through', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();

        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement, true);

        expect(valueHost.setValuesCalls[0].options.duringEdit).toBe(true);
    });

    test('An undefined text value is parsed and sent as undefined', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = { readTextValue: () => undefined } as unknown as ITextValueAdapter;

        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement);

        expect(testItem.parseCalls[0].textValue).toBeUndefined();
        expect(valueHost.setValuesCalls[0].text).toBeUndefined();
    });

    test('A native value of null or 0 is sent as is', () => {
        let { testItem, editor, jivsElement, valueHost } = setup('0');

        testItem.parseResult = { nativeValue: 0 };
        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement);
        testItem.parseResult = { nativeValue: null };
        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement);

        expect(valueHost.setValuesCalls.map((c: any) => c.nativeValue)).toEqual([0, null]);
    });

    test('A parser that throws propagates and nothing is sent', () => {
        let { testItem, editor, jivsElement, valueHost } = setup();
        testItem.parseThrows = true;

        expect(() => testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement))
            .toThrow('parse failed');
        expect(valueHost.setValuesCalls).toEqual([]);
    });
});

// Without a text adapter the process stops with a Warn log.
describe('ParsedTextEditorAdapterDefinitionBase without a text value adapter', () => {
    test('Logs a Warn, does not parse, and does not send', () => {
        let { testItem, logger, editor, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = undefined;

        testItem.publicify_sendParsedTextValue(valueHost, editor, jivsElement);

        expect(testItem.parseCalls).toEqual([]);
        expect(valueHost.setValuesCalls).toEqual([]);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details!.feature).toBe('Dom');
        expect(logger.calls[0].details!.type).toBe(testItem);
        expect(logger.calls[0].details!.identity).toBe('parsed');
        expect(logger.calls[0].details!.message).toBe(
            `No TextValueAdapter found on the element 'editorId' associated with ValueHost 'Field1'.`);
        expect(logger.calls[0].details!.data).toEqual({ idAttribute: 'editorId', valueHostName: 'Field1' });
    });
});

// Inherited constructor behavior and a subclass wired as documented.
describe('ParsedTextEditorAdapterDefinitionBase subclass wiring', () => {
    test('Inherits key, priority and the supplied recommended presentation name', () => {
        let testItem = new Publicify_ParsedTextDefinition();

        expect(testItem.adapterKey).toBe('parsed');
        expect(testItem.priority).toBe(50);
        expect(testItem.recommendedFieldPresentationName).toBe('ParsedPresentation');
    });

    test('change sends with duringEdit false; input only when duringEdit', () => {
        let { testItem, editor, jivsElement, valueHost } = setup('x');

        testItem.attachToSendValues(valueHost, editor, jivsElement, { duringEdit: true });
        editor.dispatchEvent(new Event('input'));
        editor.dispatchEvent(new Event('change'));

        expect(valueHost.setValuesCalls.map((c: any) => c.options.duringEdit)).toEqual([true, false]);
    });
});

// Integration with the real FieldValueHost: parsed native value and injected error.
describe('ParsedTextEditorAdapterDefinitionBase integration with real FieldValueHost', () => {
    function createRealSetup(text: string)
    {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.Number
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new Publicify_ParsedTextDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let editor = document.createElement('input');
        let jivsElement = editor as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = { readTextValue: () => text } as unknown as ITextValueAdapter;
        return { testItem, host, editor, jivsElement };
    }

    test('A parsed native value and the original text land on the FieldValueHost', () => {
        let { testItem, host, editor, jivsElement } = createRealSetup('42');
        testItem.parseResult = { nativeValue: 42 };

        testItem.attachToSendValues(host, editor, jivsElement);
        editor.dispatchEvent(new Event('change'));

        expect(host.getValue()).toBe(42);
        expect(host.getTextValue()).toBe('42');
    });

    test('An injected error leaves no native value and keeps the text', () => {
        let { testItem, host, editor, jivsElement } = createRealSetup('abc');
        testItem.parseResult = {
            nativeValue: undefined,
            injectedError: { errorMessage: 'Not a number' } as InjectedError
        };

        testItem.attachToSendValues(host, editor, jivsElement);
        editor.dispatchEvent(new Event('change'));

        expect(host.getValue()).toBeUndefined();
        expect(host.getTextValue()).toBe('abc');
        expect(host.getInjectedError()).toEqual({ errorMessage: 'Not a number' });
    });
});
