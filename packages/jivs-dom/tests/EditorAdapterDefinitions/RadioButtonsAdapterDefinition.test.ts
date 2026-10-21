/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { RadioButtonsTextValueAdapter } from '../../src/Adapters/RadioButtonsTextValueAdapter';
import {
    RadioButtonsAdapterDefinition,
    defaultRadioButtonsAdapterKey
} from '../../src/EditorAdapterDefinitions/RadioButtonsAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

function createRadio(name: string, value: string, id?: string): HTMLInputElement
{
    let radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = name;
    radio.value = value;
    if (id)
        radio.id = id;
    return radio;
}

function createGroup(name: string = 'color', values: string[] = ['red', 'green', 'blue'])
{
    let parent = document.createElement('div');
    let radios = values.map((v, i) => createRadio(name, v, `r${i}`));
    radios.forEach((r) => parent.appendChild(r));
    return { parent, radios };
}

// Constructor defaults for key, priority, and presentation.
describe('RadioButtonsAdapterDefinition constructor', () => {
    test('Defaults: key input:radio, priority 80, presentation radiobuttonsEditor', () => {
        let testItem = new RadioButtonsAdapterDefinition();

        expect(defaultRadioButtonsAdapterKey).toBe('input:radio');
        expect(testItem.adapterKey).toBe('input:radio');
        expect(testItem.priority).toBe(80);
        expect(testItem.recommendedFieldPresentationName).toBe('radiobuttonsEditor');
        expect(testItem.defaultFieldPresentationName()).toBe('radiobuttonsEditor');
    });

    test('Supplied key, priority and presentation name win, including null and priority 0', () => {
        let testItem = new RadioButtonsAdapterDefinition('mine', 0, 'Other');
        let nullName = new RadioButtonsAdapterDefinition(undefined, 80, null);

        expect(testItem.adapterKey).toBe('mine');
        expect(testItem.priority).toBe(0);
        expect(testItem.recommendedFieldPresentationName).toBe('Other');
        expect(nullName.recommendedFieldPresentationName).toBeNull();
    });
});

// Only radio inputs match.
describe('RadioButtonsAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('Matches radio inputs only', () => {
        let testItem = new RadioButtonsAdapterDefinition();
        let text = document.createElement('input');

        expect(testItem.matches(valueHost, createRadio('g', 'a'))).toBe(true);
        expect(testItem.matches(valueHost, text)).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });
});

// The text adapter spans all sibling radios with the same name.
describe('RadioButtonsAdapterDefinition.createTextValueAdapter', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('Returns a RadioButtonsTextValueAdapter that reads and writes across the group', () => {
        let testItem = new RadioButtonsAdapterDefinition();
        let { radios } = createGroup();
        let adapter = testItem.createTextValueAdapter(valueHost, radios[0], radios[0] as unknown as IJivsElement);

        expect(adapter).toBeInstanceOf(RadioButtonsTextValueAdapter);
        expect(adapter.readTextValue()).toBeUndefined();
        radios[2].checked = true;
        expect(adapter.readTextValue()).toBe('blue');
        adapter.writeTextValue('green');
        expect(radios.map((r) => r.checked)).toEqual([false, true, false]);
        adapter.writeTextValue(undefined);
        expect(radios.map((r) => r.checked)).toEqual([false, false, false]);
    });

    test('Ignores radios with a different name in the same parent', () => {
        let testItem = new RadioButtonsAdapterDefinition();
        let { parent, radios } = createGroup('color');
        let other = createRadio('size', 'red');
        other.checked = true;
        parent.appendChild(other);
        let adapter = testItem.createTextValueAdapter(valueHost, radios[0], radios[0] as unknown as IJivsElement);

        expect(adapter.readTextValue()).toBeUndefined();
        adapter.writeTextValue('red');
        expect(radios[0].checked).toBe(true);
        expect(other.checked).toBe(true);
    });

    test('A radio without a name or parent forms a group of one', () => {
        let testItem = new RadioButtonsAdapterDefinition();
        let lone = createRadio('', 'solo');
        let adapter = testItem.createTextValueAdapter(valueHost, lone, lone as unknown as IJivsElement);

        lone.checked = true;

        expect(adapter.readTextValue()).toBe('solo');
    });

    test('Throws when the editor is not a radio input', () => {
        let testItem = new RadioButtonsAdapterDefinition();
        let text = document.createElement('input');
        let div = document.createElement('div');

        expect(() => testItem.createTextValueAdapter(valueHost, text, text as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'input:radio' requires input type 'radio'.`));
        expect(() => testItem.createTextValueAdapter(valueHost, div, div as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'input:radio' requires input type 'radio'.`));
    });

    test('The error names a custom adapterKey', () => {
        let testItem = new RadioButtonsAdapterDefinition('custom');
        let div = document.createElement('div');

        expect(() => testItem.createTextValueAdapter(valueHost, div, div as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'custom' requires input type 'radio'.`));
    });
});

// Inherited from InputAdapterDefinition.
describe('RadioButtonsAdapterDefinition inherited behavior', () => {
    test('createValueAdapter returns null', () => {
        let testItem = new RadioButtonsAdapterDefinition();
        let radio = createRadio('g', 'a');

        expect(testItem.createValueAdapter(createStubFieldValueHost('F'), radio, radio as unknown as IJivsElement))
            .toBeNull();
    });

    test('attachToSendValues sends the group text on change of the registered radio only', () => {
        let testItem = new RadioButtonsAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: new RecordingLoggingService() } as unknown as IJivsServices
        });
        let { radios } = createGroup();
        let calls: any[] = [];
        let host = createStubFieldValueHost('Field1') as any;
        host.setTextValue = (v: string, o: any) => calls.push({ v, o });
        let jivsElement = radios[0] as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, radios[0], jivsElement);

        testItem.attachToSendValues(host, radios[0], jivsElement, { duringEdit: true });
        radios[1].checked = true;
        radios[1].dispatchEvent(new Event('change'));   // listener is not on this radio
        expect(calls).toEqual([]);
        radios[0].dispatchEvent(new Event('change'));

        expect(calls).toEqual([{ v: 'green', o: { validate: true, duringEdit: false } }]);
    });
});

// Integration with the real FieldValueHost.
describe('RadioButtonsAdapterDefinition integration with real FieldValueHost', () => {
    test('A change on the registered radio sets the FieldValueHost text to the checked radio value', () => {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new RadioButtonsAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let { radios } = createGroup();
        let jivsElement = radios[0] as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, radios[0], jivsElement);

        testItem.attachToSendValues(host, radios[0], jivsElement);
        radios[2].checked = true;
        radios[0].dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('blue');
    });
});
