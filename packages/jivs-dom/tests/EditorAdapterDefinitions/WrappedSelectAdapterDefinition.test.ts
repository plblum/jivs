/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { defaultWrappedSelectPresentationName } from '../../src/FieldPresentations/WrappedSelectPresentation';
import { SelectAdapterDefinition } from '../../src/EditorAdapterDefinitions/SelectAdapterDefinition';
import { defaultWrappedSelectAdapterKey, WrappedSelectAdapterDefinition } from '../../src/EditorAdapterDefinitions/WrappedSelectAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Exposes protected members of the definition under test.
 */
class Publicify_WrappedSelectAdapterDefinition extends WrappedSelectAdapterDefinition
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
    let select = document.createElement('select');
    for (let v of ['a', 'b', 'c'])
    {
        let option = document.createElement('option');
        option.value = v;
        option.text = v.toUpperCase();
        select.appendChild(option);
    }
    nested.appendChild(select);
    wrapper.appendChild(nested);
    return { wrapper, select };
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
describe('WrappedSelectAdapterDefinition constructor', () => {
    test('Defaults: key, priority 80, null wrapperSelector, wrapped select presentation', () => {
        let testItem = new Publicify_WrappedSelectAdapterDefinition();

        expect(defaultWrappedSelectAdapterKey).toBe('wrapped:select');
        expect(testItem.adapterKey).toBe(defaultWrappedSelectAdapterKey);
        expect(testItem.priority).toBe(80);
        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBe(defaultWrappedSelectPresentationName);
    });

    test('Explicit values are used', () => {
        let testItem = new Publicify_WrappedSelectAdapterDefinition('myKey', 5, 'div.w', 'MyPresentation');

        expect(testItem.adapterKey).toBe('myKey');
        expect(testItem.priority).toBe(5);
        expect(testItem.wrapperSelector).toBe('div.w');
        expect(testItem.recommendedFieldPresentationName).toBe('MyPresentation');
    });

    test('Explicit null wrapperSelector and presentation name are honored', () => {
        let testItem = new Publicify_WrappedSelectAdapterDefinition(undefined, undefined, null, null);

        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBeNull();
        expect(testItem.priority).toBe(80);
    });
});

// Selector and child creation.
describe('WrappedSelectAdapterDefinition editor selection', () => {
    test('editorSelector is select', () => {
        expect(new Publicify_WrappedSelectAdapterDefinition().publicify_editorSelector).toBe('select');
    });

    test('The child is a new SelectAdapterDefinition each call', () => {
        let testItem = new Publicify_WrappedSelectAdapterDefinition();

        let first = testItem.publicify_createChild();
        let second = testItem.publicify_createChild();

        expect(first).toBeInstanceOf(SelectAdapterDefinition);
        expect(first).not.toBe(second);
    });
});

// matches uses the wrapper filter, the select search and the child's own checks.
describe('WrappedSelectAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1', 'fieldId');

    function setup(testItem = new Publicify_WrappedSelectAdapterDefinition())
    {
        testItem.domServices = createMockJivsDomServices();
        return testItem;
    }

    test('Matches a wrapper with a nested select', () => {
        expect(setup().matches(valueHost, createWrapper().wrapper)).toBe(true);
    });

    test('Matches a select with no options', () => {
        let wrapper = document.createElement('div');
        wrapper.appendChild(document.createElement('select'));

        expect(setup().matches(valueHost, wrapper)).toBe(true);
    });

    test('Rejects a wrapper with an input or textarea, no children, or only text', () => {
        let testItem = setup();
        let wrapper = document.createElement('div');

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        wrapper.textContent = 'text';
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        wrapper.appendChild(document.createElement('input'));
        wrapper.appendChild(document.createElement('textarea'));
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
    });

    test('Does not match when the wrapper is itself the select, since it has children', () => {
        // The wrapper is never treated as the editor; descendants are searched only.
        let { select } = createWrapper();

        expect(setup().matches(valueHost, select)).toBe(false);
    });

    test('wrapperSelector filters wrappers', () => {
        let testItem = setup(new Publicify_WrappedSelectAdapterDefinition(undefined, undefined, 'div.wrapped'));

        expect(testItem.matches(valueHost, createWrapper('wrapped').wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('other').wrapper)).toBe(false);
    });
});

// Integration: real FieldValueHost, real DOM, real child and real logging.
describe('WrappedSelectAdapterDefinition integration', () => {
    test('Wrapper stays the Jivs element; the nested select is the editor', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedSelectAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, select } = createWrapper();

        expect(testItem.identifyJivsElement(host, wrapper)).toBe(wrapper);
        expect(testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toBe(select);
    });

    test('Text adapter reads and writes the select; change events update the FieldValueHost', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedSelectAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, select } = createWrapper();
        let jivsElement = wrapper as unknown as IJivsElement;
        let editor = testItem.identifyEditor(host, jivsElement);

        let adapter = testItem.createTextValueAdapter(host, editor, jivsElement)!;
        jivsElement.jivsTextValueAdapter = adapter;
        adapter.writeTextValue('b');
        expect(select.value).toBe('b');
        expect(adapter.readTextValue()).toBe('b');

        testItem.attachToSendValues(host, editor, jivsElement);
        select.value = 'c';
        select.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('c');
    });

    test('Missing select logs an Error with the wrapped key and throws', () => {
        let { host } = createRealHost();
        let logger = new RecordingLoggingService();
        let testItem = new WrappedSelectAdapterDefinition();
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
        expect((logger.calls[0].details as any).identity).toBe('wrapped:select');
        expect((logger.calls[0].details as any).data).toEqual({ idAttribute: 'wrapperId', valueHostName: 'Field1' });
    });
});
