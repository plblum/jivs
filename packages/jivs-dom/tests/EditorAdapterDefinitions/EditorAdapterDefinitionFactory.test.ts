/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { EditorAdapterDefinitionFactory } from '../../src/EditorAdapterDefinitions/EditorAdapterDefinitionFactory';
import { InputAdapterDefinition } from '../../src/EditorAdapterDefinitions/InputAdapterDefinition';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost } from '../TestSupport/mocks';

/**
 * Input definition fake that records match order and returns a configurable result.
 */
class RecordingDefinition extends InputAdapterDefinition
{
    constructor(
        adapterKey: string,
        priority: number,
        private readonly matchOrder: string[],
        public matchesResult: boolean = false
    )
    {
        super('text', adapterKey, priority);
    }

    public override matches(_valueHost: IFieldValueHost, _candidateElement: HTMLElement): boolean
    {
        this.matchOrder.push(this.adapterKey);
        return this.matchesResult;
    }
}

function createFactory()
{
    let domServices = createMockJivsDomServices();
    let testItem = new EditorAdapterDefinitionFactory(domServices);
    return { testItem, domServices };
}

function disableDefaultRegistrations(testItem: EditorAdapterDefinitionFactory): void
{
    testItem.lazyRegistration(() => undefined);
}

// Construction requires a DOM services instance inherited from DomServiceBase.
describe('EditorAdapterDefinitionFactory constructor', () => {
    test('Rejects a null domServices dependency', () => {
        expect(() => new EditorAdapterDefinitionFactory(null!)).toThrow(/domServices/);
    });
});

// The default definitions are registered on first use and remain available by key.
describe('EditorAdapterDefinitionFactory default registrations', () => {
    test('First lookup registers standard native and wrapped definitions', () => {
        let { testItem, domServices } = createFactory();

        expect(testItem.getDefinition('input:text')).not.toBeNull();
        expect(testItem.getDefinition('textarea')).not.toBeNull();
        expect(testItem.getDefinition('select')).not.toBeNull();
        expect(testItem.getDefinition('input:checkbox')).not.toBeNull();
        expect(testItem.getDefinition('input:radio')).not.toBeNull();
        expect(testItem.getDefinition('input:file')).not.toBeNull();
        expect(testItem.getDefinition('wrapped:input:text')).not.toBeNull();
        expect(testItem.getDefinition('wrapped:textarea')).not.toBeNull();
        expect(testItem.getDefinition('wrapped:select')).not.toBeNull();

        let textDefinition = testItem.getDefinition('input:text');
        expect(testItem.getDefinition('input:text')).toBe(textDefinition);
        expect(textDefinition!.domServices).toBe(domServices);
    });
});

// Lazy registration lets callers configure definitions before the factory is first used.
describe('EditorAdapterDefinitionFactory.lazyRegistration', () => {
    test('Defers registration until access and runs the callback only once', () => {
        let { testItem, domServices } = createFactory();
        let registrationCalls = 0;
        let definition = new RecordingDefinition('custom', 10, []);
        testItem.lazyRegistration(factory => {
            registrationCalls++;
            factory.register(definition);
        });

        expect(registrationCalls).toBe(0);
        expect(testItem.getDefinition('custom')).toBe(definition);
        expect(registrationCalls).toBe(1);
        expect(definition.domServices).toBe(domServices);
        expect(testItem.getDefinition('missing')).toBeNull();
        expect(registrationCalls).toBe(1);
    });

    test('Allows the lazy callback to register multiple definitions', () => {
        let { testItem, domServices } = createFactory();
        let definition1 = new RecordingDefinition('first', 10, []);
        let definition2 = new RecordingDefinition('second', 20, []);
        testItem.lazyRegistration(factory => {
            factory.register(definition1);
            factory.register(definition2);
        });

        expect(testItem.getDefinition('first')).toBe(definition1);
        expect(testItem.getDefinition('second')).toBe(definition2);
        expect(definition1.domServices).toBe(domServices);
        expect(definition2.domServices).toBe(domServices);
    });
});

// Explicit lookup uses the exact key and replacement takes effect for future lookups.
describe('EditorAdapterDefinitionFactory.register and getDefinition', () => {
    test('Returns null for an unknown key and returns a registered definition by exact key', () => {
        let { testItem, domServices } = createFactory();
        disableDefaultRegistrations(testItem);
        let definition = new RecordingDefinition('custom', 10, []);
        testItem.register(definition);

        expect(testItem.getDefinition('Custom')).toBeNull();
        expect(testItem.getDefinition('custom')).toBe(definition);
        expect(definition.domServices).toBe(domServices);
    });

    test('Registering the same key replaces the definition', () => {
        let { testItem, domServices } = createFactory();
        disableDefaultRegistrations(testItem);
        let firstDefinition = new RecordingDefinition('custom', 10, []);
        let replacementDefinition = new RecordingDefinition('custom', 90, []);
        testItem.register(firstDefinition);
        testItem.register(replacementDefinition);

        expect(testItem.getDefinition('custom')).toBe(replacementDefinition);
        expect(replacementDefinition.domServices).toBe(domServices);
    });
});

// Automatic selection sorts by descending priority and preserves registration order for ties.
describe('EditorAdapterDefinitionFactory.findDefinition', () => {
    test('Checks higher priorities first and preserves registration order for equal priorities', () => {
        let { testItem } = createFactory();
        disableDefaultRegistrations(testItem);
        let matchOrder: string[] = [];
        let lowerPriority = new RecordingDefinition('lower', -1, matchOrder, true);
        let tiedFirst = new RecordingDefinition('tiedFirst', 100, matchOrder);
        let tiedSecond = new RecordingDefinition('tiedSecond', 100, matchOrder, true);
        let outsideNormalRange = new RecordingDefinition('outsideRange', 101, matchOrder);
        testItem.register(lowerPriority);
        testItem.register(tiedFirst);
        testItem.register(tiedSecond);
        testItem.register(outsideNormalRange);

        let result = testItem.findDefinition(
            createStubFieldValueHost('Field1', 'fieldId'),
            document.createElement('input')
        );

        expect(result).toBe(tiedSecond);
        expect(matchOrder).toEqual(['outsideRange', 'tiedFirst', 'tiedSecond']);
    });

    test('Stops after the first match and returns null when no definition matches', () => {
        let { testItem } = createFactory();
        disableDefaultRegistrations(testItem);
        let matchOrder: string[] = [];
        let first = new RecordingDefinition('first', 20, matchOrder, true);
        let second = new RecordingDefinition('second', 10, matchOrder, true);
        testItem.register(first);
        testItem.register(second);
        let valueHost = createStubFieldValueHost('Field1', 'fieldId');
        let element = document.createElement('input');

        expect(testItem.findDefinition(valueHost, element)).toBe(first);
        expect(matchOrder).toEqual(['first']);

        matchOrder.length = 0;
        first.matchesResult = false;
        second.matchesResult = false;
        expect(testItem.findDefinition(valueHost, element)).toBeNull();
        expect(matchOrder).toEqual(['first', 'second']);
    });

    test('Uses newly registered definitions after a search has populated the priority cache', () => {
        let { testItem } = createFactory();
        disableDefaultRegistrations(testItem);
        let matchOrder: string[] = [];
        let initialDefinition = new RecordingDefinition('initial', 10, matchOrder, true);
        testItem.register(initialDefinition);
        let valueHost = createStubFieldValueHost('Field1', 'fieldId');
        let element = document.createElement('input');

        expect(testItem.findDefinition(valueHost, element)).toBe(initialDefinition);

        matchOrder.length = 0;
        let newlyRegisteredDefinition = new RecordingDefinition('new', 20, matchOrder, true);
        testItem.register(newlyRegisteredDefinition);

        expect(testItem.findDefinition(valueHost, element)).toBe(newlyRegisteredDefinition);
        expect(matchOrder).toEqual(['new']);
    });

    test('Replacement is used by automatic selection after the priority cache was populated', () => {
        let { testItem } = createFactory();
        disableDefaultRegistrations(testItem);
        let matchOrder: string[] = [];
        let original = new RecordingDefinition('sameKey', 10, matchOrder, true);
        testItem.register(original);
        let valueHost = createStubFieldValueHost('Field1', 'fieldId');
        let element = document.createElement('input');

        expect(testItem.findDefinition(valueHost, element)).toBe(original);
        matchOrder.length = 0;

        let replacement = new RecordingDefinition('sameKey', 20, matchOrder, true);
        testItem.register(replacement);

        expect(testItem.findDefinition(valueHost, element)).toBe(replacement);
        expect(matchOrder).toEqual(['sameKey']);
    });
});
