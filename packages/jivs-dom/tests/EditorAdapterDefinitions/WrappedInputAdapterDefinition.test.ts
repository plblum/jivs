/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { defaultWrappedTextInputPresentationName } from '../../src/FieldPresentations/WrappedTextInputPresentation';
import { InputAdapterDefinition } from '../../src/EditorAdapterDefinitions/InputAdapterDefinition';
import { getWrappedInputAdapterKey, WrappedInputAdapterDefinition } from '../../src/EditorAdapterDefinitions/WrappedInputAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Exposes protected members of the definition under test.
 */
class Publicify_WrappedInputAdapterDefinition extends WrappedInputAdapterDefinition
{
    public get publicify_inputType(): string
    {
        return this.inputType;
    }
    public get publicify_editorSelector(): string
    {
        return this.editorSelector;
    }
    public publicify_createChild()
    {
        return this.createChildEditorDefinitionAdapter();
    }
}

function createWrapper(inputType: string | null = 'text', wrapperClass: string = 'wrapped')
{
    let wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    wrapper.id = 'wrapperId';
    let nested = document.createElement('span');
    let input = document.createElement('input');
    if (inputType !== null)
        input.setAttribute('type', inputType);
    nested.appendChild(input);
    wrapper.appendChild(nested);
    return { wrapper, input };
}

function createRealHost(name: string = 'Field1')
{
    let services = createJivsServicesForTesting();
    let host = new ValueHostsManager({
        services: services,
        valueHostConfigs: [<FieldValueHostConfig>{
            valueHostType: ValueHostType.Field, name: name, dataType: LookupKey.String
        }]
    }).getFieldValueHost(name)!;
    return { services, host };
}

// getWrappedInputAdapterKey builds the default key from the input type.
describe('getWrappedInputAdapterKey', () => {
    test('Prefixes with wrapped:input: and lowercases the type', () => {
        expect(getWrappedInputAdapterKey('text')).toBe('wrapped:input:text');
        expect(getWrappedInputAdapterKey('EMAIL')).toBe('wrapped:input:email');
    });

    test('An empty type yields the bare prefix', () => {
        expect(getWrappedInputAdapterKey('')).toBe('wrapped:input:');
    });
});

// Constructor defaults and overrides.
describe('WrappedInputAdapterDefinition constructor', () => {
    test('Defaults: key from type, priority 80, null wrapperSelector, wrapped text presentation', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('text');

        expect(testItem.adapterKey).toBe('wrapped:input:text');
        expect(testItem.priority).toBe(80);
        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBe(defaultWrappedTextInputPresentationName);
        expect(testItem.publicify_inputType).toBe('text');
    });

    test('The input type is lowercased and used in the default key', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('Email');

        expect(testItem.publicify_inputType).toBe('email');
        expect(testItem.adapterKey).toBe('wrapped:input:email');
    });

    test('Explicit key, priority, wrapperSelector and presentation name are used', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('text', 'myKey', 5, 'div.w', 'MyPresentation');

        expect(testItem.adapterKey).toBe('myKey');
        expect(testItem.priority).toBe(5);
        expect(testItem.wrapperSelector).toBe('div.w');
        expect(testItem.recommendedFieldPresentationName).toBe('MyPresentation');
    });

    test('An explicit null wrapperSelector and null presentation name are honored', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('text', undefined, undefined, null, null);

        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBeNull();
        expect(testItem.priority).toBe(80);
    });
});

// editorSelector includes untyped inputs only for text.
describe('WrappedInputAdapterDefinition editorSelector', () => {
    test('text also selects inputs without a type attribute', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('text');

        expect(testItem.publicify_editorSelector).toBe('input[type="text"], input:not([type])');
    });

    test('Other types select only that type', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('email');

        expect(testItem.publicify_editorSelector).toBe('input[type="email"]');
    });

    test('TEXT in any case is normalized so untyped inputs are still included', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('TEXT');

        expect(testItem.publicify_editorSelector).toBe('input[type="text"], input:not([type])');
    });
});

// The child definition is a real InputAdapterDefinition for the same type.
describe('WrappedInputAdapterDefinition createChildEditorDefinitionAdapter', () => {
    test('Returns a new InputAdapterDefinition each call', () => {
        let testItem = new Publicify_WrappedInputAdapterDefinition('email');

        let first = testItem.publicify_createChild();
        let second = testItem.publicify_createChild();

        expect(first).toBeInstanceOf(InputAdapterDefinition);
        expect(first).not.toBe(second);
        expect(first.adapterKey).toBe('input:email');
    });
});

// matches uses the wrapper filter, the editor selector and the child's own checks.
describe('WrappedInputAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1', 'fieldId');

    function setup(testItem: Publicify_WrappedInputAdapterDefinition)
    {
        testItem.domServices = createMockJivsDomServices();
        return testItem;
    }

    test('text matches a wrapper with a nested type=text input', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('text'));

        expect(testItem.matches(valueHost, createWrapper('text').wrapper)).toBe(true);
    });

    test('text matches a wrapper whose input omits type', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('text'));

        expect(testItem.matches(valueHost, createWrapper(null).wrapper)).toBe(true);
    });

    test('email does not match an untyped input', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('email'));

        expect(testItem.matches(valueHost, createWrapper(null).wrapper)).toBe(false);
    });

    test('email matches type=email, and not type=text', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('email'));

        expect(testItem.matches(valueHost, createWrapper('email').wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('text').wrapper)).toBe(false);
    });

    test('The selector type comparison is case-insensitive on the attribute value', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('text'));

        expect(testItem.matches(valueHost, createWrapper('TEXT').wrapper)).toBe(true);
    });

    test('Does not match unsupported descendants (textarea) or a wrapper with no children', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('text'));
        let wrapper = document.createElement('div');

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        wrapper.appendChild(document.createElement('textarea'));
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
    });

    test('Does not match when the wrapper itself is the input (no children)', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('text'));
        let input = document.createElement('input');
        input.type = 'text';

        expect(testItem.matches(valueHost, input)).toBe(false);
    });

    test('wrapperSelector filters wrappers', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('text', undefined, undefined, 'div.wrapped'));

        expect(testItem.matches(valueHost, createWrapper('text', 'wrapped').wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('text', 'other').wrapper)).toBe(false);
    });

    test('Radio and file inputs are not matched by a text definition', () => {
        let testItem = setup(new Publicify_WrappedInputAdapterDefinition('text'));

        expect(testItem.matches(valueHost, createWrapper('radio').wrapper)).toBe(false);
        expect(testItem.matches(valueHost, createWrapper('file').wrapper)).toBe(false);
    });
});

// Integration: real FieldValueHost, real DOM, real child definition and real logging.
describe('WrappedInputAdapterDefinition integration', () => {
    test('identifyEditor returns the nested input while identifyJivsElement keeps the wrapper', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedInputAdapterDefinition('text');
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, input } = createWrapper('text');

        expect(testItem.identifyJivsElement(host, wrapper)).toBe(wrapper);
        expect(testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toBe(input);
    });

    test('Text adapter reads and writes the nested input; change events update the FieldValueHost', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedInputAdapterDefinition('text');
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, input } = createWrapper('text');
        let jivsElement = wrapper as unknown as IJivsElement;
        let editor = testItem.identifyEditor(host, jivsElement);

        let adapter = testItem.createTextValueAdapter(host, editor, jivsElement)!;
        jivsElement.jivsTextValueAdapter = adapter;
        adapter.writeTextValue('abc');
        expect(input.value).toBe('abc');
        expect(adapter.readTextValue()).toBe('abc');

        testItem.attachToSendValues(host, editor, jivsElement);
        input.value = 'typed';
        input.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('typed');
    });

    test('Untyped input is handled end to end', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedInputAdapterDefinition('text');
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, input } = createWrapper(null);

        expect(testItem.matches(host, wrapper)).toBe(true);
        expect(testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toBe(input);
    });

    test('Missing input logs an Error with the wrapper key and details, then throws', () => {
        let { host } = createRealHost();
        let logger = new RecordingLoggingService();
        let testItem = new WrappedInputAdapterDefinition('email');
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let { wrapper } = createWrapper('text');

        expect(() => testItem.identifyEditor(host, wrapper as unknown as IJivsElement))
            .toThrow('Editor element not found within the wrapped.');
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect((logger.calls[0].details as any).identity).toBe('wrapped:input:email');
        expect((logger.calls[0].details as any).data).toEqual({ idAttribute: 'wrapperId', valueHostName: 'Field1' });
    });
});
