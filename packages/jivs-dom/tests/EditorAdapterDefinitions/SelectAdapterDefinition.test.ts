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
import { SelectTextValueAdapter } from '../../src/Adapters/SelectTextValueAdapter';
import {
    SelectAdapterDefinition,
    defaultSelectAdapterKey
} from '../../src/EditorAdapterDefinitions/SelectAdapterDefinition';
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
class Publicify_SelectAdapterDefinition extends SelectAdapterDefinition
{
    public publicify_attachToSendValuesCore(valueHost: any, editor: HTMLElement,
        jivsElement: IJivsElement, options: any): void
    {
        this.attachToSendValuesCore(valueHost, editor, jivsElement, options);
    }
}

function createSelect(): HTMLSelectElement
{
    let select = document.createElement('select');
    select.id = 'selectId';
    for (let v of ['a', 'b', 'c'])
    {
        let option = document.createElement('option');
        option.value = v;
        option.text = v.toUpperCase();
        select.appendChild(option);
    }
    return select;
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
    let testItem = new Publicify_SelectAdapterDefinition();
    let logger = new RecordingLoggingService();
    testItem.domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    let select = createSelect();
    let jivsElement = select as unknown as IJivsElement;
    let valueHost = createRecordingValueHost();
    jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(valueHost, select, jivsElement)!;
    return { testItem, logger, select, jivsElement, valueHost };
}

// Constructor defaults for key, priority, and presentation.
describe('SelectAdapterDefinition constructor', () => {
    test('Defaults: key select, priority 80, presentation selectEditor', () => {
        let testItem = new SelectAdapterDefinition();

        expect(defaultSelectAdapterKey).toBe('select');
        expect(testItem.adapterKey).toBe('select');
        expect(testItem.priority).toBe(80);
        expect(testItem.recommendedFieldPresentationName).toBe('selectEditor');
        expect(testItem.defaultFieldPresentationName()).toBe('selectEditor');
    });

    test('Supplied key, priority and presentation name win, including null and priority 0', () => {
        let testItem = new SelectAdapterDefinition('mine', 0, 'Other');
        let nullName = new SelectAdapterDefinition(undefined, 80, null);

        expect(testItem.adapterKey).toBe('mine');
        expect(testItem.priority).toBe(0);
        expect(testItem.recommendedFieldPresentationName).toBe('Other');
        expect(nullName.recommendedFieldPresentationName).toBeNull();
    });
});

// Only select elements match.
describe('SelectAdapterDefinition.matches', () => {
    test('Matches select only', () => {
        let testItem = new SelectAdapterDefinition();
        let valueHost = createStubFieldValueHost('Field1');

        expect(testItem.matches(valueHost, createSelect())).toBe(true);
        expect(testItem.matches(valueHost, document.createElement('input'))).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('textarea'))).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('option'))).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });

    test('A multiple select still matches', () => {
        let select = createSelect();
        select.multiple = true;

        expect(new SelectAdapterDefinition().matches(createStubFieldValueHost('F'), select)).toBe(true);
    });
});

// Adapter creation: a text adapter, no native adapter.
describe('SelectAdapterDefinition adapters', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('createTextValueAdapter returns a SelectTextValueAdapter that reads and writes the select', () => {
        let testItem = new SelectAdapterDefinition();
        let select = createSelect();
        let adapter = testItem.createTextValueAdapter(valueHost, select, select as unknown as IJivsElement)!;

        expect(adapter).toBeInstanceOf(SelectTextValueAdapter);
        expect(adapter.readTextValue()).toBe('a');
        adapter.writeTextValue('c');
        expect(select.value).toBe('c');
        adapter.writeTextValue(undefined);
        expect(select.value).toBe('');
        expect(adapter.readTextValue()).toBe('');
    });

    test('Writing a value with no matching option deselects the select', () => {
        let testItem = new SelectAdapterDefinition();
        let select = createSelect();
        let adapter = testItem.createTextValueAdapter(valueHost, select, select as unknown as IJivsElement)!;

        adapter.writeTextValue('zzz');

        expect(select.selectedIndex).toBe(-1);
        expect(adapter.readTextValue()).toBe('');
    });

    test('Each call creates a new adapter', () => {
        let testItem = new SelectAdapterDefinition();
        let select = createSelect();
        let jivsElement = select as unknown as IJivsElement;

        expect(testItem.createTextValueAdapter(valueHost, select, jivsElement))
            .not.toBe(testItem.createTextValueAdapter(valueHost, select, jivsElement));
    });

    test('createValueAdapter returns null', () => {
        let testItem = new SelectAdapterDefinition();
        let select = createSelect();

        expect(testItem.createValueAdapter(valueHost, select, select as unknown as IJivsElement)).toBeNull();
    });
});

// attachToSendValuesCore wires only change, regardless of the duringEdit option.
describe('SelectAdapterDefinition.attachToSendValuesCore', () => {
    test('change sends the selected value with duringEdit false', () => {
        let { testItem, select, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, select, jivsElement, {});
        select.value = 'b';
        select.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([{ value: 'b', options: { validate: true, duringEdit: false } }]);
    });

    test('duringEdit does not wire the input event', () => {
        let { testItem, select, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, select, jivsElement, { duringEdit: true });
        select.dispatchEvent(new Event('input'));

        expect(valueHost.textCalls).toEqual([]);
    });

    test('Without a text adapter, a change logs a Warn and sends nothing', () => {
        let { testItem, logger, select, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = undefined;

        testItem.publicify_attachToSendValuesCore(valueHost, select, jivsElement, {});
        select.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([]);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details!.message).toBe(
            `No text value adapter found on the element 'selectId' associated with ValueHost 'Field1'.`);
    });

    test('attachToSendValues (public) wires change and logs the Debug entry', () => {
        let { testItem, logger, select, jivsElement, valueHost } = setup();

        testItem.attachToSendValues(valueHost, select, jivsElement);
        select.value = 'c';
        select.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls.length).toBe(1);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Debug);
        expect(logger.calls[0].details!.identity).toBe('select');
    });
});

// sendValue is called directly (for example to initialize from the editor) without needing an event.
describe('SelectAdapterDefinition.sendValue', () => {
    test('Defaults to duringEdit false and validate true', () => {
        let { testItem, select, jivsElement, valueHost } = setup();
        select.value = 'b';

        testItem.sendValue(valueHost, select, jivsElement);

        expect(valueHost.textCalls).toEqual([{ value: 'b', options: { validate: true, duringEdit: false } }]);
    });

    test('validate false and duringEdit true are passed along', () => {
        let { testItem, select, jivsElement, valueHost } = setup();
        select.value = 'c';

        testItem.sendValue(valueHost, select, jivsElement, { duringEdit: true, validate: false });

        expect(valueHost.textCalls).toEqual([{ value: 'c', options: { validate: false, duringEdit: true } }]);
    });
});

// Inherited identification and ARIA defaults.
describe('SelectAdapterDefinition inherited behavior', () => {
    test('identify methods return the element and ARIA updaters are the editor updaters', () => {
        let testItem = new SelectAdapterDefinition();
        let select = createSelect();
        let valueHost = createStubFieldValueHost('Field1');

        expect(testItem.identifyJivsElement(valueHost, select)).toBe(select);
        expect(testItem.identifyEditor(valueHost, select as unknown as IJivsElement)).toBe(select);
        expect(testItem.getStaticAriaUpdater()).toBeInstanceOf(EditorAriaStaticUpdater);
        expect(testItem.getAriaValidationStateUpdater()).toBeInstanceOf(EditorAriaValidationStateUpdater);
    });
});

// Integration with the real FieldValueHost.
describe('SelectAdapterDefinition integration with real FieldValueHost', () => {
    test('A change event on the select updates the FieldValueHost text value', () => {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new SelectAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let select = createSelect();
        let jivsElement = select as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, select, jivsElement)!;

        testItem.attachToSendValues(host, select, jivsElement);
        select.value = 'c';
        select.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('c');
    });
});
