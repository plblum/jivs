/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import type { FieldValueHostConfig, IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { InputAdapterDefinition } from '../../src/EditorAdapterDefinitions/InputAdapterDefinition';
import { WrappedEditorAdapterDefinitionBase } from '../../src/EditorAdapterDefinitions/WrappedEditorAdapterDefinitionBase';
import type { ITextValueAdapter, IValueAdapter } from '../../src/Interfaces/Adapters';
import type { IEditorAdapterDefinition } from '../../src/Interfaces/EditorAdapterDefinitions';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';
import type { SetValueOptions } from '@plblum/jivs-engine/build/Interfaces/ValueHost';

// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from './../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

/**
 * Hand-written fake of the child editor definition. It records every call
 * the wrapper redirects to it and returns configurable results.
 */
class RecordingChildDefinition
{
    public domServices!: IJivsDomServices;
    public matchesCalls: HTMLElement[] = [];
    public matchesResult = true;
    public textAdapterCalls: any[] = [];
    public valueAdapterCalls: any[] = [];
    public attachCalls: any[] = [];
    public textAdapterResult: ITextValueAdapter | null = { tag: 'text' } as unknown as ITextValueAdapter;
    public valueAdapterResult: IValueAdapter | null = null;

    public matches(valueHost: IFieldValueHost, element: HTMLElement): boolean
    {
        this.matchesCalls.push(element);
        return this.matchesResult;
    }
    public createTextValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement): ITextValueAdapter | null
    {
        this.textAdapterCalls.push({ valueHost, editor, jivsElement });
        return this.textAdapterResult;
    }
    public createValueAdapter(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement | null): IValueAdapter | null
    {
        this.valueAdapterCalls.push({ valueHost, editor, jivsElement });
        return this.valueAdapterResult;
    }
    public attachToSendValues(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement, options?: EditorInstallOptions): void
    {
        this.attachCalls.push({ valueHost, editor, jivsElement, options });
    }
    public sendValueCalls: any[] = [];
    public sendValue(valueHost: IFieldValueHost, editor: HTMLElement,
        jivsElement: IJivsElement, options?: SetValueOptions): void
    {
        this.sendValueCalls.push({ valueHost, editor, jivsElement, options });
    }
}

/**
 * Concrete subclass using the fake child. Exposes protected members and counts factory calls.
 */
class Publicify_WrappedDefinition extends WrappedEditorAdapterDefinitionBase<HTMLInputElement>
{
    public child = new RecordingChildDefinition();
    public createChildCount = 0;
    public selector = 'input.editor';
    public findCalls: HTMLElement[] = [];

    constructor(wrapperSelector?: string | null, recommendedName?: string | null)
    {
        super('wrapped', 30, wrapperSelector, recommendedName);
    }
    protected defaultFieldPresentationName(): string | null
    {
        return 'WrappedDefault';
    }
    protected get editorSelector(): string
    {
        return this.selector;
    }
    protected createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        this.createChildCount++;
        return this.child as unknown as IEditorAdapterDefinition;
    }
    protected override findEditorElement(wrapper: HTMLElement): HTMLInputElement | null
    {
        this.findCalls.push(wrapper);
        return super.findEditorElement(wrapper);
    }
    public get publicify_childEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return this.childEditorDefinitionAdapter;
    }
    public publicify_attachToSendValuesCore(valueHost: any, editor: HTMLElement,
        jivsElement: IJivsElement, options: any): void
    {
        this.attachToSendValuesCore(valueHost, editor, jivsElement, options);
    }
}

/**
 * Subclass that overrides the defaults.
 */
class DefaultsOverrideDefinition extends Publicify_WrappedDefinition
{
    protected override defaultWrapperSelector(): string | null
    {
        return 'div.wrapped';
    }
}

/**
 * Uses the real InputAdapterDefinition as the child.
 */
class RealChildWrappedDefinition extends WrappedEditorAdapterDefinitionBase<HTMLInputElement>
{
    constructor()
    {
        super('wrappedInput', 30, 'div.wrapped');
    }
    protected defaultFieldPresentationName(): string | null
    {
        return null;
    }
    protected get editorSelector(): string
    {
        return 'input[type="text"]';
    }
    protected createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new InputAdapterDefinition('text');
    }
}

function createWrapper(className: string = 'wrapped', editorClass: string = 'editor')
{
    let wrapper = document.createElement('div');
    wrapper.className = className;
    wrapper.id = 'wrapperId';
    let input = document.createElement('input');
    input.type = 'text';
    input.className = editorClass;
    wrapper.appendChild(input);
    return { wrapper, input };
}

function setup(testItem: Publicify_WrappedDefinition = new Publicify_WrappedDefinition())
{
    let logger = new RecordingLoggingService();
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    testItem.domServices = domServices;
    let { wrapper, input } = createWrapper();
    return {
        testItem, logger, domServices, wrapper, input,
        jivsElement: wrapper as unknown as IJivsElement,
        valueHost: createStubFieldValueHost('Field1', 'fieldId')
    };
}

// Constructor resolves the wrapper selector and presentation name.
describe('WrappedEditorAdapterDefinitionBase constructor', () => {
    test('Stores key and priority; wrapperSelector defaults to null', () => {
        let testItem = new Publicify_WrappedDefinition();

        expect(testItem.adapterKey).toBe('wrapped');
        expect(testItem.priority).toBe(30);
        expect(testItem.wrapperSelector).toBeNull();
    });

    test('A supplied wrapperSelector wins, including null over an overridden default', () => {
        expect(new Publicify_WrappedDefinition('div.x').wrapperSelector).toBe('div.x');
        expect(new DefaultsOverrideDefinition().wrapperSelector).toBe('div.wrapped');
        expect(new DefaultsOverrideDefinition(null).wrapperSelector).toBeNull();
        expect(new DefaultsOverrideDefinition('span').wrapperSelector).toBe('span');
    });

    test('recommendedFieldPresentationName uses the default unless supplied (including null)', () => {
        expect(new Publicify_WrappedDefinition().recommendedFieldPresentationName).toBe('WrappedDefault');
        expect(new Publicify_WrappedDefinition(null, 'Mine').recommendedFieldPresentationName).toBe('Mine');
        expect(new Publicify_WrappedDefinition(null, null).recommendedFieldPresentationName).toBeNull();
    });
});

// The child definition is created once, lazily, and receives domServices.
describe('WrappedEditorAdapterDefinitionBase child editor definition', () => {
    test('Is not created until needed', () => {
        let { testItem } = setup();

        expect(testItem.createChildCount).toBe(0);
    });

    test('Is created once, cached, and given the wrapper domServices', () => {
        let { testItem, domServices } = setup();

        let first = testItem.publicify_childEditorDefinitionAdapter;
        let second = testItem.publicify_childEditorDefinitionAdapter;

        expect(first).toBe(testItem.child);
        expect(second).toBe(first);
        expect(testItem.createChildCount).toBe(1);
        expect(testItem.child.domServices).toBe(domServices);
    });
});

// matches filters by wrapper selector, child count, descendant search, then asks the child.
describe('WrappedEditorAdapterDefinitionBase.matches', () => {
    test('Matches when the editor is found and the child accepts it', () => {
        let { testItem, wrapper, input, valueHost } = setup();

        expect(testItem.matches(valueHost, wrapper)).toBe(true);
        expect(testItem.child.matchesCalls).toEqual([input]);
    });

    test('Rejects when the child rejects the editor', () => {
        let { testItem, wrapper, valueHost } = setup();
        testItem.child.matchesResult = false;

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
    });

    test('Rejects without asking the child when the editor selector finds nothing', () => {
        let { testItem, wrapper, valueHost } = setup();
        testItem.selector = 'textarea';

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        expect(testItem.child.matchesCalls).toEqual([]);
    });

    test('Rejects an element with no children before any descendant search', () => {
        let { testItem, valueHost } = setup();

        expect(testItem.matches(valueHost, document.createElement('div'))).toBe(false);
        expect(testItem.findCalls).toEqual([]);
        expect(testItem.createChildCount).toBe(0);
    });

    test('A non-matching wrapperSelector rejects before the child count or search', () => {
        let { testItem, valueHost } = setup(new Publicify_WrappedDefinition('div.other'));
        let { wrapper } = createWrapper('wrapped');

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        expect(testItem.findCalls).toEqual([]);
    });

    test('A matching wrapperSelector continues to the descendant search', () => {
        let { testItem, valueHost } = setup(new Publicify_WrappedDefinition('div.wrapped'));
        let { wrapper } = createWrapper('wrapped');

        expect(testItem.matches(valueHost, wrapper)).toBe(true);
    });

    test('A null wrapperSelector accepts any wrapper that has a matching descendant', () => {
        let { testItem, valueHost } = setup(new Publicify_WrappedDefinition(null));
        let { wrapper } = createWrapper('anything');
        let section = document.createElement('section');
        section.appendChild(wrapper);

        expect(testItem.matches(valueHost, wrapper)).toBe(true);
        expect(testItem.matches(valueHost, section)).toBe(true);   // deep descendant search
    });

    test('An invalid wrapperSelector throws and is not suppressed', () => {
        let { testItem, wrapper, valueHost } = setup(new Publicify_WrappedDefinition('div['));

        expect(() => testItem.matches(valueHost, wrapper)).toThrow();
    });
});

// identifyEditor returns the descendant editor or logs an Error and throws.
describe('WrappedEditorAdapterDefinitionBase.identifyEditor', () => {
    test('Returns the descendant editor, not the wrapper', () => {
        let { testItem, jivsElement, input, valueHost } = setup();

        expect(testItem.identifyEditor(valueHost, jivsElement)).toBe(input);
    });

    test('Logs an Error and throws when the editor is missing', () => {
        let { testItem, logger, valueHost } = setup();
        let empty = document.createElement('div');
        empty.id = 'emptyId';

        expect(() => testItem.identifyEditor(valueHost, empty as unknown as IJivsElement))
            .toThrow(new Error('Editor element not found within the wrapped.'));
        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toEqual({
            message: 'Editor element not found within the wrapped.',
            feature: 'Dom',
            type: testItem,
            identity: 'wrapped',
            data: { idAttribute: 'emptyId', valueHostName: 'Field1' }
        });
    });

    test('identifyJivsElement still returns the wrapper itself', () => {
        let { testItem, wrapper, valueHost } = setup();

        expect(testItem.identifyJivsElement(valueHost, wrapper)).toBe(wrapper);
    });
});

// Adapter creation and attachment are redirected to the child.
describe('WrappedEditorAdapterDefinitionBase redirection to the child', () => {
    test('createTextValueAdapter passes arguments to the child and returns its result', () => {
        let { testItem, input, jivsElement, valueHost } = setup();

        let result = testItem.createTextValueAdapter(valueHost, input, jivsElement);

        expect(result).toBe(testItem.child.textAdapterResult);
        expect(testItem.child.textAdapterCalls).toEqual([{ valueHost, editor: input, jivsElement }]);
    });

    test('createTextValueAdapter returns null when the child does', () => {
        let { testItem, input, jivsElement, valueHost } = setup();
        testItem.child.textAdapterResult = null;

        expect(testItem.createTextValueAdapter(valueHost, input, jivsElement)).toBeNull();
    });

    test('createValueAdapter passes arguments (including a null jivsElement) and returns the result', () => {
        let { testItem, input, jivsElement, valueHost } = setup();
        let adapter = { tag: 'value' } as unknown as IValueAdapter;
        testItem.child.valueAdapterResult = adapter;

        expect(testItem.createValueAdapter(valueHost, input, jivsElement)).toBe(adapter);
        expect(testItem.createValueAdapter(valueHost, input, null)).toBe(adapter);
        expect(testItem.child.valueAdapterCalls.map((c) => c.jivsElement)).toEqual([jivsElement, null]);
    });

    test('attachToSendValues passes supplied options to the child', () => {
        let { testItem, input, jivsElement, valueHost } = setup();
        let options = { duringEdit: true };

        testItem.attachToSendValues(valueHost, input, jivsElement, options);

        expect(testItem.child.attachCalls.length).toBe(1);
        expect(testItem.child.attachCalls[0].options).toBe(options);
        expect(testItem.child.attachCalls[0].editor).toBe(input);
        expect(testItem.child.attachCalls[0].jivsElement).toBe(jivsElement);
    });

    test('attachToSendValues supplies empty options when omitted, and does not log itself', () => {
        let { testItem, logger, input, jivsElement, valueHost } = setup();

        testItem.attachToSendValues(valueHost, input, jivsElement);

        expect(testItem.child.attachCalls[0].options).toEqual({});
        expect(logger.calls).toEqual([]);
    });

    test('sendValue passes arguments to the child', () => {
        let { testItem, input, jivsElement, valueHost } = setup();

        testItem.sendValue(valueHost, input, jivsElement,  { duringEdit: true, validate: false });

        expect(testItem.child.sendValueCalls).toMatchObject([
            { valueHost, editor: input, jivsElement, options: { duringEdit: true, validate: false } }]);
    });

    test('sendValue forwards omitted options to the child unchanged, leaving defaults to the child', () => {
        let { testItem, input, jivsElement, valueHost } = setup();

        testItem.sendValue(valueHost, input, jivsElement);

        expect(testItem.child.sendValueCalls.length).toBe(1);
        expect(testItem.child.sendValueCalls[0].options).toBeUndefined();
    });

    test('attachToSendValuesCore does nothing', () => {
        let { testItem, logger, input, jivsElement, valueHost } = setup();

        testItem.publicify_attachToSendValuesCore(valueHost, input, jivsElement, {});

        expect(testItem.child.attachCalls).toEqual([]);
        expect(logger.calls).toEqual([]);
    });

    test('attachEventHandler adds the listener to the descendant editor, not the wrapper', () => {
        let { testItem, wrapper, input, jivsElement, valueHost } = setup();
        let received: string[] = [];

        testItem.attachEventHandler(jivsElement, valueHost, 'click', (e) => received.push(e.type));
        wrapper.dispatchEvent(new Event('click'));
        expect(received).toEqual([]);
        input.dispatchEvent(new Event('click'));

        expect(received).toEqual(['click']);
    });
});

// Integration: a real InputAdapterDefinition as the child, with a real FieldValueHost.
describe('WrappedEditorAdapterDefinitionBase integration with real child definition', () => {
    function createRealSetup()
    {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new RealChildWrappedDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: services,
            loggingFacade: new DomLoggingFacade(services)
        });
        let { wrapper, input } = createWrapper();
        return { testItem, host, wrapper, input, jivsElement: wrapper as unknown as IJivsElement };
    }

    test('matches depends on the real child accepting the descendant input', () => {
        let { testItem, host, wrapper, input } = createRealSetup();

        expect(testItem.matches(host, wrapper)).toBe(true);
        input.type = 'password';
        expect(testItem.matches(host, wrapper)).toBe(false);
    });

    test('Adapters read the descendant input and change events update the real FieldValueHost', () => {
        let { testItem, host, wrapper, input, jivsElement } = createRealSetup();
        let editor = testItem.identifyEditor(host, jivsElement);
        jivsElement.jivsTextValueAdapter = testItem.createTextValueAdapter(host, editor, jivsElement)!;

        testItem.attachToSendValues(host, editor, jivsElement);
        input.value = 'typed';
        wrapper.dispatchEvent(new Event('change'));
        expect(host.getTextValue()).toBeUndefined();
        input.dispatchEvent(new Event('change'));

        expect(editor).toBe(input);
        expect(host.getTextValue()).toBe('typed');
        expect(testItem.createValueAdapter(host, editor, jivsElement)).toBeNull();
    });
});

// Additional edge cases around element resolution, caching, errors and logging.
describe('WrappedEditorAdapterDefinitionBase additional cases', () => {
    test('Text-only wrapper has no child elements and is rejected', () => {
        let { testItem, valueHost } = setup();
        let wrapper = document.createElement('div');
        wrapper.textContent = 'just text';

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
        expect(testItem.findCalls).toEqual([]);
    });

    test('Finds a deeply nested editor', () => {
        let { testItem, valueHost } = setup();
        let wrapper = document.createElement('div');
        wrapper.className = 'wrapped';
        let inner = document.createElement('span');
        let deeper = document.createElement('p');
        let input = document.createElement('input');
        input.className = 'editor';
        deeper.appendChild(input);
        inner.appendChild(deeper);
        wrapper.appendChild(inner);

        expect(testItem.matches(valueHost, wrapper)).toBe(true);
        expect(testItem.identifyEditor(valueHost, wrapper as unknown as IJivsElement)).toBe(input);
    });

    test('With several candidate editors, the first in document order is used', () => {
        let { testItem, wrapper, input, jivsElement, valueHost } = setup();
        let second = document.createElement('input');
        second.className = 'editor';
        wrapper.appendChild(second);

        expect(testItem.identifyEditor(valueHost, jivsElement)).toBe(input);
        expect(testItem.child.matchesCalls.length).toBe(0);
        testItem.matches(valueHost, wrapper);
        expect(testItem.child.matchesCalls).toEqual([input]);
    });

    test('The wrapper itself is never returned as the editor, even if it matches editorSelector', () => {
        let { testItem, valueHost } = setup();
        testItem.selector = 'div.wrapped';
        let wrapper = document.createElement('div');
        wrapper.className = 'wrapped';
        wrapper.appendChild(document.createElement('span'));

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
    });

    test('A comma-separated wrapperSelector matches any of its alternatives', () => {
        let { wrapper, valueHost } = setup();
        let testItem = setup(new Publicify_WrappedDefinition('section.a, div.wrapped')).testItem;

        expect(testItem.matches(valueHost, wrapper)).toBe(true);
    });

    test('editorSelector is read on each call, not cached', () => {
        let { testItem, wrapper, valueHost } = setup();
        expect(testItem.matches(valueHost, wrapper)).toBe(true);

        testItem.selector = 'input.other';

        expect(testItem.matches(valueHost, wrapper)).toBe(false);
    });

    test('identifyEditor logs the valueHost element identifier when the wrapper has no id', () => {
        let { testItem, logger, valueHost } = setup();
        let empty = document.createElement('div');

        expect(() => testItem.identifyEditor(valueHost, empty as unknown as IJivsElement)).toThrow();
        expect((logger.calls[0].details as any).data).toEqual({ idAttribute: 'fieldId', valueHostName: 'Field1' });
    });

    test('identifyEditor on the wrapper does not log when the editor is found', () => {
        let { testItem, logger, jivsElement, valueHost } = setup();

        testItem.identifyEditor(valueHost, jivsElement);

        expect(logger.calls).toEqual([]);
    });

    test('An exception from the child matches propagates', () => {
        let { testItem, wrapper, valueHost } = setup();
        testItem.child.matches = () => { throw new Error('child failed'); };

        expect(() => testItem.matches(valueHost, wrapper)).toThrow('child failed');
    });

    test('Exceptions from the child adapter creation and attach propagate', () => {
        let { testItem, input, jivsElement, valueHost } = setup();
        testItem.child.createTextValueAdapter = () => { throw new Error('text failed'); };
        testItem.child.createValueAdapter = () => { throw new Error('value failed'); };
        testItem.child.attachToSendValues = () => { throw new Error('attach failed'); };

        expect(() => testItem.createTextValueAdapter(valueHost, input, jivsElement)).toThrow('text failed');
        expect(() => testItem.createValueAdapter(valueHost, input, jivsElement)).toThrow('value failed');
        expect(() => testItem.attachToSendValues(valueHost, input, jivsElement)).toThrow('attach failed');
    });

    test('A null options argument is replaced with empty options', () => {
        let { testItem, input, jivsElement, valueHost } = setup();

        testItem.attachToSendValues(valueHost, input, jivsElement, null as unknown as undefined);

        expect(testItem.child.attachCalls[0].options).toEqual({});
    });

    test('The child keeps the domServices it was given at creation even if the wrapper is reassigned later', () => {
        let { testItem, domServices } = setup();
        let child = testItem.publicify_childEditorDefinitionAdapter;
        let newServices = createMockJivsDomServices();

        testItem.domServices = newServices;

        expect(testItem.publicify_childEditorDefinitionAdapter).toBe(child);
        expect(testItem.child.domServices).toBe(domServices);
    });

    test('matches creates the child lazily, only when a descendant editor is found', () => {
        let { testItem, wrapper, valueHost } = setup();
        testItem.selector = 'textarea';
        testItem.matches(valueHost, wrapper);
        expect(testItem.createChildCount).toBe(0);

        testItem.selector = 'input.editor';
        testItem.matches(valueHost, wrapper);
        expect(testItem.createChildCount).toBe(1);
    });
});

// Integration with the real child and real logging facade.
describe('WrappedEditorAdapterDefinitionBase additional integration', () => {
    test('Missing editor logs through the real DomLoggingFacade with substituted tokens', () => {
        let services = createJivsServicesForTesting();
        let logger = new RecordingLoggingService();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new RealChildWrappedDefinition();
        testItem.domServices = createMockJivsDomServices({
            services: { loggingService: logger } as unknown as IJivsServices
        });
        let wrapper = document.createElement('div');
        wrapper.id = 'w1';

        expect(() => testItem.identifyEditor(host, wrapper as unknown as IJivsElement)).toThrow();

        expect(logger.calls.length).toBe(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect((logger.calls[0].details as any).data).toEqual({ idAttribute: 'w1', valueHostName: 'Field1' });
    });

    test('Real child rejects a wrapper whose descendant is a textarea', () => {
        let services = createJivsServicesForTesting();
        let host = new ValueHostsManager({
            services: services,
            valueHostConfigs: [<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field, name: 'Field1', dataType: LookupKey.String
            }]
        }).getFieldValueHost('Field1')!;
        let testItem = new RealChildWrappedDefinition();
        testItem.domServices = createMockJivsDomServices({ services: services });
        let wrapper = document.createElement('div');
        wrapper.className = 'wrapped';
        wrapper.appendChild(document.createElement('textarea'));

        expect(testItem.matches(host, wrapper)).toBe(false);
    });
});
