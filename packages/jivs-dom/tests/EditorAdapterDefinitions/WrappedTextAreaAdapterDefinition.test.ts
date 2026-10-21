/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { defaultWrappedTextAreaPresentationName } from '../../src/FieldPresentations/WrappedTextAreaPresentation';
import { TextAreaAdapterDefinition } from '../../src/EditorAdapterDefinitions/TextAreaAdapterDefinition';
import { defaultWrappedTextAreaAdapterKey, WrappedTextAreaAdapterDefinition } from '../../src/EditorAdapterDefinitions/WrappedTextAreaAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Exposes protected members of the definition under test.
 */
class Publicify_WrappedTextAreaAdapterDefinition extends WrappedTextAreaAdapterDefinition
{
    public get publicify_editorSelector(): string
    {
        return this.editorSelector;
    }
    public publicify_createChild()
    {
        return this.createChildEditorDefinitionAdapter();
    }
}

function createWrapper(wrapperClass: string = 'wrapped')
{
    let wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    wrapper.id = 'wrapperId';
    let nested = document.createElement('span');
    let textarea = document.createElement('textarea');
    nested.appendChild(textarea);
    wrapper.appendChild(nested);
    return { wrapper, textarea };
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
describe('WrappedTextAreaAdapterDefinition constructor', () => {
    test('Defaults: key, priority 80, null wrapperSelector, wrapped textarea presentation', () => {
        let testItem = new Publicify_WrappedTextAreaAdapterDefinition();

        expect(defaultWrappedTextAreaAdapterKey).toBe('wrapped:textarea');
        expect(testItem.adapterKey).toBe(defaultWrappedTextAreaAdapterKey);
        expect(testItem.priority).toBe(80);
        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBe(defaultWrappedTextAreaPresentationName);
    });

    test('Explicit values are used', () => {
        let testItem = new Publicify_WrappedTextAreaAdapterDefinition('myKey', 5, 'div.w', 'MyPresentation');

        expect(testItem.adapterKey).toBe('myKey');
        expect(testItem.priority).toBe(5);
        expect(testItem.wrapperSelector).toBe('div.w');
        expect(testItem.recommendedFieldPresentationName).toBe('MyPresentation');
    });

    test('Explicit null wrapperSelector and presentation name are honored', () => {
        let testItem = new Publicify_WrappedTextAreaAdapterDefinition(undefined, undefined, null, null);

        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBeNull();
        expect(testItem.priority).toBe(80);
    });
});

// Selector and child creation.
describe('WrappedTextAreaAdapterDefinition editor selection', () => {
    test('editorSelector is textarea', () => {
        expect(new Publicify_WrappedTextAreaAdapterDefinition().publicify_editorSelector).toBe('textarea');
    });

    test('The child is a new TextAreaAdapterDefinition each call', () => {
        let testItem = new Publicify_WrappedTextAreaAdapterDefinition();

        let first = testItem.publicify_createChild();
        let second = testItem.publicify_createChild();

        expect(first).toBeInstanceOf(TextAreaAdapterDefinition);
        expect(first).not.toBe(second);
    });
});

// matches uses the wrapper filter, the textarea search and the child's own checks.
describe('WrappedTextAreaAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1', 'fieldId');

    function setup(testItem = new Publicify_WrappedTextAreaAdapterDefinition())
    {
        testItem.domServices = createMockJivsDomServices();
        return testItem;
    }

    test('Matches a wrapper with a nested textarea', () => {
        expect(setup().matches(valueHost, createWrapper().wrapper)).toBe(true);
    });

    test('Rejects a wrapper with an input, or no children, or only text', () => {
        let testItem = setup();
        let wrapper = document.createElement('div');

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        wrapper.textContent = 'text';
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        wrapper.appendChild(document.createElement('input'));
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
    });

    test('Does not match when the wrapper is itself the textarea', () => {
        expect(setup().matches(valueHost, document.createElement('textarea'))).toBe(false);
    });

    test('wrapperSelector filters wrappers', () => {
        let testItem = setup(new Publicify_WrappedTextAreaAdapterDefinition(undefined, undefined, 'div.wrapped'));

        expect(testItem.matches(valueHost, createWrapper('wrapped').wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('other').wrapper)).toBe(false);
    });
});

// Integration: real FieldValueHost, real DOM, real child and real logging.
describe('WrappedTextAreaAdapterDefinition integration', () => {
    test('Wrapper stays the Jivs element; the nested textarea is the editor', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedTextAreaAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, textarea } = createWrapper();

        expect(testItem.identifyJivsElement(host, wrapper)).toBe(wrapper);
        expect(testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toBe(textarea);
    });

    test('Text adapter reads and writes the textarea; change events update the FieldValueHost', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedTextAreaAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, textarea } = createWrapper();
        let jivsElement = wrapper as unknown as IJivsElement;
        let editor = testItem.identifyEditor(host, jivsElement);

        let adapter = testItem.createTextValueAdapter(host, editor, jivsElement)!;
        jivsElement.jivsTextValueAdapter = adapter;
        adapter.writeTextValue('abc\ndef');
        expect(textarea.value).toBe('abc\ndef');
        expect(adapter.readTextValue()).toBe('abc\ndef');

        testItem.attachToSendValues(host, editor, jivsElement);
        textarea.value = 'typed';
        textarea.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('typed');
    });

    test('Missing textarea logs an Error with the wrapped key and throws', () => {
        let { host } = createRealHost();
        let logger = new RecordingLoggingService();
        let testItem = new WrappedTextAreaAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let wrapper = document.createElement('div');
        wrapper.id = 'wrapperId';
        wrapper.appendChild(document.createElement('input'));

        expect(() => testItem.identifyEditor(host, wrapper as unknown as IJivsElement))
            .toThrow('Editor element not found within the wrapped.');
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect((logger.calls[0].details as any).identity).toBe('wrapped:textarea');
        expect((logger.calls[0].details as any).data).toEqual({ idAttribute: 'wrapperId', valueHostName: 'Field1' });
    });
});
