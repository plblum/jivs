/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { CheckboxTextValueAdapter } from '../../src/Adapters/CheckboxTextValueAdapter';
import {
    CheckboxAdapterDefinition,
    defaultCheckboxAdapterKey
} from '../../src/EditorAdapterDefinitions/CheckboxAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

function createCheckbox(value: string = 'yes'): HTMLInputElement
{
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = value;
    checkbox.id = 'checkId';
    return checkbox;
}

function createRecordingValueHost(): any
{
    let host = createStubFieldValueHost('Field1', 'fieldId') as any;
    host.textCalls = [];
    host.setTextValue = (value: string, options: any) => { host.textCalls.push({ value: value, options: options }); };
    return host;
}

// Constructor defaults for key, priority, and presentation.
describe('CheckboxAdapterDefinition constructor', () => {
    test('Defaults: key input:checkbox, priority 80, presentation checkboxEditor', () => {
        let testItem = new CheckboxAdapterDefinition();

        expect(defaultCheckboxAdapterKey).toBe('input:checkbox');
        expect(testItem.adapterKey).toBe('input:checkbox');
        expect(testItem.priority).toBe(80);
        expect(testItem.recommendedFieldPresentationName).toBe('checkboxEditor');
        expect(testItem.defaultFieldPresentationName()).toBe('checkboxEditor');
    });

    test('Supplied key, priority and presentation name win, including null and priority 0', () => {
        let testItem = new CheckboxAdapterDefinition('mine', 0, 'Other');
        let nullName = new CheckboxAdapterDefinition(undefined, 80, null);

        expect(testItem.adapterKey).toBe('mine');
        expect(testItem.priority).toBe(0);
        expect(testItem.recommendedFieldPresentationName).toBe('Other');
        expect(nullName.recommendedFieldPresentationName).toBeNull();
    });
});

// Only checkbox inputs match.
describe('CheckboxAdapterDefinition.matches', () => {
    test('Matches checkbox inputs only', () => {
        let testItem = new CheckboxAdapterDefinition();
        let valueHost = createStubFieldValueHost('Field1');
        let radio = document.createElement('input');
        radio.type = 'radio';

        expect(testItem.matches(valueHost, createCheckbox())).toBe(true);
        expect(testItem.matches(valueHost, radio)).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('input'))).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });
});

// The text adapter reports value when checked, empty string otherwise.
describe('CheckboxAdapterDefinition.createTextValueAdapter', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('Returns a CheckboxTextValueAdapter that reads and writes the checked state', () => {
        let testItem = new CheckboxAdapterDefinition();
        let checkbox = createCheckbox('yes');
        let adapter = testItem.createTextValueAdapter(valueHost, checkbox, checkbox as unknown as IJivsElement);

        expect(adapter).toBeInstanceOf(CheckboxTextValueAdapter);
        expect(adapter.readTextValue()).toBe('');
        adapter.writeTextValue('yes');
        expect(checkbox.checked).toBe(true);
        expect(adapter.readTextValue()).toBe('yes');
        adapter.writeTextValue('no');
        expect(checkbox.checked).toBe(false);
        adapter.writeTextValue('yes');
        adapter.writeTextValue(undefined);
        expect(checkbox.checked).toBe(false);
    });

    test('A checkbox with no value attribute uses the browser default "on"', () => {
        let testItem = new CheckboxAdapterDefinition();
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        let adapter = testItem.createTextValueAdapter(valueHost, checkbox, checkbox as unknown as IJivsElement);

        checkbox.checked = true;

        expect(adapter.readTextValue()).toBe('on');
    });

    test('Throws when the editor is not a checkbox input', () => {
        let testItem = new CheckboxAdapterDefinition();
        let text = document.createElement('input');
        let div = document.createElement('div');

        expect(() => testItem.createTextValueAdapter(valueHost, text, text as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'input:checkbox' requires input type 'checkbox'.`));
        expect(() => testItem.createTextValueAdapter(valueHost, div, div as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'input:checkbox' requires input type 'checkbox'.`));
    });

    test('The error names a custom adapterKey', () => {
        let testItem = new CheckboxAdapterDefinition('custom');
        let div = document.createElement('div');

        expect(() => testItem.createTextValueAdapter(valueHost, div, div as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'custom' requires input type 'checkbox'.`));
    });
});

// Inherited from InputAdapterDefinition.
describe('CheckboxAdapterDefinition inherited behavior', () => {
    test('createValueAdapter returns null', () => {
        let testItem = new CheckboxAdapterDefinition();
        let checkbox = createCheckbox();

        expect(testItem.createValueAdapter(createStubFieldValueHost('F'), checkbox, checkbox as unknown as IJivsElement))
            .toBeNull();
    });

    test('attachToSendValues sends the checkbox text on change; input event only when duringEdit', () => {
        let testItem = new CheckboxAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: new RecordingLoggingService() } as unknown as IJivsServices
        });
        let checkbox = createCheckbox('yes');
        let jivsElement = checkbox as unknown as IJivsElement;
        let host = createRecordingValueHost();
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, checkbox, jivsElement);

        testItem.attachToSendValues(host, checkbox, jivsElement);
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('input'));
        expect(host.textCalls).toEqual([]);
        checkbox.dispatchEvent(new Event('change'));
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));

        expect(host.textCalls).toEqual([
            { value: 'yes', options: { validate: true, duringEdit: false } },
            { value: '', options: { validate: true, duringEdit: false } }
        ]);
    });

    test('duringEdit wires the input event with duringEdit true', () => {
        let testItem = new CheckboxAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: new RecordingLoggingService() } as unknown as IJivsServices
        });
        let checkbox = createCheckbox('yes');
        let jivsElement = checkbox as unknown as IJivsElement;
        let host = createRecordingValueHost();
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, checkbox, jivsElement);

        testItem.attachToSendValues(host, checkbox, jivsElement, { duringEdit: true });
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('input'));

        expect(host.textCalls).toEqual([{ value: 'yes', options: { validate: true, duringEdit: true } }]);
    });
});

// Integration with the real FieldValueHost.
describe('CheckboxAdapterDefinition integration with real FieldValueHost', () => {
    test('Checking and unchecking updates the FieldValueHost text value', () => {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new CheckboxAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let checkbox = createCheckbox('yes');
        let jivsElement = checkbox as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, checkbox, jivsElement);

        testItem.attachToSendValues(host, checkbox, jivsElement);
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        expect(host.getTextValue()).toBe('yes');
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('');
    });
});
