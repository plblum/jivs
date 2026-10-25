/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { EditorAriaStaticUpdater } from '../../src/Aria/EditorAriaStaticUpdater';
import { EditorAriaValidationStateUpdater } from '../../src/Aria/EditorAriaValidationStateUpdater';
import { TextAreaTextValueAdapter } from '../../src/Adapters/TextAreaTextValueAdapter';
import {
    TextAreaAdapterDefinition,
    defaultTextAreaAdapterKey
} from '../../src/EditorAdapterDefinitions/TextAreaAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

/**
 * Exposes the protected attachToSendValuesCore.
 */
class Publicify_TextAreaAdapterDefinition extends TextAreaAdapterDefinition
{
    public publicify_attachToSendValuesCore(valueHost: any, editor: HTMLElement,
        jivsElement: IJivsElement, options: any): void
    {
        this.attachToSendValuesCore(valueHost, editor, jivsElement, options);
    }
}

function createTextArea(): HTMLTextAreaElement
{
    let element = document.createElement('textarea');
    element.id = 'areaId';
    return element;
}

function createRecordingValueHost(): any
{
    let host = createStubFieldValueHost('Field1', 'fieldId') as any;
    host.textCalls = [];
    host.setTextValue = (value: string, options: any) => { host.textCalls.push({ value: value, options: options }); };
    return host;
}

function setup()
{
    let testItem = new Publicify_TextAreaAdapterDefinition();
    let logger = new RecordingLoggingService();
    testItem.domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    let area = createTextArea();
    let jivsElement = area as unknown as IJivsElement;
    let valueHost = createRecordingValueHost();
    jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(valueHost, area, jivsElement)!;
    return { testItem, logger, area, jivsElement, valueHost };
}

// Constructor defaults for key, priority, and presentation.
describe('TextAreaAdapterDefinition constructor', () => {
    test('Defaults: key textarea, priority 80, presentation textareaEditor', () => {
        let testItem = new TextAreaAdapterDefinition();

        expect(defaultTextAreaAdapterKey).toBe('textarea');
        expect(testItem.adapterKey).toBe('textarea');
        expect(testItem.priority).toBe(80);
        expect(testItem.recommendedFieldPresentationName).toBe('textareaEditor');
        expect(testItem.defaultFieldPresentationName()).toBe('textareaEditor');
    });

    test('Supplied key, priority and presentation name win, including null and priority 0', () => {
        let testItem = new TextAreaAdapterDefinition('mine', 0, 'Other');
        let nullName = new TextAreaAdapterDefinition(undefined, 80, null);

        expect(testItem.adapterKey).toBe('mine');
        expect(testItem.priority).toBe(0);
        expect(testItem.recommendedFieldPresentationName).toBe('Other');
        expect(nullName.recommendedFieldPresentationName).toBeNull();
    });
});

// Only textarea elements match.
describe('TextAreaAdapterDefinition.matches', () => {
    test('Matches textarea only', () => {
        let testItem = new TextAreaAdapterDefinition();
        let valueHost = createStubFieldValueHost('Field1');

        expect(testItem.matches(valueHost, createTextArea())).toBe(true);
        expect(testItem.matches(valueHost, document.createElement('input'))).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('select'))).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });
});

// Adapter creation: a text adapter, no native adapter.
describe('TextAreaAdapterDefinition adapters', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('createTextValueAdapter returns a TextAreaTextValueAdapter that reads and writes the textarea', () => {
        let testItem = new TextAreaAdapterDefinition();
        let area = createTextArea();
        area.value = 'line1\nline2';

        let adapter = testItem.createTextValueAdapter(valueHost, area, area as unknown as IJivsElement)!;

        expect(adapter).toBeInstanceOf(TextAreaTextValueAdapter);
        expect(adapter.readTextValue()).toBe('line1\nline2');
        adapter.writeTextValue('new');
        expect(area.value).toBe('new');
        adapter.writeTextValue(undefined);
        expect(area.value).toBe('');
    });

    test('Each call creates a new adapter', () => {
        let testItem = new TextAreaAdapterDefinition();
        let area = createTextArea();
        let jivsElement = area as unknown as IJivsElement;

        expect(testItem.createTextValueAdapter(valueHost, area, jivsElement))
            .not.toBe(testItem.createTextValueAdapter(valueHost, area, jivsElement));
    });

    test('createValueAdapter returns null', () => {
        let testItem = new TextAreaAdapterDefinition();
        let area = createTextArea();

        expect(testItem.createValueAdapter(valueHost, area, area as unknown as IJivsElement)).toBeNull();
    });
});

// attachToSendValuesCore wires change always and input only when duringEdit is set.
describe('TextAreaAdapterDefinition.attachToSendValuesCore', () => {
    test('change sends the text with duringEdit false; input is not wired by default', () => {
        let { testItem, area, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, area, jivsElement, {});
        area.value = 'one';
        area.dispatchEvent(new Event('input'));
        expect(valueHost.textCalls).toEqual([]);
        area.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([{ value: 'one', options: { validate: true, duringEdit: false } }]);
    });

    test('duringEdit also wires input with duringEdit true', () => {
        let { testItem, area, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, area, jivsElement, { duringEdit: true });
        area.value = 'two';
        area.dispatchEvent(new Event('input'));
        area.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([
            { value: 'two', options: { validate: true, duringEdit: true } },
            { value: 'two', options: { validate: true, duringEdit: false } }
        ]);
    });

    test('duringEdit false does not wire input', () => {
        let { testItem, area, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, area, jivsElement, { duringEdit: false });
        area.dispatchEvent(new Event('input'));

        expect(valueHost.textCalls).toEqual([]);
    });

    test('Without a text adapter, a change logs a Warn and sends nothing', () => {
        let { testItem, logger, area, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = undefined;

        testItem.publicify_attachToSendValuesCore(valueHost, area, jivsElement, {});
        area.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([]);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details!.message).toBe(
            `No text value adapter found on the element 'areaId' associated with ValueHost 'Field1'.`);
    });

    test('attachToSendValues (public) wires events and logs the Debug entry', () => {
        let { testItem, logger, area, jivsElement, valueHost } = setup();

        testItem.attachToSendValues(valueHost, area, jivsElement, { duringEdit: true });
        area.value = 'x';
        area.dispatchEvent(new Event('input'));

        expect(valueHost.textCalls.length).toBe(1);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Debug);
        expect(logger.calls[0].details!.identity).toBe('textarea');
    });
});

// sendValue is called directly (for example to initialize from the editor) without needing an event.
describe('TextAreaAdapterDefinition.sendValue', () => {
    test('Defaults to duringEdit false and validate true', () => {
        let { testItem, area, jivsElement, valueHost } = setup();
        area.value = 'abc';

        testItem.sendValue(valueHost, area, jivsElement);

        expect(valueHost.textCalls).toEqual([{ value: 'abc', options: { validate: true, duringEdit: false } }]);
    });

    test('validate false and duringEdit true are passed along', () => {
        let { testItem, area, jivsElement, valueHost } = setup();
        area.value = 'xyz';

        testItem.sendValue(valueHost, area, jivsElement, { duringEdit: true, validate: false });

        expect(valueHost.textCalls).toEqual([{ value: 'xyz', options: { validate: false, duringEdit: true } }]);
    });
});

// Inherited identification, event attachment and ARIA defaults.
describe('TextAreaAdapterDefinition inherited behavior', () => {
    test('identify methods return the element and ARIA updaters are the editor updaters', () => {
        let testItem = new TextAreaAdapterDefinition();
        let area = createTextArea();
        let valueHost = createStubFieldValueHost('Field1');

        expect(testItem.identifyJivsElement(valueHost, area)).toBe(area);
        expect(testItem.identifyEditor(valueHost, area as unknown as IJivsElement)).toBe(area);
        expect(testItem.getStaticAriaUpdater()).toBeInstanceOf(EditorAriaStaticUpdater);
        expect(testItem.getAriaValidationStateUpdater()).toBeInstanceOf(EditorAriaValidationStateUpdater);
    });
});

// Integration with the real FieldValueHost.
describe('TextAreaAdapterDefinition integration with real FieldValueHost', () => {
    test('A change event on the textarea updates the FieldValueHost text value', () => {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new TextAreaAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let area = createTextArea();
        let jivsElement = area as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, area, jivsElement)!;

        testItem.attachToSendValues(host, area, jivsElement);
        area.value = 'typed\ntext';
        area.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('typed\ntext');
    });
});
