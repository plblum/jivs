/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { defaultWrappedCheckboxPresentationName } from '../../src/FieldPresentations/WrappedCheckboxPresentation';
import { CheckboxAdapterDefinition } from '../../src/EditorAdapterDefinitions/CheckboxAdapterDefinition';
import { WrappedCheckboxAdapterDefinition } from '../../src/EditorAdapterDefinitions/WrappedCheckboxAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Exposes protected members of the definition under test.
 */
class Publicify_WrappedCheckboxAdapterDefinition extends WrappedCheckboxAdapterDefinition
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

function createWrapper(inputType: string | null = 'checkbox', wrapperClass: string = 'wrapped')
{
    let wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    wrapper.id = 'wrapperId';
    let nested = document.createElement('label');
    let input = document.createElement('input');
    if (inputType !== null)
        input.setAttribute('type', inputType);
    if (inputType !== 'file')
        input.value = 'yes';
    nested.appendChild(input);
    wrapper.appendChild(nested);
    return { wrapper, input };
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
describe('WrappedCheckboxAdapterDefinition constructor', () => {
    test('Defaults: key wrapped:input:checkbox, priority 80, null wrapperSelector, wrapped checkbox presentation', () => {
        let testItem = new Publicify_WrappedCheckboxAdapterDefinition();

        expect(testItem.adapterKey).toBe('wrapped:input:checkbox');
        expect(testItem.priority).toBe(80);
        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBe(defaultWrappedCheckboxPresentationName);
        expect(testItem.publicify_inputType).toBe('checkbox');
    });

    test('Explicit values are used, including priority 0', () => {
        let testItem = new Publicify_WrappedCheckboxAdapterDefinition('myKey', 0, 'div.w', 'MyPresentation');

        expect(testItem.adapterKey).toBe('myKey');
        expect(testItem.priority).toBe(0);
        expect(testItem.wrapperSelector).toBe('div.w');
        expect(testItem.recommendedFieldPresentationName).toBe('MyPresentation');
    });

    test('Explicit null wrapperSelector and presentation name are honored', () => {
        let testItem = new Publicify_WrappedCheckboxAdapterDefinition(undefined, undefined, null, null);

        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBeNull();
    });
});

// Selector and child creation.
describe('WrappedCheckboxAdapterDefinition editor selection', () => {
    test('editorSelector selects only type=checkbox (no untyped inputs)', () => {
        expect(new Publicify_WrappedCheckboxAdapterDefinition().publicify_editorSelector)
            .toBe('input[type="checkbox"]');
    });

    test('The child is a new CheckboxAdapterDefinition each call', () => {
        let testItem = new Publicify_WrappedCheckboxAdapterDefinition();

        let first = testItem.publicify_createChild();
        let second = testItem.publicify_createChild();

        expect(first).toBeInstanceOf(CheckboxAdapterDefinition);
        expect(first).not.toBe(second);
        expect(first.adapterKey).toBe('input:checkbox');
    });
});

// matches uses the wrapper filter, the checkbox search and the child's own checks.
describe('WrappedCheckboxAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1', 'fieldId');

    function setup(testItem = new Publicify_WrappedCheckboxAdapterDefinition())
    {
        testItem.domServices = createMockJivsDomServices();
        return testItem;
    }

    test('Matches a wrapper with a nested checkbox', () => {
        expect(setup().matches(valueHost, createWrapper('checkbox').wrapper)).toBe(true);
    });

    test('Rejects text, untyped, radio and file inputs, and non-inputs', () => {
        let testItem = setup();

        expect(testItem.matches(valueHost, createWrapper('text').wrapper)).toBe(false);
        expect(testItem.matches(valueHost, createWrapper(null).wrapper)).toBe(false);
        expect(testItem.matches(valueHost, createWrapper('radio').wrapper)).toBe(false);
        expect(testItem.matches(valueHost, createWrapper('file').wrapper)).toBe(false);

        let wrapper = document.createElement('div');
        wrapper.appendChild(document.createElement('select'));
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });

    test('wrapperSelector filters wrappers', () => {
        let testItem = setup(new Publicify_WrappedCheckboxAdapterDefinition(undefined, undefined, 'div.wrapped'));

        expect(testItem.matches(valueHost, createWrapper('checkbox', 'wrapped').wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('checkbox', 'other').wrapper)).toBe(false);
    });
});

// Integration: real FieldValueHost, real DOM, real child and real logging.
describe('WrappedCheckboxAdapterDefinition integration', () => {
    test('Wrapper stays the Jivs element; the nested checkbox is the editor', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedCheckboxAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, input } = createWrapper();

        expect(testItem.identifyJivsElement(host, wrapper)).toBe(wrapper);
        expect(testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toBe(input);
    });

    test('Text adapter reads and writes the checked state; change events update the FieldValueHost', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedCheckboxAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, input } = createWrapper();
        let checkbox = input;
        let jivsElement = wrapper as unknown as IJivsElement;
        let editor = testItem.identifyEditor(host, jivsElement);

        let adapter = testItem.createTextValueAdapter(host, editor, jivsElement)!;
        jivsElement.jivsTextValueAdapter = adapter;
        expect(adapter.readTextValue()).toBe('');
        adapter.writeTextValue('yes');
        expect(checkbox.checked).toBe(true);
        expect(adapter.readTextValue()).toBe('yes');

        testItem.attachToSendValues(host, editor, jivsElement);
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));
        expect(host.getTextValue()).toBe('');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('yes');
    });

    test('Missing checkbox logs an Error with the wrapped key and throws', () => {
        let { host } = createRealHost();
        let logger = new RecordingLoggingService();
        let testItem = new WrappedCheckboxAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let { wrapper } = createWrapper('text');

        expect(() => testItem.identifyEditor(host, wrapper as unknown as IJivsElement))
            .toThrow('Editor element not found within the wrapped.');
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect((logger.calls[0].details as any).identity).toBe('wrapped:input:checkbox');
        expect((logger.calls[0].details as any).data).toEqual({ idAttribute: 'wrapperId', valueHostName: 'Field1' });
    });
});
