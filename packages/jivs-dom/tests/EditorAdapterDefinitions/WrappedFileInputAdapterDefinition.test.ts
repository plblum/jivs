/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { defaultWrappedFileInputPresentationName } from '../../src/FieldPresentations/WrappedFileInputPresentation';
import { FileInputAdapterDefinition } from '../../src/EditorAdapterDefinitions/FileInputAdapterDefinition';
import { WrappedFileInputAdapterDefinition } from '../../src/EditorAdapterDefinitions/WrappedFileInputAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();
/**
 * Exposes protected members of the definition under test.
 */
class Publicify_WrappedFileInputAdapterDefinition extends WrappedFileInputAdapterDefinition
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

function createWrapper(inputType: string | null = 'file', wrapperClass: string = 'wrapped')
{
    let wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    wrapper.id = 'wrapperId';
    let nested = document.createElement('label');
    let input = document.createElement('input');
    if (inputType !== null)
        input.setAttribute('type', inputType);
    nested.appendChild(input);
    wrapper.appendChild(nested);
    return { wrapper, input };
}

// jsdom cannot assign files directly, so replace the files property.
function setSelectedFiles(element: HTMLInputElement, names: string[]): void
{
    Object.defineProperty(element, 'files', {
        configurable: true,
        value: names.map((n) => new File(['x'], n))
    });
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
describe('WrappedFileInputAdapterDefinition constructor', () => {
    test('Defaults: key wrapped:input:file, priority 0, null wrapperSelector, wrapped file presentation', () => {
        let testItem = new Publicify_WrappedFileInputAdapterDefinition();

        expect(testItem.adapterKey).toBe('wrapped:input:file');
        expect(testItem.priority).toBe(0);
        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBe(defaultWrappedFileInputPresentationName);
        expect(testItem.publicify_inputType).toBe('file');
    });

    test('Explicit values are used', () => {
        let testItem = new Publicify_WrappedFileInputAdapterDefinition('myKey', 50, 'div.w', 'MyPresentation');

        expect(testItem.adapterKey).toBe('myKey');
        expect(testItem.priority).toBe(50);
        expect(testItem.wrapperSelector).toBe('div.w');
        expect(testItem.recommendedFieldPresentationName).toBe('MyPresentation');
    });

    test('Explicit null wrapperSelector and presentation name are honored', () => {
        let testItem = new Publicify_WrappedFileInputAdapterDefinition(undefined, undefined, null, null);

        expect(testItem.wrapperSelector).toBeNull();
        expect(testItem.recommendedFieldPresentationName).toBeNull();
        expect(testItem.priority).toBe(0);
    });
});

// Selector and child creation.
describe('WrappedFileInputAdapterDefinition editor selection', () => {
    test('editorSelector selects only type=file', () => {
        expect(new Publicify_WrappedFileInputAdapterDefinition().publicify_editorSelector)
            .toBe('input[type="file"]');
    });

    test('The child is a new FileInputAdapterDefinition each call', () => {
        let testItem = new Publicify_WrappedFileInputAdapterDefinition();

        let first = testItem.publicify_createChild();
        let second = testItem.publicify_createChild();

        expect(first).toBeInstanceOf(FileInputAdapterDefinition);
        expect(first).not.toBe(second);
        expect(first.adapterKey).toBe('input:file');
    });
});

// matches uses the wrapper filter, the file input search and the child's own checks.
describe('WrappedFileInputAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1', 'fieldId');

    function setup(testItem = new Publicify_WrappedFileInputAdapterDefinition())
    {
        testItem.domServices = createMockJivsDomServices();
        return testItem;
    }

    test('Matches a wrapper with a nested file input', () => {
        expect(setup().matches(valueHost, createWrapper('file').wrapper)).toBe(true);
    });

    test('Rejects text, untyped, checkbox and radio inputs, and non-inputs', () => {
        let testItem = setup();

        expect(testItem.matches(valueHost, createWrapper('text').wrapper)).toBe(false);
        expect(testItem.matches(valueHost, createWrapper(null).wrapper)).toBe(false);
        expect(testItem.matches(valueHost, createWrapper('checkbox').wrapper)).toBe(false);
        expect(testItem.matches(valueHost, createWrapper('radio').wrapper)).toBe(false);

        let wrapper = document.createElement('div');
        wrapper.appendChild(document.createElement('textarea'));
        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });

    test('wrapperSelector filters wrappers', () => {
        let testItem = setup(new Publicify_WrappedFileInputAdapterDefinition(undefined, undefined, 'div.wrapped'));

        expect(testItem.matches(valueHost, createWrapper('file', 'wrapped').wrapper)).toBe(true);
        expect(testItem.matches(valueHost, createWrapper('file', 'other').wrapper)).toBe(false);
    });
});

// Integration: real FieldValueHost, real DOM, real child and real logging.
describe('WrappedFileInputAdapterDefinition integration', () => {
    test('Wrapper stays the Jivs element; the nested file input is the editor', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedFileInputAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, input } = createWrapper();

        expect(testItem.identifyJivsElement(host, wrapper)).toBe(wrapper);
        expect(testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toBe(input);
    });

    test('Text adapter reads file names; writes are ignored; change events update the FieldValueHost', () => {
        let { services, host } = createRealHost();
        let testItem = new WrappedFileInputAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({ services });
        let { wrapper, input } = createWrapper();
        let jivsElement = wrapper as unknown as IJivsElement;
        let editor = testItem.identifyEditor(host, jivsElement);

        let adapter = testItem.createTextValueAdapter(host, editor, jivsElement)!;
        jivsElement.jivsTextValueAdapter = adapter;
        expect(adapter.readTextValue()).toBe('');
        setSelectedFiles(input, ['a.pdf', 'b.png']);
        adapter.writeTextValue('ignored.txt');
        expect(adapter.readTextValue()).toBe('a.pdf|b.png');

        testItem.attachToSendValues(host, editor, jivsElement);
        input.dispatchEvent(new Event('change'));

        expect(host.getTextValue()).toBe('a.pdf|b.png');
        expect(testItem.createValueAdapter(host, editor, jivsElement)).toBeNull();
    });

    test('Missing file input logs an Error with the wrapped key and throws', () => {
        let { host } = createRealHost();
        let logger = new RecordingLoggingService();
        let testItem = new WrappedFileInputAdapterDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let { wrapper } = createWrapper('text');

        expect(() => testItem.identifyEditor(host, wrapper as unknown as IJivsElement))
            .toThrow('Editor element not found within the wrapped.');
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect((logger.calls[0].details as any).identity).toBe('wrapped:input:file');
        expect((logger.calls[0].details as any).data).toEqual({ idAttribute: 'wrapperId', valueHostName: 'Field1' });
    });
});
