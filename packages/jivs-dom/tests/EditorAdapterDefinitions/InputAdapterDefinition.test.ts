/** @jest-environment jsdom */
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { EditorAriaStaticUpdater } from '../../src/Aria/EditorAriaStaticUpdater';
import { EditorAriaValidationStateUpdater } from '../../src/Aria/EditorAriaValidationStateUpdater';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { InputTextValueAdapter } from '../../src/Adapters/InputTextValueAdapter';
import { InputAdapterDefinition, getInputAdapterKey } from '../../src/EditorAdapterDefinitions/InputAdapterDefinition';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();
/**
 * Exposes protected members of InputAdapterDefinition.
 */
class Publicify_InputAdapterDefinition extends InputAdapterDefinition
{
    public get publicify_inputType(): string
    {
        return this.inputType;
    }
    public publicify_requireInputElement(element: HTMLElement): HTMLInputElement
    {
        return this.requireInputElement(element);
    }
    public publicify_attachToSendValuesCore(valueHost: any, editor: HTMLElement,
        jivsElement: IJivsElement, options: any): void
    {
        this.attachToSendValuesCore(valueHost, editor, jivsElement, options);
    }
}

function createInput(type: string): HTMLInputElement
{
    let input = document.createElement('input');
    input.type = type;
    input.id = 'inputId';
    return input;
}

function createRecordingValueHost(): any
{
    let host = createStubFieldValueHost('Field1', 'fieldId') as any;
    host.textCalls = [];
    host.setTextValue = (value: string, options: any) => { host.textCalls.push({ value: value, options: options }); };
    return host;
}

// Constructor: key, priority, input type and presentation name resolution.
describe('InputAdapterDefinition constructor and properties', () => {
    test('Defaults adapterKey from the lowercased input type, priority 80, and the inputEditor presentation', () => {
        let testItem = new Publicify_InputAdapterDefinition('TEXT');

        expect(testItem.adapterKey).toBe('input:text');
        expect(testItem.priority).toBe(80);
        expect(testItem.publicify_inputType).toBe('text');
        expect(testItem.recommendedFieldPresentationName).toBe('inputEditor');
    });

    test('Uses supplied adapterKey, priority, and presentation name', () => {
        let testItem = new Publicify_InputAdapterDefinition('password', 'custom', 5, 'Mine');

        expect(testItem.adapterKey).toBe('custom');
        expect(testItem.priority).toBe(5);
        expect(testItem.recommendedFieldPresentationName).toBe('Mine');
    });

    test('A null presentation name is kept; priority 0 is kept', () => {
        let testItem = new Publicify_InputAdapterDefinition('text', undefined, 0, null);

        expect(testItem.recommendedFieldPresentationName).toBeNull();
        expect(testItem.priority).toBe(0);
    });

    test('getInputAdapterKey lowercases the type', () => {
        expect(getInputAdapterKey('Email')).toBe('input:email');
    });

    test('defaultFieldPresentationName returns inputEditor', () => {
        expect(new InputAdapterDefinition('text').defaultFieldPresentationName()).toBe('inputEditor');
    });
});

// matches requires an HTMLInputElement whose type equals the definition's type.
describe('InputAdapterDefinition.matches', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('Matches an input of the same type, case-insensitively configured', () => {
        let testItem = new InputAdapterDefinition('Email');

        expect(testItem.matches(valueHost, createInput('email'))).toBe(true);
    });

    test('Does not match an input of another type', () => {
        let testItem = new InputAdapterDefinition('text');

        expect(testItem.matches(valueHost, createInput('password'))).toBe(false);
    });

    test('An input with no type attribute is type text', () => {
        let testItem = new InputAdapterDefinition('text');

        expect(testItem.matches(valueHost, document.createElement('input'))).toBe(true);
    });

    test('An unknown type attribute resolves to text', () => {
        let input = createInput('bogus');

        expect(new InputAdapterDefinition('text').matches(valueHost, input)).toBe(true);
        expect(new InputAdapterDefinition('bogus').matches(valueHost, input)).toBe(false);
    });

    test('Does not match non-input elements', () => {
        let testItem = new InputAdapterDefinition('text');

        expect(testItem.matches(valueHost, document.createElement('textarea'))).toBe(false);
        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
    });
});

// requireInputElement returns matching inputs and throws otherwise.
describe('InputAdapterDefinition.requireInputElement', () => {
    test('Returns the same element when type matches', () => {
        let testItem = new Publicify_InputAdapterDefinition('text');
        let input = createInput('text');

        expect(testItem.publicify_requireInputElement(input)).toBe(input);
    });

    test('Throws with the adapter key and type for a wrong input type', () => {
        let testItem = new Publicify_InputAdapterDefinition('text');

        expect(() => testItem.publicify_requireInputElement(createInput('password')))
            .toThrow(new Error(`Adapter definition 'input:text' requires input type 'text'.`));
    });

    test('Throws for a non-input element', () => {
        let testItem = new Publicify_InputAdapterDefinition('text', 'mine');

        expect(() => testItem.publicify_requireInputElement(document.createElement('div')))
            .toThrow(new Error(`Adapter definition 'mine' requires input type 'text'.`));
    });
});

// Adapter creation: a text adapter for input elements, no native adapter.
describe('InputAdapterDefinition adapters', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('createTextValueAdapter returns an InputTextValueAdapter that reads and writes the input', () => {
        let testItem = new InputAdapterDefinition('text');
        let input = createInput('text');
        input.value = 'abc';

        let adapter = testItem.createTextValueAdapter(valueHost, input, input as unknown as IJivsElement)!;

        expect(adapter).toBeInstanceOf(InputTextValueAdapter);
        expect(adapter.readTextValue()).toBe('abc');
        adapter.writeTextValue('xyz');
        expect(input.value).toBe('xyz');
    });

    test('createTextValueAdapter throws for an editor that is not a matching input', () => {
        let testItem = new InputAdapterDefinition('text');
        let div = document.createElement('div');

        expect(() => testItem.createTextValueAdapter(valueHost, div, div as unknown as IJivsElement))
            .toThrow(new Error(`Adapter definition 'input:text' requires input type 'text'.`));
    });

    test('createValueAdapter returns null', () => {
        let testItem = new InputAdapterDefinition('text');
        let input = createInput('text');

        expect(testItem.createValueAdapter(valueHost, input, input as unknown as IJivsElement)).toBeNull();
    });
});

// attachToSendValuesCore wires change always and input only when duringEdit is set.
describe('InputAdapterDefinition.attachToSendValuesCore', () => {
    function setup(type: string = 'text')
    {
        let testItem = new Publicify_InputAdapterDefinition(type);
        let logger = new RecordingLoggingService();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let input = createInput(type);
        let jivsElement = input as unknown as IJivsElement;
        let valueHost = createRecordingValueHost();
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(valueHost, input, jivsElement)!;
        return { testItem, logger, input, jivsElement, valueHost };
    }

    test('change sends the text with duringEdit false; input is not wired by default', () => {
        let { testItem, input, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, input, jivsElement, {});
        input.value = 'one';
        input.dispatchEvent(new Event('input'));
        expect(valueHost.textCalls).toEqual([]);
        input.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([{ value: 'one', options: { validate: true, duringEdit: false } }]);
    });

    test('duringEdit also wires input with duringEdit true', () => {
        let { testItem, input, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, input, jivsElement, { duringEdit: true });
        input.value = 'two';
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([
            { value: 'two', options: { validate: true, duringEdit: true } },
            { value: 'two', options: { validate: true, duringEdit: false } }
        ]);
    });

    test('Throws for a non-matching editor and attaches nothing', () => {
        let { testItem, jivsElement, valueHost } = setup('text');
        let password = createInput('password');

        expect(() => testItem.publicify_attachToSendValuesCore(valueHost, password, jivsElement, {}))
            .toThrow(new Error(`Adapter definition 'input:text' requires input type 'text'.`));
    });

    test('Without a text adapter, a change logs a Warn and sends nothing', () => {
        let { testItem, logger, input, jivsElement, valueHost } = setup();
        jivsElement.jivsTextValueAdapter = undefined;

        testItem.publicify_attachToSendValuesCore(valueHost, input, jivsElement, {});
        input.dispatchEvent(new Event('change'));

        expect(valueHost.textCalls).toEqual([]);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details!.message).toBe(
            `No text value adapter found on the element 'inputId' associated with ValueHost 'Field1'.`);
    });

    test('attachToSendValues (public) wires events and logs the Debug entry', () => {
        let { testItem, logger, input, jivsElement, valueHost } = setup();

        testItem.attachToSendValues(valueHost, input, jivsElement, { duringEdit: true });
        input.value = 'x';
        input.dispatchEvent(new Event('input'));

        expect(valueHost.textCalls.length).toBe(1);
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Debug);
        expect(logger.calls[0].details!.identity).toBe('input:text');
    });
});

// sendValue is called directly (for example to initialize from the editor) without needing an event.
describe('InputAdapterDefinition.sendValue', () => {
    function setup()
    {
        let testItem = new Publicify_InputAdapterDefinition('text');
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: new RecordingLoggingService() } as unknown as IJivsServices
        });
        let input = createInput('text');
        let jivsElement = input as unknown as IJivsElement;
        let valueHost = createRecordingValueHost();
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(valueHost, input, jivsElement)!;
        return { testItem, input, jivsElement, valueHost };
    }

    test('Defaults to duringEdit false and validate true', () => {
        let { testItem, input, jivsElement, valueHost } = setup();
        input.value = 'abc';

        testItem.sendValue(valueHost, input, jivsElement);

        expect(valueHost.textCalls).toEqual([{ value: 'abc', options: { validate: true, duringEdit: false } }]);
    });

    test('validate false is passed along without attaching any events', () => {
        let { testItem, input, jivsElement, valueHost } = setup();
        input.value = 'abc';

        testItem.sendValue(valueHost, input, jivsElement, { validate: false, duringEdit: false });

        expect(valueHost.textCalls).toEqual([{ value: 'abc', options: { validate: false, duringEdit: false } }]);
    });

    test('duringEdit true is passed along', () => {
        let { testItem, input, jivsElement, valueHost } = setup();

        testItem.sendValue(valueHost, input, jivsElement, { validate: false, duringEdit: true });

        expect(valueHost.textCalls).toEqual([{ value: '', options: { validate: false, duringEdit: true } }]);
    });
});

// Inherited identification and ARIA defaults.
describe('InputAdapterDefinition inherited behavior', () => {
    test('identifyJivsElement and identifyEditor return the element itself', () => {
        let testItem = new InputAdapterDefinition('text');
        let input = createInput('text');
        let valueHost = createStubFieldValueHost('Field1');

        expect(testItem.identifyJivsElement(valueHost, input)).toBe(input);
        expect(testItem.identifyEditor(valueHost, input as unknown as IJivsElement)).toBe(input);
    });
});

// Further edge cases around input type changes, repeated attachment, and inherited ARIA updaters.
describe('InputAdapterDefinition additional cases', () => {
    let valueHost = createStubFieldValueHost('Field1');

    test('matches and requireInputElement follow the element type at the time of the call', () => {
        let testItem = new Publicify_InputAdapterDefinition('password');
        let input = createInput('text');

        expect(testItem.matches(valueHost, input)).toBe(false);
        expect(() => testItem.publicify_requireInputElement(input)).toThrow();
        input.type = 'password';
        expect(testItem.matches(valueHost, input)).toBe(true);
        expect(testItem.publicify_requireInputElement(input)).toBe(input);
    });

    test('The same definition can be shared by several inputs of its type', () => {
        let testItem = new InputAdapterDefinition('text');
        let first = createInput('text');
        let second = createInput('text');
        first.value = '1';
        second.value = '2';

        let a1 = testItem.createTextValueAdapter(valueHost, first, first as unknown as IJivsElement)!;
        let a2 = testItem.createTextValueAdapter(valueHost, second, second as unknown as IJivsElement)!;

        expect(a1).not.toBe(a2);
        expect(a1.readTextValue()).toBe('1');
        expect(a2.readTextValue()).toBe('2');
    });

    test('Attaching twice registers two listeners (callers must prevent duplicates)', () => {
        let testItem = new Publicify_InputAdapterDefinition('text');
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: new RecordingLoggingService() } as unknown as IJivsServices
        });
        let input = createInput('text');
        let jivsElement = input as unknown as IJivsElement;
        let host = createRecordingValueHost();
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, input, jivsElement)!;

        testItem.attachToSendValues(host, input, jivsElement);
        testItem.attachToSendValues(host, input, jivsElement);
        input.dispatchEvent(new Event('change'));

        expect(host.textCalls.length).toBe(2);
    });

    test('Constructor accepts an empty input type, producing key "input:"', () => {
        let testItem = new Publicify_InputAdapterDefinition('');

        expect(testItem.adapterKey).toBe('input:');
        expect(testItem.publicify_inputType).toBe('');
    });

    test('Default ARIA updaters are the editor updaters', () => {
        let testItem = new InputAdapterDefinition('text');

        expect(testItem.getStaticAriaUpdater()).toBeInstanceOf(EditorAriaStaticUpdater);
        expect(testItem.getAriaValidationStateUpdater()).toBeInstanceOf(EditorAriaValidationStateUpdater);
    });

    test('attachEventHandler adds a listener to the input', () => {
        let testItem = new InputAdapterDefinition('text');
        let input = createInput('text');
        let received: string[] = [];

        testItem.attachEventHandler(input as unknown as IJivsElement, valueHost, 'focus', (e) => received.push(e.type));
        input.dispatchEvent(new Event('focus'));

        expect(received).toEqual(['focus']);
    });
});

// Integration: the real engine FieldValueHost receives text typed into a real input.
describe('InputAdapterDefinition integration with real FieldValueHost', () => {
    test('A change event on the input updates the FieldValueHost text value', () => {
        let services = createJivsServicesForTesting();
        let fieldHost = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new InputAdapterDefinition('text');
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let input = createInput('text');
        let jivsElement = input as unknown as IJivsElement;
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(fieldHost, input, jivsElement)!;

        testItem.attachToSendValues(fieldHost, input, jivsElement);
        input.value = 'typed';
        input.dispatchEvent(new Event('change'));

        expect(fieldHost.getTextValue()).toBe('typed');
    });
});
