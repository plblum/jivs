/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { FileInputTextValueAdapter } from '../../src/Adapters/FileInputTextValueAdapter';
import {
    FileInputAdapterDefinition,
    defaultFileInputAdapterKey
} from '../../src/EditorAdapterDefinitions/FileInputAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

function createFileInput(): HTMLInputElement
{
    let input = document.createElement('input');
    input.type = 'file';
    input.id = 'fileId';
    return input;
}

// jsdom cannot assign files directly, so replace the files property.
function setSelectedFiles(element: HTMLInputElement, names: string[]): void
{
    Object.defineProperty(element, 'files', {
        configurable: true,
        value: names.map((n) => new File(['x'], n))
    });
}

function createRecordingValueHost(): any
{
    let host = createStubFieldValueHost('Field1', 'fieldId') as any;
    host.textCalls = [];
    host.setTextValue = (value: string, options: any) => { host.textCalls.push({ value: value, options: options }); };
    return host;
}

// Constructor defaults for key, priority, and presentation.
describe('FileInputAdapterDefinition constructor', () => {
    test('Defaults: key input:file, priority 80, presentation fileInputEditor', () => {
        let testItem = new FileInputAdapterDefinition();

        expect(defaultFileInputAdapterKey).toBe('input:file');
        expect(testItem.adapterKey).toBe('input:file');
        expect(testItem.priority).toBe(80);
        expect(testItem.recommendedFieldPresentationName).toBe('fileInputEditor');
        expect(testItem.defaultFieldPresentationName()).toBe('fileInputEditor');
    });

    test('Supplied key, priority and presentation name win, including null and priority 0', () => {
        let testItem = new FileInputAdapterDefinition('mine', 0, 'Other');
        let nullName = new FileInputAdapterDefinition(undefined, 80, null);

        expect(testItem.adapterKey).toBe('mine');
        expect(testItem.priority).toBe(0);
        expect(testItem.recommendedFieldPresentationName).toBe('Other');
        expect(nullName.recommendedFieldPresentationName).toBeNull();
    });
});

// Only file inputs match.
describe('FileInputAdapterDefinition.matches', () => {
    test('Matches input type=file only', () => {
        let testItem = new FileInputAdapterDefinition();
        let valueHost = createStubFieldValueHost('Field1');
        let text = document.createElement('input');

        expect(testItem.matches(valueHost, createFileInput())).toBe(true);
        expect(testItem.matches(valueHost, text)).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });
});

// The text adapter reports selected file names joined by a pipe.
describe('FileInputAdapterDefinition adapters', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('createTextValueAdapter returns a FileInputTextValueAdapter reading file names', () => {
        let testItem = new FileInputAdapterDefinition();
        let input = createFileInput();
        let adapter = testItem.createTextValueAdapter(valueHost, input, input as unknown as IJivsElement)!;

        expect(adapter).toBeInstanceOf(FileInputTextValueAdapter);
        expect(adapter.readTextValue()).toBe('');
        setSelectedFiles(input, ['a.pdf', 'b.png']);
        expect(adapter.readTextValue()).toBe('a.pdf|b.png');
    });

    test('Writing through the adapter does nothing', () => {
        let testItem = new FileInputAdapterDefinition();
        let input = createFileInput();
        setSelectedFiles(input, ['a.pdf']);
        let adapter = testItem.createTextValueAdapter(valueHost, input, input as unknown as IJivsElement)!;

        adapter.writeTextValue('other.txt');

        expect(adapter.readTextValue()).toBe('a.pdf');
    });

    test('Throws when the editor is not a file input', () => {
        let testItem = new FileInputAdapterDefinition();
        let text = document.createElement('input');
        let div = document.createElement('div');

        expect(() => testItem.createTextValueAdapter(valueHost, text, text as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'input:file' requires input type 'file'.`));
        expect(() => testItem.createTextValueAdapter(valueHost, div, div as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'input:file' requires input type 'file'.`));
    });

    test('The error names a custom adapterKey', () => {
        let testItem = new FileInputAdapterDefinition('custom');
        let div = document.createElement('div');

        expect(() => testItem.createTextValueAdapter(valueHost, div, div as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'custom' requires input type 'file'.`));
    });

    test('createValueAdapter returns null', () => {
        let testItem = new FileInputAdapterDefinition();
        let input = createFileInput();

        expect(testItem.createValueAdapter(valueHost, input, input as unknown as IJivsElement)).toBeNull();
    });
});

// Inherited event wiring from InputAdapterDefinition.
describe('FileInputAdapterDefinition event wiring', () => {
    function setup()
    {
        let testItem = new FileInputAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: new RecordingLoggingService() } as unknown as IJivsServices
        });
        let input = createFileInput();
        let jivsElement = input as unknown as IJivsElement;
        let host = createRecordingValueHost();
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, input, jivsElement)!;
        return { testItem, input, jivsElement, host };
    }

    test('change sends the file names; input is not wired by default', () => {
        let { testItem, input, jivsElement, host } = setup();

        testItem.attachToSendValues(host, input, jivsElement);
        setSelectedFiles(input, ['a.pdf', 'b.png']);
        input.dispatchEvent(new Event('input'));
        expect(host.textCalls).toEqual([]);
        input.dispatchEvent(new Event('change'));

        expect(host.textCalls).toEqual([
            { value: 'a.pdf|b.png', options: { validate: true, duringEdit: false } }
        ]);
    });

    test('Clearing the selection sends an empty string', () => {
        let { testItem, input, jivsElement, host } = setup();

        testItem.attachToSendValues(host, input, jivsElement);
        setSelectedFiles(input, []);
        input.dispatchEvent(new Event('change'));

        expect(host.textCalls[0].value).toBe('');
    });

    test('duringEdit also wires input with duringEdit true', () => {
        let { testItem, input, jivsElement, host } = setup();

        testItem.attachToSendValues(host, input, jivsElement, { duringEdit: true });
        setSelectedFiles(input, ['a.pdf']);
        input.dispatchEvent(new Event('input'));

        expect(host.textCalls).toEqual([{ value: 'a.pdf', options: { validate: true, duringEdit: true } }]);
    });
});

// Integration with the real FieldValueHost.
describe('FileInputAdapterDefinition integration with real FieldValueHost', () => {
    test('A change event updates the FieldValueHost text value with the file names', () => {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new FileInputAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let input = createFileInput();
        let jivsElement = input as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, input, jivsElement)!;

        testItem.attachToSendValues(host, input, jivsElement);
        setSelectedFiles(input, ['invoice.pdf', 'photo.png']);
        input.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('invoice.pdf|photo.png');
    });
});
