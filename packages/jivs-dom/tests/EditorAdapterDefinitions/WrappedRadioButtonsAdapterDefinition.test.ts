/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { WrappedRadioButtonsAriaStaticUpdater } from '../../src/Aria/WrappedRadioButtonsAriaStaticUpdater';
import { defaultWrappedRadioButtonsPresentationName } from '../../src/FieldPresentations/WrappedRadioButtonsPresentation';
import { RadioButtonsAdapterDefinition } from '../../src/EditorAdapterDefinitions/RadioButtonsAdapterDefinition';
import { WrappedRadioButtonsAdapterDefinition } from '../../src/EditorAdapterDefinitions/WrappedRadioButtonsAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost } from '../TestSupport/mocks';

/**
 * Exposes protected members of the definition under test.
 */
class Publicify_WrappedRadioButtonsAdapterDefinition extends WrappedRadioButtonsAdapterDefinition
{
    public get publicify_editorSelector(): string
    {
        return this.editorSelector;
    }
    public get publicify_inputType(): string
    {
        return this.inputType;
    }
    public publicify_createChild()
    {
        return this.createChildEditorDefinitionAdapter();
    }
}

function createWrapper(wrapperClass: string = 'wrapped', values: string[] = ['red', 'green', 'blue'],
    wrapEachInLabel: boolean = false)
{
    let wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    wrapper.id = 'wrapperId';
    let nested = document.createElement('fieldset');
    let radios = values.map((v) => {
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'color';
        radio.value = v;
        if (wrapEachInLabel)
        {
            let label = document.createElement('label');
            label.appendChild(radio);
            nested.appendChild(label);
        }
        else
            nested.appendChild(radio);
        return radio;
    });
    wrapper.appendChild(nested);
    return { wrapper, radios };
}

function createRealHost()
{
    let services = createJivsServicesForTesting();
    let host = new ValueHostsManager({
        services: services,
        valueHostConfigs: [<FieldValueHostConfig>{
            valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
        }]
    }).getFieldValueHost('Field1')!;
    return { services, host };
}

// Constructor defaults and overrides.
describe('WrappedRadioButtonsAdapterDefinition constructor', () => {
    test('Defaults: key wrapped:input:radio, priority 80, null wrapperSelector, wrapped radio presentation', () => {
        let testItem = new Publicify_WrappedRadioButtonsAdapterDefinition();

        expect(testItem.adapterKey).toBe('wrapped:input:radio');
        expect(testItem.priority).toBe(80);
        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBe(defaultWrappedRadioButtonsPresentationName);
        expect(testItem.publicify_inputType).toBe('radio');
    });

    test('Explicit values are used, including priority 0', () => {
        let testItem = new Publicify_WrappedRadioButtonsAdapterDefinition('myKey', 0, 'div.w', 'MyPresentation');

        expect(testItem.adapterKey).toBe('myKey');
        expect(testItem.priority).toBe(0);
        expect(testItem.wrapperSelector).toBe('div.w');
        expect(testItem.recommendedFieldPresentationName).toBe('MyPresentation');
    });

    test('Explicit null wrapperSelector and presentation name are honored', () => {
        let testItem = new Publicify_WrappedRadioButtonsAdapterDefinition(undefined, undefined, null, null);

        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBeNull();
    });
});

// Selector, child and ARIA updater.
describe('WrappedRadioButtonsAdapterDefinition collaborators', () => {
    test('editorSelector selects only type=radio', () => {
        expect(new Publicify_WrappedRadioButtonsAdapterDefinition().publicify_editorSelector)
            .toBe('input[type="radio"]');
    });

    test('The child is a new RadioButtonsAdapterDefinition each call', () => {
        let testItem = new Publicify_WrappedRadioButtonsAdapterDefinition();

        let first = testItem.publicify_createChild();
        let second = testItem.publicify_createChild();

        expect(first).toBeInstanceOf(RadioButtonsAdapterDefinition);
        expect(first).not.toBe(second);
        expect(first.adapterKey).toBe('input:radio');
    });

    test('getStaticAriaUpdater returns a new WrappedRadioButtonsAriaStaticUpdater each call', () => {
        let testItem = new WrappedRadioButtonsAdapterDefinition();

        let first = testItem.getStaticAriaUpdater();
        let second = testItem.getStaticAriaUpdater();

        expect(first).toBeInstanceOf(WrappedRadioButtonsAriaStaticUpdater);
        expect(first).not.toBe(second);
    });
});

// matches uses the wrapper filter, the radio search and the child's own checks.
describe('WrappedRadioButtonsAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1', 'fieldId');

    function setup(testItem = new Publicify_WrappedRadioButtonsAdapterDefinition())
    {
        testItem.domServices = createMockJivsDomServices();
        return testItem;
    }

    test('Matches a wrapper with nested radio buttons, including a single one', () => {
        let testItem = setup();

        expect(testItem.matches(valueHost, createWrapper().wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('wrapped', ['only']).wrapper)).toBe(true);
    });

    test('Rejects checkbox, text and untyped inputs, and empty wrappers', () => {
        let testItem = setup();
        let wrapper = document.createElement('div');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        wrapper.appendChild(checkbox);

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
        wrapper.replaceChildren(document.createElement('input'));
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
    });

    test('wrapperSelector filters wrappers', () => {
        let testItem = setup(new Publicify_WrappedRadioButtonsAdapterDefinition(undefined, undefined, 'div.wrapped'));

        expect(testItem.matches(valueHost, createWrapper('wrapped').wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('other').wrapper)).toBe(false);
    });
});

// identifyEditor is overridden to return the first radio, throwing a CodingError if none.
describe('WrappedRadioButtonsAdapterDefinition.identifyEditor', () => {
    let valueHost = createStubFieldValueHost('Field1', 'fieldId');

    test('Returns the first radio in document order, not the wrapper', () => {
        let testItem = new WrappedRadioButtonsAdapterDefinition();
        let { wrapper, radios } = createWrapper();

        expect(testItem.identifyEditor(valueHost, wrapper as unknown as IJivsElement)).toBe(radios[0]);
    });

    test('Throws a CodingError when the wrapper has no radio button', () => {
        let testItem = new WrappedRadioButtonsAdapterDefinition();
        let wrapper = document.createElement('div');
        wrapper.appendChild(document.createElement('input'));

        expect(() => testItem.identifyEditor(valueHost, wrapper as unknown as IJivsElement))
            .toThrow(CodingError);
        expect(() => testItem.identifyEditor(valueHost, wrapper as unknown as IJivsElement))
            .toThrow('No radio button found in the wrapper. required');
    });

    test('Does not require domServices, since no logging is performed', () => {
        let testItem = new WrappedRadioButtonsAdapterDefinition();
        let wrapper = document.createElement('div');

        expect(() => testItem.identifyEditor(valueHost, wrapper as unknown as IJivsElement))
            .toThrow(CodingError);
    });
});

// Integration: real FieldValueHost, real DOM, real child.
describe('WrappedRadioButtonsAdapterDefinition integration', () => {
    test('Text adapter spans all radios in the group; a change on the first radio updates the FieldValueHost', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedRadioButtonsAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, radios } = createWrapper();
        let jivsElement = wrapper as unknown as IJivsElement;
        let editor = testItem.identifyEditor(host, jivsElement);

        expect(testItem.identifyJivsElement(host, wrapper)).toBe(wrapper);
        let adapter = testItem.createTextValueAdapter(host, editor, jivsElement)!;
        jivsElement.jivsTextValueAdapter = adapter;
        expect(adapter.readTextValue()).toBeUndefined();
        adapter.writeTextValue('green');
        expect(radios.map((r) => r.checked)).toEqual([false, true, false]);

        testItem.attachToSendValues(host, editor, jivsElement);
        radios[0].dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('green');
        expect(testItem.createValueAdapter(host, editor, jivsElement)).toBeNull();
    });

    test('matches then identifyEditor work together on the same wrapper', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedRadioButtonsAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, radios } = createWrapper();

        expect(testItem.matches(host, wrapper)).toBe(true);
        expect(testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toBe(radios[0]);
    });

    test('Radios each wrapped in their own label are not one group: the adapter sees only the first radio', () => {
        // RadioButtonsTextValueAdapter requires radios to share a parent element.
        let { services, host } = createRealHost();
        let testItem = new WrappedRadioButtonsAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, radios } = createWrapper('wrapped', ['red', 'green', 'blue'], true);
        let jivsElement = wrapper as unknown as IJivsElement;
        let adapter = testItem.createTextValueAdapter(host, testItem.identifyEditor(host, jivsElement), jivsElement)!;

        adapter.writeTextValue('green');
        radios[2].checked = true;

        expect(radios.map((r) => r.checked)).toEqual([false, false, true]);
        expect(adapter.readTextValue()).toBeUndefined();
    });
});
